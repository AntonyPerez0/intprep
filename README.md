# IntPrep 🧠⚡

**Go from little or no coding experience to confidently solving coding-interview problems.**

IntPrep teaches the 150 classic interview problems (the same set as the popular NeetCode 150 list) one step at a
time. Then it makes the patterns *stick* with short, game-like daily drills built on spaced repetition, plus
streaks, XP, gems and achievements in the style of Duolingo.

It is a static web app with no account and no server. It works on desktop and phones, can be installed to your home
screen, and saves progress in your browser.

The interface follows a documented design system ([`docs/DESIGN.md`](docs/DESIGN.md)): Inter typography, a neutral
palette with one indigo accent, Lucide icons, tuned light and dark themes, and a ⌘K / Ctrl+K command palette for
jumping to any problem, pattern or page.

## What's inside

| | |
|---|---|
| 🧱 **Foundations track** | 11 beginner lessons: Python basics, loops, lists, dicts and sets, functions and classes, Big-O, recursion, a data-structure tour, a problem-solving framework, and how LeetCode works. |
| 📖 **18 pattern units** | Arrays & Hashing → Two Pointers → Stack → Binary Search → Sliding Window → Linked List → Trees → Tries → Heap → Backtracking → Graphs → 1-D DP → Intervals → Greedy → Advanced Graphs → 2-D DP → Bit Manipulation → Math. Each starts with a pattern lesson: an analogy, recognition cues, a reusable Python template and a quiz. |
| 🪜 **Guided problem lessons** | All 150 problems. Read the problem → guess the pattern → progressive hints → brute force → key insight + mnemonic → the plan step by step → code built chunk by chunk with explanations → complexity check → common traps → order-the-steps puzzle → fill in the key line. |
| 🔁 **Daily review (spaced repetition)** | Each learned problem gets an SM-2–style schedule. Reviews mix problems together (interleaving) and use six drill types: *spot the pattern*, *name the technique*, *recall the insight* (self-rated), *put the steps in order*, *fill in the key line* and *know the complexity*. Missed cards come back in the same session. |
| ⌨️ **Code from memory** | Rebuild a full solution chunk by chunk from plain-English cues, inspired by AlgoDrill-style recall. Type it on desktop; on phones, tap the right next line. |
| ⚡ **Pattern Blitz** | A 60-second "which pattern is this?" game with combo multipliers, or an untimed Zen mode. Misses go into your review queue. |
| 📚 **Cheat sheet & problem list** | Searchable recognition cues ("sorted" → binary search / two pointers, "top k" → heap…), templates, and all 150 problems with filters. |
| 🔥 **Motivation loop** | XP, levels, a selectable daily goal, streaks with automatic streak freezes, a 48-hour streak repair, gems, 21 achievements, mastery stars per problem (they fade when a review is overdue), a weekly XP chart, a practice calendar, confetti, sounds and haptics. |
| 🔬 **The science** | Every mechanic maps to research on retrieval practice, spacing, interleaving, worked examples, Parsons problems, pretesting, flow, self-determination theory and published streak experiments. See the in-app *The science* page and [`docs/LEARNING_SCIENCE.md`](docs/LEARNING_SCIENCE.md). |

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
npm run validate   # check all content + compile every Python solution (needs python3)
```

## Deploy (free) with GitHub Pages

Live site: **https://antonyperez0.github.io/intprep/**

The repo includes `.github/workflows/deploy.yml`. Every push validates the content and builds the site; pushes to the
repository's default branch also publish it (you can also run it by hand from the **Actions** tab). One-time setup: in
your GitHub repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. The site uses hash-based URLs and relative asset paths, so it works under
`https://<user>.github.io/<repo>/` with no extra configuration. Any static host (Netlify, Vercel, Cloudflare Pages) also
works: serve the `dist/` folder.

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

`#@` starts a walkthrough chunk with its explanation, and `  #!` marks a key line used in the fill-in drills. Because
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
docs/           design system, learning-science design doc, content guide
```

## Notes

- Problem statements are paraphrased with original examples. Each lesson links to the official problem on LeetCode,
  and Premium-only problems link to a free practice version.
- Progress is stored in `localStorage`. Use *Profile → Export backup* to move it between devices.
