#!/usr/bin/env python3
"""
Find wrong options that are not wrong: every option the pick screens can offer for a line of a
solution (src/lib/choices.ts) is put in that line's place and the solution is run against the
original on the problem's examples plus random inputs. An option that gives the same answer (and
leaves the same arguments) on every input "survives": it is code that works, so the app must never
mark it wrong. Survivors go into src/content/distractorDeny.ts, which lineChoices, gapChoices,
arrangeBlocks and Key lines skip.

Rerun it after changing a solution, adding a problem, or changing the distractor rules
(src/lib/choices.ts), from the repository root:

    python3 scripts/check-distractors.py              # check every problem, rewrite the deny list
    python3 scripts/check-distractors.py two-sum ...  # check some problems, print only
    python3 scripts/check-distractors.py --log out.txt  # also write every survivor to a file

It needs python3 and `npx tsx` (scripts/check-distractors.ts lists the options). It takes a few
minutes, three problems at a time, each in its own process (a problem gets 5 minutes at most). Then
run `npm run validate`.

Limits: only problems with a `class Solution` method whose arguments it can generate (ints, floats,
bools, strings, lists of those, grids, linked lists, binary trees) are run; design problems (a class
with several methods) and a few others are left to the static rules in choices.ts, and so is a
problem where most options survive (its random inputs never reach what the code is for). Random
inputs are built from the shape and values of the examples (often an example grid with a cell or two
changed, a second string that is a shuffle of the first, a target that is a sum of two items), so a
narrow generator can make an option "survive" that a rarer input would catch: that only removes an
option, and when unsure we deny. For problems whose answer may come "in any order", outputs are
compared with every list sorted. Survivors are kept per solution (`contextKey`), so a line that
works one way in one problem keeps its options everywhere else. A line whose code is in its solution
more than once (`return True` in two places) gets its own entry, `lineKey@index`: what runs the same
in one place can be wrong in the other. A screen that knows which of the two it asks uses that
entry; one that does not, all of them.
"""
import ast
import bisect
import collections
import copy
import functools
import heapq
import itertools
import json
import math
import os
import random
import re
import resource
import shutil
import signal
import string
import subprocess
import sys
import time
from typing import Dict, List, Optional, Set, Tuple

sys.setrecursionlimit(4000)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DENY_FILE = os.path.join(ROOT, 'src', 'content', 'distractorDeny.ts')
N_INPUTS = 200


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


