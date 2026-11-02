# IntPrep design system

IntPrep should feel like a product made by a top-tier product company: think the restraint of **Linear**, the
clarity of **Stripe**'s dashboard, the density and honesty of **GitHub**, and the polish of **Apple** (Fitness
rings for goals). It is still a *learning game* — streaks, XP and celebrations stay — but they are expressed
with taste: precise, quiet, confident.

## Principles

1. **Calm by default, color with purpose.** Neutral surfaces; one brand color (indigo) for primary actions and
   selection; status colors only for status. Gamification accents (streak orange, gem cyan, XP amber) appear
   small, next to an icon and a label — never as big gradient slabs.
2. **Hierarchy through type and space, not decoration.** Inter, tight letter-spacing on headings, generous
   whitespace, 4px spacing grid. No ALL-CAPS buttons, no heavy drop shadows, no 3D "chunky" buttons.
3. **One icon language.** Lucide stroke icons only (`src/components/icons.tsx`). **No emoji anywhere in the UI.**
   Content files have legacy emoji `icon` fields — never render them; use `CATEGORY_ICON`, `LESSON_ICON`,
   `SCIENCE_ICON`, `ICONS`.
4. **Real data, honestly presented.** Numbers are tabular, labeled, and true. No fake testimonials, user counts,
   company logos or endorsements. Not affiliated with LeetCode, NeetCode or any employer — say so in the footer.
5. **Mobile is first-class.** Design at 390px wide first, then scale up. Touch targets ≥ 40px (on touch screens
   default `.btn` and `.input` grow to 40px, and `.btn-sm`, `.seg` buttons, `.toggle` and `.back-link` get an
   invisible 40px hit area automatically). Hover colors live inside `@media (hover: hover)` so a tap never leaves a
   sticky hover. Never cause horizontal page scroll (code blocks scroll inside themselves). Nothing may sit hidden
   behind a fixed bar: the tab bar and action bar set `scroll-padding-bottom`, and `.session-body` clears the
   action bar at its measured height.
