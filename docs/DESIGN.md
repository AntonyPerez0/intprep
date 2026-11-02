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
| Picking code | The pick kit whenever the learner chooses code rather than typing it (new code in "Pick first, then type", or "Always pick"): `<PickGapsWindow>` + `usePickGaps` (Pick the gaps, Pick the key line), `<ArrangeWindow>` + `useArrange` (Arrange a part), `<CodeOptions>` (one line from options), `<InputSwitch>` ("Type instead" / "Pick instead"); distractors from `lib/choices.ts`. Never `<Choices>` for code. See **Pick first, then type** |
| Sessions | `<SessionShell progress title right onClose progressColor progressLinear>` (`progress={null}` hides the bar; renders `<header class="session-head">` + `<main class="session-body">` and publishes the mounted `.actionbar`'s height as `--actionbar-h`), `<ActionBar>` (Enter runs the primary action, except while a modal dialog is open; re-arms on every state/label change, and on every `step` change for pages that keep one bar across slides or code parts, ignoring pointer input for 350ms, so a double-click cannot skip feedback or a step; when a check from the keyboard removes the focused input or editor, focus moves to the primary button; `primaryIcon` replaces the trailing arrow with a leading icon and `primaryClassName` adds a hook such as `.blitz-start`, so pages don't hand-build the bar; `secondary` sits left of Check, `checkedSecondary` left of Continue once checked: on every typing screen a miss puts its second step there with the kit's `<CheckedAction>`, "Fix and check again" (Code from memory, template drill) or "Show answer" (beginner slides), never a bar above the code or a button in the feedback text), `<Choices label>` (radiogroup name, default "Answer options"), `<OrderSteps>`, `<ProblemPrompt>`. Header, body and action bar share one 728px content column. A page's own fixed bar must use the `.actionbar` class so it is measured |
| Page chrome | `<PageHeader title sub right back eyebrow>`, `<SectionHeader title sub right id>`, `<EmptyState icon title actions level>` (title is an `h2.empty-title` by default; pass `level={3}` inside an h2 section) |
| End screens | `<Completion icon tone title subtitle stats>{actions}</Completion>` (stat values share a bottom line even when a label wraps on a narrow phone) |
| Misc | `<Kbd>`, `.tabs`, `details.disclosure` (the card clips, so the summary draws its focus ring inside: offset −2px, corners follow the card), `<Modal>` (traps Tab, restores focus on close to the control that opened it — recorded at first render, so a child's `autoFocus` doesn't count as the opener; `.modal-actions` wrap, and stack full width with the primary on top below 360px), toasts via `toast({ icon: 'flame', title, body, tone })` (phones and tablets show only the newest, with a +N count, docked below the top bar / session header so they never cover Close). Command palette (⌘K / Ctrl K): a modal combobox (Escape from anywhere, Tab trapped, focus restored, arrow keys move `aria-activedescendant`), one block per group; on touch screens keyboard hints hide and a Close button shows |
| App chrome | Desktop top bar: streak and gem `.pill-stat`s + avatar; the sidebar card owns the daily goal (no duplicate rings or streak pills). Status pills are `role="img"` with an `aria-label` |

## Typing kit (`components/CodeTyper.tsx`, `lib/codegrade.ts`)

Use it wherever the learner types code: Code from memory (part by part, filling the gaps, or the whole solution
from scratch), the template drill (filling the gaps, or from memory), beginner "Your turn" slides of 1–5 lines,
and Pattern Blitz's Key lines game (a one-gap `<CodeGaps>` in a `TyperWindow`).
For choosing between given lines of code, use the pick kit (**Pick first, then type**): `<CodeOptions>`,
`<PickGapsWindow>`, `<ArrangeWindow>`; `<Choices>` stays for non-code answers.

**The ladder** — Code from memory and the template drill offer the same rungs, most support first: Part by part
(Code from memory only) → Fill the gaps → From scratch / From memory; the template drill's first rung is Pick the
gaps (**Pick first, then type**). Without `?mode=` a page opens one rung above
what the learner has shown: the next rung once the best score on the one below is 80% or more (or they already
have a score on the top rung). A run of 80% or more makes the next rung the completion's primary action ("Next:
Fill the gaps", "Now write it from scratch", "Now type it from memory"); a weak From scratch or From memory run
steps back down ("Fill the gaps first"). Code from memory is optional practice: it counts as the spaced review
only for a problem that is due (`reviewProblem(id, grade, { lapse: false })`), so a weak run never resets the
schedule of a problem that is not.

**Grading** — `gradeCode(typed, expected, { anchor })` is pure. Blank and comment-only lines are ignored on both
sides; lines compare with `normalizeCode`: spacing around operators and punctuation, quote style (curly quotes from a
phone's smart punctuation, `‘a’` / `“a”`, count as straight ones: `straightQuotes`), trailing comments,
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
the typing area (e.g. Rebuild's instruction comment); add one to `firstLine` per extra row. `placeholder` may be
a list, longest first (`['Write the 3 lines for this part', 'Write 3 lines']`): the first that fits the empty
textarea from its `indent` shows, and none when even the last does not, since a placeholder cannot scroll (the
footer already says how many lines to write).

**Touch key bar** — on coarse pointers only (phones, tablets: no Tab key), `CodeEditor` shows a row of keycaps
under the code: Outdent and Indent (act on the caret's line, or every selected line) and `: ( ) [ ] = _`. Keys are
44px tall and share the width like a keyboard row (all nine fit from 320px up), never take focus from the textarea
(the phone keyboard stays open), and have accessible names. `keyBar={false}` hides it.

**Diff** — `<CodeDiff grade indent given start firstLine>` renders the rows in the gutter style of an editor:
check (correct), minus (your line), plus (expected; no line number), and a sideways arrow on an amber row for wrong
indentation, with the expected line right below. Typed lines re-indent from `grade.baseGot` and expected lines from
`grade.baseExp` to the display `indent`, so everything lines up under the given code. An anchored grade
(`grade.anchor`) draws typed lines from the editor's column and expected lines from their real column, so a line
typed a level off shows a level off.

**Window and status bar** — `<TyperWindow status>` is a `CodeWindow` with the typing frame (focus ring while
typing, green or red border once checked). `<TyperFooter grade note keys>` is its footer: "Python · {note}" and the
desktop keyboard hint while typing, then "Compared line by line" and the summary ("4 of 6 lines correct · 1 extra
· 1 wrong indent") in a polite live region. Keep the footer mounted while typing so the result is announced.
`<CodeTyper>` combines all of it: the editor while `grade` is null, the diff once it is set.

**Action bar** — the first check sets the score; later checks only show the result. After a miss, pass
`<CheckedAction onClick>` as the `ActionBar`'s `checkedSecondary`: "Fix and check again" by default ("Fix it" below
380px, the full label stays the accessible name), or `label="Show answer" short="Answer" icon={<Eye />}`. Keep
the `step` prop changing with each check (e.g. `` `${round}:${checks}` ``) so the double-click guard re-arms.
Every typing screen words it the same way: the first check's feedback says the first check sets the score (or
the tally); a right fix is titled **"All gaps right now"** (gaps), **"All lines right now"** (a part, a template,
a whole solution) or **"Right now"** (one line), and its body says the first check still counts. "Show answer"
always means "reveal it, counted as a miss"; "Peek" (guided lesson) goes back to the code without revealing a
diff. A miss that returns later says so: "It comes back later in this session" (reviews) or "Not quite — it will
come back later" (lessons).

**Phones** — no autofocus on coarse pointers: an editor or gap focuses on mount only with `(pointer: fine)`, so
the keyboard never covers the task on arrival; it opens when the learner taps the code, and "Fix and check again"
focuses inside the tap (`flushSync`).

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
`false`; a gap without one says "Type the missing line" if it is the first. Placeholders are measured against their
gap (phones, narrow windows, deep indents): a hint that does not fit shows in full as a wrapping comment under the
input instead (the placeholder cannot scroll), and stays while typing so rows never change height; the generic one
shortens to "Type the line", then goes (the input keeps its "Line N, missing" name). `locked` gaps (right at the last check)
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

### Review deck (`pages/Review.tsx`, `lib/drills.ts`, `components/Drills.tsx`)

Daily review, Practice ahead and Unit practice are code-first. Each problem brings three cards: **one
recognition card first** (Spot the pattern about 70% of the time, otherwise Recall the key insight, Name the
technique, Know the complexity or Put the steps in order), then **two coding cards** picked by the problem's
stage (`codeStage(srs)`) and input (`problemInput`; see **Pick first, then type** for the table): new code is
picked (Arrange a part + Pick the gaps), then a fill stage (interval under 10 days) gets Write the key line + Fill
the gaps, young (10 to 20 days) Fill the gaps + Write a part, mature (21 days or more) Write a part twice, two
different parts (or a part + Fill the gaps). Sessions hold up to 8 due problems, or 5 when practicing
ahead or by unit. Cards are interleaved across problems, and each problem still opens with its recognition card.
A missed card comes back once at the end of the session ("Try again" badge, half XP); a coding card comes back as
a fresh instance with the same input (`retryCard`: other gaps and options, another key line, another part). The problem's review grade is
`gradeFrom` over the first try of its three cards, coding cards counting like the others. Practice ahead and unit
practice are optional: a problem that was not due when the session started is reviewed with `{ lapse: false }`,
so a miss never resets its schedule. Session sizes live in `SESSION_PROBLEMS` (`lib/drills.ts`).

- **Fill the gaps** (`gaps`, `GapsDrill`): the whole solution in a `GapsWindow`, header given, 2 gaps (6 code
  lines or fewer) or 3, always a key line among them (`reviewGaps(p, seed)`; the seed moves with the problem's
  review count, so each session blanks other lines).
- **Fill the gaps**: a retry (seed `2r + 1`) never blanks the set of the card it retries, and a session (seed `2r`)
  never repeats the last session's set (`2r − 2`), whenever the solution has other lines to blank; a key line stays.
- **Write a part** (`part`, `PartDrill`): one part, split as the guided lesson splits it (`reviewParts` /
  `lessonParts`): class-level signatures that open it (a design problem's `def push(self, val: int) -> None:`) are
  given right under the cue, and only the body is written and graded. Parts whose body has a key line and 2 to 6
  lines come first (`pickPart`). The lines before it are given (only the last 8 when there are more than 10, with a
  "Show N earlier lines" fold row), its explanation is a highlighted `# comment` row (the cue), nothing after it is
  shown, and the `CodeEditor` starts at the body's own column (not capped), graded with `gradeCode(text, body,
  { anchor })`. The sub names what the part defines that is nowhere on screen ("Use the solution's names: need",
  `definedNames`), since it is compared line by line. Content rule (checked by `npm run validate`): a part's
  explanation mentions a closing `return` one level out, and a class-level `def` only ever opens a part.
- **Write the key line** (`keyline`): typed in its stage, never a line whose code also stands
  elsewhere in the solution (`pickKeyLine`); touch screens get the symbol keys (`SymbolKeys`) under the input.
  Beside Check: "Show answer" (a miss) and "Show options", a helper that turns the card into Pick the key line:
  a line picked from (or typed after seeing) the options counts as picked (`XP.pickCorrect`), not as code
  written. Phones show them as "Answer" and "Options", the narrowest as icons (the full name stays the accessible
  one). With the options showing, the kicker reads "Pick the key line" and "Type instead" goes back.

Every coding card says what to do in its title ("Fill the gaps in Two Sum", "Write the next part of Two Sum",
"Write the missing line of Two Sum"), keeps the problem statement in a collapsed disclosure, and shows the kit's
keyboard hint in the window footer. "Show answer" (left of Check, before the first check) reveals the answer as a
miss for a card the learner cannot recall; the checked action then reads "Type it now" (nothing typed to fix), as
in Key lines. The first check decides the card; after a miss, "Fix and check again"
is the `checkedSecondary` and Continue stays the primary. XP: `XP.codeCorrect` (8) for typed code right on the
first check, `XP.pickCorrect` (5) for picked code, `XP.drillCorrect` (4) for recognition, half for practicing
ahead and for retries, plus the combo bonus. The completion adds a "Lines written" stat (typed lines right on the
first check, out of the typed lines asked; picked cards do not count); its four stats sit two by two below 480px.
A typed coding card nearly right on the first check (3 lines in 4, or one line wrong in two or more) counts as
half right toward `gradeFrom`, so two typos make a problem "Fuzzy", not "Forgot"; picked cards have no partial
credit. Every card is
saved as it is answered (XP and streak, answers, each problem's schedule once its three cards are done), so a
close keeps the work; the reward toasts are held (`holdToasts`) and shown at the end or after the close, so none
covers a card. A problem pulled into today by a Pattern Blitz miss is reviewed as early (`review()` counts only
the days that passed), so a miss never pushes it further out than getting it right would.

Input (`lib/input.ts`): each problem's coding cards take the input `problemInput(settings.typingMode, progress)`
gives when the session starts (see **Pick first, then type**).

## Pick first, then type (`lib/input.ts`, `lib/choices.ts`, `lib/arrange.ts`, `components/CodeGaps.tsx`, `components/Arrange.tsx`, `components/InputSwitch.tsx`)

New code is picked from choices until the learner knows it; then typing takes over (faded guidance, Renkl &
Atkinson 2003; Parsons problems with paired distractors, Parsons & Haden 2006, Ericson, Margulieux & Rick 2017;
desirable difficulties only help when the learner can succeed, Bjork & Bjork 2011). Picking is real practice,
not a lesser mode: its first check is scored like a typed one, a miss comes back in the session, and it earns XP.

**The setting** — Profile, Practice, "Code practice" (`settings.typingMode`, values kept for old saves; an
unknown value loads as 'auto'): radio cards with icons, one line each.

| Value | Label | Meaning |
|---|---|---|
| `auto` (default) | **Pick first, then type** (Recommended) | New code is picked; typing takes over once it is known |
| `type` | **Always type** | Every exercise typed (old saves holding 'type' land here) |
| `tap` | **Always pick** | Every exercise picked, no "Type instead" |

Description: "New code starts as choices. Typing takes over once you know it." (`CODE_PRACTICE` in
`lib/input.ts` holds the labels.)

**When code is new** — `lib/input.ts`, pure:

- `type CodeInput = 'pick' | 'type'`.
- `PICK_UNTIL_REPS = 1`. `isNewCode(pp)`: not learned yet (the guided lesson), or `pp.srs.reps < PICK_UNTIL_REPS`.
  So the guided lesson and the first review are picked, typing starts at the second review, and a lapse (reps
  back to 0) goes back to picking until the next right review. One constant to tune.
- `problemInput(mode, pp?) → CodeInput`: 'tap' → pick, 'type' → type, 'auto' → pick while `isNewCode(pp)`.
- `TEMPLATE_READY = 0.8`. `isNewTemplate(t)`: no From memory try, and both `t.pickBest` and `t.gapsBest` under
  0.8. `templateInput(mode, t?) → CodeInput` likewise. The template ladder: Pick the gaps → Fill the gaps → From
  memory.
- `preferTyping(mode)` is deprecated (still true for 'auto') and stays only for screens not yet on the ladder.

**Stages and the review's coding cards** — `codeStage(card)` (`lib/drills.ts`): `new` (no card, or reps under
`PICK_UNTIL_REPS`), `fill` (interval under 10 days), `young` (10 to 20), `mature` (21+). `codingKinds(stage,
input, parts)`:

| Stage | Picked | Typed |
|---|---|---|
| new | Arrange a part + Pick the gaps | Write the key line + Fill the gaps |
| fill | Pick the key line + Pick the gaps | Write the key line + Fill the gaps |
| young | Pick the gaps + Arrange a part | Fill the gaps + Write a part |
| mature | Arrange a part twice (2+ parts), else + Pick the gaps | Write a part twice, else + Fill the gaps |

`cardsForProblem(p, { srs, round, input })` puts the input on every coding card (`DrillCardSpec.input`); a retry
keeps it (`retryCard`). In 'auto' only `new` is picked; 'tap' picks every stage; 'type' types every stage.

**The twins** — every typed exercise has a pick twin; `drillLabel(kind, input)` / `PICK_LABEL` name them:

| Typed | Picked | How |
|---|---|---|
| Write the key line | **Pick the key line** | the missing line from 4: the answer + 3 mutants (`keyLineDrill`) |
| Fill the gaps | **Pick the gaps** | each gap gets the answer + up to 3 wrong lines (`gapChoices`) |
| Write a part | **Arrange a part** | a code-line Parsons problem (`arrangeBlocks`); a one-line part is picked from options ("Pick the next line") |
| Foundations "Your turn" with authored wrong options | **Pick the right code** | `<CodeOptions>` |

Pick screens offer a quiet **"Type instead"** (`<InputSwitch to="type">`, 'auto' only, before the first check)
that turns the card into its typed twin; the card then counts as typed. A typed screen offers **"Pick instead"**
only where it already had an equivalent helper (Write the key line's "Show options", Code from memory's "Tap
lines"). Once a card is checked, its input is fixed. Kickers and titles say what to do: "Pick the gaps in Two
Sum" / "Pick the 2 missing lines from the options, then check."; "Put the next part of Two Sum in order" / "Put
this part's lines in order under the highlighted comment. One line does not belong."

**XP** — `XP.pickCorrect` (5) for picked code right on the first check, `XP.codeCorrect` (8) typed,
`XP.drillCorrect` (4) recognition; retries and practicing ahead half. "Lines written" counts typed lines only;
picked cards report `input: 'pick'` and no `lines` in `DrillResult`.

**Store** — `TemplateProgress.pickBest?` (optional, like `gapsBest`). `recordTemplate(cat, acc, mode: 'pick' |
'gaps' | 'memory')` only raises a best and returns true on a new best for that mode (`TemplateMode`).
`templateScore` reports the highest rung practiced: From memory, else gaps, else pick (`{ mode: TemplateMode, best }`;
the Unit and Pattern guide chips read "Best 90%", "Gaps 67%", "Picked 100%"). Template practice's pick rung earns
up to `XP.templatePickMax` (8), scaled by the first check, as Fill the gaps earns up to `XP.templateGapsMax` (12).

**Shared APIs**

- `lib/choices.ts` (re-exported from `lib/drills.ts` and `components/CodeGaps.tsx`), pure:
  `mutateLine(line)` (one token swapped: operators, bounds, pointers, methods, literals; an off-by-one; the
  operands of a comparison, a subtraction or a plain assignment swapped; a `not` dropped; `enumerate(x, 1)`; an
  index one off on a subscript only, never a list literal or a plain number; a hex literal is one token, so
  `0x7FFFFFFF` never becomes `1x7FFFFFFF`; never a name compared with or added to itself (`left < left`), the same
  name twice in a two-name target (`l, l = …`) or an assignment to a literal (`True = …`));
  `codeOnly(line)` (an option as shown: code at its indentation, no trailing comment);
  `lineChoices(answer, otherLines, n = 3, rnd = Math.random)` → up to `n` wrong lines, mutations first, then
  `otherLines` re-indented, deduplicated with the grader's `lineKey`, never equal to the answer;
  `gapChoices(lines, gaps, seed = 0, n = 3, extra = [])` → `{ answer, options }[]` per gap, deterministic per seed
  and content (a retry or reload shows the same options), fallback lines that are not on screen first (the other
  gaps' lines, `extra`); `lineOptions(answer, otherLines)` for a quick unseeded list.
- `lib/arrange.ts`, pure: `arrangeBlocks(lines, seed = 0, { keyLines, distractor })` → `{ blocks, expected, base }`:
  the part's code lines (comments dropped) as `ArrangeBlock`s `{ id ('b0'…, 'x'), text (relative indentation),
  indent, distractor, pair }`, shuffled per seed and content, never in the solution's order, plus one paired
  distractor (a mutation of a key line, else of the longest line, never equal to any line of the part) placed next
  to its pair when there are 2+ code lines. `gradeArrange(placed, expected)` → `{ grade (the kit's `Grade`, LCS
  diff: a line out of place marks only itself; equal lines are interchangeable), results (per position ok),
  correct, total, usedDistractor, missing, perfect, score = correct / (total + 1 if the distractor was placed) }`.
  `arrangeSummary(g)`: "3 of 5 lines in place · 1 not in the solution".
- **Pick the gaps** (`components/CodeGaps.tsx`): `usePickGaps(lines, { gaps?, keyLines, exclude, ratio, min, max,
  round, seed })` → `{ gaps, choices, values, active, setActive, pick, revealed, grade, filled, complete, locked,
  round, check, retry, fresh }` (the twin of `useGaps`; pass `gaps` to pin a set, e.g. `reviewGaps(p, seed).gaps`;
  the first slot opens on arrival; `pick` fills a gap and opens the next empty one; `retry` keeps the picks, locks
  the right ones and opens the first wrong one). `<PickGapsWindow lines gaps choices values active onActivate onPick
  revealed locked hints prompt start before label top after status filename meta right note keys ref>` (`ref`:
  `focus(gap?)`, `focusOptions()`; `before` = rows above `lines[0]` inside the code, `top` = above the code, e.g. a
  fold row). It looks exactly like `GapsWindow`: each gap is a slot (`button.pick-slot`, "Line N, pick a line",
  `aria-expanded`) at its line's indentation, as wide as the visible window; its hint is the line's trailing
  comment, else "Pick a line"; a pick or hint wider than the slot ends in an ellipsis. The open slot's options appear **inline right under it** (`<CodeOptions inline>`,
  sticky to the window's visible width, so they never scroll sideways with the code), labeled "Line 7 · Pick the
  missing line"; picking fills the slot and opens the next empty one; a filled slot reopens with its pick
  selected; Escape closes the options back to the slot. Check is enabled once every slot is filled (`complete`).
  Grading and the result rows are Fill the gaps' (`gradeGaps`, `GapsFooter` "2 of 3 gaps correct"). Focus follows
  a pick made inside the window to the next options, or to the primary action once every slot is filled; number
  keys leave focus where it is.
- `<CodeOptions options selected onPick label prompt groupLabel revealed answer keys inline onEscape id ref>`:
  code options on the code surface (always dark), syntax-highlighted, trimmed (the slot or window fixes the
  indentation), wrapping inside the panel on a phone, numbered: keys 1–N pick, Enter or Space picks the focused
  option (never Check), Up/Down move, Escape → `onEscape`. A `radiogroup` of `button.choice.pick-option`
  (`role="radio"`); "Press 1–4" on desktop. Standalone (not `inline`) it is a rounded panel to put under any
  code window; with `revealed` + `answer` the right option is marked correct and a wrong pick wrong.
- **Arrange** (`components/Arrange.tsx`): `useArrange(lines, { seed, keyLines, distractor })` → `{ set, blocks,
  placed, bank, place, remove, total, canCheck, revealed, result, check, retry }` (`canCheck`: as many lines placed
  as the solution has; `retry` keeps the order). `<ArrangeWindow blocks placed onPlace onRemove total revealed
  result indent before firstLine label top after status filename meta right note keys ref>` (`indent` = the
  part's base column in the file, `before` = the given rows above it (lines before, cue, signature), `ref`:
  `focus(placed?)`). "Your code" is the code pane: placed lines at their real indentation with line numbers
  (`.parsons-slot`; each `button.arrange-line`, "Remove line N: …", sends it back), then a dashed "Add the next
  line" row. The bank is a tray under the code (`.parsons-bank`, "Lines to place" with a count): each block a code
  button (`.parsons-item.arrange-item`, "Add line: …") at its relative indentation with indent guides, wrapping
  under its indentation on a phone. Tap, Enter or Space adds a block at the end (Enter never checks there;
  Ctrl/⌘ + Enter or Check does); focus follows to the next block (or the primary once the bank is empty); a polite
  live region says what was added or removed. After the check the placed lines read as the kit's diff: right
  lines with a check, a line out of place with a minus ("Out of place" for screen readers) and the right line
  with a plus where it belongs, the distractor with a "Not in the solution" note row; `ArrangeFooter` says "4 of 5
  lines in place · 1 not in the solution". "Fix and check again" keeps the order and focuses the first line that
  is off.
- `<InputSwitch to="type" | "pick" onClick label?>`: the quiet switch, Keyboard icon + "Type instead" or List icon
  + "Pick instead", for the ActionBar's `secondary` (left of Check). Same look everywhere.

**Look** — picking is code practice, not a quiz: slots, options and blocks are code on the code surface, in the
typing window's frame, rows and status bar; 44px targets on touch; nothing scrolls the page sideways.

**Guided lesson** (`pages/ProblemLesson.tsx`) — the input is decided once, when the lesson opens:
`problemInput(settings.typingMode, progress)`, so a problem not learned yet is picked in 'auto', a replay of a
known problem (a right review) types, 'type' always types and 'tap' always picks. Picked, the code step is
**"Build the code"** ("Build the solution one part at a time"): each part's Look offers **"Arrange it"** (an
`ArrangeWindow` over the part's body, `arrangeBlocks(body, 0, { keyLines })`, under the earlier code, the cue and
the given signature) or, for a part of one code line, **"Pick it"** (a one-slot `PickGapsWindow`, options from
`gapChoices` with later parts' lines as fallbacks). Check, then right → Continue; wrong → the diff, "Fix and
check again" (the order or the pick kept), Continue. Peek, the per-part segments and the tally ("Right on the first
try") work as when typed; the placed lines and the pick are kept per part through Peek and Back. The final check is
**"Pick the gaps"** (`usePickGaps` over the same gaps as Fill the gaps; Check once every gap is picked). "Type
instead" (`InputSwitch`, 'auto' only) sits beside Peek on a part not checked yet, and left of Check on the final
check before its first check; it types the rest of the lesson and the step names follow ("Write the code", "Fill
the gaps"). The completion's first stat reads "Parts built" (all picked), "Parts written" (all typed) or "Parts
right" (both). Lesson XP is unchanged (the problem's reward at the end; nothing per part). After "Fix and check
again" the part card says how to fix it ("Tap a line to send it back, then add the lines again in order."). Hook:
`.plesson[data-input]` (`pick` / `type`). Below 380px, with "Type instead" beside it, Peek shows its icon only (named
for screen readers), so "Type instead" keeps its words.

## Page blueprints

- **Landing (`/welcome`)** — sticky translucent header (logo, anchor links, "Open app"/"Get started"); hero with
  eyebrow badge, `.display` headline, lead, two CTAs, and a product preview built from real UI pieces (a coding
  review card, Fill the gaps with a gap being typed; a code snippet with key lines; a streak/goal widget) — not an
  image; a stats strip whose numbers come from the content (lines of Python written in the lessons uses
  `lessonParts`, the guided lesson's own part split); "How it works" in 3 steps; feature grid; the 18
  patterns as a curriculum grid; "Grounded in learning science" with 3–4 principles linking to `/science`; FAQ
  (`details.disclosure`); final CTA band; footer with disclaimer. No fake social proof.
- **Onboarding (`/onboarding`)** — centered, focused, step indicator; welcome + name → experience (radio cards with
  icons) → daily goal (radio cards) → plan summary → **"Start learning"**.
- **Dashboard (`/`)** — greeting + date; a "Continue learning" primary card (a beginner lesson shows its minutes
  and how many code exercises it has; a pattern intro reads "Read it, then fill in the template"); a "Today" panel
  (goal ring, streak, reviews due); the Daily review card says what a session is (spot the pattern, then write the
  code from memory); KPI row (learned /150, strong, "Practice accuracy" = first-try answers in reviews and Blitz,
  level); activity heatmap; roadmap progress by unit; quick actions ("Key lines" once 3 problems are learned,
  else "Pattern Blitz").
- **Learning path / Unit** — structured curriculum (vertical timeline/stepper), units with icon tiles, progress
  and status; problem rows with status, mastery and difficulty. Unit page: header, progress, CTAs, pattern summary,
  template, problems list.
- **Lessons & drills** — focus mode. Step label (eyebrow) → question title → content cards → action bar.
  Desktop may use two columns where it helps (e.g. code + explanation). Foundation lessons mix in "Your turn"
  slides (`kind: 'type'`): the task, a `<CodeTyper>` with the starter as `given`, then Check → the diff and the
  explanation; a miss offers "Try again" (the primary: keeps the text) and, left of it in the action bar, "Show
  answer" (the answer, then Continue; the slide comes back once at the end of the lesson). Before a check, the idle
  secondary is "Hint" while unused, then "Show answer" (right away on a slide with no hint), so a beginner who
  cannot start is never stuck; it counts as a miss the same way.
- **Guided problem lesson (`/p/:id/learn`)** — ten steps, "Step 7 of 10 · Write the code" in the eyebrow: read,
  guess (pattern choice), hints, brute force, insight, plan, **Write the code**, complexity (choice), traps, **Final
  check**. Write the code goes through every part of the solution except the class / def header (always given;
  so are class lines and class-level `def` signatures that open or close a part, as in design problems, while
  nested helpers such as `def dfs(r, c):` are typed):
  **Look** (the part's explanation in a card, its code highlighted under the earlier parts, key lines with a gold
  dot in the gutter, later parts hidden; primary "Write it" with Enter, "Back" to the part before), then **Write**
  (the part is covered: the earlier code stays as `given`, the editor starts at the part's indentation (not capped:
  the lines above a deep part are wider still, and the pane scrolls), and grading is anchored there; quiet "Peek" goes back to Look and the part no longer counts as written
  right), then **Check** (the diff; a miss puts "Fix and check again" left of "Next part", which is always there).
  The first check of a part decides the tally ("Right on the first try · 2 of 3 parts", and a colored segment per
  part). Look and Write share one typing window, so covering the code swaps rows in place. Wide screens: code left,
  a sticky card right (the cue while writing). Phones and tablets: the explanation is a comment row above the
  part in the file (unnumbered; the card keeps the part counter, segments, key-line note and tally, and its text
  stays for screen readers), and each move scrolls that row into view. Final check is Fill the gaps over the whole
  solution (`useGaps` + `GapsWindow`, about 30% of the body, with `min` raised so every key line, and any line
  with the same code, is a gap); with nothing typed the primary reads "Show answers", so nobody is stuck. The
  completion shows "Parts written" ("Parts built" when picked, "Parts right" when both), "Final check" (first check)
  and "XP earned", with the next review in the subtitle and "Code from memory" as the primary action. While the
  code is new, the code step is "Build the code" and the final check "Pick the gaps" (see **Pick first, then
  type**, Guided lesson).
- **Pattern intro (`/unit/:cat/intro`)** — the guide as slides (`guideSlides()` in `LessonPlayer.tsx`): the
  pattern, the analogy, "When to reach for it", quiz 1, the template (its lede says the learner types its key lines
  in a moment), the template notes, then **"Your turn · Fill the gaps"**, then the other quizzes. That slide is
  "Fill in the template": a `GapsWindow` over the template with the template drill's first set of gaps
  (`gapSource`, about 30% of the lines, at least 2; each gap's hint is its line's comment). Check is always
  enabled, so a learner who cannot recall a line is never stuck (blank gaps show "left blank" and the line), and
  with nothing typed it reads "Show answers", as the guided lesson's Final check does;
  Enter in a gap still moves to the next empty one and checks only on the last once every gap has text, and
  Ctrl/⌘ + Enter checks. The first check counts toward "First try" (quiz XP). A miss says "Not quite — it will
  come back later" as a missed quiz does, puts "Fix and check again" (`CheckedAction`) left of Continue, and
  brings the slide back once, empty, at the end ("Missed earlier"). The first visit's first check is the
  template's Fill the gaps score (`recordTemplate(cat, score, 'gaps')`, which only raises the best; a check with
  nothing typed is not recorded), so the template drill's ladder moves up. The completion shows "Gaps correct"
  in place of "Slides", keeps "Start the problems" primary, and its secondary follows this run: 80% or more
  reads "Type the template from memory" (`?mode=memory`; "Template from memory" below 360px, the full label
  staying the accessible name), else "Practice the template" (`?mode=gaps`).
  **Picked while the template is new** (`templateInput(settings.typingMode, templates[cat])`, decided once per run,
  so the comeback is the same exercise): the slide is **"Your turn · Pick the gaps"** (ListChecks icon), the same
  title and gaps in a `PickGapsWindow` (round 0, options seed 0), lede "Most of the Two Pointers template is here.
  Pick the 3 missing lines from the options." (comeback: "Once more: pick the 3 missing lines."), and the template
  slide's lede says "fill in" instead of "type". On a fine pointer the open slot's first option takes focus on
  arrival. Check is enabled once every slot is picked; a miss reads "Fix your picks now, or continue." and "Fix and
  check again" keeps the picks, locks the right ones and focuses the first wrong slot's options. Its first check is
  `recordTemplate(cat, score, 'pick')`, counts toward "First try" and comes back once if missed, like the typed
  slide. In 'auto' a quiet **"Type instead"** (`InputSwitch`) sits left of Check until the first check: it turns
  this visit into Fill the gaps (same gaps, the first gap focused inside the click), which then records 'gaps'. The
  completion's secondary goes one rung up after a strong pick (Fill the gaps, `?mode=gaps`; "Always pick" stays on
  `?mode=pick`) and stays on picking after a weak one (`?mode=pick`, ListChecks icon); a typed run is as above.
- **Code from memory (`/p/:id/rebuild?mode=parts|gaps|scratch`)** — a three-option `.seg` switch under the title
  (full names with icons; names only below 460px; "Parts / Gaps / Scratch" below 380px, the full name staying the
  accessible name). The title wraps (the difficulty chip moves under it), so the whole name always shows.
  **Part by part** (the guided lesson's parts, one at a time, cued by its comment, class-level signatures given; a
  miss offers "Fix and check again" and the part's first check keeps its score), **Fill the gaps** (the problem, the
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
- **Template drill (`/patterns/:cat/type?mode=pick|gaps|memory`)** — "Template practice" in the session header (as its
  entry points say), the unit's guide template, in three rungs under a `.seg` switch (full names with icons; names
  only below 460px; "Pick / Fill / Memory" below 380px, the full name staying the accessible name): **Pick the
  gaps** (the same gaps in a `PickGapsWindow`, "Pick each missing line from its options, then check."; Check once
  every slot is picked; up to `XP.templatePickMax`; records `pickBest`), **Fill the gaps**
  (`gapSource(template)`; each gap's hint is its line's comment) and **From memory** (a blank `CodeTyper` with an
  optional first-word hint that halves the XP: the Hint button says so before it is used, and the panel scrolls
  into view and is announced when it opens). "When to reach for it" cues sit above
  (open on desktop, collapsed on phones). Without `?mode=` it follows the ladder (`templateLadder` in
  `TemplateDrill.tsx`): Pick the gaps while `templateInput` says pick (in 'auto' until a pick or gaps best of 80%
  or more, or a From memory try; always in "Always pick"; never in "Always type"), then Fill the gaps until that
  best is 80% or more or the template has been typed from memory, then From memory. Pick and Fill the gaps open on
  round 0 (the pattern intro's own set) only while the template has no pick or gaps score; after the intro's
  slide they open on round 1, so the learner gets other lines. "New gaps" sits left of Check until the first
  check. The first check sets the score; "Fix and check again"
  sits in the action bar. Completion: a strong pick run leads to "Next: Fill the gaps" (not in "Always pick"), a
  strong gaps run to "Now type it from memory", a perfect from-memory run to "Next template"; a weak from-memory run
  (under 80%) offers "Fill the gaps first", and a weak gaps run offers "Pick the gaps first" while the ladder still
  counts the template as new. Every next step from a gaps round brings the next round's lines. Entry points read
  "Practice the template" (ListChecks icon while the drill would open on picking, else Keyboard), with the best
  score (from memory, else "Gaps N%", else "Picked N%"): the Pattern guide and Unit template headings, and the pattern intro's completion (primary "Start the
  problems", secondary "Practice the template", quiet "Back to dashboard"). Pass `state={{ from }}` so Close and
  Back return to the page that opened it.
- **Pattern Blitz (`/blitz?game=pattern|lines`)** — a lobby, then a round against the clock (Timed: 60 seconds
  for Spot the pattern, 90 for Key lines, since typing takes longer than tapping) or without one (Zen), then
  results. The lobby opens with the game choice, native radio cards (one per row, arrow
  keys move between them): **Spot the pattern** (read a problem, pick its pattern from four: recognition, keys
  1–4) and **Key lines** (type the key line of a learned solution: recall). The last choice is remembered
  (`settings.blitzGame`); `?game=` picks one for a deep link. Key lines opens at 3 learned problems; before that its
  card is a quiet dashed one with a lock, "Opens once you've learned 3 problems. N to go." and a link to the next
  lesson, and the pattern game is selected. Personal best and games played below the choice are the chosen game's
  (each game keeps its own timed best: `stats.blitzBest`, `stats.blitzCodeBest`; Zen rounds set no best). Both
  games share the HUD (score, streak, ×1–×4 multiplier, clock or Zen ring), 10 points × multiplier a hit, and send
  misses on learned problems to today's review (`flagForReview`).
  **Key lines round** (`lib/blitzLines.ts` picks the line, `<CodeGaps>` shows it): kicker "Type the missing line",
  "Round N" (Zen "Round N of 10"), the problem title (`h1`) with its difficulty, and a `TyperWindow` with a short
  window of the solution (up to 6 lines before, 3 after, trimmed of blank edges), the enclosing `def` / `class`
  lines above it with real line numbers and a fold row (`⋮ ⋯`) for the code left out, `class Solution:` dropped and
  the code dedented to save columns on a phone; the key line is one gap. Key lines that are part of a multi-line
  statement, or whose exact code is visible elsewhere in the window, are never asked. Due and weak problems come
  up more, a problem never comes twice in a row, and every key line has a turn before any comes back. Zen gives
  each gap the part's explanation as its hint; Timed keeps the cue to the code. Enter checks (Enter on an empty gap
  does nothing). A hit moves on inside the same key press (`flushSync`, then focus the new gap), so a phone keeps
  its keyboard open, and a strip under the window says "Correct +20" (polite live region, with the next problem's
  name for screen readers). A miss (or **Show answer**, the idle secondary, which counts as one) reveals the diff
  rows in the window and scrolls the right line into view above the action bar; the bar says what the part does
  ("This part"), Continue is the primary (focused; "See results" after the last Zen line) and "Fix and check
  again" ("Type it now" after Show answer) brings the gap back with the text kept: a right fix moves on with
  "Fixed" and no points. Results: Score, Accuracy, Best, XP earned, then "Lines to practice", one card per miss
  (problem, pattern and line number, your line and the right one as diff rows, and "Code from memory" for that
  problem). Actions on both games' results: Play again, Back to dashboard, Choose a game (back to the lobby).
- **Library** — Problems as a dense, scannable table/list with toolbar filters; Pattern guide; Problem detail with
  main column + meta sidebar on desktop.
- **Profile** — identity header + level progress, stats grid (eight cards, two rows of four from 600px: streaks,
  XP, learned, mastered, practice accuracy, "Pattern Blitz best", "Key lines best"), activity heatmap, achievements
  (icon medallions, locked state), streak-freeze shop, settings form, data management.

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
  `.modal`, `[aria-label="Close"]`, `.blitz-start` (Blitz start button), `input[name="blitz-game"]` (Blitz game
  radios, values `pattern` / `lines`), `.blitz-lines-title` (Key lines problem title), `.blitz-show` (Key lines
  Show answer), review cards `.drill[data-drill]` (kind: `pattern`, `gaps`, `part`, `keyline`…) with
  `data-problem` and `data-input` (`pick` / `type` on coding cards), the part card's `.drill-cue` and `.drill-fold`;
  pick twins: `button.pick-slot` ("Line N, pick a line"), `.pick-panel .choice` (the open slot's options),
  `.parsons-slot .arrange-line` ("Remove line N: …"), `.parsons-bank .parsons-item` ("Add line: …"), `.arrange-tag`,
  the switch's button **"Type instead"**; the guided lesson's `.plesson[data-input]` (`pick` / `type`); Template practice's mode radios `.tdrill-seg [role="radio"]` named
  **"Pick the gaps"**, **"Fill the gaps"**, **"From memory"** (`?mode=pick|gaps|memory`), and the template chips
  `.unit-type-best.is-pick` / `.patterns-best.is-pick` ("Picked N%").
- Text: landing CTA **"Get started"**; onboarding option containing **"I know some code"**, goal option containing
  **"Regular"**, buttons **"Continue"** and final **"Start learning"**; insight drill buttons **"Show answer"**
  and **"Got it"** (the review's Fill the gaps, Write a part and Write the key line cards also have a **"Show answer"** button,
  left of Check before the first check; on phones the key line's reads "Answer", its accessible name staying
  "Show answer"; after it, the checked action is **"Type it now"**); completion titles containing **"Lesson complete"**, **"Problem learned"**,
  **"Review complete"**, and its **"Lines written"** stat; repair button containing **"Repair"**.

## Working on a page

- Put page-specific CSS in `src/styles/pages/<page>.css` and import it at the top of the page file. Prefix
  classes with the page name (`.home-…`, `.learn-…`) to avoid collisions.
- Shared styles live only in `base.css`, `components.css` and `shell.css`; the v1 stylesheet has been removed.
- Do not edit shared files (`src/styles/{base,components,shell}.css`, `src/components/*`, `src/lib/*`,
  `src/content/*`, `App.tsx`, `main.tsx`) unless that file is assigned to you. If a shared change is needed,
  build it locally in your page and note it.
- Keep behavior, routes, data flow and store calls exactly as they are — this is a visual redesign.
