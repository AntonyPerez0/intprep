// Builds drill questions from content: pattern recognition, technique, key lines (typed, or
// picked from plausible "mutant" distractors), complexity questions, and the coding cards of the
// review deck (Fill the gaps, Write a part, and their pick twins: Pick the gaps, Arrange a part).
// Also builds the review deck itself.

import { CATEGORIES } from '../content/categories';
import { NO_DISTRACTOR_PARTS } from '../content/distractorDeny';
import { PROBLEMS } from '../content/index';
import type { CategoryId, Problem } from '../content/types';
import { codeLines, lineKey } from './codegrade';
import { gapCandidates, gapSource, lineWeight, pickGaps, type GapSource } from './gaps';
import { lessonParts, normalizeCode, parseSolution, type LessonPart } from './parseSolution';
import { arrangeBlocks } from './arrange';
import { codeOnly, gapChoices, isRealPick, lineChoices, type GapChoice } from './choices';
import { PICK_UNTIL_REPS, type CodeInput } from './input';
import { pick, sample, shuffle, shuffleWith } from './random';
import type { SrsCard } from './srs';

export type DrillKind = 'pattern' | 'technique' | 'insight' | 'order' | 'keyline' | 'complexity' | 'gaps' | 'part';

export const DRILL_LABEL: Record<DrillKind, string> = {
  pattern: 'Spot the pattern',
  technique: 'Name the technique',
  insight: 'Recall the key insight',
  order: 'Put the steps in order',
  keyline: 'Write the key line',
  complexity: 'Know the complexity',
  gaps: 'Fill the gaps',
  part: 'Write a part',
};

/** The pick twins' names: the same exercise, picked from choices instead of typed. */
export const PICK_LABEL: Partial<Record<DrillKind, string>> = {
  keyline: 'Pick the key line',
  gaps: 'Pick the gaps',
  part: 'Arrange a part',
};

/** A card's name for its input: "Pick the gaps" for a picked Fill the gaps card, else `DRILL_LABEL`. */
export function drillLabel(kind: DrillKind, input?: CodeInput): string {
  return (input === 'pick' && PICK_LABEL[kind]) || DRILL_LABEL[kind];
}

/**
 * Problems per review session. Each brings three cards (one recognition card, two coding cards),
 * and coding cards take longer than a multiple-choice question.
 */
export const SESSION_PROBLEMS = { due: 8, ahead: 5, unit: 5 } as const;

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
// Distractors (mutations of the right line) live in ./choices, shared with Pick the gaps and
// Arrange a part; re-exported here for older imports.

export { codeOnly, gapChoices, isGivenLine, isRealPick, lineChoices, MIN_PICK_OPTIONS, type GapChoice } from './choices';

export interface KeyLineDrill {
  /** Index into parsed.lines of the blanked line. */
  lineIndex: number;
  /** The line as written in the solution (indentation and trailing comment included). */
  answer: string;
  /** The answer as it shows among the options (code only, see `codeOnly`). */
  option: string;
  /** The answer and three plausible wrong lines (code only), shuffled. */
  options: string[];
}

/** Indices into `parseSolution(p.solution).lines` of the key lines a drill can blank (never the header). */
export function keyLineIndices(p: Problem): number[] {
  return parseSolution(p.solution).lines.flatMap((l, i) => (l.key && !l.header ? [i] : []));
}

/**
 * A key line to blank, with three plausible wrong options (`lineChoices`: changes to the line, in
 * the context of its solution). The card shows the whole solution, so no other line of it is
 * offered as a fallback; when the line has too few changes, key lines of the same pattern's other
 * problems with its shape fill in (only ones that use names this solution defines before the
 * line). Only when nothing else makes three options may a change of the line be one that is on
 * screen (`self.stack.pop()` for `self.min_stack.pop()`: plainly wrong, so it is the last resort).
 * `at` asks for a specific line (an index from `keyLineIndices`); otherwise a random key line,
 * other than `avoid` when there is one. `rnd` orders the options (default `Math.random`; seeded in
 * checks).
 */
