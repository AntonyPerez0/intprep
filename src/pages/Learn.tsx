import '../styles/pages/learn.css';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, BookOpen, Check, ChevronDown, ChevronRight, GraduationCap, Lock, Play, RotateCcw, Trophy } from 'lucide-react';import { CATEGORIES, CATEGORY_BY_ID } from '../content/categories';
import { FOUNDATIONS, guideFor, problemsFor } from '../content/index';
import { foundationsDone, nextStep, unitProgress, unitUnlocked, type NextStep } from '../lib/path';
import { crowns, isDue } from '../lib/srs';
import { dueProblemIds, useProgress } from '../lib/store';
import { PageHeader } from '../components/Shell';
import { CategoryIcon, IconTile, LESSON_ICON, type LucideIcon } from '../components/icons';
import { DifficultyChip, Mastery, ProgressBar, Ring } from '../components/ui';

// ── Model ───────────────────────────────────────────────────────────────────

type UnitStatus = 'complete' | 'progress' | 'open' | 'locked' | 'optional';

interface UnitSummary {
  /** DOM id and hash target: 'foundations' or the category id. */
  id: string;
  /** 0 for Foundations, 1…18 for the pattern units. */
  n: number;
  name: string;
  learned: number;
  total: number;
  pct: number;
  status: UnitStatus;
  /** The recommended next step lives in this unit. */
  current: boolean;
  due: number;
}

const FOUNDATIONS_ID = 'foundations';
const FOUNDATIONS_COLOR = 'var(--text-secondary)';

function listJoin(xs: string[]) {
  if (xs.length <= 1) return xs.join('');
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}

/**
 * Scrolls a section under the sticky header. In-page jumps glide; the glide is
 * driven here (not by the browser) so it can be canceled when the page
 * unmounts or the user takes over — a native smooth scroll in flight survives
 * the shell's scroll-to-top and leaves the next page part-scrolled. Reduced
 * motion always jumps.
 */
function useSectionScroll() {
  const frame = useRef(0);
  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
  }, []);
  useEffect(() => {
    const events = ['wheel', 'touchstart', 'keydown'] as const;
    events.forEach((e) => window.addEventListener(e, stop, { passive: true }));
    return () => {
      stop();
      events.forEach((e) => window.removeEventListener(e, stop));
    };
  }, [stop]);
  return useCallback(
    (id: string, smooth: boolean) => {
      const el = document.getElementById(id);
      if (!el) return;
      stop();
      const root = document.documentElement;
      const offset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
      const to = Math.max(0, Math.min(el.getBoundingClientRect().top + window.scrollY - offset, root.scrollHeight - window.innerHeight));
      const from = window.scrollY;
      if (!smooth || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || Math.abs(to - from) < 2) {
        window.scrollTo(0, to);
        return;
      }
      const duration = Math.min(600, Math.max(240, Math.abs(to - from) / 5));
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - t) ** 3; // ease-out: moves at once, settles gently
        window.scrollTo(0, from + (to - from) * eased);
        frame.current = t < 1 ? requestAnimationFrame(step) : 0;
      };
      frame.current = requestAnimationFrame(step);
    },
    [stop],
  );
}

function nextUnitId(next: NextStep): string | null {
  if (next.kind === 'foundation') return FOUNDATIONS_ID;
  if (next.kind === 'guide') return next.category;
  if (next.kind === 'problem') return next.problem.category;
  return null;
}

// ── Small pieces ────────────────────────────────────────────────────────────

type DotState = 'done' | 'due' | 'next' | 'todo';

function StatusDot({ state, children }: { state: DotState; children?: ReactNode }) {
  if (state === 'done')
    return (
      <span className="status-dot learned" aria-hidden="true">
        <Check strokeWidth={2.5} />
      </span>
    );
  if (state === 'due')
    return (
      <span className="status-dot due" aria-hidden="true">
        <RotateCcw strokeWidth={2.25} />
      </span>
    );
  if (state === 'next')
    return (
      <span className="status-dot learn-dot-next" aria-hidden="true">
        <Play strokeWidth={2.25} />
      </span>
    );
  return (
    <span className="status-dot learn-dot-todo" aria-hidden="true">
      {children}
    </span>
  );
}

const DOT_LABEL: Record<DotState, string> = {
  done: 'Completed',
  due: 'Review due',
  next: 'Up next',
  todo: 'Not started',
};

