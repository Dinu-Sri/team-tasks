import { expect, test } from "@playwright/test";

test.describe("task management", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("can see task list and add button", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill('input[name="email"]', "1@1.com");
    await page.fill('input[name="password"]', "12345678");
    await page.locator('button:has-text("Log in")').click();
    await page.waitForURL("**/", { timeout: 10000 });

    await expect(page.locator('body')).toContainText("My tasks");
    await expect(page.locator('button:has-text("Add")')).toBeVisible();
  });

  test("team owner sees team management page", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill('input[name="email"]', "1@1.com");
    await page.fill('input[name="password"]', "12345678");
    await page.locator('button:has-text("Log in")').click();
    await page.waitForURL("**/", { timeout: 10000 });

    await page.goto("/dashboard/teams", { waitUntil: "domcontentloaded" });

    await expect(page.locator('h1')).toContainText("Teams");
    await expect(page.locator('body')).toContainText("People");
    await expect(page.locator('body')).toContainText("Assign work");
  });

  test("dashboard sidebar shows all navigation links", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.fill('input[name="email"]', "1@1.com");
    await page.fill('input[name="password"]', "12345678");
    await page.locator('button:has-text("Log in")').click();
    await page.waitForURL("**/", { timeout: 10000 });

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    const nav = page.locator('nav[aria-label="Dashboard"]');
    await expect(nav).toBeVisible();
    await expect(nav.locator('a:has-text("Teams")')).toBeVisible();
    await expect(nav.locator('a:has-text("Progress")')).toBeVisible();
    await expect(nav.locator('a:has-text("Activity")')).toBeVisible();
    await expect(nav.locator('a:has-text("Archive")')).toBeVisible();
    await expect(nav.locator('a:has-text("Settings")')).toBeVisible();
  });
});
