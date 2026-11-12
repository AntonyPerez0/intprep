// The step-by-step traces of the solutions ("Watch it run"), built by scripts/build-traces.py into
// src/content/traces/<unit>.json and loaded a unit at a time, when a lesson first needs one.

import type { CategoryId, Problem } from '../content/types';

/** One executed line, as the build script stores it: only what changed since the call's last step. */
export interface StoredStep {
  /** 0-based line of the solution that is about to run. */
  l: number;
  /** Call depth (0 = the method itself). */
  d: number;
  /** The function running. */
  f: string;
  /** Variables that are new or changed, as shown text. */
  v: Record<string, string>;
  /** Variables that went away. */
  x?: string[];
  /** Values returned by calls that ended on this step, by depth. */
  r?: Record<string, string>;
}

export interface StoredTrace {
  input: string;
  steps: StoredStep[];
  result: string;
  /** The run was longer than the trace: it stops part-way. */
  truncated: boolean;
}

/** One step, ready to show. */
export interface TraceFrame {
  line: number;
  depth: number;
  fn: string;
  /** Every variable of the running call, in the order it appeared. */
  vars: [name: string, value: string][];
  /** The names that are new or changed on this step. */
  changed: Set<string>;
  /** The line about to run ends this call: what it returns. */
  returned?: string;
  /** The functions on the call stack, outermost first. */
  stack: string[];
}

const files = import.meta.glob<{ default: Record<string, StoredTrace> }>('../content/traces/*.json');
const loaded = new Map<CategoryId, Promise<Record<string, StoredTrace>>>();

/** A problem's trace, or null when it has none (or it cannot be loaded: offline before it was cached). */
export function loadTrace(p: Problem): Promise<StoredTrace | null> {
  let unit = loaded.get(p.category);
  if (!unit) {
    const load = files[`../content/traces/${p.category}.json`];
    unit = load ? load().then((m) => m.default) : Promise.resolve({});
    loaded.set(p.category, unit);
    // A failed load may work later (back online): do not remember it.
    unit.catch(() => loaded.delete(p.category));
  }
  return unit.then(
    (all) => all[p.id] ?? null,
    () => null,
  );
}

/** Replay a stored trace into full frames: each call's variables accumulate from its steps' changes. */
export function expandTrace(t: StoredTrace): TraceFrame[] {
  const calls = new Map<number, { key: string; vars: Map<string, string> }>();
  return t.steps.map((s) => {
    const key = `${s.d}:${s.f}`;
    let call = calls.get(s.d);
    if (!call || call.key !== key) {
      call = { key, vars: new Map() };
      calls.set(s.d, call);
    }
    for (const d of [...calls.keys()]) if (d > s.d) calls.delete(d);
    for (const name of s.x ?? []) call.vars.delete(name);
    for (const [name, value] of Object.entries(s.v)) call.vars.set(name, value);
    return {
      line: s.l,
      depth: s.d,
      fn: s.f,
      vars: [...call.vars.entries()],
      changed: new Set(Object.keys(s.v)),
      returned: s.r?.[String(s.d)],
      stack: [...calls.entries()].sort((a, b) => a[0] - b[0]).map(([, c]) => c.key.slice(c.key.indexOf(':') + 1)),
    };
  });
}
