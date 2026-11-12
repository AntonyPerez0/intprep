"""
IntPrep's judge: runs a learner's Python against a problem's tests, and records a step-by-step
trace of a solution. One file for both places it runs: the browser (Pyodide, in a web worker; see
src/lib/python.ts) and python3 (scripts/judge-check.py, scripts/build-traces.py, `npm run validate`).

A problem's tests are input strings written like its examples (`nums = [3, 8, 11, 4], target = 7`,
or for a design class `LRUCache(2), put(4, 40), get(4)`): its examples, then `src/content/tests/`.
The expected answer of each is whatever the problem's own solution returns, so tests need no
outputs and cannot go stale. Every test input must be valid by the problem's constraints, because
any correct solution has to agree with ours on it.

What counts as the same answer is what LeetCode judges: the result (or, for a method that returns
nothing, its arguments afterwards); lists in any order where the problem says so (`ANY_ORDER`);
whether the answer is valid where more than one is right (`CHECKS`).

Entry points (each takes and returns JSON text):
  judge(payload)  {problem, user, mode}            -> {status, passed, total, results[...]}
  trace(payload)  {problem, input, maxSteps}       -> {lines, input, steps[...], result, truncated}
  run_snippet(payload) {code, check}               -> {ok, stdout, error}
"""
import ast
import bisect
import collections
import functools
import heapq
import io
import itertools
import json
import math
import re
import string
import sys
from typing import Any, Dict, List, Optional, Set, Tuple

USER_FILE = '<solution>'
REF_FILE = '<reference>'
# The recursion limit at start-up: restored before every run, so one learner's
# `sys.setrecursionlimit` cannot carry over into the next run (or take the interpreter down).
RECURSION_LIMIT = sys.getrecursionlimit()
_set_recursion_limit = sys.setrecursionlimit


def _capped_recursion_limit(n):
    # In the browser a recursion limit raised by a learner's code lets runaway recursion overflow
    # the real stack, which ends Python for good: the limit can be lowered, never raised.
    _set_recursion_limit(max(50, min(int(n), RECURSION_LIMIT)))


sys.setrecursionlimit = _capped_recursion_limit


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


# ── Building arguments ───────────────────────────────────────────────────────────────────────


def to_list(h, limit=200):
    out, seen = [], set()
    while h is not None and id(h) not in seen and len(out) < limit:
        seen.add(id(h))
        out.append(getattr(h, 'val', None))
        h = getattr(h, 'next', None)
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


def tree_levels(x, limit=300):
    """A tree in level order with None for a missing child, trailing Nones dropped (LeetCode's form)."""
    out, q, n = [], collections.deque([x]), 0
    while q and n < limit:
        t = q.popleft()
        n += 1
        if t is None:
            out.append(None)
            continue
        out.append(getattr(t, 'val', None))
        q.append(getattr(t, 'left', None))
        q.append(getattr(t, 'right', None))
    while out and out[-1] is None:
        out.pop()
    return out


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


def find_node(root, val):
    q = collections.deque([root])
    while q:
        t = q.popleft()
        if t is None:
            continue
        if t.val == val:
            return t
        q.append(t.left)
        q.append(t.right)
    return None


def mk_graph(adj):
    """Clone Graph's input: adj[i] lists the neighbors (1-based) of node i + 1. Returns node 1."""
    if not adj:
        return None
    nodes = [Node(i + 1) for i in range(len(adj))]
    for i, nb in enumerate(adj):
        nodes[i].neighbors = [nodes[j - 1] for j in nb]
    return nodes[0]


def graph_adj(node, limit=200):
    """A graph of Nodes back to its adjacency list, plus the ids of its nodes."""
    if node is None:
        return [], set()
    seen, order, q = {}, [], collections.deque([node])
    while q and len(order) < limit:
        t = q.popleft()
        if id(t) in seen:
            continue
        seen[id(t)] = t
        order.append(t)
        q.extend(t.neighbors)
    by_val = sorted(order, key=lambda t: t.val)
    # Neighbors in value order: a copy may list them in any order.
    return [sorted(n.val for n in t.neighbors) for t in by_val], set(seen)


def mk_random_list(pairs):
    """Copy List with Random Pointer's input: [[val, index of random or None], ...]."""
    nodes = [Node(v) for v, _ in pairs]
    for i, (_, r) in enumerate(pairs):
        nodes[i].next = nodes[i + 1] if i + 1 < len(nodes) else None
        nodes[i].random = nodes[r] if r is not None else None
    return nodes[0] if nodes else None


def random_list_pairs(head, limit=200):
    nodes, h = [], head
    while h is not None and len(nodes) < limit:
        nodes.append(h)
        h = h.next
    index = {id(n): i for i, n in enumerate(nodes)}
    return [[n.val, index.get(id(n.random)) if n.random is not None else None] for n in nodes], set(index)


