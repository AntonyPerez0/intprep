import { realpathSync } from 'node:fs';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import { precacheServiceWorker } from './sw/precache-plugin';
import { pyodideAssets } from './sw/pyodide-plugin';

// Allow serving files from the real node_modules location, so a symlinked
// node_modules (e.g. in a git worktree) still serves self-hosted fonts.
function realNodeModules(): string[] {
  try {
    return [realpathSync('node_modules')];
  } catch {
    return [];
  }
}

// `base: './'` lets the built site work from any sub-path (e.g. GitHub Pages
// at https://<user>.github.io/<repo>/) without extra configuration.
export default defineConfig({
  base: './',
  // precacheServiceWorker writes dist/sw.js (offline support) from sw/sw.template.js.
  // pyodideAssets serves and emits the Python runtime ("run my code") under pyodide/.
  plugins: [react(), pyodideAssets(), precacheServiceWorker()],
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), ...realNodeModules()],
    },
  },
  worker: { format: 'es' },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // The teaching content (problems, lessons, templates, the distractor deny lists) is its own
        // chunk: it changes on a different rhythm from the code, and both download in parallel.
        // The tests of "run my code" and the step-by-step traces stay out of it: they load when code
        // is first run and when a lesson first shows a trace (a file per unit).
        manualChunks: (id) => (/\/src\/content\/(tests|traces)\//.test(id) ? undefined : id.includes('/src/content/') ? 'content' : undefined),
      },
    },
  },
});
