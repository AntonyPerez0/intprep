// Where a learner was in a lesson, kept in this browser so a reload, a closed tab or a phone that
// drops the page does not send them back to the first slide. One small record per lesson, cleared
// when the lesson is finished and ignored once it is two weeks old or the lesson has changed.

const PREFIX = 'intprep.resume.';
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

interface Saved<T> {
  at: number;
  /** A fingerprint of the lesson's content: a saved place only fits the lesson it was saved in. */
  shape: string;
  state: T;
}

export function saveResume<T>(key: string, shape: string, state: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), shape, state } satisfies Saved<T>));
  } catch {
    /* storage full or blocked: the lesson just will not resume */
  }
}

export function loadResume<T>(key: string, shape: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<Saved<T>>;
    if (!saved || saved.shape !== shape || typeof saved.at !== 'number' || Date.now() - saved.at > MAX_AGE_MS || saved.state === undefined) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return saved.state as T;
  } catch {
    return null;
  }
}

export function clearResume(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}
