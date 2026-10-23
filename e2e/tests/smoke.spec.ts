import { expect, test } from "@playwright/test";
import product from "../../product.json" with { type: "json" };
import { removeEveryone } from "./reset";

test.beforeEach(({ request }) => removeEveryone(request));

const zone = (page: import("@playwright/test").Page, label: RegExp) =>
  page.getByRole("group", { name: "Filter people by UTC offset" }).getByRole("button", { name: label });

test("add, edit and remove a person", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(product.name);
  await expect(page.getByRole("heading", { name: "No one here yet" })).toBeVisible();

  // Add: the zip resolves through the API and the fixture provider.
  await page.getByRole("button", { name: "Add your first person" }).click();
  await page.getByLabel("Name").fill("Lena Hoffmann");
  await page.getByLabel("Zip code").fill("02108");
  await expect(page.getByText("Boston · UTC−4").first()).toBeVisible();
  await page.getByRole("button", { name: "Add person" }).click();

  const card = page.getByRole("listitem").filter({ hasText: "Lena Hoffmann" });
  await expect(card).toHaveAttribute("data-state", "expanded");
  await expect(card.getByText("02108", { exact: true })).toBeVisible();
  await expect(zone(page, /UTC−4/)).toContainText("1 person · Lena");

  // Edit: a new zip moves her and the strip follows.
  await card.getByRole("button", { name: "Edit" }).click();
  await card.getByLabel("Zip code").fill("80202");
  await expect(card.getByText(/Looks like Denver · UTC−6\./)).toBeVisible();
  await card.getByRole("button", { name: "Save changes" }).click();
  await expect(card).toHaveAttribute("data-state", "expanded");
  await expect(card.getByText("Denver · UTC−6", { exact: true })).toBeVisible();
  await expect(zone(page, /UTC−6/)).toContainText("1 person · Lena");

  // The change is on the server, not just in the page.
  await page.reload();
  await expect(page.getByText("Denver · UTC−6", { exact: true })).toBeVisible();

  // Remove, undo, then remove for good.
  const actions = page.getByRole("button", { name: "More actions for Lena Hoffmann" });
  await actions.click();
  await page.getByRole("menuitem", { name: "Remove" }).click();
  await expect(page.getByRole("status")).toContainText("Lena Hoffmann was removed.");
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(actions).toBeVisible();

  await actions.click();
  await page.getByRole("menuitem", { name: "Remove" }).click();
  await page.getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByRole("heading", { name: "No one here yet" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "No one here yet" })).toBeVisible();
});

test("an unknown zip can still be saved as pending", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add a person" }).click();
  await page.getByLabel("Name").fill("Noor Haddad");
  await page.getByLabel("Zip code").fill("99999");
  await expect(page.getByText("We could not find 99999.")).toBeVisible();
  await page.getByRole("button", { name: "Save anyway" }).click();
  const card = page.getByRole("listitem").filter({ hasText: "Noor Haddad" });
  await expect(card.getByText("Location pending. We will retry the lookup.")).toBeVisible();
  await expect(card.getByText("99999 · location pending").first()).toBeVisible();
});
