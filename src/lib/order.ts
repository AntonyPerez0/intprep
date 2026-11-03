// Which neighboring lines can trade places: two simple statements at the same indentation, next to
// each other, where neither writes what the other reads or writes (`left += 1` / `right -= 1`,
// `self.stack = []` / `self.min_stack = []`, `nums.sort()` / `res = []`). Both orders run the same,
// so Arrange a part accepts either order, and Pick the gaps never offers one as the other's option.
//
// Conservative on purpose: a line that calls something that could do anything (a function other than
// a few pure builtins, `print`, a method of `self`, a method it does not know) never moves, and two
// writes to the same container (`d[a] = 1` / `d[b] = 2`) never trade places.
//
// Pure: no React, no DOM.

import { stripComment } from './parseSolution';

/** Calls that only compute a value. */
const PURE_CALLS = new Set([
  'len', 'min', 'max', 'abs', 'set', 'dict', 'list', 'tuple', 'float', 'int', 'str', 'bool', 'sorted', 'sum', 'range',
  'enumerate', 'zip', 'ord', 'chr', 'any', 'all', 'deque', 'defaultdict', 'Counter', 'reversed', 'divmod', 'pow',
  'round', 'isinstance', 'map', 'filter', 'frozenset', 'hash', 'bin', 'hex', 'iter',
  'collections.deque', 'collections.defaultdict', 'collections.Counter', 'math.sqrt', 'math.floor', 'math.ceil',
  'math.log', 'math.gcd', 'math.isqrt', 'heapq.nlargest', 'heapq.nsmallest',
]);

/** Methods that read their receiver and change nothing. */
const PURE_METHODS = new Set([
  'get', 'keys', 'values', 'items', 'index', 'count', 'copy', 'lower', 'upper', 'split', 'strip', 'lstrip', 'rstrip',
  'join', 'isalnum', 'isalpha', 'isdigit', 'isspace', 'startswith', 'endswith', 'find', 'replace', 'format',
  'bit_length', 'most_common',
]);

/** Methods that change their receiver. */
const MUTATING_METHODS = new Set([
  'append', 'extend', 'pop', 'popleft', 'appendleft', 'extendleft', 'insert', 'remove', 'add', 'discard', 'sort',
  'reverse', 'clear', 'update', 'setdefault', 'rotate',
]);

/** `heapq` functions that change their first argument. */
const HEAP_WRITES = new Set(['heappush', 'heappop', 'heapify', 'heappushpop', 'heapreplace']);

const KEYWORDS = new Set([
  'and', 'or', 'not', 'in', 'is', 'if', 'else', 'for', 'lambda', 'None', 'True', 'False', 'await',
]);

const NOT_SIMPLE =
  /^(return|break|continue|pass|raise|yield|del|global|nonlocal|import|from|assert|if|elif|else|while|for|with|try|except|finally|def|class|async|await|@)\b/;

interface Effects {
  reads: string[];
  writes: string[];
}

/** One code token: a dotted name path, a string, a number, or a symbol. */
const TOK = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[A-Za-z_]\w*(?:\s*\.\s*[A-Za-z_]\w*)*|\d+(?:\.\d+)?|\*\*|\/\/|[=!<>]=|[-+*/%&|^]=|\S/g;

/** Index of the statement's top-level `=` (not `==`, `<=`, `+=`…), or -1. */
export function topLevelAssign(s: string): { at: number; op: string } {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    else if (ch === '=' && depth === 0 && s[i + 1] !== '=') {
      const prev2 = s.slice(Math.max(0, i - 2), i);
      const prev = s[i - 1] ?? '';
      if (prev2 === '//' || prev2 === '**' || prev2 === '>>' || prev2 === '<<') return { at: i - 2, op: prev2 + '=' };
      if ('+-*/%&|^'.includes(prev) && prev) return { at: i - 1, op: prev + '=' };
      if ('=!<>:'.includes(prev) && prev) continue;
      return { at: i, op: '=' };
    }
  }
  return { at: -1, op: '' };
}

const path = (t: string) => t.replace(/\s+/g, '');

/**
 * What an expression reads and writes (a mutating method writes its receiver), or null when it calls
 * something that could do anything.
 */
function exprEffects(expr: string, out: Effects): boolean {
  const toks = expr.match(TOK) ?? [];
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (!/^[A-Za-z_]/.test(t)) continue;
    const p = path(t);
    if (KEYWORDS.has(p)) continue;
    if (toks[k - 1] === '.') {
      // An attribute of a subscript or a call (`nums[i].val`): its base is read already. A method
      // called on it could change anything but a pure one, or a known mutating one on a subscript
      // (`rows[r].add(x)` changes `rows`).
      const method = p.split('.')[0];
      if (toks[k + 1] === '(' && !PURE_METHODS.has(method)) {
        const base = subscriptBase(toks, k - 2);
        if (!base || !MUTATING_METHODS.has(method)) return false;
        out.reads.push(base);
        out.writes.push(base);
      }
      continue;
    }
    // A keyword argument's name (`key=…` inside a call).
    if (toks[k + 1] === '=' && k > 0 && (toks[k - 1] === '(' || toks[k - 1] === ',')) continue;
    if (toks[k + 1] === '(') {
      if (PURE_CALLS.has(p)) continue;
      const dot = p.lastIndexOf('.');
      if (dot < 0) return false; // a free function: could do anything
      const recv = p.slice(0, dot);
      const method = p.slice(dot + 1);
      if (recv === 'heapq' && HEAP_WRITES.has(method)) {
        const first = toks[k + 2];
        if (!first || !/^[A-Za-z_]/.test(first)) return false;
        out.writes.push(path(first));
        continue;
      }
      if (recv === 'self') return false; // a method of the class: could do anything
      if (PURE_METHODS.has(method)) out.reads.push(recv);
      else if (MUTATING_METHODS.has(method)) {
        out.reads.push(recv);
        out.writes.push(recv);
      } else return false;
      continue;
    }
    out.reads.push(p);
  }
  return true;
}

