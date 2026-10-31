import '../styles/pages/landing.css';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  Check,
  CircleCheck,
  CodeXml,
  Flame,
  GraduationCap,
  Keyboard,
  Repeat2,
  Timer,
  X,
  Zap,
} from 'lucide-react';
import { CATEGORIES, CATEGORY_BY_ID, FOUNDATIONS, PROBLEM_BY_ID, PROBLEMS, problemsFor, type CategoryId } from '../content/index';
import { SCIENCE } from '../content/science';
import { CategoryIcon, IconTile, LESSON_ICON, SCIENCE_ICON, type LucideIcon } from '../components/icons';
import { DifficultyChip, Logo, LogoMark, ProgressBar, Ring } from '../components/ui';
import { DRILL_LABEL } from '../lib/drills';
import { XP } from '../lib/game';
import { highlightLine } from '../lib/highlight';
import { inline } from '../lib/markdown';
import { parseSolution } from '../lib/parseSolution';
import { useProgress } from '../lib/store';

// ── Page sections (the app uses a hash router, so anchors scroll via JS) ────

const SECTIONS = [
  { id: 'how', label: 'How it works' },
  { id: 'features', label: 'Features' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'science', label: 'Science' },
  { id: 'faq', label: 'FAQ' },
] as const;
type SectionId = (typeof SECTIONS)[number]['id'];

function goTo(id: SectionId) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  // Move keyboard focus to the section heading without a second jump.
  el.querySelector<HTMLElement>('[data-section-heading]')?.focus({ preventScroll: true });
}

const DRILL_TYPES = Object.keys(DRILL_LABEL).length;
const SCIENCE_PICKS = ['retrieval-practice', 'spaced-repetition', 'interleaving', 'worked-examples'];

// ── Page ────────────────────────────────────────────────────────────────────

