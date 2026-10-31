import { useEffect, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GEMS, levelInfo } from '../lib/game';
import { dueProblemIds, practicedToday, useProgress, xpToday } from '../lib/store';
import { lastNDays, today, weekdayShort } from '../lib/date';
import { Icon, Logo, ProgressBar, Ring } from './ui';
import { Onboarding } from '../pages/Onboarding';

const NAV = [
  { to: '/', icon: 'home', label: 'Home', end: true },
  { to: '/learn', icon: 'learn', label: 'Learn' },
  { to: '/review', icon: 'review', label: 'Review' },
  { to: '/blitz', icon: 'bolt', label: 'Blitz' },
  { to: '/patterns', icon: 'book', label: 'Patterns' },
  { to: '/problems', icon: 'list', label: 'Problems' },
  { to: '/profile', icon: 'user', label: 'Profile' },
  { to: '/science', icon: 'flask', label: 'The science' },
];
const TABS = ['/', '/learn', '/review', '/blitz', '/profile'];

export function StreakStat() {
  const p = useProgress();
  const hot = practicedToday(p);
  return (
    <span className={`pill-stat ${hot ? '' : 'cold'}`} title={hot ? 'Streak extended today' : 'Practice today to extend your streak'} style={{ color: 'var(--orange)' }}>
      <span className="em">🔥</span>
      {p.streak.current}
    </span>
  );
}

export function GemStat() {
  const p = useProgress();
  return (
    <span className="pill-stat" style={{ color: 'var(--blue)' }} title="Gems">
      <span className="em">💎</span>
      {p.gems}
    </span>
  );
}

export function GoalRing({ size = 34 }: { size?: number }) {
  const p = useProgress();
  const x = xpToday(p);
  const done = x >= p.settings.dailyGoal;
  return (
    <span title={`Daily goal: ${x}/${p.settings.dailyGoal} XP`}>
      <Ring value={x / p.settings.dailyGoal} size={size} stroke={5} color={done ? 'var(--green)' : 'var(--gold)'}>
        <span style={{ fontSize: size < 40 ? '0.7rem' : undefined }}>{done ? '✓' : '⚡'}</span>
      </Ring>
    </span>
  );
}

function Rail() {
  const p = useProgress();
  const x = xpToday(p);
  const lv = levelInfo(p.xp);
  const days = lastNDays(7);
  return (
    <aside className="rail">
      <div className="row between card flat" style={{ padding: '12px 16px' }}>
        <StreakStat />
        <GemStat />
        <span className="pill-stat" style={{ color: 'var(--brand)' }}>
          <span className="em">⭐</span>
          Lv {lv.level}
        </span>
      </div>
      <div className="card flat">
        <div className="row between">
          <div className="card-title">Daily goal</div>
          <span className="small muted">
            {x}/{p.settings.dailyGoal} XP
          </span>
        </div>
        <ProgressBar value={x / p.settings.dailyGoal} thin color="var(--gold)" />
        <div className="week" style={{ marginTop: 14 }}>
          {days.map((d) => {
            const done = (p.xpByDay[d] ?? 0) > 0;
            const frozen = p.streak.frozenDays.includes(d);
            return (
              <div key={d}>
                <div className="d">{weekdayShort(d)}</div>
                <div className={`dot ${done ? 'done' : ''} ${frozen ? 'frozen' : ''} ${d === today() ? 'today' : ''}`}>
                  {done ? '🔥' : frozen ? '🧊' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="card flat small">
        <div className="card-title">🧊 Streak freezes: {p.streak.freezes}/{GEMS.maxFreezes}</div>
        <div className="muted">A freeze protects your streak on a day you miss. Get more in your profile for {GEMS.freezeCost} 💎.</div>
      </div>
      <div className="card flat small">
        <div className="card-title">💡 Tip</div>
        <div className="muted">
          Short daily sessions beat weekend cramming. Spaced review is what moves problems from "I've seen this" to "I can solve this".
        </div>
      </div>
    </aside>
  );
}

export function AppShell() {
  const p = useProgress();
  const due = dueProblemIds(p).length;
  const loc = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  return (
    <div className="app">
      <nav className="sidebar" aria-label="Main">
        <Logo />
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon name={n.icon} />
            {n.label}
            {n.to === '/review' && due > 0 && <span className="badge">{due}</span>}
          </NavLink>
        ))}
        <div className="spacer" />
        <div className="tiny faint" style={{ padding: '0 10px' }}>
          Progress is saved in this browser.
        </div>
      </nav>

      <header className="topbar">
        <Logo />
        <div className="stats">
          <StreakStat />
          <GemStat />
          <GoalRing />
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <Rail />

      <nav className="tabbar" aria-label="Tabs">
        {NAV.filter((n) => TABS.includes(n.to)).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
            <Icon name={n.icon} size={24} />
            {n.label}
            {n.to === '/review' && due > 0 && <span className="badge">{due}</span>}
          </NavLink>
        ))}
      </nav>
      {!p.onboarded && <Onboarding />}
    </div>
  );
}

/** Full-screen focus mode for lessons and drills (no navigation distractions). */
export function SessionShell({
  progress,
  children,
  right,
  onClose,
}: {
  progress: number;
  children: ReactNode;
  right?: ReactNode;
  onClose?: () => void;
}) {
  const nav = useNavigate();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="session">
      <div className="session-head">
        <button
          type="button"
          className="icon-btn"
          aria-label="Close"
          onClick={() => {
            if (onClose) onClose();
            else if (window.history.length > 1) nav(-1);
            else nav('/');
          }}
        >
          <Icon name="x" size={26} stroke={3} />
        </button>
        <ProgressBar value={progress} />
        {right}
      </div>
      <div className="session-body">{children}</div>
    </div>
  );
}

export function PageHeader({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="row between wrap" style={{ marginBottom: 18, alignItems: 'flex-end' }}>
      <div className="grow">
        <h1 style={{ marginBottom: 4 }}>{title}</h1>
        {sub && <div className="muted">{sub}</div>}
      </div>
      {right}
    </div>
  );
}
