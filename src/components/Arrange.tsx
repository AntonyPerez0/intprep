// "Arrange a part": the pick twin of "Write a part" (a code-line Parsons problem). The part's lines
// come as blocks at their real indentation, shuffled, with one paired distractor next to the line
// it mutates (src/lib/arrange.ts); the learner taps them into order under the code above.
//
//   <Arrange>        "Your code" (placed lines, numbered, under the given context) + the bank
//   <ArrangeFooter>  the window's status bar ("3 of 5 lines placed", then the result, live)
//   <ArrangeWindow>  Arrange + ArrangeFooter in a TyperWindow (the all-in-one)
//   useArrange()     the state: blocks, placed order, check / retry
// Stable hooks: `.parsons-slot` (the placed lines), `.parsons-bank .parsons-item` (bank blocks,
// named "Add line: …"), `.arrange-line` (a placed line, named "Remove line N: …"). A block or line
// that is indented is described by its indentation ("Indented 4 spaces"), which is fixed per block
// and is how a sighted learner sees where it nests.
// Documented in docs/DESIGN.md ("Pick first, then type").

import '../styles/typer.css';
import '../styles/pick.css';
import { Fragment, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type Ref } from 'react';
import { Plus, X } from 'lucide-react';
import { arrangeBlocks, arrangeSummaryParts, gradeArrange, type ArrangeBlock, type ArrangeGrade, type ArrangeOptions, type ArrangeSet } from '../lib/arrange';
import { highlightLine } from '../lib/highlight';
import { indentWords } from './CodeGaps';
import { CodeLine, CodePane, TyperWindow } from './CodeTyper';
import type { CheckStatus } from './interact';

export { arrangeBlocks, gradeArrange, arrangeSummary, type ArrangeBlock, type ArrangeGrade, type ArrangeSet } from '../lib/arrange';

/** The page's primary action (the ActionBar's last button): where focus goes once enough lines are placed. */
const primaryButton = () => document.querySelector<HTMLButtonElement>('.actionbar .buttons > .btn:last-child');

const pad = (n: number) => ' '.repeat(Math.max(0, n));

/** "3 of 5 lines placed", or "3 of 2 lines placed · 1 too many" once a line more than the solution has is placed. */
export function placedNote(placed: number, total: number, sep = ' · '): string {
  const note = `${placed} of ${total} line${total === 1 ? '' : 's'} placed`;
  return placed > total ? `${note}${sep}${placed - total} too many` : note;
}

/** "Indented 4 spaces" ('' at none): a block's description. */
const indentNote = (spaces: number) => {
  const w = indentWords(spaces);
  return w && `${w[0].toUpperCase()}${w.slice(1)}`;
};

export interface ArrangeHandle {
  /** Focus a placed line (by position), or the first bank block without an argument. */
  focus: (placed?: number) => void;
}

export interface ArrangeProps {
  /** Every block, in the bank's order (`arrangeBlocks(...).blocks`). */
  blocks: ArrangeBlock[];
  /** Ids of the placed blocks, in order. */
  placed: string[];
  /** Add a block at the end. */
  onPlace: (id: string) => void;
  /** Send the placed line at this position back to the bank. */
  onRemove: (index: number) => void;
  /** Lines in the solution: the prompt row shows until this many are placed. */
  total: number;
  /** Show the result (`result` required): the placed lines as graded rows, with the right order. */
  revealed?: boolean;
  result?: ArrangeGrade | null;
  /** The column of the part's base (its least indented line) in the file: blocks are drawn from here. */
  indent?: number;
  /** Given rows above the placed lines (the lines before the part, its cue, its signature). */
  before?: ReactNode;
  /** Line number of the first placed line. Default 1. */
  firstLine?: number;
  /** Accessible name of the placed lines. Default "Your code". */
  label?: string;
  disabled?: boolean;
  ref?: Ref<ArrangeHandle>;
}

/**
 * The placed lines ("Your code", numbered, at their indentation under the given context, each a
 * button that sends it back), a prompt row for the next line, and the bank (blocks to tap, in a
 * tray under the code). Tap, Enter or Space adds a block at the end; tap a placed line to send it
 * back. Once revealed, the placed lines read as a diff: right lines with a check, lines out of
 * place or not in the solution with a minus ("Not in the solution" on the distractor), and the
 * right line with a plus where it belongs.
 */
