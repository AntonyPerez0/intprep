// "Run my code": real Python in the browser. A web worker (pyWorker.ts) loads Pyodide and the judge
// (src/judge/judge.py) the first time code is run; this module talks to it.
//
// - Nothing is downloaded until something asks to run code (`warmPython` or a run), and never when
//   the learner turned "Run my code" off in their profile.
// - Code that never ends cannot be interrupted from inside the worker, so each request has a
//   watchdog: no answer in time ends the worker, and the next request starts a fresh one. (The judge
//   also counts executed lines and stops a runaway loop itself, which is the usual case; the
//   watchdog is for what line counting cannot see.)
// - Every caller has a fallback: when Python cannot be loaded (offline before the first use, an old
//   browser), code is compared with the reference line by line as before.

import { useSyncExternalStore } from 'react';
import type { Problem } from '../content/types';
import { isNative } from './native';
import { getProgress } from './store';

export type PythonStatus = 'idle' | 'loading' | 'ready' | 'failed';

export interface PyError {
  /** Python's exception name, or 'TimeLimit' / 'Missing' / 'WrongType'. */
  type: string;
  message: string;
  /** 1-based line of the learner's code, when known. */
  line: number | null;
}

export interface TestResult {
  input: string;
  example: boolean;
  passed: boolean;
  /** The expected answer, as the learner would write it. */
  want: string;
  /** For answers with more than one right form: what makes one right. */
  wantNote?: string;
  got?: string;
  error?: PyError;
  /** A design class: the operation that went wrong. */
  op?: string;
  hint?: string;
  /** What the code printed during this test. */
  stdout: string;
  /** Lines executed by the learner's code and by ours. */
  steps: number;
  refSteps: number;
}

export interface JudgeResult {
  status: 'done' | 'error';
  /** The code did not load (a syntax error, a missing class). */
  error?: PyError;
  passed: number;
  total: number;
  results: TestResult[];
}

export interface SnippetResult {
  ok: boolean;
  stdout: string;
  error: PyError | null;
  /** The code ran, but the slide's `check` rejected it. */
  checkFailed: boolean;
  /** The check line that failed, e.g. `assert total([]) == 0`. */
  failed?: string;
  /** The failed assert's own message, when it has one ("use recursion: ..."): shown instead of the line. */
  message?: string;
}

export interface TraceStep {
  /** 0-based line about to run. */
  l: number;
  /** Call depth (0 = the method itself). */
  d: number;
  /** The variables of the function that is running. */
  v: Record<string, string>;
  /** The function's name. */
  f: string;
  /** Values returned by calls that ended on this line, by depth. */
  r?: Record<string, string>;
}

export interface Trace {
  input: string;
  steps: TraceStep[];
  result: string;
  truncated: boolean;
}

/** Thrown when Python is not available: the caller falls back to comparing code. */
export class PythonUnavailable extends Error {}

const INIT_TIMEOUT_MS = 90_000;
const RUN_TIMEOUT_MS = 12_000;

let worker: Worker | null = null;
let status: PythonStatus = 'idle';
let ready: Promise<void> | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void; onProgress?: (done: number, total: number) => void; bump: () => void }>();
const listeners = new Set<() => void>();

function setStatus(s: PythonStatus) {
  status = s;
  listeners.forEach((l) => l());
}

/** Whether the learner allows running code (Profile → Run my code). */
export const pythonEnabled = () => getProgress().settings.runCode !== false && typeof Worker !== 'undefined';

export function usePythonStatus(): PythonStatus {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => status,
    () => status,
  );
}

function stop(reason: string) {
  worker?.terminate();
  worker = null;
  ready = null;
  const waiting = [...pending.values()];
  pending.clear();
  for (const p of waiting) p.reject(new PythonUnavailable(reason));
}

/** The oldest request is the one the worker is running: only its clock runs. */
function armOldest() {
  const first = pending.values().next().value;
  first?.bump();
}

