import { expect, test } from "@playwright/test";
import { removeEveryone } from "./reset";

test.beforeEach(({ request }) => removeEveryone(request));

test("the map pins people and opens their card", async ({ page, request }) => {
  for (const [name, zip] of [["Lena Hoffmann", "02108"], ["Grace Whitfield", "80202"]]) {
    await request.post("/api/users", { data: { name, zip } });
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Map" }).click();
  const map = page.getByRole("region", { name: "Map of people" });
  await expect(map.getByRole("button")).toHaveCount(2);

  // Boston sits east of Denver.
  const lena = map.getByRole("button", { name: /^Lena Hoffmann, Boston UTC−4/ });
  const grace = map.getByRole("button", { name: /^Grace Whitfield, Denver UTC−6/ });
  expect((await lena.boundingBox())!.x).toBeGreaterThan((await grace.boundingBox())!.x);

  await lena.click();
  await expect(page.getByRole("listitem").filter({ hasText: "Lena Hoffmann" })).toHaveAttribute("data-state", "expanded");
  await expect(map.getByText("Showing Lena Hoffmann below")).toBeVisible();
});
