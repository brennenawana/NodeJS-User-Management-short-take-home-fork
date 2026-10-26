import type { Meta, StoryObj } from "@storybook/react-vite";
import { SortToggle } from "./SortToggle";

const meta = { title: "Components/SortToggle", component: SortToggle, args: { onChange: () => undefined } } satisfies Meta<typeof SortToggle>;
export default meta;
type Story = StoryObj<typeof meta>;

// Figma: SortToggle, Active
export const Name: Story = { args: { active: "name" } };
export const Time: Story = { args: { active: "time" } };