class Node:
    def __init__(self, val=0, neighbors=None, next=None, random=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []
        self.next = next
        self.random = random


def to_list(h):
    out, seen = [], set()
    while h is not None and id(h) not in seen and len(out) < 200:
        seen.add(id(h))
        out.append(h.val)
        h = h.next
    return out


def mk_list(vals):
    d = ListNode()
    t = d
    for v in vals:
        t.next = ListNode(v)
        t = t.next
    return d.next


def mk_tree(vals):
    if not vals or vals[0] is None:
        return None
    it = iter(vals)
    root = TreeNode(next(it))
    q = collections.deque([root])
    while q:
        n = q.popleft()
        try:
            a = next(it)
            if a is not None:
                n.left = TreeNode(a)
                q.append(n.left)
            b = next(it)
            if b is not None:
                n.right = TreeNode(b)
                q.append(n.right)
        except StopIteration:
            break
    return root


def ser(x, depth=0, any_order=False):
    """A comparable form of a result (lists sorted at every level when the order does not matter)."""
    if depth > 50:
        return '...'
    if isinstance(x, ListNode):
        return ('L', tuple(to_list(x)))
    if isinstance(x, TreeNode):
        out, q, n = [], collections.deque([x]), 0
        while q and n < 300:
            t = q.popleft()
            n += 1
            if t is None:
                out.append(None)
                continue
            out.append(t.val)
            q.append(t.left)
            q.append(t.right)
        while out and out[-1] is None:
            out.pop()
        return ('T', tuple(out))
    if isinstance(x, Node):
        return ('N', x.val)
    if isinstance(x, (list, tuple)):
        items = [ser(y, depth + 1, any_order) for y in x]
        if any_order:
            items.sort(key=repr)
        return (type(x).__name__, tuple(items))
    if isinstance(x, dict):
        return ('d', tuple(sorted((repr(k), ser(v, depth + 1, any_order)) for k, v in x.items())))
    if isinstance(x, set):
        return ('s', tuple(sorted(repr(y) for y in x)))
    if isinstance(x, float):
        return round(x, 6)
    return x


def split_assigns(s):
    """'a = 1, b = [1, 2]' -> {'a': '1', 'b': '[1, 2]'}"""
    parts, depth, q, cur, i = [], 0, None, '', 0
    while i < len(s):
        ch = s[i]
        if q:
            cur += ch
            if ch == '\\':
                cur += s[i + 1]
                i += 1
            elif ch == q:
                q = None
        elif ch in '"\'':
            q = ch
            cur += ch
        elif ch in '([{':
            depth += 1
            cur += ch
        elif ch in ')]}':
            depth -= 1
            cur += ch
        elif ch == ',' and depth == 0 and re.match(r'\s*[A-Za-z_]\w*\s*=(?!=)', s[i + 1:]):
            parts.append(cur)
            cur = ''
        else:
            cur += ch
        i += 1
    parts.append(cur)
    out = {}
    for p in parts:
        m = re.match(r'\s*([A-Za-z_]\w*)\s*=(?!=)\s*(.*)$', p, re.S)
        if not m:
            return None
        out[m.group(1)] = m.group(2).strip()
    return out


def parse_val(v):
    v = v.replace('null', 'None').replace('true', 'True').replace('false', 'False')
    v = re.sub(r'\bINF\b', '2147483647', v)
    try:
        return eval(v, {})
    except Exception:
        return None


class Timeout(BaseException):
    """Not an Exception, so an option's own `except Exception` cannot swallow it."""


def _alarm(*_):
    raise Timeout()


def call(fn, args, t):
    # Repeats until cancelled, in case one alarm lands where the option catches everything.
    signal.setitimer(signal.ITIMER_REAL, t, 0.05)
    try:
        return ('ok', fn(*args))
    except Timeout:
        return ('timeout', None)
    except RecursionError:
        return ('exc', 'RecursionError')
    except Exception as e:
        return ('exc', type(e).__name__)
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)


def namespace():
    return dict(ListNode=ListNode, TreeNode=TreeNode, Node=Node, List=List, Optional=Optional, Dict=Dict, Set=Set,
                Tuple=Tuple, collections=collections, heapq=heapq, math=math, deque=collections.deque,
                defaultdict=collections.defaultdict, Counter=collections.Counter, functools=functools, bisect=bisect,
                itertools=itertools, cache=functools.cache, lru_cache=functools.lru_cache, string=string, __name__='m')


def load(code):
    ns = namespace()
    exec(compile(code, 'solution', 'exec'), ns)
    return ns