# ── Comparing and showing results ────────────────────────────────────────────────────────────


def ser(x, depth=0, any_order=False):
    """A comparable form of a result. `any_order`: 'deep' sorts lists at every level, 'outer' only the
    result's own list (its items are sequences or points whose order counts), False none."""
    if depth > 50:
        return '...'
    if isinstance(x, ListNode):
        return ['L', to_list(x)]
    if isinstance(x, TreeNode):
        return ['T', tree_levels(x)]
    if isinstance(x, Node):
        return ['N', x.val]
    if isinstance(x, (list, tuple)):
        items = [ser(y, depth + 1, any_order if any_order == 'deep' else False) for y in x]
        if any_order:
            items.sort(key=repr)
        return ['l', items]
    if isinstance(x, dict):
        return ['d', sorted([repr(k), ser(v, depth + 1, any_order)] for k, v in x.items())]
    if isinstance(x, (set, frozenset)):
        return ['s', sorted(repr(y) for y in x)]
    if isinstance(x, bool) or x is None:
        return x
    if isinstance(x, float):
        # A whole number is the same answer as an int or as a float (a median of 5 or 5.0).
        return int(x) if x == int(x) and abs(x) < 1e15 else round(x, 5)
    if isinstance(x, (int, str)):
        return x
    return ['?', type(x).__name__]


def _key(x):
    """A comparable result as text. A value JSON cannot hold (a node used as a value, a set inside a
    list) becomes its type's name: it matches no right answer and never stops the judge."""
    return json.dumps(x, sort_keys=True, default=lambda o: '<' + type(o).__name__ + '>')


def show(x, limit=240, depth=0):
    """A result the way a learner would write it: lists and trees as lists, the rest as Python prints it."""
    if depth > 20:
        return '...'
    if isinstance(x, ListNode):
        vals = to_list(x)
        s = '[' + ', '.join(show(v, limit, depth + 1) for v in vals) + ']'
    elif isinstance(x, TreeNode):
        s = '[' + ', '.join('null' if v is None else show(v, limit, depth + 1) for v in tree_levels(x)) + ']'
    elif isinstance(x, Node):
        s = 'Node(' + show(x.val, limit, depth + 1) + ')'
    elif isinstance(x, list):
        s = '[' + ', '.join(show(v, limit, depth + 1) for v in x) + ']'
    elif isinstance(x, tuple):
        s = '(' + ', '.join(show(v, limit, depth + 1) for v in x) + (',)' if len(x) == 1 else ')')
    elif isinstance(x, (set, frozenset)):
        s = '{' + ', '.join(sorted(show(v, limit, depth + 1) for v in x)) + '}' if x else 'set()'
    elif isinstance(x, collections.deque):
        s = 'deque([' + ', '.join(show(v, limit, depth + 1) for v in x) + '])'
    elif isinstance(x, dict):
        s = '{' + ', '.join(show(k, limit, depth + 1) + ': ' + show(v, limit, depth + 1) for k, v in x.items()) + '}'
    elif isinstance(x, str):
        s = json.dumps(x, ensure_ascii=False)
    elif isinstance(x, float):
        s = repr(round(x, 5))
    elif x is None or isinstance(x, (bool, int)):
        s = repr(x)
    elif callable(x):
        s = '<function>'
    else:
        try:
            s = repr(x)
        except Exception:
            s = '<' + type(x).__name__ + '>'
        if s.startswith('<') and ' object at 0x' in s:
            # An object of the solution's own class (LRU Cache's Node): its plain fields.
            fields = [k + '=' + show(v, limit, depth + 1) for k, v in getattr(x, '__dict__', {}).items() if v is None or isinstance(v, (bool, int, float, str))]
            s = type(x).__name__ + '(' + ', '.join(fields[:4]) + ')' if fields else '<' + type(x).__name__ + '>'
    if depth == 0 and len(s) > limit:
        s = s[: limit - 1] + '…'
    return s


# ── Problems the general rules get wrong ─────────────────────────────────────────────────────

# How a result may be ordered on LeetCode: 'deep' (the items, and each item's own items), 'outer'
# (only the items), False (the order counts). Without an entry: 'deep' when the prompt says "any
# order", else False.
ANY_ORDER = {
    '3sum': 'deep', 'combination-sum': 'deep', 'combination-sum-ii': 'deep', 'subsets': 'deep', 'subsets-ii': 'deep',
    'group-anagrams': 'deep',
    # The two indices of a pair, in either order.
    'two-sum': 'outer',
    'permutations': 'outer', 'palindrome-partitioning': 'outer', 'letter-combinations-of-a-phone-number': 'outer',
    'n-queens': 'outer', 'pacific-atlantic-water-flow': 'outer', 'k-closest-points-to-origin': 'outer',
    'merge-intervals': 'outer', 'generate-parentheses': 'outer', 'word-search-ii': 'outer', 'top-k-frequent-elements': 'outer',
    'minimum-interval-to-include-each-query': False,
}


