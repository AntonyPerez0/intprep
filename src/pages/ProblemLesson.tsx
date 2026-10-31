import '../styles/pages/problem-lesson.css';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Clock,
  Database,
  ExternalLink,
  FileCode2,
  FileText,
  Gauge,
  Hammer,
  Keyboard,
  Lightbulb,
  Lock,
  RefreshCw,
  ScanSearch,
  Star,
  Target,
  TriangleAlert,
  Zap,
} from 'lucide-react';
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
import { CATEGORY_ICON, CategoryIcon, IconTile } from '../components/icons';
import { Badge, Completion, DifficultyChip, freeMirrorUrl, leetcodeUrl } from '../components/ui';

const STEPS = ['read', 'guess', 'hints', 'brute', 'insight', 'plan', 'code', 'complexity', 'pitfalls', 'order', 'keyline'] as const;
type Step = (typeof STEPS)[number];

const STEP_NAME: Record<Step, string> = {
  read: 'Understand the problem',
  guess: 'Make a guess',
  hints: 'Think it through',
  brute: 'The obvious way',
  insight: 'The key insight',
  plan: 'The plan',
  code: 'Build the code',
  complexity: 'Check the cost',
  pitfalls: 'Avoid the traps',
  order: 'Quick check',
  keyline: 'Final check',
};

/** Eyebrow shown above every step, e.g. "Step 3 of 11 · Think it through". */
const stepLabel = (s: Step) => `Step ${STEPS.indexOf(s) + 1} of ${STEPS.length} · ${STEP_NAME[s]}`;

const practiceLink = (p: Problem) => ({
  href: p.premium ? freeMirrorUrl(p.id) : leetcodeUrl(p.id),
  site: p.premium ? 'a free mirror' : 'LeetCode',
});

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

  const reward = wasLearned ? Math.round(XP.problem[p.difficulty] / 4) : XP.problem[p.difficulty];

  return (
    <SessionShell
      progress={i / STEPS.length}
      onClose={close}
      title={p.title}
      right={
        <span className="pill-stat xp plesson-reward" title={`Finish the lesson to earn ${reward} XP`}>
          <Zap strokeWidth={2} />+{reward}
          <span className="plesson-reward-unit">XP</span>
        </span>
      }
    >
      <div className={`plesson plesson-step-${step}`}>
        {step === 'read' && <ReadStep p={p} onNext={next} />}
        {step === 'guess' && <GuessStep p={p} onNext={next} />}
        {step === 'hints' && <HintsStep p={p} onNext={next} />}
        {step === 'brute' && (
          <TextStep
            step="brute"
            title="Start with brute force"
            sub="In an interview, say the simple solution out loud first. It shows you understand the problem and gives you something to improve."
            onNext={next}
          >
            <section className="card plesson-card">
              <CardHead icon={<IconTile icon={Hammer} size="sm" color="var(--text-tertiary)" />} title="The naive approach" sub="Correct, but too slow to stop there" />
              <Md text={p.brute} className="plesson-prose" />
            </section>
          </TextStep>
        )}
        {step === 'insight' && (
          <TextStep step="insight" title="The aha moment" onNext={next}>
            <div className="insight-card plesson-insight">
              <div className="insight-label">
                <Lightbulb strokeWidth={2} />
                <span>Key insight · {p.pattern}</span>
              </div>
              <div className="plesson-insight-body">
                <Md text={p.insight} />
              </div>
              <div className="mnemonic">
                <Brain strokeWidth={2} />
                <span>
                  <span className="plesson-mn-label">Remember</span>
                  {p.mnemonic}
                </span>
              </div>
            </div>
            <section className="card plesson-card">
              <CardHead
                icon={<IconTile icon={ScanSearch} size="sm" />}
                title="Clues that point here"
                sub="Look for these the next time you read a problem"
              />
              <div className="plesson-chips">
                {p.signals.map((s, k) => (
                  <span key={k} className="chip signal">
                    {inline(s)}
                  </span>
                ))}
              </div>
            </section>
          </TextStep>
        )}
        {step === 'plan' && <PlanStep p={p} onNext={next} />}
        {step === 'code' && <CodeStep p={p} onNext={next} />}
        {step === 'complexity' && <ComplexityDrill problem={p} onDone={next} kicker={stepLabel('complexity')} />}
        {step === 'pitfalls' && (
          <TextStep step="pitfalls" title="Common traps" sub="Run through these whenever you write this solution yourself." onNext={next}>
            <ul className="plesson-list">
              {p.pitfalls.map((x, k) => (
                <li key={k} className="callout callout-warning">
                  <TriangleAlert />
                  <div>{inline(x)}</div>
                </li>
              ))}
            </ul>
            <section className="card pad-0 plesson-cost" aria-label="Cost summary">
              <div className="plesson-cost-head">
                <Gauge />
                <span>Cost summary</span>
              </div>
              <div className="plesson-cost-grid">
                <div className="plesson-cost-cell">
                  <div className="plesson-cost-label">
                    <Clock /> Time
                  </div>
                  <div className="plesson-cost-value">{p.time}</div>
                </div>
                <div className="plesson-cost-cell">
                  <div className="plesson-cost-label">
                    <Database /> Space
                  </div>
                  <div className="plesson-cost-value">{p.space}</div>
                </div>
              </div>
              <div className="plesson-cost-why">{inline(p.complexityWhy)}</div>
            </section>
          </TextStep>
        )}
        {step === 'order' && <OrderDrill problem={p} onDone={next} kicker={stepLabel('order')} />}
        {step === 'keyline' && <KeyLineDrill problem={p} onDone={next} kicker={stepLabel('keyline')} />}
      </div>
    </SessionShell>
  );
}

