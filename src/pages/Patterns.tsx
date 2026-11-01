import '../styles/pages/patterns.css';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ChevronDown, ChevronRight, Gauge, GraduationCap, Lightbulb, Search, SearchX, X } from 'lucide-react';
import { CATEGORIES, type CategoryMeta } from '../content/categories';
import { guideFor, problemsFor } from '../content/index';
import type { Difficulty } from '../content/types';
import { HighlightedCode } from '../lib/highlight';
import { inline, Md } from '../lib/markdown';
import { isDue } from '../lib/srs';
import { useProgress, type Progress } from '../lib/store';
import { PageHeader } from '../components/Shell';
import { CategoryIcon } from '../components/icons';
import { EmptyState, ProgressBar } from '../components/ui';

// Two panes need room for the template code; below this, an accordion reads better.
const WIDE_QUERY = '(min-width: 1180px)';
function subscribeWide(cb: () => void) {
  const m = window.matchMedia(WIDE_QUERY);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
}
function useWide() {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true,
  );
}

function unitStats(c: CategoryMeta, p: Progress) {
  const list = problemsFor(c.id);
  const learned = list.filter((x) => p.problems[x.id]?.learnedAt).length;
  const mix: Record<Difficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
  for (const x of list) mix[x.difficulty]++;
  return { list, total: list.length, learned, mix };
}

