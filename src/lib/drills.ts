// Builds drill questions from content: pattern recognition, technique, key-line
// fill-ins (with plausible "mutant" distractors) and complexity questions.

import { CATEGORIES } from '../content/categories';
import { PROBLEMS } from '../content/index';
import type { CategoryId, Problem } from '../content/types';
import { normalizeCode, parseSolution } from './parseSolution';
import { pick, sample, shuffle } from './random';

export type DrillKind = 'pattern' | 'technique' | 'insight' | 'order' | 'keyline' | 'complexity';

export const DRILL_LABEL: Record<DrillKind, string> = {
  pattern: 'Spot the pattern',
  technique: 'Name the technique',
  insight: 'Recall the key insight',
  order: 'Put the steps in order',
  keyline: 'Fill in the key line',
  complexity: 'Know the complexity',
};

// ── Pattern recognition ─────────────────────────────────────────────────────

/** Categories that are fair answers for this problem. */
export const acceptedCategories = (p: Problem): CategoryId[] => [p.category, ...(p.alsoAccept ?? [])];

// Pairs that are easy to confuse make better distractors than random ones.
const CONFUSABLE: Partial<Record<CategoryId, CategoryId[]>> = {
  'arrays-hashing': ['two-pointers', 'sliding-window', 'greedy'],
  'two-pointers': ['sliding-window', 'binary-search', 'arrays-hashing'],
  'sliding-window': ['two-pointers', 'arrays-hashing', 'dp-1d'],
  stack: ['heap', 'two-pointers', 'backtracking'],
  'binary-search': ['two-pointers', 'heap', 'greedy'],
  'linked-list': ['two-pointers', 'stack', 'arrays-hashing'],
  trees: ['graphs', 'backtracking', 'linked-list'],
  tries: ['trees', 'arrays-hashing', 'backtracking'],
  heap: ['binary-search', 'intervals', 'greedy'],
  backtracking: ['dp-1d', 'graphs', 'trees'],
  graphs: ['trees', 'advanced-graphs', 'backtracking'],
  'advanced-graphs': ['graphs', 'heap', 'dp-2d'],
  'dp-1d': ['greedy', 'backtracking', 'dp-2d'],
  'dp-2d': ['dp-1d', 'backtracking', 'graphs'],
  greedy: ['dp-1d', 'intervals', 'heap'],
  intervals: ['greedy', 'heap', 'two-pointers'],
  'math-geometry': ['arrays-hashing', 'bit-manipulation', 'two-pointers'],
  'bit-manipulation': ['math-geometry', 'arrays-hashing', 'dp-1d'],
};

export function patternChoices(p: Problem, n = 4): { options: CategoryId[]; answer: CategoryId } {
  const ok = new Set(acceptedCategories(p));
  const pool = CATEGORIES.map((c) => c.id).filter((c) => !ok.has(c));
  const near = shuffle((CONFUSABLE[p.category] ?? []).filter((c) => !ok.has(c))).slice(0, 2);
  const rest = shuffle(pool.filter((c) => !near.includes(c)));
  const distractors = [...near, ...rest].slice(0, n - 1);
  return { options: shuffle([p.category, ...distractors]), answer: p.category };
}

export function techniqueChoices(p: Problem, n = 4): { options: string[]; answer: string } {
  const ok = new Set(acceptedCategories(p));
  const pool = [...new Set(PROBLEMS.filter((q) => !ok.has(q.category) && q.pattern !== p.pattern).map((q) => q.pattern))];
  return { options: shuffle([p.pattern, ...sample(pool, n - 1)]), answer: p.pattern };
}

// ── Complexity ──────────────────────────────────────────────────────────────

const COMMON = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(2ⁿ)', 'O(n · m)', 'O(n³)', 'O(k)', 'O(n!)'];

/** The leading Big-O term, e.g. "O(1) per get and put" → "O(1)". */
export function bigOCore(s: string): string {
  const t = s.trim();
  if (!t.startsWith('O(')) return t;
  let depth = 0;
  for (let i = 1; i < t.length; i++) {
    if (t[i] === '(') depth++;
    else if (t[i] === ')' && --depth === 0) return t.slice(0, i + 1);
  }
  return t;
}

// Order-insensitive fingerprint so "O(m·n)" and "O(n · m)" count as the same answer.
const canon = (s: string) =>
  bigOCore(s)
    .toLowerCase()
    .replace(/[\s·*]/g, '')
    .replace(/\^2/g, '²')
    .split('')
    .sort()
    .join('');

