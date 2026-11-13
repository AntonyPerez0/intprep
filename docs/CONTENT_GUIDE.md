# Writing IntPrep content

Read these first:
- `src/content/types.ts` — the schema and the annotated-solution format (`#@` chunk explanations, `  #!` key lines, header = lines before the first `#@`).
- `src/content/categories.ts` — the exact problem ids (LeetCode slugs) and teaching order for each unit.
- `src/content/problems/arrays-hashing.ts` — the reference example. Match its tone, depth and length.
- `src/content/tests/index.ts` — how a problem's tests are written (inputs only), and why every input must be valid.

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
   (e.g. Best Time to Buy and Sell Stock → `['two-pointers', 'greedy', 'dp-1d']`). Leave it out otherwise.
7. **premium: true** for LeetCode Premium problems (271, 286, 261, 323, 269, 252, 253).
8. Examples use Python-ish literals: `nums = [2, 7, 4]`, linked lists `head = [1, 2, 3]`,
   trees in level order `root = [3, 9, 20, null, null, 15, 7]`. The examples are also the first tests the app
   runs on a learner's code, so write each `input` as `name = value, ...` with the method's parameter names (a
   design class as its calls) and keep it valid by the problem's constraints; see **Tests** below.
9. Text fields support mini-markdown: `**bold**`, `` `code` ``, `*italic*`, blank-line paragraphs, `- ` bullets.
   Keep backticks and `**` balanced. Careful with apostrophes inside single-quoted TS strings
   (use double quotes or template literals for those strings).

## Foundations: "Your turn" slides
Beginners learn by writing code. Code lessons let them write it themselves with `kind: 'type'` slides (see
`TypeSlide` in `src/content/types.ts`); the first exercise on a new idea is picked from choices, and a later slide
types it (**Pick options** below). Put one right after the slide that taught the idea: **6 or more per core Python
lesson** (Python Basics, Decisions and Loops, Lists and Strings, Grids and Pointers, Dicts and Sets, Functions,
Classes and Nodes, Python You Will Meet; today they have 7 to 14; the other lessons, such as Big-O, Recursion or How
to Solve a Problem, get a few), ramping from a single line to a few lines to a small program or function by the end.
Keep quizzes few (today 1 to 3 per core Python lesson, up to 5 in the others), and use them for recognition only:
predicting output, tracing ("Trace it. What does `count` hold right after the pass where `n` is `3`?"), spotting a
bug or gotcha, reading complexity, choosing the approach or data structure for a described problem. A slide whose
answer the learner reveals comes back at the end of the lesson, so make each one worth writing twice.

