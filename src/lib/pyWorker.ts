/// <reference lib="webworker" />
// The web worker that runs Python ("run my code"). It loads Pyodide from this site's pyodide/
// folder, then the judge (src/judge/judge.py), and answers one request at a time. Running in a
// worker keeps the page responsive, and lets the page stop code that never ends by ending the
// worker (src/lib/python.ts).

import judgeSource from '../judge/judge.py?raw';

interface Request {
  id: number;
  type: 'init' | 'judge' | 'trace' | 'snippet';
  indexURL?: string;
  payload?: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let judge: any = null;

async function init(indexURL: string) {
  if (judge) return;
  const { loadPyodide } = await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`);
  const py = await loadPyodide({ indexURL });
  py.FS.writeFile('judge.py', judgeSource);
  judge = py.pyimport('judge');
}

self.onmessage = async (e: MessageEvent<Request>) => {
  const { id, type, indexURL, payload } = e.data;
  try {
    if (type === 'init') {
      await init(indexURL!);
      self.postMessage({ id, ok: true });
      return;
    }
    const text = JSON.stringify(payload);
    let out: string;
    if (type === 'judge') out = judge.judge(text, (done: number, total: number) => self.postMessage({ id, progress: [done, total] }));
    else if (type === 'trace') out = judge.trace(text);
    else out = judge.run_snippet(text);
    self.postMessage({ id, ok: true, result: JSON.parse(out) });
  } catch (err) {
    self.postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
