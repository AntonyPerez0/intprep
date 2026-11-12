// The learner's progress: a single JSON object persisted to localStorage, with
// a React hook (useSyncExternalStore) and named actions. No backend needed.

import { useSyncExternalStore } from 'react';
import { addDays, daysBetween, today } from './date';
import { later, toast } from './events';
import { ACHIEVEMENTS, GEMS, levelInfo, levelTitle } from './game';
import { TEMPLATE_READY, TYPED_PROOF } from './input';
import { knownCard, newCard, review, type Grade, type SrsCard } from './srs';
import { CATEGORIES } from '../content/categories';
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
  /** When the learner's own code last passed every test ("run my code"). Optional: older saves do not have it. */
  solvedAt?: number;
  /** Learned by solving it unaided before its lesson ("I know this one"), which skipped the lesson. */
  testedOut?: boolean;
  /** The last timed mock interview on this problem. */
  mock?: { at: number; passed: boolean; seconds: number };
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

/** Clue words (lib/clues.ts): how well the wording that points to one pattern is known. */
export interface ClueProgress {
  /** Cards answered on this pattern's clues, and how many were right on the first try. */
  seen: number;
  right: number;
  /** Right in a row now, and the longest such run so far. */
  run: number;
  best: number;
  /** When it was last asked (ms). */
  at: number;
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
    /** "Run my code": run typed code with real Python in the browser (lib/python.ts; downloads the runtime once). */
    runCode: boolean;
    /** The learner's interview day ("YYYY-MM-DD"), if they set one: it paces new problems and caps review intervals (lib/plan.ts). */
    interviewDate: string | null;
    /**
     * The order "what next?" follows (lib/path.ts): 'core' = every unit's Easy and Medium problems
     * first, then the Hard ones; 'unit' = each unit to its end before the next.
     */
    pathOrder: 'core' | 'unit';
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
  /** Clue words, per pattern (category id). Optional: older saves do not have it. */
  clues?: Record<string, ClueProgress>;
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
    /** Problems whose tests the learner's own code passed, and timed mock interviews taken and passed. */
    solved: number;
    mocks: number;
    mocksPassed: number;
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
      runCode: true,
      interviewDate: null,
      pathOrder: 'core',
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
      solved: 0,
      mocks: 0,
      mocksPassed: 0,
    },
  };
}

// ── Reading saved progress safely ───────────────────────────────────────────
// A save can come from an older version, a hand-edited backup, or be damaged. Everything read from
// storage or from an imported file goes through `hydrate`, which keeps what is well-formed and
// replaces the rest with defaults, so one bad field can never crash the app or corrupt the totals.

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (v: unknown, fallback = 0, min = 0): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, v) : fallback);
const day = (v: unknown): string | null => (typeof v === 'string' && DAY.test(v) ? v : null);
const stamp = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined);
const score = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : undefined);
const GRADES: readonly Grade[] = ['again', 'hard', 'good', 'easy'];
const grade = (v: unknown): Grade | undefined => (GRADES.includes(v as Grade) ? (v as Grade) : undefined);

/** Every number in a record of counters (`xpByDay`, `lessonsDone`, `achievements`); entries that are not numbers are dropped. */
function numbers(v: unknown, keyOk: (k: string) => boolean = () => true): Record<string, number> {
  const out: Record<string, number> = {};
  if (isObj(v)) for (const [k, x] of Object.entries(v)) if (keyOk(k) && typeof x === 'number' && Number.isFinite(x)) out[k] = x;
  return out;
}

function card(v: unknown): SrsCard | undefined {
  if (!isObj(v)) return undefined;
  const due = day(v.due);
  const last = day(v.last);
  if (!due || !last) return undefined;
  const g = grade(v.grade);
  const held = day(v.held);
  return {
    ...(held ? { held } : {}),
    due,
    last,
    interval: Math.round(num(v.interval, 1, 1)),
    ease: Math.min(4, num(v.ease, 2.5, 1.3)),
    reps: Math.round(num(v.reps)),
    lapses: Math.round(num(v.lapses)),
    ...(g ? { grade: g } : {}),
  };
}

