// "Fill in the gaps": the middle rung between reading a worked example and writing it from
// scratch. The whole snippet is shown, a few lines are blanked (src/lib/gaps.ts picks which),
// and the learner types only those lines. Built from the typing kit (src/components/CodeTyper.tsx):
// same code pane, gutter, highlighting, diff signs, window and status bar.
//
//   <CodeGaps>    the snippet with one single-line input per gap, then the graded rows
//   <GapsFooter>  the window's status bar; its "2 of 3 gaps correct" is an aria-live region
//   <GapsWindow>  CodeGaps + GapsFooter in a TyperWindow (the all-in-one, like <CodeTyper>)
//   useGaps()     the exercise state: gaps for this round, values, check / retry / new gaps
// Its pick twin, "Pick the gaps" (the same window; each gap is a slot whose options open under it):
//   <CodeOptions>      code options to pick from (keys 1–N), inline under a slot or on their own
//   <PickGaps>         the snippet with one slot button per gap, then the graded rows
//   <PickGapsWindow>   PickGaps + GapsFooter in a TyperWindow
//   usePickGaps()      the state: gaps, options, picks, the open slot, check / retry / new gaps
// Documented in docs/DESIGN.md ("Fill in the gaps", "Pick first, then type").

import '../styles/typer.css';
import '../styles/gaps.css';
import '../styles/pick.css';
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
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { gapChoices, type GapChoice } from '../lib/choices';
import { baseIndent, codeLines, indentOf, lineKey } from '../lib/codegrade';
import { gapsSummary, gradeGaps, pickGaps, type GapsGrade, type PickGapsOptions } from '../lib/gaps';
import { highlightLine } from '../lib/highlight';
import { stripComment } from '../lib/parseSolution';
import { CodeLine, CodePane, TyperWindow } from './CodeTyper';
import type { CheckStatus } from './interact';

export { gradeGaps, gapsSummary, pickGaps, gapSource, type GapsGrade, type GapResult } from '../lib/gaps';
export { gapChoices, lineChoices, type GapChoice } from '../lib/choices';

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