6. **Both themes, always.** Use tokens only. Never hard-code a color except category colors passed as `--c`.
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
| Brand | `--brand`, `--brand-hover`, `--brand-text` (brand-colored text), `--brand-subtle` (tinted bg), `--brand-border`, plus `--brand-50…800` |
| Status | `--success/-text/-subtle/-border`, same for `warning`, `danger`, `info`. `--success`/`--danger` are icon and stroke colors |
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
| Code | `<CodeView>`, `<HighlightedCode>`; `.code` blocks are always dark. Colors on code surfaces use `--code-*` tokens (`--code-key`, `--code-success-*`, `--code-danger-*`, `--code-gutter`). Framed code (templates, solutions, editors, lesson examples, quiz snippets, the landing mock) uses `<CodeWindow filename lang meta right footer className>` from `interact.tsx` — one frame everywhere, never a page-local copy: file tab (`solution.py`, `${unit}.py`, `example.py`…), `meta` such as "12 lines", language label **"Python"** (never "Python 3"); `right` replaces meta + language (e.g. a step counter); `footer` is a one-line status bar; extra panes (e.g. program output) go in `children` below the code. `className` is for placement only (grid area, margins, elevation), never a different frame. The window is a `code-window` size container: below 340px it drops `meta`, then the file name truncates — the head never wraps. Keyboard focus on scrollable code draws the ring on the window, not the clipped `<pre>` |
| Typing code | The typing kit in `components/CodeTyper.tsx` (styles in `styles/typer.css`, grading in `lib/codegrade.ts`) whenever the learner writes code, from one line to a whole solution: `<CodeTyper>` (editor, then diff, in one typing window) or the pieces `<CodeEditor>`, `<CodeDiff>`, `<TyperFooter>`, `<TyperWindow>`. Never hand-build a code textarea or a diff. See **Typing kit** below |
| Sessions | `<SessionShell progress title right onClose progressColor progressLinear>` (`progress={null}` hides the bar; renders `<header class="session-head">` + `<main class="session-body">` and publishes the mounted `.actionbar`'s height as `--actionbar-h`), `<ActionBar>` (Enter runs the primary action, except while a modal dialog is open; re-arms on every state/label change, and on every `step` change for pages that keep one bar across slides or code parts, ignoring pointer input for 350ms, so a double-click cannot skip feedback or a step; when a check from the keyboard removes the focused input or editor, focus moves to the primary button; `primaryIcon` replaces the trailing arrow with a leading icon and `primaryClassName` adds a hook such as `.blitz-start`, so pages don't hand-build the bar; `secondary` sits left of Check, `checkedSecondary` left of Continue once checked: on every typing screen a miss puts its second step there with the kit's `<CheckedAction>`, "Fix and check again" (Code from memory, template drill) or "Show answer" (beginner slides), never a bar above the code or a button in the feedback text), `<Choices label>` (radiogroup name, default "Answer options"), `<OrderSteps>`, `<ProblemPrompt>`. Header, body and action bar share one 728px content column. A page's own fixed bar must use the `.actionbar` class so it is measured |
| Page chrome | `<PageHeader title sub right back eyebrow>`, `<SectionHeader title sub right id>`, `<EmptyState icon title actions level>` (title is an `h2.empty-title` by default; pass `level={3}` inside an h2 section) |
| End screens | `<Completion icon tone title subtitle stats>{actions}</Completion>` (stat values share a bottom line even when a label wraps on a narrow phone) |
| Misc | `<Kbd>`, `.tabs`, `details.disclosure` (the card clips, so the summary draws its focus ring inside: offset −2px, corners follow the card), `<Modal>` (traps Tab, restores focus on close to the control that opened it — recorded at first render, so a child's `autoFocus` doesn't count as the opener; `.modal-actions` wrap, and stack full width with the primary on top below 360px), toasts via `toast({ icon: 'flame', title, body, tone })` (phones and tablets show only the newest, with a +N count, docked below the top bar / session header so they never cover Close). Command palette (⌘K / Ctrl K): a modal combobox (Escape from anywhere, Tab trapped, focus restored, arrow keys move `aria-activedescendant`), one block per group; on touch screens keyboard hints hide and a Close button shows |
| App chrome | Desktop top bar: streak and gem `.pill-stat`s + avatar; the sidebar card owns the daily goal (no duplicate rings or streak pills). Status pills are `role="img"` with an `aria-label` |

## Typing kit (`components/CodeTyper.tsx`, `lib/codegrade.ts`)

Use it wherever the learner types code: Code from memory (part by part, filling the gaps, or the whole solution
from scratch), the template drill (filling the gaps, or from memory), and beginner "Your turn" slides of 1–5 lines.
For choosing between given lines, use `<Choices code>` instead; for a single key line, the key-line drill's input.

**The ladder** — Code from memory and the template drill offer the same rungs, most support first: Part by part
(Code from memory only) → Fill the gaps → From scratch / From memory. Without `?mode=` a page opens one rung above
what the learner has shown: the next rung once the best score on the one below is 80% or more (or they already
have a score on the top rung). A run of 80% or more makes the next rung the completion's primary action ("Next:
Fill the gaps", "Now write it from scratch", "Now type it from memory"); a weak From scratch or From memory run
steps back down ("Fill the gaps first"). Code from memory is optional practice: it counts as the spaced review
only for a problem that is due (`reviewProblem(id, grade, { lapse: false })`), so a weak run never resets the
schedule of a problem that is not.

**Grading** — `gradeCode(typed, expected, { anchor })` is pure. Blank and comment-only lines are ignored on both
sides; lines compare with `normalizeCode`: spacing around operators and punctuation, quote style, trailing comments,
trailing commas and the case of hex digits do not matter, but string contents do (`" "` is not `""`) and so does
the space between two words (`for n in`, not `forn in`). Typed and expected lines are aligned by a
longest-common-subsequence diff, so one extra or missing line does not mark every following line wrong. A matched
line is only correct if its indentation matches: without `anchor`, *relative to the snippet's base* (anchored on
the outermost matched line, so a whole solution or template may sit at any consistent depth); with `anchor` (the
editor's start column, when the editor sits under given lines the answer must line up with: a Part by part part,
a "Your turn" answer), typed column 0 is that column, so a line typed one level too deep is a wrong indent.
`baseIndent(lines)` is that column (the answer's least indented code line). It returns `rows` in diff
order (`ok`, `indent` = right code, wrong indentation, `del` = typed line not in the answer, `add` = expected line
not written; a changed line is a `del` + `add` pair with `paired: true`), plus `correct`, `total`, `extra`,
`wrong`, `missing`, `wrongIndent`, `perfect`, `score` (0–1, extra lines count against it), `baseGot`/`baseExp`.
`gradeBest(typed, answers, opts)` diffs against the closest of several accepted answers: the most lines whose code
matches whatever their indentation (`correct + wrongIndent`, so a body typed flush-left stays an indentation slip
on the answer it copies), then the higher score, then fewer extra lines, then the earliest. Pass clean code as `expected`
(e.g. chunk lines or `parseSolution(...).code`); `#!` key markers are dropped. Leave read-only lines (the class /
def header) out of `expected` and show them as `given`.

**Editor** — `<CodeEditor value onChange label given start firstLine indent minRows autoFocus placeholder
disabled>`: read-only `given` lines (highlighted, numbered), a numbered gutter and a borderless `textarea.input.code-input`
that reads as part of the file; `indent` (columns) is where typing starts; rows grow with the text, and the
textarea is as wide as its longest line, so a long line scrolls the whole file (given lines too) and the code stays
aligned under the given lines instead of scrolling inside the textarea. Keys: Tab = 4
spaces (with several lines selected, indents them all), Enter keeps the indent (and indents after `:`), Backspace in leading spaces removes a 4-space indent,
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

**Action bar** — the first check sets the score; later checks only show the result. After a miss, pass
`<CheckedAction onClick>` as the `ActionBar`'s `checkedSecondary`: "Fix and check again" by default ("Fix it" below
380px, the full label stays the accessible name), or `label="Show answer" short="Answer" icon={<Eye />}`. Keep
the `step` prop changing with each check (e.g. `` `${round}:${checks}` ``) so the double-click guard re-arms.

