import { Link } from 'react-router-dom';
import { SCIENCE } from '../content/science';
import { PageHeader } from '../components/Shell';

export function Science() {
  return (
    <div>
      <PageHeader
        title="Why this works"
        sub="IntPrep is designed around decades of research on how people learn and remember — and on what makes practice something you want to come back to."
      />
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-title">The short version</div>
        <ol style={{ margin: 0, paddingLeft: '1.2em' }}>
          <li>
            <strong>Learn</strong> a pattern with worked examples, broken into small chunks.
          </li>
          <li>
            <strong>Retrieve</strong> it: guess before you are told, rebuild code from memory, order the steps yourself.
          </li>
          <li>
            <strong>Space</strong> it: each problem returns right as you are about to forget it.
          </li>
          <li>
            <strong>Mix</strong> it: reviews and Blitz shuffle patterns so you learn to tell them apart — exactly what an interview asks.
          </li>
          <li>
            <strong>Keep showing up</strong>: streaks, goals and small wins turn practice into a daily habit.
          </li>
        </ol>
      </div>
      <div className="stack">
        {SCIENCE.map((s) => (
          <div key={s.id} className="card science-card">
            <div className="si">{s.icon}</div>
            <div className="grow">
              <div className="card-title">{s.title}</div>
              <p style={{ marginBottom: 8 }}>{s.finding}</p>
              <p className="small" style={{ marginBottom: 8 }}>
                <strong style={{ color: 'var(--brand)' }}>In IntPrep:</strong> {s.howWeUseIt}
              </p>
              <div className="tiny faint">📚 {s.source}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="footer-note">
        The full write-up with references is in <code>docs/LEARNING_SCIENCE.md</code> in the project repository. <Link to="/learn">Start learning →</Link>
      </div>
    </div>
  );
}
