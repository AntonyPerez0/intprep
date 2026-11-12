// Mock interview lobby (/mock): pick a kind of problem, then solve one against the clock on the
// Solve screen (/p/:id/solve?mock=1) with no hints and no pattern name. The closest this app gets
// to interview day: produce working code, unaided, in limited time.

import '../styles/pages/solve.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircleCheck, CircleX, GraduationCap, Sparkles, Timer } from 'lucide-react';
import { drawMock, mockHistory, mockPool, type MockPool } from '../lib/mock';
import { nextStep } from '../lib/path';
import { pythonEnabled } from '../lib/python';
import { useProgress } from '../lib/store';
import { PageHeader } from '../components/Shell';
import { DifficultyChip, EmptyState } from '../components/ui';
import { MOCK_MINUTES } from './Solve';

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function Mock() {
  const p = useProgress();
  const nav = useNavigate();
  const learned = mockPool(p, 'learned');
  const fresh = mockPool(p, 'new');
  const [pool, setPool] = useState<MockPool>(learned.length >= 3 ? 'learned' : 'new');
  const history = mockHistory(p).slice(0, 6);
  const next = nextStep(p);
  const available = pool === 'learned' ? learned.length : fresh.length;

  const start = () => {
    const q = drawMock(p, pool);
    if (q) nav(`/p/${q.id}/solve?mock=1`);
  };

  const header = (
    <PageHeader
      title="Mock interview"
      sub="One problem, a blank file and a clock. No hints, no pattern name, and your code has to pass the tests."
    />
  );

  if (!pythonEnabled()) {
    return (
      <div className="mock">
        {header}
        <EmptyState icon={Timer} title="Running code is turned off" actions={<Link to="/profile" className="btn btn-primary">Open profile</Link>}>
          A mock interview runs your code against the tests. Turn on Run my code in your profile to use it.
        </EmptyState>
      </div>
    );
  }
  if (!learned.length && !fresh.length) {
    return (
      <div className="mock">
        {header}
        <EmptyState
          icon={GraduationCap}
          title="Learn a problem first"
          actions={
            <Link to={next.href} className="btn btn-primary">
              Continue learning
            </Link>
          }
        >
          Mock interviews draw from the patterns you have started. Finish a pattern intro or a problem and come back.
        </EmptyState>
      </div>
    );
  }

  const options: { id: MockPool; title: string; body: string; count: number }[] = [
    {
      id: 'learned',
      title: 'A problem you have learned',
      body: 'Can you still write it from nothing? Picks one you have not been tested on lately.',
      count: learned.length,
    },
    {
      id: 'new',
      title: 'A new problem from patterns you know',
      body: 'You know the pattern but have not seen this problem: the closest thing to a real interview question.',
      count: fresh.length,
    },
  ];

  return (
    <div className="mock">
      {header}
      <div className="mock-grid">
        <section className="card mock-setup" aria-labelledby="mock-pick">
          <h2 id="mock-pick" className="card-title">
            What should it draw from?
          </h2>
          <div className="mock-options" role="radiogroup" aria-labelledby="mock-pick">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={pool === o.id}
                disabled={o.count === 0}
                className={`mock-option ${pool === o.id ? 'is-on' : ''}`}
                onClick={() => setPool(o.id)}
              >
                <span className="mock-option-title">{o.title}</span>
                <span className="mock-option-body">{o.count === 0 ? (o.id === 'learned' ? 'Nothing learned yet.' : 'No unlearned problems in the patterns you have started.') : o.body}</span>
                <span className="mock-option-count tabular">{o.count} available</span>
              </button>
            ))}
          </div>
          <ul className="mock-rules">
            <li>
              <Timer aria-hidden="true" />
              {MOCK_MINUTES.Easy} minutes for an Easy problem, {MOCK_MINUTES.Medium} for a Medium, {MOCK_MINUTES.Hard} for a Hard.
            </li>
            <li>
              <Sparkles aria-hidden="true" />
              Say your approach out loud before you type. Interviewers grade the thinking as much as the code.
            </li>
            <li>
              <CircleCheck aria-hidden="true" />
              Run the examples as often as you like. Submit runs every test; you can submit again until the time is up.
            </li>
          </ul>
          <button type="button" className="btn btn-primary btn-lg mock-start" disabled={available === 0} onClick={start}>
            <Timer aria-hidden="true" />
            Start the interview
          </button>
        </section>

        <section className="card mock-history" aria-labelledby="mock-past">
          <div className="mock-history-head">
            <h2 id="mock-past" className="card-title">
              Your interviews
            </h2>
            {p.stats.mocks > 0 && (
              <span className="text-sm text-tertiary tabular">
                {p.stats.mocksPassed} of {p.stats.mocks} passed
              </span>
            )}
          </div>
          {history.length ? (
            <ul className="mock-list">
              {history.map((h) => (
                <li key={h.problem.id}>
                  {h.passed ? <CircleCheck className="is-pass" aria-label="Passed" /> : <CircleX className="is-fail" aria-label="Not passed" />}
                  <Link to={`/p/${h.problem.id}`} className="mock-list-title truncate">
                    {h.problem.title}
                  </Link>
                  <DifficultyChip d={h.problem.difficulty} />
                  <span className="text-sm text-tertiary tabular">{clock(h.seconds)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-secondary">None yet. Your first one is the hardest to start; it gets easier.</p>
          )}
        </section>
      </div>
    </div>
  );
}