function send<T>(type: string, body: Record<string, unknown>, timeoutMs: number, onProgress?: (done: number, total: number) => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (!worker) return reject(new PythonUnavailable('Python is not running'));
    const id = nextId++;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // The worker answers one request at a time, in order. A request's watchdog runs only while it
    // is the one being worked on (a run queued behind another must not time out waiting), and each
    // sign of life (a finished test) restarts it, so many tests do not add up to a timeout.
    const bump = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        pending.delete(id);
        stop('Python was stopped');
        setStatus('idle');
        reject(new TimeoutError());
      }, timeoutMs);
    };
    const settle = () => {
      clearTimeout(timer);
      pending.delete(id);
      armOldest();
    };
    pending.set(id, {
      resolve: (v) => {
        settle();
        resolve(v as T);
      },
      reject: (e) => {
        settle();
        reject(e);
      },
      onProgress,
      bump,
    });
    if (pending.size === 1) bump();
    worker.postMessage({ id, type, ...body });
  });
}

/** Python itself failed while running the code (not the code's own error, which is a result). */
export class JudgeCrash extends Error {}

/** The code ran past the watchdog: an endless loop the judge could not see. */
export class TimeoutError extends Error {
  constructor() {
    super('Your code ran for too long and was stopped. Look for a loop that never ends.');
  }
}

/** Start loading Python now (a screen where code will be run), without waiting for it. */
export function warmPython(): void {
  if (pythonEnabled()) void ensurePython().catch(() => {});
}

/** Resolves once Python can run code; rejects with PythonUnavailable when it cannot be loaded. */
export function ensurePython(): Promise<void> {
  if (!pythonEnabled()) return Promise.reject(new PythonUnavailable('Running code is turned off'));
  if (ready) return ready;
  setStatus('loading');
  try {
    worker = new Worker(new URL('./pyWorker.ts', import.meta.url), { type: 'module' });
  } catch {
    setStatus('failed');
    return Promise.reject(new PythonUnavailable('This browser cannot start Python'));
  }
  worker.onmessage = (e: MessageEvent<{ id: number; ok?: boolean; result?: unknown; error?: string; progress?: [number, number] }>) => {
    const p = pending.get(e.data.id);
    if (!p) return;
    if (e.data.progress) {
      p.bump();
      p.onProgress?.(e.data.progress[0], e.data.progress[1]);
      return;
    }
    if (e.data.ok) {
      p.resolve(e.data.result);
      return;
    }
    // The judge itself threw: whatever state the code left Python in, do not reuse it. The next
    // run starts a fresh worker (the runtime is cached, so that takes a moment, not a download).
    const crashed = ready !== null && status === 'ready';
    p.reject(crashed ? new JudgeCrash(e.data.error ?? 'Python failed') : new Error(e.data.error ?? 'Python failed'));
    if (crashed) {
      stop('Python was restarted');
      setStatus('idle');
    }
  };
  worker.onerror = () => {
    stop('Python could not be loaded');
    setStatus('failed');
  };
  const indexURL = new URL('./pyodide/', document.baseURI).href;
  ready = send<void>('init', { indexURL, native: isNative() }, INIT_TIMEOUT_MS).then(
    () => setStatus('ready'),
    (err) => {
      stop('Python could not be loaded');
      setStatus('failed');
      throw new PythonUnavailable(err instanceof Error ? err.message : 'Python could not be loaded');
    },
  );
  return ready;
}

/**
 * Wait for Python, but not forever: a first load on a slow connection should not hold up a check
 * that can fall back to comparing code. Rejects with PythonUnavailable when it is not ready in time
 * (the load carries on in the background for the next check).
 */
