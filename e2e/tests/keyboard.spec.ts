import { expect, test, type Page } from "@playwright/test";
import { removeEveryone } from "./reset";

// The main flow with the keyboard alone: no clicks anywhere in this file.

test.beforeEach(async ({ request }) => {
  await removeEveryone(request);
  await request.post("/api/users", { data: { name: "Grace Whitfield", zip: "80202" } });
});

/** Tabs forward until the focused element has this accessible name. */
async function tabTo(page: Page, name: RegExp, max = 25) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el?.getAttribute("aria-label") ?? el?.textContent?.trim() ?? "";
    });
    if (name.test(label)) return;
  }
  throw new Error(`never reached ${name} with Tab`);
}

test("add, open, edit and remove someone with the keyboard", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("list", { name: "People" })).toBeVisible();

  // Add: Enter opens the sheet with the name field focused, Enter in the form saves.
  await tabTo(page, /^Add a person$/);
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Name")).toBeFocused();
  await page.keyboard.type("Lena Hoffmann");
  await page.keyboard.press("Tab");
  await page.keyboard.type("02108");
  await expect(page.getByText("Boston · UTC−4").first()).toBeVisible();
  await page.keyboard.press("Enter");

  // Focus lands on the new card instead of falling back to the page.
  const lena = page.getByRole("list", { name: "People" }).getByRole("button", { name: /^Lena Hoffmann/ });
  await expect(lena).toBeFocused();

  // The menu: Enter opens it with focus inside, Escape closes it and returns focus.
  await tabTo(page, /^More actions for Lena Hoffmann$/);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Edit details" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(page.getByRole("button", { name: "More actions for Lena Hoffmann" })).toBeFocused();

  // Edit opens with the name focused; Enter saves.
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Name")).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.type(" Jr");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("list", { name: "People" }).getByRole("button", { name: /^Lena Hoffmann Jr/ })).toBeVisible();

  // Remove through the menu, then Undo is reachable by Tab.
  await tabTo(page, /^More actions for Lena Hoffmann Jr$/);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("menuitem", { name: "Remove" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Lena Hoffmann Jr was removed.");
  await tabTo(page, /^Undo$/);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("list", { name: "People" }).getByRole("button", { name: /^Lena Hoffmann Jr/ })).toBeVisible();
});

test("Escape closes the add sheet and returns focus to the Add button", async ({ page }) => {
  await page.goto("/");
  await tabTo(page, /^Add a person$/);
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Name")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Add a person" })).toBeHidden();
  await expect(page.getByRole("banner").getByRole("button", { name: "Add a person" })).toBeFocused();
});

test("the timezone strip and theme toggle work from the keyboard", async ({ page }) => {
  await page.goto("/");
  await tabTo(page, /^Switch to (dark|light) theme$/);
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).not.toBe(before);

  await tabTo(page, /^UTC−6/);
  await page.keyboard.press("Space");
  await expect(page.getByRole("button", { name: "Showing UTC−6 only" })).toBeVisible();
});
