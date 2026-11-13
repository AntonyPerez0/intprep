# IntPrep 🧠⚡

**Go from little or no coding experience to confidently solving coding-interview problems.**

IntPrep teaches the 150 classic interview problems (the same set as the popular NeetCode 150 list) one step at a
time, and you work with real code from the first lesson: new code is picked from choices, and once you know it you
type it yourself. When you write a whole solution or a beginner exercise, your Python is run in the browser, so any
correct code passes and wrong code shows the error or the failing test. Then it makes the patterns *stick* with short
daily reviews built on spaced repetition, where you spot the pattern and recall the code from memory, plus streaks,
XP, gems and achievements in the style of Duolingo.

It is a static web app with no account and no server. It works on desktop and phones, can be installed to your home
screen, works offline after the first visit, and saves progress in your browser. The Python runtime (Pyodide, about
7 MB over the wire) is downloaded the first time you run code and kept in the browser; after that, running code works
offline too. Until then, or with "Run my code" turned off, typed code is compared with the answer line by line.

The interface follows a documented design system ([`docs/DESIGN.md`](docs/DESIGN.md)): Inter typography, a neutral
palette with one indigo accent, Lucide icons, tuned light and dark themes, and a ⌘K / Ctrl+K command palette for
jumping to any problem, pattern or page.

## What's inside