export function pythonWithin(ms: number): Promise<void> {
  if (status === 'ready' && ready) return ready;
  const loading = ensurePython();
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new PythonUnavailable('Python is still loading')), ms);
    loading.then(
      () => {
        clearTimeout(timer);
        resolve();
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/** Run `code` (a whole solution) against a problem's examples (`mode: 'examples'`) or all its tests. */
export async function runTests(problem: Problem, code: string, mode: 'examples' | 'submit' = 'submit', onProgress?: (done: number, total: number) => void): Promise<JudgeResult> {
  // The tests (src/content/tests) load with the first run, not with the app.
  const [{ judgeProblem }] = await Promise.all([import('./judgeProblem'), ensurePython()]);
  return send<JudgeResult>('judge', { payload: { problem: judgeProblem(problem), user: code, mode } }, RUN_TIMEOUT_MS, onProgress);
}

/** Run a beginner exercise's code; with `check`, also the slide's asserts. */
export async function runSnippet(code: string, check?: string, waitMs = 60_000): Promise<SnippetResult> {
  await pythonWithin(waitMs);
  return send<SnippetResult>('snippet', { payload: { code, check } }, RUN_TIMEOUT_MS);
}

/** Step through a solution (ours, or `code`) on one input. */
export async function traceSolution(problem: Problem, input: string, code?: string, maxSteps = 200): Promise<Trace> {
  const [{ judgeProblem }] = await Promise.all([import('./judgeProblem'), ensurePython()]);
  return send<Trace>('trace', { payload: { problem: judgeProblem(problem), input, code, maxSteps } }, RUN_TIMEOUT_MS);
}

/** What a Python error means, for someone who has never seen one. */
const ERROR_HELP: Record<string, string> = {
  NameError: 'Python does not know that name. Check its spelling and capital letters: `print` is not `Print`, and a variable must be created before it is used.',
  SyntaxError: 'Python could not read this line. Look for a missing colon, quote, comma or closing parenthesis.',
  IndentationError: 'The spaces at the start of this line do not fit. Lines inside a block are indented four spaces further than the line that opens it.',
  TabError: 'This line mixes tabs and spaces. Indent with spaces only.',
  TypeError: 'A value has the wrong type for what the line does with it, such as adding text to a number or calling something that is not a function.',
  IndexError: 'The position is past the end. A list of length n has positions 0 to n - 1.',
  KeyError: 'That key is not in the dict. Check that it was added, or use `.get`.',
  AttributeError: 'That value has no such method or attribute. A list has `append`, a set has `add`, a dict has `get`.',
  ZeroDivisionError: 'The line divides by zero.',
  ValueError: 'The value has the right type but cannot be used here, such as `int("abc")`.',
  UnboundLocalError: 'The function reads a variable before giving it a value. If it belongs to the outer function, it needs `nonlocal`.',
  RecursionError: 'The function kept calling itself. It needs a base case that returns without another call.',
};

export const errorHelp = (e: PyError): string | null => ERROR_HELP[e.type] ?? null;

/** Whether what a snippet printed is the expected output (trailing spaces and a final newline do not matter). */
export function sameOutput(got: string, want: string): boolean {
  const norm = (t: string) =>
    t
      .replace(/\r/g, '')
      .split('\n')
      .map((l) => l.trimEnd())
      .join('\n')
      .trimEnd();
  return norm(got) === norm(want);
}

const KEYWORDS = /\b(for|while|if|elif|else|def|return|class|in|not|and|or|break|continue|import|lambda|assert|is)\b|[-+*/%]=|\/\/=|\.[A-Za-z_]\w*\(/g;

/**
 * The building blocks an answer uses (keywords, `+=`, method calls such as `.append(`), so code
 * that prints the right output without using the idea the exercise is about (`print(15)` for
 * "add 5 with +=") is not taken for a solution. Comments and strings are ignored.
 */
export function usesIdeasOf(code: string, answer: string): boolean {
  const ideas = (src: string) => new Set(src.replace(/#.*$/gm, '').replace(/(["'])(?:\\.|(?!\1).)*\1/g, '""').match(KEYWORDS) ?? []);
  const mine = ideas(code);
  return [...ideas(answer)].every((k) => mine.has(k));
}
