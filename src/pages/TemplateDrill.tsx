// Template practice (/patterns/:cat/type?mode=pick|gaps|memory): the unit's reusable template, in
// three rungs of the same ladder as Code from memory ("Pick first, then type", docs/DESIGN.md).
// - Pick the gaps: the template is shown with about 30% of its lines blank; pick each missing line
//   from its options (for a template that is still new).
// - Fill the gaps: the same, but type the missing lines.
// - From memory: type the whole template into a blank editor, then compare it line by line.
// In all three, the first check sets the score and the learner may fix their answer and check
// again. Without ?mode= it opens where the ladder says: Pick the gaps while the template is new
// (`templateInput`), then Fill the gaps until that is strong (80%+) or the template has been typed
// from memory, then From memory. "Always type" skips picking; "Always pick" opens on picking.

import '../styles/pages/drills.css';
import '../styles/pages/template-drill.css';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  CodeXml,
  Lightbulb,
  ListChecks,
  PencilLine,
  RefreshCw,
  RotateCcw,
  ScanSearch,
  Sprout,
  TextCursorInput,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { CATEGORIES, CATEGORY_BY_ID, type CategoryMeta } from '../content/categories';
import { guideFor } from '../content/index';
import type { CategoryId, PatternGuide } from '../content/types';
import { codeLines, gradeCode, type Grade } from '../lib/codegrade';
import { confetti } from '../lib/confetti';
import { XP } from '../lib/game';
import { gapSource, gapsSummary, type GapsGrade } from '../lib/gaps';
import { HighlightedCode } from '../lib/highlight';
import { TEMPLATE_READY, templateInput, type InputMode } from '../lib/input';
import { inline } from '../lib/markdown';
import { stripComment } from '../lib/parseSolution';
import { sfx } from '../lib/sound';
import { awardXp, getProgress, recordTemplate, useProgress, type Progress, type TemplateMode, type TemplateProgress } from '../lib/store';
import { ActionBar, type CheckStatus } from '../components/interact';
import { CheckedAction, CodeTyper } from '../components/CodeTyper';
import { GapsWindow, PickGapsWindow, useGaps, usePickGaps, type CodeGapsHandle, type PickGapsHandle } from '../components/CodeGaps';
import { CATEGORY_ICON, IconTile } from '../components/icons';
import { SessionShell } from '../components/Shell';
import { Completion, Modal } from '../components/ui';

/** Where a drill was opened from, so Close and Back return there. Pass it as router state. */
export interface TemplateDrillState {
  from?: string;
}

type Mode = TemplateMode;

/** The rungs, most support first. `short` is the name on the narrowest phones (the full one stays the accessible name). */
const MODES: { id: Mode; label: string; short: string; icon: typeof PencilLine }[] = [
  { id: 'pick', label: 'Pick the gaps', short: 'Pick', icon: ListChecks },
  { id: 'gaps', label: 'Fill the gaps', short: 'Fill', icon: TextCursorInput },
  { id: 'memory', label: 'From memory', short: 'Memory', icon: PencilLine },
];
const MODE_LABEL: Record<Mode, string> = { pick: 'Pick the gaps', gaps: 'Fill the gaps', memory: 'From memory' };
const isMode = (m: string | null): m is Mode => m === 'pick' || m === 'gaps' || m === 'memory';

/** A score at or above this moves the learner up the ladder (default mode and next step). */
const READY = TEMPLATE_READY;

/**
 * The ladder: Pick the gaps while the template is new (`templateInput`: in "Pick first, then
 * type" until a pick or gaps best of 80%+ or a From memory try; always in "Always pick"; never in
 * "Always type"), then Fill the gaps until that is strong or the template has been typed from
 * memory, then From memory.
 */
export function templateLadder(setting: InputMode | undefined, t: TemplateProgress | undefined): Mode {
  if (templateInput(setting, t) === 'pick') return 'pick';
  return (t?.gapsBest ?? 0) >= READY || (t?.tries ?? 0) > 0 ? 'memory' : 'gaps';
}

