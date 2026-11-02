# IntPrep 🧠⚡

**Go from little or no coding experience to confidently solving coding-interview problems.**

IntPrep teaches the 150 classic interview problems (the same set as the popular NeetCode 150 list) one step at a
time, and you write the code yourself from the first lesson. Then it makes the patterns *stick* with short daily
reviews built on spaced repetition, where you spot the pattern and write the code from memory, plus streaks, XP,
gems and achievements in the style of Duolingo.

It is a static web app with no account and no server. It works on desktop and phones, can be installed to your home
screen, works offline after the first visit, and saves progress in your browser.

The interface follows a documented design system ([`docs/DESIGN.md`](docs/DESIGN.md)): Inter typography, a neutral
palette with one indigo accent, Lucide icons, tuned light and dark themes, and a ⌘K / Ctrl+K command palette for
jumping to any problem, pattern or page.

## What's inside

| | |
|---|---|
| 🧱 **Foundations track** | 11 beginner lessons where you write Python from the first minute: Python basics, loops, lists, dicts and sets, functions and classes, Big-O, recursion, a data-structure tour, a problem-solving framework, and how LeetCode works. 64 "Your turn" exercises check your code line by line (7 or 8 in each core Python lesson), growing from one line to small programs and functions, plus a few quizzes for predicting output and reading complexity. An exercise you needed the answer for comes back at the end of the lesson. |
| 📖 **18 pattern units** | Arrays & Hashing → Two Pointers → Stack → Binary Search → Sliding Window → Linked List → Trees → Tries → Heap → Backtracking → Graphs → 1-D DP → Intervals → Greedy → Advanced Graphs → 2-D DP → Bit Manipulation → Math. Each starts with a pattern intro: an analogy, recognition cues and a reusable Python template, then you fill in the template's missing lines yourself (a missed check comes back at the end), plus a few quick questions. That first check feeds *Template practice*: fill the gaps, then type the template from memory. |
| 🪜 **Guided problem lessons** | All 150 problems. Read the problem → guess the pattern → progressive hints → brute force → key insight + mnemonic → the plan step by step → write the code yourself, part by part (read a part, then write it from memory and check it line by line) → complexity check → common traps → final check: fill the gaps in the whole solution. |
| 🔁 **Daily review (spaced repetition)** | Each learned problem gets an SM-2–style schedule, and reviews mix problems together (interleaving). Each problem gets one recognition card (usually *spot the pattern*; otherwise the key insight, the technique, the complexity or the steps in order) and two coding cards picked by how well you know it: *write the key line*, *fill the gaps* in the solution, or *write a part* from its plain-English cue. Missed cards come back in the same session as a fresh version. Practicing ahead never resets the schedule of a problem that is not due. |
| ⌨️ **Code from memory** | Three rungs, inspired by AlgoDrill-style recall: rebuild a solution part by part from plain-English cues, fill the gaps in it, then write it from a blank file. Type it on any device (phones get a key bar for indents and symbols); picking lines from choices is an opt-in in Profile. |
| ⚡ **Pattern Blitz** | Two games with combo multipliers: *Spot the pattern* (60 seconds of "which pattern is this?") and *Key lines* (90 seconds to type the key lines of solutions you have learned; opens at 3 learned problems). Zen mode has no clock. Misses go into your review queue. |
| 📚 **Cheat sheet & problem list** | Searchable recognition cues ("sorted" → binary search / two pointers, "top k" → heap…), templates, and all 150 problems with filters. |
| 🔥 **Motivation loop** | XP, levels, a selectable daily goal, streaks with automatic streak freezes, a 48-hour streak repair, gems, 21 achievements, mastery stars per problem (they fade when a review is overdue), a weekly XP chart, a practice calendar, confetti, sounds and haptics. |
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

## Deploy (free) with GitHub Pages

Live site: **https://antonyperez0.github.io/intprep/**

The repo includes `.github/workflows/deploy.yml`. Every push validates the content and builds the site; pushes to the
repository's default branch also publish it (you can also run it by hand from the **Actions** tab). One-time setup: in
your GitHub repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. The site uses hash-based URLs and relative asset paths, so it works under
`https://<user>.github.io/<repo>/` with no extra configuration. Any static host (Netlify, Vercel, Cloudflare Pages) also
works: serve the `dist/` folder.

Offline support: each build writes `dist/sw.js` from `sw/sw.template.js`, with a version hashed from the build output and
the list of files to precache. Every deploy gets its own `intprep-<version>` cache, so returning visitors and installed apps
get the new version on their next launch, and the previous deploy's cache is deleted. Tabs already open keep running the
version they loaded until they're reloaded. The worker never touches caches outside `intprep-*`, since every GitHub Pages
project of the same user shares one origin.

## How the content works

All teaching content is typed TypeScript data in `src/content/`:

- `categories.ts`: the 18 units, their order, prerequisites and problem lists.
- `problems/<unit>.ts`: the pattern guide plus every problem in that unit.
- `foundations.ts`: the beginner track.
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

## Project layout

```
src/
  content/      teaching content (typed data)
  lib/          spaced repetition (srs.ts), progress store & streaks (store.ts),
                game rules (game.ts), drill generators (drills.ts), parser, markdown, highlighter
  components/   app shell, command palette, icon registry, drills, shared UI primitives
  pages/        landing, onboarding, dashboard, learning path, unit, guided lesson, review,
                Blitz, code from memory, pattern guide, problem library, profile, science
  styles/       design tokens (base.css), components, shell, per-page styles (pages/)
scripts/        content validator
sw/             offline service worker template + the Vite plugin that fills in each build's precache list
docs/           design system, learning-science design doc, content guide
```

## Notes

- Problem statements are paraphrased with original examples. Each lesson links to the official problem on LeetCode,
  and Premium-only problems link to a free practice version.
- Progress is stored in `localStorage`. Use *Profile → Export backup* to move it between devices.