function problemProgress(v: unknown): ProblemProgress | null {
  if (!isObj(v)) return null;
  const p: ProblemProgress = {
    difficulty: (['Easy', 'Medium', 'Hard'] as const).find((d) => d === v.difficulty) ?? 'Medium',
    reviews: Math.round(num(v.reviews)),
  };
  const learnedAt = stamp(v.learnedAt);
  if (learnedAt) {
    p.learnedAt = learnedAt;
    // A learned problem always has a card: without one it would never come back for review.
    p.srs = card(v.srs) ?? newCard();
  }
  const lastGrade = grade(v.lastGrade);
  if (lastGrade) p.lastGrade = lastGrade;
  for (const k of ['rebuildBest', 'scratchBest', 'gapsBest', 'rebuildPickBest', 'gapsPickBest'] as const) {
    const x = score(v[k]);
    if (x !== undefined) p[k] = x;
  }
  for (const k of ['rebuiltAt', 'typedAt', 'lapsedAt', 'solvedAt'] as const) {
    const x = stamp(v[k]);
    if (x) p[k] = x;
  }
  if (v.testedOut === true) p.testedOut = true;
  if (isObj(v.mock) && stamp(v.mock.at)) p.mock = { at: stamp(v.mock.at)!, passed: v.mock.passed === true, seconds: Math.round(num(v.mock.seconds)) };
  // Saves from before cards kept the grade of the review that moved them: take the last grade
  // given, once, so practice that does not move the card (which still sets `lastGrade`) can never
  // flip it between picking and typing (`isNewCode`).
  if (p.srs && p.srs.reps >= 1 && !p.srs.grade && p.lastGrade) p.srs = { ...p.srs, grade: p.lastGrade };
  return p;
}

function templateProgress(v: unknown): TemplateProgress | null {
  if (!isObj(v)) return null;
  const t: TemplateProgress = { best: score(v.best) ?? 0, tries: Math.round(num(v.tries)), at: stamp(v.at) ?? Date.now() };
  const gapsBest = score(v.gapsBest);
  const pickBest = score(v.pickBest);
  if (gapsBest !== undefined) t.gapsBest = gapsBest;
  if (pickBest !== undefined) t.pickBest = pickBest;
  if (v.pickReady === true) t.pickReady = true;
  return t;
}

/** Lesson ids that were split or renamed: a learner who finished the old lesson has finished these. */
const LESSON_MOVES: Record<string, string[]> = {
  'f:functions-and-classes': ['f:functions', 'f:classes-and-nodes'],
};

/** A stored object as a well-formed Progress: defaults for anything missing or malformed. */
function hydrate(raw: unknown): Progress {
  const base = fresh();
  if (!isObj(raw)) return base;
  const rs = isObj(raw.settings) ? raw.settings : {};
  const pick = <T>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
  const settings: Progress['settings'] = {
    name: typeof rs.name === 'string' ? rs.name.slice(0, 60) : base.settings.name,
    dailyGoal: num(rs.dailyGoal, base.settings.dailyGoal, 1),
    experience: pick<Experience>(rs.experience, ['none', 'some', 'comfortable'], base.settings.experience),
    sound: typeof rs.sound === 'boolean' ? rs.sound : base.settings.sound,
    haptics: typeof rs.haptics === 'boolean' ? rs.haptics : base.settings.haptics,
    theme: pick(rs.theme, ['system', 'light', 'dark'] as const, base.settings.theme),
    // "Code practice": 'auto' (Pick first, then type), 'type' (Always type) or 'tap' (Always pick).
    typingMode: pick(rs.typingMode, ['auto', 'type', 'tap'] as const, 'auto'),
    blitzGame: pick(rs.blitzGame, ['pattern', 'lines'] as const, 'pattern'),
    runCode: typeof rs.runCode === 'boolean' ? rs.runCode : true,
    interviewDate: day(rs.interviewDate),
    pathOrder: pick(rs.pathOrder, ['core', 'unit'] as const, 'core'),
  };
  const problems: Record<string, ProblemProgress> = {};
  if (isObj(raw.problems))
    for (const [id, v] of Object.entries(raw.problems)) {
      const p = problemProgress(v);
      if (p) problems[id] = p;
    }
  const templates: Record<string, TemplateProgress> = {};
  if (isObj(raw.templates))
    for (const [cat, v] of Object.entries(raw.templates)) {
      const t = templateProgress(v);
      if (t) templates[cat] = t;
    }
  const clues: Record<string, ClueProgress> = {};
  if (isObj(raw.clues))
    for (const [cat, v] of Object.entries(raw.clues)) {
      if (!isObj(v)) continue;
      const seen = Math.round(num(v.seen));
      const run = Math.round(num(v.run));
      clues[cat] = { seen, right: Math.min(seen, Math.round(num(v.right))), run, best: Math.max(run, Math.round(num(v.best))), at: stamp(v.at) ?? Date.now() };
    }
  const lessonsDone = numbers(raw.lessonsDone);
  for (const [old, now] of Object.entries(LESSON_MOVES)) {
    if (!lessonsDone[old]) continue;
    for (const k of now) lessonsDone[k] ??= lessonsDone[old];
    delete lessonsDone[old];
  }
  const st = isObj(raw.streak) ? raw.streak : {};
  const lost = isObj(st.lost) && day(st.lost.lastDay) && day(st.lost.day) ? { value: Math.round(num(st.lost.value)), lastDay: day(st.lost.lastDay)!, day: day(st.lost.day)! } : null;
  const current = Math.round(num(st.current));
  const stats = { ...base.stats };
  if (isObj(raw.stats)) for (const k of Object.keys(stats) as (keyof Progress['stats'])[]) stats[k] = num(raw.stats[k], stats[k]);
  return {
    version: 1,
    createdAt: stamp(raw.createdAt) ?? base.createdAt,
    onboarded: raw.onboarded === true,
    settings,
    xp: Math.round(num(raw.xp)),
    gems: Math.round(num(raw.gems, base.gems)),
    xpByDay: numbers(raw.xpByDay, (k) => DAY.test(k)),
    goalDays: Array.isArray(raw.goalDays) ? [...new Set(raw.goalDays.filter((d): d is string => !!day(d)))] : [],
    streak: {
      current,
      longest: Math.max(current, Math.round(num(st.longest))),
      lastDay: day(st.lastDay),
      freezes: Math.min(GEMS.maxFreezes, Math.round(num(st.freezes, base.streak.freezes))),
      frozenDays: Array.isArray(st.frozenDays) ? st.frozenDays.filter((d): d is string => !!day(d)) : [],
      lost,
    },
    lessonsDone,
    problems,
    ...(Object.keys(templates).length ? { templates } : {}),
    ...(Object.keys(clues).length ? { clues } : {}),
    achievements: numbers(raw.achievements),
    stats,
  };
}

