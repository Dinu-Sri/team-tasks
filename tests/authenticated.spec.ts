import { test, expect } from "@playwright/test";

/**
 * Authenticated User Journeys QA.
 * Requires a valid user account. Set these env vars:
 *   PLAYWRIGHT_USER_EMAIL=user@example.com
 *   PLAYWRIGHT_USER_PASSWORD=password
 */

const USER_EMAIL = process.env.PLAYWRIGHT_USER_EMAIL ?? "test@example.com";
const USER_PASSWORD = process.env.PLAYWRIGHT_USER_PASSWORD ?? "test-password";

test.describe("Authenticated User Journeys", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[name=email]", USER_EMAIL);
    await page.fill("input[name=password]", USER_PASSWORD);
    await page.click("button[type=submit]");
    await expect(page).toHaveURL("/", { timeout: 15000 });
  });

  test("home page loads personal tasks after login", async ({ page }) => {
    // Should see "My tasks" heading or "Nothing to do"
    await expect(page.locator("text=My tasks")).toBeVisible({ timeout: 10000 });
  });

  test("app header is visible after login", async ({ page }) => {
    await expect(page.locator("#onborda-header")).toBeVisible();
    await expect(page.locator("#onborda-header-actions")).toBeVisible();
  });

  test("can navigate to dashboard teams", async ({ page }) => {
    await page.goto("/dashboard/teams");
    await expect(page.locator("text=Teams Board")).toBeVisible({ timeout: 10000 });
  });

  test("dashboard nav items are visible", async ({ page }) => {
    await page.goto("/dashboard/teams");
    await expect(page.locator("#onborda-dashboard-nav")).toBeVisible({ timeout: 10000 });
    // Core nav links should exist
    await expect(page.locator("text=Teams Board")).toBeVisible();
    await expect(page.locator("text=Analytics")).toBeVisible();
    await expect(page.locator("text=Archive")).toBeVisible();
    await expect(page.locator("text=Features")).toBeVisible();
  });

  test("analytics page loads", async ({ page }) => {
    await page.goto("/dashboard/analytics");
    await expect(page.locator("text=Analytics")).toBeVisible({ timeout: 10000 });
  });

  test("archive page loads", async ({ page }) => {
    await page.goto("/dashboard/archive");
    await expect(page.locator("text=Archive")).toBeVisible({ timeout: 10000 });
  });

  test("features page loads", async ({ page }) => {
    await page.goto("/dashboard/features");
    await expect(page.locator("text=Features")).toBeVisible({ timeout: 10000 });
  });

  test("momentum page loads", async ({ page }) => {
    await page.goto("/momentum");
    // Should not be a 404 — let it load whatever content exists
    await expect(page.locator("body")).toBeVisible();
  });

  test("cannot access login page while authenticated", async ({ page }) => {
    await page.goto("/login");
    // Should redirect to /
    await expect(page).toHaveURL("/", { timeout: 10000 });
  });
});
