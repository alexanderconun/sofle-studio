import type { Keymap } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import type { GetBehaviorDetailsResponse } from "@zmkfirmware/zmk-studio-ts-client/behaviors";

// Browser KeyboardEvent.code -> HID keyboard usage id (page 7). `code` is the
// physical key, so this works the same with the Russian input source.
const CODE_TO_HID: Record<string, number> = {
  Enter: 0x28, Escape: 0x29, Backspace: 0x2a, Tab: 0x2b, Space: 0x2c,
  Minus: 0x2d, Equal: 0x2e, BracketLeft: 0x2f, BracketRight: 0x30, Backslash: 0x31,
  Semicolon: 0x33, Quote: 0x34, Backquote: 0x35, Comma: 0x36, Period: 0x37, Slash: 0x38,
  CapsLock: 0x39, Insert: 0x49, Home: 0x4a, PageUp: 0x4b, Delete: 0x4c, End: 0x4d,
  PageDown: 0x4e, ArrowRight: 0x4f, ArrowLeft: 0x50, ArrowDown: 0x51, ArrowUp: 0x52,
  ControlLeft: 0xe0, ShiftLeft: 0xe1, AltLeft: 0xe2, MetaLeft: 0xe3,
  ControlRight: 0xe4, ShiftRight: 0xe5, AltRight: 0xe6, MetaRight: 0xe7,
};
for (let i = 0; i < 26; i++) CODE_TO_HID[`Key${String.fromCharCode(65 + i)}`] = 0x04 + i;
for (let i = 1; i <= 9; i++) CODE_TO_HID[`Digit${i}`] = 0x1d + i;
CODE_TO_HID.Digit0 = 0x27;

export const usageForCode = (code: string): number | undefined =>
  CODE_TO_HID[code] === undefined ? undefined : (7 << 16) | CODE_TO_HID[code];

const isMod = (u: number) => u >= 0x700e0 && u <= 0x700e7;
// 0x01 Ctrl, 0x02 Shift, 0x04 Opt, 0x08 Cmd (left/right folded together).
const foldMods = (m: number) => (m | (m >> 4)) & 0x0f;

export interface Target {
  layerIndex: number;
  position: number;
  usage: number; // base HID usage
  mods: number; // folded built-in modifiers
  binding: { behaviorId: number; param1: number; param2: number };
}

// Shortcuts macOS grabs before the app sees them (Spotlight, Mission Control,
// screenshots, lock screen, input switching), plus F-keys which macOS may turn
// into media keys. These can't be checked, so they're left out of drills.
const unpractisable = (usage: number, mods: number) =>
  (mods & 0x01) !== 0 || // anything with Ctrl
  ((mods & 0x08) !== 0 && ((mods & 0x02) !== 0 || usage === 0x7002c)) || // ⇧⌘…, ⌘Space
  (usage >= 0x7003a && usage <= 0x70045); // F1–F12

// Every distinct key you can practise on a layer (transparent keys skipped,
// duplicates like the two Enter keys merged).
export function buildTargets(
  keymap: Keymap,
  behaviors: Record<number, GetBehaviorDetailsResponse>,
  layerIndex: number
): Target[] {
  const seen = new Set<string>();
  const out: Target[] = [];
  keymap.layers[layerIndex]?.bindings.forEach((b, position) => {
    if (behaviors[b.behaviorId]?.displayName.toLowerCase() !== "key press") return;
    const usage = b.param1 & 0xffffff;
    const mods = foldMods(b.param1 >>> 24);
    if (usage >> 16 !== 7 || unpractisable(usage, mods)) return;
    const key = `${usage}:${mods}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ layerIndex, position, usage, mods, binding: b });
  });
  return out;
}

export interface Pressed {
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

// "hit" | "miss" | null (null = a lone modifier on its way to a combo; ignore).
export function judge(e: Pressed, t: Target): "hit" | "miss" | null {
  const usage = usageForCode(e.code);
  if (isMod(t.usage)) return usage === t.usage ? "hit" : usage && isMod(usage) ? null : "miss";
  if (usage === undefined) return null;
  if (isMod(usage)) return null;
  const mods = (e.ctrlKey ? 1 : 0) | (e.shiftKey ? 2 : 0) | (e.altKey ? 4 : 0) | (e.metaKey ? 8 : 0);
  return usage === t.usage && mods === t.mods ? "hit" : "miss";
}

// Pick the next target, favouring ones you've missed, never repeating the last.
// ponytail: misses live only for the session; persist per-key stats if wanted.
export function pickNext(targets: Target[], misses: Map<string, number>, last?: Target): Target {
  const pool = targets.length > 1 ? targets.filter((t) => t !== last) : targets;
  const weight = (t: Target) => 1 + 3 * (misses.get(`${t.layerIndex}:${t.position}`) ?? 0);
  let r = Math.random() * pool.reduce((s, t) => s + weight(t), 0);
  for (const t of pool) if ((r -= weight(t)) <= 0) return t;
  return pool[pool.length - 1];
}
