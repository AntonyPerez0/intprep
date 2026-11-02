// Builds drill questions from content: pattern recognition, technique, key lines (typed, or
// picked from plausible "mutant" distractors), complexity questions, and the coding cards of the
// review deck (Fill the gaps, Write a part). Also builds the review deck itself.

import { CATEGORIES } from '../content/categories';
import { PROBLEMS } from '../content/index';
import type { CategoryId, Problem } from '../content/types';
import { codeLines, lineKey } from './codegrade';
import { gapCandidates, gapSource, lineWeight, pickGaps, type GapSource } from './gaps';
import { lessonParts, normalizeCode, parseSolution, type LessonPart } from './parseSolution';
import { pick, sample, shuffle } from './random';
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

/** Indices into `parseSolution(p.solution).lines` of the key lines a drill can blank (never the header). */
export function keyLineIndices(p: Problem): number[] {
  return parseSolution(p.solution).lines.flatMap((l, i) => (l.key && !l.header ? [i] : []));
}

/**
 * A key line to blank, with three plausible wrong options. `at` asks for a specific line (an
 * index from `keyLineIndices`); otherwise a random key line, other than `avoid` when there is one.
 */
export function keyLineDrill(p: Problem, avoid?: number, at?: number): KeyLineDrill | null {
  const parsed = parseSolution(p.solution);
  const keys = parsed.lines.map((l, i) => ({ l, i })).filter(({ l }) => l.key && !l.header);
  if (!keys.length) return null;
  const choices = keys.length > 1 && avoid !== undefined ? keys.filter((k) => k.i !== avoid) : keys;
  const { l, i } = keys.find((k) => k.i === at) ?? pick(choices);
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

/** How much a "Write a part" card wants a part: key lines first, then 2 to 6 lines to write. */
function partScore(lp: LessonPart): number {
  const n = codeLines(lp.body).length;
  return (lp.chunk.keyLines.length ? 2 : 0) + (n >= 2 && n <= 6 ? 1 : 0);
}

/** The body chunks a "Write a part" card can ask for (indices into `parseSolution(p.solution).chunks`), best first. */
export function partChunks(p: Problem): number[] {
  return [...reviewParts(p).values()]
    .filter((lp) => codeLines(lp.body).length > 0)
    .sort((a, b) => partScore(b) - partScore(a) || a.ci - b.ci)
    .map((lp) => lp.ci);
}

/**
 * The chunk for a "Write a part" card: from the best tier (see `partScore`), rotating by `seed`
 * (the session), never one in `avoid` (parts already asked) while another exists.
 */
export function pickPart(p: Problem, seed = 0, avoid: readonly number[] = []): number {
  const parts = reviewParts(p);
  const all = partChunks(p);
  const free = all.filter((i) => !avoid.includes(i));
  const pool = free.length ? free : all;
  const top = partScore(parts.get(pool[0])!);
  const tier = pool.filter((i) => partScore(parts.get(i)!) === top);
  return tier[seed % tier.length];
}

/**
 * A key line for a "Write the key line" card (index into `parseSolution(p.solution).lines`), rotating by `seed`.
 * The card shows the whole solution, so a key line whose code also stands elsewhere in it (the
 * answer in plain view) is left out while another exists.
 */
export function pickKeyLine(p: Problem, seed = 0, avoid: readonly number[] = []): number | undefined {
  const all = keyLineIndices(p);
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
}

/** Where a problem is in its schedule, which decides its coding cards. */
export type CodeStage = 'learning' | 'young' | 'mature';

/** Learning: interval under 4 days or fewer than 2 good reviews in a row; young: 4 to 20 days; mature: 21 days or more. */
export function codeStage(card?: Pick<SrsCard, 'interval' | 'reps'>): CodeStage {
  if (!card || card.interval < 4 || card.reps < 2) return 'learning';
  return card.interval >= 21 ? 'mature' : 'young';
}

/** The recognition cards other than Spot the pattern: they stay in the mix, rarely. */
const RECOGNITION_OTHER: DrillKind[] = ['insight', 'technique', 'complexity', 'order'];

export interface DeckOptions {
  /** The problem's spaced-repetition card (picks the coding cards; see `codeStage`). */
  srs?: Pick<SrsCard, 'interval' | 'reps'>;
  /** Reviews done so far: each session rotates to other gaps, parts and key lines. */
  round?: number;
  /** False when the learner opted into tapping choices: the coding cards become key lines to pick. */
  typing?: boolean;
}

/**
 * The cards used to review one problem: one recognition card first (Spot the pattern about 70% of
 * the time, otherwise the key insight, the technique, the complexity or the steps in order), then
 * two coding cards chosen by how well the problem is known:
 * - learning: Write the key line + Fill the gaps;
 * - young: Fill the gaps + Write a part;
 * - mature: Write a part twice (two different parts), or a part + Fill the gaps.
 * With the tap opt-in, the coding cards become key lines picked from choices (or the steps in order).
 */
export function cardsForProblem(p: Problem, { srs, round = 0, typing = true }: DeckOptions = {}): DrillCardSpec[] {
  const lead: DrillKind = Math.random() < 0.7 ? 'pattern' : pick(RECOGNITION_OTHER);
  let coding: DrillKind[];
  if (!typing) coding = ['keyline', keyLineIndices(p).length > 1 ? 'keyline' : lead === 'order' ? 'complexity' : 'order'];
  else {
    const stage = codeStage(srs);
    coding =
      stage === 'learning'
        ? ['keyline', 'gaps']
        : stage === 'young'
          ? ['gaps', 'part']
          : partChunks(p).length > 1
            ? ['part', 'part']
            : ['part', 'gaps'];
  }
  const out: DrillCardSpec[] = [{ kind: lead, problemId: p.id, uid: `${p.id}:${lead}:0`, lead: true }];
  coding.forEach((kind, k) => {
    const spec: DrillCardSpec = { kind, problemId: p.id, uid: `${p.id}:${kind}:${k + 1}` };
    if (kind === 'gaps') spec.seed = 2 * round;
    if (kind === 'keyline') {
      spec.seed = round;
      spec.line = pickKeyLine(p, round, out.flatMap((c) => (c.line !== undefined ? [c.line] : [])));
    }
    if (kind === 'part') {
      spec.seed = round;
      spec.chunk = pickPart(p, round, out.flatMap((c) => (c.chunk !== undefined ? [c.chunk] : [])));
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
 * The card that comes back later in the session after a miss. Coding cards come back as a fresh
 * instance: other gaps, another key line, another part (when the solution has one), so the
 * second try is recall, not a copy of the answer just shown.
 */
export function retryCard(p: Problem, card: DrillCardSpec, deck: readonly DrillCardSpec[]): DrillCardSpec {
  const next: DrillCardSpec = { ...card, uid: `${card.uid}:retry`, retry: true, lead: false };
  const seed = (card.seed ?? 0) + 1;
  if (card.kind === 'gaps') next.seed = seed;
  if (card.kind === 'keyline' && card.line !== undefined) {
    next.seed = seed;
    next.line = pickKeyLine(p, seed, [card.line]);
  }
  if (card.kind === 'part' && card.chunk !== undefined) {
    const asked = deck.flatMap((c) => (c.problemId === p.id && c.kind === 'part' && c.chunk !== undefined ? [c.chunk] : []));
    next.seed = seed;
    next.chunk = pickPart(p, seed, asked);
  }
  return next;
}
