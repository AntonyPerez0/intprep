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