def topo_order(args, out, used=None):
    """Course Schedule II takes any order that respects every prerequisite: 'valid', 'empty' or the bad answer."""
    n, pre = args
    if not isinstance(out, list) or out == []:
        return ['empty'] if out == [] else ['bad', show(out)]
    if sorted(out) != list(range(n)):
        return ['bad', show(out)]
    pos = {c: i for i, c in enumerate(out)}
    return ['valid'] if all(pos[b] < pos[a] for a, b in pre) else ['bad', show(out)]


def alien_order(args, out, used=None):
    """Alien Dictionary takes any order of all the letters that keeps every pair the words give."""
    words = args[0]
    if out == '':
        return ['empty']
    if not isinstance(out, str) or sorted(out) != sorted({c for w in words for c in w}):
        return ['bad', show(out)]
    pos = {c: i for i, c in enumerate(out)}
    for w1, w2 in zip(words, words[1:]):
        for a, b in zip(w1, w2):
            if a != b:
                if pos[a] > pos[b]:
                    return ['bad', show(out)]
                break
    return ['valid']


def clone_check(args, out, used=None):
    """Clone Graph: the same shape, and not one of the nodes it was given (`used`: the arguments of the call)."""
    want, originals = graph_adj((used or args)[0])
    if out is None:
        return ['graph', []] if not want else ['bad', 'None']
    if not isinstance(out, Node):
        return ['bad', show(out)]
    got, ids = graph_adj(out)
    if ids & originals:
        return ['bad', 'the copy shares nodes with the original graph']
    return ['graph', got]


def copy_random_check(args, out, used=None):
    """Copy List with Random Pointer: the same values and random links, built from new nodes."""
    _, originals = random_list_pairs((used or args)[0])
    if out is not None and not isinstance(out, Node):
        return ['bad', show(out)]
    got, ids = random_list_pairs(out)
    if ids & originals:
        return ['bad', 'the copy shares nodes with the original list']
    return ['pairs', got]


def longest_palindrome_check(args, out, used=None):
    """Longest Palindromic Substring takes any longest one: a palindrome inside s, judged by its length."""
    s = args[0]
    if not isinstance(out, str) or out not in s or out != out[::-1]:
        return ['bad', show(out)]
    return ['palindrome of length', len(out)]


# Problems with more than one right answer, or whose answer is a structure of new nodes: the result
# is compared by what makes it right. Each gets the arguments as they were before the call, the
# result, and the arguments the call was made with.
CHECKS = {
    'course-schedule-ii': topo_order,
    'alien-dictionary': alien_order,
    'clone-graph': clone_check,
    'copy-list-with-random-pointer': copy_random_check,
    'longest-palindromic-substring': longest_palindrome_check,
}

# How a `CHECKS` result reads to the learner, instead of the comparable form.
CHECK_NOTE = {
    'course-schedule-ii': 'any order that takes every prerequisite first',
    'alien-dictionary': 'any order of the letters that fits the words',
    'longest-palindromic-substring': 'any palindrome of the same length',
}

# Problems whose examples name their input differently from the method's parameter, with the
# builder of the argument: {problem id: (input name, builder)}.
SPECIAL_ARGS = {
    'clone-graph': ('adjList', mk_graph),
    'copy-list-with-random-pointer': ('head', mk_random_list),
}


# Problems whose answer is one node of the input, shown by its value (the node itself is compared).
NODE_RESULT = {'lowest-common-ancestor-of-a-binary-search-tree'}


def special_show(pid, raw):
    if pid == 'clone-graph':
        return show(graph_adj(raw)[0]) if isinstance(raw, Node) else show(raw)
    if pid == 'copy-list-with-random-pointer':
        pairs = random_list_pairs(raw)[0] if raw is None or isinstance(raw, Node) else raw
        return show(pairs).replace('None', 'null')
    return None


# ── Reading a test's input ───────────────────────────────────────────────────────────────────


def split_assigns(s):
    """'a = 1, b = [1, 2]' -> {'a': '1', 'b': '[1, 2]'} (None when it is not a list of assignments)."""
    parts, depth, q, cur, i = [], 0, None, '', 0
    while i < len(s):
        ch = s[i]
        if q:
            cur += ch
            if ch == '\\' and i + 1 < len(s):
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


class BadInput(Exception):
    pass


_WORDS = {'null': None, 'true': True, 'false': False, 'INF': 2147483647}


def parse_val(v):
    """A value written in an example: Python literals, plus null / true / false / INF."""
    try:
        return eval(v, {'__builtins__': {}}, dict(_WORDS))
    except Exception as e:
        raise BadInput('cannot read the value ' + v[:60]) from e


