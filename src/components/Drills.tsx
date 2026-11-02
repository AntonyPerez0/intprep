import '../styles/pages/drills.css';
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import {
  Brain,
  ChevronsDownUp,
  ChevronsUpDown,
  CodeXml,
  Eye,
  FileText,
  Gauge,
  Keyboard,
  Lightbulb,
  List,
  ListOrdered,
  MessageSquareText,
  Minus,
  PencilLine,
  Plus,
  ScanSearch,
  TextCursorInput,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { CATEGORY_BY_ID } from '../content/categories';
import type { CategoryId, Problem } from '../content/types';
import { baseIndent, codeLines, gradeCode, gradeSummary, isIgnorable, type Grade as CodeGrade } from '../lib/codegrade';
import {
  acceptedCategories,
  complexityChoices,
  DRILL_LABEL,
  keyLineDrill,
  patternChoices,
  pickPart,
  reviewGaps,
  reviewParts,
  sameCode,
  techniqueChoices,
  type DrillKind,
} from '../lib/drills';
import { gapsSummary, type GapsGrade } from '../lib/gaps';
import { preferTyping } from '../lib/input';
import { inline, Md } from '../lib/markdown';
import { definedNames, parseSolution } from '../lib/parseSolution';
import { preview, type Grade } from '../lib/srs';
import { sfx } from '../lib/sound';
import { getProgress, useProgress } from '../lib/store';
import { GapsWindow, insertAtCaret, SymbolKeys, useGaps, type CodeGapsHandle } from './CodeGaps';
import { CheckedAction, CodeDiff, CodeEditor, GivenLines, TyperFooter, TyperWindow } from './CodeTyper';
import { CategoryIcon } from './icons';
import { ActionBar, Choices, CodeView, CodeWindow, CorrectOrder, OrderSteps, ProblemPrompt, type CheckStatus } from './interact';
import { DifficultyChip, Kbd } from './ui';

export interface DrillResult {
  kind: DrillKind;
  /** Right on the first check (later checks after "Fix and check again" are practice only). */
  correct: boolean;
  selfGrade?: Grade;
  /** The learner wrote code: Fill the gaps, Write a part, or a key line typed without showing the options. */
  coded?: boolean;
  /** Code lines on the first check, for coding cards: how many were right, out of how many. */
  lines?: { correct: number; total: number };
}

interface DrillProps {
  problem: Problem;
  onDone: (r: DrillResult) => void;
  /** Eyebrow label, e.g. "Step 8 · Check the cost". Defaults to the drill's name. */
  kicker?: string;
  combo?: number;
  /** Shown next to the eyebrow, e.g. a "Try again" badge. */
  badge?: ReactNode;
  /** Right-aligned context in the header, e.g. "3 of 12". */
  meta?: ReactNode;
  /** Coding cards: which instance (see `DrillCardSpec` in lib/drills.ts). */
  seed?: number;
  /** Write the key line: the line to blank (index into `parseSolution(...).lines`). */
  line?: number;
  /** Write a part: the chunk to write (index into `parseSolution(...).chunks`). */
  chunk?: number;
  /** A miss brings this card back later in the session: coding cards say so in their feedback. */
  comesBack?: boolean;
}

const KIND_ICON: Record<DrillKind, LucideIcon> = {
  pattern: ScanSearch,
  technique: Wrench,
  insight: Lightbulb,
  order: ListOrdered,
  keyline: CodeXml,
  complexity: Gauge,
  gaps: TextCursorInput,
  part: PencilLine,
};

/** Phones and tablets wait for a tap before focusing an editor, so the keyboard does not cover the code on arrival. */
const isFinePointer = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: fine)').matches;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * A check disables the answer controls. If one of them has focus (a choice picked with the
 * keyboard, the typed key line), let it go first: the ActionBar then moves focus to Continue,
 * instead of the browser dropping it to the page a moment later.
 */
function releaseFocus() {
  const a = document.activeElement as HTMLElement | null;
  if (a?.matches('.drill .choice, .drill .parsons-item, .drill input, .drill textarea')) a.blur();
}

function useCheck(onCorrect?: () => void) {
  const [status, setStatus] = useState<CheckStatus>('idle');
  const resolve = (ok: boolean, combo = 0) => {
    releaseFocus();
    setStatus(ok ? 'correct' : 'wrong');
    sfx(ok ? 'correct' : 'wrong', combo);
    if (ok) onCorrect?.();
  };
  return { status, resolve };
}

// ── Shared anatomy ──────────────────────────────────────────────────────────
//
// Every drill: eyebrow (kind icon + label, optional badge, meta) → question
// title → optional sub → content → answers → ActionBar feedback.

function DrillHead({
  kind,
  kicker,
  badge,
  meta,
  title,
  sub,
}: {
  kind: DrillKind;
  kicker?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
}) {
  const I = KIND_ICON[kind];
  return (
    <header className="drill-head">
      <div className="drill-eyebrow">
        <div className="kicker">
          <I strokeWidth={2} aria-hidden="true" />
          <span>{kicker ?? DRILL_LABEL[kind]}</span>
        </div>
        {badge}
        {meta && <div className="drill-meta">{meta}</div>}
      </div>
      <h2 className="q-title">{title}</h2>
      {sub && <p className="drill-sub">{sub}</p>}
    </header>
  );
}

