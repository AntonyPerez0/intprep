// "Code it from memory", in two modes (/p/:id/rebuild?mode=parts|scratch):
// - Part by part: rebuild the solution one chunk at a time, guided only by the plain-English
//   explanation of each part. Type it (desktop) or pick each line (touch).
// - From scratch: the whole solution in one blank editor under the given signature, graded line by
//   line. An optional outline (the parts' explanations) helps, and caps the XP.
// Retrieval + generation, the strongest way to make code stick.

import '../styles/pages/rebuild.css';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  ListOrdered,
  ListTree,
  PencilLine,
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
import { codeLines, gradeCode, gradeSummary, indentOf, isIgnorable, reindent, type Grade } from '../lib/codegrade';
import { highlightLine } from '../lib/highlight';
import { inline } from '../lib/markdown';
import { normalizeCode, parseSolution } from '../lib/parseSolution';
import { shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { awardXp, getProgress, recordRebuild, reviewProblem, useProgress } from '../lib/store';
import { ActionBar, Choices, CodeView, ProblemPrompt, type CheckStatus } from '../components/interact';
import { CodeDiff, CodeEditor, CodeLine, CodePane, CodeTyper, GivenLines, TyperFooter, TyperWindow } from '../components/CodeTyper';
import { codeOptions } from '../components/Drills';
import { CATEGORY_ICON, IconTile } from '../components/icons';
import { SessionShell } from '../components/Shell';
import { Completion, DifficultyChip, Kbd, Modal } from '../components/ui';

type Mode = 'parts' | 'scratch';

const MODES: { id: Mode; label: string; icon: typeof ListOrdered }[] = [
  { id: 'parts', label: 'Part by part', icon: ListOrdered },
  { id: 'scratch', label: 'From scratch', icon: PencilLine },
];
const MODE_LABEL: Record<Mode, string> = { parts: 'Part by part', scratch: 'From scratch' };

/** A part-by-part best at or above this makes From scratch the default (and the next step). */
const READY_FOR_SCRATCH = 0.8;

export function RebuildRoute() {
  const { id } = useParams();
  const p = id ? PROBLEM_BY_ID[id] : undefined;
  if (!p) return <Navigate to="/problems" replace />;
  return <Rebuild key={p.id} p={p} />;
}

const isWide = () => !!window.matchMedia?.('(min-width: 820px)').matches;
const isFinePointer = () => !!window.matchMedia?.('(pointer: fine)').matches;

function preferTyping(mode: 'auto' | 'type' | 'tap') {
  if (mode !== 'auto') return mode === 'type';
  return isFinePointer() && window.innerWidth >= 820;
}

const reviewGrade = (acc: number) => (acc >= 0.9 ? 'good' : acc >= 0.6 ? 'hard' : 'again');

// ── Mode controller ─────────────────────────────────────────────────────────

interface SessionProps {
  p: Problem;
  /** Header props shared by both modes (the mode switch). */
  modes: ModeSwitchProps;
  /** Called on the first Check: from then on, switching mode restarts the session. */
  onChecked: () => void;
  /** Start a fresh session, in `mode` (default: the current one). */
  onRestart: (mode?: Mode) => void;
}

/**
 * Picks the mode (from ?mode=, else From scratch once part by part is strong), keeps the URL in
 * sync, and restarts the session on a mode switch after the first Check, with a confirmation.
 */
function Rebuild({ p }: { p: Problem }) {
  const [params, setParams] = useSearchParams();
  // Decided once per visit, so finishing a strong part-by-part run does not flip a running page.
  const [auto] = useState<Mode>(() => ((getProgress().problems[p.id]?.rebuildBest ?? 0) >= READY_FOR_SCRATCH ? 'scratch' : 'parts'));
  const asked = params.get('mode');
  const mode: Mode = asked === 'scratch' || asked === 'parts' ? asked : auto;
  const [run, setRun] = useState(0);
  const session = `${mode}-${run}`;
  const [checkedIn, setCheckedIn] = useState<string | null>(null);
  const checked = checkedIn === session;
  const [pending, setPending] = useState<Mode | null>(null);
  // The From scratch draft survives a free switch to Part by part and back (before any Check).
  const draft = useRef('');

  const setMode = (m: Mode) => setParams({ mode: m }, { replace: true });
  const restart = (m: Mode = mode) => {
    draft.current = '';
    setPending(null);
    setRun((r) => r + 1);
    if (m !== mode) setMode(m);
  };
  const choose = (m: Mode) => {
    if (m === mode) return;
    if (checked) setPending(m);
    else setMode(m);
  };

  const shared: SessionProps = {
    p,
    modes: { mode, onChange: choose, restarts: checked },
    onChecked: () => setCheckedIn(session),
    onRestart: restart,
  };

  return (
    <>
      {mode === 'scratch' ? <ScratchSession key={session} {...shared} draft={draft} /> : <PartsSession key={session} {...shared} />}
      {pending && (
        <Modal onClose={() => setPending(null)} labelledBy="rebuild-switch-title">
          <div className="rebuild-modal">
            <IconTile icon={RotateCcw} />
            <div className="grow">
              <h2 id="rebuild-switch-title" className="modal-title">
                Switch to {MODE_LABEL[pending]}?
              </h2>
              <p>You will start over in {MODE_LABEL[pending]}. This attempt ends here, with no score or XP.</p>
            </div>
          </div>
          <div className="modal-actions">
            {/* Focus the safe choice when the dialog opens. */}
            <button type="button" className="btn btn-secondary" onClick={() => setPending(null)} autoFocus>
              Keep going
            </button>
            <button type="button" className="btn btn-primary" onClick={() => restart(pending)}>
              Switch and restart
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Shared header ───────────────────────────────────────────────────────────

interface ModeSwitchProps {
  mode: Mode;
  onChange: (m: Mode) => void;
  /** True once the current attempt has been checked: switching then restarts it. */
  restarts: boolean;
}

function ModeSwitch({ mode, onChange, restarts }: ModeSwitchProps) {
  const id = useId();
  return (
    <div className="rebuild-modes">
      <div className="seg rebuild-seg" role="radiogroup" aria-label="How to write it" aria-describedby={restarts ? `${id}-note` : undefined}>
        {MODES.map((m) => {
          const on = m.id === mode;
          const Icon = m.icon;
          return (
            <button key={m.id} type="button" role="radio" aria-checked={on} className={on ? 'on' : ''} onClick={() => onChange(m.id)}>
              <Icon aria-hidden="true" />
              {m.label}
            </button>
          );
        })}
      </div>
      {restarts && (
        <span id={`${id}-note`} className="rebuild-modes-note">
          <RotateCcw aria-hidden="true" />
          Switching starts a new attempt
        </span>
      )}
    </div>
  );
}

function RebuildHead({
  p,
  modes,
  meta,
  sub,
  showPrompt,
  onTogglePrompt,
}: {
  p: Problem;
  modes: ModeSwitchProps;
  meta: ReactNode;
  sub: ReactNode;
  showPrompt: boolean;
  onTogglePrompt: () => void;
}) {
  const cat = CATEGORY_BY_ID[p.category];
  const CatIcon = CATEGORY_ICON[p.category];
  return (
    <header className="drill-head rebuild-head">
      <div className="drill-eyebrow">
        <div className="kicker">
          <CatIcon strokeWidth={2} aria-hidden="true" />
          <span>{cat.name}</span>
          <span className="rebuild-kicker-num">#{p.num}</span>
        </div>
        <div className="drill-meta">{meta}</div>
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
          onClick={onTogglePrompt}
        >
          {showPrompt ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {showPrompt ? 'Hide problem' : 'Show problem'}
        </button>
      </div>
      <ModeSwitch {...modes} />
      <p className="drill-sub">{sub}</p>
    </header>
  );
}

function PromptPanel({ p, show }: { p: Problem; show: boolean }) {
  if (!show) return null;
  return (
    <div id={`rebuild-prompt-${p.id}`} className="rebuild-prompt">
      <ProblemPrompt p={p} compact showTitle={false} />
    </div>
  );
}

/** "4/6" lines right on the first check, in the session header. */
function ScoreChip({ correct, total }: { correct: number; total: number }) {
  return (
    <span className="rebuild-score" title="Lines right on the first try">
      <Check strokeWidth={2.4} aria-hidden="true" />
      <span aria-hidden="true">
        {correct}/{total}
      </span>
      <span className="sr-only">
        {correct} of {total} lines right
      </span>
    </span>
  );
}

function SolutionDisclosure({ p }: { p: Problem }) {
  const parsed = parseSolution(p.solution);
  return (
    <details className="disclosure rebuild-solution">
      <summary>
        <CodeXml aria-hidden="true" />
        View the full solution
        <span className="rebuild-summary-meta">{parsed.lines.length} lines</span>
      </summary>
      <CodeView lines={parsed.lines} />
    </details>
  );
}

function doneLook(acc: number) {
  return {
    icon: acc >= 1 ? Trophy : acc >= READY_FOR_SCRATCH ? CircleCheck : acc >= 0.5 ? TrendingUp : Sprout,
    tone: (acc >= 1 ? 'warning' : acc >= READY_FOR_SCRATCH ? 'success' : 'brand') as 'warning' | 'success' | 'brand',
  };
}

// ── Part by part ────────────────────────────────────────────────────────────

function PartsSession({ p, modes, onChecked, onRestart }: SessionProps) {
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
    reviewProblem(p.id, reviewGrade(acc));
    setDone(true);
    sfx('complete');
    if (acc >= READY_FOR_SCRATCH) confetti();
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
    const ready = acc >= READY_FOR_SCRATCH;
    const look = doneLook(acc);
    return (
      <SessionShell progress={1} onClose={() => nav(`/p/${p.id}`)} title="Code from memory">
        <div className="rebuild-done">
          <Completion
            icon={look.icon}
            tone={look.tone}
            title={acc >= 1 ? 'Flawless from memory' : ready ? 'Nearly perfect' : acc >= 0.5 ? 'Getting there' : 'Good effort'}
            subtitle={
              <>
                You rebuilt {score.correct} of {score.total} lines of {p.title} correctly on the first try.
                {ready ? ' Ready for the real test? Write the whole thing in a blank file.' : ' Rebuild it again tomorrow. The struggle is what builds memory.'}
              </>
            }
            stats={[
              { label: 'Accuracy', value: `${pct}%` },
              { label: 'Lines correct', value: `${score.correct}/${score.total}` },
              { label: 'XP earned', value: `+${earned}` },
            ]}
          >
            {ready ? (
              <>
                <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => onRestart('scratch')}>
                  <PencilLine aria-hidden="true" />
                  Now write it from scratch
                </button>
                <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={() => onRestart()}>
                  <RotateCcw aria-hidden="true" />
                  Try again
                </button>
                <Link to={`/p/${p.id}`} className="btn btn-quiet btn-block">
                  <ArrowLeft aria-hidden="true" />
                  Back to problem
                </Link>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => onRestart()}>
                  <RotateCcw aria-hidden="true" />
                  Try again
                </button>
                <Link to={`/p/${p.id}`} className="btn btn-secondary btn-lg btn-block">
                  <ArrowLeft aria-hidden="true" />
                  Back to problem
                </Link>
              </>
            )}
          </Completion>
          <SolutionDisclosure p={p} />
        </div>
      </SessionShell>
    );
  }

  const checkTyped = () => {
    const r = gradeCode(text, cur.c.lines);
    setResult(r);
    setStatus(r.perfect ? 'correct' : 'wrong');
    sfx(r.perfect ? 'correct' : 'wrong');
    onChecked();
  };

  const checkTap = () => {
    const ok = sel !== null && sameCode(sel, tapLine);
    setStatus(ok ? 'correct' : 'wrong');
    sfx(ok ? 'correct' : 'wrong');
    onChecked();
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
      right={score.total > 0 ? <ScoreChip {...score} /> : undefined}
    >
      <div className="rebuild">
        <h1 className="sr-only">Code from memory</h1>
        <RebuildHead
          p={p}
          modes={modes}
          meta={`${totalLines} lines · ${body.length} parts`}
          sub="Rebuild the solution one part at a time. The highlighted comment says what to write next."
          showPrompt={showPrompt}
          onTogglePrompt={() => setShowPrompt((s) => !s)}
        />

        <PromptPanel p={p} show={showPrompt} />

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

// ── From scratch ────────────────────────────────────────────────────────────

/**
 * Where "Fix and check again" puts the caret: at the end of the first line to fix, or of the line
 * a missing one belongs after. Indices in a Grade skip blank and comment lines; map them back.
 */
function fixCaret(text: string, g: Grade): number {
  let target: number | undefined;
  let found = false;
  for (const r of g.rows) {
    if (r.kind === 'ok') {
      target = r.gotIndex;
      continue;
    }
    if (r.gotIndex !== undefined) target = r.gotIndex;
    found = true;
    break;
  }
  if (!found) return text.length;
  if (target === undefined) return 0;
  let k = -1;
  let pos = 0;
  for (const line of text.split('\n')) {
    if (!isIgnorable(line)) k++;
    if (k === target) return pos + line.length;
    pos += line.length + 1;
  }
  return text.length;
}

/** Scroll so the textarea's line holding `pos` sits in the readable part of the screen. */
function revealCaret(ta: HTMLTextAreaElement, pos: number) {
  const line = ta.value.slice(0, pos).split('\n').length - 1;
  const lh = parseFloat(getComputedStyle(ta).lineHeight) || 22;
  const y = ta.getBoundingClientRect().top + line * lh;
  const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--actionbar-h')) || 96;
  if (y > 96 && y < window.innerHeight - bar - 2 * lh) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: window.scrollY + y - window.innerHeight / 3, behavior: reduce ? 'auto' : 'smooth' });
}

function ScratchSession({ p, modes, onChecked, onRestart, draft }: SessionProps & { draft: RefObject<string> }) {
  const nav = useNavigate();
  const parsed = parseSolution(p.solution);
  const given = parsed.chunks.filter((c) => c.header).flatMap((c) => c.lines);
  const parts = parsed.chunks.filter((c) => !c.header);
  const body = parts.flatMap((c) => c.lines);
  const total = codeLines(body).length;
  const bodyIndents = body.filter((l) => l.trim()).map(indentOf);
  const indent = Math.min(16, bodyIndents.length ? Math.min(...bodyIndents) : 0);
  // "Write the body of twoSum" when the whole answer sits inside the given def; else the rest of the code.
  const lastGiven = given[given.length - 1] ?? '';
  const fn = indent > indentOf(lastGiven) ? lastGiven.match(/^\s*def (\w+)\(/)?.[1] : undefined;

  const [text, setTextState] = useState(draft.current);
  const setText = (v: string) => {
    draft.current = v;
    setTextState(v);
  };
  const [grade, setGrade] = useState<Grade | null>(null);
  // The score is the first check; later checks show the diff again but never raise it.
  const [first, setFirst] = useState<{ grade: Grade; outline: boolean } | null>(null);
  const [attempt, setAttempt] = useState(1);
  const [outline, setOutline] = useState(false);
  const [outlineUsed, setOutlineUsed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(isWide);
  const [done, setDone] = useState<{ acc: number; xp: number } | null>(null);
  const [autoFocus] = useState(isFinePointer);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const caret = useRef<number | null>(null);
  const capId = useId();

  // Once checked, bring the diff into view: the first line to fix, or the whole result.
  useEffect(() => {
    if (!grade) return;
    const diff = rootRef.current?.querySelector<HTMLElement>('.typer-diff');
    const target = diff?.querySelector<HTMLElement>('.diff:not(.ok)') ?? diff;
    if (!target) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // After the action bar has grown with its feedback (it sets the scroll padding).
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => target.scrollIntoView({ block: grade.perfect ? 'nearest' : 'center', behavior: reduce ? 'auto' : 'smooth' }));
    });
    return () => cancelAnimationFrame(raf);
  }, [grade]);

  // Showing the outline (from the action bar) brings it into view.
  useEffect(() => {
    if (!outline) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    rootRef.current?.querySelector('.rebuild-outline')?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [outline]);

  // Back to editing after "Fix and check again": caret on the first line to fix.
  useLayoutEffect(() => {
    const ta = taRef.current;
    if (grade || caret.current === null || !ta) return;
    const pos = Math.min(caret.current, ta.value.length);
    caret.current = null;
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(pos, pos);
    revealCaret(ta, pos);
  }, [grade]);

  const capped = first ? first.outline : outlineUsed;
  const maxXp = (capped ? XP.rebuildMax : XP.scratchMax) + 5;

  if (done) {
    const g = first!.grade;
    const pct = Math.round(done.acc * 100);
    const strong = done.acc >= READY_FOR_SCRATCH;
    const look = doneLook(done.acc);
    return (
      <SessionShell progress={1} onClose={() => nav(`/p/${p.id}`)} title="Code from memory">
        <div className="rebuild-done">
          <Completion
            icon={look.icon}
            tone={look.tone}
            title={done.acc >= 1 ? 'Flawless from scratch' : strong ? 'Nearly perfect' : done.acc >= 0.5 ? 'Getting there' : 'Good effort'}
            subtitle={
              <>
                You wrote {g.correct} of {g.total} lines of {p.title} from a blank file on your first check
                {g.extra > 0 ? `, plus ${g.extra} extra line${g.extra === 1 ? '' : 's'}.` : '.'}
                {first!.outline && ` You used the outline, so XP was capped at ${XP.rebuildMax + 5}.`}
                {!strong && ' Try it again tomorrow, or rebuild it part by part first.'}
              </>
            }
            stats={[
              { label: 'Accuracy', value: `${pct}%` },
              { label: 'Lines correct', value: `${g.correct}/${g.total}` },
              { label: 'XP earned', value: `+${done.xp}` },
            ]}
          >
            {strong ? (
              <>
                <Link to={`/p/${p.id}`} className="btn btn-primary btn-lg btn-block">
                  <ArrowLeft aria-hidden="true" />
                  Back to problem
                </Link>
                <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={() => onRestart()}>
                  <RotateCcw aria-hidden="true" />
                  Try again
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => onRestart()}>
                  <RotateCcw aria-hidden="true" />
                  Try again
                </button>
                <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={() => onRestart('parts')}>
                  <ListOrdered aria-hidden="true" />
                  Practice part by part
                </button>
                <Link to={`/p/${p.id}`} className="btn btn-quiet btn-block">
                  <ArrowLeft aria-hidden="true" />
                  Back to problem
                </Link>
              </>
            )}
          </Completion>
          <SolutionDisclosure p={p} />
        </div>
      </SessionShell>
    );
  }

  const status: CheckStatus = grade ? (grade.perfect ? 'correct' : 'wrong') : 'idle';
  const written = codeLines(text).length;

  const check = () => {
    const g = gradeCode(text, body);
    setGrade(g);
    if (!first) {
      setFirst({ grade: g, outline: outlineUsed });
      onChecked();
    }
    sfx(g.perfect ? 'correct' : 'wrong');
  };
  const fix = () => {
    if (!grade) return;
    caret.current = fixCaret(text, grade);
    setGrade(null);
    setAttempt((a) => a + 1);
  };
  const finish = () => {
    if (!first) return;
    const acc = first.grade.score;
    recordRebuild(p.id, acc, 'scratch');
    const xp = Math.round((first.outline ? XP.rebuildMax : XP.scratchMax) * acc) + 5;
    awardXp(xp, 'rebuild');
    // A strong rebuild of a due problem counts as a successful review, as part by part does.
    reviewProblem(p.id, reviewGrade(acc));
    setDone({ acc, xp });
    sfx('complete');
    if (acc >= READY_FOR_SCRATCH) confetti();
  };
  const toggleOutline = () => {
    if (!outline && !first) setOutlineUsed(true);
    setOutline((o) => !o);
  };

  // The plan, as numbered comments above the typing area.
  const outlineRows = outline ? (
    <ol className="rebuild-outline" aria-label="Outline">
      {parts.map((c, k) => (
        <li key={k} className="typer-line rebuild-outline-row">
          <span className="typer-ln">{given.length + 1 + k}</span>
          <span className="rebuild-outline-text" style={{ ['--indent' as string]: `${Math.min(indent, 8)}ch` }}>
            <span className="rebuild-outline-num" aria-hidden="true">
              # {k + 1}.{' '}
            </span>
            {c.explain}
          </span>
        </li>
      ))}
    </ol>
  ) : null;
  const firstLine = given.length + 1 + (outline ? parts.length : 0);

  const pctFirst = first ? Math.round(first.grade.score * 100) : 0;
  const isFirst = attempt === 1;
  let fbTitle: string | undefined;
  let fbBody: ReactNode;
  if (grade && isFirst) {
    fbBody = grade.perfect
      ? `All ${grade.total} lines right, from a blank file.`
      : 'Your first check sets the score. Fix the marked lines to practice, or continue.';
  } else if (grade) {
    fbTitle = grade.perfect ? 'All lines right now' : undefined;
    fbBody = grade.perfect
      ? `Your score stays at ${pctFirst}% from the first check, and the fix still counts as practice.`
      : `${gradeSummary(grade)}. Your score stays at ${pctFirst}% from the first check.`;
  }

  const note = grade
    ? undefined
    : outline && !first
      ? `Outline shown · up to ${maxXp} XP`
      : first
        ? `Check ${attempt} · score kept from check 1`
        : `${total} lines to write · up to ${maxXp} XP`;

  return (
    <SessionShell
      progress={grade ? 1 : Math.min(1, written / Math.max(1, total))}
      onClose={() => nav(`/p/${p.id}`)}
      title="Code from memory"
      right={first ? <ScoreChip correct={first.grade.correct} total={first.grade.total} /> : undefined}
    >
      <div ref={rootRef} className="rebuild rebuild-scratch">
        <h1 className="sr-only">Code from memory</h1>
        <RebuildHead
          p={p}
          modes={modes}
          meta={`${total} lines`}
          sub="Write the whole solution in a blank file, then check it line by line."
          showPrompt={showPrompt}
          onTogglePrompt={() => setShowPrompt((s) => !s)}
        />

        <PromptPanel p={p} show={showPrompt} />

        <CodeTyper
          value={text}
          onChange={setText}
          grade={grade}
          label="Your solution"
          given={given}
          firstLine={firstLine}
          indent={indent}
          minRows={Math.max(4, Math.min(total + 1, 12))}
          autoFocus={autoFocus}
          textareaRef={taRef}
          placeholder={fn ? `Write the body of ${fn}` : given.length ? 'Write the rest of the code' : 'Write the whole solution'}
          filename="solution.py"
          meta="From scratch"
          note={note}
          className="rebuild-editor"
        >
          {outlineRows}
        </CodeTyper>

        <ActionBar
          status={status}
          step={attempt}
          canCheck={text.trim().length > 0}
          onCheck={check}
          onContinue={finish}
          title={fbTitle}
          feedback={
            grade && (
              <div className="rebuild-fb">
                <span className="drill-fb-label">{isFirst ? 'First check' : `Check ${attempt}`}</span>
                <span>{fbBody}</span>
              </div>
            )
          }
          secondary={
            <div className="rebuild-tools">
              <button
                type="button"
                className="btn btn-quiet btn-sm"
                onClick={toggleOutline}
                title={first ? undefined : `Shows the plan in plain English. Caps XP at ${XP.rebuildMax + 5} instead of ${XP.scratchMax + 5}.`}
                aria-describedby={first ? undefined : capId}
              >
                <ListTree aria-hidden="true" />
                <span className="rebuild-tool-label">{outline ? 'Hide outline' : 'Show outline'}</span>
              </button>
              {!first && (
                <span id={capId} className="sr-only">
                  Using the outline caps the XP for this attempt at {XP.rebuildMax + 5}.
                </span>
              )}
            </div>
          }
          checkedSecondary={
            status === 'wrong' ? (
              <button type="button" className="btn btn-secondary btn-lg rebuild-fix" onClick={fix} aria-label="Fix and check again">
                <PencilLine aria-hidden="true" />
                <span className="rebuild-fix-long" aria-hidden="true">
                  Fix and check again
                </span>
                <span className="rebuild-fix-short" aria-hidden="true">
                  Fix it
                </span>
              </button>
            ) : undefined
          }
        />
      </div>
    </SessionShell>
  );
}
