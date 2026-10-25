import { composeStories } from "@storybook/react-vite";
import axe from "axe-core";
import { cleanup } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { resetApi } from "./test/server";

// Every story renders, its play function (if any) passes against the msw/node fake API,
// and axe finds no accessibility violations in it. jsdom has no layout, so colour
// contrast is left to the Playwright run (e2e/tests/a11y.spec.ts).
type StoryModule = Parameters<typeof composeStories>[0];
const modules = import.meta.glob<StoryModule>("./components/*.stories.tsx", { eager: true });

for (const [path, mod] of Object.entries(modules)) {
  describe(path.replace("./components/", ""), () => {
    const stories = composeStories(mod) as Record<string, { run: (ctx: { canvasElement: HTMLElement }) => Promise<void> }>;
    for (const [name, Story] of Object.entries(stories)) {
      test(name, async () => {
        resetApi();
        const host = document.createElement("div");
        document.body.appendChild(host);
        await Story.run({ canvasElement: host });
        expect(host.childElementCount).toBeGreaterThan(0);
        const { violations } = await axe.run(host, {
          resultTypes: ["violations"],
          // A lone component isn't a page: landmark and contrast rules belong to the app-level run.
          rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
        });
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
        cleanup();
        host.remove();
      });
    }
  });
}
