import { useEffect, useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Difficulty } from '../content/types';
import { onToast, type Toast } from '../lib/events';
import { Icon as RegistryIcon, IconTile, ICONS, type IconName, type LucideIcon } from './icons';

// ── Icons ───────────────────────────────────────────────────────────────────

/** Back-compat wrapper: <Icon name="x" size={20} stroke={2} />. Prefer icons.tsx. */
export function Icon({ name, size = 16, stroke }: { name: IconName | string; size?: number; stroke?: number }) {
  return <RegistryIcon name={name} size={size} strokeWidth={stroke ? Math.min(stroke, 2.25) : 1.75} />;
}

// ── Brand ───────────────────────────────────────────────────────────────────

export function LogoMark({ size = 28 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id={`lg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#lg${id})`} />
      <path d="M9.5 21.5 16 10.5l6.5 11" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d="M9.5 21.5h13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
      <circle cx="9.5" cy="21.5" r="2.7" fill="#fff" />
      <circle cx="16" cy="10.5" r="2.7" fill="#fff" />
      <circle cx="22.5" cy="21.5" r="2.7" fill="#fff" />
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

export function ProgressBar({ value, thin, large, color, label }: { value: number; thin?: boolean; large?: boolean; color?: string; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`progress ${thin ? 'thin' : ''} ${large ? 'lg' : ''}`}
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
  track = 'var(--surface-active)',
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
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
          style={{ transition: 'stroke-dashoffset .6s var(--ease)' }}
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

export function SectionHeader({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
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

export function EmptyState({ icon, title, children, actions }: { icon: LucideIcon; title: ReactNode; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="empty">
      <IconTile icon={icon} size="lg" />
      <h3>{title}</h3>
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
      <div className="complete-icon">
        <IconTile icon={icon} size="xl" color={color} solid />
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

export function Modal({ children, onClose, labelledBy }: { children: ReactNode; onClose?: () => void; labelledBy?: string }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </div>
  );
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(
    () =>
      onToast((t) => {
        setItems((xs) => [...xs.slice(-2), t]);
        setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), 4200);
      }),
    [],
  );
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => {
        const C = (ICONS as Record<string, LucideIcon>)[t.icon] ?? ICONS.info;
        return (
          <div key={t.id} className={`toast ${t.tone ?? ''}`} onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}>
            <div className="t-icon">
              <C strokeWidth={2} />
            </div>
            <div className="grow">
              <div className="t-title">{t.title}</div>
              {t.body && <div className="t-body">{t.body}</div>}
            </div>
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