| | |
|---|---|
| 🧱 **Foundations track** | 14 beginner lessons (about 8 hours by their own estimates) where you write Python from the first minute: Python basics, loops, lists and strings, grids and pointers, dicts and sets, functions, classes and nodes, Big-O, recursion, a data-structure tour, the Python idioms solutions rely on, a problem-solving framework, and how LeetCode works. 113 "Your turn" exercises (7 to 14 in each Python lesson) grow from one line to small programs and functions, with find-the-bug exercises among them, plus a few quizzes for predicting output, tracing code, reading complexity and choosing an approach. Your code is compared with the accepted answers line by line; code that differs is run (where the exercise prints something or has a check), so working code counts and wrong code shows Python's real error with a plain-language explanation. 21 exercises state only the goal and are checked by running your code. 55 exercises, the first on each new idea, start as *Pick the right code*: the answer among a few look-alike snippets; a later exercise in the same lesson or the next types that idea. The rest are typed. An exercise you needed the answer for comes back at the end of the lesson, and a lesson left part-way resumes where you were. Only a learner who says they are new to coding is led through the track; for everyone else it is optional. |
| 📖 **18 pattern units** | Arrays & Hashing → Two Pointers → Stack → Binary Search → Sliding Window → Linked List → Trees → Tries → Heap → Backtracking → Graphs → 1-D DP → Intervals → Greedy → Advanced Graphs → 2-D DP → Bit Manipulation → Math. Each starts with a pattern intro: an analogy, recognition cues and a reusable Python template, then you fill in the template's missing lines, picked from choices while the template is new (a missed check comes back at the end), plus a few quick questions. That first check feeds *Template practice*: pick the gaps, fill the gaps, then type the template from memory. |
| 🪜 **Guided problem lessons** | All 150 problems, in eleven steps. Read the problem (the pattern is not named yet, and you can try it yourself first) → guess the pattern → progressive hints → brute force (the 23 dynamic-programming problems add the versions that lead up to the solution, as code: plain recursion, the same with a cache, the table) → key insight + mnemonic → the plan step by step → the code, part by part (read a part, then rebuild it from memory and check it line by line) → watch it run: a step-by-step trace of the solution on a small input → complexity check → common traps → final check: fill the gaps in the whole solution. The first time through, you build each part from choices (put its lines in order; one look-alike line does not belong) and pick the final gaps; a replay of a problem you know is typed. After a miss, *Why is it wrong?* runs the solution with your version in place and shows the input it breaks on. A lesson resumes at the step you reached after a reload, and "Next" at the end follows the learning path. |
| 🎯 **Solve it yourself** | A blank file under the problem's signature, run against its tests. Before a lesson, passing them adds the problem to your reviews a week out and skips the lesson; after one, it is proof you can write the code unaided. *Run examples* as often as you like; *Submit* runs every test and shows the first ones that fail. |
| 🔁 **Daily review (spaced repetition)** | Each learned problem gets an SM-2–style schedule, and reviews mix problems together (interleaving). Each problem gets one recognition card (usually *spot the pattern*; otherwise the key insight, the technique, the complexity or the steps in order) and two coding cards picked by how well you know it: *write the key line*, *fill the gaps* in the solution, or *write a part* from its plain-English cue. Until you have shown you know a problem's code (a clean review on a later day, or typing it from memory at 80% or more), it is new, so its two coding cards are picked instead: first *arrange a part* and *pick the gaps*, then, if that first review was Fuzzy or on the day you learned it, *pick the key line* and *pick the gaps*. A picked card that is nearly right gets the same half credit as a typed one. Missed cards come back in the same session as a fresh version. Practicing ahead never resets the schedule of a problem that is not due, and a forgotten problem keeps a fifth of its interval instead of starting over. |
| ⌨️ **Code from memory** | Three rungs, inspired by AlgoDrill-style recall: rebuild a solution part by part from plain-English cues, fill the gaps in it, then write it from a blank file. While a problem's code is new, part by part and the gaps are picked from choices (with their own best scores); From scratch is always typed, and it is run against the problem's tests, so any correct solution passes; a failing run shows the failing test, with the line-by-line comparison one click away. Type on any device: phones get a key bar for indents and symbols. |
| 🧩 **Code practice: pick first, then type** | New code is picked from choices until you know it, then typing takes over (faded guidance, Parsons problems; see the science). In the default, every pick screen offers "Type instead". Profile → *Code practice* switches between *Pick first, then type* (the default), *Always type* and *Always pick*. |
| 🔎 **Clue words** | For each pattern, the wording that turns up across many problem statements and should make you reach for it, and what to reach for ("**k-th largest**" → a heap capped at size k). Listed in the pattern guide and each unit, taught in the pattern intro, and drilled like flashcards in both directions: this wording, which pattern? this pattern, which wording? A daily review also asks a learned problem's clue phrases without its statement. Four right in a row marks a pattern's clue words as known. |
| 🧭 **Pattern flowchart** | A few questions about a problem's wording that end at the pattern to try first: what the problem is built on (a linked list, a tree, a graph, a grid, ranges, a class), then, for an array, a string or plain numbers, what the wording asks for. Each result says what to reach for, lists the problems that end there and the pattern's clue words, and the whole chart is shown as an outline to learn. It is checked against the curriculum: the wording of 148 of the 150 problems leads to their pattern by the chart, and it names the two that hide it. |
| 🪜 **Steps to memorize** | Every unit has "Memorize this pattern" (learn it, know its clue words, fill in its template, write the template from a blank file, learn its problems) and every problem has "Memorize this solution" (learn it, rebuild it part by part, fill in its missing lines, write it from a blank file, keep it with reviews). Each list shows what is done and a button for the next step. |
| ⚡ **Pattern Blitz** | Two games with combo multipliers: *Spot the pattern* (60 seconds of "which pattern is this?") and *Key lines* (90 seconds to recall the key lines of solutions you have learned, picked from choices while a problem is new, else typed, and only typed lines count toward your best; opens at 3 learned problems). Zen mode has no clock. Spot the pattern asks about the units you have started once they hold 8 problems. Misses go into your review queue. |
| ⏱️ **Mock interview** | One problem against the clock (15 minutes for an Easy problem, 25 for a Medium, 40 for a Hard) with a blank file, no hints and no pattern name. It draws a problem you have learned, or a new one from a pattern you have started, and your code has to pass the tests. |
| 🗓️ **Your plan** | An optional interview date (onboarding or profile) and a dashboard card: reviews due, new problems today against a target, core problems left, and a sentence saying where the pace leads. Reviews come before new material when more than 12 are due. By default the path takes the Easy and Medium problems of every unit first and the Hard ones in a second pass (Profile → *Path order*). With a date set, no review interval runs past it. |
| 📚 **Cheat sheet & problem list** | Searchable recognition cues ("sorted" → binary search / two pointers, "top k" → heap…), templates, and all 150 problems with filters. |
| 🔥 **Motivation loop** | XP, levels, a selectable daily goal, streaks with automatic streak freezes, a 48-hour streak repair, gems, 25 achievements, mastery stars per problem (they fade when a review is overdue, and the top one needs code you typed from memory or ran), a weekly XP chart, a practice calendar, confetti, sounds and haptics. |
| 🔬 **The science** | Every mechanic maps to research on retrieval practice, the generation effect, spacing, interleaving, worked examples, Parsons problems, pretesting, flow, self-determination theory and published streak experiments. See the in-app *The science* page and [`docs/LEARNING_SCIENCE.md`](docs/LEARNING_SCIENCE.md). |

