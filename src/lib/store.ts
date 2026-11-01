// The learner's progress: a single JSON object persisted to localStorage, with
// a React hook (useSyncExternalStore) and named actions. No backend needed.

import { useSyncExternalStore } from 'react';
import { addDays, daysBetween, today } from './date';
import { toast } from './events';
import { ACHIEVEMENTS, GEMS, levelInfo, levelTitle } from './game';
import { newCard, review, type Grade, type SrsCard } from './srs';
import type { Difficulty } from '../content/types';
import { sfx } from './sound';

export interface ProblemProgress {
  difficulty: Difficulty;
  learnedAt?: number;
  srs?: SrsCard;
  reviews: number;
  lastGrade?: Grade;
  rebuildBest?: number;
}

export interface TemplateProgress {
  /** Best first-try accuracy, 0–1. */
  best: number;
  tries: number;
  /** When it was last typed (ms). */
  at: number;
}

export type Experience = 'none' | 'some' | 'comfortable';

export interface Progress {
  version: 1;
  createdAt: number;
  onboarded: boolean;
  settings: {
    name: string;
    dailyGoal: number;
    experience: Experience;
    sound: boolean;
    haptics: boolean;
    theme: 'system' | 'light' | 'dark';
    typingMode: 'auto' | 'type' | 'tap';
  };
  xp: number;
  gems: number;
  xpByDay: Record<string, number>;
  goalDays: string[];
  streak: {
    current: number;
    longest: number;
    lastDay: string | null;
    freezes: number;
    frozenDays: string[];
    /** A recently broken streak that can still be repaired (48 hours). */
    lost?: { value: number; lastDay: string; day: string } | null;
  };
  /** 'f:<lessonId>' for foundations, 'g:<categoryId>' for pattern intros. */
  lessonsDone: Record<string, number>;
  problems: Record<string, ProblemProgress>;
  /** Template from memory, per unit (category id). Optional: older saves do not have it. */
  templates?: Record<string, TemplateProgress>;
  achievements: Record<string, number>;
  stats: {
    sessions: number;
    perfectSessions: number;
    answered: number;
    correct: number;
    bestCombo: number;
    blitzBest: number;
    blitzPlays: number;
    rebuilds: number;
    perfectRebuilds: number;
  };
}

const KEY = 'intprep.progress.v1';

function fresh(): Progress {
  return {
    version: 1,
    createdAt: Date.now(),
    onboarded: false,
    settings: {
      name: '',
      dailyGoal: 50,
      experience: 'some',
      sound: true,
      haptics: true,
      theme: 'system',
      typingMode: 'auto',
    },
    xp: 0,
    gems: 20,
    xpByDay: {},
    goalDays: [],
    streak: { current: 0, longest: 0, lastDay: null, freezes: 1, frozenDays: [] },
    lessonsDone: {},
    problems: {},
    achievements: {},
    stats: {
      sessions: 0,
      perfectSessions: 0,
      answered: 0,
      correct: 0,
      bestCombo: 0,
      blitzBest: 0,
      blitzPlays: 0,
      rebuilds: 0,
      perfectRebuilds: 0,
    },
  };
}

/** Merge a stored object over defaults so older saves gain new fields. */
function hydrate(raw: unknown): Progress {
  const base = fresh();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<Progress>;
  return {
    ...base,
    ...r,
    settings: { ...base.settings, ...(r.settings ?? {}) },
    streak: { ...base.streak, ...(r.streak ?? {}) },
    stats: { ...base.stats, ...(r.stats ?? {}) },
    xpByDay: r.xpByDay ?? {},
    goalDays: r.goalDays ?? [],
    lessonsDone: r.lessonsDone ?? {},
    problems: r.problems ?? {},
    achievements: r.achievements ?? {},
  };
}

function load(): Progress {
  try {
    const s = localStorage.getItem(KEY);
    return hydrate(s ? JSON.parse(s) : null);
  } catch {
    return fresh();
  }
}

let state: Progress = load();
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked — progress stays in memory for this visit */
  }
}

function update(fn: (draft: Progress) => void) {
  const draft = structuredClone(state);
  fn(draft);
  checkAchievements(draft);
  state = draft;
  save();
  listeners.forEach((l) => l());
}

