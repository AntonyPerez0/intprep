import '../styles/pages/onboarding.css';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarClock, Check, CodeXml, Flame, MapPin, Repeat2, Rocket, Sprout, Target, UserRound, type LucideIcon } from 'lucide-react';
import { CATEGORIES, FOUNDATIONS, PROBLEMS } from '../content/index';
import { IconTile } from '../components/icons';
import { CODE_PRACTICE_ICON } from '../components/InputSwitch';
import { Pip, type PipMood } from '../components/Mascot';
import { Logo, Ring } from '../components/ui';
import { addDays, today } from '../lib/date';
import { DAILY_GOALS, GEMS } from '../lib/game';
import { buildPlan, planDate } from '../lib/plan';
import { CODE_PRACTICE } from '../lib/input';
import { finishOnboarding, useProgress, type Experience, type Progress } from '../lib/store';
import { sfx } from '../lib/sound';

const LEVELS: { id: Experience; icon: LucideIcon; title: string; blurb: string }[] = [
  { id: 'none', icon: Sprout, title: "I'm brand new to coding", blurb: 'Start with Python basics. You type real code from the first lesson.' },
  { id: 'some', icon: CodeXml, title: 'I know some code', blurb: 'Jump into patterns; beginner lessons are there if you need them.' },
  { id: 'comfortable', icon: Rocket, title: "I'm comfortable coding", blurb: 'Go straight to the patterns and problems.' },
];

const STEPS = ['Welcome', 'Experience', 'Daily goal', 'Your plan'];
/** Pip sits on top of the card and reacts to each step. */
const STEP_MOOD: PipMood[] = ['happy', 'think', 'happy', 'cheer'];
const MAX_GOAL = DAILY_GOALS[DAILY_GOALS.length - 1].xp;
const DEFAULT_GOAL = 50;

/** What the plan will ask for with these answers: the pace, and where it leads. */
function paceLine(p: Progress, exp: Experience, goal: number, interviewDate: string | null): { value: string; detail: string } {
  const plan = buildPlan({ ...p, settings: { ...p.settings, experience: exp, dailyGoal: goal, interviewDate } });
  const perDay = `${plan.perDay} new problem${plan.perDay === 1 ? '' : 's'} a day`;
  const lessons = plan.lessonsLeft ? `After the beginner lessons (about ${Math.max(1, Math.round(plan.lessonMinutes / 60))} hours), ` : '';
  if (plan.interview) {
    const days = `${plan.interview.daysLeft} day${plan.interview.daysLeft === 1 ? '' : 's'} away`;
    // The date asks for more than the chosen goal has room for: say so here, where it can be changed.
    const tight = plan.perDay > plan.goalPerDay ? ` Your daily goal has room for about ${plan.goalPerDay} a day, so pick a bigger goal to keep this pace.` : '';
    return plan.feasible
      ? {
          value: `Interview ${days}: ${perDay}`,
          detail: `${lessons}${lessons ? 'that' : 'That'} pace covers the Easy and Medium problems of every pattern and keeps the last ${plan.interview.reviewDays} days for review and mock interviews.${tight}`,
        }
      : {
          value: `Interview ${days}: ${perDay}`,
          detail: `${lessons}${lessons ? 'there' : 'There'} is not time for every problem, so the path takes the patterns in order of usefulness: about ${plan.coreReachable} of the ${plan.coreLeft} core problems fit.${tight}`,
        };
  }
  return {
    value: `About ${perDay}`,
    detail: `${lessons}${lessons ? 'that' : 'That'} pace learns the Easy and Medium problems of every pattern by ${plan.coreDone ? planDate(plan.coreDone) : 'then'}${plan.allDone ? `, and the Hard ones by ${planDate(plan.allDone)}` : ''}. Set an interview date and the plan works back from it.`,
  };
}

/** Where each experience level begins (navigation itself happens in `done`). */
function startingPoint(exp: Experience): string {
  const first = FOUNDATIONS[0];
  if (exp === 'none')
    return `Your first lesson is “${first.title}”, then ${FOUNDATIONS.length - 1} more beginner lessons before the first pattern. You write real Python in every one.`;
  if (exp === 'some')
    return `Your path starts with ${CATEGORIES[0].name}: learn the pattern, fill in its template, then solve the problems. Beginner lessons are there if you need them.`;
  return `Straight to the ${CATEGORIES.length} patterns and ${PROBLEMS.length} problems, starting with ${CATEGORIES[0].name}: learn the pattern, fill in its template, then solve the problems.`;
}

