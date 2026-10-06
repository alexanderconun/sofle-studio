import type { Meta, StoryObj } from "@storybook/react";
import { Keymap } from "./Keymap";
import data from "./Keymap.stories.data.json";

const meta = {
  title: "Keyboard/Keymap",
  component: Keymap,
  args: {
    layout: data.layout as any,
    keymap: data.keymap as any,
    behaviors: data.behaviors as any,
    scale: 1,
    selectedKeyPosition: undefined,
    onKeyPositionClicked: () => {},
  },
} satisfies Meta<typeof Keymap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Base: Story = { args: { selectedLayerIndex: 0 } };
export const Lower: Story = { args: { selectedLayerIndex: 1 } };
export const Raise: Story = { args: { selectedLayerIndex: 2 } };
export const Adjust: Story = { args: { selectedLayerIndex: 3 } };
// Holding Lower and pressing ⌘← (Cmd falls through from Base).
export const LowerPressed: Story = {
  args: { selectedLayerIndex: 1, pressedPositions: new Set([56, 21, 54]), resolveTransparent: true },
};
