import { test, expect } from "@playwright/test";

/**
 * Onboarding QA — verifies the Onborda onboarding tour renders correctly.
 * Requires a valid user account.
 */
const USER_EMAIL = process.env.PLAYWRIGHT_USER_EMAIL ?? "test@example.com";
const USER_PASSWORD = process.env.PLAYWRIGHT_USER_PASSWORD ?? "test-password";

test.describe("Onboarding Tour", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill("input[name=email]", USER_EMAIL);
    await page.fill("input[name=password]", USER_PASSWORD);
    await page.click("button[type=submit]");
    await expect(page).toHaveURL("/", { timeout: 15000 });
  });

  test("personal tour has onborda overlay on home page", async ({ page }) => {
    // The onborda overlay should appear with the first step
    // Look for the onborda card container
    await expect(page.locator("text=Welcome to Tasks")).toBeVisible({ timeout: 10000 });
  });

  test("personal tour can navigate through steps", async ({ page }) => {
    // First step — Welcome
    await expect(page.locator("text=Welcome to Tasks")).toBeVisible({ timeout: 10000 });

    // Click "Next" to go to step 2
    await page.click("text=Next");
    await expect(page.locator("text=Add a Task")).toBeVisible({ timeout: 5000 });

    // Click "Next" to go to step 3
    await page.click("text=Next");
    await expect(page.locator("text=Your Task List")).toBeVisible({ timeout: 5000 });

    // Click "Next" to go to step 4
    await page.click("text=Next");
    await expect(page.locator("text=Notifications & More")).toBeVisible({ timeout: 5000 });

    // Click "Done" to finish
    await page.click("text=Done");
    // Onborda should dismiss
  });

  test("team tour appears on dashboard", async ({ page }) => {
    await page.goto("/dashboard/teams");

    // Team tour first step should show
    await expect(page.locator("text=Teams Dashboard")).toBeVisible({ timeout: 10000 });
  });

  test("team tour can be completed", async ({ page }) => {
    await page.goto("/dashboard/teams");

    await expect(page.locator("text=Teams Dashboard")).toBeVisible({ timeout: 10000 });
    await page.click("text=Next");
    await expect(page.locator("text=Team Board")).toBeVisible({ timeout: 5000 });
    await page.click("text=Next");
    await expect(page.locator("text=Analytics")).toBeVisible({ timeout: 5000 });
    await page.click("text=Next");
    await expect(page.locator("text=Features")).toBeVisible({ timeout: 5000 });
    await page.click("text=Next");
    await expect(page.locator("text=You're All Set")).toBeVisible({ timeout: 5000 });
    await page.click("text=Done");
  });
});
