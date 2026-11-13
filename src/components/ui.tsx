import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Difficulty } from '../content/types';
import { onToast, type Toast } from '../lib/events';
import { Icon as RegistryIcon, IconTile, ICONS, type IconName, type LucideIcon } from './icons';
import { Confetti, Pip, type PipMood } from './Mascot';

// ── Icons ───────────────────────────────────────────────────────────────────

/** Back-compat wrapper: <Icon name="x" size={20} stroke={2} />. Prefer icons.tsx. */
export function Icon({ name, size = 16, stroke }: { name: IconName | string; size?: number; stroke?: number }) {
  return <RegistryIcon name={name} size={size} strokeWidth={stroke ? Math.min(stroke, 2.25) : 1.75} />;
}

// ── Brand ───────────────────────────────────────────────────────────────────

/** The brand mark: Pip (a keycap with a face) on a sunflower sticker. Same colors in both themes. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#ffc83d" stroke="#1e1b16" strokeWidth="2" />
      <rect x="6" y="9.5" width="20" height="17" rx="5" fill="#62c987" stroke="#1e1b16" strokeWidth="1.8" />
      <rect x="7.5" y="5.5" width="17" height="16" rx="4.5" fill="#9be7b4" stroke="#1e1b16" strokeWidth="1.8" />
      <circle cx="12.7" cy="12.6" r="2.5" fill="#fff" />
      <circle cx="19.3" cy="12.6" r="2.5" fill="#fff" />
      <circle cx="13.1" cy="13" r="1.35" fill="#1e1b16" />
      <circle cx="18.9" cy="13" r="1.35" fill="#1e1b16" />
      <path d="M14 16.7q2 1.7 4 0" fill="none" stroke="#1e1b16" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link className="logo" to={to} aria-label="IntPrep home">
      <LogoMark />
      <span>IntPrep</span>
    </Link>
  );
}

// ── Progress ────────────────────────────────────────────────────────────────

/** `linear` suits a countdown that updates every ~100ms: the fill moves steadily instead of easing in steps. */
export function ProgressBar({
  value,
  thin,
  large,
  color,
  label,
  linear,
}: {
  value: number;
  thin?: boolean;
  large?: boolean;
  color?: string;
  label?: string;
  linear?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`progress ${thin ? 'thin' : ''} ${large ? 'lg' : ''} ${linear ? 'linear' : ''}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function Ring({
  value,
  size = 44,
  stroke = 5,
  color = 'var(--brand)',
  track = 'var(--border)',
  instant,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  /** Skip the easing transition (for values that update many times a second). */
  instant?: boolean;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: instant ? 'none' : 'stroke-dashoffset .6s var(--ease)' }}
        />
      </svg>
      {children !== undefined && <div className="ring-label">{children}</div>}
    </div>
  );
}

// ── Badges & meters ─────────────────────────────────────────────────────────

export function Badge({ tone = 'neutral', children, dot, pill }: { tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'; children: ReactNode; dot?: boolean; pill?: boolean }) {
  return <span className={`badge ${tone === 'neutral' ? '' : `badge-${tone}`} ${dot ? 'badge-dot' : ''} ${pill ? 'badge-pill' : ''}`}>{children}</span>;
}

export function DifficultyChip({ d }: { d: Difficulty }) {
  return <span className={`chip ${d.toLowerCase()}`}>{d}</span>;
}

/** Mastery 0–5 as a signal-strength meter. (Name kept for compatibility.) */
export function Crowns({ n, max = 5 }: { n: number; max?: number }) {
  return (
    <span className="mastery" role="img" aria-label={`Mastery ${n} of ${max}`} title={`Mastery ${n}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? 'on' : ''} />
      ))}
    </span>
  );
}
export const Mastery = Crowns;

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" className={`toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

// ── Layout pieces ───────────────────────────────────────────────────────────

export function PageHeader({
  title,
  sub,
  right,
  back,
  eyebrow,
}: {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  back?: { to: string; label: string };
  eyebrow?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="ph-text">
        {back && (
          <Link to={back.to} className="back-link">
            <RegistryIcon name="back" /> {back.label}
          </Link>
        )}
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
        <h1>{title}</h1>
        {sub && <div className="ph-sub">{sub}</div>}
      </div>
      {right && <div className="row wrap">{right}</div>}
    </header>
  );
}

