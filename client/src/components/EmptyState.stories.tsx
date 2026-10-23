import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./EmptyState";

const meta = {
  title: "Components/EmptyState", component: EmptyState,
  args: {
    title: "No one here yet",
    body: "Add your first person with a name and a zip. We will fill in the city, map point and local time.",
    actionLabel: "Add your first person", onAction: () => undefined,
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoResults: Story = {
  args: { showIllustration: false, title: "No one matches “zzz”", body: "Try a shorter name, a city like Boston, or clear the filters.", actionLabel: "Clear search and filters", actionIcon: "close" },
};
