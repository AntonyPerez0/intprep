import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Problem } from '../content/types';
import { highlightLine } from '../lib/highlight';
import { inline, Md } from '../lib/markdown';
import type { SolutionLine } from '../lib/parseSolution';
import { shuffle } from '../lib/random';
import { DifficultyChip, Icon } from './ui';

// ── Action bar: Check → feedback → Continue ─────────────────────────────────

export type CheckStatus = 'idle' | 'correct' | 'wrong';

const PRAISE = ['Nice!', 'Correct!', 'Great job!', 'You got it!', 'Excellent!', 'Spot on!', 'Brilliant!'];
const ENCOURAGE = ['Not quite', 'Almost!', 'Good try', 'Not this time'];

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
  const praise = useMemo(() => PRAISE[Math.floor(Math.random() * PRAISE.length)], [status]); // eslint-disable-line
  const enc = useMemo(() => ENCOURAGE[Math.floor(Math.random() * ENCOURAGE.length)], [status]); // eslint-disable-line
  const primary = status === 'idle' ? onCheck ?? onContinue : onContinue;
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

  return (
    <div className={`actionbar ${status}`}>
      <div className="actionbar-inner">
        {status !== 'idle' && (
          <div>
            <div className="feedback-title">
              <span className="feedback-icon" style={{ color: status === 'correct' ? 'var(--green)' : 'var(--red)' }}>
                <Icon name={status === 'correct' ? 'check' : 'x'} size={20} stroke={3.5} />
              </span>
              {title ?? (status === 'correct' ? praise : enc)}
            </div>
            {feedback && <div className="feedback-body">{feedback}</div>}
          </div>
        )}
        <div className="buttons">
          {status === 'idle' ? secondary ?? <span /> : <span />}
          <button
            type="button"
            className={`btn ${status === 'wrong' ? 'btn-red' : 'btn-green'}`}
            disabled={!primaryEnabled}
            onClick={primary}
            autoFocus={status !== 'idle'}
          >
            {status === 'idle' && onCheck ? checkLabel : continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Multiple choice ─────────────────────────────────────────────────────────

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
}: {
  options: ChoiceOption[];
  selected: string | null;
  onSelect: (key: string) => void;
  /** Correct key(s) — shown once revealed. */
  answer: string | string[];
  revealed: boolean;
  code?: boolean;
  twoCol?: boolean;
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
    <div className={`choices ${twoCol ? 'two-col' : ''}`} role="radiogroup">
      {options.map((o, i) => {
        let cls = '';
        if (revealed) {
          if (answers.includes(o.key)) cls = 'correct';
          else if (o.key === selected) cls = 'wrong shake';
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
  lineNumbers,
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
    focusRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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

// ── Problem prompt ──────────────────────────────────────────────────────────

export function ProblemPrompt({ p, compact, showTitle = true }: { p: Problem; compact?: boolean; showTitle?: boolean }) {
  return (
    <div className="prompt-card">
      {showTitle && (
        <div className="row between wrap" style={{ marginBottom: 8 }}>
          <strong style={{ fontSize: '1.05rem' }}>{p.title}</strong>
          <DifficultyChip d={p.difficulty} />
        </div>
      )}
      <Md text={p.prompt} />
      {(compact ? p.examples.slice(0, 1) : p.examples).map((e, i) => (
        <div className="example" key={i}>
          <div>
            <span className="lbl">Input: </span>
            {e.input}
          </div>
          <div>
            <span className="lbl">Output: </span>
            {e.output}
          </div>
          {e.note && !compact && <div className="note">{inline(e.note)}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Parsons: put the steps in order ─────────────────────────────────────────

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
        {placed.length === 0 && <div className="faint small center" style={{ padding: 12 }}>Tap the steps below in the order you would do them</div>}
        {placed.map((i, pos) => {
          const state = revealed ? (i === pos ? 'correct' : 'wrong') : '';
          return (
            <button key={i} type="button" className={`parsons-item ${state}`} onClick={() => unplace(i)} disabled={revealed}>
              <span className="idx">{pos + 1}.</span>
              <span>{inline(steps[i])}</span>
            </button>
          );
        })}
      </div>
      {bank.length > 0 && (
        <div className="stack" style={{ gap: 8 }}>
          {bank.map((i) => (
            <button key={i} type="button" className="parsons-item" onClick={() => place(i)} disabled={revealed}>
              <span className="idx">•</span>
              <span>{inline(steps[i])}</span>
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