/** Where a save that could not be read is kept, so it can still be recovered by hand (Profile → Export). */
const CORRUPT_KEY = KEY + '.unreadable';
/** The text last read from or written to storage: when storage holds something else, another tab wrote it. */
let lastRaw: string | null = null;
/** Set when the save could not be read at startup; the app says so once (see `storageNotice`). */
let unreadable = false;

function load(): Progress {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return fresh(); // storage blocked: progress lives in memory for this visit
  }
  lastRaw = raw;
  if (!raw) return fresh();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObj(parsed)) throw new Error('not an object');
    return hydrate(parsed);
  } catch {
    // Never overwrite a save we could not read: keep a copy, then start fresh.
    try {
      localStorage.setItem(CORRUPT_KEY, raw);
    } catch {
      /* no room for the copy */
    }
    unreadable = true;
    return fresh();
  }
}

let state: Progress = load();
const listeners = new Set<() => void>();
let saveFailed = false;

function save() {
  const raw = JSON.stringify(state);
  try {
    localStorage.setItem(KEY, raw);
    lastRaw = raw;
    saveFailed = false;
  } catch {
    // Storage is full or blocked: progress stays in memory for this visit. Say so once, so the
    // learner can export a backup before closing the tab.
    if (!saveFailed) {
      saveFailed = true;
      toast({
        icon: 'warning',
        title: 'Progress could not be saved',
        body: 'This browser’s storage is full or blocked. Export a backup from your profile before closing this tab.',
        tone: 'warn',
      });
    }
  }
}

/**
 * Pick up what another tab saved, in case its `storage` event has not arrived yet (or never does:
 * a tab asleep in the background). Without this, a stale tab's next save would overwrite the newer
 * progress.
 */
function refresh() {
  let raw: string | null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return;
  }
  if (raw === lastRaw || !raw) return;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isObj(parsed)) {
      state = hydrate(parsed);
      lastRaw = raw;
    }
  } catch {
    /* another tab is mid-write or wrote something unreadable: keep what we have */
  }
}

function update(fn: (draft: Progress) => void) {
  refresh();
  const draft = structuredClone(state);
  fn(draft);
  checkAchievements(draft);
  state = draft;
  save();
  listeners.forEach((l) => l());
}

/** One-time notices about saved progress, for the app shell to show after it mounts. */
export function storageNotice(): void {
  if (!unreadable) return;
  unreadable = false;
  toast({
    icon: 'warning',
    title: 'Saved progress could not be read',
    body: 'IntPrep started fresh. The old data was kept in this browser; import a backup from your profile to restore it.',
    tone: 'warn',
  });
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
      refresh();
      listeners.forEach((l) => l());
    }
  });
}

// ── Streaks ─────────────────────────────────────────────────────────────────