class _Calls(dict):
    """Names in a design test (`LRUCache(2), put(4, 40)`) become the operations they describe."""

    def __missing__(self, name):
        if name in _WORDS:
            return _WORDS[name]
        return lambda *a: (name, list(a))


def parse_ops(s):
    """'LRUCache(2), put(4, 40), get(4)' -> [('LRUCache', [2]), ('put', [4, 40]), ('get', [4])].
    Also reads the statement form: 't = Trie(); t.insert("card"); t.search("car")'."""
    if ';' in s:
        s = ', '.join(part.strip() for part in s.split(';') if part.strip())
        s = re.sub(r'^\s*[A-Za-z_]\w*\s*=\s*', '', s)
        s = re.sub(r'\b[A-Za-z_]\w*\.(?=[A-Za-z_]\w*\()', '', s)
    try:
        ops = eval('[' + s + ']', {'__builtins__': {}}, _Calls())
    except Exception as e:
        raise BadInput('cannot read the operations') from e
    if not ops or not all(isinstance(o, tuple) and len(o) == 2 and isinstance(o[0], str) for o in ops):
        raise BadInput('expected Class(...), then method calls')
    return ops


def design_ops(S, text):
    """A design test's operations, starting with the constructor (added when the class takes no arguments)."""
    ops = parse_ops(text)
    if ops[0][0] != S['cls']:
        if S['init_params']:
            raise BadInput('the first call must be ' + S['cls'] + '(...)')
        ops = [(S['cls'], [])] + ops
    for name, _ in ops[1:]:
        if name not in S['methods']:
            raise BadInput(S['cls'] + ' has no method ' + name)
    return ops


def _ann(a):
    return a.replace(' ', '').replace("'", '').replace('"', '')


def convert(ann, v, earlier):
    """An example's value as the argument the method takes (a list as a linked list or a tree)."""
    a = _ann(ann)
    if a in ('List[Optional[ListNode]]', 'List[ListNode]') and isinstance(v, list):
        return [mk_list(x) for x in v]
    if 'ListNode' in a and isinstance(v, list):
        return mk_list(v)
    if 'TreeNode' in a:
        if isinstance(v, list):
            return mk_tree(v)
        # A node given by its value (Lowest Common Ancestor's p and q): that node of the tree before it.
        for e in earlier:
            if isinstance(e, TreeNode):
                n = find_node(e, v)
                if n is None:
                    raise BadInput('no node with value ' + show(v) + ' in the tree')
                return n
    return v


# ── Setting up a problem ─────────────────────────────────────────────────────────────────────


def namespace():
    return dict(
        ListNode=ListNode, TreeNode=TreeNode, Node=Node, List=List, Optional=Optional, Dict=Dict, Set=Set, Tuple=Tuple, Any=Any,
        collections=collections, heapq=heapq, math=math, deque=collections.deque, defaultdict=collections.defaultdict,
        Counter=collections.Counter, functools=functools, bisect=bisect, itertools=itertools, cache=functools.cache,
        lru_cache=functools.lru_cache, string=string, inf=math.inf, __name__='solution',
    )


def load(code, filename):
    ns = namespace()
    exec(compile(code, filename, 'exec'), ns)
    return ns


def setup(problem):
    """What to call and how to compare, read from the problem's own solution."""
    pid = problem['id']
    tree = ast.parse(problem['code'])
    classes = [n for n in tree.body if isinstance(n, ast.ClassDef)]
    sol = [c for c in classes if c.name == 'Solution']
    order = ANY_ORDER.get(pid, 'deep' if problem.get('anyOrder') else False)
    if not sol:
        # A design class is the one LeetCode names: the last class that is not a helper (Node, TrieNode).
        main = classes[-1]
        methods = [n.name for n in main.body if isinstance(n, ast.FunctionDef) and not n.name.startswith('_')]
        codec = None
        if 'encode' in methods and 'decode' in methods:
            codec = ('encode', 'decode')
        elif 'serialize' in methods and 'deserialize' in methods:
            codec = ('serialize', 'deserialize')
        init = next((n for n in main.body if isinstance(n, ast.FunctionDef) and n.name == '__init__'), None)
        return dict(id=pid, kind='codec' if codec else 'design', cls=main.name, methods=methods, codec=codec,
                    init_params=[a.arg for a in init.args.args[1:]] if init else [], any_order=order)
    meths = [n for n in sol[0].body if isinstance(n, ast.FunctionDef) and not n.name.startswith('_')]
    m = meths[0]
    params = [(a.arg, ast.unparse(a.annotation) if a.annotation else '') for a in m.args.args[1:]]
    inplace = isinstance(m.returns, ast.Constant) and m.returns.value is None
    returns = _ann(ast.unparse(m.returns)) if m.returns is not None else ''
    return dict(id=pid, kind='fn', cls='Solution', method=m.name, params=params, inplace=inplace, returns=returns, any_order=order)


