// Grades typed code against an expected answer, line by line, the way a patient reviewer would.
//
// - Blank lines and comment-only lines are ignored on both sides.
// - Lines are compared with normalizeCode: spacing around operators and punctuation, quote style,
//   trailing comments and trailing commas do not matter; string contents and the space between
//   two words (`for n in`, not `forn in`) do.
// - Typed and expected lines are aligned with a longest-common-subsequence diff, so one extra or
//   missing line does not mark every following line wrong.
// - A matched line is only correct if its indentation, relative to the snippet's base indentation,
//   matches (Python cares). Lines with the right code but the wrong indentation are reported as
//   'indent', separately from wrong lines. When the editor sits under given code that the answer
//   must line up with, pass `anchor` (the editor's start column): indentation is then absolute.
//
// Pure: no React, no DOM. Display lives in src/components/CodeTyper.tsx.

import { swapRuns, topLevelAssign } from './order';
import { normalizeCode, stripComment } from './parseSolution';

/**
 * One row of the diff, in display order.
 * - `ok`:     the typed line matches an expected line (code and relative indentation).
 * - `indent`: the code matches but the relative indentation is wrong. Has `got` and `exp`.
 * - `del`:    a typed line that is not in the answer (extra, or wrong). Has `got`.
 * - `add`:    an expected line the learner did not write (missing, or what a wrong line should be). Has `exp`.
 */
export type GradeRowKind = 'ok' | 'indent' | 'del' | 'add';

export interface GradeRow {
  kind: GradeRowKind;
  /** The learner's line exactly as typed (ok, indent, del). */
  got?: string;
  /** The expected line as written in the answer (ok, indent, add). */
  exp?: string;
  /** Index into `Grade.typedLines` (ok, indent, del). */
  gotIndex?: number;
  /** Index into `Grade.expectedLines` (ok, indent, add). */
  expIndex?: number;
  /**
   * True on a `del` row directly followed by the `add` row that replaces it (a changed line),
   * and on that `add` row. False for a purely extra (`del`) or purely missing (`add`) line.
   */
  paired?: boolean;
}

export interface Grade {
  rows: GradeRow[];
  /** Expected lines matched with the right indentation. */
  correct: number;
  /** Expected code lines (non-blank, non-comment). */
  total: number;
  /** Surplus typed lines: `del` rows with no `add` partner (not counting changed lines). */
  extra: number;
  /** Changed lines: a `del` row paired with the `add` row it should have been. */
  wrong: number;
  /** Expected lines the learner left out: `add` rows with no `del` partner. */
  missing: number;
  /** Lines with the right code but the wrong relative indentation. */
  wrongIndent: number;
  /** Everything right: correct === total, nothing extra. */
  perfect: boolean;
  /** 0–1: correct / (total + extra). Extra lines count against it. 1 when both sides are empty. */
  score: number;
  /** Base indentation (columns) of the typed code; re-indent typed lines from here for display. */
  baseGot: number;
  /** Base indentation (columns) of the expected code; re-indent expected lines from here for display. */
  baseExp: number;
  /**
   * The editor's column when the grade was anchored (`GradeOptions.anchor`): typed column 0 sat
   * there, and expected lines are absolute. A diff then shows both sides from it, so a line typed
   * one level off is drawn one level off.
   */
  anchor?: number;
  /** The typed code lines that were graded (blank and comment-only lines removed). */
  typedLines: string[];
  /** The expected code lines that were graded (blank and comment-only lines removed). */
  expectedLines: string[];
}

/** Leading whitespace width in columns (a tab counts as 4). */
export function indentOf(s: string): number {
  return (s.match(/^\s*/)?.[0] ?? '').replace(/\t/g, '    ').length;
}

/** Re-indent a line from `from` columns to `to` columns (display only). Never cuts code. */
export function reindent(s: string, from: number, to: number): string {
  const body = s.replace(/^\s+/, (ws) => ws.replace(/\t/g, '    '));
  const cut = Math.min(from, indentOf(body));
  return ' '.repeat(Math.max(0, to)) + body.slice(cut);
}