// ── Building blocks ─────────────────────────────────────────────────────────

function StepHeader({ step, title, sub, children }: { step: Step; title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="plesson-head">
      <div className="kicker">{stepLabel(step)}</div>
      <h1 className="q-title">{title}</h1>
      {sub && <p className="plesson-sub">{sub}</p>}
      {children}
    </header>
  );
}

function CardHead({ icon, title, sub }: { icon: ReactNode; title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="plesson-card-head">
      {icon}
      <div className="grow">
        <h2 className="card-title">{title}</h2>
        {sub && <div className="card-subtitle">{sub}</div>}
      </div>
    </div>
  );
}

/** Collapsible copy of the problem statement, for steps that need a quick look back. */
function ProblemPeek({ p }: { p: Problem }) {
  return (
    <details className="disclosure plesson-peek">
      <summary>
        <FileText />
        Problem statement
      </summary>
      <ProblemPrompt p={p} compact showTitle={false} />
    </details>
  );
}

function TextStep({
  step,
  title,
  sub,
  children,
  onNext,
}: {
  step: Step;
  title: string;
  sub?: string;
  children: ReactNode;
  onNext: () => void;
}) {
  return (
    <>
      <StepHeader step={step} title={title} sub={sub} />
      <div className="plesson-stack">{children}</div>
      <ActionBar status="idle" onContinue={onNext} />
    </>
  );
}

// ── Steps ───────────────────────────────────────────────────────────────────

