import { realpathSync } from 'node:fs';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import { precacheServiceWorker } from './sw/precache-plugin';

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
  plugins: [react(), precacheServiceWorker()],
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), ...realNodeModules()],
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
