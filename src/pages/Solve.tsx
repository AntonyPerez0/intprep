// Solve it yourself (/p/:id/solve): a blank file under the problem's signature, run against its
// tests with real Python (lib/python.ts). Three uses of one screen:
// - Before the lesson ("Try it first" / "I know this one"): passing the tests adds the problem to
//   the review deck a week out and skips the lesson (`learnProblem` with `testedOut`).
// - After it: proof that the learner can produce the code unaided, not only recognize it.
// - A mock interview (?mock=1, started from /mock): the same screen against the clock, with no
//   pattern name and no way to the lesson until it ends.
//
// The draft is kept for the tab's lifetime (sessionStorage), so a reload or a phone that drops the
// tab does not lose the code, and a mock keeps its clock.

import '../styles/pages/solve.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, CircleCheck, CodeXml, GraduationCap, Hourglass, Play, RotateCcw, Timer, TriangleAlert, Trophy } from 'lucide-react';
import { CATEGORY_BY_ID } from '../content/categories';
import { PROBLEM_BY_ID } from '../content/index';
import type { Difficulty, Problem } from '../content/types';
import { codeLines, indentOf, withGiven } from '../lib/codegrade';
import { confetti } from '../lib/confetti';
import { XP } from '../lib/game';
import { parseSolution } from '../lib/parseSolution';
import { pythonEnabled, warmPython, type JudgeResult } from '../lib/python';
import { sfx } from '../lib/sound';
import { awardXp, flagForReview, learnProblem, recordMock, recordSolved, useProgress } from '../lib/store';
import { CodeEditor, TyperFooter, TyperWindow } from '../components/CodeTyper';
import { ActionBar, CodeView, ProblemPrompt } from '../components/interact';
import { PythonLoading, runLabel, TestReport, useTestRun } from '../components/RunResults';
import { SessionShell } from '../components/Shell';
import { Completion, DifficultyChip } from '../components/ui';

/** Minutes a mock interview allows, by difficulty: about what an interviewer gives one problem. */
export const MOCK_MINUTES: Record<Difficulty, number> = { Easy: 15, Medium: 25, Hard: 40 };

const draftKey = (id: string, mock: boolean) => `intprep.solve.${mock ? 'mock.' : ''}${id}`;

interface Draft {
  text: string;
  /** When a mock interview started (ms). */
  startedAt?: number;
  submits: number;
  /** Seconds taken when every test passed: the clock stopped there, even across a reload. */
  solvedIn?: number;
}

function loadDraft(id: string, mock: boolean): Draft {
  try {
    const raw = sessionStorage.getItem(draftKey(id, mock));
    const d = raw ? (JSON.parse(raw) as Partial<Draft>) : null;
    if (d && typeof d.text === 'string')
      return {
        text: d.text,
        startedAt: typeof d.startedAt === 'number' ? d.startedAt : undefined,
        submits: typeof d.submits === 'number' ? d.submits : 0,
        solvedIn: typeof d.solvedIn === 'number' ? d.solvedIn : undefined,
      };
  } catch {
    /* no session storage: the draft lives in memory */
  }
  return { text: '', submits: 0 };
}

function saveDraft(id: string, mock: boolean, d: Draft | null) {
  try {
    if (d) sessionStorage.setItem(draftKey(id, mock), JSON.stringify(d));
    else sessionStorage.removeItem(draftKey(id, mock));
  } catch {
    /* ignore */
  }
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function SolveRoute() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const p = id ? PROBLEM_BY_ID[id] : undefined;
  if (!p) return <Navigate to="/problems" replace />;
  const mock = params.get('mock') === '1';
  return <Solve key={`${p.id}:${mock}`} p={p} mock={mock} />;
}

type Outcome = { kind: 'solved'; seconds: number; firstTime: boolean; added: boolean; xp: number } | { kind: 'ended'; seconds: number; timeUp: boolean };

