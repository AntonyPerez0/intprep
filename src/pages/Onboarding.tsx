import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DAILY_GOALS } from '../lib/game';
import { finishOnboarding, type Experience } from '../lib/store';
import { sfx } from '../lib/sound';
import { LogoMark, Modal } from '../components/ui';

const LEVELS: { id: Experience; icon: string; title: string; blurb: string }[] = [
  { id: 'none', icon: '🌱', title: "I'm brand new to coding", blurb: 'Start with Python basics, Big-O and recursion.' },
  { id: 'some', icon: '🌿', title: 'I know some code', blurb: 'Jump into patterns; beginner lessons are there if you need them.' },
  { id: 'comfortable', icon: '🌳', title: "I'm comfortable coding", blurb: 'Go straight to the problems and drills.' },
];

export function Onboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [exp, setExp] = useState<Experience>('some');
  const [goal, setGoal] = useState(50);

  const done = () => {
    finishOnboarding({ name: name.trim(), experience: exp, dailyGoal: goal });
    sfx('complete');
    nav(exp === 'none' ? '/foundations/how-to-learn' : '/learn');
  };

  return (
    <Modal>
      {step === 0 && (
        <div className="stack center" style={{ alignItems: 'center' }}>
          <LogoMark size={64} />
          <h1 style={{ margin: '6px 0 0' }}>Welcome to IntPrep</h1>
          <p className="muted" style={{ maxWidth: 400 }}>
            Learn the 150 classic coding-interview problems step by step, then lock in the patterns with quick daily drills. A few minutes a day, a streak to
            protect, and a lot less "I've seen this but can't solve it".
          </p>
          <input className="input" placeholder="Your first name (optional)" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} style={{ maxWidth: 320 }} />
          <button type="button" className="btn btn-green" style={{ minWidth: 220 }} onClick={() => setStep(1)}>
            Get started
          </button>
        </div>
      )}
      {step === 1 && (
        <div className="stack">
          <h2>How much coding do you know?</h2>
          {LEVELS.map((l) => (
            <button key={l.id} type="button" className={`choice ${exp === l.id ? 'selected' : ''}`} onClick={() => setExp(l.id)}>
              <span className="choice-icon">{l.icon}</span>
              <span className="grow">
                <div>{l.title}</div>
                <div className="small muted" style={{ fontWeight: 600 }}>
                  {l.blurb}
                </div>
              </span>
            </button>
          ))}
          <button type="button" className="btn btn-green" onClick={() => setStep(2)}>
            Continue
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="stack">
          <h2>Pick a daily goal</h2>
          <p className="muted small" style={{ margin: 0 }}>
            Small and steady wins. You can change this any time. Practising on any day keeps your 🔥 streak alive; hitting the goal earns 💎 gems.
          </p>
          {DAILY_GOALS.map((g) => (
            <button key={g.xp} type="button" className={`choice ${goal === g.xp ? 'selected' : ''}`} onClick={() => setGoal(g.xp)}>
              <span className="grow">
                <strong>{g.label}</strong> <span className="muted">· {g.blurb}</span>
              </span>
              <span className="chip">{g.xp} XP</span>
            </button>
          ))}
          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
              Back
            </button>
            <button type="button" className="btn btn-green grow" onClick={done}>
              Let's go!
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