export function keyLineDrill(p: Problem, avoid?: number, at?: number, rnd: () => number = Math.random): KeyLineDrill | null {
  const parsed = parseSolution(p.solution);
  const keys = parsed.lines.map((l, i) => ({ l, i })).filter(({ l }) => l.key && !l.header);
  if (!keys.length) return null;
  const choices = keys.length > 1 && avoid !== undefined ? keys.filter((k) => k.i !== avoid) : keys;
  const { l, i } = keys.find((k) => k.i === at) ?? choices[Math.floor(rnd() * choices.length)];
  const answer = l.text;
  const all = parsed.lines.map((x) => x.text);
  const option = codeOnly(answer);
  const wrong = lineChoices(answer, patternKeyLines(p), 3, rnd, { context: all, at: i, visible: all });
  return { lineIndex: i, answer, option, options: shuffleWith([option, ...wrong], rnd) };
}

/**
 * Whether Pick the key line can ask key line `i`: a real pick (`isRealPick`: at least three options).
 * The number of options does not depend on their order, so one build answers for every card.
 */
export function keyLinePickable(p: Problem, i: number): boolean {
  const memo = `${p.id}:${i}`;
  let v = keyPickMemo.get(memo);
  if (v === undefined) {
    const d = keyLineDrill(p, undefined, i, () => 0);
    keyPickMemo.set(memo, (v = !!d && d.lineIndex === i && isRealPick(d.answer, d.options)));
  }
  return v;
}
const keyPickMemo = new Map<string, boolean>();

/** Key lines of the other problems of a problem's pattern (fallback options for Pick the key line). */
function patternKeyLines(p: Problem): string[] {
  const hit = patternLinesMemo.get(p.id);
  if (hit) return hit;
  const out = PROBLEMS.filter((q) => q.category === p.category && q.id !== p.id).flatMap((q) => parseSolution(q.solution).lines.flatMap((l) => (l.key && !l.header ? [l.text] : [])));
  patternLinesMemo.set(p.id, out);
  return out;
}
const patternLinesMemo = new Map<string, string[]>();

/** Lines are "the same" if they only differ in whitespace/quotes/trailing commas. */
export const sameCode = (a: string, b: string) => normalizeCode(a) === normalizeCode(b);

// ── Coding cards ────────────────────────────────────────────────────────────

/** A review "Fill the gaps" card: the whole solution, the header given, and the lines to type. */
export interface ReviewGaps extends GapSource {
  /** Indices into `lines` to blank, sorted. */
  gaps: number[];
}

/**
 * The few lines a review "Fill the gaps" card blanks: 2 for a short solution (6 code lines or
 * fewer), else 3, always including a key line. `seed` is the instance: 0 is the canonical set
 * (key lines first); each later seed steps away from the one before (see `pickGaps`), so a retry
 * or the next session practices other lines. Sessions use even seeds (`2 * round`) and a missed
 * card's retry the odd one after it, so the instance before seed `s` is `s - 1` for a retry and
 * `s - 2` for a session: the set never repeats that one when the solution has other lines to blank.
 */