export function getProgress(): Progress {
  return state;
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

// Keep tabs in sync.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

// ── Streaks ─────────────────────────────────────────────────────────────────

/**
 * Run on app start (and when the tab regains focus). If days were missed,
 * spend streak freezes to cover them; if there are not enough, the streak resets.
 */
export function reconcileStreak() {
  const s = state.streak;
  if (!s.lastDay) return;
  const t = today();
  const gap = daysBetween(s.lastDay, t); // 1 = played yesterday
  if (gap <= 1) return;
  const missed = gap - 1;
  update((d) => {
    if (d.streak.current > 0 && d.streak.freezes >= missed) {
      for (let i = 1; i <= missed; i++) d.streak.frozenDays.push(addDays(d.streak.lastDay!, i));
      d.streak.freezes -= missed;
      d.streak.lastDay = addDays(t, -1);
      toast({
        icon: 'snowflake',
        title: missed === 1 ? 'Streak freeze used' : `${missed} streak freezes used`,
        body: `Your ${d.streak.current}-day streak is safe. Practice today to keep it going!`,
        tone: 'streak',
      });
    } else if (d.streak.current > 0) {
      toast({
        icon: 'sunrise',
        title: 'Fresh start',
        body: `Your ${d.streak.current}-day streak paused. You can repair it for the next 48 hours, or begin a new one with one lesson.`,
        tone: 'warn',
      });
      d.streak.lost = { value: d.streak.current, lastDay: d.streak.lastDay!, day: t };
      d.streak.current = 0;
    }
  });
}

// ── Rewards ─────────────────────────────────────────────────────────────────

/** Award XP for real practice. Extends the streak and checks the daily goal. */
export function awardXp(amount: number, reason?: string) {
  if (amount <= 0) return;
  update((d) => {
    const t = today();
    const beforeLevel = levelInfo(d.xp).level;
    d.xp += amount;
    const before = d.xpByDay[t] ?? 0;
    d.xpByDay[t] = before + amount;

    // Streak: any real practice today counts.
    if (d.streak.lastDay !== t) {
      const gap = d.streak.lastDay ? daysBetween(d.streak.lastDay, t) : Infinity;
      d.streak.current = gap === 1 ? d.streak.current + 1 : 1;
      d.streak.lastDay = t;
      d.streak.longest = Math.max(d.streak.longest, d.streak.current);
      if (d.streak.current > 1) {
        toast({ icon: 'flame', title: `${d.streak.current}-day streak!`, body: streakCheer(d.streak.current), tone: 'streak' });
      } else {
        toast({ icon: 'flame', title: 'Streak started!', body: 'Come back tomorrow to make it 2 days.', tone: 'streak' });
      }
    }

    // Daily goal.
    if (before < d.settings.dailyGoal && d.xpByDay[t] >= d.settings.dailyGoal && !d.goalDays.includes(t)) {
      d.goalDays.push(t);
      d.gems += GEMS.dailyGoal;
      toast({ icon: 'target', title: 'Daily goal complete!', body: `+${GEMS.dailyGoal} gems`, tone: 'success' });
      sfx('goal');
    }

    const after = levelInfo(d.xp).level;
    if (after > beforeLevel) {
      toast({ icon: 'star', title: `Level ${after}!`, body: `You are now a ${levelTitle(after)}.`, tone: 'success' });
      sfx('level');
    }
  });
  void reason;
}

function streakCheer(n: number): string {
  if (n % 30 === 0) return 'A whole month of practice. That is how experts are made.';
  if (n % 7 === 0) return 'Another full week. Your future interviewer thanks you.';
  if (n >= 3) return 'Consistency beats cramming. Keep the flame alive!';
  return 'Two days in a row — that is how habits start.';
}

/** Can a recently broken streak still be repaired? Returns its length or 0. */
export function repairableStreak(p: Progress = state): number {
  const lost = p.streak.lost;
  if (!lost) return 0;
  return daysBetween(lost.day, today()) <= 1 ? lost.value : 0;
}

export function repairStreak(): boolean {
  const value = repairableStreak();
  if (!value || state.gems < GEMS.repairCost) return false;
  update((d) => {
    const lost = d.streak.lost!;
    const t = today();
    // Cover the missed days so the calendar shows them as protected.
    for (let day = addDays(lost.lastDay, 1); day < t; day = addDays(day, 1)) {
      if (!d.streak.frozenDays.includes(day)) d.streak.frozenDays.push(day);
    }
    d.gems -= GEMS.repairCost;
    if (d.streak.lastDay === t) {
      d.streak.current = lost.value + d.streak.current;
    } else {
      d.streak.current = lost.value;
      d.streak.lastDay = addDays(t, -1);
    }
    d.streak.longest = Math.max(d.streak.longest, d.streak.current);
    d.streak.lost = null;
  });
  toast({ icon: 'wrench', title: 'Streak repaired!', body: `Back to ${state.streak.current} days. Keep it going!`, tone: 'streak' });
  return true;
}

/** Pull a learned problem into today's reviews (e.g. after a Blitz miss). */
export function flagForReview(id: string) {
  const p = state.problems[id];
  if (!p?.srs || p.srs.due <= today()) return;
  update((d) => {
    d.problems[id].srs!.due = today();
  });
}

export function addGems(n: number) {
  update((d) => {
    d.gems += n;
  });
}

export function buyFreeze(): boolean {
  if (state.gems < GEMS.freezeCost || state.streak.freezes >= GEMS.maxFreezes) return false;
  update((d) => {
    d.gems -= GEMS.freezeCost;
    d.streak.freezes += 1;
  });
  toast({ icon: 'snowflake', title: 'Streak freeze equipped', body: 'It will protect your streak if you miss a day.', tone: 'info' });
  return true;
}

function checkAchievements(d: Progress) {
  for (const a of ACHIEVEMENTS) {
    if (!d.achievements[a.id] && a.test(d)) {
      d.achievements[a.id] = Date.now();
      d.gems += a.gems;
      toast({ icon: a.icon, title: `Achievement unlocked: ${a.title}`, body: `${a.desc} · +${a.gems} gems`, tone: 'gem' });
    }
  }
}

// ── Learning actions ────────────────────────────────────────────────────────

export function completeLesson(key: string, xp: number) {
  const first = !state.lessonsDone[key];
  update((d) => {
    d.lessonsDone[key] = Date.now();
    if (first) d.gems += GEMS.lesson;
  });
  awardXp(first ? xp : Math.round(xp / 3), 'lesson');
}

export function learnProblem(id: string, difficulty: Difficulty, xp: number) {
  const existing = state.problems[id];
  const first = !existing?.learnedAt;
  update((d) => {
    const p = d.problems[id] ?? { difficulty, reviews: 0 };
    p.difficulty = difficulty;
    if (!p.learnedAt) {
      p.learnedAt = Date.now();
      p.srs = newCard();
      d.gems += GEMS.problem;
    }
    d.problems[id] = p;
  });
  awardXp(first ? xp : Math.round(xp / 4), 'problem');
}

/** Apply a spaced-repetition review. Only due cards move on the schedule. */
export function reviewProblem(id: string, grade: Grade, opts: { force?: boolean } = {}) {
  update((d) => {
    const p = d.problems[id];
    if (!p?.srs) return;
    p.reviews += 1;
    p.lastGrade = grade;
    if (opts.force || p.srs.due <= today() || grade === 'again') p.srs = review(p.srs, grade);
  });
}

export function recordAnswers(answered: number, correct: number, bestCombo: number) {
  update((d) => {
    d.stats.answered += answered;
    d.stats.correct += correct;
    d.stats.bestCombo = Math.max(d.stats.bestCombo, bestCombo);
  });
}

export function finishSession(perfect: boolean) {
  update((d) => {
    d.stats.sessions += 1;
    if (perfect) d.stats.perfectSessions += 1;
  });
}

export function recordBlitz(score: number) {
  const best = score > state.stats.blitzBest;
  update((d) => {
    d.stats.blitzPlays += 1;
    d.stats.blitzBest = Math.max(d.stats.blitzBest, score);
  });
  return best;
}

export function recordRebuild(id: string, accuracy: number) {
  update((d) => {
    d.stats.rebuilds += 1;
    if (accuracy >= 1) d.stats.perfectRebuilds += 1;
    const p = d.problems[id];
    if (p) p.rebuildBest = Math.max(p.rebuildBest ?? 0, accuracy);
  });
}

/** Record a "Template from memory" attempt for a unit. Returns true on a new best. */
export function recordTemplate(cat: string, accuracy: number): boolean {
  const prev = state.templates?.[cat];
  const best = !prev || accuracy > prev.best;
  update((d) => {
    const t = (d.templates ??= {});
    const cur = t[cat];
    t[cat] = { best: Math.max(cur?.best ?? 0, accuracy), tries: (cur?.tries ?? 0) + 1, at: Date.now() };
  });
  return best;
}

// ── Settings & data ─────────────────────────────────────────────────────────

export function updateSettings(patch: Partial<Progress['settings']>) {
  update((d) => {
    d.settings = { ...d.settings, ...patch };
  });
}

export function finishOnboarding(patch: Partial<Progress['settings']>) {
  update((d) => {
    d.settings = { ...d.settings, ...patch };
    d.onboarded = true;
  });
}

export function exportProgress(): string {
  return JSON.stringify(state, null, 2);
}

export function importProgress(json: string): boolean {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || parsed.version !== 1) return false;
    state = hydrate(parsed);
    save();
    listeners.forEach((l) => l());
    return true;
  } catch {
    return false;
  }
}

export function resetProgress() {
  state = fresh();
  save();
  listeners.forEach((l) => l());
}

// ── Derived helpers ─────────────────────────────────────────────────────────

export function dueProblemIds(p: Progress = state, day = today()): string[] {
  return Object.entries(p.problems)
    .filter(([, x]) => x.srs && x.srs.due <= day)
    .sort((a, b) => (a[1].srs!.due < b[1].srs!.due ? -1 : 1))
    .map(([id]) => id);
}

export function learnedIds(p: Progress = state): string[] {
  return Object.entries(p.problems)
    .filter(([, x]) => x.learnedAt)
    .map(([id]) => id);
}

export function xpToday(p: Progress = state): number {
  return p.xpByDay[today()] ?? 0;
}

/** Has today already counted toward the streak? */
export function practicedToday(p: Progress = state): boolean {
  return p.streak.lastDay === today();
}