The track has 14 lessons, in this order: How IntPrep Works, Python Basics, Decisions and Loops, Lists and Strings,
Grids and Pointers, Dicts and Sets, Functions, Classes and Nodes, Big-O, Recursion, A Tour of Data Structures, Python
You Will Meet, How to Solve a Problem, How LeetCode Works. Most are in `src/content/foundations.ts`; Grids and
Pointers and Python You Will Meet are in `src/content/foundations-extra.ts`, each naming the lesson it comes after.
A lesson's `minutes` is a realistic estimate of working through it, exercises included (10 for the introduction,
about half an hour to an hour for the others); the dashboard shows it and the plan adds the lessons up, so update it
when a lesson grows.
- **How a typed slide is checked.** The learner's code is first compared with `answer` and every `accept` line by
  line. Code that matches none of them is run with real Python when the app can run it and the slide has an `output`
  or a `check`: with a `check`, the asserts decide; with only an `output`, the code must print it and use the same
  building blocks as `answer` (its keywords, `+=`, method calls such as `.append(`), so `print(15)` is not "add 5
  with `+=`". Code that fails shows Python's own error with a plain-language explanation, what it printed against
  the expected output, or the assert that failed. When Python cannot be run (offline before its first use, or "Run
  my code" turned off) and on a slide with neither field, the line-by-line comparison stands alone.
- **Answerable from the lesson so far**, and unambiguous: name every variable, function and loop variable the
  answer uses (`Use i as the loop variable`), because the learner's code is compared with the answer line by line
  first, and that comparison is all there is when the code cannot be run. A slide with a `check` may state only the
  goal (see `check` below).
- `starter`: read-only lines shown above the editor (a `def` line, a variable to use). Write `answer` at its real
  indentation under the starter (a function body is indented 4 spaces); the learner types from that column.
- `accept`: other answers the prompt allows (`range(0, 5)` for `range(5)`, an `if`/`return` version of a one-line
  return). Whitespace, quote style and comments never matter; indentation does.
- `output`: exactly what `starter` + `answer` prints, shown as the expected output. `hint`: a nudge, not the answer.
  `explain`: why it works, shown after checking.
- `check`: Python run after the learner's code, in the same namespace: asserts on what they wrote (`assert total ==
  15`, `assert length([4, 1]) == 2`). It prints nothing, and raising means the code is wrong. With a `check`, any
  code that runs clean (and prints `output`, when there is one) is correct, so the prompt can state only the goal
  ("Write `has_duplicate(nums)`: return `True` if any number appears more than once") instead of dictating names
  and lines. Use it for find-the-bug exercises and for **every exercise whose answer is a function or a method**:
  without an `output` or a `check` the code is never run, and a correct function written another way is marked
  wrong. Today 38 slides have one, and no typed slide is left with neither field. Rules:
  - Test what the prompt asks for and nothing more: the names the prompt gives (the function, the variable that
    holds the result), the edge cases it mentions (`[]`, one item), and, when the prompt asks for speed, the work
    done (see the last slide of How to Solve a Problem, which counts how often the list is read).
  - Write one condition per `assert`, readable on its own: the learner is shown the assert that failed. Where the
    exercise is about *how* the code is written (it must call a helper, recurse, define a nested function), test
    that too and give that assert a message (`assert calls, "use recursion: power should call itself"`): the
    learner is shown the message instead of the line.
  - `answer` is still required: it is the solution shown, and what the code is compared with when Python cannot be
    run. Keep `accept` for the other forms you expect, for the same reason.
  - A slide may have both a `check` and `pick` options: it is picked first, and the `check` decides once it is
    typed. Every `pick` option must fail the `check`.
- `npm run validate -- foundations` compiles `starter` + `answer` (and every `accept`) with python3, and runs every
  one that declares an `output` or a `check` (and every code slide with an `output`): what it prints must match
  `output` exactly (nothing, when the slide has only a `check`), and the `check`, run after it, must not raise. It
  runs each `pick` option against the `check` too, and fails if one passes. Beyond the `pick` options it does not
  test that a `check` rejects wrong code: try a wrong answer against it yourself.

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
  "Your turn" of a lesson (the small program) is always typed. Today 55 of the 113 "Your turn" slides are picked.
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

## Clue words (`src/content/cues.ts`)
Each pattern has 6 to 9 clue words: `{ see, use, also?, problems? }` (the `Cue` interface in `types.ts`). They are
what the Clue words drill asks, what the pattern intro and the pattern guide list, and a step of each unit's
"Memorize this pattern".
- `see` is wording a learner can spot while reading a problem: a phrase statements really use, in quotes when it
  is literal ("**k-th largest**", "in **O(log n)** time"), or a fact about the input or output that is on the page
  (a list of `[start, end]` pairs). Not a thought had while solving ("the brute force repeats work"): that belongs
  in the guide's `whenToUse`. At most 90 characters; bold the one or two trigger words.
- **General wording, not one problem's statement.** A clue is wording that turns up in many problems, including
  ones outside the 150 ("the **top `k`**", "return **all possible** …", "sorted, then **rotated**"), so that it
  helps on a problem the learner has never seen. "Which pair of walls holds the most water?" only helps on
  Container With Most Water; that belongs in the problem's own `signals`, which the drill asks as a separate kind
  of card. Several phrasings of one cue may share a `see` ("**duplicate**", "appears **more than once**",
  "**distinct**"). Where a pattern has little general wording (Greedy, Math & Geometry), its last clues may be the
  signature wording of a well-known problem. A clue need not have a problem in the unit.
- `use` is what to reach for, concrete enough to act on ("a heap capped at size **k**", "binary search **on the
  answer**"). At most 70 characters.
- The drill offers the other patterns as wrong answers, so a `see` must point to its own pattern. Where the wording
  honestly fits another pattern too, make it more specific, or list that pattern in `also` (it then counts as right
  and is never offered as a wrong option).
- `problems`: one or two problems of the unit whose statements show the wording, when there are any. Put the most
  telling clue first: the pattern intro's question uses it.
- `npm run validate -- cues` checks the counts, the lengths, that `problems` belong to the unit, and that no two
  patterns claim the same wording without `also`.

## Every solution must be tested
In your own scratch directory, build a harness: `from typing import *`, `import heapq, collections, math`,
define `ListNode` / `TreeNode` / builders as needed, paste the annotated solution (it is valid Python),
and assert on your examples plus edge cases — ideally also against a brute force on random inputs.
Every example's `output` must be what the code really returns (`judge-check.py`, below, checks the ones that are a
plain value).

### Tests: what "run my code" runs
The app runs a learner's code against a problem's tests (Code from memory's From scratch, Solve it yourself, the
mock interview, "Why is it wrong?" in the lesson). The tests are the problem's examples, then the inputs in
`src/content/tests/<unit>.ts`, keyed by problem id. The judge is `src/judge/judge.py`; read its docstring.
- **Inputs only.** A test is a string written exactly like an example's `input`: `nums = [3, 8, 11, 4], target = 7`,
  with the method's parameter names; a linked list or a tree as a list (`head = [1, 2, 3]`, `root = [3, 9, 20, null,
  null, 15, 7]`); `null`, `true` and `false` as in the examples; a cycle as the extra `pos = 1`; a design class as its
  calls, `LRUCache(2), put(4, 40), get(4)`. There is no expected output: the judge runs the problem's own solution on
  the input and compares the learner's answer with what it returns, so a test cannot go stale when the solution is
  rewritten.
- **Every input must be valid by the problem's constraints.** This is the rule that matters most. Any correct
  solution has to agree with ours on a test, and that is only true on inputs the problem allows. On an invalid input
  (a "rotated sorted" list that is not one, repeated values where the problem says distinct, a `k` larger than the
  list, two possible answers where the problem promises exactly one, an empty list where the length is at least 1)
  two correct solutions can disagree, and a learner's right answer would be marked wrong. Reread the constraints of
  the problem on LeetCode before writing tests, and do not add an "edge case" the constraints rule out.
- **What to cover:** at least 4 tests per problem (CI fails below that; today each has 4 to 12): the smallest valid
  input, each branch of the solution (an answer at the start, at the end, no answer where that is allowed),
  duplicates and negatives where allowed, the cases the problem's `pitfalls` name, and one or two larger inputs,
  so the report can say when code that passes did far more work than the taught solution. Do not repeat an example
  or another test. Keep our solution fast on every test: the judge stops a run that goes on too long, and a
  learner's code gets a multiple of the steps ours took.
- **How answers are compared** is what LeetCode judges: the result, or, for a method that returns nothing, its
  arguments afterwards. A list may come in any order when the prompt or a signal says "any order", or by the
  problem's entry in `ANY_ORDER` in `judge.py` (`'deep'`: the items and each item's own items; `'outer'`: only the
  items; `False`: the order counts). A problem with more than one right answer needs a checker in `CHECKS` there
  (Course Schedule II, Alien Dictionary, Longest Palindromic Substring, the two cloning problems), and one whose
  examples name the input differently from the method's parameter an entry in `SPECIAL_ARGS`.
- **Check them:** `python3 scripts/judge-check.py <unit or problem id> ...` runs the solution on its examples and
  tests as if a learner had typed it. It fails when a test cannot be read, is repeated, makes the solution fail or
  run long, or when an example's stated `output` is not what the solution returns. It warns about a slow test, and
  about a problem whose examples are all written in words (only its extra tests run then). `npm run validate:tests`
  is the same check over every problem with `--min 4 --quiet`, and runs in CI.
- **When a problem moves to another unit,** move its tests to that unit's file (tests are found by problem id, so
  this only keeps the files in step) and rebuild both units' traces: the app loads a trace from its problem's unit
  file, and `judge-check.py` fails when it sits in another.

### Derivation stages (dynamic programming)
For a dynamic-programming problem, the lesson's brute-force step also shows how the solution is reached, as code:
the stages in `src/content/derivations.ts` (`DerivationStage` in `src/content/types.ts`), keyed by problem id. Every
problem of the two DP units has them today, one to three each.
- **The stages come before the solution, in order:** `Plain recursion`, then `Add a cache` (the same recursion
  plus one line), then, when the solution goes a step further, the table (`Turn it into a table`). The solution
  itself is never a stage: stop at the version just before it. Where plain recursion is not the obvious first
  attempt, start with `Brute force`.
- **Each stage changes as little as possible from the one before:** the same names, the same indices and the same
  recurrence (the cache stage marks its one new line with a `# new:` comment). `note` (mini-markdown, 1–3
  sentences) says what the stage does (for the first one: the state, the choice and the base cases) and what is
  still wrong with it; `time` is its complexity.
