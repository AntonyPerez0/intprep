// The shared typing kit: a code editor the learner types into, and the line-by-line diff shown
// after checking. Used by Code from memory (part by part and from scratch), template drills and
// beginner "Your turn" slides. Grading is pure and lives in src/lib/codegrade.ts.
//
// Pieces (all render inside a <CodeWindow>, usually via <TyperWindow>):
//   <CodeEditor>   given lines + numbered gutter + textarea (+ a touch key bar on phones/tablets)
//   <CodeDiff>     given lines + the graded rows (check / minus / plus / sideways arrow for indent)
//   <TyperFooter>  the window's status bar; its result summary is an aria-live region
//   <TyperWindow>  CodeWindow with the typing frame (focus ring, green/red border once checked)
//   <CodeTyper>    all of the above in one: editor while typing, diff once `grade` is set
// Lower-level: <CodePane>, <CodeLine>, <GivenLines>, <DiffSign>, <GradeSummary>, <TouchKeys>,
// codeKeyHandler. Documented in docs/DESIGN.md ("Typing kit").

import '../styles/typer.css';
import {
  Fragment,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { Check, ListIndentDecrease, ListIndentIncrease, Minus, MoveHorizontal, Plus } from 'lucide-react';
import { gradeSummaryParts, reindent, type Grade } from '../lib/codegrade';
import { highlightLine } from '../lib/highlight';
import { CodeWindow, type CheckStatus } from './interact';

const INDENT = '    ';

// ── Keyboard behaviour ──────────────────────────────────────────────────────

/**
 * Replace value[from..to) with `text` and put the selection at [selStart, selEnd], synchronously.
 * Goes through the browser's own editing (so Ctrl/Cmd+Z still undoes it) and falls back to writing
 * the value directly. The caret is placed before React re-renders, so a key typed within the same
 * frame lands in the right place; React leaves the caret alone because the DOM value already matches.
 */
function edit(
  ta: HTMLTextAreaElement,
  setValue: (v: string) => void,
  from: number,
  to: number,
  text: string,
  selStart: number,
  selEnd = selStart,
) {
  const next = ta.value.slice(0, from) + text + ta.value.slice(to);
  if (document.activeElement === ta) {
    ta.setSelectionRange(from, to);
    try {
      document.execCommand(text ? 'insertText' : 'delete', false, text);
    } catch {
      /* fall through to the direct write */
    }
  }
  if (ta.value !== next) ta.value = next;
  ta.setSelectionRange(selStart, selEnd);
  setValue(next);
}

/**
 * Editor keys for a code textarea: Tab inserts 4 spaces, Enter keeps the line's indentation (and
 * indents one level after a line ending in ':'), Backspace in leading spaces removes a whole
 * 4-space indent. Ctrl/Cmd+Enter and Shift+Tab are left alone (ActionBar check, focus back).
 */
export function codeKeyHandler(e: ReactKeyboardEvent<HTMLTextAreaElement>, setValue: (v: string) => void) {
  if (e.nativeEvent.isComposing) return;
  const ta = e.currentTarget;
  const { selectionStart: s, selectionEnd: en, value } = ta;
  if (e.key === 'Tab' && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
    e.preventDefault();
    edit(ta, setValue, s, en, INDENT, s + 4);
  } else if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    e.preventDefault();
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const line = value.slice(lineStart, s);
    let indent = line.match(/^\s*/)?.[0] ?? '';
    if (/:\s*$/.test(stripTrailingComment(line))) indent += INDENT;
    edit(ta, setValue, s, en, '\n' + indent, s + 1 + indent.length);
  } else if (e.key === 'Backspace' && s === en && s > 0 && !e.altKey && !e.metaKey && !e.ctrlKey) {
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const before = value.slice(lineStart, s);
    if (before.length >= 4 && /^ +$/.test(before) && before.length % 4 === 0) {
      e.preventDefault();
      edit(ta, setValue, s - 4, s, '', s - 4);
    }
  }
}

