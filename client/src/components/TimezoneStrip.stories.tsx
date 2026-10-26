import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { FIGMA_NOW, team } from "../mocks/story-data";
import { TimezoneStrip } from "./TimezoneStrip";

/** San Francisco (UTC−7 in October), so the stories don't depend on the machine's zone. */
const SAN_FRANCISCO = -25200;

const meta = {
  title: "Components/TimezoneStrip", component: TimezoneStrip,
  args: { users: team, now: FIGMA_NOW, viewerOffset: SAN_FRANCISCO, active: null, onPick: () => undefined },
  render: function Render(args) {
    const [active, setActive] = useState(args.active);
    return <TimezoneStrip {...args} active={active} onPick={setActive} />;
  },
} satisfies Meta<typeof TimezoneStrip>;
export default meta;

type Story = StoryObj<typeof meta>;

// Someone on the team shares the viewer's offset, so that cell reads "You · Pacific".
export const Default: Story = {};
// Nobody shares the viewer's offset (UTC+1), so a dashed "You" cell sits at its place, west to east.
export const ViewerElsewhere: Story = { args: { viewerOffset: 3600 } };
