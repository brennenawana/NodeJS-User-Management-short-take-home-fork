import type { Meta, StoryObj } from "@storybook/react-vite";
import { ViewToggle } from "./ViewToggle";

const meta = { title: "Components/ViewToggle", component: ViewToggle, args: { onChange: () => undefined } } satisfies Meta<typeof ViewToggle>;
export default meta;
type Story = StoryObj<typeof meta>;

// Figma: ViewToggle, Active
export const Grid: Story = { args: { active: "grid" } };
export const List: Story = { args: { active: "list" } };
export const Map: Story = { args: { active: "map" } };
