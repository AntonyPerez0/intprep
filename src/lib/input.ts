// How code drills take input: typed by default on every device, or tapped from choices on request.
//
// The stored setting (`Progress['settings']['typingMode']`) keeps its three values for older saves:
// - 'auto' (the default) and 'type' both mean "type code". Phones type too: the editor has a touch
//   key bar (Indent, Outdent, symbols) and gap inputs are sized for touch.
// - 'tap' is the explicit opt-in to pick lines from choices instead of typing them.

import type { Progress } from './store';

export type InputMode = Progress['settings']['typingMode'];

/** True when code drills should start in typing mode (everything but the explicit 'tap' opt-in). */
export function preferTyping(mode: InputMode | undefined): boolean {
  return mode !== 'tap';
}
