import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { CATEGORY_BY_ID } from '../content/categories';
import { PROBLEM_BY_ID, problemsFor } from '../content/index';
import type { CategoryId, Problem } from '../content/types';
import { confetti } from '../lib/confetti';
import { friendlyDue } from '../lib/date';
import { acceptedCategories, patternChoices } from '../lib/drills';
import { XP } from '../lib/game';
import { inline, Md } from '../lib/markdown';
import { parseSolution } from '../lib/parseSolution';
import { sfx } from '../lib/sound';
import { getProgress, learnProblem, useProgress } from '../lib/store';
import { ActionBar, Choices, CodeView, ProblemPrompt, type CheckStatus } from '../components/interact';
import { ComplexityDrill, KeyLineDrill, OrderDrill } from '../components/Drills';
import { SessionShell } from '../components/Shell';
import { DifficultyChip, freeMirrorUrl, Icon, leetcodeUrl } from '../components/ui';

const STEPS = ['read', 'guess', 'hints', 'brute', 'insight', 'plan', 'code', 'complexity', 'pitfalls', 'order', 'keyline'] as const;
type Step = (typeof STEPS)[number];

const STEP_LABEL: Record<Step, string> = {
  read: 'Step 1 · Understand the problem',
  guess: 'Step 2 · Make a guess',
  hints: 'Step 3 · Think it through',
  brute: 'Step 4 · The obvious way',
  insight: 'Step 5 · The key insight',
  plan: 'Step 6 · The plan',
  code: 'Step 7 · Build the code',
  complexity: 'Step 8 · Check the cost',
  pitfalls: 'Step 9 · Avoid the traps',
  order: 'Quick check',
  keyline: 'Final check',
};

export function ProblemLessonRoute() {
  const { id } = useParams();
  const p = id ? PROBLEM_BY_ID[id] : undefined;
  if (!p) return <Navigate to="/problems" replace />;
  return <ProblemLesson key={p.id} p={p} />;
}

function ProblemLesson({ p }: { p: Problem }) {
  const nav = useNavigate();
  // Captured once: after learnProblem() runs, the store says "learned".
  const [wasLearned] = useState(() => !!getProgress().problems[p.id]?.learnedAt);
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const [xp, setXp] = useState(0);
  const step = STEPS[i];

  const next = () => {
    if (i + 1 < STEPS.length) {
      setI(i + 1);
      window.scrollTo(0, 0);
    } else {
      const amount = XP.problem[p.difficulty];
      setXp(wasLearned ? Math.round(amount / 4) : amount);
      learnProblem(p.id, p.difficulty, amount);
      setDone(true);
      sfx('complete');
      confetti();
    }
  };
  const close = () => nav(`/p/${p.id}`);

  if (done) return <Complete p={p} xp={xp} relearn={wasLearned} />;

  return (
    <SessionShell progress={i / STEPS.length} onClose={close}>
      {step === 'read' && <ReadStep p={p} onNext={next} />}
      {step === 'guess' && <GuessStep p={p} onNext={next} />}
      {step === 'hints' && <HintsStep p={p} onNext={next} />}
      {step === 'brute' && (
        <TextStep label={STEP_LABEL.brute} title="Start with brute force" onNext={next}>
          <p className="muted">In an interview, say the simple solution out loud first. It shows you understand the problem and gives you something to improve.</p>
          <div className="card">
            <Md text={p.brute} />
          </div>
        </TextStep>
      )}
      {step === 'insight' && (
        <TextStep label={STEP_LABEL.insight} title="The aha moment 💡" onNext={next}>
          <div className="insight-card">
            <div className="tiny" style={{ fontWeight: 900, opacity: 0.85, letterSpacing: '.08em' }}>
              {CATEGORY_BY_ID[p.category].icon} {p.pattern.toUpperCase()}
            </div>
            <div style={{ marginTop: 6, fontWeight: 700, fontSize: '1.08rem' }}>
              <Md text={p.insight} />
            </div>
            <div className="mnemonic">🧠 Remember: {p.mnemonic}</div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="small muted" style={{ fontWeight: 800, marginBottom: 6 }}>
              Clues that point here — look for these next time:
            </div>
            <div className="row wrap" style={{ gap: 6 }}>
              {p.signals.map((s, k) => (
                <span key={k} className="chip signal">
                  {inline(s)}
                </span>
              ))}
            </div>
          </div>
        </TextStep>
      )}
      {step === 'plan' && <PlanStep p={p} onNext={next} />}
      {step === 'code' && <CodeStep p={p} onNext={next} />}
      {step === 'complexity' && <ComplexityDrill problem={p} onDone={next} kicker={STEP_LABEL.complexity} />}
      {step === 'pitfalls' && (
        <TextStep label={STEP_LABEL.pitfalls} title="Common traps" onNext={next}>
          <div className="stack">
            {p.pitfalls.map((x, k) => (
              <div key={k} className="hint-box">
                ⚠️ {inline(x)}
              </div>
            ))}
          </div>
          <div className="card flat small" style={{ marginTop: 16 }}>
            <strong>Cost:</strong> {p.time} time · {p.space} space. <span className="muted">{inline(p.complexityWhy)}</span>
          </div>
        </TextStep>
      )}
      {step === 'order' && <OrderDrill problem={p} onDone={next} kicker={STEP_LABEL.order} />}
      {step === 'keyline' && <KeyLineDrill problem={p} onDone={next} kicker={STEP_LABEL.keyline} />}
    </SessionShell>
  );
}

