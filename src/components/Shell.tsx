import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { levelInfo, levelTitle } from '../lib/game';
import { dueProblemIds, practicedToday, useProgress, xpToday } from '../lib/store';
import { CommandPalette, openCommandPalette } from './CommandPalette';
import { ICONS, type LucideIcon } from './icons';
import { Logo, ProgressBar, Ring } from './ui';

export { PageHeader } from './ui';

type NavItem = { to: string; icon: LucideIcon; label: string; end?: boolean; badge?: 'due' };

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: 'Learn',
    items: [
      { to: '/', icon: ICONS.dashboard, label: 'Dashboard', end: true },
      { to: '/learn', icon: ICONS.learn, label: 'Learning path' },
      { to: '/problems', icon: ICONS.list, label: 'Problem library' },
      { to: '/patterns', icon: ICONS.book, label: 'Pattern guide' },
    ],
  },
  {
    label: 'Practice',
    items: [
      { to: '/review', icon: ICONS.review, label: 'Daily review', badge: 'due' },
      { to: '/blitz', icon: ICONS.blitz, label: 'Pattern Blitz' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/profile', icon: ICONS.user, label: 'Profile & settings' },
      { to: '/science', icon: ICONS.flask, label: 'Learning science' },
    ],
  },
];

const TABS: NavItem[] = [
  { to: '/', icon: ICONS.home, label: 'Home', end: true },
  { to: '/learn', icon: ICONS.learn, label: 'Learn' },
  { to: '/review', icon: ICONS.review, label: 'Review', badge: 'due' },
  { to: '/blitz', icon: ICONS.blitz, label: 'Blitz' },
  { to: '/profile', icon: ICONS.user, label: 'Profile' },
];

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

// ── Status pills ────────────────────────────────────────────────────────────
// role="img" so the aria-label is announced (it is ignored on a plain <span>).

export function StreakStat() {
  const p = useProgress();
  const hot = practicedToday(p);
  const Flame = ICONS.flame;
  return (
    <span
      className={`pill-stat streak ${hot ? '' : 'cold'}`}
      role="img"
      title={hot ? `${p.streak.current}-day streak — extended today` : `${p.streak.current}-day streak — practice today to extend it`}
      aria-label={`${p.streak.current} day streak`}
    >
      <Flame strokeWidth={2} aria-hidden="true" />
      {p.streak.current}
    </span>
  );
}

export function GemStat() {
  const p = useProgress();
  const Gem = ICONS.gem;
  return (
    <span className="pill-stat gem" role="img" title="Gems — spend them on streak freezes" aria-label={`${p.gems} gems`}>
      <Gem strokeWidth={2} aria-hidden="true" />
      {p.gems}
    </span>
  );
}

export function GoalRing({ size = 30 }: { size?: number }) {
  const p = useProgress();
  const x = xpToday(p);
  const done = x >= p.settings.dailyGoal;
  return (
    <span role="img" title={`Daily goal: ${x}/${p.settings.dailyGoal} XP`} aria-label={`Daily goal ${x} of ${p.settings.dailyGoal} XP`}>
      <Ring value={x / p.settings.dailyGoal} size={size} stroke={3.5} color={done ? 'var(--success)' : 'var(--brand)'} />
    </span>
  );
}

function Avatar() {
  const p = useProgress();
  const name = p.settings.name.trim();
  const initials = name ? name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '';
  const User = ICONS.user;
  return (
    <Link to="/profile" className="avatar" aria-label="Profile" title={name || 'Profile'} style={{ textDecoration: 'none' }}>
      {initials || <User size={16} />}
    </Link>
  );
}

function SidebarGoal() {
  const p = useProgress();
  const x = xpToday(p);
  const lv = levelInfo(p.xp);
  const done = x >= p.settings.dailyGoal;
  return (
    <div className="sidebar-card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <span className="text-sm fw-600">Daily goal</span>
        <span className="text-xs text-tertiary tabular">
          {Math.min(x, p.settings.dailyGoal)}/{p.settings.dailyGoal} XP
        </span>
      </div>
      <ProgressBar value={x / p.settings.dailyGoal} color={done ? 'var(--success)' : undefined} label="Daily goal" />
      <div className="text-xs text-tertiary" style={{ marginTop: 10 }}>
        Level {lv.level} · {levelTitle(lv.level)}
      </div>
    </div>
  );
}

