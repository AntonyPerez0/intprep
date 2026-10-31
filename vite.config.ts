import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` lets the built site work from any sub-path (e.g. GitHub Pages
// at https://<user>.github.io/<repo>/) without extra configuration.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