export function Arrange({
  blocks,
  placed,
  onPlace,
  onRemove,
  total,
  revealed = false,
  result,
  indent = 0,
  before,
  firstLine = 1,
  label = 'Your code',
  disabled,
  ref,
}: ArrangeProps) {
  const uid = useId();
  const byId = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks]);
  const placedBlocks = placed.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const bank = blocks.filter((b) => !placed.includes(b.id));
  const rootRef = useRef<HTMLDivElement>(null);
  const lineBtns = useRef<(HTMLButtonElement | null)[]>([]);
  const bankBtns = useRef<(HTMLButtonElement | null)[]>([]);
  const [said, setSaid] = useState('');
  const off = disabled || revealed;

  useImperativeHandle(ref, () => ({
    focus: (k?: number) => (k === undefined ? bankBtns.current[0] : lineBtns.current[k])?.focus(),
  }));

  // Focus follows the learner's place in the lists, so keyboard users can keep going: after adding,
  // the next block in the bank, or the primary action (Check) once as many lines are placed as the
  // solution has (the block left is the one that does not belong; Shift+Tab goes back to the
  // bank), as Pick the gaps does once every slot is picked; after removing, the next placed line
  // (or the bank).
  const follow = useRef<{ to: 'bank' | 'line' | 'primary'; at: number } | null>(null);
  useLayoutEffect(() => {
    const f = follow.current;
    if (!f) return;
    follow.current = null;
    if (f.to !== 'line') {
      const btn = primaryButton();
      if (f.to === 'primary' && btn && !btn.disabled) return btn.focus({ preventScroll: true });
      const n = bankBtns.current.filter(Boolean).length;
      const el = n ? bankBtns.current[Math.min(f.at, n - 1)] : null;
      (el ?? btn)?.focus({ preventScroll: !el });
    } else {
      const n = lineBtns.current.filter(Boolean).length;
      const el = n ? lineBtns.current[Math.min(f.at, n - 1)] : bankBtns.current[0];
      el?.focus();
    }
  }, [placed]);

  const inside = () => !!rootRef.current?.contains(document.activeElement);
  // What the live region says after a change: the line, then its indentation and how many are placed past the solution's.
  const tail = (b: ArrangeBlock, count: number) => {
    const ind = indentNote(b.indent);
    const over = count - total;
    return `${ind ? `. ${ind}` : ''}${over > 0 ? `. ${over} line${over === 1 ? '' : 's'} too many` : ''}`;
  };
  const place = (b: ArrangeBlock, j: number) => {
    if (off) return;
    const count = placed.length + 1;
    if (inside()) follow.current = count >= total ? { to: 'primary', at: j } : { to: 'bank', at: j };
    setSaid(`Added as line ${firstLine + placed.length}: ${b.text.trim()}${tail(b, count)}`);
    onPlace(b.id);
  };
  const remove = (b: ArrangeBlock, k: number) => {
    if (off) return;
    if (inside()) follow.current = { to: 'line', at: k };
    setSaid(`Removed line ${firstLine + k}: ${b.text.trim()}${tail(b, placed.length - 1)}`);
    onRemove(k);
  };
  // One hidden description per indentation in use, shared by the blocks and lines at it.
  const indents = [...new Set(blocks.map((b) => b.indent).filter((n) => n > 0))];
  const describe = (b: ArrangeBlock) => (b.indent > 0 ? `${uid}-ind-${b.indent}` : undefined);
  // Enter and Space act on the focused block or line (the ActionBar would treat Enter as Check).
  const keys = (act: () => void) => (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (e.nativeEvent.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      act();
    }
  };

  lineBtns.current.length = placedBlocks.length;
  bankBtns.current.length = bank.length;
  const nextN = firstLine + placed.length;
  const showNext = !revealed && placed.length < total && bank.length > 0;

  return (
    <div ref={rootRef} className="arrange-root">
      <CodePane key={revealed ? 'graded' : 'arranging'} className={`arrange ${revealed ? 'is-revealed' : ''}`}>
        {before}
        {revealed && result ? (
          <ArrangeDiff result={result} placed={placedBlocks} indent={indent} firstLine={firstLine} />
        ) : (
          <div className="parsons-slot arrange-slot" role="list" aria-label={`${label}: ${placedNote(placed.length, total, ', ')}`}>
            {placedBlocks.map((b, k) => (
              <div role="listitem" key={b.id} className="arrange-li">
                <button
                  ref={(el) => {
                    lineBtns.current[k] = el;
                  }}
                  type="button"
                  className="typer-line arrange-line"
                  aria-label={`Remove line ${firstLine + k}: ${b.text.trim()}`}
                  aria-describedby={describe(b)}
                  disabled={off}
                  translate="no"
                  onClick={() => remove(b, k)}
                  onKeyDown={keys(() => remove(b, k))}
                >
                  <span className="typer-ln">{firstLine + k}</span>
                  <span className="typer-src">
                    {pad(indent + b.indent)}
                    {highlightLine(b.text.trim())}
                  </span>
                  <X className="arrange-remove" strokeWidth={2.2} aria-hidden="true" />
                </button>
              </div>
            ))}
            {showNext && (
              <div className="typer-line arrange-next" aria-hidden="true">
                <span className="typer-ln">{nextN}</span>
                <span className="arrange-next-wrap" style={{ ['--indent' as string]: `${indent}ch` }}>
                  <span className="arrange-next-slot">{placed.length ? 'Add the next line' : 'Add the first line'}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </CodePane>
      {!revealed && bank.length > 0 && (
        <div className="parsons-bank arrange-bank" role="group" aria-labelledby={`${uid}-bank`}>
          <div className="arrange-bank-head">
            <span id={`${uid}-bank`}>Lines to place</span>
            <span className="arrange-bank-count tabular" aria-hidden="true">
              {bank.length}
            </span>
          </div>
          <div className="arrange-bank-list">
            <div className="arrange-bank-inner">
              {bank.map((b, j) => (
                <button
                  key={b.id}
                  ref={(el) => {
                    bankBtns.current[j] = el;
                  }}
                  type="button"
                  className="parsons-item arrange-item"
                  aria-label={`Add line: ${b.text.trim()}`}
                  aria-describedby={describe(b)}
                  disabled={off}
                  translate="no"
                  onClick={() => place(b, j)}
                  onKeyDown={keys(() => place(b, j))}
                >
                  <span className="arrange-item-code" style={{ ['--indent' as string]: `${b.indent}ch` }}>
                    {highlightLine(b.text.trim())}
                  </span>
                  <Plus className="arrange-add" strokeWidth={2.2} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {revealed ? '' : said}
      </span>
      {indents.map((n) => (
        <span key={n} id={`${uid}-ind-${n}`} hidden>
          {indentNote(n)}
        </span>
      ))}
    </div>
  );
}

/** The graded rows: the kit's diff of the placed lines against the solution, with the distractor named. */
function ArrangeDiff({ result, placed, indent, firstLine }: { result: ArrangeGrade; placed: ArrangeBlock[]; indent: number; firstLine: number }) {
  let n = firstLine;
  const draw = (s = '') => pad(indent) + s;
  return (
    <div className="typer-diff arrange-diff">
      {result.grade.rows.map((r, k) => {
        if (r.kind === 'ok')
          return (
            <CodeLine key={k} n={n++} sign="ok" className="diff ok">
              {highlightLine(draw(r.got))}
            </CodeLine>
          );
        if (r.kind === 'indent')
          return (
            <Fragment key={k}>
              <CodeLine n={n++} sign="indent" className="diff indent">
                {draw(r.got)}
              </CodeLine>
              <CodeLine sign="add" className="diff add">
                {highlightLine(draw(r.exp))}
              </CodeLine>
            </Fragment>
          );
        if (r.kind === 'del') {
          const odd = r.gotIndex !== undefined && placed[r.gotIndex]?.distractor;
          return (
            <Fragment key={k}>
              <CodeLine n={n++} sign="del" signLabel={odd ? 'Not in the solution: ' : 'Out of place: '} className={`diff del ${odd ? 'is-distractor' : ''}`}>
                {draw(r.got)}
              </CodeLine>
              {odd && (
                <div className="typer-line arrange-note" aria-hidden="true">
                  <span className="typer-ln" />
                  <span className="arrange-tag">Not in the solution</span>
                </div>
              )}
            </Fragment>
          );
        }
        return (
          <CodeLine key={k} sign="add" signLabel="Belongs here: " className="diff add">
            {highlightLine(draw(r.exp))}
          </CodeLine>
        );
      })}
    </div>
  );
}

// ── Status bar ──────────────────────────────────────────────────────────────

const ARRANGE_KEYS = 'Enter to add a line · Ctrl/⌘ + Enter to check';

/**
 * Footer for an arrange window: language, a note ("2 of 5 lines placed") and, on desktop, the
 * keyboard hint; once checked, "Compared line by line" and the result ("4 of 5 lines in place ·
 * 1 not in the solution") in a polite live region. Keep it mounted so the result is announced.
 */
export function ArrangeFooter({ result, note, keys = ARRANGE_KEYS }: { result?: ArrangeGrade | null; note?: ReactNode; keys?: ReactNode | false }) {
  const parts = result ? arrangeSummaryParts(result) : [];
  return (
    <>
      <span className="typer-foot-left">
        <span className="typer-foot-lang">Python</span>
        <span className="typer-foot-sep" aria-hidden="true" />
        <span className={`typer-foot-desc ${result ? 'is-result' : ''}`}>{result ? 'Compared line by line' : note}</span>
      </span>
      <span className="typer-foot-right">
        {!result && keys !== false && <span className="typer-keys-hint">{keys}</span>}
        <span role="status" aria-live="polite" className="typer-status">
          {result && (
            <span className={`typer-result ${result.perfect ? 'ok' : 'bad'}`}>
              {parts.map((part, i) => (
                <Fragment key={i}>
                  {i > 0 && ' '}
                  <span className="typer-result-part">{i < parts.length - 1 ? `${part} ·` : part}</span>
                </Fragment>
              ))}
            </span>
          )}
        </span>
      </span>
    </>
  );
}

// ── Window ──────────────────────────────────────────────────────────────────

export interface ArrangeWindowProps extends ArrangeProps {
  /** Frame state. Default: idle while arranging, then correct if perfect, else wrong. */
  status?: CheckStatus;
  filename?: string;
  meta?: ReactNode;
  right?: ReactNode;
  /** Footer note while arranging. Default "2 of 5 lines placed". */
  note?: ReactNode;
  /** Footer keyboard hint (desktop); false hides it. */
  keys?: ReactNode | false;
  /** Rendered inside the window above the code (e.g. a fold row over earlier lines). */
  top?: ReactNode;
  /** Rendered inside the window under the code and bank. */
  after?: ReactNode;
  className?: string;
}

/** Arrange in the typing window with its status bar: the twin of <CodeTyper> for one part. The footer counts every placed line ("3 of 2 lines placed · 1 too many"). */
export function ArrangeWindow({ status, filename, meta, right, note, keys, top, after, className = '', ...arrange }: ArrangeWindowProps) {
  const result = arrange.revealed ? arrange.result ?? null : null;
  const st: CheckStatus = status ?? (result ? (result.perfect ? 'correct' : 'wrong') : 'idle');
  return (
    <TyperWindow
      status={st}
      filename={filename}
      meta={meta}
      right={right}
      className={`arrange-window ${className}`}
      footer={<ArrangeFooter result={result} keys={keys} note={note ?? placedNote(arrange.placed.length, arrange.total)} />}
    >
      {top}
      <Arrange {...arrange} disabled={arrange.disabled ?? st !== 'idle'} />
      {after}
    </TyperWindow>
  );
}

// ── State ───────────────────────────────────────────────────────────────────

export interface ArrangeState {
  /** The blocks (bank order), the solution's lines and the part's base column. */
  set: ArrangeSet;
  blocks: ArrangeBlock[];
  /** Ids placed, in order. */
  placed: string[];
  /** The blocks still in the bank, in the bank's order. */
  bank: ArrangeBlock[];
  place: (id: string) => void;
  remove: (index: number) => void;
  /** Lines in the solution. */
  total: number;
  /** As many lines placed as the solution has: Check can run. */
  canCheck: boolean;
  revealed: boolean;
  /** Always current; show it only once revealed. */
  result: ArrangeGrade;
  /** Reveal the result. Returns it. */
  check: () => ArrangeGrade;
  /** "Fix and check again": back to arranging, the order kept. */
  retry: () => void;
}

/**
 * The state of an Arrange exercise over a part's `lines` (as in the file; see `arrangeBlocks`).
 * `seed` is the instance (a session's round, a retry): the same seed always gives the same bank.
 */
export function useArrange(lines: readonly string[], opts: ArrangeOptions & { seed?: number } = {}): ArrangeState {
  const { seed = 0, keyLines, distractor, avoid } = opts;
  const key = `${seed}|${JSON.stringify([keyLines, distractor])}|${lines.join('\n')}|${avoid?.join('\n') ?? ''}`;
  const set = useMemo(() => arrangeBlocks(lines, seed, { keyLines, distractor, avoid }), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const [state, setState] = useState({ key, placed: [] as string[], revealed: false });
  const cur = state.key === key ? state : { key, placed: [] as string[], revealed: false };
  const byId = useMemo(() => new Map(set.blocks.map((b) => [b.id, b])), [set]);
  const result = useMemo(
    () => gradeArrange(cur.placed.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])), set.expected, set.swappable),
    [cur.placed, byId, set],
  );
  const total = set.expected.length;
  return {
    set,
    blocks: set.blocks,
    placed: cur.placed,
    bank: set.blocks.filter((b) => !cur.placed.includes(b.id)),
    place: (id) => {
      if (cur.revealed || cur.placed.includes(id)) return;
      setState({ ...cur, placed: [...cur.placed, id] });
    },
    remove: (k) => {
      if (cur.revealed) return;
      setState({ ...cur, placed: cur.placed.filter((_, j) => j !== k) });
    },
    total,
    canCheck: cur.placed.length >= total && total > 0,
    revealed: cur.revealed,
    result,
    check: () => {
      setState({ ...cur, revealed: true });
      return result;
    },
    retry: () => setState({ ...cur, revealed: false }),
  };
}
