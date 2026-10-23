import { expect, test, type Page } from "@playwright/test";
import { STORYBOOK_URL } from "../playwright.config";

// Every Storybook story, at a small phone and a desktop width: nothing may spill
// out of its box. Scroll containers and ellipsis truncation are allowed; those
// are deliberate. jsdom has no layout, so this lives here rather than in Vitest.

type Entry = { id: string; type: string; title: string; name: string };

const WIDTHS = [320, 768, 1280];

async function storyIds(page: Page) {
  const index = await (await page.request.get(`${STORYBOOK_URL}/index.json`)).json();
  return (Object.values(index.entries) as Entry[]).filter((e) => e.type === "story");
}

/**
 * Elements that poke out of an ancestor's box. Stops at scroll containers and
 * ellipsis truncation, and skips absolutely positioned pieces (map chips, menus,
 * visually hidden labels), which sit outside their anchor on purpose.
 */
function findOverflow() {
  const root = document.getElementById("storybook-root")!;
  const offenders: string[] = [];
  const label = (el: Element) => `${el.tagName.toLowerCase()}${el.classList.length ? "." + [...el.classList].join(".") : ""}`;
  const free = (el: Element) => ["absolute", "fixed"].includes(getComputedStyle(el).position);
  for (const el of root.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    let skip = false;
    for (let a = el as Element | null; a && a !== root; a = a.parentElement) if (free(a)) { skip = true; break; }
    if (skip) continue;
    for (let a = el.parentElement; a && a !== root; a = a.parentElement) {
      const style = getComputedStyle(a);
      if (["auto", "scroll", "hidden", "clip"].includes(style.overflowX) || style.textOverflow === "ellipsis") break;
      const box = a.getBoundingClientRect();
      if (r.right > box.right + 1 || r.left < box.left - 1) {
        offenders.push(`${label(el)} "${el.textContent?.trim().slice(0, 24)}" spills out of ${label(a)} by ${Math.round(Math.max(r.right - box.right, box.left - r.left))}px`);
        break;
      }
    }
  }
  if (document.documentElement.scrollWidth > window.innerWidth) offenders.push(`page is ${document.documentElement.scrollWidth}px wide in a ${window.innerWidth}px window`);
  return offenders;
}

for (const width of WIDTHS) {
  test(`no story overflows at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    const problems: string[] = [];
    for (const story of await storyIds(page)) {
      await page.goto(`${STORYBOOK_URL}/iframe.html?id=${story.id}&viewMode=story`);
      await page.locator("#storybook-root > *").first().waitFor();
      // Not networkidle: the LookingUp story's lookup never answers, on purpose.
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(600); // lookups resolve and entrance animations settle
      for (const o of await page.evaluate(findOverflow)) problems.push(`${story.title} / ${story.name}: ${o}`);
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });
}
