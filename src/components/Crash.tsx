// Shown when a screen throws while rendering (the router's errorElement), instead of a blank page.
// The learner's progress is safe in storage: this screen offers a reload, the dashboard, and a
// backup download in case the saved data itself is what the screen choked on.

import { useRouteError } from 'react-router-dom';
import { Download, House, RotateCw, TriangleAlert } from 'lucide-react';
import { today } from '../lib/date';
import { exportProgress } from '../lib/store';
import { IconTile } from './icons';

export function Crash() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `intprep-progress-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <main className="crash">
      <IconTile icon={TriangleAlert} size="xl" color="var(--warning)" />
      <h1>This screen ran into a problem</h1>
      <p>Your progress is saved. Reloading usually fixes it; if it keeps happening, download a backup and open the dashboard.</p>
      {message && (
        <pre className="crash-detail" translate="no">
          {message}
        </pre>
      )}
      <div className="crash-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => window.location.reload()}>
          <RotateCw aria-hidden="true" />
          Reload
        </button>
        <a
          className="btn btn-secondary btn-lg"
          href="#/"
          onClick={() => {
            // A full load of the dashboard, so nothing of the broken screen is kept.
            window.location.hash = '#/';
            window.location.reload();
          }}
        >
          <House aria-hidden="true" />
          Dashboard
        </a>
        <button type="button" className="btn btn-quiet btn-lg" onClick={download}>
          <Download aria-hidden="true" />
          Download a backup
        </button>
      </div>
    </main>
  );
}
