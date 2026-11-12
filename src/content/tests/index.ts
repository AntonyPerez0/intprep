// ─────────────────────────────────────────────────────────────────────────────
// Tests for "run my code": for each problem id, extra inputs written exactly like
// that problem's examples (`nums = [3, 8, 11, 4], target = 7`; a linked list or a
// tree as a list; a design class as `LRUCache(2), put(4, 40), get(4)`).
//
// A test has no expected output: the app runs the problem's own solution on the
// input and compares the learner's answer with it (src/judge/judge.py). So every
// input MUST be valid by the problem's constraints (a rotated list of distinct
// values, a k no larger than the list, exactly one answer where the problem
// promises one): on an invalid input two correct solutions can disagree, and a
// right answer would be marked wrong.
//
// `python3 scripts/judge-check.py [unit ...]` runs every solution on its tests.
// ─────────────────────────────────────────────────────────────────────────────
import arraysHashing from './arrays-hashing';
import twoPointers from './two-pointers';
import slidingWindow from './sliding-window';
import stack from './stack';
import binarySearch from './binary-search';
import linkedList from './linked-list';
import trees from './trees';
import tries from './tries';
import heap from './heap';
import backtracking from './backtracking';
import graphs from './graphs';
import advancedGraphs from './advanced-graphs';
import dp1d from './dp-1d';
import dp2d from './dp-2d';
import greedy from './greedy';
import intervals from './intervals';
import mathGeometry from './math-geometry';
import bitManipulation from './bit-manipulation';

export const TESTS: Record<string, string[]> = {
  ...arraysHashing,
  ...twoPointers,
  ...slidingWindow,
  ...stack,
  ...binarySearch,
  ...linkedList,
  ...trees,
  ...tries,
  ...heap,
  ...backtracking,
  ...graphs,
  ...advancedGraphs,
  ...dp1d,
  ...dp2d,
  ...greedy,
  ...intervals,
  ...mathGeometry,
  ...bitManipulation,
};
