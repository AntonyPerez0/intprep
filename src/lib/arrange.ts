// "Arrange a part": a code-line Parsons problem (Parsons & Haden 2006; Ericson, Margulieux & Rick
// 2017). The part's lines come as blocks at their real indentation, shuffled, plus one paired
// distractor (a small mutation of one of its lines, shown next to it) when the part has two or more
// code lines; the learner puts the right ones in order. The pick twin of "Write a part".
//
// Pure: no React, no DOM. The component lives in src/components/Arrange.tsx.

import { gradeCode, indentOf, lineKey, type Grade } from './codegrade';
import { codeOnly, mutateLine } from './choices';
import { hashString, seededRandom, shuffleWith } from './random';

export interface ArrangeBlock {
  /** Stable id: `b0`, `b1`… in the solution's order, `x` for the distractor. */
  id: string;
  /** The code (no trailing comment), indented relative to the part's base (column 0 = the part's least indented line). */
  text: string;
  /** `text`'s indentation in columns. */
  indent: number;
  /** The paired distractor: not in the solution. */
  distractor: boolean;
  /** The distractor's pair: the id of the line it mutates. */
  pair?: string;
}

export interface ArrangeSet {
  /** The bank's order: shuffled, never the solution's order; the distractor sits next to its pair. */
  blocks: ArrangeBlock[];
  /** The solution's lines in order (code only, relative indentation): what `gradeArrange` compares with. */
  expected: string[];
  /** The part's base indentation in its file (columns): display every block from here. */
  base: number;
}

export interface ArrangeOptions {
  /** Indices into `lines` of key lines: the distractor mutates one of them first. */
  keyLines?: readonly number[];
  /** Add the paired distractor (default true; only ever with two or more code lines). */
  distractor?: boolean;
}

const expandTabs = (s: string) => s.replace(/^\s+/, (ws) => ws.replace(/\t/g, '    '));

/**
 * The blocks for one part. `lines` are the part's lines as in the file (blank and comment lines
 * are dropped, trailing comments too); `seed` is the instance (a session's round, a retry): the
 * same seed and lines always give the same bank. Lines that are equal after the grader's
 * `lineKey` are interchangeable (see `gradeArrange`).
 */
export function arrangeBlocks(lines: readonly string[], seed = 0, opts: ArrangeOptions = {}): ArrangeSet {
  const code = lines.flatMap((l, i) => {
    const c = expandTabs(codeOnly(l));
    return c.trim() ? [{ c, i }] : [];
  });
  const base = code.length ? Math.min(...code.map(({ c }) => indentOf(c))) : 0;
  const expected = code.map(({ c }) => c.slice(base));
  const real: ArrangeBlock[] = expected.map((text, k) => ({ id: `b${k}`, text, indent: indentOf(text), distractor: false }));
  const rnd = seededRandom(hashString(`${seed}|${expected.join('\n')}`));

  // The paired distractor: a mutation of a key line first, else of the longest line, that is not
  // any line of the part (so it can never stand in for one).
  let distractor: ArrangeBlock | null = null;
  if (real.length >= 2 && opts.distractor !== false) {
    const keys = new Set(expected.map(lineKey));
    const isKey = new Set((opts.keyLines ?? []).map((i) => code.findIndex((x) => x.i === i)).filter((k) => k >= 0));
    const order = real
      .map((b, k) => ({ b, k }))
      .sort((a, b) => Number(isKey.has(b.k)) - Number(isKey.has(a.k)) || b.b.text.trim().length - a.b.text.trim().length || a.k - b.k);
    for (const { b } of order) {
      const m = shuffleWith(mutateLine(b.text), rnd).find((s) => lineKey(s) && !keys.has(lineKey(s)));
      if (m) {
        distractor = { id: 'x', text: m, indent: indentOf(m), distractor: true, pair: b.id };
        break;
      }
    }
  }

  // Shuffle the real lines, never into the solution's order (by code, so equal lines count as one).
  const solved = (bs: ArrangeBlock[]) => bs.length > 1 && bs.every((b, k) => lineKey(b.text) === lineKey(expected[k]));
  let bank = shuffleWith(real, rnd);
  for (let t = 0; t < 8 && solved(bank); t++) bank = shuffleWith(real, rnd);
  if (solved(bank)) bank = [...bank.slice(1), bank[0]];
  if (distractor) {
    // Next to its pair, before or after it, so the two read as a choice.
    const at = bank.findIndex((b) => b.id === distractor!.pair);
    bank.splice(rnd() < 0.5 ? at : at + 1, 0, distractor);
  }
  return { blocks: bank, expected, base };
}

export interface ArrangeGrade {
  /** The typing kit's line diff of the placed lines against the solution (rows: ok, del, add, indent). */
  grade: Grade;
  /** Per placed position: right (in the solution, in order) or not. */
  results: { block: ArrangeBlock; ok: boolean }[];
  /** Solution lines placed in order. */
  correct: number;
  /** Solution lines. */
  total: number;
  /** The distractor was placed. */
  usedDistractor: boolean;
  /** Solution lines still in the bank. */
  missing: number;
  /** Every solution line in order, nothing else. */
  perfect: boolean;
  /** 0–1: correct / (total + 1 if the distractor was placed). */
  score: number;
}

/**
 * Grade a placed order. Lines are aligned with the kit's longest-common-subsequence diff
 * (`gradeCode`, anchored at column 0), so a line out of place marks only that line, and lines that
 * are equal after `lineKey` are interchangeable.
 */
export function gradeArrange(placed: readonly ArrangeBlock[], expected: readonly string[]): ArrangeGrade {
  const grade = gradeCode(placed.map((b) => b.text).join('\n'), [...expected], { anchor: 0 });
  const ok = new Set(grade.rows.flatMap((r) => (r.kind === 'ok' && r.gotIndex !== undefined ? [r.gotIndex] : [])));
  const results = placed.map((block, k) => ({ block, ok: ok.has(k) }));
  const usedDistractor = placed.some((b) => b.distractor);
  const realPlaced = placed.filter((b) => !b.distractor).length;
  const total = expected.length;
  const correct = grade.correct;
  return {
    grade,
    results,
    correct,
    total,
    usedDistractor,
    missing: Math.max(0, total - realPlaced),
    perfect: correct === total && placed.length === total && !usedDistractor,
    score: total ? correct / (total + (usedDistractor ? 1 : 0)) : 1,
  };
}

/** "3 of 5 lines in place", plus "1 not in the solution" when the distractor was placed. */
export function arrangeSummaryParts(g: Pick<ArrangeGrade, 'correct' | 'total' | 'usedDistractor'>): string[] {
  const parts = [`${g.correct} of ${g.total} line${g.total === 1 ? '' : 's'} in place`];
  if (g.usedDistractor) parts.push('1 not in the solution');
  return parts;
}

export const arrangeSummary = (g: Pick<ArrangeGrade, 'correct' | 'total' | 'usedDistractor'>) => arrangeSummaryParts(g).join(' · ');