// ── App shell ───────────────────────────────────────────────────────────────

export function AppShell() {
  const p = useProgress();
  const due = dueProblemIds(p).length;
  const loc = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Layout effect: resets scroll before pages' own effects run (hash deep links).
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const Search_ = ICONS.search;
  return (
    <div className="app">
      <a
        className="skip-link btn btn-secondary"
        href="#main"
        onClick={(e) => {
          // The hash router would treat #main as a route: move focus instead.
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <nav className="sidebar" aria-label="Main">
        <Logo />
        <button type="button" className="search-trigger" onClick={openCommandPalette}>
          <Search_ aria-hidden="true" />
          Search
          <span className="kbd" aria-hidden="true">
            {IS_MAC ? '⌘K' : 'Ctrl K'}
          </span>
        </button>
        {NAV.map((g) => (
          <div className="nav-group" key={g.label}>
            <div className="nav-group-label">{g.label}</div>
            {g.items.map((n) => {
              const I = n.icon;
              return (
                <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <I />
                  {n.label}
                  {n.badge === 'due' && due > 0 && <span className="badge-count">{due}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
        <div className="spacer" />
        <SidebarGoal />
      </nav>

      <div className="main-col">
        <header className="topbar">
          <Logo />
          <div className="stats">
            <StreakStat />
            <GemStat />
            <button type="button" className="icon-btn" aria-label="Search" onClick={openCommandPalette}>
              <Search size={19} />
            </button>
          </div>
        </header>

        <div className={`deskbar ${scrolled ? 'scrolled' : ''}`}>
          <StreakStat />
          <GemStat />
          <Avatar />
        </div>

        <main className="main" id="main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <nav className="tabbar" aria-label="Tabs">
        {TABS.map((n) => {
          const I = n.icon;
          return (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
              <I strokeWidth={1.9} />
              {n.label}
              {n.badge === 'due' && due > 0 && <span className="badge-count">{due}</span>}
            </NavLink>
          );
        })}
      </nav>
      <CommandPalette />
    </div>
  );
}

/** Full-screen focus mode for lessons and drills (no navigation distractions). */
export function SessionShell({
  progress,
  children,
  right,
  onClose,
  title,
  progressColor,
  progressLinear,
}: {
  /** 0–1. Pass null to hide the bar (e.g. a lobby before a session starts). */
  progress: number | null;
  children: ReactNode;
  right?: ReactNode;
  onClose?: () => void;
  /** Optional short label shown next to the close button (desktop). */
  title?: ReactNode;
  /** Color for the progress bar, e.g. a countdown entering its warning zone. */
  progressColor?: string;
  /** Move the bar linearly, for a timer that updates many times a second. */
  progressLinear?: boolean;
}) {
  const nav = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useActionBarHeight(rootRef);
  return (
    <div className="session" ref={rootRef}>
      <header className="session-head">
        <div className="session-head-inner">
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
            <X size={20} />
          </button>
          {title && <span className="session-title">{title}</span>}
          {progress === null ? <div className="grow" /> : <ProgressBar value={progress} color={progressColor} linear={progressLinear} label="Progress" />}
          {right}
        </div>
      </header>
      <main className="session-body">{children}</main>
    </div>
  );
}

/**
 * Publishes the height of the session's fixed `.actionbar` (whichever one is mounted: the shared
 * <ActionBar> or a page's own) as `--actionbar-h` on <html>, so `.session-body` and
 * scroll-padding can clear it as it grows with feedback.
 */
function useActionBarHeight(rootRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const html = document.documentElement;
    let bar: HTMLElement | null = null;
    const publish = () => {
      if (bar) html.style.setProperty('--actionbar-h', `${Math.ceil(bar.offsetHeight)}px`);
      else html.style.removeProperty('--actionbar-h');
    };
    const ro = new ResizeObserver(publish);
    const sync = () => {
      const next = root.querySelector<HTMLElement>('.actionbar');
      if (next === bar) return;
      if (bar) ro.unobserve(bar);
      bar = next;
      if (bar) ro.observe(bar);
      publish();
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      ro.disconnect();
      html.style.removeProperty('--actionbar-h');
    };
  }, [rootRef]);
}