/** `for x in a:  # loop` still ends a block header. */
const stripTrailingComment = (line: string) => line.replace(/\s+#.*$/, '');

/** Indent or outdent every line touched by the textarea's selection (the caret's line if none). */
function shiftLines(ta: HTMLTextAreaElement, setValue: (v: string) => void, dir: 1 | -1) {
  const { selectionStart: s, selectionEnd: en, value } = ta;
  const start = value.lastIndexOf('\n', s - 1) + 1;
  // A selection that ends right after a newline does not include the next line.
  const last = en > s && value[en - 1] === '\n' ? en - 1 : en;
  let end = value.indexOf('\n', last);
  if (end === -1) end = value.length;
  let first = 0;
  let total = 0;
  const lines = value
    .slice(start, end)
    .split('\n')
    .map((line, k) => {
      let d = 0;
      if (dir > 0) {
        line = INDENT + line;
        d = 4;
      } else {
        const lead = line.match(/^(\t| {1,4})/)?.[0] ?? '';
        line = line.slice(lead.length);
        d = -lead.length;
      }
      if (k === 0) first = d;
      total += d;
      return line;
    });
  if (total === 0) return;
  const ns = Math.max(start, s + first);
  const ne = Math.max(ns, en + total);
  edit(ta, setValue, start, end, lines.join('\n'), ns, ne);
}

function insertText(ta: HTMLTextAreaElement, setValue: (v: string) => void, text: string) {
  const { selectionStart: s, selectionEnd: en } = ta;
  edit(ta, setValue, s, en, text, s + text.length);
}

// ── Building blocks ─────────────────────────────────────────────────────────

/** The monospace, horizontally scrolling code area inside a CodeWindow. */
export function CodePane({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`typer-code ${className}`}>{children}</div>;
}

export type DiffSignKind = 'ok' | 'del' | 'add' | 'indent';

const SIGN_ICON = { ok: Check, del: Minus, add: Plus, indent: MoveHorizontal };
const SIGN_LABEL: Record<DiffSignKind, string> = {
  ok: 'Correct: ',
  del: 'Your line: ',
  add: 'Expected: ',
  indent: 'Wrong indentation: ',
};

/** Diff marker drawn in the gutter, so code stays aligned with the lines above. */
export function DiffSign({ kind, label }: { kind: DiffSignKind; label?: string }) {
  const I = SIGN_ICON[kind];
  return (
    <span className="typer-sign">
      <I strokeWidth={2.4} aria-hidden="true" />
      <span className="sr-only">{label ?? SIGN_LABEL[kind]}</span>
    </span>
  );
}

/**
 * One line of the file: a gutter (line number + optional diff marker) and the code.
 * Modifier classes: `given` (dimmed context), `written`, `diff ok|del|add|indent`, or a page's own.
 */
export function CodeLine({
  n,
  sign,
  signLabel,
  className = '',
  children,
  ref,
}: {
  n?: ReactNode;
  sign?: DiffSignKind;
  signLabel?: string;
  className?: string;
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={ref} className={`typer-line ${className}`}>
      <span className="typer-ln">
        {n}
        {sign && <DiffSign kind={sign} label={signLabel} />}
      </span>
      <span className="typer-src">{children}</span>
    </div>
  );
}

/** Read-only context lines (e.g. the class and def header), highlighted and numbered from `start`. */
export function GivenLines({ lines, start = 1 }: { lines: string[]; start?: number }) {
  return (
    <>
      {lines.map((l, k) => (
        <CodeLine key={k} n={start + k} className="given">
          {l === '' ? ' ' : highlightLine(l)}
        </CodeLine>
      ))}
    </>
  );
}

// ── Touch key bar ───────────────────────────────────────────────────────────

// Symbols that sit one or two layers deep on phone keyboards.
const KEYS: { ch: string; name: string }[] = [
  { ch: ':', name: 'Colon' },
  { ch: '(', name: 'Open parenthesis' },
  { ch: ')', name: 'Close parenthesis' },
  { ch: '[', name: 'Open bracket' },
  { ch: ']', name: 'Close bracket' },
  { ch: '=', name: 'Equals sign' },
  { ch: '_', name: 'Underscore' },
];

/** Keep the textarea focused (and the phone keyboard open) when a key is pressed. */
const keepFocus = (e: { preventDefault: () => void }) => e.preventDefault();

/**
 * Indent / Outdent and a few hard-to-type Python characters, for touch screens where there is
 * no Tab key. Shown only on coarse pointers (CSS). Keys never take focus from the textarea, so
 * the phone keyboard stays open.
 */
export function TouchKeys({
  target,
  onChange,
  disabled,
}: {
  target: RefObject<HTMLTextAreaElement | null>;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const act = (fn: (ta: HTMLTextAreaElement) => void) => () => {
    const ta = target.current;
    if (!ta || ta.disabled) return;
    if (document.activeElement !== ta) ta.focus({ preventScroll: true });
    fn(ta);
  };
  const btn = { type: 'button' as const, disabled, onPointerDown: keepFocus, onMouseDown: keepFocus };
  return (
    <div className="typer-keys" role="group" aria-label="Code keys">
      <button {...btn} className="typer-key" aria-label="Outdent line" onClick={act((ta) => shiftLines(ta, onChange, -1))}>
        <ListIndentDecrease strokeWidth={2} aria-hidden="true" />
      </button>
      <button {...btn} className="typer-key" aria-label="Indent line" onClick={act((ta) => shiftLines(ta, onChange, 1))}>
        <ListIndentIncrease strokeWidth={2} aria-hidden="true" />
      </button>
      {KEYS.map((k, i) => (
        <button
          key={k.ch}
          {...btn}
          className={`typer-key typer-key-char ${i === 0 ? 'typer-key-first' : ''}`}
          aria-label={k.name}
          onClick={act((ta) => insertText(ta, onChange, k.ch))}
        >
          {k.ch}
        </button>
      ))}
    </div>
  );
}

// ── Editor ──────────────────────────────────────────────────────────────────

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name of the textarea, e.g. "Code for part 2" or "Your solution". */
  label: string;
  /** Read-only lines shown above the typing area (highlighted, numbered from `start`). */
  given?: string[];
  /** Line number of the first given line. Default 1. */
  start?: number;
  /** Line number of the first typed line. Default `start + given.length` (add 1 per line you pass as children). */
  firstLine?: number;
  /** Extra rows between the given lines and the typing area (e.g. an instruction comment). */
  children?: ReactNode;
  /** Base indentation in columns: the typing area (and placeholder) starts this far in. Default 0. */
  indent?: number;
  /** Minimum visible rows; the editor grows with the text. Default 3. */
  minRows?: number;
  autoFocus?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /** Show the Indent / Outdent / symbols bar on touch screens. Default true. */
  keyBar?: boolean;
  /** Screen-reader help for the textarea. Default explains Tab, Escape then Tab, and Ctrl/Cmd+Enter. */
  help?: string;
  id?: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}

const DEFAULT_HELP =
  'Tab inserts four spaces. To leave the editor, press Escape and then Tab. Press Control or Command plus Enter to check.';

/** Numbered textarea that reads as part of the file, with editor keys and a touch key bar. */
export function CodeEditor({
  value,
  onChange,
  label,
  given = [],
  start = 1,
  firstLine,
  children,
  indent = 0,
  minRows = 3,
  autoFocus,
  placeholder,
  disabled,
  keyBar = true,
  help = DEFAULT_HELP,
  id,
  textareaRef,
}: CodeEditorProps) {
  const uid = useId();
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const escaped = useRef(false);
  const first = firstLine ?? start + given.length;
  const lines = value.split('\n');
  const rows = Math.max(minRows, lines.length);
  // The textarea is as wide as its longest line, so a long line scrolls the whole pane
  // (given lines included) instead of the textarea alone, and the code stays aligned.
  const cols = lines.reduce((m, l) => Math.max(m, l.replace(/\t/g, INDENT).length), 0);
  return (
    <>
      <CodePane>
        <GivenLines lines={given} start={start} />
        {children}
        <div className="typer-input" style={{ ['--indent' as string]: `${indent}ch`, ['--cols' as string]: cols }}>
          <div className="typer-gutter" aria-hidden="true">
            {Array.from({ length: rows }, (_, k) => (
              <span key={k}>{first + k}</span>
            ))}
          </div>
          <textarea
            ref={(el) => {
              taRef.current = el;
              if (textareaRef) textareaRef.current = el;
            }}
            id={id}
            className="input code-input"
            aria-label={label}
            aria-describedby={help ? `${uid}-help` : undefined}
            autoFocus={autoFocus}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            translate="no"
            rows={rows}
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              // Escape, then Tab: let Tab move focus out instead of indenting.
              if (e.key === 'Escape') {
                escaped.current = true;
                return;
              }
              if (e.key === 'Tab' && escaped.current) {
                escaped.current = false;
                return;
              }
              escaped.current = false;
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) return; // handled by ActionBar
              codeKeyHandler(e, onChange);
            }}
          />
          {help && (
            <span id={`${uid}-help`} className="sr-only">
              {help}
            </span>
          )}
        </div>
      </CodePane>
      {keyBar && <TouchKeys target={taRef} onChange={onChange} disabled={disabled} />}
    </>
  );
}

