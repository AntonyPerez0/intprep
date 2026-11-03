// "Arrange a part": a code-line Parsons problem (Parsons & Haden 2006; Ericson, Margulieux & Rick
// 2017). The part's lines come as blocks at their real indentation, shuffled, plus one paired
// distractor (a small mutation of one of its lines, shown next to it) when the part has two or more
// code lines; the learner puts the right ones in order. The pick twin of "Write a part".
//
// Neighboring lines whose order does not matter (`left += 1` / `right -= 1`; see `swapRuns` in
// order.ts) are right in either order. The distractor follows the rules of choices.ts (a plausible
// change, never the same code in disguise, only names the solution defines) and is never a line of
// the solution anywhere, so "Not in the solution" is true.
//
// Pure: no React, no DOM. The component lives in src/components/Arrange.tsx.

import { gradeCode, indentOf, type Grade } from './codegrade';
import { canonKey, codeOnly, lineChanges, optionKey } from './choices';
import { canSwap, swapRuns } from './order';
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
  /** The bank's order: shuffled, never an order that is already right; the distractor sits next to its pair. */
  blocks: ArrangeBlock[];
  /** The solution's lines in order (code only, relative indentation): what `gradeArrange` compares with. */
  expected: string[];
  /** The part's base indentation in its file (columns): display every block from here. */
  base: number;
  /** Runs of neighboring `expected` lines that may come in any order (indices into `expected`; see `swapRuns`). */
  swappable: number[][];
}

export interface ArrangeOptions {
  /** Indices into `lines` of key lines: the distractor mutates one of them first. */
  keyLines?: readonly number[];
  /** Add the paired distractor (default true; only ever with two or more code lines). */
  distractor?: boolean;
  /**
   * The whole solution the part comes from (its lines as in the file): the distractor is never one
   * of its lines, and uses only names it defines. Default: the part alone.
   */
  avoid?: readonly string[];
}

const expandTabs = (s: string) => s.replace(/^\s+/, (ws) => ws.replace(/\t/g, '    '));

/**
 * The blocks for one part. `lines` are the part's lines as in the file (blank and comment lines
 * are dropped, trailing comments too); `seed` is the instance (a session's round, a retry): the
 * same seed and lines always give the same bank. Lines that are equal after the grader's
 * `lineKey`, and runs of lines whose order does not matter, are interchangeable (see `gradeArrange`).
 */
export function arrangeBlocks(lines: readonly string[], seed = 0, opts: ArrangeOptions = {}): ArrangeSet {
  const code = lines.flatMap((l, i) => {
    const c = expandTabs(codeOnly(l));
    return c.trim() ? [{ c, i }] : [];
  });
  const base = code.length ? Math.min(...code.map(({ c }) => indentOf(c))) : 0;
  const expected = code.map(({ c }) => c.slice(base));
  const swappable = swapRuns(expected);
  const real: ArrangeBlock[] = expected.map((text, k) => ({ id: `b${k}`, text, indent: indentOf(text), distractor: false }));
  const rnd = seededRandom(hashString(`${seed}|${expected.join('\n')}`));

  // The paired distractor: a change to a key line first, else to the longest line, that is not any
  // line of the solution (so it can never stand in for one, and "Not in the solution" is true).
  let distractor: ArrangeBlock | null = null;
  if (real.length >= 2 && opts.distractor !== false) {
    const solution = opts.avoid?.length ? opts.avoid : lines;
    const all = [...solution, ...lines].map(codeOnly).filter((l) => l.trim());
    const canons = new Set(all.map((l) => canonKey(l)));
    const context = solution.map(codeOnly);
    const isKey = new Set((opts.keyLines ?? []).map((i) => code.findIndex((x) => x.i === i)).filter((k) => k >= 0));
    const order = real
      .map((b, k) => ({ b, k }))
      .sort((a, b) => Number(isKey.has(b.k)) - Number(isKey.has(a.k)) || b.b.text.trim().length - a.b.text.trim().length || a.k - b.k);
    // Changes to a line itself first (a key line's first), then other names and values.
    for (const other of [false, true]) {
      for (const { b, k } of order) {
        // The line's own place in the solution, for the names defined before it.
        const at = context.findIndex((l) => l.trim() && optionKey(l) === optionKey(code[k].c));
        const ch = lineChanges(b.text, { context, at: at >= 0 ? at : undefined }, other);
        const m = shuffleWith(other ? ch.other : ch.own, rnd).find((s) => s.trim() && !canons.has(canonKey(s)));
        if (m) {
          distractor = { id: 'x', text: m, indent: indentOf(m), distractor: true, pair: b.id };
          break;
        }
      }
      if (distractor) break;
    }
  }

  // Shuffle the real lines, never into an order that is already right.
  const solved = (bs: ArrangeBlock[]) => bs.length > 1 && settle(bs, expected).every((b, k) => b.text === expected[k]);
  let bank = shuffleWith(real, rnd);
  for (let t = 0; t < 8 && solved(bank); t++) bank = shuffleWith(real, rnd);
  if (solved(bank)) bank = [...bank.slice(1), bank[0]];
  if (distractor) {
    // Next to its pair, before or after it, so the two read as a choice.
    const at = bank.findIndex((b) => b.id === distractor!.pair);
    bank.splice(rnd() < 0.5 ? at : at + 1, 0, distractor);
  }
  return { blocks: bank, expected, base, swappable };
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
  /**
   * Lines the learner was graded on: the solution's, plus one when the distractor was placed as an
   * extra line (its pair placed too). The distractor placed instead of its pair is one wrong line,
   * as typing that line would be.
   */
  outOf: number;
  /** Solution lines still in the bank. */
  missing: number;
  /** Every solution line in order, nothing else. */
  perfect: boolean;
  /** 0–1: correct / outOf. */
  score: number;
}

