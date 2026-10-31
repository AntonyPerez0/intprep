import '../styles/pages/home.css';
import { Fragment, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { CATEGORIES, CATEGORY_BY_ID } from '../content/categories';
import { FOUNDATIONS, PROBLEMS } from '../content/index';
import { addDays, dayKey, friendlyDue, lastNDays, parseDay, today, weekdayShort } from '../lib/date';
import { GEMS, levelInfo, levelTitle } from '../lib/game';
import { inline } from '../lib/markdown';
import { foundationsDone, nextStep, unitProgress, type NextStep } from '../lib/path';
import { crowns } from '../lib/srs';
import { dueProblemIds, learnedIds, repairableStreak, repairStreak, useProgress, xpToday, type Progress } from '../lib/store';
import { CategoryIcon, Icon, IconTile, ICONS, LESSON_ICON } from '../components/icons';
import { Badge, DifficultyChip, ProgressBar, Ring, StatCard } from '../components/ui';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function Home() {
  const p = useProgress();
  const next = nextStep(p);
  const due = dueProblemIds(p);
  const learned = learnedIds(p).length;
  const mastered = Object.values(p.problems).filter((x) => crowns(x.srs) >= 4).length;
  const x = xpToday(p);
  const goal = p.settings.dailyGoal;
  const firstName = p.settings.name.trim().split(/\s+/)[0] ?? '';
  const isNew = learned === 0 && p.xp === 0;
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const repairable = repairableStreak(p);
  let status: string;
  if (isNew) status = 'Welcome to IntPrep. Your plan is ready, starting with one short lesson.';
  else if (p.streak.current > 0)
    status =
      x > 0
        ? x >= goal
          ? `Daily goal complete. Your ${p.streak.current}-day streak is safe.`
          : `Your ${p.streak.current}-day streak is safe for today. ${goal - x} XP to your daily goal.`
        : `Keep your ${p.streak.current}-day streak going. One lesson or review is enough.`;
  else if (x >= goal) status = 'Daily goal complete. Nice work today.';
  else if (due.length > 0) status = `${plural(due.length, 'review')} due and ${goal - x} XP to your daily goal.`;
  else status = `${goal - x} XP to your daily goal. One lesson starts a new streak.`;

  return (
    <div className="home">
      <div className="home-page">
        <header className="home-head">
          <div className="eyebrow">{date}</div>
          <h1 className="home-title">
            {greeting()}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="home-sub">{status}</p>
        </header>

        {repairable > 0 && <RepairCard p={p} />}

        <div className="home-hero">
          <ContinueCard p={p} next={next} />
          <GetStarted p={p} learned={learned} next={next} />
          <ReviewCard p={p} due={due.length} learned={learned} />
          <TodayPanel p={p} xp={x} />
        </div>

        {!isNew && (
          <section className="home-kpis" aria-label="Your progress">
            <Kpis p={p} learned={learned} mastered={mastered} />
          </section>
        )}

        <div className="home-row">
          <ActivityCard p={p} />
          <QuickLinks p={p} />
        </div>

        <Roadmap p={p} next={next} />

        <p className="home-foot">
          {PROBLEMS.length} problems across {CATEGORIES.length} patterns, grounded in learning science. <Link to="/science">See why it works</Link>
        </p>
      </div>
    </div>
  );
}

// ── Streak repair ───────────────────────────────────────────────────────────

function RepairCard({ p }: { p: Progress }) {
  const value = repairableStreak(p);
  const short = GEMS.repairCost - p.gems;
  return (
    <section className="card home-repair" aria-labelledby="home-repair-title">
      <IconTile icon={ICONS.wrench} color="var(--streak)" />
      <div className="grow">
        <h2 id="home-repair-title" className="card-title">
          Repair your {value}-day streak
        </h2>
        <p className="home-repair-body">You missed a day. Restore your streak within 48 hours, or start a new one with today’s practice.</p>
      </div>
      <div className="home-repair-action">
        <button type="button" className="btn btn-secondary" disabled={p.gems < GEMS.repairCost} onClick={repairStreak} aria-describedby="home-repair-cost">
          <Icon name="wrench" />
          Repair streak
        </button>
        <span id="home-repair-cost" className="home-repair-cost">
          <Icon name="gem" size={13} />
          {short > 0 ? `Costs ${GEMS.repairCost} gems · ${short} more needed` : `Costs ${GEMS.repairCost} gems · you have ${p.gems}`}
        </span>
      </div>
    </section>
  );
}

// ── Continue learning ───────────────────────────────────────────────────────

interface NextView {
  kind: string;
  tone?: 'brand' | 'success';
  context: string;
  position?: string;
  accent: string;
  tile: ReactNode;
  title: string;
  description?: ReactNode;
  meta: ReactNode;
  progress?: { label: string; done: number; total: number; unit: string };
  cta: string;
}

function describeNext(p: Progress, next: NextStep): NextView {
  switch (next.kind) {
    case 'foundation': {
      const i = FOUNDATIONS.findIndex((l) => l.id === next.lessonId);
      const lesson = FOUNDATIONS[i];
      return {
        kind: 'Lesson',
        context: 'Beginner foundations',
        position: `Lesson ${i + 1} of ${FOUNDATIONS.length}`,
        accent: 'var(--brand)',
        tile: <IconTile icon={LESSON_ICON[next.lessonId] ?? ICONS.grad} size="lg" />,
        title: next.title,
        description: lesson?.blurb,
        meta: lesson ? (
          <span className="home-meta-item">
            <Icon name="clock" size={14} />
            {lesson.minutes} min
          </span>
        ) : null,
        progress: { label: 'Foundations progress', done: foundationsDone(p), total: FOUNDATIONS.length, unit: 'complete' },
        cta: 'Start lesson',
      };
    }
    case 'guide': {
      const c = CATEGORY_BY_ID[next.category];
      const u = unitProgress(p, c.id);
      return {
        kind: 'New pattern',
        context: c.name,
        position: `Unit ${CATEGORIES.indexOf(c) + 1} of ${CATEGORIES.length}`,
        accent: c.color,
        tile: <CategoryIcon id={c.id} color={c.color} size="lg" />,
        title: next.title,
        description: c.tagline,
        meta: (
          <span className="home-meta-item">
            <Icon name="book" size={14} />
            Pattern intro, template and quiz
          </span>
        ),
        progress: { label: 'Unit progress', done: u.learned, total: u.total, unit: 'learned' },
        cta: 'Start lesson',
      };
    }
    case 'problem': {
      const q = next.problem;
      const c = CATEGORY_BY_ID[q.category];
      const u = unitProgress(p, c.id);
      return {
        kind: 'Next problem',
        context: c.name,
        position: `Unit ${CATEGORIES.indexOf(c) + 1} of ${CATEGORIES.length}`,
        accent: c.color,
        tile: <CategoryIcon id={c.id} color={c.color} size="lg" />,
        title: next.title,
        description: inline(q.prompt),
        meta: (
          <>
            <DifficultyChip d={q.difficulty} />
            <span className="home-meta-item mono">#{q.num}</span>
            <span className="home-meta-item truncate">{q.pattern}</span>
          </>
        ),
        progress: { label: 'Unit progress', done: u.learned, total: u.total, unit: 'learned' },
        cta: 'Start lesson',
      };
    }
    default:
      return {
        kind: 'Roadmap complete',
        tone: 'success',
        context: `${CATEGORIES.length} of ${CATEGORIES.length} patterns`,
        accent: 'var(--success)',
        tile: <IconTile icon={ICONS.trophy} color="var(--success)" size="lg" />,
        title: `All ${PROBLEMS.length} problems learned`,
        description: 'Every pattern is in your toolkit. Daily review keeps it sharp until interview day.',
        meta: null,
        progress: { label: 'Roadmap progress', done: PROBLEMS.filter((q) => p.problems[q.id]?.learnedAt).length, total: PROBLEMS.length, unit: 'learned' },
        cta: 'Go to review',
      };
  }
}

function ContinueCard({ p, next }: { p: Progress; next: NextStep }) {
  const v = describeNext(p, next);
  return (
    <section className="card home-card home-continue" style={{ ['--c' as string]: v.accent } as CSSProperties} aria-labelledby="home-continue-title">
      <div className="home-card-head">
        <h2 id="home-continue-title" className="card-title">
          {next.kind === 'done' ? 'Keep it sharp' : 'Continue learning'}
        </h2>
        {v.position && <span className="home-card-aside tabular">{v.position}</span>}
      </div>

      <div className="home-continue-main">
        {v.tile}
        <div className="home-continue-kind">
          <Badge tone={v.tone ?? 'brand'}>{v.kind}</Badge>
          <span className="truncate">{v.context}</span>
        </div>
        <h3 className="home-continue-title">{v.title}</h3>
        {v.description && <p className="home-continue-desc">{v.description}</p>}
        {v.meta && <div className="home-continue-meta">{v.meta}</div>}
      </div>

      <div className="home-continue-foot">
        {v.progress ? (
          <div className="home-continue-progress">
            <div className="home-progress-label">
              <span className="truncate">{v.progress.label}</span>
              <span className="tabular">
                {v.progress.done}/{v.progress.total}
                <span className="text-tertiary"> {v.progress.unit}</span>
              </span>
            </div>
            <ProgressBar value={v.progress.total ? v.progress.done / v.progress.total : 0} color={v.accent} label={`${v.context}: ${v.progress.done} of ${v.progress.total} ${v.progress.unit}`} />
          </div>
        ) : (
          <div className="grow" />
        )}
        <Link to={next.href} className="btn btn-primary btn-lg home-continue-cta">
          {v.cta}
          <Icon name="arrow" />
        </Link>
      </div>
    </section>
  );
}

// ── Daily review ────────────────────────────────────────────────────────────

function ReviewCard({ p, due, learned }: { p: Progress; due: number; learned: number }) {
  const t = today();
  const tomorrow = Math.max(0, dueProblemIds(p, addDays(t, 1)).length - due);
  const upcoming = Object.values(p.problems)
    .map((q) => q.srs?.due)
    .filter((d): d is string => !!d && d > t)
    .sort()[0];

  let title: string;
  let body: string;
  let foot: string | null = null;
  let action: ReactNode;
  if (due > 0) {
    title = `${plural(due, 'problem')} ready to review`;
    body = 'Recall them now, right as they start to fade. That is when memory strengthens most.';
    foot = tomorrow > 0 ? `${tomorrow} more due tomorrow` : null;
    action = (
      <Link to="/review" className="btn btn-secondary home-review-cta">
        Start review
      </Link>
    );
  } else if (learned) {
    title = 'All caught up';
    body = 'Nothing is due today. Practise ahead with a few extra cards, or come back when reviews are due.';
    foot = upcoming ? `Next review ${friendlyDue(upcoming)}` : null;
    action = (
      <Link to="/review?ahead=1" className="btn btn-secondary home-review-cta">
        Practise ahead
      </Link>
    );
  } else {
    title = 'Nothing to review yet';
    body = 'Problems you learn return here the next day for spaced review.';
    action = (
      <Link to="/blitz" className="btn btn-secondary home-review-cta">
        Try Pattern Blitz
      </Link>
    );
  }

  return (
    <section className="card home-card home-review" aria-labelledby="home-review-title">
      <div className="home-card-head">
        <h2 id="home-review-title" className="card-title">
          Daily review
        </h2>
        <span className="home-card-aside">{foot ?? 'Spaced repetition'}</span>
      </div>
      <div className="home-review-main">
        <div className={`home-review-count ${due > 0 ? 'is-due' : learned ? 'is-clear' : ''}`} aria-hidden="true">
          {due > 0 ? (
            <>
              <span className="home-review-num tabular">{due}</span>
              <span className="home-review-unit">due</span>
            </>
          ) : learned ? (
            <Icon name="check" size={22} strokeWidth={2} />
          ) : (
            <Icon name="review" size={22} />
          )}
        </div>
        <div className="home-review-text">
          <h3 className="home-review-title">{title}</h3>
          <p className="home-review-body">{body}</p>
        </div>
        <div className="home-review-action">{action}</div>
      </div>
    </section>
  );
}

// ── Today panel ─────────────────────────────────────────────────────────────

function TodayPanel({ p, xp }: { p: Progress; xp: number }) {
  const goal = p.settings.dailyGoal;
  const done = xp >= goal;
  const ring = done ? 'var(--success)' : 'var(--brand)';
  const s = p.streak;
  return (
    <section className="card home-card home-today" aria-labelledby="home-today-title">
      <div className="home-card-head">
        <h2 id="home-today-title" className="card-title">
          Today
        </h2>
        <Link to="/profile" className="home-card-aside home-aside-link">
          Edit goal
        </Link>
      </div>

      <div className="home-goal">
        <Ring value={xp / goal} size={104} stroke={10} color={ring} track={`color-mix(in srgb, ${ring} 14%, var(--surface-active))`}>
          <span className="home-goal-pct tabular">{Math.round(Math.min(1, xp / goal) * 100)}%</span>
        </Ring>
        <div className="home-goal-text">
          <div className="home-goal-label">Daily goal</div>
          <div className="home-goal-value tabular">
            {xp}
            <span>/{goal} XP</span>
          </div>
          <div className={`home-goal-status ${done ? 'is-done' : ''}`}>
            {done ? (
              <>
                <Icon name="success" size={14} />
                Goal complete
              </>
            ) : (
              `${goal - xp} XP to go`
            )}
          </div>
        </div>
      </div>

      <WeekStrip p={p} />

      <ul className="home-today-list">
        <li>
          <IconTile icon={ICONS.flame} color={s.current > 0 ? 'var(--streak)' : 'var(--text-tertiary)'} size="sm" />
          <div className="grow">
            <div className="home-today-k">Current streak</div>
            <div className="home-today-sub">{s.longest > 0 ? `Best ${plural(s.longest, 'day')}` : 'Practise today to start one'}</div>
          </div>
          <div className="home-today-v tabular">
            {s.current}
            <span> {s.current === 1 ? 'day' : 'days'}</span>
          </div>
        </li>
        <li>
          <IconTile icon={ICONS.snowflake} color="var(--info)" size="sm" />
          <div className="grow">
            <div className="home-today-k">Streak freezes</div>
            <div className="home-today-sub">Covers a missed day</div>
          </div>
          <div className="home-today-v tabular">
            {s.freezes}
            <span> of {GEMS.maxFreezes}</span>
          </div>
        </li>
        <li>
          <IconTile icon={ICONS.gem} color="var(--gem)" size="sm" />
          <div className="grow">
            <div className="home-today-k">Gems</div>
            <div className="home-today-sub">
              <Link to="/profile">Spend on freezes</Link>
            </div>
          </div>
          <div className="home-today-v tabular">{p.gems}</div>
        </li>
      </ul>
    </section>
  );
}

function WeekStrip({ p }: { p: Progress }) {
  const t = today();
  const joined = dayKey(new Date(p.createdAt));
  const days = lastNDays(7);
  const frozen = new Set(p.streak.frozenDays);
  const active = days.filter((d) => (p.xpByDay[d] ?? 0) > 0).length;
  return (
    <div className="home-week">
      <div className="home-week-head">
        <span>Last 7 days</span>
        <span className="tabular">{active} of 7 active</span>
      </div>
      <ol className="home-week-days">
        {days.map((d) => {
          const done = (p.xpByDay[d] ?? 0) > 0;
          const isFrozen = !done && frozen.has(d);
          const before = !done && !isFrozen && d < joined;
          const state = done ? 'is-done' : isFrozen ? 'is-frozen' : d === t ? 'is-open' : before ? 'is-before' : 'is-missed';
          const what = done ? 'practised' : isFrozen ? 'streak freeze' : d === t ? 'not yet' : before ? 'before you joined' : 'missed';
          const label = parseDay(d).toLocaleDateString(undefined, { weekday: 'long' });
          return (
            <li key={d} className={`home-day ${state} ${d === t ? 'is-today' : ''}`}>
              <span className="home-day-name" aria-hidden="true">
                {weekdayShort(d)}
              </span>
              <span className="home-day-dot" title={`${label}: ${what}`}>
                {done ? <Icon name="flame" size={14} strokeWidth={2} /> : isFrozen ? <Icon name="snowflake" size={14} strokeWidth={2} /> : null}
                <span className="sr-only">
                  {label}: {what}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ── Getting started checklist (new learners) ────────────────────────────────

function GetStarted({ p, learned, next }: { p: Progress; learned: number; next: NextStep }) {
  const steps = [
    { title: 'Set a daily goal', body: `${p.settings.dailyGoal} XP a day. Change it any time.`, done: p.onboarded, to: '/profile' },
    { title: 'Finish your first lesson', body: 'A short, interactive intro with a quick quiz.', done: Object.keys(p.lessonsDone).length > 0, to: next.href },
    { title: 'Learn your first problem', body: 'Walk through the idea, then build the solution.', done: learned > 0, to: '/learn' },
    { title: 'Complete a daily review', body: 'Reviews start the day after you learn a problem.', done: p.stats.sessions > 0, to: '/review' },
  ];
  const complete = steps.filter((s) => s.done).length;
  if (complete === steps.length) return null;
  return (
    <section className="card home-card home-start" aria-labelledby="home-start-title">
      <div className="home-card-head">
        <div>
          <h2 id="home-start-title" className="card-title">
            Get started
          </h2>
          <div className="card-subtitle">Four short steps to build a daily habit.</div>
        </div>
        <div className="home-start-count">
          <span className="tabular">
            {complete} of {steps.length} complete
          </span>
          <ProgressBar value={complete / steps.length} label="Getting started progress" />
        </div>
      </div>
      <ol className="home-steps">
        {steps.map((s, i) => (
          <li key={s.title}>
            <Link to={s.to} className={`home-step ${s.done ? 'is-done' : ''}`}>
              <span className="home-step-mark" aria-hidden="true">
                {s.done ? <Icon name="check" size={13} strokeWidth={2.5} /> : i + 1}
              </span>
              <span className="grow">
                <span className="home-step-title">
                  {s.title}
                  {s.done && <span className="sr-only"> (done)</span>}
                </span>
                <span className="home-step-body">{s.body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ── KPIs ────────────────────────────────────────────────────────────────────

function Kpis({ p, learned, mastered }: { p: Progress; learned: number; mastered: number }) {
  const lv = levelInfo(p.xp);
  const acc = p.stats.answered > 0 ? p.stats.correct / p.stats.answered : null;
  return (
    <>
      <StatCard
        icon="checks"
        label="Problems learned"
        value={
          <>
            {learned}
            <span className="home-kpi-of">/{PROBLEMS.length}</span>
          </>
        }
        meta={<KpiMeta value={learned / PROBLEMS.length} text={`${Math.round((learned / PROBLEMS.length) * 100)}% of the roadmap`} />}
      />
      <StatCard
        icon="crown"
        label="Strong or better"
        value={mastered}
        meta={<KpiMeta value={learned ? mastered / learned : 0} text={learned ? `${Math.round((mastered / learned) * 100)}% of learned` : 'Grows with each review'} />}
      />
      <StatCard
        icon="target"
        label="Drill accuracy"
        value={acc === null ? '–' : `${Math.round(acc * 100)}%`}
        meta={<KpiMeta value={acc ?? 0} text={acc === null ? 'No drills yet' : `${p.stats.correct}/${p.stats.answered} correct`} />}
      />
      <StatCard
        icon="award"
        label="Level"
        value={
          <>
            {lv.level}
            <span className="home-kpi-title">{levelTitle(lv.level)}</span>
          </>
        }
        meta={<KpiMeta value={lv.pct} text={`${lv.cost - lv.into} XP to level ${lv.level + 1}`} />}
      />
    </>
  );
}

function KpiMeta({ value, text }: { value: number; text: string }) {
  return (
    <div className="home-kpi-meta">
      <ProgressBar value={value} thin />
      <div className="truncate">{text}</div>
    </div>
  );
}

// ── Activity heatmap ────────────────────────────────────────────────────────

const WEEK_OPTIONS = [52, 40, 32, 26, 20, 16, 12];
const DAY_COL = 30;
const GAP = 3;
const MIN_CELL = 13;
const MAX_CELL = 18;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function heatLevel(xp: number, goal: number) {
  if (xp <= 0) return 0;
  if (xp < goal / 2) return 1;
  if (xp < goal) return 2;
  if (xp < goal * 2) return 3;
  return 4;
}

function ActivityCard({ p }: { p: Progress }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const avail = Math.max(0, width - DAY_COL - GAP);
  const weeks = width ? (WEEK_OPTIONS.find((n) => (avail + GAP) / n - GAP >= MIN_CELL) ?? 12) : 20;
  const cell = width ? Math.min(MAX_CELL, Math.floor(((avail + GAP) / weeks - GAP) * 10) / 10) : 12;

  const t = today();
  const start = addDays(t, -parseDay(t).getDay() - 7 * (weeks - 1));
  const cols = Array.from({ length: weeks }, (_, c) => Array.from({ length: 7 }, (_, r) => addDays(start, c * 7 + r)));
  const months = cols.map((col, c) => {
    const m = parseDay(col[0]).getMonth();
    const changes = (k: number) => k > 0 && k < weeks && parseDay(cols[k][0]).getMonth() !== parseDay(cols[k - 1][0]).getMonth();
    const show = c === 0 ? !changes(1) && !changes(2) : m !== parseDay(cols[c - 1][0]).getMonth();
    return show ? parseDay(col[0]).toLocaleDateString(undefined, { month: 'short' }) : '';
  });

  const frozen = new Set(p.streak.frozenDays);
  const inWindow = cols.flat().filter((d) => d <= t);
  const active = inWindow.filter((d) => (p.xpByDay[d] ?? 0) > 0).length;
  const goalsMet = new Set(p.goalDays);
  const goalCount = inWindow.filter((d) => goalsMet.has(d)).length;
  const anyFrozen = inWindow.some((d) => frozen.has(d));
  const fmt = (d: string) => parseDay(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <section className="card home-card home-activity" aria-labelledby="home-activity-title">
      <div className="home-card-head">
        <div>
          <h2 id="home-activity-title" className="card-title">
            Activity
          </h2>
          <div className="card-subtitle">Last {weeks} weeks</div>
        </div>
        {(active > 0 || p.streak.longest > 0) && (
          <dl className="home-activity-stats">
            <div>
              <dt>Active days</dt>
              <dd className="tabular">{active}</dd>
            </div>
            <div>
              <dt>Goals met</dt>
              <dd className="tabular">{goalCount}</dd>
            </div>
            <div>
              <dt>Best streak</dt>
              <dd className="tabular">{p.streak.longest}</dd>
            </div>
          </dl>
        )}
      </div>

      <div ref={ref} className={`home-heat-wrap ${active ? '' : 'is-empty'}`}>
        <div
          className="home-heat"
          role="img"
          aria-label={`Activity over the last ${weeks} weeks: ${plural(active, 'active day')}`}
          style={{ gridTemplateColumns: `${DAY_COL}px repeat(${weeks}, ${cell}px)`, gridTemplateRows: `16px repeat(7, ${cell}px)` }}
        >
          <span />
          {DAY_LABELS.map((d, i) => (
            <span key={i} className="home-heat-day">
              {d}
            </span>
          ))}
          {cols.map((col, c) => (
            <Fragment key={col[0]}>
              <span className="home-heat-month">{months[c]}</span>
              {col.map((d) => {
                if (d > t) return <span key={d} className="home-heat-cell is-future" />;
                const xp = p.xpByDay[d] ?? 0;
                const isFrozen = xp === 0 && frozen.has(d);
                return (
                  <span
                    key={d}
                    className={`home-heat-cell ${isFrozen ? 'is-frozen' : ''} ${d === t ? 'is-today' : ''}`}
                    data-l={heatLevel(xp, p.settings.dailyGoal)}
                    title={`${fmt(d)} · ${isFrozen ? 'Streak freeze' : xp ? `${xp} XP` : 'No activity'}`}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
        {!active && (
          <div className="home-heat-empty">
            <div className="home-heat-empty-box">
              <CalendarDays size={18} strokeWidth={1.75} aria-hidden="true" />
              <div>
                <div className="home-heat-empty-title">No activity yet</div>
                <div className="home-heat-empty-body">Each day you practise fills in a square.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="home-heat-foot">
        <span className="home-heat-note">One square per day, shaded by XP earned.</span>
        <span className="home-heat-legend" aria-hidden="true">
          <span className="home-heat-word">Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className="home-heat-cell" data-l={l} />
          ))}
          <span className="home-heat-word">More</span>
          {anyFrozen && (
            <>
              <span className="home-heat-cell is-frozen home-legend-gap" />
              <span className="home-heat-word">Freeze</span>
            </>
          )}
        </span>
      </div>
    </section>
  );
}

// ── Quick links ─────────────────────────────────────────────────────────────

const NEUTRAL = 'var(--text-secondary)';

function QuickLinks({ p }: { p: Progress }) {
  const fDone = foundationsDone(p);
  return (
    <section className="card home-card home-links" aria-labelledby="home-links-title">
      <div className="home-card-head">
        <h2 id="home-links-title" className="card-title">
          Explore
        </h2>
      </div>
      <ul className="home-link-list">
        <li>
          <Link to="/blitz" className="home-link">
            <IconTile icon={ICONS.blitz} color={NEUTRAL} size="sm" />
            <div className="grow">
              <div className="home-link-title">Pattern Blitz</div>
              <div className="home-link-meta">{p.stats.blitzBest > 0 ? `Best score ${p.stats.blitzBest}` : '60 seconds. Name the pattern.'}</div>
            </div>
            <Icon name="chevron" className="home-link-chevron" />
          </Link>
        </li>
        {FOUNDATIONS.length > 0 && (
          <li>
            <Link to="/learn#foundations" className="home-link">
              <IconTile icon={ICONS.layers} color={NEUTRAL} size="sm" />
              <div className="grow">
                <div className="home-link-title">Beginner foundations</div>
                <div className="home-link-meta">
                  <span className="tabular">
                    {fDone} of {FOUNDATIONS.length} lessons
                  </span>
                  <ProgressBar value={fDone / FOUNDATIONS.length} thin label="Foundations progress" />
                </div>
              </div>
              <Icon name="chevron" className="home-link-chevron" />
            </Link>
          </li>
        )}
        <li>
          <Link to="/patterns" className="home-link">
            <IconTile icon={ICONS.book} color={NEUTRAL} size="sm" />
            <div className="grow">
              <div className="home-link-title">Pattern guide</div>
              <div className="home-link-meta">{CATEGORIES.length} patterns, templates and cues</div>
            </div>
            <Icon name="chevron" className="home-link-chevron" />
          </Link>
        </li>
        <li>
          <Link to="/problems" className="home-link">
            <IconTile icon={ICONS.list} color={NEUTRAL} size="sm" />
            <div className="grow">
              <div className="home-link-title">Problem library</div>
              <div className="home-link-meta">Browse all {PROBLEMS.length} problems</div>
            </div>
            <Icon name="chevron" className="home-link-chevron" />
          </Link>
        </li>
      </ul>
    </section>
  );
}

// ── Roadmap ─────────────────────────────────────────────────────────────────

function Roadmap({ p, next }: { p: Progress; next: NextStep }) {
  const current = next.kind === 'guide' ? next.category : next.kind === 'problem' ? next.problem.category : null;
  return (
    <section className="card pad-0 home-roadmap" aria-labelledby="home-roadmap-title">
      <div className="home-card-head home-roadmap-head">
        <div>
          <h2 id="home-roadmap-title" className="card-title">
            Your roadmap
          </h2>
          <div className="card-subtitle">{CATEGORIES.length} patterns, in order</div>
        </div>
        <Link to="/learn" className="btn btn-secondary btn-sm">
          Learning path
          <Icon name="arrow" />
        </Link>
      </div>
      <ol className="home-units">
        {CATEGORIES.map((c, i) => {
          const u = unitProgress(p, c.id);
          const complete = u.total > 0 && u.learned === u.total;
          return (
            <li key={c.id}>
              <Link to={`/unit/${c.id}`} className="home-unit">
                <span className="home-unit-num tabular" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <CategoryIcon id={c.id} color={c.color} size="sm" />
                <div className="grow">
                  <div className="home-unit-top">
                    <span className="home-unit-name truncate">{c.name}</span>
                    {c.id === current && (
                      <Badge tone="brand" pill>
                        Current
                      </Badge>
                    )}
                    <span className={`home-unit-count tabular ${complete ? 'is-complete' : ''}`}>
                      {complete && <Icon name="success" size={13} />}
                      {u.learned}/{u.total}
                    </span>
                  </div>
                  <ProgressBar value={u.pct} thin color={u.learned ? c.color : undefined} label={`${c.name}: ${u.learned} of ${u.total} learned`} />
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
