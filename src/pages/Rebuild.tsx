// "Code it from memory": rebuild the solution chunk by chunk, guided only by
// the plain-English explanation of each chunk. Type it (desktop) or pick each
// line (touch). Retrieval + generation, the strongest way to make code stick.

import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
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
import { ActionBar, Choices, ProblemPrompt, type CheckStatus } from '../components/interact';
import { codeKeyHandler } from '../components/Drills';
import { SessionShell } from '../components/Shell';
import { Icon } from '../components/ui';

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

// Relative indentation matters in Python; compare it relative to the first line.
function indentOk(got: string, exp: string, got0: string, exp0: string) {
  const ind = (s: string) => s.match(/^\s*/)?.[0].replace(/\t/g, '    ').length ?? 0;
  return ind(got) - ind(got0) === ind(exp) - ind(exp0);
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
  const [hint, setHint] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

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

  const finish = (final: { correct: number; total: number }) => {
    const acc = final.total ? final.correct / final.total : 0;
    recordRebuild(p.id, acc);
    awardXp(Math.round(XP.rebuildMax * acc) + 5, 'rebuild');
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
    return (
      <SessionShell progress={1} onClose={() => nav(`/p/${p.id}`)}>
        <div className="complete">
          <div className="trophy">{acc >= 1 ? '🏆' : acc >= 0.8 ? '🎉' : acc >= 0.5 ? '💪' : '🌱'}</div>
          <h1 style={{ marginTop: 12 }}>{acc >= 1 ? 'Flawless from memory!' : acc >= 0.8 ? 'Nearly perfect!' : acc >= 0.5 ? 'Getting there!' : 'Good effort!'}</h1>
          <p className="muted">
            You rebuilt <strong>{score.correct}</strong> of <strong>{score.total}</strong> lines of {p.title} correctly on the first try.
            {acc < 0.8 && ' Rebuild it again tomorrow — the struggle is what builds memory.'}
          </p>
          <div className="stack" style={{ maxWidth: 380, margin: '20px auto 0' }}>
            <button type="button" className="btn btn-blue btn-block" onClick={() => window.location.reload()}>
              Try again
            </button>
            <Link to={`/p/${p.id}`} className="btn btn-ghost btn-block">
              Back to problem
            </Link>
          </div>
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

  return (
    <SessionShell
      progress={progress}
      onClose={() => nav(`/p/${p.id}`)}
      right={
        <span className="small" style={{ fontWeight: 900, color: 'var(--green)' }}>
          {score.correct}/{score.total}
        </span>
      }
    >
      <div className="kicker">
        ⌨️ Code from memory · chunk {step + 1}/{body.length}
      </div>
      <div className="row between wrap" style={{ marginBottom: 10 }}>
        <h2 className="q-title" style={{ margin: 0 }}>
          {p.title}
        </h2>
        <button type="button" className="linklike small" onClick={() => setShowPrompt((s) => !s)}>
          {showPrompt ? 'Hide problem' : 'Show problem'}
        </button>
      </div>
      {showPrompt && (
        <div style={{ marginBottom: 12 }}>
          <ProblemPrompt p={p} compact showTitle={false} />
        </div>
      )}
      <pre className="code" style={{ marginBottom: 12 }}>
        {[...header, ...doneLines, ...(typing ? [] : tapDoneLines)].map((l, i) => (
          <div key={i} className="code-line dim" style={{ opacity: 0.6 }}>
            {l === '' ? ' ' : highlightLine(l)}
          </div>
        ))}
        <div className="code-line focus" style={{ color: 'var(--gold)' }}>
          {'# '}
          {cur.c.explain}
        </div>
      </pre>

      {typing ? (
        <>
          <textarea
            className="input code-input"
            autoFocus
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            rows={Math.max(3, curLines.length + 1)}
            placeholder={`Write the ${curLines.length} line${curLines.length > 1 ? 's' : ''} for this step (indentation matters) — Ctrl/⌘+Enter to check`}
            value={text}
            disabled={status !== 'idle'}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) return; // handled by ActionBar
              codeKeyHandler(e, setText);
            }}
          />
          {hint && status === 'idle' && (
            <div className="hint-box small" style={{ marginTop: 10, fontFamily: 'var(--mono)' }}>
              {curLines.map((l, i) => (
                <div key={i} style={{ whiteSpace: 'pre' }}>
                  {l.replace(/^(\s*\S+(?:\s+\S+)?).*$/, '$1')} …
                </div>
              ))}
            </div>
          )}
          {result && (
            <div className="stack" style={{ gap: 4, marginTop: 12 }}>
              {result.rows.map((r, i) => (
                <div key={i}>
                  <div className={`diff-line ${r.ok ? 'ok' : 'bad'}`}>
                    {r.ok ? '✓ ' : '✗ '}
                    {r.got || '(missing)'}
                  </div>
                  {!r.ok && r.exp && <div className="diff-line exp">→ {r.exp}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="small muted" style={{ marginBottom: 8, fontWeight: 700 }}>
            Line {lineInChunk + 1} of {curLines.length} for this step — which comes next?
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
        </>
      )}

      <ActionBar
        status={status}
        canCheck={typing ? text.trim().length > 0 : sel !== null}
        onCheck={typing ? checkTyped : checkTap}
        onContinue={typing ? () => nextChunk({ correct: result?.correct ?? 0, total: result?.total ?? curLines.length }) : continueTap}
        feedback={<span>{inline(cur.c.explain)}</span>}
        secondary={
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTyping((t) => !t)}>
              <Icon name={typing ? 'list' : 'keyboard'} size={16} /> {typing ? 'Tap' : 'Type'}
            </button>
            {typing && !hint && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setHint(true)}>
                Hint
              </button>
            )}
          </div>
        }
      />
    </SessionShell>
  );
}
