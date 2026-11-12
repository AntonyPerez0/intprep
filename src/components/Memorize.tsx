// "Memorize this pattern" and "Memorize this solution": the steps that take something from just
// learned to remembered, in order, with what is done and what comes next. Everything they count
// is practice the app already records (the pattern intro, Clue words, Template practice, Code
// from memory, the review schedule); this puts it in one list so the learner always knows the
// next step. Also the list of a pattern's clue words ("see this, use that").

import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { CATEGORY_BY_ID } from '../content/categories';
import { CUES } from '../content/cues';
import { guideFor, problemsFor } from '../content/index';
import type { CategoryId, Problem } from '../content/types';
import { cluesKnown, CLUES_KNOWN } from '../lib/clues';
import { friendlyDue, today } from '../lib/date';
import { mastery, TEMPLATE_READY, TYPED_PROOF } from '../lib/input';
import { inline } from '../lib/markdown';
import { unitNext } from '../lib/path';
import { CROWN_LABELS } from '../lib/srs';
import type { Progress } from '../lib/store';
import '../styles/pages/clues.css';

export interface MemoStep {
  title: string;
  /** What the step asks for, or where it stands. */
  note?: string;
  done: boolean;
  /** Where the step is practiced. */
  to?: string;
  /** The button's label when this is the next step. */
  cta?: string;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** A pattern, from first read to remembered: learn it, know its clue words, know its template, learn its problems. */
export function patternSteps(p: Progress, cat: CategoryId): MemoStep[] {
  const guide = guideFor(cat);
  const t = p.templates?.[cat];
  const problems = problemsFor(cat);
  const learned = problems.filter((q) => p.problems[q.id]?.learnedAt).length;
  const next = unitNext(p, cat);
  const clues = p.clues?.[cat];
  const filled = !!t?.pickReady || (t?.gapsBest ?? 0) >= TEMPLATE_READY || ((t?.tries ?? 0) > 0 && (t?.best ?? 0) >= TEMPLATE_READY);
  const typed = (t?.tries ?? 0) > 0 && (t?.best ?? 0) >= TEMPLATE_READY;
  const steps: MemoStep[] = [];
  if (guide) steps.push({ title: 'Learn the pattern', note: 'The idea, when to reach for it, and its template', done: !!p.lessonsDone[`g:${cat}`], to: `/unit/${cat}/intro`, cta: 'Start the intro' });
  if ((CUES[cat] ?? []).length)
    steps.push({
      title: 'Know its clue words',
      note: cluesKnown(p, cat) ? 'The wording that points to it' : clues?.seen ? `Best run ${clues.best} of ${CLUES_KNOWN} in a row` : `Name the pattern from its wording, ${CLUES_KNOWN} in a row`,
      done: cluesKnown(p, cat),
      to: `/clues?cat=${cat}`,
      cta: 'Drill the clue words',
    });
  if (guide) {
    steps.push({
      title: 'Fill in its template',
      note: filled ? 'Its missing lines, from memory' : 'Put back the template’s missing lines',
      done: filled,
      to: `/patterns/${cat}/type`,
      cta: 'Practice the template',
    });
    steps.push({
      title: 'Write the template from a blank file',
      note: typed ? `Best ${pct(t!.best)}` : `${pct(TEMPLATE_READY)} or better, with nothing to look at`,
      done: typed,
      to: `/patterns/${cat}/type?mode=memory`,
      cta: 'Write it from memory',
    });
  }
  if (problems.length)
    steps.push({
      title: 'Learn its problems',
      note: `${learned} of ${problems.length} learned`,
      done: learned === problems.length,
      to: next ? `/p/${next.id}/learn` : undefined,
      cta: next ? `Next: ${next.title}` : undefined,
    });
  return steps;
}

/** A solution, from learned to remembered: rebuild it with cues, fill its gaps, write it whole, then keep it with reviews. */
export function problemSteps(p: Progress, q: Problem): MemoStep[] {
  const pp = p.problems[q.id];
  const learned = !!pp?.learnedAt;
  const whole = (pp?.scratchBest ?? 0) >= TYPED_PROOF || !!pp?.solvedAt;
  // A later rung done shows the earlier ones can be done too.
  const gaps = whole || Math.max(pp?.gapsBest ?? 0, pp?.gapsPickBest ?? 0) >= TYPED_PROOF;
  const parts = gaps || Math.max(pp?.rebuildBest ?? 0, pp?.rebuildPickBest ?? 0) >= TYPED_PROOF;
  const crowns = learned ? mastery(pp) : 0;
  return [
    { title: 'Learn it', note: pp?.testedOut ? 'You solved it yourself, before the lesson' : 'The guided lesson: the idea, then the code part by part', done: learned, to: `/p/${q.id}/learn`, cta: 'Start the lesson' },
    { title: 'Rebuild it part by part', note: 'Each part from its plain-English cue', done: learned && parts, to: `/p/${q.id}/rebuild?mode=parts`, cta: 'Rebuild it' },
    { title: 'Fill in its missing lines', note: 'The whole solution with gaps', done: learned && gaps, to: `/p/${q.id}/rebuild?mode=gaps`, cta: 'Fill the gaps' },
    { title: 'Write it from a blank file', note: whole ? 'Done: you can produce it unaided' : 'Nothing to look at, checked by running it', done: learned && whole, to: `/p/${q.id}/rebuild?mode=scratch`, cta: 'Write it from scratch' },
    {
      title: 'Keep it',
      note: learned && pp?.srs ? `${CROWN_LABELS[crowns]} · next review ${friendlyDue(pp.srs.due)}` : 'Short reviews, just before you would forget it',
      done: crowns >= 4,
      to: learned && pp?.srs && pp.srs.due <= today() ? '/review' : undefined,
      cta: 'Review it now',
    },
  ];
}

/** The steps as a list: done ones checked, the first one left marked as next with its button. */
export function MemoSteps({ title, steps, id }: { title: string; steps: MemoStep[]; id: string }) {
  const next = steps.findIndex((s) => !s.done);
  const done = steps.filter((s) => s.done).length;
  return (
    <div className="memo">
      <div className="memo-head">
        <h3 className="card-title" id={id}>
          {title}
        </h3>
        <span className="memo-count tabular">
          {done} of {steps.length} steps
        </span>
      </div>
      <ol className="memo-steps" aria-labelledby={id}>
        {steps.map((s, k) => {
          const isNext = k === next;
          return (
            <li key={s.title} className={`memo-step ${s.done ? 'is-done' : isNext ? 'is-next' : ''}`} aria-current={isNext ? 'step' : undefined}>
              <span className="memo-step-mark" aria-hidden="true">
                {s.done ? <Check strokeWidth={3} /> : k + 1}
              </span>
              <span className="memo-step-title">
                <span className="sr-only">{s.done ? 'Done: ' : isNext ? 'Next: ' : ''}</span>
                {s.title}
                {s.note && <span className="memo-step-note">{s.note}</span>}
              </span>
              {s.to &&
                (isNext ? (
                  <Link to={s.to} className="btn btn-primary btn-sm memo-step-go">
                    <span className="truncate">{s.cta}</span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                ) : s.done ? (
                  <Link to={s.to} className="btn btn-quiet btn-sm memo-step-go">
                    Again
                  </Link>
                ) : null)}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** A pattern's clue words: the wording on the left, what to reach for on the right. */
export function ClueList({ cat }: { cat: CategoryId }) {
  const cues = CUES[cat] ?? [];
  if (!cues.length) return null;
  return (
    <ul className="clue-list" aria-label={`Clue words for ${CATEGORY_BY_ID[cat].name}`}>
      {cues.map((c, k) => (
        <li key={k}>
          <span className="clue-list-see">{inline(c.see)}</span>
          <ArrowRight aria-hidden="true" />
          <span className="clue-list-use">{inline(c.use)}</span>
        </li>
      ))}
    </ul>
  );
}
