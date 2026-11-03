// How code practice takes input: "Pick it, then type it".
//
// New code is picked from choices (the missing line from four, the gaps from options, a part's
// lines put in order); once the learner has shown they know it, typing takes over. Faded guidance:
// support while the code is new, recall once it is known (docs/LEARNING_SCIENCE.md;
// docs/DESIGN.md, "Pick first, then type").
//
// The stored setting (`Progress['settings']['typingMode']`, "Code practice" in Profile) keeps the
// values older saves hold:
// - 'auto' (the default): "Pick first, then type". New code is picked; typing takes over once known.
// - 'type': "Always type" (every exercise typed, new code included).
// - 'tap':  "Always pick" (every exercise picked from choices).

import { dayKey } from './date';
import type { Progress, ProblemProgress, TemplateProgress } from './store';

export type InputMode = Progress['settings']['typingMode'];

/** How one exercise takes code: picked from choices, or typed. */
export type CodeInput = 'pick' | 'type';

/** What `isNewCode` reads from a problem's progress (every field is optional in older saves). */
export type CodeProgress = Pick<ProblemProgress, 'learnedAt' | 'srs' | 'lastGrade' | 'typedAt' | 'lapsedAt' | 'gapsBest' | 'scratchBest'>;

/**
 * Right reviews in a row (`srs.reps`) a problem's code needs before it counts as known: one. Fewer
 * means the guided lesson and the first review, or a lapse since (a lapse sets reps back to 0).
 * Exactly one is not always enough: see `isNewCode`.
 */
export const PICK_UNTIL_REPS = 1;

/**
 * Typed proof: a typed Code from memory run (Fill the gaps or From scratch) with a first-check
 * score of this or more shows the learner knows the code (`hasTypedProof`).
 */
export const TYPED_PROOF = 0.8;

/**
 * A pattern template counts as known once one of these reaches it: a Pick the gaps round in
 * Template practice (`pickReady`; the pattern intro's "Your turn" pick never counts), or the best
 * typed gaps (`gapsBest`). A From memory try counts as known too.
 */
export const TEMPLATE_READY = 0.8;

/** The settings' options, in the order Profile shows them. */
export const CODE_PRACTICE: { id: InputMode; label: string; sub: string; recommended?: boolean }[] = [
  { id: 'auto', label: 'Pick first, then type', sub: 'Choose new code from options. Type it once you know it.', recommended: true },
  { id: 'type', label: 'Always type', sub: 'Type every line, new code included.' },
  { id: 'tap', label: 'Always pick', sub: 'Choose lines from options wherever possible.' },
];

/**
 * Typed proof that the learner knows a problem's code: a typed Code from memory run of
 * `TYPED_PROOF` or more in Fill the gaps or From scratch (`typedAt`, set by `recordRebuild`), made
 * after the last lapse (`lapsedAt`), or since it was learned if it never lapsed. Older saves keep
 * no date for that run: their typed bests count only while the card has never lapsed.
 */
export function hasTypedProof(pp?: CodeProgress | null): boolean {
  if (!pp?.learnedAt || !pp.srs) return false;
  if (pp.typedAt !== undefined) return pp.typedAt > (pp.lapsedAt ?? 0);
  return pp.srs.lapses === 0 && ((pp.gapsBest ?? 0) >= TYPED_PROOF || (pp.scratchBest ?? 0) >= TYPED_PROOF);
}

/**
 * True while a problem's code is new, so 'auto' picks it. New while any of these holds:
 * - it is not learned yet, or has no review card (the guided lesson);
 * - its card has fewer than `PICK_UNTIL_REPS` right reviews in a row (the first review, or the
 *   review after a lapse);
 * - its one right review in a row was graded Fuzzy ('hard'): the next review is picked too;
 * - its one right review in a row was on the day it was learned (recall minutes after the lesson
 *   proves little): the next review is picked too.
 * Typed proof made since the last lapse (`hasTypedProof`) ends it early. A lapse (reps back to 0)
 * makes the code new again, and typed proof made before it no longer counts.
 */
export function isNewCode(pp?: CodeProgress | null): boolean {
  if (!pp?.learnedAt || !pp.srs) return true;
  if (hasTypedProof(pp)) return false;
  const { reps } = pp.srs;
  if (reps < PICK_UNTIL_REPS) return true;
  if (reps > PICK_UNTIL_REPS) return false;
  // The grade of the review that moved the card; older cards keep none, so the last grade given.
  const fuzzy = (pp.srs.grade ?? pp.lastGrade) === 'hard';
  return fuzzy || pp.srs.last <= dayKey(new Date(pp.learnedAt));
}

/** How a problem's code exercises take input: 'tap' always picks, 'type' always types, 'auto' picks while the code is new (`isNewCode`). */
export function problemInput(mode: InputMode | undefined, pp?: CodeProgress | null): CodeInput {
  if (mode === 'tap') return 'pick';
  if (mode === 'type') return 'type';
  return isNewCode(pp) ? 'pick' : 'type';
}

/**
 * How a set of problems' code exercises take input together (Key lines, for one): 'pick' when every
 * one is picked, 'type' when every one is typed, null when they differ or there are none.
 */
export function sharedInput(mode: InputMode | undefined, pps: readonly (CodeProgress | null | undefined)[]): CodeInput | null {
  if (!pps.length) return null;
  const first = problemInput(mode, pps[0]);
  return pps.every((pp) => problemInput(mode, pp) === first) ? first : null;
}

/** What `isNewTemplate` reads from a template's progress. */
export type TemplateEvidence = Pick<TemplateProgress, 'tries' | 'gapsBest' | 'pickReady'>;

/**
 * True while a pattern template is new: no From memory try, no Pick the gaps round of
 * `TEMPLATE_READY` or more in Template practice (`pickReady`), and no typed gaps best of
 * `TEMPLATE_READY` or more. The pattern intro's pick check never ends it, since it comes seconds
 * after the template was on screen.
 */
export function isNewTemplate(t?: TemplateEvidence | null): boolean {
  if (!t) return true;
  if (t.tries > 0) return false;
  return !t.pickReady && (t.gapsBest ?? 0) < TEMPLATE_READY;
}

/** How a template's exercises take input (the template ladder: Pick the gaps, then Fill the gaps, then From memory). */
export function templateInput(mode: InputMode | undefined, t?: TemplateEvidence | null): CodeInput {
  if (mode === 'tap') return 'pick';
  if (mode === 'type') return 'type';
  return isNewTemplate(t) ? 'pick' : 'type';
}

/**
 * True when code drills should start in typing mode (everything but the explicit 'tap' opt-in).
 * @deprecated Use `problemInput` or `templateInput`: in 'auto', new code is picked. Kept for screens
 * that have not moved to the ladder yet ('auto' still returns true there).
 */
export function preferTyping(mode: InputMode | undefined): boolean {
  return mode !== 'tap';
}