export function complexityChoices(p: Problem, which: 'time' | 'space'): { options: string[]; answer: string } {
  const answer = p[which].split(/\s+—|\s+\(/)[0].trim();
  const seen = new Set([canon(answer)]);
  // Distractors are clean Big-O terms only (no "per call" qualifiers).
  const fromContent = PROBLEMS.map((q) => bigOCore(q[which])).filter((c) => c.startsWith('O(') && c.length <= 14);
  const pool = shuffle([...COMMON, ...shuffle(fromContent).slice(0, 10)]);
  const out: string[] = [];
  for (const c of pool) {
    if (out.length >= 3) break;
    if (seen.has(canon(c))) continue;
    seen.add(canon(c));
    out.push(c);
  }
  return { options: shuffle([answer, ...out]), answer };
}

// ── Key line fill-in ────────────────────────────────────────────────────────

const SWAP: Record<string, string[]> = {
  '<': ['<=', '>'],
  '<=': ['<', '>='],
  '>': ['>=', '<'],
  '>=': ['>', '<='],
  '==': ['!='],
  '!=': ['=='],
  '+': ['-'],
  '-': ['+'],
  '*': ['+'],
  '+=': ['-='],
  '-=': ['+='],
  '//': ['/', '%'],
  '%': ['//'],
  and: ['or'],
  or: ['and'],
  min: ['max'],
  max: ['min'],
  left: ['right'],
  right: ['left'],
  l: ['r'],
  r: ['l'],
  lo: ['hi'],
  hi: ['lo'],
  i: ['j'],
  j: ['i'],
  start: ['end'],
  end: ['start'],
  slow: ['fast'],
  fast: ['slow'],
  prev: ['curr', 'nxt'],
  curr: ['prev'],
  True: ['False'],
  False: ['True'],
  append: ['pop', 'appendleft'],
  pop: ['popleft', 'append'],
  popleft: ['pop'],
  appendleft: ['append'],
  heappush: ['heappop'],
  heappop: ['heappush'],
  add: ['remove'],
  remove: ['add'],
  '0': ['1'],
  '1': ['0', '2'],
  '2': ['1'],
  row: ['col'],
  col: ['row'],
  r1: ['r2'],
  c1: ['c2'],
  next: ['prev'],
  in: ['not in'],
};

const TOKENS = /(\s+|[A-Za-z_]\w*|\d+|==|!=|<=|>=|\+=|-=|\*=|\/\/|\*\*|[^\sA-Za-z_\d])/g;

export function mutateLine(line: string): string[] {
  const toks = line.match(TOKENS) ?? [];
  const indent = line.match(/^\s*/)?.[0] ?? '';
  const out: string[] = [];
  toks.forEach((t, i) => {
    const alts = SWAP[t];
    if (!alts) return;
    // Do not mutate the leading indentation or keywords that would break syntax.
    for (const alt of alts) {
      const copy = [...toks];
      copy[i] = alt;
      out.push(copy.join(''));
    }
  });
  // Off-by-one style mutations.
  if (/\s[+-]\s1\b/.test(line)) out.push(line.replace(/\s[+-]\s1\b/, ''));
  if (/\[[^\]]+\]/.test(line) && !/\s[+-]\s1\]/.test(line)) out.push(line.replace(/\[([^\]:]+)\]/, '[$1 + 1]'));
  // Swap operands of a simple comparison.
  const cmp = line.match(/^(\s*(?:if|while|elif)\s+)(.+?)\s*(<=|>=|<|>)\s*(.+?)(:)\s*$/);
  if (cmp) out.push(`${cmp[1]}${cmp[4]} ${cmp[3]} ${cmp[2]}${cmp[5]}`);
  return [...new Set(out)].filter((s) => s.startsWith(indent));
}

export interface KeyLineDrill {
  /** Index into parsed.lines of the blanked line. */
  lineIndex: number;
  answer: string;
  options: string[];
}

export function keyLineDrill(p: Problem, avoid?: number): KeyLineDrill | null {
  const parsed = parseSolution(p.solution);
  const keys = parsed.lines.map((l, i) => ({ l, i })).filter(({ l }) => l.key && !l.header);
  if (!keys.length) return null;
  const choices = keys.length > 1 && avoid !== undefined ? keys.filter((k) => k.i !== avoid) : keys;
  const { l, i } = pick(choices);
  const answer = l.text;
  const norm = new Set([normalizeCode(answer)]);
  const options: string[] = [];
  const tryAdd = (s: string) => {
    const n = normalizeCode(s);
    if (options.length < 3 && n && !norm.has(n)) {
      norm.add(n);
      options.push(s);
    }
  };
  shuffle(mutateLine(answer)).forEach(tryAdd);
  // Fall back to other real lines from the solution (re-indented to match).
  if (options.length < 3) {
    const indent = answer.match(/^\s*/)?.[0] ?? '';
    shuffle(parsed.lines.filter((x, j) => j !== i && !x.header && x.text.trim().length > 6)).forEach((x) =>
      tryAdd(indent + x.text.trim()),
    );
  }
  return { lineIndex: i, answer, options: shuffle([answer, ...options]) };
}

/** Lines are "the same" if they only differ in whitespace/quotes/trailing commas. */
export const sameCode = (a: string, b: string) => normalizeCode(a) === normalizeCode(b);

// ── Session decks ───────────────────────────────────────────────────────────

export interface DrillCardSpec {
  kind: DrillKind;
  problemId: string;
  uid: string;
  /** A second try at a card missed earlier in the session (not graded). */
  retry?: boolean;
}

/**
 * The cards used to review one problem. Pattern recognition always comes first
 * (it is the skill interviews test hardest); the rest is varied.
 */
export function cardsForProblem(p: Problem, count = 3): DrillCardSpec[] {
  const extra: DrillKind[] = shuffle(['insight', 'order', 'keyline', 'complexity', 'technique'] as DrillKind[]);
  // Insight recall is the most valuable after pattern: include it most of the time.
  const chosen: DrillKind[] = ['pattern'];
  if (Math.random() < 0.7) chosen.push('insight');
  for (const k of extra) if (chosen.length < count && !chosen.includes(k)) chosen.push(k);
  return chosen.map((kind, i) => ({ kind, problemId: p.id, uid: `${p.id}:${kind}:${i}` }));
}
