import '../styles/pages/problem-lesson.css';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Brain,
  Clock,
  Database,
  Eye,
  ExternalLink,
  FileText,
  Gauge,
  Hammer,
  Keyboard,
  Lightbulb,
  Lock,
  PencilLine,
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
import { baseIndent, codeLines, gradeCode, lineKey, type Grade } from '../lib/codegrade';
import { confetti } from '../lib/confetti';
import { friendlyDue } from '../lib/date';
import { acceptedCategories, patternChoices } from '../lib/drills';
import { XP } from '../lib/game';
import { gapSource, gapsSummary, type GapSource, type GapsGrade } from '../lib/gaps';
import { highlightLine } from '../lib/highlight';
import { inline, Md } from '../lib/markdown';
import { lessonParts as bodyParts, parseSolution } from '../lib/parseSolution';
import { sfx } from '../lib/sound';
import { getProgress, learnProblem, useProgress } from '../lib/store';
import { ActionBar, Choices, ProblemPrompt, type CheckStatus } from '../components/interact';
import { CheckedAction, CodeLine, CodePane, CodeTyper, GivenLines, TyperFooter, TyperWindow } from '../components/CodeTyper';
import { GapsWindow, useGaps, type CodeGapsHandle } from '../components/CodeGaps';
import { ComplexityDrill } from '../components/Drills';
import { SessionShell } from '../components/Shell';
import { CATEGORY_ICON, CategoryIcon, IconTile } from '../components/icons';
import { Badge, Completion, DifficultyChip, freeMirrorUrl, leetcodeUrl } from '../components/ui';

// The guided lesson for one problem (/p/:id/learn), ten steps: understand it, guess the pattern,
// hints, brute force, the insight, the plan, then write the code part by part (look, cover,
// write, check), the cost, the traps, and a final check that fills the gaps across the whole
// solution. Finishing it adds the problem to the review deck.

const STEPS = ['read', 'guess', 'hints', 'brute', 'insight', 'plan', 'code', 'complexity', 'pitfalls', 'gaps'] as const;
type Step = (typeof STEPS)[number];

const STEP_NAME: Record<Step, string> = {
  read: 'Understand the problem',
  guess: 'Make a guess',
  hints: 'Think it through',
  brute: 'The obvious way',
  insight: 'The key insight',
  plan: 'The plan',
  code: 'Write the code',
  complexity: 'Check the cost',
  pitfalls: 'Avoid the traps',
  gaps: 'Final check',
};

/** Steps rendered by the shared drill components (they bring their own h2 question title). */
const DRILL_STEPS: readonly Step[] = ['complexity'];

/** Eyebrow shown above every step, e.g. "Step 3 of 10 · Think it through". */
const stepLabel = (s: Step) => `Step ${STEPS.indexOf(s) + 1} of ${STEPS.length} · ${STEP_NAME[s]}`;