**Font size and iOS** — every code input (editor, gaps, typed key line) uses the 12.5–13px code size. iOS Safari
zooms the page when an input under 16px gets focus, so `main.tsx` adds `maximum-scale=1` to the viewport meta at
startup on iOS only (iPhone, iPad, and iPadOS's Mac user agent with touch). iOS still allows pinch zoom; Android
would honor it and lose pinch zoom, so it keeps the plain viewport. Do not enlarge code inputs to avoid zoom.

### Fill in the gaps (`components/CodeGaps.tsx`, `lib/gaps.ts`)

The middle rung between reading a worked example and writing it from scratch: the whole snippet is shown and the
learner types only the blanked lines. Use it once the learner has seen the code (a pattern template, a solution they
just studied); use `<CodeEditor>` / `<CodeTyper>` when they write a part or the whole thing from memory, and
`<Choices code>` when they pick a line.

**Picking gaps** — `pickGaps(lines, { keyLines, exclude, ratio = 0.3, min = 1, max = 12, seed = 0 })` returns sorted
line indices; pure and deterministic. About 30% of the code lines are blanked (rounded down, at least one: a 3-line
snippet gets 1). Never blanked: blank and comment lines, `pass` / `else:` / `try:` / `finally:` / `break` /
`continue` / a bare `return`, lone brackets, decorators, imports, `def` / `class` headers, docstrings, any line of a
multi-line statement, and `exclude` (the header the page keeps visible). Key lines go first, then the lines with the
most logic (conditions, loop headers, assignments that call or index, returns with an expression; an explaining
trailing comment counts too), spread apart. A line whose exact code stays visible elsewhere is avoided (the
answer would be on screen); repeated lines go blank together when the count allows, and a line with the same
code as a key line counts as one. `seed` is the round of practice: 0 is the canonical set; round n steps
away from round n − 1's lines and never repeats its set when another exists. `gapSource(src)` turns an annotated
solution or a plain template into `{ lines, keyLines, header }` (pass `header` as `exclude`).

**Editor** — `<CodeGaps lines gaps values onChange revealed onSubmit autoFocus disabled locked hints start keyBar
label ref>`: the visible lines read-only (highlighted, numbered, dimmed like `given`), each gap a single-line
`input.gaps-input` that starts at its line's indentation (the learner never types indentation) and fills the row.
Gap rows keep the 22px rhythm on desktop and grow to 44px on touch screens, with the text at the code's size (no
iOS zoom: see **Font size and iOS**). The
placeholder is the line's own trailing comment (`# stop when the pointers meet`); `hints` takes your own per gap or
`false`; a gap without one says "Type the missing line" if it is the first. A hint wider than its gap (phones,
narrow windows; measured) shows in full as a wrapping comment under the input instead (the placeholder cannot
scroll), and stays while typing so rows never change height. `locked` gaps (right at the last check)
show as correct and are skipped by the keyboard. `ref` exposes `focus(gap?)`. With `autoFocus`, the first gap is
focused on mount and for each new set; the first wrong gap is focused on every retry (call `retry` inside
`flushSync` in the click, and then `focus(gap)`, so a phone opens its keyboard).