// ── Diff ────────────────────────────────────────────────────────────────────

export interface CodeDiffProps {
  grade: Grade;
  /** Display base indentation in columns: typed and expected lines are re-indented to start here. */
  indent?: number;
  given?: string[];
  start?: number;
  /** Line number of the first typed line. Default `start + given.length`. */
  firstLine?: number;
  /** Extra rows between the given lines and the diff (e.g. an instruction comment). */
  children?: ReactNode;
}

/**
 * The graded rows: correct lines with a check, your wrong or extra lines with a minus, expected
 * lines with a plus, wrong indentation with a sideways arrow (and the expected line below it).
 * Typed lines keep their numbers; expected-only lines have none.
 */
export function CodeDiff({ grade, indent = 0, given = [], start = 1, firstLine, children }: CodeDiffProps) {
  let n = firstLine ?? start + given.length;
  const got = (s = '') => reindent(s, grade.baseGot, indent);
  const exp = (s = '') => reindent(s, grade.baseExp, indent);
  return (
    <CodePane>
      <GivenLines lines={given} start={start} />
      {children}
      <div className="typer-diff">
        {grade.rows.map((r, k) => {
          if (r.kind === 'ok')
            return (
              <CodeLine key={k} n={n++} sign="ok" className="diff ok">
                {highlightLine(got(r.got))}
              </CodeLine>
            );
          if (r.kind === 'indent')
            return (
              <Fragment key={k}>
                <CodeLine n={n++} sign="indent" className="diff indent">
                  {got(r.got)}
                </CodeLine>
                <CodeLine sign="add" className="diff add">
                  {highlightLine(exp(r.exp))}
                </CodeLine>
              </Fragment>
            );
          if (r.kind === 'del')
            return (
              <CodeLine key={k} n={n++} sign="del" signLabel={r.paired ? undefined : 'Extra line: '} className="diff del">
                {got(r.got)}
              </CodeLine>
            );
          return (
            <CodeLine key={k} sign="add" signLabel={r.paired ? undefined : 'Missing line: '} className="diff add">
              {highlightLine(exp(r.exp))}
            </CodeLine>
          );
        })}
      </div>
    </CodePane>
  );
}

