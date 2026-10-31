import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CATEGORIES } from '../content/categories';
import { FOUNDATIONS, guideFor, problemsFor } from '../content/index';
import { foundationsDone, nextStep, unitProgress, unitUnlocked } from '../lib/path';
import { crowns, isDue } from '../lib/srs';
import { useProgress } from '../lib/store';
import { PageHeader } from '../components/Shell';
import { Icon, ProgressBar } from '../components/ui';

const offset = (i: number) => Math.round(Math.sin(i * 0.9) * 70);

function PathNode({
  href,
  label,
  icon,
  color,
  state,
  index,
  crownsN,
  due,
}: {
  href: string;
  label: string;
  icon: string;
  color: string;
  state: 'done' | 'next' | 'todo';
  index: number;
  crownsN?: number;
  due?: boolean;
}) {
  return (
    <div className="node-wrap" style={{ transform: `translateX(${offset(index)}px)`, ['--c' as string]: color }}>
      {state === 'next' && <div className="start-tag">Start</div>}
      <Link to={href} className={`node ${state === 'todo' ? 'todo' : ''} ${state === 'next' ? 'next' : ''}`} style={{ ['--c' as string]: color }} aria-label={label}>
        {state === 'done' ? (due ? '🔁' : icon) : state === 'next' ? icon : icon}
      </Link>
      <div className="node-label">{label}</div>
      {crownsN !== undefined && crownsN > 0 && (
        <div className="node-crowns" style={{ color: 'var(--gold)' }}>
          {'★'.repeat(crownsN)}
          <span style={{ color: 'var(--surface-3)' }}>{'★'.repeat(5 - crownsN)}</span>
        </div>
      )}
    </div>
  );
}

export function Learn() {
  const p = useProgress();
  const next = nextStep(p);
  const loc = useLocation();
  useEffect(() => {
    if (loc.hash) document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [loc.hash]);
  const fDone = foundationsDone(p);

  return (
    <div>
      <PageHeader title="Learning path" sub="Follow the path top to bottom, or jump to any unit. Each pattern builds on the ones before it." />

      {FOUNDATIONS.length > 0 && (
        <section className="unit" id="foundations">
          <div className="unit-banner" style={{ ['--c' as string]: '#475569' }}>
            <span className="ub-icon">🧱</span>
            <div className="grow">
              <div className="ub-title">Unit 0 · Foundations</div>
              <div className="ub-sub">New to coding? Start here. Python, Big-O, recursion and how to attack a problem.</div>
            </div>
            <span className="small" style={{ fontWeight: 900 }}>
              {fDone}/{FOUNDATIONS.length}
            </span>
          </div>
          <div className="path">
            {FOUNDATIONS.map((l, i) => {
              const done = !!p.lessonsDone[`f:${l.id}`];
              const isNext = next.kind === 'foundation' && next.lessonId === l.id;
              return (
                <PathNode
                  key={l.id}
                  href={`/foundations/${l.id}`}
                  label={l.title}
                  icon={l.icon}
                  color="#475569"
                  state={done ? 'done' : isNext ? 'next' : 'todo'}
                  index={i}
                />
              );
            })}
          </div>
        </section>
      )}

      {CATEGORIES.map((c, ci) => {
        const problems = problemsFor(c.id);
        const u = unitProgress(p, c.id);
        const open = unitUnlocked(p, c);
        const guide = guideFor(c.id);
        const guideDone = !!p.lessonsDone[`g:${c.id}`];
        let idx = 0;
        return (
          <section className="unit" key={c.id} id={c.id}>
            <Link to={`/unit/${c.id}`} className={`unit-banner ${open ? '' : 'locked'}`} style={{ ['--c' as string]: c.color }}>
              <span className="ub-icon">{c.icon}</span>
              <div className="grow">
                <div className="ub-title">
                  Unit {ci + 1} · {c.name}
                </div>
                <div className="ub-sub">{c.tagline}</div>
              </div>
              {open ? (
                <span className="small" style={{ fontWeight: 900 }}>
                  {u.learned}/{u.total}
                </span>
              ) : (
                <Icon name="lock" />
              )}
            </Link>
            {!open && (
              <div className="small muted center" style={{ marginTop: 10 }}>
                Recommended after {c.prereqs.map((x) => CATEGORIES.find((y) => y.id === x)!.short).join(' + ')}. You can still jump in.
              </div>
            )}
            {problems.length === 0 ? (
              <div className="small muted center" style={{ padding: 16 }}>
                Lessons for this unit are on their way.
              </div>
            ) : (
              <div className="path">
                {guide && (
                  <PathNode
                    href={`/unit/${c.id}/intro`}
                    label="The pattern"
                    icon="📖"
                    color={c.color}
                    state={guideDone ? 'done' : next.kind === 'guide' && next.category === c.id ? 'next' : 'todo'}
                    index={idx++}
                  />
                )}
                {problems.map((q) => {
                  const pp = p.problems[q.id];
                  const learned = !!pp?.learnedAt;
                  const isNext = next.kind === 'problem' && next.problem.id === q.id;
                  return (
                    <PathNode
                      key={q.id}
                      href={learned ? `/p/${q.id}` : `/p/${q.id}/learn`}
                      label={q.title}
                      icon={q.difficulty === 'Hard' ? '🐉' : learned ? '✓' : q.difficulty === 'Medium' ? '◆' : '●'}
                      color={c.color}
                      state={learned ? 'done' : isNext ? 'next' : 'todo'}
                      index={idx++}
                      crownsN={learned ? crowns(pp?.srs) : undefined}
                      due={learned && pp?.srs ? isDue(pp.srs) : false}
                    />
                  );
                })}
              </div>
            )}
            {u.learned > 0 && (
              <div style={{ maxWidth: 320, margin: '6px auto 0' }}>
                <ProgressBar value={u.pct} thin color={c.color} />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
