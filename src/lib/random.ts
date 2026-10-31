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
