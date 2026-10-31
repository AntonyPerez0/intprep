import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../content/categories';
import { guideFor, problemsFor } from '../content/index';
import { HighlightedCode } from '../lib/highlight';
import { inline, Md } from '../lib/markdown';
import { PageHeader } from '../components/Shell';

export function Patterns() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const cues = useMemo(
    () =>
      CATEGORIES.flatMap((c) => {
        const g = guideFor(c.id);
        return g ? g.whenToUse.map((w) => ({ cat: c, cue: w })) : [];
      }),
    [],
  );
  const needle = q.trim().toLowerCase();
  const matches = needle ? cues.filter((x) => x.cue.toLowerCase().includes(needle) || x.cat.name.toLowerCase().includes(needle)) : [];

  return (
    <div>
      <PageHeader title="Pattern cheat sheet" sub="If you see this… reach for that. Every pattern with its recognition cues and a reusable template." />
      <input className="input" placeholder="Search cues: “sorted”, “subarray”, “top k”, “shortest path”…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 16 }} />
      {needle && (
        <div className="list" style={{ marginBottom: 20 }}>
          {matches.length === 0 && <div className="list-row muted">No cues match “{q}”.</div>}
          {matches.map((m, i) => (
            <a key={i} href={`#pat-${m.cat.id}`} className="list-row" onClick={() => setOpen(m.cat.id)}>
              <span style={{ fontSize: '1.3rem' }}>{m.cat.icon}</span>
              <div className="grow small">{inline(m.cue)}</div>
              <span className="chip" style={{ color: m.cat.color }}>
                {m.cat.short}
              </span>
            </a>
          ))}
        </div>
      )}
      <div className="stack">
        {CATEGORIES.map((c) => {
          const g = guideFor(c.id);
          const isOpen = open === c.id;
          return (
            <div key={c.id} id={`pat-${c.id}`} className="card" style={{ borderLeft: `6px solid ${c.color}` }}>
              <button
                type="button"
                className="row"
                style={{ width: '100%', background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }}
                onClick={() => setOpen(isOpen ? null : c.id)}
                aria-expanded={isOpen}
              >
                <span style={{ fontSize: '1.8rem' }}>{c.icon}</span>
                <div className="grow">
                  <div className="card-title" style={{ margin: 0 }}>
                    {c.name}
                  </div>
                  <div className="small muted">{c.tagline}</div>
                </div>
                <span className="faint">{isOpen ? '－' : '＋'}</span>
              </button>
              {isOpen && g && (
                <div className="stack" style={{ marginTop: 14 }}>
                  <div>
                    <div className="kicker">Reach for it when…</div>
                    <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
                      {g.whenToUse.map((w, i) => (
                        <li key={i}>{inline(w)}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="small muted">🧠 {inline(g.analogy)}</div>
                  <div>
                    <div className="kicker">Template</div>
                    <HighlightedCode code={g.template} />
                  </div>
                  <Md text={g.templateNotes.map((n) => `- ${n}`).join('\n')} className="small" />
                  <div className="small">
                    <strong>Typical cost:</strong> {g.complexity}
                  </div>
                  <div className="row wrap" style={{ gap: 6 }}>
                    {problemsFor(c.id).map((p) => (
                      <Link key={p.id} to={`/p/${p.id}`} className="chip">
                        {p.title}
                      </Link>
                    ))}
                  </div>
                  <div className="row wrap">
                    <Link to={`/unit/${c.id}/intro`} className="btn btn-blue btn-sm">
                      Pattern lesson
                    </Link>
                    <Link to={`/unit/${c.id}`} className="btn btn-ghost btn-sm">
                      Unit page
                    </Link>
                  </div>
                </div>
              )}
              {isOpen && !g && <div className="small muted" style={{ marginTop: 10 }}>Guide coming soon.</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
