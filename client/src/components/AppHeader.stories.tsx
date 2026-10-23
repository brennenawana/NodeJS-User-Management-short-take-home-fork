import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppHeader } from "./AppHeader";

const noop = () => undefined;
const meta = {
  title: "Components/AppHeader", component: AppHeader,
  args: { query: "", onQuery: noop, view: "grid", onView: noop, theme: "light", onToggleTheme: noop, onAdd: noop },
  parameters: { edgeToEdge: true },
} satisfies Meta<typeof AppHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

// Figma: AppHeader, Device. Mobile is the same component below 640px: pick a phone size
// from the viewport menu. (Setting the viewport here would lock that menu for the story.)
export const Desktop: Story = {};
export const Mobile: Story = {};
