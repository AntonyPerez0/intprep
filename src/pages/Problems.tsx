import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, CATEGORY_BY_ID } from '../content/categories';
import { PROBLEMS } from '../content/index';
import type { CategoryId, Difficulty } from '../content/types';
import { crowns, isDue } from '../lib/srs';
import { useProgress } from '../lib/store';
import { PageHeader } from '../components/Shell';
import { Crowns, DifficultyChip } from '../components/ui';

type Status = 'all' | 'new' | 'learned' | 'due';

export function Problems() {
  const p = useProgress();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [diff, setDiff] = useState<Difficulty | 'all'>('all');
  const [status, setStatus] = useState<Status>('all');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return PROBLEMS.filter((x) => {
      const pp = p.problems[x.id];
      const learned = !!pp?.learnedAt;
      if (cat !== 'all' && x.category !== cat) return false;
      if (diff !== 'all' && x.difficulty !== diff) return false;
      if (status === 'new' && learned) return false;
      if (status === 'learned' && !learned) return false;
      if (status === 'due' && !(pp?.srs && isDue(pp.srs))) return false;
      if (needle && !(`${x.title} ${x.num} ${x.pattern}`.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [p, q, cat, diff, status]);

  const learnedCount = PROBLEMS.filter((x) => p.problems[x.id]?.learnedAt).length;

  return (
    <div>
      <PageHeader title="All problems" sub={`${learnedCount} of ${PROBLEMS.length} learned`} />
      <input className="input" placeholder="Search by name, number or technique…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 12 }} />
      <div className="filters">
        <select className="input" style={{ width: 'auto', padding: '6px 10px' }} value={cat} onChange={(e) => setCat(e.target.value as CategoryId | 'all')}>
          <option value="all">All patterns</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <div className="seg">
          {(['all', 'Easy', 'Medium', 'Hard'] as const).map((d) => (
            <button key={d} type="button" className={diff === d ? 'on' : ''} onClick={() => setDiff(d)}>
              {d === 'all' ? 'Any' : d}
            </button>
          ))}
        </div>
        <div className="seg">
          {(['all', 'new', 'learned', 'due'] as const).map((s) => (
            <button key={s} type="button" className={status === s ? 'on' : ''} onClick={() => setStatus(s)}>
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="list">
        {rows.length === 0 && <div className="list-row muted">No problems match these filters.</div>}
        {rows.map((x) => {
          const pp = p.problems[x.id];
          const learned = !!pp?.learnedAt;
          const due = learned && pp?.srs && isDue(pp.srs);
          return (
            <Link key={x.id} to={`/p/${x.id}`} className="list-row">
              <span className={`status-dot ${due ? 'due' : learned ? 'learned' : ''}`}>{due ? '↻' : learned ? '✓' : ''}</span>
              <div className="grow">
                <div className="title">
                  {x.title} <span className="faint tiny">#{x.num}</span>
                </div>
                <div className="tiny muted">
                  {CATEGORY_BY_ID[x.category].icon} {x.pattern}
                </div>
              </div>
              {learned && <Crowns n={crowns(pp?.srs)} />}
              <DifficultyChip d={x.difficulty} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
