/*
 * Helper for scripts/judge-check.py and scripts/build-traces.py (run those, not this): prints, as
 * JSON, what the judge (src/judge/judge.py) needs for every problem — its runnable solution, its
 * examples and its extra tests — and the derivation stages that must pass the same tests.
 *
 *   npx tsx scripts/judge-problems.ts > problems.json
 */
import { PROBLEMS } from '../src/content/index';
import { DERIVATIONS } from '../src/content/derivations';
import { TESTS } from '../src/content/tests/index';
import { judgeProblem } from '../src/lib/judgeProblem';

const out = PROBLEMS.map((p) => ({
  ...judgeProblem(p),
  category: p.category,
  difficulty: p.difficulty,
  outputs: p.examples.map((e) => e.output),
  stages: (DERIVATIONS[p.id] ?? []).map((s) => ({ title: s.title, code: s.code })),
}));
const unknown = Object.keys(TESTS).filter((id) => !PROBLEMS.some((p) => p.id === id));
process.stdout.write(JSON.stringify({ problems: out, unknownTests: unknown, unknownStages: Object.keys(DERIVATIONS).filter((id) => !PROBLEMS.some((p) => p.id === id)) }));
