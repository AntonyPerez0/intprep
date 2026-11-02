// Plausible wrong lines for picking code: the options of a missing line ("Pick the key line",
// "Pick the gaps") and the paired distractor of "Arrange a part" (src/lib/arrange.ts).
//
// A distractor is a small mutation of the right line first (an operator, a bound, a pointer, a
// method swapped: `<` for `<=`, `left` for `right`, `heappush` for `heappop`, an off-by-one), so the
// choice is about the idea, not about spotting a stranger. Only when a line has too few mutations
// do other real lines of the snippet fill in, re-indented to match. Options are code only (no
// trailing comment) and never equal the answer, or each other, after the grader's `lineKey`
// (spacing, quote style and trailing commas do not matter).
//
// Pure: no React, no DOM, no content. Re-exported from src/lib/drills.ts.

import { lineKey } from './codegrade';
import { stripComment } from './parseSolution';
import { hashString, seededRandom, shuffle, shuffleWith } from './random';

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
  '**': ['*'],
  '+=': ['-='],
  '-=': ['+='],
  '//': ['/', '%'],
  '%': ['//'],
  '&': ['|'],
  '|': ['&'],
  '^': ['|', '&'],
  '<<': ['>>'],
  '>>': ['<<'],
  and: ['or'],
  or: ['and'],
  if: ['while'],
  while: ['if'],
  break: ['continue'],
  continue: ['break'],
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
  is: ['is not'],
  items: ['keys', 'values'],
  keys: ['values'],
  values: ['keys'],
  extend: ['append'],
  None: ['0'],
};

const TOKENS = /(\s+|[A-Za-z_]\w*|\d+|==|!=|<=|>=|\+=|-=|\*=|\/\/=|\/\/|\*\*|<<=|>>=|<<|>>|->|:=|[^\sA-Za-z_\d])/g;

/** Mutations that read as nonsense rather than as a plausible mistake. */
const NONSENSE = /\bfor\b[^:]*\bnot in\b|\bnot not\b|\bnot in not\b|\bis not in\b|\bis not not\b/;

/**
 * Plausible wrong versions of a line: one token swapped (operators, bounds, pointers, methods,
 * literals), an off-by-one, the operands of a comparison or of a plain assignment swapped. Keeps
 * the indentation. Mutates the whole line as given: strip a trailing comment first (`lineChoices`
 * does) so a swap inside the comment does not count.
 */
export function mutateLine(line: string): string[] {
  const toks = line.match(TOKENS) ?? [];
  const indent = line.match(/^\s*/)?.[0] ?? '';
  const out: string[] = [];
  const firstWord = toks.findIndex((t) => t.trim() !== '');
  toks.forEach((t, i) => {
    const alts = SWAP[t];
    if (!alts) return;
    // `if` / `while` swap only as the statement (not in `a if c else b` or a comprehension).
    if ((t === 'if' || t === 'while') && i !== firstWord) return;
    for (const alt of alts) {
      const copy = [...toks];
      copy[i] = alt;
      out.push(copy.join(''));
    }
  });
  // Off-by-one style mutations.
  if (/\s[+-]\s1\b/.test(line)) out.push(line.replace(/\s[+-]\s1\b/, ''));
  if (/\[[^\]]+\]/.test(line) && !/\s[+-]\s1\]/.test(line)) out.push(line.replace(/\[([^\]:]+)\]/, '[$1 + 1]'));
  if (/\blen\([^()]+\)(?!\s*[-+])/.test(line)) out.push(line.replace(/\blen\(([^()]+)\)(?!\s*[-+])/, 'len($1) - 1'));
  if (/\benumerate\(([^(),]+)\)/.test(line)) out.push(line.replace(/\benumerate\(([^(),]+)\)/, 'enumerate($1, 1)'));
  if (/\brange\(([^(),]+)\)/.test(line)) out.push(line.replace(/\brange\(([^(),]+)\)/, 'range(1, $1)'));
  // Swap operands of a simple comparison (one comparison, no `and` / `or`).
  const cmp = line.match(/^(\s*(?:if|while|elif)\s+)([^<>=!]+?)\s*(<=|>=|<|>)\s*([^<>=!]+?)(:)\s*$/);
  if (cmp && !/\b(and|or|not)\b/.test(line)) out.push(`${cmp[1]}${cmp[4]} ${cmp[3]} ${cmp[2]}${cmp[5]}`);
  // Swap the operands of a subtraction or a division (`target - x` / `x - target`).
  const sub = line.match(/^(\s*[\w.]+(?:\[[^\]]+\])?\s*[-+*/%]?=\s*)([\w.]+(?:\[[^\]]+\])?)\s*(-|\/\/|\/|%)\s*([\w.]+(?:\[[^\]]+\])?)\s*$/);
  if (sub && sub[2] !== sub[4]) out.push(`${sub[1]}${sub[4]} ${sub[3]} ${sub[2]}`);
  // Swap the names of a two-name target (`for i, x in` / `a, b = …`).
  const pair = line.match(/^(\s*(?:for\s+)?)([A-Za-z_]\w*),\s*([A-Za-z_]\w*)(\s+in\s|\s*=(?!=))(.*)$/);
  if (pair && pair[2] !== pair[3]) out.push(`${pair[1]}${pair[3]}, ${pair[2]}${pair[4]}${pair[5]}`);
  // Drop a `not` (`if not stack:` / `if stack:`).
  if (/\bnot\s+(?!in\b)/.test(line) && !/\bis\s+not\b/.test(line)) out.push(line.replace(/\bnot\s+(?!in\b)/, ''));
  // Swap the sides of a plain assignment (`prev = curr` / `curr = prev`).
  const asg = line.match(/^(\s*)([\w.]+(?:\[[^\]]+\])?)\s*=\s*([\w.]+(?:\[[^\]]+\])?)\s*$/);
  if (asg && asg[2] !== asg[3] && !/^\d/.test(asg[3])) out.push(`${asg[1]}${asg[3]} = ${asg[2]}`);
  // Swap the two arguments of a call (`max(a, b)` stays meaningful, `range(a, b)` does not).
  const call = line.match(/^(.*?\b(?:range|divmod|pow|insert|get)\()([^(),]+),\s*([^(),]+)(\).*)$/);
  if (call && call[2].trim() !== call[3].trim()) out.push(`${call[1]}${call[3].trim()}, ${call[2].trim()}${call[4]}`);
  // Containers that set something up: `[]` / `{}` / `set()`.
  if (/=\s*\[\]\s*$/.test(line)) out.push(line.replace(/\[\]\s*$/, '{}'));
  if (/=\s*\{\}\s*$/.test(line)) out.push(line.replace(/\{\}\s*$/, '[]'));
  if (/=\s*set\(\)\s*$/.test(line)) out.push(line.replace(/set\(\)\s*$/, '{}'));
  if (/float\(["']inf["']\)/.test(line)) out.push(line.replace(/float\((["'])inf\1\)/, 'float($1-inf$1)'));
  else if (/float\(["']-inf["']\)/.test(line)) out.push(line.replace(/float\((["'])-inf\1\)/, 'float($1inf$1)'));
  return [...new Set(out)].filter((s) => s.startsWith(indent) && s !== line && !NONSENSE.test(s));
}

