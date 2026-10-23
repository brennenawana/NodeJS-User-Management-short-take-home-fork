import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toast } from "./Toast";

const meta = { title: "Components/Toast", component: Toast, args: { message: "Priya Raman was removed.", onDismiss: () => undefined } } satisfies Meta<typeof Toast>;
export default meta;
type Story = StoryObj<typeof meta>;

// Figma: Toast (Message, Undo)
export const WithUndo: Story = { args: { onUndo: () => undefined } };
export const MessageOnly: Story = { args: { message: "We could not look up that zip right now." } };
