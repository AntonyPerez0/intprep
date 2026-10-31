import { Link, Navigate, useParams } from 'react-router-dom';
import { CATEGORY_BY_ID } from '../content/categories';
import { PROBLEM_BY_ID, PROBLEMS } from '../content/index';
import { friendlyDue } from '../lib/date';
import { highlightLine } from '../lib/highlight';
import { inline, Md } from '../lib/markdown';
import { parseSolution } from '../lib/parseSolution';
import { CROWN_LABELS, crowns } from '../lib/srs';
import { useProgress } from '../lib/store';
import { ProblemPrompt } from '../components/interact';
import { Crowns, DifficultyChip, freeMirrorUrl, Icon, leetcodeUrl } from '../components/ui';

export function ProblemDetail() {
  const { id } = useParams();
  const p = id ? PROBLEM_BY_ID[id] : undefined;
  const progress = useProgress();
  if (!p) return <Navigate to="/problems" replace />;
  const cat = CATEGORY_BY_ID[p.category];
  const pp = progress.problems[p.id];
  const learned = !!pp?.learnedAt;
  const parsed = parseSolution(p.solution);
  const idx = PROBLEMS.findIndex((q) => q.id === p.id);
  const prev = PROBLEMS[idx - 1];
  const next = PROBLEMS[idx + 1];

  return (
    <div className="stack" style={{ gap: 16 }}>
      <Link to={`/unit/${cat.id}`} className="small" style={{ fontWeight: 800 }}>
        ← {cat.icon} {cat.name}
      </Link>
      <div>
        <h1 style={{ marginBottom: 6 }}>
          {p.title} <span className="faint" style={{ fontSize: '1rem' }}>#{p.num}</span>
        </h1>
        <div className="row wrap" style={{ gap: 6 }}>
          <DifficultyChip d={p.difficulty} />
          <span className="chip brand">{p.pattern}</span>
          {p.premium && <span className="chip">LeetCode Premium</span>}
        </div>
      </div>

      {learned && pp?.srs && (
        <div className="card flat row wrap between">
          <div className="row">
            <Crowns n={crowns(pp.srs)} />
            <strong>{CROWN_LABELS[crowns(pp.srs)]}</strong>
          </div>
          <div className="small muted">
            Next review {friendlyDue(pp.srs.due)} · {pp.reviews} review{pp.reviews === 1 ? '' : 's'}
            {pp.rebuildBest !== undefined ? ` · best rebuild ${Math.round(pp.rebuildBest * 100)}%` : ''}
          </div>
        </div>
      )}

      <div className="row wrap">
        <Link to={`/p/${p.id}/learn`} className="btn btn-green">
          {learned ? 'Replay lesson' : 'Start guided lesson'}
        </Link>
        <Link to={`/p/${p.id}/rebuild`} className="btn btn-blue">
          ⌨️ Code from memory
        </Link>
        <a className="btn btn-ghost" href={p.premium ? freeMirrorUrl(p.id) : leetcodeUrl(p.id)} target="_blank" rel="noreferrer">
          {p.premium ? 'Practise free' : 'LeetCode'} <Icon name="external" size={16} />
        </a>
      </div>

      <ProblemPrompt p={p} showTitle={false} />

      <div className="card">
        <div className="kicker">Clues in the wording</div>
        <div className="row wrap" style={{ gap: 6 }}>
          {p.signals.map((s, i) => (
            <span key={i} className="chip signal">
              {inline(s)}
            </span>
          ))}
        </div>
      </div>

      {!learned && (
        <div className="hint-box small">
          Tip: try the guided lesson first. The sections below give the answer away — and recalling beats rereading.
        </div>
      )}

      <details className="disclosure">
        <summary>💡 Key insight</summary>
        <div className="insight-card">
          <Md text={p.insight} />
          <div className="mnemonic">🧠 {p.mnemonic}</div>
        </div>
      </details>

      <details className="disclosure">
        <summary>🪜 The plan</summary>
        <ol className="steps-list">
          {p.steps.map((s, i) => (
            <li key={i}>
              <span>{inline(s)}</span>
            </li>
          ))}
        </ol>
      </details>

      <details className="disclosure">
        <summary>🧑‍💻 Annotated solution (Python)</summary>
        <div className="stack">
          {parsed.chunks.map((c, i) => (
            <div key={i}>
              <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>
                {c.keyLines.length > 0 && <span style={{ color: 'var(--gold)' }}>★ </span>}
                {inline(c.explain)}
              </div>
              <pre className="code">
                {c.lines.map((l, j) => (
                  <div key={j} className={`code-line ${c.keyLines.includes(j) ? 'key' : ''}`}>
                    {l === '' ? ' ' : highlightLine(l)}
                  </div>
                ))}
              </pre>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => navigator.clipboard?.writeText(parsed.code)}>
            Copy code
          </button>
        </div>
      </details>

      <details className="disclosure">
        <summary>⏱️ Complexity &amp; traps</summary>
        <p>
          <strong>Time</strong> {p.time} · <strong>Space</strong> {p.space}
        </p>
        <Md text={p.complexityWhy} />
        <div className="stack" style={{ marginTop: 10 }}>
          {p.pitfalls.map((x, i) => (
            <div key={i} className="hint-box small">
              ⚠️ {inline(x)}
            </div>
          ))}
        </div>
        <div className="small muted" style={{ marginTop: 10 }}>
          <strong>Brute force:</strong> {inline(p.brute)}
        </div>
      </details>

      <div className="row between" style={{ marginTop: 10 }}>
        {prev ? (
          <Link to={`/p/${prev.id}`} className="small" style={{ fontWeight: 800 }}>
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/p/${next.id}`} className="small" style={{ fontWeight: 800, textAlign: 'right' }}>
            {next.title} →
          </Link>
        )}
      </div>
    </div>
  );
}
