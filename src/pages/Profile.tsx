import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PROBLEMS } from '../content/index';
import { addDays, lastNDays, parseDay, today, weekdayShort } from '../lib/date';
import { ACHIEVEMENTS, DAILY_GOALS, GEMS, levelInfo, levelTitle } from '../lib/game';
import { crowns } from '../lib/srs';
import {
  buyFreeze,
  exportProgress,
  importProgress,
  learnedIds,
  resetProgress,
  updateSettings,
  useProgress,
  type Progress,
} from '../lib/store';
import { PageHeader } from '../components/Shell';
import { Modal, ProgressBar, Toggle } from '../components/ui';

function Heatmap({ p }: { p: Progress }) {
  // 18 weeks ending this week, columns = weeks, rows = Sun..Sat.
  const end = today();
  const endDow = parseDay(end).getDay();
  const start = addDays(end, -(17 * 7 + endDow));
  const days: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return (
    <div className="heatmap" aria-label="Practice calendar">
      {days.map((d) => {
        const xp = p.xpByDay[d] ?? 0;
        const frozen = p.streak.frozenDays.includes(d);
        const lvl = xp === 0 ? '' : xp < p.settings.dailyGoal / 2 ? 'l1' : xp < p.settings.dailyGoal ? 'l2' : 'l3';
        return <div key={d} className={`cell ${lvl} ${frozen ? 'frozen' : ''}`} title={`${d}: ${xp} XP${frozen ? ' (freeze)' : ''}`} />;
      })}
    </div>
  );
}