def gen_value(ann, exs, rnd):
    """A random argument shaped like the examples' values for this parameter."""
    a = ann.replace(' ', '').strip("'")
    flat_ints = [x for e in exs for x in (e if isinstance(e, list) else [e]) if isinstance(x, int) and not isinstance(x, bool)]
    if a == 'int':
        lo = min(exs + [0]) if exs else 0
        hi = max(exs + [5]) if exs else 6
        return rnd.randint(min(lo, 0) if lo < 0 else max(0, lo - 1), hi + 2)
    if a == 'float':
        return rnd.choice([0.5, 1.0, 2.0, 3.0, -2.0, 1.5])
    if a == 'bool':
        return rnd.random() < 0.5
    if a == 'List[int]':
        lo = min(flat_ints) if flat_ints else -3
        hi = max(flat_ints) if flat_ints else 6
        lo = max(lo - 1, -5) if lo < 0 else max(0, lo - 1)
        hi = min(hi + 1, max(12, lo + 3))
        if hi - lo > 30:
            hi = lo + 30
        mx = max([len(e) for e in exs] + [4])
        mn = 1 if exs and all(len(e) > 0 for e in exs) else 0
        vals = [rnd.randint(lo, hi) for _ in range(rnd.randint(mn, mx + 2))]
        is_sorted = exs and all(e == sorted(e) for e in exs) and any(len(e) > 2 for e in exs)
        if is_sorted:
            vals.sort()
        if exs and all(len(set(e)) == len(e) for e in exs) and any(len(e) > 3 for e in exs) and rnd.random() < 0.7:
            vals = list(dict.fromkeys(vals))
            if is_sorted:
                vals.sort()
        return vals
    if a == 'str':
        chars = sorted({c for e in exs if isinstance(e, str) for c in e}) or list('abc')
        if len(chars) > 6 and rnd.random() < 0.5:
            chars = rnd.sample(chars, 6)
        mx = max([len(e) for e in exs if isinstance(e, str)] + [4])
        mn = 1 if exs and all(len(e) > 0 for e in exs if isinstance(e, str)) else 0
        return ''.join(rnd.choice(chars) for _ in range(rnd.randint(mn, mx + 1)))
    if a == 'List[str]':
        words = [w for e in exs if isinstance(e, list) for w in e if isinstance(w, str)] or ['ab', 'ba', 'c']
        chars = sorted({c for w in words for c in w}) or list('ab')
        longest = max(len(w) for w in words) if words else 2
        n = rnd.randint(1, max(3, max(len(e) for e in exs if isinstance(e, list)) + 1) if exs else 4)
        return [rnd.choice(words) if rnd.random() < 0.5 else ''.join(rnd.choice(chars) for _ in range(rnd.randint(1, longest))) for _ in range(n)]
    if a in ('List[List[int]]', 'List[List[str]]'):
        ex = [e for e in exs if isinstance(e, list) and e and all(isinstance(r, list) for r in e)]
        if ex:
            e = rnd.choice(ex)
            vals = sorted({x for e2 in ex for r in e2 for x in r}, key=repr)
            if rnd.random() < 0.6:
                # An example grid with a cell or two changed: a board, a map, a matrix that still
                # looks like the problem's (a random one is rarely a valid Sudoku or has a gate).
                g = copy.deepcopy(e)
                for _ in range(rnd.randint(0, 2)):
                    row = rnd.choice(g)
                    if row:
                        row[rnd.randrange(len(row))] = rnd.choice(vals)
                return g
            widths = {len(r) for r in e}
            if len(widths) == 1 and len(e) > 1 and (list(widths)[0] > 2 or a.endswith('[str]]') or len(e) == list(widths)[0]):
                rows = rnd.randint(1, len(e) + 1)
                cols = rnd.randint(1, list(widths)[0] + 1)
                if len(e) == list(widths)[0] and rnd.random() < 0.7:
                    cols = rows
                if a == 'List[List[int]]' and vals and all(isinstance(v, int) for v in vals):
                    return [[rnd.randint(min(vals), max(vals)) for _ in range(cols)] for _ in range(rows)]
                return [[rnd.choice(vals) for _ in range(cols)] for _ in range(rows)]
            # Pairs, intervals, edges.
            w = list(widths)[0] if len(widths) == 1 else 2
            ints = [x for r in e for x in r if isinstance(x, int)]
            lo, hi = (min(ints), max(ints)) if ints else (0, 5)
            out = []
            for _ in range(rnd.randint(0 if any(len(e2) == 0 for e2 in ex) else 1, len(e) + 2)):
                r = [rnd.randint(lo, hi + 1) for _ in range(w)]
                if w == 2 and all(r2 == sorted(r2) for e2 in ex for r2 in e2):
                    r.sort()
                out.append(r)
            return out
        return [[rnd.randint(0, 3) for _ in range(3)] for _ in range(3)]
    if 'ListNode' in a and 'List[' not in a:
        flat = [x for e in exs if isinstance(e, list) for x in e]
        lo, hi = (min(flat), max(flat)) if flat else (0, 6)
        vals = [rnd.randint(lo, hi) for _ in range(rnd.randint(0, 7))]
        if exs and all(isinstance(e, list) and e == sorted(e) for e in exs):
            vals.sort()
        return mk_list(vals)
    if 'List[Optional[ListNode]]' in a:
        return [mk_list(sorted(rnd.randint(0, 9) for _ in range(rnd.randint(0, 4)))) for _ in range(rnd.randint(0, 4))]
    if 'TreeNode' in a:
        flat = [x for e in exs if isinstance(e, list) for x in e if isinstance(x, int)]
        lo, hi = (min(flat), max(flat)) if flat else (0, 9)
        vals = [rnd.randint(lo, hi) if rnd.random() < 0.8 else None for _ in range(rnd.randint(0, 9))]
        if vals and vals[0] is None:
            vals[0] = lo
        return mk_tree(vals)
    return None