function TextStep({ label, title, children, onNext }: { label: string; title: string; children: React.ReactNode; onNext: () => void }) {
  return (
    <>
      <div className="kicker">{label}</div>
      <h2 className="q-title">{title}</h2>
      {children}
      <ActionBar status="idle" onContinue={onNext} />
    </>
  );
}

function ReadStep({ p, onNext }: { p: Problem; onNext: () => void }) {
  const cat = CATEGORY_BY_ID[p.category];
  return (
    <>
      <div className="kicker">{STEP_LABEL.read}</div>
      <h2 className="q-title">
        {p.title} <span className="faint small">#{p.num}</span>
      </h2>
      <div className="row wrap" style={{ marginBottom: 12, gap: 6 }}>
        <DifficultyChip d={p.difficulty} />
        <span className="chip">
          {cat.icon} {cat.short}
        </span>
        {p.premium && <span className="chip">LeetCode Premium</span>}
      </div>
      <ProblemPrompt p={p} showTitle={false} />
      <div className="card flat small" style={{ marginTop: 16 }}>
        <strong>🎯 Before you continue:</strong> restate the problem in your own words and trace the first example by hand.{' '}
        <span className="muted">
          Want a real challenge? Try solving it first on{' '}
          <a href={p.premium ? freeMirrorUrl(p.id) : leetcodeUrl(p.id)} target="_blank" rel="noreferrer">
            {p.premium ? 'a free mirror' : 'LeetCode'} <Icon name="external" size={12} />
          </a>{' '}
          — struggling first makes the lesson stick better.
        </span>
      </div>
      <ActionBar status="idle" onContinue={onNext} continueLabel="I understand it" />
    </>
  );
}

function GuessStep({ p, onNext }: { p: Problem; onNext: () => void }) {
  const { options } = useMemo(() => patternChoices(p), [p]);
  const accepted = acceptedCategories(p);
  const [sel, setSel] = useState<string | null>(null);
  const [status, setStatus] = useState<CheckStatus>('idle');
  const ok = sel !== null && accepted.includes(sel as CategoryId);
  return (
    <>
      <div className="kicker">{STEP_LABEL.guess}</div>
      <h2 className="q-title">Which pattern do you think will crack it?</h2>
      <p className="muted small">Guess even if you are unsure — predicting before you are told makes the answer far more memorable.</p>
      <Choices
        options={options.map((c) => ({ key: c, label: CATEGORY_BY_ID[c].name, icon: CATEGORY_BY_ID[c].icon }))}
        selected={sel}
        onSelect={(k) => {
          setSel(k);
          sfx('tap');
        }}
        answer={accepted}
        revealed={status !== 'idle'}
        twoCol
      />
      <ActionBar
        status={status}
        canCheck={sel !== null}
        onCheck={() => {
          setStatus(ok ? 'correct' : 'wrong');
          sfx(ok ? 'correct' : 'wrong');
        }}
        onContinue={onNext}
        title={ok ? 'Great instinct!' : 'Good guess — here is the answer'}
        feedback={
          <>
            It's <strong>{CATEGORY_BY_ID[p.category].name}</strong>. The clues:{' '}
            {p.signals.map((s, k) => (
              <span key={k}>
                {k > 0 && ' · '}
                {inline(s)}
              </span>
            ))}
          </>
        }
      />
    </>
  );
}

function HintsStep({ p, onNext }: { p: Problem; onNext: () => void }) {
  const [shown, setShown] = useState(0);
  return (
    <>
      <div className="kicker">{STEP_LABEL.hints}</div>
      <h2 className="q-title">Try to find the idea yourself</h2>
      <p className="muted">Give it a minute of real thought. Reveal one hint at a time only when you are stuck.</p>
      <div className="stack">
        {p.hints.slice(0, shown).map((h, k) => (
          <div key={k} className="hint-box">
            <strong>Hint {k + 1}:</strong> {inline(h)}
          </div>
        ))}
      </div>
      <ActionBar
        status="idle"
        onContinue={onNext}
        continueLabel={shown === 0 ? 'Skip to the answer' : 'Show me the solution'}
        secondary={
          shown < p.hints.length ? (
            <button type="button" className="btn btn-ghost" onClick={() => setShown(shown + 1)}>
              💡 Hint {shown + 1}/{p.hints.length}
            </button>
          ) : undefined
        }
      />
    </>
  );
}

