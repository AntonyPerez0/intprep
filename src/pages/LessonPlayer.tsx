import '../styles/pages/lesson-player.css';
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, FileCode2, Gauge, Lightbulb, ListChecks, NotebookPen, RotateCcw, ScanSearch, Terminal, Wrench } from 'lucide-react';
import { CATEGORY_BY_ID } from '../content/categories';
import { FOUNDATIONS, guideFor } from '../content/index';
import type { CategoryId, PatternGuide, Slide } from '../content/types';
import { confetti } from '../lib/confetti';
import { XP } from '../lib/game';
import { HighlightedCode } from '../lib/highlight';
import { inline, Md } from '../lib/markdown';
import { shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { completeLesson, getProgress } from '../lib/store';
import { ActionBar, Choices, type CheckStatus } from '../components/interact';
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
    { kind: 'text', eyebrow: 'Recognise it', icon: ScanSearch, title: 'When to reach for it', body: g.whenToUse.map((w) => `- ${w}`).join('\n') },
    ...(q1 ? [{ kind: 'quiz' as const, ...q1 }] : []),
    {
      kind: 'code',
      eyebrow: 'Template',
      icon: Wrench,
      file: 'template.py',
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

  if (!lesson) return <Navigate to="/learn" replace />;

  const idx = queue[pos];
  const slide = lesson.slides[idx];
  const total = queue.length;
  const quizCount = lesson.slides.filter((s) => s.kind === 'quiz').length;

  const advance = () => {
    setSel(null);
    setStatus('idle');
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
      ...(quizCount > 0
        ? [
            {
              label: 'First try',
              value: (
                <>
                  {correctFirst}
                  <span className="lplayer-of">/{quizCount}</span>
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
                <span className="lplayer-done-kind">{lesson.kind}</span>
                <strong>{lesson.title}</strong>
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
              <Link to={lesson.back} className="btn btn-primary btn-lg btn-block">
                Start the problems
                <ArrowRight />
              </Link>
            )}
            <Link to="/" className="btn btn-secondary btn-lg btn-block">
              Back to dashboard
            </Link>
          </Completion>
        </div>
      </SessionShell>
    );
  }

  const isQuiz = slide.kind === 'quiz';
  const isRequeue = pos >= lesson.slides.length;
  const check = () => {
    if (!isQuiz || sel === null) return;
    const ok = Number(sel) === slide.answer;
    setStatus(ok ? 'correct' : 'wrong');
    sfx(ok ? 'correct' : 'wrong');
    if (!(idx in firstTry)) setFirstTry((f) => ({ ...f, [idx]: ok }));
    if (!ok) setQueue((q) => [...q, idx]); // ask again later
  };

  // Eyebrow: quizzes say what they are; guide slides carry their own label; foundation slides say where
  // they sit in the course (the lesson title is already in the header).
  const quizNo = isQuiz ? lesson.slides.slice(0, idx + 1).filter((s) => s.kind === 'quiz').length : 0;
  const KickerIcon = isQuiz ? ListChecks : (slide.icon ?? lesson.Icon);
  const kicker = isQuiz ? `Check your understanding · ${quizNo} of ${quizCount}` : (slide.eyebrow ?? lesson.kind);

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
        <SlideView slide={slide} sel={sel} setSel={setSel} status={status} animKey={pos} />
      </div>
      <ActionBar
        status={isQuiz ? status : 'idle'}
        onCheck={isQuiz ? check : undefined}
        canCheck={sel !== null}
        onContinue={advance}
        feedback={isQuiz ? <Md text={slide.explain} /> : undefined}
        title={isQuiz && status === 'wrong' ? 'Not quite — it will come back later' : undefined}
      />
    </SessionShell>
  );
}

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
        <div className="lplayer-codewin">
          <div className="lplayer-codewin-head">
            <FileCode2 />
            <span>{slide.file ?? 'example.py'}</span>
            <span className="lplayer-codewin-lang">Python</span>
          </div>
          <HighlightedCode code={slide.code} />
          {slide.output && (
            <div className="lplayer-output">
              <div className="lplayer-output-head">
                <Terminal />
                Output
              </div>
              <pre className="lplayer-output-body">
                {slide.output.split('\n').map((l, i) => (
                  <div key={i}>{l || ' '}</div>
                ))}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="lplayer-slide" key={animKey}>
      <div className="q-title lplayer-question" role="heading" aria-level={1}>
        <Md text={slide.q} />
      </div>
      {slide.code && (
        <div className="lplayer-codewin lplayer-quiz-code">
          <HighlightedCode code={slide.code} />
        </div>
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
