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
5. **Mobile is first-class.** Design at 390px wide first, then scale up. Touch targets ≥ 40px. Never cause
   horizontal page scroll (code blocks scroll inside themselves).
6. **Both themes, always.** Use tokens only. Never hard-code a colour except category colours passed as `--c`.
   Check every screen in light *and* dark.
7. **Accessible.** WCAG AA contrast, visible `:focus-visible`, `aria-label` on icon-only buttons, semantic headings
   (one `h1` per page), `prefers-reduced-motion` respected.

## Tokens (`src/styles/base.css`)

| Purpose | Tokens |
|---|---|
| Surfaces | `--canvas` (app bg), `--surface` (cards), `--surface-raised` (popovers), `--surface-sunken` (wells, tracks), `--surface-hover`, `--surface-active` |
| Borders | `--border` (default hairline), `--border-strong` (inputs, buttons), `--border-subtle` (row dividers) |
| Text | `--text`, `--text-secondary`, `--text-tertiary`, `--text-disabled` |
| Brand | `--brand`, `--brand-hover`, `--brand-text` (brand-coloured text), `--brand-subtle` (tinted bg), `--brand-border`, plus `--brand-50…800` |
| Status | `--success/-text/-subtle/-border`, same for `warning`, `danger`, `info` |
| Game accents | `--streak(-subtle)`, `--gem(-subtle)`, `--xp(-subtle)` |
| Radius | `--r-xs 4` `--r-sm 6` `--r-md 8` `--r-lg 12` `--r-xl 16` `--r-full` |
| Elevation | `--shadow-xs` (cards), `--shadow-sm`, `--shadow-md` (hover), `--shadow-lg` (toasts), `--shadow-xl` (modals), `--ring` (focus) |
| Type | `--font-sans` (Inter), `--font-mono` (JetBrains Mono); sizes `--fs-xs 12` `sm 13` `md 14` `base 15` `lg 17` `xl 20` `2xl 24` `3xl 30` `4xl 38` `5xl 52` |
| Motion | `--ease`, `--dur-fast 120ms`, `--dur 180ms`, `--dur-slow 320ms` |
| Layout | `--content-max 1120px`, `--prose-max 720px` |

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
| Progress | `<ProgressBar value>`, `<Ring value size>`, `<Mastery n>` (signal-strength meter, exported as `Crowns` too) |
| Forms | `.input`, `.input-group` (leading icon), `.label`, `.help`, `.seg` segmented control, `<Toggle>` switch |
| Lists | `.list` + `.list-row` (`.title`, `.meta`, `.chevron`), `.status-dot(.learned/.due)` |
| Callouts | `.callout` + `.callout-info/-warning/-brand/-success` (first child: a 16px Lucide icon) |
| Key insight | `.insight-card` with `.insight-label` and `.mnemonic` |
| Code | `<CodeView>`, `<HighlightedCode>`; `.code` blocks are always dark |
| Sessions | `<SessionShell progress title right onClose>`, `<ActionBar>`, `<Choices>`, `<OrderSteps>`, `<ProblemPrompt>` |
| Page chrome | `<PageHeader title sub right back eyebrow>`, `<SectionHeader title sub right>`, `<EmptyState icon title actions>` |
| End screens | `<Completion icon tone title subtitle stats>{actions}</Completion>` |
| Misc | `<Kbd>`, `.tabs`, `details.disclosure`, `<Modal>`, toasts via `toast({ icon: 'flame', title, body, tone })` |

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
  Desktop may use two columns where it helps (e.g. code + explanation).
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

- Classes: `.session`, `.session-body`, `.complete`, `.choice` (+`.selected/.correct/.wrong`), `.actionbar`
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
- Do **not** use classes from `src/styles/legacy.css` — it is deleted after the redesign.
- Do not edit shared files (`src/styles/{base,components,shell}.css`, `src/components/*`, `src/lib/*`,
  `src/content/*`, `App.tsx`, `main.tsx`) unless that file is assigned to you. If a shared change is needed,
  build it locally in your page and note it.
- Keep behaviour, routes, data flow and store calls exactly as they are — this is a visual redesign.