function PlanStep({ p, onNext }: { p: Problem; onNext: () => void }) {
  const [shown, setShown] = useState(1);
  const all = shown >= p.steps.length;
  return (
    <>
      <div className="kicker">{STEP_LABEL.plan}</div>
      <h2 className="q-title">The algorithm, step by step</h2>
      <p className="muted small">Before each new step appears, try to predict it.</p>
      <ol className="steps-list">
        {p.steps.slice(0, shown).map((s, k) => (
          <li key={k}>
            <span>{inline(s)}</span>
          </li>
        ))}
      </ol>
      <ActionBar
        status="idle"
        onContinue={all ? onNext : () => setShown(shown + 1)}
        continueLabel={all ? 'Continue' : `Next step (${shown}/${p.steps.length})`}
      />
    </>
  );
}

function CodeStep({ p, onNext }: { p: Problem; onNext: () => void }) {
  const parsed = parseSolution(p.solution);
  const startAt = parsed.chunks[0]?.header ? 1 : 0;
  const [c, setC] = useState(Math.min(startAt, parsed.chunks.length - 1));
  const last = c >= parsed.chunks.length - 1;
  const chunk = parsed.chunks[c];
  return (
    <>
      <div className="kicker">
        {STEP_LABEL.code} · {c + 1 - startAt}/{parsed.chunks.length - startAt}
      </div>
      <h2 className="q-title">Build the solution one piece at a time</h2>
      <div className="bubble" style={{ marginBottom: 12 }} key={c}>
        💬 {inline(chunk.explain)}
        {chunk.keyLines.length > 0 && (
          <div className="tiny" style={{ marginTop: 6, color: 'var(--gold)', fontWeight: 900 }}>
            ★ Key line — this one carries the idea. You will be asked to recall it.
          </div>
        )}
      </div>
      <CodeView lines={parsed.lines} focusChunk={c} hideAfterChunk={c} showKeys />
      <ActionBar
        status="idle"
        onContinue={last ? onNext : () => setC(c + 1)}
        continueLabel={last ? 'Continue' : 'Next piece'}
        secondary={
          c > startAt ? (
            <button type="button" className="btn btn-ghost" onClick={() => setC(c - 1)}>
              Back
            </button>
          ) : undefined
        }
      />
    </>
  );
}

function Complete({ p, xp, relearn }: { p: Problem; xp: number; relearn: boolean }) {
  const progress = useProgress();
  const card = progress.problems[p.id]?.srs;
  const siblings = problemsFor(p.category);
  const nextInUnit = siblings.find((q) => !progress.problems[q.id]?.learnedAt && q.id !== p.id);
  return (
    <SessionShell progress={1}>
      <div className="complete">
        <div className="trophy">{p.difficulty === 'Hard' ? '🐉' : '🏅'}</div>
        <h1 style={{ marginTop: 12 }}>{relearn ? 'Refreshed!' : 'Problem learned!'}</h1>
        <p className="muted">
          <strong>{p.title}</strong> {relearn ? 'is fresh in your mind again.' : 'is now in your review deck.'}
          {card && (
            <>
              {' '}
              Next review: <strong>{friendlyDue(card.due)}</strong>.
            </>
          )}
        </p>
        <div className="reward-tiles">
          <div className="reward" style={{ ['--c' as string]: 'var(--gold)' }}>
            <div className="rk">XP</div>
            <div className="rv">+{xp}</div>
          </div>
          <div className="reward" style={{ ['--c' as string]: 'var(--blue)' }}>
            <div className="rk">Pattern</div>
            <div className="rv" style={{ fontSize: '1.4rem' }}>
              {CATEGORY_BY_ID[p.category].icon}
            </div>
          </div>
          <div className="reward" style={{ ['--c' as string]: 'var(--green)' }}>
            <div className="rk">Level</div>
            <div className="rv">{p.difficulty}</div>
          </div>
        </div>
        <div className="card flat small" style={{ textAlign: 'left', marginBottom: 18 }}>
          <strong>🔒 Lock it in:</strong> rebuilding the code from memory now (while it is fresh) is the fastest way to make it stick. Then solve it on LeetCode
          without peeking.
        </div>
        <div className="stack" style={{ maxWidth: 380, margin: '0 auto' }}>
          <Link to={`/p/${p.id}/rebuild`} className="btn btn-blue btn-block">
            ⌨️ Code it from memory
          </Link>
          {nextInUnit ? (
            <Link to={`/p/${nextInUnit.id}/learn`} className="btn btn-green btn-block">
              Next: {nextInUnit.title}
            </Link>
          ) : (
            <Link to="/learn" className="btn btn-green btn-block">
              Back to the path
            </Link>
          )}
          <a className="btn btn-ghost btn-block" href={p.premium ? freeMirrorUrl(p.id) : leetcodeUrl(p.id)} target="_blank" rel="noreferrer">
            Solve on {p.premium ? 'a free mirror' : 'LeetCode'} <Icon name="external" size={16} />
          </a>
        </div>
      </div>
    </SessionShell>
  );
}
