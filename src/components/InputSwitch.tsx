// "Type instead" / "Pick instead": the quiet switch between a code exercise and its pick twin
// ("Pick first, then type", docs/DESIGN.md). One look everywhere: a quiet small button with the
// Keyboard (type) or ListChecks (pick) icon, left of Check in the ActionBar (`secondary`), offered
// only before the first check. Pick screens offer "Type instead" in 'auto' only; a typed screen
// offers "Pick instead" only where it already had an equivalent helper.

import { Keyboard, ListChecks, Route, type LucideIcon } from 'lucide-react';
import type { CodeInput, InputMode } from '../lib/input';

/** One icon for each way of taking code, everywhere: picking is ListChecks, typing is Keyboard. */
export const INPUT_ICON: Record<CodeInput, LucideIcon> = { pick: ListChecks, type: Keyboard };

/**
 * The "Code practice" setting's icons, shared by Profile's radio cards and the onboarding plan:
 * "Always pick" and "Always type" use the input icons; "Pick first, then type" is the route from one
 * to the other.
 */
export const CODE_PRACTICE_ICON: Record<InputMode, LucideIcon> = { auto: Route, type: INPUT_ICON.type, tap: INPUT_ICON.pick };

export const INPUT_SWITCH_LABEL: Record<CodeInput, string> = { type: 'Type instead', pick: 'Pick instead' };

export function InputSwitch({ to, onClick, label, className = '' }: { to: CodeInput; onClick: () => void; label?: string; className?: string }) {
  const I = INPUT_ICON[to];
  return (
    <button type="button" className={`btn btn-quiet btn-sm input-switch ${className}`} onClick={onClick} data-to={to}>
      <I aria-hidden="true" />
      {label ?? INPUT_SWITCH_LABEL[to]}
    </button>
  );
}
