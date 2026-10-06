import type { ReactNode } from "react";
import type { BehaviorBinding } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bluetooth,
  Cable,
  HardDriveDownload,
  Layers,
  Lightbulb,
  LockOpen,
  LucideIcon,
  MousePointerClick,
  Power,
  RotateCcw,
  ScrollText,
  Sun,
} from "lucide-react";
import { HidUsageLabel } from "./HidUsageLabel";
import { behaviorInfo, CATEGORIES } from "../behaviors/behaviorInfo";

export interface Face {
  header?: string;
  faded?: boolean;
  content: ReactNode;
}

// Mac modifier symbols for the implicit-modifier byte of a HID usage.
const MODS: [number, string][] = [
  [0x01, "⌃"], [0x02, "⇧"], [0x04, "⌥"], [0x08, "⌘"],
  [0x10, "⌃"], [0x20, "⇧"], [0x40, "⌥"], [0x80, "⌘"],
];
const modPrefix = (usage: number) =>
  [...new Set(MODS.filter(([bit]) => (usage >>> 24) & bit).map(([, s]) => s))].join("");

// Mac names for the modifier keys themselves (keyboard page 0xE0-0xE7).
const MAC_MOD_KEYS = ["⌃ Ctrl", "⇧ Shift", "⌥ Opt", "⌘ Cmd"];

const keyLabel = (usage: number) => {
  const base = usage & 0xffffff;
  if (base >= 0x700e0 && base <= 0x700e7) {
    return <span>{MAC_MOD_KEYS[(base - 0x700e0) % 4]}</span>;
  }
  return (
  <span className="flex items-center gap-0.5">
    {modPrefix(usage)}
    <HidUsageLabel hid_usage={base} />
  </span>
  );
};

const ICON_COLOR = {
  keys: "text-base-content",
  layers: "text-sky-400",
  mouse: "text-emerald-400",
  knob: "text-emerald-400",
  light: "text-amber-400",
  connection: "text-blue-400",
  system: "text-rose-400",
  other: "text-base-content",
} satisfies Record<keyof typeof CATEGORIES, string>;

const iconFace = (Icon: LucideIcon, color: string, label?: string): Face => ({
  header: "",
  content: (
    <span className="flex flex-col items-center gap-0.5 leading-none">
      <Icon className={`size-4 ${color}`} />
      {label && <span className="text-[0.6rem]">{label}</span>}
    </span>
  ),
});

const BT = ["Clear", "Next", "Prev", "", "Clear all", "Disconn."];
const OUT = ["USB/BT", "USB", "BT"];
const RGB = ["On/Off", "On", "Off", "Hue +", "Hue −", "Sat +", "Sat −", "Bright +", "Bright −", "Speed +", "Speed −", "Effect →", "Effect ←", "Effect", "Color"];
const BL = ["On", "Off", "On/Off", "Bright +", "Bright −", "Cycle", "Set"];
const MOUSE_BTN: Record<number, string> = { 1: "Left", 2: "Right", 4: "Middle", 8: "Back", 16: "Fwd" };

const int16 = (v: number) => (v << 16) >> 16;
const moveArrow = (v: number, scroll: boolean): LucideIcon => {
  const x = int16(v >>> 16), y = int16(v & 0xffff);
  if (y) return (y < 0) !== scroll ? ArrowUp : ArrowDown;
  return x < 0 ? ArrowLeft : ArrowRight;
};

// How a key looks on the keymap: an icon or the actual key, plus a short label.
export function keyFace(
  displayName: string | undefined,
  b: BehaviorBinding,
  layerName: (id: number) => string
): Face {
  if (!displayName) return { header: "Unknown", content: null };
  const info = behaviorInfo(displayName);
  const color = ICON_COLOR[info.category];

  switch (displayName.toLowerCase()) {
    case "key press":
      return { header: "", content: keyLabel(b.param1) };
    case "transparent":
      return { header: "", faded: true, content: <span className="opacity-60">▽</span> };
    case "none":
      return { header: "", faded: true, content: <span className="opacity-60">✕</span> };
    case "momentary layer":
    case "toggle layer":
    case "to layer":
    case "sticky layer":
      return iconFace(Layers, color, `${layerName(b.param1)}${displayName.toLowerCase().startsWith("momentary") ? "" : ` (${info.title.split(" ")[0].toLowerCase()})`}`);
    case "layer-tap":
      return { header: `hold ${layerName(b.param1)}`, content: keyLabel(b.param2) };
    case "mod-tap":
      return {
        header: "hold · tap",
        content: (
          <span className="flex items-center gap-1">
            <HidUsageLabel hid_usage={b.param1} />·{keyLabel(b.param2)}
          </span>
        ),
      };
    case "sticky key":
      return { header: "sticky", content: keyLabel(b.param1) };
    case "bluetooth":
      return iconFace(Bluetooth, color, b.param1 === 3 ? `BT ${b.param2}` : BT[b.param1]);
    case "output selection":
      return iconFace(Cable, color, OUT[b.param1]);
    case "underglow":
      return iconFace(Lightbulb, color, RGB[b.param1]);
    case "backlight":
      return iconFace(Sun, color, BL[b.param1]);
    case "bootloader":
      return iconFace(HardDriveDownload, color, "Update");
    case "reset":
      return iconFace(RotateCcw, color, "Restart");
    case "studio unlock":
      return iconFace(LockOpen, color, "Unlock");
    case "mouse key press":
      return iconFace(MousePointerClick, color, MOUSE_BTN[b.param1] ?? "Click");
    case "mouse_move":
    case "mouse move":
      return iconFace(moveArrow(b.param1, false), color, "Mouse");
    case "mouse_scroll":
    case "mouse scroll":
      return iconFace(moveArrow(b.param1, true), color, "Scroll");
    case "z_so_off":
    case "soft off":
      return iconFace(Power, color, "Off");
    case "lower":
    case "raise":
      return iconFace(Layers, ICON_COLOR.layers, info.title);
  }
  if (info.category === "knob") return iconFace(ScrollText, color, info.title.replace("Knob → ", ""));
  return { header: info.title, content: null };
}