function LessonRow({
  to,
  state,
  marker,
  title,
  sub,
  mastery,
  end,
}: {
  to: string;
  state: DotState;
  marker?: ReactNode;
  title: string;
  sub?: string;
  mastery?: number;
  end: ReactNode;
}) {
  const isNext = state === 'next';
  return (
    <li>
      <Link to={to} className={`learn-row${isNext ? ' is-next' : ''}`} aria-current={isNext ? 'step' : undefined}>
        <StatusDot state={state}>{marker}</StatusDot>
        <span className="sr-only">{DOT_LABEL[state]}: </span>
        <span className="learn-row-main">
          <span className="learn-row-title">{title}</span>
          {sub && <span className="learn-row-sub">{sub}</span>}
        </span>
        {/* Announced by the status prefix above; the badge hides on narrow phones. */}
        {isNext && (
          <span className="badge badge-brand learn-row-flag" aria-hidden="true">
            Up next
          </span>
        )}
        {mastery !== undefined && (
          <span className="learn-row-mastery">
            <Mastery n={mastery} />
          </span>
        )}
        <span className="learn-row-end">{end}</span>
        <ChevronRight className="learn-row-chevron" size={16} aria-hidden="true" />
      </Link>
    </li>
  );
}

function StatusBadge({ s }: { s: UnitSummary }) {
  if (s.status === 'complete')
    return (
      <span className="badge badge-success">
        <Check strokeWidth={2.5} />
        Complete
      </span>
    );
  if (s.status === 'progress') return <span className="badge badge-brand">In progress</span>;
  if (s.current) return <span className="badge badge-brand">Up next</span>;
  if (s.status === 'locked')
    return (
      <span className="badge learn-badge-later">
        <Lock strokeWidth={2} />
        Recommended later
      </span>
    );
  if (s.status === 'optional') return <span className="badge">Optional</span>;
  return <span className="badge">Not started</span>;
}

function RailMarker({ s }: { s: UnitSummary }) {
  if (s.status === 'complete')
    return (
      <span className="learn-marker is-complete" aria-hidden="true">
        <Check strokeWidth={2.75} />
      </span>
    );
  if (s.current)
    return (
      <span className="learn-marker is-current" aria-hidden="true">
        {s.n}
      </span>
    );
  if (s.status === 'progress')
    return (
      <span className="learn-marker is-progress" aria-hidden="true">
        <Ring value={s.pct} size={28} stroke={2.5} color="var(--brand)" track="var(--border)">
          {s.n}
        </Ring>
      </span>
    );
  if (s.status === 'locked')
    return (
      <span className="learn-marker is-locked" aria-hidden="true">
        <Lock strokeWidth={2} />
      </span>
    );
  return (
    <span className="learn-marker" aria-hidden="true">
      {s.n}
    </span>
  );
}

function IndexMarker({ s }: { s: UnitSummary }) {
  if (s.status === 'complete')
    return (
      <span className="learn-index-mark is-complete" aria-hidden="true">
        <Check strokeWidth={3} />
      </span>
    );
  if (s.current) return <span className="learn-index-mark is-current" aria-hidden="true" />;
  if (s.status === 'progress')
    return (
      <span className="learn-index-mark" aria-hidden="true">
        <Ring value={s.pct} size={14} stroke={2} color="var(--brand)" track="var(--border-strong)" />
      </span>
    );
  if (s.status === 'locked')
    return (
      <span className="learn-index-mark is-locked" aria-hidden="true">
        <Lock strokeWidth={2.25} />
      </span>
    );
  return <span className="learn-index-mark is-open" aria-hidden="true" />;
}

// ── Recommended next ────────────────────────────────────────────────────────

