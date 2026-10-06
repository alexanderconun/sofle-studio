// Run: npx esbuild src/keyboard/layoutFile.check.ts --bundle --platform=node | node
import { planImport, toLayoutFile } from "./layoutFile";

const behaviors: any = { 1: { id: 1, displayName: "Key Press" }, 2: { id: 2, displayName: "Transparent" } };
const keymap: any = { layers: [{ id: 7, name: "Base", bindings: [
  { behaviorId: 1, param1: 4, param2: 0 }, { behaviorId: 2, param1: 0, param2: 0 }] }] };

const file = toLayoutFile(keymap, behaviors);
console.assert(planImport(file, keymap, behaviors).changes.length === 0, "round trip is a no-op");

// After reflash the ids changed: same names must still map correctly.
const reflashed: any = { 5: { id: 5, displayName: "Key Press" }, 9: { id: 9, displayName: "Transparent" } };
const fresh: any = { layers: [{ id: 3, name: "Base", bindings: [
  { behaviorId: 9, param1: 0, param2: 0 }, { behaviorId: 9, param1: 0, param2: 0 }] }] };
const plan = planImport(file, fresh, reflashed);
console.assert(plan.changes.length === 1 && plan.changes[0].binding.behaviorId === 5
  && plan.changes[0].layerId === 3 && plan.changes[0].keyPosition === 0, "remaps by name");

file.layers[0].bindings[1].behavior = "Gone";
console.assert(planImport(file, fresh, reflashed).unknownBehaviors[0] === "Gone", "reports unknown");
let threw = false;
try { toLayoutFile(keymap, {}); } catch { threw = true; }
console.assert(threw, "refuses to export before behaviors load");
console.log("layoutFile ok");
