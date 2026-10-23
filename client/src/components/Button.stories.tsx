import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = { title: "Components/Button", component: Button, args: { label: "Add a person", icon: "plus" } } satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

// Figma: Button, Variant × State
export const Primary: Story = { args: { variant: "primary" } };
export const PrimaryDisabled: Story = { args: { variant: "primary", state: "disabled" } };
export const Secondary: Story = { args: { variant: "secondary", label: "Edit", icon: "edit" } };
export const SecondaryDisabled: Story = { args: { variant: "secondary", label: "Edit", icon: "edit", state: "disabled" } };
export const Ghost: Story = { args: { variant: "ghost", label: "Refresh location", icon: undefined } };
export const GhostDisabled: Story = { args: { variant: "ghost", label: "Refresh location", icon: undefined, state: "disabled" } };
export const Danger: Story = { args: { variant: "danger", label: "Remove", icon: "trash" } };
export const DangerDisabled: Story = { args: { variant: "danger", label: "Remove", icon: "trash", state: "disabled" } };