def with_cycle(head, pos):
    """Link the last node of a list back to node `pos` (LeetCode's cycle examples)."""
    if head is None or pos is None or pos < 0:
        return head
    nodes, n = [], head
    while n:
        nodes.append(n)
        n = n.next
    if pos < len(nodes):
        nodes[-1].next = nodes[pos]
    return head


def relate(S, args, rnd):
    """Make random arguments relate the way the problem's do: a second string that is often a
    shuffle of the first, a target that is often a sum of two items, a k inside the list, a cycle."""
    names = [name for name, _ in S['params']]
    anns = [ann.replace(' ', '') for _, ann in S['params']]
    strs = [k for k, a in enumerate(anns) if a == 'str']
    if len(strs) >= 2 and rnd.random() < 0.5:
        s = list(args[strs[0]])
        rnd.shuffle(s)
        if s and rnd.random() < 0.3:
            s[rnd.randrange(len(s))] = rnd.choice(args[strs[0]] or 'ab')
        args[strs[1]] = ''.join(s)
    lists = [k for k, a in enumerate(anns) if a == 'List[int]']
    for k, (name, a) in enumerate(zip(names, anns)):
        if a != 'int' or not lists or rnd.random() < 0.5:
            continue
        xs = args[lists[0]]
        if name in ('target', 'goal') and len(xs) >= 2:
            i, j = rnd.sample(range(len(xs)), 2)
            args[k] = xs[i] + xs[j]
        elif name == 'k' and xs:
            args[k] = rnd.randint(1, len(xs))
    if S.get('cycle'):
        for k, a in enumerate(anns):
            if 'ListNode' in a and 'List[' not in a and rnd.random() < 0.5:
                n, h = 0, args[k]
                while h:
                    n += 1
                    h = h.next
                if n:
                    args[k] = with_cycle(args[k], rnd.randrange(n))
    return args


def convert(ann, v):
    a = ann.replace(' ', '').strip("'")
    if 'ListNode' in a and 'List[' not in a and isinstance(v, list):
        return mk_list(v)
    if 'TreeNode' in a and isinstance(v, list):
        return mk_tree(v)
    return v


SUPPORTED = {'int', 'float', 'bool', 'List[int]', 'str', 'List[str]', 'List[List[int]]', 'List[List[str]]',
             'Optional[ListNode]', 'Optional[TreeNode]', 'TreeNode', "'TreeNode'", 'List[Optional[ListNode]]'}


def setup(p):
    """The method to call, its parameters and the examples' values, or a reason it cannot be run."""
    tree = ast.parse(p['code'])
    cls = [n for n in tree.body if isinstance(n, ast.ClassDef) and n.name == 'Solution']
    if not cls:
        return None, 'no Solution class (a design problem)'
    meths = [n for n in cls[0].body if isinstance(n, ast.FunctionDef) and not n.name.startswith('_')]
    m = meths[0]
    params = [(a.arg, ast.unparse(a.annotation) if a.annotation else '') for a in m.args.args[1:]]
    for _, ann in params:
        if ann.replace(' ', '') not in {s.replace(' ', '') for s in SUPPORTED}:
            return None, f'unsupported argument type {ann}'
    exvals, exin, cycle = collections.defaultdict(list), [], False
    for ex in p['examples']:
        d = split_assigns(ex['input'])
        if not d:
            continue
        vals = {k: parse_val(v) for k, v in d.items()}
        if any(v is None and d[k] not in ('None', 'null', '[]') for k, v in vals.items()):
            continue
        if set(vals) >= {name for name, _ in params}:
            # A `pos` the method does not take: the list has a cycle (Linked List Cycle).
            cycle = cycle or ('pos' in vals and 'pos' not in {name for name, _ in params})
            exin.append(([vals[name] for name, _ in params], vals.get('pos')))
            for name, _ in params:
                exvals[name].append(vals[name])
    return dict(code=p['code'], method=m.name, params=params, exvals=exvals, exin=exin, cycle=cycle, any_order=p['anyOrder']), None