def build_args(S, text):
    """A test's input as fresh arguments: (args, the input as shown)."""
    pid = S['id']
    d = split_assigns(text)
    if not d:
        raise BadInput('not written as name = value, ...')
    vals = {k: parse_val(v) for k, v in d.items()}
    if pid in SPECIAL_ARGS:
        name, build = SPECIAL_ARGS[pid]
        if name not in vals:
            raise BadInput('missing ' + name)
        return [build(vals[name])]
    args = []
    for name, ann in S['params']:
        if name not in vals:
            raise BadInput('missing ' + name)
        args.append(convert(ann, vals[name], args))
    # A `pos` the method does not take: the list has a cycle (Linked List Cycle).
    if 'pos' in vals and 'pos' not in {n for n, _ in S['params']}:
        args = [with_cycle(a, vals['pos']) if isinstance(a, ListNode) else a for a in args]
    return args


def codec_value(S, text):
    d = split_assigns(text)
    if not d or len(d) != 1:
        raise BadInput('expected one value, like strs = [...]')
    v = parse_val(next(iter(d.values())))
    return mk_tree(v) if S['codec'][0] == 'serialize' else v


# ── Running code with a step limit ───────────────────────────────────────────────────────────


class StepLimit(BaseException):
    """Not an Exception, so a solution's own `except Exception` cannot swallow it."""


class Counter_:
    """Counts the lines run in one file (or several) and stops the run past a limit."""

    def __init__(self, filename, limit):
        self.files = {filename} if isinstance(filename, str) else set(filename)
        self.limit, self.steps = limit, 0

    def _local(self, frame, event, arg):
        if event == 'line':
            self.steps += 1
            if self.steps > self.limit:
                raise StepLimit()
        return self._local

    def __call__(self, frame, event, arg):
        return self._local if frame.f_code.co_filename in self.files else None


def run_limited(fn, filename, limit):
    """(status, value, steps): 'ok' with the result, 'exc' with the exception, 'limit' when it ran too long."""
    c = Counter_(filename, limit)
    old = sys.gettrace()
    sys.settrace(c)
    try:
        return 'ok', fn(), c.steps
    except StepLimit:
        return 'limit', None, c.steps
    except BaseException as e:
        # Everything else is the code's own failure, `sys.exit()` and `KeyboardInterrupt` included:
        # nothing a learner writes may end the judge itself.
        return 'exc', e, c.steps
    finally:
        sys.settrace(old)


def describe_error(e, filename=USER_FILE, offset=0):
    """An exception as the learner needs it: its type, message and the line of their code it came from."""
    line = None
    if isinstance(e, SyntaxError):
        line = e.lineno
        msg = e.msg
    else:
        tb = e.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == filename:
                line = tb.tb_lineno
            tb = tb.tb_next
        msg = str(e)
        if isinstance(e, SystemExit):
            msg = 'the code called exit(): return the answer instead'
        elif isinstance(e, RecursionError):
            msg = 'the function kept calling itself and never reached a base case'
        elif isinstance(e, KeyError):
            msg = 'key ' + msg + ' is not in the dict'
    if line is not None:
        line = max(1, line - offset)
    return dict(type=type(e).__name__, message=msg[:300], line=line)


class Capture(io.StringIO):
    """What the code prints, up to a cap (a loop that prints forever must not fill memory)."""

    def __init__(self, cap=4000):
        super().__init__()
        self.cap = cap

    def write(self, s):
        room = self.cap - self.tell()
        if room > 0:
            super().write(s[:room])
        return len(s)


def comparable(S, args_before, args, result):
    pid = S['id']
    if pid in CHECKS:
        return CHECKS[pid](args_before, result, args)
    return ser(args if S['inplace'] else result, any_order=S['any_order'])


def shown(S, args, result):
    """The answer as the learner reads it."""
    sp = special_show(S['id'], result)
    if sp is not None:
        return sp
    if S['inplace']:
        return show(args[0]) if len(args) == 1 else ', '.join(n + ' = ' + show(a) for (n, _), a in zip(S['params'], args))
    if S['id'] in NODE_RESULT and isinstance(result, (TreeNode, ListNode)):
        return show(result.val)
    # No list and no tree is written [] (LeetCode's form), not None.
    if result is None and ('ListNode' in S['returns'] or 'TreeNode' in S['returns']):
        return '[]'
    return show(result)


# The reference solution may take this many steps on a test; a learner's code this many times more
# (a brute force is far slower than the answer and still right), within the hard cap.
REF_LIMIT = 2_000_000
USER_FACTOR = 400
USER_MIN, USER_MAX = 200_000, 3_000_000


def user_limit(ref_steps):
    return max(USER_MIN, min(USER_MAX, ref_steps * USER_FACTOR))


