import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, CircleCheck, CircleX, Check, X, CornerDownLeft, FileCode2 } from 'lucide-react';
import type { Problem } from '../content/types';
import { highlightLine } from '../lib/highlight';
import { inline, Md } from '../lib/markdown';
import type { SolutionLine } from '../lib/parseSolution';
import { shuffle } from '../lib/random';
import { DifficultyChip } from './ui';

// ── Action bar: Check → feedback → Continue ─────────────────────────────────
//
// Stable hooks used by tests: .actionbar(.correct|.wrong), .actionbar .buttons > .btn:last-child
// SessionShell measures the bar into --actionbar-h so the session body always clears it.

export type CheckStatus = 'idle' | 'correct' | 'wrong';

const PRAISE = ['Correct', 'Nicely done', 'Exactly right', 'Well done', 'Spot on'];
const ENCOURAGE = ['Not quite', 'Not this time', 'Close, but no'];

export function ActionBar({
  status,
  onCheck,
  onContinue,
  canCheck = true,
  checkLabel = 'Check',
  continueLabel = 'Continue',
  feedback,
  secondary,
  title,
}: {
  status: CheckStatus;
  onCheck?: () => void;
  onContinue: () => void;
  canCheck?: boolean;
  checkLabel?: string;
  continueLabel?: string;
  feedback?: ReactNode;
  secondary?: ReactNode;
  title?: string;
}) {
  const praise = useMemo(() => PRAISE[Math.floor(Math.random() * PRAISE.length)], [status]);
  const enc = useMemo(() => ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)], [status]);
  const primary = status === 'idle' ? (onCheck ?? onContinue) : onContinue;
  const primaryEnabled = status !== 'idle' || !onCheck || canCheck;

  // Enter = primary action (unless typing in a textarea).
  const ref = useRef(primary);
  ref.current = primary;
  const enabledRef = useRef(primaryEnabled);
  enabledRef.current = primaryEnabled;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      const el = e.target as HTMLElement;
      if (el.tagName === 'TEXTAREA' && !(e.metaKey || e.ctrlKey)) return;
      const isOption = el.classList?.contains('choice') || el.classList?.contains('parsons-item');
      if ((el.tagName === 'BUTTON' && !isOption) || el.tagName === 'A') return;
      if (!enabledRef.current) return;
      e.preventDefault();
      ref.current();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const isIdle = status === 'idle';
  const label = isIdle && onCheck ? checkLabel : continueLabel;

  // Double-click guard: re-arm on every state or label change (see .buttons.arm-* in shell.css).
  const armKey = `${status}|${label}`;
  const [arm, setArm] = useState({ key: armKey, n: 0 });
  if (arm.key !== armKey) setArm({ key: armKey, n: arm.n + 1 });

  return (
    <div className={`actionbar ${status}`} role={isIdle ? undefined : 'status'}>
      <div className="actionbar-inner">
        {!isIdle && (
          <div>
            <div className="feedback-title">
              {status === 'correct' ? <CircleCheck strokeWidth={2.2} /> : <CircleX strokeWidth={2.2} />}
              {title ?? (status === 'correct' ? praise : enc)}
            </div>
            {feedback && <div className="feedback-body">{feedback}</div>}
          </div>
        )}
        <div className={`buttons arm-${arm.n % 2}`}>
          {isIdle ? (secondary ?? <span />) : <span />}
          <button
            type="button"
            className={`btn btn-lg ${status === 'wrong' ? 'btn-danger' : status === 'correct' ? 'btn-success' : 'btn-primary'}`}
            disabled={!primaryEnabled}
            onClick={primary}
            autoFocus={!isIdle}
          >
            {label}
            {isIdle && onCheck ? null : <ArrowRight />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Multiple choice ─────────────────────────────────────────────────────────
//
// Stable hooks: .choice, .choice.selected, .choice.correct, .choice.wrong

export interface ChoiceOption {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
}

export function Choices({
  options,
  selected,
  onSelect,
  answer,
  revealed,
  code,
  twoCol,
  label = 'Answer options',
}: {
  options: ChoiceOption[];
  selected: string | null;
  onSelect: (key: string) => void;
  /** Correct key(s) — shown once revealed. */
  answer: string | string[];
  revealed: boolean;
  code?: boolean;
  twoCol?: boolean;
  /** Accessible name for the radio group. */
  label?: string;
}) {
  const answers = Array.isArray(answer) ? answer : [answer];
  // Number keys pick options.
  const optsRef = useRef(options);
  optsRef.current = options;
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
      const n = Number(e.key);
      if (!revealedRef.current && n >= 1 && n <= optsRef.current.length) selectRef.current(optsRef.current[n - 1].key);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className={`choices ${twoCol ? 'two-col' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o, i) => {
        let cls = '';
        let mark: ReactNode = null;
        if (revealed) {
          if (answers.includes(o.key)) {
            cls = 'correct';
            mark = <Check strokeWidth={2.4} />;
          } else if (o.key === selected) {
            cls = 'wrong shake';
            mark = <X strokeWidth={2.4} />;
          }
        } else if (o.key === selected) cls = 'selected';
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={o.key === selected}
            className={`choice ${cls} ${code ? 'code-choice' : ''}`}
            disabled={revealed}
            onClick={() => onSelect(o.key)}
          >
            {!code && <span className="num">{i + 1}</span>}
            {o.icon && <span className="choice-icon">{o.icon}</span>}
            <span className="grow">{o.label}</span>
            {mark && <span className="choice-mark">{mark}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Code view ───────────────────────────────────────────────────────────────

export function CodeView({
  lines,
  focusChunk,
  hideAfterChunk,
  blankIndex,
  blankContent,
  blankState,
  showKeys,
  lineNumbers = true,
}: {
  lines: SolutionLine[];
  focusChunk?: number;
  /** Lines from chunks after this one are not rendered (progressive reveal). */
  hideAfterChunk?: number;
  blankIndex?: number;
  blankContent?: ReactNode;
  blankState?: 'correct' | 'wrong';
  showKeys?: boolean;
  lineNumbers?: boolean;
}) {
  const shown = hideAfterChunk === undefined ? lines : lines.filter((l) => l.chunk <= hideAfterChunk);
  const focusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    focusRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [focusChunk]);
  let firstFocus = true;
  return (
    <pre className="code">
      {shown.map((l, i) => {
        const idx = lines.indexOf(l);
        const focus = focusChunk !== undefined && l.chunk === focusChunk;
        const dim = focusChunk !== undefined && !focus;
        const isBlank = idx === blankIndex;
        const indent = l.text.match(/^\s*/)?.[0] ?? '';
        const setRef = focus && firstFocus;
        if (setRef) firstFocus = false;
        return (
          <div
            key={i}
            ref={setRef ? focusRef : undefined}
            className={`code-line ${focus ? 'focus' : ''} ${dim ? 'dim' : ''} ${showKeys && l.key ? 'key' : ''}`}
          >
            {lineNumbers && <span className="ln">{i + 1}</span>}
            {isBlank ? (
              <>
                {indent}
                <span className={`blank ${blankState ? `filled-${blankState}` : ''}`}>{blankContent ?? '???'}</span>
              </>
            ) : l.text === '' ? (
              ' '
            ) : (
              highlightLine(l.text)
            )}
          </div>
        );
      })}
    </pre>
  );
}

// ── Code window ─────────────────────────────────────────────────────────────

/**
 * An editor-style frame around code: a file tab, then `meta` (e.g. "12 lines") and the
 * language on the right, an optional footer. Wrap a <CodeView> or <HighlightedCode>.
 * `right` replaces the meta + language slot (e.g. a step counter).
 */
export function CodeWindow({
  filename = 'solution.py',
  lang = 'Python',
  meta,
  right,
  footer,
  children,
  className = '',
}: {
  filename?: string;
  lang?: ReactNode;
  meta?: ReactNode;
  right?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`code-window ${className}`}>
      <div className="code-window-head">
        <span className="code-window-tab">
          <FileCode2 strokeWidth={1.9} aria-hidden="true" />
          {filename}
        </span>
        <span className="code-window-right">
          {right ?? (
            <>
              {meta && <span className="code-window-meta tabular">{meta}</span>}
              {lang && <span className="code-window-lang">{lang}</span>}
            </>
          )}
        </span>
      </div>
      <div className="code-window-body">{children}</div>
      {footer && <div className="code-window-foot">{footer}</div>}
    </div>
  );
}

// ── Problem statement ───────────────────────────────────────────────────────

export function ProblemPrompt({ p, compact, showTitle = true }: { p: Problem; compact?: boolean; showTitle?: boolean }) {
  return (
    <div className="prompt-card">
      {showTitle && (
        <div className="row between" style={{ marginBottom: 10, gap: 12 }}>
          <div className="row" style={{ gap: 8, minWidth: 0 }}>
            <span className="fw-600 truncate" style={{ fontSize: 'var(--fs-base)' }}>
              {p.title}
            </span>
            <span className="text-xs text-tertiary tabular">#{p.num}</span>
          </div>
          <DifficultyChip d={p.difficulty} />
        </div>
      )}
      <Md text={p.prompt} />
      {(compact ? p.examples.slice(0, 1) : p.examples).map((e, i) => (
        <div className="example" key={i}>
          <div>
            <span className="lbl">Input</span>
            {e.input}
          </div>
          <div>
            <span className="lbl">Output</span>
            {e.output}
          </div>
          {e.note && !compact && <div className="note">{inline(e.note)}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Parsons: put the steps in order ─────────────────────────────────────────
//
// Stable hooks: .parsons-slot, .parsons-item

export function OrderSteps({
  steps,
  revealed,
  onChange,
}: {
  steps: string[];
  revealed: boolean;
  /** Called with the current order (indices into `steps`), or null if incomplete. */
  onChange: (order: number[] | null) => void;
}) {
  const initial = useMemo(() => {
    let s = shuffle(steps.map((_, i) => i));
    // Never start already solved.
    if (s.every((v, i) => v === i) && s.length > 1) s = [...s.slice(1), s[0]];
    return s;
  }, [steps]);
  const [bank, setBank] = useState<number[]>(initial);
  const [placed, setPlaced] = useState<number[]>([]);

  useEffect(() => {
    onChange(placed.length === steps.length ? placed : null);
  }, [placed, steps.length]); // eslint-disable-line

  const place = (i: number) => {
    if (revealed) return;
    setBank((b) => b.filter((x) => x !== i));
    setPlaced((p) => [...p, i]);
  };
  const unplace = (i: number) => {
    if (revealed) return;
    setPlaced((p) => p.filter((x) => x !== i));
    setBank((b) => [...b, i]);
  };

  return (
    <div className="stack">
      <div className="parsons-slot" aria-label="Your order">
        {placed.length === 0 && (
          <div className="text-sm text-tertiary center" style={{ padding: 16 }}>
            Select the steps below in the order you would perform them.
          </div>
        )}
        {placed.map((i, pos) => {
          const state = revealed ? (i === pos ? 'correct' : 'wrong') : '';
          return (
            <button key={i} type="button" className={`parsons-item ${state}`} onClick={() => unplace(i)} disabled={revealed} title="Remove">
              <span className="idx">{pos + 1}.</span>
              <span className="grow">{inline(steps[i])}</span>
              {revealed && (i === pos ? <Check size={16} color="var(--success)" /> : <X size={16} color="var(--danger)" />)}
            </button>
          );
        })}
      </div>
      {bank.length > 0 && (
        <div className="stack-sm parsons-bank">
          <div className="eyebrow">Available steps</div>
          {bank.map((i) => (
            <button key={i} type="button" className="parsons-item" onClick={() => place(i)} disabled={revealed}>
              <span className="idx">
                <CornerDownLeft size={14} style={{ transform: 'scaleX(-1)' }} />
              </span>
              <span className="grow">{inline(steps[i])}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CorrectOrder({ steps }: { steps: string[] }) {
  return (
    <ol className="steps-list" style={{ marginTop: 8 }}>
      {steps.map((s, i) => (
        <li key={i}>
          <span>{inline(s)}</span>
        </li>
      ))}
    </ol>
  );
}