export function SectionHeader({ title, sub, right, id }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; id?: string }) {
  return (
    <div className="section-title">
      <div>
        <h2 id={id}>{title}</h2>
        {sub && <div className="text-sm text-tertiary" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export function StatCard({ icon, label, value, meta, accent }: { icon?: IconName; label: ReactNode; value: ReactNode; meta?: ReactNode; accent?: string }) {
  return (
    <div className="card pad-sm stat">
      <div className="stat-label">
        {icon && <RegistryIcon name={icon} style={accent ? { color: accent } : undefined} />}
        {label}
      </div>
      <div className="stat-value">{value}</div>
      {meta && <div className="stat-meta">{meta}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  actions,
  level = 2,
  pip,
}: {
  icon: LucideIcon;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  /** Heading level of the title: 2 under a page h1 (default), 3 inside an h2 section. */
  level?: 2 | 3;
  /** Show Pip in this mood instead of the icon tile (only where no other Pip is on screen). */
  pip?: PipMood;
}) {
  const H = level === 3 ? 'h3' : 'h2';
  return (
    <div className="empty">
      {pip ? <Pip size={88} mood={pip} /> : <IconTile icon={icon} size="lg" />}
      <H className="empty-title">{title}</H>
      {children && <p>{children}</p>}
      {actions && <div className="row wrap" style={{ justifyContent: 'center', marginTop: 8 }}>{actions}</div>}
    </div>
  );
}

/** Shared end-of-session screen. */
export function Completion({
  icon,
  tone = 'brand',
  title,
  subtitle,
  stats,
  children,
}: {
  icon: LucideIcon;
  tone?: 'brand' | 'success' | 'warning' | 'streak';
  title: ReactNode;
  subtitle?: ReactNode;
  stats?: { label: ReactNode; value: ReactNode }[];
  children?: ReactNode;
}) {
  const color = { brand: 'var(--brand)', success: 'var(--success)', warning: 'var(--warning)', streak: 'var(--streak)' }[tone];
  return (
    <div className="complete">
      {tone !== 'warning' && <Confetti />}
      <div className="complete-icon">
        <Pip size={132} mood={tone === 'warning' ? 'think' : 'cheer'} />
        <IconTile icon={icon} size="lg" color={color} solid />
      </div>
      <h1>{title}</h1>
      {subtitle && <div className="lead">{subtitle}</div>}
      {stats && stats.length > 0 && (
        <div className="reward-tiles" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))` }}>
          {stats.map((s, i) => (
            <div className="reward" key={i}>
              <div className="rk">{s.label}</div>
              <div className="rv">{s.value}</div>
            </div>
          ))}
        </div>
      )}
      {children && <div className="complete-actions">{children}</div>}
    </div>
  );
}

// ── Overlays ────────────────────────────────────────────────────────────────

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Accessible dialog: Escape and backdrop close it, Tab stays inside, focus returns on close. */
export function Modal({ children, onClose, labelledBy }: { children: ReactNode; onClose?: () => void; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // Record the opener during the first render: React applies a child's autoFocus at commit,
  // before effects run, so reading document.activeElement in the effect would see the dialog's
  // own control instead of the button that opened it.
  const [opener] = useState(() => document.activeElement as HTMLElement | null);

  useEffect(() => {
    const box = ref.current;
    // Respect an autoFocus inside the dialog; otherwise focus its first control.
    if (box && !box.contains(document.activeElement)) {
      (box.querySelector<HTMLElement>(FOCUSABLE) ?? box).focus();
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeRef.current?.();
        return;
      }
      if (e.key !== 'Tab' || !box) return;
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !box.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !box.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [opener]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

const NARROW = '(max-width: 1023px)';
function subscribeNarrow(cb: () => void) {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const isNarrow = () => window.matchMedia(NARROW).matches;

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  // Phones and tablets show toasts at the top, where a stack would cover page titles:
  // show only the newest there, with a count of the others.
  const narrow = useSyncExternalStore(subscribeNarrow, isNarrow, () => false);
  useEffect(
    () =>
      onToast((t) => {
        setItems((xs) => [...xs.slice(-2), t]);
        setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), isNarrow() ? 3200 : 4200);
      }),
    [],
  );
  const shown = narrow ? items.slice(-1) : items;
  const more = items.length - shown.length;
  return (
    <div className="toasts" aria-live="polite">
      {shown.map((t) => {
        const C = (ICONS as Record<string, LucideIcon>)[t.icon] ?? ICONS.info;
        return (
          <div
            key={t.id}
            className={`toast ${t.tone ?? ''}`}
            onClick={() => setItems((xs) => (narrow ? [] : xs.filter((x) => x.id !== t.id)))}
          >
            <div className="t-icon">
              <C strokeWidth={2} />
            </div>
            <div className="grow">
              <div className="t-title">{t.title}</div>
              {t.body && <div className="t-body">{t.body}</div>}
            </div>
            {more > 0 && <span className="t-more tabular">+{more}</span>}
          </div>
        );
      })}
    </div>
  );
}

// ── Links ───────────────────────────────────────────────────────────────────

export function leetcodeUrl(slug: string) {
  return `https://leetcode.com/problems/${slug}/`;
}

// LeetCode Premium problems have free equivalents on NeetCode under different names.
const FREE_MIRROR: Record<string, string> = {
  'encode-and-decode-strings': 'string-encode-and-decode',
  'walls-and-gates': 'islands-and-treasure',
  'graph-valid-tree': 'valid-tree',
  'number-of-connected-components-in-an-undirected-graph': 'count-connected-components',
  'alien-dictionary': 'foreign-dictionary',
  'meeting-rooms': 'meeting-schedule',
  'meeting-rooms-ii': 'meeting-schedule-ii',
};

/** Free practice link for a LeetCode Premium problem. */
export function freeMirrorUrl(slug: string) {
  return `https://neetcode.io/problems/${FREE_MIRROR[slug] ?? slug}`;
}
