// "Fill in the gaps": the middle rung between reading a worked example and writing it from
// scratch. The whole snippet is shown, a few lines are blanked (src/lib/gaps.ts picks which),
// and the learner types only those lines. Built from the typing kit (src/components/CodeTyper.tsx):
// same code pane, gutter, highlighting, diff signs, window and status bar.
//
//   <CodeGaps>    the snippet with one single-line input per gap, then the graded rows
//   <GapsFooter>  the window's status bar; its "2 of 3 gaps correct" is an aria-live region
//   <GapsWindow>  CodeGaps + GapsFooter in a TyperWindow (the all-in-one, like <CodeTyper>)
//   useGaps()     the exercise state: gaps for this round, values, check / retry / new gaps
// Documented in docs/DESIGN.md ("Fill in the gaps").

import '../styles/typer.css';
import '../styles/gaps.css';
import {
  Fragment,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { indentOf } from '../lib/codegrade';
import { gapsSummary, gradeGaps, pickGaps, type GapsGrade, type PickGapsOptions } from '../lib/gaps';
import { highlightLine } from '../lib/highlight';
import { stripComment } from '../lib/parseSolution';
import { CodeLine, CodePane, TyperWindow } from './CodeTyper';
import type { CheckStatus } from './interact';

export { gradeGaps, gapsSummary, pickGaps, gapSource, type GapsGrade, type GapResult } from '../lib/gaps';

const KEY_MARK = /\s+#!\s*$/;

/** A line as displayed: `#!` key marker and trailing whitespace dropped, tabs expanded. */
const clean = (line: string) =>
  line
    .replace(KEY_MARK, '')
    .replace(/\s+$/, '')
    .replace(/^\s+/, (ws) => ws.replace(/\t/g, '    '));

/**
 * The first open gap's placeholder when it has no hint, longest first: a deeply indented gap on a
 * narrow phone gets the shorter one, or none (its accessible name, "Line N, missing", stays).
 */
const GENERIC_PLACEHOLDER = ['Type the missing line', 'Type the line'];

/** The trailing comment of a line (`# stop when the pointers meet`), or ''. */
function trailingComment(line: string): string {
  const code = stripComment(line);
  return code.trim() === '' ? '' : line.slice(code.length).trim();
}

// ── Touch key bar ───────────────────────────────────────────────────────────

// The kit's <TouchKeys> drives a textarea and has Indent / Outdent; a gap is a single line whose
// indentation is fixed, so this bar has only the symbols. Same classes, so it looks identical.
const KEYS: { ch: string; name: string }[] = [
  { ch: ':', name: 'Colon' },
  { ch: '(', name: 'Open parenthesis' },
  { ch: ')', name: 'Close parenthesis' },
  { ch: '[', name: 'Open bracket' },
  { ch: ']', name: 'Close bracket' },
  { ch: '=', name: 'Equals sign' },
  { ch: '_', name: 'Underscore' },
];

/** Keep the input focused (and the phone keyboard open) when a key is pressed. */
const keepFocus = (e: { preventDefault: () => void }) => e.preventDefault();

/** Insert `text` at the caret through the browser's editing (so undo works), then commit. */
function insertAtCaret(el: HTMLInputElement, text: string, commit: (value: string) => void) {
  const s = el.selectionStart ?? el.value.length;
  const e = el.selectionEnd ?? s;
  const next = el.value.slice(0, s) + text + el.value.slice(e);
  if (document.activeElement === el) {
    try {
      document.execCommand('insertText', false, text);
    } catch {
      /* fall through to the direct write */
    }
  }
  if (el.value !== next) el.value = next;
  el.setSelectionRange(s + text.length, s + text.length);
  commit(next);
}

// ── Editor ──────────────────────────────────────────────────────────────────

export interface CodeGapsHandle {
  /** Focus a gap (by position in `gaps`; default: the first one that can be typed in). */
  focus: (gap?: number) => void;
}

export interface CodeGapsProps {
  /** The whole snippet, one entry per line, as displayed (blank and comment lines included). */
  lines: string[];
  /** Indices into `lines` to blank, sorted (from `pickGaps`). */
  gaps: number[];
  /** What the learner typed, one entry per gap, in the order of `gaps`. */
  values: string[];
  /** Called with all values and the position of the gap that changed. */
  onChange: (values: string[], gap: number) => void;
  /** Show the result: each gap becomes a graded row (correct, or yours + the expected line). */
  revealed?: boolean;
  /** Enter on the last gap calls this once every gap has text (and the key stops there); while a
   *  gap is still empty, Enter goes to it instead. Without it, Enter on the last gap is left to
   *  the page (the ActionBar's Enter = Check). */
  onSubmit?: () => void;
  /** Focus the first gap on mount and when a new set of gaps arrives. (The first gap to fix is
   *  focused whenever `revealed` goes back to false, with or without it: a retry is a request.) */
  autoFocus?: boolean;
  disabled?: boolean;
  /**
   * Gaps already answered correctly (by position in `gaps`), e.g. after "Fix and check again":
   * shown as correct, read-only, and skipped by the keyboard. Their values are still graded.
   */
  locked?: boolean[];
  /**
   * Placeholder per gap. `true` (default): the line's own trailing comment
   * (`# stop when the pointers meet`), which says what the line does without giving it away.
   * `false`: none. An array: your own, per gap (e.g. the chunk's plain-English explanation).
   */
  hints?: boolean | (string | null | undefined)[];
  /** Line number of `lines[0]`. Default 1. */
  start?: number;
  /** Show the symbols bar on touch screens. Default true. */
  keyBar?: boolean;
  /** Accessible name of the code area. Default "Code with N missing lines". */
  label?: string;
  ref?: Ref<CodeGapsHandle>;
}

/**
 * The snippet with its gaps as single-line inputs, each starting at its line's indentation (the
 * learner never types indentation), then, once `revealed`, the graded rows in the kit's diff style.
 * Render it inside a <TyperWindow> with a <GapsFooter>, or use <GapsWindow>.
 */
export function CodeGaps({
  lines,
  gaps,
  values,
  onChange,
  revealed = false,
  onSubmit,
  autoFocus,
  disabled,
  locked,
  hints = true,
  start = 1,
  keyBar = true,
  label,
  ref,
}: CodeGapsProps) {
  const uid = useId();
  const shown = useMemo(() => lines.map(clean), [lines]);
  const gapAt = useMemo(() => new Map(gaps.map((line, k) => [line, k])), [gaps]);
  const expected = useMemo(() => gaps.map((i) => shown[i] ?? ''), [gaps, shown]);
  const grade = useMemo(() => gradeGaps(values, expected), [values, expected]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const lastFocused = useRef(0);
  const isLocked = (k: number) => !!locked?.[k];
  const editable = gaps.map((_, k) => k).filter((k) => !isLocked(k));

  const focusGap = (k: number | undefined, caret: 'end' | number = 'end') => {
    if (k === undefined) return;
    const el = inputs.current[k];
    if (!el) return;
    el.focus();
    const at = caret === 'end' ? el.value.length : Math.min(caret, el.value.length);
    el.setSelectionRange(at, at);
  };

  useImperativeHandle(ref, () => ({ focus: (k?: number) => focusGap(k ?? editable[0]) }));

  // Focus: the first gap on mount and for each new set (with autoFocus: phones wait for a tap, so
  // the keyboard does not cover the code on arrival); the first gap to fix after "Fix and check
  // again" always, since the learner asked to type (call it in a flushSync'd click on phones).
  const gapsKey = gaps.join(',');
  const prev = useRef<{ gapsKey: string; revealed: boolean } | null>(null);
  useEffect(() => {
    const was = prev.current;
    prev.current = { gapsKey, revealed };
    if (revealed || disabled) return;
    if (!was || was.gapsKey !== gapsKey) {
      if (autoFocus) focusGap(editable[0]);
    } else if (was.revealed) focusGap(editable.find((k) => !grade.results[k]?.ok) ?? editable[0]);
  }, [gapsKey, revealed]); // eslint-disable-line react-hooks/exhaustive-deps

  const hintFor = (k: number, line: string): string | undefined => {
    if (Array.isArray(hints)) return hints[k] ?? undefined;
    return hints ? trailingComment(line) || undefined : undefined;
  };
  // The first open gap carries the generic placeholder when it has no hint of its own.
  const genericGap = hints !== false && editable.length && !hintFor(editable[0], shown[gaps[editable[0]]] ?? '') ? editable[0] : -1;

  // A placeholder wider than its gap (a phone, a narrow window, a deep indent) would be cut off,
  // and a placeholder cannot scroll. Measured per gap (the input's width does not depend on its
  // placeholder): 1 = the full text does not fit, 2 = the generic one's short form does not either.
  // A hint that does not fit shows as a wrapping comment under the input instead; the generic
  // placeholder gets shorter, then goes.
  const paneRef = useRef<HTMLDivElement>(null);
  const [tight, setTight] = useState<ReadonlyMap<number, 1 | 2>>(() => new Map());
  useLayoutEffect(() => {
    const pane = paneRef.current;
    if (!pane || revealed) return;
    const ctx = document.createElement('canvas').getContext('2d');
    const measure = () => {
      const next = new Map<number, 1 | 2>();
      inputs.current.forEach((el, k) => {
        if (!el || !el.isConnected) return;
        const hint = hintFor(k, shown[gaps[k]] ?? '');
        const texts = hint ? [hint] : k === genericGap ? GENERIC_PLACEHOLDER : [];
        if (!texts.length) return;
        const cs = getComputedStyle(el);
        const room = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        if (ctx) ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const fits = (text: string) => (ctx ? ctx.measureText(text).width : text.length * parseFloat(cs.fontSize) * 0.6) <= room + 0.5;
        if (fits(texts[0])) return;
        next.set(k, texts.length > 1 && fits(texts[1]) ? 1 : hint ? 1 : 2);
      });
      setTight((cur) => (cur.size === next.size && [...next].every(([k, v]) => cur.get(k) === v) ? cur : next));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(pane);
    // Web fonts change the measure once they load.
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [gapsKey, revealed, hints, genericGap]); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = (k: number, v: string) => {
    const next = gaps.map((_, j) => (j === k ? v : (values[j] ?? '')));
    onChange(next, k);
  };

  const onKeyDown = (k: number) => (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.altKey) return;
    const pos = editable.indexOf(k);
    const prevGap = editable[pos - 1];
    const nextGap = editable[pos + 1];
    if (e.key === 'Enter') {
      if (e.metaKey || e.ctrlKey) return; // Check: left to the ActionBar
      // The last gap, with an earlier one still empty (the learner filled the lines they knew
      // first): Enter goes on to that gap, as "Enter for the next gap" says, instead of spending
      // the scored first check on blanks. Ctrl/⌘ + Enter and the Check button still check.
      const empty = nextGap === undefined && !e.shiftKey ? editable.find((j) => !(values[j] ?? '').trim()) : undefined;
      if (e.shiftKey) {
        e.preventDefault();
        e.stopPropagation(); // the ActionBar treats any Enter in an input as Check
        focusGap(prevGap);
      } else if (nextGap !== undefined || empty !== undefined) {
        e.preventDefault();
        e.stopPropagation();
        focusGap(nextGap ?? empty);
      } else if (onSubmit) {
        e.preventDefault();
        e.stopPropagation();
        onSubmit();
      }
    } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      const to = e.key === 'ArrowUp' ? prevGap : nextGap;
      if (to === undefined) return;
      e.preventDefault();
      focusGap(to, e.currentTarget.selectionStart ?? 'end'); // keep the column, like an editor
    }
  };

  // Screen readers in forms mode jump from input to input: say which code the gap follows.
  const contextFor = (i: number) => {
    for (let j = i - 1; j >= 0; j--) {
      if (stripComment(shown[j]).trim() && !gapAt.has(j)) return `After line ${start + j}: ${shown[j].trim()}`;
    }
    return '';
  };

  const missing = gaps.length;

  return (
    <>
      {/* A new pane on reveal, so a sideways scroll from typing a long gap does not carry over */}
      <CodePane key={revealed ? 'graded' : 'typing'} className={`gaps ${revealed ? 'is-revealed' : ''}`}>
        <div
          ref={paneRef}
          role="group"
          className="gaps-lines"
          aria-label={label ?? `Code with ${missing} missing line${missing === 1 ? '' : 's'}`}
        >
          {shown.map((line, i) => {
            const n = start + i;
            const k = gapAt.get(i);
            if (k === undefined)
              return (
                <CodeLine key={i} n={n} className="given">
                  {line === '' ? ' ' : highlightLine(line)}
                </CodeLine>
              );

            const pad = ' '.repeat(indentOf(line));
            const r = grade.results[k];
            const typed = (values[k] ?? '').trim();
            if (revealed || isLocked(k)) {
              if (r.ok)
                return (
                  <CodeLine key={i} n={n} sign="ok" className="diff ok">
                    {pad}
                    {highlightLine(typed)}
                  </CodeLine>
                );
              return (
                <Fragment key={i}>
                  <CodeLine n={n} sign="del" className="diff del">
                    {pad}
                    {r.empty ? <span className="gaps-empty">left blank</span> : typed}
                  </CodeLine>
                  <CodeLine sign="add" className="diff add">
                    {highlightLine(line)}
                  </CodeLine>
                </Fragment>
              );
            }

            const hint = hintFor(k, line);
            const fit = tight.get(k);
            const placeholder = hint ?? (k === genericGap ? (fit === 2 ? undefined : GENERIC_PLACEHOLDER[fit ?? 0]) : undefined);
            const caption = !!hint && !!fit;
            // Enter's label on a phone keyboard: "next" while another gap is still empty.
            const lastOpen = editable[editable.length - 1] === k && !editable.some((j) => j !== k && !(values[j] ?? '').trim());
            // The description replaces the placeholder for screen readers, so it carries the hint too.
            const ctx = [hint && `Hint: ${hint.replace(/^#\s*/, '')}.`, contextFor(i)].filter(Boolean).join(' ');
            return (
              <div
                key={i}
                className={`typer-line gaps-row ${typed ? 'is-filled' : 'is-empty'} ${caption ? 'has-caption' : ''}`}
                // The whole row is the touch target: a tap on the number or beside the box types here.
                onClick={(e) => {
                  if (e.target !== inputs.current[k] && !disabled) focusGap(k);
                }}
              >
                <span className="typer-ln">{n}</span>
                <span className="gaps-slot" style={{ ['--indent' as string]: `${indentOf(line)}ch` }}>
                  <input
                    ref={(el) => {
                      inputs.current[k] = el;
                    }}
                    type="text"
                    className="gaps-input"
                    aria-label={`Line ${n}, missing`}
                    aria-describedby={ctx ? `${uid}-ctx-${k}` : undefined}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="off"
                    enterKeyHint={lastOpen ? (onSubmit ? 'done' : 'enter') : 'next'}
                    translate="no"
                    placeholder={placeholder}
                    value={values[k] ?? ''}
                    disabled={disabled}
                    onChange={(e) => setValue(k, e.target.value)}
                    onFocus={() => {
                      lastFocused.current = k;
                    }}
                    onKeyDown={onKeyDown(k)}
                  />
                  {/* The whole hint, wrapped, when it does not fit the gap (the description reads it) */}
                  {caption && (
                    <span className="gaps-hint" aria-hidden="true">
                      {hint}
                    </span>
                  )}
                  {/* Hidden: read as the input's description only, not twice in browse mode */}
                  {ctx && (
                    <span id={`${uid}-ctx-${k}`} hidden>
                      {ctx}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </CodePane>
      {keyBar && !revealed && editable.length > 0 && (
        <div className="typer-keys gaps-keys" role="group" aria-label="Code keys">
          {KEYS.map((key) => (
            <button
              key={key.ch}
              type="button"
              className="typer-key typer-key-char"
              aria-label={key.name}
              disabled={disabled}
              onPointerDown={keepFocus}
              onMouseDown={keepFocus}
              onClick={() => {
                const k = editable.includes(lastFocused.current) ? lastFocused.current : editable[0];
                const el = inputs.current[k];
                if (!el || el.disabled) return;
                if (document.activeElement !== el) el.focus({ preventScroll: true });
                insertAtCaret(el, key.ch, (v) => setValue(k, v));
              }}
            >
              {key.ch}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ── Status bar ──────────────────────────────────────────────────────────────

/** "2 of 3 gaps correct", tinted green when perfect and red otherwise (the kit's GradeSummary look). */
export function GapsSummary({ grade }: { grade: Pick<GapsGrade, 'correct' | 'total' | 'perfect'> }) {
  return <span className={`typer-result ${grade.perfect ? 'ok' : 'bad'}`}>{gapsSummary(grade)}</span>;
}

const DEFAULT_KEYS = 'Enter for the next gap · Ctrl/⌘ + Enter to check';

/**
 * Footer for a gaps window: language, a note ("3 lines missing") and, on desktop, the keyboard
 * hint; once revealed, "Compared line by line" and the summary in a polite live region. Keep it
 * mounted while typing so the result is announced.
 */
export function GapsFooter({
  grade,
  note,
  keys = DEFAULT_KEYS,
  lang = 'Python',
}: {
  /** Null while typing; the grade once revealed. */
  grade?: GapsGrade | null;
  note?: ReactNode;
  /** Keyboard hint shown on desktop while typing; false hides it. */
  keys?: ReactNode | false;
  lang?: ReactNode;
}) {
  return (
    <>
      <span className="typer-foot-left">
        <span className="typer-foot-lang">{lang}</span>
        <span className="typer-foot-sep" aria-hidden="true" />
        <span className={`typer-foot-desc ${grade ? 'is-result' : ''}`}>{grade ? 'Compared line by line' : note}</span>
      </span>
      <span className="typer-foot-right">
        {!grade && keys !== false && <span className="typer-keys-hint">{keys}</span>}
        <span role="status" aria-live="polite" className="typer-status">
          {grade && <GapsSummary grade={grade} />}
        </span>
      </span>
    </>
  );
}

// ── Window ──────────────────────────────────────────────────────────────────

export interface GapsWindowProps extends CodeGapsProps {
  /** Frame state. Default: idle while typing, then correct if every gap is right, else wrong. */
  status?: CheckStatus;
  filename?: string;
  /** Window head: meta (default "N lines") or a whole right slot (e.g. a step counter). */
  meta?: ReactNode;
  right?: ReactNode;
  /** Footer note while typing. Default "3 lines missing". */
  note?: ReactNode;
  /** Footer keyboard hint (desktop); false hides it. */
  keys?: ReactNode | false;
  /** Rendered inside the window under the code (e.g. a hint panel). */
  after?: ReactNode;
  className?: string;
}

/** CodeGaps in a typing window with its status bar: the all-in-one, like <CodeTyper>. */
export function GapsWindow({ status, filename, meta, right, note, keys, after, className, ...gaps }: GapsWindowProps) {
  const grade = useMemo(
    () => (gaps.revealed ? gradeGaps(gaps.values, gaps.gaps.map((i) => clean(gaps.lines[i] ?? ''))) : null),
    [gaps.revealed, gaps.values, gaps.gaps, gaps.lines],
  );
  const st: CheckStatus = status ?? (grade ? (grade.perfect ? 'correct' : 'wrong') : 'idle');
  const left = gaps.gaps.filter((_, k) => !gaps.locked?.[k]).length;
  return (
    <TyperWindow
      status={st}
      filename={filename}
      meta={meta ?? `${gaps.lines.length} lines`}
      right={right}
      className={className}
      footer={
        <GapsFooter
          grade={grade}
          keys={keys}
          note={note ?? (left === gaps.gaps.length ? `${left} line${left === 1 ? '' : 's'} missing` : `${left} to fix`)}
        />
      }
    >
      <CodeGaps {...gaps} disabled={gaps.disabled ?? st !== 'idle'} />
      {after}
    </TyperWindow>
  );
}

// ── State ───────────────────────────────────────────────────────────────────

export interface GapsState {
  /** Line indices blanked this round. */
  gaps: number[];
  values: string[];
  setValues: (values: string[]) => void;
  revealed: boolean;
  /** Always current (also while typing); show it only once revealed. */
  grade: GapsGrade;
  /** Gaps with something typed. */
  filled: number;
  /** Gaps answered correctly at an earlier check of this round (pass as `locked`). */
  locked: boolean[];
  /** 0 for the first set, +1 for every new set. */
  round: number;
  /** Reveal the answers. Returns the grade. */
  check: () => GapsGrade;
  /** "Fix and check again": hide the answers, keep the text, lock the gaps that were right. */
  retry: () => void;
  /** "New gaps": the next round's set, empty. */
  fresh: () => void;
}

/**
 * The state of a fill-in-the-gaps exercise over `lines`. Round 0 blanks the canonical lines
 * (key lines first); each `fresh()` moves to a new round with different lines where possible.
 */
export function useGaps(lines: string[], opts: Omit<PickGapsOptions, 'seed'> & { round?: number } = {}): GapsState {
  const { round: startRound = 0, keyLines, exclude, ratio, min, max } = opts;
  const [round, setRound] = useState(startRound);
  // Keyed on content, so callers need not memoize `lines` or the options.
  const linesKey = lines.join('\n');
  const optsKey = JSON.stringify([keyLines, exclude, ratio, min, max]);
  const gaps = useMemo(
    () => pickGaps(lines, { keyLines, exclude, ratio, min, max, seed: round }),
    [linesKey, round, optsKey], // eslint-disable-line react-hooks/exhaustive-deps
  );
  type Round = { key: string; values: string[]; revealed: boolean; locked: boolean[] };
  const key = `${round}|${gaps.join(',')}|${linesKey}`;
  const empty = (): Round => ({ key, values: gaps.map(() => ''), revealed: false, locked: gaps.map(() => false) });
  const [state, setState] = useState<Round>(empty);
  // A new set (new round, or new lines) starts empty.
  const cur = state.key === key ? state : empty();
  const expected = useMemo(() => gaps.map((i) => clean(lines[i] ?? '')), [gaps]); // eslint-disable-line react-hooks/exhaustive-deps
  const grade = useMemo(() => gradeGaps(cur.values, expected), [cur.values, expected]);
  return {
    gaps,
    values: cur.values,
    setValues: (values) => setState({ ...cur, values }),
    revealed: cur.revealed,
    grade,
    filled: cur.values.filter((v) => v.trim()).length,
    locked: cur.locked,
    round,
    check: () => {
      setState({ ...cur, revealed: true });
      return grade;
    },
    retry: () => setState({ ...cur, revealed: false, locked: grade.results.map((r) => r.ok) }),
    fresh: () => setRound((r) => r + 1),
  };
}
