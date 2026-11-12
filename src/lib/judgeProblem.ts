// What the judge (src/judge/judge.py) needs to run a problem: its solution as runnable Python,
// its examples and its extra tests. Shared by the app (src/lib/python.ts) and the scripts.

import type { Problem } from '../content/types';
import { TESTS } from '../content/tests/index';
import { parseSolution } from './parseSolution';

export interface JudgeProblem {
  id: string;
  /** The problem's own solution, markers removed. Its answers are the expected ones. */
  code: string;
  /** The examples' inputs, as written. */
  examples: string[];
  /** Extra inputs (src/content/tests), written like the examples. */
  tests: string[];
  /** The prompt says the answer may come in any order. */
  anyOrder: boolean;
}

export function judgeProblem(p: Problem): JudgeProblem {
  const text = [p.prompt, ...p.signals].join('\n');
  return {
    id: p.id,
    code: parseSolution(p.solution).code,
    examples: p.examples.map((e) => e.input),
    tests: TESTS[p.id] ?? [],
    anyOrder: /\bany order\b/i.test(text),
  };
}

/** Whether "run my code" has more to go on than the examples. */
export const hasTests = (p: Problem) => (TESTS[p.id]?.length ?? 0) > 0;