/**
 * The placed blocks with lines whose order does not matter put back in the solution's order: two
 * neighbors that can trade places (`canSwap`) and stand the other way round from the solution are
 * swapped, until none is. An order that only differs from the solution by such swaps becomes the
 * solution's (any order where every two lines that depend on each other keep their order), and
 * any other order keeps the learner's mistakes where they made them.
 */
function settle(placed: readonly ArrangeBlock[], expected: readonly string[]): ArrangeBlock[] {
  // Each real block's place in the solution (equal lines take the next free place, in order).
  const used = new Set<number>();
  const rank = new Map<ArrangeBlock, number>();
  for (const b of placed) {
    if (b.distractor) continue;
    const k = expected.findIndex((t, j) => !used.has(j) && t === b.text);
    if (k >= 0) {
      used.add(k);
      rank.set(b, k);
    }
  }
  const out = [...placed];
  for (let moved = true; moved; ) {
    moved = false;
    for (let i = 0; i + 1 < out.length; i++) {
      const [a, b] = [out[i], out[i + 1]];
      const ra = rank.get(a);
      const rb = rank.get(b);
      if (ra === undefined || rb === undefined || ra < rb || !canSwap(a.text, b.text)) continue;
      out[i] = b;
      out[i + 1] = a;
      moved = true;
    }
  }
  return out;
}

/**
 * Grade a placed order. Lines whose order does not matter count as right in either order (`settle`:
 * neighbors that can trade places, `canSwap`); then lines are aligned with the kit's
 * longest-common-subsequence diff (`gradeCode`, anchored at column 0), so a line out of place marks
 * only that line, and lines that are equal after `lineKey` are interchangeable.
 */
export function gradeArrange(placed: readonly ArrangeBlock[], expected: readonly string[]): ArrangeGrade {
  const order = settle(placed, expected);
  const graded = gradeCode(order.map((b) => b.text).join('\n'), [...expected], { anchor: 0 });
  // A run placed in another right order shows the learner's lines where they put them.
  const grade = { ...graded, rows: graded.rows.map((r) => (r.kind === 'ok' && r.gotIndex !== undefined && order[r.gotIndex] !== placed[r.gotIndex] ? { ...r, got: placed[r.gotIndex].text } : r)) };
  const okAt = new Set(graded.rows.flatMap((r) => (r.kind === 'ok' && r.gotIndex !== undefined ? [r.gotIndex] : [])));
  const okBlocks = new Set(order.filter((_, k) => okAt.has(k)));
  const results = placed.map((block) => ({ block, ok: okBlocks.has(block) }));
  const distractor = placed.find((b) => b.distractor);
  const usedDistractor = !!distractor;
  const realPlaced = placed.filter((b) => !b.distractor).length;
  const total = expected.length;
  const correct = grade.correct;
  // Placed instead of its pair, the distractor is that line done wrong; next to it, a line too many.
  const outOf = total + (distractor && placed.some((b) => b.id === distractor.pair) ? 1 : 0);
  return {
    grade,
    results,
    correct,
    total,
    usedDistractor,
    outOf,
    missing: Math.max(0, total - realPlaced),
    perfect: correct === total && placed.length === total && !usedDistractor,
    score: outOf ? correct / outOf : 1,
  };
}

/** "3 of 5 lines in place", plus "1 not in the solution" when the distractor was placed. */
export function arrangeSummaryParts(g: Pick<ArrangeGrade, 'correct' | 'total' | 'usedDistractor'>): string[] {
  const parts = [`${g.correct} of ${g.total} line${g.total === 1 ? '' : 's'} in place`];
  if (g.usedDistractor) parts.push('1 not in the solution');
  return parts;
}

export const arrangeSummary = (g: Pick<ArrangeGrade, 'correct' | 'total' | 'usedDistractor'>) => arrangeSummaryParts(g).join(' · ');
