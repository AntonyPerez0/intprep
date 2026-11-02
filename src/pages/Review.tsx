import '../styles/pages/review.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Brain, CalendarCheck, CircleCheck, GraduationCap, Keyboard, Repeat2, RotateCcw, Trophy, Zap, type LucideIcon } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CATEGORY_BY_ID } from '../content/categories';
import { PROBLEM_BY_ID, PROBLEMS } from '../content/index';
import type { CategoryId } from '../content/types';
import { KEY_LINES_MIN, keyLinePool } from '../lib/blitzLines';
import { confetti } from '../lib/confetti';
import { holdToasts } from '../lib/events';
import { daysBetween, parseDay, today } from '../lib/date';
import { cardsForProblem, orderDeck, retryCard, SESSION_PROBLEMS, type DrillCardSpec } from '../lib/drills';
import { XP } from '../lib/game';
import { problemInput } from '../lib/input';
import { shuffle } from '../lib/random';
import { gradeFrom, type Grade } from '../lib/srs';
import { sfx } from '../lib/sound';
import { awardXp, dueProblemIds, finishSession, getProgress, learnedIds, recordAnswers, reviewProblem, useProgress } from '../lib/store';
import { Drill, type DrillResult } from '../components/Drills';
import { SessionShell } from '../components/Shell';
import { CategoryIcon, IconTile } from '../components/icons';
import { Badge, Completion, EmptyState } from '../components/ui';

const { due: MAX_DUE, ahead: MAX_AHEAD, unit: MAX_UNIT } = SESSION_PROBLEMS;

type Mode = { kind: 'due' } | { kind: 'ahead' } | { kind: 'unit'; cat: CategoryId };

function buildDeck(mode: Mode): { ids: string[]; deck: DrillCardSpec[] } {
  const p = getProgress();
  let ids: string[];
  if (mode.kind === 'unit') {
    ids = shuffle(CATEGORY_BY_ID[mode.cat].problemIds.filter((id) => p.problems[id]?.learnedAt)).slice(0, MAX_UNIT);
  } else {
    const due = dueProblemIds(p);
    if (mode.kind === 'due' && due.length) ids = due.slice(0, MAX_DUE);
    else
      ids = learnedIds(p)
        .sort((a, b) => (p.problems[a].srs!.due < p.problems[b].srs!.due ? -1 : 1))
        .slice(0, MAX_AHEAD);
  }
  ids = ids.filter((id) => PROBLEM_BY_ID[id]);
  // Interleaved across problems; each problem opens with its recognition card (see orderDeck).
  const deck = orderDeck(
    shuffle(ids).map((id) => {
      const pp = p.problems[id];
      // The coding cards follow the problem's schedule; each review rotates to other lines. In
      // "Pick first, then type", a problem whose code is still new is picked (problemInput).
      return cardsForProblem(PROBLEM_BY_ID[id], { srs: pp?.srs, round: pp?.reviews ?? 0, input: problemInput(p.settings.typingMode, pp) });
    }),
  );
  return { ids, deck };
}

interface Tally {
  correct: number;
  total: number;
  /** Coding cards that were nearly right on the first check: they count as half right. */
  near: number;
  self?: Grade;
  remaining: number;
}

/**
 * A typed coding card missed by a little: at least 3 lines in 4 right on the first check, or one
 * line wrong in two or more. It counts as half right toward the problem's grade, so a typo is not
 * scheduled like a blank recall. A key line (one line) is all or nothing, "Show answer" with
 * nothing typed has no line right, and picked cards have no partial credit, so those stay a miss.
 */
