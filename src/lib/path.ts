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

export function nextStep(p: Progress): NextStep {
  const wantsFoundations = p.settings.experience === 'none' || (p.settings.experience === 'some' && foundationsDone(p) > 0);
  if (wantsFoundations) {
    const f = FOUNDATIONS.find((l) => !p.lessonsDone[`f:${l.id}`]);
    if (f) return { kind: 'foundation', lessonId: f.id, title: f.title, icon: f.icon, href: `/foundations/${f.id}` };
  }
  for (const c of CATEGORIES) {
    const problems = problemsFor(c.id);
    if (!problems.length) continue;
    const started = unitProgress(p, c.id).learned > 0;
    if (guideFor(c.id) && !p.lessonsDone[`g:${c.id}`] && !started) {
      return { kind: 'guide', category: c.id, title: `${c.name}: the pattern`, icon: c.icon, href: `/unit/${c.id}/intro` };
    }
    const next = problems.find((q) => !p.problems[q.id]?.learnedAt);
    if (next) return { kind: 'problem', problem: next, title: next.title, icon: c.icon, href: `/p/${next.id}/learn` };
  }
  return { kind: 'done', title: 'Every problem learned — keep reviewing!', icon: '🏆', href: '/review' };
}