def run_fn_test(S, ref_ns, user_ns, text):
    """One test of a `class Solution` problem."""
    before = build_args(S, text)
    ref_args = build_args(S, text)
    st, ref_out, ref_steps = run_limited(lambda: getattr(ref_ns['Solution'](), S['method'])(*ref_args), REF_FILE, REF_LIMIT)
    if st != 'ok':
        raise BadInput('our own solution cannot run this input')
    want = comparable(S, before, ref_args, ref_out)
    res = dict(input=text, want=shown(S, ref_args, ref_out))
    note = CHECK_NOTE.get(S['id'])
    if note:
        res['wantNote'] = note
    args = build_args(S, text)
    out, old = Capture(), sys.stdout
    sys.stdout = out
    try:
        st, got, steps = run_limited(lambda: getattr(user_ns['Solution'](), S['method'])(*args), USER_FILE, user_limit(ref_steps))
    finally:
        sys.stdout = old
    res['stdout'] = out.getvalue()
    res['steps'], res['refSteps'] = steps, ref_steps
    if st == 'limit':
        res.update(passed=False, error=dict(type='TimeLimit', message='it ran for too long and was stopped: look for a loop that never ends, or a much slower approach', line=None))
        return res
    if st == 'exc':
        res.update(passed=False, error=describe_error(got, offset=user_ns.get('__offset__', 0)))
        return res
    try:
        mine = comparable(S, build_args(S, text), args, got)
        res['got'] = shown(S, args, got)
        res['passed'] = _key(mine) == _key(want)
    except Exception as e:
        res.update(passed=False, got=show(got), error=dict(type='WrongType', message='the result is not the kind of value the problem asks for (' + type(e).__name__ + ')', line=None))
        return res
    if not res['passed'] and isinstance(mine, list) and mine[:1] == ['bad'] and S['id'] in ('clone-graph', 'copy-list-with-random-pointer'):
        res['hint'] = mine[1][0].upper() + mine[1][1:] + ': build new nodes.'
    if not res['passed'] and S['inplace'] and got is not None:
        res['hint'] = 'This method returns nothing: change the argument in place.'
    elif not res['passed'] and got is None and not S['inplace']:
        res['hint'] = 'Your function returned None: is a return missing on some path?'
    return res


def call_text(name, args):
    return name + '(' + ', '.join(show(a) for a in args) + ')'


def run_design_test(S, ref_ns, user_ns, text):
    """One test of a design class: every operation's result is compared, in order."""
    ops = design_ops(S, text)

    def play(ns, filename, limit):
        results, state = [], dict(obj=None)

        def run():
            for k, (name, a) in enumerate(json.loads(json.dumps(ops))):
                if k == 0:
                    state['obj'] = ns[S['cls']](*a)
                    results.append(None)
                else:
                    results.append(getattr(state['obj'], name)(*a))
        st, val, steps = run_limited(run, filename, limit)
        return st, val, steps, results

    st, _, ref_steps, want = play(ref_ns, REF_FILE, REF_LIMIT)
    if st != 'ok':
        raise BadInput('our own solution cannot run these operations')
    out, old = Capture(), sys.stdout
    sys.stdout = out
    try:
        st, err, steps, got = play(user_ns, USER_FILE, user_limit(ref_steps))
    finally:
        sys.stdout = old
    res = dict(input=text, stdout=out.getvalue(), steps=steps, refSteps=ref_steps)
    at = len(got) if st != 'ok' else None
    for k in range(1, min(len(got), len(want))):
        # A method that returns nothing (push, put, addNum) is not judged by what it returns.
        if want[k] is None:
            continue
        if _key(ser(got[k], any_order=S['any_order'])) != _key(ser(want[k], any_order=S['any_order'])):
            at = k
            break
    calls = [call_text(n, a) for n, a in ops]
    res['want'] = ', '.join(calls[k] + ' → ' + show(want[k]) for k in range(1, len(ops)) if want[k] is not None) or 'no errors'
    if at is None:
        res.update(passed=True, got=res['want'])
        return res
    res['passed'] = False
    res['op'] = calls[at] if at < len(calls) else calls[-1]
    if st == 'limit':
        res['error'] = dict(type='TimeLimit', message='it ran for too long and was stopped at ' + res['op'], line=None)
    elif st == 'exc' and at == len(got):
        res['error'] = describe_error(err, offset=user_ns.get('__offset__', 0))
        res['error']['message'] += ' (during ' + res['op'] + ')'
    else:
        res['want'] = res['op'] + ' → ' + show(want[at])
        res['got'] = res['op'] + ' → ' + show(got[at])
    return res


