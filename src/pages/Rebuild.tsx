// "Code it from memory": rebuild the solution chunk by chunk, guided only by
// the plain-English explanation of each chunk. Type it (desktop) or pick each
// line (touch). Retrieval + generation, the strongest way to make code stick.

import '../styles/pages/rebuild.css';
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  CircleCheck,
  CodeXml,
  Eye,
  EyeOff,
  Keyboard,
  Lightbulb,
  List,
  Minus,
  Plus,
  RotateCcw,
  Sprout,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { PROBLEM_BY_ID } from '../content/index';
import type { Problem } from '../content/types';
import { confetti } from '../lib/confetti';
import { mutateLine, sameCode } from '../lib/drills';
import { XP } from '../lib/game';
import { highlightLine } from '../lib/highlight';
import { inline } from '../lib/markdown';
import { normalizeCode, parseSolution } from '../lib/parseSolution';
import { shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { awardXp, recordRebuild, reviewProblem, useProgress } from '../lib/store';
import { ActionBar, Choices, CodeView, ProblemPrompt, type CheckStatus } from '../components/interact';
import { codeKeyHandler, CodeWindow } from '../components/Drills';
import { SessionShell } from '../components/Shell';
import { Completion, DifficultyChip } from '../components/ui';

export function RebuildRoute() {
  const { id } = useParams();
  const p = id ? PROBLEM_BY_ID[id] : undefined;
  if (!p) return <Navigate to="/problems" replace />;
  return <Rebuild key={p.id} p={p} />;
}

function preferTyping(mode: 'auto' | 'type' | 'tap') {
  if (mode !== 'auto') return mode === 'type';
  return !!window.matchMedia?.('(pointer: fine)').matches && window.innerWidth >= 820;
}

/** Compare typed code to the expected lines, ignoring blank lines and spacing. */
function gradeLines(typed: string, expected: string[]) {
  const t = typed.split('\n').filter((l) => l.trim() !== '');
  const e = expected.filter((l) => l.trim() !== '');
  const rows = e.map((exp, i) => ({ exp, got: t[i] ?? '', ok: sameCode(t[i] ?? '', exp) && indentOk(t[i] ?? '', exp, t[0] ?? '', e[0]) }));
  const extra = t.slice(e.length).map((got) => ({ exp: '', got, ok: false }));
  return { rows: [...rows, ...extra], correct: rows.filter((r) => r.ok).length, total: e.length };
}

const indentOf = (s: string) => s.match(/^\s*/)?.[0].replace(/\t/g, '    ').length ?? 0;

// Relative indentation matters in Python; compare it relative to the first line.
function indentOk(got: string, exp: string, got0: string, exp0: string) {
  return indentOf(got) - indentOf(got0) === indentOf(exp) - indentOf(exp0);
}

/** Re-indent a line from `from` columns to `to` columns (display only). */
function reindent(s: string, from: number, to: number) {
  const body = s.replace(/\t/g, '    ');
  const cut = Math.min(from, indentOf(body));
  return ' '.repeat(to) + body.slice(cut);
}

function Rebuild({ p }: { p: Problem }) {
  const nav = useNavigate();
  const settings = useProgress().settings;
  const parsed = parseSolution(p.solution);
  const body = parsed.chunks.map((c, i) => ({ c, i })).filter(({ c }) => !c.header);
  const header = parsed.chunks.filter((c) => c.header).flatMap((c) => c.lines);
  const [typing, setTyping] = useState(() => preferTyping(settings.typingMode));
  const [step, setStep] = useState(0); // index into body
  const [lineInChunk, setLineInChunk] = useState(0); // tap mode
  const [text, setText] = useState('');
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [result, setResult] = useState<ReturnType<typeof gradeLines> | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [earned, setEarned] = useState(0);
  const [hint, setHint] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const instrRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const totalLines = body.reduce((n, b) => n + b.c.lines.filter((l) => l.trim()).length, 0);
  const cur = body[step];
  const curLines = cur ? cur.c.lines.filter((l) => l.trim()) : [];
  const doneLines = body.slice(0, step).flatMap((b) => b.c.lines);

  // Tap mode options for the current line.
  const tapLine = curLines[lineInChunk];
  const tapOptions = useMemo(() => {
    if (!tapLine) return [];
    const seen = new Set([normalizeCode(tapLine)]);
    const opts: string[] = [];
    const add = (s: string) => {
      const n = normalizeCode(s);
      if (opts.length < 2 && n && !seen.has(n)) {
        seen.add(n);
        opts.push(s);
      }
    };
    shuffle(mutateLine(tapLine)).forEach(add);
    shuffle(parsed.lines.filter((l) => !l.header && l.text.trim().length > 3)).forEach((l) => add(l.text));
    return shuffle([tapLine, ...opts]);
  }, [tapLine]); // eslint-disable-line

  // Keep the current step in view as the file grows.
  const at = useRef(`${step}:${lineInChunk}`);
  useEffect(() => {
    const key = `${step}:${lineInChunk}`;
    if (at.current === key) return;
    at.current = key;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior = reduce ? 'auto' : 'smooth';
    if (cursorRef.current) cursorRef.current.scrollIntoView({ block: 'start', behavior });
    else instrRef.current?.scrollIntoView({ block: 'center', behavior });
  }, [step, lineInChunk]);

  const finish = (final: { correct: number; total: number }) => {
    const acc = final.total ? final.correct / final.total : 0;
    recordRebuild(p.id, acc);
    const xp = Math.round(XP.rebuildMax * acc) + 5;
    awardXp(xp, 'rebuild');
    setEarned(xp);
    // A strong rebuild of a due problem counts as a successful review.
    reviewProblem(p.id, acc >= 0.9 ? 'good' : acc >= 0.6 ? 'hard' : 'again');
    setDone(true);
    sfx('complete');
    if (acc >= 0.8) confetti();
  };

  const nextChunk = (add: { correct: number; total: number }) => {
    const s = { correct: score.correct + add.correct, total: score.total + add.total };
    setScore(s);
    setText('');
    setResult(null);
    setStatus('idle');
    setHint(false);
    setSel(null);
    setLineInChunk(0);
    if (step + 1 < body.length) setStep(step + 1);
    else finish(s);
  };

  if (done) {
    const acc = score.total ? score.correct / score.total : 0;
    const pct = Math.round(acc * 100);
    return (
      <SessionShell progress={1} onClose={() => nav(`/p/${p.id}`)} title="Code from memory">
        <div className="rebuild-done">
          <Completion
            icon={acc >= 1 ? Trophy : acc >= 0.8 ? CircleCheck : acc >= 0.5 ? TrendingUp : Sprout}
            tone={acc >= 1 ? 'warning' : acc >= 0.8 ? 'success' : 'brand'}
            title={acc >= 1 ? 'Flawless from memory' : acc >= 0.8 ? 'Nearly perfect' : acc >= 0.5 ? 'Getting there' : 'Good effort'}
            subtitle={
              <>
                You rebuilt {score.correct} of {score.total} lines of {p.title} correctly on the first try.
                {acc < 0.8 && ' Rebuild it again tomorrow. The struggle is what builds memory.'}
              </>
            }
            stats={[
              { label: 'Accuracy', value: `${pct}%` },
              { label: 'Lines correct', value: `${score.correct}/${score.total}` },
              { label: 'XP earned', value: `+${earned}` },
            ]}
          >
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => window.location.reload()}>
              <RotateCcw aria-hidden="true" />
              Try again
            </button>
            <Link to={`/p/${p.id}`} className="btn btn-secondary btn-lg btn-block">
              <ArrowLeft aria-hidden="true" />
              Back to problem
            </Link>
          </Completion>
          <details className="disclosure rebuild-solution">
            <summary>
              <CodeXml aria-hidden="true" />
              View the full solution
              <span className="rebuild-summary-meta">{parsed.lines.length} lines</span>
            </summary>
            <CodeView lines={parsed.lines} />
          </details>
        </div>
      </SessionShell>
    );
  }

  const checkTyped = () => {
    const r = gradeLines(text, cur.c.lines);
    setResult(r);
    const ok = r.correct === r.total && r.rows.length === r.total;
    setStatus(ok ? 'correct' : 'wrong');
    sfx(ok ? 'correct' : 'wrong');
  };

  const checkTap = () => {
    const ok = sel !== null && sameCode(sel, tapLine);
    setStatus(ok ? 'correct' : 'wrong');
    sfx(ok ? 'correct' : 'wrong');
  };
  const continueTap = () => {
    const ok = sel !== null && sameCode(sel, tapLine);
    const add = { correct: ok ? 1 : 0, total: 1 };
    if (lineInChunk + 1 < curLines.length) {
      setScore((s) => ({ correct: s.correct + add.correct, total: s.total + add.total }));
      setLineInChunk(lineInChunk + 1);
      setSel(null);
      setStatus('idle');
    } else {
      nextChunk(add);
    }
  };

  const tapDoneLines = curLines.slice(0, lineInChunk);
  const progress = (score.total + (typing ? 0 : lineInChunk)) / Math.max(1, totalLines);

  // ── Editor model ──────────────────────────────────────────────────────────
  const given = [...header, ...doneLines];
  const indent = Math.min(indentOf(curLines[0] ?? ''), 16);
  const firstNew = given.length + 2; // after the instruction comment
  const written = typing ? [] : tapDoneLines; // tap mode: lines placed so far in this step
  const rows = Math.max(3, curLines.length + 1, text.split('\n').length);
  const tapOk = sel !== null && sameCode(sel, tapLine ?? '');
  const tapIndent = (tapLine ?? '').match(/^\s*/)?.[0] ?? '';
  const baseGot = result?.rows[0] ? indentOf(result.rows[0].got) : 0;
  const baseExp = result?.rows[0] ? indentOf(result.rows[0].exp) : 0;
  const hintBase = indentOf(curLines[0] ?? '');

  let footLeft = `${curLines.length} line${curLines.length === 1 ? '' : 's'} to write`;
  let footRight: ReactNode = typing ? (
    <span className="rebuild-keys">Tab to indent · Ctrl/⌘ + Enter to check</span>
  ) : null;
  if (!typing) footLeft = `Line ${lineInChunk + 1} of ${curLines.length} in this step`;
  if (result) {
    const ok = result.correct === result.total && result.rows.length === result.total;
    const extra = result.rows.length - result.total;
    footLeft = 'Compared line by line';
    footRight = (
      <span className={`rebuild-result ${ok ? 'ok' : 'bad'}`}>
        {result.correct} of {result.total} line{result.total === 1 ? '' : 's'} correct
        {extra > 0 && ` · ${extra} extra`}
      </span>
    );
  }

  return (
    <SessionShell
      progress={progress}
      onClose={() => nav(`/p/${p.id}`)}
      title="Code from memory"
      right={
        <span className="rebuild-score-slot">
          {score.total > 0 && (
            <span className="rebuild-score" title="Lines right on the first try" aria-label={`${score.correct} of ${score.total} lines right`}>
              <Check strokeWidth={2.4} aria-hidden="true" />
              {score.correct}/{score.total}
            </span>
          )}
        </span>
      }
    >
      <div className="rebuild">
        <header className="drill-head">
          <div className="drill-eyebrow">
            <div className="kicker">
              <Keyboard strokeWidth={2} aria-hidden="true" />
              <span>Code from memory</span>
            </div>
            <div className="drill-meta">
              {totalLines} lines · {body.length} steps
            </div>
          </div>
          <div className="rebuild-title-row">
            <div className="rebuild-title">
              <h2 className="q-title">{p.title}</h2>
              <DifficultyChip d={p.difficulty} />
            </div>
            <button type="button" className="btn btn-quiet btn-sm rebuild-prompt-toggle" aria-expanded={showPrompt} onClick={() => setShowPrompt((s) => !s)}>
              {showPrompt ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              {showPrompt ? 'Hide problem' : 'Show problem'}
            </button>
          </div>
          <p className="drill-sub">Rebuild the solution one step at a time. The highlighted comment says what to write next.</p>
        </header>

        {showPrompt && <ProblemPrompt p={p} compact showTitle={false} />}

        <CodeWindow
          className={`rebuild-editor ${status !== 'idle' ? `is-${status}` : ''}`}
          right={
            <span className="rebuild-steps" role="img" aria-label={`Step ${step + 1} of ${body.length}`}>
              <span className="rebuild-steps-label">
                Step {step + 1}
                <span className="rebuild-steps-of">/{body.length}</span>
              </span>
              <span className="rebuild-steps-track" aria-hidden="true">
                {body.map((_, k) => (
                  <span key={k} className={k < step ? 'done' : k === step ? 'current' : ''} />
                ))}
              </span>
            </span>
          }
          footer={
            <>
              <span className="rebuild-foot-left">
                <span className="rebuild-foot-lang">Python 3</span>
                <span className="rebuild-foot-sep" aria-hidden="true" />
                {footLeft}
              </span>
              {footRight}
            </>
          }
        >
          <div className="rebuild-code">
            {given.map((l, k) => (
              <div key={k} className="rebuild-line given">
                <span className="rebuild-ln">{k + 1}</span>
                <span className="rebuild-src">{l === '' ? ' ' : highlightLine(l)}</span>
              </div>
            ))}
            <div ref={instrRef} className="rebuild-line instr">
              <span className="rebuild-ln">{given.length + 1}</span>
              <span className="rebuild-instr" style={{ ['--indent' as string]: `${indent}ch` }}>
                <span className="rebuild-hash"># </span>
                {cur.c.explain}
              </span>
            </div>

            {typing ? (
              result ? (
                <div className="rebuild-diff" aria-label="Line-by-line check">
                  {result.rows.map((r, k) => {
                    const n = firstNew + k;
                    if (r.ok)
                      return (
                        <div key={k} className="rebuild-line diff ok">
                          <span className="rebuild-ln">{n}</span>
                          <span className="rebuild-sign" aria-label="Correct">
                            <Check strokeWidth={2.4} />
                          </span>
                          <span className="rebuild-src">{highlightLine(reindent(r.got, baseGot, indent))}</span>
                        </div>
                      );
                    return (
                      <Fragment key={k}>
                        <div className="rebuild-line diff del">
                          <span className="rebuild-ln">{n}</span>
                          <span className="rebuild-sign" aria-label="Your line">
                            <Minus strokeWidth={2.4} />
                          </span>
                          <span className="rebuild-src">
                            {r.got ? reindent(r.got, baseGot, indent) : <span className="rebuild-missing">{' '.repeat(indent)}missing line</span>}
                          </span>
                        </div>
                        {r.exp && (
                          <div className="rebuild-line diff add">
                            <span className="rebuild-ln" />
                            <span className="rebuild-sign" aria-label="Expected">
                              <Plus strokeWidth={2.4} />
                            </span>
                            <span className="rebuild-src">{highlightLine(reindent(r.exp, baseExp, indent))}</span>
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className="rebuild-input" style={{ ['--indent' as string]: `${indent}ch` }}>
                  <div className="rebuild-gutter" aria-hidden="true">
                    {Array.from({ length: rows }, (_, k) => (
                      <span key={k}>{firstNew + k}</span>
                    ))}
                  </div>
                  <textarea
                    className="input code-input"
                    aria-label={`Code for step ${step + 1}`}
                    autoFocus
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    rows={rows}
                    placeholder={`Write the ${curLines.length} line${curLines.length > 1 ? 's' : ''} for this step`}
                    value={text}
                    disabled={status !== 'idle'}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) return; // handled by ActionBar
                      codeKeyHandler(e, setText);
                    }}
                  />
                </div>
              )
            ) : (
              <>
                {written.map((l, k) => (
                  <div key={k} className="rebuild-line written">
                    <span className="rebuild-ln">{firstNew + k}</span>
                    <span className="rebuild-src">{highlightLine(l)}</span>
                  </div>
                ))}
                <div ref={cursorRef} className="rebuild-line cursor">
                  <span className="rebuild-ln">{firstNew + written.length}</span>
                  <span className="rebuild-src">
                    {tapIndent}
                    <span className={`blank ${status === 'idle' ? '' : tapOk ? 'filled-correct' : 'filled-wrong'}`}>
                      {status !== 'idle' ? tapLine.trim() : sel ? sel.trim() : '???'}
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>

          {typing && hint && status === 'idle' && (
            <div className="rebuild-hint" style={{ ['--indent' as string]: `${indent}ch` }}>
              <div className="rebuild-hint-label">
                <Lightbulb aria-hidden="true" />
                Hint: how each line starts
              </div>
              {curLines.map((l, i) => (
                <div key={i} className="rebuild-hint-line">
                  {reindent(l, hintBase, 0).replace(/^(\s*\S+(?:\s+\S+)?).*$/, '$1')} …
                </div>
              ))}
            </div>
          )}
        </CodeWindow>

        {!typing && (
          <div>
            <div className="drill-label">
              <span>
                Line {lineInChunk + 1} of {curLines.length}: which comes next?
              </span>
            </div>
            <Choices
              options={tapOptions.map((o) => ({ key: o, label: o.trim() }))}
              selected={sel}
              onSelect={(k) => {
                setSel(k);
                sfx('tap');
              }}
              answer={tapLine}
              revealed={status !== 'idle'}
              code
            />
          </div>
        )}

        <ActionBar
          status={status}
          canCheck={typing ? text.trim().length > 0 : sel !== null}
          onCheck={typing ? checkTyped : checkTap}
          onContinue={typing ? () => nextChunk({ correct: result?.correct ?? 0, total: result?.total ?? curLines.length }) : continueTap}
          feedback={
            <div className="rebuild-fb">
              <span className="drill-fb-label">This step</span>
              <span>{inline(cur.c.explain)}</span>
            </div>
          }
          secondary={
            <div className="rebuild-tools">
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setTyping((t) => !t)}>
                {typing ? <List aria-hidden="true" /> : <Keyboard aria-hidden="true" />}
                {typing ? 'Tap lines' : 'Type code'}
              </button>
              {typing && !hint && (
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => setHint(true)}>
                  <Lightbulb aria-hidden="true" />
                  Hint
                </button>
              )}
            </div>
          }
        />
      </div>
    </SessionShell>
  );
}
