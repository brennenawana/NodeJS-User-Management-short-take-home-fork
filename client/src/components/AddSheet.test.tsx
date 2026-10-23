import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AddSheet } from "./AddSheet";
import { located, pending, resetApi } from "../test/server";

const NOW = new Date("2026-10-19T16:50:00Z");

function setup() {
  resetApi();
  const onSave = vi.fn(async ({ name, zip }: { name: string; zip: string }) => (zip === "02108" ? located(name, "02108") : pending(name, zip)));
  const onClose = vi.fn();
  const user = userEvent.setup();
  render(<AddSheet now={NOW} onSave={onSave} onClose={onClose} />);
  const sheet = () => screen.getByRole("region", { name: "Add a person" });
  const hint = () => document.getElementById(screen.getByLabelText("Zip code").getAttribute("aria-describedby")!)!;
  const save = () => screen.getByRole("button", { name: /add person|save anyway/i });
  return { user, onSave, onClose, sheet, hint, save };
}

describe("AddSheet", () => {
  beforeEach(() => resetApi());

  test("starts empty with save disabled", () => {
    const { sheet, hint, save } = setup();
    expect(sheet()).toHaveAttribute("data-state", "empty");
    expect(hint()).toHaveTextContent("Enter a 5-digit US zip code.");
    expect(save()).toBeDisabled();
    expect(screen.getByText("Their name")).toBeInTheDocument();
  });

  test("a short zip says how many digits are missing", async () => {
    const { user, sheet, hint } = setup();
    await user.type(screen.getByLabelText("Zip code"), "021");
    expect(sheet()).toHaveAttribute("data-state", "invalidZip");
    expect(hint()).toHaveTextContent("Zip codes are 5 digits — 021 is two short.");
    expect(screen.getByLabelText("Zip code")).toHaveAttribute("aria-invalid", "true");
  });

  test("letters and dashes are called out", async () => {
    const { user, hint } = setup();
    await user.type(screen.getByLabelText("Zip code"), "02-1");
    expect(hint()).toHaveTextContent("Just the 5 digits, please — no letters or dashes.");
  });

  test("a complete zip looks up, then previews the card", async () => {
    const { user, sheet, hint, save, onSave } = setup();
    await user.type(screen.getByLabelText("Name"), "Lena Hoffmann");
    await user.type(screen.getByLabelText("Zip code"), "02108");
    expect(sheet()).toHaveAttribute("data-state", "lookingUp");
    expect(hint()).toHaveTextContent("Looking up 02108…");
    expect(save()).toBeDisabled();

    await waitFor(() => expect(sheet()).toHaveAttribute("data-state", "resolved"));
    expect(hint()).toHaveTextContent("Boston · UTC−4");
    expect(screen.getByText("12:50 PM")).toBeInTheDocument();
    expect(screen.getByText("Afternoon · Eastern")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Afternoon in Boston" })).toBeInTheDocument();

    await user.click(save());
    expect(onSave).toHaveBeenCalledWith({ name: "Lena Hoffmann", zip: "02108" });
  });

  test("an unknown zip can be saved anyway", async () => {
    const { user, sheet, hint, save, onSave } = setup();
    await user.type(screen.getByLabelText("Name"), "Noor Haddad");
    await user.type(screen.getByLabelText("Zip code"), "99999");
    await waitFor(() => expect(hint()).toHaveTextContent("We could not find 99999. Double-check it, or save anyway and we will retry."));
    expect(sheet()).toHaveAttribute("data-state", "invalidZip");
    expect(screen.getByText("99999 · location pending")).toBeInTheDocument();
    expect(save()).toHaveAccessibleName("Save anyway");
    await user.click(save());
    expect(onSave).toHaveBeenCalledWith({ name: "Noor Haddad", zip: "99999" });
  });

  test("a failed lookup explains and still allows saving", async () => {
    const { user, sheet, hint, save } = setup();
    await user.type(screen.getByLabelText("Name"), "Noor");
    await user.type(screen.getByLabelText("Zip code"), "00001");
    await waitFor(() => expect(sheet()).toHaveAttribute("data-state", "lookupFailed"));
    expect(hint()).toHaveTextContent("We could not look up 00001 right now. You can still save and we will retry.");
    expect(screen.getByText("We will keep retrying the lookup after you save.")).toBeInTheDocument();
    expect(save()).toBeEnabled();
  });

  test("needs a name before saving", async () => {
    const { user, sheet, save } = setup();
    await user.type(screen.getByLabelText("Zip code"), "02108");
    await waitFor(() => expect(sheet()).toHaveAttribute("data-state", "resolved"));
    expect(save()).toBeDisabled();
  });

  test("cancel and the close button both close", async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Close add form" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
