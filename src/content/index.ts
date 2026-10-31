import { CATEGORIES, CATEGORY_BY_ID } from './categories';
import type { CategoryContent, CategoryId, PatternGuide, Problem } from './types';
import { FOUNDATIONS } from './foundations';

import arraysHashing from './problems/arrays-hashing';
import twoPointers from './problems/two-pointers';
import slidingWindow from './problems/sliding-window';
import stack from './problems/stack';
import binarySearch from './problems/binary-search';
import linkedList from './problems/linked-list';
import trees from './problems/trees';
import tries from './problems/tries';
import heap from './problems/heap';
import backtracking from './problems/backtracking';
import graphs from './problems/graphs';
import advancedGraphs from './problems/advanced-graphs';
import dp1d from './problems/dp-1d';
import dp2d from './problems/dp-2d';
import greedy from './problems/greedy';
import intervals from './problems/intervals';
import mathGeometry from './problems/math-geometry';
import bitManipulation from './problems/bit-manipulation';

export const CONTENT: Record<CategoryId, CategoryContent> = {
  'arrays-hashing': arraysHashing,
  'two-pointers': twoPointers,
  'sliding-window': slidingWindow,
  stack,
  'binary-search': binarySearch,
  'linked-list': linkedList,
  trees,
  tries,
  heap,
  backtracking,
  graphs,
  'advanced-graphs': advancedGraphs,
  'dp-1d': dp1d,
  'dp-2d': dp2d,
  greedy,
  intervals,
  'math-geometry': mathGeometry,
  'bit-manipulation': bitManipulation,
};

/** Problems of one category, in the roadmap's teaching order. */
export function problemsFor(cat: CategoryId): Problem[] {
  const order = CATEGORY_BY_ID[cat].problemIds;
  return [...CONTENT[cat].problems].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

/** Every problem, in roadmap order. */
export const PROBLEMS: Problem[] = CATEGORIES.flatMap((c) => problemsFor(c.id));

export const PROBLEM_BY_ID: Record<string, Problem> = Object.fromEntries(
  PROBLEMS.map((p) => [p.id, p]),
);

export function guideFor(cat: CategoryId): PatternGuide | null {
  const g = CONTENT[cat].guide;
  return g && g.whenToUse.length > 0 ? g : null;
}

export { CATEGORIES, CATEGORY_BY_ID, FOUNDATIONS };
export type { CategoryId, Problem, PatternGuide };
