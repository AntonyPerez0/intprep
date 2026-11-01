import '../styles/pages/unit.css';
import { useState, type CSSProperties } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronLeft, ChevronRight, Gauge, GraduationCap, Info, Keyboard, Lightbulb, Lock, Map as MapIcon, Play, Repeat2, RotateCcw, TextCursorInput, Trophy } from 'lucide-react';
import { CATEGORIES, CATEGORY_BY_ID } from '../content/categories';
import { guideFor, problemsFor } from '../content/index';
import type { CategoryId, Difficulty } from '../content/types';
import { friendlyDue } from '../lib/date';
import { HighlightedCode } from '../lib/highlight';
import { inline, Md } from '../lib/markdown';
import { nextStep, unitProgress, unitUnlocked } from '../lib/path';
import { crowns, isDue } from '../lib/srs';
import { templateScore, useProgress } from '../lib/store';
import { CategoryIcon, IconTile } from '../components/icons';
import { CodeWindow } from '../components/interact';
import { Crowns, DifficultyChip, ProgressBar } from '../components/ui';

/**
 * Templates longer than this start collapsed to a ~16-line preview. The gap
 * means a toggle always hides a meaningful chunk, never just a line or two.
 */
const TEMPLATE_PREVIEW_LINES = 24;

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function listJoin(xs: string[]) {
  if (xs.length <= 1) return xs.join('');
  return `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}

export function Unit() {
  const { cat } = useParams();
  const p = useProgress();
  // Which unit's long template is expanded (resets when moving between units).
  const [expandedFor, setExpandedFor] = useState<string | null>(null);
  const meta = CATEGORY_BY_ID[cat as CategoryId];
  if (!meta) return <Navigate to="/learn" replace />;
  const guide = guideFor(meta.id);
  const problems = problemsFor(meta.id);
  const u = unitProgress(p, meta.id);
  const learnedHere = problems.filter((q) => p.problems[q.id]?.learnedAt).length;
  const firstTodo = problems.find((q) => !p.problems[q.id]?.learnedAt);

  const ci = CATEGORIES.findIndex((c) => c.id === meta.id);
  const prevUnit = CATEGORIES[ci - 1];
  const nextUnit = CATEGORIES[ci + 1];
  const guideDone = !!p.lessonsDone[`g:${meta.id}`];
  const open = unitUnlocked(p, meta);
  const complete = u.total > 0 && u.learned === u.total;
  const started = u.learned > 0 || guideDone;
  const dueHere = problems.filter((q) => {
    const pp = p.problems[q.id];
    return !!pp?.learnedAt && !!pp.srs && isDue(pp.srs);
  }).length;
  // Same status vocabulary as the Learning path: this unit holds the recommended next step.
  const next = nextStep(p);
  const upNext = (next.kind === 'guide' && next.category === meta.id) || (next.kind === 'problem' && next.problem.category === meta.id);
  const mix = (['Easy', 'Medium', 'Hard'] as Difficulty[]).map((d) => ({ d, n: problems.filter((q) => q.difficulty === d).length }));

  const templateLines = guide ? guide.template.split('\n').length : 0;
  const templateLong = templateLines > TEMPLATE_PREVIEW_LINES;
  const templateOpen = expandedFor === meta.id;
  // The best template score so far: typed from memory, else filling the gaps.
  const typed = templateScore(p.templates?.[meta.id]);

  // Primary action: learn the pattern first, then the next problem, then practice.
  const guideCta = guide && (
    <Link key="guide" to={`/unit/${meta.id}/intro`} className={`btn btn-lg ${guideDone ? 'btn-secondary' : 'btn-primary'}`}>
      <BookOpen />
      {guideDone ? 'Replay pattern intro' : 'Start pattern intro'}
    </Link>
  );
  const nextCta = firstTodo && (
    <Link key="next" to={`/p/${firstTodo.id}/learn`} className={`btn btn-lg unit-cta-next ${guide && !guideDone ? 'btn-secondary' : 'btn-primary'}`}>
      <span className="truncate">Next: {firstTodo.title}</span>
      <ArrowRight />
    </Link>
  );
  const practiceCta = learnedHere > 0 && (
    <Link key="practice" to={`/review?unit=${meta.id}`} className={`btn btn-lg ${firstTodo ? 'btn-secondary' : 'btn-primary'}`}>
      <Repeat2 />
      Practice this unit
    </Link>
  );
  const ctas = guide && !guideDone ? [guideCta, nextCta, practiceCta] : firstTodo ? [nextCta, guideCta, practiceCta] : [practiceCta, guideCta];

  const status = complete ? (
    <span className="badge badge-success">
      <Check strokeWidth={2.5} />
      Complete
    </span>
  ) : started ? (
    <span className="badge badge-brand">In progress</span>
  ) : upNext ? (
    <span className="badge badge-brand">Up next</span>
  ) : open ? (
    <span className="badge">Not started</span>
  ) : (
    <span className="badge">
      <Lock strokeWidth={2} />
      Recommended later
    </span>
  );

  return (
    <div className="unit-page" style={{ ['--c' as string]: meta.color } as CSSProperties}>
      <Link to="/learn" className="back-link unit-back">
        <ChevronLeft />
        Learning path
      </Link>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="card pad-0 unit-hero">
        <div className="unit-hero-body">
          <div className="unit-hero-title">
            <CategoryIcon id={meta.id} color={meta.color} size="xl" />
            <div className="unit-hero-heading">
              <div className="unit-hero-kicker">
                <span className="tabular">
                  Unit {ci + 1} of {CATEGORIES.length}
                </span>
                {status}
              </div>
              <h1>{meta.name}</h1>
            </div>
            <p className="unit-hero-tagline">{meta.tagline}</p>
          </div>
          {!open && (
            <p className="unit-hero-note">
              <Info strokeWidth={2} />
              Recommended after {listJoin(meta.prereqs.map((x) => CATEGORY_BY_ID[x].name))}. You can still jump in.
            </p>
          )}
          {ctas.some(Boolean) && <div className="unit-hero-actions">{ctas}</div>}
        </div>

        <dl className="unit-stats">
          <div className="unit-stat unit-stat-progress">
            <dt>Learned</dt>
            <dd>
              <span className="unit-stat-value tabular">{u.learned}</span>
              <span className="unit-stat-of tabular">/ {u.total}</span>
              <span className="unit-stat-pct tabular">{Math.round(u.pct * 100)}%</span>
            </dd>
            <ProgressBar value={u.pct} color={complete ? 'var(--success)' : meta.color} label={`${meta.name} progress`} />
          </div>
          <div className="unit-stat unit-stat-due">
            <dt>Due for review</dt>
            <dd>
              <span className={`unit-stat-value tabular ${dueHere ? 'is-due' : ''}`}>{dueHere}</span>
              {dueHere > 0 && (
                <Link to={`/review?unit=${meta.id}`} className="unit-stat-link">
                  Review now
                </Link>
              )}
            </dd>
          </div>
          <div className="unit-stat">
            <dt>Pattern intro</dt>
            <dd>
              {guide ? (
                guideDone ? (
                  <span className="unit-stat-text is-done">
                    <Check strokeWidth={2.5} />
                    Completed
                  </span>
                ) : (
                  <span className="unit-stat-text">Not started</span>
                )
              ) : (
                <span className="unit-stat-text">Coming soon</span>
              )}
            </dd>
          </div>
          <div className="unit-stat unit-stat-mix">
            <dt>Difficulty mix</dt>
            <dd className="unit-mix">
              {mix.map(({ d, n }) => (
                <span key={d} className={`unit-mix-item is-${d.toLowerCase()}${n === 0 ? ' is-zero' : ''}`}>
                  <i aria-hidden="true" />
                  <span className="tabular">{n}</span>
                  <span className="unit-mix-label">{d}</span>
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </header>

      {/* ── Pattern overview ───────────────────────────────────────────── */}
      {guide && (
        <section className="card pad-0 unit-overview" aria-labelledby="unit-overview-title">
          <div className="unit-card-head">
            <div className="grow">
              <h2 id="unit-overview-title">The pattern in a nutshell</h2>
              <p className="unit-card-sub">The core idea, when to use it, and the code shape to reach for.</p>
            </div>
            <Link to={`/unit/${meta.id}/intro`} className="btn btn-secondary btn-sm unit-head-btn">
              Pattern intro
              <ArrowRight />
            </Link>
          </div>

          <div className="unit-overview-grid">
            <div className="unit-overview-main">
              <Md text={guide.summary.split('\n\n')[0]} className="unit-prose" />
              <div className="callout callout-brand unit-analogy">
                <Lightbulb aria-hidden="true" />
                <div>
                  <div className="unit-analogy-label">Analogy</div>
                  {inline(guide.analogy)}
                </div>
              </div>
            </div>
            <div className="unit-cues">
              <h3 className="unit-label">Reach for it when…</h3>
              <ul>
                {guide.whenToUse.map((w, i) => (
                  <li key={i}>
                    <Check strokeWidth={2.25} aria-hidden="true" />
                    <span>{inline(w)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="unit-template">
            <div className="unit-template-head">
              <h3 className="unit-label">Template</h3>
              {typed && (
                <span
                  className={`unit-type-best is-${typed.mode}`}
                  title={typed.mode === 'memory' ? 'Your best first try typing it from memory' : 'Your best first check filling the gaps'}
                >
                  {typed.mode === 'memory' ? <Trophy strokeWidth={2.2} aria-hidden="true" /> : <TextCursorInput strokeWidth={2.2} aria-hidden="true" />}
                  <span className="sr-only">{typed.mode === 'memory' ? 'Typed from memory, best first try: ' : 'Filled the gaps, best first check: '}</span>
                  <span aria-hidden="true">{typed.mode === 'memory' ? 'Best ' : 'Gaps '}</span>
                  {Math.round(typed.best * 100)}%
                </span>
              )}
              <Link to={`/patterns/${meta.id}/type`} state={{ from: `/unit/${meta.id}` }} className="btn btn-secondary btn-sm unit-type-btn">
                <Keyboard />
                Practice the template
              </Link>
            </div>
            <CodeWindow filename={`${meta.id}.py`} meta={`${templateLines} lines`}>
              <div className={`unit-code${templateLong && !templateOpen ? ' is-clamped' : ''}`}>
                <HighlightedCode code={guide.template} />
              </div>
            </CodeWindow>
            {templateLong && (
              <button type="button" className="unit-code-toggle" aria-expanded={templateOpen} onClick={() => setExpandedFor(templateOpen ? null : meta.id)}>
                {templateOpen ? 'Show less' : `Show all ${templateLines} lines`}
              </button>
            )}
            <p className="unit-complexity">
              <Gauge />
              <span>{guide.complexity}</span>
            </p>
          </div>
        </section>
      )}

      {/* ── Problems ───────────────────────────────────────────────────── */}
      <section className="unit-problems" aria-labelledby="unit-problems-title">
        <div className="unit-section-head">
          <h2 id="unit-problems-title">Problems</h2>
          <span className="unit-section-meta tabular">
            {learnedHere} of {problems.length} learned
          </span>
        </div>
        {problems.length === 0 ? (
          <div className="card unit-empty">Lessons for this unit are on their way.</div>
        ) : (
          <div className={`unit-table${learnedHere === 0 ? ' is-fresh' : ''}`}>
            <div className="unit-table-head" aria-hidden="true">
              <span />
              <span>Problem</span>
              <span className="unit-col-review">Next review</span>
              <span className="unit-col-mastery">Mastery</span>
              <span>Difficulty</span>
              <span />
            </div>
            <ol>
              {problems.map((q, i) => {
                const pp = p.problems[q.id];
                const learned = !!pp?.learnedAt;
                const due = learned && !!pp?.srs && isDue(pp.srs);
                const isNext = !!firstTodo && firstTodo.id === q.id;
                const review = learned && pp?.srs ? friendlyDue(pp.srs.due) : null;
                return (
                  <li key={q.id}>
                    <Link to={`/p/${q.id}`} className={`unit-row${isNext ? ' is-next' : ''}`}>
                      <span className={`status-dot ${due ? 'due' : learned ? 'learned' : isNext ? 'unit-dot-next' : 'unit-dot-todo'}`} aria-hidden="true">
                        {due ? <RotateCcw strokeWidth={2.25} /> : learned ? <Check strokeWidth={2.5} /> : isNext ? <Play strokeWidth={2.25} /> : i + 1}
                      </span>
                      {/* "Up next" is announced by the visible badge. */}
                      <span className="sr-only">{due ? 'Review due: ' : learned ? 'Learned: ' : ''}</span>
                      <span className="unit-row-main">
                        <span className="unit-row-heading">
                          <span className="unit-row-title">{q.title}</span>
                          {isNext && <span className="badge badge-brand unit-row-flag">Up next</span>}
                        </span>
                        <span className="unit-row-meta">
                          <span className="tabular">#{q.num}</span>
                          <span className="unit-row-technique">{q.pattern}</span>
                        </span>
                        {/* Phones: the review status gets its own short line; wider screens have a column. */}
                        {review && <span className={`unit-row-review-inline${due ? ' is-due' : ''}`}>{due ? 'Review due' : `Review ${review}`}</span>}
                      </span>
                      <span className={`unit-row-review unit-col-review${due ? ' is-due' : ''}`}>
                        <span className="sr-only">Next review: </span>
                        {review ? (
                          due ? 'Due now' : sentence(review)
                        ) : (
                          <>
                            <span className="unit-row-none" aria-hidden="true">—</span>
                            <span className="sr-only">not learned yet</span>
                          </>
                        )}
                      </span>
                      <span className={`unit-row-mastery unit-col-mastery${learned ? '' : ' is-empty'}`}>
                        {learned ? <Crowns n={crowns(pp?.srs)} /> : <span className="unit-row-none" aria-hidden="true">—</span>}
                      </span>
                      <span className="unit-row-diff">
                        <DifficultyChip d={q.difficulty} />
                      </span>
                      <ChevronRight className="unit-row-chevron" size={16} aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>

      {/* ── Neighboring units ─────────────────────────────────────────── */}
      <nav className="unit-pager" aria-label="Other units">
        {prevUnit ? (
          <Link to={`/unit/${prevUnit.id}`} className="unit-pager-link">
            <span className="unit-pager-label">
              <ArrowLeft />
              Previous unit
            </span>
            <span className="unit-pager-name">
              <CategoryIcon id={prevUnit.id} color={prevUnit.color} size="sm" />
              <span className="unit-pager-text">{prevUnit.name}</span>
            </span>
          </Link>
        ) : (
          <Link to="/learn#foundations" className="unit-pager-link">
            <span className="unit-pager-label">
              <ArrowLeft />
              Previous unit
            </span>
            <span className="unit-pager-name">
              <IconTile icon={GraduationCap} color="var(--text-secondary)" size="sm" />
              <span className="unit-pager-text">Foundations</span>
            </span>
          </Link>
        )}
        {nextUnit ? (
          <Link to={`/unit/${nextUnit.id}`} className="unit-pager-link is-next">
            <span className="unit-pager-label">
              Next unit
              <ArrowRight />
            </span>
            <span className="unit-pager-name">
              <CategoryIcon id={nextUnit.id} color={nextUnit.color} size="sm" />
              <span className="unit-pager-text">{nextUnit.name}</span>
            </span>
          </Link>
        ) : (
          <Link to="/learn" className="unit-pager-link is-next">
            <span className="unit-pager-label">
              All units
              <ArrowRight />
            </span>
            <span className="unit-pager-name">
              <IconTile icon={MapIcon} color="var(--brand)" size="sm" />
              <span className="unit-pager-text">Learning path</span>
            </span>
          </Link>
        )}
      </nav>
    </div>
  );
}
