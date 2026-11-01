// Grades typed code against an expected answer, line by line, the way a patient reviewer would.
//
// - Blank lines and comment-only lines are ignored on both sides.
// - Lines are compared with normalizeCode: whitespace, quote style, trailing comments and trailing
//   commas do not matter.
// - Typed and expected lines are aligned with a longest-common-subsequence diff, so one extra or
//   missing line does not mark every following line wrong.
// - A matched line is only correct if its indentation, relative to the snippet's base indentation,
//   matches (Python cares). Lines with the right code but the wrong indentation are reported as
//   'indent', separately from wrong lines.
//
// Pure: no React, no DOM. Display lives in src/components/CodeTyper.tsx.

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

/** The comparison key of one line: normalizeCode, plus trailing commas (`{a: 1,}`, end of line) do not matter. */
export function lineKey(line: string): string {
  return normalizeCode(line)
    .replace(/,\}/g, '}')
    .replace(/,+$/, '');
}

/**
 * Grade typed code against the expected code.
 * @param typed    What the learner typed (the textarea value).
 * @param expected The answer: a string or an array of lines (may contain blank and comment lines).
 */
export function gradeCode(typed: string, expected: string | string[]): Grade {
  const t = codeLines(typed);
  const e = codeLines(expected);
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

  // Base indentation. The snippet's base is anchored on its outermost matched line (the matched
  // pairs whose expected line is least indented); the most common typed-minus-expected offset
  // among those wins, earliest first on a tie. So typing a body flush-left, or one extra line
  // with odd indentation, does not shift every other line.
  const matches = steps.filter((s): s is { kind: 'match'; i: number; j: number } => s.kind === 'match');
  const minExpAll = e.length ? Math.min(...e.map(indentOf)) : 0;
  const minGotAll = t.length ? Math.min(...t.map(indentOf)) : 0;
  let offset = minGotAll - minExpAll;
  if (matches.length) {
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

  const rows: GradeRow[] = [];
  let correct = 0;
  let extra = 0;
  let wrong = 0;
  let missing = 0;
  let wrongIndent = 0;
  for (const s of steps) {
    if (s.kind === 'match') {
      const ok = indentOf(t[s.i]) - indentOf(e[s.j]) === offset;
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
export function gradeBest(typed: string, answers: (string | string[])[]): { grade: Grade; index: number } {
  const EPS = 1e-9;
  const matched = (g: Grade) => g.correct + g.wrongIndent;
  let bestGrade: Grade | null = null;
  let bestIndex = 0;
  answers.forEach((a, index) => {
    const g = gradeCode(typed, a);
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
  return { grade: bestGrade ?? gradeCode(typed, []), index: bestIndex };
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
