import '../styles/pages/problem-detail.css';
import { useEffect, useRef, useState } from 'react';
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
import { parseSolution, type ParsedSolution } from '../lib/parseSolution';
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

  const lessonBtn = (
    <Link to={`/p/${p.id}/learn`} className={`btn ${learned ? 'btn-secondary' : 'btn-primary'}`}>
      {learned ? <RotateCcw aria-hidden="true" /> : <Play aria-hidden="true" />}
      {learned ? 'Replay lesson' : 'Start guided lesson'}
    </Link>
  );
  const rebuildBtn = (
    <Link to={`/p/${p.id}/rebuild`} className={`btn ${learned ? 'btn-primary' : 'btn-secondary'}`}>
      <Keyboard aria-hidden="true" />
      Code from memory
    </Link>
  );

  return (
    // Keyed by problem: moving to the previous/next problem closes every disclosure
    // instead of carrying an open solution over to a problem not yet attempted.
    <div className="problem-detail" key={p.id}>
      <header className="problem-detail-head">
        <Link to={`/unit/${cat.id}`} className="back-link">
          <ChevronLeft aria-hidden="true" />
          {cat.name}
        </Link>
        <div className="problem-detail-head-row">
          <div className="problem-detail-head-text">
            <h1>
              {p.title} <span className="problem-detail-num tabular">#{p.num}</span>
            </h1>
            <div className="problem-detail-badges">
              <DifficultyChip d={p.difficulty} />
              <Badge>{p.pattern}</Badge>
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
          {/* The primary action always comes first, so it never changes place. */}
          <div className="problem-detail-actions">
            {learned ? rebuildBtn : lessonBtn}
            {learned ? lessonBtn : rebuildBtn}
            <a className="btn btn-quiet problem-detail-external" href={p.premium ? freeMirrorUrl(p.id) : leetcodeUrl(p.id)} target="_blank" rel="noreferrer">
              {p.premium ? 'Practise free' : 'LeetCode'}
              <ExternalLink aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
        </div>
      </header>

      <div className="problem-detail-layout">
        <div className="problem-detail-main">
          <section className="card problem-detail-problem" aria-labelledby="problem-detail-problem-h">
            <h2 id="problem-detail-problem-h" className="problem-detail-h2">
              Problem
            </h2>
            <ProblemPrompt p={p} showTitle={false} />
            <div className="problem-detail-clues">
              <h3 className="problem-detail-clues-h">
                <ScanSearch aria-hidden="true" />
                Clues in the wording
              </h3>
              <ul className="problem-detail-chips" role="list">
                {p.signals.map((s, i) => (
                  <li key={i} className="chip signal">
                    <span>{inline(s)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="problem-detail-section" aria-labelledby="problem-detail-solution">
            <div className="problem-detail-h2-row">
              <h2 id="problem-detail-solution" className="problem-detail-h2">
                Solution walkthrough
              </h2>
              <span className="text-sm text-tertiary">Open a section when you are ready</span>
            </div>

            {!learned && (
              <div className="callout callout-info problem-detail-spoiler">
                <Info aria-hidden="true" />
                <div>
                  <strong>Try the guided lesson first.</strong> The sections below give the answer away, and recalling beats rereading.
                </div>
              </div>
            )}

            <div className="problem-detail-disclosures">
              <details className="disclosure problem-detail-disc">
                <summary>
                  <span className="problem-detail-sum-icon">
                    <Lightbulb aria-hidden="true" />
                  </span>
                  <span className="problem-detail-sum-text">
                    <span className="problem-detail-sum-title">Key insight</span>
                    <span className="problem-detail-sum-sub">The one idea that unlocks the optimal solution</span>
                  </span>
                </summary>
                <div className="insight-card problem-detail-insight">
                  <Md text={p.insight} />
                  <div className="mnemonic">
                    <Brain aria-hidden="true" />
                    <span>{p.mnemonic}</span>
                  </div>
                </div>
              </details>

              <details className="disclosure problem-detail-disc">
                <summary>
                  <span className="problem-detail-sum-icon">
                    <ListOrdered aria-hidden="true" />
                  </span>
                  <span className="problem-detail-sum-text">
                    <span className="problem-detail-sum-title">The plan</span>
                    <span className="problem-detail-sum-sub">{p.steps.length} steps in plain English</span>
                  </span>
                </summary>
                <ol className="problem-detail-steps">
                  {p.steps.map((s, i) => (
                    <li key={i}>
                      <span className="problem-detail-step-n tabular" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="problem-detail-step-text">{inline(s)}</span>
                    </li>
                  ))}
                </ol>
              </details>

              <details className="disclosure problem-detail-disc">
                <summary>
                  <span className="problem-detail-sum-icon">
                    <CodeXml aria-hidden="true" />
                  </span>
                  <span className="problem-detail-sum-text">
                    <span className="problem-detail-sum-title">Annotated solution</span>
                    <span className="problem-detail-sum-sub">
                      Python · {parsed.chunks.length} parts · {parsed.lines.length} lines
                    </span>
                  </span>
                </summary>
                <AnnotatedSolution parsed={parsed} />
              </details>

              <details className="disclosure problem-detail-disc">
                <summary>
                  <span className="problem-detail-sum-icon">
                    <Gauge aria-hidden="true" />
                  </span>
                  <span className="problem-detail-sum-text">
                    <span className="problem-detail-sum-title">Complexity &amp; traps</span>
                    <span className="problem-detail-sum-sub">
                      Cost, the brute force, and {p.pitfalls.length} common {p.pitfalls.length === 1 ? 'bug' : 'bugs'}
                    </span>
                  </span>
                </summary>
                <div className="problem-detail-cx">
                  <div className="problem-detail-cx-grid">
                    <div className="problem-detail-cx-tile">
                      <div className="problem-detail-cx-k">
                        <Clock aria-hidden="true" />
                        Time
                      </div>
                      <div className="problem-detail-cx-v">{p.time}</div>
                    </div>
                    <div className="problem-detail-cx-tile">
                      <div className="problem-detail-cx-k">
                        <MemoryStick aria-hidden="true" />
                        Space
                      </div>
                      <div className="problem-detail-cx-v">{p.space}</div>
                    </div>
                  </div>
                  <Md text={p.complexityWhy} className="problem-detail-prose" />
                  <div className="problem-detail-brute">
                    <Hourglass aria-hidden="true" />
                    <div>
                      <h3 className="problem-detail-sub-h">Brute force</h3>
                      <div className="problem-detail-prose">{inline(p.brute)}</div>
                    </div>
                  </div>
                  <div className="problem-detail-traps">
                    <h3 className="problem-detail-sub-h">Common traps</h3>
                    <ul className="problem-detail-trap-list" role="list">
                      {p.pitfalls.map((x, i) => (
                        <li key={i}>
                          <TriangleAlert aria-hidden="true" />
                          <span>{inline(x)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            </div>
          </section>
        </div>

        <div className="problem-detail-side">
          <section className={`card problem-detail-card problem-detail-status ${learned ? '' : 'problem-detail-status-new'}`} aria-labelledby="problem-detail-status">
            <h2 id="problem-detail-status" className="problem-detail-card-title">
              Your progress
            </h2>
            <div className="problem-detail-mastery">
              <Crowns n={n} />
              <div className="grow">
                <div className="problem-detail-mastery-label">{learned ? CROWN_LABELS[n] : 'Not started'}</div>
                <div className="text-xs text-tertiary">Mastery {n} of 5</div>
              </div>
            </div>
            {learned ? (
              <dl className="problem-detail-kv">
                <div>
                  <dt>Next review</dt>
                  <dd className={due ? 'problem-detail-due' : undefined}>{pp?.srs ? cap(friendlyDue(pp.srs.due)) : '—'}</dd>
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
              <p className="problem-detail-status-note">Finish the guided lesson to add this problem to your daily review, timed for just before you would forget it.</p>
            )}
          </section>

          <section className="card problem-detail-card problem-detail-pattern" aria-labelledby="problem-detail-pattern">
            <h2 id="problem-detail-pattern" className="problem-detail-card-title">
              Pattern
            </h2>
            <Link to={`/unit/${cat.id}`} className="problem-detail-unit">
              <CategoryIcon id={cat.id} color={cat.color} />
              <span className="grow">
                <span className="problem-detail-unit-name">{cat.name}</span>
                <span className="problem-detail-unit-sub tabular">
                  {unitLearned} of {unit.length} learned
                </span>
              </span>
              <ChevronRight className="problem-detail-unit-chev" aria-hidden="true" />
            </Link>
            <ProgressBar value={unit.length ? unitLearned / unit.length : 0} thin color={cat.color} label={`${cat.name} progress`} />
          </section>

          <nav className="card pad-0 problem-detail-card problem-detail-nav" aria-label="Previous and next problem">
            <div className="problem-detail-nav-head">
              <span>Problem library</span>
              <span className="tabular">
                {idx + 1} of {PROBLEMS.length}
              </span>
            </div>
            {prev && (
              <Link to={`/p/${prev.id}`} className="problem-detail-nav-link">
                <ChevronLeft className="problem-detail-nav-chev" aria-hidden="true" />
                <span className="grow">
                  <span className="problem-detail-nav-k">Previous</span>
                  <span className="problem-detail-nav-t">{prev.title}</span>
                </span>
              </Link>
            )}
            {next && (
              <Link to={`/p/${next.id}`} className="problem-detail-nav-link problem-detail-nav-next">
                <span className="grow">
                  <span className="problem-detail-nav-k">Next</span>
                  <span className="problem-detail-nav-t">{next.title}</span>
                </span>
                <ChevronRight className="problem-detail-nav-chev" aria-hidden="true" />
              </Link>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}

// ── Annotated solution ───────────────────────────────────────────────────────
//
// One continuous listing: each part's explanation sits on a band above its
// lines, so the code reads top to bottom like a single file and the original
// indentation keeps its meaning.

const INDENT = 4;

/** A code line with its leading indentation drawn as guide-lined units (narrower on phones). */
function CodeText({ line }: { line: string }) {
  if (line.trim() === '') return <>{' '}</>;
  const lead = line.length - line.trimStart().length;
  const levels = Math.floor(lead / INDENT);
  return (
    <>
      {Array.from({ length: levels }, (_, k) => (
        <span key={k} className="problem-detail-indent">
          {' '.repeat(INDENT)}
        </span>
      ))}
      {highlightLine(line.slice(levels * INDENT))}
    </>
  );
}

function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    if (ok) resolve();
    else reject(new Error('Copy failed'));
  });
}

function AnnotatedSolution({ parsed }: { parsed: ParsedSolution }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = () => {
    writeClipboard(parsed.code).then(
      () => {
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 1600);
      },
      () => setCopied(false),
    );
  };

  let lineNo = 0;
  return (
    <div className="problem-detail-solution">
      <div className="problem-detail-solution-bar">
        <span className="problem-detail-legend">
          <span className="problem-detail-legend-dot" aria-hidden="true" />
          Key lines to memorise
        </span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy code'}
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? 'Code copied to the clipboard' : ''}
        </span>
      </div>
      <ol className="problem-detail-listing">
        {parsed.chunks.map((c, i) => (
          <li key={i} className="problem-detail-chunk">
            <div className="problem-detail-chunk-head">
              <span className="problem-detail-chunk-n tabular" aria-hidden="true">
                {i + 1}
              </span>
              <p className="problem-detail-chunk-explain">{inline(c.explain)}</p>
              {c.keyLines.length > 0 && (
                <span className="badge badge-warning problem-detail-key-badge">
                  <Star aria-hidden="true" />
                  {c.keyLines.length > 1 ? 'Key lines' : 'Key line'}
                </span>
              )}
            </div>
            <pre className="code problem-detail-code">
              {c.lines.map((l, j) => {
                lineNo += 1;
                const key = c.keyLines.includes(j);
                return (
                  <div key={j} className={`code-line ${key ? 'key' : ''}`}>
                    <span className="ln">{lineNo}</span>
                    <CodeText line={l} />
                  </div>
                );
              })}
            </pre>
          </li>
        ))}
      </ol>
    </div>
  );
}
