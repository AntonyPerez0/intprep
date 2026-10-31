// Pattern Blitz: 60 seconds of rapid-fire "which pattern is this?".
// Pure discrimination practice across all units — the skill interviews test.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORY_BY_ID } from '../content/categories';
import { PROBLEMS } from '../content/index';
import type { CategoryId, Problem } from '../content/types';
import { confetti } from '../lib/confetti';
import { acceptedCategories, patternChoices } from '../lib/drills';
import { XP } from '../lib/game';
import { inline, Md } from '../lib/markdown';
import { shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { awardXp, flagForReview, recordAnswers, recordBlitz, useProgress } from '../lib/store';
import { unitProgress } from '../lib/path';
import { SessionShell } from '../components/Shell';

const DURATION = 60;
const ZEN_QUESTIONS = 20;

interface Answer {
  p: Problem;
  picked: CategoryId;
  ok: boolean;
}

const multiplier = (streak: number) => Math.min(4, 1 + Math.floor(streak / 3));

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

  if (phase === 'intro') {
    return (
      <SessionShell progress={0} onClose={() => nav('/')}>
        <div className="complete">
          <div className="trophy">⚡</div>
          <h1 style={{ marginTop: 10 }}>Pattern Blitz</h1>
          <p className="muted" style={{ maxWidth: 480, margin: '0 auto 16px' }}>
            You get {DURATION} seconds. Read each problem and tap the pattern that solves it. Right answers in a row build a multiplier up to ×4. Learning to <em>spot</em> the pattern is
            half of every interview.
          </p>
          <div className="seg" style={{ marginBottom: 10 }}>
            <button type="button" className={!zen ? 'on' : ''} onClick={() => setZen(false)}>
              ⏱️ Timed
            </button>
            <button type="button" className={zen ? 'on' : ''} onClick={() => setZen(true)}>
              🧘 Zen ({ZEN_QUESTIONS} Qs, no timer)
            </button>
          </div>
          <br />
          <div className="seg" style={{ marginBottom: 18 }}>
            <button type="button" className={scope === 'all' ? 'on' : ''} onClick={() => setScope('all')}>
              All {PROBLEMS.length} problems
            </button>
            <button type="button" className={scope === 'started' ? 'on' : ''} onClick={() => setScope('started')} disabled={startedUnits.length < 8}>
              Units I've started
            </button>
          </div>
          <div className="card flat small" style={{ maxWidth: 420, margin: '0 auto 20px' }}>
            🏆 Personal best: <strong>{progress.stats.blitzBest}</strong> · Games played: {progress.stats.blitzPlays}
          </div>
          <button type="button" className="btn btn-orange" style={{ minWidth: 220 }} onClick={start}>
            Start
          </button>
          <div className="tiny faint" style={{ marginTop: 12 }}>
            Tip: on a keyboard, press <span className="kbd">1</span>–<span className="kbd">4</span>
          </div>
        </div>
      </SessionShell>
    );
  }

  if (phase === 'over') {
    const correct = answers.filter((a) => a.ok).length;
    const misses = answers.filter((a) => !a.ok);
    return (
      <SessionShell progress={1} onClose={() => nav('/')}>
        <div className="complete">
          <div className="trophy">{newBest ? '🏆' : '⏱️'}</div>
          <h1 style={{ marginTop: 10 }}>{newBest ? 'New personal best!' : zen ? 'Zen round done' : "Time's up!"}</h1>
          <div className="reward-tiles">
            <div className="reward" style={{ ['--c' as string]: 'var(--orange)' }}>
              <div className="rk">Score</div>
              <div className="rv">{score}</div>
            </div>
            <div className="reward" style={{ ['--c' as string]: 'var(--green)' }}>
              <div className="rk">Correct</div>
              <div className="rv">
                {correct}/{answers.length}
              </div>
            </div>
            <div className="reward" style={{ ['--c' as string]: 'var(--gold)' }}>
              <div className="rk">XP</div>
              <div className="rv">+{correct * XP.blitzPerCorrect}</div>
            </div>
          </div>
          {misses.length > 0 && (
            <div style={{ textAlign: 'left' }}>
              <h3>Learn from the misses</h3>
              <p className="small muted">Misses on problems you have learned are added to today's review.</p>
              <div className="stack" style={{ gap: 10, marginBottom: 20 }}>
                {misses.map((m, i) => (
                  <Link key={i} to={`/p/${m.p.id}`} className="card flat" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <div className="row between wrap">
                      <strong>{m.p.title}</strong>
                      <span className="small">
                        <span style={{ color: 'var(--red)', textDecoration: 'line-through' }}>{CATEGORY_BY_ID[m.picked].short}</span> →{' '}
                        <span style={{ color: 'var(--green)', fontWeight: 800 }}>{CATEGORY_BY_ID[m.p.category].short}</span>
                      </span>
                    </div>
                    <div className="small muted" style={{ marginTop: 4 }}>
                      Clues: {m.p.signals.map((s, k) => <span key={k}>{k > 0 && ' · '}{inline(s)}</span>)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="stack" style={{ maxWidth: 360, margin: '0 auto' }}>
            <button type="button" className="btn btn-orange btn-block" onClick={start}>
              Play again
            </button>
            <Link to="/" className="btn btn-ghost btn-block">
              Home
            </Link>
          </div>
        </div>
      </SessionShell>
    );
  }

  const mult = multiplier(streak);
  return (
    <SessionShell
      progress={zen ? answers.length / ZEN_QUESTIONS : timeLeft / DURATION}
      onClose={() => setPhase('over')}
      right={
        zen ? (
          <span className="timer">
            {answers.length}/{ZEN_QUESTIONS}
          </span>
        ) : (
          <span className={`timer ${timeLeft <= 10 ? 'low' : ''}`}>{Math.ceil(timeLeft)}s</span>
        )
      }
    >
      <div className="row between" style={{ marginBottom: 10, position: 'relative' }}>
        <div style={{ fontWeight: 900, fontSize: '1.4rem' }}>{score}</div>
        {pops.map((p) => (
          <span key={p.id} className="score-pop" style={{ left: 40, top: -6 }}>
            {p.text}
          </span>
        ))}
        <div className="combo" style={{ fontSize: '1.1rem' }}>
          {streak >= 2 && `🔥 ${streak}`} {mult > 1 && <span className="chip brand">×{mult}</span>}
        </div>
      </div>
      {current && (
        <>
          <div className="prompt-card" key={current.id} style={{ animation: 'rise .25s' }}>
            <Md text={current.prompt} />
            {current.examples[0] && (
              <div className="example">
                <div>
                  <span className="lbl">In: </span>
                  {current.examples[0].input}
                </div>
                <div>
                  <span className="lbl">Out: </span>
                  {current.examples[0].output}
                </div>
              </div>
            )}
          </div>
          <div className="choices two-col" style={{ marginTop: 14 }}>
            {options.map((c, i) => {
              let cls = '';
              if (flash) {
                if (acceptedCategories(current).includes(c)) cls = 'correct';
                else if (c === flash.picked) cls = 'wrong shake';
              }
              return (
                <button key={c} type="button" className={`choice ${cls}`} onClick={() => answer(c)} disabled={!!flash}>
                  <span className="num">{i + 1}</span>
                  <span className="choice-icon">{CATEGORY_BY_ID[c].icon}</span>
                  <span className="grow">{CATEGORY_BY_ID[c].name}</span>
                </button>
              );
            })}
          </div>
          {flash && !flash.ok && (
            <div className="hint-box small" style={{ marginTop: 12 }}>
              {current.title}: <strong>{current.pattern}</strong>
              {zen && (
                <div style={{ marginTop: 4 }}>
                  Clues: {current.signals.map((s, k) => <span key={k}>{k > 0 && ' · '}{inline(s)}</span>)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </SessionShell>
  );
}