function NextUp({ next }: { next: NextStep }) {
  let tile: ReactNode;
  let context: string;
  let title: string;
  let detail: ReactNode = null;
  let cta: string;

  if (next.kind === 'foundation') {
    const i = FOUNDATIONS.findIndex((l) => l.id === next.lessonId);
    const l = FOUNDATIONS[i];
    tile = <IconTile icon={LESSON_ICON[next.lessonId] ?? GraduationCap} color={FOUNDATIONS_COLOR} size="lg" />;
    context = `Foundations · Lesson ${i + 1} of ${FOUNDATIONS.length}`;
    title = next.title;
    detail = l ? <span className="text-tertiary">{l.blurb}</span> : null;
    cta = 'Start lesson';
  } else if (next.kind === 'guide') {
    const c = CATEGORY_BY_ID[next.category];
    const n = CATEGORIES.indexOf(c) + 1;
    tile = <CategoryIcon id={c.id} color={c.color} size="lg" />;
    context = `Unit ${n} · ${c.name}`;
    title = 'Pattern intro';
    detail = <span className="text-tertiary">{c.tagline}</span>;
    cta = 'Start pattern intro';
  } else if (next.kind === 'problem') {
    const q = next.problem;
    const c = CATEGORY_BY_ID[q.category];
    const n = CATEGORIES.indexOf(c) + 1;
    const ids = c.problemIds;
    tile = <CategoryIcon id={c.id} color={c.color} size="lg" />;
    context = `Unit ${n} · ${c.name}`;
    title = q.title;
    detail = (
      <span className="learn-next-meta">
        <DifficultyChip d={q.difficulty} />
        <span className="text-tertiary tabular">
          Problem {ids.indexOf(q.id) + 1} of {ids.length}
        </span>
      </span>
    );
    cta = 'Start problem';
  } else {
    tile = <IconTile icon={Trophy} color="var(--xp)" size="lg" />;
    context = 'Learning path complete';
    title = 'Every problem learned';
    detail = <span className="text-tertiary">Keep them sharp with a few minutes of daily review.</span>;
    cta = 'Open daily review';
  }

  return (
    <div className="learn-next">
      <h3 className="learn-next-label">Recommended next</h3>
      <div className="learn-next-body">
        {tile}
        <div className="grow">
          <div className="learn-next-context">{context}</div>
          <div className="learn-next-title">{title}</div>
          {detail && <div className="learn-next-detail">{detail}</div>}
        </div>
      </div>
      <Link to={next.href} className="btn btn-primary learn-next-cta">
        {cta}
        <ArrowRight />
      </Link>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export function Learn() {
  const p = useProgress();
  const next = nextStep(p);
  const loc = useLocation();
  const fDone = foundationsDone(p);
  const currentId = nextUnitId(next);

  const units = useMemo<UnitSummary[]>(() => {
    const due = new Set(dueProblemIds(p));
    const out: UnitSummary[] = [];
    if (FOUNDATIONS.length > 0) {
      const total = FOUNDATIONS.length;
      out.push({
        id: FOUNDATIONS_ID,
        n: 0,
        name: 'Foundations',
        learned: fDone,
        total,
        pct: fDone / total,
        status: fDone === total ? 'complete' : fDone > 0 ? 'progress' : currentId === FOUNDATIONS_ID ? 'open' : 'optional',
        current: currentId === FOUNDATIONS_ID,
        due: 0,
      });
    }
    CATEGORIES.forEach((c, ci) => {
      const u = unitProgress(p, c.id);
      const started = u.learned > 0 || !!p.lessonsDone[`g:${c.id}`];
      const complete = u.total > 0 && u.learned === u.total;
      out.push({
        id: c.id,
        n: ci + 1,
        name: c.name,
        learned: u.learned,
        total: u.total,
        pct: u.pct,
        status: complete ? 'complete' : started ? 'progress' : unitUnlocked(p, c) ? 'open' : 'locked',
        current: currentId === c.id,
        due: c.problemIds.filter((id) => due.has(id) && p.problems[id]?.learnedAt).length,
      });
    });
    return out;
  }, [p, fDone, currentId]);
  const byId = useMemo(() => Object.fromEntries(units.map((u) => [u.id, u])), [units]);

  // Which unit cards show their lessons. Active units start open; the rest are one click away.
  const [open, setOpen] = useState<Set<string>>(() => {
    const s = new Set(units.filter((u) => u.current || u.status === 'progress').map((u) => u.id));
    if (loc.hash) s.add(decodeURIComponent(loc.hash.slice(1)));
    return s;
  });
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allOpen = units.every((u) => open.has(u.id));

  // Deep links: /learn#foundations, /learn#<unitId>. Deferred one frame so the
  // shell's scroll-to-top on navigation does not cancel it.
  // Arriving from another page jumps straight there; in-page changes glide.
  const [mountedAt] = useState(() => Date.now());
  const scrollToSection = useSectionScroll();
  useEffect(() => {
    if (!loc.hash) return;
    const id = decodeURIComponent(loc.hash.slice(1));
    setOpen((s) => (s.has(id) ? s : new Set(s).add(id)));
    const smooth = Date.now() - mountedAt >= 600;
    const raf = requestAnimationFrame(() => scrollToSection(id, smooth));
    return () => cancelAnimationFrame(raf);
  }, [loc.hash, mountedAt, scrollToSection]);

  // Scroll-spy for the unit index on wide screens.
  const [active, setActive] = useState<string>(units[0]?.id ?? '');
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      let cur = units[0]?.id ?? '';
      for (const u of units) {
        const el = document.getElementById(u.id);
        if (el && el.getBoundingClientRect().top <= 140) cur = u.id;
      }
      setActive(cur);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [units]);

  const totalProblems = units.filter((u) => u.id !== FOUNDATIONS_ID).reduce((a, u) => a + u.total, 0);
  const learnedProblems = units.filter((u) => u.id !== FOUNDATIONS_ID).reduce((a, u) => a + u.learned, 0);
  const unitsComplete = units.filter((u) => u.id !== FOUNDATIONS_ID && u.status === 'complete').length;
  const guidesDone = CATEGORIES.filter((c) => p.lessonsDone[`g:${c.id}`]).length;
  const current = currentId ? byId[currentId] : null;
  const currentCat = currentId && currentId !== FOUNDATIONS_ID ? CATEGORY_BY_ID[currentId as keyof typeof CATEGORY_BY_ID] : null;

  const jump = (id: string) => (e: MouseEvent) => {
    // Same hash twice does not change the location, so scroll directly.
    if (loc.hash === `#${id}`) {
      e.preventDefault();
      scrollToSection(id, true);
    }
  };

  const steps: ReactNode[] = [];

  // Foundations
  if (FOUNDATIONS.length > 0) {
    const s = byId[FOUNDATIONS_ID];
    const lessons = FOUNDATIONS.map((l) => {
      const done = !!p.lessonsDone[`f:${l.id}`];
      const isNext = next.kind === 'foundation' && next.lessonId === l.id;
      const Icon: LucideIcon = LESSON_ICON[l.id] ?? GraduationCap;
      return (
        <LessonRow
          key={l.id}
          to={`/foundations/${l.id}`}
          state={done ? 'done' : isNext ? 'next' : 'todo'}
          marker={<Icon strokeWidth={2} />}
          title={l.title}
          sub={l.blurb}
          end={<span className="learn-row-minutes tabular">{l.minutes} min</span>}
        />
      );
    });
    steps.push(
      <UnitStep
        key={FOUNDATIONS_ID}
        s={s}
        prevComplete={false}
        isFirst
        isLast={false}
        icon={<IconTile icon={GraduationCap} color={FOUNDATIONS_COLOR} />}
        kicker="Unit 0"
        title="Foundations"
        tagline="New to coding? Start here. Python, Big-O, recursion and how to attack a problem, writing code in every lesson."
        summary={`${FOUNDATIONS.length} lessons`}
        open={open.has(FOUNDATIONS_ID)}
        onToggle={() => toggle(FOUNDATIONS_ID)}
      >
        {lessons}
      </UnitStep>,
    );
  }

  CATEGORIES.forEach((c, ci) => {
    const s = byId[c.id];
    const problems = problemsFor(c.id);
    const guide = guideFor(c.id);
    const guideDone = !!p.lessonsDone[`g:${c.id}`];
    const prev = units[units.indexOf(s) - 1];
    const lockNote =
      s.status === 'locked'
        ? `Recommended after ${listJoin(c.prereqs.map((x) => CATEGORY_BY_ID[x].name))}. You can still jump in.`
        : undefined;
    steps.push(
      <UnitStep
        key={c.id}
        s={s}
        prevComplete={prev?.status === 'complete'}
        isFirst={!prev}
        isLast={ci === CATEGORIES.length - 1}
        to={`/unit/${c.id}`}
        icon={<CategoryIcon id={c.id} color={c.color} />}
        color={c.color}
        kicker={`Unit ${ci + 1}`}
        title={c.name}
        tagline={c.tagline}
        note={lockNote}
        summary={
          problems.length ? (
            <>
              {guide && <span className="learn-unit-summary-intro">Pattern intro · </span>}
              {problems.length} problems
            </>
          ) : (
            'Coming soon'
          )
        }
        open={open.has(c.id)}
        onToggle={() => toggle(c.id)}
      >
        {problems.length === 0 ? (
          <li className="learn-row-empty">Lessons for this unit are on their way.</li>
        ) : (
          <>
            {guide && (
              <LessonRow
                to={`/unit/${c.id}/intro`}
                state={guideDone ? 'done' : next.kind === 'guide' && next.category === c.id ? 'next' : 'todo'}
                marker={<BookOpen strokeWidth={2} />}
                title="Pattern intro"
                sub="The idea, when to use it, then fill in the template"
                end={<span className="chip">Intro</span>}
              />
            )}
            {problems.map((q, i) => {
              const pp = p.problems[q.id];
              const learned = !!pp?.learnedAt;
              const due = learned && !!pp?.srs && isDue(pp.srs);
              const isNext = next.kind === 'problem' && next.problem.id === q.id;
              return (
                <LessonRow
                  key={q.id}
                  to={learned ? `/p/${q.id}` : `/p/${q.id}/learn`}
                  state={due ? 'due' : learned ? 'done' : isNext ? 'next' : 'todo'}
                  marker={i + 1}
                  title={q.title}
                  mastery={learned ? crowns(pp?.srs) : undefined}
                  end={<DifficultyChip d={q.difficulty} />}
                />
              );
            })}
          </>
        )}
      </UnitStep>,
    );
  });

  return (
    <div className="learn">
      <PageHeader
        title="Learning path"
        sub={`${totalProblems} problems across ${CATEGORIES.length} patterns, ordered so each one builds on the last. Follow it top to bottom or jump to any unit.`}
      />

      <div className="learn-overview-wrap">
        <section className="card pad-0 learn-overview" aria-labelledby="learn-overview-title">
          <div className="learn-progress">
            <h2 id="learn-overview-title" className="learn-progress-label">
              Overall progress
            </h2>
            <div className="learn-progress-figure">
              <span className="learn-progress-value tabular">{learnedProblems}</span>
              <span className="learn-progress-of tabular">/ {totalProblems} problems learned</span>
              <span className="learn-progress-pct tabular">{Math.round((learnedProblems / Math.max(1, totalProblems)) * 100)}%</span>
            </div>
            <ProgressBar
              value={learnedProblems / Math.max(1, totalProblems)}
              large
              color={learnedProblems === totalProblems ? 'var(--success)' : undefined}
              label="Problems learned"
            />
            <dl className="learn-kpis">
              <div className="learn-kpi learn-kpi-current">
                <dt>Current unit</dt>
                <dd>
                  {current ? (
                    <Link to={`/learn#${current.id}`} onClick={jump(current.id)} className="learn-kpi-link">
                      {currentCat ? (
                        <CategoryIcon id={currentCat.id} color={currentCat.color} size="sm" />
                      ) : (
                        <IconTile icon={GraduationCap} color={FOUNDATIONS_COLOR} size="sm" />
                      )}
                      <span className="truncate">{current.name}</span>
                    </Link>
                  ) : (
                    <span className="learn-kpi-done">All units complete</span>
                  )}
                </dd>
              </div>
              <div className="learn-kpi">
                <dt>Units complete</dt>
                <dd className="tabular">
                  {unitsComplete}
                  <span className="learn-kpi-of">/ {CATEGORIES.length}</span>
                </dd>
              </div>
              <div className="learn-kpi">
                <dt>Pattern intros</dt>
                <dd className="tabular">
                  {guidesDone}
                  <span className="learn-kpi-of">/ {CATEGORIES.length}</span>
                </dd>
              </div>
            </dl>
          </div>
          <NextUp next={next} />
        </section>
      </div>

      <div className="learn-layout">
        <div className="learn-main">
          <div className="learn-toolbar">
            <div className="learn-toolbar-text">
              <h2 className="learn-toolbar-title">Curriculum</h2>
              <ul className="learn-legend" aria-label="Status legend">
                <li>
                  <i className="learn-legend-swatch is-done" aria-hidden="true" />
                  Learned
                </li>
                <li>
                  <i className="learn-legend-swatch is-due" aria-hidden="true" />
                  Review due
                </li>
                <li>
                  <i className="learn-legend-swatch is-next" aria-hidden="true" />
                  Up next
                </li>
              </ul>
            </div>
            <button
              type="button"
              className="btn btn-quiet btn-sm learn-toolbar-btn"
              onClick={() => setOpen(allOpen ? new Set() : new Set(units.map((u) => u.id)))}
            >
              <ChevronDown className={`learn-chevron ${allOpen ? 'is-open' : ''}`} aria-hidden="true" />
              {allOpen ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
          <ol className="learn-timeline">{steps}</ol>
        </div>

        <aside className="learn-index" aria-label="Units">
          <div className="learn-index-title">Units</div>
          <ol>
            {units.map((u) => (
              <li key={u.id}>
                <Link
                  to={`/learn#${u.id}`}
                  replace
                  onClick={jump(u.id)}
                  className={`learn-index-link${active === u.id ? ' is-active' : ''}${u.status === 'locked' ? ' is-locked' : ''}`}
                  aria-current={active === u.id ? 'location' : undefined}
                  title={u.name}
                >
                  <IndexMarker s={u} />
                  <span className="learn-index-n tabular">{u.n}</span>
                  <span className="learn-index-name">{u.name}</span>
                  <span className="learn-index-count tabular">
                    {u.learned}/{u.total}
                    <span className="sr-only"> {u.id === FOUNDATIONS_ID ? 'lessons done' : 'learned'}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}

// ── Unit step (rail marker + card) ──────────────────────────────────────────

function UnitStep({
  s,
  prevComplete,
  isFirst,
  isLast,
  to,
  icon,
  color,
  kicker,
  title,
  tagline,
  note,
  summary,
  open,
  onToggle,
  children,
}: {
  s: UnitSummary;
  prevComplete: boolean;
  isFirst: boolean;
  isLast: boolean;
  to?: string;
  icon: ReactNode;
  color?: string;
  kicker: string;
  title: string;
  tagline: string;
  note?: string;
  summary: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const listId = `${s.id}-lessons`;
  const headInner = (
    <>
      <span className="learn-unit-icon">{icon}</span>
      <div className="learn-unit-kicker">
        <span className="learn-unit-n">{kicker}</span>
        <StatusBadge s={s} />
        {s.due > 0 && (
          <span className="badge badge-warning">
            <RotateCcw strokeWidth={2.25} />
            {s.due} due
          </span>
        )}
      </div>
      <div className="learn-unit-text">
        <h3 className="learn-unit-title">{title}</h3>
        <p className="learn-unit-tagline">{tagline}</p>
        {note && <p className="learn-unit-note">{note}</p>}
      </div>
      <div className="learn-unit-progress">
        <div className="learn-unit-count tabular">
          <strong>{s.learned}</strong>/{s.total}
          <span className="learn-unit-count-label">{s.id === FOUNDATIONS_ID ? ' lessons' : ' learned'}</span>
        </div>
        <ProgressBar value={s.pct} thin color={s.status === 'complete' ? 'var(--success)' : color} label={`${title} progress`} />
      </div>
      {/* The column is reserved even without a link so progress lines up down the timeline. */}
      {to ? <ChevronRight className="learn-unit-go" size={18} aria-hidden="true" /> : <span className="learn-unit-go" aria-hidden="true" />}
    </>
  );

  return (
    <li
      id={s.id}
      className={`learn-step${isFirst ? ' is-first' : ''}${isLast ? ' is-last' : ''}${prevComplete ? ' prev-complete' : ''}${s.status === 'complete' ? ' is-complete' : ''}`}
    >
      <div className="learn-rail">
        <RailMarker s={s} />
      </div>
      <article
        className={`learn-unit${s.current ? ' is-current' : ''}${s.status === 'locked' ? ' is-locked' : ''}`}
        style={color ? ({ ['--c' as string]: color } as CSSProperties) : undefined}
      >
        {to ? (
          <Link to={to} className="learn-unit-head is-link">
            {headInner}
          </Link>
        ) : (
          <div className="learn-unit-head">{headInner}</div>
        )}
        <ol className="learn-rows" id={listId} hidden={!open}>
          {children}
        </ol>
        <div className="learn-unit-foot">
          <button type="button" className="learn-unit-toggle" aria-expanded={open} aria-controls={listId} onClick={onToggle}>
            <ChevronDown className={`learn-chevron ${open ? 'is-open' : ''}`} aria-hidden="true" />
            {open ? 'Hide lessons' : 'Show lessons'}
            <span className="sr-only"> for {title}</span>
          </button>
          <span className="learn-unit-summary">{summary}</span>
        </div>
      </article>
    </li>
  );
}
