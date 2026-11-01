import '../styles/pages/lesson-player.css';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Check,
  Eye,
  Gauge,
  Keyboard,
  Lightbulb,
  ListChecks,
  Minus,
  MoveHorizontal,
  NotebookPen,
  Plus,
  RotateCcw,
  ScanSearch,
  Terminal,
  Wrench,
} from 'lucide-react';
import { CATEGORY_BY_ID } from '../content/categories';
import { FOUNDATIONS, guideFor } from '../content/index';
import type { CategoryId, PatternGuide, Slide, TypeSlide } from '../content/types';
import { codeLines, gradeBest, indentOf, type Grade } from '../lib/codegrade';
import { confetti } from '../lib/confetti';
import { XP } from '../lib/game';
import { HighlightedCode, highlightLine } from '../lib/highlight';
import { inline, Md } from '../lib/markdown';
import { shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { completeLesson, getProgress } from '../lib/store';
import { ActionBar, Choices, CodeWindow, type CheckStatus } from '../components/interact';
import { CheckedAction, CodeLine, CodePane, CodeTyper, GivenLines, TyperFooter, TyperWindow } from '../components/CodeTyper';
import { SessionShell } from '../components/Shell';
import { CATEGORY_ICON, LESSON_ICON, type LucideIcon } from '../components/icons';
import { Badge, Completion } from '../components/ui';

/** A slide plus optional presentation hints (eyebrow label, Lucide icon, file name, card footer). */
type PlayerSlide = Slide & { eyebrow?: string; icon?: LucideIcon; file?: string; foot?: { label: string; text: string } };

/** Turn a pattern guide into a short slide lesson. */
function guideSlides(g: PatternGuide): PlayerSlide[] {
  const meta = CATEGORY_BY_ID[g.category];
  const [q1, ...restQ] = g.quiz;
  return [
    { kind: 'text', eyebrow: 'The pattern', icon: CATEGORY_ICON[g.category], title: meta.name, body: g.summary },
    { kind: 'text', eyebrow: 'Analogy', icon: Lightbulb, title: 'Picture it like this', body: g.analogy },
    { kind: 'text', eyebrow: 'Recognize it', icon: ScanSearch, title: 'When to reach for it', body: g.whenToUse.map((w) => `- ${w}`).join('\n') },
    ...(q1 ? [{ kind: 'quiz' as const, ...q1 }] : []),
    {
      kind: 'code',
      eyebrow: 'Template',
      icon: Wrench,
      file: `${g.category}.py`,
      title: 'The reusable template',
      body: 'Most problems in this unit are a variation of this shape. You will see it again and again.',
      code: g.template,
    },
    {
      kind: 'text',
      eyebrow: 'Template',
      icon: NotebookPen,
      title: 'Template notes',
      body: g.templateNotes.map((n) => `- ${n}`).join('\n'),
      foot: { label: 'Typical cost', text: g.complexity },
    },
    ...restQ.map((q) => ({ kind: 'quiz' as const, ...q })),
  ];
}

interface Props {
  mode: 'foundation' | 'guide';
}

export function LessonPlayer({ mode }: Props) {
  const { lessonId, cat } = useParams();
  const nav = useNavigate();

  const lesson = useMemo(() => {
    if (mode === 'foundation') {
      const l = FOUNDATIONS.find((x) => x.id === lessonId);
      return l
        ? {
            key: `f:${l.id}`,
            title: l.title,
            slides: l.slides as PlayerSlide[],
            back: '/learn#foundations',
            Icon: LESSON_ICON[l.id] ?? BookOpen,
            kind: `Foundations · Lesson ${FOUNDATIONS.indexOf(l) + 1}`,
          }
        : null;
    }
    const g = guideFor(cat as CategoryId);
    return g
      ? {
          key: `g:${g.category}`,
          title: `${CATEGORY_BY_ID[g.category].name}`,
          slides: guideSlides(g),
          back: `/unit/${g.category}`,
          Icon: CATEGORY_ICON[g.category],
          kind: 'Pattern intro',
        }
      : null;
  }, [mode, lessonId, cat]);

  // Queue of slide indices. Missed quiz questions come back at the end.
  const [queue, setQueue] = useState<number[]>(() => (lesson ? lesson.slides.map((_, i) => i) : []));
  const [pos, setPos] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [firstTry, setFirstTry] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  // Captured once so the completion screen shows the XP actually awarded (repeats earn a third).
  const [repeat] = useState(() => (lesson ? !!getProgress().lessonsDone[lesson.key] : false));
  // "Your turn" slides: what the learner typed, the last check, how many checks, answer shown.
  const [code, setCode] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [tries, setTries] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);
  const codeRef = useRef<HTMLTextAreaElement | null>(null);
  // After a check or "Show answer", bring the code window into view above the action bar. Two
  // frames later: the feedback bar is taller, and the session only reserves room for it once its
  // new height has been measured.
  useEffect(() => {
    if (!grade && !revealed) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() =>
        document.querySelector('.lplayer-type-work')?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }),
      );
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [grade, revealed]);

  if (!lesson) return <Navigate to="/learn" replace />;

  const idx = queue[pos];
  const slide = lesson.slides[idx];
  const total = queue.length;
  const quizCount = lesson.slides.filter((s) => s.kind === 'quiz').length;
  const typeCount = lesson.slides.filter((s) => s.kind === 'type').length;
  // Quizzes and "Your turn" slides both count toward "First try".
  const scoredCount = quizCount + typeCount;

  const advance = () => {
    setSel(null);
    setStatus('idle');
    setCode('');
    setGrade(null);
    setTries(0);
    setRevealed(false);
    setHint(false);
    if (pos + 1 < queue.length) {
      setPos(pos + 1);
      window.scrollTo(0, 0);
    } else {
      const correctFirst = Object.values(firstTry).filter(Boolean).length;
      const xp = (mode === 'guide' ? XP.guide : XP.lesson) + correctFirst * XP.quizCorrect;
      setXpEarned(xp);
      completeLesson(lesson.key, xp);
      setDone(true);
      sfx('complete');
      confetti();
    }
  };

  if (done) {
    const correctFirst = Object.values(firstTry).filter(Boolean).length;
    const awarded = repeat ? Math.round(xpEarned / 3) : xpEarned;
    const stats = [
      { label: 'XP earned', value: `+${awarded}` },
      ...(scoredCount > 0
        ? [
            {
              label: 'First try',
              value: (
                <>
                  {correctFirst}
                  <span className="lplayer-of">/{scoredCount}</span>
                </>
              ),
            },
          ]
        : []),
      { label: 'Slides', value: lesson.slides.length },
    ];
    return (
      <SessionShell progress={1} onClose={() => nav(lesson.back)} title={lesson.title}>
        <div className="lplayer-done">
          <Completion
            icon={lesson.Icon}
            tone="success"
            title="Lesson complete"
            subtitle={
              <>
                <strong>{lesson.title}</strong> · {lesson.kind}
              </>
            }
            stats={stats}
          >
            {mode === 'foundation' ? (
              (() => {
                const i = FOUNDATIONS.findIndex((l) => l.id === lessonId);
                const nxt = FOUNDATIONS[i + 1];
                return nxt ? (
                  <Link to={`/foundations/${nxt.id}`} className="btn btn-primary btn-lg btn-block">
                    <span className="truncate">Next: {nxt.title}</span>
                    <ArrowRight />
                  </Link>
                ) : (
                  <Link to="/unit/arrays-hashing" className="btn btn-primary btn-lg btn-block">
                    <span className="truncate">Start Unit 1: Arrays &amp; Hashing</span>
                    <ArrowRight />
                  </Link>
                );
              })()
            ) : (
              <>
                <Link to={lesson.back} className="btn btn-primary btn-lg btn-block">
                  Start the problems
                  <ArrowRight />
                </Link>
                <Link to={`/patterns/${cat}/type`} state={{ from: lesson.back }} className="btn btn-secondary btn-lg btn-block">
                  <Keyboard />
                  Practice the template
                </Link>
              </>
            )}
            <Link to="/" className={`btn btn-lg btn-block ${mode === 'foundation' ? 'btn-secondary' : 'btn-quiet'}`}>
              Back to dashboard
            </Link>
          </Completion>
        </div>
      </SessionShell>
    );
  }

  const isQuiz = slide.kind === 'quiz';
  const isType = slide.kind === 'type';
  const isRequeue = pos >= lesson.slides.length;
  const check = () => {
    if (!isQuiz || sel === null) return;
    const ok = Number(sel) === slide.answer;
    setStatus(ok ? 'correct' : 'wrong');
    sfx(ok ? 'correct' : 'wrong');
    if (!(idx in firstTry)) setFirstTry((f) => ({ ...f, [idx]: ok }));
    if (!ok) setQueue((q) => [...q, idx]); // ask again later
  };

  // ── "Your turn" slides: write the code, check it line by line ──────────────
  const typeStatus: CheckStatus = isType && grade ? (grade.perfect ? 'correct' : 'wrong') : 'idle';
  const finePointer = !!window.matchMedia?.('(pointer: fine)').matches;
  const checkCode = () => {
    if (slide.kind !== 'type' || !code.trim()) return;
    const { grade: g } = gradeBest(code, [slide.answer, ...(slide.accept ?? [])]);
    setGrade(g);
    setTries((t) => t + 1);
    sfx(g.perfect ? 'correct' : 'wrong');
    if (!(idx in firstTry)) setFirstTry((f) => ({ ...f, [idx]: g.perfect }));
  };
  // Back to the editor with the learner's code kept and the caret at the end. flushSync mounts
  // the editor inside the click, so a phone opens its keyboard.
  const tryAgain = () => {
    flushSync(() => setGrade(null));
    const ta = codeRef.current;
    if (ta) {
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  };
  // Stuck: show the answer and move on. The slide comes back once at the end of the lesson.
  const revealAnswer = () => {
    if (!(idx in firstTry)) setFirstTry((f) => ({ ...f, [idx]: false }));
    if (!isRequeue) setQueue((q) => [...q, idx]);
    flushSync(() => {
      setRevealed(true);
      setGrade(null);
    });
    document.querySelector<HTMLButtonElement>('.actionbar .buttons > .btn:last-child')?.focus();
  };
  const showHint = () => {
    setHint(true);
    if (finePointer) requestAnimationFrame(() => codeRef.current?.focus());
  };

  // Eyebrow: quizzes say what they are; guide slides carry their own label; foundation slides say where
  // they sit in the course (the lesson title is already in the header).
  const quizNo = isQuiz ? lesson.slides.slice(0, idx + 1).filter((s) => s.kind === 'quiz').length : 0;
  const typeNo = isType ? lesson.slides.slice(0, idx + 1).filter((s) => s.kind === 'type').length : 0;
  const KickerIcon = isQuiz ? ListChecks : isType ? Keyboard : (slide.icon ?? lesson.Icon);
  const kicker = isQuiz
    ? `Check your understanding · ${quizNo} of ${quizCount}`
    : isType
      ? `Your turn · ${typeNo} of ${typeCount}`
      : (slide.eyebrow ?? lesson.kind);

  return (
    <SessionShell
      progress={pos / total}
      onClose={() => nav(lesson.back)}
      title={lesson.title}
      right={
        <span className="lplayer-count">
          <span className="sr-only">
            Slide {pos + 1} of {total}
          </span>
          <span aria-hidden="true">
            {pos + 1}
            <span className="lplayer-count-total">/{total}</span>
          </span>
        </span>
      }
    >
      <div className={`lplayer lplayer-${slide.kind}`}>
        <div className="kicker lplayer-kicker">
          <KickerIcon strokeWidth={2} />
          <span>{kicker}</span>
          {isRequeue && (
            <Badge tone="warning" pill>
              <RotateCcw />
              Missed earlier
            </Badge>
          )}
        </div>
        {slide.kind === 'type' ? (
          <TypeSlideView
            slide={slide}
            animKey={pos}
            code={code}
            setCode={setCode}
            grade={grade}
            revealed={revealed}
            hint={hint}
            comesBack={!isRequeue}
            autoFocus={finePointer}
            textareaRef={codeRef}
          />
        ) : (
          <SlideView slide={slide} sel={sel} setSel={setSel} status={status} animKey={pos} />
        )}
      </div>
      {slide.kind === 'type' ? (
        <ActionBar
          step={`${pos}:${tries}:${revealed ? 1 : 0}`}
          status={revealed ? 'idle' : typeStatus}
          onCheck={revealed ? undefined : checkCode}
          canCheck={code.trim().length > 0}
          onContinue={typeStatus === 'wrong' ? tryAgain : advance}
          continueLabel={typeStatus === 'wrong' ? 'Try again' : 'Continue'}
          title={grade && onlyIndentWrong(grade) ? 'Right code, wrong indentation' : undefined}
          feedback={grade ? <Md text={slide.explain} /> : undefined}
          // A miss: "Show answer" left of "Try again", as "Fix and check again" sits on the other typing screens.
          checkedSecondary={
            typeStatus === 'wrong' ? <CheckedAction onClick={revealAnswer} label="Show answer" short="Answer" icon={<Eye aria-hidden="true" />} /> : undefined
          }
          secondary={
            !revealed && ((slide.hint && !hint) || tries > 0) ? (
              <div className="lplayer-tools">
                {slide.hint && !hint && (
                  <button type="button" className="btn btn-quiet btn-sm" onClick={showHint}>
                    <Lightbulb aria-hidden="true" />
                    <span className="lplayer-tool-label">Hint</span>
                  </button>
                )}
                {tries > 0 && (
                  <button type="button" className="btn btn-quiet btn-sm" onClick={revealAnswer}>
                    <Eye aria-hidden="true" />
                    <span className="lplayer-tool-label">Show answer</span>
                  </button>
                )}
              </div>
            ) : undefined
          }
        />
      ) : (
        <ActionBar
          step={pos}
          status={isQuiz ? status : 'idle'}
          onCheck={isQuiz ? check : undefined}
          canCheck={sel !== null}
          onContinue={advance}
          feedback={isQuiz ? <Md text={slide.explain} /> : undefined}
          title={isQuiz && status === 'wrong' ? 'Not quite — it will come back later' : undefined}
        />
      )}
    </SessionShell>
  );
}

