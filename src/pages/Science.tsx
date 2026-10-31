import '../styles/pages/science.css';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookMarked, BookOpen, Brain, CalendarCheck, FileText, FlaskConical, Repeat, Route, Shuffle, type LucideIcon } from 'lucide-react';
import { SCIENCE } from '../content/science';
import { IconTile, SCIENCE_ICON } from '../components/icons';
import { LogoMark } from '../components/ui';

const SHORT_VERSION: { icon: LucideIcon; verb: string; rest: ReactNode }[] = [
  { icon: BookOpen, verb: 'Learn', rest: ' a pattern with worked examples, broken into small chunks.' },
  { icon: Brain, verb: 'Retrieve', rest: ' it: guess before you are told, rebuild code from memory, order the steps yourself.' },
  { icon: CalendarCheck, verb: 'Space', rest: ' it: each problem returns right as you are about to forget it.' },
  { icon: Shuffle, verb: 'Mix', rest: ' it: reviews and Blitz shuffle patterns so you learn to tell them apart — exactly what an interview asks.' },
  { icon: Repeat, verb: 'Keep showing up', rest: ': streaks, goals and small wins turn practice into a daily habit.' },
];

const SUMMARY_ID = 'science-summary';
const anchor = (id: string) => `science-${id}`;
const pad = (n: number) => String(n).padStart(2, '0');

/** "Author (2006), Venue; Other (2010), Venue" → each venue set in italics. */
function Citation({ source }: { source: string }) {
  const parts = source.split(/;\s*/);
  return (
    <>
      {parts.map((c, i) => {
        const m = c.match(/^(.*?\(\d{4}\))(?:,\s*(.+))?$/);
        return (
          <span key={i}>
            {m ? (
              <>
                {m[1]}
                {m[2] && (
                  <>
                    , <cite>{m[2]}</cite>
                  </>
                )}
              </>
            ) : (
              c
            )}
            {i < parts.length - 1 ? '; ' : ''}
          </span>
        );
      })}
    </>
  );
}

const countWords = (s: string) => s.split(/\s+/).filter(Boolean).length;
const SOURCES = SCIENCE.reduce((n, s) => n + s.source.split(/;\s*/).length, 0);
const READ_MIN = Math.max(1, Math.round(SCIENCE.reduce((n, s) => n + countWords(s.finding) + countWords(s.howWeUseIt) + countWords(s.title), 120) / 220));

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

/** Highlights the section currently in view in the "On this page" list. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: '-80px 0px -65% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [ids]);
  return active;
}

const TOC_IDS = [SUMMARY_ID, ...SCIENCE.map((s) => anchor(s.id))];

export function Science() {
  const active = useActiveSection(TOC_IDS);

  return (
    <div className="science">
      <header className="science-hero">
        <div className="science-eyebrow">
          <FlaskConical aria-hidden="true" />
          Learning science
        </div>
        <h1 className="science-title">Why this works</h1>
        <p className="science-lead">
          IntPrep is designed around decades of research on how people learn and remember — and on what makes practice something you want to come back to.
        </p>
        <ul className="science-meta" aria-label="About this page">
          <li>{SCIENCE.length} principles</li>
          <li>{SOURCES} cited sources</li>
          <li>About {READ_MIN} min read</li>
        </ul>
      </header>

      <div className="science-layout">
        <div className="science-article">
          <section id={SUMMARY_ID} className="card science-summary" aria-labelledby="science-summary-title">
            <h2 id="science-summary-title" className="science-h2">
              The short version
            </h2>
            <ol className="science-steps">
              {SHORT_VERSION.map(({ icon: I, verb, rest }, i) => (
                <li key={verb}>
                  <span className="science-step-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <p>
                    <strong>{verb}</strong>
                    {rest}
                  </p>
                  <I className="science-step-icon" aria-hidden="true" />
                </li>
              ))}
            </ol>
          </section>

          <div className="science-section-head">
            <h2 className="science-h2">The principles</h2>
            <p>What the research found, and where you meet it in IntPrep.</p>
          </div>

          <div className="science-principles">
            {SCIENCE.map((s, i) => (
              <article key={s.id} id={anchor(s.id)} className="card science-principle" aria-labelledby={`${anchor(s.id)}-title`}>
                <header className="science-principle-head">
                  <IconTile icon={SCIENCE_ICON[s.id] ?? FlaskConical} size="lg" />
                  <div className="grow">
                    <div className="science-principle-num">Principle {pad(i + 1)}</div>
                    <h3 id={`${anchor(s.id)}-title`} className="science-principle-title">
                      {s.title}
                    </h3>
                  </div>
                </header>

                <p className="science-finding">{s.finding}</p>

                <div className="science-inapp">
                  <div className="science-inapp-label">
                    <LogoMark size={16} />
                    In IntPrep
                  </div>
                  <p>{s.howWeUseIt}</p>
                </div>

                <footer className="science-cite">
                  <BookMarked aria-hidden="true" />
                  <p>
                    <span className="science-cite-label">Source</span>
                    <Citation source={s.source} />
                  </p>
                </footer>
              </article>
            ))}
          </div>

          <section className="card science-cta" aria-labelledby="science-cta-title">
            <IconTile icon={Route} size="lg" />
            <div className="grow">
              <h2 id="science-cta-title" className="science-cta-title">
                Put it into practice
              </h2>
              <p>Start the learning path. Every problem you learn joins your review queue.</p>
            </div>
            <Link to="/learn" className="btn btn-primary science-cta-btn">
              Start learning
              <ArrowRight aria-hidden="true" />
            </Link>
          </section>

          <aside className="science-footnote">
            <FileText aria-hidden="true" />
            <p>
              The full write-up, with evidence strength, caveats and complete references for every principle, is in <code>docs/LEARNING_SCIENCE.md</code> in
              the project repository.
            </p>
          </aside>
        </div>

        <nav className="science-toc" aria-label="On this page">
          <div className="science-toc-title">On this page</div>
          <ul>
            <li>
              <button type="button" className={active === SUMMARY_ID ? 'on' : ''} aria-current={active === SUMMARY_ID ? 'location' : undefined} onClick={() => scrollToId(SUMMARY_ID)}>
                The short version
              </button>
            </li>
            {SCIENCE.map((s, i) => {
              const id = anchor(s.id);
              return (
                <li key={s.id}>
                  <button type="button" className={active === id ? 'on' : ''} aria-current={active === id ? 'location' : undefined} onClick={() => scrollToId(id)}>
                    <span className="science-toc-num">{pad(i + 1)}</span>
                    <span className="science-toc-label">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
