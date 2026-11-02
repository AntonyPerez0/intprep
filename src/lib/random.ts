export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Shuffle so that items sharing a group key are spread apart where possible
 * (interleaving: the next card is rarely about the same problem).
 */
export function interleave<T>(items: readonly T[], group: (t: T) => string): T[] {
  const buckets = new Map<string, T[]>();
  for (const it of shuffle(items)) {
    const k = group(it);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(it);
  }
  const out: T[] = [];
  let last = '';
  while (out.length < items.length) {
    // Prefer the largest bucket that is not the one we just used.
    const keys = [...buckets.keys()].filter((k) => buckets.get(k)!.length > 0);
    keys.sort((a, b) => buckets.get(b)!.length - buckets.get(a)!.length);
    const k = keys.find((x) => x !== last) ?? keys[0];
    out.push(buckets.get(k)!.shift()!);
    last = k;
  }
  return out;
}

// ── Seeded randomness ───────────────────────────────────────────────────────
// For choices that must stay the same on a retry or a reload (the options of a gap, the order of
// a part's lines): the same seed and content always give the same result.

/** A deterministic random source in [0, 1) (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A 32-bit hash of a string (FNV-1a), to mix content into a seed. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** `shuffle` with a given random source (e.g. `seededRandom(seed)`). */
export function shuffleWith<T>(arr: readonly T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