def run_codec_test(S, ref_ns, user_ns, text):
    """A codec is right when decoding what it encoded gives the value back (LeetCode's own check)."""
    enc, dec = S['codec']
    want_show = show(codec_value(S, text)).replace('None', 'null') if enc == 'serialize' else show(codec_value(S, text))
    want = ser(codec_value(S, text))
    value = codec_value(S, text)
    state = {}

    def run():
        obj = user_ns[S['cls']]()
        data = getattr(obj, enc)(value)
        state['data'] = data
        if not isinstance(data, str):
            return None
        return getattr(obj, dec)(data)
    out, old = Capture(), sys.stdout
    sys.stdout = out
    try:
        st, got, steps = run_limited(run, USER_FILE, USER_MAX)
    finally:
        sys.stdout = old
    res = dict(input=text, want=want_show, stdout=out.getvalue(), steps=steps, refSteps=0)
    if st == 'limit':
        res.update(passed=False, error=dict(type='TimeLimit', message='it ran for too long and was stopped', line=None))
    elif st == 'exc':
        res.update(passed=False, error=describe_error(got, offset=user_ns.get('__offset__', 0)))
    elif not isinstance(state.get('data'), str):
        res.update(passed=False, got=show(state.get('data')), hint=enc + ' must return a string.')
    else:
        res['got'] = show(got).replace('None', 'null') if enc == 'serialize' else show(got)
        res['passed'] = _key(ser(got)) == _key(want)
        if not res['passed']:
            res['hint'] = enc + ' returned ' + show(state['data'], 80)
    return res


RUNNERS = dict(fn=run_fn_test, design=run_design_test, codec=run_codec_test)


def prepare_user(S, code):
    """The learner's code as a namespace, or the error that stopped it loading."""
    try:
        ns = load(code, USER_FILE)
    except StepLimit:
        return None, dict(type='TimeLimit', message='it ran for too long while loading', line=None)
    except BaseException as e:  # SyntaxError, NameError at import, SystemExit...
        if isinstance(e, (KeyboardInterrupt,)):
            raise
        return None, describe_error(e)
    cls = ns.get(S['cls'])
    if not isinstance(cls, type):
        return None, dict(type='Missing', message='keep the line `class ' + S['cls'] + ':` — the tests call it', line=None)
    if S['kind'] == 'fn' and not callable(getattr(cls, S['method'], None)):
        return None, dict(type='Missing', message='keep the method `' + S['method'] + '` — the tests call it', line=None)
    return ns, None


def judge(payload, progress=None):
    """Run the learner's code on the problem's tests. `progress(done, total)` is called after each."""
    req = json.loads(payload) if isinstance(payload, str) else payload
    problem = req['problem']
    _set_recursion_limit(RECURSION_LIMIT)
    S = setup(problem)
    ref_ns = load(problem['code'], REF_FILE)
    tests = [dict(input=e, example=True) for e in problem.get('examples', [])]
    if req.get('mode', 'submit') != 'examples':
        tests += [dict(input=t, example=False) for t in problem.get('tests', [])]
    user_ns, error = prepare_user(S, req['user'])
    if error:
        return json.dumps(dict(status='error', error=error, passed=0, total=len(tests), results=[]))
    results, skipped = [], 0
    for k, t in enumerate(tests):
        _set_recursion_limit(RECURSION_LIMIT)
        try:
            r = RUNNERS[S['kind']](S, ref_ns, user_ns, t['input'])
        except BadInput:
            skipped += 1  # an example written in words (Valid Sudoku's): nothing to run
            continue
        except Exception as e:
            # The answer could not even be compared (a value of a kind no answer has, a result
            # that cannot be read): the test fails, the judge goes on.
            r = dict(input=t['input'], want='', stdout='', steps=0, refSteps=0, passed=False,
                     error=dict(type='WrongType', message='the result is not the kind of value the problem asks for (' + type(e).__name__ + ')', line=None))
        r['example'] = t['example']
        results.append(r)
        if progress:
            progress(k + 1, len(tests))
    passed = sum(1 for r in results if r['passed'])
    return json.dumps(dict(status='done', passed=passed, total=len(results), skipped=skipped, results=results))


# ── A step-by-step trace ─────────────────────────────────────────────────────────────────────


