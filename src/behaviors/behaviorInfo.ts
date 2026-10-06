import {
  Bluetooth,
  Cpu,
  Keyboard,
  Layers,
  LucideIcon,
  MousePointer2,
  Puzzle,
  Sun,
  RotateCw,
} from "lucide-react";

export interface Category {
  name: string;
  icon: LucideIcon;
}

export const CATEGORIES = {
  keys: { name: "Keys", icon: Keyboard },
  layers: { name: "Layers", icon: Layers },
  mouse: { name: "Mouse", icon: MousePointer2 },
  knob: { name: "Knob (encoder)", icon: RotateCw },
  light: { name: "Lighting & power", icon: Sun },
  connection: { name: "Connection", icon: Bluetooth },
  system: { name: "System", icon: Cpu },
  other: { name: "Other", icon: Puzzle },
} satisfies Record<string, Category>;

export type CategoryId = keyof typeof CATEGORIES;

export interface BehaviorInfo {
  title: string;
  category: CategoryId;
  short: string;
  long: string;
  example?: string;
}

// Keyed by the firmware's display name, lower-cased. Names not listed here
// fall back to UNKNOWN, so new firmware behaviors still show up.
const INFO: Record<string, BehaviorInfo> = {
  "key press": {
    title: "Key Press",
    category: "keys",
    short: "Types a key",
    long: "A normal key. Sends the chosen key (letter, number, symbol, media key…) while held. Tick modifiers to send a shortcut instead.",
    example: "A · Enter · ⌘C · Volume Up",
  },
  "key toggle": {
    title: "Key Toggle",
    category: "keys",
    short: "Press once to hold, again to release",
    long: "Latches a key down until you press this key again. Handy for holding Shift or a game key without keeping your finger on it.",
  },
  "key repeat": {
    title: "Key Repeat",
    category: "keys",
    short: "Repeats the last key you typed",
    long: "Sends whatever key was pressed last, so double letters or repeated shortcuts don't need the same finger twice.",
  },
  "grave/escape": {
    title: "Grave / Escape",
    category: "keys",
    short: "Esc normally, ` with Shift or ⌘",
    long: "Acts as Escape, but types ` (or ~ with Shift) when Shift or Cmd/Win is held. Saves a key on small boards.",
  },
  "caps word": {
    title: "Caps Word",
    category: "keys",
    short: "Caps lock for one word",
    long: "Capitalises letters until you type a space or punctuation, then turns itself off. Great for CONSTANT_NAMES.",
  },
  "sticky key": {
    title: "Sticky Key",
    category: "keys",
    short: "Tap a modifier, it applies to the next key",
    long: "Tap it, then tap another key: the modifier is applied to that next key only. Lets you do ⌘C as two taps instead of a chord.",
    example: "Sticky ⌘, then C → ⌘C",
  },
  "mod-tap": {
    title: "Mod-Tap",
    category: "keys",
    short: "Tap = key, hold = modifier",
    long: "One key, two jobs: tapping types the key, holding acts as a modifier (Ctrl, Shift, ⌘…). Used for home-row mods.",
    example: "Tap A, hold for Ctrl",
  },
  transparent: {
    title: "Transparent",
    category: "keys",
    short: "Falls through to the layer below",
    long: "Does nothing itself: the key behaves as it does on the next active layer underneath (usually Base). Shown as ▽.",
  },
  none: {
    title: "None",
    category: "keys",
    short: "Disabled key",
    long: "Blocks the key completely, including layers below. Use it when you want a key to do nothing on this layer.",
  },
  "momentary layer": {
    title: "Momentary Layer",
    category: "layers",
    short: "Hold to switch layer",
    long: "Activates a layer only while held. Release and you're back. This is how Lower and Raise work.",
  },
  "layer-tap": {
    title: "Layer-Tap",
    category: "layers",
    short: "Tap = key, hold = layer",
    long: "Tapping types a key, holding activates a layer. Lets a thumb key be both Space and a layer key.",
    example: "Tap Space, hold for Lower",
  },
  "toggle layer": {
    title: "Toggle Layer",
    category: "layers",
    short: "Press to turn a layer on/off",
    long: "Turns a layer on with one press and off with the next. Good for a numpad or gaming layer you stay in for a while.",
  },
  "to layer": {
    title: "To Layer",
    category: "layers",
    short: "Jump to a layer and stay there",
    long: "Switches to the chosen layer and turns off all others (except Base). Use it as a 'go home' or 'go to layer X' key.",
  },
  "sticky layer": {
    title: "Sticky Layer",
    category: "layers",
    short: "Layer applies to the next key only",
    long: "Tap it, then tap one key: that key comes from the chosen layer, then you're back. No need to hold.",
  },
  "mouse key press": {
    title: "Mouse Click",
    category: "mouse",
    short: "Left / right / middle / back / forward click",
    long: "Clicks a mouse button from the keyboard.",
  },
  mouse_move: {
    title: "Mouse Move",
    category: "mouse",
    short: "Moves the cursor while held",
    long: "Moves the mouse pointer in one direction while held. Speeds up the longer you hold it.",
  },
  "mouse move": {
    title: "Mouse Move",
    category: "mouse",
    short: "Moves the cursor while held",
    long: "Moves the mouse pointer in one direction while held. Speeds up the longer you hold it.",
  },
  mouse_scroll: {
    title: "Mouse Scroll",
    category: "mouse",
    short: "Scrolls while held",
    long: "Scrolls the page up, down, left or right while held, like a scroll wheel.",
  },
  "mouse scroll": {
    title: "Mouse Scroll",
    category: "mouse",
    short: "Scrolls while held",
    long: "Scrolls the page up, down, left or right while held, like a scroll wheel.",
  },
  scroll_encoder: {
    title: "Knob → Scroll",
    category: "knob",
    short: "Knob scrolls the page",
    long: "A knob action: turning the knob scrolls up/down. Meant for the knob, not for keys; on a normal key it does nothing useful.",
  },
  rsr_vol: {
    title: "Knob → Volume",
    category: "knob",
    short: "Knob changes volume",
    long: "A knob action: turning the knob changes the volume. Meant for the knob, not for keys.",
  },
  rsr_trans: {
    title: "Knob → Transparent",
    category: "knob",
    short: "Knob uses the layer below",
    long: "A knob action: the knob does whatever it does on the layer underneath. Meant for the knob, not for keys.",
  },
  enc_key_press: {
    title: "Knob → Key Press",
    category: "knob",
    short: "Knob sends keys when turned",
    long: "A knob action defined by your board's firmware: turning the knob sends key presses. Meant for the knob, not for keys.",
  },
  underglow: {
    title: "RGB Underglow",
    category: "light",
    short: "Lights under the board",
    long: "Controls the RGB lights under the keyboard: on/off, effect, colour, saturation, brightness.",
  },
  backlight: {
    title: "Backlight",
    category: "light",
    short: "Light under the keys",
    long: "Controls the single-colour backlight under the keys: on/off and brightness.",
  },
  "external power": {
    title: "External Power",
    category: "light",
    short: "Power for lights and displays",
    long: "Turns the power rail for LEDs/displays on or off. Turning it off saves a lot of battery but also kills the lights.",
  },
  z_so_off: {
    title: "Power Off",
    category: "light",
    short: "Turns the keyboard off",
    long: "Puts the keyboard into deep sleep (soft off) to save battery. Press the reset button or a wake key to turn it back on.",
  },
  "soft off": {
    title: "Power Off",
    category: "light",
    short: "Turns the keyboard off",
    long: "Puts the keyboard into deep sleep (soft off) to save battery. Press the reset button or a wake key to turn it back on.",
  },
  bluetooth: {
    title: "Bluetooth",
    category: "connection",
    short: "Pick / clear Bluetooth devices",
    long: "Switches between paired devices (slots 0–4), or clears pairings so you can pair again.",
    example: "BT 0 = Mac, BT 1 = iPad",
  },
  "output selection": {
    title: "USB / Bluetooth",
    category: "connection",
    short: "Choose USB or Bluetooth output",
    long: "Decides whether keystrokes go over the USB cable or Bluetooth when both are available.",
  },
  bootloader: {
    title: "Bootloader",
    category: "system",
    short: "Enter firmware update mode",
    long: "Puts this half into update mode (a NICENANO drive appears) so you can copy new firmware onto it. Same as double-tapping reset.",
  },
  reset: {
    title: "Reset",
    category: "system",
    short: "Restart the keyboard",
    long: "Restarts this half. Nothing is erased.",
  },
  "studio unlock": {
    title: "Studio Unlock",
    category: "system",
    short: "Allow Studio to make changes",
    long: "Unlocks the keyboard so ZMK Studio can edit it. Only needed if your firmware has Studio locking turned on.",
  },
};

export const behaviorInfo = (displayName: string): BehaviorInfo =>
  INFO[displayName.toLowerCase()] ?? {
    title: displayName,
    category: "other",
    short: "Custom behavior from your firmware",
    long: `"${displayName}" is defined in your keyboard's firmware. Studio has no description for it yet.`,
  };
