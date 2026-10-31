// Tiny pub/sub for toasts and celebrations so any action can announce rewards.

export interface Toast {
  id: number;
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
  setTimeout(() => listeners.forEach((l) => l(full)), 0);
}
