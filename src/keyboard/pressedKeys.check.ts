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
console.assert(p.has(0) && p.has(1) && p.size === 2, "transparent falls through, implicit mods ignored");
console.assert(pressedPositions(keymap, behaviors, 1, new Set()).size === 0, "nothing held");
console.log("pressedKeys ok");
