import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";
import { located, OUTAGE_ZIP, SLOW_ZIP } from "../test/fake-api";
import { FIGMA_NOW } from "../test/story-data";
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
export const LookupFailed: Story = { args: { defaultName: "Noor Haddad", defaultZip: OUTAGE_ZIP }, play: state("lookupFailed") };