export function Landing() {
  const { onboarded } = useProgress();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const h = () => setScrolled(window.scrollY > 8);
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const primary = onboarded ? { to: '/', label: 'Open app' } : { to: '/onboarding', label: 'Get started' };

  return (
    <div className="lp">
      <header className={`lp-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-container lp-header-inner">
          <Logo to="/welcome" />
          <nav className="lp-nav" aria-label="Page sections">
            {SECTIONS.map((s) => (
              <button key={s.id} type="button" onClick={() => goTo(s.id)}>
                {s.label}
              </button>
            ))}
          </nav>
          <div className="lp-header-cta">
            <Link to={primary.to} className="btn btn-primary btn-sm">
              {primary.label}
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        <Hero primary={primary} />
        <Stats />
        <HowItWorks />
        <Features />
        <Curriculum />
        <Science />
        <Faq />
        <FinalCta primary={primary} onboarded={onboarded} />
      </main>

      <Footer />
    </div>
  );
}

// ── Shared bits ─────────────────────────────────────────────────────────────

function SectionIntro({ kicker, title, lead, center }: { kicker: string; title: ReactNode; lead?: ReactNode; center?: boolean }) {
  return (
    <div className={`lp-intro ${center ? 'center' : ''}`}>
      <p className="lp-kicker">{kicker}</p>
      <h2 className="lp-h2" tabIndex={-1} data-section-heading>
        {title}
      </h2>
      {lead && <p className="lp-lead">{lead}</p>}
    </div>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────────

function Hero({ primary }: { primary: { to: string; label: string } }) {
  return (
    <section className="lp-hero" aria-labelledby="lp-hero-title">
      <div className="lp-hero-bg" aria-hidden="true" />
      <div className="lp-container">
        <div className="lp-hero-copy">
          <span className="lp-hero-badge">
            <span className="lp-hero-badge-dot" aria-hidden="true" />
            {PROBLEMS.length} problems · {CATEGORIES.length} patterns · Free
          </span>
          <h1 id="lp-hero-title" className="display lp-hero-title">
            Master the coding interview, <span className="lp-hero-title-soft">one pattern at a time.</span>
          </h1>
          <p className="lead lp-hero-lead">
            Learn the {PROBLEMS.length} classic interview problems step by step, then make every pattern stick with a few minutes of spaced review a
            day.
          </p>
          <div className="lp-hero-ctas">
            <Link to={primary.to} className="btn btn-primary btn-xl">
              {primary.label}
              <ArrowRight aria-hidden="true" />
            </Link>
            <button type="button" className="btn btn-secondary btn-xl" onClick={() => goTo('curriculum')}>
              Explore the curriculum
            </button>
          </div>
          <ul className="lp-hero-facts">
            <li>
              <Check aria-hidden="true" /> No account needed
            </li>
            <li>
              <Check aria-hidden="true" /> Solutions in Python
            </li>
            <li>
              <Check aria-hidden="true" /> Phone and desktop
            </li>
          </ul>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}

const TWO_SUM = PROBLEM_BY_ID['two-sum'];
const TWO_SUM_LINES = parseSolution(TWO_SUM.solution).lines;
const TWO_SUM_FOCUS = TWO_SUM_LINES.findIndex((l) => l.key);
// Real distractors the drill engine uses for Arrays & Hashing.
const PREVIEW_CHOICES: CategoryId[] = ['two-pointers', 'arrays-hashing', 'sliding-window', 'greedy'];
const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function HeroPreview() {
  return (
    <div
      className="lp-stage"
      role="img"
      aria-label="Preview of IntPrep: a Spot the pattern drill for Two Sum, the Python solution with its key lines marked, and a daily goal and streak tracker."
    >
      {/* Code window */}
      <div className="lp-pv lp-pv-code">
        <div className="lp-pv-code-head">
          <span className="lp-pv-tab">
            <CodeXml aria-hidden="true" />
            two_sum.py
          </span>
          <span className="lp-pv-legend">
            <span className="lp-pv-keydot" /> Key lines
          </span>
        </div>
        <pre className="code lp-pv-codeblock">
          {TWO_SUM_LINES.map((l, i) => (
            <div key={i} className={`code-line ${l.key ? 'key' : ''} ${i === TWO_SUM_FOCUS ? 'focus' : ''}`}>
              <span className="ln">{i + 1}</span>
              {l.text === '' ? ' ' : highlightLine(l.text)}
            </div>
          ))}
        </pre>
      </div>

      {/* Toast */}
      <div className="lp-pv lp-pv-toast">
        <IconTile icon={CircleCheck} color="var(--success)" size="sm" />
        <div className="grow">
          <div className="lp-pv-toast-title">Problem learned</div>
          <div className="lp-pv-toast-body">
            {TWO_SUM.title} · +{XP.problem[TWO_SUM.difficulty]} XP · Review tomorrow
          </div>
        </div>
      </div>

      {/* Spot the pattern drill */}
      <div className="lp-pv lp-pv-quiz">
        <div className="lp-pv-quiz-top">
          <X aria-hidden="true" />
          <ProgressBar value={0.42} thin />
          <span className="lp-pv-combo">
            <Flame aria-hidden="true" />3
          </span>
        </div>
        <div className="lp-pv-quiz-body">
          <div className="kicker">{DRILL_LABEL.pattern}</div>
          <div className="lp-pv-q">Which pattern fits this problem best?</div>
          <div className="lp-pv-prompt">
            <div className="lp-pv-prompt-head">
              <span className="fw-600">{TWO_SUM.title}</span>
              <span className="text-xs text-tertiary tabular">#{TWO_SUM.num}</span>
              <span className="grow" />
              <DifficultyChip d={TWO_SUM.difficulty} />
            </div>
            <p>{inline(TWO_SUM.prompt)}</p>
          </div>
          <div className="lp-pv-choices">
            {PREVIEW_CHOICES.map((c, i) => {
              const ok = c === TWO_SUM.category;
              return (
                <div key={c} className={`choice ${ok ? 'correct' : ''}`}>
                  <span className="num">{i + 1}</span>
                  <span className="grow">{CATEGORY_BY_ID[c].name}</span>
                  {ok && (
                    <span className="choice-mark">
                      <Check strokeWidth={2.4} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="lp-pv-feedback">
          <div className="lp-pv-feedback-title">
            <CircleCheck aria-hidden="true" /> Correct
          </div>
          <div className="lp-pv-feedback-body">
            <strong>{CATEGORY_BY_ID[TWO_SUM.category].name}</strong> · {TWO_SUM.pattern.toLowerCase()}
          </div>
        </div>
      </div>

      {/* Daily goal + streak */}
      <div className="lp-pv lp-pv-goal">
        <div className="lp-pv-goal-head">
          <Ring value={0.7} size={60} stroke={6}>
            <span className="lp-pv-ring-label">70%</span>
          </Ring>
          <div>
            <div className="lp-pv-goal-label">Daily goal</div>
            <div className="lp-pv-goal-value">
              35<span> / 50 XP</span>
            </div>
            <div className="lp-pv-goal-mini">
              <Flame aria-hidden="true" />
              12-day streak
            </div>
          </div>
        </div>
        <div className="lp-pv-goal-streak">
          <span className="lp-pv-flame">
            <Flame aria-hidden="true" />
          </span>
          <span>
            <strong>12-day</strong> streak
          </span>
        </div>
        <div className="lp-pv-week">
          {WEEK.map((d, i) => (
            <span key={i} className={`lp-pv-day ${i < 4 ? 'done' : i === 4 ? 'today' : ''}`}>
              <span className="lp-pv-day-mark">{i < 4 && <Check strokeWidth={3} aria-hidden="true" />}</span>
              {d}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Stats strip ─────────────────────────────────────────────────────────────

function Stats() {
  const items = [
    { value: PROBLEMS.length, label: 'Classic interview problems' },
    { value: CATEGORIES.length, label: 'Core patterns, in roadmap order' },
    { value: FOUNDATIONS.length, label: 'Beginner lessons to start from zero' },
    { value: DRILL_TYPES, label: 'Drill types in your daily review' },
  ];
  return (
    <section className="lp-stats" aria-label="IntPrep at a glance">
      <div className="lp-container">
        <dl className="lp-stats-grid">
          {items.map((s) => (
            <div key={s.label} className="lp-stat">
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

// ── How it works ────────────────────────────────────────────────────────────

const STEPS: { icon: LucideIcon; title: string; body: string; points: string[] }[] = [
  {
    icon: BookOpen,
    title: 'Learn the pattern',
    body: 'Every unit opens with a short guide: what the pattern is, when to reach for it, and a reusable Python template. A quick quiz checks it landed.',
    points: ['Recognition cues', 'Reusable template', 'Quick quiz'],
  },
  {
    icon: GraduationCap,
    title: 'Solve step by step',
    body: 'Guided lessons take each problem apart. Guess the pattern, use hints if you need them, find the key insight, then build the code one chunk at a time.',
    points: ['Progressive hints', 'Key insight', 'Code in chunks'],
  },
  {
    icon: Repeat2,
    title: 'Review on schedule',
    body: 'Learned problems come back just before you would forget them, mixed with other patterns, so you learn to tell them apart like you must in an interview.',
    points: ['Spaced repetition', `${DRILL_TYPES} drill types`, 'Mixed practice'],
  },
];

function HowItWorks() {
  return (
    <section id="how" className="lp-section">
      <div className="lp-container">
        <SectionIntro
          kicker="How it works"
          title="From first read to long-term memory"
          lead="Every problem follows the same three-step loop, so the pattern is still there on interview day."
        />
        <ol className="lp-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="lp-step">
              <div className="lp-step-rail" aria-hidden="true">
                <span className="lp-step-num">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="lp-step-card">
                <IconTile icon={s.icon} />
                <h3 className="lp-h3">{s.title}</h3>
                <p>{s.body}</p>
                <ul className="lp-step-points">
                  {s.points.map((pt) => (
                    <li key={pt}>
                      <Check aria-hidden="true" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── Features ────────────────────────────────────────────────────────────────

// "Code from memory" walks the non-header chunks; show the cue for the first key line.
const TWO_SUM_BODY = parseSolution(TWO_SUM.solution).chunks.filter((c) => !c.header);
const KEY_CHUNK = TWO_SUM_BODY.findIndex((c) => c.keyLines.length > 0);
const KEY_CUE = TWO_SUM_BODY[KEY_CHUNK]?.explain ?? '';

function FeatureVisual({ kind }: { kind: string }) {
  switch (kind) {
    case 'lessons':
      return (
        <ul className="lp-fv-steps">
          {[
            ['done', 'Spot the pattern'],
            ['done', 'Find the key insight'],
            ['current', 'Build the code, chunk by chunk'],
            ['todo', 'Check the complexity'],
          ].map(([state, label]) => (
            <li key={label} className={state}>
              <span className="lp-fv-steps-mark">{state === 'done' && <Check strokeWidth={3} aria-hidden="true" />}</span>
              {label}
            </li>
          ))}
        </ul>
      );
    case 'review':
      // Intervals for a card on its third review (SM-2, ease 2.5): real scheduler output.
      return (
        <div className="lp-fv-review">
          <div className="lp-fv-review-q">
            How well did you recall <strong>{TWO_SUM.title}</strong>?
          </div>
          <div className="lp-fv-grades">
          {[
            ['Again', '1d'],
            ['Hard', '5d'],
            ['Good', '10d'],
            ['Easy', '14d'],
          ].map(([g, d]) => (
            <span key={g} className={`lp-fv-grade ${g === 'Good' ? 'on' : ''}`}>
              <span className="lp-fv-grade-label">{g}</span>
              <span className="lp-fv-grade-days">{d}</span>
            </span>
          ))}
          </div>
        </div>
      );
    case 'rebuild':
      return (
        <div className="lp-fv-rebuild">
          <div className="lp-fv-cue-line">
            <span className="lp-fv-cue-step">
              Chunk {KEY_CHUNK + 1}/{TWO_SUM_BODY.length}
            </span>
            <span className="truncate">{KEY_CUE}</span>
          </div>
          <pre className="code lp-fv-code">
            <div className="code-line">
              <span className="ln">4</span>
              {highlightLine('for i, x in enumerate(nums):')}
            </div>
            <div className="code-line">
              <span className="ln">5</span>
              {'    '}
              <span className="blank">type the next line</span>
            </div>
          </pre>
        </div>
      );
    case 'blitz':
      return (
        <div className="lp-fv-blitz">
          <div className="lp-fv-blitz-top">
            <span className="lp-fv-blitz-time">
              <Timer aria-hidden="true" />
              0:42
            </span>
            <span className="lp-fv-blitz-combo">
              <Flame aria-hidden="true" />4× combo
            </span>
          </div>
          <ProgressBar value={0.7} />
          <div className="lp-fv-blitz-q">
            <span className="text-tertiary">Which pattern?</span> Koko Eating Bananas
          </div>
        </div>
      );
    case 'guide':
      return (
        <ul className="lp-fv-cues">
          {(
            [
              ['“longest substring”', 'sliding-window'],
              ['“sorted array”', 'binary-search'],
              ['“matching brackets”', 'stack'],
            ] as [string, CategoryId][]
          ).map(([cue, cat]) => (
            <li key={cat}>
              <span className="lp-fv-cue">{cue}</span>
              <ArrowRight className="lp-fv-cue-arrow" aria-hidden="true" />
              <span className="lp-fv-cue-cat">
                <CategoryIcon id={cat} color={CATEGORY_BY_ID[cat].color} size="sm" />
                {CATEGORY_BY_ID[cat].name}
              </span>
            </li>
          ))}
        </ul>
      );
    case 'progress':
      return (
        <div className="lp-fv-progress">
          <div className="lp-fv-progress-head">
            <span className="lp-pv-flame">
              <Flame aria-hidden="true" />
            </span>
            <div>
              <div className="fw-600 text-md">12-day streak</div>
              <div className="text-xs text-tertiary">Longest: 19 days</div>
            </div>
          </div>
          <div className="lp-pv-week">
            {WEEK.map((d, i) => (
              <span key={i} className={`lp-pv-day ${i < 5 ? 'done' : i === 5 ? 'today' : ''}`}>
                <span className="lp-pv-day-mark">{i < 5 && <Check strokeWidth={3} aria-hidden="true" />}</span>
                {d}
              </span>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

const FEATURES: { kind: string; icon: LucideIcon; title: string; body: string }[] = [
  {
    kind: 'lessons',
    icon: BookOpen,
    title: 'Guided lessons',
    body: `All ${PROBLEMS.length} problems taught step by step, from reading the prompt to writing the solution and checking its complexity.`,
  },
  {
    kind: 'review',
    icon: Repeat2,
    title: 'Spaced review',
    body: 'An SM-2 style scheduler brings each problem back at the right moment. Grade your recall and the gaps grow.',
  },
  {
    kind: 'rebuild',
    icon: Keyboard,
    title: 'Code from memory',
    body: 'Rebuild whole solutions from plain-English cues. Type them on desktop, or tap the right next line on your phone.',
  },
  {
    kind: 'blitz',
    icon: Zap,
    title: 'Pattern Blitz',
    body: 'Sixty seconds of rapid-fire “which pattern is this?” with combo multipliers, or an untimed Zen mode.',
  },
  {
    kind: 'guide',
    icon: BookMarked,
    title: 'Pattern guide',
    body: `A searchable cheat sheet of recognition cues and templates for all ${CATEGORIES.length} patterns.`,
  },
  {
    kind: 'progress',
    icon: Flame,
    title: 'Progress and streaks',
    body: 'XP, levels, a daily goal, streak freezes and achievements make showing up every day feel good.',
  },
];

function Features() {
  return (
    <section id="features" className="lp-section lp-section-tint">
      <div className="lp-container">
        <SectionIntro
          kicker="Features"
          title="Built to make practice stick"
          lead="Short sessions, real recall and a little friendly pressure. Everything runs in your browser."
        />
        <div className="lp-features">
          {FEATURES.map((f) => (
            <article key={f.kind} className="lp-feature">
              <div className="lp-feature-visual" aria-hidden="true">
                <FeatureVisual kind={f.kind} />
              </div>
              <div className="lp-feature-body">
                <h3 className="lp-h3">
                  <f.icon aria-hidden="true" />
                  {f.title}
                </h3>
                <p>{f.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Curriculum ──────────────────────────────────────────────────────────────

function difficultyMix(cat: CategoryId) {
  const ps = problemsFor(cat);
  const n = (d: string) => ps.filter((p) => p.difficulty === d).length;
  return { total: ps.length, easy: n('Easy'), medium: n('Medium'), hard: n('Hard') };
}

function Curriculum() {
  const foundationMinutes = FOUNDATIONS.reduce((n, l) => n + l.minutes, 0);
  const hours = Math.max(1, Math.round(foundationMinutes / 60));
  return (
    <section id="curriculum" className="lp-section">
      <div className="lp-container">
        <SectionIntro
          kicker="Curriculum"
          title={
            <>
              <span className="lp-nowrap-group">
                {CATEGORIES.length} patterns. {PROBLEMS.length} problems.
              </span>{' '}
              <span className="lp-nowrap-group lp-h2-soft">One roadmap.</span>
            </>
          }
          lead={`The classic interview roadmap in teaching order, from ${CATEGORIES[0].name} to ${CATEGORY_BY_ID['dp-2d'].name}. Every unit opens with a pattern guide.`}
        />

        <div className="lp-foundations">
          <IconTile icon={GraduationCap} size="lg" />
          <div className="grow">
            <div className="lp-foundations-title">
              New to coding? Start with the foundations.
              <span className="badge badge-brand badge-pill">
                {FOUNDATIONS.length} lessons · about {hours} {hours === 1 ? 'hour' : 'hours'}
              </span>
            </div>
            <p>Python basics, loops, lists and dicts, Big-O, recursion and a problem-solving framework, before your first pattern.</p>
          </div>
          <ul className="lp-foundations-list" aria-label="Some of the beginner lessons">
            {FOUNDATIONS.slice(1, 4).map((l) => {
              const I = LESSON_ICON[l.id] ?? BookOpen;
              return (
                <li key={l.id}>
                  <I aria-hidden="true" />
                  <span className="truncate">{l.title}</span>
                  <span className="lp-foundations-min">{l.minutes} min</span>
                </li>
              );
            })}
          </ul>
        </div>

        <ol className="lp-units">
          {CATEGORIES.map((c, i) => {
            const mix = difficultyMix(c.id);
            return (
              <li key={c.id} className="lp-unit">
                <CategoryIcon id={c.id} color={c.color} />
                <div className="lp-unit-text">
                  <div className="lp-unit-name">
                    <span className="truncate">{c.name}</span>
                    <span className="lp-unit-idx">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="lp-unit-tagline">{c.tagline}</div>
                  <div className="lp-unit-meta">
                  <span className="lp-unit-count">
                    {mix.total} <span>problems</span>
                  </span>
                  <span
                    className="lp-mix"
                    role="img"
                    aria-label={`${mix.easy} easy, ${mix.medium} medium, ${mix.hard} hard`}
                    title={`${mix.easy} easy · ${mix.medium} medium · ${mix.hard} hard`}
                  >
                    <span className="e" style={{ flexGrow: mix.easy }} />
                    <span className="m" style={{ flexGrow: mix.medium }} />
                    <span className="h" style={{ flexGrow: mix.hard }} />
                  </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="lp-units-foot">
          <span className="lp-legend">
            <span className="lp-legend-item">
              <span className="sw e" /> Easy
            </span>
            <span className="lp-legend-item">
              <span className="sw m" /> Medium
            </span>
            <span className="lp-legend-item">
              <span className="sw h" /> Hard
            </span>
          </span>
          <Link to="/problems" className="lp-arrow-link">
            Browse all {PROBLEMS.length} problems <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Learning science ────────────────────────────────────────────────────────

function Science() {
  const picks = SCIENCE_PICKS.map((id) => SCIENCE.find((s) => s.id === id)).filter((s) => s !== undefined);
  return (
    <section id="science" className="lp-section lp-section-tint">
      <div className="lp-container lp-split">
        <div className="lp-split-aside">
          <SectionIntro
            kicker="Learning science"
            title="Grounded in learning science"
            lead="Every mechanic in IntPrep maps to published research on how people learn and remember, not to what merely feels productive."
          />
          <Link to="/science" className="btn btn-secondary btn-lg lp-split-cta">
            How IntPrep uses the research
            <ArrowRight aria-hidden="true" />
          </Link>
          <p className="lp-fineprint">
            {SCIENCE.length} principles, each with its source, on the learning science page.
          </p>
        </div>
        <div className="lp-science">
          {picks.map((s) => (
            <article key={s.id} className="lp-principle">
              <IconTile icon={SCIENCE_ICON[s.id] ?? BookOpen} />
              <h3 className="lp-h3">{s.title}</h3>
              <p>{s.howWeUseIt}</p>
              <p className="lp-principle-source">{s.source}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ─────────────────────────────────────────────────────────────────────

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: 'Is IntPrep free?',
    a: 'Yes. Every lesson, drill and game is free to use. There is no paid tier and nothing to unlock.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. Your progress is saved in this browser on this device. You can export it to a file from your profile and import it on another device.',
  },
  {
    q: 'Which programming language does it use?',
    a: `Python. Every solution is clear, runnable Python 3, the most common choice in coding interviews. If you are new to Python, the ${FOUNDATIONS.length} beginner lessons cover what you need.`,
  },
  {
    q: 'Is IntPrep affiliated with LeetCode or NeetCode?',
    a: 'No. IntPrep is an independent learning project. It follows the widely used 150-problem roadmap and links to each problem on LeetCode, but it is not affiliated with, endorsed by or sponsored by LeetCode, NeetCode or any employer.',
  },
  {
    q: 'How long does it take?',
    a: `You choose a daily goal, from about 5 to 30 or more minutes a day. Learning one new problem a day, you would cover all ${PROBLEMS.length} in about five months, with short reviews keeping earlier problems fresh.`,
  },
  {
    q: 'Does it work on my phone?',
    a: 'Yes. IntPrep is designed for phones first and works in any modern browser. You can add it to your home screen, and drills that need code switch to tapping instead of typing.',
  },
];

function Faq() {
  return (
    <section id="faq" className="lp-section">
      <div className="lp-container lp-split">
        <div className="lp-split-aside">
          <SectionIntro kicker="FAQ" title="Questions, answered" lead="Everything you might want to know before you start." />
        </div>
        <div className="lp-faq">
          {FAQ.map((f, i) => (
            <details key={f.q} className="disclosure" open={i === 0}>
              <summary>{f.q}</summary>
              <div className="disclosure-body">{f.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final call to action ────────────────────────────────────────────────────

function FinalCta({ primary, onboarded }: { primary: { to: string; label: string }; onboarded: boolean }) {
  return (
    <section className="lp-section lp-cta-section" aria-labelledby="lp-cta-title">
      <div className="lp-container">
        <div className="lp-cta">
          <div className="lp-cta-bg" aria-hidden="true" />
          <LogoMark size={44} />
          <h2 id="lp-cta-title" className="lp-h2">
            {onboarded ? 'Pick up where you left off' : 'Start with one pattern today'}
          </h2>
          <p className="lp-lead">
            {onboarded
              ? 'Your progress is saved on this device. Your reviews and next lesson are waiting.'
              : 'Free, no account, and your progress stays on your device. Pick a daily goal and IntPrep plans the rest.'}
          </p>
          <div className="lp-hero-ctas">
            <Link to={primary.to} className="btn btn-primary btn-xl">
              {onboarded ? primary.label : 'Create your plan'}
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link to="/science" className="btn btn-secondary btn-xl">
              Read the science
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────────────────────

const FOOTER_COLS: { title: string; links: { to: string; label: string }[] }[] = [
  {
    title: 'Learn',
    links: [
      { to: '/learn', label: 'Learning path' },
      { to: '/problems', label: 'Problem library' },
      { to: '/patterns', label: 'Pattern guide' },
    ],
  },
  {
    title: 'Practice',
    links: [
      { to: '/review', label: 'Daily review' },
      { to: '/blitz', label: 'Pattern Blitz' },
    ],
  },
  {
    title: 'About',
    links: [
      { to: '/science', label: 'Learning science' },
      { to: '/profile', label: 'Profile and settings' },
    ],
  },
];

function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-container">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <Logo to="/welcome" />
            <p>Learn the {PROBLEMS.length} classic coding-interview problems, one pattern at a time.</p>
          </div>
          <nav className="lp-footer-cols" aria-label="Footer">
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <h3>{col.title}</h3>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="lp-footer-bottom">
          <p className="lp-disclaimer">
            IntPrep is an independent study tool. It is not affiliated with, endorsed by or sponsored by LeetCode, NeetCode or any employer.
            Problem names are used for identification only and belong to their respective owners.
          </p>
          <p className="lp-copyright">© {new Date().getFullYear()} IntPrep</p>
        </div>
      </div>
    </footer>
  );
}
