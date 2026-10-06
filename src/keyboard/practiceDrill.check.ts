// Run: npx esbuild src/keyboard/practiceDrill.check.ts --bundle --platform=node | node
import { buildTargets, judge, pickNext } from "./practiceDrill";

const kp = (param1: number) => ({ behaviorId: 1, param1, param2: 0 });
const behaviors: any = { 1: { displayName: "Key Press" }, 2: { displayName: "Transparent" } };
const keymap: any = { layers: [{ bindings: [
  kp((0x02 << 24) | 0x70026),          // 0: "(" = ⇧9
  kp((0x08 << 24) | 0x70050),          // 1: ⌘←
  kp(0x70028), kp(0x70028),            // 2,3: Enter twice -> one target
  kp((0x01 << 24) | 0x70052),          // 4: ⌃↑ Mission Control -> skipped
  kp(0x7003a),                         // 5: F1 -> skipped
  kp(0x700e3),                         // 6: Cmd
  { behaviorId: 2, param1: 0, param2: 0 },
]}]};
const t = buildTargets(keymap, behaviors, 0);
console.assert(t.map((x) => x.position).join() === "0,1,2,6", "targets: " + t.map((x) => x.position));

const ev = (code: string, m: Partial<Record<"ctrlKey" | "shiftKey" | "altKey" | "metaKey", boolean>> = {}) =>
  ({ code, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, ...m });
console.assert(judge(ev("Digit9", { shiftKey: true }), t[0]) === "hit", "( via ⇧9");
console.assert(judge(ev("Digit9"), t[0]) === "miss", "plain 9 is a miss");
console.assert(judge(ev("ShiftLeft", { shiftKey: true }), t[0]) === null, "lone Shift ignored");
console.assert(judge(ev("ArrowLeft", { metaKey: true }), t[1]) === "hit", "⌘←");
console.assert(judge(ev("MetaLeft", { metaKey: true }), t[3]) === "hit", "Cmd key itself");
console.assert(judge(ev("KeyA"), t[3]) === "miss", "A when Cmd expected");

for (let i = 0; i < 50; i++) console.assert(pickNext(t, new Map(), t[0]) !== t[0], "no immediate repeat");
console.log("practice ok");
