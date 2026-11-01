// Pattern Blitz: 60 seconds of rapid-fire "which pattern is this?".
// Pure discrimination practice across all units — the skill interviews test.

import '../styles/pages/blitz.css';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleCheck,
  CircleX,
  Flame,
  Leaf,
  Play,
  Repeat2,
  RotateCcw,
  Timer,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { CATEGORIES, CATEGORY_BY_ID } from '../content/categories';
import { PROBLEMS } from '../content/index';
import type { CategoryId, Problem } from '../content/types';
import { confetti } from '../lib/confetti';
import { acceptedCategories, patternChoices } from '../lib/drills';
import { XP } from '../lib/game';
import { inline } from '../lib/markdown';
import { shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { awardXp, flagForReview, recordAnswers, recordBlitz, useProgress } from '../lib/store';
import { unitProgress } from '../lib/path';
import { SessionShell } from '../components/Shell';
import { CategoryIcon, IconTile } from '../components/icons';
import { ActionBar, ProblemPrompt } from '../components/interact';
import { Completion, Kbd, Ring, SectionHeader, StatCard } from '../components/ui';

const DURATION = 60;
const ZEN_QUESTIONS = 20;

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

export function Blitz() {
  const progress = useProgress();
  const nav = useNavigate();
  const [phase, setPhase] = useState<'intro' | 'play' | 'over'>('intro');
  const [scope, setScope] = useState<'started' | 'all'>('all');
  const [zen, setZen] = useState(false);
  const startedUnits = PROBLEMS.filter((p) => unitProgress(progress, p.category).learned > 0);
  const pool = scope === 'started' && startedUnits.length >= 8 ? startedUnits : PROBLEMS;

  const [queue, setQueue] = useState<Problem[]>([]);
  const [qi, setQi] = useState(0);
  const [options, setOptions] = useState<CategoryId[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [flash, setFlash] = useState<{ picked: CategoryId; ok: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [pops, setPops] = useState<{ id: number; text: string }[]>([]);
  const [newBest, setNewBest] = useState(false);
  const endAt = useRef(0);

  const current = queue[qi];

  const start = () => {
    const q = shuffle(pool);
    setQueue(q);
    setQi(0);
    setOptions(patternChoices(q[0]).options);
    setScore(0);
    setStreak(0);
    setBest(0);
    setAnswers([]);
    setFlash(null);
    setTimeLeft(DURATION);
    endAt.current = performance.now() + DURATION * 1000;
    setPhase('play');
  };

  const finish = useCallback(() => {
    setPhase('over');
  }, []);

  // Settle rewards once when the game ends.
  const settled = useRef(false);
  useEffect(() => {
    if (phase !== 'over' || settled.current) return;
    settled.current = true;
    const correct = answers.filter((a) => a.ok).length;
    // Missed a problem you have learned? It joins today's review queue.
    answers.filter((a) => !a.ok).forEach((a) => flagForReview(a.p.id));
    const isBest = zen ? false : recordBlitz(score);
    setNewBest(isBest && score > 0);
    recordAnswers(answers.length, correct, best);
    awardXp(correct * XP.blitzPerCorrect, 'blitz');
    sfx('complete');
    if (isBest && score > 0) confetti();
  }, [phase]); // eslint-disable-line
  useEffect(() => {
    if (phase === 'play') settled.current = false;
  }, [phase]);
  // Display only: the best before this round, for the results subtitle.
  const prevBest = useRef(progress.stats.blitzBest);
  useEffect(() => {
    if (phase === 'play') prevBest.current = progress.stats.blitzBest;
  }, [phase]); // eslint-disable-line

  useEffect(() => {
    if (phase !== 'play' || zen) return;
    let lastWhole = DURATION;
    const id = window.setInterval(() => {
      const left = Math.max(0, (endAt.current - performance.now()) / 1000);
      setTimeLeft(left);
      const whole = Math.ceil(left);
      if (whole !== lastWhole && whole <= 5 && whole > 0) sfx('tick');
      lastWhole = whole;
      if (left <= 0) {
        window.clearInterval(id);
        finish();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, finish, zen]);

  const answer = (c: CategoryId) => {
    if (!current || flash) return;
    const ok = acceptedCategories(current).includes(c);
    const nextStreak = ok ? streak + 1 : 0;
    const gained = ok ? 10 * multiplier(nextStreak) : 0;
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

  // ── Lobby ─────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    const { blitzBest, blitzPlays } = progress.stats;
    const startedLocked = startedUnits.length < 8;
    return (
      <SessionShell progress={null} onClose={() => nav('/')} title="Pattern Blitz">
        <div className="blitz-lobby">
          <header className="blitz-hero">
            <IconTile icon={Zap} size="lg" />
            <h1>Pattern Blitz</h1>
            <p className="blitz-lede">
              Read each problem and pick which of the {CATEGORIES.length} patterns solves it. Spotting the pattern is half of every interview.
            </p>
          </header>

          <div className="blitz-stats">
            <StatCard
              icon="trophy"
              accent="var(--xp)"
              label="Personal best"
              value={
                blitzBest > 0 ? (
                  blitzBest
                ) : (
                  <>
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">None yet</span>
                  </>
                )
              }
              meta={blitzBest > 0 ? 'Points in a timed round' : 'Not set yet'}
            />
            <StatCard icon="timer" label="Games played" value={blitzPlays} meta="Timed rounds" />
          </div>

          <section className="card pad-0 blitz-setup" aria-label="Game setup">
            <div className="blitz-setting">
              <div className="blitz-setting-text">
                <div className="blitz-setting-label" id="blitz-mode-label">
                  Mode
                </div>
                <div className="blitz-setting-help">
                  {zen ? `${ZEN_QUESTIONS} questions, no clock. Each miss shows its clues.` : `${DURATION} seconds. Score as many as you can.`}
                </div>
              </div>
              <div className="seg blitz-seg" role="radiogroup" aria-labelledby="blitz-mode-label">
                <button type="button" role="radio" aria-checked={!zen} className={!zen ? 'on' : ''} onClick={() => setZen(false)}>
                  <Timer aria-hidden="true" />
                  Timed
                </button>
                <button type="button" role="radio" aria-checked={zen} className={zen ? 'on' : ''} onClick={() => setZen(true)}>
                  <Leaf aria-hidden="true" />
                  Zen
                </button>
              </div>
            </div>

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
                <button type="button" role="radio" aria-checked={scope === 'all'} className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>
                  All {PROBLEMS.length}
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={scope === 'started'}
                  className={scope === 'started' ? 'on' : ''}
                  onClick={() => setScope('started')}
                  disabled={startedLocked}
                >
                  Units I've started
                </button>
              </div>
            </div>
          </section>

          <section className="blitz-rules" aria-label="How scoring works">
            <div className="blitz-rule">
              <span className="blitz-rule-icon">
                <Check aria-hidden="true" />
              </span>
              <div>
                <div className="blitz-rule-title">10 points a hit</div>
                <div className="blitz-rule-body">Each correct answer also earns {XP.blitzPerCorrect} XP.</div>
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
                <div className="blitz-rule-body">Learned problems you miss join today's review.</div>
              </div>
            </div>
          </section>
        </div>

        {/* Enter starts the round, like the primary action in every other session. */}
        <ActionBar
          status="idle"
          onContinue={start}
          continueLabel="Start"
          primaryIcon={<Play aria-hidden="true" />}
          primaryClassName="blitz-start"
          secondary={
            <span className="blitz-kbd-hint">
              On a keyboard, press <KeyRange /> to answer
            </span>
          }
        />
      </SessionShell>
    );
  }

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
          ? `${summary} ${prevBest.current > 0 ? `Up from ${prevBest.current}.` : 'Your first recorded best.'}`
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
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={start}>
              <RotateCcw aria-hidden="true" />
              Play again
            </button>
            <Link to="/" className="btn btn-secondary btn-lg btn-block">
              Back to dashboard
            </Link>
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
                sub="Misses on problems you've learned are added to today's review."
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
  const tone: Tone = zen ? 'calm' : timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : 'calm';
  const questionNo = flash ? answers.length : answers.length + 1;
  const pips = mult >= 4 ? 3 : streak % 3;
  const secs = Math.ceil(timeLeft);
  return (
    <SessionShell
      progress={zen ? answers.length / ZEN_QUESTIONS : timeLeft / DURATION}
      progressColor={tone === 'calm' ? undefined : TONE_COLOR[tone]}
      progressLinear={!zen}
      onClose={() => setPhase('over')}
      title="Pattern Blitz"
    >
      <div className={`blitz-play is-${tone}`}>
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
              <HudRing value={answers.length / ZEN_QUESTIONS} tone="calm" label={`Question ${Math.min(questionNo, ZEN_QUESTIONS)} of ${ZEN_QUESTIONS}`}>
                <span className="blitz-ring-num is-small">
                  {Math.min(questionNo, ZEN_QUESTIONS)}
                  <span className="blitz-ring-of">/{ZEN_QUESTIONS}</span>
                </span>
              </HudRing>
            ) : (
              <HudRing value={timeLeft / DURATION} tone={tone} label={`${secs} seconds left`}>
                <span className="blitz-ring-num">{secs}</span>
                <span className="blitz-ring-unit">sec</span>
              </HudRing>
            )}
          </div>
        </div>

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
                  <span className="blitz-feedback-gain tabular">+{10 * mult}</span>
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
