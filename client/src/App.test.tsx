import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import product from "../../product.json";
import { UNDO_MS } from "./hooks/useUsers";
import { renderApp } from "./test/render";
import { calls, located, pending, stored } from "./test/server";

const team = () => [
  located("Lena Hoffmann", "02108", "lena"),
  located("Maya Okafor", "10001", "maya"),
  located("Priya Raman", "60601", "priya"),
  located("Daniel Reyes", "94103", "daniel"),
];

const identity = (name: string) => screen.getByRole("button", { name: new RegExp(`^${name}`) });
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
    expect(within(lena).getByText("42.3576, -71.0684")).toBeInTheDocument();
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
    const user = await renderApp([pending("Noor Haddad", "00001", "noor")]);
    await user.click(screen.getByRole("button", { name: "Try now" }));
    expect(await screen.findByRole("status")).toHaveTextContent("We could not look up that zip right now.");
  });

  test("the theme toggle switches data-theme and remembers it", async () => {
    const user = await renderApp(team());
    expect(document.documentElement.dataset.theme).toBe("light");
    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toHaveAttribute("aria-pressed", "true");
  });

  test("the map toggle explains the map isn't here yet", async () => {
    const user = await renderApp(team());
    await user.click(screen.getByRole("button", { name: "Map" }));
    expect(screen.getByRole("note")).toHaveTextContent("The map view is on its way.");
    expect(screen.getByRole("list", { name: "People" })).toBeInTheDocument();
  });
});
