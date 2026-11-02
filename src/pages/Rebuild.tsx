// "Code it from memory", in three modes (/p/:id/rebuild?mode=parts|gaps|scratch), a ladder from
// most to least support:
// - Part by part: rebuild the solution one chunk at a time, guided only by the plain-English
//   explanation of each part. Typed on every device (phones get the editor's key bar); picking
//   each line from choices is the opt-in "Tap to choose" input mode (Profile), or "Tap lines" here.
// - Fill the gaps: the whole solution is shown with about 30% of its lines blank (key lines
//   first); type the missing lines, then check them one by one.
// - From scratch: the whole solution in one blank editor under the given signature, graded line by
//   line. An optional outline (the parts' explanations) helps, and caps the XP.
// Retrieval + generation, the strongest way to make code stick.

import '../styles/pages/rebuild.css';
import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
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
  RefreshCw,
  RotateCcw,
  Sprout,
  TextCursorInput,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { CATEGORY_BY_ID } from '../content/categories';
import { PROBLEM_BY_ID } from '../content/index';
import type { Problem } from '../content/types';
import { confetti } from '../lib/confetti';
import { mutateLine, sameCode } from '../lib/drills';
import { XP } from '../lib/game';
import { baseIndent, codeLines, gradeCode, gradeSummary, indentOf, isIgnorable, reindent, type Grade } from '../lib/codegrade';
import { gapSource, gapsSummary, type GapsGrade } from '../lib/gaps';
import { highlightLine } from '../lib/highlight';
import { preferTyping } from '../lib/input';
import { inline } from '../lib/markdown';
import { definedNames, lessonParts, normalizeCode, parseSolution } from '../lib/parseSolution';
import { shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { awardXp, getProgress, recordRebuild, reviewProblem, useProgress, type ProblemProgress } from '../lib/store';
import { ActionBar, Choices, CodeView, ProblemPrompt, type CheckStatus } from '../components/interact';
import { CheckedAction, CodeDiff, CodeEditor, CodeLine, CodePane, CodeTyper, GivenLines, TyperFooter, TyperWindow } from '../components/CodeTyper';
import { GapsWindow, useGaps, type CodeGapsHandle } from '../components/CodeGaps';
import { codeOptions } from '../components/Drills';
import { CATEGORY_ICON, IconTile } from '../components/icons';
import { SessionShell } from '../components/Shell';
import { Completion, DifficultyChip, Kbd, Modal } from '../components/ui';

type Mode = 'parts' | 'gaps' | 'scratch';

/** The ladder, most support first. `short` is the label on the narrowest phones. */
const MODES: { id: Mode; label: string; short: string; icon: typeof ListOrdered }[] = [
  { id: 'parts', label: 'Part by part', short: 'Parts', icon: ListOrdered },
  { id: 'gaps', label: 'Fill the gaps', short: 'Gaps', icon: TextCursorInput },
  { id: 'scratch', label: 'From scratch', short: 'Scratch', icon: PencilLine },
];
const MODE_LABEL: Record<Mode, string> = { parts: 'Part by part', gaps: 'Fill the gaps', scratch: 'From scratch' };
const isMode = (m: string | null): m is Mode => m === 'parts' || m === 'gaps' || m === 'scratch';

/** A best score at or above this moves the learner up the ladder (default mode and next step). */
const READY = 0.8;

/**
 * The default mode, one rung above what the learner has shown they can do: From scratch once
 * their fill-the-gaps best is strong (or they have written it from scratch before), Fill the gaps
 * once part by part is strong, else Part by part.
 */
function ladderMode(pp: ProblemProgress | undefined): Mode {
  if ((pp?.gapsBest ?? 0) >= READY || pp?.scratchBest !== undefined) return 'scratch';
  if ((pp?.rebuildBest ?? 0) >= READY) return 'gaps';
  return 'parts';
}

export function RebuildRoute() {
  const { id } = useParams();
  const p = id ? PROBLEM_BY_ID[id] : undefined;
  if (!p) return <Navigate to="/problems" replace />;
  return <Rebuild key={p.id} p={p} />;
}

const isWide = () => !!window.matchMedia?.('(min-width: 820px)').matches;
const isFinePointer = () => !!window.matchMedia?.('(pointer: fine)').matches;

const reviewGrade = (acc: number) => (acc >= 0.9 ? 'good' : acc >= 0.6 ? 'hard' : 'again');

/**
 * Code from memory is optional practice: it counts as a review (and moves the schedule) only for a
 * problem that is due. A weak run on a problem that is not due never resets its spaced review.
 */
const reviewRun = (id: string, acc: number) => reviewProblem(id, reviewGrade(acc), { lapse: false });

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
 * Picks the mode (from ?mode=, else the ladder: see `ladderMode`), keeps the URL in sync, and
 * restarts the session on a mode switch after the first Check, with a confirmation.
 */
function Rebuild({ p }: { p: Problem }) {
  const [params, setParams] = useSearchParams();
  // Decided once per visit, so finishing a strong run does not flip a running page.
  const [auto] = useState<Mode>(() => ladderMode(getProgress().problems[p.id]));
  const asked = params.get('mode');
  const mode: Mode = isMode(asked) ? asked : auto;
  const [run, setRun] = useState(0);
  const session = `${mode}-${run}`;
  const [checkedIn, setCheckedIn] = useState<string | null>(null);
  const checked = checkedIn === session;
  const [pending, setPending] = useState<Mode | null>(null);
  // The From scratch draft survives a free switch to another mode and back (before any Check),
  // and so does whether the outline was shown for it (which caps the XP).
  const draft = useRef<ScratchDraft>({ text: '', outline: false });
  // Fill the gaps: the round of gaps, so "Try new gaps" and a return to the mode bring new lines.
  const gapRound = useRef(0);
  // Set when the mode switch changes the session: the radio that was pressed unmounts with it.
  const switched = useRef(false);

  const setMode = (m: Mode) => setParams({ mode: m }, { replace: true });
  const restart = (m: Mode = mode) => {
    draft.current = { text: '', outline: false };
    setPending(null);
    setRun((r) => r + 1);
    if (m !== mode) setMode(m);
  };
  const choose = (m: Mode) => {
    if (m === mode) return;
    switched.current = true;
    if (checked) setPending(m);
    else setMode(m);
  };
  const keepGoing = () => {
    switched.current = false;
    setPending(null);
  };

  // After a switch, keep keyboard and screen-reader focus on the switch (now on the new mode's
  // radio) unless the new session focused its own editor. Runs after the session's own effects.
  useEffect(() => {
    if (!switched.current) return;
    switched.current = false;
    const a = document.activeElement;
    if (!a || a === document.body) document.querySelector<HTMLElement>('.rebuild-seg [aria-checked="true"]')?.focus({ preventScroll: true });
  }, [session]);

  const shared: SessionProps = {
    p,
    modes: { mode, onChange: choose, restarts: checked },
    onChecked: () => setCheckedIn(session),
    onRestart: restart,
  };

  return (
    <>
      {mode === 'scratch' ? (
        <ScratchSession key={session} {...shared} draft={draft} />
      ) : mode === 'gaps' ? (
        <GapsSession key={session} {...shared} round={gapRound} />
      ) : (
        <PartsSession key={session} {...shared} />
      )}
      {pending && (
        <Modal onClose={keepGoing} labelledBy="rebuild-switch-title">
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
            <button type="button" className="btn btn-secondary" onClick={keepGoing} autoFocus>
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
              {/* The narrowest phones show the short name; the full one stays the accessible name. */}
              <span className="rebuild-seg-long">{m.label}</span>
              <span className="rebuild-seg-short" aria-hidden="true">
                {m.short}
              </span>
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

/** "4/6" lines (or gaps) right on the first check, in the session header; "+2" for extra lines typed. */
function ScoreChip({ correct, total, extra = 0, unit = 'lines' }: { correct: number; total: number; extra?: number; unit?: 'lines' | 'gaps' }) {
  const extraText = extra > 0 ? `, plus ${extra} extra line${extra === 1 ? '' : 's'}` : '';
  return (
    <span className="rebuild-score" title={`${unit === 'gaps' ? 'Gaps' : 'Lines'} right on the first try${extraText}`}>
      <Check strokeWidth={2.4} aria-hidden="true" />
      <span aria-hidden="true">
        {correct}/{total}
        {extra > 0 && <span className="rebuild-score-extra"> +{extra}</span>}
      </span>
      <span className="sr-only">
        {correct} of {total} {unit} right{extraText}
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
    icon: acc >= 1 ? Trophy : acc >= READY ? CircleCheck : acc >= 0.5 ? TrendingUp : Sprout,
    tone: (acc >= 1 ? 'warning' : acc >= READY ? 'success' : 'brand') as 'warning' | 'success' | 'brand',
  };
}

// ── Part by part ────────────────────────────────────────────────────────────

interface PartsScore {
  correct: number;
  total: number;
  /** Typed lines that are not in the part: they count against the score, as in `Grade.score`. */
  extra: number;
}
const partsAcc = (s: PartsScore) => (s.total + s.extra ? s.correct / (s.total + s.extra) : 0);

function PartsSession({ p, modes, onChecked, onRestart }: SessionProps) {
  const nav = useNavigate();
  const settings = useProgress().settings;
  const parsed = parseSolution(p.solution);
  // The guided lesson's parts: class-level signatures that open a part are given, as in the
  // lesson and the review's Write a part, and only the body is written and graded.
  const body = lessonParts(parsed);
  const header = parsed.chunks.filter((c) => c.header).flatMap((c) => c.lines);
  const [typing, setTyping] = useState(() => preferTyping(settings.typingMode));
  const [step, setStep] = useState(0); // index into body (the current part)
  const [lineInChunk, setLineInChunk] = useState(0); // tap mode
  const [text, setText] = useState('');
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [result, setResult] = useState<Grade | null>(null);
  // Typing: the first check of the part sets its score; "Fix and check again" re-grades only.
  const [first, setFirst] = useState<Grade | null>(null);
  const [checks, setChecks] = useState(0);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [score, setScore] = useState<PartsScore>({ correct: 0, total: 0, extra: 0 });
  const [done, setDone] = useState(false);
  const [earned, setEarned] = useState(0);
  const [hint, setHint] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const instrRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  // Phones wait for a tap, so the keyboard does not cover the problem (or the next part's cue).
  const [autoFocus] = useState(isFinePointer);

  const totalLines = body.reduce((n, b) => n + b.body.filter((l) => l.trim()).length, 0);
  const cur = body[step];
  const curLines = cur ? cur.body.filter((l) => l.trim()) : [];
  const lead = cur ? cur.lead : [];
  const doneLines = body.slice(0, step).flatMap((b) => b.chunk.lines);

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

  const finish = (final: PartsScore) => {
    const acc = partsAcc(final);
    recordRebuild(p.id, acc);
    const xp = Math.round(XP.rebuildMax * acc) + 5;
    awardXp(xp, 'rebuild');
    setEarned(xp);
    // A rebuild of a due problem counts as its review.
    reviewRun(p.id, acc);
    setDone(true);
    sfx('complete');
    if (acc >= READY) confetti();
  };

  const nextChunk = (add: PartsScore) => {
    const s = { correct: score.correct + add.correct, total: score.total + add.total, extra: score.extra + add.extra };
    setScore(s);
    setText('');
    setResult(null);
    setFirst(null);
    setChecks(0);
    setStatus('idle');
    setHint(false);
    setSel(null);
    setLineInChunk(0);
    if (step + 1 < body.length) setStep(step + 1);
    else finish(s);
  };

  if (done) {
    const acc = partsAcc(score);
    const pct = Math.round(acc * 100);
    const ready = acc >= READY;
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
                You rebuilt {score.correct} of {score.total} lines of {p.title} correctly on the first try
                {score.extra > 0 ? `, plus ${score.extra} extra line${score.extra === 1 ? '' : 's'}.` : '.'}
                {ready
                  ? ' Next step: the whole solution with a few lines left blank for you to fill in.'
                  : ' Rebuild it again tomorrow. The struggle is what builds memory.'}
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
                <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => onRestart('gaps')}>
                  Next: Fill the gaps
                  <ArrowRight aria-hidden="true" />
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
    // The editor sits under the parts before it: typed column 0 is the editor's column.
    const r = gradeCode(text, cur.body, { anchor: indent });
    setResult(r);
    setChecks((c) => c + 1);
    if (!first) setFirst(r);
    setStatus(r.perfect ? 'correct' : 'wrong');
    sfx(r.perfect ? 'correct' : 'wrong');
    onChecked();
  };
  // "Fix and check again": the editor comes back in this click with the caret on the first line to
  // fix (flushSync, so a phone opens its keyboard inside the tap). The first check keeps the score.
  const fix = () => {
    if (!result) return;
    const pos = fixCaret(text, result);
    flushSync(() => {
      setResult(null);
      setStatus('idle');
    });
    const ta = taRef.current;
    if (!ta) return;
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(pos, pos);
    revealCaret(ta, pos);
  };
  const continueTyped = () => {
    const g = first ?? result;
    nextChunk({ correct: g?.correct ?? 0, total: g?.total ?? curLines.length, extra: g?.extra ?? 0 });
  };

  const checkTap = () => {
    const ok = sel !== null && sameCode(sel, tapLine);
    setStatus(ok ? 'correct' : 'wrong');
    sfx(ok ? 'correct' : 'wrong');
    onChecked();
  };
  const continueTap = () => {
    const ok = sel !== null && sameCode(sel, tapLine);
    const add = { correct: ok ? 1 : 0, total: 1, extra: 0 };
    if (lineInChunk + 1 < curLines.length) {
      setScore((s) => ({ ...s, correct: s.correct + add.correct, total: s.total + add.total }));
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
  // Typing starts at the least indented line to write (a part may end with a dedent); grading is
  // anchored there (see checkTyped). The instruction sits at the part's own indentation, above
  // the signature it opens with.
  const indent = baseIndent(curLines);
  const instrIndent = cur ? baseIndent(cur.chunk.lines) : indent;
  const firstNew = given.length + 2 + lead.length; // after the instruction comment and the given signature
  const written = typing ? [] : tapDoneLines; // tap mode: lines placed so far in this part
  const tapOk = sel !== null && sameCode(sel, tapLine ?? '');
  const tapIndent = (tapLine ?? '').match(/^\s*/)?.[0] ?? '';
  const hintBase = indent;

  const footNote = typing
    ? first && !result
      ? `Check ${checks + 1} · score kept from check 1`
      : `${curLines.length} line${curLines.length === 1 ? '' : 's'} to write`
    : `Line ${lineInChunk + 1} of ${curLines.length} in this part`;
  // After "Fix and check again", the action bar says the first check already counted.
  const later = typing && checks > 1 && !!result;

  // The current part, written as a comment in the file.
  const instr = (
    <div ref={instrRef} className="typer-line instr">
      <span className="typer-ln">{given.length + 1}</span>
      <span className="rebuild-instr" style={{ ['--indent' as string]: `${instrIndent}ch` }}>
        <span className="rebuild-hash"># </span>
        {cur.chunk.explain}
      </span>
    </div>
  );
  const above = (
    <>
      {instr}
      <GivenLines lines={lead} start={given.length + 2} />
    </>
  );

  return (
    <SessionShell
      progress={progress}
      onClose={() => nav(`/p/${p.id}`)}
      title="Code from memory"
      right={score.total > 0 ? <ScoreChip correct={score.correct} total={score.total} extra={score.extra} /> : undefined}
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
                {above}
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
                autoFocus={autoFocus}
                textareaRef={taRef}
                placeholder={[
                  `Write the ${curLines.length} line${curLines.length > 1 ? 's' : ''} for this part`,
                  `Write ${curLines.length} line${curLines.length > 1 ? 's' : ''}`,
                ]}
                disabled={status !== 'idle'}
              >
                {above}
              </CodeEditor>
            )
          ) : (
            <CodePane>
              <GivenLines lines={given} />
              {above}
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
          step={`${step}:${lineInChunk}:${checks}`}
          canCheck={typing ? text.trim().length > 0 : sel !== null}
          onCheck={typing ? checkTyped : checkTap}
          onContinue={typing ? continueTyped : continueTap}
          title={later && result?.perfect ? 'All lines right now' : undefined}
          feedback={
            later ? (
              <div className="rebuild-fb">
                <span className="drill-fb-label">{`Check ${checks}`}</span>
                <span>
                  {result!.perfect ? '' : `${gradeSummary(result!)}. `}
                  Your first check is what counts for this part.
                </span>
              </div>
            ) : (
              <div className="rebuild-fb">
                <span className="drill-fb-label">This part</span>
                <span>{inline(cur.chunk.explain)}</span>
              </div>
            )
          }
          checkedSecondary={typing && status === 'wrong' ? <CheckedAction onClick={fix} /> : undefined}
          secondary={
            <div className="rebuild-tools">
              {/* Once a part has been checked typed, its score is set: finish it typed */}
              {!(typing && first) && (
                <button type="button" className="btn btn-quiet btn-sm" onClick={() => setTyping((t) => !t)}>
                  {typing ? <List aria-hidden="true" /> : <Keyboard aria-hidden="true" />}
                  <span className="rebuild-tool-label">{typing ? 'Tap lines' : 'Type code'}</span>
                </button>
              )}
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

// ── Fill the gaps ───────────────────────────────────────────────────────────

/** Bring the first gap to fix (or the whole code) into view once checked, above the action bar. */
function useRevealScroll(root: RefObject<HTMLDivElement | null>, revealed: boolean, perfect: boolean) {
  useEffect(() => {
    if (!revealed) return;
    const pane = root.current?.querySelector<HTMLElement>('.gaps');
    const target = pane?.querySelector<HTMLElement>('.diff.del') ?? pane;
    if (!target) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // After the action bar has grown with its feedback (it sets the scroll padding).
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => target.scrollIntoView({ block: perfect ? 'nearest' : 'center', behavior: reduce ? 'auto' : 'smooth' }));
    });
    return () => cancelAnimationFrame(raf);
  }, [revealed]); // eslint-disable-line react-hooks/exhaustive-deps
}

function GapsSession({ p, modes, onChecked, onRestart, round }: SessionProps & { round: RefObject<number> }) {
  const nav = useNavigate();
  const src = useMemo(() => gapSource(p.solution), [p]);
  // Key lines first; the class / def header stays visible.
  const ex = useGaps(src.lines, { keyLines: src.keyLines, exclude: src.header, round: round.current });
  // Body lines only, as the other modes count them: the class / def header is given.
  const total = codeLines(src.lines.filter((_, i) => !src.header.includes(i))).length;
  // The score is the first check; later checks show the result again but never raise it.
  const [first, setFirst] = useState<GapsGrade | null>(null);
  const [checks, setChecks] = useState(0);
  const [showPrompt, setShowPrompt] = useState(isWide);
  const [done, setDone] = useState<{ acc: number; xp: number } | null>(null);
  // Phones wait for a tap, so the keyboard does not cover the problem on arrival.
  const [autoFocus] = useState(isFinePointer);
  const rootRef = useRef<HTMLDivElement>(null);
  const gapsRef = useRef<CodeGapsHandle>(null);

  // The next visit to this mode (or "Try new gaps") continues from this round.
  useEffect(() => {
    round.current = ex.round;
  }, [ex.round]); // eslint-disable-line react-hooks/exhaustive-deps

  useRevealScroll(rootRef, ex.revealed, ex.grade.perfect);

  if (done) {
    const g = first!;
    const pct = Math.round(done.acc * 100);
    const strong = done.acc >= READY;
    const look = doneLook(done.acc);
    const newGaps = () => {
      round.current = ex.round + 1;
      onRestart();
    };
    return (
      <SessionShell progress={1} onClose={() => nav(`/p/${p.id}`)} title="Code from memory">
        <div className="rebuild-done">
          <Completion
            icon={look.icon}
            tone={look.tone}
            title={done.acc >= 1 ? 'Every gap right' : strong ? 'Nearly perfect' : done.acc >= 0.5 ? 'Getting there' : 'Good effort'}
            subtitle={
              <>
                You filled {g.correct} of {g.total} gaps in {p.title} correctly on your first check.
                {strong ? ' Ready for the real test? Write the whole thing in a blank file.' : ' Each new set of gaps helps it stick.'}
              </>
            }
            stats={[
              { label: 'Accuracy', value: `${pct}%` },
              { label: 'Gaps correct', value: `${g.correct}/${g.total}` },
              { label: 'XP earned', value: `+${done.xp}` },
            ]}
          >
            {strong ? (
              <>
                <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => onRestart('scratch')}>
                  <PencilLine aria-hidden="true" />
                  Now write it from scratch
                </button>
                <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={newGaps}>
                  <RefreshCw aria-hidden="true" />
                  Try new gaps
                </button>
                <Link to={`/p/${p.id}`} className="btn btn-quiet btn-block">
                  <ArrowLeft aria-hidden="true" />
                  Back to problem
                </Link>
              </>
            ) : (
              <>
                <button type="button" className="btn btn-primary btn-lg btn-block" onClick={newGaps}>
                  <RefreshCw aria-hidden="true" />
                  Try new gaps
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

  const g = ex.grade;
  const status: CheckStatus = ex.revealed ? (g.perfect ? 'correct' : 'wrong') : 'idle';
  const canCheck = ex.filled > 0;

  // Enter on the last gap and Ctrl/⌘ + Enter both land here.
  const check = () => {
    if (ex.revealed || !canCheck) return;
    const r = ex.check();
    setChecks((c) => c + 1);
    if (!first) {
      setFirst(r);
      onChecked();
    }
    sfx(r.perfect ? 'correct' : 'wrong');
  };
  // "Fix and check again": the gaps come back in this click (flushSync), so the first gap to fix
  // takes focus inside the tap and a phone opens its keyboard.
  const retry = () => {
    const k = ex.gaps.findIndex((_, j) => !ex.grade.results[j]?.ok);
    flushSync(ex.retry);
    gapsRef.current?.focus(k >= 0 ? k : undefined);
  };
  const finish = () => {
    if (!first) return;
    const acc = first.score;
    recordRebuild(p.id, acc, 'gaps');
    const xp = Math.round(XP.gapsMax * acc) + 5;
    awardXp(xp, 'rebuild');
    // A run on a due problem counts as its review, as part by part does.
    reviewRun(p.id, acc);
    setDone({ acc, xp });
    sfx('complete');
    if (acc >= READY) confetti();
  };

  const pctFirst = first ? Math.round(first.score * 100) : 0;
  const isFirst = checks === 1;
  let fbTitle: string | undefined;
  let fbBody: ReactNode;
  if (ex.revealed && isFirst) {
    fbBody = g.perfect
      ? `All ${g.total} gaps right on the first check.`
      : 'Your first check sets the score. Fix the marked lines to practice, or continue.';
  } else if (ex.revealed) {
    fbTitle = g.perfect ? 'All gaps right now' : undefined;
    fbBody = g.perfect
      ? `Your score stays at ${pctFirst}% from the first check, and the fix still counts as practice.`
      : `${gapsSummary(g)}. Your score stays at ${pctFirst}% from the first check.`;
  }

  const left = ex.gaps.filter((_, k) => !ex.locked[k]).length;
  const leftNote = left === ex.gaps.length ? `${left} line${left === 1 ? '' : 's'} missing` : `${left} to fix`;
  const note = first ? `${leftNote} · score kept from check 1` : `${leftNote} · up to ${XP.gapsMax + 5} XP`;

  return (
    <SessionShell
      progress={ex.revealed ? 1 : ex.filled / Math.max(1, ex.gaps.length)}
      onClose={() => nav(`/p/${p.id}`)}
      title="Code from memory"
      right={first ? <ScoreChip correct={first.correct} total={first.total} unit="gaps" /> : undefined}
    >
      <div ref={rootRef} className="rebuild rebuild-gaps">
        <h1 className="sr-only">Code from memory</h1>
        <RebuildHead
          p={p}
          modes={modes}
          meta={`${total} lines · ${ex.gaps.length} gaps`}
          sub={
            first && !ex.revealed
              ? 'Fix the lines that were off, then check again. Your first check already set the score.'
              : 'Most of the solution is here. Type each missing line, then check them.'
          }
          showPrompt={showPrompt}
          onTogglePrompt={() => setShowPrompt((s) => !s)}
        />

        <PromptPanel p={p} show={showPrompt} />

        <GapsWindow
          lines={src.lines}
          gaps={ex.gaps}
          values={ex.values}
          onChange={(v) => ex.setValues(v)}
          revealed={ex.revealed}
          locked={ex.locked}
          onSubmit={check}
          autoFocus={autoFocus}
          ref={gapsRef}
          filename="solution.py"
          meta="Fill the gaps"
          note={note}
          className="rebuild-editor"
        />

        <ActionBar
          status={status}
          step={`${ex.round}:${checks}`}
          canCheck={canCheck}
          onCheck={check}
          onContinue={finish}
          title={fbTitle}
          feedback={
            ex.revealed && (
              <div className="rebuild-fb">
                <span className="drill-fb-label">{isFirst ? 'First check' : `Check ${checks}`}</span>
                <span>{fbBody}</span>
              </div>
            )
          }
          secondary={
            <div className="rebuild-tools">
              <button type="button" className="btn btn-quiet btn-sm" onClick={ex.fresh} title="Blank a different set of lines">
                <RefreshCw aria-hidden="true" />
                <span className="rebuild-tool-label">New gaps</span>
              </button>
            </div>
          }
          checkedSecondary={status === 'wrong' ? <CheckedAction onClick={retry} /> : undefined}
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

/** The From scratch attempt kept across a free mode switch: the text, and whether the outline was shown. */
interface ScratchDraft {
  text: string;
  outline: boolean;
}

function ScratchSession({ p, modes, onChecked, onRestart, draft }: SessionProps & { draft: RefObject<ScratchDraft> }) {
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
  const names = useMemo(() => definedNames(body, given), [p]); // eslint-disable-line react-hooks/exhaustive-deps

  const [text, setTextState] = useState(draft.current.text);
  const setText = (v: string) => {
    draft.current.text = v;
    setTextState(v);
  };
  const [grade, setGrade] = useState<Grade | null>(null);
  // The score is the first check; later checks show the diff again but never raise it.
  const [first, setFirst] = useState<{ grade: Grade; outline: boolean } | null>(null);
  const [attempt, setAttempt] = useState(1);
  // A draft written with the outline keeps it (and its XP cap) across a free mode switch.
  const [outline, setOutline] = useState(draft.current.outline);
  const [outlineUsed, setOutlineUsed] = useState(draft.current.outline);
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
    const strong = done.acc >= READY;
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
                {!strong && ' Filling the gaps first will firm it up.'}
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
                <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={() => onRestart('gaps')}>
                  <TextCursorInput aria-hidden="true" />
                  Fill the gaps first
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
    // A run on a due problem counts as its review, as part by part does.
    reviewRun(p.id, acc);
    setDone({ acc, xp });
    sfx('complete');
    if (acc >= READY) confetti();
  };
  const toggleOutline = () => {
    if (!outline && !first) {
      setOutlineUsed(true);
      draft.current.outline = true;
    }
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
          sub={
            <>
              Write the solution you studied in a blank file, then check it line by line.
              {names.length > 0 && (
                <>
                  {' '}
                  It is compared with that solution, so use the same names:{' '}
                  {names.map((n, k) => (
                    <Fragment key={n}>
                      {k > 0 && ', '}
                      <code translate="no">{n}</code>
                    </Fragment>
                  ))}
                  .
                </>
              )}
            </>
          }
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
          checkedSecondary={status === 'wrong' ? <CheckedAction onClick={fix} /> : undefined}
        />
      </div>
    </SessionShell>
  );
}
