import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const useLocalServer = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: useLocalServer
    ? {
      command: "pnpm exec next dev --hostname 127.0.0.1 --port 4173",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: true,
      timeout: 120000,
    }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
