// ⌘K / Ctrl+K command palette: jump to any page, pattern or problem.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search } from 'lucide-react';
import { CATEGORIES } from '../content/categories';
import { PROBLEMS } from '../content/index';
import { CATEGORY_ICON, ICONS, type LucideIcon } from './icons';
import { DifficultyChip } from './ui';
import type { Difficulty } from '../content/types';

type Item = {
  id: string;
  group: 'Pages' | 'Patterns' | 'Problems';
  label: string;
  hint?: string;
  to: string;
  icon: LucideIcon;
  difficulty?: Difficulty;
  haystack: string;
};

const PAGES: { label: string; to: string; icon: LucideIcon; hint?: string }[] = [
  { label: 'Dashboard', to: '/', icon: ICONS.dashboard },
  { label: 'Learning path', to: '/learn', icon: ICONS.learn },
  { label: 'Daily review', to: '/review', icon: ICONS.review },
  { label: 'Pattern Blitz', to: '/blitz', icon: ICONS.blitz },
  { label: 'Problem library', to: '/problems', icon: ICONS.list },
  { label: 'Pattern guide', to: '/patterns', icon: ICONS.book },
  { label: 'Profile & settings', to: '/profile', icon: ICONS.user },
  { label: 'Learning science', to: '/science', icon: ICONS.flask },
];

let openFn: (() => void) | null = null;
export function openCommandPalette() {
  openFn?.();
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const nav = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    openFn = () => {
      setQ('');
      setActive(0);
      setOpen(true);
    };
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        setQ('');
        setActive(0);
      }
    };
    window.addEventListener('keydown', h);
    return () => {
      window.removeEventListener('keydown', h);
      openFn = null;
    };
  }, []);

  const all = useMemo<Item[]>(
    () => [
      ...PAGES.map((p) => ({ id: `page:${p.to}`, group: 'Pages' as const, label: p.label, to: p.to, icon: p.icon, haystack: p.label.toLowerCase() })),
      ...CATEGORIES.map((c) => ({
        id: `cat:${c.id}`,
        group: 'Patterns' as const,
        label: c.name,
        hint: `${c.problemIds.length} problems`,
        to: `/unit/${c.id}`,
        icon: CATEGORY_ICON[c.id],
        haystack: `${c.name} ${c.short} ${c.tagline}`.toLowerCase(),
      })),
      ...PROBLEMS.map((p) => ({
        id: `p:${p.id}`,
        group: 'Problems' as const,
        label: p.title,
        hint: `#${p.num}`,
        to: `/p/${p.id}`,
        icon: CATEGORY_ICON[p.category],
        difficulty: p.difficulty,
        haystack: `${p.title} ${p.num} ${p.pattern} ${p.id}`.toLowerCase(),
      })),
    ],
    [],
  );

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return all.filter((i) => i.group !== 'Problems').concat(all.filter((i) => i.group === 'Problems').slice(0, 6));
    const terms = needle.split(/\s+/);
    return all
      .filter((i) => terms.every((t) => i.haystack.includes(t)))
      .sort((a, b) => Number(b.label.toLowerCase().startsWith(needle)) - Number(a.label.toLowerCase().startsWith(needle)))
      .slice(0, 40);
  }, [q, all]);

  useEffect(() => {
    listRef.current?.querySelector('.cmdk-item.active')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const go = (i: Item | undefined) => {
    if (!i) return;
    setOpen(false);
    nav(i.to);
  };

  let lastGroup = '';
  return (
    <div className="cmdk-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Search">
        <div className="cmdk-input">
          <Search />
          <input
            autoFocus
            placeholder="Search problems, patterns and pages…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(results.length - 1, a + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                go(results[active]);
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
            aria-label="Search"
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="cmdk-list" ref={listRef}>
          {results.length === 0 && <div className="cmdk-empty">No results for “{q}”.</div>}
          {results.map((r, idx) => {
            const header = r.group !== lastGroup ? <div className="cmdk-group">{r.group}</div> : null;
            lastGroup = r.group;
            const I = r.icon;
            return (
              <div key={r.id}>
                {header}
                <button type="button" className={`cmdk-item ${idx === active ? 'active' : ''}`} onMouseMove={() => setActive(idx)} onClick={() => go(r)}>
                  <I />
                  <span className="truncate">{r.label}</span>
                  <span className="cmdk-meta">
                    {r.difficulty && <DifficultyChip d={r.difficulty} />}
                    {r.hint}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        <div className="cmdk-foot">
          <span>
            <span className="kbd">↑</span>
            <span className="kbd">↓</span> Navigate
          </span>
          <span>
            <span className="kbd">
              <CornerDownLeft size={11} />
            </span>{' '}
            Open
          </span>
        </div>
      </div>
    </div>
  );
}
