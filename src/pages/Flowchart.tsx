// The pattern flowchart (/flowchart, /flowchart?path=plain.none.piece.window): a few questions
// about a problem's wording, answered one at a time, that end at the pattern to try first
// (src/content/flow.ts). The answers so far stay listed above the question and each can be
// changed; the route is kept in the address, so Back undoes one answer and a result can be
// linked to. Under it, the whole chart as an outline, to read and learn in one piece.

import '../styles/pages/flowchart.css';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen, ChevronRight, CornerDownRight, ListTree, Quote, RotateCcw } from 'lucide-react';
import { CATEGORIES, CATEGORY_BY_ID } from '../content/categories';
import { FLOW, FLOW_BY_ID, FLOW_OFF_CHART, FLOW_START } from '../content/flow';
import { PROBLEM_BY_ID, PROBLEMS } from '../content/index';
import type { FlowLeaf, FlowNode, FlowOption } from '../content/types';
import { inline } from '../lib/markdown';
import { isDue } from '../lib/srs';
import { useProgress, type Progress } from '../lib/store';
import { BeginnerNote } from '../components/BeginnerNote';
import { CategoryIcon } from '../components/icons';
import { ClueList } from '../components/Memorize';
import { PageHeader } from '../components/Shell';

interface Step {
  node: FlowNode;
  option: FlowOption;
}

/** Walk a route (option ids from the start). It stops at the first id that is not an option. */
function follow(path: string[]): { steps: Step[]; node: FlowNode | null; leaf: FlowLeaf | null } {
  const steps: Step[] = [];
  let node = FLOW_BY_ID[FLOW_START];
  for (const id of path) {
    const option = node.options.find((o) => o.id === id);
    if (!option) break;
    steps.push({ node, option });
    if (option.leaf) return { steps, node: null, leaf: option.leaf };
    node = FLOW_BY_ID[option.to!];
  }
  return { steps, node, leaf: null };
}

/**
 * The shortest route to each question. The outline draws a question under that route only;
 * another option that leads to it says "continue at" instead of repeating it.
 */
