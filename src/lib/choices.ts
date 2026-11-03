// Plausible wrong lines for picking code: the options of a missing line ("Pick the key line",
// "Pick the gaps", Key lines) and the paired distractor of "Arrange a part" (src/lib/arrange.ts).
//
// A wrong option is a small change to the right line: an operator, a bound, a pointer, a method, a
// literal (`<` for `<=`, `left` for `right`, `heappush` for `heappop`, an off-by-one), or another
// variable of the same snippet where the line reads one. So the choice is about the idea, not about
// spotting a stranger. The rules (see `lineChanges` and `lineChoices`):
// - Never the answer in disguise: options are compared by meaning (`canonKey`: `a > b` is `b < a`,
//   `x + 0` is `x`, `a, b = x, y` is `b, a = y, x`; and `canonIn`, by what the line does where it
//   stands: a dummy's unread value, `None` for `False` in a helper only ever tested, a call of a
//   function that returns nothing whatever its arguments), an `if` never becomes a `while`, two names
//   are never swapped over equal values, `<=` never stands in for `<` on an `elif` after `==` on the
//   same operands, and wrong options that ran exactly like the answer in its solution are denied
//   (src/content/distractorDeny.ts, made by scripts/check-distractors.py).
// - Never nonsense: no name that is not bound on the way to the line (defined only later, only in
//   a comprehension, only in another branch's loop, or bound first by the line itself), no line that
//   leaves a name unset that a later line reads or makes a closure's name local, no method the value
//   does not have (`.appendleft` on a list, `.prev` on a singly linked node), no call with an argument
//   count its function does not take, no no-op (`+ 0`, `* 1`, `[-0]`, a unary `+`), no statement that
//   is only a value, no test whose result is known there, no change inside a string, no renamed loop
//   variable or new name the line itself introduces, no `def` or `class` line.
// - The answer is not the "center" of its options. Three wrong options are alternatives at one site
//   (`<` with `<=`, `>`, `>=`) or a 2x2 (two changes and both together, never two that add the same
//   word), so every option is as close to the others as the answer is; only when a line has neither
//   do other shapes come in.
// - Fallback lines (other real lines of the snippet, when a line has too few changes) have the
//   answer's shape (the same kind of statement or block opener), are never on screen, and never a
//   line that can take the answer's place (`partnersOf`, `order.ts`).
// - A line still short of a full set gets the extra rules (`extraMutants`: more real mistakes built
//   from the snippet's own names, functions and lines), and only then may a change of it be one that
//   is on screen (`self.stack.pop()` above `self.min_stack.pop()`).
// Options are code only (no trailing comment), at the answer's indentation.
//
// Pure: no React, no DOM; its only content is the generated deny list. Re-exported from
// src/lib/drills.ts.

import { DISTRACTOR_DENY } from '../content/distractorDeny';
import { TEMPLATE_DENY } from '../content/templateDeny';
import { lineKey } from './codegrade';
import { effects, exprEffectsOf, independent, splitTop, swapRuns, topLevelAssign } from './order';
import { stripComment } from './parseSolution';
import { hashString, seededRandom, shuffleWith } from './random';

// ── Tokens ──────────────────────────────────────────────────────────────────

const STRING = String.raw`(?:[rRbBfFuU]{1,2})?(?:"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?)`;
// A string literal and a hex literal (`0x7FFFFFFF`) are one token each, so nothing inside them is
// ever swapped (`"-"` → `"+"`, `1x7FFFFFFF`).
const TOKENS = new RegExp(
  String.raw`(\s+|${STRING}|[A-Za-z_]\w*|0[xX][0-9a-fA-F_]+|\d+(?:\.\d+)?|==|!=|<=|>=|\+=|-=|\*=|\/\/=|\/\/|\*\*|<<=|>>=|<<|>>|->|:=|[^\sA-Za-z_\d])`,
  'g',
);

const tokMemo = new Map<string, string[]>();
const tokenize = (s: string): string[] => {
  let v = tokMemo.get(s);
  if (v === undefined) {
    if (tokMemo.size > 20000) tokMemo.clear();
    tokMemo.set(s, (v = s.match(TOKENS) ?? []));
  }
  return v;
};

/** A line's code tokens (no whitespace): what the option "distance" counts (see `tokenDistance`). */
export function optionTokens(line: string): string[] {
  return tokenize(codeOnly(line)).filter((t) => t.trim() !== '');
}

/** Edit distance between two token lists (one token added, removed or changed costs 1). */
export function tokenDistance(a: readonly string[], b: readonly string[]): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Whether the answer is the unique "center" of a set of options (`options[0]` is the answer): its
 * summed token distance to the others is smaller than every wrong option's. A guesser who picks
 * the most typical option would then always be right.
 */
export function answerIsCenter(options: readonly string[]): boolean {
  if (options.length < 3) return false;
  const toks = options.map(optionTokens);
  const sums = toks.map((a, i) => toks.reduce((n, b, j) => n + (i === j ? 0 : tokenDistance(a, b)), 0));
  return sums.slice(1).every((s) => s > sums[0]);
}

// ── Rules ───────────────────────────────────────────────────────────────────

const SWAP: Record<string, string[]> = {
  '<': ['<=', '>', '>='],
  '<=': ['<', '>=', '>'],
  '>': ['>=', '<', '<='],
  '>=': ['>', '<=', '<'],
  '==': ['!='],
  '!=': ['=='],
  '+': ['-'],
  '-': ['+'],
  '*': ['+'],
  '**': ['*'],
  '+=': ['-='],
  '-=': ['+='],
  '//': ['/', '%'],
  '/': ['//'],
  '%': ['//'],
  '&': ['|'],
  '|': ['&'],
  '^': ['|', '&'],
  '<<': ['>>'],
  '>>': ['<<'],
  and: ['or'],
  or: ['and'],
  while: ['if'],
  break: ['continue', 'return'],
  continue: ['break', 'return'],
  min: ['max'],
  max: ['min'],
  left: ['right', 'mid'],
  right: ['left', 'mid'],
  mid: ['left', 'right'],
  l: ['r', 'm'],
  r: ['l', 'm'],
  m: ['l', 'r'],
  lo: ['hi', 'mid'],
  hi: ['lo', 'mid'],
  i: ['j'],
  j: ['i'],
  start: ['end'],
  end: ['start'],
  slow: ['fast'],
  fast: ['slow'],
  prev: ['curr', 'cur', 'nxt'],
  curr: ['prev', 'nxt'],
  cur: ['prev', 'nxt'],
  nxt: ['prev', 'curr', 'cur'],
  True: ['False'],
  False: ['True'],
  append: ['appendleft'],
  appendleft: ['append'],
  pop: ['popleft'],
  popleft: ['pop'],
  heappush: ['heappop'],
  heappop: ['heappush'],
  add: ['remove', 'discard'],
  remove: ['add'],
  discard: ['add'],
  '^=': ['|=', '&='],
  '|=': ['^=', '&='],
  '&=': ['|=', '^='],
  '*=': ['+='],
  small: ['large'],
  large: ['small'],
  low: ['high'],
  high: ['low'],
  '0': ['1'],
  '1': ['0', '2'],
  '2': ['1', '3'],
  row: ['col'],
  col: ['row'],
  rows: ['cols'],
  cols: ['rows'],
  r1: ['r2'],
  r2: ['r1'],
  c1: ['c2'],
  c2: ['c1'],
  next: ['prev'],
  in: ['not in'],
  is: ['is not'],
  items: ['keys', 'values'],
  keys: ['values'],
  values: ['keys'],
  extend: ['append'],
  None: ['0'],
};

/** Operators that swap only between two operands (a unary `-x`, `*args` stay). */
const BINARY_ONLY = new Set(['+', '-', '*', '**']);