function ReadStep({ p, onNext }: { p: Problem; onNext: () => void }) {
  const cat = CATEGORY_BY_ID[p.category];
  const CatIcon = CATEGORY_ICON[p.category];
  const link = practiceLink(p);
  return (
    <>
      <StepHeader step="read" title={p.title}>
        <div className="plesson-meta">
          <span className="plesson-num">#{p.num}</span>
          <DifficultyChip d={p.difficulty} />
          <span className="chip plesson-cat" style={{ ['--c' as string]: cat.color }}>
            <CatIcon strokeWidth={2} />
            {cat.name}
          </span>
          {p.premium && <Badge tone="warning">LeetCode Premium</Badge>}
        </div>
      </StepHeader>
      <div className="plesson-stack">
        <ProblemPrompt p={p} showTitle={false} />
        <div className="callout plesson-tryfirst">
          <Target />
          <div className="grow">
            <div className="plesson-callout-title">Before you continue</div>
            <p>Restate the problem in your own words and trace the first example by hand.</p>
            <p className="plesson-tryfirst-alt">
              Want a real challenge? Try solving it first on{' '}
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.site}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
              . Struggling first makes the lesson stick.
            </p>
          </div>
        </div>
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
      <StepHeader
        step="guess"
        title="Which pattern do you think will crack it?"
        sub="Guess even if you are unsure. Predicting before you are told makes the answer far more memorable."
      />
      <div className="plesson-stack">
        <ProblemPeek p={p} />
        <Choices
          options={options.map((c) => ({
            key: c,
            label: CATEGORY_BY_ID[c].name,
            icon: <CategoryIcon id={c} color={CATEGORY_BY_ID[c].color} size="sm" />,
          }))}
          selected={sel}
          onSelect={(k) => {
            setSel(k);
            sfx('tap');
          }}
          answer={accepted}
          revealed={status !== 'idle'}
          twoCol
        />
      </div>
      <ActionBar
        status={status}
        canCheck={sel !== null}
        onCheck={() => {
          setStatus(ok ? 'correct' : 'wrong');
          sfx(ok ? 'correct' : 'wrong');
        }}
        onContinue={onNext}
        title={ok ? 'Great instinct' : 'Good guess — here is the answer'}
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
  const total = p.hints.length;
  const reveal = () => setShown((s) => Math.min(s + 1, total));
  return (
    <>
      <StepHeader
        step="hints"
        title="Try to find the idea yourself"
        sub="Give it a minute of real thought. Reveal one hint at a time, only when you are stuck."
      />
      <div className="plesson-stack">
        <ProblemPeek p={p} />
        <ol className="plesson-list" aria-label="Hints">
          {p.hints.map((h, k) =>
            k < shown ? (
              <li key={k} className="callout callout-brand plesson-hint">
                <Lightbulb />
                <div className="grow">
                  <div className="plesson-hint-label">Hint {k + 1}</div>
                  {inline(h)}
                </div>
              </li>
            ) : (
              <li key={k}>
                {k === shown ? (
                  <button type="button" className="plesson-locked next" onClick={reveal}>
                    <Lock />
                    <span className="grow">Hint {k + 1}</span>
                    <span className="plesson-locked-action">Reveal</span>
                  </button>
                ) : (
                  <div className="plesson-locked">
                    <Lock />
                    <span className="grow">Hint {k + 1}</span>
                  </div>
                )}
              </li>
            ),
          )}
        </ol>
      </div>
      <ActionBar
        status="idle"
        onContinue={onNext}
        continueLabel={shown === 0 ? 'Skip to the answer' : 'Show me the solution'}
        secondary={
          shown < total ? (
            <button type="button" className="btn btn-secondary btn-lg plesson-hint-btn" onClick={reveal}>
              <Lightbulb />
              Hint <span className="tabular">{shown + 1}/{total}</span>
            </button>
          ) : undefined
        }
      />
    </>
  );
}

function PlanStep({ p, onNext }: { p: Problem; onNext: () => void }) {
  const [shown, setShown] = useState(1);
  const total = p.steps.length;
  const all = shown >= total;
  return (
    <>
      <StepHeader step="plan" title="The algorithm, step by step" sub="Before each new step appears, try to predict it." />
      <div className="plesson-stack">
        <ol className="plesson-plan" aria-label="Algorithm steps">
          {p.steps.slice(0, shown).map((s, k) => (
            <li key={k} className="plesson-plan-step">
              <span className="plesson-plan-num">{k + 1}</span>
              <span className="plesson-plan-text">{inline(s)}</span>
            </li>
          ))}
          {!all && (
            <li className="plesson-plan-next" aria-hidden="true">
              <span className="plesson-plan-num">{shown + 1}</span>
              <span className="plesson-plan-text">What comes next? Predict it, then reveal.</span>
            </li>
          )}
        </ol>
        <div className="plesson-plan-foot">
          <span className="tabular">
            {shown} of {total} steps
          </span>
          <span className="plesson-plan-bar" aria-hidden="true">
            {p.steps.map((_, k) => (
              <span key={k} className={k < shown ? 'on' : ''} />
            ))}
          </span>
        </div>
      </div>
      <ActionBar status="idle" onContinue={all ? onNext : () => setShown(shown + 1)} continueLabel={all ? 'Continue' : `Reveal step ${shown + 1}`} />
    </>
  );
}