export function Patterns() {
  const progress = useProgress();
  const wide = useWide();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const cues = useMemo(
    () =>
      CATEGORIES.flatMap((c) => {
        const g = guideFor(c.id);
        return g ? g.whenToUse.map((w) => ({ cat: c, cue: w })) : [];
      }),
    [],
  );
  const needle = q.trim().toLowerCase();
  const matches = needle ? cues.filter((x) => x.cue.toLowerCase().includes(needle) || x.cat.name.toLowerCase().includes(needle)) : [];

  const selected = CATEGORIES.find((c) => c.id === open) ?? CATEGORIES[0];

  const targetId = (id: string) => (wide ? 'patterns-detail' : `pat-${id}`);

  const pick = (id: string) => {
    setOpen(id);
    // Bring the chosen pattern into view once it has rendered.
    window.setTimeout(() => {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      document.getElementById(targetId(id))?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }, 30);
  };

  // Switching patterns from deep in a long one: jump back to its top, but only if it scrolled away.
  const select = (id: string | null) => {
    setOpen(id);
    if (!id) return;
    window.setTimeout(() => {
      const el = document.getElementById(targetId(id));
      if (el && el.getBoundingClientRect().top < 64) el.scrollIntoView({ block: 'start' });
    }, 0);
  };

  return (
    <div className="patterns">
      <PageHeader
        title="Pattern guide"
        sub={`If you see this, reach for that. All ${CATEGORIES.length} patterns with their recognition cues, a reusable template and the problems that use them.`}
      />

      <div className="input-group patterns-search">
        <Search aria-hidden="true" />
        <input
          className="input"
          type="search"
          placeholder="Search cues, e.g. “sorted” or “top k”"
          aria-label="Search recognition cues"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button type="button" className="patterns-search-clear" aria-label="Clear search" onClick={() => setQ('')}>
            <X />
          </button>
        )}
      </div>

      {needle && (
        <section className="patterns-results" aria-label="Matching cues">
          <div className="patterns-results-head">
            <span className="text-sm text-secondary" aria-live="polite">
              {matches.length === 0 ? (
                'No matching cues'
              ) : (
                <>
                  <strong className="tabular">{matches.length}</strong> {matches.length === 1 ? 'cue matches' : 'cues match'} “{q.trim()}”
                </>
              )}
            </span>
          </div>
          {matches.length === 0 ? (
            <EmptyState icon={SearchX} title="No cues match">
              Try a word from the problem statement, like “sorted”, “interval”, “prefix” or “minimum”.
            </EmptyState>
          ) : (
            <ul className="patterns-results-list" role="list">
              {matches.map((m, i) => (
                <li key={i}>
                  <button type="button" className="patterns-result" onClick={() => pick(m.cat.id)}>
                    <CategoryIcon id={m.cat.id} color={m.cat.color} size="sm" />
                    <span className="patterns-result-text">
                      <span className="patterns-result-cue">{inline(m.cue)}</span>
                      <span className="patterns-result-cat">{m.cat.name}</span>
                    </span>
                    <ChevronRight className="patterns-result-chev" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {wide ? (
        <div className="patterns-panes">
          <nav className="patterns-nav" aria-label="Patterns">
            <div className="patterns-nav-head" aria-hidden="true">
              <span>
                Patterns <span className="patterns-nav-total tabular">{CATEGORIES.length}</span>
              </span>
              <span>Learned</span>
            </div>
            <ul role="list">
              {CATEGORIES.map((c) => {
                const s = unitStats(c, progress);
                const active = c.id === selected.id;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`patterns-nav-item ${active ? 'on' : ''}`}
                      aria-current={active ? 'true' : undefined}
                      onClick={() => select(c.id)}
                    >
                      <CategoryIcon id={c.id} color={c.color} size="sm" />
                      <span className="patterns-nav-name">{c.name}</span>
                      <span className="patterns-nav-count tabular" title={`${s.learned} of ${s.total} learned`}>
                        {s.learned}/{s.total}
                        <span className="sr-only"> learned</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <article className="patterns-detail" id="patterns-detail" aria-labelledby="patterns-detail-title">
            <header className="patterns-detail-head">
              <CategoryIcon id={selected.id} color={selected.color} size="lg" />
              <div className="grow">
                <div className="eyebrow">
                  Pattern {CATEGORIES.indexOf(selected) + 1} of {CATEGORIES.length}
                </div>
                <h2 id="patterns-detail-title">{selected.name}</h2>
                <p className="patterns-tagline">{selected.tagline}</p>
              </div>
            </header>
            <PatternBody c={selected} progress={progress} />
          </article>
        </div>
      ) : (
        <div className="patterns-acc">
          <div className="patterns-acc-top" aria-hidden="true">
            <span>
              Patterns <span className="patterns-nav-total tabular">{CATEGORIES.length}</span>
            </span>
            <span>Learned</span>
          </div>
          {CATEGORIES.map((c) => {
            const isOpen = open === c.id;
            const s = unitStats(c, progress);
            return (
              <section key={c.id} id={`pat-${c.id}`} className={`patterns-acc-item ${isOpen ? 'open' : ''}`}>
                <h2 className="patterns-acc-h">
                  <button
                    type="button"
                    className="patterns-acc-head"
                    onClick={() => select(isOpen ? null : c.id)}
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? `pat-body-${c.id}` : undefined}
                  >
                    <CategoryIcon id={c.id} color={c.color} />
                    <span className="grow">
                      <span className="patterns-acc-name">{c.name}</span>
                      <span className="patterns-acc-tagline">{c.tagline}</span>
                    </span>
                    <span className="patterns-acc-count tabular" title={`${s.learned} of ${s.total} learned`}>
                      {s.learned}/{s.total}
                      <span className="sr-only"> learned</span>
                    </span>
                    <ChevronDown className="patterns-acc-chev" aria-hidden="true" />
                  </button>
                </h2>
                {isOpen && (
                  <div className="patterns-acc-body" id={`pat-body-${c.id}`}>
                    <PatternBody c={c} progress={progress} />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PatternBody({ c, progress }: { c: CategoryMeta; progress: Progress }) {
  const g = guideFor(c.id);
  const s = unitStats(c, progress);
  const introDone = !!progress.lessonsDone[`g:${c.id}`];

  const actions = (
    <div className="patterns-actions">
      <Link to={`/unit/${c.id}/intro`} className="btn btn-primary">
        <GraduationCap />
        {introDone ? 'Replay pattern intro' : 'Start pattern intro'}
      </Link>
      <Link to={`/unit/${c.id}`} className="btn btn-secondary">
        <BookOpen />
        Open unit
      </Link>
    </div>
  );

  const facts = (
    <dl className="patterns-facts">
      <div>
        <dt>Problems</dt>
        <dd className="tabular">{s.total}</dd>
      </div>
      <div>
        <dt>Learned</dt>
        <dd className="tabular">
          {s.learned}
          <span>/{s.total}</span>
        </dd>
        <ProgressBar value={s.total ? s.learned / s.total : 0} thin color={c.color} label={`${c.name} problems learned`} />
      </div>
      <div>
        <dt>Difficulty mix</dt>
        <dd className="patterns-mix">
          {(['Easy', 'Medium', 'Hard'] as const).map((d) =>
            s.mix[d] > 0 ? (
              <span key={d} className={`patterns-mix-item ${d.toLowerCase()}`} title={`${s.mix[d]} ${d}`}>
                <span className="tabular">{s.mix[d]}</span> {d}
              </span>
            ) : null,
          )}
        </dd>
      </div>
    </dl>
  );

  if (!g) {
    return (
      <div className="patterns-body">
        {actions}
        {facts}
        <p className="text-secondary">The written guide for this pattern is coming soon. The unit and its problems are ready.</p>
      </div>
    );
  }

  return (
    <div className="patterns-body">
      {actions}
      {facts}

      <section className="patterns-section">
        <h3>How it works</h3>
        <Md text={g.summary} className="patterns-prose" />
        <div className="callout callout-brand patterns-analogy">
          <Lightbulb aria-hidden="true" />
          <div>
            <div className="patterns-analogy-label">Analogy</div>
            {inline(g.analogy)}
          </div>
        </div>
      </section>

      <section className="patterns-section">
        <h3>Reach for it when…</h3>
        <ul className="patterns-cues" role="list">
          {g.whenToUse.map((w, i) => (
            <li key={i}>
              <ArrowRight aria-hidden="true" />
              <span>{inline(w)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="patterns-section">
        <h3>Template</h3>
        <div className="patterns-code">
          <div className="patterns-code-bar">
            <span>{c.id}.py</span>
            <span>Python</span>
          </div>
          <HighlightedCode code={g.template} />
        </div>
        <Md text={g.templateNotes.map((n) => `- ${n}`).join('\n')} className="patterns-notes" />
        <div className="patterns-cost">
          <Gauge aria-hidden="true" />
          <span className="patterns-cost-k">Typical cost</span>
          <span className="patterns-cost-v">{inline(g.complexity)}</span>
        </div>
      </section>

      <section className="patterns-section">
        <h3>
          Problems <span className="patterns-h-count tabular">{s.total}</span>
        </h3>
        <div className="patterns-chips">
          {s.list.map((x) => {
            const pp = progress.problems[x.id];
            const learned = !!pp?.learnedAt;
            const due = learned && !!pp?.srs && isDue(pp.srs);
            return (
              <Link key={x.id} to={`/p/${x.id}`} className="patterns-chip" title={due ? 'Due for review' : learned ? 'Learned' : 'Not started'}>
                <span className={`patterns-chip-dot ${due ? 'due' : learned ? 'learned' : ''}`} aria-hidden="true" />
                {x.title}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
