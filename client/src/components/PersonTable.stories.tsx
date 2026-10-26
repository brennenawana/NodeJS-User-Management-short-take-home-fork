import type { Meta, StoryObj } from "@storybook/react-vite";
import { NOT_A_ZIP, pending } from "../mocks/fake-api";
import { FIGMA_NOW, noor, samCantLocate, team } from "../mocks/story-data";
import { PersonTable } from "./PersonTable";

const meta = {
  title: "Components/PersonTable",
  component: PersonTable,
  // Pacific, so the Relative column reads the same wherever Storybook runs.
  args: { users: team, now: FIGMA_NOW, viewerOffset: -25200, onEdit: () => undefined, onRemove: () => undefined },
} satisfies Meta<typeof PersonTable>;
export default meta;
type Story = StoryObj<typeof meta>;

// Figma: PersonTable, rows State=Default
export const Default: Story = {};

// Figma: PersonTable, rows State=Default and State=Flagged, plus someone still pending
export const Mixed: Story = {
  args: { users: [team[0]!, noor, team[2]!, samCantLocate, pending("Jo Park", NOT_A_ZIP, "jo", "invalidZip"), team[4]!] },
};
