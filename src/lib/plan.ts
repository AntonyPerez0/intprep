// The learner's plan: how many new problems a day, what comes first today, and when they finish.
// With an interview date it works backwards from the day; without one it projects forwards from
// the daily goal. It also holds new material back when reviews pile up, because a problem that is
// learned and never reviewed is a problem learned twice.

import { FOUNDATIONS, PROBLEMS } from '../content/index';
import { addDays, dayKey, daysBetween, today } from './date';
import { DAILY_GOALS } from './game';
import { coreRemaining } from './path';
import type { Progress } from './store';

/** Due problems above which the reviews come before anything new, and above which nothing new is asked for. */
export const REVIEWS_FIRST = 12;
export const REVIEWS_ONLY = 30;
/** More new problems a day than this is a pace few people keep; the plan says so instead of asking for it. */
export const MAX_NEW_PER_DAY = 6;

export type PlanMode =
  /** Beginner lessons first. */
  | 'foundations'
  | 'learn'
  /** A review backlog: reviews first, then new problems. */
  | 'reviews-first'
  /** A large backlog: reviews only today. */
  | 'reviews-only'
  /** The path is learned and the interview is close: review and mock interviews. */
  | 'final-review'
  | 'done';

export interface Plan {
  mode: PlanMode;
  total: number;
  learned: number;
  /** Unlearned problems of the first pass (Easy and Medium by default), and the Hard ones after it. */
  coreLeft: number;
  laterLeft: number;
  due: number;
  /** New problems learned today, and how many the plan asks for today. */
  newToday: number;
  newTarget: number;
  /** The interview, when a future date is set. */
  interview: { date: string; daysLeft: number; reviewDays: number } | null;
  /** New problems a day the plan is built on. */
  perDay: number;
  /** New problems a day the daily goal has room for: below `perDay`, the goal is too small for the plan. */
  goalPerDay: number;
  /** With an interview date: whether `perDay` is enough to finish the core in time at a pace people keep. */
  feasible: boolean;
  /** How many of the problems being learned now (the core, or the Hard ones after it) fit before the interview. */
  coreReachable: number;
  /** Day keys when the core and everything are learned at `perDay` (null when nothing is left). */
  coreDone: string | null;
  allDone: string | null;
  /** Beginner lessons still ahead (a learner being led through Foundations), and their minutes. */
  lessonsLeft: number;
  lessonMinutes: number;
  lessonDays: number;
}

/** About how long a day at each daily goal takes, in minutes (game.ts's `DAILY_GOALS`), and the new problems that fit in it. */
function goalShape(goal: number): { minutes: number; perDay: number } {
  const g = [...DAILY_GOALS].sort((a, b) => Math.abs(a.xp - goal) - Math.abs(b.xp - goal))[0];
  return { minutes: g.minutes, perDay: g.newPerDay };
}

export function buildPlan(p: Progress): Plan {
  const t = today();
  const core = coreRemaining(p).length;
  const learned = PROBLEMS.filter((q) => p.problems[q.id]?.learnedAt).length;
  const later = PROBLEMS.length - learned - core;
  const due = Object.values(p.problems).filter((x) => x.srs && x.srs.due <= t).length;
  const newToday = Object.values(p.problems).filter((x) => x.learnedAt && dayKey(new Date(x.learnedAt)) === t).length;
  const shape = goalShape(p.settings.dailyGoal);

  const led = p.settings.experience === 'none';
  const lessons = led ? FOUNDATIONS.filter((l) => !p.lessonsDone[`f:${l.id}`]) : [];
  const lessonMinutes = lessons.reduce((n, l) => n + l.minutes, 0);
  const lessonDays = lessons.length ? Math.max(1, Math.ceil(lessonMinutes / shape.minutes)) : 0;

  const date = p.settings.interviewDate;
  const daysLeft = date ? daysBetween(t, date) : 0;
  let interview: Plan['interview'] = null;
  let perDay = shape.perDay;
  let feasible = true;
  let coreReachable = core;
  if (date && daysLeft > 0) {
    // The last stretch is for review and mock interviews, not new material.
    const reviewDays = Math.min(10, Math.max(daysLeft > 3 ? 2 : 0, Math.round(daysLeft * 0.15)));
    interview = { date, daysLeft, reviewDays };
    const learnDays = Math.max(1, daysLeft - reviewDays - lessonDays);
    const left = core > 0 ? core : later;
    const needed = Math.max(1, Math.ceil(left / learnDays));
    feasible = needed <= MAX_NEW_PER_DAY;
    perDay = Math.min(MAX_NEW_PER_DAY, needed);
    coreReachable = Math.min(left, perDay * learnDays);
  }

  let mode: PlanMode;
  if (learned === PROBLEMS.length) mode = interview ? 'final-review' : 'done';
  else if (due > REVIEWS_ONLY) mode = 'reviews-only';
  else if (lessons.length && learned === 0) mode = 'foundations';
  else if (interview && core === 0 && interview.daysLeft <= interview.reviewDays) mode = 'final-review';
  else if (due > REVIEWS_FIRST) mode = 'reviews-first';
  else mode = 'learn';

  // New problems start once the beginner lessons are done.
  const start = addDays(t, lessonDays);
  return {
    mode,
    total: PROBLEMS.length,
    learned,
    coreLeft: core,
    laterLeft: later,
    due,
    newToday,
    newTarget: mode === 'reviews-only' || mode === 'final-review' || mode === 'done' || mode === 'foundations' ? 0 : perDay,
    interview,
    perDay,
    goalPerDay: shape.perDay,
    feasible,
    coreReachable,
    coreDone: core > 0 ? addDays(start, Math.max(0, Math.ceil(core / perDay) - 1)) : null,
    allDone: core + later > 0 ? addDays(start, Math.max(0, Math.ceil((core + later) / perDay) - 1)) : null,
    lessonsLeft: lessons.length,
    lessonMinutes,
    lessonDays,
  };
}

/** "Mon 14 Dec", for a plan's dates. */
export function planDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const thisYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', ...(thisYear ? {} : { year: 'numeric' }) });
}
