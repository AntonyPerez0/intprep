import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';

// "Run my code" runs the learner's Python with Pyodide (CPython compiled to WebAssembly), served
// from this site so the app needs no third party and no network once it is cached. The files stay
// out of the JS bundle and out of the service worker's precache (about 13 MB, 7 MB over the wire):
// the browser fetches them from `pyodide/` the first time code is run, and the worker keeps them in
// their own cache (sw/sw.template.js). src/lib/pyWorker.ts loads them.

/** The files Pyodide's loader asks for, by the names it asks for them under. */
export const PYODIDE_FILES = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
export const PYODIDE_DIR = 'pyodide/';

const TYPES: Record<string, string> = {
  '.mjs': 'text/javascript',
  '.wasm': 'application/wasm',
  '.zip': 'application/zip',
  '.json': 'application/json',
};

export function pyodideAssets(): Plugin {
  const require = createRequire(import.meta.url);
  const dir = dirname(require.resolve('pyodide/package.json'));
  const version: string = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version;
  return {
    name: 'intprep:pyodide-assets',
    config() {
      // The version names the service worker's cache of these files and is shown nowhere else.
      return { define: { __PYODIDE_VERSION__: JSON.stringify(version) } };
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = req.url?.split('?')[0].match(/\/pyodide\/([\w.-]+)$/);
        const file = m && PYODIDE_FILES.includes(m[1]) ? join(dir, m[1]) : null;
        if (!file || !existsSync(file)) return next();
        res.setHeader('Content-Type', TYPES[file.slice(file.lastIndexOf('.'))] ?? 'application/octet-stream');
        res.setHeader('Content-Length', statSync(file).size);
        res.setHeader('Cache-Control', 'max-age=3600');
        createReadStream(file).pipe(res);
      });
    },
    generateBundle() {
      for (const name of PYODIDE_FILES) {
        const file = join(dir, name);
        if (!existsSync(file)) this.error(`pyodide/${name} is missing from node_modules: reinstall, or update PYODIDE_FILES in sw/pyodide-plugin.ts`);
        this.emitFile({ type: 'asset', fileName: PYODIDE_DIR + name, source: readFileSync(file) });
      }
    },
  };
}

/** The Pyodide version, for the service worker's build info. */
export function pyodideVersion(): string {
  const require = createRequire(import.meta.url);
  return JSON.parse(readFileSync(require.resolve('pyodide/package.json'), 'utf8')).version;
}
