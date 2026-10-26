import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { CANT_LOCATE_ZIP, located, OUTAGE_ZIP, SLOW_ZIP } from "../mocks/fake-api";
import { FIGMA_NOW } from "../mocks/story-data";
import { AddSheet } from "./AddSheet";

const meta = {
  title: "Components/AddSheet", component: AddSheet,
  args: { now: FIGMA_NOW, onClose: () => undefined, onSave: async ({ name }) => located(name, "02108") },
} satisfies Meta<typeof AddSheet>;
export default meta;
type Story = StoryObj<typeof meta>;

const state = (expected: string) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const sheet = canvasElement.querySelector("section")!;
  await waitFor(() => expect(sheet.dataset.state).toBe(expected), { timeout: 2000 });
};

// Figma: AddSheet, State. Zips resolve through the same fake API the tests use.
export const Empty: Story = { play: state("empty") };
export const LookingUp: Story = { args: { defaultName: "Noor Haddad", defaultZip: SLOW_ZIP }, play: state("lookingUp") };
export const Resolved: Story = {
  args: { defaultName: "Lena Hoffmann", defaultZip: "02108" },
  play: async (ctx) => {
    await state("resolved")(ctx);
    await expect(within(ctx.canvasElement).getAllByText("Boston · UTC−4")[0]).toBeVisible();
  },
};
export const InvalidZip: Story = { args: { defaultName: "Noor Haddad", defaultZip: "021" }, play: state("invalidZip") };
// LookupFailed covers two causes with different copy: an outage (saved as pending and
// retried) and a real zip the provider can't place (saved and flagged, never retried).
export const LookupFailed: Story = {
  args: { defaultName: "Noor Haddad", defaultZip: OUTAGE_ZIP },
  play: async (ctx) => {
    await state("lookupFailed")(ctx);
    await expect(within(ctx.canvasElement).getByText(/You can still save and we will retry/)).toBeVisible();
  },
};
export const LookupFailedCantPlace: Story = {
  name: "Lookup Failed (Can't Place)",
  args: { defaultName: "Noor Haddad", defaultZip: CANT_LOCATE_ZIP },
  play: async (ctx) => {
    await state("lookupFailed")(ctx);
    await expect(within(ctx.canvasElement).getByText(/their card will be flagged/)).toBeVisible();
  },
};
