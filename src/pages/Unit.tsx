import { Link, Navigate, useParams } from 'react-router-dom';
import { CATEGORY_BY_ID } from '../content/categories';
import { guideFor, problemsFor } from '../content/index';
import type { CategoryId } from '../content/types';
import { friendlyDue } from '../lib/date';
import { HighlightedCode } from '../lib/highlight';
import { inline, Md } from '../lib/markdown';
import { unitProgress } from '../lib/path';
import { crowns, isDue } from '../lib/srs';
import { useProgress } from '../lib/store';
import { Crowns, DifficultyChip, Icon, ProgressBar } from '../components/ui';

export function Unit() {
  const { cat } = useParams();
  const p = useProgress();
  const meta = CATEGORY_BY_ID[cat as CategoryId];
  if (!meta) return <Navigate to="/learn" replace />;
  const guide = guideFor(meta.id);
  const problems = problemsFor(meta.id);
  const u = unitProgress(p, meta.id);
  const learnedHere = problems.filter((q) => p.problems[q.id]?.learnedAt).length;
  const firstTodo = problems.find((q) => !p.problems[q.id]?.learnedAt);

  return (
    <div className="stack" style={{ gap: 18 }}>
      <Link to="/learn" className="small" style={{ fontWeight: 800 }}>
        ← Learning path
      </Link>
      <div className="unit-banner" style={{ ['--c' as string]: meta.color }}>
        <span className="ub-icon">{meta.icon}</span>
        <div className="grow">
          <div className="ub-title" style={{ fontSize: '1.4rem' }}>
            {meta.name}
          </div>
          <div className="ub-sub">{meta.tagline}</div>
        </div>
      </div>
      <div>
        <div className="row between small muted" style={{ marginBottom: 6 }}>
          <span>
            {u.learned} of {u.total} learned
          </span>
          <span>{Math.round(u.pct * 100)}%</span>
        </div>
        <ProgressBar value={u.pct} color={meta.color} />
      </div>
      <div className="row wrap">
        {guide && (
          <Link to={`/unit/${meta.id}/intro`} className="btn btn-blue">
            📖 {p.lessonsDone[`g:${meta.id}`] ? 'Replay pattern intro' : 'Learn the pattern'}
          </Link>
        )}
        {firstTodo && (
          <Link to={`/p/${firstTodo.id}/learn`} className="btn btn-green">
            Next: {firstTodo.title}
          </Link>
        )}
        {learnedHere > 0 && (
          <Link to={`/review?unit=${meta.id}`} className="btn btn-orange">
            Practise this unit
          </Link>
        )}
      </div>

      {guide && (
        <div className="card">
          <div className="kicker">The pattern in a nutshell</div>
          <Md text={guide.summary.split('\n\n')[0]} />
          <div className="small muted" style={{ marginTop: 8 }}>
            🧠 {inline(guide.analogy)}
          </div>
          <details className="disclosure" style={{ marginTop: 14 }}>
            <summary>Recognition cues &amp; template</summary>
            <ul style={{ margin: '0 0 12px', paddingLeft: '1.2em' }}>
              {guide.whenToUse.map((w, i) => (
                <li key={i}>{inline(w)}</li>
              ))}
            </ul>
            <HighlightedCode code={guide.template} />
          </details>
        </div>
      )}

      <div>
        <h2>Problems</h2>
        <div className="list">
          {problems.map((q, i) => {
            const pp = p.problems[q.id];
            const learned = !!pp?.learnedAt;
            const due = learned && pp?.srs && isDue(pp.srs);
            return (
              <Link to={`/p/${q.id}`} key={q.id} className="list-row">
                <span className={`status-dot ${due ? 'due' : learned ? 'learned' : ''}`}>{due ? '↻' : learned ? '✓' : i + 1}</span>
                <div className="grow">
                  <div className="title">{q.title}</div>
                  <div className="tiny muted">
                    {q.pattern}
                    {learned && pp?.srs ? ` · review ${friendlyDue(pp.srs.due)}` : ''}
                  </div>
                </div>
                {learned && <Crowns n={crowns(pp?.srs)} />}
                <DifficultyChip d={q.difficulty} />
                <Icon name="chevron" size={18} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
