import type { Meta, StoryObj } from "@storybook/react-vite";
import { cardActions, FIGMA_NOW, noor, noorInvalid, samCantLocate, team } from "../mocks/story-data";
import { PersonCard, type PersonCardState } from "./PersonCard";

const meta = {
  // No `component`: PersonCard takes a union of props, so each story renders it directly.
  title: "Components/PersonCard",
  decorators: [(Story) => <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", maxWidth: 1000, gridTemplateColumns: "repeat(auto-fill, minmax(272px, 1fr))" }}><Story /></ul>],
} satisfies Meta;
export default meta;
type Story = StoryObj;

const lena = team[0]!;
/** San Francisco (UTC−7 in October), so the "Relative" line doesn't depend on the machine's zone. */
const VIEWER_OFFSET = -25200;
const card = (state: Exclude<PersonCardState, "skeleton">, user = lena): Story => ({
  render: () => <PersonCard state={state} user={user} now={FIGMA_NOW} viewerOffset={VIEWER_OFFSET} {...cardActions} />,
});

// Figma: PersonCard, State
export const Default = card("default");
export const Expanded = card("expanded");
export const Editing = card("editing");
export const PendingLocation = card("pendingLocation", noor);
export const InvalidZip = card("invalidZip", noorInvalid);
export const CantLocate = card("cantLocate", samCantLocate);
export const Skeleton: Story = { render: () => <PersonCard state="skeleton" /> };
