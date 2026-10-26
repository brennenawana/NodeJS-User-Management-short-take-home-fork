import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { renderApp } from "./test/render";
import { located } from "./test/server";

const team = () => [
  located("Lena Hoffmann", "02108", "lena"),
  located("Maya Okafor", "10001", "maya"),
  located("Priya Raman", "60601", "priya"),
  located("Daniel Reyes", "94103", "daniel"),
];

const card = (name: string) => within(screen.getByRole("list", { name: "People" })).getByRole("button", { name: new RegExp(`^${name}`) }).closest("li")!;

/** Pins the viewer's zone, whatever the machine running the tests is set to. */
const viewerAt = (offsetSeconds: number) => vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(-offsetSeconds / 60);

beforeEach(() => { viewerAt(-25200); }); // San Francisco, UTC−7
afterEach(() => vi.restoreAllMocks());

describe("relative to you", () => {
  test("each located card says how far ahead or behind its person is", async () => {
    await renderApp(team());
    expect(within(card("Lena Hoffmann")).getByText("3h ahead of you")).toHaveClass("relative");
    expect(within(card("Priya Raman")).getByText("2h ahead of you")).toBeInTheDocument();
    expect(within(card("Daniel Reyes")).getByText("Same time as you")).toBeInTheDocument();
  });
});
