import {
  PhysicalLayout,
  Keymap as KeymapMsg,
} from "@zmkfirmware/zmk-studio-ts-client/keymap";
import type { GetBehaviorDetailsResponse } from "@zmkfirmware/zmk-studio-ts-client/behaviors";

import {
  LayoutZoom,
  PhysicalLayout as PhysicalLayoutComp,
} from "./PhysicalLayout";
import { keyFace } from "./KeyFace";

type BehaviorMap = Record<number, GetBehaviorDetailsResponse>;

export interface KeymapProps {
  layout: PhysicalLayout;
  keymap: KeymapMsg;
  behaviors: BehaviorMap;
  scale: LayoutZoom;
  selectedLayerIndex: number;
  selectedKeyPosition: number | undefined;
  pressedPositions?: Set<number>;
  // Show what transparent keys fall through to (faded) instead of ▽.
  resolveTransparent?: boolean;
  onKeyPositionClicked: (keyPosition: number) => void;
}

export const Keymap = ({
  layout,
  keymap,
  behaviors,
  scale,
  selectedLayerIndex,
  selectedKeyPosition,
  pressedPositions,
  resolveTransparent,
  onKeyPositionClicked,
}: KeymapProps) => {
  if (!keymap.layers[selectedLayerIndex]) {
    return <></>;
  }

  const positions = layout.keys.map((k, i) => {
    if (i >= keymap.layers[selectedLayerIndex].bindings.length) {
      return {
        id: `${keymap.layers[selectedLayerIndex].id}-${i}`,
        header: "Unknown",
        x: k.x / 100.0,
        y: k.y / 100.0,
        width: k.width / 100,
        height: k.height / 100.0,
        children: <span></span>,
      };
    }

    const isTrans = (li: number) =>
      behaviors[keymap.layers[li].bindings[i]?.behaviorId]?.displayName === "Transparent";
    let li = selectedLayerIndex;
    while (resolveTransparent && li > 0 && isTrans(li)) li--;
    const binding = keymap.layers[li].bindings[i];
    const face = keyFace(
      behaviors[binding.behaviorId]?.displayName,
      binding,
      (id) => keymap.layers.find((l) => l.id === id)?.name || `${id}`
    );
    if (li !== selectedLayerIndex) face.faded = true;
    return {
      id: `${keymap.layers[selectedLayerIndex].id}-${i}`,
      header: face.header,
      faded: face.faded,
      pressed: pressedPositions?.has(i),
      x: k.x / 100.0,
      y: k.y / 100.0,
      width: k.width / 100,
      height: k.height / 100.0,
      r: (k.r || 0) / 100.0,
      rx: (k.rx || 0) / 100.0,
      ry: (k.ry || 0) / 100.0,
      children: face.content,
    };
  });

  return (
    <PhysicalLayoutComp
      positions={positions}
      oneU={48}
      hoverZoom={true}
      zoom={scale}
      selectedPosition={selectedKeyPosition}
      onPositionClicked={onKeyPositionClicked}
    />
  );
};