**Keys** — Enter: next gap; on the last gap, the first gap still empty, else `onSubmit` (without it, Enter is
left to the `ActionBar`), so filling the known lines first never spends the scored first check on blanks. Shift+Enter
or Up: previous gap; Down: next gap (Up and Down keep the caret column). Tab and Shift+Tab move in order. Ctrl/⌘ +
Enter is left to the `ActionBar`. On touch screens a key bar in the kit's style offers `: ( ) [ ] = _` (no Indent /
Outdent: indentation is fixed), inserts at the caret of the focused gap without taking focus, and a tap anywhere on a
gap row focuses its input.

**Grading and result** — `gradeGaps(values, expectedLines)` returns `{ results: { got, exp, ok, empty }[], correct,
total, perfect, score }`, one gap to one line, compared with the kit's `lineKey` (whitespace, quote style, trailing
comments and commas do not matter). Once `revealed`, a right gap shows the typed line with the check; a wrong one
shows your line with the minus ("left blank" if empty) above the expected line with the plus, as in `CodeDiff`.
`<GapsFooter grade note keys>` is the status bar ("2 of 3 gaps correct" in a polite live region; keep it mounted).
`<GapsWindow>` is `TyperWindow` + `CodeGaps` + `GapsFooter`, like `<CodeTyper>`.

**State** — `useGaps(lines, { keyLines, exclude, ratio, min, max, round })` returns `{ gaps, values, setValues,
revealed, grade, filled, locked, round, check, retry, fresh }`: `check()` reveals, `retry()` ("Fix and check again")
keeps the text and locks the right gaps, `fresh()` ("New gaps") moves to the next round with empty gaps.

## Page blueprints

- **Landing (`/welcome`)** — sticky translucent header (logo, anchor links, "Open app"/"Get started"); hero with
  eyebrow badge, `.display` headline, lead, two CTAs, and a product preview built from real UI pieces (a drill
  card, a code snippet, a streak/goal widget) — not an image; "How it works" in 3 steps; feature grid; the 18
  patterns as a curriculum grid; "Grounded in learning science" with 3–4 principles linking to `/science`; FAQ
  (`details.disclosure`); final CTA band; footer with disclaimer. No fake social proof.
- **Onboarding (`/onboarding`)** — centered, focused, step indicator; welcome + name → experience (radio cards with
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
  explanation; a miss offers "Try again" (the primary: keeps the text) and, left of it in the action bar, "Show
  answer" (the answer, then Continue; the slide comes back once at the end of the lesson).
- **Pattern intro (`/unit/:cat/intro`)** — the guide as slides (`guideSlides()` in `LessonPlayer.tsx`): the
  pattern, the analogy, "When to reach for it", quiz 1, the template (its lede says the learner types its key lines
  in a moment), the template notes, then **"Your turn · Fill the gaps"**, then the other quizzes. That slide is
  "Fill in the template": a `GapsWindow` over the template with the template drill's first set of gaps
  (`gapSource`, about 30% of the lines, at least 2; each gap's hint is its line's comment). Check is always
  enabled, so a learner who cannot recall a line is never stuck (blank gaps show "left blank" and the line);
  Enter in a gap still moves to the next empty one and checks only on the last once every gap has text, and
  Ctrl/⌘ + Enter checks. The first check counts toward "First try" (quiz XP). A miss says "Not quite — it will
  come back later" as a missed quiz does, puts "Fix and check again" (`CheckedAction`) left of Continue, and
  brings the slide back once, empty, at the end ("Missed earlier"). The first visit's first check is the
  template's Fill the gaps score (`recordTemplate(cat, score, 'gaps')`, which only raises the best; a check with
  nothing typed is not recorded), so the template drill's ladder moves up. The completion shows "Gaps correct"
  in place of "Slides", keeps "Start the problems" primary, and its secondary follows this run: 80% or more
  reads "Type the template from memory" (`?mode=memory`; "Template from memory" below 360px, the full label
  staying the accessible name), else "Practice the template" (`?mode=gaps`).