## Run it locally

```bash
npm install
```

```bash
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

Other scripts:

```bash
npm run build      # type-check and build to dist/
```

```bash
npm run validate   # check all content, compile every Python solution and run the beginner exercises (needs python3)
```

```bash
npm run validate:tests   # run every solution on its examples and tests with the judge, check the traces (needs python3)
```

```bash
npm run traces     # rebuild the step-by-step traces ("Watch it run") after changing a solution or its examples
```

The last two are `python3 scripts/judge-check.py --min 4 --quiet` and `python3 scripts/build-traces.py`. Both scripts
take unit ids to limit the run, and `judge-check.py` also takes problem ids:

```bash
python3 scripts/judge-check.py trees graphs   # some units (or problem ids); without --quiet it also prints warnings
```

```bash
python3 scripts/build-traces.py trees         # one unit's traces
```

```bash
python3 scripts/check-distractors.py   # after changing a solution: find wrong options that are really right
```

## Deploy (free) with GitHub Pages

Live site: **https://antonyperez0.github.io/intprep/**

The repo includes `.github/workflows/deploy.yml`. Every push validates the content (`npm run validate`), runs every
solution on its tests (`npm run validate:tests`) and builds the site; pushes to the
repository's default branch also publish it (you can also run it by hand from the **Actions** tab). One-time setup: in
your GitHub repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. The site uses hash-based URLs and relative asset paths, so it works under
`https://<user>.github.io/<repo>/` with no extra configuration. Any static host (Netlify, Vercel, Cloudflare Pages) also
works: serve the `dist/` folder.

Offline support: each build writes `dist/sw.js` from `sw/sw.template.js`, with a version hashed from the build output and
the list of files to precache. Every deploy gets its own `intprep-<version>` cache, so returning visitors and installed apps
get the new version on their next launch, and the previous deploy's cache is deleted. Tabs already open keep running the
version they loaded until they're reloaded. The worker never touches caches outside `intprep-*`, since every GitHub Pages
project of the same user shares one origin.

The Python runtime is not part of that precache. `sw/pyodide-plugin.ts` serves it in development and copies it into
the build under `pyodide/` (about 13 MB of files), outside the JS bundle. The browser fetches it the first time code
is run, and the worker keeps it in its own cache, `intprep-python-<pyodide version>`, which a new deploy leaves alone.
So after that first run, running code works offline. Offline before it, every screen falls back to comparing the code
line by line; Solve it yourself and the mock interview have no such fallback and need Python to have loaded once.
The tests and the traces are ordinary lazy chunks and are precached with the rest of the app.

## How the content works

All teaching content is typed TypeScript data in `src/content/`:

- `categories.ts`: the 18 units, their order, prerequisites and problem lists.
- `problems/<unit>.ts`: the pattern guide plus every problem in that unit.
- `tests/<unit>.ts`: extra test inputs for each problem, written like its examples. They have no expected outputs:
  the problem's own solution supplies them, so every input must be valid by the problem's constraints.
- `traces/<unit>.json`: the step-by-step run of each solution on one small input, shown in the lesson's "Watch it
  run" step. Generated by `npm run traces`; do not edit by hand.
