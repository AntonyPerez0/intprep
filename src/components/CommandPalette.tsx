// ⌘K / Ctrl+K command palette: jump to any page, pattern or problem.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search, X } from 'lucide-react';
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

const GROUP_ORDER: Record<Item['group'], number> = { Pages: 0, Patterns: 1, Problems: 2 };

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
  const dialogRef = useRef<HTMLDivElement>(null);
  // The control that opened the palette gets focus back when it closes.
  const openerRef = useRef<HTMLElement | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    openFn = () => {
      if (!openRef.current) openerRef.current = document.activeElement as HTMLElement | null;
      setQ('');
      setActive(0);
      setOpen(true);
    };
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!openRef.current) openerRef.current = document.activeElement as HTMLElement | null;
        setOpen(!openRef.current);
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
    const prefix = (i: Item) => Number(i.label.toLowerCase().startsWith(needle));
    // One block per group (Pages, Patterns, Problems); prefix matches first within each.
    return all
      .filter((i) => terms.every((t) => i.haystack.includes(t)))
      .sort((a, b) => GROUP_ORDER[a.group] - GROUP_ORDER[b.group] || prefix(b) - prefix(a))
      .slice(0, 40);
  }, [q, all]);

  useEffect(() => {
    listRef.current?.querySelector('.cmdk-item.active')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  // Modal behaviour: Escape closes from anywhere, Tab stays inside, focus returns on close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      const box = dialogRef.current;
      if (e.key !== 'Tab' || !box) return;
      // Results are options reached with the arrow keys, so Tab only cycles the input and
      // the Close button (when shown).
      const stops = Array.from(box.querySelectorAll<HTMLElement>('input, .cmdk-close')).filter((el) => el.offsetParent !== null);
      e.preventDefault();
      if (!stops.length) return;
      const at = stops.indexOf(document.activeElement as HTMLElement);
      const next = at === -1 ? 0 : (at + (e.shiftKey ? -1 : 1) + stops.length) % stops.length;
      stops[next].focus();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      const opener = openerRef.current;
      openerRef.current = null;
      if (opener && opener !== document.body && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  const go = (i: Item | undefined) => {
    if (!i) return;
    openerRef.current = null; // the new page takes focus, not the opener
    setOpen(false);
    nav(i.to);
  };

  // Group the (already group-ordered) results, keeping each item's index for `active`.
  const groups: { name: Item['group']; items: { item: Item; idx: number }[] }[] = [];
  results.forEach((item, idx) => {
    const g = groups[groups.length - 1];
    if (g && g.name === item.group) g.items.push({ item, idx });
    else groups.push({ name: item.group, items: [{ item, idx }] });
  });

  return (
    <div
      className="cmdk-backdrop"
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        // Keep the browser's own mousedown focus change from undoing the focus restore on close.
        e.preventDefault();
        setOpen(false);
      }}
    >
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Search" ref={dialogRef}>
        <div className="cmdk-input">
          <Search aria-hidden="true" />
          <input
            autoFocus
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-autocomplete="list"
            aria-activedescendant={results.length ? `cmdk-opt-${active}` : undefined}
            placeholder="Search problems and patterns"
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
              }
            }}
            aria-label="Search"
          />
          <span className="kbd" aria-hidden="true">
            Esc
          </span>
          <button type="button" className="icon-btn cmdk-close" aria-label="Close" onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="cmdk-list" ref={listRef} id="cmdk-list" role="listbox" aria-label="Results">
          {results.length === 0 && (
            <div className="cmdk-empty" role="presentation">
              No results for “{q}”.
            </div>
          )}
          {groups.map((g) => (
            <div key={g.name} role="group" aria-labelledby={`cmdk-group-${g.name}`}>
              <div className="cmdk-group" id={`cmdk-group-${g.name}`} role="presentation">
                {g.name}
              </div>
              {g.items.map(({ item: r, idx }) => {
                const I = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    id={`cmdk-opt-${idx}`}
                    role="option"
                    aria-selected={idx === active}
                    tabIndex={-1}
                    className={`cmdk-item ${idx === active ? 'active' : ''}`}
                    onMouseMove={() => setActive(idx)}
                    onClick={() => go(r)}
                  >
                    <I aria-hidden="true" />
                    <span className="truncate">{r.label}</span>
                    <span className="cmdk-meta">
                      {r.difficulty && <DifficultyChip d={r.difficulty} />}
                      {r.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="cmdk-foot" aria-hidden="true">
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
