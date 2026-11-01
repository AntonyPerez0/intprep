# IntPrep design system

IntPrep should feel like a product made by a top-tier product company: think the restraint of **Linear**, the
clarity of **Stripe**'s dashboard, the density and honesty of **GitHub**, and the polish of **Apple** (Fitness
rings for goals). It is still a *learning game* — streaks, XP and celebrations stay — but they are expressed
with taste: precise, quiet, confident.

## Principles

1. **Calm by default, colour with purpose.** Neutral surfaces; one brand colour (indigo) for primary actions and
   selection; status colours only for status. Gamification accents (streak orange, gem cyan, XP amber) appear
   small, next to an icon and a label — never as big gradient slabs.
2. **Hierarchy through type and space, not decoration.** Inter, tight letter-spacing on headings, generous
   whitespace, 4px spacing grid. No ALL-CAPS buttons, no heavy drop shadows, no 3D "chunky" buttons.
3. **One icon language.** Lucide stroke icons only (`src/components/icons.tsx`). **No emoji anywhere in the UI.**
   Content files have legacy emoji `icon` fields — never render them; use `CATEGORY_ICON`, `LESSON_ICON`,
   `SCIENCE_ICON`, `ICONS`.
4. **Real data, honestly presented.** Numbers are tabular, labelled, and true. No fake testimonials, user counts,
   company logos or endorsements. Not affiliated with LeetCode, NeetCode or any employer — say so in the footer.
5. **Mobile is first-class.** Design at 390px wide first, then scale up. Touch targets ≥ 40px (on touch screens
   default `.btn` and `.input` grow to 40px, and `.btn-sm`, `.seg` buttons, `.toggle` and `.back-link` get an
   invisible 40px hit area automatically). Hover colours live inside `@media (hover: hover)` so a tap never leaves a
   sticky hover. Never cause horizontal page scroll (code blocks scroll inside themselves). Nothing may sit hidden
   behind a fixed bar: the tab bar and action bar set `scroll-padding-bottom`, and `.session-body` clears the
   action bar at its measured height.
6. **Both themes, always.** Use tokens only. Never hard-code a colour except category colours passed as `--c`.
   Check every screen in light *and* dark.
7. **Accessible.** WCAG AA contrast (white text only on the solid fills below), a solid 2px `:focus-visible`
   outline that follows each element's radius, `aria-label` on icon-only buttons (and `role="img"` when a plain
   `<span>` carries an `aria-label`), semantic headings (one `h1` per page, no skipped levels), landmarks (app pages:
   skip link + `<main id="main">`; sessions: `<header>` + `<main>`), `prefers-reduced-motion` respected (including
   JS `scrollIntoView`).

## Tokens (`src/styles/base.css`)

| Purpose | Tokens |
|---|---|
| Surfaces | `--canvas` (app bg), `--surface` (cards), `--surface-raised` (popovers), `--surface-sunken` (wells, tracks), `--surface-hover`, `--surface-active` |
| Borders | `--border` (default hairline), `--border-strong` (inputs, buttons), `--border-subtle` (row dividers) |
| Text | `--text`, `--text-secondary`, `--text-tertiary` (smallest readable text; ≥ 4.5:1 on every surface incl. sunken and brand-subtle), `--text-disabled` (disabled controls and decorative marks only — never labels, headings or placeholders) |
| Brand | `--brand`, `--brand-hover`, `--brand-text` (brand-coloured text), `--brand-subtle` (tinted bg), `--brand-border`, plus `--brand-50…800` |
| Status | `--success/-text/-subtle/-border`, same for `warning`, `danger`, `info`. `--success`/`--danger` are icon and stroke colours |
| Solid fills | White text goes only on `--brand` (button-safe in both themes; `--brand-hover` darkens), `--success-solid(-hover)` and `--danger-solid(-hover)` — buttons, count badges, answer numbers |
| Game accents | `--streak(-subtle)`, `--gem(-subtle)`, `--xp(-subtle)` |
| Radius | `--r-xs 4` `--r-sm 6` `--r-md 8` `--r-lg 12` `--r-xl 16` `--r-full` |
| Elevation | `--shadow-xs` (cards), `--shadow-sm`, `--shadow-md` (hover), `--shadow-lg` (toasts), `--shadow-xl` (modals), `--ring` (focus) |
| Type | `--font-sans` (Inter), `--font-mono` (JetBrains Mono); sizes `--fs-xs 12` `sm 13` `md 14` `base 15` `lg 17` `xl 20` `2xl 24` `3xl 30` `4xl 38` `5xl 52` |
| Motion | `--ease`, `--dur-fast 120ms`, `--dur 180ms`, `--dur-slow 320ms` |
| Layout | `--content-max 1120px`, `--prose-max 720px`, `--topbar-h 56px`, `--tabbar-h 60px`, `--actionbar-h` (set at runtime by `SessionShell`) |

