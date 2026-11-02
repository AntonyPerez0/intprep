// How code practice takes input: "Pick it, then type it".
//
// New code is picked from choices (the missing line from four, the gaps from options, a part's
// lines put in order); once the learner knows it, typing takes over. Faded guidance: support while
// the code is new, recall once it is known (docs/LEARNING_SCIENCE.md; docs/DESIGN.md, "Pick first,
// then type").
//
// The stored setting (`Progress['settings']['typingMode']`, "Code practice" in Profile) keeps the
// values older saves hold:
// - 'auto' (the default): "Pick first, then type". New code is picked; typing takes over once known.
// - 'type': "Always type" (every exercise typed, new code included).
// - 'tap':  "Always pick" (every exercise picked from choices).

import type { Progress, ProblemProgress, TemplateProgress } from './store';

export type InputMode = Progress['settings']['typingMode'];

/** How one exercise takes code: picked from choices, or typed. */
export type CodeInput = 'pick' | 'type';

/**
 * A problem's code counts as new (picked in 'auto') until its review card has this many right
 * reviews in a row: the guided lesson and the first review are picked, typing starts at the second
 * review, and a lapse (reps back to 0) goes back to picking until the next right review.
 */
export const PICK_UNTIL_REPS = 1;

/**
 * A pattern template counts as known once the learner's best first check reaches this: picking its
 * gaps (`pickBest`), or typing them (`gapsBest`). A From memory try counts as known too.
 */
export const TEMPLATE_READY = 0.8;

/** The settings' options, in the order Profile shows them. */
export const CODE_PRACTICE: { id: InputMode; label: string; sub: string; recommended?: boolean }[] = [
  { id: 'auto', label: 'Pick first, then type', sub: 'Choose new code from options. Type it once you know it.', recommended: true },
  { id: 'type', label: 'Always type', sub: 'Type every line, new code included.' },
  { id: 'tap', label: 'Always pick', sub: 'Choose lines from options. Never type.' },
];

/** True while a problem's code is new: not learned yet (the guided lesson), or its card has fewer than `PICK_UNTIL_REPS` right reviews in a row. */
export function isNewCode(pp?: Pick<ProblemProgress, 'learnedAt' | 'srs'> | null): boolean {
  if (!pp?.learnedAt || !pp.srs) return true;
  return pp.srs.reps < PICK_UNTIL_REPS;
}

/** How a problem's code exercises take input: 'tap' always picks, 'type' always types, 'auto' picks while the code is new. */
export function problemInput(mode: InputMode | undefined, pp?: Pick<ProblemProgress, 'learnedAt' | 'srs'> | null): CodeInput {
  if (mode === 'tap') return 'pick';
  if (mode === 'type') return 'type';
  return isNewCode(pp) ? 'pick' : 'type';
}

/** True while a pattern template is new: no pick best of `TEMPLATE_READY` or more, and no typed evidence (gaps best of 80%+, or a From memory try). */
export function isNewTemplate(t?: Pick<TemplateProgress, 'tries' | 'gapsBest' | 'pickBest'> | null): boolean {
  if (!t) return true;
  if (t.tries > 0) return false;
  return (t.pickBest ?? 0) < TEMPLATE_READY && (t.gapsBest ?? 0) < TEMPLATE_READY;
}

/** How a template's exercises take input (the template ladder: Pick the gaps, then Fill the gaps, then From memory). */
export function templateInput(mode: InputMode | undefined, t?: Pick<TemplateProgress, 'tries' | 'gapsBest' | 'pickBest'> | null): CodeInput {
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
