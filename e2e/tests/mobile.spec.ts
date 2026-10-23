import { expect, test } from "@playwright/test";
import { removeEveryone } from "./reset";

test.beforeEach(({ request }) => removeEveryone(request));

// Figma: Screens / Mobile / Grid (390×844)
test.use({ viewport: { width: 390, height: 844 } });

test("phone layout: floating add, strip first, one column", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");
  await expect(header.getByRole("button", { name: "Add a person" })).toBeHidden();

  const floating = page.getByRole("button", { name: "Add a person" });
  await expect(floating).toBeVisible();
  await floating.click();
  await page.getByLabel("Name").fill("Sam Castillo");
  await page.getByLabel("Zip code").fill("78701");
  await expect(page.getByText("Austin · UTC−5").first()).toBeVisible();
  await page.getByRole("button", { name: "Add person" }).click();
  await expect(floating).toBeVisible();

  // The strip sits above the title and its cells keep their 168px width.
  const strip = page.getByRole("region", { name: "Time zones" });
  const title = page.getByRole("heading", { name: "People" });
  expect((await strip.boundingBox())!.y).toBeLessThan((await title.boundingBox())!.y);
  expect(Math.round((await strip.getByRole("button").first().boundingBox())!.width)).toBe(168);

  // Cards fill the width in a single column.
  const card = page.getByRole("listitem").filter({ hasText: "Sam Castillo" });
  expect(Math.round((await card.boundingBox())!.width)).toBe(390 - 32);
});

test.describe("small phone (320px)", () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test("header fits without sideways scrolling", async ({ page }) => {
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
    // The view toggle drops to icons but keeps its names for assistive tech.
    const grid = page.getByRole("group", { name: "View" }).getByRole("button", { name: "Grid" });
    await expect(grid).toBeVisible();
    expect(Math.round((await grid.boundingBox())!.width)).toBe(44);
    await expect(page.getByRole("banner").getByRole("button", { name: "Add a person" })).toBeHidden();
  });
});
