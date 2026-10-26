import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { User } from "./api";
import { TimezoneStrip } from "./components/TimezoneStrip";
import { localClock } from "./lib/time";
import { renderApp } from "./test/render";
import { located } from "./test/server";

const team = () => [
  located("Lena Hoffmann", "02108", "lena"),
  located("Maya Okafor", "10001", "maya"),
  located("Priya Raman", "60601", "priya"),
  located("Daniel Reyes", "94103", "daniel"),
];

const strip = () => screen.getByRole("group", { name: "Filter people by UTC offset" });
const zoneCell = (offset: string) => within(strip()).getByRole("button", { name: new RegExp(offset.replace("+", "\\+")) });
/** Each strip cell's offset label, west to east, including the non-interactive You cell. */
const stripOffsets = () => [...strip().children].map((c) => c.querySelector(".offset")?.textContent);
const card = (name: string) => within(screen.getByRole("list", { name: "People" })).getByRole("button", { name: new RegExp(`^${name}`) }).closest("li")!;

/** Pins the viewer's zone, whatever the machine running the tests is set to. */
const viewerAt = (offsetSeconds: number) => {
  vi.restoreAllMocks();
  vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(-offsetSeconds / 60);
};

beforeEach(() => viewerAt(-25200)); // San Francisco, UTC−7
afterEach(() => vi.restoreAllMocks());

describe("relative to you", () => {
  test("each located card says how far ahead or behind its person is", async () => {
    await renderApp(team());
    expect(within(card("Lena Hoffmann")).getByText("3h ahead of you")).toHaveClass("relative");
    expect(within(card("Priya Raman")).getByText("2h ahead of you")).toBeInTheDocument();
    expect(within(card("Daniel Reyes")).getByText("Same time as you")).toBeInTheDocument();
  });

  test("strip cells show how far each offset is from you, and yours reads You", async () => {
    await renderApp(team());
    expect(within(zoneCell("UTC−4")).getByText("+3h")).toBeInTheDocument();
    expect(within(zoneCell("UTC−5")).getByText("+2h")).toBeInTheDocument();
    // Daniel shares the viewer's offset, so his cell stands in for the viewer: no separate You cell.
    expect(within(zoneCell("UTC−7")).getByText("±0")).toBeInTheDocument();
    expect(within(zoneCell("UTC−7")).getByText("You · Pacific")).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Your time zone/)).not.toBeInTheDocument();
  });

  test("when nobody shares your offset, a You cell sits at its place west to east", async () => {
    viewerAt(-21600); // Denver, UTC−6: between San Francisco and Chicago
    await renderApp(team());
    expect(stripOffsets()).toEqual(["UTC−7", "UTC−6", "UTC−5", "UTC−4"]);
    const you = screen.getByLabelText("Your time zone, UTC−6");
    expect(you.tagName).toBe("DIV");
    expect(within(strip()).getAllByRole("button")).toHaveLength(3);
    expect(within(you).getByText("You")).toBeInTheDocument();
    expect(within(you).getByText("Your time")).toBeInTheDocument();
    expect(within(you).getByText(localClock(-21600, new Date()).text)).toBeInTheDocument();
    expect(zoneCell("UTC−7")).toHaveTextContent("−1h");
    expect(zoneCell("UTC−4")).toHaveTextContent("+2h");
  });

  test("a You cell east of everyone goes last, and offsets behind you use a real minus", async () => {
    viewerAt(19800); // India, UTC+5:30
    await renderApp(team());
    expect(stripOffsets()).toEqual(["UTC−7", "UTC−5", "UTC−4", "UTC+5:30"]);
    expect(zoneCell("UTC−4")).toHaveTextContent("−9h 30m");
  });

  test("a shared offset without a zone name just says You", () => {
    const berlin = { ...located("Anna Weber", "02108", "anna"), city: "Berlin", utcOffsetSeconds: 3600 } as User;
    render(<TimezoneStrip users={[berlin]} now={new Date("2026-10-19T16:50:00Z")} viewerOffset={3600} active={null} onPick={() => undefined} />);
    expect(zoneCell("UTC+1").querySelector(".top")).toHaveTextContent(/^UTC\+1You$/);
    expect(zoneCell("UTC+1")).toHaveTextContent("±0");
  });
});