def make_inputs(S, seed=1):
    rnd = random.Random(seed)
    ns = load(S['code'])
    inputs = []
    for e, pos in S['exin']:
        args = [convert(ann, copy.deepcopy(v)) for (_, ann), v in zip(S['params'], e)]
        if S['cycle']:
            args = [with_cycle(a, pos) if isinstance(a, ListNode) else a for a in args]
        inputs.append(args)
    tries = 0
    while len(inputs) < N_INPUTS and tries < N_INPUTS * 6:
        tries += 1
        inputs.append(relate(S, [gen_value(ann, S['exvals'].get(name, []), rnd) for name, ann in S['params']], rnd))
    good, outs, slowest, total = [], [], 0.0, 0.0
    for args in inputs:
        a = copy.deepcopy(args)
        t0 = time.perf_counter()
        st, r = call(getattr(ns['Solution'](), S['method']), a, 1.0)
        if st != 'ok':
            continue  # an input the problem does not allow (the answer fails or loops on it)
        slowest = max(slowest, time.perf_counter() - t0)
        total += time.perf_counter() - t0
        good.append(args)
        outs.append(ser((r, a), any_order=S['any_order']))
    return good, outs, slowest, total


def run_option(S, code, good, outs, limit, budget):
    try:
        ns = load(code)
    except Exception as e:
        return 'load ' + type(e).__name__
    t0 = time.perf_counter()
    for args, want in zip(good, outs):
        # Much slower than the answer but right so far: as good as right (when unsure, deny).
        if time.perf_counter() - t0 > budget:
            return 'SURVIVED slow'
        a = copy.deepcopy(args)
        try:
            obj = ns['Solution']()
        except Exception as e:
            return 'init ' + type(e).__name__
        st, r = call(getattr(obj, S['method']), a, limit)
        if st != 'ok':
            return st
        try:
            got = ser((r, a), any_order=S['any_order'])
        except Exception:
            return 'diff'
        if got != want:
            return 'diff'
    return 'SURVIVED'


def worker_init():
    # An option that builds a huge list fails with MemoryError instead of taking the machine down.
    resource.setrlimit(resource.RLIMIT_AS, (1536 * 1024 * 1024, resource.RLIM_INFINITY))
    signal.signal(signal.SIGALRM, _alarm)


def check(p):
    """Run every option of one problem. Returns (id, survivors, stats, why-skipped)."""
    signal.signal(signal.SIGALRM, _alarm)
    S, why = setup(p)
    if not S:
        return p['id'], [], {}, why
    good, outs, slowest, total = make_inputs(S)
    if len(good) < 20:
        return p['id'], [], {}, f'only {len(good)} valid inputs'
    limit = min(max(0.1, 20 * slowest), 1.0)
    budget = min(max(1.5, 30 * total), 5.0)
    lines = S['code'].split('\n')
    survivors, stats, n = [], collections.Counter(), 0
    for ln in p['lines']:
        i = ln['i']
        for w in ln['wrong']:
            code = '\n'.join(lines[:i] + [w['text']] + lines[i + 1:])
            try:
                v = run_option(S, code, good, outs, limit, budget)
            except Timeout:
                v = 'timeout'
            finally:
                signal.setitimer(signal.ITIMER_REAL, 0)
            stats[v.split()[0]] += 1
            n += 1
            if v.startswith('SURVIVED'):
                survivors.append(dict(line=i, answer=ln['answer'], key=ln['key'], wrong=w['text'], wrongKey=w['key'], slow=v != 'SURVIVED'))
    # Most options "working" means the inputs never reach what the code is for (a random board that is
    # never a valid Sudoku): the run says nothing, so leave the problem to the static rules.
    if n >= 20 and len(survivors) > 0.4 * n:
        return p['id'], [], {}, f'inputs too narrow ({len(survivors)} of {n} options survived)'
    return p['id'], survivors, dict(stats, inputs=len(good)), None