/**
 * Days were missed since the last practice: spend streak freezes to cover them, or, without
 * enough, end the streak (it stays repairable for 48 hours). Changes `d` in place; a no-op when
 * nothing was missed, and when the device clock moved back (a trip west, a corrected clock), which
 * must never cost a streak.
 */
function settleStreak(d: Progress, t: string) {
  const s = d.streak;
  if (!s.lastDay) return;
  const gap = daysBetween(s.lastDay, t); // 1 = practiced yesterday
  if (gap <= 1) return;
  const missed = gap - 1;
  if (s.current > 0 && s.freezes >= missed) {
    for (let i = 1; i <= missed; i++) s.frozenDays.push(addDays(s.lastDay, i));
    s.freezes -= missed;
    s.lastDay = addDays(t, -1);
    toast({
      icon: 'snowflake',
      title: missed === 1 ? 'Streak freeze used' : `${missed} streak freezes used`,
      body: `Your ${s.current}-day streak is safe. Practice today to keep it going!`,
      tone: 'streak',
    });
  } else if (s.current > 0) {
    s.lost = { value: s.current, lastDay: s.lastDay, day: t };
    const canRepair = repairableStreak(d) > 0;
    toast({
      icon: 'sunrise',
      title: 'Fresh start',
      body: canRepair
        ? `Your ${s.current}-day streak paused. You can repair it for the next 48 hours, or begin a new one with one lesson.`
        : `Your ${s.current}-day streak ended. Begin a new one with one lesson.`,
      tone: 'warn',
    });
    s.current = 0;
  }
}