/** True for lines the grader ignores: blank, or only a comment. */
export function isIgnorable(line: string): boolean {
  return stripComment(line).trim() === '';
}

/**
 * The lines of a snippet that the grader compares: blank and comment-only lines removed, trailing
 * whitespace and `#!` key-line markers dropped, tabs in the indentation expanded to 4 spaces.
 */
export function codeLines(src: string | string[]): string[] {
  const lines = Array.isArray(src) ? src.flatMap((l) => l.split('\n')) : src.split('\n');
  return lines
    .map((l) =>
      l
        .replace(/\s+#!\s*$/, '')
        .replace(/\s+$/, '')
        .replace(/^\s+/, (ws) => ws.replace(/\t/g, '    ')),
    )
    .filter((l) => !isIgnorable(l));
}

/**
 * The comparison key of one line: normalizeCode, plus trailing commas that change nothing do not
 * matter: `{a: 1,}`, and the comma after an item on its own line (`(1, 0),` in a list written over
 * several lines). A comma that ends an assignment or a return stays: `x = 1,` is a tuple, not 1.
 */
export function lineKey(line: string): string {
  const key = normalizeCode(line).replace(/,\}/g, '}');
  return /^(return|yield)\b/.test(key) || topLevelAssign(key).at >= 0 ? key : key.replace(/,+$/, '');
}

/** The smallest indentation among a snippet's code lines (0 if it has none): where an editor for it starts. */
export function baseIndent(src: string | string[]): number {
  const lines = codeLines(src);
  return lines.length ? Math.min(...lines.map(indentOf)) : 0;
}

export interface GradeOptions {
  /**
   * The column the editor starts at, when it sits under given lines the answer must line up with
   * (a part under the parts before it, a slide's answer under its starter). Typed column 0 is then
   * this column, so a line typed one level too deep (inside the block above) is a wrong indent.
   * Leave it out to grade indentation relative to the snippet's own base (a whole solution or
   * template typed into an empty editor may sit at any consistent depth).
   */
  anchor?: number;
}

/**
 * How deep each line sits: 0 at `base`, one more for every indentation that is still open above it
 * (Python's own rule, so any consistent width counts: 2 spaces, 4, a tab). A line left of `base` is
 * -1, and a line that dedents to a column no open block has (inconsistent typing) gets a depth
 * between the two blocks, which matches nothing.
 */
function depths(lines: readonly string[], base: number): number[] {
  const open = [base];
  return lines.map((l) => {
    const col = indentOf(l);
    if (col < base) return -1;
    const dedent = open[open.length - 1] > col;
    while (open.length > 1 && open[open.length - 1] > col) open.pop();
    if (col > open[open.length - 1]) {
      // After a dedent, a column no open block has: Python calls it an IndentationError.
      if (dedent) return open.length - 0.5;
      open.push(col);
    }
    return open.length - 1;
  });
}

/**
 * The expected lines, with each run of lines that may come in any order (`swapRuns`: neighboring
 * simple statements that do not touch each other's variables, such as `l += 1` and `r -= 1`) put
 * in the order the learner typed them, when the typed code has the same lines side by side.
 * Either order runs the same, so neither is a mistake.
 */
function orderLike(expected: string[], typed: readonly string[]): string[] {
  const runs = swapRuns(expected);
  if (!runs.length) return expected;
  const tk = typed.map(lineKey);
  const out = [...expected];
  for (const run of runs) {
    const keys = run.map((i) => lineKey(expected[i]));
    const want = [...keys].sort().join('\n');
    for (let at = 0; at + run.length <= tk.length; at++) {
      const window = tk.slice(at, at + run.length);
      if ([...window].sort().join('\n') !== want) continue;
      // The typed order of this run: place the expected lines to match it.
      const pool = run.map((i) => expected[i]);
      window.forEach((k, n) => {
        const j = pool.findIndex((line) => lineKey(line) === k);
        out[run[n]] = pool.splice(j, 1)[0];
      });
      break;
    }
  }
  return out;
}

