// The learner's progress: a single JSON object persisted to localStorage, with
// a React hook (useSyncExternalStore) and named actions. No backend needed.

import { useSyncExternalStore } from 'react';
import { addDays, daysBetween, today } from './date';
import { later, toast } from './events';
import { ACHIEVEMENTS, GEMS, levelInfo, levelTitle } from './game';
import { TEMPLATE_READY, TYPED_PROOF } from './input';
import { newCard, review, type Grade, type SrsCard } from './srs';
import type { Difficulty } from '../content/types';
import { sfx } from './sound';

export interface ProblemProgress {
  difficulty: Difficulty;
  learnedAt?: number;
  srs?: SrsCard;
  reviews: number;
  lastGrade?: Grade;
  /** Best Code from memory score, part by part (0–1). */
  rebuildBest?: number;
  /** Best Code from memory score, the whole solution from scratch (0–1). */
  scratchBest?: number;
  /** Best Code from memory score, fill the gaps (0–1). Optional: older saves do not have it. */
  gapsBest?: number;
  /**
   * Best Code from memory score with the lines picked from choices ("Pick first, then type", see
   * `problemInput` in lib/input.ts): part by part, and fill the gaps (0–1). Kept apart from the
   * typed bests above, so picking never moves the typed ladder (Rebuild's `ladderMode`) or the
   * scores shown as written from memory. Optional: older saves do not have them.
   */
  rebuildPickBest?: number;
  gapsPickBest?: number;
  /** When this problem was last written from memory (any mode, typed). */
  rebuiltAt?: number;
  /**
   * When it was last typed from memory well enough to count as known: a typed Fill the gaps or
   * From scratch run of `TYPED_PROOF` (80%) or more (see `hasTypedProof` in lib/input.ts). A later
   * lapse (`lapsedAt`) makes it stale. Optional: older saves do not have it.
   */
  typedAt?: number;
  /** When its review card last lapsed (a review graded 'again' that reset it). Optional: older saves do not have it. */
  lapsedAt?: number;
}

export interface TemplateProgress {
  /** Best first-try accuracy from memory, 0–1 (0 with `tries` 0 when only the gaps were done). */
  best: number;
  /** From-memory attempts. */
  tries: number;
  /** When it was last practiced, either way (ms). */
  at: number;
  /** Best first-check accuracy filling the gaps, 0–1. Optional: older saves do not have it. */
  gapsBest?: number;
  /**
   * Best first-check accuracy picking the gaps from choices, 0–1 (the template's first rung in
   * "Pick first, then type": see `templateInput` in lib/input.ts). Optional: older saves do not have it.
   */
  pickBest?: number;
  /**
   * A Pick the gaps round in Template practice reached `TEMPLATE_READY` (80%): the template counts
   * as known (`isNewTemplate`). The pattern intro's "Your turn" pick never sets it. Optional: older
   * saves do not have it.
   */
  pickReady?: boolean;
}