function nearMiss(r: DrillResult): boolean {
  const l = r.lines;
  if (r.correct || !r.coded || !l || l.total < 2) return false;
  return l.correct / l.total >= 0.75 || l.total - l.correct === 1;
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
      t[c.problemId] ??= { correct: 0, total: 0, near: 0, remaining: 0 };
      t[c.problemId].remaining += 1;
    }
    return t;
  });
  const [grades, setGrades] = useState<Record<string, Grade>>({});
  // Code written on the first check of each coding card: lines right, out of how many.
  const [code, setCode] = useState({ correct: 0, total: 0 });
  const [done, setDone] = useState(false);
  const [popKey, setPopKey] = useState(0);
  // Every card is saved as it is answered (XP, streak, answers, and each problem's schedule once
  // its cards are done), so closing early keeps the work. The rewards' toasts wait for the end
  // (or the close), so none covers a card.
  const release = useRef<() => void>(() => {});
  useEffect(() => {
    release.current = holdToasts();
    return () => release.current();
  }, []);

  const title = mode.kind === 'unit' ? `${CATEGORY_BY_ID[mode.cat].name} practice` : mode.kind === 'ahead' ? 'Practice ahead' : 'Daily review';

  const onDone = useMemo(
    () => (r: DrillResult) => {
      const card = deck[i];
      const nextCombo = r.correct ? combo + 1 : 0;
      setCombo(nextCombo);
      setBestCombo((b) => Math.max(b, nextCombo));

      // XP: code written right on the first check earns the most, code picked right next, then
      // recognition; full for due problems, half for practicing ahead, half for retries.
      let gained = 0;
      if (r.correct) {
        const full = r.input === 'pick' ? XP.pickCorrect : r.coded ? XP.codeCorrect : XP.drillCorrect;
        const base = card.retry ? full / 2 : dueAtStart.has(card.problemId) ? full : full / 2;
        gained = Math.round(base + (nextCombo >= 5 ? XP.comboBonus : 0));
        if (nextCombo > 0 && nextCombo % 5 === 0) {
          sfx('combo');
          setPopKey((k) => k + 1);
        }
      }
      const newXp = xp + gained;
      setXp(newXp);
      awardXp(gained, 'review');

      let nextDeck = deck;
      let firstCorrect = correct;
      if (!card.retry) {
        if (r.correct) firstCorrect += 1;
        setCorrect(firstCorrect);
        const lines = r.lines;
        if (lines) setCode((c) => ({ correct: c.correct + lines.correct, total: c.total + lines.total }));
        recordAnswers(1, r.correct ? 1 : 0, nextCombo);
        const t = { ...tally[card.problemId] };
        t.total += 1;
        t.remaining -= 1;
        if (r.correct) t.correct += 1;
        else if (nearMiss(r)) t.near += 1;
        if (r.selfGrade) t.self = r.selfGrade;
        setTally((all) => ({ ...all, [card.problemId]: t }));
        if (t.remaining === 0) {
          const g = gradeFrom(t.correct + t.near / 2, t.total, t.self);
          // Practice ahead and unit practice are optional: a miss on a problem that was not due
          // never resets its schedule (Daily review only holds due problems).
          reviewProblem(card.problemId, g, dueAtStart.has(card.problemId) ? {} : { lapse: false });
          setGrades((gs) => ({ ...gs, [card.problemId]: g }));
        }
        // Missed it? It comes back later in this session (relearning step); a coding card comes
        // back as a fresh instance (other gaps, another key line or part).
        if (!r.correct) {
          nextDeck = [...deck, retryCard(PROBLEM_BY_ID[card.problemId], card, deck)];
          setDeck(nextDeck);
        }
      }

      if (i + 1 < nextDeck.length) {
        setI(i + 1);
        window.scrollTo(0, 0);
      } else {
        const perfect = firstCorrect === firstTotal;
        setXp(newXp + XP.sessionBonus);
        finishSession(perfect);
        awardXp(XP.sessionBonus, 'review');
        release.current();
        setDone(true);
        sfx('complete');
        confetti();
      }
    },
    [deck, i, combo, tally, correct, xp, bestCombo, dueAtStart, firstTotal],
  );

  if (!deck.length) {
    const unitName = mode.kind === 'unit' ? CATEGORY_BY_ID[mode.cat].name : null;
    return (
      <SessionShell progress={null} onClose={() => nav('/')} title={title}>
        <div className="review-empty">
          <h1 className="sr-only">{title}</h1>
          <EmptyState
            icon={CalendarCheck}
            title="Nothing to review yet"
            actions={
              <>
                <Link to="/learn" className="btn btn-primary">
                  Open learning path
                  <ArrowRight aria-hidden="true" />
                </Link>
                <Link to="/blitz" className="btn btn-secondary">
                  <Zap aria-hidden="true" />
                  Play Pattern Blitz
                </Link>
              </>
            }
          >
            {unitName
              ? `You haven't learned any ${unitName} problems yet. Learn one and it joins your spaced-repetition deck.`
              : 'Learn your first problem and it joins your spaced-repetition deck. Reviews are scheduled just before you are likely to forget.'}
          </EmptyState>
          <div className="eyebrow review-how-label" id="review-how-label">
            How Daily review works
          </div>
          <ol className="review-how" aria-labelledby="review-how-label">
            {HOW_IT_WORKS.map((s, k) => (
              <li key={s.title} className="review-how-step">
                <IconTile icon={s.icon} size="sm" />
                <div className="grow">
                  <div className="review-how-title">
                    <span className="review-how-num">{k + 1}</span>
                    {s.title}
                  </div>
                  <div className="review-how-body">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </SessionShell>
    );
  }

  if (done) {
    const acc = Math.round((correct / Math.max(1, firstTotal)) * 100);
    // Pattern Blitz's typing game (Key lines) opens at 3 learned problems.
    const keyLines = keyLinePool(progress, PROBLEMS).length >= KEY_LINES_MIN;
    const perfect = acc === 100;
    const wrote = code.total > 0;
    const codeLine = wrote ? ` You wrote ${code.correct} of ${code.total} lines of code right on the first check.` : '';
    return (
      <SessionShell progress={1} onClose={() => nav('/')} title={title}>
        <div className="review-done">
          <Completion
            icon={perfect ? Trophy : acc >= 80 ? CircleCheck : Repeat2}
            tone={perfect ? 'warning' : acc >= 80 ? 'success' : 'brand'}
            title="Review complete"
            subtitle={
              perfect ? (
                <>
                  Flawless: all {firstTotal} cards right on the first try{wrote ? `, ${code.total} lines of code included` : ''}. These problems now move
                  further out on your schedule.
                </>
              ) : (
                <>
                  {correct} of {firstTotal} cards right on the first try.{codeLine} Missed problems come back sooner, so they stick.
                </>
              )
            }
            stats={[
              { label: 'XP earned', value: `+${xp}` },
              { label: 'Accuracy', value: `${acc}%` },
              ...(wrote
                ? [
                    {
                      label: 'Lines written',
                      value: (
                        <>
                          <span aria-hidden="true">
                            {code.correct}
                            <span className="review-of">/{code.total}</span>
                          </span>
                          <span className="sr-only">
                            {code.correct} of {code.total} right
                          </span>
                        </>
                      ),
                    },
                  ]
                : []),
              { label: 'Best combo', value: bestCombo },
            ]}
          >
            <Link to="/" className="btn btn-primary btn-lg btn-block">
              Back to dashboard
            </Link>
            {keyLines ? (
              <Link to="/blitz?game=lines" className="btn btn-secondary btn-lg btn-block">
                <Keyboard aria-hidden="true" />
                Type key lines
              </Link>
            ) : (
              <Link to="/blitz" className="btn btn-secondary btn-lg btn-block">
                <Zap aria-hidden="true" />
                Play Pattern Blitz
              </Link>
            )}
          </Completion>

          <section className="review-results" aria-labelledby="review-results-title">
            <div className="review-results-head">
              <h2 id="review-results-title">Problems reviewed</h2>
              <span className="review-results-count tabular">{ids.length}</span>
            </div>
            <table className="review-table" aria-labelledby="review-results-title">
              <thead>
                <tr>
                  <th scope="col">Problem</th>
                  <th scope="col">Result</th>
                  <th scope="col" className="review-col-next">
                    Next review
                  </th>
                </tr>
              </thead>
              <tbody>
                {ids.map((id) => {
                  const prob = PROBLEM_BY_ID[id];
                  const cat = CATEGORY_BY_ID[prob.category];
                  const g = grades[id] ?? 'good';
                  const pp = progress.problems[id];
                  const next = pp?.srs ? nextReview(pp.srs.due) : null;
                  return (
                    <tr key={id}>
                      <td>
                        <Link to={`/p/${id}`} className="review-prob">
                          <CategoryIcon id={prob.category} color={cat.color} size="sm" />
                          <span className="review-prob-text">
                            <span className="review-prob-title">{prob.title}</span>
                            <span className="review-prob-meta review-meta-wide">
                              #{prob.num} · {cat.name}
                            </span>
                            <span className="review-prob-meta review-meta-narrow">
                              {next ? `Next review ${next.relative.toLowerCase()}` : `#${prob.num}`}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <Badge tone={GRADE_UI[g].tone} dot>
                          {GRADE_UI[g].label}
                        </Badge>
                      </td>
                      <td className="review-col-next">
                        {next ? (
                          <span className="review-next">
                            <span className="review-next-rel">{next.relative}</span>
                            <span className="review-next-date tabular">{next.date}</span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
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
      title={title}
      right={
        combo >= 2 ? (
          <span key={popKey} className={`review-combo ${popKey ? 'pop' : ''}`} title="Combo: answers right in a row">
            <Zap strokeWidth={2.2} aria-hidden="true" />
            {combo}
            <span className="sr-only"> correct in a row</span>
          </span>
        ) : undefined
      }
    >
      <h1 className="sr-only">{title}</h1>
      <Drill
        key={card.uid}
        kind={card.kind}
        problem={p}
        onDone={onDone}
        combo={combo}
        seed={card.seed}
        line={card.line}
        chunk={card.chunk}
        input={card.input}
        comesBack={!card.retry}
        badge={
          card.retry ? (
            <Badge tone="warning">
              <RotateCcw aria-hidden="true" />
              Try again
            </Badge>
          ) : undefined
        }
        meta={
          <span className="review-pos">
            {i + 1} <span className="review-of">of</span> {deck.length}
          </span>
        }
      />
    </SessionShell>
  );
}

/** "In 4 weeks" + "Sat, Nov 28": readable in a table, with the exact day for planning. */
function nextReview(key: string) {
  const d = daysBetween(today(), key);
  const n = (v: number, unit: string) => `In ${v} ${unit}${v === 1 ? '' : 's'}`;
  const relative =
    d <= 0 ? 'Due now' : d === 1 ? 'Tomorrow' : d < 7 ? n(d, 'day') : d < 30 ? n(Math.round(d / 7), 'week') : d < 365 ? n(Math.round(d / 30), 'month') : n(Math.round(d / 365), 'year');
  const date = parseDay(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  return { relative, date };
}

/** Same words and colors as the self-rating buttons ("Forgot", "Fuzzy", "Got it", "Easy"). */
const GRADE_UI: Record<Grade, { label: string; tone: 'danger' | 'warning' | 'success' | 'brand' }> = {
  again: { label: 'Forgot', tone: 'danger' },
  hard: { label: 'Fuzzy', tone: 'warning' },
  good: { label: 'Got it', tone: 'success' },
  easy: { label: 'Easy', tone: 'brand' },
};

const HOW_IT_WORKS: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: GraduationCap, title: 'Learn a problem', body: 'A guided lesson walks you from the prompt to working code.' },
  { icon: Brain, title: 'Recall it', body: 'Spot the pattern, then the code: pick its lines while they are new, type them once you know them.' },
  { icon: CalendarCheck, title: 'Space it out', body: 'Each good review pushes the next one further away.' },
];