/** Words after which a `+` / `-` / `*` is unary. */
const OPERAND_END = /^([A-Za-z_]\w*|\d[\w.]*|["')\]}])/;
const KEYWORD = new Set([
  'and', 'or', 'not', 'in', 'is', 'if', 'elif', 'else', 'for', 'while', 'return', 'lambda', 'yield', 'await', 'del',
  'assert', 'raise', 'import', 'from', 'as', 'with', 'global', 'nonlocal', 'pass', 'break', 'continue', 'def', 'class',
  'try', 'except', 'finally', 'async', 'None', 'True', 'False',
]);

/**
 * Mutations that read as nonsense rather than as a plausible mistake: a `not` in the wrong place, a
 * name, subscript or attribute compared with (or added to, or taken from) itself (`left < left`,
 * `nums[i] == nums[i]`), the same name twice in a two-name target (`l, l = …`), an assignment to a
 * literal (`True = node.is_end`).
 */
const NONSENSE = new RegExp(
  [
    String.raw`(?<![\w.\])])([A-Za-z_]\w*(?:\.[A-Za-z_]\w*|\[[^\]]*\]|\([^()]*\))*)\s*(?:<=|>=|<|>|==|!=|\+|-|\/\/|\/|%|\^|&|\||\bis(?:\s+not)?\b|\bnot\s+in\b|\bin\b|\band\b|\bor\b)\s*\1(?![\w.(\[])`,
    String.raw`^\s*(?:for\s+)?([A-Za-z_]\w*),\s*\2\b`,
    String.raw`\bfor\b[^:]*\bnot in\b|\bnot not\b|\bnot in not\b|\bis not in\b|\bis not not\b`,
    String.raw`^\s*(?:True|False|None|\d+)\s*=(?!=)`,
    // A name indexed by itself (`start[start]`).
    String.raw`(?<![\w.])([A-Za-z_]\w*)\[\s*\3\s*\]`,
    // A condition that is always false, or an `if` that is always true.
    String.raw`^\s*(?:(?:if|elif|while)\s+(?:False|None|0)|(?:if|elif)\s+True)\s*:`,
    // A statement that is only a value (`None`, `0`, `"N"`) or a name read and dropped (`read`,
    // `self.heap[0]`): it does nothing. (A slice, `nums[::-1]`, is a real mistake: it reverses nothing.)
    String.raw`^\s*(?:None|True|False|-?\d+(?:\.\d+)?|"[^"]*"|'[^']*')\s*$`,
    String.raw`^\s*(?!(?:return|pass|break|continue|raise|yield|else|try|finally)\s*$)[A-Za-z_]\w*(?:\.[A-Za-z_]\w*|\[[^\]:]*\])*\s*$`,
  ].join('|'),
);

/** Changes that do nothing (`+ 0`, `-= 0`, `[-0]`, a unary `+`, `* 1`, `// 1`, `x = x`) or warn (`is 0`). */
const NO_OPS = [
  /[+-]=\s*0(?![\w.])/g,
  /[\w)\]]\s*[+-]\s*0(?![\w.])/g,
  /(?:^|[(\[,=:]|\breturn|\bin)\s*-\s*0(?![\w.])/g,
  /(?:^|[(\[,=:<>]|\breturn|\bin|\band|\bor|\bnot)\s*\+\s*(?=[\w(\[])/g,
  /[\w)\]]\s*(?:\*\*?|\/\/?)\s*1(?![\w.])/g,
  /(?:\*|\/\/)=\s*1(?![\w.])/g,
  /\bis\s+(?:not\s+)?-?\d/g,
  /^\s*([\w.]+)\s*=\s*\1\s*$/g,
  /(?:>>|<<|\||\^)=\s*0(?![\w.])|[\w)\]]\s*(?:>>|<<|\||\^)\s*0(?![\w.])/g,
  // Arithmetic on a string other than `+` (`str(n) - "#"`).
  /["']\s*(?:-|\/\/?)\s|\s(?:-|\/\/?)\s*[rbfuRBFU]{0,2}["']/g,
];
const noOps = (s: string) => NO_OPS.reduce((n, re) => n + (s.match(re)?.length ?? 0), 0) + (pointless(s) ? 1 : 0);

/**
 * Lines that cannot be a mistake anyone makes: a target twice in one assignment or loop
 * (`self.small, self.small = …`, `root.right, root.right = …`), a whole line that sets each target
 * to itself (`dp[i][j] = dp[i][j]`, `prev, curr = prev, curr`), and a remainder that never changes
 * (`n % 1`, `n % 2 == 2`: an `if False:` in disguise).
 */
function pointless(s: string): boolean {
  const k = keyOf(codeOnly(s));
  const f = k.match(/^for (.+?) in /);
  if (f) {
    const t = splitTop(f[1]).map((x) => x.trim());
    if (new Set(t).size < t.length) return true;
  }
  const eq = topLevelAssign(k);
  if (eq.at >= 0 && eq.op === '=' && !/^for /.test(k)) {
    const lhs = splitTop(k.slice(0, eq.at)).map((t) => t.trim());
    const rhs = splitTop(k.slice(eq.at + 1)).map((t) => t.trim());
    if (new Set(lhs).size < lhs.length) return true;
    if (lhs.length === rhs.length && lhs.every((t, i) => t === rhs[i])) return true;
  }
  if (eq.at >= 0 && (eq.op === '&=' || eq.op === '|=') && k.slice(0, eq.at).trim() === k.slice(eq.at + 2).trim()) return true;
  if (/%1(?![\w.])|&0(?![\w.])/.test(k)) return true;
  for (const m of k.matchAll(/%(\d+)(==|!=)(-?\d+)(?![\w.])|(?<![\w.\])])(-?\d+)(==|!=)[\w.]+(?:\[[^\]]*\])*%(\d+)(?![\w.(\[])/g)) {
    const d = Number(m[1] ?? m[6]);
    const v = Number(m[3] ?? m[4]);
    if (d > 0 && (v >= d || v < 0)) return true;
  }
  return false;
}

/** Lines that are structure, not an idea: shown as given, never asked as a pick. */
const GIVEN = /^(@|import\s|from\s+\S+\s+import\s|(async\s+)?def\s|class\s|nonlocal\s|global\s|while True:$|pass$|else:$|try:$|finally:$|except\b.*:$|"""|'''|[)\]}]+[,:]?$)/;

/**
 * Lines a pick should not ask for: structure with no idea to recall (`else:`, `try:`, `pass`, a
 * `def` or `class` line, an import, a lone bracket). Show them as given.
 */
export function isGivenLine(line: string): boolean {
  const code = codeOnly(line).trim();
  return GIVEN.test(code) || !balanced(code);
}

/** A pick needs the answer and at least two wrong options: one option is a free point, two a coin toss. */
export const MIN_PICK_OPTIONS = 3;

/**
 * Whether a line and its options make a real pick: not bare structure (`isGivenLine`) and at least
 * `MIN_PICK_OPTIONS` options. Every pick screen asks only these; a line that is not one is shown as
 * given, or another line is asked in its place.
 */
export function isRealPick(line: string, options: readonly string[]): boolean {
  return !isGivenLine(line) && options.length >= MIN_PICK_OPTIONS;
}

/** A line as an option shows it: the code at its own indentation, without a trailing comment or `#!` marker. */
export function codeOnly(line: string): string {
  let v = codeMemo.get(line);
  if (v === undefined) {
    if (codeMemo.size > 20000) codeMemo.clear();
    codeMemo.set(line, (v = stripComment(line.replace(/\s+#!\s*$/, '')).replace(/\s+$/, '')));
  }
  return v;
}
const codeMemo = new Map<string, string>();

/** The grader's `lineKey`, remembered (option building compares the same lines many times). */
function keyOf(line: string): string {
  let v = keyMemo.get(line);
  if (v === undefined) {
    if (keyMemo.size > 20000) keyMemo.clear();
    keyMemo.set(line, (v = lineKey(line)));
  }
  return v;
}
const keyMemo = new Map<string, string>();

const indentStr = (s: string) => s.match(/^\s*/)?.[0] ?? '';

// ── Context: what the snippet defines ───────────────────────────────────────

type Kind = 'list' | 'set' | 'dict' | 'deque' | 'str' | 'num' | 'bool' | 'node';

const METHODS: Record<Kind, Set<string>> = {
  list: new Set(['append', 'extend', 'pop', 'insert', 'remove', 'sort', 'reverse', 'index', 'count', 'copy', 'clear']),
  set: new Set(['add', 'remove', 'discard', 'pop', 'union', 'intersection', 'difference', 'update', 'copy', 'clear', 'issubset']),
  dict: new Set(['get', 'items', 'keys', 'values', 'pop', 'setdefault', 'update', 'copy', 'clear', 'most_common']),
  deque: new Set(['append', 'appendleft', 'pop', 'popleft', 'extend', 'extendleft', 'rotate', 'clear', 'copy']),
  str: new Set(['join', 'split', 'strip', 'lstrip', 'rstrip', 'lower', 'upper', 'isalnum', 'isalpha', 'isdigit', 'isspace', 'startswith', 'endswith', 'find', 'replace', 'count', 'index']),
  num: new Set(['bit_length']),
  bool: new Set(),
  node: new Set(),
};
const DEQUE_ONLY = new Set(['appendleft', 'popleft', 'extendleft', 'rotate']);
const NOT_CONTAINER = new Set<Kind>(['num', 'bool', 'node']);

const BUILTINS = new Set([
  'len', 'range', 'min', 'max', 'abs', 'set', 'dict', 'list', 'tuple', 'float', 'int', 'str', 'bool', 'sorted', 'sum',
  'enumerate', 'zip', 'ord', 'chr', 'any', 'all', 'reversed', 'divmod', 'pow', 'round', 'isinstance', 'map', 'filter',
  'print', 'self', 'heapq', 'collections', 'math', 'deque', 'defaultdict', 'Counter', 'object', 'super', 'iter', 'next',
  'frozenset', 'hash', 'bin', 'hex', 'id', 'type', 'Optional', 'List', 'Dict', 'Set', 'Tuple', 'ListNode', 'TreeNode', 'Node',
]);

const NUM_CALLS = /^(len|int|ord|abs|sum|float|round|pow|divmod)$/;

/** Unannotated parameters taken for strings (a pattern template's `def balanced(s):`). */
const STR_PARAM = /^(s|t|word|text)$/;

/** The kind of value an expression gives, from literals, a few calls, and the kinds of names it uses. */
function kindOfExpr(e: string, kinds: ReadonlyMap<string, Kind>): Kind | undefined {
  const s = e.trim();
  if (!s) return undefined;
  if (/^\[.*\]$|^\[.*\]\s*\*|^list\(|^sorted\(/.test(s)) return 'list';
  if (/^(collections\.)?deque\(/.test(s)) return 'deque';
  if (/^\{\s*\}$|^\{.*:.*\}$|^(dict|defaultdict|collections\.defaultdict|Counter|collections\.Counter)\(/.test(s)) return 'dict';
  if (/^\{[^:]*\}$|^(set|frozenset)\(/.test(s)) return 'set';
  if (/^(?:[rbfu]{0,2})["']|^str\(|\.join\(/.test(s)) return 'str';
  if (/^-?\d+(\.\d+)?$|^0[xX]|^float\(/.test(s)) return 'num';
  if (/^(True|False)$/.test(s)) return 'bool';
  if (/^[A-Z]\w*\(|^[A-Za-z_]\w*\.(next|left|right)$/.test(s)) return 'node';
  if (/^[A-Za-z_]\w*$/.test(s)) return kinds.get(s);
  // Arithmetic over numbers: `(l + r) // 2`, `len(nums) - 1`, `max(best, r - l + 1)`.
  if (/^[\w\s()+\-*/%.,]+$/.test(s) && !/\.\w/.test(s.replace(/\d\.\d/g, ''))) {
    const toks = s.match(/[A-Za-z_]\w*|\(|\)/g) ?? [];
    let all = true;
    toks.forEach((t, k) => {
      if (!/^[A-Za-z_]/.test(t)) return;
      if (toks[k + 1] === '(') {
        if (!NUM_CALLS.test(t) && t !== 'min' && t !== 'max') all = false;
        return;
      }
      if (kinds.get(t) !== 'num' && !(k > 0 && toks[k - 1] === '(' && /^len$/.test(toks[k - 2] ?? ''))) all = false;
    });
    if (all && /[-+*/%]|^(len|min|max|abs|int|ord|sum)\(/.test(s)) return 'num';
  }
  return undefined;
}

function kindOfAnnotation(a: string): Kind | undefined {
  const s = a.replace(/\s+/g, '').replace(/^['"]|['"]$/g, '');
  if (/^List\[|^list/.test(s)) return 'list';
  if (/^str$/.test(s)) return 'str';
  if (/^(int|float)$/.test(s)) return 'num';
  if (/^bool$/.test(s)) return 'bool';
  if (/ListNode|TreeNode|Node/.test(s)) return 'node';
  if (/^Set\[|^set/.test(s)) return 'set';
  if (/^Dict\[|^dict/.test(s)) return 'dict';
  return undefined;
}

interface Ctx {
  /** Built from a real snippet (else names and methods are not checked). */
  known: boolean;
  /** Code only, original indentation. */
  lines: string[];
  keys: string[];
  /** Identifiers used anywhere (not attributes). */
  names: Set<string>;
  /** Attribute and method names used anywhere. */
  attrs: Set<string>;
  /** Variable → the first line that binds it. */
  firstBind: Map<string, number>;
  kinds: Map<string, Kind>;
  /** Bound variables (not `self`, functions, classes or imports), in the order first bound. */
  vars: string[];
  /** Names bound by a `for`. */
  loopVars: Set<string>;
  /** `contextKey` of the snippet. */
  denyKey: string;
  /** Per class (by its line), the attributes set on `self` (`self.stack = []`), with their kinds when known. */
  selfKinds: Map<number, Map<string, Kind | undefined>>;
  /** Per line, the line of the class it sits in (-1 outside any). */
  classOf: number[];
  /** Per line, the names it uses (not attributes). */
  lineIdents: (Map<string, number> | undefined)[];
  /** Every line that binds each name. */
  binds: Map<string, number[]>;
  /** Per line, the `def` line of the function it sits in (-1 at the top); each function's parent function. */
  fnOf: number[];
  parentFn: Map<number, number>;
  /** Per line, its section of a pattern template (0 in a solution). */
  secOf: number[];
  /** Names bound only by a comprehension (`s` of `[-s for s in stones]`): out of scope on any other line. */
  compOnly: Set<string>;
  /** Each function's `def` lines by name, and whether it is a class's method (never a bare name). */
  defLines: Map<string, { line: number; method: boolean }[]>;
  hasDeque: boolean;
}

/** Identifiers that are not attributes (with how often each appears), and `recv.attr` pairs (`*` when the receiver is not a name). */
function scan(code: string): { idents: Map<string, number>; pairs: Set<string>; attrs: Set<string> } {
  const toks = tokenize(code).filter((t) => t.trim() !== '');
  const idents = new Map<string, number>();
  const pairs = new Set<string>();
  const attrs = new Set<string>();
  let parens = 0;
  toks.forEach((t, k) => {
    if (t === '(') parens++;
    else if (t === ')') parens--;
    if (!/^[A-Za-z_]/.test(t) || /^[rbfuRBFU]{0,2}["']/.test(t)) return;
    if (toks[k - 1] === '.') {
      attrs.add(t);
      const recv = toks[k - 2] ?? '';
      pairs.add(`${/^[A-Za-z_]\w*$/.test(recv) ? recv : '*'}.${t}${toks[k + 1] === '(' ? '()' : ''}`);
      return;
    }
    // A keyword argument's name (`key=…` in a call).
    if (parens > 0 && toks[k + 1] === '=' && (toks[k - 1] === '(' || toks[k - 1] === ',')) return;
    if (!KEYWORD.has(t)) idents.set(t, (idents.get(t) ?? 0) + 1);
  });
  return { idents, pairs, attrs };
}

/** Names a line binds: `for` targets, plain-assignment targets, a walrus, `as` names. */
function lineTargets(code: string): string[] {
  const s = code.trim();
  const out: string[] = [];
  const names = (t: string) => out.push(...(t.match(/[A-Za-z_]\w*/g) ?? []).filter((n) => !KEYWORD.has(n)));
  const f = s.match(/^(?:async\s+)?for\s+(.+?)\s+in\b/);
  if (f) names(f[1]);
  for (const target of assignChain(s)?.targets ?? []) {
    for (const t of splitTop(target)) if (/^\s*\(?\s*\*?[A-Za-z_]\w*\s*\)?\s*$/.test(t)) names(t);
  }
  for (const m of s.matchAll(/([A-Za-z_]\w*)\s*:=/g)) out.push(m[1]);
  for (const m of s.matchAll(/\bas\s+([A-Za-z_]\w*)/g)) out.push(m[1]);
  return out;
}

/** The targets of a plain assignment, chained ones too (`dummy = tail = ListNode()`), and the value; null for any other line. */
function assignChain(s: string): { targets: string[]; value: string } | null {
  const first = topLevelAssign(s);
  if (first.at < 0 || first.op !== '=') return null;
  const targets = [s.slice(0, first.at)];
  let value = s.slice(first.at + 1);
  for (let next = topLevelAssign(value); next.at >= 0 && next.op === '='; next = topLevelAssign(value)) {
    targets.push(value.slice(0, next.at));
    value = value.slice(next.at + 1);
  }
  return { targets, value };
}

/** Names bound by every `for` in a line, a comprehension's included (`i` of `deque(i for i in range(n))`). */
function loopNames(code: string): string[] {
  return [...code.matchAll(/\bfor\s+([A-Za-z_][\w\s,()]*?)\s+in\b/g)].flatMap((m) => (m[1].match(/[A-Za-z_]\w*/g) ?? []).filter((n) => !KEYWORD.has(n)));
}

const ctxCache = new Map<string, Ctx>();

/** A name used as a sequence: measured, enumerated, sorted, looped over or indexed. */
const SEQ_USE = /\b(?:enumerate|len|sorted|zip|reversed)\(\s*([A-Za-z_]\w*)|\bfor\s+[\w\s,()]+\s+in\s+([A-Za-z_]\w*)\s*:|(?<![\w.])([A-Za-z_]\w*)\[/g;

function buildCtx(code: readonly string[], known: boolean): Ctx {
  const lines = code.map(codeOnly);
  const memo = `${known ? 1 : 0}\n${lines.join('\n')}`;
  const hit = ctxCache.get(memo);
  if (hit) return hit;
  const names = new Set<string>();
  const attrs = new Set<string>();
  const firstBind = new Map<string, number>();
  const kinds = new Map<string, Kind>();
  const notVars = new Set<string>(['self', '_']);
  const bound: { n: string; rhs: string }[] = [];
  const loopVars = new Set<string>();
  const compVars = new Set<string>();
  const defLines = new Map<string, { line: number; method: boolean }[]>();
  const lineIdents: Map<string, number>[] = [];
  const seqs = new Set<string>();
  const selfKinds = new Map<number, Map<string, Kind | undefined>>();
  const classOf: number[] = [];
  let cls = -1;
  const binds = new Map<string, number[]>();
  const bind = (n: string, i: number, kind?: Kind) => {
    if (!firstBind.has(n)) firstBind.set(n, i);
    binds.set(n, [...(binds.get(n) ?? []), i]);
    if (kind && !kinds.has(n)) kinds.set(n, kind);
  };
  // A pattern template's numbered sections (`# 2. BFS: …`) are separate examples: a name set in one
  // is not a fair stand-in in another.
  const secOf: number[] = [];
  let sec = 0;
  code.forEach((raw, i) => {
    if (/^#\s*\d+[.)]\s/.test(raw)) sec++;
    secOf[i] = sec;
  });
  // The function each line sits in (a `def` line: its own, for its parameters), and each function's parent.
  const fnOf: number[] = [];
  const parentFn = new Map<number, number>();
  const open: number[] = [];
  lines.forEach((line, i) => {
    if (!line.trim()) {
      fnOf[i] = open[open.length - 1] ?? -1;
      return;
    }
    const ind = indentStr(line).length;
    while (open.length && indentStr(lines[open[open.length - 1]]).length >= ind) open.pop();
    if (/^\s*(async\s+)?def\s/.test(line)) {
      parentFn.set(i, open[open.length - 1] ?? -1);
      open.push(i);
    }
    fnOf[i] = open[open.length - 1] ?? -1;
  });
  lines.forEach((line, i) => {
    const s = line.trim();
    if (s && cls >= 0 && indentStr(line).length <= indentStr(lines[cls]).length && !/^class\s/.test(s)) cls = -1;
    if (/^class\s/.test(s)) cls = i;
    classOf[i] = cls;
    if (!s) return;
    const sc = scan(s);
    sc.idents.forEach((_, n) => names.add(n));
    lineIdents[i] = sc.idents;
    for (const m of s.matchAll(SEQ_USE)) seqs.add(m[1] ?? m[2] ?? m[3]);
    sc.attrs.forEach((a) => attrs.add(a));
    const def = s.match(/^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\((.*)\)/);
    if (def) {
      notVars.add(def[1]);
      defLines.set(def[1], [...(defLines.get(def[1]) ?? []), { line: i, method: cls >= 0 && (parentFn.get(i) ?? -1) < 0 }]);
      for (const p of splitTop(def[2])) {
        const m = p.trim().match(/^\**([A-Za-z_]\w*)\s*(?::\s*([^=]+))?/);
        // A pattern template's parameters have no annotations: `s` or `word` is a string there.
        if (m && m[1] !== 'self') bind(m[1], i, m[2] ? kindOfAnnotation(m[2]) : STR_PARAM.test(m[1]) ? 'str' : undefined);
      }
      return;
    }
    const klass = s.match(/^class\s+([A-Za-z_]\w*)/);
    if (klass) return void notVars.add(klass[1]);
    if (/^(import|from)\s/.test(s)) {
      for (const n of s.replace(/^from\s+\S+\s+/, '').replace(/^import\s+/, '').split(/[\s,]+/)) notVars.add(n);
      return;
    }
    for (const m of s.matchAll(/\bfor\s+([A-Za-z_][\w\s,()]*?)\s+in\s+(\w+)?/g)) {
      const ns = m[1].match(/[A-Za-z_]\w*/g) ?? [];
      // A comprehension's own name (`c` of `[-c for c in counts.values()]`) lives only inside it.
      if (!/^(?:async\s+)?$/.test(s.slice(0, m.index))) {
        ns.forEach((n) => compVars.add(n));
        continue;
      }
      ns.forEach((n) => loopVars.add(n));
      ns.forEach((n, k) => bind(n, i, m[2] === 'range' || (m[2] === 'enumerate' && k === 0 && ns.length === 2) ? 'num' : undefined));
      if (ns.length === 1 && m[2]) bound.push({ n: ns[0], rhs: `for:${m[2]}` });
    }
    for (const m of s.matchAll(/\blambda\s+([^:]*):/g)) for (const n of m[1].match(/[A-Za-z_]\w*/g) ?? []) notVars.add(n);
    const chain = assignChain(s);
    for (const target of chain?.targets ?? []) {
      const lhs = splitTop(target);
      const rhs = splitTop(chain!.value);
      lhs.forEach((t, k) => {
        const m = t.trim().match(/^\(?\s*\*?([A-Za-z_]\w*)\s*\)?$/);
        if (!m) return;
        bind(m[1], i);
        bound.push({ n: m[1], rhs: lhs.length === rhs.length ? rhs[k] : lhs.length === 1 ? chain!.value : '' });
      });
    }
    for (const m of s.matchAll(/([A-Za-z_]\w*)\s*:=/g)) bind(m[1], i);
    for (const m of s.matchAll(/\bas\s+([A-Za-z_]\w*)/g)) bind(m[1], i);
    const selfSet = s.match(/^self\.([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (selfSet) {
      const attrs = selfKinds.get(cls) ?? new Map<string, Kind | undefined>();
      selfKinds.set(cls, attrs);
      if (!attrs.get(selfSet[1])) attrs.set(selfSet[1], kindOfExpr(selfSet[2], kinds));
    }
  });
  // Kinds from what each name is first set to, twice so `n = len(nums)` helps `r = n - 1`.
  for (let pass = 0; pass < 2; pass++) {
    for (const { n, rhs } of bound) {
      if (kinds.has(n)) continue;
      const k = rhs.startsWith('for:') ? (kinds.get(rhs.slice(4)) === 'str' ? 'str' : undefined) : kindOfExpr(rhs, kinds);
      if (k) kinds.set(n, k);
    }
  }
  // Still unknown: a name looped over, measured or indexed is a list (near enough: a sequence).
  for (const n of seqs) if (firstBind.has(n) && !kinds.has(n)) kinds.set(n, 'list');
  const vars = [...firstBind.keys()].filter((n) => !notVars.has(n) && !KEYWORD.has(n));
  const ctx: Ctx = {
    known,
    lines,
    keys: lines.map((l) => keyOf(l)),
    names,
    attrs,
    firstBind,
    kinds,
    vars,
    loopVars,
    selfKinds,
    classOf,
    lineIdents,
    binds,
    fnOf,
    parentFn,
    secOf,
    compOnly: new Set([...compVars].filter((n) => !binds.has(n))),
    defLines,
    hasDeque: /\bdeque\b/.test(lines.join('\n')),
    denyKey: hashString(lines.join('\n')).toString(36),
  };
  if (ctxCache.size > 400) ctxCache.clear();
  ctxCache.set(memo, ctx);
  return ctx;
}

// ── Meaning: when two lines say the same thing ─────────────────────────────

/** Top-level comparison operators of an expression (outside brackets and strings). */
function topLevelCompares(e: string): { op: string; at: number }[] {
  const out: { op: string; at: number }[] = [];
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < e.length; i++) {
    const ch = e[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    else if (depth === 0) {
      const m = e.slice(i).match(/^(<=|>=|==|!=|<|>| is not | is | not in | in )/);
      if (m && !(m[1] === '<' && e[i - 1] === '<') && !(m[1] === '>' && e[i - 1] === '>') && e[i + m[1].length] !== '<' && e[i + m[1].length] !== '>') {
        out.push({ op: m[1], at: i });
        i += m[1].length - 1;
      }
    }
  }
  return out;
}

/**
 * The comparison key of a line by meaning: `lineKey`, then a single comparison read one way
 * (`a > b` is `b < a`, `a == b` is `b == a`; `a <= b` is `a < b` when `neq` says the two are never
 * equal there), no-ops dropped (`x + 0`, a unary `+`, `range(0, n)`, `return None`), and the two
 * pairs of `a, b = x, y` in name order. Two options with one key mean the same thing.
 */
export function canonKey(line: string, neq: readonly (readonly [string, string])[] = []): string {
  const memo = neq.length ? `${line}\u0000${neq.map((p) => p.join('\u0001')).join('\u0002')}` : line;
  let v = canonMemo.get(memo);
  if (v === undefined) {
    if (canonMemo.size > 20000) canonMemo.clear();
    canonMemo.set(memo, (v = canonOf(line, neq)));
  }
  return v;
}
const canonMemo = new Map<string, string>();

function canonOf(line: string, neq: readonly (readonly [string, string])[]): string {
  let k = keyOf(codeOnly(line))
    .replace(/([\w)\]])[+-]0(?![\w.])/g, '$1')
    .replace(/(^|[(\[,=:<>]|return |in )\+(?=[\w(\[])/g, '$1')
    .replace(/\brange\(0,/g, 'range(')
    .replace(/\benumerate\(([^(),]+),0\)/g, 'enumerate($1)')
    .replace(/\brange\(([^(),]+),([^(),]+),1\)/g, 'range($1,$2)')
    .replace(/^return None$/, 'return')
    // `max(a, b)` is `max(b, a)`; `a * b` is `b * a` for two plain names or numbers.
    .replace(/\b(min|max)\(([^(),]+),([^(),]+)\)/g, (_, f: string, x: string, y: string) => `${f}(${[x, y].sort().join(',')})`)
    .replace(/(?<![\w.\])*])([A-Za-z_]\w*|\d+)\*([A-Za-z_]\w*|\d+)(?![\w.(\[*])/g, (_, x: string, y: string) => [x, y].sort().join('*'));
  // `a, b = x, y` and `b, a = y, x`.
  const eq = topLevelAssign(k);
  if (eq.at >= 0 && eq.op === '=') {
    const lhs = splitTop(k.slice(0, eq.at));
    const rhs = splitTop(k.slice(eq.at + 1));
    if (lhs.length === 2 && rhs.length === 2 && !/^for /.test(k)) {
      const pairs = lhs.map((t, i) => [t.trim(), rhs[i].trim()] as const).sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
      k = `${pairs.map((p) => p[0]).join(',')}=${pairs.map((p) => p[1]).join(',')}`;
    }
  }
  // A parity test either way round: `n % 2` (and `n & 1`) is only ever 0 or 1, so `!= 0` is `== 1`.
  const PARITY = /(%2|&1)$/;
  k = k.replace(/(%2|&1)!=([01])(?![\w.])/g, (_, p: string, d: string) => `${p}==${1 - Number(d)}`);
  // One comparison in a condition or a return (`lineKey` drops the space before a bracket: `if(a)>b:`).
  const m = k.match(/^(if|elif|while|return|assert)(?: |(?=[^\w\s]))(.*?)(:?)$/);
  if (m) {
    const [, word, expr, colon] = m;
    const cmps = topLevelCompares(expr);
    if (cmps.length === 1 && !/\b(and|or|lambda)\b|\bif\b.*\belse\b/.test(expr)) {
      let { op } = cmps[0];
      let a = expr.slice(0, cmps[0].at).trim();
      let b = expr.slice(cmps[0].at + op.length).trim();
      const unequal = neq.some(([x, y]) => (keyOf(x) === a && keyOf(y) === b) || (keyOf(x) === b && keyOf(y) === a));
      if (unequal && op === '<=') op = '<';
      if (unequal && op === '>=') op = '>';
      if (op === '>' || op === '>=') [a, b, op] = [b, a, op === '>' ? '<' : '<='];
      if (op === '!=' && ((PARITY.test(a) && /^[01]$/.test(b)) || (PARITY.test(b) && /^[01]$/.test(a)))) {
        op = '==';
        if (/^[01]$/.test(b)) b = String(1 - Number(b));
        else a = String(1 - Number(a));
      }
      if ((op === '==' || op === '!=' || op === ' is ' || op === ' is not ') && a > b) [a, b] = [b, a];
      k = `${word} ${a}${op}${b}${colon}`;
    }
  }
  return k;
}

// ── Meaning in place: lines that differ in code but do the same where the answer stands ──

/** `canonKey`, then what it means at the answer's place (`contextCanon`), remembered per answer. */
function canonIn(a: Answer, s: string): string {
  const k = canonKey(s, a.neq);
  let v = a.canons.get(k);
  if (v === undefined) a.canons.set(k, (v = a.at >= 0 && a.ctx.known ? contextCanon(a, k) : k));
  return v;
}

/**
 * A line's `canonKey` with what its place in the snippet settles (two options with one key do the
 * same there, so a set never holds both, and one with the answer's key is never offered):
 * - a dummy node's value that nothing reads (`dummy = ListNode(1, head)` is `ListNode(0, head)`), and
 *   `dummy.next` while it is still the `head` it was made with;
 * - a test whose result is known: `x is y` between two containers the code makes (`False`), a
 *   container `is None` (`False`), `n in nums` inside `for n in nums:` (`True`);
 * - in a yes/no function (`isBoolFn`), every false value (`None`, `""`, `0`, `[]`) is `False`;
 * - a call of a function that returns nothing, returned or kept in what the function returns
 *   (`return backtrack(0)`, `res = backtrack(1)`): the function returns `None`, whatever the arguments;
 * - the last line's call with its result dropped (`dfs(0, self.root)` for `return dfs(0, self.root)`)
 *   of a function that only computes it: the function returns `None`.
 */
function contextCanon(a: Answer, key: string): string {
  const { ctx } = a;
  const sn = snippetOf(ctx);
  const fn = ctx.fnOf[a.at] ?? -1;
  let k = key;
  const lineKeys = ctx.keys;
  // 1. Dummy nodes.
  k = k.replace(/^([A-Za-z_]\w*)=(ListNode|TreeNode|Node)\(-?\d+(?=[,)])/, (m, d: string, c: string) => (valUnread(ctx, d) ? `${d}=${c}(0` : m));
  for (let j = a.at - 1; j >= 0 && (ctx.fnOf[j] ?? -1) === fn; j--) {
    const made = lineKeys[j].match(/^([A-Za-z_]\w*)=ListNode\([^,()]*,([A-Za-z_]\w*)\)$/);
    if (!made) continue;
    const [, d, h] = made;
    const between = lineKeys.slice(j + 1, a.at);
    if (between.some((l) => l.startsWith(`${d}.next=`) || new RegExp(`^${h}=`).test(l))) continue;
    k = k.replace(new RegExp(String.raw`(?<![\w.])${d}\.next\b`, 'g'), h);
  }
  // 2. Tests with a known result.
  const t = k.match(/^(if|elif|while|return) (.+?)(:?)$/);
  if (t && !/\b(and|or|lambda|if|for)\b/.test(t[2])) {
    const v = knownTest(a, t[2]);
    if (v) k = `${t[1]} ${v}${t[3]}`;
  }
  // 3. A yes/no function's false values.
  if (fn >= 0 && sn.boolFns.has(fn) && /^return(?:\s*(?:None|False|""|0|\[\]|\{\}|set\(\)))?$/.test(k)) k = 'return False';
  // 4. A call of a function that returns nothing, returned or kept in what is returned.
  const kept = k.match(/^(?:return |([A-Za-z_]\w*)=)(?:self\.)?([A-Za-z_]\w*)\(.*\)$/);
  if (kept && sn.noValue.has(kept[2]) && sn.defs.has(kept[2])) {
    const later = laterLines(a).filter((j) => (ctx.fnOf[j] ?? -1) === fn);
    if (!kept[1] || later.some((j) => lineKeys[j] === `return ${kept[1]}`)) k = `return ${kept[2]}(…)`;
  }
  // 5. The last line's call, its result dropped: what it changes is gone once the function returns.
  const bare = k.match(/^((?:self\.)?([A-Za-z_]\w*))\(.*\)$/);
  if (
    bare &&
    (sn.pure.has(bare[1]) || quietInside(ctx, bare[1], fn)) &&
    new RegExp(String.raw`^return ${bare[1].replace('.', '\\.')}\(`).test(a.key) &&
    !laterLines(a).some((j) => (ctx.fnOf[j] ?? -1) === fn)
  )
    k = 'return';
  return k;
}

/**
 * Whether `name` is a helper defined inside function `fn` that changes only `fn`'s own names
 * (`read()` of `deserialize`, which moves `i`): nothing outside `fn` sees what it does.
 */
function quietInside(ctx: Ctx, name: string, fn: number): boolean {
  if (fn < 0) return false;
  const d = (snippetOf(ctx).defs.get(name) ?? []).find((x) => x.parent === fn);
  if (!d) return false;
  const outer = new Set(snippetOf(ctx).defs.get(ctx.lines[fn].match(/def\s+([A-Za-z_]\w*)/)?.[1] ?? '')?.find((x) => x.line === fn)?.params ?? []);
  return bodyOf(ctx, d.line).every((j) => {
    const t = ctx.lines[j].trim();
    if (/\bself\./.test(t) && /=|\.(append|pop|add|remove|insert|extend|update|clear|discard)\(/.test(t)) return false;
    return ![...outer].some((p) => new RegExp(String.raw`(?<![\w.])${p}(?:\[[^\]]*\])*\s*(?:[-+*/%|&^]?=(?!=)|\.(?:append|pop|add|remove|insert|extend|update|clear|discard|sort|reverse)\()`).test(t));
  });
}

/** Whether nothing reads a node's `.val`: neither on it nor on a name set to it (`tail = dummy`). */
function valUnread(ctx: Ctx, d: string): boolean {
  const users = snippetOf(ctx).users.get('val') ?? [];
  const names = [d, ...ctx.keys.flatMap((l) => l.match(new RegExp(`^([A-Za-z_]\\w*)=${d}$`))?.[1] ?? [])];
  return !names.some((n) => users.includes(n));
}

/** `True` or `False` for a test whose result is settled where the answer stands, else ''. */
function knownTest(a: Answer, expr: string): string {
  const { ctx } = a;
  const container = (n: string) => ['list', 'set', 'dict', 'deque'].includes(ctx.kinds.get(n) ?? '');
  const made = (n: string) => (ctx.binds.get(n) ?? []).length === 1 && container(n);
  const id = expr.match(/^([A-Za-z_]\w*) is( not)? ([A-Za-z_]\w*)$/);
  if (id) {
    const [, x, not, y] = id;
    const none = x === 'None' ? y : y === 'None' ? x : '';
    // A container is never `None`; two the code makes are never one object.
    if ((none && container(none)) || (!none && x !== y && made(x) && made(y))) return not ? 'True' : 'False';
  }
  const member = expr.match(/^([A-Za-z_]\w*) (not )?in ([A-Za-z_]\w*)$/);
  if (member) {
    const [, x, not, c] = member;
    // Inside `for x in c:`, `x in c` holds.
    let ind = indentStr(ctx.lines[a.at]).length;
    for (let j = a.at - 1; j >= 0; j--) {
      const l = ctx.lines[j];
      if (!l.trim() || indentStr(l).length >= ind) continue;
      ind = indentStr(l).length;
      if (ctx.keys[j] === `for ${x} in ${c}:`) return not ? 'False' : 'True';
      if (/^\s*(async\s+)?def\b/.test(l) || !ind) break;
    }
  }
  return '';
}

/**
 * Operand pairs known to differ at line `at` of `lines`: an `elif` after `if a == b:` (or `elif`),
 * or a line after a sibling `if a == b:` whose body always leaves (return, break, continue, raise).
 */
function unequalAt(lines: readonly string[], at: number): [string, string][] {
  if (at < 0 || at >= lines.length) return [];
  const ind = indentStr(lines[at]).length;
  const out: [string, string][] = [];
  const eq = (s: string) => s.trim().match(/^(?:if|elif)\s+(.+?)\s*==\s*(.+?)\s*:$/);
  const isElif = /^\s*elif\b/.test(lines[at]);
  let lastBody = '';
  for (let j = at - 1; j >= 0; j--) {
    const s = lines[j];
    if (!s.trim()) continue;
    const ji = indentStr(s).length;
    if (ji > ind) {
      if (!lastBody) lastBody = s.trim();
      continue;
    }
    if (ji < ind) break;
    const m = eq(s);
    if (m && !/\b(and|or)\b/.test(m[1] + m[2]) && (isElif || /^(return|break|continue|raise)\b/.test(lastBody))) out.push([m[1], m[2]]);
    if (!/^\s*elif\b/.test(s)) break;
    lastBody = '';
  }
  return out;
}

/**
 * The deny list's key for a snippet: a hash of its code lines (each `codeOnly`). The same solution
 * gives the same key on every screen, since each passes the whole solution as the context.
 */
export function contextKey(lines: readonly string[]): string {
  return hashString(lines.map(codeOnly).join('\n')).toString(36);
}

const DENY = new Map<string, Map<string, Set<string>>>();
/**
 * The options denied for an answer line in its own solution (`src/content/distractorDeny.ts`) or
 * template (`TEMPLATE_DENY`). A line whose code is in the solution more than once has an entry per
 * line (`lineKey@index`): its own when the answer's place is known (`sure`), else all of them.
 */
function denied(a: Answer): Set<string> | undefined {
  if (a.denied === undefined) a.denied = deniedFor(a) ?? null;
  return a.denied ?? undefined;
}

function deniedFor(a: Answer): Set<string> | undefined {
  if (!DENY.size) for (const [sol, lines] of Object.entries({ ...DISTRACTOR_DENY, ...TEMPLATE_DENY })) DENY.set(sol, new Map(Object.entries(lines).map(([k, v]) => [k, new Set(v)])));
  const entries = DENY.get(a.ctx.denyKey);
  if (!entries) return undefined;
  const plain = entries.get(a.key);
  if (plain) return plain;
  if (a.sure) return entries.get(`${a.key}@${a.at}`);
  const all = [...entries].filter(([k]) => k.startsWith(`${a.key}@`) && /^\d+$/.test(k.slice(a.key.length + 1)));
  return all.length ? new Set(all.flatMap(([, v]) => [...v])) : undefined;
}

const FOR_PAIR = /^(\s*for\s+)([A-Za-z_]\w*)(\s*,\s*)([A-Za-z_]\w*)(\s+in\s+)(.+?)(\s*:\s*)$/;

/** The body of the block a line opens (the lines indented under it), as indices. */
function blockOf(lines: readonly string[], at: number): number[] {
  const ind = indentStr(lines[at]).length;
  const out: number[] = [];
  for (let j = at + 1; j < lines.length; j++) {
    if (!lines[j].trim()) continue;
    if (indentStr(lines[j]).length <= ind) break;
    out.push(j);
  }
  return out;
}

/** The number pairs of a literal like `((1, 0), (-1, 0), (0, 1), (0, -1))`, or null when it is anything else. */
function numberPairs(lit: string): [number, number][] | null {
  const t = lit.trim();
  const pairs = [...t.matchAll(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]);
  return pairs.length >= 2 && !t.replace(/\(\s*-?\d+\s*,\s*-?\d+\s*\)/g, '').replace(/[\s,()[\]]/g, '') ? pairs : null;
}

/** `line` with names renamed at once (`map`: name -> replacement), and a sign flipped where a name's replacement starts with `-`. */
function renamed(line: string, map: ReadonlyMap<string, string>): string {
  const toks = tokenize(line);
  const out = [...toks];
  toks.forEach((t, i) => {
    const to = map.get(t);
    if (to === undefined || toks[i - 1] === '.') return;
    if (!to.startsWith('-')) return void (out[i] = to);
    let p = i - 1;
    while (p >= 0 && !toks[p].trim()) p--;
    if (toks[p] === '+' || toks[p] === '-') {
      out[p] = toks[p] === '+' ? '-' : '+';
      out[i] = to.slice(1);
    } else out[i] = to;
  });
  return out.join('');
}

/**
 * Lines that mean the answer because of a symmetry in its loop (as `canonKey`s): the two names of
 * `for a, b in edges:` the other way round when the body does the same with both
 * (`graph[a].append(b)` and `graph[b].append(a)`), and for a loop over a set of number pairs that
 * stays the same when they trade places or change sign (`((1, 0), (-1, 0), (0, 1), (0, -1))`), the
 * names swapped or negated in the loop or its body (`dfs(r - dr, c + dc)`).
 */
function symmetricTwins(a: Answer): Set<string> {
  if (a.twins) return a.twins;
  const out = new Set<string>();
  a.twins = out;
  const { ctx } = a;
  if (a.at < 0) return out;
  // The answer's own line, then each block around it, nearest first.
  let ind = indentStr(ctx.lines[a.at]).length;
  for (let j = a.at; j >= 0; j--) {
    const l = ctx.lines[j];
    if (!l.trim()) continue;
    if (j < a.at) {
      if (indentStr(l).length >= ind) continue;
      ind = indentStr(l).length;
    }
    const m = l.match(FOR_PAIR);
    if (m && m[2] !== m[4]) {
      const [x, y] = [m[2], m[4]];
      const body = blockOf(ctx.lines, j);
      if (j !== a.at && !body.includes(a.at)) break;
      const swapped = `${m[1]}${y}${m[3]}${x}${m[5]}${m[6]}${m[7]}`;
      // The iterable: a literal, or a name set to one.
      let lit = m[6];
      const b = ctx.firstBind.get(lit.trim());
      if (b !== undefined) lit = ctx.lines[b].slice(topLevelAssign(ctx.lines[b]).at + 1);
      const pairs = numberPairs(lit);
      if (pairs) {
        const set = new Set(pairs.map((p) => p.join(',')));
        for (const swap of [false, true])
          for (const sx of [1, -1])
            for (const sy of [1, -1]) {
              if (!swap && sx === 1 && sy === 1) continue;
              const ok = pairs.every(([p, q]) => set.has(`${sx * (swap ? q : p) || 0},${sy * (swap ? p : q) || 0}`));
              if (!ok) continue;
              if (j === a.at && swap && sx === 1 && sy === 1) out.add(canonIn(a, swapped));
              if (j !== a.at) {
                const map = new Map([
                  [x, `${sx < 0 ? '-' : ''}${swap ? y : x}`],
                  [y, `${sy < 0 ? '-' : ''}${swap ? x : y}`],
                ]);
                out.add(canonIn(a, renamed(a.code, map)));
              }
            }
      } else if (j === a.at) {
        // `for a, b in edges:` whose body reads the same with the two names traded.
        const keys = body.map((k) => ctx.keys[k]).sort();
        const map = new Map([
          [x, y],
          [y, x],
        ]);
        const back = body.map((k) => keyOf(renamed(ctx.lines[k], map))).sort();
        if (keys.length && keys.every((k, i) => k === back[i])) out.add(canonIn(a, swapped));
      }
      break;
    }
    if (j < a.at && !ind) break;
  }
  return out;
}

/** The meanings (`canonKey`) of the options denied for an answer, so no twin of one is offered. */
function deniedCanons(a: Answer): Set<string> {
  return (a.deniedCanons ??= new Set([...(denied(a) ?? [])].map((d) => canonIn(a, d))));
}

// ── Candidates ──────────────────────────────────────────────────────────────

interface Answer {
  /** `definedBefore` answers, remembered. */
  seen: Map<string, boolean>;
  /** `denied`, made on demand (null: none). */
  denied?: Set<string> | null;
  /** `deniedCanons`, made on demand. */
  deniedCanons?: Set<string>;
  /** `symmetricTwins`, made on demand. */
  twins?: Set<string>;
  /** The line's names, words and dots (see `sameWords`), made on demand. */
  words?: string;
  /** `canonIn` answers, by `canonKey`. */
  canons: Map<string, string>;
  code: string;
  indent: string;
  key: string;
  canon: string;
  neq: [string, string][];
  toks: string[];
  idents: Map<string, number>;
  pairs: Set<string>;
  targets: string[];
  /** Names this line binds first: never renamed, and never read by an option. */
  introduced: Set<string>;
  noOps: number;
  at: number;
  /** `at` is the answer's own line, from the caller (not found by its code, which may be on two lines). */
  sure: boolean;
  ctx: Ctx;
}

function answerInfo(code: string, ctx: Ctx, at?: number, sure = false): Answer {
  const key = keyOf(code);
  const known = at !== undefined && at >= 0 && ctx.keys[at] === key;
  const idx = known ? at : ctx.keys.indexOf(key);
  const neq = unequalAt(ctx.lines, idx);
  const sc = scan(code);
  const targets = lineTargets(code);
  const isFor = /^\s*(async\s+)?for\b/.test(code);
  // The lines of the answer's function before it: a name not on any of them is new here.
  let from = 0;
  if (idx >= 0) {
    const ind = indentStr(ctx.lines[idx]).length;
    for (let j = idx - 1; j >= 0; j--) {
      if (/^\s*(async\s+)?def\s/.test(ctx.lines[j]) && indentStr(ctx.lines[j]).length < ind) {
        from = j;
        break;
      }
    }
  }
  const usedEarlier = (n: string) => {
    for (let j = from; j < idx; j++) if (ctx.lineIdents[j]?.has(n)) return true;
    return false;
  };
  const introduced = new Set([...targets.filter((n) => isFor || idx < 0 || !usedEarlier(n)), ...loopNames(code)]);
  const a: Answer = {
    code,
    indent: indentStr(code),
    key,
    canon: '',
    neq,
    toks: tokenize(code).filter((t) => t.trim() !== ''),
    idents: sc.idents,
    pairs: sc.pairs,
    targets,
    introduced,
    noOps: noOps(code),
    at: idx,
    sure: sure && known,
    ctx,
    seen: new Map(),
    canons: new Map(),
  };
  a.canon = canonIn(a, code);
  return a;
}

/** Whether `name` exists before the answer's line (a variable bound earlier, a builtin, a function). */
function definedBefore(name: string, a: Answer): boolean {
  let v = a.seen.get(name);
  if (v === undefined) a.seen.set(name, (v = definedAt(name, a)));
  return v;
}

function definedAt(name: string, a: Answer): boolean {
  const { ctx } = a;
  if (BUILTINS.has(name) || KEYWORD.has(name)) return true;
  if (!ctx.names.has(name) || ctx.compOnly.has(name)) return false;
  const lines = ctx.binds.get(name);
  // A function of the snippet is there inside itself, or after its `def` in the function around it
  // (`backtrack(0)` above `def backtrack` fails; a method is reached through `self.`).
  const defs = ctx.defLines.get(name);
  if (defs && !lines && a.at >= 0) {
    const chainOf = new Set<number>([-1]);
    for (let f = ctx.fnOf[a.at] ?? -1; f >= 0; f = ctx.parentFn.get(f) ?? -1) chainOf.add(f);
    return defs.some((d) => !d.method && (chainOf.has(d.line) || (chainOf.has(ctx.parentFn.get(d.line) ?? -1) && d.line < a.at && dominates(ctx, d.line, a.at))));
  }
  if (!lines || a.at < 0) return true;
  // Bound earlier in the answer's function or one around it (another method's locals do not count).
  // A name the answer's own function sets anywhere is its own there (Python scoping: `pre` of
  // `for pre in needs[course]` hides the outer `pre` in the whole function), and a loop's own name
  // exists only inside the loop (`child` of `for child in …` is not there in another branch, nor
  // after a loop that may not run).
  const fn = ctx.fnOf[a.at] ?? -1;
  const chain = new Set<number>();
  for (let f = fn; f >= 0; f = ctx.parentFn.get(f) ?? -1) chain.add(f);
  chain.add(-1);
  const own = lines.filter((b) => (ctx.fnOf[b] ?? -1) === fn);
  return (own.length ? own : lines).some(
    (b) =>
      b < a.at &&
      chain.has(ctx.fnOf[b] ?? -1) &&
      ctx.secOf[b] === ctx.secOf[a.at] &&
      (!loopBinds(ctx, b, name) || blockOf(ctx.lines, b).includes(a.at)) &&
      dominates(ctx, b, a.at),
  );
}

/**
 * Whether line `b` runs on every way to line `at`: each block around it (an `if`, a loop, a `try`)
 * holds `at` too. A name set inside a loop or one branch may be unset after it (`total` set in a
 * `while` body, read after the loop; `t` of a loop over tweets, read below it).
 */
function dominates(ctx: Ctx, b: number, at: number): boolean {
  const fn = ctx.fnOf[b] ?? -1;
  let ind = indentStr(ctx.lines[b]).length;
  for (let j = b - 1; j > fn; j--) {
    const l = ctx.lines[j];
    // Only block openers count (a statement's first line above its continuation does not).
    if (!l.trim() || !/:\s*$/.test(l)) continue;
    const ji = indentStr(l).length;
    if (ji >= ind) continue;
    ind = ji;
    if (/^\s*((async\s+)?def|class)\b/.test(l)) break;
    if (!blockOf(ctx.lines, j).includes(at)) return false;
    if (!ji) break;
  }
  return true;
}

/** Whether line `b` binds `name` as a `for` loop's own name (not a comprehension's). */
function loopBinds(ctx: Ctx, b: number, name: string): boolean {
  const m = ctx.lines[b].trim().match(/^(?:async\s+)?for\s+(.+?)\s+in\b/);
  return !!m && (m[1].match(/[A-Za-z_]\w*/g) ?? ([] as string[])).includes(name);
}

/** Lines in the answer's function (or a function inside it) after the answer's line. */
function laterLines(a: Answer): number[] {
  const { ctx } = a;
  const fn = ctx.fnOf[a.at] ?? -1;
  const out: number[] = [];
  for (let j = a.at + 1; j < ctx.lines.length; j++) {
    let f = ctx.fnOf[j] ?? -1;
    while (f >= 0 && f !== fn) f = ctx.parentFn.get(f) ?? -1;
    if (f === fn) out.push(j);
  }
  return out;
}

/** Whether a line after the answer's, in its function, reads `name`. */
function readLater(name: string, a: Answer): boolean {
  if (a.at < 0) return false;
  return laterLines(a).some((j) => a.ctx.lineIdents[j]?.has(name) && !(lineTargets(a.ctx.lines[j]).includes(name) && a.ctx.lineIdents[j]?.get(name) === 1));
}

/**
 * Whether setting `name` on the answer's line would make it local to the answer's function while
 * that function reads it from the one around it (a closure's name, with no `nonlocal`).
 */
function shadows(name: string, a: Answer): boolean {
  const { ctx } = a;
  if (a.at < 0) return false;
  const fn = ctx.fnOf[a.at] ?? -1;
  if (fn < 0) return false;
  if ((ctx.binds.get(name) ?? []).some((b) => (ctx.fnOf[b] ?? -1) === fn)) return false;
  let reads = false;
  for (let j = fn + 1; j < ctx.lines.length; j++) {
    if ((ctx.fnOf[j] ?? -1) !== fn) continue;
    if (new RegExp(String.raw`^\s*(nonlocal|global)\b.*\b${name}\b`).test(ctx.lines[j])) return false;
    if (ctx.lineIdents[j]?.has(name)) reads = true;
  }
  return reads;
}

/**
 * A wrong option the rules allow (see the top of this file). `deny` false skips the deny list (for the
 * check script). `extra`: an extra rule's option (`extraMutants`), whose methods may also be checked
 * against the kind of an attribute (`node.children.keys()`: `children` is set to `{}`).
 */
function allowed(s: string, a: Answer, deny = true, fallback = false, extra = false): boolean {
  if (!s.startsWith(a.indent) || !s.trim()) return false;
  const k = keyOf(s);
  if (!k || k === a.key || NONSENSE.test(s) || noOps(s) > a.noOps) return false;
  const canon = canonIn(a, s);
  // The same as the answer where it stands, or a test whose result is known there (`if n in nums:`
  // inside `for n in nums:`, `if stack is None:` for a list): never a real choice.
  if (canon === a.canon || symmetricTwins(a).has(canon) || /^(?:(?:if|elif) True|(?:if|elif|while) False):$/.test(canon)) return false;
  // Denied by its code, or by its meaning: a twin of a denied option runs the same way.
  if (deny && (denied(a)?.has(k) || deniedCanons(a).has(canon))) return false;
  const { ctx } = a;
  if (!ctx.known) return true;
  // `pop(0)` on a deque, set or dict; `[x + 1]` on a dict, or with a string index.
  for (const m of s.matchAll(/([A-Za-z_]\w*)\.pop\(0\)/g)) if (!a.code.includes(m[0]) && /^(deque|set|dict)$/.test(ctx.kinds.get(m[1]) ?? '')) return false;
  const selfAttrs = (a.at >= 0 && ctx.selfKinds.get(ctx.classOf[a.at])) || undefined;
  for (const m of s.matchAll(/(self\.)?([A-Za-z_]\w*)\[([A-Za-z_]\w*) [+-] 1\]/g)) {
    if (a.code.includes(m[0])) continue;
    const base = m[1] ? selfAttrs?.get(m[2]) : ctx.kinds.get(m[2]);
    if (base === 'dict' || base === 'set' || ctx.kinds.get(m[3]) === 'str') return false;
  }
  // Only operators, numbers or strings changed (`<` / `<=`, `1` / `2`): no name or method to check.
  if (!fallback && sameWords(s, a)) return true;
  const sc = scan(s);
  const targets = lineTargets(s);
  // A fallback line is another real line of the snippet: a name it only sets need not exist yet.
  const sets = fallback ? new Set(targets.filter((n) => ctx.names.has(n) && sc.idents.get(n) === 1)) : new Set<string>();
  // Its own comprehension's name (`c` of `[-c for c in counts]`) is bound where it is read.
  const ownComp = new Set(loopNames(s));
  for (const [n, count] of sc.idents) {
    const had = a.idents.get(n) ?? 0;
    // Every name it reads exists at the answer's place: bound before it in its function or one around
    // it, never only later (`return length` above `length` is set) or inside a comprehension.
    if (!had && !sets.has(n) && !ownComp.has(n) && !definedBefore(n, a)) return false;
    // A name the line binds first is not there to read yet (`m = (m + r) // 2`, `tail = tail.next`
    // for `tail = dummy`).
    if (count > had && a.introduced.has(n)) return false;
  }
  // A name the line introduces (a loop variable, a new variable) is never renamed: only reordered.
  // A fallback line may leave one out only when no later line reads it (`stack = []` for
  // `pairs = {...}` leaves `pairs` unset for the loop below).
  if (a.introduced.size) {
    const t = new Set([...targets, ...loopNames(s)]);
    for (const n of a.introduced) if (!t.has(n) && (!fallback || readLater(n, a))) return false;
  }
  // Setting a name the function only reads from the one around it makes it local there, and the read
  // fails (`tokens = data.split(',')` inside `read()`).
  for (const n of targets) if (!a.targets.includes(n) && shadows(n, a)) return false;
  for (const p of sc.pairs) {
    if (a.pairs.has(p)) continue;
    const call = p.endsWith('()');
    const [recv, attrRaw] = p.split('.');
    const attr = attrRaw.replace('()', '');
    if (!call) {
      if (!ctx.attrs.has(attr)) return false;
      continue;
    }
    if (recv === 'heapq') {
      if (!/^heap/.test(attr)) return false;
      continue;
    }
    const kind = ctx.kinds.get(recv) ?? (extra ? snippetOf(ctx).attrKinds.get(recv) : undefined);
    if (kind) {
      if (!METHODS[kind].has(attr)) return false;
    } else if (!ctx.attrs.has(attr) || (DEQUE_ONLY.has(attr) && !ctx.hasDeque)) return false;
  }
  // `heappop` takes the heap only, `heappush` the heap and an item; `.reverse()` nothing; the
  // snippet's own functions and classes what they declare (`Node(key)` for `Node(key, val)`).
  const own = snippetOf(ctx).defs;
  if (arityErrors(s, own) + ownArityErrors(s, ctx) > arityErrors(a.code, own) + ownArityErrors(a.code, ctx)) return false;
  // A loop turned into an `if` around a `break` or `continue` does not compile.
  if (/^\s*if\b/.test(s) && /^\s*while\b/.test(a.code) && a.at >= 0) {
    const ind = a.indent.length;
    for (let j = a.at + 1; j < ctx.lines.length; j++) {
      const l = ctx.lines[j];
      if (!l.trim()) continue;
      if (indentStr(l).length <= ind) break;
      if (/^\s*(break|continue)\b/.test(l)) return false;
    }
  }
  return true;
}

/** How many arguments common functions and methods take (`[fewest, most]`). */
const ARITY: Record<string, [number, number]> = {
  heappush: [2, 2], heappop: [1, 1], reverse: [0, 0], popleft: [0, 0], keys: [0, 0], values: [0, 0], items: [0, 0],
  copy: [0, 0], clear: [0, 0], append: [1, 1], appendleft: [1, 1], add: [1, 1], remove: [1, 1], discard: [1, 1],
  extend: [1, 1], pop: [0, 1], insert: [2, 2], get: [1, 2],
};

/** Calls of `ARITY` functions and methods with the wrong number of arguments (`own`: the snippet's functions, whose `self.insert(node)` is no list method). */
function arityErrors(s: string, own?: ReadonlyMap<string, unknown>): number {
  let n = 0;
  for (const m of s.matchAll(/(?:\.|\bheapq\.)?\b(heappush|heappop|reverse|popleft|keys|values|items|copy|clear|append|appendleft|add|remove|discard|extend|pop|insert|get)\(/g)) {
    if (!m[0].startsWith('.') && !/^heap/.test(m[1])) continue;
    if (own?.has(m[1]) && /\bself$/.test(s.slice(0, m.index))) continue;
    const [lo, hi] = ARITY[m[1]];
    const args = callArgs(s, m.index! + m[0].length);
    if (args < lo || args > hi) n++;
  }
  return n;
}

/** Calls of the snippet's own functions, methods and classes with an argument count none of their definitions takes. */
function ownArityErrors(s: string, ctx: Ctx): number {
  const { defs } = snippetOf(ctx);
  let n = 0;
  for (const m of s.matchAll(/(?<![\w.])(self\.)?([A-Za-z_]\w*)\(/g)) {
    const classLine = m[1] ? -1 : ctx.lines.findIndex((l) => new RegExp(`^\\s*class\\s+${m[2]}\\b`).test(l));
    const ds = classLine >= 0 ? (defs.get('__init__') ?? []).filter((d) => d.cls === classLine) : (defs.get(m[2]) ?? []).filter((d) => (m[1] ? d.cls >= 0 : true));
    if (!ds.length) continue;
    const args = callArgs(s, m.index! + m[0].length);
    if (!ds.some((d) => args >= d.required && args <= d.most)) n++;
  }
  return n;
}

/** How many top-level arguments a call has, from just after its `(`. */
function callArgs(s: string, from: number): number {
  let depth = 0;
  let n = 0;
  let any = false;
  for (let i = from; i < s.length; i++) {
    const ch = s[i];
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) {
      if (depth === 0) return any ? n + 1 : 0;
      depth--;
    } else if (ch === ',' && depth === 0) n++;
    else if (ch.trim()) any = true;
  }
  return n + 1;
}

/** Whether `s` has the answer's names, words and dots in the same order (only operators, numbers or strings differ). */
function sameWords(s: string, a: Answer): boolean {
  const words = (toks: readonly string[]) => toks.filter((t) => /^[A-Za-z_.]/.test(t) && !/^[rbfuRBFU]{0,2}["']/.test(t)).join(' ');
  return words(tokenize(s).filter((t) => t.trim() !== '')) === (a.words ??= words(a.toks));
}

/** The first-order changes to a line (the rules at the top of this file), before any filter but the basic ones. */
function rawMutants(line: string): string[] {
  return [...new Set([...swapMutants(line), ...ruleMutants(line)])].filter((s) => s !== line);
}

/** One token swapped (`SWAP`): an operator, a bound, a pointer, a method, a literal. */
function swapMutants(line: string): string[] {
  const code = line.trim();
  if (!code || GIVEN.test(code)) return [];
  const toks = tokenize(line);
  const out: string[] = [];
  const firstWord = toks.findIndex((t) => t.trim() !== '');
  const prevTok = (i: number) => {
    for (let j = i - 1; j >= 0; j--) if (toks[j].trim() !== '') return toks[j];
    return '';
  };
  toks.forEach((t, i) => {
    const alts = SWAP[t];
    if (!alts) return;
    // `while` → `if` only as the statement (never `if` → `while`: when the body always returns, the two
    // run the same, and before an `elif` it does not compile).
    if (t === 'while' && i !== firstWord) return;
    if (BINARY_ONLY.has(t)) {
      const p = prevTok(i);
      if (!OPERAND_END.test(p) || KEYWORD.has(p)) return;
      // `[0] * n` makes a list: `[0] + n` is not a mistake anyone makes.
      if (t === '*' && p === ']') return;
    }
    for (const alt of alts) {
      const copy = [...toks];
      copy[i] = alt;
      out.push(copy.join(''));
    }
  });
  return out;
}

/** The other first-order rules: an off-by-one, operands swapped, a `not` dropped, containers, idioms. */
function ruleMutants(line: string): string[] {
  const code = line.trim();
  if (!code || GIVEN.test(code)) return [];
  const out: string[] = [];
  // Off-by-one style mutations.
  if (/\s[+-]\s1\b/.test(line)) out.push(line.replace(/\s[+-]\s1\b/, ''));
  // An index one off: a subscript only (not a list literal), never a plain number (`last[1 + 1]`).
  const SUBSCRIPT = /(?<=[\w\])])\[(?!\s*-?\d+\s*\])([^\][:]+)\]/;
  if (SUBSCRIPT.test(line) && !/\s[+-]\s1\]/.test(line)) out.push(line.replace(SUBSCRIPT, '[$1 + 1]'));
  if (/\blen\([^()]+\)(?!\s*[-+])/.test(line)) out.push(line.replace(/\blen\(([^()]+)\)(?!\s*[-+])/, 'len($1) - 1'));
  if (/\benumerate\(([^(),]+)\)/.test(line)) out.push(line.replace(/\benumerate\(([^(),]+)\)/, 'enumerate($1, 1)'));
  if (/\brange\(([^(),]+)\)/.test(line)) out.push(line.replace(/\brange\(([^(),]+)\)/, 'range(1, $1)'));
  // Swap operands of a simple comparison (one comparison, no `and` / `or`).
  const cmp = line.match(/^(\s*(?:if|while|elif)\s+)([^<>=!]+?)\s*(<=|>=|<|>)\s*([^<>=!]+?)(:)\s*$/);
  if (cmp && !/\b(and|or|not)\b/.test(line)) out.push(`${cmp[1]}${cmp[4]} ${cmp[3]} ${cmp[2]}${cmp[5]}`);
  // Swap the operands of a subtraction or a division (`target - x` / `x - target`).
  const sub = line.match(/^(\s*[\w.]+(?:\[[^\]]+\])?\s*[-+*/%]?=\s*)([\w.]+(?:\[[^\]]+\])?)\s*(-|\/\/|\/|%)\s*([\w.]+(?:\[[^\]]+\])?)\s*$/);
  if (sub && sub[2] !== sub[4]) out.push(`${sub[1]}${sub[4]} ${sub[3]} ${sub[2]}`);
  // Swap the names of a two-name target (`for i, x in` / `a, b = x, y`), never over equal values
  // (`slow, fast = head, head` does the same either way).
  const pair = line.match(/^(\s*(?:for\s+)?)([A-Za-z_]\w*),\s*([A-Za-z_]\w*)(\s+in\s|\s*=(?!=))(.*)$/);
  if (pair && pair[2] !== pair[3]) {
    const values = /for/.test(pair[1]) ? [] : splitTop(pair[5]);
    const same = values.length === 2 && keyOf(values[0]) === keyOf(values[1]);
    if (!same) out.push(`${pair[1]}${pair[3]}, ${pair[2]}${pair[4]}${pair[5]}`);
  }
  // Three loop targets: the first two, or the last two, the other way round (`for u, v, w in edges`).
  const three = line.match(/^(\s*for\s+)([A-Za-z_]\w*),\s*([A-Za-z_]\w*),\s*([A-Za-z_]\w*)(\s+in\s.*)$/);
  if (three) out.push(`${three[1]}${three[3]}, ${three[2]}, ${three[4]}${three[5]}`, `${three[1]}${three[2]}, ${three[4]}, ${three[3]}${three[5]}`);
  // Drop a `not` (`if not stack:` / `if stack:`).
  if (/\bnot\s+(?!in\b)/.test(line) && !/\bis\s+not\b/.test(line)) out.push(line.replace(/\bnot\s+(?!in\b)/, ''));
  // Swap the sides of a plain assignment (`prev = curr` / `curr = prev`).
  const asg = line.match(/^(\s*)([\w.]+(?:\[[^\]]+\])?)\s*=\s*([\w.]+(?:\[[^\]]+\])?)\s*$/);
  if (asg && asg[2] !== asg[3] && !/^\d/.test(asg[3])) out.push(`${asg[1]}${asg[3]} = ${asg[2]}`);
  // Swap the two arguments of a call (`max(a, b)` stays meaningful, `range(a, b)` does not).
  const call = line.match(/^(.*?\b(?:range|divmod|pow|insert|get)\()([^(),]+),\s*([^(),]+)(\).*)$/);
  if (call && call[2].trim() !== call[3].trim()) out.push(`${call[1]}${call[3].trim()}, ${call[2].trim()}${call[4]}`);
  // A stack popped from the wrong end (`stack.pop()` / `stack.pop(0)`).
  if (/\.pop\(\)/.test(line)) out.push(line.replace(/\.pop\(\)/, '.pop(0)'));
  // Containers that set something up: `[]` / `{}` / `set()`, also each of `a, b = {}, {}`.
  const setup = topLevelAssign(line);
  if (setup.at >= 0 && setup.op === '=') {
    const head = line.slice(0, setup.at + 1);
    const values = splitTop(line.slice(setup.at + 1));
    const SWAPS: Record<string, string[]> = { '[]': ['{}', 'set()'], '{}': ['[]', 'set()'], 'set()': ['{}', '[]'] };
    values.forEach((v, k) => {
      const t = v.trim();
      const alts = SWAPS[t] ?? (/^(collections\.)?(Counter|defaultdict)\(\w*\)$/.test(t) ? ['{}', '[]', 'set()'] : []);
      for (const alt of alts) {
        const copy = [...values];
        copy[k] = v.replace(t, alt);
        out.push(head + copy.join(','));
      }
    });
  }
  if (/float\(["']inf["']\)/.test(line)) out.push(line.replace(/float\((["'])inf\1\)/, 'float($1-inf$1)'));
  else if (/float\(["']-inf["']\)/.test(line)) out.push(line.replace(/float\((["'])-inf\1\)/, 'float($1inf$1)'));
  out.push(...idioms(line));
  return out;
}

/** Mistakes people make with common Python idioms (a sort, a copy, a peek, a loop over indices, a negation). */
function idioms(line: string): string[] {
  const out: string[] = [];
  const indent = indentStr(line);
  const code = line.trim();
  const sub = (re: RegExp, to: string) => re.test(line) && out.push(line.replace(re, to));
  // The first or last item: `x[0]` / `x[-1]` / `x[1]`.
  for (const [from, tos] of [['0', ['-1', '1']], ['-1', ['0', '-2']], ['1', ['0', '-1']]] as const) {
    const re = new RegExp(String.raw`(?<=[\w\])])\[${from.replace('-', '\\-')}\]`);
    for (const to of tos) sub(re, `[${to}]`);
  }
  // A minus that makes a max-heap (`-s`, `-heapq.heappop(…)`), dropped.
  sub(/(^|[\[(,=]\s*|return\s+)-(?=[A-Za-z_(])/, '$1');
  // Sorting: dropped, reversed, or `sorted` where the list should change in place.
  const sorted = line.match(/\bsorted\(([A-Za-z_][\w.]*)\)/);
  if (sorted) {
    out.push(line.replace(sorted[0], sorted[1]));
    out.push(line.replace(sorted[0], `sorted(${sorted[1]}, reverse=True)`));
  }
  const sortStmt = code.match(/^([A-Za-z_][\w.]*)\.sort\((.*)\)$/);
  if (sortStmt) {
    if (!sortStmt[2]) out.push(`${indent}sorted(${sortStmt[1]})`, `${indent}${sortStmt[1]}.reverse()`);
    if (!/reverse=/.test(sortStmt[2])) out.push(`${indent}${sortStmt[1]}.sort(${sortStmt[2] ? `${sortStmt[2]}, ` : ''}reverse=True)`);
  }
  const reverseStmt = code.match(/^([A-Za-z_][\w.]*)\.reverse\(\)$/);
  if (reverseStmt) out.push(`${indent}${reverseStmt[1]}.sort()`, `${indent}${reverseStmt[1]}[::-1]`, `${indent}reversed(${reverseStmt[1]})`);
  // A copy that is not made (`prices[:]` / `prices`).
  sub(/(?<=[\w\]])\[:\](?=\s*$)/, '');
  sub(/(?<=[\w\]])\.copy\(\)(?=\s*$)/, '');
  // Peek instead of pop, or pop from the other end.
  const heappop = line.match(/\bheapq\.heappop\(([A-Za-z_][\w.]*)\)/);
  if (heappop) out.push(line.replace(heappop[0], `${heappop[1]}[0]`), line.replace(heappop[0], `${heappop[1]}.pop()`));
  const popleft = line.match(/\b([A-Za-z_][\w.]*)\.popleft\(\)/);
  if (popleft && !/^[\w.]+\.popleft\(\)$/.test(code)) out.push(line.replace(popleft[0], `${popleft[1]}[0]`));
  const pop = line.match(/\b([A-Za-z_][\w.]*)\.pop\(\)/);
  if (pop && !/^[\w.]+\.pop\(\)$/.test(code)) out.push(line.replace(pop[0], `${pop[1]}[-1]`));
  // A node instead of the node after it (`return dummy.next` / `return dummy`).
  sub(/^(\s*(?:return\s+|[\w.]+\s*=\s*))([A-Za-z_]\w*)\.(next|left|right)\s*$/, '$1$2');
  // An object returned where its flag is meant (`return node.is_end` / `return node`, `return True`).
  const retAttr = code.match(/^return\s+([A-Za-z_]\w*)\.([A-Za-z_]\w*)$/);
  if (retAttr && !/^(next|left|right)$/.test(retAttr[2])) {
    out.push(`${indent}return ${retAttr[1]}`);
    if (/^(is_|has_)|^(end|word|found|visited)$/.test(retAttr[2])) out.push(`${indent}return True`, `${indent}return not ${retAttr[1]}.${retAttr[2]}`);
  }
  // A condition turned around, or an empty check that only catches `None`.
  const cond = line.match(/^(\s*(?:if|elif|while)\s+)(.+):\s*$/);
  if (cond && !/\b(and|or|not|in|is)\b|[<>=!]=?|\bTrue\b/.test(cond[2])) out.push(`${cond[1]}not ${cond[2]}:`);
  sub(/^(\s*(?:if|elif|while)\s+)not\s+([A-Za-z_][\w.]*)\s*:\s*$/, '$1$2 is None:');
  sub(/^(\s*return\s+)not\s+([A-Za-z_][\w.]*)\s*$/, '$1$2 is None');
  // The two items of a pair the other way round (`(dist, node)` / `(node, dist)`).
  const pair = line.match(/\(\s*([A-Za-z_][\w.]*(?:\[[^\]]*\])?)\s*,\s*([A-Za-z_][\w.]*(?:\[[^\]]*\])?)\s*\)/);
  if (pair && pair[1] !== pair[2] && !/\b(range|zip|enumerate|divmod|pow|max|min|get|insert|isinstance|ListNode|TreeNode)\s*$/.test(line.slice(0, pair.index))) {
    out.push(line.slice(0, pair.index) + `(${pair[2]}, ${pair[1]})` + line.slice(pair.index! + pair[0].length));
  }
  // Looping over the values instead of the indices, and the other way round.
  sub(/^(\s*for\s+[A-Za-z_]\w*\s+in\s+)range\(len\(([A-Za-z_][\w.]*)\)\):\s*$/, '$1$2:');
  return out;
}

/** Where a name sits in a line, for which other names can stand in for it. */
type Place = 'return' | 'index' | 'base' | 'count' | 'sized' | 'arith' | 'key' | 'within' | 'recv' | 'other';

const ARITH = new Set(['+', '-', '*', '/', '//', '%', '**', '+=', '-=', '*=', '//=']);

/**
 * Other real alternatives for a line (only with a known snippet):
 * - another variable where the line reads one (`return res` → `return nums`, `need = key(x)` →
 *   `need = key(i)`), defined before the line, never on the left of an assignment, of a kind that
 *   fits the place (a number as an index or a `range` bound, a container before `[` or in `len`),
 *   the same kind of value first, the nearest first;
 * - a returned name changed the way its kind is misused (`return cur + 1`, `return res[-1]`,
 *   `return len(s)`), and a value for a bare `return`;
 * - `None` for `True` / `False`; another small number, or a number variable, for a number set or
 *   returned (`prefix = 1` → `prefix = 0`, `prefix = n`).
 */
function synthMutants(a: Answer): string[] {
  const { ctx } = a;
  const code = a.code.trim();
  if (!ctx.known || GIVEN.test(code)) return [];
  const toks = tokenize(a.code);
  const nonWs = (i: number, step: number) => {
    for (let j = i + step; j >= 0 && j < toks.length; j += step) if (toks[j].trim() !== '') return toks[j];
    return '';
  };
  const out: string[] = [];
  const varSet = new Set(ctx.vars);
  const targets = new Set(a.targets);
  // Never on the left of an assignment (`dp[i] = …` stays about `dp`).
  const eq = topLevelAssign(a.code);
  let offset = 0;
  const starts = toks.map((t) => (offset += t.length) - t.length);
  const before = (v: string) => !a.idents.has(v) && definedBefore(v, a);
  const near = (v: string) => Math.abs((ctx.firstBind.get(v) ?? 0) - (a.at >= 0 ? a.at : ctx.lines.length));
  const swapAt = (i: number, alts: string[]) => {
    for (const v of alts) {
      const copy = [...toks];
      copy[i] = v;
      out.push(copy.join(''));
    }
  };
  // Brackets around each token: what it is an index or an argument of.
  const stack: string[] = [];
  const places: Place[] = toks.map((t, i) => {
    let place: Place = 'other';
    const inner = stack[stack.length - 1] ?? '';
    if (inner === '[') place = 'index';
    else if (inner === 'range(') place = 'count';
    else if (inner === 'len(') place = 'sized';
    const [prev, next] = [nonWs(i, -1), nonWs(i, 1)];
    if (ARITH.has(prev) || ARITH.has(next)) place = 'arith';
    if (next === 'in' || next === 'not') place = 'key';
    if (prev === 'in' && !/^\s*(async\s+)?for\b/.test(a.code)) place = 'within';
    if (next === '[') place = 'base';
    if (next === '.') place = 'recv';
    if (t === '[') stack.push('[');
    else if (t === '(') stack.push(`${nonWs(i, -1)}(`);
    else if (t === ')' || t === ']') stack.pop();
    return place;
  });
  const isReturn = /^return\s+[A-Za-z_]\w*$/.test(code);
  toks.forEach((t, i) => {
    if (eq.at >= 0 && starts[i] < eq.at) return;
    if (t === 'True' || t === 'False') return swapAt(i, ['None']);
    if (!varSet.has(t) || targets.has(t) || nonWs(i, -1) === '.' || nonWs(i, 1) === '(') return;
    if (nonWs(i, 1) === '=' && /^[(,]$/.test(nonWs(i, -1))) return;
    const kind = ctx.kinds.get(t);
    const place: Place = isReturn ? 'return' : places[i];
    const alts = ctx.vars
      .filter((v) => v !== t && before(v))
      .flatMap((v) => {
        const vk = ctx.kinds.get(v);
        if (place !== 'return' && kind && vk && kind !== vk) return [];
        // A value of unknown kind (a loop variable, an element) is rarely a whole container.
        if (place !== 'return' && !kind && vk && !NOT_CONTAINER.has(vk) && vk !== 'str') return [];
        if ((place === 'index' || place === 'count') && vk && vk !== 'num') return [];
        // A container's place: a value known to be one (any name used as a sequence has a kind by now).
        if ((place === 'base' || place === 'sized' || place === 'within') && (!vk || NOT_CONTAINER.has(vk))) return [];
        if (place === 'arith' && vk && vk !== 'num' && vk !== 'str') return [];
        if (place === 'key' && vk && vk !== 'num' && vk !== 'str' && vk !== 'node') return [];
        // A method's receiver: only a value known to have the method.
        if (place === 'recv') {
          const dot = toks.findIndex((x, j) => j > i && x === '.');
          const method = toks[dot + 1] ?? '';
          const called = nonWs(dot + 1, 1) === '(';
          // A method needs a value known to have it; an attribute (`.next`, `.is_end`) an object.
          if (called ? !vk || !METHODS[vk].has(method) : vk !== 'node' || (kind && kind !== 'node') || !ctx.attrs.has(method)) return [];
        }
        const fit = (kind && vk ? (kind === vk ? 0 : 2) : 1) + (ctx.loopVars.has(v) && !ctx.loopVars.has(t) ? 1 : 0);
        return [{ v, rank: fit * 1000 + near(v) }];
      })
      .sort((x, y) => x.rank - y.rank)
      .slice(0, 4)
      .map((x) => x.v);
    swapAt(i, alts);
  });
  // A number set or returned: another small number, an infinity to start a min or max from, or a
  // number variable (not a loop variable).
  const lit = code.match(/^(return\s+|[A-Za-z_][\w.]*\s*=\s*)(-?\d+)$/);
  if (lit) {
    const n = Number(lit[2]);
    const nums = [0, 1, -1, 2].filter((x) => x !== n).slice(0, 2);
    const inf = lit[1].startsWith('return') ? [] : ['float("-inf")', 'float("inf")'];
    const vars = ctx.vars.filter((v) => ctx.kinds.get(v) === 'num' && !ctx.loopVars.has(v) && before(v)).sort((x, y) => near(x) - near(y)).slice(0, 2);
    for (const v of [...nums.map(String), ...inf, ...vars]) out.push(`${a.indent}${lit[1]}${v}`);
  }
  // A new variable set from a value: where else a running best could start.
  const init = code.match(/^([A-Za-z_]\w*)\s*=\s*([A-Za-z_][\w.]*(?:\[-?\d+\])?)$/);
  const initKind = init ? ctx.kinds.get(init[1]) : undefined;
  if (init && a.introduced.has(init[1]) && (initKind === 'num' || (!initKind && /\.val$|\[-?\d+\]$/.test(init[2])))) {
    for (const v of ['0', 'float("-inf")', 'float("inf")']) out.push(`${a.indent}${init[1]} = ${v}`);
  }
  // A number read whole, one off (`goal = i` / `goal = i + 1`).
  const bare = code.match(/^([A-Za-z_][\w.]*\s*=\s*)([A-Za-z_]\w*)$/);
  if (bare && ctx.kinds.get(bare[2]) === 'num') for (const d of ['+ 1', '- 1']) out.push(`${a.indent}${bare[1]}${bare[2]} ${d}`);
  // Looping over a list's values where its indices are meant (`for x in nums` / `range(len(nums))`).
  const loop = code.match(/^for\s+([A-Za-z_]\w*)\s+in\s+([A-Za-z_][\w.]*)\s*:$/);
  if (loop && ['list', 'str'].includes(ctx.kinds.get(loop[2]) ?? '')) {
    out.push(`${a.indent}for ${loop[1]} in range(len(${loop[2]})):`, `${a.indent}for ${loop[1]} in enumerate(${loop[2]}):`);
  }
  // A list added to at the wrong end.
  const app = code.match(/^([A-Za-z_][\w.]*)\.append\((.+)\)$/);
  const selfAttrs = (a.at >= 0 && ctx.selfKinds.get(ctx.classOf[a.at])) || new Map<string, Kind | undefined>();
  if (app && (ctx.kinds.get(app[1]) === 'list' || (app[1].startsWith('self.') && selfAttrs.get(app[1].slice(5)) === 'list'))) out.push(`${a.indent}${app[1]}.insert(0, ${app[2]})`);
  // Another attribute of `self` of the same kind (`self.min_stack` / `self.stack`), set in the same class.
  for (const m of a.code.matchAll(/\bself\.([A-Za-z_]\w*)\b(?!\s*\()/g)) {
    const k = selfAttrs.get(m[1]);
    if (!selfAttrs.has(m[1]) || (eq.at >= 0 && m.index! < eq.at)) continue;
    for (const [other, ok] of selfAttrs) {
      if (other === m[1] || (k && ok && k !== ok) || a.code.includes(`self.${other}`)) continue;
      out.push(a.code.slice(0, m.index!) + `self.${other}` + a.code.slice(m.index! + m[0].length));
    }
  }
  // Two variables trading places (`graph[src].append(dst)` / `graph[dst].append(src)`): each read once,
  // the same kind, and not the two sides of one `+`, `*`, `==`, `and`… (that reads the same).
  const reads = toks.flatMap((t, i) => (varSet.has(t) && !targets.has(t) && nonWs(i, -1) !== '.' && nonWs(i, 1) !== '(' && !(eq.at >= 0 && starts[i] < eq.at) ? [i] : []));
  const once = reads.filter((i) => reads.filter((j) => toks[j] === toks[i]).length === 1);
  for (let x = 0; x < once.length; x++)
    for (let y = x + 1; y < once.length; y++) {
      const [i, j] = [once[x], once[y]];
      const [ki, kj] = [ctx.kinds.get(toks[i]), ctx.kinds.get(toks[j])];
      if (ki !== kj) continue;
      const between = toks.slice(i + 1, j).filter((t) => t.trim());
      if (between.length === 1 && /^(\+|\*|==|!=|and|or|is|\||&|\^|,)$/.test(between[0]) && !/^(range|divmod|pow|get|insert)$/.test(nonWs(i - 1, -1))) continue;
      const copy = [...toks];
      [copy[i], copy[j]] = [toks[j], toks[i]];
      out.push(copy.join(''));
    }
  // A returned name, misused the way its kind is.
  const ret = code.match(/^return\s+([A-Za-z_]\w*)$/);
  if (ret) {
    const k = ctx.kinds.get(ret[1]);
    const n = ret[1];
    const extra =
      k === 'num'
        ? [`${n} + 1`, `${n} - 1`]
        : k === 'list'
          ? [`${n}[-1]`, `${n}[0]`, `len(${n})`]
          : k === 'str'
            ? [`${n}[::-1]`, `len(${n})`]
            : k === 'set' || k === 'dict'
              ? [`len(${n})`, `list(${n})`]
              : k === 'bool'
                ? [`not ${n}`]
                : [];
    for (const e of extra) out.push(`${a.indent}return ${e}`);
  }
  if (code === 'return') {
    const vars = ctx.vars.filter((v) => before(v) && ctx.kinds.get(v) !== 'num').sort((x, y) => near(x) - near(y)).slice(0, 3);
    for (const v of vars) out.push(`${a.indent}return ${v}`);
    out.push(`${a.indent}return True`, `${a.indent}return False`);
  }
  return out;
}

// ── Extra rules: for lines whose own changes, other names and fallback lines make no full set ──

/** Attributes that step from node to node, by family (a tree's children, a linked list's links). */
const STEP_FAMILIES: readonly (readonly string[])[] = [
  ['left', 'right'],
  ['next', 'prev', 'random'],
];
const STEP_FAMILY = new Map(STEP_FAMILIES.flatMap((f) => f.map((x) => [x, f] as const)));
/** The node classes a solution may build (LeetCode's, and a trie's). */
const NODE_CLASS = /^(ListNode|TreeNode|Node|TrieNode)$/;
const CONTAINER = new Set<Kind>(['list', 'set', 'dict', 'deque', 'str']);
/** Kinds of the empty containers a line may set up, and how each is written. */
const MAKE: [Kind, string][] = [
  ['list', '[]'],
  ['set', 'set()'],
  ['dict', '{}'],
  ['deque', 'collections.deque()'],
];
/** 32-bit constants that are easy to mix up. */
const HEX32 = ['0xFFFFFFFF', '0x7FFFFFFF', '0x80000000', '0x100000000'];

/** What the extra rules need to know about a snippet beyond `Ctx`. */
interface Snippet {
  /**
   * Functions it defines: name → each definition (its line, parameters without `self`, how many
   * arguments a call needs and takes, class line, parent function).
   */
  defs: Map<string, { line: number; params: string[]; required: number; most: number; cls: number; parent: number }[]>;
  /** Methods called on each receiver (`stack` → append, pop; `self.heap` → …). */
  calls: Map<string, Set<string>>;
  /** Receivers each attribute is read on (`children` → node, self.root), in order of first use. */
  users: Map<string, string[]>;
  /** Kinds of attributes set on `self` (`children` → dict), when every class agrees. */
  attrKinds: Map<string, Kind>;
  /** Each attribute set on `self` → the attributes set next to it in the same class (`val` → key). */
  fields: Map<string, Set<string>>;
  /** Names indexed somewhere (`x[…]`). */
  indexed: Set<string>;
  /** Functions that only compute a value (by call name: `expand`, `self.maxDepth`): see `ownPure`. */
  pure: Set<string>;
  /** Functions whose every `return` is bare (by name): a call of one is `None`. */
  noValue: Set<string>;
  /** `def` lines of helpers whose result is only ever tested (`isBoolFn`). */
  boolFns: Set<number>;
  /** Runs of lines that can trade places (`swapRuns` over the whole snippet, own pure calls counted). */
  runs: number[][];
}

const snippetMemo = new WeakMap<Ctx, Snippet>();

function snippetOf(ctx: Ctx): Snippet {
  const hit = snippetMemo.get(ctx);
  if (hit) return hit;
  const defs: Snippet['defs'] = new Map();
  const calls = new Map<string, Set<string>>();
  const users = new Map<string, string[]>();
  const indexed = new Set<string>();
  ctx.lines.forEach((line, i) => {
    const t = line.trim();
    if (!t) return;
    const d = t.match(/^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\((.*)\)/);
    if (d) {
      const parts = splitTop(d[2])
        .map((p) => p.trim())
        .filter((p) => p && !/^self\b/.test(p));
      const params = parts.map((p) => p.match(/^\**([A-Za-z_]\w*)/)?.[1] ?? '').filter(Boolean);
      const required = parts.filter((p) => !p.includes('=') && !p.startsWith('*')).length;
      const most = parts.some((p) => p.startsWith('*')) ? Infinity : parts.length;
      defs.set(d[1], [...(defs.get(d[1]) ?? []), { line: i, params, required, most, cls: ctx.classOf[i], parent: ctx.parentFn.get(i) ?? -1 }]);
      return;
    }
    const s = t.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
    for (const m of s.matchAll(/(?<![\w.])((?:self\.)?[A-Za-z_]\w*)\.([A-Za-z_]\w*)(\s*\()?/g)) {
      if (m[3]) calls.set(m[1], (calls.get(m[1]) ?? new Set()).add(m[2]));
      else if (m[1] !== 'self') {
        const u = users.get(m[2]) ?? [];
        if (!u.includes(m[1])) users.set(m[2], [...u, m[1]]);
      }
    }
    for (const m of s.matchAll(/(?<![\w.])((?:self\.)?[A-Za-z_]\w*)\[/g)) indexed.add(m[1]);
  });
  const attrKinds = new Map<string, Kind>();
  const fields = new Map<string, Set<string>>();
  const clash = new Set<string>();
  for (const attrs of ctx.selfKinds.values()) {
    for (const [k, v] of attrs) {
      fields.set(k, new Set([...(fields.get(k) ?? []), ...[...attrs.keys()].filter((x) => x !== k)]));
      if (!v) continue;
      if (attrKinds.has(k) && attrKinds.get(k) !== v) clash.add(k);
      else attrKinds.set(k, v);
    }
  }
  clash.forEach((k) => attrKinds.delete(k));
  const pure = ownPure(ctx, defs);
  const noValue = new Set<string>();
  for (const [name, ds] of defs) {
    const bodies = ds.map((d) => ctx.lines.filter((_, j) => j > d.line && (ctx.fnOf[j] ?? -1) === d.line));
    if (bodies.every((b) => !b.some((l) => /^\s*return\s+\S/.test(l)))) noValue.add(name);
  }
  const boolFns = new Set<number>();
  for (const ds of defs.values()) for (const d of ds) if (isBoolFn(ctx, d.line, new Set())) boolFns.add(d.line);
  const out = { defs, calls, users, attrKinds, fields, indexed, pure, noValue, boolFns, runs: swapRuns(ctx.lines, pure) };
  snippetMemo.set(ctx, out);
  return out;
}

/** A function's body: the lines whose function is it (a nested function's lines are its own). */
const bodyOf = (ctx: Ctx, def: number) => ctx.lines.flatMap((l, j) => (j > def && (ctx.fnOf[j] ?? -1) === def && l.trim() ? [j] : []));

/**
 * The snippet's own functions that only compute a value from what they are given (`expand(left, right)`,
 * `self.maxDepth(root)`): they set only their own names, change no container they are given or see
 * around them, and call only builtins and functions like them. By call name (`self.f` for a method).
 */
function ownPure(ctx: Ctx, defs: Snippet['defs']): Set<string> {
  const callName = (d: { cls: number; parent: number }, name: string) => (d.cls >= 0 && d.parent < 0 ? `self.${name}` : name);
  let pure = new Set<string>();
  for (const [name, ds] of defs) for (const d of ds) if (!name.startsWith('__')) pure.add(callName(d, name));
  for (let pass = 0; pass < 4; pass++) {
    const next = new Set<string>();
    for (const [name, ds] of defs)
      for (const d of ds) {
        const call = callName(d, name);
        if (!pure.has(call)) continue;
        const locals = new Set([...d.params, ...bodyOf(ctx, d.line).flatMap((j) => [...lineTargets(ctx.lines[j]), ...loopNames(ctx.lines[j])])]);
        const ok = bodyOf(ctx, d.line).every((j) => {
          const t = ctx.lines[j].trim();
          if (/^(nonlocal|global|yield|raise|del)\b/.test(t)) return false;
          if (/^(else|try|finally|pass|break|continue|return)\s*:?$|^except\b/.test(t)) return true;
          const head = t.match(/^(?:if|elif|while|return|assert)\s+(.+?):?$/) ?? t.match(/^for\s+.+?\s+in\s+(.+):$/);
          const fx = head ? exprEffectsOf(head[1], pure) : effects(t, pure);
          if (!fx) return false;
          // A name it sets is its own; a container it changes must be too (`found += 1`, not `res.append(…)`).
          return fx.writes.every((w) => locals.has(w.split(/[.[]/)[0]) && !w.startsWith('self.'));
        });
        if (ok) next.add(call);
      }
    if (next.size === pure.size) break;
    pure = next;
  }
  return pure;
}

/**
 * Whether a function's result is only ever tested (`if has_cycle(nxt):`, `return not dfs(…)` in
 * such a function, `any(dfs(x) for …)`), so only its truth counts: a helper inside another function
 * or outside any class. (A method's result goes back to its caller as it is: `None` is not `False`.)
 */
function isBoolFn(ctx: Ctx, def: number, seen: Set<number>): boolean {
  const head = ctx.lines[def] ?? '';
  const name = head.match(/^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)/)?.[1];
  if (!name || seen.has(def) || (ctx.classOf[def] >= 0 && (ctx.parentFn.get(def) ?? -1) < 0)) return false;
  seen.add(def);
  const call = new RegExp(String.raw`(?<![\w.])(?:self\.)?${name}\(`);
  const sites = ctx.lines.flatMap((l, j) => (j !== def && call.test(l) ? [j] : []));
  return (
    sites.length > 0 &&
    sites.every((j) => {
      const l = ctx.lines[j].trim();
      if (/^(?:if|elif|while)\b/.test(l) || new RegExp(String.raw`\b(?:any|all|not)\(?\s*(?:self\.)?${name}\(`).test(l)) return true;
      const f = ctx.fnOf[j] ?? -1;
      // `return dfs(…)`: a test when the function that returns it answers yes or no.
      return new RegExp(String.raw`^return\s+(?:not\s+)?(?:self\.)?${name}\(`).test(l) && f >= 0 && (f === def || isBoolFn(ctx, f, seen));
    })
  );
}

/** The index just past the bracket that closes the one at `open` (strings skipped), or -1. */
function closeOf(s: string, open: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = open; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch) && --depth === 0) return i + 1;
  }
  return -1;
}

/** Top-level ` if ` and ` else ` of a conditional expression (`a if c else b`), or null. */
function ternary(e: string): { a: string; c: string; b: string } | null {
  let depth = 0;
  let quote: string | null = null;
  let at = -1;
  for (let i = 0; i < e.length; i++) {
    const ch = e[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    else if (depth === 0 && e.startsWith(' if ', i) && at < 0) at = i;
    else if (depth === 0 && e.startsWith(' else ', i) && at >= 0) return { a: e.slice(0, at).trim(), c: e.slice(at + 4, i).trim(), b: e.slice(i + 6).trim() };
  }
  return null;
}

/**
 * More real mistakes for a line, used only when its own changes, other names and fallback lines
 * leave it short of a full set (see `choose`). Each is built from what the snippet has at the
 * line (its names, attributes, functions and other lines), so it adds no undefined name:
 * - the negated test (`if n not in seen:` / `if n in seen:`, `is not` / `is`), the wrong container
 *   in a membership test (`n in nums` for `n in seen`, `self.root.children` for `node.children`),
 *   and a dict entry tested for a key (`if not self.store[key]:` for `if key not in self.store:`);
 * - a node's sibling, child or parent where a line reads one (`root.left` / `root.right` / `root`,
 *   `.next` / `.random` / `.next.next`, `if not root.left:`), another node in its place
 *   (`list2.next` for `list1.next`);
 * - the snippet's own functions: a sibling with the same parameters (`self.insert` / `self.remove`),
 *   the call returned instead of run (`return self.invertTree(root.left)`, `return gain(root)` for
 *   `return best`), an argument one off, dropped or swapped, a helper not called (`a` for `find(a)`);
 * - other return values: the function's other returns, other functions' literal returns, an
 *   empty value of another type (`None` / `[]` / `[[]]` / `""` / `0` / `-1` / `TreeNode()`), the key
 *   for its value (`return head` for `return old_to_new[head]`), a field's sibling (`.key` / `.val`),
 *   `is` or the sizes for `==` between containers, `.items()` for `.values()`;
 * - set-ups: another empty container only where the code calls a method it lacks (`[]` for a
 *   `collections.deque()` that is popped from the left), a deque not seeded (`deque()`, `deque(root)`),
 *   a node class not called (`TrieNode`) or skipped (`None`, `list1` for a dummy), a copy not made
 *   (`copy = original`), `{}` / `set(0)` for `{0}`, `set()` / `{nums}` for `set(nums)`, a size one off
 *   (`[0] * 25`), a mapping turned around, a 32-bit constant mixed up, `0.0` for `1.0`;
 * - a pop at the wrong end or a push for a pop (`stack.append(ch)`), its value returned from a function
 *   that returns nothing (`return self.min_stack.pop()`), a heap misused (`self.heap.append(val)`,
 *   `self.heap = heapq.heapify(self.heap)`, `heapq.heapify(h)` or a push for `heapq.heappop(h)`), `=`
 *   for `+=`, `/=` / `%=` / `*=` for `//=`, `<<=` for `>>=`, a loop over a dict's values or over
 *   indices, a guard dropped, turned around or with its branches swapped (`l1 = l1.next`), a string
 *   split or joined wrong, `d[k]` or `d.get(k)` for `d.get(k, default)`;
 * - `pass` for a bare `return` / `break` / `continue`, or for a guard's `return <value>` (the only line
 *   under its `if`).
 */
function extraMutants(a: Answer): string[] {
  const { ctx } = a;
  const code = a.code.trim();
  if (!ctx.known || GIVEN.test(code) || a.at < 0) return [];
  const sn = snippetOf(ctx);
  const ind = a.indent;
  const out: string[] = [];
  const put = (s: string) => out.push(ind + s);
  const eq = topLevelAssign(code);
  const lhs = eq.at >= 0 ? code.slice(0, eq.at).trim() : '';
  const rhs = eq.at >= 0 ? code.slice(eq.at + eq.op.length).trim() : '';
  const plainSet = eq.at >= 0 && eq.op === '=';
  const near = (v: string) => Math.abs((ctx.firstBind.get(v) ?? 0) - a.at);
  // A sibling name first (`l2` for `l1`, `list2` for `list1`), then the nearest.
  const stem = (v: string) => v.replace(/^self\./, '').replace(/\d+$/, '');
  const like = (v: string, of: string) => (stem(v) === stem(of) && v !== of ? 0 : 1) * 1000 + near(v);
  const before = (v: string) => definedBefore(v.replace(/^self\./, '').split('.')[0], a) || v.startsWith('self.');
  const selfAttrs = ctx.selfKinds.get(ctx.classOf[a.at]) ?? new Map<string, Kind | undefined>();
  const kindOf = (e: string): Kind | undefined => {
    const t = e.trim();
    if (/^self\.[A-Za-z_]\w*$/.test(t)) return selfAttrs.get(t.slice(5)) ?? sn.attrKinds.get(t.slice(5));
    const m = t.match(/\.([A-Za-z_]\w*)$/);
    if (m && /^[\w.]+$/.test(t)) return sn.attrKinds.get(m[1]);
    return kindOfExpr(t, ctx.kinds);
  };
  // A name that is a node: its kind says so, or the snippet steps from it (`root.left`, `curr.next`).
  const familyOf = (v: string): readonly string[] | undefined => {
    for (const f of STEP_FAMILIES) if (f.some((x) => (sn.users.get(x) ?? []).includes(v))) return f.filter((x) => ctx.attrs.has(x));
    return ctx.kinds.get(v) === 'node' ? STEP_FAMILIES.find((f) => f.some((x) => ctx.attrs.has(x)))?.filter((x) => ctx.attrs.has(x)) : undefined;
  };
  // Other names (or `self.` attributes of this class) of a kind, defined before the line, nearest first.
  const others = (not: string, ok: (k: Kind | undefined, v: string) => boolean, max = 2): string[] => {
    const vars = ctx.vars.filter((v) => v !== not && !ctx.loopVars.has(v) && definedBefore(v, a) && ok(ctx.kinds.get(v), v)).sort((x, y) => near(x) - near(y));
    const attrs = [...selfAttrs].filter(([k, v]) => `self.${k}` !== not && ok(v, `self.${k}`)).map(([k]) => `self.${k}`);
    return [...vars, ...attrs].slice(0, max);
  };
  // The functions a call may name here: methods of this class (as `self.f`), functions in scope (as `f`).
  const fnHere = (name: string, viaSelf: boolean) =>
    (sn.defs.get(name) ?? []).find((d) => (viaSelf ? d.cls >= 0 && d.cls === ctx.classOf[a.at] : d.cls === ctx.classOf[a.at] || d.parent >= 0 || d.cls < 0));
  const fnOfLine = ctx.fnOf[a.at] ?? -1;
  // Lines after this one in its own function: a call returned here would skip them.
  const hasLater = ctx.lines.some((l, j) => j > a.at && l.trim() && (ctx.fnOf[j] ?? -1) === fnOfLine);

  // 1. Tests: the other way round, the wrong container, a dict entry for a key.
  const cond = code.match(/^(if|elif|while|return)\s+(.+?)(:?)$/);
  if (cond && !/\b(and|or|lambda|for)\b/.test(cond[2])) {
    const [, word, test, colon] = cond;
    for (const [re, to] of [
      [/\bnot in\b/, 'in'],
      [/\bis not\b/, 'is'],
    ] as const) {
      if ((test.match(new RegExp(re.source, 'g')) ?? []).length === 1) put(`${word} ${test.replace(re, to)}${colon}`);
    }
    const cmps = topLevelCompares(test);
    if (cmps.length === 1 && /^ (not )?in $/.test(cmps[0].op)) {
      const left = test.slice(0, cmps[0].at).trim();
      const right = test.slice(cmps[0].at + cmps[0].op.length).trim();
      const rk = kindOf(right);
      if (/^[A-Za-z_]\w*$|^self\.[A-Za-z_]\w*$/.test(right)) {
        const fam = (k: Kind | undefined) => (k === rk ? 0 : k && rk && ['list', 'set', 'deque'].includes(k) === ['list', 'set', 'deque'].includes(rk) ? 1 : 2);
        // A string only stands in for a string (`endWord in beginWord` tests a substring).
        const alts = others(right, (k) => !!k && CONTAINER.has(k) && (k !== 'str' || rk === 'str'), 6).sort((x, y) => fam(kindOf(x)) - fam(kindOf(y)));
        for (const d of alts.slice(0, 2)) put(`${word} ${left}${cmps[0].op}${d}${colon}`);
      }
      // `node.children` → `self.root.children`: the same attribute of another node.
      const recv = right.match(/^((?:self\.)?[A-Za-z_]\w*)\.([A-Za-z_]\w*)$/);
      if (recv) for (const r of (sn.users.get(recv[2]) ?? []).filter((r) => r !== recv[1] && before(r)).slice(0, 2)) put(`${word} ${left}${cmps[0].op}${r}.${recv[2]}${colon}`);
      if (rk === 'dict' && /^[\w.]+$/.test(right) && word !== 'while') put(`${word} ${cmps[0].op.includes('not') ? 'not ' : ''}${right}[${left}]${colon}`);
    }
    // `return a == b` between two containers: identity, or only their sizes.
    if (word === 'return' && cmps.length === 1 && cmps[0].op === '==') {
      const x = test.slice(0, cmps[0].at).trim();
      const y = test.slice(cmps[0].at + 2).trim();
      if ([x, y].every((v) => /^[A-Za-z_]\w*$/.test(v) && CONTAINER.has(kindOf(v) ?? 'num'))) put(`return ${x} is ${y}`), put(`return len(${x}) == len(${y})`);
    }
  }

  // 2. Nodes: a sibling, a child or the node itself where the line reads one (never on the left of `=`).
  const toks = tokenize(code);
  let offset = 0;
  const starts = toks.map((t) => (offset += t.length) - t.length);
  const nonWs = (i: number, step: number) => {
    for (let j = i + step; j >= 0 && j < toks.length; j += step) if (toks[j].trim()) return j;
    return -1;
  };
  const swapTok = (from: number, to: number, w: string) => put(toks.slice(0, from).join('') + w + toks.slice(to).join(''));
  const readsFrom = eq.at >= 0 ? eq.at + eq.op.length : 0;
  const callLike = /^(?:return\b|if\b|elif\b|while\b)/.test(code) || (eq.at < 0 && /\)$/.test(code)) || plainSet;
  // Per token: inside a call's parentheses (`f(…)`, not a tuple or a subscript).
  const inCall: boolean[] = [];
  {
    const open: boolean[] = [];
    toks.forEach((t, i) => {
      if (t === '(') open.push(/^[A-Za-z_]\w*$/.test(toks[nonWs(i, -1)] ?? '') && !KEYWORD.has(toks[nonWs(i, -1)] ?? ''));
      else if (t === '[' || t === '{') open.push(false);
      else if (t === ')' || t === ']' || t === '}') open.pop();
      inCall[i] = open.length > 0 && open[open.length - 1];
    });
  }
  const testOrReturn = /^(?:return\b|if\b|elif\b|while\b)/.test(code);
  toks.forEach((t, i) => {
    if (!/^[A-Za-z_]\w*$/.test(t) || KEYWORD.has(t) || starts[i] < readsFrom) return;
    const p = nonWs(i, -1);
    if (p >= 0 && toks[p] === '.') return;
    const n = nonWs(i, 1);
    const fam = familyOf(t);
    if (!fam || !fam.length) return;
    if (n >= 0 && toks[n] === '.') {
      const attr = toks[nonWs(n, 1)] ?? '';
      const after = nonWs(nonWs(n, 1), 1);
      if (!fam.includes(attr) || (after >= 0 && /^[([]$/.test(toks[after]))) return;
      const end = nonWs(n, 1) + 1;
      // The node itself (`self.invertTree(root)` for `root.left`), in a call, a test or a return.
      if (inCall[i] || testOrReturn) swapTok(i, end, t);
      for (const sib of fam) if (sib !== attr) swapTok(i, end, `${t}.${sib}`);
      // One step too far, on a linked list.
      if (attr === 'next' && (after < 0 || toks[after] !== '.')) swapTok(i, end, `${t}.next.next`);
      // Another node with the same attribute (`list2.next` for `list1.next`): a sibling name when there is one.
      const rs = (sn.users.get(attr) ?? []).filter((r) => r !== t && r !== lhs && /^[A-Za-z_]\w*$/.test(r) && definedBefore(r, a)).sort((x, y) => like(x, t) - like(y, t));
      for (const r of rs.slice(0, rs.length && like(rs[0], t) < 1000 ? 1 : 2)) swapTok(i, end, `${r}.${attr}`);
    } else if (callLike && (n < 0 || !/^[.[(=]$/.test(toks[n]))) {
      // A child where the line reads the node (`height(root.left)`, `if not root.left:`, `fast = head.next`):
      // in a test or a return, the first node a call is given, or a whole value set.
      const firstArg = inCall[i] && !toks.slice(0, i).some((x, q) => inCall[q] && x !== t && familyOf(x) && /^[A-Za-z_]\w*$/.test(x));
      const whole = !inCall[i] && plainSet && splitTop(rhs).some((v) => v.trim() === t);
      if ((testOrReturn && !inCall[i]) || firstArg || whole) for (const c of fam.slice(0, 2)) if (c !== 'prev' && c !== 'random') swapTok(i, i + 1, `${t}.${c}`);
    }
  });
  // `l1 = l1.next if l1 else None`: the guard dropped, turned around, its branches swapped, another node in it.
  const tern = (rhs && plainSet ? rhs : code.startsWith('return ') ? code.slice(7) : '') && ternary(plainSet ? rhs : code.slice(7));
  if (tern) {
    const head = plainSet ? `${lhs} = ` : 'return ';
    put(`${head}${tern.a}`);
    // Turned around only when it is a name or a call (a comparison has its operator changed already).
    if (/^(not )?[\w.]+(\(.*\))?$/.test(tern.c)) put(`${head}${tern.a} if ${tern.c.startsWith('not ') ? tern.c.slice(4) : `not ${tern.c}`} else ${tern.b}`);
    put(`${head}${tern.b} if ${tern.c} else ${tern.a}`);
    if (/^[A-Za-z_]\w*$/.test(tern.c) && familyOf(tern.c)) for (const r of others(tern.c, (k, v) => !!familyOf(v) || k === 'node', 9).sort((x, y) => like(x, tern.c) - like(y, tern.c)).slice(0, 1)) put(`${head}${tern.a} if ${r} else ${tern.b}`);
  }

  // 3. The snippet's own functions.
  const callRe = /(?<![\w.])(self\.)?([A-Za-z_]\w*)\(/g;
  for (const m of code.matchAll(callRe)) {
    const def = fnHere(m[2], !!m[1]);
    if (!def || (!m[1] && def.cls >= 0 && def.parent < 0)) continue;
    const open = m.index! + m[0].length - 1;
    const close = closeOf(code, open);
    if (close < 0) continue;
    const pre = code.slice(0, m.index!);
    const post = code.slice(close);
    const name = `${m[1] ?? ''}${m[2]}`;
    const args = code.slice(open + 1, close - 1).trim() ? splitTop(code.slice(open + 1, close - 1)).map((x) => x.trim()) : [];
    // A sibling with the same parameters (`self.insert` / `self.remove`), declared before the line when nested.
    for (const [other, ds] of sn.defs) {
      if (other === m[2] || other.startsWith('__')) continue;
      const d = ds.find((x) => x.cls === def.cls && x.parent === def.parent && x.params.length === def.params.length && (x.parent < 0 || x.line < a.at));
      if (d && d.params.join() === def.params.join()) put(`${pre}${m[1] ?? ''}${other}(${args.join(', ')})${post}`);
    }
    // The call returned instead of run, when its function goes on after it; its result kept in what
    // the function returns (`best = gain(root)`, `res = backtrack(0)`).
    if (pre === '' && post === '' && hasLater) {
      put(`return ${code}`);
      for (let j = a.at + 1; j < ctx.lines.length; j++) {
        // `return res` or `return route[::-1]`: a variable the function builds (never `self`).
        const r = ctx.lines[j].trim().match(/^return\s+([A-Za-z_]\w*)(?:\[[^\]]*\])?$/);
        const own = r && (ctx.binds.get(r[1]) ?? []).some((b) => b > fnOfLine && (ctx.fnOf[b] ?? -1) === fnOfLine && b < a.at);
        if ((ctx.fnOf[j] ?? -1) === fnOfLine && indentStr(ctx.lines[j]).length === ind.length && r && r[1] !== 'self' && own) {
          put(`${r[1]} = ${code}`);
          break;
        }
      }
    }
    // A helper not called (`a` for `find(a)`), or only its first step (`parent[a]`, the lookup it repeats).
    if ((pre !== '' || post !== '') && !/^return $/.test(pre) && args.length === 1 && /^[A-Za-z_]\w*$/.test(args[0]) && !(plainSet && pre.endsWith('= ') && post === '' && !/,/.test(rhs))) {
      put(`${pre}${args[0]}${post}`);
      const param = def.params[0];
      const body = ctx.lines.slice(def.line + 1).filter((_, q) => (ctx.fnOf[def.line + 1 + q] ?? -1) === def.line);
      const look = param && body.join('\n').match(new RegExp(`(?<![\\w.])([A-Za-z_]\\w*)\\[${param}\\]`));
      if (look && definedBefore(look[1], a)) put(`${pre}${look[1]}[${args[0]}]${post}`);
    }
    // Its arguments: two traded, a number one off, a helper not called.
    if (args.length === 2 && args[0] !== args[1]) put(`${pre}${name}(${args[1]}, ${args[0]})${post}`);
    args.forEach((x, k) => {
      const set = (v: string) => put(`${pre}${name}(${args.map((y, q) => (q === k ? v : y)).join(', ')})${post}`);
      if (/^[A-Za-z_]\w*$/.test(x) && ctx.kinds.get(x) === 'num') set(`${x} + 1`);
      const inner = x.match(/^([A-Za-z_]\w*)\(([A-Za-z_]\w*)\)$/);
      if (inner && sn.defs.has(inner[1])) set(inner[2]);
      // The key for the entry it names (`self.remove(key)` for `self.remove(self.cache[key])`).
      const entry = x.match(/^((?:self\.)?[A-Za-z_]\w*)\[([A-Za-z_]\w*)\]$/);
      if (entry && kindOf(entry[1]) === 'dict') set(entry[2]);
    });
    // Its result dropped (`read()` for `node.left = read()`, `read()` for `return read()`), or the function not called.
    if ((/^return $/.test(pre) || (plainSet && pre === code.slice(0, eq.at + 1) + ' ')) && post === '') put(code.slice(open - name.length, close));
    if (!args.length && post === '' && (pre === '' || /^return $/.test(pre) || (plainSet && pre.endsWith('= ')))) put(`${pre}${name}`);
  }
  // `return best` after `gain(root)`: the helper's own result returned.
  const retName = code.match(/^return\s+([A-Za-z_]\w*)$/);
  if (retName) {
    for (let j = a.at - 1; j >= 0 && (ctx.fnOf[j] ?? -1) === fnOfLine; j--) {
      const l = ctx.lines[j];
      if (!l.trim() || indentStr(l).length !== ind.length) continue;
      const c = l.trim().match(/^(self\.)?([A-Za-z_]\w*)\(.*\)$/);
      if (c && fnHere(c[2], !!c[1])) put(`return ${l.trim()}`);
    }
  }

  // A bare `return` that should stop here: going on instead (`pass`), or, in a loop, only this round.
  if (/^(return|break|continue)$/.test(code)) {
    let inLoop = false;
    for (let j = a.at - 1, level = ind.length; j >= 0 && (ctx.fnOf[j] ?? -1) === fnOfLine; j--) {
      const l = ctx.lines[j];
      if (!l.trim() || indentStr(l).length >= level) continue;
      level = indentStr(l).length;
      if (/^\s*(for|while)\b/.test(l)) inLoop = true;
      if (/^\s*(async\s+)?def\b/.test(l)) break;
    }
    put('pass');
    if (inLoop) for (const w of ['break', 'continue', 'return']) if (w !== code) put(w);
  }
  // A guard's `return <value>` (the only line under its `if`): going on instead (`pass`).
  if (/^return\s+\S/.test(code)) {
    let j = a.at - 1;
    while (j >= 0 && !ctx.lines[j].trim()) j--;
    let k = a.at + 1;
    while (k < ctx.lines.length && !ctx.lines[k].trim()) k++;
    const opener = j >= 0 && /^\s*(if|elif)\b.*:\s*$/.test(ctx.lines[j]) && indentStr(ctx.lines[j]).length < ind.length;
    if (opener && (k >= ctx.lines.length || indentStr(ctx.lines[k]).length < ind.length)) put('pass');
  }

  // 4. Return values.
  if (/^return\b/.test(code)) {
    const value = code.slice(6).trim();
    // The function's other returns, and other functions' plain values.
    for (let j = 0; j < ctx.lines.length; j++) {
      const r = ctx.lines[j].trim().match(/^return\s+(.+)$/);
      if (!r || r[1] === value) continue;
      if ((ctx.fnOf[j] ?? -1) === fnOfLine || /^(None|True|False|-?\d+|""|''|\[\]|"0")$/.test(r[1])) put(`return ${r[1]}`);
    }
    // The function's return type, for an empty value of another type.
    const def = fnOfLine >= 0 ? ctx.lines[fnOfLine] : '';
    const ret = def.match(/->\s*(.+?)\s*:\s*$/)?.[1] ?? '';
    const node = ret.match(/\b(ListNode|TreeNode|Node)\b/)?.[1];
    const EMPTY: Record<string, string[]> = {
      '[]': ['None', ...(/^List\[\s*List\b/.test(ret) ? ['[[]]'] : []), ...(/^List\[\s*str\s*\]$/.test(ret) ? ['[""]'] : [])],
      '""': ['None', ...others('', (k) => k === 'str', 1)],
      '"0"': ['0', '""'],
      '0': ['-1', 'None'],
      None: ['[]', ...(node ? [`${node}()`] : [])],
    };
    for (const v of EMPTY[value] ?? []) put(`return ${v}`);
    // The key for its value (`return head` for `return old_to_new[head]`), the object for its field, a field's sibling.
    const sub = value.match(/^([\w.]+)\[([A-Za-z_]\w*)\](?:\.([A-Za-z_]\w*))?$/);
    if (sub) {
      put(`return ${sub[2]}`);
      if (sub[3]) {
        put(`return ${sub[1]}[${sub[2]}]`);
        for (const f of sn.fields.get(sub[3]) ?? []) if (!STEP_FAMILY.has(f)) put(`return ${sub[1]}[${sub[2]}].${f}`);
      }
    }
    // `return list(groups.values())`: the pairs, or the dict itself.
    const wrapped = value.match(/^list\(([A-Za-z_][\w.]*)\.(values|keys)\(\)\)$/);
    if (wrapped) put(`return list(${wrapped[1]}.items())`), put(`return ${wrapped[1]}`);
    // `return ','.join(out)`: the list itself, or its text.
    const join = value.match(/^(["'][^"']*["'])\.join\(([A-Za-z_]\w*)\)$/);
    if (join) put(`return ${join[2]}`), put(`return str(${join[2]})`);
  }

  // 5. Set-ups and plain assignments.
  if (plainSet && rhs) {
    const target = /^(self\.)?[A-Za-z_]\w*$/.test(lhs) ? lhs : '';
    const used = sn.calls.get(target) ?? new Set<string>();
    // Another empty container, only where the code calls a method it does not have (or indexes a set).
    const make = rhs.match(/^(?:collections\.)?(deque|defaultdict|Counter)\((.*)\)$|^(\[\]|\{\}|set\(\))$/);
    if (make && target) {
      const lacks = (k: Kind) => [...used].some((u) => !METHODS[k].has(u)) || (k === 'set' && sn.indexed.has(target));
      const seed = make[1] === 'deque' && make[2].match(/^\[(.+)\]$/);
      // A deque that starts with something: not seeded, seeded with the item itself, or a list.
      if (seed) put(`${lhs} = collections.deque()`), put(`${lhs} = collections.deque(${seed[1]})`), lacks('list') && put(`${lhs} = [${seed[1]}]`);
      else if (!make[2]) for (const [k, w] of MAKE) if (k !== (kindOf(rhs) ?? '') && (k !== 'deque' || ctx.hasDeque) && lacks(k) && w !== rhs) put(`${lhs} = ${w}`);
    }
    // A node class not called, or no node at all, or one already there (`dummy = list1`).
    const ctor = rhs.match(/^([A-Za-z_]\w*)\((.*)\)$/);
    const cls = ctor && (NODE_CLASS.test(ctor[1]) || ctx.lines.some((l) => new RegExp(`^\\s*class\\s+${ctor[1]}\\b`).test(l))) ? ctor : null;
    if (cls) {
      put(`${lhs} = ${cls[1]}`);
      put(`${lhs} = None`);
      const cargs = cls[2].trim() ? splitTop(cls[2]).map((x) => x.trim()) : [];
      if (cargs.length) put(`${lhs} = ${cls[1]}(${cargs.slice(0, -1).join(', ')})`);
      // A copy not made (`copy = original`), or made of the node instead of its value.
      const of = cargs.length === 1 && cargs[0].match(/^([A-Za-z_]\w*)\.([A-Za-z_]\w*)$/);
      if (of) put(`${lhs} = ${of[1]}`), put(`${lhs} = ${cls[1]}(${of[1]})`);
      if (cargs.length === 2 && /^[A-Za-z_]\w*$/.test(cargs[1])) put(`${lhs} = ${cargs[1]}`);
      if (target && familyOf(target)) for (const r of others(target, (k, v) => k === 'node' || !!familyOf(v), 2)) put(`${lhs} = ${r}`);
    }
    // `set(nums)`: empty, or a set holding the list.
    const setOf = rhs.match(/^set\(([A-Za-z_]\w*)\)$/);
    if (setOf) put(`${lhs} = set()`), put(`${lhs} = {${setOf[1]}}`);
    // `{0}`: an empty dict, `set(0)`, an empty set; `[0]`: an empty list.
    const one = rhs.match(/^\{([^{}:,]+)\}$/);
    if (one) put(`${lhs} = {}`), put(`${lhs} = set(${one[1].trim()})`), put(`${lhs} = set()`);
    if (/^\[[^[\],]+\]$/.test(rhs)) put(`${lhs} = []`);
    // A mapping turned around, or missing its last pair.
    const pairs = rhs.match(/^\{(.+)\}$/) && splitTop(rhs.slice(1, -1)).map((x) => x.split(/\s*:\s*/));
    if (pairs && pairs.length >= 2 && pairs.every((x) => x.length === 2 && x.every((y) => /^["'][^"']*["']$/.test(y.trim())))) {
      put(`${lhs} = {${pairs.map(([k, v]) => `${v.trim()}: ${k.trim()}`).join(', ')}}`);
      put(`${lhs} = {${pairs.slice(0, -1).map(([k, v]) => `${k.trim()}: ${v.trim()}`).join(', ')}}`);
    }
    // A size one off (`[0] * 25`), or the size of a sequence instead (`[0] * len(word)`).
    const sized = rhs.match(/^(\[[^\]]*\]\s*\*\s*)(\d+|[A-Za-z_]\w*)$/);
    if (sized) {
      const nn = sized[2];
      if (/^\d+$/.test(nn) && Number(nn) >= 3) {
        put(`${lhs} = ${sized[1]}${Number(nn) - 1}`);
        put(`${lhs} = ${sized[1]}${Number(nn) + 1}`);
        for (const s of others('', (k) => k === 'str' || k === 'list', 1)) put(`${lhs} = ${sized[1]}len(${s})`);
      } else if (!/^\d+$/.test(nn)) put(`${lhs} = ${sized[1]}(${nn} - 1)`), put(`${lhs} = ${sized[1]}(${nn} + 1)`);
    }
    // `heap = [-s for s in stones]`: the list itself, or its indices.
    const comp = rhs.match(/^\[(.+) for ([A-Za-z_]\w*) in ([A-Za-z_]\w*)\]$/);
    if (comp && ['list', 'str'].includes(ctx.kinds.get(comp[3]) ?? '')) put(`${lhs} = ${comp[3]}`), put(`${lhs} = [${comp[1]} for ${comp[2]} in range(len(${comp[3]}))]`);
    // A 32-bit constant mixed up with the others; `0.0` for `1.0`.
    if (HEX32.includes(rhs)) for (const h of HEX32) if (h !== rhs) put(`${lhs} = ${h}`);
    if (/^\d+\.\d+$/.test(rhs)) for (const f of ['0.0', '1.0', '2.0']) if (Number(f) !== Number(rhs)) put(`${lhs} = ${f}`);
    // `x = d[k]`: the key for its value.
    const val = rhs.match(/^([A-Za-z_][\w.]*)\[([A-Za-z_]\w*)\]$/);
    if (val && /^[A-Za-z_]\w*$/.test(lhs)) put(`${lhs} = ${val[2]}`);
    // `lists = merged`: added to, or only its first item; `self.heap = nums`: an empty one instead.
    if (/^[A-Za-z_]\w*$/.test(lhs) && /^[A-Za-z_]\w*$/.test(rhs) && kindOf(lhs) === 'list' && kindOf(rhs) === 'list') put(`${lhs}.append(${rhs})`), put(`${lhs} = ${rhs}[0]`);
    if (/^(self\.)?[A-Za-z_]\w*$/.test(lhs) && /^[A-Za-z_]\w*$/.test(rhs) && kindOf(rhs) === 'list') put(`${lhs} = []`);
    // `node = self.root`: a fresh node instead, or the root's children.
    if (/^[A-Za-z_]\w*$/.test(lhs) && /^(self\.)?[A-Za-z_]\w*$/.test(rhs) && (kindOf(rhs) === 'node' || familyOf(rhs))) {
      const made = ctx.lines.map((l) => l.match(/=\s*([A-Z]\w*)\(\)\s*$/)?.[1]).find((c) => c && NODE_CLASS.test(c));
      if (made) put(`${lhs} = ${made}()`);
      for (const [attr, rs] of sn.users) if (rs.includes(lhs) && !STEP_FAMILY.has(attr) && sn.attrKinds.get(attr) === 'dict') put(`${lhs} = ${rhs}.${attr}`);
    }
    // `d[k] = v`: key and value the other way round.
    const store = lhs.match(/^([A-Za-z_][\w.]*)\[([A-Za-z_]\w*)\]$/);
    if (store && /^[A-Za-z_]\w*$/.test(rhs) && store[2] !== rhs) put(`${store[1]}[${rhs}] = ${store[2]}`);
    // `tokens = data.split(',')`: on whitespace, or into characters.
    const split = rhs.match(/^([A-Za-z_]\w*)\.split\((["'][^"']+["'])\)$/);
    if (split) put(`${lhs} = ${split[1]}.split()`), put(`${lhs} = list(${split[1]})`);
    // `pairs = self.store.get(key, [])`: no default, so a missing key fails (`[key]`) or gives `None`.
    const got = rhs.match(/^([A-Za-z_][\w.]*)\.get\(([^,()]+),\s*([^()]+)\)$/);
    if (got && kindOf(got[1]) === 'dict') put(`${lhs} = ${got[1]}[${got[2].trim()}]`), put(`${lhs} = ${got[1]}.get(${got[2].trim()})`);
    // `x = abs(x)`: negated instead.
    const abs = rhs.match(/^abs\(([A-Za-z_]\w*)\)$/);
    if (abs) put(`${lhs} = -${abs[1]}`);
    // `n = -n`: inverted instead.
    const neg = rhs.match(/^-([A-Za-z_]\w*)$/);
    if (neg) put(`${lhs} = 1 / ${neg[1]}`);
    // `root_a, root_b = find(a), find(b)` is handled with calls; `slow, fast = head, head` with nodes.
  }
  // `self.stack.pop()`: the line's own changes made to the other attribute too (`self.min_stack.pop(0)`).
  const selfUse = code.match(/\bself\.([A-Za-z_]\w*)\b(?!\s*\()/);
  if (selfUse && selfAttrs.has(selfUse[1]) && !(eq.at >= 0 && selfUse.index! < eq.at)) {
    const k = selfAttrs.get(selfUse[1]);
    const sibs = [...selfAttrs].filter(([o, ok]) => o !== selfUse[1] && (!k || !ok || k === ok) && !code.includes(`self.${o}`)).map(([o]) => o).slice(0, 2);
    for (const c of rawMutants(a.code)) if (c.includes(`self.${selfUse[1]}`)) for (const o of sibs) put(c.trim().replace(`self.${selfUse[1]}`, `self.${o}`));
  }
  // `prev = None`: a node already there; `answer = ""`: no value at all.
  if (plainSet && /^[A-Za-z_]\w*$/.test(lhs) && rhs === 'None' && familyOf(lhs)) for (const r of others(lhs, (k, v) => k === 'node' || !!familyOf(v), 2)) put(`${lhs} = ${r}`);
  if (plainSet && rhs === '""') put(`${lhs} = None`);
  // `+=` / `-=` that should add up, written as `=`; `//=`, `>>=` with another operator.
  if (eq.at >= 0 && /^[+-]=$/.test(eq.op) && !/^\d/.test(rhs)) put(`${lhs} = ${rhs}`);
  if (eq.op === '//=') for (const op of ['/=', '%=', '*=']) put(`${lhs} ${op} ${rhs}`);
  if (eq.op === '>>=' || eq.op === '<<=') put(`${lhs} ${eq.op === '>>=' ? '<<=' : '>>='} ${rhs}`);

  // 6. Containers in use: a push for a pop, a heap used as a list, the result of an in-place call kept.
  const stmt = code.match(/^((?:self\.)?[A-Za-z_][\w.]*)\.(pop|popleft)\(\)$/);
  if (stmt) {
    for (const l of ctx.lines) {
      const ap = l.trim().match(/^((?:self\.)?[A-Za-z_][\w.]*)\.append\((.+)\)$/);
      if (ap && ap[1] === stmt[1] && scan(ap[2]).idents.size && [...scan(ap[2]).idents.keys()].every((n) => definedBefore(n, a))) {
        put(`${stmt[1]}.append(${ap[2]})`);
        break;
      }
    }
  }
  // A pop in a function that returns nothing: its value returned (`return self.min_stack.pop()`).
  const fnName = fnOfLine >= 0 ? ctx.lines[fnOfLine].match(/def\s+([A-Za-z_]\w*)/)?.[1] : undefined;
  if (stmt && fnName && sn.noValue.has(fnName) && !/->\s*(?!None)\S/.test(ctx.lines[fnOfLine])) put(`return ${code}`);
  const heap = code.match(/^heapq\.(heapify|heappop|heappush)\(([^,()]+)(?:,\s*(.+))?\)$/);
  if (heap) {
    const [, fn, h, item] = heap;
    if (fn === 'heapify') put(`${h} = heapq.heapify(${h})`), put(`heapq.heappop(${h})`);
    if (fn === 'heappop') {
      put(`${h}.pop()`), put(`${h}.pop(0)`), put(`heapq.heapify(${h})`);
      // A push for the pop: an item this heap is given elsewhere, when it is there to push.
      for (const l of ctx.lines) {
        const push = l.trim().match(/^heapq\.heappush\(([^,()]+),\s*(.+)\)$/);
        if (push && push[1].trim() === h.trim() && [...scan(push[2]).idents.keys()].every((n) => definedBefore(n, a))) {
          put(`heapq.heappush(${h}, ${push[2]})`);
          break;
        }
      }
    }
    if (fn === 'heappush' && item) put(`${h}.append(${item})`), put(`heapq.heappop(${h})`);
  }
  const app = code.match(/^((?:self\.)?[A-Za-z_][\w.]*(?:\[[^\]]+\])?)\.append\((.+)\)$/);
  if (app) {
    // Another value this list is given elsewhere, a `None` for a marker, the list replaced by the value.
    for (const l of ctx.lines) {
      const o = l.trim().match(/^((?:self\.)?[A-Za-z_][\w.]*(?:\[[^\]]+\])?)\.append\((.+)\)$/);
      if (o && o[1] === app[1] && o[2] !== app[2]) put(`${app[1]}.append(${o[2]})`);
    }
    if (/^["'][^"']*["']$/.test(app[2])) put(`${app[1]}.append(None)`);
    if (/\]$/.test(app[1])) put(`${app[1]} = [${app[2]}]`);
  }

  // 7. Loops: over a dict's values, over indices, with indices.
  const loop = code.match(/^for\s+(.+?)\s+in\s+(.+):$/);
  if (loop) {
    const [, vars, it] = loop;
    const base = it.match(/^(sorted\()?([A-Za-z_][\w.]*)(\))?$/);
    if (base && kindOf(base[2]) === 'dict') put(`for ${vars} in ${base[1] ?? ''}${base[2]}.values()${base[3] ?? ''}:`);
    if (base && !base[1] && CONTAINER.has(kindOf(base[2]) ?? 'num') && /^[A-Za-z_]\w*$/.test(vars)) put(`for ${vars} in range(len(${base[2]})):`);
    const dictLoop = it.match(/^([A-Za-z_][\w.]*)\.(values|items)\(\)$/);
    if (dictLoop) for (const m of ['keys', 'values', 'items']) if (m !== dictLoop[2]) put(`for ${vars} in ${dictLoop[1]}.${m}():`);
    if (/^[A-Za-z_]\w*,\s*[A-Za-z_]\w*$/.test(vars) && /^[A-Za-z_]\w*$/.test(it)) put(`for ${vars} in enumerate(${it}):`);
    if (base && !base[1] && /^[A-Za-z_]\w*$/.test(vars) && ['set', 'dict'].includes(kindOf(base[2]) ?? '')) put(`for ${vars} in enumerate(${base[2]}):`);
  }
  return out;
}

interface Cand {
  text: string;
  canon: string;
  toks: string[];
  /** 0 a first-order change, 1 another variable or literal, 2 two changes (a 2x2's corner), 3 a fallback line, 4 two changes found by search. */
  tier: number;
  /**
   * Where it differs from the answer, in the answer's tokens: `[from, to)` (empty for an insertion).
   * Options that differ at the same span are alternatives at one site.
   */
  span: [number, number];
  /** The same span in this option's own tokens. */
  own: [number, number];
  /** The change as characters of the answer to replace (made on demand, for 2x2 corners). */
  edit?: { from: number; to: number; with: string };
  /** Which stage of the pool made it: 0 token swaps, 1 other rules, 2 other names and values, 3 the extra rules (`extraMutants`). */
  stage?: number;
}

interface Pool {
  a: Answer;
  first: Cand[];
  /** Other candidates (second-order changes) made on demand. */
  more?: Cand[];
  /** 2x2 corners made so far, by the two changes. */
  corners: Map<string, Cand | null>;
  /** Adds the other first-order rules to `first` (after the token swaps), once. */
  rules: () => void;
  /** Adds the other names and values (tier 1) to `first`, once (after the rules): only needed when the line's own changes fall short. */
  synth: () => void;
  /** Adds the extra rules (tier 1, stage 3) to `first`, once (after `synth`): only for a line that is still short of a full set. */
  extra: () => void;
}

const poolCache = new WeakMap<Ctx, Map<string, Pool>>();

function makeCand(text: string, a: Answer, tier: number): Cand {
  const toks = tokenize(text).filter((t) => t.trim() !== '');
  let p = 0;
  while (p < toks.length && p < a.toks.length && toks[p] === a.toks[p]) p++;
  let s = 0;
  while (s < toks.length - p && s < a.toks.length - p && toks[toks.length - 1 - s] === a.toks[a.toks.length - 1 - s]) s++;
  return { text, canon: canonIn(a, text), toks, tier, span: [p, a.toks.length - s], own: [p, toks.length - s] };
}

function poolFor(code: string, ctx: Ctx, at: number | undefined, deny: boolean, sure = false): Pool {
  let pools = poolCache.get(ctx);
  if (!pools) poolCache.set(ctx, (pools = new Map()));
  const memo = `${deny ? 1 : 0}|${at ?? -1}|${sure ? 1 : 0}|${code}`;
  const hit = pools.get(memo);
  if (hit) return hit;
  const a = answerInfo(code, ctx, at, sure);
  const seen = new Set<string>([a.canon]);
  const first: Cand[] = [];
  const add = (s: string, tier: number, stage: number) => {
    if (s === code || !allowed(s, a, deny, false, stage === 3)) return;
    const c = makeCand(s, a, tier);
    c.stage = stage;
    if (seen.has(c.canon)) return;
    seen.add(c.canon);
    first.push(c);
  };
  // Built in stages, cheapest first, and always in this order, so a candidate's tier never depends
  // on which caller asked first.
  swapMutants(code).forEach((s) => add(s, 0, 0));
  let rulesDone = false;
  let synthDone = false;
  let extraDone = false;
  const pool: Pool = {
    a,
    first,
    corners: new Map(),
    rules: () => {
      if (rulesDone) return;
      rulesDone = true;
      ruleMutants(code).forEach((s) => add(s, 0, 1));
    },
    synth: () => {
      if (synthDone) return;
      pool.rules();
      synthDone = true;
      synthMutants(a).forEach((s) => add(s, 1, 2));
    },
    extra: () => {
      if (extraDone) return;
      pool.synth();
      extraDone = true;
      extraMutants(a).forEach((s) => add(tidy(s), 1, 3));
    },
  };
  pools.set(memo, pool);
  return pool;
}

/** Second-order changes (two first-order changes in a row), kept two tokens from the answer. */
function secondOrder(pool: Pool, deny: boolean): Cand[] {
  if (pool.more) return pool.more;
  pool.rules();
  const { a } = pool;
  const seen = new Set([a.canon, ...pool.first.filter((c) => c.tier === 0).map((c) => c.canon)]);
  const more: Cand[] = [];
  for (const c of pool.first) {
    if (c.tier !== 0) continue;
    for (const s of rawMutants(c.text)) {
      if (!allowed(s, a, deny)) continue;
      const m = makeCand(s, a, 4);
      if (seen.has(m.canon) || tokenDistance(m.toks, a.toks) !== 2) continue;
      seen.add(m.canon);
      more.push(m);
    }
  }
  pool.more = more;
  return more;
}

/** Character offsets of each code token of `s` (whitespace skipped). */
function tokenOffsets(s: string): [number, number][] {
  const out: [number, number][] = [];
  let at = 0;
  for (const t of tokenize(s)) {
    if (t.trim() !== '') out.push([at, at + t.length]);
    at += t.length;
  }
  return out;
}

/** The characters of `text` a span covers, and what replaces them, for applying a change to the answer. */
function edit(a: Answer, c: Cand): { from: number; to: number; with: string } {
  return (c.edit ??= makeEdit(a, c));
}

function makeEdit(a: Answer, c: Cand): { from: number; to: number; with: string } {
  const ao = tokenOffsets(a.code);
  const co = tokenOffsets(c.text);
  const [p, e] = c.span;
  const [, ce] = c.own;
  const indent = a.indent.length;
  if (e === p) {
    // Insertion after token p - 1 (with the space before it), or at the start (with the space after it).
    if (p > 0) return { from: ao[p - 1][1], to: ao[p - 1][1], with: c.text.slice(co[p - 1][1], co[ce - 1][1]) };
    return { from: indent, to: indent, with: c.text.slice(co[0][0], ce < co.length ? co[ce][0] : c.text.length) };
  }
  if (ce === p) {
    // Deletion of tokens [p, e), with the space before them (or after them, at the start).
    return p > 0 ? { from: ao[p - 1][1], to: ao[e - 1][1], with: '' } : { from: ao[0][0], to: e < ao.length ? ao[e][0] : a.code.length, with: '' };
  }
  return { from: ao[p][0], to: ao[e - 1][1], with: c.text.slice(co[p][0], co[ce - 1][1]) };
}

/** One space between words, none before `.`, `,`, `)`, `]` or a final `:`, none after `(` or `[` (strings untouched). */
function tidy(s: string): string {
  const indent = indentStr(s);
  return (
    indent +
    s
      .slice(indent.length)
      .split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/)
      .map((part, k) => (k % 2 ? part : part.replace(/ {2,}/g, ' ').replace(/ ([.,)\]])/g, '$1').replace(/,(?=[^\s)\]])/g, ', ').replace(/([([]) /g, '$1').replace(/ :$/, ':')))
      .join('')
  );
}

/** The answer's line with two changes at different places: the corner of a 2x2. */
function corner(pool: Pool, x: Cand, y: Cand, deny: boolean): Cand | null {
  const memo = `${x.text}\n${y.text}`;
  if (pool.corners.has(memo)) return pool.corners.get(memo)!;
  let c: Cand | null = null;
  const [ex, ey] = [edit(pool.a, x), edit(pool.a, y)];
  // Two names traded both ways (`max(left, right)` → `max(right, left)`) often mean the same.
  const swap = (p: Cand, q: Cand) => p.span[1] - p.span[0] === 1 && p.own[1] - p.own[0] === 1 && pool.a.toks[p.span[0]] === q.toks[q.own[0]] && pool.a.toks[q.span[0]] === p.toks[p.own[0]];
  // Two changes that each add the same word (`head.next, head` and `head, head.next`; `[1] * n` and
  // `[0] * (n - 1)`) would leave the answer the only option without it; two extra rules stacked
  // (`self.heap = heapq.heappop(self.heap)`) are no mistake anyone makes.
  if ((swap(x, y) && q1(x) && q1(y)) || addsSame(pool.a, x, y) || (x.stage === 3 && y.stage === 3)) {
    pool.corners.set(memo, null);
    return null;
  }
  const [lo, hi] = ex.from <= ey.from ? [ex, ey] : [ey, ex];
  // Apart in the line: two changes that touch only when both replace tokens (an insertion right
  // next to another change has no one right place).
  const [sx, sy] = x.span[0] <= y.span[0] ? [x, y] : [y, x];
  const apart = sx.span[1] < sy.span[0] || (sx.span[1] === sy.span[0] && sx.span[1] > sx.span[0] && sy.span[1] > sy.span[0]);
  if (apart && lo.to <= hi.from) {
    const code = pool.a.code;
    const s = tidy(code.slice(0, lo.from) + lo.with + code.slice(lo.to, hi.from) + hi.with + code.slice(hi.to));
    if (allowed(s, pool.a, deny)) {
      const m = makeCand(s, pool.a, 2);
      if (m.canon !== x.canon && m.canon !== y.canon && !pool.first.some((f) => f.tier === 0 && f.canon === m.canon)) c = m;
    }
  }
  pool.corners.set(memo, c);
  return c;
}

/** The names and numbers a change adds to the answer's tokens. */
function added(a: Answer, c: Cand): string[] {
  const had = a.toks.slice(c.span[0], c.span[1]);
  return c.toks.slice(c.own[0], c.own[1]).filter((t) => /^[A-Za-z_\d]/.test(t) && !KEYWORD.has(t) && !had.includes(t));
}

/** Whether two changes add a common name or number. */
function addsSame(a: Answer, x: Cand, y: Cand): boolean {
  const ys = new Set(added(a, y));
  return added(a, x).some((t) => ys.has(t));
}

/** A change of exactly one token for one token. */
const q1 = (c: Cand) => c.span[1] - c.span[0] === 1 && c.own[1] - c.own[0] === 1;

/** Shape of a statement, for fallback lines: the kind of block opener or statement. */
function shape(code: string): string {
  const s = code.trim();
  const w = s.match(/^(elif|if|while|for|else|try|finally|except|with|def|class|async|return|break|continue|yield|raise|nonlocal|global|import|from|assert|del|pass)\b/)?.[1];
  if (w === 'if' || w === 'while') return 'cond';
  if (w === 'break' || w === 'continue') return 'jump';
  if (w) return w;
  return topLevelAssign(s).at >= 0 ? 'assign' : 'expr';
}

const balanced = (s: string) => {
  let d = 0;
  for (const ch of s.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '')) {
    if ('([{'.includes(ch)) d++;
    else if (')]}'.includes(ch) && --d < 0) return false;
  }
  return d === 0;
};

/** Whether the answer (index 0) is the unique center of the set `[0, ...idx]`, from distances `d`. */
function centered(d: (i: number, j: number) => number, idx: readonly number[]): boolean {
  const all = [0, ...idx];
  const sums = all.map((i) => all.reduce((n, j) => n + (i === j ? 0 : d(i, j)), 0));
  return sums.slice(1).every((s) => s > sums[0]);
}

const TIER_COST = [0, 2, 1, 3, 2];
const spanKey = (c: Cand) => `${c.span[0]}:${c.span[1]}`;

/**
 * Choose `n` wrong options. Structured sets first (three alternatives at one site, or a 2x2: two
 * changes and both together), where the answer is never the center; then any set from the changes,
 * second-order changes and fallback lines where it is not the center; then the closest ones.
 */
function choose(pool: Pool, usable: (c: Cand) => boolean, fallbacks: () => Cand[], n: number, rnd: () => number, deny: boolean, onScreen: (c: Cand) => boolean): Cand[] {
  if (n <= 0) return [];
  // The line's own changes first (token swaps, then the other rules); other names and values only
  // when those make no good set. The extra rules (stage 3) never take part before the last step,
  // whoever made them first, so a line's options never depend on what was asked before it.
  const swaps = structured(pool, (c) => c.stage === 0 && usable(c), n, rnd, deny);
  if (swaps && swaps.cost <= 1) return swaps.set;
  pool.rules();
  const own = structured(pool, (c) => c.tier === 0 && usable(c), n, rnd, deny);
  if (own && own.cost <= 1) return own.set;
  pool.synth();
  const known = (c: Cand) => c.stage !== 3 && usable(c);
  const any = structured(pool, known, n, rnd, deny);
  if (any) return any.set;
  const found = search(pool, pool.first.filter(known), fallbacks, n, rnd, deny, known);
  if (found.length >= n || !pool.a.ctx.known) return found;
  // Still short: the extra rules; then any change of the line even when it is on screen (only a
  // fallback line, another real line of the snippet, must not be).
  pool.extra();
  let best = found;
  if (pool.first.filter(usable).length > pool.first.filter(known).length) {
    const ext = structured(pool, usable, n, rnd, deny);
    if (ext) return ext.set;
    const again = search(pool, pool.first.filter(usable), fallbacks, n, rnd, deny, usable);
    if (again.length >= n) return again;
    if (again.length > best.length) best = again;
  }
  const wide = (c: Cand) => usable(c) || (c.tier !== 3 && onScreen(c));
  // Nothing new to choose from: keep the set (and leave `rnd` where it was, so the order stays too).
  if (pool.first.filter(wide).length === pool.first.filter(usable).length) return best;
  const more = structured(pool, wide, n, rnd, deny);
  if (more) return more.set;
  const again = search(pool, pool.first.filter(wide), fallbacks, n, rnd, deny, wide);
  return again.length > best.length ? again : best;
}

/** The best three alternatives at one site, or 2x2, from `pool.first` (see `choose`). */
function structured(pool: Pool, usable: (c: Cand) => boolean, n: number, rnd: () => number, deny: boolean): { set: Cand[]; cost: number } | null {
  const { a } = pool;
  const first = pool.first.filter(usable);
  {
    const sets: { set: Cand[]; cost: number }[] = [];
    const sites = new Map<string, Cand[]>();
    for (const c of first) sites.set(spanKey(c), [...(sites.get(spanKey(c)) ?? []), c]);
    const groups = [...sites.values()];
    const cost = (cs: Cand[]) => cs.reduce((s, c) => s + TIER_COST[c.tier], 0);
    for (const g of groups) {
      if (g.length < 3) continue;
      const take = g.slice(0, 6);
      for (let i = 0; i < take.length; i++)
        for (let j = i + 1; j < take.length; j++)
          for (let k = j + 1; k < take.length; k++) {
            const set = [take[i], take[j], take[k]];
            // One site, but options of different lengths can still leave the answer in the middle.
            if (set.every((c) => c.toks.length === set[0].toks.length) || !answerIsCenter([a.code, ...set.map((c) => c.text)])) sets.push({ set, cost: cost(set) });
          }
    }
    // 2x2s: two sites in a seeded order, the first two changes at each, until a few are found
    // (only when no line of plain alternatives at one site is there: those are cheaper to make).
    if (sets.some((x) => x.cost === 0)) return pickSet(sets, rnd, a);
    const pairs: [Cand[], Cand[]][] = [];
    for (let p = 0; p < groups.length; p++) for (let q = p + 1; q < groups.length; q++) pairs.push([groups[p], groups[q]]);
    let found = 0;
    let tries = 0;
    for (const [gx, gy] of shuffleWith(pairs, rnd)) {
      if (found >= 4 || tries >= 12) break;
      for (const x of gx.slice(0, 2))
        for (const y of gy.slice(0, 2)) {
          tries++;
          const c = corner(pool, x, y, deny);
          if (c && usable(c)) {
            found++;
            sets.push({ set: [x, y, c], cost: cost([x, y]) + TIER_COST[2] });
          }
        }
    }
    return n === 3 && sets.length ? pickSet(sets, rnd, a) : null;
  }
}

/** One of the cheapest sets (or one step dearer), seeded; one where the answer's length gives nothing away when there is one. */
function pickSet(sets: { set: Cand[]; cost: number }[], rnd: () => number, a: Answer): { set: Cand[]; cost: number } {
  const min = Math.min(...sets.map((s) => s.cost));
  // One step dearer is fine; two only for a set whose lengths give nothing away.
  let best = fairLength(sets.filter((s) => s.cost <= min + 1), (s) => s.set, a);
  if (!fair(best[0].set, a)) {
    const more = fairLength(sets.filter((s) => s.cost <= min + 2), (s) => s.set, a);
    if (fair(more[0].set, a)) best = more;
  }
  return { set: best[Math.floor(rnd() * best.length)].set, cost: min };
}

/** The answer is neither the only shortest option nor the only longest. */
function fair(set: readonly Cand[], a: Answer): boolean {
  const n = charLength(a.code);
  const lens = set.map((c) => charLength(c.text));
  return !lens.every((l) => l > n) && !lens.every((l) => l < n);
}

const charLength = (s: string) => s.replace(/\s+/g, '').length;

/**
 * The sets where the answer is neither the only shortest option nor the only longest (most wrong
 * options add a token, so "pick the shortest" would beat chance), else those where it is not the
 * only shortest, else all.
 */
function fairLength<T>(sets: T[], of: (t: T) => readonly Cand[], a: Answer): T[] {
  const n = charLength(a.code);
  const shortest = (t: T) => of(t).every((c) => charLength(c.text) > n);
  const even = sets.filter((t) => fair(of(t), a));
  // Among those, one where a wrong option is shorter than the answer (not only as short): a tie for
  // the shortest still leaves "pick the shortest" a better guess than chance.
  const below = even.filter((t) => of(t).some((c) => charLength(c.text) < n));
  if (below.length) return below;
  if (even.length) return even;
  const notShort = sets.filter((t) => !shortest(t));
  return notShort.length ? notShort : sets;
}

/** Any set where the answer is not the center: changes first, then second-order ones and fallback lines; else the closest. */
function search(pool: Pool, first: Cand[], fallbacks: () => Cand[], n: number, rnd: () => number, deny: boolean, usable: (c: Cand) => boolean): Cand[] {
  const { a } = pool;
  const seen = new Set<string>();
  const cands = [...shuffleWith(first, rnd), ...shuffleWith(secondOrder(pool, deny).filter(usable), rnd), ...fallbacks()]
    .filter((c) => !seen.has(c.canon) && (seen.add(c.canon), true))
    .sort((x, y) => TIER_COST[x.tier] - TIER_COST[y.tier])
    .slice(0, 14);
  if (cands.length <= n) return cands;
  const toks = [a.toks, ...cands.map((c) => c.toks)];
  const memo = new Map<number, number>();
  const d = (i: number, j: number) => {
    const key = i < j ? i * 64 + j : j * 64 + i;
    let v = memo.get(key);
    if (v === undefined) memo.set(key, (v = tokenDistance(toks[i], toks[j])));
    return v;
  };
  if (n === 3 || n === 2) {
    let best: { idx: number[]; cost: number }[] = [];
    let min = Infinity;
    const m = cands.length;
    // The cheapest sets, and a little dearer ones kept for when every cheapest set gives the answer
    // away by its length (it is the only shortest or the only longest option).
    const consider = (idx: number[]) => {
      if (centered(d, idx)) return;
      const cost = idx.reduce((s, i) => s + TIER_COST[cands[i - 1].tier] + d(0, i) * 0.25, 0);
      if (cost < min - 1e-9) {
        min = cost;
        best = best.filter((b) => b.cost < cost + 1.5);
      }
      if (cost < min + 1.5) best.push({ idx, cost });
    };
    for (let i = 1; i <= m; i++)
      for (let j = i + 1; j <= m; j++) {
        if (n === 2) consider([i, j]);
        else for (let k = j + 1; k <= m; k++) consider([i, j, k]);
      }
    const of = (b: { idx: number[] }) => b.idx.map((i) => cands[i - 1]);
    let chosen = fairLength(
      best.filter((b) => b.cost < min + 0.5),
      of,
      a,
    );
    if (chosen.length && !fair(of(chosen[0]), a)) {
      const wider = fairLength(best, of, a);
      if (fair(of(wider[0]), a)) chosen = wider;
    }
    if (chosen.length) return of(chosen[Math.floor(rnd() * chosen.length)]);
  }
  return cands.slice(0, n);
}

/** Options for one line: where `lineChoices` and `gapChoices` meet. */
interface ChoiceRequest {
  answer: string;
  otherLines: readonly string[];
  n: number;
  rnd: () => number;
  context?: readonly string[];
  at?: number;
  visible?: readonly string[];
  /** Lines never to offer (by `lineKey`): lines that can trade places with the answer. */
  exclude?: readonly string[];
}

/** Fallback lines for an answer: real lines with its shape, not on screen, not excluded, allowed. */
function fallbackLines(a: Answer, lines: readonly string[], skip: ReadonlySet<string>, deny: boolean): Cand[] {
  const kind = shape(a.code);
  const { ctx } = a;
  const out: Cand[] = [];
  for (const l of lines) {
    const t = codeOnly(l).trim();
    if (!t || GIVEN.test(t) || shape(t) !== kind || !balanced(t) || skip.has(keyOf(t))) continue;
    // In a pattern template, a line from the answer's own section only.
    const at = ctx.keys.indexOf(keyOf(t));
    if (a.at >= 0 && at >= 0 && ctx.secOf[at] !== ctx.secOf[a.at]) continue;
    const s = a.indent + t;
    if (allowed(s, a, deny, true)) out.push(makeCand(s, a, 3));
  }
  return out;
}

/**
 * Lines of the snippet that can trade places with the answer's: its run (`swapRuns` over the whole
 * snippet, with the snippet's own pure functions counted as pure), and neighbors that add to the same
 * number (`count += expand(i, i)` / `count += expand(i, i + 1)`) from parts that change nothing else.
 */
function partnersOf(a: Answer): number[] {
  const { ctx } = a;
  const sn = snippetOf(ctx);
  const out = new Set((sn.runs.find((r) => r.includes(a.at)) ?? []).filter((j) => j !== a.at));
  const acc = (j: number) => {
    const m = ctx.lines[j].trim().match(/^([A-Za-z_]\w*)\s*[+-]=\s*(.+)$/);
    if (!m || ctx.kinds.get(m[1]) !== 'num') return null;
    const fx = exprEffectsOf(m[2], sn.pure);
    return fx && !fx.reads.includes(m[1]) && !fx.writes.length ? { target: m[1], fx } : null;
  };
  const mine = acc(a.at);
  if (mine) {
    for (const step of [-1, 1]) {
      for (let j = a.at + step; j >= 0 && j < ctx.lines.length; j += step) {
        if (!ctx.lines[j].trim()) continue;
        if (indentStr(ctx.lines[j]) !== indentStr(ctx.lines[a.at])) break;
        const o = acc(j);
        if (!o || o.target !== mine.target || !independent(o.fx, mine.fx)) break;
        out.add(j);
      }
    }
  }
  return [...out];
}

function wrongFor(req: ChoiceRequest): string[] {
  const code = codeOnly(req.answer);
  // Half of a statement that spans lines: nothing sensible to pick from.
  if (!balanced(code)) return [];
  const ctx = buildCtx(req.context ?? [code, ...req.otherLines], !!req.context || req.otherLines.length > 0);
  // A caller's `at` is the answer's own line (`gapChoices` works out which of two lines with its code).
  const pool = poolFor(code, ctx, req.context ? req.at : 0, true, req.context ? req.at !== undefined : true);
  const { a } = pool;
  const visible = new Set((req.visible ?? []).map((l) => keyOf(codeOnly(l))));
  // Lines that could take the answer's place (`pairs = {…}` / `stack = []`, `count += expand(i, i)` /
  // `count += expand(i, i + 1)`): never offered while hidden, so a right program is never graded wrong.
  const partners = ctx.known && a.at >= 0 ? partnersOf(a).map((j) => ctx.keys[j]).filter((k) => !visible.has(k)) : [];
  const excluded = new Set([...(req.exclude ?? []).map((l) => keyOf(codeOnly(l))), ...partners]);
  const skip = new Set([...excluded, ...visible]);
  // A line already on screen only as a direct change of the answer (`return True` / `return False`).
  const usable = (c: Cand) => !excluded.has(keyOf(c.text)) && (c.tier === 0 || !visible.has(keyOf(c.text)));
  const onScreen = (c: Cand) => !excluded.has(keyOf(c.text)) && visible.has(keyOf(c.text));
  const fallbacks = () => shuffleWith(fallbackLines(a, req.otherLines, skip, true), req.rnd);
  return choose(pool, usable, fallbacks, req.n, req.rnd, true, onScreen).map((c) => c.text);
}

// ── API ─────────────────────────────────────────────────────────────────────

/** Where a line comes from, for its options. */
export interface ChoiceOptions {
  /**
   * The whole snippet the answer belongs to (a solution or template, one entry per line): the
   * names it defines and the methods it uses, and the line's place in it. Default: the answer and
   * `otherLines`.
   */
  context?: readonly string[];
  /** The answer's index in `context` (found by its code when left out). */
  at?: number;
  /** Lines on screen: never offered as a fallback. */
  visible?: readonly string[];
}

/**
 * Plausible wrong versions of a line (see the top of this file), in two groups: changes to the line
 * itself (one token swapped: operators, bounds, pointers, methods, literals; an off-by-one; the
 * operands of a comparison or a plain assignment swapped; common idiom mistakes), then other names
 * and values where the line reads one (left out with `other` false, which is faster). Keeps the
 * indentation; with `opts.context`, only names the snippet defines before the line and methods
 * its values have. Arrange a part's distractor is one of these.
 */
export function lineChanges(line: string, opts: ChoiceOptions = {}, other = true): { own: string[]; other: string[] } {
  const ctx = buildCtx(opts.context ?? [line], !!opts.context);
  const pool = poolFor(line, ctx, opts.context ? opts.at : 0, true);
  pool.rules();
  if (!other) return { own: pool.first.filter((c) => c.tier === 0).map((c) => c.text), other: [] };
  pool.synth();
  return { own: pool.first.filter((c) => c.tier === 0).map((c) => c.text), other: pool.first.filter((c) => c.tier !== 0 && c.stage !== 3).map((c) => c.text) };
}

/**
 * Up to `n` wrong options for `answer`, chosen so the answer is not the center of the set (see the
 * top of this file): changes to it first, then other real lines from `otherLines` with its shape
 * (re-indented to the answer's indentation, never one in `opts.visible`). Code only (no trailing
 * comment), never meaning the same as the answer or each other. `rnd` picks among equally good
 * sets (default `Math.random`; pass `seededRandom(seed)` for options that must stay the same on a
 * retry or a reload).
 */
export function lineChoices(
  answer: string,
  otherLines: readonly string[] = [],
  n = 3,
  rnd: () => number = Math.random,
  opts: ChoiceOptions = {},
): string[] {
  return wrongFor({ answer, otherLines, n, rnd, ...opts });
}

/**
 * Every wrong option the rules can offer for a line, before the deny list: changes (the extra
 * rules' too), second-order changes, 2x2 corners and fallback lines (from `otherLines`). For scripts/check-distractors, which
 * runs each one in place.
 */
export function choiceCandidates(answer: string, opts: ChoiceOptions & { otherLines?: readonly string[] } = {}): string[] {
  const code = codeOnly(answer);
  const ctx = buildCtx(opts.context ?? [code, ...(opts.otherLines ?? [])], true);
  const pool = poolFor(code, ctx, opts.context ? opts.at : 0, false);
  pool.extra();
  const { a } = pool;
  const out = new Map<string, string>();
  const put = (c: Cand) => out.set(c.canon, c.text);
  pool.first.forEach(put);
  secondOrder(pool, false).forEach(put);
  for (const x of pool.first)
    for (const y of pool.first)
      if (spanKey(x) < spanKey(y) && spanKey(x) !== spanKey(y)) {
        const c = corner(pool, x, y, false);
        if (c) put(c);
      }
  fallbackLines(a, opts.otherLines ?? [], new Set(), false).forEach(put);
  return [...out.values()];
}

/** The options of one gap: the answer (code only, at its line's indentation) and up to three wrong lines, in a fixed order. */
export interface GapChoice {
  /** The right option (code only, at the line's indentation). */
  answer: string;
  /** The answer and the wrong lines, shuffled. */
  options: string[];
}

/** Where a snippet's gaps come from, for their options. */
export interface GapChoiceOptions {
  /** The whole snippet `lines` belong to, when `lines` is only part of it (default: `lines` and `extra`). */
  context?: readonly string[];
  /** With one gap and a `context`: the gap's index in it (found by its code when left out). */
  at?: number;
  /** Lines on screen besides `lines` (the code above a one-line pick): never offered as a fallback. */
  visible?: readonly string[];
}

/**
 * The options for each gap of a snippet (`gaps`: indices into `lines`, as `pickGaps` returns them):
 * the answer plus up to `n` wrong lines (`lineChoices`). Fallback lines are never on screen: the
 * other gaps' lines, then `extra`; never a line that can trade places with the gap's when both are
 * gaps (`swapRuns`), so two such gaps cannot be crossed. A line whose code is in `context` twice is
 * placed by the code above it (`opts.visible`, which callers without `at` pass as that). Deterministic
 * per `seed` and content, so a retry or a reload shows the same options. A gap gets fewer than `n`
 * wrong lines only when its line has too few real alternatives (a bare `return` whose value no one
 * reads, `return False` in a yes/no helper); `isGivenLine` lines (`else:`) get none.
 */
export function gapChoices(
  lines: readonly string[],
  gaps: readonly number[],
  seed = 0,
  n = 3,
  extra: readonly string[] = [],
  opts: GapChoiceOptions = {},
): GapChoice[] {
  const context = opts.context ?? [...lines, ...extra];
  const own = !opts.context;
  const runs = gaps.length ? runsOf(lines) : [];
  return gaps.map((i, k) => {
    const rnd = seededRandom(hashString(`${seed}:${k}:${lines[i] ?? ''}`));
    const answer = codeOnly(lines[i] ?? '');
    const hidden = [...gaps.filter((j) => j !== i).map((j) => lines[j] ?? ''), ...extra];
    const run = runs.find((r) => r.includes(i)) ?? [];
    const visible = [...lines.filter((_, j) => j !== i && !gaps.includes(j)), ...(opts.visible ?? [])];
    const wrong = wrongFor({
      answer,
      otherLines: hidden,
      n,
      rnd,
      context,
      at: own ? i : gaps.length === 1 && opts.at !== undefined ? opts.at : twinAt(context, answer, [...(opts.visible ?? []), ...lines.slice(0, i)]),
      visible,
      // Only a partner that is a gap too: one on screen can be offered (picking it is plainly wrong).
      exclude: run.filter((j) => j !== i && gaps.includes(j)).map((j) => lines[j]),
    });
    return { answer, options: shuffleWith([answer, ...wrong], rnd) };
  });
}

/**
 * Where a line sits in `context` when its code is there more than once (`return False` in two
 * functions, `curr = curr.next` in two loops): the occurrence after as many as are `above` it (the
 * code shown above it, which every caller without an `at` passes as `visible`). Undefined when the
 * line is there once (it is found by its code).
 */
function twinAt(context: readonly string[], line: string, above: readonly string[]): number | undefined {
  const key = keyOf(codeOnly(line));
  const at = context.flatMap((l, j) => (keyOf(codeOnly(l)) === key ? [j] : []));
  if (at.length < 2) return undefined;
  const seen = above.filter((l) => keyOf(codeOnly(l)) === key).length;
  return at[Math.min(seen, at.length - 1)];
}

/** `swapRuns`, remembered per snippet. */
function runsOf(lines: readonly string[]): number[][] {
  const memo = lines.join('\n');
  let v = runsMemo.get(memo);
  if (!v) {
    if (runsMemo.size > 500) runsMemo.clear();
    runsMemo.set(memo, (v = swapRuns(lines)));
  }
  return v;
}
const runsMemo = new Map<string, number[][]>();

/** The grader's `lineKey` of a line's code, remembered (for callers that compare many lines). */
export const optionKey = (line: string) => keyOf(codeOnly(line));
