import type { Keymap, BehaviorBinding } from "@zmkfirmware/zmk-studio-ts-client/keymap";
import type { GetBehaviorDetailsResponse } from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import { invoke } from "@tauri-apps/api/core";

// Behaviors are stored by display name, not id: ids are assigned at build
// time and can change after reflashing new firmware.
export interface LayoutFile {
  format: "sofle-studio-layout";
  version: 1;
  exportedAt: string;
  layers: {
    name: string;
    bindings: { behavior: string; param1: number; param2: number }[];
  }[];
}

type Behaviors = Record<number, GetBehaviorDetailsResponse>;

export function toLayoutFile(keymap: Keymap, behaviors: Behaviors): LayoutFile {
  // Behavior names load from the keyboard one by one after connecting; an
  // export before that finishes would save bare ids that can't be imported.
  const missing = keymap.layers.some((l) => l.bindings.some((b) => !behaviors[b.behaviorId]));
  if (missing) {
    throw new Error("Studio is still loading key names from the keyboard. Wait a few seconds and try again.");
  }
  return {
    format: "sofle-studio-layout",
    version: 1,
    exportedAt: new Date().toISOString(),
    layers: keymap.layers.map((l) => ({
      name: l.name,
      bindings: l.bindings.map((b) => ({
        behavior: behaviors[b.behaviorId].displayName,
        param1: b.param1,
        param2: b.param2,
      })),
    })),
  };
}

export interface ImportPlan {
  changes: { layerIndex: number; layerId: number; keyPosition: number; binding: BehaviorBinding }[];
  unknownBehaviors: string[];
  skippedLayers: number;
}

// Works out which bindings differ from what's on the keyboard now.
export function planImport(file: LayoutFile, keymap: Keymap, behaviors: Behaviors): ImportPlan {
  if (file.format !== "sofle-studio-layout" || !Array.isArray(file.layers)) {
    throw new Error("Not a Sofle Studio layout file");
  }
  const idByName = new Map(Object.values(behaviors).map((b) => [b.displayName, b.id]));
  const unknown = new Set<string>();
  const changes: ImportPlan["changes"] = [];

  file.layers.slice(0, keymap.layers.length).forEach((fl, li) => {
    const layer = keymap.layers[li];
    fl.bindings.slice(0, layer.bindings.length).forEach((fb, pos) => {
      const behaviorId = idByName.get(fb.behavior);
      if (behaviorId === undefined) {
        unknown.add(fb.behavior);
        return;
      }
      const cur = layer.bindings[pos];
      if (cur.behaviorId !== behaviorId || cur.param1 !== fb.param1 || cur.param2 !== fb.param2) {
        changes.push({
          layerIndex: li,
          layerId: layer.id,
          keyPosition: pos,
          binding: { behaviorId, param1: fb.param1, param2: fb.param2 },
        });
      }
    });
  });

  return {
    changes,
    unknownBehaviors: [...unknown],
    skippedLayers: Math.max(0, file.layers.length - keymap.layers.length),
  };
}

// Desktop app: write to ~/Downloads via the Rust side. Browser: normal download.
export async function saveLayoutFile(file: LayoutFile): Promise<string> {
  const name = `sofle-layout-${file.exportedAt.slice(0, 19).replace(/[:T]/g, "-")}.json`;
  const contents = JSON.stringify(file, null, 2);
  if (window.__TAURI_INTERNALS__) {
    return await invoke<string>("save_layout", { name, contents });
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
  return name;
}
