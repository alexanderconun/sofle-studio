import type { Meta, StoryObj } from "@storybook/react";
import { Practice } from "./Practice";
import data from "./Keymap.stories.data.json";

const meta = {
  title: "Keyboard/Practice",
  component: Practice,
  args: {
    open: true,
    onClose: () => {},
    layout: data.layout as any,
    keymap: data.keymap as any,
    behaviors: data.behaviors as any,
  },
} satisfies Meta<typeof Practice>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