function AnswerLabel({ children, keys }: { children: ReactNode; keys?: number }) {
  return (
    <div className="drill-label">
      <span>{children}</span>
      {keys !== undefined && keys > 1 && (
        <span className="drill-keys" aria-hidden="true">
          Press <Kbd>1</Kbd>–<Kbd>{keys}</Kbd>
        </span>
      )}
    </div>
  );
}

function Clues({ p }: { p: Problem }) {
  return (
    <div className="drill-clues">
      <span className="drill-fb-label">Clues</span>
      {p.signals.map((s, i) => (
        <span className="chip signal" key={i}>
          {inline(s)}
        </span>
      ))}
    </div>
  );
}

/**
 * Choice options for lines of code. Choices hides the shortcut number in code
 * mode, so render it here: every option list then reads "1–N" the same way.
 */
export function codeOptions(lines: string[]) {
  return lines.map((o, i) => ({
    key: o,
    label: (
      <span className="drill-code-opt">
        <span className="num" aria-hidden="true">
          {i + 1}
        </span>
        <span className="drill-code-text">{o.trim()}</span>
      </span>
    ),
  }));
}

/** Two-row diff: the learner's line against the expected one (only the expected one when nothing was typed). */
function LineDiff({ yours, expected }: { yours: string; expected: string }) {
  return (
    <div className="drill-diff">
      {yours && (
        <div className="drill-diff-row del">
          <Minus className="drill-diff-sign" strokeWidth={2.4} aria-hidden="true" />
          <code className="drill-diff-code">{yours}</code>
          <span className="drill-diff-tag">Yours</span>
        </div>
      )}
      <div className="drill-diff-row add">
        <Plus className="drill-diff-sign" strokeWidth={2.4} aria-hidden="true" />
        <code className="drill-diff-code">{expected}</code>
        <span className="drill-diff-tag">Expected</span>
      </div>
    </div>
  );
}

const catLabel = (c: CategoryId) => CATEGORY_BY_ID[c].name;

// ── 1. Spot the pattern ─────────────────────────────────────────────────────

export function PatternDrill({ problem: p, onDone, kicker, combo = 0, badge, meta }: DrillProps) {
  const { options } = useMemo(() => patternChoices(p), [p]);
  const accepted = acceptedCategories(p);
  const [sel, setSel] = useState<string | null>(null);
  const { status, resolve } = useCheck();
  const ok = sel !== null && accepted.includes(sel as CategoryId);
  const cat = CATEGORY_BY_ID[p.category];
  return (
    <section className="drill" data-drill="pattern" data-problem={p.id}>
      <DrillHead kind="pattern" kicker={kicker} badge={badge} meta={meta} title="Which pattern fits this problem best?" />
      <ProblemPrompt p={p} compact />
      <div>
        <AnswerLabel keys={options.length}>Choose a pattern</AnswerLabel>
        <Choices
          options={options.map((c) => ({
            key: c,
            label: catLabel(c),
            icon: <CategoryIcon id={c} color={CATEGORY_BY_ID[c].color} size="sm" />,
          }))}
          selected={sel}
          onSelect={(k) => {
            setSel(k);
            sfx('tap');
          }}
          answer={accepted}
          revealed={status !== 'idle'}
          twoCol
        />
      </div>
      <ActionBar
        status={status}
        canCheck={sel !== null}
        onCheck={() => resolve(ok, combo)}
        onContinue={() => onDone({ kind: 'pattern', correct: ok })}
        feedback={
          <div className="drill-fb">
            <div className="drill-fb-answer">
              <CategoryIcon id={p.category} color={cat.color} size="sm" />
              <span>
                <strong>{cat.name}</strong>
                <span className="drill-fb-sep">·</span>
                {p.pattern}
              </span>
            </div>
            <Clues p={p} />
          </div>
        }
      />
    </section>
  );
}

// ── 2. Name the technique ───────────────────────────────────────────────────

export function TechniqueDrill({ problem: p, onDone, kicker, combo = 0, badge, meta }: DrillProps) {
  const { options, answer } = useMemo(() => techniqueChoices(p), [p]);
  const [sel, setSel] = useState<string | null>(null);
  const { status, resolve } = useCheck();
  return (
    <section className="drill" data-drill="technique" data-problem={p.id}>
      <DrillHead kind="technique" kicker={kicker} badge={badge} meta={meta} title="Which technique cracks this one?" />
      <ProblemPrompt p={p} compact />
      <div>
        <AnswerLabel keys={options.length}>Choose a technique</AnswerLabel>
        <Choices
          options={options.map((o) => ({ key: o, label: o }))}
          selected={sel}
          onSelect={(k) => {
            setSel(k);
            sfx('tap');
          }}
          answer={answer}
          revealed={status !== 'idle'}
        />
      </div>
      <ActionBar
        status={status}
        canCheck={sel !== null}
        onCheck={() => resolve(sel === answer, combo)}
        onContinue={() => onDone({ kind: 'technique', correct: sel === answer })}
        feedback={
          <div className="drill-fb">
            <div className="drill-fb-answer">
              <strong>{answer}</strong>
            </div>
            <Md text={p.insight} />
          </div>
        }
      />
    </section>
  );
}

// ── 3. Recall the key insight (self-rated) ──────────────────────────────────

const RATINGS: { grade: Grade; label: string; tone: string; fallback: string }[] = [
  { grade: 'again', label: 'Forgot', tone: 'danger', fallback: 'See it again soon' },
  { grade: 'hard', label: 'Fuzzy', tone: 'warning', fallback: 'Shorter gap' },
  { grade: 'good', label: 'Got it', tone: 'success', fallback: 'Normal gap' },
  { grade: 'easy', label: 'Easy', tone: 'brand', fallback: 'Longer gap' },
];

