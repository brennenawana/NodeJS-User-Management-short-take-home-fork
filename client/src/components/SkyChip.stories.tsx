import type { Meta, StoryObj } from "@storybook/react-vite";
import { SkyChip } from "./SkyChip";

const meta = { title: "Components/SkyChip", component: SkyChip } satisfies Meta<typeof SkyChip>;
export default meta;
type Story = StoryObj<typeof meta>;

// Figma: SkyChip, Time
export const Morning: Story = { args: { time: "morning", label: "Morning in Denver" } };
export const Afternoon: Story = { args: { time: "afternoon", label: "Afternoon in Boston" } };
export const Evening: Story = { args: { time: "evening", label: "Evening in Chicago" } };
export const Night: Story = { args: { time: "night", label: "Night in Seattle" } };