function Solve({ p, mock }: { p: Problem; mock: boolean }) {
  const nav = useNavigate();
  const progress = useProgress();
  const learned = !!progress.problems[p.id]?.learnedAt;
  const parsed = useMemo(() => parseSolution(p.solution), [p]);
  const given = parsed.chunks.filter((c) => c.header).flatMap((c) => c.lines);
  const body = parsed.chunks.filter((c) => !c.header).flatMap((c) => c.lines);
  const bodyIndents = body.filter((l) => l.trim()).map(indentOf);
  const indent = Math.min(16, bodyIndents.length ? Math.min(...bodyIndents) : 0);
  const lastGiven = given[given.length - 1] ?? '';
  const fn = indent > indentOf(lastGiven) ? lastGiven.match(/^\s*def (\w+)\(/)?.[1] : undefined;

  const [draft] = useState(() => loadDraft(p.id, mock));
  const [text, setTextState] = useState(draft.text);
  const startedAt = useRef(draft.startedAt ?? Date.now());
  const submits = useRef(draft.submits);
  const solvedIn = useRef(draft.solvedIn);
  const persist = (t: string) => saveDraft(p.id, mock, { text: t, startedAt: startedAt.current, submits: submits.current, solvedIn: solvedIn.current });
  const setText = (t: string) => {
    setTextState(t);
    persist(t);
  };
  useEffect(() => {
    persist(text);
    warmPython();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runner = useTestRun(p);
  const [report, setReport] = useState<{ result: JudgeResult; mode: 'examples' | 'submit' } | null>(null);
  // The result lands under the editor, often below the screen: bring it into view after every run,
  // or "Run examples" looks as if it did nothing.
  const reportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!report) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Two frames: after the action bar has settled (it sets the scroll padding).
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => reportRef.current?.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }));
    });
    return () => cancelAnimationFrame(raf);
  }, [report]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [solved, setSolved] = useState(draft.solvedIn !== undefined);

  // The mock interview's clock.
  const limit = MOCK_MINUTES[p.difficulty] * 60;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!mock || outcome || solved) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [mock, outcome, solved]);
  const elapsed = Math.max(0, (now - startedAt.current) / 1000);
  const left = Math.max(0, limit - elapsed);
  const timeUp = mock && left <= 0;

  const end = (o: Outcome) => {
    saveDraft(p.id, mock, null);
    setOutcome(o);
  };
  // Time ran out: the interview is over (the code so far stays on the result screen's way back).
  useEffect(() => {
    if (!timeUp || outcome || solved) return;
    recordMock(p.id, p.difficulty, false, limit);
    if (learned) flagForReview(p.id);
    awardXp(5, 'mock');
    sfx('wrong');
    end({ kind: 'ended', seconds: limit, timeUp: true });
  }, [timeUp]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pythonEnabled()) {
    return (
      <SessionShell progress={null} onClose={() => nav(`/p/${p.id}`)} title="Solve it yourself">
        <div className="solve-off">
          <h1>Running code is turned off</h1>
          <p>
            Solving a problem yourself needs IntPrep to run your code. Turn on <strong>Run my code</strong> in your profile, or practice this
            problem in Code from memory, which compares your code with the solution line by line.
          </p>
          <div className="solve-off-actions">
            <Link to="/profile" className="btn btn-primary">
              Open profile
            </Link>
            <Link to={`/p/${p.id}/rebuild?mode=scratch`} className="btn btn-secondary">
              Code from memory
            </Link>
          </div>
        </div>
      </SessionShell>
    );
  }

  const code = () => withGiven(given, text, indent);
  const run = async (mode: 'examples' | 'submit') => {
    if (runner.busy) return;
    if (mode === 'submit') {
      submits.current += 1;
      persist(text);
    }
    const result = await runner.run(code(), mode);
    if (!result) return;
    setReport({ result, mode });
    const ok = result.status === 'done' && result.total > 0 && result.passed === result.total;
    if (mode === 'submit') sfx(ok ? 'correct' : 'wrong');
    if (mode === 'submit' && ok) {
      // The clock stops here, and a reload before Continue finds the problem still solved.
      solvedIn.current = Math.round((Date.now() - startedAt.current) / 1000);
      persist(text);
      setSolved(true);
    }
  };

  const finishSolved = () => {
    const seconds = solvedIn.current ?? Math.round((Date.now() - startedAt.current) / 1000);
    let xp = 0;
    let added = false;
    if (!learned) {
      // Solved unaided before the lesson: it joins the review deck a week out. (Before
      // `recordSolved`, which marks a learned problem's code as proven.)
      xp = XP.problem[p.difficulty];
      learnProblem(p.id, p.difficulty, xp, { testedOut: true });
      added = true;
    }
    const firstTime = recordSolved(p.id, p.difficulty);
    if (learned) {
      xp = firstTime || mock ? XP.scratchMax : 10;
      awardXp(xp, 'solve');
    }
    if (mock) recordMock(p.id, p.difficulty, true, seconds);
    sfx('complete');
    confetti();
    end({ kind: 'solved', seconds, firstTime, added, xp });
  };
  const giveUp = () => {
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    if (mock) {
      recordMock(p.id, p.difficulty, false, seconds);
      if (learned) flagForReview(p.id);
      awardXp(5, 'mock');
      end({ kind: 'ended', seconds, timeUp: false });
    } else {
      saveDraft(p.id, mock, null);
      nav(learned ? `/p/${p.id}` : `/p/${p.id}/learn`);
    }
  };

  const title = mock ? 'Mock interview' : 'Solve it yourself';

  if (outcome) {
    const lesson = (
      <Link to={`/p/${p.id}/learn`} className="btn btn-secondary btn-lg btn-block">
        <GraduationCap aria-hidden="true" />
        {learned || (outcome.kind === 'solved' && outcome.added) ? 'Take the guided lesson anyway' : 'Take the guided lesson'}
      </Link>
    );
    return (
      <SessionShell progress={1} onClose={() => nav(mock ? '/mock' : `/p/${p.id}`)} title={title}>
        <div className="solve-done">
          {outcome.kind === 'solved' ? (
            <Completion
              icon={mock ? Trophy : CircleCheck}
              tone={mock ? 'warning' : 'success'}
              title={mock ? 'Interview passed' : outcome.added ? 'Solved without the lesson' : 'Solved from a blank file'}
              subtitle={
                <>
                  Your {p.title} passed every test{mock ? ` with ${clock(Math.max(0, limit - outcome.seconds))} left on the clock` : ''}.
                  {outcome.added && ' It is in your review deck now and comes back in a week, so you can skip its lesson.'}
                </>
              }
              stats={[
                { label: 'Time', value: clock(outcome.seconds) },
                { label: 'Submissions', value: submits.current },
                { label: 'XP earned', value: `+${outcome.xp}` },
              ]}
            >
              {mock ? (
                <Link to="/mock" className="btn btn-primary btn-lg btn-block">
                  <RotateCcw aria-hidden="true" />
                  Another mock interview
                </Link>
              ) : (
                <Link to="/" className="btn btn-primary btn-lg btn-block">
                  Back to dashboard
                  <ArrowRight aria-hidden="true" />
                </Link>
              )}
              {lesson}
            </Completion>
          ) : (
            <Completion
              icon={Hourglass}
              tone="brand"
              title={outcome.timeUp ? 'Time is up' : 'Interview ended'}
              subtitle={
                <>
                  {outcome.timeUp ? `The ${MOCK_MINUTES[p.difficulty]} minutes ran out before ${p.title} passed its tests.` : `You stopped before ${p.title} passed its tests.`}{' '}
                  {learned ? 'It is back in today’s review, and its lesson is one tap away.' : 'That is what the lesson is for: this one was new to you.'}
                </>
              }
              stats={[
                { label: 'Time', value: clock(outcome.seconds) },
                { label: 'Submissions', value: submits.current },
              ]}
            >
              <Link to={`/p/${p.id}/learn`} className="btn btn-primary btn-lg btn-block">
                <GraduationCap aria-hidden="true" />
                {learned ? 'Go through the lesson again' : 'Take the guided lesson'}
              </Link>
              <Link to="/mock" className="btn btn-secondary btn-lg btn-block">
                <RotateCcw aria-hidden="true" />
                Another mock interview
              </Link>
            </Completion>
          )}
          <details className="disclosure solve-solution">
            <summary>
              <CodeXml aria-hidden="true" />
              {outcome.kind === 'solved' ? 'Compare with the taught solution' : 'View the solution'}
            </summary>
            <CodeView lines={parsed.lines} />
          </details>
        </div>
      </SessionShell>
    );
  }

  const cat = CATEGORY_BY_ID[p.category];
  const failed = report && report.mode === 'submit' && !solved;
  const written = codeLines(text).length;
  const low = mock && left <= 120;

  return (
    <SessionShell
      progress={mock ? 1 - left / limit : solved ? 1 : null}
      progressColor={low ? 'var(--danger)' : undefined}
      progressLinear={mock}
      onClose={() => {
        // Leaving a mock interview ends it: its clock must not keep running for the next time
        // this problem is drawn. (A plain attempt keeps its draft for later.)
        if (mock && !solved) saveDraft(p.id, true, null);
        nav(mock ? '/mock' : `/p/${p.id}`);
      }}
      title={title}
      right={
        mock ? (
          <span className={`solve-clock ${low ? 'is-low' : ''}`} role="timer" aria-label={`${clock(left)} left`}>
            <Timer aria-hidden="true" />
            {clock(left)}
          </span>
        ) : undefined
      }
    >
      <div className="solve">
        <header className="solve-head">
          <div className="kicker">{mock ? 'Mock interview · no hints, no pattern name' : learned ? `${cat.name} · from a blank file` : 'Before the lesson'}</div>
          <div className="solve-title-row">
            <h1>{p.title}</h1>
            <DifficultyChip d={p.difficulty} />
          </div>
          <p className="solve-sub">
            {mock
              ? `You have ${MOCK_MINUTES[p.difficulty]} minutes. Talk through your approach out loud, as you would to an interviewer, then write it. Run the examples as often as you like; Submit runs every test.`
              : learned
                ? 'Write a working solution without looking. Any correct code passes: it is run against the tests, not compared with the lesson’s.'
                : 'Think you can solve it already? Write a working solution and it joins your reviews without the lesson. If you get stuck, the lesson is one tap away.'}
          </p>
        </header>

        <ProblemPrompt p={p} showTitle={false} />

        <TyperWindow
          status={solved ? 'correct' : 'idle'}
          filename="solution.py"
          meta={mock ? 'Mock interview' : 'Your solution'}
          className="solve-editor"
          footer={<TyperFooter note={`${written} line${written === 1 ? '' : 's'} written`} keys="Tab to indent · Ctrl/⌘ + Enter to submit" />}
        >
          <CodeEditor
            value={text}
            onChange={(t) => {
              setText(t);
            }}
            label="Your solution"
            given={given}
            indent={indent}
            minRows={8}
            disabled={solved || runner.busy}
            placeholder={fn ? `Write the body of ${fn}` : given.length ? 'Write the rest of the code' : 'Write the whole solution'}
          />
        </TyperWindow>
        <PythonLoading show={runner.loadingPython} />
        {runner.phase === 'unavailable' && (
          <div className="callout callout-warning solve-nopython" role="alert">
            <TriangleAlert aria-hidden="true" />
            <div>
              Python could not be started, so your code was not run. It is downloaded once (about 7 MB) and then works offline: check your connection and
              press Submit again. Your code is kept.
            </div>
          </div>
        )}

        {report && (
          <div className="solve-report" ref={reportRef}>
            {report.mode === 'examples' && report.result.status === 'done' && report.result.total === 0 ? (
              <div className="run-report" role="status">
                <div className="run-summary">
                  <span>This problem’s examples are described in words, so there is nothing to run here. Submit runs the tests.</span>
                </div>
              </div>
            ) : report.mode === 'examples' && report.result.status === 'done' && report.result.passed === report.result.total ? (
              <div className="run-report is-good" role="status">
                <div className="run-summary">
                  <CircleCheck aria-hidden="true" />
                  <span>
                    The {report.result.total === 1 ? 'example passes' : `${report.result.total} examples pass`}. Submit to run every test.
                  </span>
                </div>
              </div>
            ) : (
              <TestReport result={report.result} />
            )}
          </div>
        )}

        {!solved && (
          <div className="solve-stuck">
            <button type="button" className="btn btn-quiet btn-sm" onClick={giveUp}>
              {mock ? 'End the interview' : learned ? 'Stop here' : 'I am stuck: take the lesson'}
            </button>
          </div>
        )}

        <ActionBar
          status={solved ? 'correct' : 'idle'}
          step={submits.current}
          canCheck={text.trim().length > 0 && !runner.busy}
          checkLabel={runLabel(runner, 'Submit')}
          onCheck={() => void run('submit')}
          onContinue={finishSolved}
          title={solved ? 'Every test passed' : undefined}
          feedback={
            solved
              ? learned
                ? 'You wrote a working solution from a blank file.'
                : 'You solved it before the lesson.'
              : undefined
          }
          secondary={
            <button type="button" className="btn btn-secondary btn-lg solve-run" disabled={!text.trim() || runner.busy} onClick={() => void run('examples')}>
              <Play aria-hidden="true" />
              <span>Run examples</span>
            </button>
          }
        />
        {failed && <span className="sr-only" role="status">{`${report.result.passed} of ${report.result.total} tests passed`}</span>}
      </div>
    </SessionShell>
  );
}
