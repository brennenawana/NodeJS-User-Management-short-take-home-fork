import type { Meta, StoryObj } from "@storybook/react-vite";
import { ZoneCell } from "./ZoneCell";

const meta = {
  title: "Components/ZoneCell", component: ZoneCell,
  args: { offset: "UTC−4", hint: "Eastern", time: "12:50 PM", people: "3 people · Maya, Jonah, Lena" },
  decorators: [(Story) => <div style={{ display: "flex", maxWidth: 280 }}><Story /></div>],
} satisfies Meta<typeof ZoneCell>;
export default meta;
type Story = StoryObj<typeof meta>;

// Figma: ZoneCell, State
export const Default: Story = {};
export const Active: Story = { args: { state: "active" } };
export const You: Story = { args: { state: "you", hint: "You", people: "Your time" } };
// Figma: ZoneCell, Relative
export const WithRelative: Story = { args: { relative: "+3h" } };
export const ActiveWithRelative: Story = { args: { state: "active", relative: "+3h" } };
