import type { Meta, StoryObj } from "@storybook/react-vite";
import { NeedsAttention } from "./NeedsAttention";

const meta = { title: "Components/NeedsAttention", component: NeedsAttention, args: { label: "2 people need attention", onClick: () => undefined } } satisfies Meta<typeof NeedsAttention>;
export default meta;
type Story = StoryObj<typeof meta>;

// Figma: NeedsAttention, State
export const Default: Story = {};
export const Active: Story = { args: { state: "active" } };