/** How a template was practiced: its gaps picked from choices, its gaps typed, or the whole template typed from memory. */
export type TemplateMode = 'pick' | 'gaps' | 'memory';

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
    /** "Code practice" (lib/input.ts): 'auto' = Pick first, then type (default); 'type' = Always type; 'tap' = Always pick. */
    typingMode: 'auto' | 'type' | 'tap';
    /** The last game picked in Pattern Blitz: spot the pattern, or type key lines. */
    blitzGame: 'pattern' | 'lines';
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
    /** Pattern Blitz, Key lines: best timed score and timed rounds played (the pattern game's are above). */
    blitzCodeBest: number;
    blitzCodePlays: number;
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
      blitzGame: 'pattern',
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
      blitzCodeBest: 0,
      blitzCodePlays: 0,
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
  const settings = { ...base.settings, ...(r.settings ?? {}) };
  // "Code practice": 'auto' (Pick first, then type), 'type' (Always type) or 'tap' (Always pick).
  if (!['auto', 'type', 'tap'].includes(settings.typingMode)) settings.typingMode = 'auto';
  // Saves from before cards kept the grade of the review that moved them: take the last grade
  // given, once, so practice that does not move the card (which still sets `lastGrade`) can never
  // flip it between picking and typing (`isNewCode`).
  const problems: Record<string, ProblemProgress> = { ...(r.problems ?? {}) };
  for (const [id, pp] of Object.entries(problems)) {
    if (pp?.srs && pp.srs.reps >= 1 && !pp.srs.grade && pp.lastGrade) problems[id] = { ...pp, srs: { ...pp.srs, grade: pp.lastGrade } };
  }
  return {
    ...base,
    ...r,
    settings,
    streak: { ...base.streak, ...(r.streak ?? {}) },
    stats: { ...base.stats, ...(r.stats ?? {}) },
    xpByDay: r.xpByDay ?? {},
    goalDays: r.goalDays ?? [],
    lessonsDone: r.lessonsDone ?? {},
    problems,
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
      later(() => sfx('goal'));
    }

    const after = levelInfo(d.xp).level;
    if (after > beforeLevel) {
      toast({ icon: 'star', title: `Level ${after}!`, body: `You are now a ${levelTitle(after)}.`, tone: 'success' });
      later(() => sfx('level'));
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

/**
 * Pull a learned problem into today's reviews (e.g. after a Blitz miss). A problem learned or
 * lapsed today stays due tomorrow: its next review needs a night in between.
 */
export function flagForReview(id: string) {
  const p = state.problems[id];
  if (!p?.srs || p.srs.due <= today() || (p.srs.reps === 0 && p.srs.last === today())) return;
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

/**
 * Apply a spaced-repetition review. Only due cards move on the schedule, except that a lapse
 * ('again') resets a card early, unless `lapse: false` (optional practice such as Code from
 * memory, which must never lower the schedule of a card that is not due). `force` moves any card.
 */
export function reviewProblem(id: string, grade: Grade, opts: { force?: boolean; lapse?: boolean } = {}) {
  update((d) => {
    const p = d.problems[id];
    if (!p?.srs) return;
    p.reviews += 1;
    p.lastGrade = grade;
    if (opts.force || p.srs.due <= today() || (grade === 'again' && opts.lapse !== false)) {
      p.srs = review(p.srs, grade);
      // A lapse makes earlier typed proof stale: the code is picked again (lib/input.ts).
      if (grade === 'again') p.lapsedAt = Date.now();
    }
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

/** A finished timed round of Key lines (Pattern Blitz's typing game). Returns true on a new best. */
export function recordBlitzCode(score: number) {
  const best = score > state.stats.blitzCodeBest;
  update((d) => {
    d.stats.blitzCodePlays += 1;
    d.stats.blitzCodeBest = Math.max(d.stats.blitzCodeBest, score);
  });
  return best;
}

/**
 * A finished Code from memory session: part by part (default), fill the gaps, or the whole
 * solution from scratch. `input` 'pick' (lines picked from choices: part by part or fill the gaps)
 * records its own best (`rebuildPickBest`, `gapsPickBest`) and leaves the typed bests, the last
 * written date and the perfect-rebuild count alone. A typed Fill the gaps or From scratch run of
 * `TYPED_PROOF` or more is typed proof (`typedAt`): the code counts as known from then on, until a
 * lapse.
 */
export function recordRebuild(id: string, accuracy: number, mode: 'parts' | 'gaps' | 'scratch' = 'parts', input: 'pick' | 'type' = 'type') {
  const picked = input === 'pick' && mode !== 'scratch';
  update((d) => {
    d.stats.rebuilds += 1;
    if (accuracy >= 1 && !picked) d.stats.perfectRebuilds += 1;
    const p = d.problems[id];
    if (!p) return;
    if (picked) {
      if (mode === 'gaps') p.gapsPickBest = Math.max(p.gapsPickBest ?? 0, accuracy);
      else p.rebuildPickBest = Math.max(p.rebuildPickBest ?? 0, accuracy);
      return;
    }
    if (mode === 'scratch') p.scratchBest = Math.max(p.scratchBest ?? 0, accuracy);
    else if (mode === 'gaps') p.gapsBest = Math.max(p.gapsBest ?? 0, accuracy);
    else p.rebuildBest = Math.max(p.rebuildBest ?? 0, accuracy);
    p.rebuiltAt = Date.now();
    if (mode !== 'parts' && accuracy >= TYPED_PROOF) p.typedAt = p.rebuiltAt;
  });
}

/**
 * Record a template drill for a unit: its gaps picked from choices, its gaps typed, or typed from
 * memory (default). Only ever raises a best. Returns true on a new best for that mode. A Pick the
 * gaps round of `TEMPLATE_READY` or more marks the template known (`pickReady`), except the
 * pattern intro's check (`intro`), which comes right after the template was on screen.
 */
export function recordTemplate(cat: string, accuracy: number, mode: TemplateMode = 'memory', opts: { intro?: boolean } = {}): boolean {
  const prev = state.templates?.[cat];
  const best =
    mode === 'pick'
      ? prev?.pickBest === undefined || accuracy > prev.pickBest
      : mode === 'gaps'
        ? prev?.gapsBest === undefined || accuracy > prev.gapsBest
        : !prev?.tries || accuracy > prev.best;
  update((d) => {
    const t = (d.templates ??= {});
    const cur = t[cat];
    const next: TemplateProgress = {
      best: cur?.best ?? 0,
      tries: cur?.tries ?? 0,
      at: Date.now(),
      ...(cur?.gapsBest !== undefined ? { gapsBest: cur.gapsBest } : {}),
      ...(cur?.pickBest !== undefined ? { pickBest: cur.pickBest } : {}),
      ...(cur?.pickReady ? { pickReady: true } : {}),
    };
    if (mode === 'pick') {
      next.pickBest = Math.max(cur?.pickBest ?? 0, accuracy);
      if (!opts.intro && accuracy >= TEMPLATE_READY) next.pickReady = true;
    }
    else if (mode === 'gaps') next.gapsBest = Math.max(cur?.gapsBest ?? 0, accuracy);
    else {
      next.best = Math.max(cur?.best ?? 0, accuracy);
      next.tries += 1;
    }
    t[cat] = next;
  });
  return best;
}

/**
 * The template score to show next to "Practice the template": the highest rung practiced, so the
 * from-memory best once the template has been typed from memory, else the fill-the-gaps best,
 * else the pick-the-gaps best, else null.
 */
export function templateScore(t: TemplateProgress | undefined): { mode: TemplateMode; best: number } | null {
  if (t && t.tries > 0) return { mode: 'memory', best: t.best };
  if (t?.gapsBest !== undefined) return { mode: 'gaps', best: t.gapsBest };
  if (t?.pickBest !== undefined) return { mode: 'pick', best: t.pickBest };
  return null;
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