export function OnboardingPage() {
  const nav = useNavigate();
  const progress = useProgress();
  const { gems, streak, settings } = progress;
  const practice = CODE_PRACTICE.find((c) => c.id === settings.typingMode) ?? CODE_PRACTICE[0];
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [exp, setExp] = useState<Experience>('some');
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [interview, setInterview] = useState('');
  const minDate = addDays(today(), 1);
  const interviewDate = interview && interview >= minDate ? interview : null;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Move focus to the new step's heading so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    window.scrollTo(0, 0);
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const done = () => {
    finishOnboarding({ name: name.trim(), experience: exp, dailyGoal: goal, interviewDate });
    sfx('complete');
    nav(exp === 'none' ? '/foundations/how-to-learn' : '/learn');
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) setStep(step + 1);
    else done();
  };

  const level = LEVELS.find((l) => l.id === exp) ?? LEVELS[1];
  const goalInfo = DAILY_GOALS.find((g) => g.xp === goal) ?? DAILY_GOALS[1];
  const firstName = name.trim();
  const last = step === STEPS.length - 1;

  return (
    <div className="ob">
      <header className="ob-header">
        <Logo to="/welcome" />
        <span className="ob-header-step" aria-hidden="true">
          Step {step + 1} of {STEPS.length}
        </span>
      </header>

      <main className="ob-main">
        <div className="ob-card">
          <Pip key={step} size={76} mood={STEP_MOOD[step]} className="ob-pip" />
          <ol className="ob-steps" aria-label="Setup progress">
            {STEPS.map((s, i) => (
              <li key={s} className={i < step ? 'done' : i === step ? 'current' : ''} aria-current={i === step ? 'step' : undefined}>
                <span className="ob-steps-bar" />
                <span className="ob-steps-label">
                  {s}
                  <span className="sr-only">{i < step ? ' (completed)' : i === step ? ' (current step)' : ''}</span>
                </span>
              </li>
            ))}
          </ol>

          <form className="ob-form" onSubmit={onSubmit} noValidate>
            <div className="ob-body" key={step}>
              {step === 0 && (
                <>
                  <h1 ref={headingRef} tabIndex={-1} className="ob-title">
                    Let's set up your study plan
                  </h1>
                  <p className="ob-sub">Three quick questions and you're in. It takes less than a minute, and you can change everything later.</p>
                  <div className="ob-field">
                    <label className="label" htmlFor="ob-name">
                      What should we call you? <span className="ob-optional">Optional</span>
                    </label>
                    <div className="input-group">
                      <UserRound aria-hidden="true" />
                      <input
                        id="ob-name"
                        className="input ob-input"
                        placeholder="First name"
                        autoComplete="given-name"
                        value={name}
                        maxLength={30}
                        onChange={(e) => setName(e.target.value)}
                        aria-describedby="ob-name-help"
                      />
                    </div>
                    <p className="help" id="ob-name-help">
                      Shown on your dashboard. Your progress stays on this device.
                    </p>
                  </div>
                  <ul className="ob-perks">
                    <li>
                      <Check aria-hidden="true" />
                      {PROBLEMS.length} problems across {CATEGORIES.length} patterns, each built part by part: pick the code first, type it once you know it
                    </li>
                    <li>
                      <Check aria-hidden="true" />
                      Short daily reviews: spot the pattern, then recall the code from memory
                    </li>
                    <li>
                      <Check aria-hidden="true" />
                      Streaks, XP and a daily goal to keep you coming back
                    </li>
                  </ul>
                </>
              )}

              {step === 1 && (
                <fieldset className="ob-fieldset">
                  <legend className="sr-only">How much coding do you know?</legend>
                  <h1 ref={headingRef} tabIndex={-1} className="ob-title">
                    How much coding do you know?
                  </h1>
                  <p className="ob-sub">We'll pick your starting point. You can jump to any unit later.</p>
                  <div className="ob-options">
                    {LEVELS.map((l) => {
                      const on = exp === l.id;
                      return (
                        <label key={l.id} className={`ob-option ${on ? 'on' : ''}`}>
                          <input type="radio" name="experience" value={l.id} checked={on} onChange={() => setExp(l.id)} className="ob-radio-input" />
                          <IconTile icon={l.icon} solid={on} />
                          <span className="ob-option-text">
                            <span className="ob-option-title">{l.title}</span>
                            <span className="ob-option-desc">{l.blurb}</span>
                          </span>
                          <span className="ob-radio" aria-hidden="true" />
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {step === 2 && (
                <fieldset className="ob-fieldset">
                  <legend className="sr-only">Pick a daily goal</legend>
                  <h1 ref={headingRef} tabIndex={-1} className="ob-title">
                    Pick a daily goal
                  </h1>
                  <p className="ob-sub">
                    Practice on any day to keep your streak alive. Reach your goal to earn {GEMS.dailyGoal} gems. Small and steady wins.
                  </p>
                  <div className="ob-options ob-goals">
                    {DAILY_GOALS.map((g) => {
                      const on = goal === g.xp;
                      return (
                        <label key={g.xp} className={`ob-option ob-goal ${on ? 'on' : ''}`}>
                          <input type="radio" name="goal" value={g.xp} checked={on} onChange={() => setGoal(g.xp)} className="ob-radio-input" />
                          <Ring
                            value={g.xp / MAX_GOAL}
                            size={40}
                            stroke={5}
                            color="var(--ob-ring)"
                            track="var(--ob-ring-track)"
                          />
                          <span className="ob-option-text">
                            <span className="ob-option-title">{g.label}</span>
                            <span className="ob-option-desc">{g.blurb}</span>
                          </span>
                          <span className="ob-goal-xp">{g.xp} XP</span>
                          <span className="ob-radio" aria-hidden="true" />
                        </label>
                      );
                    })}
                  </div>
                  <label className="ob-date">
                    <span className="ob-date-label">
                      Do you have an interview date? <span className="ob-optional">Optional</span>
                    </span>
                    <span className="ob-date-help">With a date, your plan works back from it: how many new problems a day, and a last stretch for review.</span>
                    <input type="date" className="input" value={interview} min={minDate} onChange={(e) => setInterview(e.target.value)} />
                  </label>
                </fieldset>
              )}

              {step === 3 && (
                <>
                  <h1 ref={headingRef} tabIndex={-1} className="ob-title">
                    {firstName ? `${firstName}, your plan is ready` : 'Your plan is ready'}
                  </h1>
                  <p className="ob-sub">Here's how IntPrep will work for you. You can change any of it later in your profile.</p>
                  <dl className="ob-plan">
                    <PlanRow icon={MapPin} label="Starting point" value={level.title} detail={startingPoint(exp)} onChange={() => setStep(1)} changeLabel="Edit starting point" />
                    <PlanRow
                      icon={Target}
                      label="Daily goal"
                      value={`${goalInfo.label} · ${goalInfo.xp} XP a day`}
                      detail={`${goalInfo.blurb}. Each day you reach it earns ${GEMS.dailyGoal} gems.`}
                      onChange={() => setStep(2)}
                      changeLabel="Edit daily goal"
                    />
                    <PlanRow icon={CalendarClock} label="Pace" {...paceLine(progress, exp, goal, interviewDate)} onChange={() => setStep(2)} changeLabel="Edit interview date" />
                    <PlanRow
                      icon={Repeat2}
                      label="Daily review"
                      value="Spaced repetition"
                      detail="Problems come back just before you would forget them: spot the pattern, then recall the code."
                    />
                    {/* The setting as Profile shows it: its icon, label and line. */}
                    <PlanRow icon={CODE_PRACTICE_ICON[practice.id]} label="Code practice" value={practice.label} detail={practice.sub} />
                    <PlanRow
                      icon={Flame}
                      label="Streak"
                      value="Practice on any day to keep it"
                      detail={
                        streak.freezes > 0
                          ? `You start with ${streak.freezes === 1 ? 'a streak freeze' : `${streak.freezes} streak freezes`} and ${gems} gems to buy more.`
                          : `You start with ${gems} gems. Spend them on streak freezes.`
                      }
                      accent="streak"
                    />
                  </dl>
                </>
              )}
            </div>

            <div className="ob-actions">
              {step > 0 ? (
                <button type="button" className="btn btn-quiet btn-lg ob-back" onClick={() => setStep(step - 1)}>
                  <ArrowLeft aria-hidden="true" />
                  Back
                </button>
              ) : null}
              <button type="submit" className="btn btn-primary btn-lg ob-next">
                {last ? 'Start learning' : 'Continue'}
                <ArrowRight aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
        <p className="ob-note">IntPrep is free and stores your progress in this browser. No account needed.</p>
      </main>
    </div>
  );
}

function PlanRow({
  icon,
  label,
  value,
  detail,
  onChange,
  changeLabel,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  onChange?: () => void;
  changeLabel?: string;
  accent?: 'streak';
}) {
  return (
    <div className="ob-plan-row">
      <IconTile icon={icon} size="sm" color={accent === 'streak' ? 'var(--streak)' : undefined} />
      <div className="ob-plan-text">
        <dt>{label}</dt>
        <dd>
          <span className="ob-plan-value">{value}</span>
          <span className="ob-plan-detail">{detail}</span>
        </dd>
      </div>
      {onChange && (
        <button type="button" className="btn btn-quiet btn-sm ob-plan-change" onClick={onChange} aria-label={changeLabel}>
          Edit
        </button>
      )}
    </div>
  );
}