// ── Status bar ──────────────────────────────────────────────────────────────

/** "3 of 4 lines correct · 1 extra", tinted green when perfect and red otherwise. */
export function GradeSummary({ grade }: { grade: Grade }) {
  const parts = gradeSummaryParts(grade);
  // Each piece stays on one line, so a narrow footer wraps only after a separator.
  return (
    <span className={`typer-result ${grade.perfect ? 'ok' : 'bad'}`}>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className="typer-result-part">{i < parts.length - 1 ? `${part} ·` : part}</span>
        </Fragment>
      ))}
    </span>
  );
}

const DEFAULT_KEYS = 'Tab to indent · Ctrl/⌘ + Enter to check';

/**
 * Footer for a typing CodeWindow: language, a short note ("4 lines to write") and, on desktop,
 * the keyboard hint; once graded, "Compared line by line" and the result summary. The summary
 * sits in a polite live region that stays mounted, so keep the footer rendered while typing.
 */
export function TyperFooter({
  grade,
  note,
  keys = DEFAULT_KEYS,
  lang = 'Python',
}: {
  grade?: Grade | null;
  note?: ReactNode;
  /** Keyboard hint shown on desktop while typing; false hides it (e.g. tap mode). */
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
          {grade && <GradeSummary grade={grade} />}
        </span>
      </span>
    </>
  );
}

// ── Window + all-in-one ─────────────────────────────────────────────────────

/** A CodeWindow with the typing frame: focus ring while typing, green/red border once checked. */
export function TyperWindow({
  status = 'idle',
  className = '',
  ...rest
}: Parameters<typeof CodeWindow>[0] & { status?: CheckStatus }) {
  return <CodeWindow {...rest} className={`typer-window ${status !== 'idle' ? `is-${status}` : ''} ${className}`} />;
}

export interface CodeTyperProps extends Omit<CodeEditorProps, 'disabled'> {
  /** Null while typing; once set, the diff replaces the editor. */
  grade: Grade | null;
  /** Frame state. Default: idle while typing, then correct if `grade.perfect`, else wrong. */
  status?: CheckStatus;
  filename?: string;
  /** Window head: meta (e.g. "12 lines") or a whole right slot (e.g. a step counter). */
  meta?: ReactNode;
  right?: ReactNode;
  /** Footer note while typing, e.g. "9 lines to write". */
  note?: ReactNode;
  /** Footer keyboard hint (desktop); false hides it. */
  keys?: ReactNode | false;
  /** Rendered inside the window under the code (e.g. a hint panel). */
  after?: ReactNode;
  className?: string;
}

/** Editor while typing, diff once graded, in one typing window with its status bar. */
export function CodeTyper({
  grade,
  status,
  filename,
  meta,
  right,
  note,
  keys,
  after,
  className,
  indent,
  given,
  start,
  firstLine,
  children,
  ...editor
}: CodeTyperProps) {
  const st: CheckStatus = status ?? (grade ? (grade.perfect ? 'correct' : 'wrong') : 'idle');
  return (
    <TyperWindow
      status={st}
      filename={filename}
      meta={meta}
      right={right}
      className={className}
      footer={<TyperFooter grade={grade} note={note} keys={keys} />}
    >
      {grade ? (
        <CodeDiff grade={grade} indent={indent} given={given} start={start} firstLine={firstLine}>
          {children}
        </CodeDiff>
      ) : (
        <CodeEditor {...editor} indent={indent} given={given} start={start} firstLine={firstLine} disabled={st !== 'idle'}>
          {children}
        </CodeEditor>
      )}
      {after}
    </TyperWindow>
  );
}