export function reviewGaps(p: Problem, seed = 0): ReviewGaps {
  const memo = `${p.id}:${seed}`;
  const hit = gapsMemo.get(memo);
  if (hit) return hit;
  const src = gapSource(p.solution);
  const body = codeLines(src.lines.filter((_, i) => !src.header.includes(i))).length;
  const n = body <= 6 ? 2 : 3;
  let gaps = pickGaps(src.lines, { keyLines: src.keyLines, exclude: src.header, min: n, max: n, seed });
  const candList = gapCandidates(src.lines, src.header);
  const cands = new Set(candList);
  const keys = src.keyLines.filter((i) => cands.has(i));
  // A line whose code is not on screen elsewhere (blanking it does not leave the answer in view).
  const unique = (i: number) => !src.lines.some((l, j) => j !== i && lineKey(l) === lineKey(src.lines[i]));
  const weight = (i: number) => lineWeight(src.lines[i]);
  if (keys.length && gaps.length && !gaps.some((i) => keys.includes(i))) {
    // Swap the lightest gap for a key line, preferring one whose code is not on screen elsewhere.
    const pool = keys.filter(unique).length ? keys.filter(unique) : keys;
    const add = pool[seed % pool.length];
    const drop = gaps.reduce((a, b) => (weight(b) < weight(a) ? b : a));
    gaps = [...gaps.filter((i) => i !== drop), add].sort((a, b) => a - b);
  }
  // The key-line swap can rebuild the set just practiced: the missed card (for a retry) or the
  // last session. Then keep a key line, drop the lightest other gap, and blank the strongest line
  // that was not a gap last time.
  const prevSeed = seed % 2 ? seed - 1 : seed - 2;
  if (prevSeed >= 0 && gaps.length && gaps.length < candList.length) {
    const prev = reviewGaps(p, prevSeed).gaps;
    if (prev.length === gaps.length && prev.every((x, k) => x === gaps[k])) {
      const keep = gaps.find((i) => keys.includes(i)) ?? -1;
      const others = gaps.filter((i) => i !== keep);
      const fresh = candList.filter((i) => !prev.includes(i));
      const pool = fresh.filter(unique).length ? fresh.filter(unique) : fresh;
      if (others.length && pool.length) {
        const drop = others.reduce((a, b) => (weight(b) < weight(a) ? b : a));
        const add = pool.reduce((a, b) => (weight(b) > weight(a) ? b : a));
        gaps = [...gaps.filter((i) => i !== drop), add].sort((a, b) => a - b);
      }
    }
  }
  const out = { ...src, gaps };
  gapsMemo.set(memo, out);
  return out;
}

/** reviewGaps per problem and seed: each seed checks the one before it, so a chain is built once. */
const gapsMemo = new Map<string, ReviewGaps>();

/**
 * The parts a "Write a part" card can ask for, by chunk index: the guided lesson's split
 * (`lessonParts`), so class-level signatures that open a part are given, as in the lesson, and
 * only the body is written and graded.
 */
export function reviewParts(p: Problem): Map<number, LessonPart> {
  return new Map(lessonParts(parseSolution(p.solution)).map((lp) => [lp.ci, lp]));
}

/**
 * How much a "Write a part" card wants a part: key lines first, then 2 to 6 lines to write. Picked
 * ("Arrange a part"), a part of more than 8 lines steps back: a long bank of shuffled lines is a
 * puzzle, not practice; so does a part of two lines with no distractor (`arrangeable`): its bank
 * is just the two lines the wrong way round. A one-line part that is no real pick (`partPickable`)
 * is never dealt picked while another part is.
 */
function partScore(p: Problem, lp: LessonPart, input: CodeInput = 'type'): number {
  return baseScore(lp, input) - (input === 'pick' && !arrangeable(p, lp) ? 3 : 0);
}

/**
 * A one-line part's options, as "Pick the next line" shows them: changes to the line in the context
 * of its solution, then lines from later parts with its shape (not on screen); never the code above
 * it. `given`: the line is no real pick (`isRealPick`: bare structure such as `else:` or a `def`
 * line, or fewer than three options), so it is not asked as one.
 */
export function oneLinePick(p: Problem, ci: number, seed = 0): { line: string; choice: GapChoice; given: boolean } {
  const parsed = parseSolution(p.solution);
  const lp = reviewParts(p).get(ci)!;
  const line = lp.body.find((l) => codeOnly(l).trim() !== '') ?? '';
  const before = parsed.chunks.slice(0, ci).flatMap((c) => c.lines);
  const later = parsed.chunks.slice(ci + 1).flatMap((c) => c.lines);
  const choice = gapChoices([line], [0], seed, 3, later, { context: parsed.lines.map((l) => l.text), visible: [...before, ...lp.lead] })[0];
  return { line, choice, given: !isRealPick(line, choice.options) };
}

/**
 * Whether a part can be asked picked: Arrange a part (two lines or more), or a one-line part that
 * is a real pick (`oneLinePick`). The number of options does not depend on the seed.
 */
export function partPickable(p: Problem, lp: LessonPart): boolean {
  if (codeLines(lp.body).length !== 1) return true;
  const memo = `${p.id}:${lp.ci}`;
  let v = partPickMemo.get(memo);
  if (v === undefined) partPickMemo.set(memo, (v = !oneLinePick(p, lp.ci).given));
  return v;
}
const partPickMemo = new Map<string, boolean>();

