// Clue words: the wording in a problem statement that should trigger a pattern (src/content/cues.ts),
// drilled both ways. This builds a session's cards and says how well a pattern's clues are known.
//
// Three kinds of card:
// - 'see':     a clue's wording → which pattern? (then what to reach for)
// - 'problem': the clue phrases of one problem, without its statement → which pattern?
// - 'which':   a pattern → which of four wordings points to it?

import { CATEGORIES, CATEGORY_BY_ID } from '../content/categories';
import { CUES } from '../content/cues';
import { problemsFor } from '../content/index';
import type { CategoryId, Cue, Problem } from '../content/types';
import { acceptedCategories, CONFUSABLE } from './drills';
import { shuffle } from './random';
import type { Progress } from './store';

/** In a row right, on one pattern's clues, for the pattern's clue words to count as known. */
export const CLUES_KNOWN = 4;
/** Cards in one session. */
export const CLUE_SESSION = 12;

export type ClueCard =
  | { kind: 'see'; uid: string; cat: CategoryId; cue: Cue; options: CategoryId[]; accepted: CategoryId[] }
  | { kind: 'problem'; uid: string; cat: CategoryId; problem: Problem; options: CategoryId[]; accepted: CategoryId[] }
  | { kind: 'which'; uid: string; cat: CategoryId; options: { cat: CategoryId; cue: Cue }[]; answer: number };

/** A pattern's clue words are known: enough right in a row, at some point. */
export const cluesKnown = (p: Progress, cat: CategoryId) => (p.clues?.[cat]?.best ?? 0) >= CLUES_KNOWN;

/** Patterns the learner has started (its intro done, or a problem learned): the ones a session asks about. */
export function startedPatterns(p: Progress): CategoryId[] {
  return CATEGORIES.filter((c) => p.lessonsDone[`g:${c.id}`] || c.problemIds.some((id) => p.problems[id]?.learnedAt)).map((c) => c.id);
}

const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** Three wrong patterns for a card: one or two that are easy to confuse with the answer, the rest any. */
function wrongPatterns(cat: CategoryId, accepted: readonly CategoryId[], scope: readonly CategoryId[]): CategoryId[] {
  const ok = new Set(accepted);
  // Prefer patterns the learner has met: a name never seen is too easy to rule out.
  const all = CATEGORIES.map((c) => c.id).filter((c) => !ok.has(c));
  const known = all.filter((c) => scope.includes(c));
  const near = shuffle((CONFUSABLE[cat] ?? []).filter((c) => !ok.has(c))).slice(0, 2);
  const rest = [...shuffle(known.filter((c) => !near.includes(c))), ...shuffle(all.filter((c) => !near.includes(c) && !known.includes(c)))];
  return [...near, ...rest].slice(0, 3);
}

function seeCard(cat: CategoryId, cue: Cue, scope: readonly CategoryId[], n: number): ClueCard {
  const accepted = [cat, ...(cue.also ?? [])];
  return { kind: 'see', uid: `see:${cat}:${n}`, cat, cue, accepted, options: shuffle([cat, ...wrongPatterns(cat, accepted, scope)]) };
}

function problemCard(problem: Problem, scope: readonly CategoryId[], n: number): ClueCard {
  const accepted = acceptedCategories(problem);
  return { kind: 'problem', uid: `problem:${problem.id}:${n}`, cat: problem.category, problem, accepted, options: shuffle([problem.category, ...wrongPatterns(problem.category, accepted, scope)]) };
}

/** A pattern and four wordings, one of them its own. The others must not point to it too. */
function whichCard(cat: CategoryId, cue: Cue, n: number): ClueCard | null {
  const others = shuffle(
    CATEGORIES.filter((c) => c.id !== cat && !(cue.also ?? []).includes(c.id)).flatMap((c) =>
      (CUES[c.id] ?? []).filter((x) => !(x.also ?? []).includes(cat)).map((x) => ({ cat: c.id, cue: x })),
    ),
  );
  // One wording per pattern, so the options differ in more than a word.
  const wrong: { cat: CategoryId; cue: Cue }[] = [];
  for (const o of others) {
    if (wrong.length === 3) break;
    if (!wrong.some((w) => w.cat === o.cat)) wrong.push(o);
  }
  if (wrong.length < 3) return null;
  const options = shuffle([{ cat, cue }, ...wrong]);
  return { kind: 'which', uid: `which:${cat}:${n}`, cat, options, answer: options.findIndex((o) => o.cat === cat && o.cue === cue) };
}

/**
 * One session's cards. `only`: one pattern's clues (from its unit or the pattern guide). Otherwise
 * the patterns the learner has started (all of them when none is started yet), the least known
 * first, so a session spends its cards where the clues are weakest.
 */
export function buildClueDeck(p: Progress, only?: CategoryId, size = CLUE_SESSION): ClueCard[] {
  const started = startedPatterns(p);
  const scope = (only ? [only] : started.length ? started : CATEGORIES.map((c) => c.id)).filter((c) => (CUES[c] ?? []).length > 0);
  if (!scope.length) return [];
  const around = started.length ? started : CATEGORIES.map((c) => c.id);
  // Weakest first: never asked, then the shortest best run, then the one asked longest ago.
  const order = shuffle(scope).sort((a, b) => {
    const x = p.clues?.[a];
    const y = p.clues?.[b];
    return (x?.best ?? -1) - (y?.best ?? -1) || (x?.at ?? 0) - (y?.at ?? 0);
  });
  const used = new Map<CategoryId, Cue[]>();
  const nextCue = (cat: CategoryId): Cue => {
    let left = used.get(cat);
    if (!left?.length) left = shuffle(CUES[cat]);
    const cue = left[0];
    used.set(cat, left.slice(1));
    return cue;
  };
  const deck: ClueCard[] = [];
  for (let n = 0; deck.length < size && n < size * 3; n++) {
    const cat = order[n % order.length];
    // Mostly wording → pattern; every fourth card a problem's own clue phrases, every fourth the other way round.
    const roll = n % 4;
    let card: ClueCard | null = null;
    if (roll === 2) {
      // Problems the learner has not been taught first: their wording is unseen.
      const ps = problemsFor(cat);
      const unseen = ps.filter((q) => !p.problems[q.id]?.learnedAt);
      card = problemCard(pick(unseen.length ? unseen : ps), around, n);
    } else if (roll === 3) card = whichCard(cat, nextCue(cat), n);
    deck.push(card ?? seeCard(cat, nextCue(cat), around, n));
  }
  return deck;
}

/** A missed card, asked again at the end of the session with its options in a new order. */
export function retryClue(card: ClueCard): ClueCard {
  if (card.kind === 'which') {
    const right = card.options[card.answer];
    const options = shuffle(card.options);
    return { ...card, uid: `${card.uid}:retry`, options, answer: options.indexOf(right) };
  }
  return { ...card, uid: `${card.uid}:retry`, options: shuffle(card.options) };
}

export const patternName = (cat: CategoryId) => CATEGORY_BY_ID[cat].name;
