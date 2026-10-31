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
}

const MIN_EASE = 1.3;
const MAX_INTERVAL = 365;

export function newCard(): SrsCard {
  const t = today();
  return { due: addDays(t, 1), interval: 1, ease: 2.5, reps: 0, lapses: 0, last: t };
}

/** Apply a review. Reviewing early (before due) grows the interval less. */
export function review(card: SrsCard, grade: Grade): SrsCard {
  const t = today();
  const c = { ...card, last: t };
  const overdue = Math.max(0, daysBetween(card.due, t));
  const elapsed = Math.max(1, daysBetween(card.last, t));
  // Early reviews only count for the time that actually passed.
  const base = daysBetween(t, card.due) > 0 ? Math.min(card.interval, elapsed) : card.interval + overdue / 2;

  switch (grade) {
    case 'again':
      c.lapses += 1;
      c.reps = 0;
      c.ease = Math.max(MIN_EASE, c.ease - 0.2);
      c.interval = 1;
      break;
    case 'hard':
      c.ease = Math.max(MIN_EASE, c.ease - 0.15);
      c.interval = Math.max(1, Math.round(base * 1.2));
      c.reps += 1;
      break;
    case 'good':
      c.interval = c.reps === 0 ? 2 : c.reps === 1 ? 4 : Math.round(base * c.ease);
      c.reps += 1;
      break;
    case 'easy':
      c.ease = c.ease + 0.15;
      c.interval = c.reps === 0 ? 4 : Math.round(base * c.ease * 1.3);
      c.reps += 1;
      break;
  }
  c.interval = Math.min(MAX_INTERVAL, Math.max(1, c.interval));
  c.due = addDays(t, c.interval);
  return c;
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

/** Mastery "crowns" 0–5 from how long the memory is predicted to last. */
export function crowns(card: SrsCard | undefined): number {
  if (!card) return 0;
  const i = card.interval;
  const base = i >= 60 ? 5 : i >= 21 ? 4 : i >= 7 ? 3 : i >= 3 ? 2 : 1;
  // Memories fade: if a review is overdue by more than its interval, drop a
  // crown until the learner proves it again.
  const overdue = daysBetween(card.due, today());
  return overdue > Math.max(2, i) ? Math.max(1, base - 1) : base;
}

export const CROWN_LABELS = ['New', 'Learned', 'Familiar', 'Solid', 'Strong', 'Mastered'];

/** Turn drill performance into a grade (the learner can still see why). */
export function gradeFrom(correct: number, total: number, selfRating?: Grade): Grade {
  if (selfRating === 'again') return 'again';
  const misses = total - correct;
  if (misses >= 2 || (total > 0 && correct / total < 0.5)) return 'again';
  if (misses === 1) return 'hard';
  if (selfRating === 'hard') return 'hard';
  if (selfRating === 'easy') return 'easy';
  return 'good';
}
