// "Why is it wrong?": after a wrong pick or a wrong line, run the solution with the learner's
// version in place and show what happens: the test it fails with what it returns, or Python's
// error. Loads Python only when asked (lib/python.ts), and shows nothing where code cannot be run.

import { useState } from 'react';
import { CircleHelp, LoaderCircle } from 'lucide-react';
import type { Problem } from '../content/types';
import { errorHelp, pythonEnabled, runTests, type JudgeResult } from '../lib/python';
import { PyErrorLine } from './RunResults';
import '../styles/run.css';

type State = { phase: 'idle' } | { phase: 'running' } | { phase: 'done'; result: JudgeResult } | { phase: 'failed' };

/**
 * `code` is the whole solution with the learner's lines where the answer's would be. Mount it with
 * a `key` that changes with the attempt, so an explanation never outlives the code it was about.
 */
export function WhyWrong({ p, code }: { p: Problem; code: string }) {
  const [state, setState] = useState<State>({ phase: 'idle' });
  if (!pythonEnabled()) return null;

  const ask = async () => {
    setState({ phase: 'running' });
    try {
      setState({ phase: 'done', result: await runTests(p, code, 'submit') });
    } catch {
      setState({ phase: 'failed' });
    }
  };

  if (state.phase === 'idle') {
    return (
      <button type="button" className="btn btn-quiet btn-sm why-btn" onClick={() => void ask()}>
        <CircleHelp aria-hidden="true" />
        Why is it wrong? Run it
      </button>
    );
  }
  if (state.phase === 'running') {
    return (
      <p className="why-note" role="status">
        <LoaderCircle aria-hidden="true" className="spin" />
        Running the code with your version…
      </p>
    );
  }
  if (state.phase === 'failed') return <p className="why-note">The code could not be run here. Compare your version with the line shown above.</p>;

  const { result } = state;
  if (result.status === 'error' && result.error) {
    const help = errorHelp(result.error);
    return (
      <div className="why" role="status">
        <div className="why-label">With your version, Python cannot run the code at all</div>
        <PyErrorLine error={result.error} />
        {help && <p className="why-help">{help.replace(/`/g, '')}</p>}
      </div>
    );
  }
  const t = result.results.find((r) => !r.passed);
  if (!t) {
    return (
      <div className="why" role="status">
        <div className="why-label">Your version passes every test here</div>
        <p className="why-help">It behaves the same on these inputs, so it may be another way to write the line. The lesson asks for the line it taught.</p>
      </div>
    );
  }
  const help = t.error ? errorHelp(t.error) : null;
  return (
    <div className="why" role="status">
      <div className="why-label">With your version, the solution breaks on this input</div>
      <code className="why-input" translate="no">
        {t.input}
      </code>
      {t.error ? (
        <>
          <PyErrorLine error={t.error} />
          {help && <p className="why-help">{help.replace(/`/g, '')}</p>}
        </>
      ) : (
        <p className="why-help">
          It returns <code translate="no">{t.got ?? 'nothing'}</code>; the right answer is <code translate="no">{t.want}</code>.
        </p>
      )}
    </div>
  );
}
