import { composeStories } from "@storybook/react-vite";
import { cleanup } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { resetApi } from "./test/server";

// Every story renders, and its play function (if any) passes, against the msw/node fake API.
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
        cleanup();
        host.remove();
      });
    }
  });
}
