// "Run my code": the hook that runs a learner's solution against a problem's tests (lib/python.ts)
// and the report of what happened. Shared by Code from memory (From scratch), Solve it yourself and
// the mock interview.

import { useCallback, useRef, useState } from 'react';
import { CircleCheck, CircleX, Gauge, LoaderCircle, Terminal } from 'lucide-react';
import type { Problem } from '../content/types';
import { inline } from '../lib/markdown';
import { JudgeCrash, PythonUnavailable, TimeoutError, errorHelp, pythonEnabled, runTests, usePythonStatus, type JudgeResult, type PyError, type TestResult } from '../lib/python';
import '../styles/run.css';

export type RunPhase = 'idle' | 'starting' | 'running' | 'done' | 'unavailable';

export interface RunState {
  phase: RunPhase;
  result: JudgeResult | null;
  /** Tests finished so far, while running. */
  progress: [number, number] | null;
}

/**
 * Run code against a problem's tests. `run` resolves to the result, or to null when Python cannot
 * be used here (turned off, offline before the first use): the caller then falls back to comparing
 * the code with the solution.
 */
export function useTestRun(problem: Problem) {
  const [state, setState] = useState<RunState>({ phase: 'idle', result: null, progress: null });
  const status = usePythonStatus();
  const token = useRef(0);
  const run = useCallback(
    async (code: string, mode: 'examples' | 'submit' = 'submit'): Promise<JudgeResult | null> => {
      if (!pythonEnabled()) {
        setState({ phase: 'unavailable', result: null, progress: null });
        return null;
      }
      const mine = ++token.current;
      setState({ phase: 'starting', result: null, progress: null });
      try {
        const result = await runTests(problem, code, mode, (done, total) => {
          if (token.current === mine) setState({ phase: 'running', result: null, progress: [done, total] });
        });
        if (token.current === mine) setState({ phase: 'done', result, progress: null });
        return result;
      } catch (e) {
        if (token.current !== mine) return null;
        if (e instanceof TimeoutError) {
          // The watchdog ended it: report it as a run whose code never finished.
          const result: JudgeResult = { status: 'error', error: { type: 'TimeLimit', message: e.message, line: null }, passed: 0, total: 0, results: [] };
          setState({ phase: 'done', result, progress: null });
          return result;
        }
        if (e instanceof JudgeCrash) {
          // The code broke the checker itself (not an ordinary error, which comes back as a result).
          const result: JudgeResult = {
            status: 'error',
            error: { type: 'WrongType', message: 'your code stopped Python itself, so it could not be checked. Look for something unusual: a huge value, or a result of the wrong kind', line: null },
            passed: 0,
            total: 0,
            results: [],
          };
          setState({ phase: 'done', result, progress: null });
          return result;
        }
        setState({ phase: 'unavailable', result: null, progress: null });
        if (!(e instanceof PythonUnavailable)) console.error(e);
        return null;
      }
    },
    [problem],
  );
  const reset = useCallback(() => {
    token.current++;
    setState({ phase: 'idle', result: null, progress: null });
  }, []);
  const busy = state.phase === 'starting' || state.phase === 'running';
  return { ...state, busy, loadingPython: busy && status === 'loading', run, reset };
}

/** What the Check button says while code is running. */
export function runLabel(run: { phase: RunPhase; progress: [number, number] | null; loadingPython: boolean }, idle = 'Check'): string {
  if (run.phase === 'starting') return run.loadingPython ? 'Starting Python…' : 'Running…';
  if (run.phase === 'running') return run.progress ? `Running ${run.progress[0]}/${run.progress[1]}…` : 'Running…';
  return idle;
}

const errorText = (e: PyError) => (e.type === 'TimeLimit' || e.type === 'Missing' || e.type === 'WrongType' ? e.message : `${e.type}: ${e.message}`);

/** A Python error in plain words, with the line it came from. */
export function PyErrorLine({ error }: { error: PyError }) {
  const text = errorText(error);
  return (
    <div className="run-error" translate="no">
      <span>{text.charAt(0).toUpperCase() + text.slice(1)}</span>
      {error.line !== null && <span className="run-error-line">line {error.line}</span>}
    </div>
  );
}

