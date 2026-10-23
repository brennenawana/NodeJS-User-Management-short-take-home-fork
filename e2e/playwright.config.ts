import { defineConfig, devices } from "@playwright/test";

// Runs the real API (fixture provider, in-memory storage) and a production build of the client.
// No API key needed, and every run starts with an empty list.
const API_PORT = 8091;
const WEB_PORT = 5191;

export default defineConfig({
  testDir: "tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "yarn workspace user-management-server start",
      url: `http://localhost:${API_PORT}/`,
      env: { API_PORT: String(API_PORT), LOCATION_PROVIDER: "fixture", STORAGE: "memory" },
      reuseExistingServer: false,
    },
    {
      command: `yarn workspace user-management-client build && yarn workspace user-management-client preview --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PORT: String(API_PORT) },
      reuseExistingServer: false,
    },
  ],
});
