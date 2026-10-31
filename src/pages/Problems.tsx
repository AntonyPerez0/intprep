import '../styles/pages/problems.css';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, FilterX, Layers, RotateCcw, Search, SearchX, X } from 'lucide-react';
import { CATEGORIES, CATEGORY_BY_ID } from '../content/categories';
import { PROBLEMS } from '../content/index';
import type { CategoryId, Difficulty } from '../content/types';
import { CROWN_LABELS, crowns, isDue } from '../lib/srs';
import { useProgress } from '../lib/store';
import { PageHeader } from '../components/Shell';
import { CATEGORY_ICON, CategoryIcon } from '../components/icons';
import { Crowns, DifficultyChip, EmptyState, ProgressBar } from '../components/ui';

type Status = 'all' | 'new' | 'learned' | 'due';

const DIFFS = ['all', 'Easy', 'Medium', 'Hard'] as const;
const STATUSES: { id: Status; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'learned', label: 'Learned' },
  { id: 'due', label: 'Due' },
];

export function Problems() {
  const p = useProgress();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [diff, setDiff] = useState<Difficulty | 'all'>('all');
  const [status, setStatus] = useState<Status>('all');

  // Everything except the status filter, so the status control can show live counts.
  const base = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PROBLEMS.filter((x) => {
      if (cat !== 'all' && x.category !== cat) return false;
      if (diff !== 'all' && x.difficulty !== diff) return false;
      if (needle && !`${x.title} ${x.num} ${x.pattern}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [q, cat, diff]);

  const statusOf = (id: string) => {
    const pp = p.problems[id];
    const learned = !!pp?.learnedAt;
    const due = learned && !!pp?.srs && isDue(pp.srs);
    return { pp, learned, due };
  };

  const counts = useMemo(() => {
    const c = { all: base.length, new: 0, learned: 0, due: 0 };
    for (const x of base) {
      const pp = p.problems[x.id];
      const learned = !!pp?.learnedAt;
      if (learned) c.learned++;
      else c.new++;
      if (pp?.srs && isDue(pp.srs)) c.due++;
    }
    return c;
  }, [base, p]);

  const rows = useMemo(
    () =>
      base.filter((x) => {
        const pp = p.problems[x.id];
        const learned = !!pp?.learnedAt;
        if (status === 'new' && learned) return false;
        if (status === 'learned' && !learned) return false;
        if (status === 'due' && !(pp?.srs && isDue(pp.srs))) return false;
        return true;
      }),
    [base, p, status],
  );

  const learnedCount = PROBLEMS.filter((x) => p.problems[x.id]?.learnedAt).length;
  const dueCount = PROBLEMS.filter((x) => {
    const pp = p.problems[x.id];
    return pp?.learnedAt && pp.srs && isDue(pp.srs);
  }).length;
  const strongCount = PROBLEMS.filter((x) => p.problems[x.id]?.learnedAt && crowns(p.problems[x.id]?.srs) >= 4).length;

  const filtered = q.trim() !== '' || cat !== 'all' || diff !== 'all' || status !== 'all';
  const clear = () => {
    setQ('');
    setCat('all');
    setDiff('all');
    setStatus('all');
  };
  const SelIcon = cat === 'all' ? Layers : CATEGORY_ICON[cat];

  return (
    <div className="problems">
      <PageHeader
        title="Problem library"
        sub={`The ${PROBLEMS.length} classic interview problems, organised by the ${CATEGORIES.length} patterns that solve them.`}
        right={
          <div className="problems-summary" aria-label="Your progress">
            <div className="problems-summary-item problems-summary-progress">
              <div className="problems-summary-k">Learned</div>
              <div className="problems-summary-v tabular">
                {learnedCount}
                <span>/{PROBLEMS.length}</span>
              </div>
              <ProgressBar value={learnedCount / PROBLEMS.length} thin label="Problems learned" />
            </div>
            <div className="problems-summary-item">
              <div className="problems-summary-k">Due now</div>
              <div className="problems-summary-v tabular">{dueCount}</div>
            </div>
            <div className="problems-summary-item">
              <div className="problems-summary-k">Strong</div>
              <div className="problems-summary-v tabular">{strongCount}</div>
            </div>
          </div>
        }
      />

      <div className="problems-toolbar">
        <div className="input-group problems-search">
          <Search aria-hidden="true" />
          <input
            className="input"
            type="search"
            placeholder="Search title, number or technique"
            aria-label="Search problems"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button type="button" className="problems-search-clear" aria-label="Clear search" onClick={() => setQ('')}>
              <X />
            </button>
          )}
        </div>

        <label className="problems-select">
          <span className="sr-only">Pattern</span>
          <SelIcon className="problems-select-icon" aria-hidden="true" style={cat === 'all' ? undefined : { color: CATEGORY_BY_ID[cat].color }} />
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value as CategoryId | 'all')}>
            <option value="all">All patterns</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="problems-select-chev" aria-hidden="true" />
        </label>

        <div className="seg problems-seg" role="group" aria-label="Difficulty">
          {DIFFS.map((d) => (
            <button key={d} type="button" className={diff === d ? 'on' : ''} aria-pressed={diff === d} onClick={() => setDiff(d)}>
              {d !== 'all' && <span className={`problems-diff-dot ${d.toLowerCase()}`} aria-hidden="true" />}
              {d === 'all' ? 'Any level' : d}
            </button>
          ))}
        </div>
      </div>

      <section className="problems-table" aria-label="Problems">
        <div className="problems-table-bar">
          <div className="seg problems-seg problems-status-seg" role="group" aria-label="Status">
            {STATUSES.map((s) => (
              <button key={s.id} type="button" className={status === s.id ? 'on' : ''} aria-pressed={status === s.id} onClick={() => setStatus(s.id)}>
                {s.label}
                <span className="problems-seg-count tabular">{counts[s.id]}</span>
              </button>
            ))}
          </div>
          <div className="problems-table-count">
            <span className="text-sm text-secondary" aria-live="polite">
              {rows.length === PROBLEMS.length ? (
                <>
                  <strong className="tabular">{rows.length}</strong> problems
                </>
              ) : (
                <>
                  <strong className="tabular">{rows.length}</strong> of <span className="tabular">{PROBLEMS.length}</span>
                </>
              )}
            </span>
            {filtered && (
              <button type="button" className="btn btn-quiet btn-sm" onClick={clear}>
                <FilterX />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No problems match"
            actions={
              <button type="button" className="btn btn-secondary btn-sm" onClick={clear}>
                <FilterX />
                Clear filters
              </button>
            }
          >
            {q.trim() ? (
              <>Nothing matches “{q.trim()}” with the current filters. Try a shorter search or widen the filters.</>
            ) : (
              <>No problem fits this combination of filters yet. Widen the filters to see more.</>
            )}
          </EmptyState>
        ) : (
          <>
            <div className="problems-thead" aria-hidden="true">
              <span />
              <span>Problem</span>
              <span className="problems-th-tech">Technique</span>
              <span>Pattern</span>
              <span>Difficulty</span>
              <span>Mastery</span>
            </div>
            <ul className="problems-rows" role="list">
              {rows.map((x) => {
                const { pp, learned, due } = statusOf(x.id);
                const c = CATEGORY_BY_ID[x.category];
                const n = learned ? crowns(pp?.srs) : 0;
                const statusLabel = due ? 'Due for review' : learned ? 'Learned' : 'Not started';
                return (
                  <li key={x.id}>
                    <Link to={`/p/${x.id}`} className="problems-row">
                      <span className={`problems-status status-dot ${due ? 'due' : learned ? 'learned' : ''}`} title={statusLabel}>
                        {due ? <RotateCcw strokeWidth={2.5} aria-hidden="true" /> : learned ? <Check strokeWidth={3} aria-hidden="true" /> : null}
                        <span className="sr-only">{statusLabel}</span>
                      </span>
                      <span className="problems-title">
                        <span className="problems-title-text">{x.title}</span>
                        <span className="problems-num tabular">#{x.num}</span>
                      </span>
                      <span className="problems-meta">
                        <span className="truncate">{x.pattern}</span>
                        <span className="problems-meta-cat" style={{ ['--c' as string]: c.color }}>
                          {c.short}
                        </span>
                      </span>
                      <span className="problems-tech">{x.pattern}</span>
                      <span className="problems-cat">
                        <CategoryIcon id={c.id} color={c.color} size="sm" />
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="problems-diff">
                        <DifficultyChip d={x.difficulty} />
                      </span>
                      <span className="problems-mastery">
                        {learned ? (
                          <>
                            <Crowns n={n} />
                            <span className="problems-mastery-label">{CROWN_LABELS[n]}</span>
                          </>
                        ) : (
                          <span className="problems-mastery-none">—</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
