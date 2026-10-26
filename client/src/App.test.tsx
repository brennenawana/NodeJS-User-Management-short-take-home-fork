import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import product from "../../product.json";
import { UNDO_MS } from "./hooks/useUsers";
import { renderApp } from "./test/render";
import { calls, CANT_LOCATE_ZIP, located, NOT_A_ZIP, OUTAGE_ZIP, pending, stored } from "./test/server";

const team = () => [
  located("Lena Hoffmann", "02108", "lena"),
  located("Maya Okafor", "10001", "maya"),
  located("Priya Raman", "60601", "priya"),
  located("Daniel Reyes", "94103", "daniel"),
];

const identity = (name: string) => within(screen.getByRole("list", { name: "People" })).getByRole("button", { name: new RegExp(`^${name}`) });
const card = (name: string) => identity(name).closest("li")!;

afterEach(() => vi.useRealTimers());

describe("App", () => {
  test("shows skeletons, then everyone sorted by name, with the wordmark from product.json", async () => {
    await renderApp(team());
    expect(screen.getByRole("link", { name: `${product.shortName} home` })).toHaveTextContent(product.shortName);
    const cards = within(screen.getByRole("list", { name: "People" })).getAllByRole("listitem");
    expect(cards.map((li) => li.querySelector(".name")?.textContent)).toEqual(["Daniel Reyes", "Lena Hoffmann", "Maya Okafor", "Priya Raman"]);
    expect(screen.getByText("4 people")).toBeInTheDocument();
  });

  test("empty state invites the first person", async () => {
    const user = await renderApp([]);
    await screen.findByText("No one here yet");
    await user.click(screen.getByRole("button", { name: "Add your first person" }));
    expect(screen.getByRole("region", { name: "Add a person" })).toBeInTheDocument();
  });

  test("adding someone puts their card in the grid, expanded", async () => {
    const user = await renderApp(team());
    await user.click(within(screen.getByRole("banner")).getByRole("button", { name: "Add a person" }));
    await user.type(screen.getByLabelText("Name"), "Grace Whitfield");
    await user.type(screen.getByLabelText("Zip code"), "80202");
    await waitFor(() => expect(screen.getByRole("button", { name: "Add person" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Add person" }));
    await waitFor(() => expect(screen.queryByRole("region", { name: "Add a person" })).not.toBeInTheDocument());
    expect(card("Grace Whitfield")).toHaveAttribute("data-state", "expanded");
    expect(within(card("Grace Whitfield")).getAllByText("Denver · UTC−6").length).toBeGreaterThan(0);
  });

  test("the floating add button (mobile) opens the sheet and steps aside while it's open", async () => {
    const user = await renderApp(team());
    const floating = screen.getAllByRole("button", { name: "Add a person" }).find((b) => !screen.getByRole("banner").contains(b))!;
    await user.click(floating);
    expect(screen.getByRole("region", { name: "Add a person" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add a person" })).toHaveLength(1);
  });

  test("the timezone strip groups by offset and filters the grid", async () => {
    const user = await renderApp(team());
    const strip = screen.getByRole("group", { name: "Filter people by UTC offset" });
    const cells = within(strip).getAllByRole("button");
    expect(cells.map((c) => c.textContent?.split(/\d/)[0])).toEqual(["UTC−", "UTC−", "UTC−"]);
    const eastern = within(strip).getByRole("button", { name: /UTC−4/ });
    expect(eastern).toHaveTextContent("2 people · Lena, Maya");

    await user.click(eastern);
    expect(eastern).toHaveAttribute("aria-pressed", "true");
    expect(within(screen.getByRole("list", { name: "People" })).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("4 people · 2 shown")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Showing UTC−4 only" }));
    expect(within(screen.getByRole("list", { name: "People" })).getAllByRole("listitem")).toHaveLength(4);
  });

  test("search matches names and cities, and says when nothing matches", async () => {
    const user = await renderApp(team());
    await user.type(screen.getByRole("searchbox", { name: "Search people" }), "chicago");
    expect(within(screen.getByRole("list", { name: "People" })).getAllByRole("listitem")).toHaveLength(1);
    await user.type(screen.getByRole("searchbox", { name: "Search people" }), "zzz");
    expect(screen.getByText("No one matches “chicagozzz”")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear search and filters" }));
    expect(within(screen.getByRole("list", { name: "People" })).getAllByRole("listitem")).toHaveLength(4);
  });

  test("expand shows the details, and edit warns when the zip changes", async () => {
    const user = await renderApp(team());
    await user.click(identity("Lena Hoffmann"));
    const lena = card("Lena Hoffmann");
    expect(lena).toHaveAttribute("data-state", "expanded");
    expect(within(lena).getByText("02108")).toBeInTheDocument();
    // People can't read lat/lon, so the card doesn't show them (the map uses them).
    expect(within(lena).queryByText(/42\.3576/)).not.toBeInTheDocument();
    expect(within(lena).getByText("Location updated Oct 19")).toBeInTheDocument();

    await user.click(within(lena).getByRole("button", { name: "Edit" }));
    expect(lena).toHaveAttribute("data-state", "editing");
    const zip = within(lena).getByLabelText("Zip code");
    expect(within(lena).queryByText(/will update when you save/)).not.toBeInTheDocument();

    await user.clear(zip);
    await user.type(zip, "80202");
    expect(within(lena).getByText(/Location and UTC offset will update when you save\./)).toBeInTheDocument();
    await within(lena).findByText(/Looks like Denver · UTC−6\./);

    await user.click(within(lena).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(card("Lena Hoffmann")).toHaveAttribute("data-state", "expanded"));
    expect(calls.find((c) => c.method === "PATCH")?.body).toEqual({ zip: "80202" });
    expect(within(card("Lena Hoffmann")).getAllByText("Denver · UTC−6").length).toBeGreaterThan(0);
  });

  test("renaming only sends the name", async () => {
    const user = await renderApp(team());
    await user.click(within(card("Maya Okafor")).getByRole("button", { name: "More actions for Maya Okafor" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit details" }));
    const name = within(card("Maya Okafor")).getByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Maya O.");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByRole("button", { name: /^Maya O\./ });
    expect(calls.find((c) => c.method === "PATCH")?.body).toEqual({ name: "Maya O." });
  });

  test("remove hides the card, undo brings it back without deleting", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderApp(team());
    await user.click(screen.getByRole("button", { name: "More actions for Priya Raman" }));
    await user.click(screen.getByRole("menuitem", { name: "Remove" }));
    expect(screen.queryByRole("button", { name: /^Priya Raman/ })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Priya Raman was removed.");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(identity("Priya Raman")).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(UNDO_MS + 100));
    expect(calls.filter((c) => c.method === "DELETE")).toHaveLength(0);
  });

  test("remove sends the delete once the undo window closes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderApp(team());
    await user.click(screen.getByRole("button", { name: "More actions for Priya Raman" }));
    await user.click(screen.getByRole("menuitem", { name: "Remove" }));
    expect(calls.filter((c) => c.method === "DELETE")).toHaveLength(0);
    await act(() => vi.advanceTimersByTimeAsync(UNDO_MS + 100));
    await waitFor(() => expect(calls.filter((c) => c.method === "DELETE")).toEqual([{ method: "DELETE", path: "/api/users/priya" }]));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(stored().map((u) => u.id)).not.toContain("priya");
  });

  test("a pending card can retry its lookup", async () => {
    const user = await renderApp([pending("Noor Haddad", "02108", "noor")]);
    expect(card("Noor Haddad")).toHaveAttribute("data-state", "pendingLocation");
    expect(screen.getByText("02108 · location pending")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try now" }));
    await screen.findByText("Boston · UTC−4");
    expect(card("Noor Haddad")).toHaveAttribute("data-state", "default");
  });

  test("a failed retry shows why", async () => {
    const user = await renderApp([pending("Noor Haddad", OUTAGE_ZIP, "noor")]);
    await user.click(screen.getByRole("button", { name: "Try now" }));
    expect(await screen.findByRole("status")).toHaveTextContent("We could not look up that zip right now.");
  });

  test("people with a zip problem are flagged, and Fix zip opens the edit form", async () => {
    const user = await renderApp([
      ...team(),
      pending("Noor Haddad", "99999", "noor", "invalidZip"),
      pending("Sam Castillo", CANT_LOCATE_ZIP, "sam", "cantLocate"),
    ]);
    expect(card("Noor Haddad")).toHaveAttribute("data-state", "invalidZip");
    expect(within(card("Noor Haddad")).getByRole("alert")).toHaveTextContent("We couldn’t find zip 99999. Fix it to see their local time.");
    expect(card("Sam Castillo")).toHaveAttribute("data-state", "cantLocate");
    expect(within(card("Sam Castillo")).getByText(`${CANT_LOCATE_ZIP} · can’t locate`)).toBeInTheDocument();

    await user.click(within(card("Noor Haddad")).getByRole("button", { name: "Fix zip" }));
    expect(card("Noor Haddad")).toHaveAttribute("data-state", "editing");
    expect(within(card("Noor Haddad")).getByLabelText("Zip code")).toHaveValue("99999");
  });

  test("the attention count filters the grid to flagged people", async () => {
    const user = await renderApp([...team(), pending("Noor Haddad", "99999", "noor", "invalidZip"), pending("Jo Park", OUTAGE_ZIP, "jo")]);
    const chip = screen.getByRole("button", { name: "1 person needs attention" });
    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(within(screen.getByRole("list", { name: "People" })).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("6 people · 1 shown")).toBeInTheDocument();
    await user.click(chip);
    expect(within(screen.getByRole("list", { name: "People" })).getAllByRole("listitem")).toHaveLength(6);
  });

  test("fixing an invalid zip clears the flag", async () => {
    const user = await renderApp([...team(), pending("Noor Haddad", "99999", "noor", "invalidZip")]);
    await user.click(within(card("Noor Haddad")).getByRole("button", { name: "Fix zip" }));
    const zip = within(card("Noor Haddad")).getByLabelText("Zip code");
    await user.clear(zip);
    await user.type(zip, "02108");
    await user.click(within(card("Noor Haddad")).getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(card("Noor Haddad")).toHaveAttribute("data-state", "expanded"));
    expect(screen.queryByRole("button", { name: /needs attention/ })).not.toBeInTheDocument();
  });

  test("the edit form refuses a zip that isn't real without calling the api", async () => {
    const user = await renderApp(team());
    await user.click(within(card("Lena Hoffmann")).getByRole("button", { name: "More actions for Lena Hoffmann" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit details" }));
    const zip = within(card("Lena Hoffmann")).getByLabelText("Zip code");
    await user.clear(zip);
    await user.type(zip, "99999");
    await user.click(within(card("Lena Hoffmann")).getByRole("button", { name: "Save changes" }));
    expect(within(card("Lena Hoffmann")).getByRole("alert")).toHaveTextContent("We couldn't find 99999. Check the zip and try again.");
    expect(calls.filter((c) => c.method === "PATCH")).toHaveLength(0);
  });

  test("clicking anywhere on a collapsed card opens it", async () => {
    const user = await renderApp(team());
    await user.click(within(card("Lena Hoffmann")).getByRole("img", { name: / in Boston$/ }));
    expect(card("Lena Hoffmann")).toHaveAttribute("data-state", "expanded");
    // Clicking the expanded card's details doesn't close it again.
    await user.click(within(card("Lena Hoffmann")).getByText("Zip"));
    expect(card("Lena Hoffmann")).toHaveAttribute("data-state", "expanded");
  });

  test("clicking outside the expanded card collapses it, and another card takes over", async () => {
    const user = await renderApp(team());
    await user.click(identity("Lena Hoffmann"));
    await user.click(screen.getByRole("heading", { name: "People" }));
    expect(card("Lena Hoffmann")).toHaveAttribute("data-state", "default");

    await user.click(identity("Lena Hoffmann"));
    await user.click(within(card("Maya Okafor")).getByText("New York · UTC−4"));
    expect(card("Lena Hoffmann")).toHaveAttribute("data-state", "default");
    expect(card("Maya Okafor")).toHaveAttribute("data-state", "expanded");
  });

  test("a card being edited stays open when you click outside it", async () => {
    const user = await renderApp(team());
    await user.click(identity("Lena Hoffmann"));
    await user.click(within(card("Lena Hoffmann")).getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("heading", { name: "People" }));
    expect(card("Lena Hoffmann")).toHaveAttribute("data-state", "editing");
  });

  test("the actions menu closes when you click away, including on another card", async () => {
    const user = await renderApp(team());
    await user.click(screen.getByRole("button", { name: "More actions for Lena Hoffmann" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.click(within(card("Maya Okafor")).getByText("New York · UTC−4"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  test("the theme toggle switches data-theme and remembers it", async () => {
    const user = await renderApp(team());
    expect(document.documentElement.dataset.theme).toBe("light");
    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toHaveAttribute("aria-pressed", "true");
  });

  test("the map shows a pin per located person, and a pin opens their card", async () => {
    const user = await renderApp([...team(), pending("Noor Haddad", "99999", "noor")]);
    await user.click(screen.getByRole("button", { name: "Map" }));
    const map = screen.getByRole("region", { name: "Map of people" });
    const pins = within(map).getAllByRole("button");
    expect(pins).toHaveLength(4);
    expect(within(map).getByText("Press a pin to open their card")).toBeInTheDocument();

    await user.click(within(map).getByRole("button", { name: /^Priya Raman, Chicago UTC−5, local time/ }));
    expect(card("Priya Raman")).toHaveAttribute("data-state", "expanded");
    expect(within(map).getByRole("button", { name: /^Priya Raman/ })).toHaveAttribute("aria-pressed", "true");
    expect(within(map).getByText("Showing Priya Raman below")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "People" })).toBeInTheDocument();
  });

  test("filtering dims the pins that don't match", async () => {
    const user = await renderApp(team());
    await user.click(screen.getByRole("button", { name: "Map" }));
    await user.click(within(screen.getByRole("group", { name: "Filter people by UTC offset" })).getByRole("button", { name: /UTC−4/ }));
    const map = screen.getByRole("region", { name: "Map of people" });
    expect(within(map).getByRole("button", { name: /^Lena Hoffmann/ })).not.toHaveAttribute("data-dimmed");
    expect(within(map).getByRole("button", { name: /^Priya Raman/ })).toHaveAttribute("data-dimmed", "true");
  });

  test("while adding, the map previews where the new person lands", async () => {
    const user = await renderApp(team());
    await user.click(screen.getByRole("button", { name: "Map" }));
    await user.click(within(screen.getByRole("banner")).getByRole("button", { name: "Add a person" }));
    await user.type(screen.getByLabelText("Zip code"), "80202");
    expect(await screen.findByTestId("preview-pin")).toHaveTextContent("Denver · UTC−6");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByTestId("preview-pin")).not.toBeInTheDocument();
  });
});

describe("List view", () => {
  // A viewer on Pacific time (UTC−7), so the Relative column reads the same anywhere.
  beforeEach(() => { vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(420); });
  afterEach(() => vi.restoreAllMocks());

  const table = () => screen.getByRole("table", { name: "People" });
  const rows = () => within(table()).getAllByRole("row").slice(1);
  const row = (name: string) => within(table()).getByRole("rowheader", { name: new RegExp(`^${name}`) }).closest("tr")!;
  const names = () => rows().map((r) => r.querySelector(".name")?.textContent);
  const showList = (user: Awaited<ReturnType<typeof renderApp>>) =>
    user.click(within(screen.getByRole("group", { name: "View" })).getByRole("button", { name: "List" }));

  test("the view toggle offers grid, list and map, in that order", async () => {
    await renderApp(team());
    const options = within(screen.getByRole("group", { name: "View" })).getAllByRole("button");
    expect(options.map((b) => b.textContent)).toEqual(["Grid", "List", "Map"]);
    expect(options[0]).toHaveAttribute("aria-pressed", "true");
  });

  test("switching to List shows a table with a row per person instead of the cards", async () => {
    const user = await renderApp(team());
    await showList(user);
    expect(within(screen.getByRole("group", { name: "View" })).getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("list", { name: "People" })).not.toBeInTheDocument();
    expect(within(table()).getAllByRole("columnheader").map((th) => th.textContent)).toEqual(["Person", "Local time", "Relative", "Zip", "Actions"]);
    expect(names()).toEqual(["Daniel Reyes", "Lena Hoffmann", "Maya Okafor", "Priya Raman"]);
    const lena = row("Lena Hoffmann");
    expect(within(lena).getByText("3h ahead of you")).toBeInTheDocument();
    expect(within(lena).getByText("02108")).toBeInTheDocument();
    expect(within(lena).getByText(/^\d{1,2}:\d{2} (AM|PM)$/)).toBeInTheDocument();
    expect(within(row("Daniel Reyes")).getByText("Same time as you")).toBeInTheDocument();
    expect(within(row("Priya Raman")).getByText("2h ahead of you")).toBeInTheDocument();
  });

  test("search, the zone filter and the attention filter all apply to the list", async () => {
    const user = await renderApp([...team(), pending("Noor Haddad", NOT_A_ZIP, "noor", "invalidZip")]);
    await showList(user);
    expect(rows()).toHaveLength(5);

    await user.type(screen.getByRole("searchbox", { name: "Search people" }), "chicago");
    expect(names()).toEqual(["Priya Raman"]);
    await user.clear(screen.getByRole("searchbox", { name: "Search people" }));

    await user.click(within(screen.getByRole("group", { name: "Filter people by UTC offset" })).getByRole("button", { name: /UTC−4/ }));
    expect(names()).toEqual(["Lena Hoffmann", "Maya Okafor"]);
    await user.click(screen.getByRole("button", { name: "Showing UTC−4 only" }));

    await user.click(screen.getByRole("button", { name: "1 person needs attention" }));
    expect(names()).toEqual(["Noor Haddad"]);
  });

  test("people without a location show their status instead of a time", async () => {
    const user = await renderApp([
      located("Lena Hoffmann", "02108", "lena"),
      pending("Jo Park", OUTAGE_ZIP, "jo"),
      pending("Noor Haddad", NOT_A_ZIP, "noor", "invalidZip"),
      pending("Sam Castillo", CANT_LOCATE_ZIP, "sam", "cantLocate"),
    ]);
    await showList(user);
    expect(within(row("Jo Park")).getByText("Location pending")).toBeInTheDocument();
    expect(within(row("Jo Park")).getByText("Unknown")).toBeInTheDocument();
    expect(row("Jo Park")).toHaveAttribute("data-state", "default");
    expect(within(row("Noor Haddad")).getByText("Zip not found")).toBeInTheDocument();
    expect(row("Noor Haddad")).toHaveAttribute("data-state", "flagged");
    expect(within(row("Sam Castillo")).getByText("Can’t locate")).toBeInTheDocument();
    expect(row("Sam Castillo")).toHaveAttribute("data-state", "flagged");
    expect(row("Lena Hoffmann")).toHaveAttribute("data-state", "default");
  });

  test("Edit goes back to the grid with that card open for editing", async () => {
    const user = await renderApp(team());
    await showList(user);
    await user.click(screen.getByRole("button", { name: "Edit Maya Okafor" }));
    expect(screen.queryByRole("table", { name: "People" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("group", { name: "View" })).getByRole("button", { name: "Grid" })).toHaveAttribute("aria-pressed", "true");
    expect(card("Maya Okafor")).toHaveAttribute("data-state", "editing");
    expect(within(card("Maya Okafor")).getByLabelText("Name")).toHaveFocus();
  });

  test("Remove takes the row out with the same undo toast as the grid", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await renderApp(team());
    await showList(user);
    await user.click(screen.getByRole("button", { name: "Remove Priya Raman" }));
    expect(within(table()).queryByRole("rowheader", { name: /^Priya Raman/ })).not.toBeInTheDocument();
    expect(rows()).toHaveLength(3);
    expect(screen.getByRole("status")).toHaveTextContent("Priya Raman was removed.");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(row("Priya Raman")).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(UNDO_MS + 100));
    expect(calls.filter((c) => c.method === "DELETE")).toHaveLength(0);
  });
});
