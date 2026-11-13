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
  /** The page runs inside the Android or iOS app (src/lib/native.ts). */
  native?: boolean;
  payload?: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let judge: any = null;

// In the Android and iOS apps the files come from the app itself, through the shell's own file
// server (Capacitor) and not a web server. The two helpers below cover what such a server can get
// wrong about a file's type, so that Python still loads there. The website never uses them.

/** A module loaded from its text, for a file `import()` refused (served under a type that is not JavaScript). */
async function importFromText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  const blob = URL.createObjectURL(new Blob([await res.text()], { type: 'text/javascript' }));
  try {
    return await import(/* @vite-ignore */ blob);
  } finally {
    URL.revokeObjectURL(blob);
  }
}

/**
 * Pyodide compiles its WebAssembly while it downloads, which needs the file served as
 * `application/wasm`, and it does not try another way when that fails. This does: the same file,
 * fetched whole and compiled from memory.
 */
function compileWasmFromBytesOnFailure() {
  const streaming = WebAssembly.instantiateStreaming.bind(WebAssembly);
  WebAssembly.instantiateStreaming = async (source, imports) => {
    const response = await source;
    try {
      return await streaming(response, imports);
    } catch (err) {
      const again = await fetch(response.url);
      if (!again.ok) throw err;
      return WebAssembly.instantiate(await again.arrayBuffer(), imports);
    }
  };
}

async function init(indexURL: string, native = false) {
  if (judge) return;
  const options: Record<string, unknown> = { indexURL };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pyodide: any;
  try {
    pyodide = await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`);
  } catch (err) {
    if (!native) throw err;
    pyodide = await importFromText(`${indexURL}pyodide.mjs`);
    // The loader imports its second half by address as well: hand it over instead.
    options.createPyodideModule = (await importFromText(`${indexURL}pyodide.asm.mjs`)).default;
  }
  if (native) compileWasmFromBytesOnFailure();
  const py = await pyodide.loadPyodide(options);
  py.FS.writeFile('judge.py', judgeSource);
  judge = py.pyimport('judge');
}

self.onmessage = async (e: MessageEvent<Request>) => {
  const { id, type, indexURL, native, payload } = e.data;
  try {
    if (type === 'init') {
      await init(indexURL!, native);
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