/** `partScore` without the distractor check (which builds options, so it is left for last). */
function baseScore(lp: LessonPart, input: CodeInput): number {
  const n = codeLines(lp.body).length;
  return (lp.chunk.keyLines.length ? 2 : 0) + (n >= 2 && n <= 6 ? 1 : 0) - (input === 'pick' && n > 8 ? 3 : 0);
}

/**
 * Whether a part makes a real Arrange: one line (picked from options instead), three or more, or
 * two with a distractor.
 */
export function arrangeable(p: Problem, lp: LessonPart): boolean {
  // Precomputed with the deny list (scripts/check-distractors.py; `npm run validate` checks it is current).
  return !noDistractor.has(`${p.id}:${lp.ci}`);
}
const noDistractor = new Set(NO_DISTRACTOR_PARTS);

/** `arrangeable` worked out (builds the part's distractor): for the script that precomputes it, and validate. */
export function arrangeableNow(p: Problem, lp: LessonPart): boolean {
  const n = codeLines(lp.body).length;
  const keyLines = lp.chunk.keyLines.map((k) => k - lp.lead.length).filter((k) => k >= 0 && k < lp.body.length);
  return n !== 2 || arrangeBlocks(lp.body, 0, { keyLines, avoid: parseSolution(p.solution).lines.map((l) => l.text) }).blocks.some((b) => b.distractor);
}

/** The body chunks a "Write a part" card can ask for (indices into `parseSolution(p.solution).chunks`), best first; picked, only `partPickable` ones. */
export function partChunks(p: Problem, input: CodeInput = 'type'): number[] {
  return [...reviewParts(p).values()]
    .filter((lp) => codeLines(lp.body).length > 0 && (input !== 'pick' || partPickable(p, lp)))
    .sort((a, b) => partScore(p, b, input) - partScore(p, a, input) || a.ci - b.ci)
    .map((lp) => lp.ci);
}

/**
 * The chunk for a "Write a part" (or "Arrange a part") card: from the best tier (see `partScore`),
 * rotating by `seed` (the session), never one in `avoid` (parts already asked) while another exists.
 * Picked, never a one-line part that is no real pick (`partPickable`) while the problem has another.
 */
export function pickPart(p: Problem, seed = 0, avoid: readonly number[] = [], input: CodeInput = 'type'): number {
  const parts = reviewParts(p);
  const usable = [...parts.values()].filter((lp) => codeLines(lp.body).length > 0);
  const pickable = input === 'pick' ? usable.filter((lp) => partPickable(p, lp)) : usable;
  // Best first by the cheap score; the distractor check (picked only) runs on as few parts as it
  // takes to know the best tier, which is the same tier `partScore` over every part would give.
  const all = (pickable.length ? pickable : usable)
    .sort((a, b) => baseScore(b, input) - baseScore(a, input) || a.ci - b.ci)
    .map((lp) => lp.ci);
  const free = all.filter((i) => !avoid.includes(i));
  const pool = free.length ? free : all;
  const score = new Map<number, number>();
  let best = -Infinity;
  for (const i of pool) {
    const base = baseScore(parts.get(i)!, input);
    if (base < best) break;
    const s = input === 'pick' ? partScore(p, parts.get(i)!, input) : base;
    score.set(i, s);
    best = Math.max(best, s);
  }
  const tier = pool.filter((i) => score.get(i) === best).sort((a, b) => a - b);
  return tier[seed % tier.length];
}

/**
 * A key line for a "Write the key line" card (index into `parseSolution(p.solution).lines`), rotating by `seed`.
 * The card shows the whole solution, so a key line whose code also stands elsewhere in it (the
 * answer in plain view) is left out while another exists. Picked, only a real pick
 * (`keyLinePickable`); undefined when the problem has none.
 */
export function pickKeyLine(p: Problem, seed = 0, avoid: readonly number[] = [], input: CodeInput = 'type'): number | undefined {
  const all = keyLineIndices(p).filter((i) => input !== 'pick' || keyLinePickable(p, i));
  const lines = parseSolution(p.solution).lines;
  const twin = (i: number) => lines.some((l, j) => j !== i && l.text.trim() !== '' && lineKey(l.text) === lineKey(lines[i].text));
  const unique = all.filter((i) => !twin(i));
  const base = unique.length ? unique : all;
  const free = base.filter((i) => !avoid.includes(i));
  const pool = free.length ? free : base.length ? base : all;
  return pool.length ? pool[seed % pool.length] : undefined;
}

