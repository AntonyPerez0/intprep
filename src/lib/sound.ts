// Tiny synthesized sound effects (WebAudio) + haptics. No audio files needed.

import { getProgress } from './store';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.07) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export type Sfx = 'correct' | 'wrong' | 'tap' | 'complete' | 'goal' | 'level' | 'combo' | 'tick';

export function sfx(kind: Sfx, comboLevel = 0) {
  let p;
  try {
    p = getProgress();
  } catch {
    return;
  }
  if (p.settings.haptics && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const pattern: Record<Sfx, number | number[]> = {
      correct: 15,
      wrong: [30, 40, 30],
      tap: 5,
      complete: [20, 30, 20, 30, 40],
      goal: [20, 30, 60],
      level: [20, 30, 60],
      combo: 20,
      tick: 0,
    };
    try {
      if (pattern[kind]) navigator.vibrate(pattern[kind]);
    } catch {
      /* not supported */
    }
  }
  if (!p.settings.sound) return;
  try {
    switch (kind) {
      case 'correct': {
        const lift = Math.min(comboLevel, 6) * 40;
        tone(660 + lift, 0, 0.12, 'triangle');
        tone(990 + lift, 0.07, 0.18, 'triangle');
        break;
      }
      case 'wrong':
        tone(220, 0, 0.18, 'sawtooth', 0.05);
        tone(180, 0.1, 0.22, 'sawtooth', 0.05);
        break;
      case 'tap':
        tone(880, 0, 0.05, 'sine', 0.05);
        break;
      case 'tick':
        tone(1200, 0, 0.03, 'square', 0.02);
        break;
      case 'combo':
        tone(784, 0, 0.1, 'triangle');
        tone(1047, 0.06, 0.1, 'triangle');
        tone(1319, 0.12, 0.16, 'triangle');
        break;
      case 'complete':
      case 'goal':
      case 'level':
        [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle', 0.1));
        break;
    }
  } catch {
    /* audio blocked */
  }
}
