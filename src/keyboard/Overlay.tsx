import { useEffect, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { X } from "lucide-react";
import { useLocalStorageState } from "../misc/useLocalStorageState";
import type { Keymap as KeymapMsg, PhysicalLayout } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import type { GetBehaviorDetailsResponse } from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { Keymap } from "./Keymap";
import { hidUsageForMacKey, pressedPositions } from "./pressedKeys";

export interface OverlayData {
  keymap: KeymapMsg;
  layout: PhysicalLayout;
  behaviors: Record<number, GetBehaviorDetailsResponse>;
}

// ponytail: assumes the Sofle keymap order Base=0, Lower=1, Raise=2, Adjust=3
// (Adjust = Lower+Raise). Make this configurable if layers get reordered.
const layerFor = (lower: boolean, raise: boolean) =>
  lower && raise ? 3 : lower ? 1 : raise ? 2 : 0;

const physicallyDown = new Set<number>();

// Always-on-top window that shows the layer currently held on the keyboard.
export const Overlay = () => {
  const [data, setData] = useState<OverlayData | null>(null);
  const [held, setHeld] = useState({ lower: false, raise: false });
  const [keysDown, setKeysDown] = useState<Set<number>>(new Set());
  const [opacity, setOpacity] = useLocalStorageState<number>("overlayOpacity", 0.9, {
    deserialize: (v) => Math.min(1, Math.max(0.2, parseFloat(v) || 0.9)),
  });

  // The window itself is transparent; the panel below carries the opacity.
  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
  }, []);

  useEffect(() => {
    const unlisten = [
      listen<OverlayData>("overlay-data", (e) => setData(e.payload)),
      listen<[number, boolean]>("key-event", (e) => {
        const usage = hidUsageForMacKey(e.payload[0]);
        if (usage === undefined) return;
        const update = (down: boolean) =>
          setKeysDown((s) => {
            const next = new Set(s);
            down ? next.add(usage) : next.delete(usage);
            return next;
          });
        if (e.payload[1]) {
          physicallyDown.add(usage);
          update(true);
        } else {
          // Keep quick taps visible for a moment.
          physicallyDown.delete(usage);
          setTimeout(() => !physicallyDown.has(usage) && update(false), 250);
        }
      }),
      listen<[string, boolean]>("layer-key", (e) => {
        const [key, pressed] = e.payload;
        setHeld((h) => ({ ...h, [key]: pressed }));
      }),
    ];
    emit("overlay-ready");
    return () => unlisten.forEach((u) => u.then((f) => f()));
  }, []);

  if (!data) {
    return (
      <div
        data-tauri-drag-region
        className="h-screen grid place-items-center rounded-lg bg-base-300 text-base-content"
        style={{ opacity }}
      >
        Connect your keyboard in Sofle Studio.
      </div>
    );
  }

  const layerIndex = Math.min(layerFor(held.lower, held.raise), data.keymap.layers.length - 1);

  return (
    <div
      className="h-screen flex flex-col rounded-lg overflow-hidden bg-base-300 text-base-content"
      style={{ opacity }}
    >
      <div data-tauri-drag-region className="px-3 py-1 flex items-center gap-2 bg-base-200 cursor-move">
        {data.keymap.layers.map((l, i) => (
          <span
            key={l.id}
            className={`px-2 rounded ${
              i === layerIndex ? "bg-primary text-primary-content" : "text-base-content/50"
            }`}
          >
            {l.name || i}
          </span>
        ))}
        <label className="ml-auto flex items-center gap-1 text-[0.75rem] text-base-content/60">
          Opacity
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-24"
          />
        </label>
        <button
          type="button"
          aria-label="Hide map"
          className="rounded p-0.5 hover:bg-base-300"
          onClick={() => getCurrentWindow().hide()}
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0 grid items-center justify-center p-2">
        <Keymap
          keymap={data.keymap}
          layout={data.layout}
          behaviors={data.behaviors}
          scale="auto"
          resolveTransparent
          selectedLayerIndex={layerIndex}
          pressedPositions={(() => {
            const p = pressedPositions(data.keymap, data.behaviors, layerIndex, keysDown);
            // Lower/Raise themselves light up while held (they're on Base).
            data.keymap.layers[0]?.bindings.forEach((b, pos) => {
              const n = data.behaviors[b.behaviorId]?.displayName.toLowerCase();
              if ((n === "lower" && held.lower) || (n === "raise" && held.raise)) p.add(pos);
            });
            return p;
          })()}
          selectedKeyPosition={undefined}
          onKeyPositionClicked={() => {}}
        />
      </div>
    </div>
  );
};
