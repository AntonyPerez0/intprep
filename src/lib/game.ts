// Game rules: XP values, levels, daily goals and achievements.

import type { Progress } from './store';
import { crowns } from './srs';
import { CATEGORIES } from '../content/categories';
import { FOUNDATIONS } from '../content/foundations';
import type { Difficulty } from '../content/types';

export const XP = {
  lesson: 15,
  quizCorrect: 2,
  guide: 20,
  problem: { Easy: 20, Medium: 30, Hard: 45 } as Record<Difficulty, number>,
  relearn: 5,
  drillCorrect: 4,
  /** A review coding card (Fill the gaps, Write a part, a typed key line) right on the first check. */
  codeCorrect: 8,
  comboBonus: 2,
  sessionBonus: 10,
  rebuildMax: 35,
  /** Code from memory, the whole solution from scratch (with the outline shown, rebuildMax caps it). */
  scratchMax: 50,
  /** Code from memory, fill the gaps: up to this much, scaled by first-check accuracy (plus the base 5). */
  gapsMax: 40,
  /** Template from memory: up to this much, scaled by first-try accuracy (half with a hint). */
  templateMax: 20,
  templateHintMax: 10,
  /** Template drill, fill the gaps: up to this much, scaled by first-check accuracy. */
  templateGapsMax: 12,
  blitzPerCorrect: 2,
};

export const GEMS = {
  lesson: 3,
  problem: 5,
  dailyGoal: 10,
  freezeCost: 40,
  repairCost: 60,
  maxFreezes: 2,
};

export const DAILY_GOALS = [
  { xp: 20, label: 'Casual', blurb: '≈ 5 min a day' },
  { xp: 50, label: 'Regular', blurb: '≈ 10 min a day' },
  { xp: 100, label: 'Serious', blurb: '≈ 20 min a day' },
  { xp: 160, label: 'Intense', blurb: '≈ 30+ min a day' },
];

// Level n → n+1 costs 60 + 40·(n−1) XP, so early levels come fast.
export function levelInfo(xp: number) {
  let level = 1;
  let floor = 0;
  let cost = 60;
  while (xp >= floor + cost) {
    floor += cost;
    level += 1;
    cost = 60 + 40 * (level - 1);
  }
  return { level, into: xp - floor, cost, pct: (xp - floor) / cost };
}

const TITLES = [
  'Hello, World',
  'Loop Learner',
  'Array Apprentice',
  'Hash Hero',
  'Pointer Pilot',
  'Window Washer',
  'Stack Stacker',
  'Search Sage',
  'Tree Climber',
  'Graph Explorer',
  'DP Dynamo',
  'Pattern Hunter',
  'Algorithm Ace',
  'Interview Ready',
  'Grandmaster',
];
export const levelTitle = (level: number) => TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 2))];

// ── Achievements ────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  /** Name from the icon registry (src/components/icons.tsx). */
  icon: string;
  title: string;
  desc: string;
  gems: number;
  test: (p: Progress) => boolean;
}

const learnedCount = (p: Progress) => Object.values(p.problems).filter((x) => x.learnedAt).length;
const masteredCount = (p: Progress, min = 5) =>
  Object.values(p.problems).filter((x) => x.srs && crowns(x.srs) >= min).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-lesson', icon: 'grad', title: 'First Steps', desc: 'Finish any lesson', gems: 5, test: (p) => Object.keys(p.lessonsDone).length > 0 },
  {
    id: 'foundations',
    icon: 'layers',
    title: 'Solid Foundations',
    desc: 'Finish every beginner lesson',
    gems: 25,
    test: (p) => FOUNDATIONS.length > 0 && FOUNDATIONS.every((l) => p.lessonsDone[`f:${l.id}`]),
  },
  { id: 'first-problem', icon: 'puzzle', title: 'Problem Solver', desc: 'Learn your first problem', gems: 5, test: (p) => learnedCount(p) >= 1 },
  { id: 'ten-problems', icon: 'checks', title: 'Double Digits', desc: 'Learn 10 problems', gems: 15, test: (p) => learnedCount(p) >= 10 },
  { id: 'fifty-problems', icon: 'milestone', title: 'Halfway Up', desc: 'Learn 75 problems', gems: 40, test: (p) => learnedCount(p) >= 75 },
  { id: 'all-problems', icon: 'trophy', title: 'The Full 150', desc: 'Learn all 150 problems', gems: 100, test: (p) => learnedCount(p) >= 150 },
  {
    id: 'unit-clear',
    icon: 'badge',
    title: 'Unit Cleared',
    desc: 'Learn every problem in a unit',
    gems: 15,
    test: (p) => CATEGORIES.some((c) => c.problemIds.every((id) => p.problems[id]?.learnedAt)),
  },
  {
    id: 'hard-ten',
    icon: 'mountain',
    title: 'Dragon Slayer',
    desc: 'Learn 10 Hard problems',
    gems: 30,
    test: (p) => Object.values(p.problems).filter((x) => x.learnedAt && x.difficulty === 'Hard').length >= 10,
  },
  { id: 'streak-3', icon: 'flame', title: 'Warming Up', desc: 'Reach a 3-day streak', gems: 10, test: (p) => p.streak.longest >= 3 },
  { id: 'streak-7', icon: 'repeat', title: 'One Week Strong', desc: 'Reach a 7-day streak', gems: 20, test: (p) => p.streak.longest >= 7 },
  { id: 'streak-30', icon: 'trending', title: 'Habit Formed', desc: 'Reach a 30-day streak', gems: 50, test: (p) => p.streak.longest >= 30 },
  { id: 'streak-100', icon: 'crown', title: 'Unstoppable', desc: 'Reach a 100-day streak', gems: 100, test: (p) => p.streak.longest >= 100 },
  { id: 'goal-7', icon: 'target', title: 'Goal Getter', desc: 'Hit your daily goal on 7 days', gems: 20, test: (p) => p.goalDays.length >= 7 },
  { id: 'first-review', icon: 'review', title: 'Remember Me', desc: 'Finish a review session', gems: 5, test: (p) => p.stats.sessions >= 1 },
  { id: 'perfect-review', icon: 'sparkles', title: 'Flawless', desc: 'Finish a review with no mistakes', gems: 15, test: (p) => p.stats.perfectSessions >= 1 },
  { id: 'combo-10', icon: 'bolt', title: 'Combo Breaker', desc: 'Get 10 answers right in a row', gems: 10, test: (p) => p.stats.bestCombo >= 10 },
  { id: 'blitz-150', icon: 'timer', title: 'Speed Reader', desc: 'Score 150 in Pattern Blitz', gems: 10, test: (p) => p.stats.blitzBest >= 150 },
  { id: 'blitz-400', icon: 'rocket', title: 'Pattern Radar', desc: 'Score 400 in Pattern Blitz', gems: 30, test: (p) => p.stats.blitzBest >= 400 },
  { id: 'rebuild-perfect', icon: 'keyboard', title: 'From Memory', desc: 'Rebuild a solution with no misses', gems: 15, test: (p) => p.stats.perfectRebuilds >= 1 },
  { id: 'mastered-5', icon: 'star', title: 'Crowned', desc: 'Get 5 problems to Mastered', gems: 30, test: (p) => masteredCount(p) >= 5 },
  { id: 'level-10', icon: 'award', title: 'Rising Star', desc: 'Reach level 10', gems: 25, test: (p) => levelInfo(p.xp).level >= 10 },
];
