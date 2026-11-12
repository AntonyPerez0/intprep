// "Watch it run": step through a solution on one small input. The code with the line about to run
// marked, the variables of the running call (the ones that just changed stand out), the call stack
// for recursion, and the explanation of the part the line belongs to. Traces are built ahead of
// time (lib/traces.ts), so this works offline and needs no Python in the browser.

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CornerDownLeft, Layers, RotateCcw } from 'lucide-react';
import type { Problem } from '../content/types';
import { highlightLine } from '../lib/highlight';
import { inline } from '../lib/markdown';
import { parseSolution } from '../lib/parseSolution';
import { expandTrace, loadTrace, type StoredTrace } from '../lib/traces';
import '../styles/trace.css';

/** A problem's trace: undefined while loading, null when there is none. */
export function useTrace(p: Problem): StoredTrace | null | undefined {
  const [trace, setTrace] = useState<StoredTrace | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setTrace(undefined);
    void loadTrace(p).then((t) => live && setTrace(t));
    return () => {
      live = false;
    };
  }, [p]);
  return trace;
}

export function TraceView({ p, trace, onStep }: { p: Problem; trace: StoredTrace; onStep?: (at: number, total: number) => void }) {
  const parsed = useMemo(() => parseSolution(p.solution), [p]);
  const frames = useMemo(() => expandTrace(trace), [trace]);
  const [k, setK] = useState(0);
  const total = frames.length;
  const f = frames[Math.min(k, total - 1)];
  const atEnd = k >= total - 1;
  const lineRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const go = (to: number) => {
    const next = Math.max(0, Math.min(total - 1, to));
    setK(next);
    onStep?.(next, total);
  };

  // Keep the running line in view inside the code pane (never scrolling the page).
  useEffect(() => {
    const el = lineRef.current;
    const box = boxRef.current;
    if (!el || !box) return;
    const top = el.offsetTop - box.offsetTop;
    if (top < box.scrollTop + 24) box.scrollTop = Math.max(0, top - 48);
    else if (top + el.offsetHeight > box.scrollTop + box.clientHeight - 24) box.scrollTop = top - box.clientHeight + el.offsetHeight + 48;
  }, [k]);

  // Arrow keys step, from anywhere on the screen except a text field.
  const goRef = useRef(go);
  goRef.current = go;
  const kRef = useRef(k);
  kRef.current = k;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') goRef.current(kRef.current + 1);
      else if (e.key === 'ArrowLeft') goRef.current(kRef.current - 1);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  if (!f) return null;
  const chunk = parsed.chunks[parsed.lines[f.line]?.chunk ?? -1];
  const explain = chunk && !chunk.header ? chunk.explain : '';

  return (
    <div className="trace">
      <div className="trace-io">
        <span className="trace-io-label">Input</span>
        <code translate="no">{trace.input}</code>
      </div>

      <div className="trace-controls">
        <button type="button" className="btn btn-secondary" onClick={() => go(k - 1)} disabled={k === 0}>
          <ChevronLeft aria-hidden="true" />
          Back
        </button>
        <input
          type="range"
          className="trace-range"
          min={0}
          max={total - 1}
          value={k}
          onChange={(e) => go(Number(e.target.value))}
          aria-label="Step"
          aria-valuetext={`Step ${k + 1} of ${total}`}
        />
        {atEnd ? (
          <button type="button" className="btn btn-secondary" onClick={() => go(0)}>
            <RotateCcw aria-hidden="true" />
            Replay
          </button>
        ) : (
          <button type="button" className="btn btn-primary trace-next" onClick={() => go(k + 1)}>
            Next step
            <ChevronRight aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="trace-main">
        <div className="trace-code" ref={boxRef} role="group" aria-label="The solution, with the line that runs next marked">
          {parsed.lines.map((l, i) => (
            <div key={i} ref={i === f.line ? lineRef : undefined} className={`trace-line ${i === f.line ? 'is-on' : ''}`} aria-current={i === f.line ? 'step' : undefined}>
              <span className="trace-ln" aria-hidden="true">
                {i + 1}
              </span>
              <span className="trace-arrow" aria-hidden="true">
                {i === f.line ? '▶' : ''}
              </span>
              <span className="trace-text">{l.text === '' ? ' ' : highlightLine(l.text)}</span>
            </div>
          ))}
        </div>

        <div className="trace-side" aria-live="polite">
          <div className="trace-step">
            Step <span className="tabular">{k + 1}</span> of <span className="tabular">{total}</span>
            <span className="trace-step-line"> · line {f.line + 1} runs next</span>
          </div>
          {f.stack.length > 1 && (
            <div className="trace-stack" title="The calls that are waiting, outermost first">
              <Layers aria-hidden="true" />
              <span>
                {f.stack.length} calls deep: {f.stack.join(' → ')}
              </span>
            </div>
          )}
          {f.returned !== undefined && f.depth > 0 && (
            <div className="trace-return">
              <CornerDownLeft aria-hidden="true" />
              <span>
                This call ends here and hands back <code translate="no">{f.returned}</code>
              </span>
            </div>
          )}
          <table className="trace-vars">
            <caption className="sr-only">Variables of the running call</caption>
            <tbody>
              {f.vars.length ? (
                f.vars.map(([name, value]) => (
                  <tr key={name} className={f.changed.has(name) && k > 0 ? 'is-new' : ''}>
                    <th scope="row" translate="no">
                      {name}
                    </th>
                    <td translate="no">{value}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="trace-none">No variables yet</td>
                </tr>
              )}
            </tbody>
          </table>
          {explain && <p className="trace-explain">{inline(explain)}</p>}
          {atEnd && (
            <div className="trace-result">
              <span className="trace-io-label">{trace.truncated ? 'It carries on the same way and returns' : 'Returns'}</span>
              <code translate="no">{trace.result}</code>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
