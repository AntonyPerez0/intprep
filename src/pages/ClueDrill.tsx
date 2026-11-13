// Clue words (/clues, /clues?cat=<pattern>): the wording in a problem statement that should make
// the learner reach for a pattern, drilled like flashcards and in both directions (lib/clues.ts):
// this wording, which pattern? this problem's clue phrases, which pattern? this pattern, which
// wording? A missed card comes back once at the end. Each pattern keeps its own score, and four
// right in a row marks its clue words as known (a step of the unit's "Memorize this pattern").

import '../styles/pages/drills.css';
import '../styles/pages/clues.css';
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Quote, RotateCcw, ScanSearch } from 'lucide-react';
import { CATEGORIES, CATEGORY_BY_ID } from '../content/categories';
import { CUES } from '../content/cues';
import type { CategoryId } from '../content/types';
import { buildClueDeck, CLUES_KNOWN, cluesKnown, retryClue, startedPatterns, type ClueCard } from '../lib/clues';
import { confetti } from '../lib/confetti';
import { holdToasts } from '../lib/events';
import { XP } from '../lib/game';
import { inline } from '../lib/markdown';
import { nextStep } from '../lib/path';
import { sfx } from '../lib/sound';
import { awardXp, getProgress, recordClue, useProgress } from '../lib/store';
import { CluePhrases } from '../components/Drills';
import { CategoryIcon } from '../components/icons';
import { ActionBar, Choices, type CheckStatus } from '../components/interact';
import { SessionShell } from '../components/Shell';
import { Completion, EmptyState } from '../components/ui';

export function ClueDrillRoute() {
  const [params] = useSearchParams();
  const cat = params.get('cat');
  const only = cat && CATEGORY_BY_ID[cat as CategoryId] ? (cat as CategoryId) : undefined;
  const nav = useNavigate();
  const progress = useProgress();
  // Without a pattern started, the drill would ask about all 18, which is guessing for someone who
  // has met none of them: say so first. (One pattern's own drill, opened from its unit, is a choice.)
  const [anyway, setAnyway] = useState(false);
  if (cat && !only) return <Navigate to="/clues" replace />;
  if (!only && !anyway && startedPatterns(progress).length === 0) {
    return (
      <SessionShell progress={null} onClose={() => nav('/')} title="Clue words">
        <EmptyState
          icon={Quote}
          title="Start a pattern first"
          actions={
            <>
              <Link to={nextStep(progress).href} className="btn btn-primary">
                Continue learning
              </Link>
              <button type="button" className="btn btn-secondary" onClick={() => setAnyway(true)}>
                Drill all {CATEGORIES.length} patterns anyway
              </button>
            </>
          }
        >
          Clue words drills the wording that points to each pattern you have started: you read a phrase from a problem and name the pattern. Each pattern’s intro
          teaches its clue words, so finish one and come back.
        </EmptyState>
      </SessionShell>
    );
  }
  return <ClueDrill key={only ?? 'all'} only={only} />;
}

