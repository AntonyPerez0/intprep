// Tiny pub/sub for toasts and celebrations so any action can announce rewards.

export interface Toast {
  id: number;
  /** Name from the icon registry (src/components/icons.tsx), e.g. 'flame'. */
  icon: string;
  title: string;
  body?: string;
  tone?: 'success' | 'info' | 'warn' | 'streak' | 'gem';
}

type Listener = (t: Toast) => void;
const listeners = new Set<Listener>();
let nextId = 1;

export function onToast(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function toast(t: Omit<Toast, 'id'>) {
  const full = { ...t, id: nextId++ };
  // Defer so toasts raised during a state update render after it.
  later(() => setTimeout(() => listeners.forEach((l) => l(full)), 0));
}

let held: (() => void)[] | null = null;

/**
 * Hold toasts (and the sounds that go with them, see `later`) until the returned release is
 * called. A session that saves as it goes (Daily review) holds them, so a streak or level-up
 * toast never covers the card or its Continue button; release shows them, on the completion
 * screen or, after a close, on the page the learner lands on.
 */
export function holdToasts(): () => void {
  const mine: (() => void)[] = [];
  held = mine;
  return () => {
    if (held === mine) held = null;
    mine.splice(0).forEach((f) => f());
  };
}

/** Run a celebration (a toast, or the sound that goes with one) now, or when held toasts are released. */
export function later(fn: () => void) {
  if (held) held.push(fn);
  else fn();
}
