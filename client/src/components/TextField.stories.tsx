import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { TextField } from "./TextField";

const meta = {
  title: "Components/TextField", component: TextField,
  args: { id: "zip", label: "Zip code", value: "02108", onChange: () => undefined },
} satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;

// Figma: TextField, State
export const Default: Story = { args: { value: "", placeholder: "5 digits", hint: "Enter a 5-digit US zip code." } };
export const Focus: Story = {
  args: { value: "021" },
  play: async ({ canvasElement }) => userEvent.click(within(canvasElement).getByLabelText("Zip code")),
};
export const Error: Story = { args: { value: "021", state: "error", hint: "Zip codes are 5 digits — 021 is two short." } };
export const Success: Story = { args: { state: "success", hint: "Boston · UTC−4" } };