export function TemplateDrillRoute() {
  const { cat } = useParams();
  // "Try again" and a mode switch after a check start a fresh run; a new unit (Next template) remounts too.
  const [run, setRun] = useState(0);
  // Pick and Fill the gaps: the round per unit, so "Try new gaps" and coming back bring other lines.
  const rounds = useRef<Record<string, number>>({});
  // Set when the mode switch changes the drill (it survives the remount of a switch after a check).
  const switched = useRef(false);
  const g = cat && cat in CATEGORY_BY_ID ? guideFor(cat as CategoryId) : null;
  if (!g) return <Navigate to="/patterns" replace />;
  return <TemplateDrill key={`${g.category}:${run}`} g={g} onRestart={() => setRun((r) => r + 1)} rounds={rounds} switched={switched} />;
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

/** The next unit to practice: the next one whose pattern intro is done, else simply the next unit. */
function nextTemplate(cat: CategoryId, p: Progress): CategoryMeta | null {
  const i = CATEGORIES.findIndex((c) => c.id === cat);
  const ring = [...CATEGORIES.slice(i + 1), ...CATEGORIES.slice(0, i)].filter((c) => guideFor(c.id));
  return ring.find((c) => p.lessonsDone[`g:${c.id}`]) ?? ring[0] ?? null;
}

/**
 * The first round of gaps: round 0 is the set the pattern intro's "Your turn" slide asks (picked
 * or typed; its first check is this drill's first score). Once the template has a gaps score
 * either way, open on other lines.
 */
function firstRound(t: TemplateProgress | undefined): number {
  return t?.gapsBest !== undefined || t?.pickBest !== undefined ? 1 : 0;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const isFinePointer = () => !!window.matchMedia?.('(pointer: fine)').matches;
const isWide = () => !!window.matchMedia?.('(min-width: 640px)').matches;

/** "Template practice" (as its entry points say), shortened on phones where the header is tight. */
function SessionTitle() {
  return (
    <>
      <span className="tdrill-title-full">Template practice</span>
      <span className="tdrill-title-short">Template</span>
    </>
  );
}

/** Where Close and Back go: the page that opened the drill, else the Pattern guide. */
function useBack(g: PatternGuide) {
  const loc = useLocation();
  const from = (loc.state as TemplateDrillState | null)?.from;
  const back = from ?? `/patterns?p=${g.category}`;
  return { back, backToUnit: back.startsWith('/unit') };
}

// ── Mode controller ─────────────────────────────────────────────────────────

interface ModeSwitchProps {
  mode: Mode;
  onChange: (m: Mode) => void;
  /** True once the current attempt has been checked: switching then restarts it. */
  restarts: boolean;
}

interface DrillProps {
  g: PatternGuide;
  modes: ModeSwitchProps;
  /** The "Code practice" setting, read once when the page opened. */
  setting: InputMode;
  /** Called on the first Check: from then on, switching mode restarts the drill. */
  onChecked: () => void;
  /** Start a fresh run, in `mode` (default: the current one). */
  onRestart: (mode?: Mode) => void;
}

/**
 * Picks the mode (from ?mode=, else the ladder), keeps the URL in sync, and asks before a mode
 * switch after the first Check, since that restarts the attempt.
 */
function TemplateDrill({
  g,
  onRestart,
  rounds,
  switched,
}: {
  g: PatternGuide;
  onRestart: () => void;
  rounds: RefObject<Record<string, number>>;
  /** True from a press on the mode switch until the new drill has mounted. */
  switched: RefObject<boolean>;
}) {
  const loc = useLocation();
  const [params, setParams] = useSearchParams();
  // Decided once per run, so finishing a strong round does not flip a running page.
  const [setting] = useState<InputMode>(() => getProgress().settings.typingMode);
  const [auto] = useState<Mode>(() => templateLadder(setting, getProgress().templates?.[g.category]));
  const asked = params.get('mode');
  const mode: Mode = isMode(asked) ? asked : auto;
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState<Mode | null>(null);

  // Keep the router state, so Close still returns to the page that opened the drill.
  const setMode = (m: Mode) => setParams({ mode: m }, { replace: true, state: loc.state });
  const restart = (m: Mode = mode) => {
    setPending(null);
    // Pin the mode in the URL: the fresh run re-reads the ladder, and a strong round must not
    // turn "Try new gaps" into the next rung.
    if (asked !== m) setMode(m);
    onRestart();
  };
  const choose = (m: Mode) => {
    if (m === mode) return;
    switched.current = true;
    if (checked) setPending(m);
    else setMode(m);
  };
  const keepGoing = () => {
    switched.current = false;
    setPending(null);
  };

  // After a switch, keep keyboard and screen-reader focus on the switch (now on the new mode's
  // radio; the pressed one unmounted with the old drill) unless the new drill focused its editor.
  useEffect(() => {
    if (!switched.current) return;
    switched.current = false;
    const a = document.activeElement;
    if (!a || a === document.body) document.querySelector<HTMLElement>('.tdrill-seg [aria-checked="true"]')?.focus({ preventScroll: true });
  }, [mode]);

  const shared: DrillProps = {
    g,
    modes: { mode, onChange: choose, restarts: checked },
    setting,
    onChecked: () => setChecked(true),
    onRestart: restart,
  };

  return (
    <>
      {mode === 'memory' ? (
        <MemoryDrill key="memory" {...shared} />
      ) : mode === 'pick' ? (
        <PickDrill key="pick" {...shared} rounds={rounds} />
      ) : (
        <GapsDrill key="gaps" {...shared} rounds={rounds} />
      )}
      {pending && (
        <Modal onClose={keepGoing} labelledBy="tdrill-switch-title">
          <div className="tdrill-modal">
            <IconTile icon={RotateCcw} />
            <div className="grow">
              <h2 id="tdrill-switch-title" className="modal-title">
                Switch to {MODE_LABEL[pending]}?
              </h2>
              <p>You will start over in {MODE_LABEL[pending]}. This attempt ends here, with no score or XP.</p>
            </div>
          </div>
          <div className="modal-actions">
            {/* Focus the safe choice when the dialog opens. */}
            <button type="button" className="btn btn-secondary" onClick={keepGoing} autoFocus>
              Keep going
            </button>
            <button type="button" className="btn btn-primary" onClick={() => restart(pending)}>
              Switch and restart
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Shared pieces ───────────────────────────────────────────────────────────

function ModeSwitch({ mode, onChange, restarts }: ModeSwitchProps) {
  const id = useId();
  return (
    <div className="tdrill-modes">
      <div className="seg tdrill-seg" role="radiogroup" aria-label="How to practice it" aria-describedby={restarts ? `${id}-note` : undefined}>
        {MODES.map((m) => {
          const on = m.id === mode;
          const Icon = m.icon;
          return (
            <button key={m.id} type="button" role="radio" aria-checked={on} className={on ? 'on' : ''} onClick={() => onChange(m.id)}>
              <Icon aria-hidden="true" />
              {/* The narrowest phones show the short name; the full one stays the accessible name. */}
              <span className="tdrill-seg-long">{m.label}</span>
              <span className="tdrill-seg-short" aria-hidden="true">
                {m.short}
              </span>
            </button>
          );
        })}
      </div>
      {restarts && (
        <span id={`${id}-note`} className="tdrill-modes-note">
          <RotateCcw aria-hidden="true" />
          Switching starts a new attempt
        </span>
      )}
    </div>
  );
}

function DrillHead({ g, modes, title, sub }: { g: PatternGuide; modes: ModeSwitchProps; title: string; sub: ReactNode }) {
  const meta = CATEGORY_BY_ID[g.category];
  const CatIcon = CATEGORY_ICON[g.category];
  return (
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
      <h1 className="q-title">{title}</h1>
      <ModeSwitch {...modes} />
      <p className="drill-sub">{sub}</p>
    </header>
  );
}

/** "When to reach for it": open on desktop, a single row on phones. */
function Cues({ g }: { g: PatternGuide }) {
  const [open, setOpen] = useState(isWide);
  return (
    <details className="disclosure tdrill-cues" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
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
  );
}

const BEST_TITLE: Record<Mode, string> = {
  pick: 'Your best first check picking the gaps',
  gaps: 'Your best first check filling the gaps',
  memory: 'Your best first try for this template',
};

/** The best score so far in this mode, in the session header. */
function BestChip({ best, mode }: { best: number | undefined; mode: Mode }) {
  if (best === undefined) return null;
  const what = BEST_TITLE[mode];
  return (
    <span className="tdrill-best" title={what}>
      <Trophy strokeWidth={2.2} aria-hidden="true" />
      <span className="sr-only">{what}: </span>
      <span aria-hidden="true">Best </span>
      {pct(best)}
    </span>
  );
}

/** Once checked, bring the result into view if any of it is hidden behind the header or the bar. */
function useResultScroll(ref: RefObject<HTMLElement | null>, checked: unknown) {
  useEffect(() => {
    if (!checked) return;
    // Waits a beat so the taller feedback bar has been measured into --actionbar-h (the page's
    // bottom padding), otherwise the scroll stops short.
    const t = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const bar = document.querySelector<HTMLElement>('.actionbar')?.offsetHeight ?? 0;
      if (r.top >= 64 && r.bottom <= window.innerHeight - bar) return;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      // A tall result: start with the first line to fix rather than the top of the window.
      const target = r.height > window.innerHeight - bar - 80 ? (el.querySelector<HTMLElement>('.diff.del, .diff.indent') ?? el) : el;
      target.scrollIntoView({ block: target === el ? 'start' : 'center', behavior: reduce ? 'auto' : 'smooth' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [checked]); // eslint-disable-line react-hooks/exhaustive-deps
}

function doneLook(acc: number) {
  return {
    icon: acc >= 1 ? Trophy : acc >= READY ? CircleCheck : acc >= 0.5 ? TrendingUp : Sprout,
    tone: (acc >= 1 ? 'warning' : acc >= READY ? 'success' : 'brand') as 'warning' | 'success' | 'brand',
  };
}

function Reference({ g, open }: { g: PatternGuide; open: boolean }) {
  const meta = CATEGORY_BY_ID[g.category];
  return (
    <details className="disclosure tdrill-ref" open={open}>
      <summary>
        <CodeXml aria-hidden="true" />
        The {meta.name} template
        <span className="tdrill-ref-meta">{g.template.split('\n').length} lines</span>
      </summary>
      <HighlightedCode code={g.template} />
    </details>
  );
}

/** What the action bar says once the gaps are checked (picked or typed): the first check sets the score. */
function gapsFeedback(grade: GapsGrade, checks: number, first: GapsGrade | null, input: 'pick' | 'gaps'): { title?: string; feedback?: string } {
  if (checks <= 1)
    return {
      feedback: grade.perfect
        ? `All ${grade.total} gaps right on the first check.`
        : `Your first check sets the score. Lines with a plus show the template: fix ${input === 'pick' ? 'your picks' : 'yours'}, or continue.`,
    };
  const kept = first ? pct(first.score) : '';
  return grade.perfect
    ? { title: 'All gaps right now', feedback: `Every gap matches now. Your score stays at ${kept} from the first check.` }
    : { feedback: `${gapsSummary(grade)}. Your score stays at ${kept} from the first check.` };
}

/** "New gaps": another set of lines, before the first check (after it, the round's score is set). */
function NewGapsButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="btn btn-quiet btn-sm tdrill-tool" onClick={onClick} title="Blank a different set of lines">
      <RefreshCw aria-hidden="true" />
      New gaps
    </button>
  );
}

interface GapsResult {
  grade: GapsGrade;
  xp: number;
  newBest: boolean;
}

/**
 * The end of a Pick the gaps or Fill the gaps round: the first check's score, XP, and the next
 * step. A strong round (80%+) makes the next rung the primary action ("Next: Fill the gaps" after
 * picking, "Now type it from memory" after typing; "Always pick" keeps picking); a weaker typed
 * round offers picking first while the ladder still counts the template as new. Every next step
 * brings a new set of lines (`onNext`), never the ones just answered.
 */
function GapsDone({
  g,
  input,
  result,
  setting,
  onNext,
}: {
  g: PatternGuide;
  input: 'pick' | 'gaps';
  result: GapsResult;
  setting: InputMode;
  /** Start the next round, in `mode` (default: this one). */
  onNext: (mode?: Mode) => void;
}) {
  const nav = useNavigate();
  const { back, backToUnit } = useBack(g);
  const meta = CATEGORY_BY_ID[g.category];
  const { grade, xp, newBest } = result;
  const acc = grade.score;
  const strong = acc >= READY;
  const look = doneLook(acc);
  const picked = input === 'pick';
  // One rung up after a strong round; one down after a weak typed round, where the ladder (read
  // after this round was recorded) still says pick.
  const up: Mode | null = strong ? (picked ? (setting === 'tap' ? null : 'gaps') : 'memory') : null;
  const [down] = useState<Mode | null>(() =>
    !picked && !strong && templateLadder(setting, getProgress().templates?.[g.category]) === 'pick' ? 'pick' : null,
  );
  const ready = picked ? ' Ready to type the missing lines yourself?' : ' Ready to type the whole thing from memory?';

  return (
    <SessionShell progress={1} onClose={() => nav(back)} title={<SessionTitle />}>
      <div className="tdrill-done">
        <Completion
          icon={look.icon}
          tone={look.tone}
          title={grade.perfect ? 'Every gap right' : strong ? 'Nearly perfect' : acc >= 0.5 ? 'Getting there' : 'Good effort'}
          subtitle={
            <>
              You {picked ? 'picked' : 'filled'} {grade.correct} of {grade.total} gaps in the <strong>{meta.name}</strong> template correctly on your
              first check.
              {strong ? `${newBest ? ' A new best.' : ''}${up ? ready : ''}` : ' Each new set of gaps helps it stick.'}
            </>
          }
          stats={[
            { label: 'Accuracy', value: pct(acc) },
            {
              label: 'Gaps correct',
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
          {up && (
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => onNext(up)}>
              {up === 'gaps' ? <TextCursorInput aria-hidden="true" /> : <PencilLine aria-hidden="true" />}
              {up === 'gaps' ? 'Next: Fill the gaps' : 'Now type it from memory'}
            </button>
          )}
          <button type="button" className={`btn btn-lg btn-block ${up ? 'btn-secondary' : 'btn-primary'}`} onClick={() => onNext()}>
            <RefreshCw aria-hidden="true" />
            Try new gaps
          </button>
          {down && (
            <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={() => onNext(down)}>
              <ListChecks aria-hidden="true" />
              Pick the gaps first
            </button>
          )}
          <Link to={back} className="btn btn-quiet btn-lg btn-block">
            <ArrowLeft aria-hidden="true" />
            {backToUnit ? 'Back to unit' : 'Back to Pattern guide'}
          </Link>
        </Completion>
        <Reference g={g} open={!grade.perfect} />
      </div>
    </SessionShell>
  );
}

// ── Pick the gaps ───────────────────────────────────────────────────────────

/**
 * The first rung, for a template that is still new: the template with about 30% of its lines as
 * slots, each picked from the template's line and plausible wrong ones (`usePickGaps`), in the
 * same window as Fill the gaps. Check once every slot has a pick.
 */
function PickDrill({ g, modes, setting, onChecked, onRestart, rounds }: DrillProps & { rounds: RefObject<Record<string, number>> }) {
  const nav = useNavigate();
  const { back } = useBack(g);
  const meta = CATEGORY_BY_ID[g.category];
  const src = useMemo(() => gapSource(g.template), [g]);
  const [startRound] = useState(() => rounds.current[g.category] ?? firstRound(getProgress().templates?.[g.category]));
  const ex = usePickGaps(src.lines, { keyLines: src.keyLines, exclude: src.header, round: startRound });
  // Read once: the best before this round, so the header and "New best" do not move mid-drill.
  const [prevBest] = useState(() => getProgress().templates?.[g.category]?.pickBest);
  const [first, setFirst] = useState<GapsGrade | null>(null);
  const [checks, setChecks] = useState(0);
  const [result, setResult] = useState<GapsResult | null>(null);
  // A keyboard arrives on the open slot's options; phones wait for a tap.
  const [autoFocus] = useState(isFinePointer);
  const workRef = useRef<HTMLDivElement>(null);
  const pickRef = useRef<PickGapsHandle>(null);

  useEffect(() => {
    rounds.current[g.category] = ex.round;
    if (autoFocus) pickRef.current?.focusOptions();
  }, [ex.round]); // eslint-disable-line react-hooks/exhaustive-deps

  useResultScroll(workRef, ex.revealed);

  if (result) {
    const next = (m?: Mode) => {
      rounds.current[g.category] = ex.round + 1;
      onRestart(m);
    };
    return <GapsDone g={g} input="pick" result={result} setting={setting} onNext={next} />;
  }

  const grade = ex.grade;
  const n = ex.gaps.length;
  const status: CheckStatus = ex.revealed ? (grade.perfect ? 'correct' : 'wrong') : 'idle';

  const check = () => {
    if (ex.revealed || !ex.complete) return;
    const r = ex.check();
    setChecks((c) => c + 1);
    if (!first) {
      setFirst(r);
      onChecked();
    }
    sfx(r.perfect ? 'correct' : 'wrong');
  };
  // "Fix and check again": the picks stay, the right ones lock, and the first wrong slot opens
  // with its options focused.
  const retry = () => {
    flushSync(ex.retry);
    pickRef.current?.focusOptions();
  };
  const finish = () => {
    if (!first) return;
    const acc = first.score;
    recordTemplate(g.category, acc, 'pick');
    const xp = Math.max(2, Math.round(XP.templatePickMax * acc));
    awardXp(xp, 'template');
    setResult({ grade: first, xp, newBest: prevBest !== undefined && acc > prevBest });
    sfx('complete');
    if (acc >= READY) confetti();
  };

  const { title, feedback } = ex.revealed ? gapsFeedback(grade, checks, first, 'pick') : {};
  const open = ex.gaps.filter((_, k) => !ex.locked[k]).length;
  const left = ex.gaps.filter((_, k) => !ex.locked[k] && !ex.values[k]).length;
  const note = open < n ? `${open} to fix` : left ? `${plural(left, 'line')} to pick` : 'Ready to check';

  return (
    <SessionShell
      progress={ex.revealed ? 1 : ex.filled / Math.max(1, n)}
      onClose={() => nav(back)}
      title={<SessionTitle />}
      right={<BestChip best={prevBest} mode="pick" />}
    >
      <div className="tdrill">
        <DrillHead
          g={g}
          modes={modes}
          title="Fill in the template"
          sub={
            first && !ex.revealed
              ? 'Fix the lines that were off, then check again. Your first check already set the score.'
              : 'Most of the template is here. Pick each missing line from its options, then check.'
          }
        />
        <Cues g={g} />
        <div ref={workRef} className="tdrill-work">
          <PickGapsWindow
            ref={pickRef}
            lines={src.lines}
            gaps={ex.gaps}
            choices={ex.choices}
            values={ex.values}
            active={ex.active}
            onActivate={ex.setActive}
            onPick={(k, o) => {
              ex.pick(k, o);
              sfx('tap');
            }}
            revealed={ex.revealed}
            locked={ex.locked}
            label={`${meta.name} template with ${plural(n, 'line')} to pick`}
            filename={`${g.category}.py`}
            meta="Pick the gaps"
            note={first ? `${note} · score kept from check 1` : note}
            className="tdrill-editor"
          />
        </div>
        <ActionBar
          status={status}
          step={`${ex.round}:${checks}`}
          canCheck={ex.complete}
          onCheck={check}
          onContinue={finish}
          title={title}
          feedback={feedback}
          secondary={first ? undefined : <NewGapsButton onClick={ex.fresh} />}
          checkedSecondary={status === 'wrong' ? <CheckedAction onClick={retry} /> : undefined}
        />
      </div>
    </SessionShell>
  );
}

// ── Fill the gaps ───────────────────────────────────────────────────────────

function GapsDrill({ g, modes, setting, onChecked, onRestart, rounds }: DrillProps & { rounds: RefObject<Record<string, number>> }) {
  const nav = useNavigate();
  const { back } = useBack(g);
  const meta = CATEGORY_BY_ID[g.category];
  const src = useMemo(() => gapSource(g.template), [g]);
  const [startRound] = useState(() => rounds.current[g.category] ?? firstRound(getProgress().templates?.[g.category]));
  const ex = useGaps(src.lines, { keyLines: src.keyLines, exclude: src.header, round: startRound });
  // Read once: the best before this round, so the header and "New best" do not move mid-drill.
  const [prevBest] = useState(() => getProgress().templates?.[g.category]?.gapsBest);
  const [first, setFirst] = useState<GapsGrade | null>(null);
  const [checks, setChecks] = useState(0);
  const [result, setResult] = useState<GapsResult | null>(null);
  // Phones wait for a tap, so the keyboard does not cover the template on arrival.
  const [autoFocus] = useState(isFinePointer);
  const workRef = useRef<HTMLDivElement>(null);
  const gapsRef = useRef<CodeGapsHandle>(null);

  useEffect(() => {
    rounds.current[g.category] = ex.round;
  }, [ex.round]); // eslint-disable-line react-hooks/exhaustive-deps

  useResultScroll(workRef, ex.revealed);

  if (result) {
    const next = (m?: Mode) => {
      rounds.current[g.category] = ex.round + 1;
      onRestart(m);
    };
    return <GapsDone g={g} input="gaps" result={result} setting={setting} onNext={next} />;
  }

  const grade = ex.grade;
  const status: CheckStatus = ex.revealed ? (grade.perfect ? 'correct' : 'wrong') : 'idle';
  const canCheck = ex.filled > 0;

  // Enter on the last gap and Ctrl/⌘ + Enter both land here.
  const check = () => {
    if (ex.revealed || !canCheck) return;
    const r = ex.check();
    setChecks((c) => c + 1);
    if (!first) {
      setFirst(r);
      onChecked();
    }
    sfx(r.perfect ? 'correct' : 'wrong');
  };
  // "Fix and check again": the gaps come back in this click (flushSync), so the first gap to fix
  // takes focus inside the tap and a phone opens its keyboard.
  const retry = () => {
    const k = ex.gaps.findIndex((_, j) => !ex.grade.results[j]?.ok);
    flushSync(ex.retry);
    gapsRef.current?.focus(k >= 0 ? k : undefined);
  };
  const finish = () => {
    if (!first) return;
    const acc = first.score;
    recordTemplate(g.category, acc, 'gaps');
    const xp = Math.max(2, Math.round(XP.templateGapsMax * acc));
    awardXp(xp, 'template');
    setResult({ grade: first, xp, newBest: prevBest !== undefined && acc > prevBest });
    sfx('complete');
    if (acc >= READY) confetti();
  };

  const { title, feedback } = ex.revealed ? gapsFeedback(grade, checks, first, 'gaps') : {};
  const left = ex.gaps.filter((_, k) => !ex.locked[k]).length;
  const leftNote = left === ex.gaps.length ? `${left} line${left === 1 ? '' : 's'} missing` : `${left} to fix`;

  return (
    <SessionShell
      progress={ex.revealed ? 1 : ex.filled / Math.max(1, ex.gaps.length)}
      onClose={() => nav(back)}
      title={<SessionTitle />}
      right={<BestChip best={prevBest} mode="gaps" />}
    >
      <div className="tdrill">
        <DrillHead
          g={g}
          modes={modes}
          title="Fill in the template"
          sub={
            first && !ex.revealed
              ? 'Fix the lines that were off, then check again. Your first check already set the score.'
              : 'Most of the template is here. Type each missing line, then check.'
          }
        />
        <Cues g={g} />
        <div ref={workRef} className="tdrill-work">
          <GapsWindow
            lines={src.lines}
            gaps={ex.gaps}
            values={ex.values}
            onChange={(v) => ex.setValues(v)}
            revealed={ex.revealed}
            locked={ex.locked}
            onSubmit={check}
            autoFocus={autoFocus}
            ref={gapsRef}
            label={`${meta.name} template with ${ex.gaps.length} missing line${ex.gaps.length === 1 ? '' : 's'}`}
            filename={`${g.category}.py`}
            meta="Fill the gaps"
            note={first ? `${leftNote} · score kept from check 1` : leftNote}
            className="tdrill-editor"
          />
        </div>
        <ActionBar
          status={status}
          step={`${ex.round}:${checks}`}
          canCheck={canCheck}
          onCheck={check}
          onContinue={finish}
          title={title}
          feedback={feedback}
          secondary={first ? undefined : <NewGapsButton onClick={ex.fresh} />}
          checkedSecondary={status === 'wrong' ? <CheckedAction onClick={retry} /> : undefined}
        />
      </div>
    </SessionShell>
  );
}

// ── From memory ─────────────────────────────────────────────────────────────

interface MemoryResult {
  grade: Grade;
  xp: number;
  newBest: boolean;
}

function MemoryDrill({ g, modes, onChecked, onRestart }: DrillProps) {
  const nav = useNavigate();
  const { back, backToUnit } = useBack(g);
  const progress = useProgress();
  const meta = CATEGORY_BY_ID[g.category];

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
  const [result, setResult] = useState<MemoryResult | null>(null);
  // Phones wait for a tap, so the keyboard does not cover the cues on arrival.
  const [autoFocus] = useState(isFinePointer);
  // Read once: the best before this round, so the header and "New best" do not move mid-drill.
  const [prevBest] = useState(() => {
    const t = progress.templates?.[g.category];
    return t && t.tries > 0 ? t.best : undefined;
  });
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const workRef = useRef<HTMLDivElement>(null);
  const hintId = useId();

  const status: CheckStatus = grade ? (grade.perfect ? 'correct' : 'wrong') : 'idle';

  // The hint panel sits under the editor, often below the fold or behind the action bar: bring
  // it into view when it opens (the bar sets the scroll padding), as the outline does in Code from memory.
  useEffect(() => {
    if (!hint) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    workRef.current?.querySelector('.tdrill-hint')?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }, [hint]);

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

  useResultScroll(workRef, grade);

  const check = () => {
    const r = gradeCode(text, answer);
    setGrade(r);
    setLatest(r);
    setAttempt((a) => a + 1);
    if (!first) {
      setFirst(r);
      onChecked();
    }
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
    if (acc >= READY) confetti();
  };

  const close = () => nav(back);

  if (result) {
    return (
      <MemoryDone
        g={g}
        meta={meta}
        result={result}
        attempts={attempt}
        back={back}
        backToUnit={backToUnit}
        next={nextTemplate(g.category, progress)}
        onRetry={() => onRestart()}
        onGaps={() => onRestart('gaps')}
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
      right={<BestChip best={prevBest} mode="memory" />}
    >
      <div className="tdrill">
        <DrillHead
          g={g}
          modes={modes}
          title="Write the template from memory"
          sub={
            fixing
              ? 'Fix the lines that were off, then check again. Your first try already set the score.'
              : 'Type it without looking, then check it line by line. Comments are optional.'
          }
        />
        <Cues g={g} />
        <div ref={workRef} className="tdrill-work">
          <CodeTyper
            value={text}
            onChange={setText}
            grade={grade}
            label={`${meta.name} template`}
            textareaRef={taRef}
            autoFocus={autoFocus}
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
          {/* Mounted up front, so opening the hint (and its XP cost) is announced */}
          <span className="sr-only" role="status">
            {hint && !grade ? `Hint shown under the editor: how each line starts.${capped ? ' XP halved for this attempt.' : ''}` : ''}
          </span>
        </div>

        <ActionBar
          status={status}
          step={attempt}
          canCheck={text.trim().length > 0}
          onCheck={check}
          onContinue={finish}
          title={status === 'correct' && attempt > 1 ? 'All lines right now' : undefined}
          feedback={
            status === 'wrong'
              ? attempt > 1
                ? 'Lines with a plus show the template. Your first check still sets the score.'
                : 'Your first check sets the score. Lines with a plus show the template: fix yours from memory, or continue.'
              : status === 'correct'
                ? attempt > 1
                  ? 'Every line matches now. Your first check still sets the score.'
                  : 'Every line matches the template.'
                : undefined
          }
          secondary={
            !hint ? (
              <>
                <button
                  type="button"
                  className="btn btn-quiet btn-sm tdrill-tool"
                  onClick={showHint}
                  title={first ? 'Shows how each line starts' : 'Shows how each line starts. Halves the XP before your first check.'}
                  aria-describedby={first ? undefined : hintId}
                >
                  <Lightbulb aria-hidden="true" />
                  Hint
                </button>
                {!first && (
                  <span id={hintId} className="sr-only">
                    Shows how each line starts. Using it before your first check halves the XP.
                  </span>
                )}
              </>
            ) : undefined
          }
          checkedSecondary={status === 'wrong' ? <CheckedAction onClick={fixAgain} /> : undefined}
        />
      </div>
    </SessionShell>
  );
}

function MemoryDone({
  g,
  meta,
  result,
  attempts,
  back,
  backToUnit,
  next,
  onRetry,
  onGaps,
  onClose,
}: {
  g: PatternGuide;
  meta: CategoryMeta;
  result: MemoryResult;
  attempts: number;
  back: string;
  backToUnit: boolean;
  next: CategoryMeta | null;
  onRetry: () => void;
  /** A weak run steps back down the ladder: fill the gaps first. */
  onGaps: () => void;
  onClose: () => void;
}) {
  const { grade, xp, newBest } = result;
  const acc = grade.score;
  const perfect = grade.perfect;
  const look = doneLook(acc);
  // The next unit opens in its own default mode, and Close there returns to the same kind of page.
  const nextState: TemplateDrillState | undefined = next
    ? { from: backToUnit ? `/unit/${next.id}` : `/patterns?p=${next.id}` }
    : undefined;

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
          icon={look.icon}
          tone={look.tone}
          title={perfect ? 'Flawless from memory' : acc >= READY ? 'Nearly perfect' : acc >= 0.5 ? 'Getting there' : 'Good effort'}
          subtitle={
            <>
              You wrote {grade.correct} of {grade.total} lines of the <strong>{meta.name}</strong> template correctly on the first try
              {grade.extra > 0 ? `, plus ${grade.extra} extra line${grade.extra === 1 ? '' : 's'}.` : '.'}
              {acc < READY
                ? ' Filling the gaps first will firm it up.'
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
              {acc < READY && (
                <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={onGaps}>
                  <TextCursorInput aria-hidden="true" />
                  Fill the gaps first
                </button>
              )}
              {nextBtn}
            </>
          )}
          <Link to={back} className="btn btn-quiet btn-lg btn-block">
            <ArrowLeft aria-hidden="true" />
            {backToUnit ? 'Back to unit' : 'Back to Pattern guide'}
          </Link>
        </Completion>
        <Reference g={g} open={!perfect} />
      </div>
    </SessionShell>
  );
}
