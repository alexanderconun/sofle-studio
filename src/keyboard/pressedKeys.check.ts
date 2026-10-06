// Run: npx esbuild src/keyboard/pressedKeys.check.ts --bundle --platform=node | node
import { hidUsageForMacKey, pressedPositions } from "./pressedKeys";

console.assert(hidUsageForMacKey(0x00) === 0x70004, "mac A -> HID a");
console.assert(hidUsageForMacKey(0x7b) === 0x70050, "mac Left -> HID left");
console.assert(hidUsageForMacKey(0x37) === 0x700e3, "mac Cmd -> HID LGUI");

const behaviors: any = { 1: { displayName: "Key Press" }, 2: { displayName: "Transparent" } };
const keymap: any = { layers: [
  { bindings: [{ behaviorId: 1, param1: 0x700e3 }, { behaviorId: 1, param1: 0x70050 }] },
  // Lower: pos 0 transparent (falls to Cmd), pos 1 is ⌘← (implicit mod in top byte)
  { bindings: [{ behaviorId: 2, param1: 0 }, { behaviorId: 1, param1: (0x08 << 24) | 0x70050 }] },
]};
const p = pressedPositions(keymap, behaviors, 1, new Set([0x700e3, 0x70050]));
console.assert(p.has(1) && p.size === 1, "⌘← lights only the ⌘← key, not Cmd");
const c = pressedPositions(keymap, behaviors, 1, new Set([0x700e3]));
console.assert(c.has(0) && c.size === 1, "transparent falls through to Cmd");
console.assert(pressedPositions(keymap, behaviors, 1, new Set()).size === 0, "nothing held");
// Raise-style layer: "(" = ⇧9 on pos 1, plain 9 falls through on pos 0, Shift on pos 2.
const km2: any = { layers: [
  { bindings: [{ behaviorId: 1, param1: 0x70026 }, { behaviorId: 1, param1: 0x70004 }, { behaviorId: 1, param1: 0x700e1 }] },
  { bindings: [{ behaviorId: 2, param1: 0 }, { behaviorId: 1, param1: (0x02 << 24) | 0x70026 }, { behaviorId: 2, param1: 0 }] },
]};
const q = pressedPositions(km2, behaviors, 1, new Set([0x700e1, 0x70026]));
console.assert(q.has(1) && !q.has(0) && !q.has(2), "( lights only the ( key, not 9 or Shift");
const r = pressedPositions(km2, behaviors, 1, new Set([0x700e1]));
console.assert(r.has(2) && r.size === 1, "Shift alone lights Shift");
console.log("pressedKeys ok");
