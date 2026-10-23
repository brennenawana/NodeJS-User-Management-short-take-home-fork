import type { Preview } from "@storybook/react-vite";
import { setupWorker } from "msw/browser";
import { handlers } from "../src/test/fake-api";
import "../src/styles.css";

// Stories that look zips up talk to the same fake API the tests use.
const worker = setupWorker(...handlers);
const ready = worker.start({ onUnhandledRequest: "bypass", quiet: true }).then(async () => {
  // On a first visit the worker activates after the page loads; wait until it controls this page.
  if (navigator.serviceWorker.controller) return;
  await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
});

const preview: Preview = {
  loaders: [async () => {
    await ready;
    return {};
  }],
  globalTypes: {
    theme: {
      description: "Color mode from the Figma Color collection",
      toolbar: { title: "Theme", icon: "mirror", items: ["light", "dark"], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (Story, { globals }) => {
      document.documentElement.dataset.theme = globals.theme;
      return <div style={{ padding: "var(--space-24)", background: "var(--color-bg)", minHeight: "100vh" }}><Story /></div>;
    },
  ],
  parameters: { layout: "fullscreen", controls: { expanded: true } },
};

export default preview;