/** Insert `text` at the caret of a one-line input through the browser's editing (so undo works), then commit. */
export function insertAtCaret(el: HTMLInputElement, text: string, commit: (value: string) => void) {
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

/**
 * The symbols row for a one-line code input (a gap, the review's typed key line): `: ( ) [ ] = _`,
 * touch screens only (CSS). Keys never take focus, so the phone keyboard stays open; `onKey`
 * types the character (see `insertAtCaret`).
 */
export function SymbolKeys({ onKey, disabled, className = '' }: { onKey: (ch: string) => void; disabled?: boolean; className?: string }) {
  return (
    <div className={`typer-keys gaps-keys ${className}`} role="group" aria-label="Code keys">
      {KEYS.map((key) => (
        <button
          key={key.ch}
          type="button"
          className="typer-key typer-key-char"
          aria-label={key.name}
          disabled={disabled}
          onPointerDown={keepFocus}
          onMouseDown={keepFocus}
          onClick={() => onKey(key.ch)}
        >
          {key.ch}
        </button>
      ))}
    </div>
  );
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
        <SymbolKeys
          disabled={disabled}
          onKey={(ch) => {
            const k = editable.includes(lastFocused.current) ? lastFocused.current : editable[0];
            const el = inputs.current[k];
            if (!el || el.disabled) return;
            if (document.activeElement !== el) el.focus({ preventScroll: true });
            insertAtCaret(el, ch, (v) => setValue(k, v));
          }}
        />
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

// ── Pick the gaps ───────────────────────────────────────────────────────────
//
// The pick twin of Fill the gaps, for code that is still new ("Pick first, then type"): the same
// window and rows, but each gap is a slot button and its options (the right line and plausible
// wrong ones, `gapChoices`) open right under it, inside the code, like an editor's suggestions.
// Picking fills the slot and opens the next empty one. Stable hooks: `button.pick-slot` (one per
// open gap, named "Line N, pick a line"), `.choice` (the options of the open slot; keys 1–N).

/** A snippet's comparison key with its indentation: one line per code line, `column:lineKey`. */
const blockKey = (s: string) =>
  codeLines(s)
    .map((l) => `${indentOf(l)}:${lineKey(l)}`)
    .join('\n');

/** What a screen reader hears before a line of a block option: "Line 2, indented 4 spaces: ". */
const blockLineLabel = (k: number, lines: number, indent: number) => {
  const at = indent ? `indented ${indent} space${indent === 1 ? '' : 's'}` : '';
  if (lines > 1) return `${k ? '. ' : ''}Line ${k + 1}${at ? `, ${at}` : ''}: `;
  return at ? `${at[0].toUpperCase()}${at.slice(1)}: ` : '';
};

/** True while a modal dialog is open: page-wide keys leave the page behind it alone. */
const modalOpen = () => !!document.querySelector('[aria-modal="true"]');

/** The page's primary action (the ActionBar's last button): where focus goes once every slot is picked. */
const primaryButton = () => document.querySelector<HTMLButtonElement>('.actionbar .buttons > .btn:last-child');

export interface CodeOptionsHandle {
  /** Focus an option (default: the picked one, else the first). */
  focus: (index?: number) => void;
}

export interface CodeOptionsProps {
  /** The options: lines of code (shown trimmed; the slot or the window fixes the indentation). */
  options: string[];
  /** The option picked so far (shown selected). */
  selected?: string | null;
  onPick: (option: string, index: number) => void;
  /** The panel's visible label, e.g. "Line 7". */
  label: ReactNode;
  /** What to do, after the label: default "Pick the missing line". */
  prompt?: ReactNode;
  /** Accessible name of the option group. Default "Options for {label}" when `label` is a string. */
  groupLabel?: string;
  /** Once revealed: the right option is marked correct, a wrong pick wrong, and the options are disabled. */
  revealed?: boolean;
  answer?: string | null;
  /** Number keys 1–N pick an option while not revealed. Default true (one panel per screen). */
  keys?: boolean;
  /** Inside a code pane, under a slot: spans the window and stays put while the code scrolls sideways. */
  inline?: boolean;
  /**
   * The options are whole snippets written at their real indentation in the file (one line or
   * several, e.g. "Pick the right code" on a beginner slide): each shows line by line with indent
   * guides, and the answer is matched line by line with its indentation (so a snippet one level off
   * is wrong). When every option starts at the same column, that shared indentation is dropped (the
   * slot shows where the code goes); when they start at different columns, each shows at its real
   * column, so an indentation mistake reads as one. Default: single lines, shown trimmed.
   */
  block?: boolean;
  /** Escape: e.g. close the panel and go back to the slot. */
  onEscape?: () => void;
  id?: string;
  className?: string;
  ref?: Ref<CodeOptionsHandle>;
}

/**
 * Code options to pick from: syntax-highlighted lines on the code surface, each with its number
 * (keys 1–N pick it, Enter or Space on a focused option picks it). A radio group named after the
 * line. Inline under a `PickGaps` slot, or on its own under any code window (a single line to
 * pick, "Pick the right code").
 */
export function CodeOptions({
  options,
  selected,
  onPick,
  label,
  prompt = 'Pick the missing line',
  groupLabel,
  revealed = false,
  answer,
  keys = true,
  inline,
  block = false,
  onEscape,
  id,
  className = '',
  ref,
}: CodeOptionsProps) {
  const uid = useId();
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const isAnswer = (o: string) => answer != null && (block ? blockKey(o) === blockKey(answer) : lineKey(o) === lineKey(answer));
  // Block options: the indentation every option shares, dropped so long lines keep their room on a phone.
  const shift = useMemo(() => {
    if (!block) return 0;
    const bases = options.map((o) => baseIndent(o));
    return bases.every((b) => b === bases[0]) ? (bases[0] ?? 0) : 0;
  }, [block, options]);
  useImperativeHandle(ref, () => ({
    focus: (i?: number) => {
      const k = i ?? Math.max(0, options.findIndex((o) => o === selected));
      btns.current[k]?.focus({ preventScroll: true });
    },
  }));
  // Number keys pick, as in every option list.
  const live = useRef({ options, onPick, revealed, keys });
  live.current = { options, onPick, revealed, keys };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const { options: opts, onPick: pickIt, revealed: rv, keys: on } = live.current;
      if (!on || rv || e.metaKey || e.ctrlKey || e.altKey || e.isComposing || modalOpen()) return;
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return;
      const n = Number(e.key);
      if (!(n >= 1 && n <= opts.length)) return;
      e.preventDefault();
      pickIt(opts[n - 1], n - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  const name = groupLabel ?? (typeof label === 'string' ? `Options for ${label.toLowerCase().startsWith('line') ? label : `the ${label}`}` : 'Options');
  return (
    <div id={id} className={`pick-panel ${inline ? 'is-inline' : ''} ${revealed ? 'is-revealed' : ''} ${className}`}>
      <div className="pick-panel-head">
        <span className="pick-panel-label" id={`${uid}-label`}>
          <span className="pick-panel-line">{label}</span>
          {prompt && (
            <>
              <span className="pick-panel-sep" aria-hidden="true">
                ·
              </span>
              {prompt}
            </>
          )}
        </span>
        {keys && !revealed && options.length > 1 && (
          <span className="pick-panel-keys" aria-hidden="true">
            Press 1–{options.length}
          </span>
        )}
      </div>
      <div className="pick-options" role="radiogroup" aria-label={name}>
        <div className="pick-options-list">
          {options.map((o, i) => {
            let cls = '';
            let mark: ReactNode = null;
            if (revealed) {
              if (isAnswer(o)) {
                cls = 'correct';
                mark = <Check strokeWidth={2.4} aria-hidden="true" />;
              } else if (o === selected) {
                cls = 'wrong';
                mark = <X strokeWidth={2.4} aria-hidden="true" />;
              }
            } else if (o === selected) cls = 'selected';
            return (
              <button
                key={`${i}:${o}`}
                ref={(el) => {
                  btns.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={o === selected}
                className={`choice pick-option ${cls}`}
                disabled={revealed}
                translate="no"
                onClick={() => onPick(o, i)}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    // Enter picks this option (the ActionBar would treat it as Check).
                    e.preventDefault();
                    e.stopPropagation();
                    onPick(o, i);
                  } else if (e.key === 'Escape' && onEscape) {
                    e.preventDefault();
                    onEscape();
                  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const to = (i + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
                    btns.current[to]?.focus();
                  }
                }}
              >
                <span className="pick-option-num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className={`pick-option-code ${block ? 'is-block' : ''}`}>
                  {block
                    ? o.split('\n').map((l, k, all) => (
                        <span key={k} className="pick-option-line" style={{ ['--indent' as string]: `${Math.max(0, indentOf(l) - shift)}ch` }}>
                          {/* Screen readers hear each line and its indentation, which can be the whole difference */}
                          <span className="sr-only">{blockLineLabel(k, all.length, Math.max(0, indentOf(l) - shift))}</span>
                          {l.trim() ? highlightLine(l.trim()) : ' '}
                        </span>
                      ))
                    : highlightLine(o.trim())}
                </span>
                {mark && <span className="pick-option-mark">{mark}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export interface PickGapsHandle {
  /** Focus a gap's slot (by position in `gaps`; default: the open one, else the first that can be picked). */
  focus: (gap?: number) => void;
  /** Focus the open slot's options (the picked one, else the first): e.g. right after "Fix and check again" (call it after a flushSync'd retry). */
  focusOptions: () => void;
}

export interface PickGapsProps {
  /** The whole snippet, one entry per line, as displayed (blank and comment lines included). */
  lines: string[];
  /** Indices into `lines` to blank, sorted. */
  gaps: number[];
  /** The options of each gap, in the order of `gaps` (`gapChoices`). */
  choices: GapChoice[];
  /** The option picked for each gap ('' while empty), in the order of `gaps`. */
  values: string[];
  /** The gap whose options are open (position in `gaps`), or null. */
  active: number | null;
  onActivate: (gap: number | null) => void;
  /** A pick: fill the gap (and open the next empty one; `usePickGaps` does). */
  onPick: (gap: number, option: string) => void;
  /** Show the result: each gap becomes a graded row (correct, or your pick + the expected line). */
  revealed?: boolean;
  /** Gaps right at an earlier check (after "Fix and check again"): shown as correct, not pickable. */
  locked?: boolean[];
  disabled?: boolean;
  /**
   * Hint on an empty slot. `true` (default): the line's own trailing comment; `false`: none (the
   * slot says "Pick a line"); an array: your own, per gap.
   */
  hints?: boolean | (string | null | undefined)[];
  /** What each panel asks, after "Line N". Default "Pick the missing line". */
  prompt?: string;
  /** Line number of `lines[0]`. Default 1. */
  start?: number;
  /** Rows above `lines[0]` (given context such as a part's cue), like CodeEditor's children. */
  before?: ReactNode;
  /** Accessible name of the code area. Default "Code with N lines to pick". */
  label?: string;
  ref?: Ref<PickGapsHandle>;
}

/**
 * The snippet with a slot button per gap, at its line's indentation, and the open slot's options
 * right under it (`CodeOptions`, inline). Picking fills the slot and opens the next empty one;
 * a filled slot reopens on a tap; Escape closes the options. Once `revealed`, the rows read as in
 * Fill the gaps: a right pick with the check, a wrong one with the minus above the expected line.
 * Render it inside a <TyperWindow> with a <GapsFooter>, or use <PickGapsWindow>.
 */
export function PickGaps({
  lines,
  gaps,
  choices,
  values,
  active,
  onActivate,
  onPick,
  revealed = false,
  locked,
  disabled,
  hints = true,
  prompt,
  start = 1,
  before,
  label,
  ref,
}: PickGapsProps) {
  const uid = useId();
  const shown = useMemo(() => lines.map(clean), [lines]);
  const gapAt = useMemo(() => new Map(gaps.map((line, k) => [line, k])), [gaps]);
  const expected = useMemo(() => gaps.map((i) => shown[i] ?? ''), [gaps, shown]);
  const grade = useMemo(() => gradeGaps(values, expected), [values, expected]);
  const slots = useRef<(HTMLButtonElement | null)[]>([]);
  const optionsRef = useRef<CodeOptionsHandle>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const isLocked = (k: number) => !!locked?.[k];
  const open = revealed || disabled ? null : active;

  useImperativeHandle(ref, () => ({
    focus: (k?: number) => slots.current[k ?? open ?? gaps.findIndex((_, j) => !isLocked(j))]?.focus(),
    focusOptions: () => optionsRef.current?.focus(),
  }));

  // Focus follows the picking: a pick (or opening a slot) made from inside the window moves focus
  // to the next open panel's options, or to the page's primary action once every slot is picked,
  // so the keyboard never drops to the page. Picks with the number keys leave focus where it is.
  const follow = useRef(false);
  const inside = () => !!rootRef.current?.contains(document.activeElement);
  const moved = useRef(false);
  useLayoutEffect(() => {
    if (!follow.current) return;
    follow.current = false;
    if (open !== null) optionsRef.current?.focus();
    else if (values.every((v) => v.trim()) && !revealed) primaryButton()?.focus({ preventScroll: true });
  }, [open, values, revealed]);

  // A slot that opens (after the first) scrolls its options into view.
  useEffect(() => {
    if (open === null) return;
    if (!moved.current) {
      moved.current = true;
      return;
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    panelRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [open]);

  const hintFor = (k: number, line: string): string | undefined => {
    if (Array.isArray(hints)) return hints[k] ?? undefined;
    return hints ? trailingComment(line) || undefined : undefined;
  };

  const pick = (k: number, option: string) => {
    if (disabled || revealed) return;
    if (inside()) follow.current = true;
    onPick(k, option);
  };
  const activate = (k: number | null) => {
    if (disabled || revealed) return;
    if (k !== null && k === open) {
      optionsRef.current?.focus();
      return;
    }
    follow.current = k !== null;
    onActivate(k);
  };
  const closeTo = (k: number) => {
    onActivate(null);
    requestAnimationFrame(() => slots.current[k]?.focus());
  };

  const missing = gaps.length;
  const panelId = `${uid}-options`;

  return (
    <div ref={rootRef} className="pick-gaps-root">
      {/* A new pane on reveal, so a sideways scroll does not carry over */}
      <CodePane key={revealed ? 'graded' : 'picking'} className={`gaps pick-gaps ${revealed ? 'is-revealed' : ''}`}>
        {before}
        <div role="group" className="gaps-lines pick-lines" aria-label={label ?? `Code with ${missing} line${missing === 1 ? '' : 's'} to pick`}>
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
            const picked = (values[k] ?? '').trim();
            if (revealed || isLocked(k)) {
              if (r.ok)
                return (
                  <CodeLine key={i} n={n} sign="ok" className="diff ok">
                    {pad}
                    {highlightLine(picked)}
                  </CodeLine>
                );
              return (
                <Fragment key={i}>
                  <CodeLine n={n} sign="del" className="diff del">
                    {pad}
                    {r.empty ? <span className="gaps-empty">left blank</span> : picked}
                  </CodeLine>
                  <CodeLine sign="add" className="diff add">
                    {highlightLine(line)}
                  </CodeLine>
                </Fragment>
              );
            }
            const isOpen = open === k;
            const hint = hintFor(k, line);
            const choice = choices[k];
            return (
              <Fragment key={i}>
                <div className={`typer-line pick-row ${picked ? 'is-filled' : 'is-empty'} ${isOpen ? 'is-open' : ''}`}>
                  <span className="typer-ln">{n}</span>
                  <span className="pick-slot-wrap" style={{ ['--indent' as string]: `${indentOf(line)}ch` }}>
                    <button
                      ref={(el) => {
                        slots.current[k] = el;
                      }}
                      type="button"
                      className="pick-slot"
                      aria-label={picked ? `Line ${n}: ${picked}. Pick again` : `Line ${n}, pick a line`}
                      aria-expanded={isOpen}
                      aria-controls={isOpen ? panelId : undefined}
                      disabled={disabled}
                      translate="no"
                      onClick={() => activate(k)}
                    >
                      <span className="pick-slot-text">
                        {picked ? highlightLine(picked) : <span className="pick-slot-hint">{hint ?? 'Pick a line'}</span>}
                      </span>
                      <ChevronsUpDown className="pick-slot-icon" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </span>
                </div>
                {isOpen && choice && (
                  <div ref={panelRef} className="pick-panel-row">
                    <CodeOptions
                      ref={optionsRef}
                      id={panelId}
                      inline
                      options={choice.options}
                      selected={values[k] || null}
                      label={`Line ${n}`}
                      prompt={prompt}
                      onPick={(o) => pick(k, o)}
                      onEscape={() => closeTo(k)}
                    />
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </CodePane>
    </div>
  );
}

export interface PickGapsWindowProps extends PickGapsProps {
  /** Frame state. Default: idle while picking, then correct if every gap is right, else wrong. */
  status?: CheckStatus;
  filename?: string;
  /** Window head: meta (default "N lines") or a whole right slot. */
  meta?: ReactNode;
  right?: ReactNode;
  /** Footer note while picking. Default "3 lines to pick" (then "1 to fix"). */
  note?: ReactNode;
  /** Footer keyboard hint (desktop); false hides it. */
  keys?: ReactNode | false;
  /** Rendered inside the window above the code (e.g. a fold row over earlier lines). */
  top?: ReactNode;
  /** Rendered inside the window under the code. */
  after?: ReactNode;
  className?: string;
}

const PICK_KEYS = 'Number keys to pick · Enter to check';

/** PickGaps in the typing window with the gaps status bar: the twin of <GapsWindow>. */
export function PickGapsWindow({ status, filename, meta, right, note, keys = PICK_KEYS, top, after, className, ...picks }: PickGapsWindowProps) {
  const grade = useMemo(
    () => (picks.revealed ? gradeGaps(picks.values, picks.gaps.map((i) => clean(picks.lines[i] ?? ''))) : null),
    [picks.revealed, picks.values, picks.gaps, picks.lines],
  );
  const st: CheckStatus = status ?? (grade ? (grade.perfect ? 'correct' : 'wrong') : 'idle');
  const open = picks.gaps.map((_, k) => k).filter((k) => !picks.locked?.[k]);
  const left = open.filter((k) => !(picks.values[k] ?? '').trim()).length;
  const fixing = open.length < picks.gaps.length;
  return (
    <TyperWindow
      status={st}
      filename={filename}
      meta={meta ?? `${picks.lines.length} lines`}
      right={right}
      className={`pick-window ${className ?? ''}`}
      footer={
        <GapsFooter
          grade={grade}
          keys={keys}
          note={note ?? (fixing ? `${open.length} to fix` : left ? `${left} line${left === 1 ? '' : 's'} to pick` : 'Ready to check')}
        />
      }
    >
      {top}
      <PickGaps {...picks} disabled={picks.disabled ?? st !== 'idle'} />
      {after}
    </TyperWindow>
  );
}

export interface PickGapsState {
  /** Line indices blanked this round. */
  gaps: number[];
  /** The options of each gap (stable for the round). */
  choices: GapChoice[];
  /** The option picked for each gap ('' while empty). */
  values: string[];
  /** The gap whose options are open, or null. */
  active: number | null;
  setActive: (gap: number | null) => void;
  /** Fill a gap and open the next empty one (none once every gap is picked). */
  pick: (gap: number, option: string) => void;
  revealed: boolean;
  /** Always current; show it only once revealed. */
  grade: GapsGrade;
  /** Gaps with a pick. */
  filled: number;
  /** Every gap has a pick: Check can run. */
  complete: boolean;
  /** Gaps right at an earlier check of this round (pass as `locked`). */
  locked: boolean[];
  /** 0 for the first set, +1 for every new set. */
  round: number;
  /** Reveal the answers. Returns the grade. */
  check: () => GapsGrade;
  /** "Fix and check again": hide the answers, keep the picks, lock the right gaps, open the first wrong one. */
  retry: () => void;
  /** "New gaps": the next round's set, empty. */
  fresh: () => void;
}

export interface PickGapsHookOptions extends Omit<PickGapsOptions, 'seed'> {
  /** The gaps to use (e.g. from `reviewGaps`); without it they are picked like `useGaps` does (`pickGaps`, seed = round). */
  gaps?: number[];
  /** First round. Default 0. */
  round?: number;
  /** Seed for the options (`gapChoices`). Default: the round. */
  seed?: number;
}

/**
 * The state of a Pick the gaps exercise over `lines`: the twin of `useGaps`, with the same
 * rounds. Options are `gapChoices(lines, gaps, seed)`, stable for a round, so a retry or a reload
 * shows the same ones. The first slot opens on arrival.
 */
export function usePickGaps(lines: string[], opts: PickGapsHookOptions = {}): PickGapsState {
  const { round: startRound = 0, keyLines, exclude, ratio, min, max, gaps: fixed, seed } = opts;
  const [round, setRound] = useState(startRound);
  const linesKey = lines.join('\n');
  const optsKey = JSON.stringify([keyLines, exclude, ratio, min, max, fixed]);
  const gaps = useMemo(
    () => fixed ?? pickGaps(lines, { keyLines, exclude, ratio, min, max, seed: round }),
    [linesKey, round, optsKey], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const optSeed = seed ?? round;
  const choices = useMemo(() => gapChoices(lines, gaps, optSeed), [linesKey, gaps, optSeed]); // eslint-disable-line react-hooks/exhaustive-deps
  type Round = { key: string; values: string[]; revealed: boolean; locked: boolean[]; active: number | null };
  const key = `${round}|${optSeed}|${gaps.join(',')}|${linesKey}`;
  const empty = (): Round => ({ key, values: gaps.map(() => ''), revealed: false, locked: gaps.map(() => false), active: gaps.length ? 0 : null });
  const [state, setState] = useState<Round>(empty);
  const cur = state.key === key ? state : empty();
  const expected = useMemo(() => gaps.map((i) => clean(lines[i] ?? '')), [gaps]); // eslint-disable-line react-hooks/exhaustive-deps
  const grade = useMemo(() => gradeGaps(cur.values, expected), [cur.values, expected]);
  const filled = cur.values.filter((v) => v.trim()).length;
  return {
    gaps,
    choices,
    values: cur.values,
    active: cur.revealed ? null : cur.active,
    setActive: (active) => setState({ ...cur, active }),
    pick: (k, option) => {
      const values = cur.values.map((v, j) => (j === k ? option : v));
      // The next empty slot after this one (wrapping), else none.
      const n = gaps.length;
      let next: number | null = null;
      for (let d = 1; d <= n; d++) {
        const j = (k + d) % n;
        if (!cur.locked[j] && !values[j].trim()) {
          next = j;
          break;
        }
      }
      setState({ ...cur, values, active: next });
    },
    revealed: cur.revealed,
    grade,
    filled,
    complete: gaps.length > 0 && filled === gaps.length,
    locked: cur.locked,
    round,
    check: () => {
      setState({ ...cur, revealed: true, active: null });
      return grade;
    },
    retry: () => {
      const locked = grade.results.map((r) => r.ok);
      const first = locked.findIndex((ok) => !ok);
      setState({ ...cur, revealed: false, locked, active: first >= 0 ? first : null });
    },
    fresh: () => setRound((r) => r + 1),
  };
}