// ── Session decks ───────────────────────────────────────────────────────────

export interface DrillCardSpec {
  kind: DrillKind;
  problemId: string;
  uid: string;
  /** A second try at a card missed earlier in the session (not graded). */
  retry?: boolean;
  /** The recognition card that opens this problem's cards in the session. */
  lead?: boolean;
  /** Coding cards: which instance (Fill the gaps: the gap set's seed; key line and part: the rotation). */
  seed?: number;
  /** Write the key line: the line to blank (index into `parseSolution(...).lines`). */
  line?: number;
  /** Write a part: the chunk to write (index into `parseSolution(...).chunks`). */
  chunk?: number;
  /** Coding cards: picked from choices (Pick the key line, Pick the gaps, Arrange a part) or typed. A retry keeps it. */
  input?: CodeInput;
}

/**
 * Where a problem is in its schedule, which decides its coding cards:
 * - new: no card yet, or fewer than `PICK_UNTIL_REPS` right reviews in a row (the first review, or
 *   right after a lapse): in "Pick first, then type" its code is picked;
 * - fill: an interval under 10 days;
 * - young: 10 to 20 days;
 * - mature: 21 days or more.
 */
export type CodeStage = 'new' | 'fill' | 'young' | 'mature';

export function codeStage(card?: Pick<SrsCard, 'interval' | 'reps'> | null): CodeStage {
  if (!card || card.reps < PICK_UNTIL_REPS) return 'new';
  if (card.interval < 10) return 'fill';
  return card.interval <= 20 ? 'young' : 'mature';
}

/**
 * The two coding cards for a stage and input:
 * | stage  | pick                              | type                          |
 * | new    | Arrange a part + Pick the gaps    | Write the key line + Fill the gaps |
 * | fill   | Pick the key line + Pick the gaps | Write the key line + Fill the gaps |
 * | young  | Pick the gaps + Arrange a part    | Fill the gaps + Write a part  |
 * | mature | Arrange a part twice (two parts), or a part + the gaps when there is one part |
 */
export function codingKinds(stage: CodeStage, input: CodeInput, parts: number): DrillKind[] {
  if (stage === 'new') return input === 'pick' ? ['part', 'gaps'] : ['keyline', 'gaps'];
  if (stage === 'fill') return ['keyline', 'gaps'];
  if (stage === 'young') return ['gaps', 'part'];
  return parts > 1 ? ['part', 'part'] : ['part', 'gaps'];
}

/** The recognition cards other than Spot the pattern: they stay in the mix, rarely. */
const RECOGNITION_OTHER: DrillKind[] = ['insight', 'technique', 'complexity', 'order'];

export interface DeckOptions {
  /** The problem's spaced-repetition card (picks the coding cards; see `codeStage`). */
  srs?: Pick<SrsCard, 'interval' | 'reps'>;
  /** Reviews done so far: each session rotates to other gaps, parts and key lines. */
  round?: number;
  /**
   * How this problem's coding cards take input (`problemInput(settings.typingMode, progress)`):
   * picked from choices or typed. Default 'type'.
   */
  input?: CodeInput;
}

/**
 * The cards used to review one problem: one recognition card first (Spot the pattern about 70% of
 * the time, otherwise the key insight, the technique, the complexity or the steps in order), then
 * two coding cards chosen by the problem's stage and input (see `codingKinds`). Every coding card
 * carries the input.
 */
