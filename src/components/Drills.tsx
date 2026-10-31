import { useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { CATEGORY_BY_ID } from '../content/categories';
import type { CategoryId, Problem } from '../content/types';
import {
  acceptedCategories,
  complexityChoices,
  keyLineDrill,
  patternChoices,
  sameCode,
  techniqueChoices,
  type DrillKind,
} from '../lib/drills';
import { inline, Md } from '../lib/markdown';
import { parseSolution } from '../lib/parseSolution';
import type { Grade } from '../lib/srs';
import { sfx } from '../lib/sound';
import { useProgress } from '../lib/store';
import { ActionBar, Choices, CodeView, CorrectOrder, OrderSteps, ProblemPrompt, type CheckStatus } from './interact';
import { Icon } from './ui';

export interface DrillResult {
  kind: DrillKind;
  correct: boolean;
  selfGrade?: Grade;
}

interface DrillProps {
  problem: Problem;
  onDone: (r: DrillResult) => void;
  /** Shown above the question, e.g. "Review · 3 of 12". */
  kicker?: string;
  combo?: number;
}

function useCheck(onCorrect?: () => void) {
  const [status, setStatus] = useState<CheckStatus>('idle');
  const resolve = (ok: boolean, combo = 0) => {
    setStatus(ok ? 'correct' : 'wrong');
    sfx(ok ? 'correct' : 'wrong', combo);
    if (ok) onCorrect?.();
  };
  return { status, resolve };
}

function Signals({ p }: { p: Problem }) {
  return (
    <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
      <span className="tiny muted" style={{ fontWeight: 800 }}>
        CLUES:
      </span>
      {p.signals.map((s, i) => (
        <span className="chip signal" key={i}>
          {inline(s)}
        </span>
      ))}
    </div>
  );
}

const catLabel = (c: CategoryId) => CATEGORY_BY_ID[c].name;

// ── 1. Spot the pattern ─────────────────────────────────────────────────────

export function PatternDrill({ problem: p, onDone, kicker, combo = 0 }: DrillProps) {
  const { options } = useMemo(() => patternChoices(p), [p]);
  const accepted = acceptedCategories(p);
  const [sel, setSel] = useState<string | null>(null);
  const { status, resolve } = useCheck();
  const ok = sel !== null && accepted.includes(sel as CategoryId);
  return (
    <>
      <div className="kicker">{kicker ?? 'Spot the pattern'}</div>
      <h2 className="q-title">Which pattern fits this problem best?</h2>
      <ProblemPrompt p={p} compact />
      <div style={{ height: 16 }} />
      <Choices
        options={options.map((c) => ({ key: c, label: catLabel(c), icon: CATEGORY_BY_ID[c].icon }))}
        selected={sel}
        onSelect={(k) => {
          setSel(k);
          sfx('tap');
        }}
        answer={accepted}
        revealed={status !== 'idle'}
        twoCol
      />
      <ActionBar
        status={status}
        canCheck={sel !== null}
        onCheck={() => resolve(ok, combo)}
        onContinue={() => onDone({ kind: 'pattern', correct: ok })}
        feedback={
          <>
            <div>
              <strong>{catLabel(p.category)}</strong> — {p.pattern}.
            </div>
            <Signals p={p} />
          </>
        }
      />
    </>
  );
}

// ── 2. Name the technique ───────────────────────────────────────────────────

export function TechniqueDrill({ problem: p, onDone, kicker, combo = 0 }: DrillProps) {
  const { options, answer } = useMemo(() => techniqueChoices(p), [p]);
  const [sel, setSel] = useState<string | null>(null);
  const { status, resolve } = useCheck();
  return (
    <>
      <div className="kicker">{kicker ?? 'Name the technique'}</div>
      <h2 className="q-title">Which technique cracks this one?</h2>
      <ProblemPrompt p={p} compact />
      <div style={{ height: 16 }} />
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
      <ActionBar
        status={status}
        canCheck={sel !== null}
        onCheck={() => resolve(sel === answer, combo)}
        onContinue={() => onDone({ kind: 'technique', correct: sel === answer })}
        feedback={<Md text={p.insight} />}
      />
    </>
  );
}

// ── 3. Recall the key insight (self-rated) ──────────────────────────────────

export function InsightDrill({ problem: p, onDone, kicker }: DrillProps) {
  const [revealed, setRevealed] = useState(false);
  const [note, setNote] = useState('');
  const rate = (g: Grade) => {
    sfx(g === 'again' ? 'wrong' : 'correct');
    onDone({ kind: 'insight', correct: g === 'good' || g === 'easy', selfGrade: g });
  };
  return (
    <>
      <div className="kicker">{kicker ?? 'Recall the key insight'}</div>
      <h2 className="q-title">What's the trick? Say it out loud (or type it) before you peek.</h2>
      <ProblemPrompt p={p} compact />
      <div style={{ height: 14 }} />
      {!revealed ? (
        <textarea
          className="input"
          rows={3}
          placeholder="Optional: jot the approach in your own words…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      ) : (
        <div className="stack">
          {note.trim() && (
            <div className="card flat small">
              <div className="tiny muted" style={{ fontWeight: 800 }}>
                YOU WROTE
              </div>
              {note}
            </div>
          )}
          <div className="insight-card">
            <div className="tiny" style={{ fontWeight: 900, opacity: 0.85, letterSpacing: '.08em' }}>
              KEY INSIGHT · {p.pattern.toUpperCase()}
            </div>
            <div style={{ marginTop: 6, fontWeight: 700 }}>
              <Md text={p.insight} />
            </div>
            <div className="mnemonic">🧠 {p.mnemonic}</div>
          </div>
        </div>
      )}
      <div className="actionbar">
        <div className="actionbar-inner">
          {!revealed ? (
            <div className="buttons">
              <span />
              <button type="button" className="btn btn-blue" onClick={() => setRevealed(true)}>
                Show answer
              </button>
            </div>
          ) : (
            <>
              <div className="small muted center" style={{ fontWeight: 800 }}>
                How well did you remember it?
              </div>
              <div className="grid-4">
                <button type="button" className="btn btn-red btn-sm" onClick={() => rate('again')}>
                  Forgot
                </button>
                <button type="button" className="btn btn-orange btn-sm" onClick={() => rate('hard')}>
                  Fuzzy
                </button>
                <button type="button" className="btn btn-green btn-sm" onClick={() => rate('good')}>
                  Got it
                </button>
                <button type="button" className="btn btn-blue btn-sm" onClick={() => rate('easy')}>
                  Easy
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── 4. Put the steps in order (Parsons) ─────────────────────────────────────

export function OrderDrill({ problem: p, onDone, kicker, combo = 0 }: DrillProps) {
  const [order, setOrder] = useState<number[] | null>(null);
  const { status, resolve } = useCheck();
  const ok = !!order && order.every((v, i) => v === i);
  return (
    <>
      <div className="kicker">{kicker ?? 'Put the steps in order'}</div>
      <h2 className="q-title">
        Order the steps for <em>{p.title}</em>
      </h2>
      <OrderSteps steps={p.steps} revealed={status !== 'idle'} onChange={setOrder} />
      <ActionBar
        status={status}
        canCheck={!!order}
        onCheck={() => resolve(ok, combo)}
        onContinue={() => onDone({ kind: 'order', correct: ok })}
        feedback={ok ? <span>🧠 {p.mnemonic}</span> : <CorrectOrder steps={p.steps} />}
      />
    </>
  );
}

// ── 5. Fill in the key line ─────────────────────────────────────────────────

function preferTyping(mode: 'auto' | 'type' | 'tap') {
  if (mode !== 'auto') return mode === 'type';
  return typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: fine)').matches && window.innerWidth >= 820;
}

export function KeyLineDrill({ problem: p, onDone, kicker, combo = 0 }: DrillProps) {
  const settings = useProgress().settings;
  const drill = useMemo(() => keyLineDrill(p), [p]);
  const parsed = parseSolution(p.solution);
  const [typing, setTyping] = useState(() => preferTyping(settings.typingMode));
  const [sel, setSel] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const { status, resolve } = useCheck();
  if (!drill) {
    return <OrderDrill problem={p} onDone={onDone} kicker={kicker} combo={combo} />;
  }
  const chosen = typing ? typed : sel ?? '';
  const ok = sameCode(chosen, drill.answer);
  const explain = parsed.chunks[parsed.lines[drill.lineIndex].chunk]?.explain;
  const indent = drill.answer.match(/^\s*/)?.[0] ?? '';
  return (
    <>
      <div className="kicker">{kicker ?? 'Fill in the key line'}</div>
      <h2 className="q-title">Which line completes {p.title}?</h2>
      {explain && <div className="bubble small" style={{ marginBottom: 12 }}>💬 {inline(explain)}</div>}
      <CodeView
        lines={parsed.lines}
        blankIndex={drill.lineIndex}
        blankContent={status !== 'idle' ? drill.answer.trim() : typing && typed.trim() ? typed.trim() : '???'}
        blankState={status === 'idle' ? undefined : ok ? 'correct' : 'wrong'}
      />
      <div style={{ height: 14 }} />
      {typing ? (
        <input
          className="input"
          style={{ fontFamily: 'var(--mono)', fontSize: '0.9rem' }}
          autoFocus
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder={`${indent.length ? `(${indent.length / 4} indent${indent.length > 4 ? 's' : ''}) ` : ''}type the missing line…`}
          value={typed}
          disabled={status !== 'idle'}
          onChange={(e) => setTyped(e.target.value)}
        />
      ) : (
        <Choices
          options={drill.options.map((o) => ({ key: o, label: o.trim() }))}
          selected={sel}
          onSelect={(k) => {
            setSel(k);
            sfx('tap');
          }}
          answer={drill.answer}
          revealed={status !== 'idle'}
          code
        />
      )}
      <ActionBar
        status={status}
        canCheck={chosen.trim().length > 0}
        onCheck={() => resolve(ok, combo)}
        onContinue={() => onDone({ kind: 'keyline', correct: ok })}
        secondary={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTyping((t) => !t)}>
            <Icon name={typing ? 'list' : 'keyboard'} size={16} /> {typing ? 'Choices' : 'Type it'}
          </button>
        }
        feedback={
          <>
            {!ok && (
              <div className="diff-line exp" style={{ marginBottom: 6 }}>
                {drill.answer.trim()}
              </div>
            )}
            {explain && <span>{inline(explain)}</span>}
          </>
        }
      />
    </>
  );
}

// ── 6. Complexity ───────────────────────────────────────────────────────────

export function ComplexityDrill({ problem: p, onDone, kicker, combo = 0 }: DrillProps) {
  const which = useMemo<'time' | 'space'>(() => (Math.random() < 0.7 ? 'time' : 'space'), []);
  const { options, answer } = useMemo(() => complexityChoices(p, which), [p, which]);
  const parsed = parseSolution(p.solution);
  const [sel, setSel] = useState<string | null>(null);
  const { status, resolve } = useCheck();
  return (
    <>
      <div className="kicker">{kicker ?? 'Know the complexity'}</div>
      <h2 className="q-title">
        What is the <u>{which}</u> complexity of this {p.title} solution?
      </h2>
      <details className="disclosure" style={{ marginBottom: 14 }}>
        <summary>Show the code</summary>
        <CodeView lines={parsed.lines} />
      </details>
      <Choices
        options={options.map((o) => ({ key: o, label: <span style={{ fontFamily: 'var(--mono)' }}>{o}</span> }))}
        selected={sel}
        onSelect={(k) => {
          setSel(k);
          sfx('tap');
        }}
        answer={answer}
        revealed={status !== 'idle'}
        twoCol
      />
      <ActionBar
        status={status}
        canCheck={sel !== null}
        onCheck={() => resolve(sel === answer, combo)}
        onContinue={() => onDone({ kind: 'complexity', correct: sel === answer })}
        feedback={
          <>
            <div>
              Time <strong>{p.time}</strong> · Space <strong>{p.space}</strong>
            </div>
            <Md text={p.complexityWhy} />
          </>
        }
      />
    </>
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
  }
}

/** Tab inserts 4 spaces and Enter keeps indentation in code textareas. */
export function codeKeyHandler(e: ReactKeyboardEvent<HTMLTextAreaElement>, setValue: (v: string) => void) {
  const ta = e.currentTarget;
  const { selectionStart: s, selectionEnd: en, value } = ta;
  if (e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault();
    const next = value.slice(0, s) + '    ' + value.slice(en);
    setValue(next);
    requestAnimationFrame(() => ta.setSelectionRange(s + 4, s + 4));
  } else if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const line = value.slice(lineStart, s);
    let indent = line.match(/^\s*/)?.[0] ?? '';
    if (/:\s*$/.test(line)) indent += '    ';
    const next = value.slice(0, s) + '\n' + indent + value.slice(en);
    setValue(next);
    const pos = s + 1 + indent.length;
    requestAnimationFrame(() => ta.setSelectionRange(pos, pos));
  } else if (e.key === 'Backspace' && s === en && s > 0) {
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const before = value.slice(lineStart, s);
    if (before.length >= 4 && /^ +$/.test(before) && before.length % 4 === 0) {
      e.preventDefault();
      setValue(value.slice(0, s - 4) + value.slice(en));
      requestAnimationFrame(() => ta.setSelectionRange(s - 4, s - 4));
    }
  }
}
