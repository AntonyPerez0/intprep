// "Type instead" / "Pick instead": the quiet switch between a code exercise and its pick twin
// ("Pick first, then type", docs/DESIGN.md). One look everywhere: a quiet small button with the
// Keyboard (type) or List (pick) icon, left of Check in the ActionBar (`secondary`), offered only
// before the first check. Pick screens offer "Type instead" in 'auto' only; a typed screen offers
// "Pick instead" only where it already had an equivalent helper.

import { Keyboard, List } from 'lucide-react';
import type { CodeInput } from '../lib/input';

export const INPUT_SWITCH_LABEL: Record<CodeInput, string> = { type: 'Type instead', pick: 'Pick instead' };

export function InputSwitch({ to, onClick, label, className = '' }: { to: CodeInput; onClick: () => void; label?: string; className?: string }) {
  const I = to === 'type' ? Keyboard : List;
  return (
    <button type="button" className={`btn btn-quiet btn-sm input-switch ${className}`} onClick={onClick} data-to={to}>
      <I aria-hidden="true" />
      {label ?? INPUT_SWITCH_LABEL[to]}
    </button>
  );
}