def write_deny(deny, names, parts):
    body = ''
    for sol in sorted(deny, key=lambda k: names[k]):
        body += f'  // {names[sol]}\n  {json.dumps(sol)}: {{\n'
        body += ''.join(f'    {json.dumps(k)}: [{", ".join(json.dumps(v) for v in sorted(vs))}],\n' for k, vs in sorted(deny[sol].items()))
        body += '  },\n'
    with open(DENY_FILE, 'w') as f:
        f.write(
            '// Generated by scripts/check-distractors.py: do not edit by hand. Rerun it after changing a solution\n'
            '// or the distractor rules (src/lib/choices.ts); see the script\'s header.\n'
            '//\n'
            '// Wrong options that turned out to run exactly like the answer in its solution, per solution: its\n'
            '// `contextKey` (a hash of its code) -> the answer line\'s `lineKey` -> the `lineKey`s of the options\n'
            '// never to offer for it (Pick the key line, Pick the gaps, Arrange a part\'s distractor, Key lines).\n'
            '// A line whose code is in its solution more than once has an entry per line: `lineKey@index`.\n'
            '\n'
            '/** Parts of two code lines that get no Arrange distractor (`problemId:chunk`): the review does not deal them as Arrange a part. */\n'
            f'export const NO_DISTRACTOR_PARTS: readonly string[] = [{", ".join(json.dumps(p) for p in parts)}];\n'
            '\n'
            'export const DISTRACTOR_DENY: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {\n'
            f'{body}'
            '};\n'
        )


PROBLEM_TIMEOUT = 300

# Valid inputs (within each problem's constraints) that reach code its examples and random inputs
# never do, so an option that is wrong there is not taken for one that works. Each says what it
# reaches; the original solution is run on it like on an example.
EXTRA_INPUTS = {
    # `return []` for an empty string (the problem's own pitfall: `[""]` is wrong).
    'letter-combinations-of-a-phone-number': ['digits = ""'],
    # The final `return 0`: endWord is in the list but cannot be reached.
    'word-ladder': ['beginWord = "hit", endWord = "cog", wordList = ["hot", "cog"]'],
    # One node and no edges: a tree, which `seen = set()` misses.
    'graph-valid-tree': ['n = 1, edges = []'],
    # Candidates not in order: `break` for `continue` skips the 2 and the 3 after the 8.
    'combination-sum': ['candidates = [8, 2, 3], target = 5'],
    # A triplet to skip before one that is needed: `break` for `continue` never sees [1, 7, 5].
    'merge-triplets-to-form-target-triplet': ['triplets = [[2, 5, 3], [1, 8, 4], [1, 7, 5]], target = [2, 7, 5]'],
    # A "z": a count of 25 letters has no place for it.
    'group-anagrams': ['strs = ["zoo", "ozo", "az"]'],
}


