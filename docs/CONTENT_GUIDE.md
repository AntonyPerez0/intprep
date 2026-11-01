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
5. **steps**: 3–7 unique, plain-English steps that mirror the chunks (used in "put the steps in order" drills,
   so each must be distinguishable). **hints**: 2–3 progressive (gentle → strong).
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
Code lessons (not purely conceptual ones) let beginners write code themselves with `kind: 'type'` slides
(see `TypeSlide` in `src/content/types.ts`). Put one right after the slide that taught the idea, about 2–3 per
lesson, growing from one line to a few lines to a whole small function.
- **Answerable from the lesson so far**, and unambiguous: name every variable, function and loop variable the
  answer uses (`Use i as the loop variable`), because the learner's code is compared with the answer line by line.
- `starter`: read-only lines shown above the editor (a `def` line, a variable to use). Write `answer` at its real
  indentation under the starter (a function body is indented 4 spaces); the learner types from that column.
- `accept`: other answers the prompt allows (`range(0, 5)` for `range(5)`, an `if`/`return` version of a one-line
  return). Whitespace, quote style and comments never matter; indentation does.
- `output`: exactly what `starter` + `answer` prints, shown as the expected output. `hint`: a nudge, not the answer.
  `explain`: why it works, shown after checking.
- `npm run validate -- foundations` compiles `starter` + `answer` (and every `accept`) with python3.

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
