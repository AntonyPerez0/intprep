import '../styles/pages/drills.css';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import {
  Brain,
  CodeXml,
  Eye,
  Gauge,
  Keyboard,
  Lightbulb,
  List,
  ListOrdered,
  MessageSquareText,
  Minus,
  Plus,
  ScanSearch,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { CATEGORY_BY_ID } from '../content/categories';
import type { CategoryId, Problem } from '../content/types';
import {
  acceptedCategories,
  complexityChoices,
  DRILL_LABEL,
  keyLineDrill,
  patternChoices,
  sameCode,
  techniqueChoices,
  type DrillKind,
} from '../lib/drills';
import { inline, Md } from '../lib/markdown';
import { parseSolution } from '../lib/parseSolution';
import { preview, type Grade } from '../lib/srs';
import { sfx } from '../lib/sound';
import { getProgress, useProgress } from '../lib/store';
import { CategoryIcon } from './icons';
import { ActionBar, Choices, CodeView, CodeWindow, CorrectOrder, OrderSteps, ProblemPrompt, type CheckStatus } from './interact';
import { Kbd } from './ui';

export interface DrillResult {
  kind: DrillKind;
  correct: boolean;
  selfGrade?: Grade;
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
}

const KIND_ICON: Record<DrillKind, LucideIcon> = {
  pattern: ScanSearch,
  technique: Wrench,
  insight: Lightbulb,
  order: ListOrdered,
  keyline: CodeXml,
  complexity: Gauge,
};

function useCheck(onCorrect?: () => void) {
  const [status, setStatus] = useState<CheckStatus>('idle');
  const resolve = (ok: boolean, combo = 0) => {
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

/** Two-row diff: the learner's line against the expected one. */
function LineDiff({ yours, expected }: { yours: string; expected: string }) {
  return (
    <div className="drill-diff">
      <div className="drill-diff-row del">
        <Minus className="drill-diff-sign" strokeWidth={2.4} aria-hidden="true" />
        <code className="drill-diff-code">{yours}</code>
        <span className="drill-diff-tag">Yours</span>
      </div>
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

/** Precise enough that neighbouring grades never read the same ("in 56 days" vs "in 70 days"). */
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

// ── 5. Fill in the key line ─────────────────────────────────────────────────

function preferTyping(mode: 'auto' | 'type' | 'tap') {
  if (mode !== 'auto') return mode === 'type';
  return typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: fine)').matches && window.innerWidth >= 820;
}

export function KeyLineDrill({ problem: p, onDone, kicker, combo = 0, badge, meta }: DrillProps) {
  const settings = useProgress().settings;
  const drill = useMemo(() => keyLineDrill(p), [p]);
  const parsed = parseSolution(p.solution);
  const [typing, setTyping] = useState(() => preferTyping(settings.typingMode));
  const [sel, setSel] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const { status, resolve } = useCheck();
  if (!drill) {
    return <OrderDrill problem={p} onDone={onDone} kicker={kicker} combo={combo} badge={badge} meta={meta} />;
  }
  const chosen = typing ? typed : sel ?? '';
  const ok = sameCode(chosen, drill.answer);
  const explain = parsed.chunks[parsed.lines[drill.lineIndex].chunk]?.explain;
  const filled = typing ? typed.trim() : sel?.trim();
  return (
    <section className="drill" data-drill="keyline" data-problem={p.id}>
      <DrillHead
        kind="keyline"
        kicker={kicker}
        badge={badge}
        meta={meta}
        title={`Which line completes ${p.title}?`}
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
          blankContent={status === 'idle' ? filled || '???' : ok ? drill.answer.trim() : chosen.trim()}
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
            id={`line-${p.id}`}
            className="input mono drill-line-input"
            autoFocus
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Type the missing line"
            value={typed}
            disabled={status !== 'idle'}
            onChange={(e) => setTyped(e.target.value)}
          />
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
        canCheck={chosen.trim().length > 0}
        onCheck={() => resolve(ok, combo)}
        onContinue={() => onDone({ kind: 'keyline', correct: ok })}
        secondary={
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => setTyping((t) => !t)}>
            {typing ? <List aria-hidden="true" /> : <Keyboard aria-hidden="true" />}
            {typing ? 'Show options' : 'Type it'}
          </button>
        }
        feedback={
          <div className="drill-fb">
            {!ok && <LineDiff yours={chosen.trim()} expected={drill.answer.trim()} />}
            {explain && <div>{inline(explain)}</div>}
          </div>
        }
      />
    </section>
  );
}

// ── 6. Complexity ───────────────────────────────────────────────────────────

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
