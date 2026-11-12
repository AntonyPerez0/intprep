// Which problems a mock interview can draw (pages/Mock.tsx).

import { CATEGORIES } from '../content/categories';
import { PROBLEMS } from '../content/index';
import type { Problem } from '../content/types';
import { unitProgress } from './path';
import type { Progress } from './store';

/** 'learned': a problem the learner has been taught. 'new': one they have not, from a pattern they have started. */
export type MockPool = 'learned' | 'new';

/**
 * The problems of a pool, best candidates first.
 * - learned: ones never used in a mock first, then the ones mocked longest ago.
 * - new: unlearned problems of units the learner has started (its pattern intro done or a problem
 *   learned), so the pattern is known and the problem is not: the closest thing here to an
 *   interview question you have never seen. Hard ones only once half the unit is learned.
 */
export function mockPool(p: Progress, pool: MockPool): Problem[] {
  if (pool === 'learned') {
    return PROBLEMS.filter((q) => p.problems[q.id]?.learnedAt).sort((a, b) => (p.problems[a.id]?.mock?.at ?? 0) - (p.problems[b.id]?.mock?.at ?? 0));
  }
  const started = new Set(CATEGORIES.filter((c) => p.lessonsDone[`g:${c.id}`] || unitProgress(p, c.id).learned > 0).map((c) => c.id));
  return PROBLEMS.filter((q) => {
    if (p.problems[q.id]?.learnedAt || !started.has(q.category)) return false;
    return q.difficulty !== 'Hard' || unitProgress(p, q.category).pct >= 0.5;
  });
}

/** One problem from a pool: random among its best few, so two interviews in a row differ. */
export function drawMock(p: Progress, pool: MockPool, rnd: () => number = Math.random): Problem | null {
  const all = mockPool(p, pool);
  if (!all.length) return null;
  // Learned: among the quarter mocked longest ago (at least 5). New: any of them.
  const top = pool === 'learned' ? all.slice(0, Math.max(5, Math.ceil(all.length / 4))) : all;
  return top[Math.floor(rnd() * top.length)];
}

/** Finished mock interviews, newest first. */
export function mockHistory(p: Progress): { problem: Problem; at: number; passed: boolean; seconds: number }[] {
  return PROBLEMS.flatMap((q) => {
    const m = p.problems[q.id]?.mock;
    return m ? [{ problem: q, ...m }] : [];
  }).sort((a, b) => b.at - a.at);
}