def run_isolated(problems):
    """Check each problem in a fresh python process (3 at a time), so a stuck option costs one problem's
    time limit, not the run. A problem that runs out of time is reported as not run."""
    import tempfile
    tmp = tempfile.mkdtemp(prefix='check-distractors-')
    queue = list(problems)
    running = {}
    results = []
    while queue or running:
        while queue and len(running) < min(3, os.cpu_count() or 1):
            p = queue.pop(0)
            src = os.path.join(tmp, p['id'] + '.json')
            with open(src, 'w') as f:
                json.dump(p, f)
            proc = subprocess.Popen([sys.executable, os.path.abspath(__file__), '--one', src, src + '.out'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            running[proc] = (p, time.time())
        for proc, (p, t0) in list(running.items()):
            if proc.poll() is None and time.time() - t0 < PROBLEM_TIMEOUT:
                continue
            if proc.poll() is None:
                proc.kill()
                proc.wait()
                r = (p['id'], [], {}, f'ran out of time ({PROBLEM_TIMEOUT}s)')
            else:
                try:
                    with open(os.path.join(tmp, p['id'] + '.json.out')) as f:
                        r = tuple(json.load(f))
                except Exception:
                    r = (p['id'], [], {}, f'failed (exit {proc.returncode})')
            del running[proc]
            results.append(r)
            print(f'  {len(results)}/{len(problems)} {r[0]}: {len(r[1])} survived' + (f' (not run: {r[3]})' if r[3] else ''), flush=True)
        time.sleep(0.05)
    shutil.rmtree(tmp, ignore_errors=True)
    return results


def main():
    args = sys.argv[1:]
    if args[:1] == ['--one']:
        worker_init()
        with open(args[1]) as f:
            r = check(json.load(f))
        with open(args[2], 'w') as f:
            json.dump(r, f)
        return
    log = None
    if '--log' in args:
        k = args.index('--log')
        log = args[k + 1]
        args = args[:k] + args[k + 2:]
    only = set(args)
    raw = subprocess.run(['npx', 'tsx', os.path.join('scripts', 'check-distractors.ts')], cwd=ROOT, check=True, capture_output=True).stdout
    problems = [p for p in json.loads(raw) if not only or p['id'] in only]
    for p in problems:
        p['examples'] = list(p['examples']) + [dict(input=x, output='') for x in EXTRA_INPUTS.get(p['id'], [])]
    total = sum(len(l['wrong']) for p in problems for l in p['lines'])
    print(f'{len(problems)} problems, {total} options to run', flush=True)
    t0 = time.time()
    results = run_isolated(problems)
    deny, skipped, stats, found = collections.defaultdict(lambda: collections.defaultdict(set)), {}, collections.Counter(), []
    key_of = {p['id']: p['key'] for p in problems}
    # Answers whose code is on more than one line of their solution: denied per line.
    twins = {p['id']: {k for k, n in collections.Counter(l['key'] for l in p['lines']).items() if n > 1} for p in problems}
    names = {p['key']: p['id'] for p in problems}
    for pid, survivors, st, why in results:
        if why:
            skipped[pid] = why
            continue
        stats.update({k: v for k, v in st.items() if k != 'inputs'})
        for s in survivors:
            deny[key_of[pid]][s['key'] + (f"@{s['line']}" if s['key'] in twins[pid] else '')].add(s['wrongKey'])
            found.append((pid, s))
    print(f'ran in {time.time() - t0:.0f}s: {dict(stats)}')
    print(f'{len(found)} options run exactly like the answer, in {len({p for p, _ in found})} problems')
    for pid, s in found:
        print(f'  {pid} line {s["line"] + 1}: {s["answer"].strip()!r} -> {s["wrong"].strip()!r}')
    print(f'not run ({len(skipped)}): ' + ', '.join(f'{k} ({v})' for k, v in sorted(skipped.items())))
    if log:
        with open(log, 'w') as f:
            json.dump(dict(survivors=[dict(id=pid, **s) for pid, s in found], skipped=skipped, stats=dict(stats)), f, indent=1)
    if only:
        print('(checked some problems only: the deny list was not rewritten)')
        return
    write_deny(deny, names, [])
    # Which two-line parts have no Arrange distractor now (it depends on the deny list just written).
    parts = json.loads(subprocess.run(['npx', 'tsx', os.path.join('scripts', 'check-distractors.ts'), '--parts'], cwd=ROOT, check=True, capture_output=True).stdout)
    write_deny(deny, names, parts)
    print(f'wrote {os.path.relpath(DENY_FILE, ROOT)}: {sum(len(v) for d in deny.values() for v in d.values())} options for {sum(len(d) for d in deny.values())} lines of {len(deny)} solutions')


if __name__ == '__main__':
    main()