/**
 * Grade typed code against the expected code.
 * @param typed    What the learner typed (the textarea value).
 * @param expected The answer: a string or an array of lines (may contain blank and comment lines).
 */
export function gradeCode(typed: string, expected: string | string[], opts: GradeOptions = {}): Grade {
  const t = codeLines(typed);
  const e = orderLike(codeLines(expected), t);
  const tk = t.map(lineKey);
  const ek = e.map(lineKey);
  const n = t.length;
  const m = e.length;

  // LCS table over suffixes: L[i][j] = LCS length of t[i..] and e[j..].
  const L: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      L[i][j] = tk[i] === ek[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    }
  }

  // Walk forward. Unmatched stretches between two matches become a "gap" of typed-only lines (del)
  // and expected-only lines (add); within a gap, pair them up so a changed line reads
  // "your line" directly above "expected".
  type Step = { kind: 'match'; i: number; j: number } | { kind: 'gap'; dels: number[]; adds: number[] };
  const steps: Step[] = [];
  let gap: { kind: 'gap'; dels: number[]; adds: number[] } | null = null;
  const flush = () => {
    if (gap) steps.push(gap);
    gap = null;
  };
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && tk[i] === ek[j]) {
      flush();
      steps.push({ kind: 'match', i, j });
      i++;
      j++;
    } else if (j >= m || (i < n && L[i + 1][j] >= L[i][j + 1])) {
      gap ??= { kind: 'gap', dels: [], adds: [] };
      gap.dels.push(i++);
    } else {
      gap ??= { kind: 'gap', dels: [], adds: [] };
      gap.adds.push(j++);
    }
  }
  flush();

  // Base indentation. With an anchor, typed column 0 is the editor's column, so the offset
  // (typed minus expected indentation) is fixed. Otherwise the snippet's base is anchored on its
  // outermost matched line (the matched pairs whose expected line is least indented); the most
  // common typed-minus-expected offset among those wins, earliest first on a tie. So typing a
  // body flush-left, or one extra line with odd indentation, does not shift every other line.
  const matches = steps.filter((s): s is { kind: 'match'; i: number; j: number } => s.kind === 'match');
  const minExpAll = e.length ? Math.min(...e.map(indentOf)) : 0;
  const minGotAll = t.length ? Math.min(...t.map(indentOf)) : 0;
  let offset = opts.anchor !== undefined ? -opts.anchor : minGotAll - minExpAll;
  if (matches.length && opts.anchor === undefined) {
    const outer = Math.min(...matches.map((s) => indentOf(e[s.j])));
    const counts = new Map<number, number>();
    let best = 0;
    for (const s of matches) {
      if (indentOf(e[s.j]) !== outer) continue;
      const off = indentOf(t[s.i]) - indentOf(e[s.j]);
      const c = (counts.get(off) ?? 0) + 1;
      counts.set(off, c);
      if (c > best) {
        best = c;
        offset = off;
      }
    }
  }
  const baseExp = minExpAll;
  const baseGot = Math.max(0, baseExp + offset);
  // Indentation is compared by depth, not by column: a body indented two spaces under its `for`
  // is as right as one indented four, as long as the typing is consistent. Typed column
  // `baseGot` is the answer's column `baseExp`.
  const depthGot = depths(t, baseGot);
  const depthExp = depths(e, baseExp);

  const rows: GradeRow[] = [];
  let correct = 0;
  let extra = 0;
  let wrong = 0;
  let missing = 0;
  let wrongIndent = 0;
  for (const s of steps) {
    if (s.kind === 'match') {
      // Right at the same depth, or at the very column the answer has it (the lines under a
      // missing `if` sit where they should, even though they are one block shallower).
      const ok = Number.isInteger(depthGot[s.i]) && (depthGot[s.i] === depthExp[s.j] || indentOf(t[s.i]) - indentOf(e[s.j]) === offset);
      if (ok) correct++;
      else wrongIndent++;
      rows.push({ kind: ok ? 'ok' : 'indent', got: t[s.i], exp: e[s.j], gotIndex: s.i, expIndex: s.j });
      continue;
    }
    const pairs = Math.min(s.dels.length, s.adds.length);
    for (let k = 0; k < pairs; k++) {
      rows.push({ kind: 'del', got: t[s.dels[k]], gotIndex: s.dels[k], paired: true });
      rows.push({ kind: 'add', exp: e[s.adds[k]], expIndex: s.adds[k], paired: true });
    }
    for (const d of s.dels.slice(pairs)) rows.push({ kind: 'del', got: t[d], gotIndex: d, paired: false });
    for (const a of s.adds.slice(pairs)) rows.push({ kind: 'add', exp: e[a], expIndex: a, paired: false });
    wrong += pairs;
    extra += s.dels.length - pairs;
    missing += s.adds.length - pairs;
  }

  const total = m;
  return {
    rows,
    correct,
    total,
    extra,
    wrong,
    missing,
    wrongIndent,
    perfect: correct === total && extra === 0,
    score: total + extra ? correct / (total + extra) : 1,
    baseGot,
    baseExp,
    anchor: opts.anchor,
    typedLines: t,
    expectedLines: e,
  };
}