- **Code from memory (`/p/:id/rebuild?mode=parts|gaps|scratch`)** — a three-option `.seg` switch under the title
  (full names with icons; names only below 460px; "Parts / Gaps / Scratch" below 380px, the full name staying the
  accessible name): **Part by part** (one part at a time, cued by its comment), **Fill the gaps** (the problem, the
  given class / def header and the solution with about 30% of its lines blank, key lines first, in a `GapsWindow`;
  Enter moves to the next gap and checks on the last once every gap has text; "New gaps" while idle) and **From
  scratch** (the whole body in one blank editor under the given signature; the sub names the solution's own names,
  since it is compared line by line with the solution the learner studied; "Show outline" reveals the parts' cues
  as numbered comments and caps the XP, also for a draft kept across a free switch). Part by part counts extra
  lines against the score, as the other modes do. Without `?mode=` it follows the ladder: From scratch once the fill-the-gaps best is 80% or more (or there
  is a scratch score), else Fill the gaps once the part-by-part best is 80% or more, else Part by part. The first
  Check sets the score; "Fix and check again" re-grades without raising it (in Fill the gaps it keeps the text and
  locks the right gaps). Switching mode after a Check asks first, since it restarts the attempt; after a switch,
  focus stays on the switch unless the new mode focuses its editor. Completion: the score, XP, the reference
  solution and the next step. Each mode keeps its own best (`rebuildBest`, `gapsBest`, `scratchBest`), shown on
  the problem page as one "Code from memory, best" list, and every mode counts as the review of a due problem. Entry points: the problem page (Code from memory, Write it from scratch) and the dashboard's review card
  (one learned problem to write from memory).
- **Template drill (`/patterns/:cat/type?mode=gaps|memory`)** — "Template practice" in the session header (as its
  entry points say), the unit's guide template, in two rungs under a `.seg` switch: **Fill the gaps**
  (`gapSource(template)`; each gap's hint is its line's comment) and **From memory** (a blank `CodeTyper` with an
  optional first-word hint that halves the XP: the Hint button says so before it is used, and the panel scrolls
  into view and is announced when it opens). "When to reach for it" cues sit above
  (open on desktop, collapsed on phones). Without `?mode=` it opens Fill the gaps until that best is 80% or more or
  the template has been typed from memory, then From memory. The first check sets the score; "Fix and check again"
  sits in the action bar. Completion: a strong gaps run leads to "Now type it from memory", a perfect from-memory
  run to "Next template", a weak one (under 80%) offers "Fill the gaps first". Entry points read "Practice the template", with the best score (from memory, else
  "Gaps N%"): the Pattern guide and Unit template headings, and the pattern intro's completion (primary "Start the
  problems", secondary "Practice the template", quiet "Back to dashboard"). Pass `state={{ from }}` so Close and
  Back return to the page that opened it.
- **Library** — Problems as a dense, scannable table/list with toolbar filters; Pattern guide; Problem detail with
  main column + meta sidebar on desktop.
- **Profile** — identity header + level progress, stats grid, activity heatmap, achievements (icon medallions,
  locked state), streak-freeze shop, settings form, data management.

## Copy & tone

Sentence case everywhere ("Start review", not "START REVIEW"). American English spelling everywhere, UI and
content alike (practice, color, behavior, neighbor, optimize, math). Short, specific, encouraging, adult. Avoid
exclamation marks except on genuine celebrations ("Problem learned" is enough). No emoji. Name things
consistently: Dashboard, Learning path, Daily review, Pattern Blitz, Problem library, Pattern guide, Code from
memory, Learning science.

## Test contract (do not break)

Automated tests drive the UI through these hooks — keep them working:

- Classes: `.session`, `.session-body` (a `<main>`), `.complete`, `.choice` (+`.selected/.correct/.wrong`), `.actionbar`
  (+`.correct/.wrong`), `.actionbar .buttons > .btn:last-child` (primary action), `.parsons-slot`,
  `.parsons-bank .parsons-item`, `textarea.code-input`, `input.gaps-input` (one per gap, `aria-label` "Line N,
  missing"), `.session-body input.input` (typed key line),
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
- Keep behavior, routes, data flow and store calls exactly as they are — this is a visual redesign.
