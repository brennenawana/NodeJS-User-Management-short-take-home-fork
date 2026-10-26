import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { removeEveryone } from "./reset";

// axe on the real app in a real browser, so colour contrast is checked too.
// Covers each screen in light and dark, including flagged cards and the add sheet.

test.beforeEach(async ({ request }) => {
  await removeEveryone(request);
  for (const [name, zip] of [["Lena Hoffmann", "02108"], ["Grace Whitfield", "80202"], ["Noor Haddad", "00501"]]) {
    await request.post("/api/users", { data: { name, zip } });
  }
});

async function open(page: Page, theme: "light" | "dark") {
  await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("list", { name: "People" }).getByRole("listitem")).toHaveCount(3);
}

async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 4).join(" | ")}`);
  expect(summary, summary.join("\n")).toEqual([]);
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} theme`, () => {
    test("grid with a flagged card and an expanded card", async ({ page }) => {
      await open(page, theme);
      await page.getByRole("list", { name: "People" }).getByRole("button", { name: /^Lena Hoffmann/ }).click();
      await expectNoViolations(page);
    });

    test("add sheet mid-lookup error", async ({ page }) => {
      await open(page, theme);
      await page.getByRole("banner").getByRole("button", { name: "Add a person" }).click();
      await page.getByLabel("Name").fill("Sam Castillo");
      await page.getByLabel("Zip code").fill("99999");
      await expectNoViolations(page);
    });

    test("list view with a flagged row", async ({ page }) => {
      await open(page, theme);
      await page.getByRole("button", { name: "List" }).click();
      await expect(page.getByRole("table", { name: "People" }).getByRole("row")).toHaveCount(4);
      await expectNoViolations(page);
    });

    test("map view with a pin selected", async ({ page }) => {
      await open(page, theme);
      await page.getByRole("button", { name: "Map" }).click();
      await page.getByRole("region", { name: "Map of people" }).getByRole("button", { name: /^Grace Whitfield/ }).click();
      await expectNoViolations(page);
    });
  });
}

test("phone layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "light");
  await expectNoViolations(page);
});
