// "Code it from memory": rebuild the solution part by part, guided only by
// the plain-English explanation of each part (a chunk of the parsed solution). Type it (desktop) or pick each
// line (touch). Retrieval + generation, the strongest way to make code stick.

import '../styles/pages/rebuild.css';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  RotateCcw,
  Sprout,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { CATEGORY_BY_ID } from '../content/categories';
import { PROBLEM_BY_ID } from '../content/index';
import type { Problem } from '../content/types';
import { confetti } from '../lib/confetti';
import { mutateLine, sameCode } from '../lib/drills';
import { XP } from '../lib/game';
import { gradeCode, indentOf, reindent, type Grade } from '../lib/codegrade';
import { highlightLine } from '../lib/highlight';
import { inline } from '../lib/markdown';
import { normalizeCode, parseSolution } from '../lib/parseSolution';
import { shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { awardXp, recordRebuild, reviewProblem, useProgress } from '../lib/store';
import { ActionBar, Choices, CodeView, ProblemPrompt, type CheckStatus } from '../components/interact';
import { CodeDiff, CodeEditor, CodeLine, CodePane, GivenLines, TyperFooter, TyperWindow } from '../components/CodeTyper';
import { codeOptions } from '../components/Drills';
import { CATEGORY_ICON } from '../components/icons';
import { SessionShell } from '../components/Shell';
import { Completion, DifficultyChip, Kbd } from '../components/ui';

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

function Rebuild({ p }: { p: Problem }) {
  const nav = useNavigate();
  const settings = useProgress().settings;
  const parsed = parseSolution(p.solution);
  const body = parsed.chunks.map((c, i) => ({ c, i })).filter(({ c }) => !c.header);
  const header = parsed.chunks.filter((c) => c.header).flatMap((c) => c.lines);
  const [typing, setTyping] = useState(() => preferTyping(settings.typingMode));
  const [step, setStep] = useState(0); // index into body (the current part)
  const [lineInChunk, setLineInChunk] = useState(0); // tap mode
  const [text, setText] = useState('');
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [result, setResult] = useState<Grade | null>(null);
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

  // Keep the current part in view as the file grows.
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
    const r = gradeCode(text, cur.c.lines);
    setResult(r);
    setStatus(r.perfect ? 'correct' : 'wrong');
    sfx(r.perfect ? 'correct' : 'wrong');
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
  const written = typing ? [] : tapDoneLines; // tap mode: lines placed so far in this part
  const tapOk = sel !== null && sameCode(sel, tapLine ?? '');
  const tapIndent = (tapLine ?? '').match(/^\s*/)?.[0] ?? '';
  const hintBase = indentOf(curLines[0] ?? '');
  const cat = CATEGORY_BY_ID[p.category];
  const CatIcon = CATEGORY_ICON[p.category];

  const footNote = typing
    ? `${curLines.length} line${curLines.length === 1 ? '' : 's'} to write`
    : `Line ${lineInChunk + 1} of ${curLines.length} in this part`;

  // The current part, written as a comment in the file.
  const instr = (
    <div ref={instrRef} className="typer-line instr">
      <span className="typer-ln">{given.length + 1}</span>
      <span className="rebuild-instr" style={{ ['--indent' as string]: `${indent}ch` }}>
        <span className="rebuild-hash"># </span>
        {cur.c.explain}
      </span>
    </div>
  );

  return (
    <SessionShell
      progress={progress}
      onClose={() => nav(`/p/${p.id}`)}
      title="Code from memory"
      right={
        score.total > 0 ? (
          <span className="rebuild-score" title="Lines right on the first try">
            <Check strokeWidth={2.4} aria-hidden="true" />
            <span aria-hidden="true">
              {score.correct}/{score.total}
            </span>
            <span className="sr-only">
              {score.correct} of {score.total} lines right
            </span>
          </span>
        ) : undefined
      }
    >
      <div className="rebuild">
        <h1 className="sr-only">Code from memory</h1>
        <header className="drill-head">
          <div className="drill-eyebrow">
            <div className="kicker">
              <CatIcon strokeWidth={2} aria-hidden="true" />
              <span>{cat.name}</span>
              <span className="rebuild-kicker-num">#{p.num}</span>
            </div>
            <div className="drill-meta">
              {totalLines} lines · {body.length} parts
            </div>
          </div>
          <div className="rebuild-title-row">
            <div className="rebuild-title">
              <h2 className="q-title">{p.title}</h2>
              <DifficultyChip d={p.difficulty} />
            </div>
            <button
              type="button"
              className="btn btn-quiet btn-sm rebuild-prompt-toggle"
              aria-expanded={showPrompt}
              aria-controls={`rebuild-prompt-${p.id}`}
              onClick={() => setShowPrompt((s) => !s)}
            >
              {showPrompt ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              {showPrompt ? 'Hide problem' : 'Show problem'}
            </button>
          </div>
          <p className="drill-sub">Rebuild the solution one part at a time. The highlighted comment says what to write next.</p>
        </header>

        {showPrompt && (
          <div id={`rebuild-prompt-${p.id}`}>
            <ProblemPrompt p={p} compact showTitle={false} />
          </div>
        )}

        <TyperWindow
          status={status}
          className="rebuild-editor"
          right={
            <span className="rebuild-steps" role="img" aria-label={`Part ${step + 1} of ${body.length}`}>
              <span className="rebuild-steps-label">
                Part {step + 1}
                <span className="rebuild-steps-of"> of {body.length}</span>
              </span>
              <span className="rebuild-steps-track" aria-hidden="true">
                {body.map((_, k) => (
                  <span key={k} className={k < step ? 'done' : k === step ? 'current' : ''} />
                ))}
              </span>
            </span>
          }
          footer={<TyperFooter grade={typing ? result : null} note={footNote} keys={typing ? undefined : false} />}
        >
          {typing ? (
            result ? (
              <CodeDiff grade={result} given={given} firstLine={firstNew} indent={indent}>
                {instr}
              </CodeDiff>
            ) : (
              <CodeEditor
                value={text}
                onChange={setText}
                label={`Code for part ${step + 1}`}
                given={given}
                firstLine={firstNew}
                indent={indent}
                minRows={Math.max(3, curLines.length + 1)}
                autoFocus
                placeholder={`Write the ${curLines.length} line${curLines.length > 1 ? 's' : ''} for this part`}
                disabled={status !== 'idle'}
              >
                {instr}
              </CodeEditor>
            )
          ) : (
            <CodePane>
              <GivenLines lines={given} />
              {instr}
              {written.map((l, k) => (
                <CodeLine key={k} n={firstNew + k} className="written">
                  {highlightLine(l)}
                </CodeLine>
              ))}
              {status === 'idle' ? (
                <CodeLine ref={cursorRef} n={firstNew + written.length} className="cursor">
                  {tapIndent}
                  <span className="blank">{sel ? sel.trim() : '???'}</span>
                </CodeLine>
              ) : (
                <div ref={cursorRef} className="typer-diff">
                  {tapOk ? (
                    <CodeLine n={firstNew + written.length} sign="ok" className="diff ok">
                      {highlightLine(tapLine)}
                    </CodeLine>
                  ) : (
                    <>
                      <CodeLine n={firstNew + written.length} sign="del" className="diff del">
                        {tapIndent}
                        {sel?.trim()}
                      </CodeLine>
                      <CodeLine sign="add" className="diff add">
                        {highlightLine(tapLine)}
                      </CodeLine>
                    </>
                  )}
                </div>
              )}
            </CodePane>
          )}

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
        </TyperWindow>

        {!typing && (
          <div>
            <div className="drill-label">
              <span>Choose the next line</span>
              {tapOptions.length > 1 && (
                <span className="drill-keys" aria-hidden="true">
                  Press <Kbd>1</Kbd>–<Kbd>{tapOptions.length}</Kbd>
                </span>
              )}
            </div>
            <Choices
              options={codeOptions(tapOptions)}
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
          step={`${step}:${lineInChunk}`}
          canCheck={typing ? text.trim().length > 0 : sel !== null}
          onCheck={typing ? checkTyped : checkTap}
          onContinue={typing ? () => nextChunk({ correct: result?.correct ?? 0, total: result?.total ?? curLines.length }) : continueTap}
          feedback={
            <div className="rebuild-fb">
              <span className="drill-fb-label">This part</span>
              <span>{inline(cur.c.explain)}</span>
            </div>
          }
          secondary={
            <div className="rebuild-tools">
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setTyping((t) => !t)}>
                {typing ? <List aria-hidden="true" /> : <Keyboard aria-hidden="true" />}
                <span className="rebuild-tool-label">{typing ? 'Tap lines' : 'Type code'}</span>
              </button>
              {typing && !hint && (
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => setHint(true)}>
                  <Lightbulb aria-hidden="true" />
                  <span className="rebuild-tool-label">Hint</span>
                </button>
              )}
            </div>
          }
        />
      </div>
    </SessionShell>
  );
}
