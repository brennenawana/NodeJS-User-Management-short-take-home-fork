import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { FIGMA_NOW, team } from "../mocks/story-data";
import { TimezoneStrip } from "./TimezoneStrip";

const meta = {
  title: "Components/TimezoneStrip", component: TimezoneStrip,
  args: { users: team, now: FIGMA_NOW, active: null, onPick: () => undefined },
  render: function Render(args) {
    const [active, setActive] = useState(args.active);
    return <TimezoneStrip {...args} active={active} onPick={setActive} />;
  },
} satisfies Meta<typeof TimezoneStrip>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