/** A line as an option shows it: the code at its own indentation, without a trailing comment or `#!` marker. */
export function codeOnly(line: string): string {
  return stripComment(line.replace(/\s+#!\s*$/, '')).replace(/\s+$/, '');
}

const indentStr = (s: string) => s.match(/^\s*/)?.[0] ?? '';

/** Lines that make poor stand-ins for another line: structure (def, class, imports, decorators) and one-word statements. */
const POOR_STAND_IN = /^(@|import\s|from\s+\S+\s+import\s|(async\s+)?def\s|class\s|pass$|break$|continue$|return$|else:$|try:$|finally:$|"""|''')/;

/**
 * Up to `n` wrong options for `answer`: mutations of it first (see `mutateLine`), then other real
 * lines from `otherLines`, re-indented to the answer's indentation. Code only (no trailing comment),
 * deduplicated with the grader's `lineKey`, and never equal to the answer after it. `rnd` orders
 * each kind (default `Math.random`; pass `seededRandom(seed)` for options that must stay the same
 * on a retry or a reload).
 */
export function lineChoices(answer: string, otherLines: readonly string[] = [], n = 3, rnd: () => number = Math.random): string[] {
  const code = codeOnly(answer);
  const indent = indentStr(code);
  const seen = new Set([lineKey(code)]);
  const out: string[] = [];
  const tryAdd = (s: string) => {
    const k = lineKey(s);
    if (out.length < n && k && !seen.has(k)) {
      seen.add(k);
      out.push(s);
    }
  };
  shuffleWith(mutateLine(code), rnd).forEach(tryAdd);
  if (out.length < n) {
    const others = otherLines
      .map((l) => codeOnly(l).trim())
      .filter((t) => t.length > 6 && !POOR_STAND_IN.test(t));
    shuffleWith(others, rnd).forEach((t) => tryAdd(indent + t));
  }
  return out;
}

/** The options of one gap: the answer (code only, at its line's indentation) and up to three wrong lines, in a fixed order. */
export interface GapChoice {
  /** The right option (code only, at the line's indentation). */
  answer: string;
  /** The answer and the wrong lines, shuffled. */
  options: string[];
}

/**
 * The options for each gap of a snippet (`gaps`: indices into `lines`, as `pickGaps` returns them):
 * the answer plus up to `n` wrong lines (`lineChoices`, with the snippet's other lines, then
 * `extra` lines, as the fallback). Deterministic per `seed` and content, so a retry or a reload
 * shows the same options.
 */
export function gapChoices(lines: readonly string[], gaps: readonly number[], seed = 0, n = 3, extra: readonly string[] = []): GapChoice[] {
  return gaps.map((i, k) => {
    const rnd = seededRandom(hashString(`${seed}:${k}:${lines[i] ?? ''}`));
    const answer = codeOnly(lines[i] ?? '');
    // Fallback lines that are not on screen first (the other gaps' lines, then `extra`): a line
    // the learner can see elsewhere in the code is the easiest option to rule out.
    const hidden = [...gaps.filter((j) => j !== i).map((j) => lines[j] ?? ''), ...extra];
    const wrong = lineChoices(answer, hidden, n, rnd);
    if (wrong.length < n) {
      const seen = new Set(wrong.map(lineKey));
      const visible = lines.filter((_, j) => j !== i && !gaps.includes(j));
      for (const w of lineChoices(answer, visible, n, rnd)) if (wrong.length < n && !seen.has(lineKey(w))) wrong.push(w);
    }
    return { answer, options: shuffleWith([answer, ...wrong], rnd) };
  });
}

/** `lineChoices` for one line, with the answer mixed in at random (not seeded): a quick multiple-choice question. */
export function lineOptions(answer: string, otherLines: readonly string[] = [], n = 3): string[] {
  return shuffle([codeOnly(answer), ...lineChoices(answer, otherLines, n)]);
}