- `derivations.ts`: for the dynamic-programming problems, the versions that lead up to the solution (plain
  recursion, the same with a cache, the table), each a complete runnable answer.
- `foundations.ts` and `foundations-extra.ts`: the beginner track.
- `cues.ts`: the clue words, 6 to 9 "see this, reach for that" pairs per pattern.
- `flow.ts`: the pattern flowchart: its questions, their answers, and for each result the problems whose wording
  leads there (`npm run validate` checks that every problem is on a result that names its pattern).
- `science.ts`: the research summaries shown in the app.

Each solution is **one block of real, runnable Python** with two tiny comment markers:

```python
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        #@ Remember each value we have seen and the index where we saw it.
        seen = {}
        for i, x in enumerate(nums):
            #@ The partner that would complete the pair.
            need = target - x  #!
```

`#@` starts a walkthrough chunk with its explanation (in a lesson, each chunk is a part you write), and `  #!` marks a
key line: it gets a gold dot in lessons, is always a gap in the lesson's final check, and is what the review's key-line
cards and Pattern Blitz's Key lines ask you to type. Because
these are ordinary comments, every solution is compiled by `npm run validate` and was tested against brute-force
answers on random inputs when it was written. See [`docs/CONTENT_GUIDE.md`](docs/CONTENT_GUIDE.md) to add or edit
problems.

**The judge.** `src/judge/judge.py` runs a learner's code against a problem's tests (its examples, then
`tests/<unit>.ts`), records the traces, and runs the beginner exercises. The same file runs in two places: in the
browser, under Pyodide in a web worker (`src/lib/pyWorker.ts`, driven by `src/lib/python.ts`), and under python3 in
the scripts. A test passes when the learner's answer is the one the problem's own solution returns, compared the way
LeetCode judges it: lists in any order where the problem allows it, and any valid answer where more than one is
right. `npm run validate:tests` runs every solution on its examples and tests as if a learner had typed it, checks
each example's stated output, runs every derivation stage on the same tests, and fails when a trace is missing or was
made from an older solution.

## Project layout

```
src/
  content/      teaching content (typed data), tests (tests/) and generated traces (traces/)
  judge/        judge.py: runs code against tests, records traces, runs beginner exercises
                (in the browser under Pyodide, and under python3 in the scripts)
  lib/          spaced repetition (srs.ts), progress store & streaks (store.ts),
                game rules (game.ts), the plan (plan.ts) and path order (path.ts),
                running Python (python.ts, pyWorker.ts), traces (traces.ts), lesson resume (resume.ts),
                drill generators (drills.ts), code grading, parser, markdown, highlighter
  components/   app shell, command palette, icon registry, drills, plan card, trace view,
                test report, "Why is it wrong?", crash screen, shared UI primitives
  pages/        landing, onboarding, dashboard, learning path, unit, guided lesson, review,
                Blitz, code from memory, solve it yourself, mock interview, pattern guide,
                pattern flowchart, problem library, profile, science
  styles/       design tokens (base.css), components, shell, per-page styles (pages/)
scripts/        content validator, distractor checker (runs every wrong option in place),
                judge check (judge-check.py), trace builder (build-traces.py)
sw/             offline service worker template, the Vite plugin that fills in each build's precache list,
                and the plugin that serves the Python runtime (pyodide-plugin.ts)
docs/           design system, learning-science design doc, content guide
```

## Notes

- Problem statements are paraphrased with original examples. Each lesson links to the official problem on LeetCode,
  and Premium-only problems link to a free practice version.
- Progress is stored in `localStorage`. Use *Profile → Export backup* to move it between devices. Saved progress is
  checked field by field when it is loaded or imported; a save that cannot be read is kept aside and the app says so,
  and a save that fails (storage full or blocked) shows a warning.
- Your code never leaves the browser: Python runs locally, and *Profile → Run my code* turns it off.
- Browsers: the app needs one from 2023 or later (Safari and iOS 16.4, Chrome 107, Firefox 104). An older browser
  gets a message saying so (`index.html`) instead of a blank page.