function CodeStep({ p, onNext }: { p: Problem; onNext: () => void }) {
  const parsed = parseSolution(p.solution);
  const startAt = parsed.chunks[0]?.header ? 1 : 0;
  const [c, setC] = useState(Math.min(startAt, parsed.chunks.length - 1));
  const last = c >= parsed.chunks.length - 1;
  const chunk = parsed.chunks[c];
  const pieces = parsed.chunks.length - startAt;
  const piece = c + 1 - startAt;
  return (
    <>
      <StepHeader step="code" title="Build the solution one piece at a time" />
      <div className="plesson-code">
        <aside className="plesson-explain" aria-live="polite">
          <div className="plesson-explain-head">
            <span className="plesson-explain-count">
              Piece <span className="tabular">{Math.max(piece, 1)}</span> of <span className="tabular">{Math.max(pieces, 1)}</span>
            </span>
            {chunk.keyLines.length > 0 && (
              <Badge tone="warning">
                <Star /> Key line
              </Badge>
            )}
          </div>
          <div className="plesson-segs" aria-hidden="true">
            {Array.from({ length: Math.max(pieces, 1) }, (_, k) => (
              <span key={k} className={k < piece ? 'on' : ''} />
            ))}
          </div>
          <p className="plesson-explain-text" key={c}>
            {inline(chunk.explain)}
          </p>
          {chunk.keyLines.length > 0 && (
            <div className="plesson-keynote">
              <Star />
              <div>
                {chunk.keyLines.length > 1 ? (
                  <>
                    <strong>These lines carry the idea.</strong> They are marked with a gold dot in the code, and you will be asked to recall them.
                  </>
                ) : (
                  <>
                    <strong>This line carries the idea.</strong> It is marked with a gold dot in the code, and you will be asked to recall it.
                  </>
                )}
              </div>
            </div>
          )}
        </aside>
        <div className="plesson-codewin">
          <div className="plesson-codewin-bar">
            <FileCode2 />
            <span>solution.py</span>
            <span className="plesson-codewin-lang">Python</span>
          </div>
          <CodeView lines={parsed.lines} focusChunk={c} hideAfterChunk={c} showKeys />
        </div>
      </div>
      <ActionBar
        status="idle"
        onContinue={last ? onNext : () => setC(c + 1)}
        continueLabel={last ? 'Continue' : 'Next piece'}
        secondary={
          c > startAt ? (
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => setC(c - 1)}>
              Back
            </button>
          ) : undefined
        }
      />
    </>
  );
}

// ── Completion ──────────────────────────────────────────────────────────────

function Complete({ p, xp, relearn }: { p: Problem; xp: number; relearn: boolean }) {
  const progress = useProgress();
  const card = progress.problems[p.id]?.srs;
  const siblings = problemsFor(p.category);
  const nextInUnit = siblings.find((q) => !progress.problems[q.id]?.learnedAt && q.id !== p.id);
  const learnedInUnit = siblings.filter((q) => progress.problems[q.id]?.learnedAt).length;
  const link = practiceLink(p);
  const due = card ? friendlyDue(card.due) : null;
  return (
    <SessionShell progress={1} title={p.title}>
      <div className="plesson-done">
        <Completion
          icon={relearn ? RefreshCw : BadgeCheck}
          tone={relearn ? 'brand' : 'success'}
          title={relearn ? 'Refreshed' : 'Problem learned'}
          subtitle={
            <>
              <strong>{p.title}</strong> {relearn ? 'is fresh in your mind again.' : 'is now in your review deck.'}
            </>
          }
          stats={[
            { label: 'XP earned', value: `+${xp}` },
            { label: 'Next review', value: due ? due.charAt(0).toUpperCase() + due.slice(1) : '—' },
            {
              label: 'Unit progress',
              value: (
                <>
                  {learnedInUnit}
                  <span className="plesson-done-of">/{siblings.length}</span>
                </>
              ),
            },
          ]}
        >
          <Link to={`/p/${p.id}/rebuild`} className="btn btn-primary btn-lg btn-block">
            <Keyboard />
            Code it from memory
          </Link>
          <p className="plesson-done-tip">Rebuild it now, while it is fresh, to make it stick.</p>
          {nextInUnit ? (
            <Link to={`/p/${nextInUnit.id}/learn`} className="btn btn-secondary btn-lg btn-block">
              <span className="truncate">Next: {nextInUnit.title}</span>
              <ArrowRight />
            </Link>
          ) : (
            <Link to="/learn" className="btn btn-secondary btn-lg btn-block">
              Back to the learning path
              <ArrowRight />
            </Link>
          )}
          <a className="btn btn-quiet btn-block" href={link.href} target="_blank" rel="noreferrer">
            Solve it on {link.site}
            <ExternalLink />
          </a>
        </Completion>
      </div>
    </SessionShell>
  );
}