export function cardsForProblem(p: Problem, { srs, round = 0, input = 'type' }: DeckOptions = {}): DrillCardSpec[] {
  const lead: DrillKind = Math.random() < 0.7 ? 'pattern' : pick(RECOGNITION_OTHER);
  let coding = codingKinds(codeStage(srs), input, partChunks(p, input).length);
  // A solution without a key line to blank (picked: without one that is a real pick): a part
  // instead (or the gaps). Picked, a problem without a part to pick asks the gaps instead.
  const hasKeyLine = input === 'pick' ? pickKeyLine(p, 0, [], 'pick') !== undefined : keyLineIndices(p).length > 0;
  if (coding.includes('keyline') && !hasKeyLine) coding = coding.map((k) => (k === 'keyline' ? (coding.includes('part') ? 'gaps' : 'part') : k));
  if (input === 'pick' && coding.includes('part') && !partChunks(p, 'pick').length) {
    coding = coding.map((k) => (k === 'part' ? (coding.includes('keyline') || !hasKeyLine ? 'gaps' : 'keyline') : k));
  }
  coding = coding.filter((k, j) => k !== 'gaps' || coding.indexOf('gaps') === j);
  const out: DrillCardSpec[] = [{ kind: lead, problemId: p.id, uid: `${p.id}:${lead}:0`, lead: true }];
  coding.forEach((kind, k) => {
    const spec: DrillCardSpec = { kind, problemId: p.id, uid: `${p.id}:${kind}:${k + 1}`, input };
    if (kind === 'gaps') spec.seed = 2 * round;
    if (kind === 'keyline') {
      spec.seed = round;
      spec.line = pickKeyLine(p, round, out.flatMap((c) => (c.line !== undefined ? [c.line] : [])), input);
    }
    if (kind === 'part') {
      spec.seed = round;
      spec.chunk = pickPart(p, round, out.flatMap((c) => (c.chunk !== undefined ? [c.chunk] : [])), input);
    }
    out.push(spec);
  });
  // The lead card stays first; the coding cards come in either order, so a session's kinds mix.
  return [out[0], ...shuffle(out.slice(1))];
}

/**
 * One session's order, from each problem's cards (lead card first, as `cardsForProblem` gives
 * them). Interleaved: a new problem starts every other card while any is left, the cards between
 * continue the started problem with the most cards left (the earliest started on a tie), and the
 * same problem never shows twice in a row while another has cards left. So each problem opens with
 * its recognition card, coding starts early, and its three cards are spread out.
 */
export function orderDeck(problems: readonly (readonly DrillCardSpec[])[]): DrillCardSpec[] {
  const queues = problems.map((cards) => [...cards]);
  const total = queues.reduce((n, q) => n + q.length, 0);
  const started: number[] = [];
  let next = 0;
  let last = -1;
  const out: DrillCardSpec[] = [];
  while (out.length < total) {
    const going = started.filter((k) => queues[k].length && k !== last);
    // Most cards left first; ties keep the order the problems started in (sort is stable).
    going.sort((a, b) => queues[b].length - queues[a].length);
    const fresh = next < queues.length && queues[next].length ? next : -1;
    let k: number;
    if (fresh >= 0 && (out.length % 2 === 0 || !going.length)) {
      k = fresh;
      started.push(next++);
    } else if (going.length) k = going[0];
    else {
      // Only the problem just shown has cards left (or empty problems to skip).
      if (next < queues.length && !queues[next].length) {
        next++;
        continue;
      }
      k = last;
    }
    out.push(queues[k].shift()!);
    last = k;
  }
  return out;
}

/**
 * The card that comes back later in the session after a miss, with the same input. Coding cards
 * come back as a fresh instance: other gaps (and so other options), another key line, another part
 * (when the solution has one), so the second try is recall, not a copy of the answer just shown.
 */
export function retryCard(p: Problem, card: DrillCardSpec, deck: readonly DrillCardSpec[]): DrillCardSpec {
  const next: DrillCardSpec = { ...card, uid: `${card.uid}:retry`, retry: true, lead: false };
  const seed = (card.seed ?? 0) + 1;
  if (card.kind === 'gaps') next.seed = seed;
  if (card.kind === 'keyline' && card.line !== undefined) {
    next.seed = seed;
    next.line = pickKeyLine(p, seed, [card.line], card.input) ?? card.line;
  }
  if (card.kind === 'part' && card.chunk !== undefined) {
    const asked = deck.flatMap((c) => (c.problemId === p.id && c.kind === 'part' && c.chunk !== undefined ? [c.chunk] : []));
    next.seed = seed;
    next.chunk = pickPart(p, seed, asked, card.input);
  }
  return next;
}
