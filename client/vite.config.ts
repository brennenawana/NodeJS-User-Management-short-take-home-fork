import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import product from "../product.json";

// Puts the product name into index.html, so the tab title has one source.
function productName(): Plugin {
  return {
    name: "product-name",
    transformIndexHtml: (html) => html.replaceAll("%PRODUCT_NAME%", product.name),
  };
}

export default defineConfig({
  plugins: [react(), productName()],
  server: {
    port: 5173,
    proxy: { "/api": `http://localhost:${process.env.API_PORT ?? 8080}` },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
    css: { modules: { classNameStrategy: "non-scoped" } },
  },
});