const isFinePointer = () => !!window.matchMedia?.('(pointer: fine)').matches;
const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

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
  // How the learner did, for the progress bar and the completion screen.
  const partCount = useMemo(() => bodyParts(parseSolution(p.solution)).length, [p]);
  const [records, setRecords] = useState<PartRecord[]>(() => Array.from({ length: partCount }, () => ({ ...NO_RECORD })));
  const [final, setFinal] = useState<GapsGrade | null>(null);
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
  const record = (k: number, patch: Partial<PartRecord>) => setRecords((rs) => rs.map((r, j) => (j === k ? { ...r, ...patch } : r)));

  if (done) return <Complete p={p} xp={xp} relearn={wasLearned} records={records} final={final} />;

  const reward = wasLearned ? Math.round(XP.problem[p.difficulty] / 4) : XP.problem[p.difficulty];
  // Writing the code moves the bar part by part.
  const within = step === 'code' && partCount ? records.filter((r) => r.checked).length / partCount : 0;

  return (
    <SessionShell
      progress={(i + within) / STEPS.length}
      onClose={close}
      title={p.title}
      right={
        <span
          className="pill-stat xp plesson-reward"
          title={wasLearned ? `Refresher: finish to earn ${reward} XP (a quarter of the first-time reward)` : `Finish the lesson to earn ${reward} XP`}
        >
          <Zap strokeWidth={2} />+{reward}
          <span className="plesson-reward-label">XP</span>
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
                <span>
                  Key insight
                  <span className="plesson-insight-pattern">{p.pattern}</span>
                </span>
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
                sub="Spot these the next time you read a problem"
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
        {step === 'code' && <CodeStep p={p} records={records} onRecord={record} onNext={next} />}
        {DRILL_STEPS.includes(step) && <h1 className="sr-only">{`${p.title}: ${STEP_NAME[step]}`}</h1>}
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
                <div className="plesson-cost-item">
                  <div className="plesson-cost-label">
                    <Clock /> Time
                  </div>
                  <div className="plesson-cost-value">{p.time}</div>
                </div>
                <div className="plesson-cost-item">
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
        {step === 'gaps' && (
          <GapsStep
            p={p}
            onDone={(first) => {
              setFinal(first);
              next();
            }}
          />
        )}
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
          <span className="plesson-plan-meter" aria-hidden="true">
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

// ── Write the code: look, cover, write, check ───────────────────────────────

/** How one part went. The first check decides `right`; later checks are practice. */
interface PartRecord {
  /** Checked at least once. */
  checked: boolean;
  /** Written right on the first check, without peeking before it. */
  right: boolean;
  /** Went back to the code from the editor ("Peek"). */
  peeked: boolean;
}
const NO_RECORD: PartRecord = { checked: false, right: false, peeked: false };

/** Markdown-free text, for comments in the file and screen-reader descriptions. */
const plain = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1');

/** Every line is there and in order; only the indentation of some is off. */
const onlyIndentWrong = (g: Grade) => !g.perfect && g.wrongIndent > 0 && g.correct + g.wrongIndent === g.total && g.extra === 0;

/** Scroll `el` into view once the action bar has settled (it grows with feedback and sets the scroll padding). */
function reveal(el: Element | null | undefined, block: ScrollLogicalPosition) {
  if (!el) return () => {};
  let raf = requestAnimationFrame(() => {
    raf = requestAnimationFrame(() => el.scrollIntoView({ block, behavior: reducedMotion() ? 'auto' : 'smooth' }));
  });
  return () => cancelAnimationFrame(raf);
}

/** Visible (not `display: none`, as the in-file cue is on wide screens). */
const shown = (el: HTMLElement | null | undefined): el is HTMLElement => !!el && el.getClientRects().length > 0;

const EDITOR_HELP = 'Tab inserts four spaces. To leave the editor, press Escape and then Tab. Press Control or Command plus Enter to check.';

/**
 * The solution, one part at a time. Look: the part's explanation and its code, highlighted under
 * the parts before it (later parts stay hidden). Write: the part's code is covered; the
 * explanation is the cue and the editor sits under the earlier code, at the part's indentation.
 * Check: line by line. A miss offers "Fix and check again"; Continue is always there. The class /
 * def header is given. Parts already written can be looked at again with Back.
 */
function CodeStep({
  p,
  records,
  onRecord,
  onNext,
}: {
  p: Problem;
  records: PartRecord[];
  onRecord: (k: number, patch: Partial<PartRecord>) => void;
  onNext: () => void;
}) {
  const parsed = parseSolution(p.solution);
  const parts = useMemo(() => bodyParts(parsed), [parsed]);
  const [k, setK] = useState(0); // the part on screen
  const [furthest, setFurthest] = useState(0); // the part being written; earlier ones are done
  const [phase, setPhase] = useState<'look' | 'write'>('look');
  const [drafts, setDrafts] = useState<string[]>(() => parts.map(() => ''));
  const [grade, setGrade] = useState<Grade | null>(null);
  const [tries, setTries] = useState(0); // checks of the current part
  const rootRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const part = parts[k];
  const rec = records[k] ?? NO_RECORD;
  const reviewing = k < furthest;
  const writing = phase === 'write';
  const status: CheckStatus = writing && grade ? (grade.perfect ? 'correct' : 'wrong') : 'idle';

  // Keep the part in view as it moves: the cue above it on phones (the card at the top is out of
  // sight by then), the part's own lines on wide screens; after a check, the first line to fix
  // (above the action bar, which has grown with the feedback) or the result.
  const view = `${k}:${phase}:${grade ? tries : 0}`;
  const lastView = useRef(view);
  useEffect(() => {
    if (lastView.current === view) return;
    lastView.current = view;
    const root = rootRef.current;
    if (!root) return;
    if (grade) {
      const miss = root.querySelector('.typer-diff .diff:not(.ok)');
      return reveal(miss ?? root.querySelector('.typer-diff'), miss ? 'center' : 'nearest');
    }
    const cue = root.querySelector<HTMLElement>('.plesson-cue');
    if (shown(cue)) return reveal(cue, 'start');
    return reveal(root.querySelector(writing ? '.typer-input' : '.plesson-part'), 'nearest');
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!part) {
    // A solution that is all header (none today): show it and move on.
    return (
      <>
        <StepHeader step="code" title="Read the solution" />
        <TyperWindow filename="solution.py" meta={plural(parsed.lines.length, 'line')}>
          <CodePane>
            <GivenLines lines={parsed.lines.map((l) => l.text)} />
          </CodePane>
        </TyperWindow>
        <ActionBar status="idle" onContinue={onNext} />
      </>
    );
  }

  const total = parts.length;
  const last = k === total - 1;
  const n = k + 1;
  const before = parsed.lines.filter((l) => l.chunk < part.ci).map((l) => l.text);
  const lines = part.chunk.lines;
  const { lead, body } = part;
  const count = codeLines(body).length;
  // Typing starts at the least indented line to write (a part may end with a dedent), and grading
  // is anchored there: typed at the caret, a line sits where it belongs under the code above. Not
  // capped: the given lines above a deep part are wider still, and the pane scrolls.
  const indent = baseIndent(body);
  const cueIndent = baseIndent(lines);
  const text = drafts[k] ?? '';
  const setText = (v: string) => setDrafts((d) => d.map((x, j) => (j === k ? v : x)));
  const keyCount = part.chunk.keyLines.length;
  const checkedCount = records.filter((r) => r.checked).length;
  const rightCount = records.filter((r) => r.right).length;

  const focusEditor = () => {
    const ta = taRef.current;
    if (!ta) return;
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(ta.value.length, ta.value.length);
  };
  // The primary button, when the control that had focus goes away (Peek, Back, Next part).
  const focusPrimary = () => rootRef.current?.parentElement?.querySelector<HTMLButtonElement>('.actionbar .buttons > .btn:last-child')?.focus();

  // Cover the code and write it. The editor mounts inside the click (flushSync), so a phone opens
  // its keyboard.
  const write = () => {
    flushSync(() => {
      setPhase('write');
      setGrade(null);
    });
    focusEditor();
  };
  const peek = () => {
    onRecord(k, { peeked: true });
    flushSync(() => {
      setPhase('look');
      setGrade(null);
    });
    focusPrimary();
  };
  const check = () => {
    if (!writing || grade || !text.trim()) return;
    // The editor sits under the parts before it: typed column 0 is the editor's column.
    const g = gradeCode(text, body, { anchor: indent });
    setGrade(g);
    setTries((t) => t + 1);
    if (!rec.checked) onRecord(k, { checked: true, right: g.perfect && !rec.peeked });
    sfx(g.perfect ? 'correct' : 'wrong');
  };
  // "Fix and check again": back to the editor with the text kept.
  const fix = () => {
    flushSync(() => setGrade(null));
    focusEditor();
  };
  const go = (to: number) => {
    flushSync(() => {
      setK(to);
      setPhase('look');
      setGrade(null);
    });
    focusPrimary();
  };
  const advance = () => {
    setGrade(null);
    setTries(0);
    if (last) {
      onNext();
      return;
    }
    setFurthest((f) => Math.max(f, k + 1));
    setK(k + 1);
    setPhase('look');
  };

  // The part's explanation, written as a comment in the file above it. Phones and tablets only:
  // on wide screens the card beside the code is the cue. The card is what screen readers read.
  const cue = (
    <div className="typer-line plesson-cue" aria-hidden="true">
      <span className="typer-ln" />
      <span className="plesson-cue-text" style={{ ['--indent' as string]: `${cueIndent}ch` }}>
        <span className="plesson-cue-hash"># </span>
        {plain(part.chunk.explain)}
      </span>
    </div>
  );

  const firstNew = before.length + 1; // the part's first line
  // While writing: the cue, then the part's signature lines (given), then the editor.
  const above = (
    <>
      {cue}
      <GivenLines lines={lead} start={firstNew} />
    </>
  );
  const windowProps = { filename: 'solution.py', meta: `Part ${n} of ${total}`, className: 'plesson-codewin' };

  let fbTitle: string | undefined;
  let fbBody = '';
  if (grade) {
    const indentOnly = onlyIndentWrong(grade);
    if (tries === 1 && grade.perfect && rec.right) fbBody = 'Written right on the first try.';
    else if (tries === 1 && grade.perfect) {
      fbTitle = 'Right, after a peek';
      fbBody = 'Only parts you write without peeking count toward your tally.';
    } else if (grade.perfect) {
      fbTitle = 'All lines right now';
      fbBody = 'Your tally keeps the first try. The fix still counts as practice.';
    } else {
      fbTitle = indentOnly ? 'Right code, wrong indentation' : undefined;
      fbBody =
        tries === 1 ? 'Your first try sets the tally. Fix the marked lines, or move on.' : 'Still a few lines off. Fix them, or move on.';
    }
  }

  return (
    <>
      <StepHeader
        step="code"
        title="Write the solution one part at a time"
        sub="Read each part, then write it from memory. The code you already wrote stays above it."
      />
      <div ref={rootRef} className="plesson-code">
        <aside className="plesson-explain" aria-label={`Part ${n} of ${total}`}>
          {/* Announced when the part changes, not when the code is covered or checked */}
          <div aria-live="polite">
            <div className="plesson-explain-head">
              <span className="plesson-explain-count">
                Part <span className="tabular">{n}</span> of <span className="tabular">{total}</span>
              </span>
              {keyCount > 0 && (
                <Badge tone="warning">
                  <Star /> {keyCount > 1 ? 'Key lines' : 'Key line'}
                </Badge>
              )}
            </div>
            <div className="plesson-segs" aria-hidden="true">
              {parts.map((_, j) => {
                const r = records[j] ?? NO_RECORD;
                const cls = j === k ? 'on' : r.checked ? (r.right ? 'right' : 'missed') : '';
                return <span key={j} className={cls} />;
              })}
            </div>
            <p className="plesson-explain-text" key={k}>
              {inline(part.chunk.explain)}
            </p>
          </div>
          {!writing && keyCount > 0 && (
            <div className="plesson-keynote">
              <Star />
              <div>
                <strong>{keyCount > 1 ? 'These lines carry the idea.' : 'This line carries the idea.'}</strong>{' '}
                {keyCount > 1 ? 'They have a gold dot, and the final check asks for them.' : 'It has a gold dot, and the final check asks for it.'}
              </div>
            </div>
          )}
          {writing && !grade && <p className="plesson-explain-cue">Write this part from memory. The code above it stays visible.</p>}
          {checkedCount > 0 && (
            <div className="plesson-tally">
              <span>Right on the first try</span>
              <span className="plesson-tally-value tabular">
                <strong>{rightCount}</strong> of {plural(checkedCount, 'part')}
              </span>
            </div>
          )}
        </aside>

        {writing ? (
          <CodeTyper
            {...windowProps}
            value={text}
            onChange={setText}
            grade={grade}
            label={`Code for part ${n} of ${total}`}
            help={`Cue: ${plain(part.chunk.explain)} ${EDITOR_HELP}`}
            given={before}
            firstLine={firstNew + lead.length}
            indent={indent}
            minRows={Math.max(2, count + 1)}
            placeholder={[`Write the ${plural(count, 'line')} of this part`, `Write ${plural(count, 'line')}`]}
            note={`${plural(count, 'line')} to write`}
            textareaRef={taRef}
          >
            {above}
          </CodeTyper>
        ) : (
          <TyperWindow {...windowProps} footer={<TyperFooter note={`${plural(count, 'line')} to write`} keys={reviewing ? false : 'Enter to write it'} />}>
            <CodePane>
              <GivenLines lines={before} />
              {cue}
              <div className="plesson-part">
                {lines.map((l, j) => {
                  const key = part.chunk.keyLines.includes(j);
                  return (
                    <CodeLine key={j} n={firstNew + j} className={`plesson-line ${key ? 'is-key' : ''}`}>
                      {key && <span className="sr-only">Key line: </span>}
                      {l === '' ? ' ' : highlightLine(l)}
                    </CodeLine>
                  );
                })}
              </div>
            </CodePane>
          </TyperWindow>
        )}
      </div>

      <ActionBar
        step={`${k}:${phase}:${tries}`}
        status={status}
        onCheck={writing ? check : undefined}
        canCheck={text.trim().length > 0}
        onContinue={writing ? advance : reviewing ? () => go(k + 1) : write}
        continueLabel={writing ? (last ? 'Continue' : 'Next part') : reviewing ? 'Next part' : 'Write it'}
        primaryIcon={!writing && !reviewing ? <PencilLine aria-hidden="true" /> : undefined}
        title={fbTitle}
        feedback={
          grade && (
            <div className="plesson-fb">
              <span className="plesson-fb-label">
                Part {n} of {total}
              </span>
              <span>{fbBody}</span>
            </div>
          )
        }
        secondary={
          writing ? (
            <button
              type="button"
              className="btn btn-quiet btn-sm plesson-peek-btn"
              onClick={peek}
              title="Show this part's code again. A part you peek at does not count as written right."
            >
              <Eye aria-hidden="true" />
              Peek
            </button>
          ) : k > 0 ? (
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => go(k - 1)}>
              Back
            </button>
          ) : undefined
        }
        checkedSecondary={status === 'wrong' ? <CheckedAction onClick={fix} /> : undefined}
      />
    </>
  );
}

// ── Final check: fill the gaps ──────────────────────────────────────────────

/**
 * Fewest gaps so every key line is one: the key lines, and any other line with the same code
 * (the gap picker blanks those together, so one copy never stays on screen as the answer).
 */
function keyGapCount(src: GapSource): number {
  const keys = new Set(src.keyLines.map((i) => lineKey(src.lines[i])).filter(Boolean));
  const header = new Set(src.header);
  return Math.max(1, src.lines.filter((l, i) => !header.has(i) && keys.has(lineKey(l))).length);
}

/**
 * The whole solution with about 30% of its body lines blank, key lines always among them. The
 * first check sets the score; a miss shows the answers inline and offers "Fix and check again";
 * Continue is always there.
 */
function GapsStep({ p, onDone }: { p: Problem; onDone: (first: GapsGrade) => void }) {
  const src = useMemo(() => gapSource(p.solution), [p]);
  const ex = useGaps(src.lines, { keyLines: src.keyLines, exclude: src.header, min: keyGapCount(src) });
  const [first, setFirst] = useState<GapsGrade | null>(null);
  const [checks, setChecks] = useState(0);
  // Phones wait for a tap, so the keyboard does not cover the code on arrival.
  const [autoFocus] = useState(isFinePointer);
  const rootRef = useRef<HTMLDivElement>(null);
  const gapsRef = useRef<CodeGapsHandle>(null);

  const g = ex.grade;
  const status: CheckStatus = ex.revealed ? (g.perfect ? 'correct' : 'wrong') : 'idle';

  // Once checked, bring the first gap to fix (or the code) into view, above the action bar.
  useEffect(() => {
    if (!ex.revealed) return;
    const pane = rootRef.current?.querySelector('.gaps');
    return reveal(pane?.querySelector('.diff.del') ?? pane, g.perfect ? 'nearest' : 'center');
  }, [ex.revealed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Enter on the last gap and Ctrl/⌘ + Enter both land here.
  const check = () => {
    if (ex.revealed) return;
    const r = ex.check();
    setChecks((c) => c + 1);
    if (!first) setFirst(r);
    sfx(r.perfect ? 'correct' : 'wrong');
  };
  // "Fix and check again": the gaps come back in this click (flushSync), so the first gap to fix
  // takes focus inside the tap and a phone opens its keyboard.
  const retry = () => {
    const j = ex.gaps.findIndex((_, m) => !g.results[m]?.ok);
    flushSync(ex.retry);
    gapsRef.current?.focus(j >= 0 ? j : undefined);
  };

  const score = first ? `${first.correct} of ${first.total}` : '';
  let fbTitle: string | undefined;
  let fbBody = '';
  if (ex.revealed && checks === 1) {
    fbBody = g.perfect
      ? `All ${plural(g.total, 'gap')} right on the first check.`
      : 'Your first check sets the score. Fix the marked lines to practice, or finish the lesson.';
  } else if (ex.revealed) {
    fbTitle = g.perfect ? 'All gaps right now' : undefined;
    fbBody = g.perfect ? `Your score stays at ${score} from the first check.` : `${gapsSummary(g)}. Your score stays at ${score} from the first check.`;
  }

  return (
    <>
      <StepHeader
        step="gaps"
        title="Fill the gaps"
        sub="The whole solution, with the key lines and a few others missing. Type each missing line from memory."
      />
      <div ref={rootRef}>
        <GapsWindow
          lines={src.lines}
          gaps={ex.gaps}
          values={ex.values}
          onChange={(v) => ex.setValues(v)}
          revealed={ex.revealed}
          locked={ex.locked}
          onSubmit={check}
          autoFocus={autoFocus}
          ref={gapsRef}
          filename="solution.py"
          meta={plural(ex.gaps.length, 'gap')}
          className="plesson-gapswin"
        />
      </div>
      <ActionBar
        status={status}
        step={checks}
        onCheck={check}
        // Nothing typed yet: the button says what a check would do (nobody gets stuck on a blank).
        checkLabel={ex.filled === 0 ? 'Show answers' : 'Check'}
        onContinue={() => onDone(first ?? g)}
        continueLabel="Finish lesson"
        title={fbTitle}
        feedback={
          ex.revealed && (
            <div className="plesson-fb">
              <span className="plesson-fb-label">{checks === 1 ? 'First check' : `Check ${checks}`}</span>
              <span>{fbBody}</span>
            </div>
          )
        }
        checkedSecondary={status === 'wrong' ? <CheckedAction onClick={retry} /> : undefined}
      />
    </>
  );
}

// ── Completion ──────────────────────────────────────────────────────────────

function Complete({
  p,
  xp,
  relearn,
  records,
  final,
}: {
  p: Problem;
  xp: number;
  relearn: boolean;
  records: PartRecord[];
  final: GapsGrade | null;
}) {
  const progress = useProgress();
  const card = progress.problems[p.id]?.srs;
  const siblings = problemsFor(p.category);
  const nextInUnit = siblings.find((q) => !progress.problems[q.id]?.learnedAt && q.id !== p.id);
  const link = practiceLink(p);
  const due = card ? friendlyDue(card.due) : null;
  const right = records.filter((r) => r.right).length;
  const of = (a: number, b: number) => (
    <>
      {a}
      <span className="plesson-done-of">/{b}</span>
    </>
  );
  return (
    <SessionShell progress={1} title={p.title}>
      <div className="plesson-done">
        <Completion
          icon={relearn ? RefreshCw : BadgeCheck}
          tone={relearn ? 'brand' : 'success'}
          title={relearn ? 'Refreshed' : 'Problem learned'}
          subtitle={
            <>
              <strong>{p.title}</strong> {relearn ? 'is fresh in your mind again' : 'is now in your review deck'}
              {due ? (due === 'due now' ? ', and a review is due now.' : `, next review ${due}.`) : '.'}
            </>
          }
          stats={[
            { label: 'Parts right', value: of(right, records.length) },
            { label: 'Final check', value: final ? of(final.correct, final.total) : '—' },
            { label: 'XP earned', value: `+${xp}` },
          ]}
        >
          <Link to={`/p/${p.id}/rebuild`} className="btn btn-primary btn-lg btn-block">
            <Keyboard />
            Code from memory
          </Link>
          <p className="plesson-done-tip">Write it again now, while it is fresh, to make it stick.</p>
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
