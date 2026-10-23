import type { Meta, StoryObj } from "@storybook/react-vite";
import { MapPin } from "./MapPin";

const meta = {
  title: "Components/MapPin", component: MapPin,
  args: { name: "Priya Raman", x: 40, y: 50, label: "Priya Raman, Chicago UTC−5" },
  decorators: [(Story) => <div style={{ position: "relative", width: 240, height: 120, background: "var(--color-surface-2)", borderRadius: "var(--radius-md)" }}><Story /></div>],
} satisfies Meta<typeof MapPin>;
export default meta;
type Story = StoryObj<typeof meta>;

// Figma: MapPin, Side × Selected
export const Right: Story = { args: { side: "right" } };
export const RightSelected: Story = { args: { side: "right", selected: true } };
export const Top: Story = { args: { side: "top", y: 70 } };
export const TopSelected: Story = { args: { side: "top", y: 70, selected: true } };
export const Bottom: Story = { args: { side: "bottom", y: 30 } };
export const BottomSelected: Story = { args: { side: "bottom", y: 30, selected: true } };