const HOME: Record<string, string[]> = (() => {
  const home: Record<string, string[]> = { [FLOW_START]: [] };
  const queue = [FLOW_START];
  while (queue.length) {
    const id = queue.shift()!;
    for (const o of FLOW_BY_ID[id].options) {
      if (o.to && !(o.to in home)) {
        home[o.to] = [...home[id], o.id];
        queue.push(o.to);
      }
    }
  }
  return home;
})();

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function Flowchart() {
  const progress = useProgress();
  const [params, setParams] = useSearchParams();
  const raw = params.get('path') ?? '';
  const { steps, node, leaf } = useMemo(() => follow(raw ? raw.split('.') : []), [raw]);
  const ids = steps.map((s) => s.option.id);
  const go = (path: string[]) => setParams(path.length ? { path: path.join('.') } : {});

  // After an answer, the next question (or the result) takes the focus and comes into view.
  const now = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      // A linked result: bring it into view, but leave the focus at the top of the page.
      if (!raw) return;
    } else now.current?.focus({ preventScroll: true });
    const el = now.current?.closest('.flow-now');
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 72 || r.top > window.innerHeight * 0.5) el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
  }, [raw]);

  // The outline starts open where there is room for it beside nothing else; on a phone it is one tap away.
  const [chartOpen, setChartOpen] = useState(() => !!window.matchMedia?.('(min-width: 900px)').matches);
  const onChart = PROBLEMS.length - FLOW_OFF_CHART.length;

  return (
    <div className="flow">
      <PageHeader
        title="Pattern flowchart"
        sub="Read the problem, answer a few questions about its wording, and end at the pattern to try first."
        right={
          <>
            <Link to="/patterns" className="btn btn-secondary">
              <BookOpen aria-hidden="true" />
              Pattern guide
            </Link>
            <Link to="/clues" className="btn btn-secondary">
              <Quote aria-hidden="true" />
              Drill the clue words
            </Link>
          </>
        }
      />

      <BeginnerNote p={progress} what="The flowchart" />

      <div className="flow-walk">
        {steps.length > 0 && (
          <ol className="flow-trail" aria-label="Your answers so far">
            {steps.map((s, k) => (
              <li key={s.node.id} className="flow-trail-step">
                <span className="flow-trail-n tabular" aria-hidden="true">
                  {k + 1}
                </span>
                <span className="flow-trail-text">
                  <span className="flow-trail-q">{s.node.ask}</span>
                  <span className="flow-trail-a">{inline(s.option.label)}</span>
                </span>
                <button type="button" className="btn btn-quiet btn-sm" aria-label={`Change answer ${k + 1}: ${s.node.ask}`} onClick={() => go(ids.slice(0, k))}>
                  Change
                </button>
              </li>
            ))}
          </ol>
        )}

        {node && (
          <section className="flow-now flow-question" aria-labelledby="flow-ask">
            <div className="eyebrow">Question {steps.length + 1}</div>
            <h2 id="flow-ask" ref={now} tabIndex={-1}>
              {node.ask}
            </h2>
            {node.help && <p className="flow-help">{node.help}</p>}
            <ul className="flow-options" role="list">
              {node.options.map((o) => (
                <li key={o.id}>
                  <button type="button" className="flow-option" onClick={() => go([...ids, o.id])}>
                    <span className="flow-option-text">
                      <span className="flow-option-label">{inline(o.label)}</span>
                      {o.hint && <span className="flow-option-hint">{inline(o.hint)}</span>}
                    </span>
                    {o.leaf ? (
                      <span className="flow-option-end">
                        <CategoryIcon id={o.leaf.cat} color={CATEGORY_BY_ID[o.leaf.cat].color} size="sm" />
                      </span>
                    ) : (
                      <ChevronRight className="flow-option-chev" aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {leaf && <Result leaf={leaf} progress={progress} headingRef={now} onRestart={() => go([])} />}
      </div>

      <details className="disclosure flow-chart" open={chartOpen} onToggle={(e) => setChartOpen(e.currentTarget.open)}>
        <summary>
          <ListTree aria-hidden="true" />
          <h2 className="flow-chart-title">The whole chart</h2>
          <span className="flow-chart-meta tabular">
            {FLOW.length} questions · {CATEGORIES.length} patterns
          </span>
        </summary>
        <div className="flow-chart-body">
          <p className="flow-chart-lead">
            Two steps to remember: <strong>the structure first</strong> (a linked list, a tree, a graph, a grid, ranges, a class), <strong>then the wording</strong>. At each
            question, take the first answer that fits. Choose a pattern to see its route.
          </p>
          <Outline id={FLOW_START} path={[]} current={raw} onPick={go} />
          <p className="flow-chart-note">
            Checked against the curriculum: the wording of <strong className="tabular">{onChart}</strong> of the {PROBLEMS.length} problems leads to their pattern by this chart.{' '}
            {FLOW_OFF_CHART.length > 0 && (FLOW_OFF_CHART.length === 1 ? 'One hides it:' : `${FLOW_OFF_CHART.length} hide it:`)}
          </p>
          {FLOW_OFF_CHART.length > 0 && (
            <ul className="flow-off">
              {FLOW_OFF_CHART.map((x) => (
                <li key={x.id}>
                  <Link to={`/p/${x.id}`}>{PROBLEM_BY_ID[x.id]?.title ?? x.id}</Link>
                  <span>{inline(x.why)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </div>
  );
}

function Result({ leaf, progress, headingRef, onRestart }: { leaf: FlowLeaf; progress: Progress; headingRef: RefObject<HTMLHeadingElement | null>; onRestart: () => void }) {
  const c = CATEGORY_BY_ID[leaf.cat];
  const problems = leaf.problems.map((id) => PROBLEM_BY_ID[id]).filter(Boolean);
  return (
    <section className="flow-now flow-result" aria-labelledby="flow-result-title" style={{ ['--c' as string]: c.color }}>
      <header className="flow-result-head">
        <CategoryIcon id={c.id} color={c.color} size="lg" />
        <div className="grow">
          <div className="eyebrow">Try this pattern first</div>
          <h2 id="flow-result-title" ref={headingRef} tabIndex={-1}>
            {c.name}
          </h2>
          <p className="flow-result-tagline">{c.tagline}</p>
        </div>
      </header>

      <dl className="flow-result-facts">
        <div>
          <dt>Reach for</dt>
          <dd>{inline(leaf.use)}</dd>
        </div>
        {(leaf.also ?? []).length > 0 && (
          <div>
            <dt>Also fits</dt>
            <dd className="flow-result-also">
              {leaf.also!.map((a) => (
                <Link key={a} to={`/patterns?p=${a}`} className="flow-pattern">
                  <CategoryIcon id={a} color={CATEGORY_BY_ID[a].color} size="sm" />
                  {CATEGORY_BY_ID[a].name}
                </Link>
              ))}
            </dd>
          </div>
        )}
      </dl>

      <div className="flow-result-actions">
        <Link to={`/patterns?p=${c.id}`} className="btn btn-primary">
          <BookOpen aria-hidden="true" />
          Open in the pattern guide
        </Link>
        <Link to={`/clues?cat=${c.id}`} className="btn btn-secondary">
          <Quote aria-hidden="true" />
          Drill its clue words
        </Link>
        <button type="button" className="btn btn-quiet" onClick={onRestart}>
          <RotateCcw aria-hidden="true" />
          Start over
        </button>
      </div>

      {problems.length > 0 && (
        <div className="flow-result-block">
          <h3>
            Problems that end here <span className="flow-count tabular">{problems.length}</span>
          </h3>
          <div className="flow-chips">
            {problems.map((x) => {
              const pp = progress.problems[x.id];
              const learned = !!pp?.learnedAt;
              const due = learned && !!pp?.srs && isDue(pp.srs);
              const other = x.category !== c.id ? CATEGORY_BY_ID[x.category].name : null;
              return (
                <Link key={x.id} to={`/p/${x.id}`} className={`flow-chip ${other ? 'has-unit' : ''}`} title={due ? 'Due for review' : learned ? 'Learned' : 'Not started'}>
                  <span className={`flow-chip-dot ${due ? 'due' : learned ? 'learned' : ''}`} aria-hidden="true" />
                  <span className="flow-chip-text">
                    {x.title}
                    {other && (
                      <span className="flow-chip-unit">
                        <span className="sr-only">, taught in </span>
                        {other}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <details className="flow-result-clues">
        <summary>The clue words of {c.name}</summary>
        <ClueList cat={c.id} />
      </details>
    </section>
  );
}

/** The chart as nested lists: a question, its answers, and under each answer the next question or the pattern. */
function Outline({ id, path, current, onPick }: { id: string; path: string[]; current: string; onPick: (path: string[]) => void }) {
  const n = FLOW_BY_ID[id];
  const jump = (to: string) => {
    const el = document.getElementById(`flow-q-${to}`);
    el?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
  };
  return (
    <div className="flow-tree">
      <div className="flow-tree-ask" id={`flow-q-${id}`} tabIndex={-1}>
        {n.ask}
      </div>
      <ul className="flow-tree-options">
        {n.options.map((o) => {
          const route = [...path, o.id];
          const key = route.join('.');
          const onRoute = current === key || current.startsWith(`${key}.`);
          return (
            <li key={o.id} className={onRoute ? 'on-route' : undefined}>
              <div className="flow-tree-row">
                <span className="flow-tree-label">{inline(o.label)}</span>
                {o.leaf && (
                  <button
                    type="button"
                    className="flow-pattern"
                    aria-current={current === key ? 'true' : undefined}
                    aria-label={`${CATEGORY_BY_ID[o.leaf.cat].name}: show this route`}
                    onClick={() => onPick(route)}
                  >
                    <CategoryIcon id={o.leaf.cat} color={CATEGORY_BY_ID[o.leaf.cat].color} size="sm" />
                    {CATEGORY_BY_ID[o.leaf.cat].name}
                  </button>
                )}
              </div>
              {o.to &&
                (HOME[o.to].join('.') === key ? (
                  <Outline id={o.to} path={route} current={current} onPick={onPick} />
                ) : (
                  <button type="button" className="flow-tree-jump" onClick={() => jump(o.to!)}>
                    <CornerDownRight aria-hidden="true" />
                    <span>Continue at “{FLOW_BY_ID[o.to].ask}”</span>
                    <ArrowRight aria-hidden="true" />
                  </button>
                ))}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
