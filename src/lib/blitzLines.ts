// Key lines, Pattern Blitz's code game: which learned problem and key line comes next, the few
// lines of code shown around the blank, and the options when the line is picked. Pure: no React,
// no DOM. The game is src/pages/Blitz.tsx.
//
// - A round is one key line (`#!` in the solution) of a learned problem, blanked as a single gap.
//   It is typed, or picked from four options while the problem's code is still new ("Pick first,
//   then type": `problemInput` in lib/input.ts decides per round; `keyLineChoices` gives the options).
// - Only a window of code is shown (a few lines before, a few after) plus the def lines that
//   enclose it, so a round is quick on a phone. `class Solution:` is dropped and the code is
//   dedented to its first visible level, which saves columns on a narrow screen.
// - Due and weak problems come up more; the same problem never comes twice in a row (when there
//   is another), and a key line comes back only once every other one has had its turn.

import type { Problem } from '../content/types';
import { gapChoices, type GapChoice } from './choices';
import { indentOf, lineKey } from './codegrade';
import { today } from './date';
import { gapCandidates } from './gaps';
import { parseSolution, stripComment } from './parseSolution';
import { crowns } from './srs';
import type { Progress } from './store';

/** Learned problems (with key lines) needed before Key lines opens. */
export const KEY_LINES_MIN = 3;

/** Lines of context shown before and after the blank. */
const BEFORE = 6;
const AFTER = 3;

const SOLUTION_CLASS = /^class\s+Solution\s*(\(\s*(object)?\s*\))?\s*:\s*$/;
const SCOPE = /^\s*((async\s+)?def|class)\s/;

export interface KeyLineView {
  /**
   * Def / class lines that enclose the blank but sit above the window, with their real line
   * numbers (1-based), already dedented. Show them first; a jump in `n` is folded code.
   */
  head: { n: number; text: string }[];
  /** The contiguous window around the blank, dedented (blank lines kept, as in the file). */
  lines: string[];
  /** Line number of `lines[0]` (1-based, as in the whole solution). */
  start: number;
  /** Index of the blank in `lines`. */
  gap: number;
  /** The expected line, dedented like `lines` (the same string as `lines[gap]`). */
  answer: string;
  /** The plain-English explanation of the part this line belongs to (markdown). */
  explain: string;
  /** Another visible line has the same code, so the answer would be on screen. */
  twinVisible: boolean;
}

/** The window of code for key line `k` (an index into `parseSolution(p.solution).lines`). */
export function keyLineView(p: Problem, k: number, { before = BEFORE, after = AFTER } = {}): KeyLineView {
  const parsed = parseSolution(p.solution);
  const all = parsed.lines.map((l) => l.text);
  const first = SOLUTION_CLASS.test(all[0] ?? '') ? 1 : 0;
  let from = Math.max(first, k - before);
  let to = Math.min(all.length - 1, k + after);
  while (from < k && all[from].trim() === '') from++;
  while (to > k && all[to].trim() === '') to--;

  // The def / class lines the blank sits in (innermost first), kept when above the window.
  const head: number[] = [];
  let level = indentOf(all[k]);
  for (let j = k - 1; j >= first && level > 0; j--) {
    const t = all[j];
    if (stripComment(t).trim() === '') continue;
    const ind = indentOf(t);
    if (ind >= level) continue;
    level = ind;
    if (j < from && SCOPE.test(t) && !SOLUTION_CLASS.test(t)) head.unshift(j);
  }
  // A scope line right above the window joins it (no fold between them).
  while (head.length && head[head.length - 1] === from - 1) {
    head.pop();
    from--;
  }

  const shown = [...head, ...Array.from({ length: to - from + 1 }, (_, i) => from + i)];
  const base = Math.min(...shown.filter((i) => all[i].trim() !== '').map((i) => indentOf(all[i])));
  const dedent = (s: string) => (s.trim() === '' ? '' : s.slice(Math.min(base, indentOf(s))));
  const key = lineKey(all[k]);
  const chunk = parsed.chunks[parsed.lines[k].chunk];
  return {
    head: head.map((i) => ({ n: i + 1, text: dedent(all[i]) })),
    lines: all.slice(from, to + 1).map(dedent),
    start: from + 1,
    gap: k - from,
    answer: dedent(all[k]),
    explain: chunk?.explain ?? '',
    twinVisible: shown.some((i) => i !== k && all[i].trim() !== '' && lineKey(all[i]) === key),
  };
}

/**
 * The options of a picked round: the key line (code only, as the window shows it) and three
 * plausible wrong lines, changes to it first (`gapChoices`, in the context of the whole solution),
 * then lines of the solution with its shape that are not on screen. Deterministic per `seed`, so
 * "Fix and check again" shows the same options; pass a new seed each time the line comes up, so
 * the right option moves.
 */
