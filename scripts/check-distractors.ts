/*
 * Helper for scripts/check-distractors.py (run that, not this): prints, as JSON, every problem's
 * runnable code and examples, and for each line of its solution every wrong option the rules in
 * src/lib/choices.ts can offer for it (`choiceCandidates`: changes, second-order changes, 2x2
 * corners, and fallback lines with its shape), each with its `lineKey`.
 *
 *   npx tsx scripts/check-distractors.ts > candidates.json
 */
import { PROBLEMS } from '../src/content/index';
import { choiceCandidates, codeOnly, contextKey, isGivenLine, optionKey } from '../src/lib/choices';
import { arrangeableNow } from '../src/lib/drills';
import { lessonParts, parseSolution } from '../src/lib/parseSolution';

// `--parts`: the parts of two lines that get no Arrange distractor with the deny list as it is now.
if (process.argv.includes('--parts')) {
  const parts = PROBLEMS.flatMap((p) => lessonParts(parseSolution(p.solution)).flatMap((lp) => (arrangeableNow(p, lp) ? [] : [`${p.id}:${lp.ci}`])));
  process.stdout.write(JSON.stringify(parts));
  process.exit(0);
}

const out = PROBLEMS.map((p) => {
  const parsed = parseSolution(p.solution);
  const all = parsed.lines.map((l) => l.text);
  // Pick the key line also falls back on the key lines of the pattern's other problems.
  const pattern = PROBLEMS.filter((q) => q.category === p.category && q.id !== p.id).flatMap((q) =>
    parseSolution(q.solution).lines.flatMap((l) => (l.key && !l.header ? [l.text] : [])),
  );
  const lines = all.flatMap((line, i) => {
    if (!codeOnly(line).trim() || parsed.lines[i].header || isGivenLine(line)) return [];
    const others = all.filter((_, j) => j !== i);
    const wrong = choiceCandidates(line, { context: all, at: i, otherLines: parsed.lines[i].key ? [...others, ...pattern] : others });
    return wrong.length ? [{ i, answer: codeOnly(line), key: optionKey(line), wrong: wrong.map((w) => ({ text: w, key: optionKey(w) })) }] : [];
  });
  const text = [p.prompt, ...p.signals].join('\n');
  return { id: p.id, key: contextKey(all), code: parsed.code, examples: p.examples, anyOrder: /\bany order\b/i.test(text), lines };
});
process.stdout.write(JSON.stringify(out));
