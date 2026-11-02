import '../styles/pages/profile.css';
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Download,
  FlaskConical,
  Gem,
  Keyboard,
  List,
  Lock,
  Monitor,
  Moon,
  Pencil,
  RotateCcw,
  Route,
  Snowflake,
  Star,
  Sun,
  TriangleAlert,
  Upload,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { PROBLEMS } from '../content/index';
import { addDays, dayKey, lastNDays, parseDay, today } from '../lib/date';
import { ACHIEVEMENTS, DAILY_GOALS, GEMS, levelInfo, levelTitle } from '../lib/game';
import { CODE_PRACTICE, type InputMode } from '../lib/input';
import { crowns } from '../lib/srs';
import {
  buyFreeze,
  exportProgress,
  importProgress,
  learnedIds,
  practicedToday,
  resetProgress,
  updateSettings,
  useProgress,
  type Progress,
} from '../lib/store';
import { ICONS, IconTile } from '../components/icons';
import { Badge, Modal, ProgressBar, SectionHeader, StatCard, Toggle } from '../components/ui';

// ── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString();
const plural = (n: number, word: string) => `${fmt(n)} ${word}${n === 1 ? '' : 's'}`;
const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

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

// ── Identity ────────────────────────────────────────────────────────────────

function IdentityCard({ p, onEdit }: { p: Progress; onEdit: () => void }) {
  const lv = levelInfo(p.xp);
  const name = p.settings.name.trim();
  const initials = initialsOf(name);
  const title = levelTitle(lv.level);
  // Titles change every two levels; find the next level that brings a new one.
  const nextTitleLevel = 2 * Math.floor((lv.level - 1) / 2) + 3;
  const nextTitle = levelTitle(nextTitleLevel);
  const since = new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

  return (
    <section className="card pad-0 profile-id" aria-label="Profile summary">
      <div className="profile-id-who">
        <div className="profile-avatar" aria-hidden="true">
          {initials || <UserRound strokeWidth={1.75} />}
        </div>
        <div className="profile-id-text">
          <h1 className="profile-name">{name || 'Your profile'}</h1>
          <div className="profile-id-meta">
            <Badge tone="brand" pill>
              Level {lv.level}
            </Badge>
            <span className="profile-id-title">{title}</span>
          </div>
          <div className="profile-id-since">
            <CalendarDays aria-hidden="true" />
            Member since {since}
          </div>
        </div>
        <button type="button" className="btn btn-secondary btn-sm profile-id-edit" onClick={onEdit} aria-label="Edit profile">
          <Pencil aria-hidden="true" />
          <span className="profile-id-edit-label">Edit profile</span>
        </button>
      </div>

      <div className="profile-id-level">
        <div className="profile-level-top">
          <span className="profile-level-name">
            <Star aria-hidden="true" />
            Progress to level {lv.level + 1}
          </span>
          <span className="profile-level-nums">
            <strong>{fmt(lv.into)}</strong> / {fmt(lv.cost)} XP
          </span>
        </div>
        <ProgressBar value={lv.pct} large label={`Progress to level ${lv.level + 1}`} />
        <div className="profile-level-bottom">
          <span>{fmt(lv.cost - lv.into)} XP to go</span>
          {nextTitle !== title && (
            <span>
              Next title: <span className="profile-level-next">{nextTitle}</span> at level {nextTitleLevel}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Activity: practice calendar ─────────────────────────────────────────────

const WEEK_OPTIONS = [52, 40, 32, 26, 20, 16, 12];
const DAY_COL = 32;
const GAP = 3;
const MIN_CELL = 13;
const MAX_CELL = 18;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function heatLevel(xp: number, goal: number) {
  if (xp <= 0) return 0;
  if (xp < goal / 2) return 1;
  if (xp < goal) return 2;
  if (xp < goal * 2) return 3;
  return 4;
}

type HeatTip = { d: string; x: number; y: number };

function PracticeCalendar({ p }: { p: Progress }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const cardRef = useRef<HTMLElement>(null);
  const [tip, setTip] = useState<HeatTip | null>(null);
  const avail = Math.max(0, width - DAY_COL - GAP);
  const weeks = width ? (WEEK_OPTIONS.find((n) => (avail + GAP) / n - GAP >= MIN_CELL) ?? 12) : 20;
  const cell = width ? Math.min(MAX_CELL, Math.floor(((avail + GAP) / weeks - GAP) * 10) / 10) : 12;
  useEffect(() => setTip(null), [width]);

  const t = today();
  const joined = dayKey(new Date(p.createdAt));
  const start = addDays(t, -parseDay(t).getDay() - 7 * (weeks - 1));
  const cols = Array.from({ length: weeks }, (_, c) => Array.from({ length: 7 }, (_, r) => addDays(start, c * 7 + r)));
  const monthOf = (k: number) => parseDay(cols[k][0]).getMonth();
  const changes = (k: number) => k > 0 && k < weeks && monthOf(k) !== monthOf(k - 1);
  // A label needs about two columns of room, so skip one that would start in the last column.
  const months = cols.map((col, c) => {
    const show = c === 0 ? !changes(1) && !changes(2) : changes(c) && c < weeks - 1;
    return show ? parseDay(col[0]).toLocaleDateString(undefined, { month: 'short' }) : '';
  });

  const frozen = new Set(p.streak.frozenDays);
  const inWindow = cols.flat().filter((d) => d <= t);
  const active = inWindow.filter((d) => (p.xpByDay[d] ?? 0) > 0).length;
  const anyFrozen = inWindow.some((d) => frozen.has(d) && !(p.xpByDay[d] ?? 0));
  const joinedInWindow = joined > inWindow[0];
  const label = (d: string) => parseDay(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const sub = active
    ? `${plural(active, 'active day')} ${joinedInWindow ? 'since you joined' : `in the last ${weeks} weeks`}`
    : `Last ${weeks} weeks`;

  const describe = (d: string) => {
    const xp = p.xpByDay[d] ?? 0;
    if (xp) return `${fmt(xp)} XP`;
    if (frozen.has(d)) return 'Streak freeze used';
    if (d < joined) return 'Before you joined';
    return 'No practice';
  };

  const showTip = (target: EventTarget | null) => {
    const el = (target as Element | null)?.closest?.('[data-d]') as HTMLElement | null;
    const card = cardRef.current;
    if (!el || !card) return setTip(null);
    const c = card.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const x = Math.min(c.width - 88, Math.max(88, r.left + r.width / 2 - c.left));
    setTip({ d: el.dataset.d!, x, y: r.top - c.top });
  };
  const onPointerOver = (e: PointerEvent) => e.pointerType === 'mouse' && showTip(e.target);
  const onPointerLeave = (e: PointerEvent) => e.pointerType === 'mouse' && setTip(null);
  const onClick = (e: MouseEvent) => {
    const el = (e.target as Element).closest?.('[data-d]') as HTMLElement | null;
    if (!el || el.dataset.d === tip?.d) return setTip(null);
    showTip(el);
  };

  return (
    <section ref={cardRef} className="card profile-card profile-cal" aria-labelledby="profile-cal-title">
      <div className="profile-card-head">
        <div>
          <h3 id="profile-cal-title" className="card-title">
            Practice calendar
          </h3>
          <div className="card-subtitle">{sub}</div>
        </div>
      </div>

      <div ref={ref} className={`profile-heat-wrap ${active ? '' : 'is-empty'}`}>
        <div
          className="profile-heat"
          role="img"
          aria-label={`Practice calendar for the last ${weeks} weeks: ${plural(active, 'active day')}`}
          style={{ gridTemplateColumns: `${DAY_COL}px repeat(${weeks}, ${cell}px)`, gridTemplateRows: `16px repeat(7, ${cell}px)` }}
          onPointerOver={onPointerOver}
          onPointerLeave={onPointerLeave}
          onClick={onClick}
        >
          <span />
          {DAY_LABELS.map((d, i) => (
            <span key={i} className="profile-heat-day">
              {d}
            </span>
          ))}
          {cols.map((col, c) => (
            <Fragment key={col[0]}>
              <span className="profile-heat-month">{months[c]}</span>
              {col.map((d) => {
                if (d > t) return <span key={d} className="profile-heat-cell is-future" />;
                const xp = p.xpByDay[d] ?? 0;
                const isFrozen = xp === 0 && frozen.has(d);
                const before = xp === 0 && !isFrozen && d < joined;
                return (
                  <span
                    key={d}
                    data-d={d}
                    className={`profile-heat-cell ${isFrozen ? 'is-frozen' : ''} ${before ? 'is-before' : ''} ${d === t ? 'is-today' : ''} ${tip?.d === d ? 'is-tip' : ''}`}
                    data-l={heatLevel(xp, p.settings.dailyGoal)}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
        {!active && (
          <div className="profile-heat-empty">
            <div className="profile-heat-empty-box">
              <CalendarDays aria-hidden="true" />
              <div>
                <div className="profile-heat-empty-title">No practice yet</div>
                <div className="profile-heat-empty-body">Each day you earn XP fills in a square.</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {tip && (
        <div className="profile-heat-tip" role="tooltip" style={{ left: tip.x, top: tip.y }}>
          <strong>{describe(tip.d)}</strong>
          <span>{label(tip.d)}</span>
        </div>
      )}

      <div className="profile-card-foot">
        <span>One square per day, shaded by XP earned.</span>
        <span className="profile-legend" aria-hidden="true">
          <span className="profile-legend-item profile-legend-scale">
            Less
            {[0, 1, 2, 3, 4].map((l) => (
              <span key={l} className="profile-heat-cell" data-l={l} />
            ))}
            More
          </span>
          {anyFrozen && (
            <span className="profile-legend-item">
              <span className="profile-heat-cell is-frozen" />
              Freeze
            </span>
          )}
        </span>
      </div>
    </section>
  );
}

// ── Activity: last 7 days ───────────────────────────────────────────────────

function WeekChart({ p }: { p: Progress }) {
  const goal = p.settings.dailyGoal;
  const t = today();
  const days = lastNDays(7);
  const vals = days.map((d) => p.xpByDay[d] ?? 0);
  const top = Math.max(goal, ...vals) * 1.12;
  const total = vals.reduce((a, b) => a + b, 0);
  const met = vals.filter((v) => v >= goal).length;
  const goalPct = (goal / top) * 100;

  return (
    <section className="card profile-card profile-week" aria-labelledby="profile-week-title">
      <div className="profile-card-head">
        <div>
          <h3 id="profile-week-title" className="card-title">
            Last 7 days
          </h3>
          <div className="card-subtitle">
            Goal met on {met} of 7 days
          </div>
        </div>
        <div className="profile-week-total">
          <span className="profile-week-total-v">{fmt(total)}</span>
          <span className="profile-week-total-k">XP total</span>
        </div>
      </div>

      <div className="profile-week-chart">
        <div className="profile-week-plot">
          <div className="profile-week-goal" style={{ bottom: `${goalPct}%` }} aria-hidden="true" />
          {total === 0 && <div className="profile-week-empty">No practice in the last 7 days</div>}
          <ol className="profile-week-cols">
            {days.map((d, i) => {
              const v = vals[i];
              const h = v ? Math.max(3, (v / top) * 100) : 0;
              const hit = v >= goal;
              const long = parseDay(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
              return (
                <li
                  key={d}
                  className={`profile-week-col ${i < 2 ? 'tip-start' : i > 4 ? 'tip-end' : ''}`}
                  tabIndex={0}
                  aria-label={`${long}: ${fmt(v)} XP${hit ? ', goal met' : ''}`}
                  style={{ ['--h' as string]: `${h}%` }}
                >
                  {v > 0 ? <span className={`profile-week-bar ${hit ? 'is-met' : ''}`} /> : <span className="profile-week-bar is-zero" />}
                  {d === t && v > 0 && <span className="profile-week-cap">{fmt(v)}</span>}
                  <span className="profile-week-tip" role="tooltip">
                    <strong>{fmt(v)} XP</strong>
                    <span>{long}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <ol className="profile-week-x" aria-hidden="true">
          {days.map((d) => (
            <li key={d} className={d === t ? 'is-today' : ''}>
              {d === t ? 'Today' : parseDay(d).toLocaleDateString(undefined, { weekday: 'short' })}
            </li>
          ))}
        </ol>
      </div>

      <div className="profile-card-foot">
        <span className="profile-legend" aria-hidden="true">
          <span className="profile-legend-item">
            <span className="profile-key is-met" />
            Goal met
          </span>
          <span className="profile-legend-item">
            <span className="profile-key" />
            Below goal
          </span>
          <span className="profile-legend-item">
            <span className="profile-key-line" />
            Goal · {goal} XP
          </span>
        </span>
      </div>
    </section>
  );
}

// ── Achievements ────────────────────────────────────────────────────────────

/** Medals shown before "Show all" on narrow layouts (two rows of three). */
const MEDALS_PREVIEW = 6;

function Achievements({ p }: { p: Progress }) {
  const [expanded, setExpanded] = useState(false);
  const unlocked = ACHIEVEMENTS.filter((a) => p.achievements[a.id]).length;
  // Earned medals first; otherwise keep the registry's progression order.
  const ordered = [...ACHIEVEMENTS].sort((a, b) => Number(Boolean(p.achievements[b.id])) - Number(Boolean(p.achievements[a.id])));
  return (
    <section aria-labelledby="profile-ach-title">
      <SectionHeader
        title={<span id="profile-ach-title">Achievements</span>}
        sub={`${unlocked} of ${ACHIEVEMENTS.length} unlocked`}
        right={
          <div className="profile-ach-meter">
            <ProgressBar value={unlocked / ACHIEVEMENTS.length} label={`${unlocked} of ${ACHIEVEMENTS.length} achievements unlocked`} />
          </div>
        }
      />
      <div className="card profile-ach">
        <ul id="profile-medals" className={`profile-medals ${expanded ? '' : 'is-collapsed'}`}>
          {ordered.map((a) => {
            const at = p.achievements[a.id];
            const on = Boolean(at);
            const I = (ICONS as Record<string, LucideIcon>)[a.icon] ?? ICONS.award;
            // Real unlocks store a timestamp; very old/placeholder values are shown without a date.
            const when = on && at > 1e12 ? new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            return (
              <li key={a.id} className={`profile-medal ${on ? 'is-on' : 'is-locked'}`}>
                <span className="profile-medal-badge">
                  <IconTile icon={I} color={on ? 'var(--xp)' : 'var(--text-disabled)'} size="lg" />
                  {!on && (
                    <span className="profile-medal-lock">
                      <Lock aria-hidden="true" />
                    </span>
                  )}
                </span>
                <span className="profile-medal-title">{a.title}</span>
                <span className="profile-medal-desc">{a.desc}</span>
                <span className="profile-medal-foot">
                  {on ? (
                    <>
                      <Check aria-hidden="true" />
                      <span className="sr-only">Unlocked</span>
                      <span aria-hidden="true">{when ? when : 'Unlocked'}</span>
                    </>
                  ) : (
                    <>
                      <Gem aria-hidden="true" />
                      <span className="sr-only">Locked. Reward:</span>+{a.gems}
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        {ACHIEVEMENTS.length > MEDALS_PREVIEW && (
          <div className="profile-ach-more">
            <button type="button" className="btn btn-quiet btn-sm" aria-expanded={expanded} aria-controls="profile-medals" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Show fewer' : `Show all ${ACHIEVEMENTS.length}`}
              <ChevronDown className={expanded ? 'is-flipped' : undefined} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Shop ────────────────────────────────────────────────────────────────────

function Shop({ p }: { p: Progress }) {
  const full = p.streak.freezes >= GEMS.maxFreezes;
  const short = Math.max(0, GEMS.freezeCost - p.gems);
  return (
    <section aria-label="Shop">
      <SectionHeader title="Shop" sub="Spend the gems you earn from lessons, daily goals and achievements." />
      <div className="card pad-0 profile-shop">
        <div className="profile-shop-item">
          <IconTile icon={Snowflake} color="var(--gem)" size="lg" />
          <div className="profile-shop-text">
            <div className="profile-shop-name">
              <h3 className="card-title">Streak freeze</h3>
              <span className="profile-shop-price">
                <Gem aria-hidden="true" />
                {GEMS.freezeCost}
              </span>
            </div>
            <p>Protects your streak for one missed day. It is used automatically.</p>
          </div>
          <div className="profile-shop-owned">
            <div className="profile-slots" aria-hidden="true">
              {Array.from({ length: GEMS.maxFreezes }, (_, i) => (
                <span key={i} className={`profile-slot ${i < p.streak.freezes ? 'on' : ''}`}>
                  <Snowflake />
                </span>
              ))}
            </div>
            <span className="profile-shop-owned-k">
              {p.streak.freezes} of {GEMS.maxFreezes} equipped
            </span>
          </div>
          <button
            type="button"
            className={`btn ${full ? 'btn-secondary' : 'btn-primary'} profile-shop-buy`}
            disabled={p.gems < GEMS.freezeCost || full}
            onClick={() => buyFreeze()}
          >
            {full ? (
              <>
                <Check aria-hidden="true" />
                Fully stocked
              </>
            ) : (
              <>
                <Gem aria-hidden="true" />
                Buy for {GEMS.freezeCost}
              </>
            )}
          </button>
        </div>
        <div className="profile-shop-foot">
          <span>
            {full
              ? `You can hold up to ${GEMS.maxFreezes} freezes. One is used each time you miss a day.`
              : short > 0
                ? `You need ${plural(short, 'more gem')}. Finish a lesson or hit your daily goal to earn some.`
                : 'Holding a freeze means one missed day will not reset your streak.'}
          </span>
          <span className="profile-shop-balance">
            <Gem aria-hidden="true" />
            <span>
              Balance <strong>{fmt(p.gems)}</strong>
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────

function SettingsGroup({ title, desc, children, danger }: { title: string; desc: ReactNode; children: ReactNode; danger?: boolean }) {
  return (
    <div className="profile-group">
      <div className="profile-group-head">
        <h3 className={danger ? 'text-danger' : undefined}>{title}</h3>
        <p>{desc}</p>
      </div>
      <div className={`card pad-0 profile-form ${danger ? 'is-danger' : ''}`}>{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  desc,
  htmlFor,
  inline,
  stacked,
  id,
  children,
}: {
  label: ReactNode;
  desc?: ReactNode;
  htmlFor?: string;
  /** Keep the control beside the label at every width (toggles, small buttons). */
  inline?: boolean;
  /** Put the control under the label at every width (a list of options). */
  stacked?: boolean;
  /** Ids `${id}-label` and `${id}-desc`, for a control that names itself after the row. */
  id?: string;
  children: ReactNode;
}) {
  return (
    <div className={`profile-row ${inline ? 'is-inline' : ''} ${stacked ? 'is-stacked' : ''}`}>
      <div className="profile-row-text">
        {htmlFor ? (
          <label className="profile-row-label" htmlFor={htmlFor}>
            {label}
          </label>
        ) : (
          <div className="profile-row-label" id={id && `${id}-label`}>
            {label}
          </div>
        )}
        {desc && (
          <div className="profile-row-desc" id={id && `${id}-desc`}>
            {desc}
          </div>
        )}
      </div>
      <div className="profile-row-control">{children}</div>
    </div>
  );
}

const THEMES: { id: Progress['settings']['theme']; label: string; icon: LucideIcon }[] = [
  { id: 'system', label: 'System', icon: Monitor },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
];

/** "Code practice" (lib/input.ts): pick first, then type (recommended), always type, or always pick. */
const CODE_PRACTICE_ICON: Record<InputMode, LucideIcon> = { auto: Route, type: Keyboard, tap: List };

function CodePractice({ value }: { value: InputMode }) {
  return (
    <div className="profile-choices" role="radiogroup" aria-labelledby="code-practice-label" aria-describedby="code-practice-desc">
      {CODE_PRACTICE.map(({ id, label, sub, recommended }) => {
        const I = CODE_PRACTICE_ICON[id];
        const on = value === id;
        return (
          <label key={id} className={`profile-choice ${on ? 'on' : ''}`}>
            <input
              type="radio"
              name="code-practice"
              value={id}
              checked={on}
              onChange={() => updateSettings({ typingMode: id })}
              className="profile-choice-input"
            />
            <span className="profile-choice-icon" aria-hidden="true">
              <I />
            </span>
            <span className="profile-choice-text">
              <span className="profile-choice-title">
                {label}
                {recommended && <Badge tone="brand">Recommended</Badge>}
              </span>
              <span className="profile-choice-sub">{sub}</span>
            </span>
            <span className="profile-choice-radio" aria-hidden="true" />
          </label>
        );
      })}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export function Profile() {
  const p = useProgress();
  const learned = learnedIds(p).length;
  const mastered = Object.values(p.problems).filter((x) => crowns(x.srs) >= 5).length;
  const acc = p.stats.answered ? Math.round((p.stats.correct / p.stats.answered) * 100) : 0;
  const [confirmReset, setConfirmReset] = useState(false);
  const [importResult, setImportResult] = useState<'ok' | 'error' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const goal = DAILY_GOALS.find((g) => g.xp === p.settings.dailyGoal);
  const xpToday = p.xpByDay[today()] ?? 0;
  const streakMeta = practicedToday(p) ? 'Extended today' : p.streak.current > 0 ? 'Extend it today' : 'Start one today';

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `intprep-progress-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const closeReset = () => setConfirmReset(false);

  const editProfile = () => {
    settingsRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    nameRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="profile">
      <IdentityCard p={p} onEdit={editProfile} />

      <div className="profile-stats">
        <StatCard
          icon="flame"
          accent="var(--streak)"
          label="Current streak"
          value={
            <>
              {fmt(p.streak.current)}
              <span className="profile-unit">{p.streak.current === 1 ? 'day' : 'days'}</span>
            </>
          }
          meta={streakMeta}
        />
        <StatCard
          icon="trophy"
          label="Longest streak"
          value={
            <>
              {fmt(p.streak.longest)}
              <span className="profile-unit">{p.streak.longest === 1 ? 'day' : 'days'}</span>
            </>
          }
          meta={p.streak.longest > 0 ? 'Personal best' : 'No streak yet'}
        />
        <StatCard icon="star" accent="var(--xp)" label="Total XP" value={fmt(p.xp)} meta={xpToday ? `+${fmt(xpToday)} today` : 'None earned today'} />
        <StatCard
          icon="checks"
          label="Problems learned"
          value={
            <>
              {learned}
              <span className="profile-unit profile-of">/{PROBLEMS.length}</span>
            </>
          }
          meta={`${Math.round((learned / PROBLEMS.length) * 100)}% of the path`}
        />
        <StatCard icon="sparkles" label="Mastered" value={fmt(mastered)} meta={learned ? `Of ${fmt(learned)} learned` : 'None learned yet'} />
        <StatCard
          icon="target"
          label="Practice accuracy"
          value={p.stats.answered ? `${acc}%` : '—'}
          meta={p.stats.answered ? `${fmt(p.stats.correct)}/${fmt(p.stats.answered)} right first try` : 'No answers yet'}
        />
        <StatCard
          icon="blitz"
          label="Pattern Blitz best"
          value={p.stats.blitzBest ? fmt(p.stats.blitzBest) : '—'}
          meta={p.stats.blitzPlays ? `${fmt(p.stats.blitzPlays)} timed round${p.stats.blitzPlays === 1 ? '' : 's'}` : 'No timed rounds yet'}
        />
        <StatCard
          icon="keyboard"
          label="Key lines best"
          value={p.stats.blitzCodeBest ? fmt(p.stats.blitzCodeBest) : '—'}
          meta={p.stats.blitzCodePlays ? `${fmt(p.stats.blitzCodePlays)} timed round${p.stats.blitzCodePlays === 1 ? '' : 's'}` : 'No timed rounds yet'}
        />
      </div>

      <section aria-label="Activity">
        <SectionHeader title="Activity" />
        <div className="profile-activity">
          <PracticeCalendar p={p} />
          <WeekChart p={p} />
        </div>
      </section>

      <Achievements p={p} />

      <Shop p={p} />

      <section ref={settingsRef} className="profile-settings" aria-label="Settings">
        <SectionHeader title="Settings" sub="Changes are saved automatically in this browser." />
        <div className="profile-groups">
          <SettingsGroup title="Profile" desc="How IntPrep greets you.">
            <SettingRow label="Display name" desc="Shown on your dashboard and profile." htmlFor="profile-name">
              <input
                id="profile-name"
                ref={nameRef}
                className="input profile-name-input"
                value={p.settings.name}
                maxLength={30}
                placeholder="What should we call you?"
                autoComplete="nickname"
                onChange={(e) => updateSettings({ name: e.target.value })}
              />
            </SettingRow>
          </SettingsGroup>

          <SettingsGroup title="Practice" desc="Set your daily target and how you practice code.">
            <SettingRow label="Daily goal" desc={goal ? `XP per day, about ${goal.blurb.replace('≈', '').replace('a day', '').trim()} of practice.` : 'XP to earn each day.'}>
              <div className="seg profile-seg profile-seg-4" role="radiogroup" aria-label="Daily goal">
                {DAILY_GOALS.map((g) => (
                  <button
                    key={g.xp}
                    type="button"
                    role="radio"
                    aria-checked={p.settings.dailyGoal === g.xp}
                    className={p.settings.dailyGoal === g.xp ? 'on' : ''}
                    onClick={() => updateSettings({ dailyGoal: g.xp })}
                  >
                    {g.label}
                    <span className="profile-seg-sub">{g.xp}</span>
                  </button>
                ))}
              </div>
            </SettingRow>
            <SettingRow id="code-practice" stacked label="Code practice" desc="New code starts as choices. Typing takes over once you know it.">
              <CodePractice value={p.settings.typingMode} />
            </SettingRow>
          </SettingsGroup>

          <SettingsGroup title="Appearance" desc="Choose a theme or follow your device.">
            <SettingRow label="Theme" desc="System matches your device's light or dark setting.">
              <div className="seg profile-seg" role="radiogroup" aria-label="Theme">
                {THEMES.map(({ id, label, icon: I }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={p.settings.theme === id}
                    className={p.settings.theme === id ? 'on' : ''}
                    onClick={() => updateSettings({ theme: id })}
                  >
                    <I aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </SettingRow>
          </SettingsGroup>

          <SettingsGroup title="Sound and haptics" desc="Feedback when you answer, level up or hit a goal.">
            <SettingRow label="Sound effects" desc="Short synthesized tones for answers and milestones." inline>
              <Toggle on={p.settings.sound} onChange={(v) => updateSettings({ sound: v })} label="Sound effects" />
            </SettingRow>
            <SettingRow label="Vibration" desc="Haptic feedback on phones that support it." inline>
              <Toggle on={p.settings.haptics} onChange={(v) => updateSettings({ haptics: v })} label="Vibration" />
            </SettingRow>
          </SettingsGroup>
        </div>
      </section>

      <section className="profile-data" aria-label="Your data">
        <SectionHeader title="Your data" sub="Progress lives in this browser only. Export a backup to move it to another device." />
        <div className="profile-groups">
          <SettingsGroup title="Backup" desc="A JSON file with your full progress.">
            <SettingRow label="Export backup" desc="Download everything: XP, streak, gems, achievements and review schedule." inline>
              <button type="button" className="btn btn-secondary btn-sm" onClick={download}>
                <Download aria-hidden="true" />
                Export
              </button>
            </SettingRow>
            <SettingRow label="Import backup" desc="Restore from a backup file. This replaces the progress in this browser." inline>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                <Upload aria-hidden="true" />
                Import
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setImportResult(importProgress(await f.text()) ? 'ok' : 'error');
                  e.target.value = '';
                }}
              />
            </SettingRow>
            <div className="profile-row-note" role="status">
              {importResult &&
                (importResult === 'ok' ? (
                  <div className="callout callout-success">
                    <CircleCheck aria-hidden="true" />
                    Progress imported.
                  </div>
                ) : (
                  <div className="callout callout-danger">
                    <CircleAlert aria-hidden="true" />
                    That file is not an IntPrep backup.
                  </div>
                ))}
            </div>
          </SettingsGroup>

          <SettingsGroup title="Danger zone" desc="Actions here cannot be undone." danger>
            <SettingRow label="Reset all progress" desc="Delete your XP, streak, gems, achievements and review schedule from this browser." inline>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmReset(true)}>
                <RotateCcw aria-hidden="true" />
                Reset
              </button>
            </SettingRow>
          </SettingsGroup>
        </div>
      </section>

      <Link to="/science" className="card card-interactive profile-science">
        <IconTile icon={FlaskConical} />
        <span className="grow">
          <span className="profile-science-title">How IntPrep uses learning science</span>
          <span className="profile-science-sub">The research behind spaced reviews, retrieval drills and forgiving streaks.</span>
        </span>
        <ChevronRight className="profile-science-chevron" aria-hidden="true" />
      </Link>

      {confirmReset && (
        <Modal onClose={closeReset} labelledBy="profile-reset-title">
          <div className="profile-modal">
            <IconTile icon={TriangleAlert} color="var(--danger)" />
            <div className="grow">
              <h2 id="profile-reset-title" className="modal-title">
                Reset all progress?
              </h2>
              <p className="text-secondary">
                This deletes your XP, streak, gems, achievements and review schedule from this browser. It cannot be undone.
              </p>
              <p className="text-sm text-tertiary">Export a backup first if you might want this progress later.</p>
            </div>
          </div>
          <div className="modal-actions">
            {/* Focus the safe choice when the dialog opens. */}
            <button type="button" className="btn btn-secondary" onClick={closeReset} autoFocus>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
              }}
            >
              Reset everything
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