- **Each `code` is a complete, runnable answer** in the problem's own signature (`class Solution:` and the same
  method), with no `#@` or `#!` markers. `judge-check.py` runs every stage on the problem's examples and tests: it
  must pass them all. Only a stage titled `Plain recursion` or `Brute force` may be stopped for running too long
  on the larger tests; it must still be right on the ones it finishes.

## Check your work
```
npm run validate -- <category-id> [<category-id> ...]
npx tsc --noEmit --strict --skipLibCheck --target es2022 --module esnext --moduleResolution bundler src/content/problems/<category-id>.ts
python3 scripts/judge-check.py <category-id> [<category-id> ...]
```
All three must pass with zero errors. Fix warnings where reasonable.

After adding a problem or changing a solution (or a problem's examples), rerun three scripts, in this order. All
need python3:
1. `python3 scripts/check-distractors.py`: the wrong options of the pick screens (below).
2. `python3 scripts/build-traces.py <category-id>` (`npm run traces` for every unit): the step-by-step trace the
   lesson shows in "Watch it run", written to `src/content/traces/<category-id>.json`. A trace points at the
   solution's lines and carries a hash of the solution it was made from, so an older one no longer fits. The script
   picks the input itself: the first example whose whole run fits in 70 steps, else the shortest such run among the
   examples and tests, else the start of the first example. Commit the JSON; never edit it by hand.
3. `python3 scripts/judge-check.py <category-id>`: the solution still passes its examples and tests, the examples'
   outputs still hold, the derivation stages still pass, and the trace was made from the solution as it is now
   (it fails with "run python3 scripts/build-traces.py" otherwise).

The first of them takes a few minutes. The pick screens make wrong options from each line of a solution;
`check-distractors.py` runs every one of
them in its place, on the problem's examples and random inputs, and writes the ones that still give the right
answer (code that works, so it must never be marked wrong) to `src/content/distractorDeny.ts`, with the parts
that get no Arrange distractor. When none of the examples reaches a line (an empty input, a case with no
answer), every option of it "works" there and is denied: add a valid input that reaches it to `EXTRA_INPUTS` in
the script (within the problem's constraints; the original solution is run on it like on an example). When the
random inputs break a problem's rules (a rotated list that is not sorted, a node that is not in the tree, a
token list that is no expression), a right option can look wrong on them: give the problem a generator of
valid inputs in `VALID_INPUTS`. A problem with more than one right answer needs a checker in `CHECKS`, one
whose answer may come in any order an entry in `ANY_ORDER` (`'deep'` or `'outer'`), and a new design class
(a class with several methods) an operation generator in `DESIGN`.
`npm run validate` fails when that list of parts is out of date or when a solution changed since the list was
made (its entries no longer match), but it cannot find new working options by itself, so run the script
whenever a solution changes. Pattern templates are not run: their working options
are listed by hand in `src/content/templateDeny.ts`, and `npm run validate` fails when a template changed since
(recheck its options, then update the key it prints).
