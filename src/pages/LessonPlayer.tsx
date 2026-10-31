import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { CATEGORY_BY_ID } from '../content/categories';
import { FOUNDATIONS, guideFor } from '../content/index';
import type { CategoryId, PatternGuide, Slide } from '../content/types';
import { confetti } from '../lib/confetti';
import { XP } from '../lib/game';
import { HighlightedCode } from '../lib/highlight';
import { inline, Md } from '../lib/markdown';
import { shuffle } from '../lib/random';
import { sfx } from '../lib/sound';
import { completeLesson } from '../lib/store';
import { ActionBar, Choices, type CheckStatus } from '../components/interact';
import { SessionShell } from '../components/Shell';

/** Turn a pattern guide into a short slide lesson. */
function guideSlides(g: PatternGuide): Slide[] {
  const meta = CATEGORY_BY_ID[g.category];
  const [q1, ...restQ] = g.quiz;
  return [
    { kind: 'text', title: `${meta.icon} ${meta.name}`, body: g.summary },
    { kind: 'text', title: '🧠 Picture it like this', body: g.analogy },
    { kind: 'text', title: '🔎 When to reach for it', body: g.whenToUse.map((w) => `- ${w}`).join('\n') },
    ...(q1 ? [{ kind: 'quiz' as const, ...q1 }] : []),
    {
      kind: 'code',
      title: '🧰 The reusable template',
      body: 'Most problems in this unit are a variation of this shape. You will see it again and again.',
      code: g.template,
    },
    { kind: 'text', title: '📝 Template notes', body: g.templateNotes.map((n) => `- ${n}`).join('\n') + `\n\n**Typical cost:** ${g.complexity}` },
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
      return l ? { key: `f:${l.id}`, title: l.title, slides: l.slides, back: '/learn#foundations', icon: l.icon } : null;
    }
    const g = guideFor(cat as CategoryId);
    return g
      ? { key: `g:${g.category}`, title: `${CATEGORY_BY_ID[g.category].name}`, slides: guideSlides(g), back: `/unit/${g.category}`, icon: CATEGORY_BY_ID[g.category].icon }
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
    return (
      <SessionShell progress={1} onClose={() => nav(lesson.back)}>
        <div className="complete">
          <div className="trophy">{lesson.icon}</div>
          <h1 style={{ marginTop: 12 }}>Lesson complete!</h1>
          <p className="muted">{lesson.title}</p>
          <div className="reward-tiles">
            <div className="reward" style={{ ['--c' as string]: 'var(--gold)' }}>
              <div className="rk">XP</div>
              <div className="rv">+{xpEarned}</div>
            </div>
            <div className="reward" style={{ ['--c' as string]: 'var(--green)' }}>
              <div className="rk">First try</div>
              <div className="rv">
                {correctFirst}/{quizCount}
              </div>
            </div>
            <div className="reward" style={{ ['--c' as string]: 'var(--blue)' }}>
              <div className="rk">Slides</div>
              <div className="rv">{lesson.slides.length}</div>
            </div>
          </div>
          <div className="stack" style={{ maxWidth: 360, margin: '0 auto' }}>
            {mode === 'foundation' ? (
              (() => {
                const i = FOUNDATIONS.findIndex((l) => l.id === lessonId);
                const nxt = FOUNDATIONS[i + 1];
                return nxt ? (
                  <Link to={`/foundations/${nxt.id}`} className="btn btn-green btn-block">
                    Next: {nxt.title}
                  </Link>
                ) : (
                  <Link to="/unit/arrays-hashing" className="btn btn-green btn-block">
                    Start Unit 1: Arrays &amp; Hashing
                  </Link>
                );
              })()
            ) : (
              <Link to={lesson.back} className="btn btn-green btn-block">
                Start the problems
              </Link>
            )}
            <Link to="/" className="btn btn-ghost btn-block">
              Home
            </Link>
          </div>
        </div>
      </SessionShell>
    );
  }

  const isQuiz = slide.kind === 'quiz';
  const check = () => {
    if (!isQuiz || sel === null) return;
    const ok = Number(sel) === slide.answer;
    setStatus(ok ? 'correct' : 'wrong');
    sfx(ok ? 'correct' : 'wrong');
    if (!(idx in firstTry)) setFirstTry((f) => ({ ...f, [idx]: ok }));
    if (!ok) setQueue((q) => [...q, idx]); // ask again later
  };

  return (
    <SessionShell progress={pos / total} onClose={() => nav(lesson.back)}>
      <div className="kicker">
        {lesson.icon} {lesson.title}
        {pos >= lesson.slides.length && <span className="chip brand">Review a missed one</span>}
      </div>
      <SlideView slide={slide} sel={sel} setSel={setSel} status={status} />
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
}: {
  slide: Slide;
  sel: string | null;
  setSel: (s: string) => void;
  status: CheckStatus;
}) {
  const order = useMemo(() => (slide.kind === 'quiz' ? shuffle(slide.options.map((_, i) => i)) : []), [slide]);
  if (slide.kind === 'text') {
    return (
      <div className="stack" key={slide.body}>
        {slide.title && <h2 className="q-title">{slide.title}</h2>}
        <div style={{ fontSize: '1.05rem' }}>
          <Md text={slide.body} />
        </div>
      </div>
    );
  }
  if (slide.kind === 'code') {
    return (
      <div className="stack">
        {slide.title && <h2 className="q-title">{slide.title}</h2>}
        {slide.body && <Md text={slide.body} />}
        <HighlightedCode code={slide.code} />
        {slide.output && (
          <div>
            <div className="tiny muted" style={{ fontWeight: 800, marginBottom: 4 }}>
              OUTPUT
            </div>
            <pre className="code" style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              {slide.output.split('\n').map((l, i) => (
                <div className="code-line" key={i}>
                  {l || ' '}
                </div>
              ))}
            </pre>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="stack">
      <div className="q-title">
        <Md text={slide.q} />
      </div>
      {slide.code && <HighlightedCode code={slide.code} />}
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