def trace(payload):
    """Run the problem's own solution on one input and record every line it runs with its variables."""
    req = json.loads(payload) if isinstance(payload, str) else payload
    problem = req['problem']
    code = req.get('code', problem['code'])
    filename = REF_FILE
    max_steps = req.get('maxSteps', 80)
    S = setup(problem)
    ns = load(code, filename)
    steps, state = [], dict(depth=0, over=False)
    skip = {'self'}

    def snapshot(frame):
        out = {}
        for k, v in frame.f_locals.items():
            if k in skip or k.startswith('__') or callable(v) and not isinstance(v, (ListNode, TreeNode, Node)):
                continue
            if isinstance(v, type) or type(v).__name__ == 'module':
                continue
            out[k] = show(v, 70)
        # A design class keeps its state on itself: show it as `self.name`.
        me = frame.f_locals.get('self')
        if me is not None and type(me).__name__ != 'Solution':
            for k, v in list(getattr(me, '__dict__', {}).items())[:8]:
                if not callable(v):
                    out['self.' + k] = show(v, 70)
        return out

    def local(frame, event, arg):
        if event == 'line':
            if len(steps) >= max_steps:
                state['over'] = True
                return local
            steps.append(dict(l=frame.f_lineno - 1, d=state['depths'].get(id(frame), 0), v=snapshot(frame), f=frame.f_code.co_name))
        elif event == 'return' and not state['over'] and steps:
            steps[-1].setdefault('r', {})[str(state['depths'].get(id(frame), 0))] = show(arg, 70)
        return local

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != filename or event != 'call':
            return None
        if frame.f_code.co_name in ('<listcomp>', '<genexpr>', '<setcomp>', '<dictcomp>', '<lambda>'):
            return None
        parent = frame.f_back
        depth = 0
        while parent is not None:
            if id(parent) in state['depths']:
                depth = state['depths'][id(parent)] + 1
                break
            parent = parent.f_back
        state['depths'][id(frame)] = depth
        return local

    state['depths'] = {}
    text = req['input']
    if S['kind'] == 'fn':
        args = build_args(S, text)
        fn = lambda: getattr(ns['Solution'](), S['method'])(*args)
    elif S['kind'] == 'design':
        ops = design_ops(S, text)

        def fn():
            obj, out = None, []
            for k, (name, a) in enumerate(ops):
                if k == 0:
                    obj = ns[S['cls']](*a)
                else:
                    r = getattr(obj, name)(*a)
                    if r is not None:
                        out.append(call_text(name, a) + ' → ' + show(r))
            return out
        args = []
    else:
        value = codec_value(S, text)
        enc, dec = S['codec']

        def fn():
            obj = ns[S['cls']]()
            return getattr(obj, dec)(getattr(obj, enc)(value))
        args = []
    old = sys.gettrace()
    sys.settrace(tracer)
    try:
        result = fn()
    finally:
        sys.settrace(old)
    if S['kind'] == 'fn':
        result_text = shown(S, args, result)
    elif S['kind'] == 'design':
        result_text = ', '.join(result) if result else 'done'
    else:
        result_text = show(result).replace('None', 'null') if S['codec'][0] == 'serialize' else show(result)
    return json.dumps(dict(input=text, steps=steps, result=result_text, truncated=state['over']))


# ── A beginner exercise: run a snippet, capture what it prints ───────────────────────────────


def run_snippet(payload):
    """Run a "Your turn" answer: {code, check, limit} -> {ok, stdout, error, checkFailed}."""
    req = json.loads(payload) if isinstance(payload, str) else payload
    _set_recursion_limit(RECURSION_LIMIT)
    out, old = Capture(req.get('cap', 4000)), sys.stdout
    ns = dict(__name__='__main__')
    res = dict(ok=True, stdout='', error=None, checkFailed=False)

    def run():
        exec(compile(req['code'], USER_FILE, 'exec'), ns)
    sys.stdout = out
    try:
        try:
            st, val, _ = run_limited(run, USER_FILE, req.get('limit', 400_000))
        except BaseException as e:  # a SyntaxError from compile, SystemExit
            st, val = 'exc', e
    finally:
        sys.stdout = old
    res['stdout'] = out.getvalue()
    if st == 'limit':
        res.update(ok=False, error=dict(type='TimeLimit', message='it ran for too long and was stopped: look for a loop that never ends', line=None))
        return json.dumps(res)
    if st == 'exc':
        res.update(ok=False, error=describe_error(val))
        return json.dumps(res)
    if req.get('check'):
        sink = Capture(200)
        sys.stdout = sink
        try:
            try:
                # The check calls what the learner wrote: their lines count too, so a loop that
                # never ends inside their function is stopped here like one at the top level.
                st, val, _ = run_limited(lambda: exec(compile(req['check'], '<check>', 'exec'), ns), ('<check>', USER_FILE), 400_000)
            except BaseException as e:
                st, val = 'exc', e
        finally:
            sys.stdout = old
        if st != 'ok':
            res.update(ok=False, checkFailed=True)
            if st == 'exc' and isinstance(val, AssertionError):
                # Which check failed, as the line of the check that raised.
                tb, line = val.__traceback__, None
                while tb is not None:
                    if tb.tb_frame.f_code.co_filename == '<check>':
                        line = tb.tb_lineno
                    tb = tb.tb_next
                src = req['check'].split('\n')
                if line and 0 < line <= len(src):
                    res['failed'] = src[line - 1].strip()
            elif st == 'exc':
                res['error'] = describe_error(val)
            else:
                res['error'] = dict(type='TimeLimit', message='it ran for too long and was stopped: look for a loop that never ends', line=None)
    return json.dumps(res)
