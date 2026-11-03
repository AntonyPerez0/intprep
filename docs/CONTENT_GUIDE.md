# Writing IntPrep content

Read these first:
- `src/content/types.ts` — the schema and the annotated-solution format (`#@` chunk explanations, `  #!` key lines, header = lines before the first `#@`).
- `src/content/categories.ts` — the exact problem ids (LeetCode slugs) and teaching order for each unit.
- `src/content/problems/arrays-hashing.ts` — the reference example. Match its tone, depth and length.

## Audience and voice
Learners start with little or no coding experience and want to become interview-ready.
Plain English with American spelling (practice, color, neighbor, optimize), short sentences, explain *why* not just *what*. Friendly and encouraging, no fluff.

## Rules
1. **Original wording.** Paraphrase every problem in your own words. Never copy LeetCode statements or
   examples; invent your own small examples (different numbers from LeetCode's). Write original
   explanations and code rather than copying any site.
2. **Python 3, LeetCode signatures.** `class Solution:` + the LeetCode method name and type hints.
   Design problems use LeetCode's class (e.g. `class LRUCache:`). LeetCode provides `ListNode`,
   `TreeNode`, `Node`, `List`, `Optional`, `heapq`, `collections` etc. — do not define or import them in the solution.
3. **Canonical optimal solution** — the approach most commonly taught for interviews. Readable names,
   4-space indent, no tabs. Never put a backtick or `${` inside a `py\`...\`` template.
4. **Annotations.** A `#@` explanation above every 1–6 lines (small, digestible chunks; 4–9 chunks is typical).
   Mark 1–4 **key lines** with two spaces + `#!` — the single lines that embody the insight
   (e.g. the window-shrink condition, the DP recurrence, the complement lookup). Not trivial lines like `return res`.
   Key lines are what learners type most: always a gap in the lesson's final check, and what the review's "Write
   the key line" card and Pattern Blitz's Key lines ask for. Each `#@` chunk is a part the learner writes in the lesson.
5. **steps**: 3–7 unique, plain-English steps that mirror the chunks (used in the review's "Put the steps in order"
   card, so each must be distinguishable). **hints**: 2–3 progressive (gentle → strong).
   **signals**: words/features in the problem that should trigger the pattern.
   **mnemonic**: ≤ 12 words, sticky. **pitfalls**: 2–4 real bugs/edge cases.
6. **alsoAccept**: set it when another unit's technique is also a fair answer to "which pattern is this?"
   (e.g. Generate Parentheses → `['backtracking']`). Leave it out otherwise.
7. **premium: true** for LeetCode Premium problems (271, 286, 261, 323, 269, 252, 253).
8. Examples use Python-ish literals: `nums = [2, 7, 4]`, linked lists `head = [1, 2, 3]`,
   trees in level order `root = [3, 9, 20, null, null, 15, 7]`.
9. Text fields support mini-markdown: `**bold**`, `` `code` ``, `*italic*`, blank-line paragraphs, `- ` bullets.
   Keep backticks and `**` balanced. Careful with apostrophes inside single-quoted TS strings
   (use double quotes or template literals for those strings).

## Foundations: "Your turn" slides
Beginners learn by writing code. Code lessons let them write it themselves with `kind: 'type'` slides (see
`TypeSlide` in `src/content/types.ts`); the first exercise on a new idea is picked from choices, and a later slide
types it (**Pick options** below). Put one right after the slide that taught the idea: **6 or more per core Python
lesson** (Python basics, control flow, lists and strings, dicts and sets, functions and classes; the other lessons,
such as Big-O, recursion or how to solve a problem, get a few), ramping from a single line to a few lines to a small
program or function by the end. Keep **at most 2 quizzes** per core Python lesson (3 in the others), and use them
for recognition only: predicting output, spotting a bug or gotcha, reading complexity. A slide whose answer the
learner reveals comes back at the end of the lesson, so make each one worth writing twice.
- **Answerable from the lesson so far**, and unambiguous: name every variable, function and loop variable the
  answer uses (`Use i as the loop variable`), because the learner's code is compared with the answer line by line.
- `starter`: read-only lines shown above the editor (a `def` line, a variable to use). Write `answer` at its real
  indentation under the starter (a function body is indented 4 spaces); the learner types from that column.
- `accept`: other answers the prompt allows (`range(0, 5)` for `range(5)`, an `if`/`return` version of a one-line
  return). Whitespace, quote style and comments never matter; indentation does.
- `output`: exactly what `starter` + `answer` prints, shown as the expected output. `hint`: a nudge, not the answer.
  `explain`: why it works, shown after checking.
- `npm run validate -- foundations` compiles `starter` + `answer` (and every `accept`) with python3, and runs every
  one that declares an `output` (and every code slide with an `output`): what it prints must match exactly.

### Pick options: pick it, then type it
A learner should see what an idea's code looks like before typing it from memory (faded guidance; see
"Pick first, then type" in `docs/DESIGN.md`). A "Your turn" slide with `pick` (2–3 **wrong** versions of the answer)
is **"Pick the right code"** in the default setting ("Pick first, then type") and in "Always pick": the learner
picks the answer from the shuffled options, sees why (the explanation, and the pick against the answer line by
line), and can choose "Type instead". In "Always type" it stays a typed slide, so write every slide to work typed.
- **When:** the *first* exercise on each new idea: new syntax or a new library call (the first `if`, the first
  `while`, `.get`, `Counter`, a slice, the first recursive call, `assert`). A repeat of an idea the learner has
  already picked or typed stays typed, even in a later lesson: do not weaken typing for code they know.
