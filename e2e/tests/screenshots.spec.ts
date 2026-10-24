import { expect, test, type Page } from "@playwright/test";
import { removeEveryone } from "./reset";

// Regenerates the README images: yarn screenshots. Skipped in normal runs.
// The clock is frozen at the Figma reference time so the shots match the design.
test.skip(!process.env.SCREENSHOTS, "set SCREENSHOTS=1 to regenerate docs/*.png");

const TEAM = [
  ["Maya Okafor", "10001"], ["Daniel Reyes", "94103"], ["Priya Raman", "60601"], ["Tomás Lindqvist", "98101"],
  ["Grace Whitfield", "80202"], ["Jonah Abernathy", "33131"], ["Lena Hoffmann", "02108"], ["Sam Castillo", "78701"],
];
const FIGMA_NOW = new Date("2026-10-19T16:50:00Z");
const out = (name: string) => new URL(`../../docs/${name}`, import.meta.url).pathname;

test.beforeEach(async ({ request }) => {
  await removeEveryone(request);
  for (const [name, zip] of TEAM) await request.post("/api/users", { data: { name, zip } });
});

async function open(page: Page, theme: "light" | "dark") {
  await page.clock.setFixedTime(FIGMA_NOW);
  await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("list", { name: "People" }).getByRole("listitem")).toHaveCount(TEAM.length);
  await page.evaluate(() => document.fonts.ready);
}

// Keep the pointer off the cards so no hover lift shows in a shot.
const park = (page: Page) => page.mouse.move(0, 0);

test("desktop, light", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "light");
  await page.getByRole("list", { name: "People" }).getByRole("button", { name: /^Priya Raman/ }).click();
  await park(page);
  await page.screenshot({ path: out("screenshot-desktop.png") });
});

test("map, dark", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "dark");
  await page.getByRole("button", { name: "Map" }).click();
  await page.getByRole("region", { name: "Map of people" }).getByRole("button", { name: /^Lena Hoffmann/ }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await park(page);
  await page.screenshot({ path: out("screenshot-map-dark.png") });
});

test("phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, "light");
  await page.screenshot({ path: out("screenshot-phone.png") });
});
