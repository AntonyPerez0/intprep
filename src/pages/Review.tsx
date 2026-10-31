import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORY_BY_ID } from '../content/categories';
import { PROBLEM_BY_ID } from '../content/index';
import type { CategoryId } from '../content/types';
import { confetti } from '../lib/confetti';
import { friendlyDue } from '../lib/date';
import { cardsForProblem, DRILL_LABEL, type DrillCardSpec } from '../lib/drills';
import { XP } from '../lib/game';
import { interleave, shuffle } from '../lib/random';
import { gradeFrom, type Grade } from '../lib/srs';
import { sfx } from '../lib/sound';
import { awardXp, dueProblemIds, finishSession, getProgress, learnedIds, recordAnswers, reviewProblem, useProgress } from '../lib/store';
import { Drill, type DrillResult } from '../components/Drills';
import { SessionShell } from '../components/Shell';

const MAX_DUE = 10;
const MAX_EXTRA = 6;

type Mode = { kind: 'due' } | { kind: 'ahead' } | { kind: 'unit'; cat: CategoryId };

function buildDeck(mode: Mode): { ids: string[]; deck: DrillCardSpec[] } {
  const p = getProgress();
  let ids: string[];
  if (mode.kind === 'unit') {
    ids = shuffle(CATEGORY_BY_ID[mode.cat].problemIds.filter((id) => p.problems[id]?.learnedAt)).slice(0, 8);
  } else {
    const due = dueProblemIds(p);
    if (mode.kind === 'due' && due.length) ids = due.slice(0, MAX_DUE);
    else
      ids = learnedIds(p)
        .sort((a, b) => (p.problems[a].srs!.due < p.problems[b].srs!.due ? -1 : 1))
        .slice(0, MAX_EXTRA);
  }
  ids = ids.filter((id) => PROBLEM_BY_ID[id]);
  const perProblem = mode.kind === 'due' ? 3 : 2;
  const deck = interleave(
    ids.flatMap((id) => cardsForProblem(PROBLEM_BY_ID[id], perProblem)),
    (c) => c.problemId,
  );
  // Always open each problem with pattern recognition before deeper recall.
  const seen = new Set<string>();
  const ordered: DrillCardSpec[] = [];
  const pending = [...deck];
  while (pending.length) {
    const i = pending.findIndex((c) => seen.has(c.problemId) || c.kind === 'pattern');
    const [c] = pending.splice(i === -1 ? 0 : i, 1);
    seen.add(c.problemId);
    ordered.push(c);
  }
  return { ids, deck: ordered };
}

interface Tally {
  correct: number;
  total: number;
  self?: Grade;
  remaining: number;
}

export function Review() {
  const [params] = useSearchParams();
  const unit = params.get('unit') as CategoryId | null;
  const ahead = params.get('ahead') === '1';
  const mode: Mode = unit && CATEGORY_BY_ID[unit] ? { kind: 'unit', cat: unit } : ahead ? { kind: 'ahead' } : { kind: 'due' };
  const key = `${mode.kind}:${unit ?? ''}`;
  return <ReviewSession key={key} mode={mode} />;
}

