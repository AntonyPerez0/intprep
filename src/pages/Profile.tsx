import '../styles/pages/profile.css';
import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Download,
  FlaskConical,
  Gem,
  Keyboard,
  Lock,
  Monitor,
  Moon,
  Pencil,
  Pointer,
  RotateCcw,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  TriangleAlert,
  Upload,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { PROBLEMS } from '../content/index';
import { addDays, lastNDays, parseDay, today } from '../lib/date';
import { ACHIEVEMENTS, DAILY_GOALS, GEMS, levelInfo, levelTitle } from '../lib/game';
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
            Level {lv.level}
          </span>
          <span className="profile-level-nums">
            <strong>{fmt(lv.into)}</strong> / {fmt(lv.cost)} XP
          </span>
        </div>
        <ProgressBar value={lv.pct} large label={`Progress to level ${lv.level + 1}`} />
        <div className="profile-level-bottom">
          <span>
            {fmt(lv.cost - lv.into)} XP to level {lv.level + 1}
          </span>
          {nextTitle !== title && (
            <span className="profile-level-next">
              Next title: {nextTitle} at level {nextTitleLevel}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Activity: practice calendar ─────────────────────────────────────────────

const DAY_COL = 28;
const GAP = 3;
const MIN_CELL = 15;
const MAX_CELL = 18;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function heatLevel(xp: number, goal: number) {
  if (xp <= 0) return 0;
  if (xp < goal / 2) return 1;
  if (xp < goal) return 2;
  if (xp < goal * 2) return 3;
  return 4;
}

function PracticeCalendar({ p }: { p: Progress }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const avail = Math.max(0, width - DAY_COL - GAP);
  const weeks = width ? Math.max(12, Math.min(53, Math.floor((avail + GAP) / (MIN_CELL + GAP)))) : 18;
  const cell = width ? Math.min(MAX_CELL, Math.floor(((avail + GAP) / weeks - GAP) * 10) / 10) : 12;

  const t = today();
  const start = addDays(t, -parseDay(t).getDay() - 7 * (weeks - 1));
  const cols = Array.from({ length: weeks }, (_, c) => Array.from({ length: 7 }, (_, r) => addDays(start, c * 7 + r)));
  const monthOf = (k: number) => parseDay(cols[k][0]).getMonth();
  const changes = (k: number) => k > 0 && k < weeks && monthOf(k) !== monthOf(k - 1);
  const months = cols.map((col, c) => {
    const show = c === 0 ? !changes(1) && !changes(2) : changes(c);
    return show ? parseDay(col[0]).toLocaleDateString(undefined, { month: 'short' }) : '';
  });

  const frozen = new Set(p.streak.frozenDays);
  const inWindow = cols.flat().filter((d) => d <= t);
  const active = inWindow.filter((d) => (p.xpByDay[d] ?? 0) > 0).length;
  const anyFrozen = inWindow.some((d) => frozen.has(d) && !(p.xpByDay[d] ?? 0));
  const label = (d: string) => parseDay(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <section className="card profile-card profile-cal" aria-labelledby="profile-cal-title">
      <div className="profile-card-head">
        <div>
          <h3 id="profile-cal-title" className="card-title">
            Practice calendar
          </h3>
          <div className="card-subtitle">
            {active ? `${plural(active, 'active day')} in the last ${weeks} weeks` : `No practice yet in the last ${weeks} weeks`}
          </div>
        </div>
      </div>

      <div ref={ref} className="profile-heat-wrap">
        <div
          className="profile-heat"
          role="img"
          aria-label={`Practice calendar for the last ${weeks} weeks: ${plural(active, 'active day')}`}
          style={{ gridTemplateColumns: `${DAY_COL}px repeat(${weeks}, ${cell}px)`, gridTemplateRows: `16px repeat(7, ${cell}px)` }}
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
                return (
                  <span
                    key={d}
                    className={`profile-heat-cell ${isFrozen ? 'is-frozen' : ''} ${d === t ? 'is-today' : ''}`}
                    data-l={heatLevel(xp, p.settings.dailyGoal)}
                    title={`${label(d)} · ${isFrozen ? 'Streak freeze used' : xp ? `${fmt(xp)} XP` : 'No practice'}`}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="profile-card-foot">
        <span>Each square is one day, shaded by XP earned.</span>
        <span className="profile-legend" aria-hidden="true">
          <span className="profile-legend-word">Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className="profile-heat-cell" data-l={l} />
          ))}
          <span className="profile-legend-word">More</span>
          {anyFrozen && (
            <>
              <span className="profile-heat-cell is-frozen profile-legend-gap" />
              <span className="profile-legend-word">Freeze</span>
            </>
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
          <span className="profile-week-total-k">XP this week</span>
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
          <span className="profile-key is-met" />
          <span className="profile-legend-word">Goal met</span>
          <span className="profile-key profile-legend-gap" />
          <span className="profile-legend-word">Below goal</span>
          <span className="profile-key-line profile-legend-gap" />
          <span className="profile-legend-word">Goal · {goal} XP</span>
        </span>
      </div>
    </section>
  );
}

// ── Achievements ────────────────────────────────────────────────────────────

function Achievements({ p }: { p: Progress }) {
  const unlocked = ACHIEVEMENTS.filter((a) => p.achievements[a.id]).length;
  return (
    <section aria-label="Achievements">
      <SectionHeader
        title="Achievements"
        sub={`${unlocked} of ${ACHIEVEMENTS.length} unlocked`}
        right={
          <div className="profile-ach-meter">
            <ProgressBar value={unlocked / ACHIEVEMENTS.length} label="Achievements unlocked" />
            <span className="tabular">{Math.round((unlocked / ACHIEVEMENTS.length) * 100)}%</span>
          </div>
        }
      />
      <ul className="profile-medals">
        {ACHIEVEMENTS.map((a) => {
          const at = p.achievements[a.id];
          const on = Boolean(at);
          const I = (ICONS as Record<string, LucideIcon>)[a.icon] ?? ICONS.award;
          // Real unlocks store a timestamp; very old/placeholder values are shown without a date.
          const when = on && at > 1e12 ? new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          return (
            <li
              key={a.id}
              className={`profile-medal ${on ? 'is-on' : 'is-locked'}`}
              title={on ? `${a.title}: ${a.desc}${when ? ` · unlocked ${when}` : ''}` : `${a.title}: ${a.desc} · reward ${a.gems} gems`}
            >
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
    </section>
  );
}

// ── Shop ────────────────────────────────────────────────────────────────────

function Shop({ p }: { p: Progress }) {
  const full = p.streak.freezes >= GEMS.maxFreezes;
  const short = Math.max(0, GEMS.freezeCost - p.gems);
  return (
    <section aria-label="Shop">
      <SectionHeader
        title="Shop"
        sub="Spend the gems you earn from lessons, daily goals and achievements."
        right={
          <span className="pill-stat gem" aria-label={`Balance: ${p.gems} gems`}>
            <Gem strokeWidth={2} aria-hidden="true" />
            {fmt(p.gems)}
          </span>
        }
      />
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
          {full
            ? `You can hold up to ${GEMS.maxFreezes} freezes. One is used each time you miss a day.`
            : short > 0
              ? `You need ${plural(short, 'more gem')}. Finish a lesson or hit your daily goal to earn some.`
              : 'Holding a freeze means one missed day will not reset your streak.'}
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
  children,
}: {
  label: ReactNode;
  desc?: ReactNode;
  htmlFor?: string;
  /** Keep the control beside the label at every width (toggles, small buttons). */
  inline?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`profile-row ${inline ? 'is-inline' : ''}`}>
      <div className="profile-row-text">
        {htmlFor ? (
          <label className="profile-row-label" htmlFor={htmlFor}>
            {label}
          </label>
        ) : (
          <div className="profile-row-label">{label}</div>
        )}
        {desc && <div className="profile-row-desc">{desc}</div>}
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

const INPUT_MODES: { id: Progress['settings']['typingMode']; label: string; icon: LucideIcon }[] = [
  { id: 'auto', label: 'Auto', icon: Sparkles },
  { id: 'type', label: 'Always type', icon: Keyboard },
  { id: 'tap', label: 'Always tap', icon: Pointer },
];

// ── Page ────────────────────────────────────────────────────────────────────

export function Profile() {
  const p = useProgress();
  const lv = levelInfo(p.xp);
  const learned = learnedIds(p).length;
  const mastered = Object.values(p.problems).filter((x) => crowns(x.srs) >= 5).length;
  const acc = p.stats.answered ? Math.round((p.stats.correct / p.stats.answered) * 100) : 0;
  const [confirmReset, setConfirmReset] = useState(false);
  const [importResult, setImportResult] = useState<'ok' | 'error' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const goal = DAILY_GOALS.find((g) => g.xp === p.settings.dailyGoal);

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `intprep-progress-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

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
          meta={practicedToday(p) ? 'Extended today' : 'Keep it going today'}
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
          meta="Personal best"
        />
        <StatCard icon="star" accent="var(--xp)" label="Total XP" value={fmt(p.xp)} meta={`Level ${lv.level}`} />
        <StatCard
          icon="checks"
          label="Learned"
          value={
            <>
              {learned}
              <span className="profile-unit">/ {PROBLEMS.length}</span>
            </>
          }
          meta={`${Math.round((learned / PROBLEMS.length) * 100)}% of the curriculum`}
        />
        <StatCard icon="crown" label="Mastered" value={fmt(mastered)} meta="At full mastery" />
        <StatCard
          icon="target"
          label="Drill accuracy"
          value={p.stats.answered ? `${acc}%` : '—'}
          meta={p.stats.answered ? `${fmt(p.stats.correct)} of ${fmt(p.stats.answered)} correct` : 'No drills answered yet'}
        />
      </div>

      <section aria-label="Activity">
        <SectionHeader title="Activity" sub="Your practice over time." />
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

          <SettingsGroup title="Practice" desc="Set your daily target and how code drills take input.">
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
            <SettingRow label="Code-drill input" desc="Auto types on a computer and taps choices on a phone. Typing is harder and builds stronger memory.">
              <div className="seg profile-seg profile-seg-compact" role="radiogroup" aria-label="Code-drill input">
                {INPUT_MODES.map(({ id, label, icon: I }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={p.settings.typingMode === id}
                    className={p.settings.typingMode === id ? 'on' : ''}
                    onClick={() => updateSettings({ typingMode: id })}
                  >
                    <I aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
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
            {importResult && (
              <div className="profile-row-note" role="status">
                {importResult === 'ok' ? (
                  <div className="callout callout-success">
                    <CircleCheck aria-hidden="true" />
                    Progress imported.
                  </div>
                ) : (
                  <div className="callout profile-callout-danger">
                    <CircleAlert aria-hidden="true" />
                    That file is not an IntPrep backup.
                  </div>
                )}
              </div>
            )}
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
        <Modal onClose={() => setConfirmReset(false)} labelledBy="profile-reset-title">
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
            <button type="button" className="btn btn-secondary" onClick={() => setConfirmReset(false)}>
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
