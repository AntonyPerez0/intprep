// "Template from memory": type a pattern's reusable template into a blank editor, then compare it
// line by line. The first check sets the score; the learner may fix their text and check again.
// Pure recall of the shape you reach for in every problem of the unit.

import '../styles/pages/drills.css';
import '../styles/pages/template-drill.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  CodeXml,
  Lightbulb,
  PencilLine,
  RotateCcw,
  ScanSearch,
  Sprout,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { CATEGORIES, CATEGORY_BY_ID, type CategoryMeta } from '../content/categories';
import { guideFor } from '../content/index';
import type { CategoryId, PatternGuide } from '../content/types';
import { codeLines, gradeCode, type Grade } from '../lib/codegrade';
import { confetti } from '../lib/confetti';
import { XP } from '../lib/game';
import { HighlightedCode } from '../lib/highlight';
import { inline } from '../lib/markdown';
import { stripComment } from '../lib/parseSolution';
import { sfx } from '../lib/sound';
import { awardXp, recordTemplate, useProgress, type Progress } from '../lib/store';
import { ActionBar, type CheckStatus } from '../components/interact';
import { CodeTyper } from '../components/CodeTyper';
import { CATEGORY_ICON } from '../components/icons';
import { SessionShell } from '../components/Shell';
import { Completion } from '../components/ui';

/** Where a drill was opened from, so Close and Back return there. Pass it as router state. */
export interface TemplateDrillState {
  from?: string;
}

export function TemplateDrillRoute() {
  const { cat } = useParams();
  // "Try again" starts a fresh round; a new unit (Next template) remounts too.
  const [round, setRound] = useState(0);
  const g = cat && cat in CATEGORY_BY_ID ? guideFor(cat as CategoryId) : null;
  if (!g) return <Navigate to="/patterns" replace />;
  return <TemplateDrill key={`${g.category}:${round}`} g={g} onRetry={() => setRound((r) => r + 1)} />;
}

/** The template as the grader sees it: trailing comments dropped, so the diff shows clean code. */
function answerLines(template: string): string[] {
  return template.split('\n').map((l) => stripComment(l).replace(/\s+$/, ''));
}

/**
 * How a line starts, for the hint: the first word (with the name after `def` / `class`), then "…".
 * Short lines such as `else:` show in full.
 */
function lineStart(line: string): string {
  const indent = line.match(/^\s*/)?.[0] ?? '';
  const code = line.trim();
  const head = code.match(/^(?:(?:def|class)\s+[A-Za-z_]\w*|@?[A-Za-z_]\w*)/)?.[0] ?? code.charAt(0);
  const rest = code.slice(head.length);
  if (rest.length <= 1) return indent + code;
  return indent + head + (rest.startsWith(' ') ? ' …' : '…');
}

