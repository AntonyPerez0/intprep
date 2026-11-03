// Pattern Blitz: two quick games against the clock (60 seconds to spot patterns, 90 for key
// lines, since writing code takes longer than tapping) or untimed (Zen).
// - Spot the pattern: rapid-fire "which pattern is this?" across all units (recognition).
// - Key lines: the key line of a solution you have learned, from the code around it (recall).
//   Typed, or picked from four options while the problem's code is still new ("Pick first, then
//   type": `problemInput` decides each round). Both score the same points; a picked line earns
//   less XP (`blitzCodePickPerCorrect`) and only typed lines count toward the Key lines best.
// Misses on learned problems join the next review: today's, unless the problem was learned (or
// lapsed) today (`flagForReview`).

import '../styles/pages/blitz.css';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  CircleX,
  CodeXml,
  Eye,
  Flame,
  Keyboard,
  LayoutGrid,
  Leaf,
  ListChecks,
  Lock,
  Play,
  Repeat2,
  RotateCcw,
  ScanSearch,
  SkipForward,
  Timer,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { CATEGORIES, CATEGORY_BY_ID } from '../content/categories';
import { PROBLEM_BY_ID, PROBLEMS } from '../content/index';
import type { CategoryId, Problem } from '../content/types';
import {
  KEY_LINES_MIN,
  keyLineChoices,
  keyLinePool,
  keyLineView,
  nextKeyLine,
  refKey,
  type KeyLineEntry,
  type KeyLineRef,
  type KeyLineView,
} from '../lib/blitzLines';
import { confetti } from '../lib/confetti';
import { today } from '../lib/date';
import { acceptedCategories, patternChoices } from '../lib/drills';
import { XP } from '../lib/game';
import { gradeGaps } from '../lib/gaps';
import { highlightLine } from '../lib/highlight';
import { isNewCode, problemInput, sharedInput, type CodeInput } from '../lib/input';
import { inline } from '../lib/markdown';
import { nextStep } from '../lib/path';
import { shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { awardXp, flagForReview, getProgress, recordAnswers, recordBlitz, recordBlitzCode, updateSettings, useProgress, type Progress } from '../lib/store';
import { unitProgress } from '../lib/path';
import { SessionShell } from '../components/Shell';
import { CategoryIcon, IconTile } from '../components/icons';
import { ActionBar, ProblemPrompt } from '../components/interact';
import { CheckedAction, CodeLine, CodePane, TyperWindow } from '../components/CodeTyper';
import { CodeGaps, GapsFooter, PickGaps, type CodeGapsHandle, type PickGapsHandle } from '../components/CodeGaps';
import { InputSwitch } from '../components/InputSwitch';
import { Completion, DifficultyChip, Kbd, Ring, SectionHeader, StatCard } from '../components/ui';

type Game = 'pattern' | 'lines';

/** Seconds in a timed round. Writing a line takes longer than tapping a pattern. */
const DURATION: Record<Game, number> = { pattern: 60, lines: 90 };
const ZEN_QUESTIONS = 20;
/** Key lines in a Zen round: each one is written out (or picked), so a round is shorter than the pattern game's. */
const ZEN_LINES = 10;
/** Points for a hit, before the streak multiplier (both games). */
const POINTS = 10;

interface Answer {
  p: Problem;
  picked: CategoryId;
  ok: boolean;
}

const multiplier = (streak: number) => Math.min(4, 1 + Math.floor(streak / 3));

type Tone = 'calm' | 'warning' | 'danger';
const TONE_COLOR: Record<Tone, string> = { calm: 'var(--brand)', warning: 'var(--warning)', danger: 'var(--danger)' };

/** Circular gauge for the HUD: time left (timed) or questions done (Zen). */
function HudRing({ value, tone, label, children }: { value: number; tone: Tone; label: string; children: ReactNode }) {
  return (
    <div className={`blitz-ring is-${tone}`} aria-label={label} role="img">
      <Ring value={value} size={56} stroke={4} instant color={TONE_COLOR[tone]} track="var(--blitz-ring-track)">
        <span className="blitz-ring-label" aria-hidden="true">
          {children}
        </span>
      </Ring>
    </div>
  );
}

function KeyRange() {
  return (
    <span className="blitz-keys">
      <Kbd>1</Kbd>
      <span aria-hidden="true">–</span>
      <span className="sr-only">to</span>
      <Kbd>4</Kbd>
    </span>
  );
}

function Clues({ p }: { p: Problem }) {
  return (
    <>
      {p.signals.map((s, k) => (
        <span key={k}>
          {k > 0 && <span className="blitz-sep"> · </span>}
          {inline(s)}
        </span>
      ))}
    </>
  );
}

/** Seconds left in a timed round of `seconds`; calls `onEnd` once at zero. Inactive (Zen): stays at the full time. */
function useCountdown(active: boolean, seconds: number, onEnd: () => void) {
  const [endAt] = useState(() => performance.now() + seconds * 1000);
  const [left, setLeft] = useState(seconds);
  const end = useRef(onEnd);
  end.current = onEnd;
  useEffect(() => {
    if (!active) return;
    let lastWhole = Math.ceil((endAt - performance.now()) / 1000);
    const id = window.setInterval(() => {
      const l = Math.max(0, (endAt - performance.now()) / 1000);
      setLeft(l);
      const whole = Math.ceil(l);
      if (whole !== lastWhole && whole <= 5 && whole > 0) sfx('tick');
      lastWhole = whole;
      if (l <= 0) {
        window.clearInterval(id);
        end.current();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [active, endAt]);
  return left;
}

/** Score, streak, multiplier and the clock (or, in Zen, how far through the round). */
function Hud({
  score,
  streak,
  pops,
  zen,
  timeLeft,
  duration,
  tone,
  done,
  total,
  current,
  unit,
}: {
  score: number;
  streak: number;
  pops: { id: number; text: string }[];
  zen: boolean;
  timeLeft: number;
  /** Seconds in the timed round. */
  duration: number;
  tone: Tone;
  /** Zen: answered so far, out of `total`. */
  done: number;
  total: number;
  /** Zen: the number of the question on screen. */
  current: number;
  /** "Question" or "Line". */
  unit: string;
}) {
  const mult = multiplier(streak);
  const pips = mult >= 4 ? 3 : streak % 3;
  const secs = Math.ceil(timeLeft);
  const n = Math.min(current, total);
  return (
    <div className="blitz-hud">
      <div className="blitz-hud-cell blitz-hud-score">
        <div className="blitz-hud-label">
          Score
          {pops.slice(-1).map((p) => (
            <span key={p.id} className="blitz-pop" aria-hidden="true">
              {p.text}
            </span>
          ))}
        </div>
        <div className="blitz-hud-value">
          <span className="blitz-score">{score}</span>
        </div>
      </div>
      <div className="blitz-hud-center">
        <div className="blitz-hud-cell">
          <div className="blitz-hud-label">Streak</div>
          <div className="blitz-hud-value">
            <span className={`blitz-streak ${streak > 0 ? 'is-live' : ''} ${streak >= 2 ? 'is-hot' : ''}`}>
              <Flame strokeWidth={2.1} aria-hidden="true" />
              {streak}
            </span>
          </div>
        </div>
        <span className="blitz-hud-divider" aria-hidden="true" />
        <div className="blitz-hud-cell">
          <div className="blitz-hud-label">Multiplier</div>
          <div className="blitz-hud-value blitz-mult-wrap">
            <span key={mult} className={`blitz-mult ${mult > 1 ? 'is-active' : ''}`}>
              ×{mult}
            </span>
            <span className="blitz-pips" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span key={i} className={i < pips ? 'on' : ''} />
              ))}
            </span>
          </div>
        </div>
      </div>
      <div className="blitz-hud-timer">
        {zen ? (
          <HudRing value={done / total} tone="calm" label={`${unit} ${n} of ${total}`}>
            <span className="blitz-ring-num is-small">
              {n}
              <span className="blitz-ring-of">/{total}</span>
            </span>
          </HudRing>
        ) : (
          <HudRing value={timeLeft / duration} tone={tone} label={`${secs} seconds left`}>
            <span className="blitz-ring-num">{secs}</span>
            <span className="blitz-ring-unit">sec</span>
          </HudRing>
        )}
      </div>
    </div>
  );
}

const toneFor = (zen: boolean, timeLeft: number): Tone => (zen ? 'calm' : timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : 'calm');

// ── Page ────────────────────────────────────────────────────────────────────

export function Blitz() {
  const progress = useProgress();
  const [params] = useSearchParams();
  // Learned problems with key lines, due and weak ones weighted up. Kept per game (see `run`).
  const pool = useMemo(() => keyLinePool(progress, PROBLEMS), [progress.problems]); // eslint-disable-line react-hooks/exhaustive-deps
  const linesOpen = pool.length >= KEY_LINES_MIN;
  const asked = params.get('game');
  const [picked, setPicked] = useState<Game>(() =>
    asked === 'lines' || asked === 'pattern' ? asked : progress.settings.blitzGame === 'lines' ? 'lines' : 'pattern',
  );
  // Key lines needs a few learned problems; until then the pattern game is the one on offer.
  const game: Game = picked === 'lines' && linesOpen ? 'lines' : 'pattern';
  const [zen, setZen] = useState(false);
  const [scope, setScope] = useState<'started' | 'all'>('all');
  // 0: the lobby; each new game gets a new number, so "Play again" starts from a clean slate.
  const [run, setRun] = useState(0);
  const [gamePool, setGamePool] = useState<KeyLineEntry[]>([]);

  const choose = (g: Game) => {
    setPicked(g);
    updateSettings({ blitzGame: g });
  };
  const start = () => {
    setGamePool(pool);
    setRun((r) => r + 1);
  };
  const again = () => {
    setGamePool(pool);
    setRun((r) => r + 1);
  };
  const menu = () => setRun(0);

  if (run === 0)
    return (
      <Lobby
        game={game}
        onGame={choose}
        pool={pool}
        zen={zen}
        onZen={setZen}
        scope={scope}
        onScope={setScope}
        onStart={start}
      />
    );
  if (game === 'lines') return <LinesGame key={run} zen={zen} pool={gamePool} onAgain={again} onMenu={menu} />;
  return <PatternGame key={run} zen={zen} scope={scope} onAgain={again} onMenu={menu} />;
}

// ── Lobby ───────────────────────────────────────────────────────────────────

function Lobby({
  game,
  onGame,
  pool,
  zen,
  onZen,
  scope,
  onScope,
  onStart,
}: {
  game: Game;
  onGame: (g: Game) => void;
  pool: KeyLineEntry[];
  zen: boolean;
  onZen: (zen: boolean) => void;
  scope: 'started' | 'all';
  onScope: (s: 'started' | 'all') => void;
  onStart: () => void;
}) {
  const progress = useProgress();
  const nav = useNavigate();
  const lines = game === 'lines';
  const startedUnits = PROBLEMS.filter((p) => unitProgress(progress, p.category).learned > 0);
  const startedLocked = startedUnits.length < 8;
  const linesOpen = pool.length >= KEY_LINES_MIN;
  const need = KEY_LINES_MIN - pool.length;
  const lineCount = pool.reduce((n, e) => n + e.lines.length, 0);
  const next = nextStep(progress);
  const { blitzBest, blitzPlays, blitzCodeBest, blitzCodePlays } = progress.stats;
  const best = lines ? blitzCodeBest : blitzBest;
  const plays = lines ? blitzCodePlays : blitzPlays;
  const xpEach = lines ? XP.blitzCodePerCorrect : XP.blitzPerCorrect;
  // "Pick first, then type": a round on a problem whose code is still new is picked from options.
  const typingMode = progress.settings.typingMode;
  const newCount = pool.filter((e) => isNewCode(progress.problems[e.p.id])).length;
  /** Every round will be picked: Always pick, or nothing learned well enough yet to type. */
  const allPick = typingMode === 'tap' || (typingMode === 'auto' && pool.length > 0 && newCount === pool.length);
  /** Some rounds will be picked (Pick first, then type): the lobby says which. */
  const somePick = typingMode === 'auto' && newCount > 0;
  const verb = allPick ? 'Pick' : 'Type';
  // Picked lines earn less XP and do not count toward the best (only typed lines do).
  const xpRule = !lines
    ? `Each correct answer also earns ${xpEach} XP.`
    : allPick
      ? `Each correct line also earns ${XP.blitzCodePickPerCorrect} XP. Picked lines don't count toward your best.`
      : somePick
        ? `Each correct line also earns ${xpEach} XP typed, ${XP.blitzCodePickPerCorrect} picked. Only typed lines count toward your best.`
        : `Each correct line also earns ${xpEach} XP.`;

  return (
    <SessionShell progress={null} onClose={() => nav('/')} title="Pattern Blitz">
      <div className="blitz-lobby">
        <header className="blitz-hero">
          <IconTile icon={Zap} size="lg" />
          <h1>Pattern Blitz</h1>
          <p className="blitz-lede">
            {lines
              ? `${verb} the key line of solutions you've learned, from the code around it. Quick recall is how code sticks.`
              : `Read each problem and pick which of the ${CATEGORIES.length} patterns solves it. Spotting the pattern is half of every interview.`}
          </p>
        </header>

        <fieldset className="blitz-games">
          <legend className="blitz-games-label">Game</legend>
          <label className={`blitz-game ${!lines ? 'on' : ''}`}>
            <input type="radio" name="blitz-game" value="pattern" checked={!lines} onChange={() => onGame('pattern')} className="blitz-game-input" />
            <IconTile icon={ScanSearch} solid={!lines} />
            <span className="blitz-game-text">
              <span className="blitz-game-title">Spot the pattern</span>
              <span className="blitz-game-desc">Read a problem, pick its pattern.</span>
            </span>
            <span className="blitz-game-radio" aria-hidden="true" />
          </label>
          {linesOpen ? (
            <label className={`blitz-game ${lines ? 'on' : ''}`}>
              <input type="radio" name="blitz-game" value="lines" checked={lines} onChange={() => onGame('lines')} className="blitz-game-input" />
              <IconTile icon={CodeXml} solid={lines} />
              <span className="blitz-game-text">
                <span className="blitz-game-title">Key lines</span>
                <span className="blitz-game-desc">{verb} the line that makes a solution work.</span>
              </span>
              <span className="blitz-game-radio" aria-hidden="true" />
            </label>
          ) : (
            <div className="blitz-game is-locked">
              <input
                type="radio"
                name="blitz-game"
                value="lines"
                id="blitz-game-lines"
                disabled
                aria-describedby="blitz-lines-lock"
                className="blitz-game-input"
              />
              <span className="blitz-game-lock">
                <IconTile icon={Lock} color="var(--text-tertiary)" />
              </span>
              <span className="blitz-game-text">
                <label htmlFor="blitz-game-lines" className="blitz-game-title">
                  Key lines
                </label>
                <span className="blitz-game-desc" id="blitz-lines-lock">
                  Opens once you've learned {KEY_LINES_MIN} problems. {need} to go.
                </span>
              </span>
              <Link to={next.href} className="btn btn-secondary btn-sm blitz-game-cta">
                {next.kind === 'problem' ? 'Learn a problem' : 'Continue learning'}
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          )}
        </fieldset>

        <div className="blitz-stats">
          <StatCard
            icon="trophy"
            accent="var(--xp)"
            label="Personal best"
            value={
              best > 0 ? (
                best
              ) : (
                <>
                  <span aria-hidden="true">—</span>
                  <span className="sr-only">None yet</span>
                </>
              )
            }
            meta={best > 0 ? 'Points in a timed round' : 'Not set yet'}
          />
          <StatCard icon="timer" label="Games played" value={plays} meta="Timed rounds" />
        </div>

        <section className="card pad-0 blitz-setup" aria-label="Game setup">
          <div className="blitz-setting">
            <div className="blitz-setting-text">
              <div className="blitz-setting-label" id="blitz-mode-label">
                Mode
              </div>
              <div className="blitz-setting-help">
                {lines
                  ? zen
                    ? `${ZEN_LINES} lines, no clock. Each comes with a hint.`
                    : `${DURATION.lines} seconds. ${verb} as many lines as you can.`
                  : zen
                    ? `${ZEN_QUESTIONS} questions, no clock. Each miss shows its clues.`
                    : `${DURATION.pattern} seconds. Score as many as you can.`}
              </div>
            </div>
            <div className="seg blitz-seg" role="radiogroup" aria-labelledby="blitz-mode-label">
              <button type="button" role="radio" aria-checked={!zen} className={!zen ? 'on' : ''} onClick={() => onZen(false)}>
                <Timer aria-hidden="true" />
                Timed
              </button>
              <button type="button" role="radio" aria-checked={zen} className={zen ? 'on' : ''} onClick={() => onZen(true)}>
                <Leaf aria-hidden="true" />
                Zen
              </button>
            </div>
          </div>

          {lines ? (
            <div className="blitz-setting">
              <div className="blitz-setting-text">
                <div className="blitz-setting-label">Lines</div>
                <div className="blitz-setting-help">
                  {lineCount} key lines from the {pool.length} problems you've learned. Due and weak ones come up more.
                </div>
                {somePick && (
                  <div className="blitz-setting-note">
                    <ListChecks aria-hidden="true" />
                    {allPick ? "You're still learning these, so each line shows choices." : "Problems you're still learning show choices."}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="blitz-setting">
              <div className="blitz-setting-text">
                <div className="blitz-setting-label" id="blitz-scope-label">
                  Questions
                </div>
                <div className="blitz-setting-help">
                  {scope === 'started' && !startedLocked
                    ? `${startedUnits.length} problems from units you've started.`
                    : startedLocked
                      ? `All ${PROBLEMS.length} problems for now. Learn a few more to narrow it to your units.`
                      : `All ${PROBLEMS.length} problems, every pattern mixed.`}
                </div>
              </div>
              <div className="seg blitz-seg" role="radiogroup" aria-labelledby="blitz-scope-label">
                <button type="button" role="radio" aria-checked={scope === 'all'} className={scope === 'all' ? 'on' : ''} onClick={() => onScope('all')}>
                  All {PROBLEMS.length}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={scope === 'started'}
                  className={scope === 'started' ? 'on' : ''}
                  onClick={() => onScope('started')}
                  disabled={startedLocked}
                >
                  Units I've started
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="blitz-rules" aria-label="How scoring works">
          <div className="blitz-rule">
            <span className="blitz-rule-icon">
              <Check aria-hidden="true" />
            </span>
            <div>
              <div className="blitz-rule-title">{POINTS} points a hit</div>
              <div className="blitz-rule-body">{xpRule}</div>
            </div>
          </div>
          <div className="blitz-rule">
            <span className="blitz-rule-icon">
              <TrendingUp aria-hidden="true" />
            </span>
            <div>
              <div className="blitz-rule-title">Streaks multiply</div>
              <div className="blitz-rule-body">Every 3 in a row adds ×1, up to ×4.</div>
            </div>
          </div>
          <div className="blitz-rule">
            <span className="blitz-rule-icon">
              <Repeat2 aria-hidden="true" />
            </span>
            <div>
              <div className="blitz-rule-title">Misses come back</div>
              <div className="blitz-rule-body">{lines ? 'Problems you miss' : 'Learned problems you miss'} join your next review.</div>
            </div>
          </div>
        </section>
      </div>

      {/* Enter starts the round, like the primary action in every other session. */}
      <ActionBar
        status="idle"
        onContinue={onStart}
        continueLabel="Start"
        primaryIcon={<Play aria-hidden="true" />}
        primaryClassName="blitz-start"
        step={game}
        secondary={
          <span className="blitz-kbd-hint">
            {lines && allPick ? (
              <>
                Press <KeyRange /> to pick each line
              </>
            ) : lines && somePick ? (
              <>
                Type and press <Kbd>Enter</Kbd>, or press <KeyRange /> to pick
              </>
            ) : lines ? (
              <>
                Type each line, then press <Kbd>Enter</Kbd>
              </>
            ) : (
              <>
                On a keyboard, press <KeyRange /> to answer
              </>
            )}
          </span>
        }
      />
    </SessionShell>
  );
}

// ── Spot the pattern ────────────────────────────────────────────────────────

function PatternGame({ zen, scope, onAgain, onMenu }: { zen: boolean; scope: 'started' | 'all'; onAgain: () => void; onMenu: () => void }) {
  const progress = useProgress();
  const nav = useNavigate();
  const [phase, setPhase] = useState<'play' | 'over'>('play');
  const [queue] = useState<Problem[]>(() => {
    const started = PROBLEMS.filter((p) => unitProgress(progress, p.category).learned > 0);
    return shuffle(scope === 'started' && started.length >= 8 ? started : PROBLEMS);
  });
  const [qi, setQi] = useState(0);
  const [options, setOptions] = useState<CategoryId[]>(() => patternChoices(queue[0]).options);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [flash, setFlash] = useState<{ picked: CategoryId; ok: boolean } | null>(null);
  const [pops, setPops] = useState<{ id: number; text: string }[]>([]);
  const [newBest, setNewBest] = useState(false);
  // Display only: the best before this round, for the results subtitle.
  const [prevBest] = useState(progress.stats.blitzBest);

  const current = queue[qi];
  const finish = useCallback(() => setPhase('over'), []);
  const timeLeft = useCountdown(phase === 'play' && !zen, DURATION.pattern, finish);

  // Settle rewards once when the game ends.
  const settled = useRef(false);
  useEffect(() => {
    if (phase !== 'over' || settled.current) return;
    settled.current = true;
    const correct = answers.filter((a) => a.ok).length;
    // Missed a problem you have learned? It joins today's review queue (one learned today waits for tomorrow's).
    answers.filter((a) => !a.ok).forEach((a) => flagForReview(a.p.id));
    const isBest = zen ? false : recordBlitz(score);
    setNewBest(isBest && score > 0);
    recordAnswers(answers.length, correct, best);
    awardXp(correct * XP.blitzPerCorrect, 'blitz');
    sfx('complete');
    if (isBest && score > 0) confetti();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (c: CategoryId) => {
    if (!current || flash || phase !== 'play') return;
    const ok = acceptedCategories(current).includes(c);
    const nextStreak = ok ? streak + 1 : 0;
    const gained = ok ? POINTS * multiplier(nextStreak) : 0;
    setStreak(nextStreak);
    setBest((b) => Math.max(b, nextStreak));
    setScore((s) => s + gained);
    setAnswers((a) => [...a, { p: current, picked: c, ok }]);
    setFlash({ picked: c, ok });
    sfx(ok ? 'correct' : 'wrong', nextStreak);
    if (ok) setPops((ps) => [...ps.slice(-3), { id: Date.now(), text: `+${gained}` }]);
    const answered = answers.length + 1;
    setTimeout(
      () => {
        setFlash(null);
        if (zen && answered >= ZEN_QUESTIONS) {
          finish();
          return;
        }
        const ni = (qi + 1) % queue.length;
        setQi(ni);
        setOptions(patternChoices(queue[ni]).options);
      },
      ok ? 350 : zen ? 2600 : 1100,
    );
  };

  // Keyboard: 1–4.
  const answerRef = useRef(answer);
  answerRef.current = answer;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (phase === 'play' && n >= 1 && n <= options.length) answerRef.current(options[n - 1]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [phase, options]);

  // ── Results ───────────────────────────────────────────────────────────────
  if (phase === 'over') {
    const correct = answers.filter((a) => a.ok).length;
    const misses = answers.filter((a) => !a.ok);
    const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 0;
    const summary = `${accuracy}% accuracy, longest streak ${best}.`;
    const subtitle =
      answers.length === 0
        ? 'No answers this round, so nothing was scored.'
        : newBest
          ? `${summary} ${prevBest > 0 ? `Up from ${prevBest}.` : 'Your first recorded best.'}`
          : zen
            ? `${summary} Zen rounds don't affect your best.`
            : `${summary} Your best is ${progress.stats.blitzBest}.`;
    return (
      <SessionShell progress={1} onClose={() => nav('/')} title="Pattern Blitz">
        <div className="blitz-results">
          <Completion
            icon={newBest ? Trophy : zen ? Leaf : Timer}
            tone={newBest ? 'warning' : 'brand'}
            title={newBest ? 'New personal best' : zen ? 'Zen round complete' : "Time's up"}
            subtitle={subtitle}
            stats={
              answers.length === 0
                ? undefined
                : [
                    { label: 'Score', value: score },
                    {
                      label: 'Correct',
                      value: (
                        <>
                          {correct}
                          <span className="blitz-of">/{answers.length}</span>
                        </>
                      ),
                    },
                    {
                      label: 'XP earned',
                      value: `+${correct * XP.blitzPerCorrect}`,
                    },
                  ]
            }
          >
            <ResultActions onAgain={onAgain} onMenu={onMenu} />
          </Completion>

          {misses.length > 0 ? (
            <section className="blitz-misses">
              <SectionHeader
                title={
                  <>
                    Learn from the misses
                    <span className="badge badge-danger tabular blitz-count">{misses.length}</span>
                  </>
                }
                sub="Misses on problems you've learned join your next review."
              />
              <div className="list">
                {misses.map((m, i) => {
                  const right = CATEGORY_BY_ID[m.p.category];
                  const picked = CATEGORY_BY_ID[m.picked];
                  return (
                    <Link key={i} to={`/p/${m.p.id}`} className="list-row blitz-miss">
                      <CategoryIcon id={right.id} color={right.color} size="sm" />
                      <div className="grow">
                        <div className="title blitz-miss-title" title={m.p.title}>
                          {m.p.title}
                        </div>
                        <div className="blitz-picks">
                          <span className="blitz-pick is-wrong">
                            <X aria-hidden="true" />
                            <span className="sr-only">You picked </span>
                            <span className="blitz-pick-name">{picked.name}</span>
                          </span>
                          <span className="blitz-picks-answer">
                            <ArrowRight className="blitz-picks-arrow" aria-hidden="true" />
                            <span className="blitz-pick is-right">
                              <Check aria-hidden="true" />
                              <span className="sr-only">Correct pattern </span>
                              {right.name}
                            </span>
                          </span>
                        </div>
                        <div className="blitz-clues">
                          <span className="blitz-clues-label">Clues</span>
                          <Clues p={m.p} />
                        </div>
                      </div>
                      <ChevronRight className="chevron" size={16} aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : answers.length > 0 ? (
            <div className="callout callout-success blitz-clean">
              <CircleCheck aria-hidden="true" />
              <span>No misses this round. Every pattern you picked was right.</span>
            </div>
          ) : null}
        </div>
      </SessionShell>
    );
  }

  // ── Play ──────────────────────────────────────────────────────────────────
  const mult = multiplier(streak);
  const tone = toneFor(zen, timeLeft);
  const questionNo = flash ? answers.length : answers.length + 1;
  return (
    <SessionShell
      progress={zen ? answers.length / ZEN_QUESTIONS : timeLeft / DURATION.pattern}
      progressColor={tone === 'calm' ? undefined : TONE_COLOR[tone]}
      progressLinear={!zen}
      onClose={finish}
      title="Pattern Blitz"
    >
      <div className={`blitz-play is-${tone}`}>
        <Hud
          score={score}
          streak={streak}
          pops={pops}
          zen={zen}
          timeLeft={timeLeft}
          duration={DURATION.pattern}
          tone={tone}
          done={answers.length}
          total={ZEN_QUESTIONS}
          current={questionNo}
          unit="Question"
        />

        {current && (
          <>
            <div className="blitz-round" key={current.id}>
              <div className="blitz-q-head">
                <span className="kicker">Which pattern solves this?</span>
                <span className="blitz-q-count tabular">{zen ? `Question ${Math.min(questionNo, ZEN_QUESTIONS)} of ${ZEN_QUESTIONS}` : `Question ${questionNo}`}</span>
              </div>
              <ProblemPrompt p={current} compact showTitle={false} />
            </div>

            <div className="choices two-col blitz-choices" role="group" aria-label="Pattern options">
              {options.map((c, i) => {
                const cat = CATEGORY_BY_ID[c];
                let cls = '';
                let mark: ReactNode = null;
                if (flash) {
                  if (acceptedCategories(current).includes(c)) {
                    cls = 'correct';
                    mark = <Check strokeWidth={2.4} />;
                  } else if (c === flash.picked) {
                    cls = 'wrong shake';
                    mark = <X strokeWidth={2.4} />;
                  }
                }
                return (
                  <button key={c} type="button" className={`choice blitz-choice ${cls}`} onClick={() => answer(c)} disabled={!!flash}>
                    <span className="num">{i + 1}</span>
                    <CategoryIcon id={c} color={cat.color} size="sm" />
                    <span className="grow blitz-choice-name">{cat.name}</span>
                    <span className="choice-mark" aria-hidden="true">
                      {mark}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className={`blitz-feedback ${flash ? (flash.ok ? 'is-correct' : 'is-wrong') : 'is-idle'}`} role="status" aria-live="polite">
              {!flash && (
                <span className="blitz-feedback-hint">
                  Press <KeyRange /> to answer
                </span>
              )}
              {flash?.ok && (
                <>
                  <CircleCheck className="blitz-feedback-icon" strokeWidth={2.2} aria-hidden="true" />
                  <span className="blitz-feedback-title">Correct</span>
                  <span className="blitz-feedback-gain tabular">+{POINTS * mult}</span>
                  {mult > 1 && <span className="blitz-feedback-meta">×{mult} multiplier</span>}
                </>
              )}
              {flash && !flash.ok && (
                <>
                  <CircleX className="blitz-feedback-icon" strokeWidth={2.2} aria-hidden="true" />
                  <div className="grow blitz-feedback-body">
                    <div className="blitz-feedback-line">
                      <span className="blitz-feedback-label">Answer</span>
                      <span className="blitz-feedback-title">{CATEGORY_BY_ID[current.category].name}</span>
                    </div>
                    <div className="blitz-feedback-pattern">
                      <span className="blitz-feedback-problem">{current.title}:</span> {current.pattern}
                    </div>
                    {zen && (
                      <div className="blitz-feedback-clues">
                        <span className="blitz-clues-label">Clues</span>
                        <Clues p={current} />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </SessionShell>
  );
}

/** The results screen's buttons, the same for both games. */
function ResultActions({ onAgain, onMenu }: { onAgain: () => void; onMenu: () => void }) {
  return (
    <>
      <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onAgain}>
        <RotateCcw aria-hidden="true" />
        Play again
      </button>
      <Link to="/" className="btn btn-secondary btn-lg btn-block">
        Back to dashboard
      </Link>
      <button type="button" className="btn btn-quiet btn-block" onClick={onMenu}>
        <LayoutGrid aria-hidden="true" />
        Choose a game
      </button>
    </>
  );
}

// ── Key lines ───────────────────────────────────────────────────────────────

interface LineRound {
  ref: KeyLineRef;
  p: Problem;
  view: KeyLineView;
  /**
   * How this round takes the line: typed, or picked from four options while the problem's code is
   * still new (`problemInput`). "Type instead" turns a picked round into a typed one before its check.
   */
  input: CodeInput;
  /** Seed for the options of a picked round: new each time a line comes up, so the right option moves. */
  seed: number;
}

interface LineAnswer extends LineRound {
  /** What was typed or picked at the first check ('' when the answer was shown first). */
  typed: string;
  ok: boolean;
  /** "Show answer" instead of a check. */
  shown: boolean;
}

/** What the strip under the code says about the last check. */
type LineFlash = { kind: 'correct'; gained: number; mult: number; next: string; id: number } | { kind: 'fixed'; next: string; id: number };

const roundFor = (ref: KeyLineRef): LineRound => {
  const p = PROBLEM_BY_ID[ref.id];
  const progress = getProgress();
  return {
    ref,
    p,
    view: keyLineView(p, ref.line),
    input: problemInput(progress.settings.typingMode, progress.problems[ref.id]),
    seed: Math.floor(Math.random() * 2 ** 31),
  };
};

function LinesGame({ zen, pool, onAgain, onMenu }: { zen: boolean; pool: KeyLineEntry[]; onAgain: () => void; onMenu: () => void }) {
  const progress = useProgress();
  const nav = useNavigate();
  const [phase, setPhase] = useState<'play' | 'over'>('play');

  // Rotation: every key line once before any comes back, never the same problem twice in a row,
  // and a problem missed this game a little more often.
  const used = useRef(new Set<string>());
  const missed = useRef(new Set<string>());
  const pick = (last: KeyLineRef | null): LineRound => {
    const n = nextKeyLine(pool, used.current, last, { bonus: (id) => (missed.current.has(id) ? 1 : 0) });
    if (!n) throw new Error('Key lines needs learned problems');
    if (n.reset) used.current.clear();
    used.current.add(refKey(n.ref));
    return roundFor(n.ref);
  };
  const [round, setRound] = useState<LineRound>(() => pick(null));
  const [roundNo, setRoundNo] = useState(1);
  // The typed text, or the picked option once a picked round is checked.
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);
  // After "Fix and check again": checks no longer score, a right fix moves on.
  const [fixing, setFixing] = useState(false);
  const [checks, setChecks] = useState(0);
  // A picked round: the slot whose options are open (the one slot, unless Escape closed it).
  const [open, setOpen] = useState<number | null>(0);
  const [answers, setAnswers] = useState<LineAnswer[]>([]);
  const [score, setScore] = useState(0);
  // Points from typed lines only: the Key lines best counts these (a pick is a tap from four).
  const [typedScore, setTypedScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longest, setLongest] = useState(0);
  const [pops, setPops] = useState<{ id: number; text: string }[]>([]);
  const [flash, setFlash] = useState<LineFlash | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [prevBest] = useState(progress.stats.blitzCodeBest);
  const gapsRef = useRef<CodeGapsHandle>(null);
  const pickRef = useRef<PickGapsHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const picking = round.input === 'pick';

  const finish = useCallback(() => setPhase('over'), []);
  const timeLeft = useCountdown(phase === 'play' && !zen, DURATION.lines, finish);

  // A picked first round: its options take focus, as a typed round's gap does (autoFocus).
  useEffect(() => {
    if (round.input === 'pick') pickRef.current?.focusOptions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // A picked round: its options on screen, above the action bar. On a short phone the HUD scrolls
  // away for them (the session bar still shows the clock); elsewhere nothing moves.
  useEffect(() => {
    if (!picking || revealed) return;
    const raf = requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>('.pick-panel-row')?.scrollIntoView({ block: 'nearest' }));
    return () => cancelAnimationFrame(raf);
  }, [roundNo, picking]); // eslint-disable-line react-hooks/exhaustive-deps

  // A miss: bring the right line into view above the action bar (a short phone screen would
  // otherwise hide it under the feedback). After the bar has grown, as it sets the scroll padding.
  useEffect(() => {
    if (!revealed) return;
    const target = rootRef.current?.querySelector<HTMLElement>('.gaps .diff.add');
    if (!target) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => target.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }));
    });
    return () => cancelAnimationFrame(raf);
  }, [revealed, checks]);

  const settled = useRef(false);
  useEffect(() => {
    if (phase !== 'over' || settled.current) return;
    settled.current = true;
    const correct = answers.filter((a) => a.ok).length;
    // Every key-line problem is learned: a miss pulls it into today's review.
    new Set(answers.filter((a) => !a.ok).map((a) => a.p.id)).forEach((id) => flagForReview(id));
    const isBest = zen ? false : recordBlitzCode(typedScore);
    setNewBest(isBest && typedScore > 0);
    recordAnswers(answers.length, correct, longest);
    awardXp(linesXp(answers), 'blitz');
    sfx('complete');
    if (isBest && typedScore > 0) confetti();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const { view } = round;
  // The options of a picked round, stable for the round (a fix shows the same ones).
  const choice = useMemo(() => (picking ? keyLineChoices(round.p, round.ref.line, view, round.seed) : null), [picking, round, view]);
  // Zen gives each line a hint: what the line does, from the solution's own explanation (as a
  // comment). Timed rounds keep the window short and the cue to the code itself. A stable array
  // per round, so the gap's hint is measured once, not on every keystroke.
  const hints = useMemo(() => (zen && view.explain ? [`# ${plain(view.explain)}`] : true), [zen, view.explain]);

  /**
   * The next round (or the results, after the last Zen line), inside this key press or click: the
   * gap (or the options) keeps or takes focus in the same event, so a phone keeps its keyboard
   * open between typed lines. `flashFor` says what the strip under the code reports about the
   * round just played.
   */
  const advance = (answered: number, flashFor?: (next: LineRound) => LineFlash) => {
    if (zen && answered >= ZEN_LINES) {
      finish();
      return;
    }
    const next = pick(round.ref);
    flushSync(() => {
      setFlash(flashFor ? flashFor(next) : null);
      setRound(next);
      setRoundNo((n) => n + 1);
      setValue('');
      setRevealed(false);
      setFixing(false);
      setChecks(0);
      setOpen(0);
    });
    if (next.input === 'pick') pickRef.current?.focusOptions();
    else gapsRef.current?.focus();
  };

  const miss = (typed: string, shown: boolean) => {
    missed.current.add(round.p.id);
    setAnswers((a) => [...a, { ...round, typed, ok: false, shown }]);
    setStreak(0);
    setFlash(null);
    setRevealed(true);
    sfx('wrong');
  };

  /** Check a line: what is typed (Enter, Check), or an option the moment it is picked. Same rules for both. */
  const check = (line = value) => {
    if (phase !== 'play' || revealed || !line.trim()) return;
    const ok = gradeGaps([line], [view.answer]).perfect;
    setValue(line);
    setChecks((c) => c + 1);
    if (fixing) {
      // Practice only: the first check already counted.
      if (!ok) {
        setRevealed(true);
        sfx('wrong');
        return;
      }
      sfx('correct');
      advance(answers.length, (next) => ({ kind: 'fixed', next: next.p.title, id: Date.now() }));
      return;
    }
    if (!ok) {
      miss(line, false);
      return;
    }
    const nextStreak = streak + 1;
    const mult = multiplier(nextStreak);
    const gained = POINTS * mult;
    const answered = answers.length + 1;
    setAnswers((a) => [...a, { ...round, typed: line, ok: true, shown: false }]);
    setStreak(nextStreak);
    setLongest((b) => Math.max(b, nextStreak));
    setScore((s) => s + gained);
    if (round.input === 'type') setTypedScore((s) => s + gained);
    setPops((ps) => [...ps.slice(-3), { id: Date.now(), text: `+${gained}` }]);
    sfx('correct', nextStreak);
    advance(answered, (next) => ({ kind: 'correct', gained, mult, next: next.p.title, id: Date.now() }));
  };

  // "Fix and check again": the gap comes back with the typed text, in this click, so a phone
  // opens its keyboard. A picked round opens its options again, nothing picked: the next pick checks.
  const fix = () => {
    flushSync(() => {
      setRevealed(false);
      setFixing(true);
      if (picking) {
        setValue('');
        setOpen(0);
      }
    });
    if (picking) pickRef.current?.focusOptions();
    else gapsRef.current?.focus();
  };

  // "Type instead" (Pick first, then type, before the round's check): this round becomes a typed one.
  const typeInstead = () => {
    flushSync(() => setRound((r) => ({ ...r, input: 'type' })));
    gapsRef.current?.focus();
  };

  // ── Results ───────────────────────────────────────────────────────────────
  if (phase === 'over') {
    const correct = answers.filter((a) => a.ok).length;
    const misses = answers.filter((a) => !a.ok);
    const picked = answers.filter((a) => a.input === 'pick').length;
    const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 0;
    const bestNow = progress.stats.blitzCodeBest;
    // Which lines were picked, when some were: they score the same points, but only typed lines
    // count toward the best, so a timed round says what its typed lines scored.
    const how =
      picked === 0
        ? ''
        : picked === answers.length
          ? ` Every line was picked from choices.${zen ? '' : " Picked lines don't count toward your best."}`
          : ` ${picked} picked from choices, ${answers.length - picked} typed.${zen ? '' : ` Typed lines scored ${typedScore} toward your best.`}`;
    const summary = `${correct} of ${answers.length} line${answers.length === 1 ? '' : 's'} right, longest streak ${longest}.${how}`;
    const subtitle =
      answers.length === 0
        ? 'No lines checked this round, so nothing was scored.'
        : newBest
          ? `${summary} ${prevBest > 0 ? `Up from ${prevBest}.` : 'Your first recorded best.'}`
          : zen
            ? `${summary} Zen rounds don't affect your best.`
            : summary;
    return (
      <SessionShell progress={1} onClose={() => nav('/')} title="Key lines">
        <div className="blitz-results">
          <Completion
            icon={newBest ? Trophy : zen ? Leaf : Timer}
            tone={newBest ? 'warning' : 'brand'}
            title={newBest ? 'New personal best' : zen ? 'Zen round complete' : "Time's up"}
            subtitle={subtitle}
            stats={
              answers.length === 0
                ? undefined
                : [
                    { label: 'Score', value: score },
                    { label: 'Accuracy', value: `${accuracy}%` },
                    {
                      label: 'Best',
                      value:
                        bestNow > 0 ? (
                          bestNow
                        ) : (
                          <>
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">None yet</span>
                          </>
                        ),
                    },
                    { label: 'XP earned', value: `+${linesXp(answers)}` },
                  ]
            }
          >
            <ResultActions onAgain={onAgain} onMenu={onMenu} />
          </Completion>

          {misses.length > 0 ? (
            <section className="blitz-misses">
              <SectionHeader
                title={
                  <>
                    Lines to practice
                    <span className="badge badge-danger tabular blitz-count">{misses.length}</span>
                  </>
                }
                sub={missesSub(progress, misses)}
              />
              <ul className="blitz-lmisses">
                {misses.map((m, i) => (
                  <LineMiss key={i} m={m} />
                ))}
              </ul>
            </section>
          ) : answers.length > 0 ? (
            <div className="callout callout-success blitz-clean">
              <CircleCheck aria-hidden="true" />
              <span>No misses this round. Every line {picked ? 'was' : 'you typed was'} right.</span>
            </div>
          ) : null}
        </div>
      </SessionShell>
    );
  }

  // ── Play ──────────────────────────────────────────────────────────────────
  const tone = toneFor(zen, timeLeft);
  const lineNo = view.start + view.gap;
  // The round on screen: already counted once its first check is done.
  const current = Math.max(1, revealed || fixing ? answers.length : answers.length + 1);
  const cat = CATEGORY_BY_ID[round.p.category];
  const last = answers[answers.length - 1];
  const shown = revealed && !fixing && last?.shown;
  // "Type instead": Pick first, then type only, before the round's check.
  const canType = picking && progress.settings.typingMode === 'auto' && !revealed && !fixing;
  const kicker = fixing ? 'Fix the line' : picking ? 'Pick the missing line' : 'Type the missing line';
  const footNote = revealed ? (picking ? 'Your pick, then the right line' : 'Your line, then the right one') : cat.name;

  return (
    <SessionShell
      progress={zen ? answers.length / ZEN_LINES : timeLeft / DURATION.lines}
      progressColor={tone === 'calm' ? undefined : TONE_COLOR[tone]}
      progressLinear={!zen}
      onClose={finish}
      title="Key lines"
    >
      <div ref={rootRef} className={`blitz-lines is-${tone}`} data-input={round.input}>
        <Hud
          score={score}
          streak={streak}
          pops={pops}
          zen={zen}
          timeLeft={timeLeft}
          duration={DURATION.lines}
          tone={tone}
          done={answers.length}
          total={ZEN_LINES}
          current={current}
          unit="Round"
        />

        <div className="blitz-q-head">
          <span className="kicker">{kicker}</span>
          <span className="blitz-q-count tabular">
            {zen ? `Round ${Math.min(current, ZEN_LINES)} of ${ZEN_LINES}` : `Round ${current}`}
          </span>
        </div>
        <div className="blitz-lines-head" key={roundNo}>
          <CategoryIcon id={cat.id} color={cat.color} size="sm" />
          <h1 className="blitz-lines-title">{round.p.title}</h1>
          <DifficultyChip d={round.p.difficulty} />
        </div>

        {/* The status bar names the pattern while playing; after a miss the action bar says the rest */}
        <TyperWindow
          status={revealed ? 'wrong' : 'idle'}
          filename="solution.py"
          className={`blitz-lines-code ${picking ? 'pick-window' : ''}`}
          footer={<GapsFooter note={footNote} keys={revealed || picking ? false : 'Enter to check'} />}
        >
          {view.head.length > 0 && (
            <CodePane className="blitz-code-head">
              {view.head.map((h, i) => (
                <HeadRow key={`${roundNo}:${h.n}`} n={h.n} text={h.text} fold={i > 0 && h.n > view.head[i - 1].n + 1} />
              ))}
              <Fold />
            </CodePane>
          )}
          {picking && choice ? (
            <PickGaps
              key={roundNo}
              ref={pickRef}
              lines={view.lines}
              gaps={[view.gap]}
              choices={[choice]}
              values={[value]}
              active={open}
              onActivate={setOpen}
              // A pick is the answer, as in Spot the pattern: it is checked right away.
              onPick={(_, o) => check(o)}
              revealed={revealed}
              // Zen's hint (what the line does) heads the options, whole and wrapping on a phone,
              // rather than cut short inside the slot.
              hints={zen && view.explain ? false : hints}
              prompt={zen && view.explain ? plain(view.explain) : undefined}
              start={view.start}
              label={`${round.p.title}, code with line ${lineNo} to pick`}
            />
          ) : (
            <CodeGaps
              ref={gapsRef}
              lines={view.lines}
              gaps={[view.gap]}
              values={[value]}
              onChange={(v) => setValue(v[0] ?? '')}
              revealed={revealed}
              onSubmit={() => check()}
              autoFocus
              start={view.start}
              hints={hints}
              label={`${round.p.title}, code with line ${lineNo} missing`}
            />
          )}
        </TyperWindow>

        <div className={`blitz-feedback blitz-lines-feedback ${flash ? 'is-correct' : 'is-idle'}`} role="status" aria-live="polite">
          {flash?.kind === 'correct' && (
            <span className="blitz-flash" key={flash.id}>
              <CircleCheck className="blitz-feedback-icon" strokeWidth={2.2} aria-hidden="true" />
              <span className="blitz-feedback-title">Correct</span>
              <span className="blitz-feedback-gain tabular">+{flash.gained}</span>
              {flash.mult > 1 && <span className="blitz-feedback-meta">×{flash.mult} multiplier</span>}
              <span className="sr-only">. Next: {flash.next}.</span>
            </span>
          )}
          {flash?.kind === 'fixed' && (
            <span className="blitz-flash" key={flash.id}>
              <CircleCheck className="blitz-feedback-icon" strokeWidth={2.2} aria-hidden="true" />
              <span className="blitz-feedback-title">Fixed</span>
              <span className="blitz-feedback-meta">No points for a fix, but it helps it stick.</span>
              <span className="sr-only"> Next: {flash.next}.</span>
            </span>
          )}
          {!flash && <span className="blitz-lines-hint">{picking ? 'Your pick is checked right away.' : "Spacing and quote style don't matter."}</span>}
        </div>
      </div>

      <ActionBar
        status={revealed ? 'wrong' : 'idle'}
        step={`${roundNo}:${checks}:${round.input}`}
        // A picked round checks on the pick itself: Check stays off and says what to do.
        canCheck={!picking && value.trim().length > 0}
        checkLabel={picking ? 'Pick a line' : 'Check'}
        onCheck={() => check()}
        onContinue={() => advance(answers.length)}
        continueLabel={zen && answers.length >= ZEN_LINES ? 'See results' : 'Continue'}
        title={shown ? 'The missing line' : fixing ? 'Still not quite' : undefined}
        feedback={
          revealed &&
          view.explain && (
            <div className="blitz-fb">
              <span className="blitz-fb-label">This part</span>
              <span>{inline(view.explain)}</span>
            </div>
          )
        }
        secondary={
          fixing ? (
            // The round already counted: a fix is optional, so it can be left for the next line.
            <button type="button" className="btn btn-quiet btn-sm blitz-show" onClick={() => advance(answers.length)} aria-label="Skip to the next line">
              <SkipForward aria-hidden="true" />
              <span aria-hidden="true">Skip</span>
            </button>
          ) : picking ? (
            // Nothing to give up on while picking; in Pick first, then type the line can be typed instead.
            canType ? <InputSwitch to="type" onClick={typeInstead} className="blitz-switch" /> : undefined
          ) : (
            <button
              type="button"
              className="btn btn-quiet btn-sm blitz-show"
              onClick={() => miss(value, true)}
              aria-label="Show answer (counts as a miss)"
            >
              <Eye aria-hidden="true" />
              <span aria-hidden="true">Show answer</span>
            </button>
          )
        }
        checkedSecondary={
          last?.shown && !fixing ? (
            <CheckedAction onClick={fix} label="Type it now" short="Type it" />
          ) : (
            <CheckedAction onClick={fix} />
          )
        }
      />
    </SessionShell>
  );
}

/** Markdown explanation as a plain comment: no backticks or emphasis marks. */
function plain(md: string): string {
  return md.replace(/\*\*|__|`/g, '').replace(/(^|\W)[*_](\S[^*_]*)[*_](?=\W|$)/g, '$1$2');
}

/** A def / class line that encloses the blank, shown above the window. */
function HeadRow({ n, text, fold }: { n: number; text: string; fold: boolean }) {
  return (
    <>
      {fold && <Fold />}
      <CodeLine n={n} className="given">
        {highlightLine(text)}
      </CodeLine>
    </>
  );
}

/** Code left out between two shown lines, like an editor's folded region. */
function Fold() {
  return (
    <div className="typer-line blitz-fold" aria-hidden="true">
      <span className="typer-ln">⋮</span>
      <span className="typer-src">⋯</span>
    </div>
  );
}

/** Key lines XP: each line right on the first check, at the typed rate or the (lower) picked rate. */
function linesXp(answers: readonly LineAnswer[]): number {
  return answers.reduce((n, a) => n + (!a.ok ? 0 : a.input === 'pick' ? XP.blitzCodePickPerCorrect : XP.blitzCodePerCorrect), 0);
}

/**
 * Under the missed lines: when they come back (today's review, or the next one for a problem
 * learned or lapsed today), and the next step in the words of how Code from memory will take each
 * problem's code: "Write" when every one is typed, else "Practice".
 */
function missesSub(progress: Progress, misses: readonly LineAnswer[]): string {
  const ids = [...new Set(misses.map((m) => m.p.id))];
  const t = today();
  const when = ids.every((id) => (progress.problems[id]?.srs?.due ?? t) <= t) ? "today's review" : 'your next review';
  const typed = sharedInput(progress.settings.typingMode, ids.map((id) => progress.problems[id])) === 'type';
  return `These problems join ${when}. ${typed ? 'Write' : 'Practice'} one from memory to lock it in.`;
}

/** A missed key line on the results screen: the problem, what was typed or picked, the right line. */
function LineMiss({ m }: { m: LineAnswer }) {
  const progress = useProgress();
  // Code from memory picks the code while it is new: the button's icon says which it will be.
  const MemoryIcon = problemInput(progress.settings.typingMode, progress.problems[m.p.id]) === 'pick' ? ListChecks : Keyboard;
  const cat = CATEGORY_BY_ID[m.p.category];
  const n = m.view.start + m.view.gap;
  const typed = m.typed.trim();
  return (
    <li className="blitz-lmiss">
      <div className="blitz-lmiss-head">
        <CategoryIcon id={cat.id} color={cat.color} size="sm" />
        <div className="blitz-lmiss-text">
          <div className="blitz-lmiss-title">{m.p.title}</div>
          <div className="blitz-lmiss-meta">
            {cat.name} · line {n}
            {m.input === 'pick' && ' · picked'}
          </div>
        </div>
        <Link to={`/p/${m.p.id}/rebuild`} className="btn btn-secondary btn-sm blitz-lmiss-cta" aria-label={`Code from memory: ${m.p.title}`}>
          <MemoryIcon aria-hidden="true" />
          Code from memory
        </Link>
      </div>
      <CodePane className="blitz-lmiss-code">
        <CodeLine sign="del" signLabel={m.input === 'pick' ? 'Your pick: ' : undefined} className="diff del">
          {typed ? typed : <span className="gaps-empty">{m.shown ? 'answer shown' : 'left blank'}</span>}
        </CodeLine>
        <CodeLine sign="add" className="diff add">
          {highlightLine(m.view.answer.trim())}
        </CodeLine>
      </CodePane>
    </li>
  );
}