/** Matches the drill-arm animation delay in drills.css. */
const RATE_ARM_MS = 350;

/** Precise enough that neighboring grades never read the same ("in 56 days" vs "in 70 days"). */
function fmtInterval(days: number) {
  const one = (n: number) => n.toFixed(1).replace(/\.0$/, '');
  if (days <= 1) return 'in 1 day';
  if (days < 100) return `in ${days} days`;
  if (days < 365) return `in ${one(days / 30)} mo`;
  return `in ${one(days / 365)} yr`;
}

export function InsightDrill({ problem: p, onDone, kicker, badge, meta }: DrillProps) {
  const [revealed, setRevealed] = useState(false);
  const [note, setNote] = useState('');
  // What each self-rating would schedule for this learner's card (if learned).
  const [next] = useState(() => {
    const card = getProgress().problems[p.id]?.srs;
    return card ? preview(card) : null;
  });
  const rate = (g: Grade) => {
    sfx(g === 'again' ? 'wrong' : 'correct');
    onDone({ kind: 'insight', correct: g === 'good' || g === 'easy', selfGrade: g });
  };
  // On reveal, bring the answer above the rating bar and move focus to the
  // rating group so keyboard and screen-reader users land on the next decision.
  const revealRef = useRef<HTMLDivElement>(null);
  const rateRef = useRef<HTMLDivElement>(null);
  const revealedAt = useRef(0);
  useEffect(() => {
    if (!revealed) return;
    revealedAt.current = performance.now();
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    rateRef.current?.focus({ preventScroll: true });
    // Scroll two frames later: the rating bar is taller than the "Show answer" bar, and the
    // session only reserves room for it once its new height has been measured.
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => revealRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [revealed]);
  // Keyboard parity with the other drills: Enter reveals, then 1–4 rate.
  const rateRefFn = useRef(rate);
  rateRefFn.current = rate;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return;
      if (!revealed) {
        // Let a focused button or link handle its own Enter.
        if (e.key !== 'Enter' || el.closest('button, a')) return;
        e.preventDefault();
        setRevealed(true);
        return;
      }
      const n = Number(e.key);
      if (!(n >= 1 && n <= RATINGS.length) || e.repeat) return;
      // Same arming delay as the pointer: a fast double press can't rate by accident.
      if (performance.now() - revealedAt.current < RATE_ARM_MS) return;
      e.preventDefault();
      rateRefFn.current(RATINGS[n - 1].grade);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [revealed]);
  return (
    <section className="drill" data-drill="insight" data-problem={p.id}>
      <DrillHead
        kind="insight"
        kicker={kicker}
        badge={badge}
        meta={meta}
        title="What's the key insight?"
        sub="Say the approach out loud, or type it, before you reveal the answer."
      />
      <ProblemPrompt p={p} compact />
      {!revealed ? (
        <div>
          <label className="drill-label" htmlFor={`note-${p.id}`}>
            <span>
              Your answer <span className="drill-optional">Optional</span>
            </span>
          </label>
          <textarea
            id={`note-${p.id}`}
            className="input drill-note-input"
            rows={3}
            placeholder="In a sentence or two, how would you solve it?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            // Browsers only reveal the caret line on focus; bring the whole box above the action bar.
            onFocus={(e) => e.currentTarget.scrollIntoView({ block: 'nearest' })}
          />
        </div>
      ) : (
        <div className="stack drill-reveal" ref={revealRef}>
          {note.trim() && (
            <div className="drill-note">
              <div className="drill-fb-label">Your answer</div>
              <div className="drill-note-text">{note}</div>
            </div>
          )}
          <div className="insight-card">
            <div className="insight-label">
              <Lightbulb strokeWidth={2} aria-hidden="true" />
              <span className="drill-insight-key">Key insight</span>
              <span className="drill-insight-pattern">{p.pattern}</span>
            </div>
            <div className="drill-insight-text">
              <Md text={p.insight} />
            </div>
            <div className="mnemonic">
              <Brain strokeWidth={2} aria-hidden="true" />
              <span>{p.mnemonic}</span>
            </div>
          </div>
        </div>
      )}
      <div className="actionbar drill-rate-actions">
        <div className="actionbar-inner">
          {!revealed ? (
            <div className="buttons">
              <span className="drill-hint">
                <Brain strokeWidth={1.9} aria-hidden="true" />
                Retrieve it from memory first. The effort is what makes it stick.
              </span>
              <button type="button" className="btn btn-primary btn-lg" onClick={() => setRevealed(true)}>
                <Eye aria-hidden="true" />
                Show answer
              </button>
            </div>
          ) : (
            <div className="drill-rate" role="group" aria-labelledby={`rate-q-${p.id}`} tabIndex={-1} ref={rateRef}>
              <div className="drill-rate-q">
                <span id={`rate-q-${p.id}`}>How well did you remember it?</span>
                <span className="drill-rate-q-meta" title={next ? 'Assumes your other cards for this problem today go well' : undefined}>
                  {next ? 'Estimated next review' : 'Your rating sets the next review'}
                </span>
              </div>
              <div className="drill-rate-grid">
                {RATINGS.map((r, k) => (
                  <div className="drill-rate-option" key={r.grade}>
                    <button
                      type="button"
                      className={`btn btn-secondary btn-lg drill-rate-btn tone-${r.tone}`}
                      aria-describedby={`rate-${r.grade}`}
                      onClick={() => rate(r.grade)}
                    >
                      {r.label}
                    </button>
                    {/* Shortcut digit drawn over the button, outside it, so its label stays exactly "Got it" */}
                    <span className="num drill-rate-num" aria-hidden="true">
                      {k + 1}
                    </span>
                    <span className="drill-rate-next" id={`rate-${r.grade}`}>
                      {next ? fmtInterval(next[r.grade]) : r.fallback}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── 4. Put the steps in order (Parsons) ─────────────────────────────────────

export function OrderDrill({ problem: p, onDone, kicker, combo = 0, badge, meta }: DrillProps) {
  const [order, setOrder] = useState<number[] | null>(null);
  const { status, resolve } = useCheck();
  const ok = !!order && order.every((v, i) => v === i);
  return (
    <section className="drill" data-drill="order" data-problem={p.id}>
      <DrillHead
        kind="order"
        kicker={kicker}
        badge={badge}
        meta={meta}
        title={`Order the steps for ${p.title}`}
        sub="Pick the steps in the order you would write them. Select a placed step to send it back."
      />
      <OrderSteps steps={p.steps} revealed={status !== 'idle'} onChange={setOrder} />
      <ActionBar
        status={status}
        canCheck={!!order}
        onCheck={() => resolve(ok, combo)}
        onContinue={() => onDone({ kind: 'order', correct: ok })}
        feedback={
          ok ? (
            <div className="drill-fb-answer">
              <Brain className="drill-fb-icon" strokeWidth={1.9} aria-hidden="true" />
              <span>{p.mnemonic}</span>
            </div>
          ) : (
            <div className="drill-fb">
              <div className="drill-fb-label">Correct order</div>
              <CorrectOrder steps={p.steps} />
            </div>
          )
        }
      />
    </section>
  );
}

// ── Coding cards: shared pieces ─────────────────────────────────────────────

/** The problem statement, collapsed: the learner can look, but the code is the task. */
function ProblemDisclosure({ p }: { p: Problem }) {
  return (
    <details className="disclosure drill-prompt">
      <summary>
        <FileText aria-hidden="true" />
        <span className="drill-prompt-title">Problem statement</span>
        <span className="drill-summary-meta">
          <DifficultyChip d={p.difficulty} />
        </span>
      </summary>
      <ProblemPrompt p={p} compact showTitle={false} />
    </details>
  );
}

/** A quiet tool in a card's action bar, with a short label for phones (see .drill-tools). */
function ToolButton({ icon, label, short, onClick, className = '' }: { icon: ReactNode; label: string; short: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" className={`btn btn-quiet btn-sm ${className}`} onClick={onClick} aria-label={label}>
      {icon}
      <span className="drill-tool-long" aria-hidden="true">
        {label}
      </span>
      <span className="drill-tool-short" aria-hidden="true">
        {short}
      </span>
    </button>
  );
}

/** The checked action right after "Show answer": nothing typed to fix, so it says what comes next (as Key lines does). */
const TYPE_IT_NOW = { label: 'Type it now', short: 'Type it' } as const;

/** "Show answer" left of Check: reveals the answer as a miss, for a card the learner cannot recall. */
function ShowAnswerButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="btn btn-quiet btn-sm drill-give-up" onClick={onClick}>
      <Eye aria-hidden="true" />
      Show answer
    </button>
  );
}

/** Once checked, bring the first line to fix (or the whole result) into view, above the action bar. */
function useRevealScroll(root: RefObject<HTMLElement | null>, revealed: boolean, perfect: boolean, target: string) {
  useEffect(() => {
    if (!revealed) return;
    const el = root.current?.querySelector<HTMLElement>(target) ?? root.current?.querySelector<HTMLElement>('.typer-window');
    if (!el) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Two frames: after the action bar has grown with its feedback (it sets the scroll padding).
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => el.scrollIntoView({ block: perfect ? 'nearest' : 'center', behavior: reduce ? 'auto' : 'smooth' }));
    });
    return () => cancelAnimationFrame(raf);
  }, [revealed]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * The action bar's title and body for a coding card. The first check is the score; a fix after
 * "Fix and check again" is practice and says so.
 */
function codeFeedback({
  checks,
  perfect,
  gaveUp,
  summary,
  comesBack,
  unit,
}: {
  checks: number;
  perfect: boolean;
  gaveUp: boolean;
  /** "2 of 3 gaps correct": said after a fix that is still off. */
  summary: string;
  comesBack?: boolean;
  /** What the card asks for, for the title after a right fix ("All gaps right now"). */
  unit: 'gaps' | 'lines';
}): { title?: string; body: ReactNode } {
  const again = comesBack ? ' It comes back later in this session.' : '';
  if (checks <= 1) {
    if (perfect) return { body: 'Every line matches the solution.' };
    if (gaveUp) return { title: 'Answer shown', body: `Lines with a plus are the answer. Type them once, or continue.${again}` };
    return { body: `Lines with a plus show the answer. Fix yours, or continue.${again}` };
  }
  if (perfect) return { title: `All ${unit} right now`, body: 'Your first check is what counts for this review. The fix still helps it stick.' };
  return { body: `${summary}. Your first check is what counts for this review.` };
}

// ── 5. Write the key line ───────────────────────────────────────────────────

export function KeyLineDrill({ problem: p, onDone, kicker, combo = 0, badge, meta, line, comesBack }: DrillProps) {
  const settings = useProgress().settings;
  const drill = useMemo(() => keyLineDrill(p, undefined, line), [p, line]);
  const parsed = parseSolution(p.solution);
  // Typed by default on every device. "Show options" is a helper: a line picked from the options,
  // or typed after seeing them, counts as recognition, not as code written.
  const [typing, setTyping] = useState(() => preferTyping(settings.typingMode));
  const [sawOptions, setSawOptions] = useState(() => !preferTyping(settings.typingMode));
  const [sel, setSel] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [first, setFirst] = useState<{ ok: boolean; coded: boolean } | null>(null);
  const [checks, setChecks] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);
  const [autoFocus] = useState(isFinePointer);
  const inputRef = useRef<HTMLInputElement>(null);
  if (!drill) {
    return <OrderDrill problem={p} onDone={onDone} kicker={kicker} combo={combo} badge={badge} meta={meta} />;
  }
  const chosen = typing ? typed : sel ?? '';
  const ok = sameCode(chosen, drill.answer);
  const explain = parsed.chunks[parsed.lines[drill.lineIndex].chunk]?.explain;
  const filled = typing ? typed.trim() : sel?.trim();

  const check = () => {
    releaseFocus();
    setStatus(ok ? 'correct' : 'wrong');
    setChecks((c) => c + 1);
    sfx(ok ? 'correct' : 'wrong', combo);
    if (!first) setFirst({ ok, coded: typing && !sawOptions });
  };
  // "Show answer" before the first check: the line is revealed, and the card counts as a miss.
  const giveUp = () => {
    releaseFocus();
    setStatus('wrong');
    setChecks((c) => c + 1);
    setGaveUp(true);
    setFirst({ ok: false, coded: typing && !sawOptions });
  };
  // The symbol keys type at the caret, as in a gap, and keep the phone keyboard open.
  const typeKey = (ch: string) => {
    const el = inputRef.current;
    if (!el || el.disabled) return;
    if (document.activeElement !== el) el.focus({ preventScroll: true });
    insertAtCaret(el, ch, setTyped);
  };
  // "Fix and check again": the input comes back in this click (flushSync), so it takes focus inside
  // the tap and a phone opens its keyboard.
  const fix = () => {
    flushSync(() => setStatus('idle'));
    inputRef.current?.focus();
    inputRef.current?.select();
  };
  const toggle = () => {
    if (typing) setSawOptions(true);
    setTyping((t) => !t);
  };
  const finish = () => {
    const r = first ?? { ok, coded: false };
    onDone({ kind: 'keyline', correct: r.ok, coded: r.coded, lines: r.coded ? { correct: r.ok ? 1 : 0, total: 1 } : undefined });
  };
  const later = checks > 1;
  // Right after "Show answer", the second step is typing the line, not fixing one.
  const shown = gaveUp && checks === 1;

  return (
    <section className="drill" data-drill="keyline" data-problem={p.id}>
      <DrillHead
        kind="keyline"
        badge={badge}
        meta={meta}
        // With the options showing (or the tap opt-in), the card is a choice: the kicker says so too.
        kicker={kicker ?? (typing ? undefined : 'Choose the key line')}
        title={typing ? `Write the missing line of ${p.title}` : `Choose the missing line of ${p.title}`}
      />
      {explain && (
        <div className="callout callout-brand drill-explain">
          <MessageSquareText aria-hidden="true" />
          <div>
            <div className="drill-fb-label">This part</div>
            {inline(explain)}
          </div>
        </div>
      )}
      <CodeWindow>
        <CodeView
          lines={parsed.lines}
          blankIndex={drill.lineIndex}
          blankContent={status === 'idle' ? filled || '???' : ok ? drill.answer.trim() : chosen.trim() || '???'}
          blankState={status === 'idle' ? undefined : ok ? 'correct' : 'wrong'}
        />
      </CodeWindow>
      {typing ? (
        <div>
          <label className="drill-label" htmlFor={`line-${p.id}`}>
            <span>Your line</span>
            <span className="drill-keys" aria-hidden="true">
              <Kbd>Enter</Kbd> to check
            </span>
          </label>
          <input
            ref={inputRef}
            id={`line-${p.id}`}
            className="input mono drill-line-input"
            autoFocus={autoFocus}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            enterKeyHint="done"
            translate="no"
            placeholder="Type the missing line"
            value={typed}
            disabled={status !== 'idle'}
            onChange={(e) => setTyped(e.target.value)}
            // A phone's keyboard covers the lower half: keep the symbol keys under the input in view.
            onFocus={(e) => e.currentTarget.parentElement?.querySelector('.drill-line-keys')?.scrollIntoView({ block: 'nearest' })}
          />
          {status === 'idle' && <SymbolKeys className="drill-line-keys" onKey={typeKey} />}
          <div className="help">Spacing and quote style don't matter.</div>
        </div>
      ) : (
        <div>
          <AnswerLabel keys={drill.options.length}>Choose the missing line</AnswerLabel>
          <Choices
            options={codeOptions(drill.options)}
            selected={sel}
            onSelect={(k) => {
              setSel(k);
              sfx('tap');
            }}
            answer={drill.answer}
            revealed={status !== 'idle'}
            code
          />
        </div>
      )}
      <ActionBar
        status={status}
        step={checks}
        canCheck={chosen.trim().length > 0}
        onCheck={check}
        onContinue={finish}
        title={later && ok ? 'Right now' : shown ? 'Answer shown' : undefined}
        secondary={
          // Two tools beside Check: phones show their short names ("Answer", "Options"), the
          // narrowest only their icons; the full name stays the accessible one.
          <div className="drill-tools">
            {!first && <ToolButton icon={<Eye aria-hidden="true" />} label="Show answer" short="Answer" onClick={giveUp} className="drill-give-up" />}
            <ToolButton
              icon={typing ? <List aria-hidden="true" /> : <Keyboard aria-hidden="true" />}
              label={typing ? 'Show options' : 'Type it'}
              short={typing ? 'Options' : 'Type it'}
              onClick={toggle}
            />
          </div>
        }
        checkedSecondary={typing && status === 'wrong' ? <CheckedAction onClick={fix} {...(shown ? TYPE_IT_NOW : {})} /> : undefined}
        feedback={
          <div className="drill-fb">
            {!ok && <LineDiff yours={chosen.trim()} expected={drill.answer.trim()} />}
            {shown && <div>The line with a plus is the answer. Type it once, or continue.</div>}
            {later ? (
              <div>{ok ? 'Your first check is what counts for this review. The fix still helps it stick.' : 'Your first check is what counts for this review.'}</div>
            ) : shown ? null : (
              // After a miss the diff says it all (the explanation is in the callout above), so the bar stays short on phones.
              explain && (ok || !comesBack) && <div>{inline(explain)}</div>
            )}
            {!later && !ok && comesBack && <div className="drill-fb-note">It comes back later in this session.</div>}
          </div>
        }
      />
    </section>
  );
}

// ── 6. Fill the gaps (review) ───────────────────────────────────────────────

export function GapsDrill({ problem: p, onDone, kicker, combo = 0, badge, meta, seed = 0, comesBack }: DrillProps) {
  const src = useMemo(() => reviewGaps(p, seed), [p, seed]);
  // The set was picked for this card (2 or 3 lines, a key line among them, see `reviewGaps`):
  // pin it by keeping every other line visible.
  const keep = useMemo(() => src.lines.flatMap((_, i) => (src.gaps.includes(i) ? [] : [i])), [src]);
  const ex = useGaps(src.lines, { exclude: keep, min: src.gaps.length, max: src.gaps.length });
  const [first, setFirst] = useState<GapsGrade | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const [checks, setChecks] = useState(0);
  const [autoFocus] = useState(isFinePointer);
  const rootRef = useRef<HTMLElement>(null);
  const gapsRef = useRef<CodeGapsHandle>(null);
  useRevealScroll(rootRef, ex.revealed, ex.grade.perfect, '.gaps .diff.del');

  const g = ex.grade;
  const n = ex.gaps.length;
  const status: CheckStatus = ex.revealed ? (g.perfect ? 'correct' : 'wrong') : 'idle';

  const reveal = (giveUp: boolean) => {
    if (ex.revealed) return;
    const r = ex.check();
    setChecks((c) => c + 1);
    if (!first) {
      setFirst(r);
      setGaveUp(giveUp && !r.perfect);
    }
    if (!giveUp || r.perfect) sfx(r.perfect ? 'correct' : 'wrong', combo);
  };
  // Enter on the last gap and Ctrl/⌘ + Enter both land here.
  const check = () => {
    if (ex.filled > 0) reveal(false);
  };
  // "Fix and check again": the gaps come back in this click (flushSync), so the first gap to fix
  // takes focus inside the tap and a phone opens its keyboard.
  const retry = () => {
    const k = ex.gaps.findIndex((_, j) => !g.results[j]?.ok);
    flushSync(ex.retry);
    gapsRef.current?.focus(k >= 0 ? k : undefined);
  };
  const finish = () =>
    onDone({ kind: 'gaps', correct: !!first?.perfect, coded: true, lines: first ? { correct: first.correct, total: first.total } : undefined });

  const fb = ex.revealed ? codeFeedback({ checks, perfect: g.perfect, gaveUp, summary: gapsSummary(g), comesBack, unit: 'gaps' }) : null;
  const left = ex.gaps.filter((_, k) => !ex.locked[k]).length;
  // Right after "Show answer" there is nothing of the learner's to fix: the second step is typing it.
  const shown = gaveUp && checks === 1;

  return (
    <section ref={rootRef} className="drill drill-code" data-drill="gaps" data-problem={p.id}>
      <DrillHead
        kind="gaps"
        kicker={kicker}
        badge={badge}
        meta={meta}
        title={`Fill the gaps in ${p.title}`}
        sub={
          first && !ex.revealed && !shown
            ? 'Fix the lines that were off, then check again.'
            : `Type the ${plural(n, 'missing line')} from memory, then check.`
        }
      />
      <ProblemDisclosure p={p} />
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
        label={`${p.title} solution with ${plural(n, 'missing line')}`}
        filename="solution.py"
        meta={plural(n, 'gap')}
        note={left === n ? `${plural(n, 'line')} missing` : `${left} to fix`}
      />
      <ActionBar
        status={status}
        step={`${seed}:${checks}`}
        canCheck={ex.filled > 0}
        onCheck={check}
        onContinue={finish}
        title={fb?.title}
        feedback={fb && <span>{fb.body}</span>}
        secondary={first ? undefined : <ShowAnswerButton onClick={() => reveal(true)} />}
        checkedSecondary={status === 'wrong' ? <CheckedAction onClick={retry} {...(shown ? TYPE_IT_NOW : {})} /> : undefined}
      />
    </section>
  );
}

// ── 7. Write a part ─────────────────────────────────────────────────────────

/** Above this many lines before the part, only the last `KEEP_BEFORE` show until expanded. */
const LONG_BEFORE = 10;
const KEEP_BEFORE = 8;

/**
 * Where "Fix and check again" puts the caret: at the end of the first line to fix, or of the line
 * a missing one belongs after. Indices in a grade skip blank and comment lines; map them back.
 */
function fixCaret(text: string, g: CodeGrade): number {
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
  for (const l of text.split('\n')) {
    if (!isIgnorable(l)) k++;
    if (k === target) return pos + l.length;
    pos += l.length + 1;
  }
  return text.length;
}

export function PartDrill({ problem: p, onDone, kicker, combo = 0, badge, meta, seed = 0, chunk, comesBack }: DrillProps) {
  const parsed = parseSolution(p.solution);
  const ci = useMemo(() => chunk ?? pickPart(p, seed), [p, chunk, seed]);
  // The guided lesson's split: signature lines that open the part (a design problem's
  // `def push(self, val: int) -> None:`) are given, as LeetCode's starter code gives them; only
  // the body is written and graded. Signatures that close a chunk belong to the next part.
  const lp = useMemo(() => reviewParts(p).get(ci)!, [p, ci]);
  const part = lp.chunk;
  const { lead, body: toWrite } = lp;
  const parts = parsed.chunks.filter((c) => !c.header);
  const partNo = parts.indexOf(part) + 1;
  // Everything before the part is given (the header and the earlier parts); nothing after it.
  const before = parsed.chunks.slice(0, ci).flatMap((c) => c.lines);
  const n = codeLines(toWrite).length;
  // Typing starts at the body's least indented line, and grading is anchored there: the part must
  // line up under the code above it. The cue sits at the part's own indentation (above its `def`).
  const indent = baseIndent(toWrite);
  const cueIndent = baseIndent(part.lines);
  // Names the part defines that are nowhere on screen: the code is compared line by line with
  // the solution, so the card names them ("Use the solution's names: need").
  const names = useMemo(() => definedNames(toWrite, [...before, ...lead, part.explain]), [p, ci]); // eslint-disable-line react-hooks/exhaustive-deps
  const [text, setText] = useState('');
  const [grade, setGrade] = useState<CodeGrade | null>(null);
  const [first, setFirst] = useState<CodeGrade | null>(null);
  const [gaveUp, setGaveUp] = useState(false);
  const [checks, setChecks] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [autoFocus] = useState(isFinePointer);
  const rootRef = useRef<HTMLElement>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  useRevealScroll(rootRef, !!grade, !!grade?.perfect, '.typer-diff .diff:not(.ok)');

  const hidden = !expanded && before.length > LONG_BEFORE ? before.length - KEEP_BEFORE : 0;
  const given = before.slice(hidden);
  const start = hidden + 1;
  const firstLine = before.length + 2 + lead.length; // after the cue comment and the given signature
  const status: CheckStatus = grade ? (grade.perfect ? 'correct' : 'wrong') : 'idle';

  const reveal = (typed: string, giveUp: boolean) => {
    const r = gradeCode(typed, toWrite, { anchor: indent });
    setGrade(r);
    setChecks((c) => c + 1);
    if (!first) {
      setFirst(r);
      setGaveUp(giveUp && !r.perfect);
    }
    if (!giveUp || r.perfect) sfx(r.perfect ? 'correct' : 'wrong', combo);
  };
  const check = () => {
    if (!grade && text.trim()) reveal(text, false);
  };
  // "Fix and check again": the editor comes back in this click with the caret on the first line to
  // fix (flushSync, so a phone opens its keyboard inside the tap).
  const fix = () => {
    if (!grade) return;
    const pos = fixCaret(text, grade);
    flushSync(() => setGrade(null));
    const ta = taRef.current;
    if (!ta) return;
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(pos, pos);
    ta.scrollIntoView({ block: 'nearest' });
  };
  const finish = () => onDone({ kind: 'part', correct: !!first?.perfect, coded: true, lines: first ? { correct: first.correct, total: first.total } : undefined });

  const fb = grade ? codeFeedback({ checks, perfect: grade.perfect, gaveUp, summary: gradeSummary(grade), comesBack, unit: 'lines' }) : null;
  // Right after "Show answer" there is nothing of the learner's to fix: the second step is typing it.
  const shown = gaveUp && checks === 1;

  // The part to write, as a comment in the file (the cue), then the signature it opens with.
  const above = (
    <>
      <div className="typer-line drill-cue">
        <span className="typer-ln">{before.length + 1}</span>
        <span className="drill-cue-text" style={{ ['--indent' as string]: `${cueIndent}ch` }}>
          <span className="drill-cue-hash"># </span>
          {part.explain}
        </span>
      </div>
      <GivenLines lines={lead} start={before.length + 2} />
    </>
  );
  const nameNote = names.length > 0 && (
    <>
      {' '}
      Use the solution&rsquo;s names:{' '}
      {names.map((x, k) => (
        <Fragment key={x}>
          {k > 0 && ', '}
          <code translate="no">{x}</code>
        </Fragment>
      ))}
      .
    </>
  );

  return (
    <section ref={rootRef} className="drill drill-code" data-drill="part" data-problem={p.id}>
      <DrillHead
        kind="part"
        kicker={kicker}
        badge={badge}
        meta={meta}
        title={`Write the next part of ${p.title}`}
        sub={
          first && !grade ? (
            shown ? (
              <>Type the part from memory, then check.{nameNote}</>
            ) : (
              'Fix the lines that were off, then check again.'
            )
          ) : (
            <>
              Write the {plural(n, 'line')} the highlighted comment describes, under the code above.{nameNote}
            </>
          )
        }
      />
      <ProblemDisclosure p={p} />
      <TyperWindow
        status={status}
        filename="solution.py"
        meta={`Part ${partNo} of ${parts.length}`}
        footer={<TyperFooter grade={grade} note={first && !grade ? `Check ${checks + 1}` : `${plural(n, 'line')} to write`} />}
      >
        {before.length > LONG_BEFORE && (
          <button type="button" className="drill-fold" aria-expanded={expanded} onClick={() => setExpanded((e) => !e)}>
            {expanded ? <ChevronsDownUp aria-hidden="true" /> : <ChevronsUpDown aria-hidden="true" />}
            {expanded ? 'Hide earlier lines' : `Show ${plural(before.length - KEEP_BEFORE, 'earlier line')}`}
          </button>
        )}
        {grade ? (
          <CodeDiff grade={grade} given={given} start={start} firstLine={firstLine} indent={indent}>
            {above}
          </CodeDiff>
        ) : (
          <CodeEditor
            value={text}
            onChange={setText}
            label={`Code for this part: ${part.explain}`}
            given={given}
            start={start}
            firstLine={firstLine}
            indent={indent}
            minRows={Math.max(2, n + 1)}
            autoFocus={autoFocus}
            textareaRef={taRef}
            placeholder={[`Write the ${plural(n, 'line')} for this part`, `Write ${plural(n, 'line')}`]}
          >
            {above}
          </CodeEditor>
        )}
      </TyperWindow>
      <ActionBar
        status={status}
        step={`${ci}:${checks}`}
        canCheck={text.trim().length > 0}
        onCheck={check}
        onContinue={finish}
        title={fb?.title}
        feedback={fb && <span>{fb.body}</span>}
        secondary={first ? undefined : <ShowAnswerButton onClick={() => reveal('', true)} />}
        checkedSecondary={status === 'wrong' ? <CheckedAction onClick={fix} {...(shown ? TYPE_IT_NOW : {})} /> : undefined}
      />
    </section>
  );
}

// ── 8. Complexity ───────────────────────────────────────────────────────────

export function ComplexityDrill({ problem: p, onDone, kicker, combo = 0, badge, meta }: DrillProps) {
  const which = useMemo<'time' | 'space'>(() => (Math.random() < 0.7 ? 'time' : 'space'), []);
  const { options, answer } = useMemo(() => complexityChoices(p, which), [p, which]);
  const parsed = parseSolution(p.solution);
  const [sel, setSel] = useState<string | null>(null);
  const { status, resolve } = useCheck();
  return (
    <section className="drill" data-drill="complexity" data-problem={p.id}>
      <DrillHead
        kind="complexity"
        kicker={kicker}
        badge={badge}
        meta={meta}
        title={
          <>
            What is the <span className="drill-key">{which}</span> complexity of this {p.title} solution?
          </>
        }
      />
      <details className="disclosure drill-code-disclosure">
        <summary>
          <CodeXml aria-hidden="true" />
          Show the solution
          <span className="drill-summary-meta">{parsed.lines.length} lines</span>
        </summary>
        <CodeView lines={parsed.lines} />
      </details>
      <div>
        <AnswerLabel keys={options.length}>{which === 'time' ? 'Time complexity' : 'Space complexity'}</AnswerLabel>
        <Choices
          options={options.map((o) => ({ key: o, label: <span className="mono">{o}</span> }))}
          selected={sel}
          onSelect={(k) => {
            setSel(k);
            sfx('tap');
          }}
          answer={answer}
          revealed={status !== 'idle'}
          twoCol
        />
      </div>
      <ActionBar
        status={status}
        canCheck={sel !== null}
        onCheck={() => resolve(sel === answer, combo)}
        onContinue={() => onDone({ kind: 'complexity', correct: sel === answer })}
        feedback={
          <div className="drill-fb">
            <div className="drill-cost">
              {(['time', 'space'] as const).map((k) => (
                <span key={k} className={`drill-cost-item ${k === which ? 'is-asked' : ''}`}>
                  {k === 'time' ? 'Time' : 'Space'} <span className="mono">{p[k]}</span>
                </span>
              ))}
            </div>
            <Md text={p.complexityWhy} />
          </div>
        }
      />
    </section>
  );
}

export function Drill(props: DrillProps & { kind: DrillKind }) {
  const { kind, ...rest } = props;
  switch (kind) {
    case 'pattern':
      return <PatternDrill {...rest} />;
    case 'technique':
      return <TechniqueDrill {...rest} />;
    case 'insight':
      return <InsightDrill {...rest} />;
    case 'order':
      return <OrderDrill {...rest} />;
    case 'keyline':
      return <KeyLineDrill {...rest} />;
    case 'complexity':
      return <ComplexityDrill {...rest} />;
    case 'gaps':
      return <GapsDrill {...rest} />;
    case 'part':
      return <PartDrill {...rest} />;
  }
}

/** Moved to the typing kit; re-exported so existing imports keep working. */
export { codeKeyHandler } from './CodeTyper';