function ClueDrill({ only }: { only?: CategoryId }) {
  const nav = useNavigate();
  const progress = useProgress();
  // Built once per round from the progress at its start; missed cards are added to its end.
  const [deck, setDeck] = useState<ClueCard[]>(() => buildClueDeck(getProgress(), only));
  const [firstCount, setFirstCount] = useState(deck.length);
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [right, setRight] = useState(0);
  const [xp, setXp] = useState(0);
  const [done, setDone] = useState(false);
  // First-try results per pattern, for the summary.
  const tally = useRef<Partial<Record<CategoryId, { right: number; total: number }>>>({});
  // Reward toasts (a streak, a goal) wait for the summary, so none covers a card or its button.
  const release = useRef<() => void>(() => {});
  useEffect(() => {
    release.current = holdToasts();
    return () => release.current();
  }, []);
  const back = only ? `/unit/${only}` : '/patterns';
  const title = only ? `Clue words · ${CATEGORY_BY_ID[only].name}` : 'Clue words';

  const again = () => {
    tally.current = {};
    const next = buildClueDeck(getProgress(), only);
    setDeck(next);
    setFirstCount(next.length);
    setI(0);
    setSel(null);
    setStatus('idle');
    setRight(0);
    setXp(0);
    setDone(false);
    release.current = holdToasts();
  };

  if (!deck.length) {
    return (
      <SessionShell progress={null} onClose={() => nav(back)} title={title}>
        <EmptyState icon={Quote} title="No clue words here yet" actions={<Link to="/patterns" className="btn btn-primary">Open the pattern guide</Link>}>
          This pattern has no clue words to drill yet.
        </EmptyState>
      </SessionShell>
    );
  }

  if (done) {
    const rows = (Object.entries(tally.current) as [CategoryId, { right: number; total: number }][]).sort((a, b) => a[1].right / a[1].total - b[1].right / b[1].total);
    const pct = Math.round((right / Math.max(1, firstCount)) * 100);
    return (
      <SessionShell progress={1} onClose={() => nav(back)} title={title}>
        <div className="clues-done">
          <Completion
            icon={ScanSearch}
            tone={pct >= 80 ? 'success' : 'brand'}
            title={pct === 100 ? 'Every clue read right' : pct >= 80 ? 'You know these clues' : 'Clues practiced'}
            subtitle={
              pct >= 80
                ? 'When this wording turns up in a problem, you know what to reach for.'
                : 'The ones you missed came back once. Another round will fix them.'
            }
            stats={[
              { label: 'First try', value: `${right}/${firstCount}` },
              { label: 'Accuracy', value: `${pct}%` },
              { label: 'XP earned', value: `+${xp}` },
            ]}
          >
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={again}>
              <RotateCcw aria-hidden="true" />
              Another round
            </button>
            <Link to={back} className="btn btn-secondary btn-lg btn-block">
              {only ? 'Back to the unit' : 'Pattern guide'}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Completion>
          <section className="card clues-summary" aria-label="By pattern">
            <table className="clues-table">
              <thead>
                <tr>
                  <th scope="col">Pattern</th>
                  <th scope="col">This round</th>
                  <th scope="col">Clue words</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([cat, t]) => (
                  <tr key={cat}>
                    <th scope="row">
                      <CategoryIcon id={cat} color={CATEGORY_BY_ID[cat].color} size="sm" />
                      <Link to={`/patterns#${cat}`}>{CATEGORY_BY_ID[cat].name}</Link>
                    </th>
                    <td className="tabular">
                      {t.right}/{t.total}
                    </td>
                    <td>{cluesKnown(progress, cat) ? <span className="badge badge-success">Known</span> : <span className="text-tertiary">{CLUES_KNOWN} in a row to know them</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </SessionShell>
    );
  }

  const card = deck[i];
  const retry = i >= firstCount;
  const answerKeys = card.kind === 'which' ? [String(card.answer)] : card.accepted;
  const ok = sel !== null && answerKeys.includes(sel);
  const cat = CATEGORY_BY_ID[card.cat];

  const check = () => {
    if (sel === null) return;
    setStatus(ok ? 'correct' : 'wrong');
    sfx(ok ? 'correct' : 'wrong');
    if (retry) return;
    recordClue(card.cat, ok);
    const t = (tally.current[card.cat] ??= { right: 0, total: 0 });
    t.total += 1;
    if (ok) {
      t.right += 1;
      setRight((r) => r + 1);
      setXp((x) => x + XP.blitzPerCorrect);
      awardXp(XP.blitzPerCorrect, 'clues');
    } else setDeck((d) => [...d, retryClue(card)]); // once more at the end
  };
  const next = () => {
    setSel(null);
    setStatus('idle');
    if (i + 1 < deck.length) {
      setI(i + 1);
      window.scrollTo(0, 0);
    } else {
      setDone(true);
      release.current();
      sfx('complete');
      if (right / Math.max(1, firstCount) >= 0.8) confetti();
    }
  };

  const patternOptions = (options: CategoryId[]) =>
    options.map((c) => ({ key: c as string, label: CATEGORY_BY_ID[c].name, icon: <CategoryIcon id={c} color={CATEGORY_BY_ID[c].color} size="sm" /> }));

  return (
    <SessionShell
      progress={i / deck.length}
      onClose={() => nav(back)}
      title={title}
      right={
        <span className="clues-count tabular">
          {i + 1}
          <span>/{deck.length}</span>
        </span>
      }
    >
      <section className="drill clues-card" key={card.uid}>
        <header className="drill-head">
          <div className="drill-eyebrow">
            <div className="kicker">
              <Quote strokeWidth={2} aria-hidden="true" />
              <span>{card.kind === 'which' ? 'Pattern to wording' : 'Wording to pattern'}</span>
            </div>
            {retry && <span className="badge badge-warning">Missed earlier</span>}
          </div>
          {card.kind === 'which' ? (
            <h1 className="q-title">
              Which wording should make you reach for <span className="clues-pattern">{cat.name}</span>?
            </h1>
          ) : (
            <h1 className="q-title">A problem says this. Which pattern do you reach for?</h1>
          )}
        </header>

        {card.kind === 'see' && <CluePhrases phrases={[card.cue.see]} />}
        {card.kind === 'problem' && <CluePhrases phrases={card.problem.signals} />}

        {card.kind === 'which' ? (
          <Choices
            options={card.options.map((o, k) => ({ key: String(k), label: inline(o.cue.see) }))}
            selected={sel}
            onSelect={(k) => {
              setSel(k);
              sfx('tap');
            }}
            answer={answerKeys}
            revealed={status !== 'idle'}
            label="Wordings"
          />
        ) : (
          <Choices
            options={patternOptions(card.options)}
            selected={sel}
            onSelect={(k) => {
              setSel(k);
              sfx('tap');
            }}
            answer={answerKeys}
            revealed={status !== 'idle'}
            twoCol
            label="Patterns"
          />
        )}

        <ActionBar
          status={status}
          step={card.uid}
          canCheck={sel !== null}
          onCheck={check}
          onContinue={next}
          title={status === 'wrong' && !retry ? 'Not quite. It comes back at the end' : undefined}
          feedback={
            <div className="drill-fb clues-fb">
              <div className="drill-fb-answer">
                <CategoryIcon id={card.cat} color={cat.color} size="sm" />
                <span>
                  <strong>{cat.name}</strong>
                  {card.kind === 'problem' && (
                    <>
                      <span className="drill-fb-sep">·</span>
                      {card.problem.pattern}
                    </>
                  )}
                </span>
              </div>
              {card.kind === 'problem' ? (
                <div>
                  These are the clue words of <strong>{card.problem.title}</strong>.
                </div>
              ) : (
                <ClueAnswer cue={card.kind === 'which' ? card.options[card.answer].cue : card.cue} />
              )}
              {card.kind === 'which' && status === 'wrong' && sel !== null && (
                <div className="clues-fb-other">
                  Your pick points to <strong>{CATEGORY_BY_ID[card.options[Number(sel)].cat].name}</strong>.
                </div>
              )}
              {card.kind !== 'which' && card.accepted.length > 1 && (
                <div className="clues-fb-other">Also right: {card.accepted.slice(1).map((c) => CATEGORY_BY_ID[c].name).join(', ')}.</div>
              )}
            </div>
          }
          secondary={
            !only && startedPatterns(progress).length === 0 ? (
              <span className="clues-hint">
                <BookOpen aria-hidden="true" />
                All 18 patterns, since you have not started one yet
              </span>
            ) : undefined
          }
        />
      </section>
    </SessionShell>
  );
}

/** A clue as the pair it is: the wording, and what to reach for. */
function ClueAnswer({ cue }: { cue: (typeof CUES)[CategoryId][number] }) {
  return (
    <div className="clues-pair">
      <span className="clues-pair-see">{inline(cue.see)}</span>
      <ArrowRight aria-hidden="true" />
      <span className="clues-pair-use">{inline(cue.use)}</span>
    </div>
  );
}
