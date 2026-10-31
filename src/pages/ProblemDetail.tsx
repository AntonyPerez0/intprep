import '../styles/pages/problem-detail.css';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CodeXml,
  Copy,
  ExternalLink,
  Gauge,
  Hourglass,
  Info,
  Keyboard,
  Lightbulb,
  ListOrdered,
  Lock,
  MemoryStick,
  Play,
  RotateCcw,
  ScanSearch,
  Star,
  TriangleAlert,
} from 'lucide-react';
import { CATEGORY_BY_ID } from '../content/categories';
import { PROBLEM_BY_ID, PROBLEMS, problemsFor } from '../content/index';
import { friendlyDue } from '../lib/date';
import { highlightLine } from '../lib/highlight';
import { inline, Md } from '../lib/markdown';
import { parseSolution } from '../lib/parseSolution';
import { CROWN_LABELS, crowns, isDue } from '../lib/srs';
import { useProgress } from '../lib/store';
import { ProblemPrompt } from '../components/interact';
import { CategoryIcon } from '../components/icons';
import { Badge, Crowns, DifficultyChip, freeMirrorUrl, leetcodeUrl, ProgressBar } from '../components/ui';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function ProblemDetail() {
  const { id } = useParams();
  const p = id ? PROBLEM_BY_ID[id] : undefined;
  const progress = useProgress();
  const [copied, setCopied] = useState(false);
  if (!p) return <Navigate to="/problems" replace />;
  const cat = CATEGORY_BY_ID[p.category];
  const pp = progress.problems[p.id];
  const learned = !!pp?.learnedAt;
  const due = learned && !!pp?.srs && isDue(pp.srs);
  const n = learned ? crowns(pp?.srs) : 0;
  const parsed = parseSolution(p.solution);
  const idx = PROBLEMS.findIndex((q) => q.id === p.id);
  const prev = PROBLEMS[idx - 1];
  const next = PROBLEMS[idx + 1];
  const unit = problemsFor(cat.id);
  const unitLearned = unit.filter((x) => progress.problems[x.id]?.learnedAt).length;
  const lineCount = parsed.lines.length;
  let lineNo = 0;

  const copy = () => {
    navigator.clipboard?.writeText(parsed.code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="pd">
      <header className="pd-head">
        <Link to={`/unit/${cat.id}`} className="back-link">
          <ChevronLeft aria-hidden="true" />
          {cat.name}
        </Link>
        <div className="pd-head-row">
          <div className="pd-head-text">
            <h1>
              {p.title} <span className="pd-num tabular">#{p.num}</span>
            </h1>
            <div className="pd-badges">
              <DifficultyChip d={p.difficulty} />
              <Badge tone="brand">{p.pattern}</Badge>
              {p.premium && (
                <Badge>
                  <Lock aria-hidden="true" />
                  LeetCode Premium
                </Badge>
              )}
              {due ? (
                <Badge tone="warning" dot>
                  Due for review
                </Badge>
              ) : learned ? (
                <Badge tone="success" dot>
                  Learned
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="pd-actions">
            <Link to={`/p/${p.id}/learn`} className={`btn ${learned ? 'btn-secondary' : 'btn-primary'}`}>
              {learned ? <RotateCcw aria-hidden="true" /> : <Play aria-hidden="true" />}
              {learned ? 'Replay lesson' : 'Start guided lesson'}
            </Link>
            <Link to={`/p/${p.id}/rebuild`} className={`btn ${learned ? 'btn-primary' : 'btn-secondary'}`}>
              <Keyboard aria-hidden="true" />
              Code from memory
            </Link>
            <a className="btn btn-quiet" href={p.premium ? freeMirrorUrl(p.id) : leetcodeUrl(p.id)} target="_blank" rel="noreferrer">
              {p.premium ? 'Practise free' : 'LeetCode'}
              <ExternalLink aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <div className="pd-layout">
        <div className="pd-main">
          <section className="pd-section" aria-labelledby="pd-problem">
            <h2 id="pd-problem" className="pd-h2">
              Problem
            </h2>
            <ProblemPrompt p={p} showTitle={false} />
          </section>

          <section className="card pd-clues" aria-labelledby="pd-clues">
            <div className="pd-card-head">
              <ScanSearch aria-hidden="true" />
              <h2 id="pd-clues">Clues in the wording</h2>
            </div>
            <div className="pd-chips">
              {p.signals.map((s, i) => (
                <span key={i} className="chip signal">
                  {inline(s)}
                </span>
              ))}
            </div>
          </section>

          <section className="pd-section" aria-labelledby="pd-solution">
            <div className="pd-h2-row">
              <h2 id="pd-solution" className="pd-h2">
                Solution walkthrough
              </h2>
              <span className="text-xs text-tertiary">Open a section when you are ready</span>
            </div>

            {!learned && (
              <div className="callout callout-info pd-spoiler">
                <Info aria-hidden="true" />
                <div>
                  <strong>Try the guided lesson first.</strong> The sections below give the answer away, and recalling beats rereading.
                </div>
              </div>
            )}

            <div className="pd-disclosures">
              <details className="disclosure pd-disc">
                <summary>
                  <span className="pd-sum-icon">
                    <Lightbulb />
                  </span>
                  <span className="pd-sum-text">
                    <span className="pd-sum-title">Key insight</span>
                    <span className="pd-sum-sub">The one idea that unlocks the optimal solution</span>
                  </span>
                </summary>
                <div className="insight-card">
                  <Md text={p.insight} />
                  <div className="mnemonic">
                    <Brain aria-hidden="true" />
                    <span>{p.mnemonic}</span>
                  </div>
                </div>
              </details>

              <details className="disclosure pd-disc">
                <summary>
                  <span className="pd-sum-icon">
                    <ListOrdered />
                  </span>
                  <span className="pd-sum-text">
                    <span className="pd-sum-title">The plan</span>
                    <span className="pd-sum-sub">{p.steps.length} steps in plain English</span>
                  </span>
                </summary>
                <ol className="steps-list">
                  {p.steps.map((s, i) => (
                    <li key={i}>
                      <span>{inline(s)}</span>
                    </li>
                  ))}
                </ol>
              </details>

              <details className="disclosure pd-disc">
                <summary>
                  <span className="pd-sum-icon">
                    <CodeXml />
                  </span>
                  <span className="pd-sum-text">
                    <span className="pd-sum-title">Annotated solution</span>
                    <span className="pd-sum-sub">
                      Python · {parsed.chunks.length} parts · {lineCount} lines
                    </span>
                  </span>
                </summary>
                <div className="pd-solution">
                  <div className="pd-solution-bar">
                    <span className="pd-legend">
                      <span className="pd-legend-dot" aria-hidden="true" />
                      Key line
                    </span>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
                      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                      {copied ? 'Copied' : 'Copy code'}
                    </button>
                  </div>
                  <ol className="pd-chunks">
                    {parsed.chunks.map((c, i) => (
                      <li key={i} className="pd-chunk">
                        <div className="pd-chunk-head">
                          <span className="pd-chunk-n tabular">{i + 1}</span>
                          <div className="pd-chunk-explain">{inline(c.explain)}</div>
                          {c.keyLines.length > 0 && (
                            <span className="badge badge-warning pd-key-badge">
                              <Star aria-hidden="true" />
                              Key line
                            </span>
                          )}
                        </div>
                        <pre className="code pd-code">
                          {c.lines.map((l, j) => {
                            lineNo += 1;
                            return (
                              <div key={j} className={`code-line ${c.keyLines.includes(j) ? 'key' : ''}`}>
                                <span className="ln">{lineNo}</span>
                                {l === '' ? ' ' : highlightLine(l)}
                              </div>
                            );
                          })}
                        </pre>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>

              <details className="disclosure pd-disc">
                <summary>
                  <span className="pd-sum-icon">
                    <Gauge />
                  </span>
                  <span className="pd-sum-text">
                    <span className="pd-sum-title">Complexity &amp; traps</span>
                    <span className="pd-sum-sub">
                      Cost, the brute force, and {p.pitfalls.length} common {p.pitfalls.length === 1 ? 'bug' : 'bugs'}
                    </span>
                  </span>
                </summary>
                <div className="pd-cx">
                  <div className="pd-cx-grid">
                    <div className="pd-cx-tile">
                      <div className="pd-cx-k">
                        <Clock aria-hidden="true" />
                        Time
                      </div>
                      <div className="pd-cx-v">{p.time}</div>
                    </div>
                    <div className="pd-cx-tile">
                      <div className="pd-cx-k">
                        <MemoryStick aria-hidden="true" />
                        Space
                      </div>
                      <div className="pd-cx-v">{p.space}</div>
                    </div>
                  </div>
                  <Md text={p.complexityWhy} className="pd-prose" />
                  <div className="pd-traps">
                    <div className="pd-sub-h">Common traps</div>
                    {p.pitfalls.map((x, i) => (
                      <div key={i} className="callout callout-warning">
                        <TriangleAlert aria-hidden="true" />
                        <div>{inline(x)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pd-brute">
                    <Hourglass aria-hidden="true" />
                    <div>
                      <div className="pd-sub-h">Brute force</div>
                      <div className="pd-prose">{inline(p.brute)}</div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </section>
        </div>

        <div className="pd-side">
          <section className="card pd-card pd-status" aria-labelledby="pd-status">
            <h2 id="pd-status" className="pd-card-title">
              Your progress
            </h2>
            <div className="pd-mastery">
              <Crowns n={n} />
              <div className="grow">
                <div className="pd-mastery-label">{learned ? CROWN_LABELS[n] : 'Not started'}</div>
                <div className="text-xs text-tertiary">{learned ? `Mastery ${n} of 5` : 'Learn it to start tracking mastery'}</div>
              </div>
            </div>
            {learned ? (
              <dl className="pd-kv">
                <div>
                  <dt>Next review</dt>
                  <dd className={due ? 'pd-due' : undefined}>{pp?.srs ? cap(friendlyDue(pp.srs.due)) : '—'}</dd>
                </div>
                <div>
                  <dt>Reviews</dt>
                  <dd className="tabular">{pp?.reviews ?? 0}</dd>
                </div>
                <div>
                  <dt>Best rebuild</dt>
                  <dd className="tabular">{pp?.rebuildBest !== undefined ? `${Math.round(pp.rebuildBest * 100)}%` : 'Not yet'}</dd>
                </div>
              </dl>
            ) : (
              <p className="pd-status-note">Finish the guided lesson and this problem joins your daily review, scheduled so you see it just before you would forget it.</p>
            )}
          </section>

          <section className="card pd-card pd-pattern" aria-labelledby="pd-pattern">
            <h2 id="pd-pattern" className="pd-card-title">
              Pattern
            </h2>
            <Link to={`/unit/${cat.id}`} className="pd-unit">
              <CategoryIcon id={cat.id} color={cat.color} />
              <span className="grow">
                <span className="pd-unit-name">{cat.name}</span>
                <span className="pd-unit-sub tabular">
                  {unitLearned} of {unit.length} learned
                </span>
              </span>
              <ChevronRight className="pd-unit-chev" aria-hidden="true" />
            </Link>
            <ProgressBar value={unit.length ? unitLearned / unit.length : 0} thin color={cat.color} label={`${cat.name} progress`} />
            <div className="pd-technique">
              <span className="pd-technique-k">Technique</span>
              <span className="pd-technique-v">{p.pattern}</span>
            </div>
          </section>

          <nav className="card pad-0 pd-card pd-nav" aria-label="Problem navigation">
            <div className="pd-nav-head">
              <span>Roadmap</span>
              <span className="tabular">
                {idx + 1} of {PROBLEMS.length}
              </span>
            </div>
            {prev && (
              <Link to={`/p/${prev.id}`} className="pd-nav-link">
                <ChevronLeft className="pd-nav-chev" aria-hidden="true" />
                <span className="grow">
                  <span className="pd-nav-k">Previous</span>
                  <span className="pd-nav-t">{prev.title}</span>
                </span>
              </Link>
            )}
            {next && (
              <Link to={`/p/${next.id}`} className="pd-nav-link pd-nav-next">
                <span className="grow">
                  <span className="pd-nav-k">Next</span>
                  <span className="pd-nav-t">{next.title}</span>
                </span>
                <ChevronRight className="pd-nav-chev" aria-hidden="true" />
              </Link>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