Type helpers: `.display`, `.h1`, `.h2`, `.h3`, `.eyebrow`, `.lead`, `.text-secondary`, `.text-tertiary`,
`.text-xs/sm/md/lg`, `.fw-500/600`, `.mono`, `.tabular`, `.truncate`.
Layout helpers: `.row` (+`.wrap .between .start`), `.stack`, `.stack-xs/sm/lg/xl`, `.grow`, `.grid-2/3/4`.

## Components (`src/styles/components.css`, `src/components/*`)

| Need | Use |
|---|---|
| Buttons | `.btn` + `.btn-primary` / `.btn-secondary` / `.btn-quiet` / `.btn-danger` / `.btn-success` / `.btn-inverse`; sizes `.btn-sm` `.btn-lg` `.btn-xl`; `.btn-block`; `.btn-icon`. Icons inside buttons are 16px Lucide. Sentence case labels. |
| Cards | `.card` (`.flat`, `.pad-sm`, `.pad-lg`, `.pad-0`), `.card-interactive` for clickable cards, `.card-header`, `.card-title`, `.card-subtitle`, `.card-footer` |
| Badges | `<Badge tone>` or `.badge .badge-brand/success/warning/danger/info`; `<DifficultyChip d>` for difficulty |
| Icons | `<Icon name>` (registry), `<CategoryIcon id color size>`, `<IconTile icon color size solid>` from `components/icons.tsx` |
| Stats | `<StatCard icon label value meta>`; `.stat`, `.stat-label`, `.stat-value`, `.stat-meta` |
| Progress | `<ProgressBar value color linear>` (`linear` for countdowns that tick every ~100ms), `<Ring value size track instant>` (`instant` skips easing for fast timers), `<Mastery n>` (signal-strength meter, exported as `Crowns` too) |
| Forms | `.input`, `.input-group` (leading icon), `.label`, `.help`, `.seg` segmented control, `<Toggle>` switch |
| Lists | `.list` + `.list-row` (`.title`, `.meta`, `.chevron`), `.status-dot(.learned/.due)` |
| Callouts | `.callout` + `.callout-info/-warning/-brand/-success/-danger` (first child: a 16px Lucide icon) |
| Key insight | `.insight-card` with `.insight-label` and `.mnemonic` |
| Code | `<CodeView>`, `<HighlightedCode>`; `.code` blocks are always dark. Colours on code surfaces use `--code-*` tokens (`--code-key`, `--code-success-*`, `--code-danger-*`, `--code-gutter`). Framed code (templates, solutions, editors, lesson examples, quiz snippets, the landing mock) uses `<CodeWindow filename lang meta right footer className>` from `interact.tsx` — one frame everywhere, never a page-local copy: file tab (`solution.py`, `${unit}.py`, `example.py`…), `meta` such as "12 lines", language label **"Python"** (never "Python 3"); `right` replaces meta + language (e.g. a step counter); `footer` is a one-line status bar; extra panes (e.g. program output) go in `children` below the code. `className` is for placement only (grid area, margins, elevation), never a different frame. The window is a `code-window` size container: below 340px it drops `meta`, then the file name truncates — the head never wraps. Keyboard focus on scrollable code draws the ring on the window, not the clipped `<pre>` |
| Typing code | The typing kit in `components/CodeTyper.tsx` (styles in `styles/typer.css`, grading in `lib/codegrade.ts`) whenever the learner writes code, from one line to a whole solution: `<CodeTyper>` (editor, then diff, in one typing window) or the pieces `<CodeEditor>`, `<CodeDiff>`, `<TyperFooter>`, `<TyperWindow>`. Never hand-build a code textarea or a diff. See **Typing kit** below |
| Sessions | `<SessionShell progress title right onClose progressColor progressLinear>` (`progress={null}` hides the bar; renders `<header class="session-head">` + `<main class="session-body">` and publishes the mounted `.actionbar`'s height as `--actionbar-h`), `<ActionBar>` (re-arms on every state/label change, and on every `step` change for pages that keep one bar across slides or code parts, ignoring pointer input for 350ms, so a double-click cannot skip feedback or a step; `primaryIcon` replaces the trailing arrow with a leading icon and `primaryClassName` adds a hook such as `.blitz-start`, so pages don't hand-build the bar; `secondary` sits left of Check, `checkedSecondary` left of Continue once checked, e.g. "Fix and check again"), `<Choices label>` (radiogroup name, default "Answer options"), `<OrderSteps>`, `<ProblemPrompt>`. Header, body and action bar share one 728px content column. A page's own fixed bar must use the `.actionbar` class so it is measured |
| Page chrome | `<PageHeader title sub right back eyebrow>`, `<SectionHeader title sub right id>`, `<EmptyState icon title actions level>` (title is an `h2.empty-title` by default; pass `level={3}` inside an h2 section) |
| End screens | `<Completion icon tone title subtitle stats>{actions}</Completion>` |
| Misc | `<Kbd>`, `.tabs`, `details.disclosure` (the card clips, so the summary draws its focus ring inside: offset −2px, corners follow the card), `<Modal>` (traps Tab, restores focus on close to the control that opened it — recorded at first render, so a child's `autoFocus` doesn't count as the opener), toasts via `toast({ icon: 'flame', title, body, tone })` (phones and tablets show only the newest, with a +N count, docked below the top bar / session header so they never cover Close). Command palette (⌘K / Ctrl K): a modal combobox (Escape from anywhere, Tab trapped, focus restored, arrow keys move `aria-activedescendant`), one block per group; on touch screens keyboard hints hide and a Close button shows |
| App chrome | Desktop top bar: streak and gem `.pill-stat`s + avatar; the sidebar card owns the daily goal (no duplicate rings or streak pills). Status pills are `role="img"` with an `aria-label` |

