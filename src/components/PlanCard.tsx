// "Your plan" on the dashboard: what today asks for (reviews, then new problems), the pace, and
// where it leads. Built by lib/plan.ts from the daily goal and, when set, the interview date.

import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { buildPlan, planDate, type Plan } from '../lib/plan';
import type { Progress } from '../lib/store';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function message(plan: Plan, firstPass: boolean): string {
  // What the first pass is called: the core (Easy and Medium), or everything in unit-by-unit order.
  const core = firstPass ? 'the core' : `all ${plan.total} problems`;
  const perDay = `${plan.perDay} new ${plan.perDay === 1 ? 'problem' : 'problems'} a day`;
  switch (plan.mode) {
    case 'done':
      return 'Every problem is learned. Daily reviews and a mock interview now and then keep them ready.';
    case 'final-review':
      return plan.interview
        ? `${plural(plan.interview.daysLeft, 'day')} to go and nothing new left to learn: do each day’s reviews and a mock interview.`
        : 'Nothing new left to learn: do each day’s reviews and a mock interview.';
    case 'reviews-only':
      return `${plan.due} reviews are waiting, so nothing new today. A problem you learn and never review is a problem you learn twice.`;
    case 'reviews-first':
      return `Do the ${plan.due} reviews first, then today’s new problems.`;
    case 'foundations': {
      const hours = Math.max(1, Math.round(plan.lessonMinutes / 60));
      const days = plan.lessonDays === 1 ? 'a day' : `${plan.lessonDays} days`;
      const then = plan.interview
        ? plan.feasible
          ? `then ${perDay} covers ${core} before your interview.`
          : `then ${perDay} covers about ${plan.coreReachable} of the ${plan.coreLeft} ${firstPass ? 'core ' : ''}problems before your interview.`
        : `then ${perDay}${plan.coreDone ? ` finishes ${core} by ${planDate(plan.coreDone)}` : ''}.`;
      return `First the ${plural(plan.lessonsLeft, 'beginner lesson')}: about ${plural(hours, 'hour')}, or ${days} at your daily goal; ${then}`;
    }
    default:
      if (plan.interview) {
        if (plan.coreLeft === 0)
          return plan.feasible
            ? `The core of every pattern is learned. ${perDay[0].toUpperCase()}${perDay.slice(1)} takes you through the ${plan.laterLeft === 1 ? 'last Hard problem' : `${plan.laterLeft} Hard problems`} before your interview.`
            : `The core of every pattern is learned. At ${perDay}, about ${plan.coreReachable} of the ${plan.laterLeft} Hard problems fit before your interview.`;
        return plan.feasible
          ? `${perDay[0].toUpperCase()}${perDay.slice(1)} finishes ${core} by ${plan.coreDone ? planDate(plan.coreDone) : 'your date'} and keeps the last ${plural(plan.interview.reviewDays, 'day')} for review and mock interviews.`
          : `There is not time for every ${firstPass ? 'core ' : ''}problem. At ${perDay} about ${plan.coreReachable} of ${plan.coreLeft} fit, and the path takes the most useful patterns first.`;
      }
      if (plan.coreLeft === 0) return `The core of every pattern is learned. At ${perDay} the Hard problems are done by ${plan.allDone ? planDate(plan.allDone) : 'then'}.`;
      return `At ${perDay} you finish ${core} by ${plan.coreDone ? planDate(plan.coreDone) : 'then'}${plan.allDone && plan.laterLeft ? ` and all ${plan.total} by ${planDate(plan.allDone)}` : ''}.`;
  }
}

/** The daily goal is too small for the pace the interview date needs. */
function goalNote(plan: Plan): string | null {
  if (!plan.interview || plan.perDay <= plan.goalPerDay || plan.mode === 'done' || plan.mode === 'final-review') return null;
  return `Your daily goal has room for about ${plan.goalPerDay} new ${plan.goalPerDay === 1 ? 'problem' : 'problems'} a day. Raise it to keep this pace, or the plan will cover less.`;
}

export function PlanCard({ p }: { p: Progress }) {
  const plan = buildPlan(p);
  const note = goalNote(plan);
  const firstPass = p.settings.pathOrder !== 'unit';
  const tiles: { label: string; value: string; sub?: string; tone?: 'due' | 'done' }[] = [
    { label: 'Reviews due', value: String(plan.due), sub: plan.due ? 'Do these first' : 'All caught up', tone: plan.due ? 'due' : 'done' },
    {
      label: 'New today',
      value: plan.newTarget ? `${plan.newToday}/${plan.newTarget}` : String(plan.newToday),
      sub: plan.newTarget ? (plan.newToday >= plan.newTarget ? 'Done for today' : `${plan.newTarget - plan.newToday} to go`) : plan.mode === 'foundations' ? 'After the lessons' : 'Reviews only',
      tone: plan.newTarget && plan.newToday >= plan.newTarget ? 'done' : undefined,
    },
    firstPass
      ? { label: 'Core problems left', value: String(plan.coreLeft), sub: plan.laterLeft ? `${plan.laterLeft} Hard after them` : 'Easy and Medium' }
      : { label: 'Problems left', value: String(plan.coreLeft) },
  ];
  return (
    <section className="card home-card home-plan" aria-labelledby="home-plan-title">
      <div className="home-card-head">
        <h2 id="home-plan-title" className="card-title">
          Your plan
        </h2>
        {plan.interview ? (
          <span className="home-card-aside">
            Interview {plan.interview.daysLeft === 1 ? 'tomorrow' : `in ${plan.interview.daysLeft} days`} · {planDate(plan.interview.date)}
          </span>
        ) : (
          <Link to="/profile#plan" className="home-plan-set">
            <CalendarClock aria-hidden="true" />
            Set an interview date
          </Link>
        )}
      </div>
      <dl className="home-plan-tiles">
        {tiles.map((t) => (
          <div key={t.label} className={`home-plan-tile ${t.tone ? `is-${t.tone}` : ''}`}>
            <dt>{t.label}</dt>
            <dd>
              <span className="home-plan-value tabular">{t.value}</span>
              {t.sub && <span className="home-plan-sub">{t.sub}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <p className="home-plan-note">{message(plan, firstPass)}</p>
      {note && (
        <p className="home-plan-note home-plan-warn">
          {note} <Link to="/profile">Change the daily goal</Link>
        </p>
      )}
    </section>
  );
}