/** Run on app start (and when the tab regains focus): settle any days missed since the last practice. */
export function reconcileStreak() {
  refresh();
  const s = state.streak;
  if (!s.lastDay || daysBetween(s.lastDay, today()) <= 1) return;
  update((d) => settleStreak(d, today()));
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

    // Streak: any real practice today counts. Days missed while the app stayed open (a tab left
    // on screen overnight never runs `reconcileStreak`) are settled first, so a freeze is used or
    // the streak becomes repairable instead of silently restarting. A clock that moved back (a
    // last day in the future) leaves the streak as it is.
    settleStreak(d, t);
    const gap = d.streak.lastDay ? daysBetween(d.streak.lastDay, t) : Infinity;
    if (gap > 0) {
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
      // A title lasts two levels: name it only when it is new.
      const title = levelTitle(after);
      const body = title !== levelTitle(beforeLevel) ? `New title: ${title}.` : `${levelInfo(d.xp).cost - levelInfo(d.xp).into} XP to level ${after + 1}.`;
      toast({ icon: 'star', title: `Level ${after}!`, body, tone: 'success' });
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

/**
 * Can a recently broken streak still be repaired? Returns its length or 0. The 48 hours run from
 * the first missed day (the day after the last practice), not from when the app was next opened:
 * a streak that ended a month ago is gone.
 */
export function repairableStreak(p: Progress = state): number {
  const lost = p.streak.lost;
  if (!lost) return 0;
  return daysBetween(lost.lastDay, today()) <= 3 ? lost.value : 0;
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

/**
 * A problem joins the review deck: at the end of its guided lesson, or (`testedOut`) because the
 * learner solved it unaided first, in which case its card starts a week out instead of tomorrow.
 */
export function learnProblem(id: string, difficulty: Difficulty, xp: number, opts: { testedOut?: boolean } = {}) {
  const existing = state.problems[id];
  const first = !existing?.learnedAt;
  update((d) => {
    const p = d.problems[id] ?? { difficulty, reviews: 0 };
    p.difficulty = difficulty;
    if (!p.learnedAt) {
      p.learnedAt = Date.now();
      p.srs = opts.testedOut ? knownCard() : newCard();
      if (opts.testedOut) p.testedOut = true;
      d.gems += GEMS.problem;
    }
    d.problems[id] = p;
  });
  awardXp(first ? xp : Math.round(xp / 4), 'problem');
}

/** The learner's own code passed every test of a problem ("run my code"). Returns true the first time. */
export function recordSolved(id: string, difficulty: Difficulty): boolean {
  const first = !state.problems[id]?.solvedAt;
  update((d) => {
    const p = d.problems[id] ?? { difficulty, reviews: 0 };
    if (!p.solvedAt) d.stats.solved += 1;
    p.solvedAt = Date.now();
    // Code that passes the tests, written without the solution on screen, is typed proof (lib/input.ts).
    if (p.learnedAt) p.typedAt = p.solvedAt;
    d.problems[id] = p;
  });
  return first;
}

/** A finished timed mock interview on one problem. */
export function recordMock(id: string, difficulty: Difficulty, passed: boolean, seconds: number) {
  update((d) => {
    const p = d.problems[id] ?? { difficulty, reviews: 0 };
    p.mock = { at: Date.now(), passed, seconds: Math.round(seconds) };
    d.problems[id] = p;
    d.stats.mocks += 1;
    if (passed) d.stats.mocksPassed += 1;
  });
}

/** With an interview date set, the longest a review interval may be: every problem comes back before the day. */
function intervalCap(d: Progress): number | undefined {
  const date = d.settings.interviewDate;
  if (!date) return undefined;
  const left = daysBetween(today(), date);
  return left > 0 ? Math.max(1, left - 2) : undefined;
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
    // A card that is nearly due (three quarters of its interval have passed) moves too, so a
    // learner can work a day ahead of a busy one; `review` grows it only for the time that passed.
    const nearlyDue = p.srs.interval >= 4 && daysBetween(p.srs.last, today()) >= 0.75 * p.srs.interval;
    if (opts.force || p.srs.due <= today() || (nearlyDue && grade !== 'again') || (grade === 'again' && opts.lapse !== false)) {
      p.srs = review(p.srs, grade, { fuzz: Math.random(), cap: intervalCap(d) });
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

/** One Clue words card answered (first try only): the pattern it was about, and whether it was right. */
export function recordClue(cat: string, ok: boolean) {
  update((d) => {
    const all = (d.clues ??= {});
    const cur = all[cat] ?? { seen: 0, right: 0, run: 0, best: 0, at: 0 };
    const run = ok ? cur.run + 1 : 0;
    all[cat] = { seen: cur.seen + 1, right: cur.right + (ok ? 1 : 0), run, best: Math.max(cur.best, run), at: Date.now() };
  });
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

/**
 * With an interview date, every learned problem comes back before the day: a review already
 * scheduled past it is pulled into the last stretch before the interview, spread over those days
 * so they do not all land on one. (Reviews made from now on are capped as they are scheduled: see
 * `intervalCap`.)
 */
function pullInReviews(d: Progress) {
  // Start from each problem's own schedule: a date that is changed or cleared gives back the due
  // days an earlier date took (`held`), so moving the date never shortens a schedule for good.
  for (const p of Object.values(d.problems)) {
    if (!p.srs?.held) continue;
    const { held, ...card } = p.srs;
    p.srs = { ...card, due: held };
  }
  const date = d.settings.interviewDate;
  const t = today();
  if (!date) return;
  const left = daysBetween(t, date);
  if (left <= 1) return;
  const last = addDays(date, -Math.min(2, left - 1)); // the latest day a review may fall on
  const span = Math.max(1, Math.min(10, Math.round(left * 0.15), daysBetween(t, last)));
  let k = 0;
  for (const p of Object.values(d.problems)) {
    if (!p.srs || p.srs.due <= last) continue;
    p.srs = { ...p.srs, held: p.srs.due, due: addDays(last, -(k++ % span)) };
  }
}

export function updateSettings(patch: Partial<Progress['settings']>) {
  update((d) => {
    d.settings = { ...d.settings, ...patch };
    if ('interviewDate' in patch) pullInReviews(d);
    // A goal lowered to what today already earned is a goal met: it counts, gems included.
    const t = today();
    if (patch.dailyGoal !== undefined && (d.xpByDay[t] ?? 0) >= d.settings.dailyGoal && !d.goalDays.includes(t)) {
      d.goalDays.push(t);
      d.gems += GEMS.dailyGoal;
    }
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
    const parsed: unknown = JSON.parse(json);
    // A backup is an export of this app: an object with its version and the parts every save has.
    if (!isObj(parsed) || parsed.version !== 1 || !isObj(parsed.settings) || !isObj(parsed.problems)) return false;
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

/** Ids that are problems today: progress on one that content no longer has is kept, but never counted or asked. */
const KNOWN = new Set(CATEGORIES.flatMap((c) => c.problemIds));

export function dueProblemIds(p: Progress = state, day = today()): string[] {
  return Object.entries(p.problems)
    .filter(([id, x]) => KNOWN.has(id) && x.srs && x.srs.due <= day)
    .sort((a, b) => (a[1].srs!.due < b[1].srs!.due ? -1 : 1))
    .map(([id]) => id);
}

export function learnedIds(p: Progress = state): string[] {
  return Object.entries(p.problems)
    .filter(([id, x]) => KNOWN.has(id) && x.learnedAt)
    .map(([id]) => id);
}

export function xpToday(p: Progress = state): number {
  return p.xpByDay[today()] ?? 0;
}

/** Has today already counted toward the streak? */
export function practicedToday(p: Progress = state): boolean {
  return p.streak.lastDay === today();
}
