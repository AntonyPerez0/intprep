// Local-calendar day keys ("YYYY-MM-DD"). Streaks and reviews care about the
// learner's own calendar day, not UTC.

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** Whole days from a to b (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86_400_000);
}

export const today = () => dayKey();

export function lastNDays(n: number, end: string = today()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(end, -i));
  return out;
}

export function weekdayShort(key: string): string {
  return parseDay(key).toLocaleDateString(undefined, { weekday: 'narrow' });
}

export function friendlyDue(key: string): string {
  const diff = daysBetween(today(), key);
  if (diff <= 0) return 'due now';
  if (diff === 1) return 'tomorrow';
  if (diff < 7) return `in ${diff} days`;
  if (diff < 30) return `in ${Math.round(diff / 7)} wk`;
  if (diff < 365) return `in ${Math.round(diff / 30)} mo`;
  return `in ${Math.round(diff / 365)} yr`;
}