export function keyLineChoices(p: Problem, k: number, view: KeyLineView, seed: number): GapChoice {
  const all = parseSolution(p.solution).lines.map((l) => l.text);
  const from = view.start - 1;
  const shown = new Set([...view.head.map((h) => h.n - 1), ...view.lines.map((_, i) => from + i)]);
  const hidden = all.filter((l, i) => i !== k && !shown.has(i) && l.trim() !== '');
  return gapChoices(view.lines, [view.gap], seed, 3, hidden, { context: all, at: k, visible: view.head.map((h) => h.text) })[0];
}

/**
 * The key lines of a problem that make a fair blank: a whole statement (not part of one that spans
 * several lines), not the header, and not a line whose exact code stays visible in its window.
 */
export function blitzKeyLines(p: Problem): number[] {
  const hit = fairCache.get(p.solution);
  if (hit) return hit;
  const parsed = parseSolution(p.solution);
  const texts = parsed.lines.map((l) => l.text);
  const header = parsed.lines.flatMap((l, i) => (l.header ? [i] : []));
  const fair = new Set(gapCandidates(texts, header));
  const out = parsed.lines.flatMap((l, i) => (l.key && !l.header && fair.has(i) && !keyLineView(p, i).twinVisible ? [i] : []));
  fairCache.set(p.solution, out);
  return out;
}
const fairCache = new Map<string, number[]>();

export interface KeyLineEntry {
  p: Problem;
  /** Key line indices (into `parseSolution(p.solution).lines`). */
  lines: number[];
  /** How often it comes up, relative to the others: due and weak problems more. */
  weight: number;
}

/** The learned problems with fair key lines, weighted toward due and weak ones. */
export function keyLinePool(progress: Progress, problems: readonly Problem[], day = today()): KeyLineEntry[] {
  const out: KeyLineEntry[] = [];
  for (const p of problems) {
    const pp = progress.problems[p.id];
    if (!pp?.learnedAt) continue;
    const lines = blitzKeyLines(p);
    if (!lines.length) continue;
    let weight = 1;
    if (pp.srs && pp.srs.due <= day) weight += 2;
    if (crowns(pp.srs) <= 1) weight += 1;
    if (pp.lastGrade === 'again') weight += 1.5;
    else if (pp.lastGrade === 'hard') weight += 0.75;
    out.push({ p, lines, weight });
  }
  return out;
}

export interface KeyLineRef {
  id: string;
  line: number;
}

export const refKey = (r: KeyLineRef) => `${r.id}:${r.line}`;

/**
 * The next round: a weighted pick among the problems that still have a key line not played this
 * game (`used`), never the same problem as `last` when the pool has another, then one of its
 * unplayed lines. Once every line has been played (or only `last`'s are left), `reset` is true and a
 * new cycle starts: the caller clears `used`. `bonus` adds weight per problem (e.g. one missed earlier in this game).
 */
export function nextKeyLine(
  pool: readonly KeyLineEntry[],
  used: ReadonlySet<string>,
  last: KeyLineRef | null,
  { bonus = () => 0, rnd = Math.random }: { bonus?: (id: string) => number; rnd?: () => number } = {},
): { ref: KeyLineRef; reset: boolean } | null {
  if (!pool.length) return null;
  const open = (skip: ReadonlySet<string>) =>
    pool
      .map((e) => ({ e, lines: e.lines.filter((l) => !skip.has(refKey({ id: e.p.id, line: l }))) }))
      .filter((x) => x.lines.length > 0);
  const notLast = (xs: ReturnType<typeof open>) => xs.filter((x) => x.e.p.id !== last?.id);
  let reset = false;
  let cands = open(used);
  // Nothing left, or only lines of the problem just played while others exist: start a new cycle.
  if (!cands.length || (!notLast(cands).length && pool.some((e) => e.p.id !== last?.id))) {
    reset = true;
    cands = open(new Set(last ? [refKey(last)] : []));
    if (!cands.length) cands = open(new Set()); // a single key line in the whole pool
  }
  if (notLast(cands).length) cands = notLast(cands);

  const weights = cands.map((x) => Math.max(0.1, x.e.weight + bonus(x.e.p.id)));
  let r = rnd() * weights.reduce((a, b) => a + b, 0);
  let pickIdx = cands.length - 1;
  for (let i = 0; i < cands.length; i++) {
    r -= weights[i];
    if (r < 0) {
      pickIdx = i;
      break;
    }
  }
  const chosen = cands[pickIdx];
  const line = chosen.lines[Math.min(chosen.lines.length - 1, Math.floor(rnd() * chosen.lines.length))];
  return { ref: { id: chosen.e.p.id, line }, reset };
}
