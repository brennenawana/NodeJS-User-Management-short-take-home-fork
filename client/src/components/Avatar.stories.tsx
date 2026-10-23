import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar } from "./Avatar";

const meta = { title: "Components/Avatar", component: Avatar, args: { name: "Maya Okafor" } } satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

// Figma: Avatar, Size
export const Sm: Story = { args: { size: "sm" } };
export const Md: Story = { args: { size: "md" } };
export const Lg: Story = { args: { size: "lg" } };