/**
 * Grade against several accepted answers (e.g. equivalent solutions) and keep the closest one, to
 * diff against. Closest means, in order:
 * 1. the most lines whose code matches, whatever their indentation (`correct + wrongIndent`): a
 *    loop typed with its body flush-left is closest to the answer it copies, shown as an
 *    indentation slip, not to an alternative that scores higher only because a different line
 *    anchors the indentation;
 * 2. then the higher score (a perfect grade always wins here);
 * 3. then the fewest extra lines;
 * 4. then the earliest answer.
 */
export function gradeBest(typed: string, answers: (string | string[])[], opts: GradeOptions = {}): { grade: Grade; index: number } {
  const EPS = 1e-9;
  const matched = (g: Grade) => g.correct + g.wrongIndent;
  let bestGrade: Grade | null = null;
  let bestIndex = 0;
  answers.forEach((a, index) => {
    const g = gradeCode(typed, a, opts);
    const b = bestGrade;
    const better =
      !b ||
      matched(g) > matched(b) ||
      (matched(g) === matched(b) && (g.score > b.score + EPS || (Math.abs(g.score - b.score) <= EPS && g.extra < b.extra)));
    if (better) {
      bestGrade = g;
      bestIndex = index;
    }
  });
  return { grade: bestGrade ?? gradeCode(typed, [], opts), index: bestIndex };
}

/** The pieces of the summary: ["3 of 4 lines correct", "1 extra", "1 wrong indent"]. */
export function gradeSummaryParts(g: Grade): string[] {
  const parts = [`${g.correct} of ${g.total} line${g.total === 1 ? '' : 's'} correct`];
  if (g.extra > 0) parts.push(`${g.extra} extra`);
  if (g.wrongIndent > 0) parts.push(`${g.wrongIndent} wrong indent`);
  return parts;
}

/** "3 of 4 lines correct · 1 extra · 1 wrong indent": the summary TyperFooter shows. */
export function gradeSummary(g: Grade): string {
  return gradeSummaryParts(g).join(' · ');
}

/**
 * A learner's typed lines as a whole file: under the lines the editor shows as given (the class
 * and method signature), at the body's indentation. Whatever column the learner started from (the
 * editor's own, or the full indentation typed out) their relative indentation is kept.
 */
export function withGiven(given: readonly string[], typed: string, indent: number): string {
  const lines = typed.replace(/\t/g, '    ').split('\n');
  const used = lines.filter((l) => l.trim());
  const base = used.length ? Math.min(...used.map((l) => l.length - l.trimStart().length)) : 0;
  const body = lines.map((l) => (l.trim() ? ' '.repeat(indent) + l.slice(base) : ''));
  return [...given, ...body].join('\n');
}