## Typing kit (`components/CodeTyper.tsx`, `lib/codegrade.ts`)

Use it wherever the learner types code: Code from memory (part by part, or the whole solution from scratch),
typing a pattern template from memory, and beginner "Your turn" slides of 1–5 lines. For choosing between given
lines, use `<Choices code>` instead; for a single key line, the key-line drill's input.

**Grading** — `gradeCode(typed, expected)` is pure. Blank and comment-only lines are ignored on both sides; lines
compare with `normalizeCode` (whitespace, quote style, trailing comments and trailing commas do not matter). Typed
and expected lines are aligned by a longest-common-subsequence diff, so one extra or missing line does not mark
every following line wrong. A matched line is only correct if its indentation *relative to the snippet's base*
matches (anchored on the outermost matched line, so typing a body flush-left is fine). It returns `rows` in diff
order (`ok`, `indent` = right code, wrong indentation, `del` = typed line not in the answer, `add` = expected line
not written; a changed line is a `del` + `add` pair with `paired: true`), plus `correct`, `total`, `extra`,
`wrong`, `missing`, `wrongIndent`, `perfect`, `score` (0–1, extra lines count against it), `baseGot`/`baseExp`.
`gradeBest(typed, answers)` keeps the best match among several accepted answers. Pass clean code as `expected`
(e.g. chunk lines or `parseSolution(...).code`); `#!` key markers are dropped. Leave read-only lines (the class /
def header) out of `expected` and show them as `given`.