function Row({ label, children, tone }: { label: string; children: string; tone?: 'bad' | 'good' }) {
  return (
    <div className="run-row">
      <span className="run-row-label">{label}</span>
      <code className={`run-row-value ${tone ? `is-${tone}` : ''}`} translate="no">
        {children}
      </code>
    </div>
  );
}

function FailedTest({ t, name, explain }: { t: TestResult; name: string; explain?: boolean }) {
  // What the error means in plain words, on the first failing test only.
  const help = explain && t.error ? errorHelp(t.error) : null;
  return (
    <li className="run-test">
      <div className="run-test-head">
        <CircleX aria-hidden="true" />
        <span>{name}</span>
        {t.op && <code translate="no">{t.op}</code>}
      </div>
      <Row label="Input">{t.input}</Row>
      <Row label="Expected" tone="good">
        {t.want}
      </Row>
      {t.wantNote && <p className="run-note">Also right: {t.wantNote}.</p>}
      {t.error ? (
        <>
          <PyErrorLine error={t.error} />
          {help && <p className="run-note">{inline(help)}</p>}
        </>
      ) : (
        <Row label="Your code" tone="bad">
          {t.got ?? 'nothing'}
        </Row>
      )}
      {t.hint && <p className="run-note">{t.hint}</p>}
      {t.stdout && (
        <div className="run-stdout">
          <span className="run-row-label">
            <Terminal aria-hidden="true" /> It printed
          </span>
          <pre translate="no">{t.stdout}</pre>
        </div>
      )}
    </li>
  );
}

/**
 * How much more work the learner's code did than ours, on the test where the gap is largest
 * (tests too small to say anything are ignored): the sign of a brute force that still passes.
 */
export function workRatio(result: JudgeResult): number {
  let worst = 1;
  for (const t of result.results) if (t.passed && t.refSteps >= 150) worst = Math.max(worst, t.steps / t.refSteps);
  return worst;
}

/** The result of a run: every test passed, or the first tests that failed with what the code returned. */
export function TestReport({ result, max = 2 }: { result: JudgeResult; max?: number }) {
  const [all, setAll] = useState(false);
  if (result.status === 'error' && result.error) {
    return (
      <div className="run-report is-bad" role="status">
        <div className="run-summary">
          <CircleX aria-hidden="true" />
          <span>{result.error.type === 'TimeLimit' ? 'Your code did not finish' : 'Your code did not run'}</span>
        </div>
        <PyErrorLine error={result.error} />
        {errorHelp(result.error) && <p className="run-note">{inline(errorHelp(result.error)!)}</p>}
      </div>
    );
  }
  const failed = result.results.filter((t) => !t.passed);
  const names = new Map<TestResult, string>();
  let ex = 0;
  let extra = 0;
  for (const t of result.results) names.set(t, t.example ? `Example ${++ex}` : `Test ${++extra}`);
  if (!failed.length) {
    const ratio = workRatio(result);
    return (
      <div className="run-report is-good" role="status">
        <div className="run-summary">
          <CircleCheck aria-hidden="true" />
          <span>
            All {result.total} tests passed
          </span>
        </div>
        {ratio >= 12 && (
          <p className="run-note run-work">
            <Gauge aria-hidden="true" />
            Correct, but it did about {Math.round(ratio)}× the work of the taught solution on the largest test. An interviewer will ask for the faster approach.
          </p>
        )}
      </div>
    );
  }
  const shown = all ? failed : failed.slice(0, max);
  return (
    <div className="run-report is-bad" role="status">
      <div className="run-summary">
        <CircleX aria-hidden="true" />
        <span>
          {result.passed} of {result.total} tests passed
        </span>
      </div>
      <ul className="run-tests">
        {shown.map((t, k) => (
          <FailedTest key={k} t={t} name={names.get(t)!} explain={k === 0} />
        ))}
      </ul>
      {failed.length > shown.length && (
        <button type="button" className="btn btn-quiet btn-sm" onClick={() => setAll(true)}>
          Show {failed.length - shown.length} more failing test{failed.length - shown.length === 1 ? '' : 's'}
        </button>
      )}
    </div>
  );
}

/** A line under an editor while Python starts for the first time (a one-time download). */
export function PythonLoading({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="run-loading" role="status">
      <LoaderCircle aria-hidden="true" className="spin" />
      Starting Python. The first time it downloads about 7 MB; after that it is instant and works offline.
    </p>
  );
}