/** Every line is there and in order; only the indentation of some is off. */
const onlyIndentWrong = (g: Grade) => !g.perfect && g.wrongIndent > 0 && g.correct + g.wrongIndent === g.total && g.extra === 0;

function SlideView({
  slide,
  sel,
  setSel,
  status,
  animKey,
}: {
  slide: PlayerSlide;
  sel: string | null;
  setSel: (s: string) => void;
  status: CheckStatus;
  animKey: number;
}) {
  const order = useMemo(() => (slide.kind === 'quiz' ? shuffle(slide.options.map((_, i) => i)) : []), [slide]);
  if (slide.kind === 'type') return null; // rendered by TypeSlideView
  if (slide.kind === 'text') {
    return (
      <div className="lplayer-slide" key={animKey}>
        {slide.title && <h1 className="q-title">{slide.title}</h1>}
        <div className="lplayer-card">
          <Md text={slide.body} className="lplayer-prose" />
          {slide.foot && (
            <div className="lplayer-card-foot">
              <Gauge aria-hidden="true" />
              <div>
                <span className="lplayer-card-foot-label">{slide.foot.label}</span>
                {inline(slide.foot.text)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (slide.kind === 'code') {
    return (
      <div className="lplayer-slide" key={animKey}>
        {slide.title && <h1 className="q-title">{slide.title}</h1>}
        {slide.body && <Md text={slide.body} className="lplayer-lede" />}
        <CodeWindow filename={slide.file ?? 'example.py'}>
          <HighlightedCode code={slide.code} />
          {slide.output && <OutputPane text={slide.output} />}
        </CodeWindow>
      </div>
    );
  }
  return (
    <div className="lplayer-slide" key={animKey}>
      <div className="q-title lplayer-question" role="heading" aria-level={1}>
        <Md text={slide.q} />
      </div>
      {slide.code && (
        <CodeWindow className="lplayer-quiz-code" filename="example.py">
          <HighlightedCode code={slide.code} />
        </CodeWindow>
      )}
      <Choices
        options={order.map((i) => ({ key: String(i), label: inline(slide.options[i]) }))}
        selected={sel}
        onSelect={(k) => {
          setSel(k);
          sfx('tap');
        }}
        answer={String(slide.answer)}
        revealed={status !== 'idle'}
      />
    </div>
  );
}

/** Program output, docked under the code inside the CodeWindow like a terminal pane. */
function OutputPane({ text, label = 'Output' }: { text: string; label?: string }) {
  return (
    <div className="lplayer-output">
      <div className="lplayer-output-head">
        <Terminal aria-hidden="true" />
        {label}
      </div>
      <pre className="lplayer-output-body">
        {text.split('\n').map((l, i) => (
          <div key={i}>{l || ' '}</div>
        ))}
      </pre>
    </div>
  );
}

// ── "Your turn" slide ───────────────────────────────────────────────────────

/**
 * The learner writes the code: the task, an optional hint, then the typing window (read-only
 * starter lines and the editor; once checked, the line-by-line diff). After "Show answer" the
 * window shows the answer instead, with the explanation under it.
 */
function TypeSlideView({
  slide,
  animKey,
  code,
  setCode,
  grade,
  revealed,
  hint,
  comesBack,
  autoFocus,
  textareaRef,
}: {
  slide: TypeSlide;
  animKey: number;
  code: string;
  setCode: (v: string) => void;
  grade: Grade | null;
  revealed: boolean;
  hint: boolean;
  /** First visit: a revealed answer queues the slide again at the end of the lesson. */
  comesBack: boolean;
  autoFocus: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  const starter = slide.starter ? slide.starter.split('\n') : [];
  const expected = codeLines(slide.answer);
  const n = expected.length;
  // The answer is written at its real indentation under the starter (a function body is
  // indented); the editor starts typing at that column.
  const indent = n ? Math.min(...expected.map(indentOf)) : 0;
  const done = revealed || !!grade?.perfect;
  const output = slide.output ? <OutputPane text={slide.output} label={done ? 'Output' : 'Expected output'} /> : null;

  return (
    <div className="lplayer-slide" key={animKey}>
      {slide.title ? (
        <>
          <h1 className="q-title">{slide.title}</h1>
          <Md text={slide.prompt} className="lplayer-lede lplayer-type-prompt" />
        </>
      ) : (
        <div className="q-title lplayer-question" role="heading" aria-level={1}>
          <Md text={slide.prompt} />
        </div>
      )}

      {/* Mounted up front so the hint is announced when it appears */}
      <div aria-live="polite">
        {hint && slide.hint && !revealed && (
          <div className="callout callout-brand lplayer-type-hint">
            <Lightbulb aria-hidden="true" />
            <div className="grow">
              <div className="lplayer-type-hint-label">Hint</div>
              <Md text={slide.hint} />
            </div>
          </div>
        )}
      </div>

      {/* The code window and the diff legend, scrolled into view together after a check */}
      <div className="lplayer-type-work">
        {revealed ? (
          <TyperWindow filename="example.py" meta="Answer" footer={<TyperFooter note="One way to write it" keys={false} />}>
            <CodePane>
              <GivenLines lines={starter} />
              {slide.answer.split('\n').map((l, k) => (
                <CodeLine key={k} n={starter.length + 1 + k}>
                  {l === '' ? ' ' : highlightLine(l)}
                </CodeLine>
              ))}
            </CodePane>
            {output}
          </TyperWindow>
        ) : (
          <CodeTyper
            value={code}
            onChange={setCode}
            grade={grade}
            label={slide.title ? `Your code: ${slide.title}` : 'Your code'}
            given={starter}
            indent={indent}
            minRows={Math.max(2, n + 1)}
            autoFocus={autoFocus}
            placeholder="Type your code here"
            filename="example.py"
            note={`${n} line${n === 1 ? '' : 's'} to write`}
            // One-line answers never need Tab, so the hint keeps to the shortcut that checks.
            keys={n > 1 ? undefined : 'Ctrl/⌘ + Enter to check'}
            textareaRef={textareaRef}
            after={output}
          />
        )}
        {grade && !grade.perfect && <DiffKey grade={grade} />}
      </div>

      {revealed && (
        <div className="callout callout-info lplayer-type-explain">
          <BookOpen aria-hidden="true" />
          <div className="grow">
            <Md text={slide.explain} />
            {comesBack && <p className="lplayer-type-again">This one comes back at the end of the lesson, so you can write it from memory.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

const DIFF_KEY = [
  { kind: 'ok', Icon: Check, label: 'Correct' },
  { kind: 'del', Icon: Minus, label: 'Your line' },
  { kind: 'add', Icon: Plus, label: 'Expected' },
  { kind: 'indent', Icon: MoveHorizontal, label: 'Wrong indentation' },
] as const;

/** A legend for the diff markers, for learners seeing a diff for the first time. */
function DiffKey({ grade }: { grade: Grade }) {
  const kinds = new Set<string>(grade.rows.map((r) => r.kind));
  if (kinds.has('indent')) kinds.add('add'); // a wrong indent is followed by the expected line
  return (
    <ul className="lplayer-diff-key" aria-hidden="true">
      {DIFF_KEY.filter((k) => kinds.has(k.kind)).map(({ kind, Icon, label }) => (
        <li key={kind}>
          <span className={`lplayer-diff-sign ${kind}`}>
            <Icon strokeWidth={2.4} />
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}