**Editor** — `<CodeEditor value onChange label given start firstLine indent minRows autoFocus placeholder
disabled>`: read-only `given` lines (highlighted, numbered), a numbered gutter and a borderless `textarea.input.code-input`
that reads as part of the file; `indent` (columns) is where typing starts; rows grow with the text, and the
textarea is as wide as its longest line, so a long line scrolls the whole file (given lines too) and the code stays
aligned under the given lines instead of scrolling inside the textarea. Keys: Tab = 4
spaces, Enter keeps the indent (and indents after `:`), Backspace in leading spaces removes a 4-space indent,
Escape then Tab leaves the editor (announced through `aria-describedby`), Ctrl/⌘ + Enter is left to the
`ActionBar`. Edits go through the browser's editing, so undo works. `children` render between the given lines and
the typing area (e.g. Rebuild's instruction comment); add one to `firstLine` per extra row.

**Touch key bar** — on coarse pointers only (phones, tablets: no Tab key), `CodeEditor` shows a row of keycaps
under the code: Outdent and Indent (act on the caret's line, or every selected line) and `: ( ) [ ] = _`. Keys are
44px tall and share the width like a keyboard row (all nine fit from 320px up), never take focus from the textarea
(the phone keyboard stays open), and have accessible names. `keyBar={false}` hides it.

**Diff** — `<CodeDiff grade indent given start firstLine>` renders the rows in the gutter style of an editor:
check (correct), minus (your line), plus (expected; no line number), and a sideways arrow on an amber row for wrong
indentation, with the expected line right below. Typed lines re-indent from `grade.baseGot` and expected lines from
`grade.baseExp` to the display `indent`, so everything lines up under the given code.

**Window and status bar** — `<TyperWindow status>` is a `CodeWindow` with the typing frame (focus ring while
typing, green or red border once checked). `<TyperFooter grade note keys>` is its footer: "Python · {note}" and the
desktop keyboard hint while typing, then "Compared line by line" and the summary ("4 of 6 lines correct · 1 extra
· 1 wrong indent") in a polite live region. Keep the footer mounted while typing so the result is announced.
`<CodeTyper>` combines all of it: the editor while `grade` is null, the diff once it is set.

## Page blueprints

- **Landing (`/welcome`)** — sticky translucent header (logo, anchor links, "Open app"/"Get started"); hero with
  eyebrow badge, `.display` headline, lead, two CTAs, and a product preview built from real UI pieces (a drill
  card, a code snippet, a streak/goal widget) — not an image; "How it works" in 3 steps; feature grid; the 18
  patterns as a curriculum grid; "Grounded in learning science" with 3–4 principles linking to `/science`; FAQ
  (`details.disclosure`); final CTA band; footer with disclaimer. No fake social proof.
- **Onboarding (`/onboarding`)** — centred, focused, step indicator; welcome + name → experience (radio cards with
  icons) → daily goal (radio cards) → plan summary → **"Start learning"**.
- **Dashboard (`/`)** — greeting + date; a "Continue learning" primary card; a "Today" panel (goal ring, streak,
  reviews due); KPI row (learned /150, strong, accuracy, level); activity heatmap; roadmap progress by unit; quick
  actions.
- **Learning path / Unit** — structured curriculum (vertical timeline/stepper), units with icon tiles, progress
  and status; problem rows with status, mastery and difficulty. Unit page: header, progress, CTAs, pattern summary,
  template, problems list.
- **Lessons & drills** — focus mode. Step label (eyebrow) → question title → content cards → action bar.
  Desktop may use two columns where it helps (e.g. code + explanation). Foundation lessons mix in "Your turn"
  slides (`kind: 'type'`): the task, a `<CodeTyper>` with the starter as `given`, then Check → the diff and the
  explanation; a miss offers "Try again" (keeps the text) and "Show answer" (the answer, then Continue; the slide
  comes back once at the end of the lesson).
- **Code from memory (`/p/:id/rebuild?mode=parts|scratch`)** — a `.seg` switch under the title: **Part by part**
  (one part at a time, cued by its comment) and **From scratch** (the whole body in one blank editor under the given
  signature; "Show outline" reveals the parts' cues as numbered comments and caps the XP). Without `?mode=` it opens
  From scratch once the part-by-part best is 80% or more. The first Check sets the score; "Fix and check again"
  re-grades without raising it. Switching mode after a Check asks first, since it restarts the attempt. A strong
  part-by-part run's next step is "Now write it from scratch". Entry points: the problem page (Code from memory,
  Write it from scratch) and the dashboard's review card (one learned problem to write from memory).
- **Template from memory (`/patterns/:cat/type`)** — the unit's guide template typed into a blank `CodeTyper`:
  "When to reach for it" cues (open on desktop, collapsed on phones), an optional first-word hint (halves the
  XP), then the diff. The first check sets the score; "Fix and check again" sits above the diff. Linked from
  the Pattern guide and Unit template headings (with the best score) and the pattern intro's completion. Pass
  `state={{ from }}` so Close and Back return to the page that opened it.
- **Library** — Problems as a dense, scannable table/list with toolbar filters; Pattern guide; Problem detail with
  main column + meta sidebar on desktop.
- **Profile** — identity header + level progress, stats grid, activity heatmap, achievements (icon medallions,
  locked state), streak-freeze shop, settings form, data management.

## Copy & tone

Sentence case everywhere ("Start review", not "START REVIEW"). Short, specific, encouraging, adult. Avoid
exclamation marks except on genuine celebrations ("Problem learned" is enough). No emoji. Name things
consistently: Dashboard, Learning path, Daily review, Pattern Blitz, Problem library, Pattern guide, Code from
memory, Learning science.

## Test contract (do not break)

Automated tests drive the UI through these hooks — keep them working:

- Classes: `.session`, `.session-body` (a `<main>`), `.complete`, `.choice` (+`.selected/.correct/.wrong`), `.actionbar`
  (+`.correct/.wrong`), `.actionbar .buttons > .btn:last-child` (primary action), `.parsons-slot`,
  `.parsons-bank .parsons-item`, `textarea.code-input`, `.session-body input.input` (typed key line),
  `.modal`, `[aria-label="Close"]`, `.blitz-start` (Blitz start button).
- Text: landing CTA **"Get started"**; onboarding option containing **"I know some code"**, goal option containing
  **"Regular"**, buttons **"Continue"** and final **"Start learning"**; insight drill buttons **"Show answer"**
  and **"Got it"**; completion titles containing **"Lesson complete"**, **"Problem learned"**,
  **"Review complete"**; repair button containing **"Repair"**.

## Working on a page

- Put page-specific CSS in `src/styles/pages/<page>.css` and import it at the top of the page file. Prefix
  classes with the page name (`.home-…`, `.learn-…`) to avoid collisions.
- Shared styles live only in `base.css`, `components.css` and `shell.css`; the v1 stylesheet has been removed.
- Do not edit shared files (`src/styles/{base,components,shell}.css`, `src/components/*`, `src/lib/*`,
  `src/content/*`, `App.tsx`, `main.tsx`) unless that file is assigned to you. If a shared change is needed,
  build it locally in your page and note it.
- Keep behaviour, routes, data flow and store calls exactly as they are — this is a visual redesign.