function ReviewSession({ mode }: { mode: Mode }) {
  const nav = useNavigate();
  const progress = useProgress();
  const [{ ids, deck: initialDeck }] = useState(() => buildDeck(mode));
  const [deck, setDeck] = useState(initialDeck);
  const [dueAtStart] = useState(() => new Set(dueProblemIds(getProgress())));
  const firstTotal = initialDeck.length;
  const [i, setI] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0); // first-attempt correct answers
  const [xp, setXp] = useState(0);
  const [tally, setTally] = useState<Record<string, Tally>>(() => {
    const t: Record<string, Tally> = {};
    for (const c of initialDeck) {
      t[c.problemId] ??= { correct: 0, total: 0, remaining: 0 };
      t[c.problemId].remaining += 1;
    }
    return t;
  });
  const [grades, setGrades] = useState<Record<string, Grade>>({});
  const [done, setDone] = useState(false);
  const [popKey, setPopKey] = useState(0);

  const title = mode.kind === 'unit' ? `${CATEGORY_BY_ID[mode.cat].icon} ${CATEGORY_BY_ID[mode.cat].name} practice` : mode.kind === 'ahead' ? 'Practise ahead' : 'Daily review';

  const onDone = useMemo(
    () => (r: DrillResult) => {
      const card = deck[i];
      const nextCombo = r.correct ? combo + 1 : 0;
      setCombo(nextCombo);
      setBestCombo((b) => Math.max(b, nextCombo));

      // XP: full for due problems, half for practising ahead, a little for retries.
      let gained = 0;
      if (r.correct) {
        const base = card.retry ? XP.drillCorrect / 2 : dueAtStart.has(card.problemId) ? XP.drillCorrect : XP.drillCorrect / 2;
        gained = Math.round(base + (nextCombo >= 5 ? XP.comboBonus : 0));
        if (nextCombo > 0 && nextCombo % 5 === 0) {
          sfx('combo');
          setPopKey((k) => k + 1);
        }
      }
      const newXp = xp + gained;
      setXp(newXp);

      let nextDeck = deck;
      let firstCorrect = correct;
      if (!card.retry) {
        if (r.correct) firstCorrect += 1;
        setCorrect(firstCorrect);
        const t = { ...tally[card.problemId] };
        t.total += 1;
        t.remaining -= 1;
        if (r.correct) t.correct += 1;
        if (r.selfGrade) t.self = r.selfGrade;
        setTally((all) => ({ ...all, [card.problemId]: t }));
        if (t.remaining === 0) {
          const g = gradeFrom(t.correct, t.total, t.self);
          reviewProblem(card.problemId, g);
          setGrades((gs) => ({ ...gs, [card.problemId]: g }));
        }
        // Missed it? It comes back later in this session (relearning step).
        if (!r.correct) {
          nextDeck = [...deck, { ...card, uid: `${card.uid}:retry`, retry: true }];
          setDeck(nextDeck);
        }
      }

      if (i + 1 < nextDeck.length) {
        setI(i + 1);
        window.scrollTo(0, 0);
      } else {
        const perfect = firstCorrect === firstTotal;
        const earned = newXp + XP.sessionBonus;
        setXp(earned);
        recordAnswers(firstTotal, firstCorrect, Math.max(bestCombo, nextCombo));
        finishSession(perfect);
        awardXp(earned, 'review');
        setDone(true);
        sfx('complete');
        confetti();
      }
    },
    [deck, i, combo, tally, correct, xp, bestCombo, dueAtStart, firstTotal],
  );

  if (!deck.length) {
    return (
      <SessionShell progress={0} onClose={() => nav('/')}>
        <div className="empty">
          <div className="e-icon">🌱</div>
          <h2>Nothing to review yet</h2>
          <p className="muted">Learn your first problem and it will join your spaced-repetition deck. Reviews appear right when you are about to forget.</p>
          <div className="stack" style={{ maxWidth: 320, margin: '0 auto' }}>
            <Link to="/learn" className="btn btn-green btn-block">
              Go to the path
            </Link>
            <Link to="/blitz" className="btn btn-ghost btn-block">
              Play Pattern Blitz
            </Link>
          </div>
        </div>
      </SessionShell>
    );
  }

  if (done) {
    const acc = Math.round((correct / Math.max(1, firstTotal)) * 100);
    return (
      <SessionShell progress={1} onClose={() => nav('/')}>
        <div className="complete">
          <div className="trophy">{acc === 100 ? '🏆' : acc >= 80 ? '🎉' : '💪'}</div>
          <h1 style={{ marginTop: 12 }}>{acc === 100 ? 'Flawless review!' : 'Review complete!'}</h1>
          <p className="muted">Every review pushes these problems deeper into long-term memory.</p>
          <div className="reward-tiles">
            <div className="reward" style={{ ['--c' as string]: 'var(--gold)' }}>
              <div className="rk">XP</div>
              <div className="rv">+{xp}</div>
            </div>
            <div className="reward" style={{ ['--c' as string]: 'var(--green)' }}>
              <div className="rk">Accuracy</div>
              <div className="rv">{acc}%</div>
            </div>
            <div className="reward" style={{ ['--c' as string]: 'var(--orange)' }}>
              <div className="rk">Best combo</div>
              <div className="rv">{bestCombo}</div>
            </div>
          </div>
          <div className="list" style={{ textAlign: 'left', marginBottom: 20 }}>
            {ids.map((id) => {
              const g = grades[id];
              const pp = progress.problems[id];
              const label = { again: 'Relearn soon', hard: 'Shaky', good: 'Solid', easy: 'Easy' }[g ?? 'good'];
              const color = { again: 'var(--red)', hard: 'var(--orange)', good: 'var(--green)', easy: 'var(--blue)' }[g ?? 'good'];
              return (
                <Link to={`/p/${id}`} className="list-row" key={id}>
                  <span style={{ fontSize: '1.2rem' }}>{CATEGORY_BY_ID[PROBLEM_BY_ID[id].category].icon}</span>
                  <div className="grow">
                    <div className="title">{PROBLEM_BY_ID[id].title}</div>
                    <div className="tiny muted">{pp?.srs ? `Next review ${friendlyDue(pp.srs.due)}` : ''}</div>
                  </div>
                  <span className="chip" style={{ color, borderColor: color }}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="stack" style={{ maxWidth: 360, margin: '0 auto' }}>
            <Link to="/" className="btn btn-green btn-block">
              Continue
            </Link>
            <Link to="/blitz" className="btn btn-ghost btn-block">
              ⚡ Pattern Blitz
            </Link>
          </div>
        </div>
      </SessionShell>
    );
  }

  const card = deck[i];
  const p = PROBLEM_BY_ID[card.problemId];
  return (
    <SessionShell
      progress={i / deck.length}
      onClose={() => nav('/')}
      right={
        <span key={popKey} className={`combo ${popKey ? 'pop' : ''}`} title="Combo: answers right in a row">
          {combo >= 2 ? `⚡${combo}` : ''}
        </span>
      }
    >
      <Drill
        key={card.uid}
        kind={card.kind}
        problem={p}
        onDone={onDone}
        combo={combo}
        kicker={`${card.retry ? 'Try again' : title} · ${DRILL_LABEL[card.kind]} · ${i + 1}/${deck.length}`}
      />
    </SessionShell>
  );
}
