// The recommended learning order and "what should I do next?".

import { CATEGORIES, CATEGORY_BY_ID, type CategoryMeta } from '../content/categories';
import { FOUNDATIONS, guideFor, problemsFor } from '../content/index';
import type { CategoryId, Problem } from '../content/types';
import type { Progress } from './store';

export type NextStep =
  | { kind: 'foundation'; lessonId: string; title: string; icon: string; href: string }
  | { kind: 'guide'; category: CategoryId; title: string; icon: string; href: string }
  | { kind: 'problem'; problem: Problem; title: string; icon: string; href: string }
  | { kind: 'done'; title: string; icon: string; href: string };

export function unitProgress(p: Progress, cat: CategoryId) {
  const ids = CATEGORY_BY_ID[cat].problemIds;
  const learned = ids.filter((id) => p.problems[id]?.learnedAt).length;
  return { learned, total: ids.length, pct: ids.length ? learned / ids.length : 0 };
}

/** Soft lock: a unit is "open" once each prerequisite is at least half learned. */
export function unitUnlocked(p: Progress, c: CategoryMeta): boolean {
  if (unitProgress(p, c.id).learned > 0 || p.lessonsDone[`g:${c.id}`]) return true;
  return c.prereqs.every((pre) => unitProgress(p, pre).pct >= 0.5);
}

export function foundationsDone(p: Progress) {
  return FOUNDATIONS.filter((l) => p.lessonsDone[`f:${l.id}`]).length;
}

/**
 * Whether "what next?" leaves a problem for the second pass. In the default order ('core') the
 * Hard problems wait until every unit's Easy and Medium ones are learned: the core of all 18
 * patterns is worth more, sooner, than the hardest problem of the second one, and several Hard
 * problems lean on patterns from later units (Word Search II needs backtracking).
 */
export const isLater = (p: Progress, q: Problem) => p.settings.pathOrder !== 'unit' && q.difficulty === 'Hard';

/** The problems of the first pass that are not learned yet, in order (every problem in 'unit' order). */
export function coreRemaining(p: Progress): Problem[] {
  return CATEGORIES.flatMap((c) => problemsFor(c.id).filter((q) => !isLater(p, q) && !p.problems[q.id]?.learnedAt));
}

/** A unit's next problem to learn: its first unlearned one, the ones left for the second pass last. */
export function unitNext(p: Progress, cat: CategoryId): Problem | undefined {
  const todo = problemsFor(cat).filter((q) => !p.problems[q.id]?.learnedAt);
  return todo.find((q) => !isLater(p, q)) ?? todo[0];
}

export function nextStep(p: Progress): NextStep {
  // Only a learner who said they are new to coding is led through Foundations. For the others it
  // stays on the Learning path as optional: trying one beginner lesson must not queue up the rest.
  if (p.settings.experience === 'none') {
    const f = FOUNDATIONS.find((l) => !p.lessonsDone[`f:${l.id}`]);
    if (f) return { kind: 'foundation', lessonId: f.id, title: f.title, icon: f.icon, href: `/foundations/${f.id}` };
  }
  // First pass: each unit's pattern intro, then its problems (all of them in 'unit' order).
  for (const c of CATEGORIES) {
    const problems = problemsFor(c.id);
    if (!problems.length) continue;
    const started = unitProgress(p, c.id).learned > 0;
    const next = problems.find((q) => !isLater(p, q) && !p.problems[q.id]?.learnedAt);
    if (guideFor(c.id) && !p.lessonsDone[`g:${c.id}`] && !started && next) {
      return { kind: 'guide', category: c.id, title: `${c.name}: the pattern`, icon: c.icon, href: `/unit/${c.id}/intro` };
    }
    if (next) return { kind: 'problem', problem: next, title: next.title, icon: c.icon, href: `/p/${next.id}/learn` };
  }
  // Second pass: the Hard problems, unit by unit.
  for (const c of CATEGORIES) {
    const next = problemsFor(c.id).find((q) => !p.problems[q.id]?.learnedAt);
    if (next) return { kind: 'problem', problem: next, title: next.title, icon: c.icon, href: `/p/${next.id}/learn` };
  }
  return { kind: 'done', title: 'Every problem learned', icon: 'trophy', href: '/review' };
}
