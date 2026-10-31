import { Link } from 'react-router-dom';
import { CATEGORIES } from '../content/categories';
import { FOUNDATIONS, PROBLEMS } from '../content/index';
import { lastNDays, today, weekdayShort } from '../lib/date';
import { levelInfo, levelTitle } from '../lib/game';
import { foundationsDone, nextStep, unitProgress } from '../lib/path';
import { crowns } from '../lib/srs';
import { dueProblemIds, learnedIds, repairableStreak, repairStreak, useProgress, xpToday } from '../lib/store';
import { GEMS } from '../lib/game';
import { DifficultyChip, ProgressBar, Ring } from '../components/ui';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Home() {
  const p = useProgress();
  const next = nextStep(p);
  const due = dueProblemIds(p);
  const learned = learnedIds(p).length;
  const mastered = Object.values(p.problems).filter((x) => crowns(x.srs) >= 4).length;
  const x = xpToday(p);
  const lv = levelInfo(p.xp);
  const days = lastNDays(7);
  const name = p.settings.name.trim();

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div>
        <div className="greeting">
          {greeting()}
          {name ? `, ${name}` : ''}! 👋
        </div>
        <div className="muted">
          {p.streak.current > 0
            ? x > 0
              ? `Streak safe for today. ${x >= p.settings.dailyGoal ? 'Daily goal smashed. 🎉' : `${p.settings.dailyGoal - x} XP to your daily goal.`}`
              : `Keep your ${p.streak.current}-day streak alive — one lesson or review is enough.`
            : 'Small daily reps build big skills. Start a streak today.'}
        </div>
      </div>

      {repairableStreak(p) > 0 && (
        <div className="card row wrap" style={{ borderColor: 'var(--orange)' }}>
          <span style={{ fontSize: '2rem' }}>🔧</span>
          <div className="grow">
            <div className="card-title">Repair your {repairableStreak(p)}-day streak?</div>
            <div className="small muted">Life happens. For the next 48 hours you can restore it for {GEMS.repairCost} 💎 — or simply start fresh.</div>
          </div>
          <button type="button" className="btn btn-orange btn-sm" disabled={p.gems < GEMS.repairCost} onClick={repairStreak}>
            Repair · {GEMS.repairCost} 💎
          </button>
        </div>
      )}

      <div className="grid-2">
        <div className="action-card primary">
          <span className="big-emoji">{next.icon}</span>
          <div className="tiny" style={{ fontWeight: 900, letterSpacing: '.08em', opacity: 0.85 }}>
            {next.kind === 'foundation' ? 'BEGINNER TRACK' : next.kind === 'guide' ? 'NEW PATTERN' : next.kind === 'problem' ? 'NEXT PROBLEM' : 'ALL DONE'}
          </div>
          <div style={{ fontWeight: 900, fontSize: '1.3rem', lineHeight: 1.2, paddingRight: 56 }}>{next.title}</div>
          {next.kind === 'problem' && (
            <div className="row" style={{ gap: 6 }}>
              <DifficultyChip d={next.problem.difficulty} />
              <span className="small muted">{next.problem.pattern}</span>
            </div>
          )}
          <div className="grow" />
          <Link to={next.href} className="btn btn-white btn-block">
            {next.kind === 'done' ? 'Review' : 'Start lesson'}
          </Link>
        </div>

        <div className={`action-card ${due.length ? 'review' : ''}`}>
          <span className="big-emoji">{due.length ? '🔁' : '✅'}</span>
          <div className="tiny" style={{ fontWeight: 900, letterSpacing: '.08em', opacity: 0.85 }}>
            DAILY REVIEW
          </div>
          <div style={{ fontWeight: 900, fontSize: '1.3rem', lineHeight: 1.2, paddingRight: 56 }}>
            {due.length ? `${due.length} problem${due.length > 1 ? 's' : ''} ready to review` : learned ? 'All caught up!' : 'Nothing to review yet'}
          </div>
          <div className="small muted">
            {due.length
              ? 'Recall them now, right as they start to fade. That is when it sticks best.'
              : learned
                ? 'Come back tomorrow, or practise ahead with a few extra cards.'
                : 'Learn a problem and it will show up here for spaced review.'}
          </div>
          <div className="grow" />
          {due.length ? (
            <Link to="/review" className="btn btn-white btn-block">
              Start review
            </Link>
          ) : learned ? (
            <Link to="/review?ahead=1" className="btn btn-ghost btn-block">
              Practise ahead
            </Link>
          ) : (
            <Link to="/blitz" className="btn btn-ghost btn-block">
              Try Pattern Blitz
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>
            This week
          </div>
          <div className="row small muted" style={{ gap: 8 }}>
            <Ring value={x / p.settings.dailyGoal} size={30} stroke={4} color="var(--gold)" />
            {x}/{p.settings.dailyGoal} XP today
          </div>
        </div>
        <div className="week">
          {days.map((d) => {
            const done = (p.xpByDay[d] ?? 0) > 0;
            const frozen = p.streak.frozenDays.includes(d);
            return (
              <div key={d}>
                <div className="d">{weekdayShort(d)}</div>
                <div className={`dot ${done ? 'done' : ''} ${frozen ? 'frozen' : ''} ${d === today() ? 'today' : ''}`}>
                  {done ? '🔥' : frozen ? '🧊' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid-3">
        <div className="stat-tile">
          <div className="v">{learned}</div>
          <div className="k">Learned</div>
        </div>
        <div className="stat-tile">
          <div className="v">{mastered}</div>
          <div className="k">Strong+</div>
        </div>
        <div className="stat-tile">
          <div className="v">Lv {lv.level}</div>
          <div className="k">{levelTitle(lv.level)}</div>
        </div>
      </div>

      <Link to="/blitz" className="card row" style={{ color: 'inherit', textDecoration: 'none' }}>
        <span style={{ fontSize: '2.2rem' }}>⚡</span>
        <div className="grow">
          <div className="card-title">Pattern Blitz</div>
          <div className="small muted">60 seconds. Read the problem, name the pattern. Best: {p.stats.blitzBest}</div>
        </div>
        <span className="btn btn-orange btn-sm">Play</span>
      </Link>

      {FOUNDATIONS.length > 0 && (
        <Link to="/learn#foundations" className="card row" style={{ color: 'inherit', textDecoration: 'none' }}>
          <span style={{ fontSize: '2.2rem' }}>🧱</span>
          <div className="grow">
            <div className="card-title">Beginner foundations</div>
            <div className="small muted">
              Python, Big-O, recursion and how to attack a problem. {foundationsDone(p)}/{FOUNDATIONS.length} done
            </div>
            <div style={{ marginTop: 8 }}>
              <ProgressBar value={foundationsDone(p) / FOUNDATIONS.length} thin />
            </div>
          </div>
        </Link>
      )}

      <div>
        <div className="section-title">
          <h2>Your roadmap</h2>
          <Link to="/learn" className="small" style={{ fontWeight: 800 }}>
            See path →
          </Link>
        </div>
        <div className="list">
          {CATEGORIES.map((c) => {
            const u = unitProgress(p, c.id);
            return (
              <Link to={`/unit/${c.id}`} className="list-row" key={c.id}>
                <span style={{ fontSize: '1.4rem' }}>{c.icon}</span>
                <div className="grow">
                  <div className="row between">
                    <span className="title">{c.name}</span>
                    <span className="tiny muted">
                      {u.learned}/{u.total}
                    </span>
                  </div>
                  <ProgressBar value={u.pct} thin color={c.color} />
                </div>
              </Link>
            );
          })}
        </div>
        <div className="footer-note">
          {PROBLEMS.length} problems · {CATEGORIES.length} patterns · built on learning science — <Link to="/science">see why it works</Link>
        </div>
      </div>
    </div>
  );
}