- **Then type it:** every picked idea is typed again later in the same lesson or the next one. When no later
  slide does, add a short typed "Your turn" that uses it (one slide can practice two picked ideas). The last
  "Your turn" of a lesson (the small program) is always typed. Today 39 of the 82 "Your turn" slides are picked.
- **`ideas`:** name the new ideas on the picked slide (`ideas: ['while']`) and the same names on the typed slides
  that practice them again. `npm run validate` checks with them that a picked idea was not on an earlier slide and
  is typed again in time; it cannot check that the code really uses the idea, or find an unlabeled typed slide
  that should have been picked, so keep the labels honest.
- **Distractors:** realistic beginner mistakes that are clearly wrong once you look: a missing colon, `=` for
  `==`, a body that is not indented (or one level too deep), an off-by-one `range`, `print` instead of `return`, a
  missing `return`, the wrong method (`append` on a set, `.push`), arguments in the wrong order, quotes around a
  variable name, a step that does not shrink. Never an equivalent form the grader would accept (`range(0, 5)`),
  never something absurd, and never a construct the lesson has not taught yet.
- **Shape the set so the answer is not its center.** If each wrong option changes a different line, the answer
  is the only option that agrees with all the others, and a guess of the most typical option wins. So either put
  every mistake at the same place (`nums[:3]` among `nums[3:]`, `nums[:2]`, `nums[1:4]`), or use a 2×2: mistake A,
  mistake B, and A plus B together (a missing colon, a body that is not indented, and both). With 2 wrong options,
  the second can be the first plus one more mistake. Each single mistake should still be one the learner can
  name.
- **Format:** each option is complete code at its real column in the file, exactly like `answer` (a function body
  starts at 4 spaces); a wrong-indentation option is written at the wrong column. The player drops indentation
  that every option shares and keeps the rest, so the mistake shows. Options are shown as written, so write them
  as cleanly as the answer. For answers over 3 lines, 2 options keep the reading short.
- **Prompt and explain read well both ways:** describe the task ("Print each name in `names`."), not the input
  method: no "Write…", "Type…" or "Pick…" in a picked slide's title or prompt. `explain` should say why the answer
  works, which is also why the wrong options do not. `hint` only shows on the typed slide.
- `npm run validate` checks that each slide has 2–3 distinct options, that none equals the answer or an `accept`
  (normalized line by line, indentation included) or grades as correct against them, and, when the slide has an
  `output`, runs `starter` + each option with python3: an option may fail to compile or raise, but must not print
  the expected output. It also checks that the answer is not the options' center (each option's token edit
  distance to the others, summed: the answer may tie for the smallest total, not have it alone), that no sentence
  of a picked slide's title or prompt starts with "Write", "Type" or "Pick", that a lesson's last "Your turn" has
  no `pick`, and the `ideas` rules above.

## Every solution must be tested
In your own scratch directory, build a harness: `from typing import *`, `import heapq, collections, math`,
define `ListNode` / `TreeNode` / builders as needed, paste the annotated solution (it is valid Python),
and assert on your examples plus edge cases — ideally also against a brute force on random inputs.
Every example's `output` must be what the code really returns.

## Check your work
```
npm run validate -- <category-id> [<category-id> ...]
npx tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext --moduleResolution bundler src/content/problems/<category-id>.ts
```
Both must pass with zero errors. Fix warnings where reasonable.

After adding a problem or changing a solution, also run `python3 scripts/check-distractors.py` (a few minutes;
needs python3). The pick screens make wrong options from each line of a solution; this script runs every one of
them in its place, on the problem's examples and random inputs, and writes the ones that still give the right
answer (code that works, so it must never be marked wrong) to `src/content/distractorDeny.ts`, with the parts
that get no Arrange distractor. When none of the examples reaches a line (an empty input, a case with no
answer), every option of it "works" there and is denied: add a valid input that reaches it to `EXTRA_INPUTS` in
the script (within the problem's constraints; the original solution is run on it like on an example).
`npm run validate` fails when that list of parts is out of date or when a solution changed since the list was
made (its entries no longer match), but it cannot find new working options by itself, so run the script
whenever a solution changes. Pattern templates are not run: their working options
are listed by hand in `src/content/templateDeny.ts`, and `npm run validate` fails when a template changed since
(recheck its options, then update the key it prints).