function WeekBars({ p }: { p: Progress }) {
  const days = lastNDays(7);
  const max = Math.max(p.settings.dailyGoal, ...days.map((d) => p.xpByDay[d] ?? 0));
  return (
    <div className="bars">
      {days.map((d) => {
        const v = p.xpByDay[d] ?? 0;
        return (
          <div className="bar" key={d}>
            <span className="val">{v || ''}</span>
            <div className={`fill ${v >= p.settings.dailyGoal ? 'goal' : ''}`} style={{ height: `${(v / max) * 100}%` }} />
            <span className="lbl">{weekdayShort(d)}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Profile() {
  const p = useProgress();
  const lv = levelInfo(p.xp);
  const learned = learnedIds(p).length;
  const mastered = Object.values(p.problems).filter((x) => crowns(x.srs) >= 5).length;
  const acc = p.stats.answered ? Math.round((p.stats.correct / p.stats.answered) * 100) : 0;
  const [confirmReset, setConfirmReset] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const unlocked = ACHIEVEMENTS.filter((a) => p.achievements[a.id]).length;

  const download = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `intprep-progress-${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="stack" style={{ gap: 18 }}>
      <PageHeader title={p.settings.name.trim() || 'Your profile'} sub={`Level ${lv.level} · ${levelTitle(lv.level)}`} />

      <div className="card">
        <div className="row between small" style={{ marginBottom: 6, fontWeight: 800 }}>
          <span>⭐ Level {lv.level}</span>
          <span className="muted">
            {lv.into}/{lv.cost} XP to level {lv.level + 1}
          </span>
        </div>
        <ProgressBar value={lv.pct} color="var(--gold)" />
      </div>

      <div className="grid-3">
        <div className="stat-tile">
          <div className="v">🔥 {p.streak.current}</div>
          <div className="k">Day streak</div>
        </div>
        <div className="stat-tile">
          <div className="v">{p.streak.longest}</div>
          <div className="k">Longest</div>
        </div>
        <div className="stat-tile">
          <div className="v">{p.xp}</div>
          <div className="k">Total XP</div>
        </div>
        <div className="stat-tile">
          <div className="v">
            {learned}/{PROBLEMS.length}
          </div>
          <div className="k">Learned</div>
        </div>
        <div className="stat-tile">
          <div className="v">👑 {mastered}</div>
          <div className="k">Mastered</div>
        </div>
        <div className="stat-tile">
          <div className="v">{acc}%</div>
          <div className="k">Drill accuracy</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Last 7 days</div>
        <WeekBars p={p} />
        <div className="tiny muted" style={{ marginTop: 6 }}>
          Green bars hit your daily goal of {p.settings.dailyGoal} XP.
        </div>
      </div>

      <div className="card">
        <div className="card-title">Practice calendar</div>
        <Heatmap p={p} />
        <div className="tiny muted" style={{ marginTop: 6 }}>
          Orange = practice (darker = more XP) · Blue = streak freeze used
        </div>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 10 }}>
          <div className="card-title" style={{ margin: 0 }}>
            🛒 Shop
          </div>
          <span className="pill-stat" style={{ color: 'var(--blue)' }}>
            💎 {p.gems}
          </span>
        </div>
        <div className="row">
          <span style={{ fontSize: '2rem' }}>🧊</span>
          <div className="grow">
            <strong>Streak freeze</strong>
            <div className="small muted">
              Protects your streak for one missed day. Equipped: {p.streak.freezes}/{GEMS.maxFreezes}
            </div>
          </div>
          <button type="button" className="btn btn-blue btn-sm" disabled={p.gems < GEMS.freezeCost || p.streak.freezes >= GEMS.maxFreezes} onClick={buyFreeze}>
            {GEMS.freezeCost} 💎
          </button>
        </div>
        <div className="tiny muted" style={{ marginTop: 8 }}>
          Earn gems by finishing lessons, hitting your daily goal and unlocking achievements.
        </div>
      </div>

      <div>
        <div className="section-title">
          <h2>Achievements</h2>
          <span className="small muted">
            {unlocked}/{ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="badges">
          {ACHIEVEMENTS.map((a) => (
            <div key={a.id} className={`badge-tile ${p.achievements[a.id] ? '' : 'locked'}`} title={a.desc}>
              <div className="bi">{a.icon}</div>
              <div className="bt">{a.title}</div>
              <div className="bd">{a.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">⚙️ Settings</div>
        <div className="stack">
          <label className="stack" style={{ gap: 4 }}>
            <span className="small" style={{ fontWeight: 800 }}>
              Display name
            </span>
            <input className="input" value={p.settings.name} maxLength={30} placeholder="What should we call you?" onChange={(e) => updateSettings({ name: e.target.value })} />
          </label>
          <div>
            <div className="small" style={{ fontWeight: 800, marginBottom: 6 }}>
              Daily goal
            </div>
            <div className="seg" style={{ flexWrap: 'wrap' }}>
              {DAILY_GOALS.map((g) => (
                <button key={g.xp} type="button" className={p.settings.dailyGoal === g.xp ? 'on' : ''} onClick={() => updateSettings({ dailyGoal: g.xp })}>
                  {g.label} · {g.xp}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="small" style={{ fontWeight: 800, marginBottom: 6 }}>
              Theme
            </div>
            <div className="seg">
              {(['system', 'light', 'dark'] as const).map((t) => (
                <button key={t} type="button" className={p.settings.theme === t ? 'on' : ''} onClick={() => updateSettings({ theme: t })}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="small" style={{ fontWeight: 800, marginBottom: 6 }}>
              Code drills
            </div>
            <div className="seg">
              {(
                [
                  ['auto', 'Auto'],
                  ['type', 'Always type'],
                  ['tap', 'Always tap'],
                ] as const
              ).map(([k, l]) => (
                <button key={k} type="button" className={p.settings.typingMode === k ? 'on' : ''} onClick={() => updateSettings({ typingMode: k })}>
                  {l}
                </button>
              ))}
            </div>
            <div className="tiny muted" style={{ marginTop: 4 }}>
              Auto = type on a computer, tap choices on a phone. Typing is harder and builds stronger memory.
            </div>
          </div>
          <div className="row between">
            <span style={{ fontWeight: 700 }}>Sound effects</span>
            <Toggle on={p.settings.sound} onChange={(v) => updateSettings({ sound: v })} label="Sound effects" />
          </div>
          <div className="row between">
            <span style={{ fontWeight: 700 }}>Vibration (phones)</span>
            <Toggle on={p.settings.haptics} onChange={(v) => updateSettings({ haptics: v })} label="Vibration" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">💾 Your data</div>
        <p className="small muted">Progress lives in this browser only. Export a backup to move it to another device.</p>
        <div className="row wrap">
          <button type="button" className="btn btn-ghost btn-sm" onClick={download}>
            Export backup
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
            Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setImportMsg(importProgress(await f.text()) ? '✅ Progress imported.' : '❌ That file is not an IntPrep backup.');
              e.target.value = '';
            }}
          />
          <button type="button" className="btn btn-red btn-sm" onClick={() => setConfirmReset(true)}>
            Reset everything
          </button>
        </div>
        {importMsg && <div className="small" style={{ marginTop: 8 }}>{importMsg}</div>}
      </div>

      <div className="footer-note">
        <Link to="/science">How IntPrep uses learning science →</Link>
      </div>

      {confirmReset && (
        <Modal onClose={() => setConfirmReset(false)}>
          <h2>Reset all progress?</h2>
          <p className="muted">This deletes your XP, streak, gems, achievements and review schedule from this browser. It cannot be undone.</p>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-red"
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
              }}
            >
              Reset
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