/** The next unit to practise: the next one whose pattern intro is done, else simply the next unit. */
function nextTemplate(cat: CategoryId, p: Progress): CategoryMeta | null {
  const i = CATEGORIES.findIndex((c) => c.id === cat);
  const ring = [...CATEGORIES.slice(i + 1), ...CATEGORIES.slice(0, i)].filter((c) => guideFor(c.id));
  return ring.find((c) => p.lessonsDone[`g:${c.id}`]) ?? ring[0] ?? null;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** "Template from memory", shortened on phones where the header is tight. */
function SessionTitle() {
  return (
    <>
      <span className="tdrill-title-full">Template from memory</span>
      <span className="tdrill-title-short">Template</span>
    </>
  );
}

interface Result {
  grade: Grade;
  xp: number;
  newBest: boolean;
}

function TemplateDrill({ g, onRetry }: { g: PatternGuide; onRetry: () => void }) {
  const nav = useNavigate();
  const loc = useLocation();
  const progress = useProgress();
  const meta = CATEGORY_BY_ID[g.category];
  const CatIcon = CATEGORY_ICON[g.category];
  const from = (loc.state as TemplateDrillState | null)?.from;
  const back = from ?? `/patterns?p=${g.category}`;
  const backToUnit = back.startsWith('/unit');

  const answer = useMemo(() => answerLines(g.template), [g]);
  const lines = useMemo(() => codeLines(answer), [answer]);
  const total = lines.length;

  const [text, setText] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [first, setFirst] = useState<Grade | null>(null);
  const [latest, setLatest] = useState<Grade | null>(null); // kept while fixing, for the progress bar
  const [attempt, setAttempt] = useState(0);
  const [hint, setHint] = useState(false);
  const [capped, setCapped] = useState(false); // a hint before the first check halves the XP
  const [result, setResult] = useState<Result | null>(null);
  const [cuesOpen, setCuesOpen] = useState(() => !!window.matchMedia?.('(min-width: 640px)').matches);
  // Read once: the best before this round, so the header and "New best" do not move mid-drill.
  const [prevBest] = useState(() => progress.templates?.[g.category]?.best);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const workRef = useRef<HTMLDivElement>(null);

  const status: CheckStatus = grade ? (grade.perfect ? 'correct' : 'wrong') : 'idle';

  // Back to the editor after "Fix and check again": focus it with the caret at the end.
  const refocus = useRef(false);
  useEffect(() => {
    if (grade || !refocus.current) return;
    refocus.current = false;
    const ta = taRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }, [grade]);

  // Once checked, bring the result (and "Fix and check again") into view if any of it is hidden.
  // Waits a beat so the taller feedback bar has been measured into --actionbar-h (the page's
  // bottom padding), otherwise the scroll stops short.
  useEffect(() => {
    if (!grade) return;
    const t = window.setTimeout(() => {
      const el = workRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const bar = document.querySelector<HTMLElement>('.actionbar')?.offsetHeight ?? 0;
      if (r.top >= 64 && r.bottom <= window.innerHeight - bar) return;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [grade]);

  const check = () => {
    const r = gradeCode(text, answer);
    setGrade(r);
    setLatest(r);
    setAttempt((a) => a + 1);
    if (!first) setFirst(r);
    sfx(r.perfect ? 'correct' : 'wrong');
  };

  const fixAgain = () => {
    refocus.current = true;
    setGrade(null);
  };

  const showHint = () => {
    setHint(true);
    if (!first) setCapped(true);
    taRef.current?.focus({ preventScroll: true });
  };

  const finish = () => {
    const scored = first ?? grade;
    if (!scored) return;
    const acc = scored.score;
    recordTemplate(g.category, acc);
    const xp = Math.max(2, Math.round((capped ? XP.templateHintMax : XP.templateMax) * acc));
    awardXp(xp, 'template');
    setResult({ grade: scored, xp, newBest: prevBest !== undefined && acc > prevBest });
    sfx('complete');
    if (acc >= 0.8) confetti();
  };

  const close = () => nav(back);

  if (result) {
    return (
      <Done
        g={g}
        meta={meta}
        result={result}
        attempts={attempt}
        back={back}
        backToUnit={backToUnit}
        next={nextTemplate(g.category, progress)}
        onRetry={onRetry}
        onClose={close}
      />
    );
  }

  const written = codeLines(text).length;
  const fixing = attempt > 0 && status === 'idle';

  return (
    <SessionShell
      progress={latest ? latest.correct / Math.max(1, latest.total) : Math.min(1, written / Math.max(1, total))}
      onClose={close}
      title={<SessionTitle />}
      right={
        prevBest !== undefined ? (
          <span className="tdrill-best" title="Your best first try for this template">
            <Trophy strokeWidth={2.2} aria-hidden="true" />
            <span className="sr-only">Your best first try: </span>
            <span aria-hidden="true">Best </span>
            {pct(prevBest)}
          </span>
        ) : undefined
      }
    >
      <div className="tdrill">
        <header className="drill-head">
          <div className="drill-eyebrow">
            <div className="kicker">
              <CatIcon strokeWidth={2} aria-hidden="true" />
              <span>{meta.name}</span>
            </div>
            <div className="drill-meta">
              Pattern {CATEGORIES.indexOf(meta) + 1} of {CATEGORIES.length}
            </div>
          </div>
          <h1 className="q-title">Write the template from memory</h1>
          <p className="drill-sub">
            {fixing
              ? 'Fix the lines that were off, then check again. Your first try already set the score.'
              : 'Type it without looking, then check it line by line. Comments are optional.'}
          </p>
        </header>

        <details className="disclosure tdrill-cues" open={cuesOpen} onToggle={(e) => setCuesOpen(e.currentTarget.open)}>
          <summary>
            <ScanSearch aria-hidden="true" />
            When to reach for it
            <span className="tdrill-cues-count tabular" aria-hidden="true">
              {g.whenToUse.length}
            </span>
          </summary>
          <ul className="tdrill-cue-list" role="list">
            {g.whenToUse.map((w, i) => (
              <li key={i}>
                <ArrowRight aria-hidden="true" />
                <span>{inline(w)}</span>
              </li>
            ))}
          </ul>
        </details>

        <div ref={workRef} className="tdrill-work">
          {status === 'wrong' && (
            <div className="tdrill-retry">
              <p>Your first try sets the score. Fixing it now still helps it stick.</p>
              <button type="button" className="btn btn-secondary" onClick={fixAgain}>
                <PencilLine aria-hidden="true" />
                Fix and check again
              </button>
            </div>
          )}

          <CodeTyper
          value={text}
          onChange={setText}
          grade={grade}
          label={`${meta.name} template`}
          textareaRef={taRef}
          autoFocus
          minRows={Math.min(total + 1, 14)}
          filename={`${g.category}.py`}
          meta="From memory"
          note={`${total} lines to write`}
          placeholder={`Write the ${meta.name} template here`}
          className="tdrill-editor"
          after={
            hint && !grade ? (
              <div className="tdrill-hint">
                <div className="tdrill-hint-label">
                  <Lightbulb aria-hidden="true" />
                  Hint: how each line starts
                  {capped && <span className="tdrill-hint-cap">XP halved</span>}
                </div>
                {lines.map((l, i) => (
                  <div key={i} className="tdrill-hint-line">
                    {lineStart(l)}
                  </div>
                ))}
              </div>
            ) : undefined
          }
          />
        </div>

        <ActionBar
          status={status}
          step={attempt}
          canCheck={text.trim().length > 0}
          onCheck={check}
          onContinue={finish}
          title={status === 'correct' && attempt > 1 ? 'All fixed' : undefined}
          feedback={
            status === 'wrong'
              ? 'Lines with a plus show the template. Fix yours from memory, or continue.'
              : status === 'correct'
                ? attempt > 1
                  ? 'Every line matches now. Your first try still sets the score.'
                  : 'Every line matches the template.'
                : undefined
          }
          secondary={
            !hint ? (
              <button type="button" className="btn btn-quiet btn-sm tdrill-hint-btn" onClick={showHint}>
                <Lightbulb aria-hidden="true" />
                Hint
              </button>
            ) : undefined
          }
        />
      </div>
    </SessionShell>
  );
}

function Done({
  g,
  meta,
  result,
  attempts,
  back,
  backToUnit,
  next,
  onRetry,
  onClose,
}: {
  g: PatternGuide;
  meta: CategoryMeta;
  result: Result;
  attempts: number;
  back: string;
  backToUnit: boolean;
  next: CategoryMeta | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  const { grade, xp, newBest } = result;
  const acc = grade.score;
  const perfect = grade.perfect;
  const nextState: TemplateDrillState | undefined = next
    ? { from: backToUnit ? `/unit/${next.id}` : `/patterns?p=${next.id}` }
    : undefined;
  const templateLines = g.template.split('\n').length;

  const retryBtn = (
    <button type="button" className={`btn btn-lg btn-block ${perfect ? 'btn-secondary' : 'btn-primary'}`} onClick={onRetry}>
      <RotateCcw aria-hidden="true" />
      Try again
    </button>
  );
  const nextBtn = next && (
    <Link
      to={`/patterns/${next.id}/type`}
      state={nextState}
      className={`btn btn-lg btn-block ${perfect ? 'btn-primary' : 'btn-secondary'}`}
    >
      <span className="truncate">Next template: {next.name}</span>
      <ArrowRight aria-hidden="true" />
    </Link>
  );

  return (
    <SessionShell progress={1} onClose={onClose} title={<SessionTitle />}>
      <div className="tdrill-done">
        <Completion
          icon={perfect ? Trophy : acc >= 0.8 ? CircleCheck : acc >= 0.5 ? TrendingUp : Sprout}
          tone={perfect ? 'warning' : acc >= 0.8 ? 'success' : 'brand'}
          title={perfect ? 'Flawless from memory' : acc >= 0.8 ? 'Nearly perfect' : acc >= 0.5 ? 'Getting there' : 'Good effort'}
          subtitle={
            <>
              You wrote {grade.correct} of {grade.total} lines of the <strong>{meta.name}</strong> template correctly on the first try
              {grade.extra > 0 ? `, plus ${grade.extra} extra line${grade.extra === 1 ? '' : 's'}.` : '.'}
              {acc < 0.8
                ? ' Type it again tomorrow. The struggle is what builds memory.'
                : newBest
                  ? ' That is a new best.'
                  : !perfect && attempts > 1
                    ? ' Fixing it straight away helps it stick.'
                    : ''}
            </>
          }
          stats={[
            { label: 'Accuracy', value: pct(acc) },
            {
              label: 'Correct',
              value: (
                <>
                  {grade.correct}
                  <span className="tdrill-of">/{grade.total}</span>
                </>
              ),
            },
            { label: 'XP earned', value: `+${xp}` },
          ]}
        >
          {perfect ? (
            <>
              {nextBtn}
              {retryBtn}
            </>
          ) : (
            <>
              {retryBtn}
              {nextBtn}
            </>
          )}
          <Link to={back} className="btn btn-quiet btn-lg btn-block">
            <ArrowLeft aria-hidden="true" />
            {backToUnit ? 'Back to unit' : 'Back to Pattern guide'}
          </Link>
        </Completion>

        <details className="disclosure tdrill-ref" open={!perfect}>
          <summary>
            <CodeXml aria-hidden="true" />
            The {meta.name} template
            <span className="tdrill-ref-meta">{templateLines} lines</span>
          </summary>
          <HighlightedCode code={g.template} />
        </details>
      </div>
    </SessionShell>
  );
}
