import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Design-system CSS must load BEFORE the app, so page stylesheets (imported by
// each page module) come later in the cascade and can override shared rules.
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles/base.css';
import './styles/components.css';
import './styles/shell.css';
import App from './App';

// iOS Safari zooms the page in when an input with text smaller than 16px gets focus, and every
// code input here (editors, gaps, typed key lines) uses the 12.5–13px code size. On iOS only,
// maximum-scale=1 stops that focus zoom without making the code bigger: iOS still lets people
// pinch to zoom (it ignores maximum-scale for gestures), whereas Android would honor it and lose
// pinch zoom, so Android and desktop keep the plain viewport. iPadOS asks for desktop sites with a
// Mac user agent, so a Mac with a touch screen counts as an iPad.
const ua = navigator.userAgent;
if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) {
  const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (viewport && !/maximum-scale/.test(viewport.content)) viewport.content += ', maximum-scale=1';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline support + "Add to Home Screen" on phones (production builds only).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline support is optional */
    });
  });
}
