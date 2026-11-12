// A small SM-2–style spaced-repetition scheduler (the family of algorithms
// behind SuperMemo and Anki). Each learned problem is one "card".

import { addDays, daysBetween, today } from './date';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface SrsCard {
  /** Day key when the card is next due. */
  due: string;
  /** Current interval in days. */
  interval: number;
  /** Ease factor (how fast intervals grow). */
  ease: number;
  /** Successful reviews in a row. */
  reps: number;
  lapses: number;
  last: string;
  /** The grade of the last review that moved this card. Optional: older saves do not have it. */
  grade?: Grade;
  /**
   * The due day this card had before an interview date pulled its review in (`pullInReviews` in
   * lib/store.ts): given back when the date is moved or cleared, dropped by the next review.
   */
  held?: string;
}

const MIN_EASE = 1.3;
const MAX_INTERVAL = 365;

export function newCard(): SrsCard {
  const t = today();
  return { due: addDays(t, 1), interval: 1, ease: START_EASE, reps: 0, lapses: 0, last: t };
}

export interface ReviewOptions {
  /** 0–1 (e.g. `Math.random()`): spreads an interval of a week or more by up to ±8%, so problems learned together do not all come back on one day. */
  fuzz?: number;
  /** Longest interval allowed, in days: with an interview date set, every problem comes back before it. */
  cap?: number;
}

/** A lapsed card keeps this share of its interval: forgetting a 60-day card costs a relearn, not a restart from one day. */
const LAPSE_KEEP = 0.2;
/** Ease lost on a lapse, and won back by each review passed cleanly after it (up to the starting ease). */
const EASE_LAPSE = 0.2;
const EASE_RECOVER = 0.05;
const START_EASE = 2.5;

/**
 * Apply a review.
 *
 * - **again** (a lapse): the interval drops to a fifth (at least a day) and ease drops a little.
 * - **hard** (one slip in the review's cards): the interval still grows, by a fifth and at least a
 *   day. Ease is left alone: a single slip says little about how hard the problem is, and an ease
 *   that only ever falls turns every problem into a daily card.
 * - **good**: 2 days, then 4, then the interval times ease. Ease lost to earlier lapses comes back
 *   a step at a time.
 * - **easy**: grows faster and raises ease.
 *
 * A card reviewed early (before its due day, or pulled forward: a Pattern Blitz miss sets its due
 * day to today) has only been tested over the days that actually passed, so a pass never grows it
 * past its interval. It never shrinks it either: being asked early and getting it right is no
 * evidence of forgetting.
 */
export function review(card: SrsCard, grade: Grade, opts: ReviewOptions = {}): SrsCard {
  const t = today();
  const { held: _held, ...rest } = card;
  void _held; // a review sets a new due day: the one an interview date displaced no longer applies
  const c: SrsCard = { ...rest, last: t, grade };
  const overdue = Math.max(0, daysBetween(card.due, t));
  const elapsed = Math.max(1, daysBetween(card.last, t));
  const early = daysBetween(t, card.due) > 0 || elapsed < card.interval;
  const base = early ? Math.min(card.interval, elapsed) : card.interval + overdue / 2;

  switch (grade) {
    case 'again':
      c.lapses += 1;
      c.reps = 0;
      c.ease = Math.max(MIN_EASE, c.ease - EASE_LAPSE);
      c.interval = Math.max(1, Math.round(card.interval * LAPSE_KEEP));
      break;
    case 'hard':
      c.interval = Math.max(Math.floor(base) + 1, Math.round(base * 1.2));
      c.reps += 1;
      break;
    case 'good':
      // A new card (or one that lapsed down to a day or two) follows the fixed first steps.
      // Always at least a day longer: a low ease must not pin a card at one day forever.
      c.interval = c.reps === 0 && base <= 1 ? 2 : c.reps <= 1 && base <= 2 ? 4 : Math.max(Math.floor(base) + 1, Math.round(base * c.ease));
      if (c.ease < START_EASE) c.ease = Math.min(START_EASE, c.ease + EASE_RECOVER);
      c.reps += 1;
      break;
    case 'easy':
      c.ease = c.ease + 0.15;
      c.interval = c.reps === 0 && base <= 1 ? 4 : Math.round(base * c.ease * 1.3);
      c.reps += 1;
      break;
  }
  if (grade !== 'again') {
    // Asked early and passed: keep the schedule it had earned.
    if (early) c.interval = Math.max(card.interval, c.interval);
    else if (opts.fuzz !== undefined && c.interval >= 7) c.interval = Math.round(c.interval * (0.92 + 0.16 * opts.fuzz));
  }
  c.interval = Math.min(MAX_INTERVAL, Math.max(1, c.interval));
  if (opts.cap !== undefined) c.interval = Math.max(1, Math.min(c.interval, Math.floor(opts.cap)));
  c.due = addDays(t, c.interval);
  return c;
}

/**
 * The card of a problem the learner proved they already know (they solved it unaided before the
 * lesson): it skips the first daily steps and comes back in a week.
 */
export function knownCard(): SrsCard {
  const t = today();
  return { due: addDays(t, 7), interval: 7, ease: START_EASE, reps: 2, lapses: 0, last: t, grade: 'good' };
}

/** What each grade would schedule — shown on the self-rating buttons. */
export function preview(card: SrsCard): Record<Grade, number> {
  return {
    again: review(card, 'again').interval,
    hard: review(card, 'hard').interval,
    good: review(card, 'good').interval,
    easy: review(card, 'easy').interval,
  };
}

export const isDue = (card: SrsCard, day = today()) => card.due <= day;

/**
 * Mastery "crowns" 0–5 from how long the memory is predicted to last. The top crown also needs
 * proof that the learner can produce the code, not only recognize it (`proven`: see `mastery` in
 * lib/input.ts): without it a long interval stops at 4.
 */
export function crowns(card: SrsCard | undefined, proven = true): number {
  if (!card) return 0;
  const i = card.interval;
  const base = i >= 60 ? (proven ? 5 : 4) : i >= 21 ? 4 : i >= 7 ? 3 : i >= 3 ? 2 : 1;
  // Memories fade: if a review is overdue by more than its interval, drop a
  // crown until the learner proves it again.
  const overdue = daysBetween(card.due, today());
  return overdue > Math.max(2, i) ? Math.max(1, base - 1) : base;
}

export const CROWN_LABELS = ['New', 'Learned', 'Familiar', 'Solid', 'Strong', 'Mastered'];

/**
 * Turn drill performance into a grade (the learner can still see why). `correct` may be
 * fractional: a coding card that was nearly right counts as half right (see Review), so two
 * near misses make a problem fuzzy, not forgotten.
 */
export function gradeFrom(correct: number, total: number, selfRating?: Grade): Grade {
  if (selfRating === 'again') return 'again';
  const misses = total - correct;
  if (misses >= 2 || (total > 0 && correct / total < 0.5)) return 'again';
  if (misses > 0) return 'hard';
  if (selfRating === 'hard') return 'hard';
  if (selfRating === 'easy') return 'easy';
  return 'good';
}