/** The name a subscript ends on at `toks[end]` (`rows` of `rows[r]`, `grid` of `grid[r][c]`), or null. */
function subscriptBase(toks: readonly string[], end: number): string | null {
  let k = end;
  while (toks[k] === ']') {
    let depth = 0;
    for (; k >= 0; k--) {
      if (toks[k] === ']') depth++;
      else if (toks[k] === '[' && --depth === 0) break;
    }
    k--;
  }
  return k < end && k >= 0 && /^[A-Za-z_]/.test(toks[k]) && toks[k - 1] !== '.' ? path(toks[k]) : null;
}

/** The names a target writes (`a[i]` writes `a`, `self.x` writes `self.x`) and reads (its indices). */
function targetEffects(target: string, out: Effects): boolean {
  for (const raw of splitTop(target.replace(/^[([]\s*|\s*[)\]]$/g, ''))) {
    const t = raw.trim().replace(/^\*/, '');
    if (!t) continue;
    const m = t.match(/^([A-Za-z_]\w*(?:\s*\.\s*[A-Za-z_]\w*)*)\s*(\[.*\])?$/);
    if (!m) return false;
    out.writes.push(path(m[1]));
    if (m[2] && !exprEffects(m[2].slice(1, -1), out)) return false;
  }
  return true;
}

/** Split at top-level commas. */
export function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      cur += ch;
      if (ch === '\\') cur += s[++i] ?? '';
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** What a simple statement reads and writes, or null when it is not one that can move. */
function effects(line: string): Effects | null {
  const s = stripComment(line).trim();
  if (!s || s.endsWith(':') || NOT_SIMPLE.test(s) || /\bprint\s*\(|\byield\b|:=/.test(s)) return null;
  const out: Effects = { reads: [], writes: [] };
  const { at, op } = topLevelAssign(s);
  if (at < 0) {
    // A call statement: `nums.sort()`, `heapq.heappush(heap, x)`.
    if (!/\)$/.test(s)) return null;
    if (!exprEffects(s, out) || !out.writes.length) return null;
    return out;
  }
  const lhs = s.slice(0, at);
  const rhs = s.slice(at + op.length);
  // Chained `a = b = 0`: every part but the last is a target.
  const parts = [lhs];
  let rest = rhs;
  for (let a = topLevelAssign(rest); a.at >= 0 && a.op === '=' && op === '='; a = topLevelAssign(rest)) {
    parts.push(rest.slice(0, a.at));
    rest = rest.slice(a.at + 1);
  }
  for (const t of parts) if (!targetEffects(t, out)) return null;
  if (op !== '=') out.reads.push(...out.writes);
  if (!exprEffects(rest, out)) return null;
  return out;
}

const overlaps = (a: string, b: string) => a === b || a.startsWith(b + '.') || b.startsWith(a + '.');
const meets = (xs: readonly string[], ys: readonly string[]) => xs.some((x) => ys.some((y) => overlaps(x, y)));

/** Two simple statements that run the same in either order. */
function independent(a: Effects, b: Effects): boolean {
  return !meets(a.writes, [...b.reads, ...b.writes]) && !meets(b.writes, a.reads);
}

const indentOf = (s: string) => (s.match(/^\s*/)?.[0] ?? '').replace(/\t/g, '    ').length;

/**
 * Whether two lines next to each other can trade places: simple statements at the same indentation
 * (so in the same block) where neither writes what the other reads or writes.
 */
export function canSwap(a: string, b: string): boolean {
  if (indentOf(a) !== indentOf(b)) return false;
  const fa = effects(a);
  const fb = fa && effects(b);
  return !!fa && !!fb && independent(fa, fb);
}

/**
 * Runs of neighboring lines that can come in any order (indices into `lines`, each run 2+ long and
 * in order). Blank and comment-only lines are skipped; any other line between two lines, or a change
 * of indentation, ends a run. Every pair in a run is independent, so any order of a run is right.
 */
export function swapRuns(lines: readonly string[]): number[][] {
  const runs: number[][] = [];
  let run: number[] = [];
  let runFx: Effects[] = [];
  let runIndent = -1;
  const close = () => {
    if (run.length >= 2) runs.push(run);
    run = [];
    runFx = [];
  };
  lines.forEach((line, i) => {
    if (!stripComment(line).trim()) return;
    const fx = effects(line);
    if (!fx) return close();
    const ind = indentOf(line);
    if (run.length && ind === runIndent && runFx.every((o) => independent(o, fx))) {
      run.push(i);
      runFx.push(fx);
      return;
    }
    close();
    run = [i];
    runFx = [fx];
    runIndent = ind;
  });
  close();
  return runs;
}
