import { test, expect } from "@playwright/test";

/**
 * Public Pages QA — verifies landing page, login, signup, and 404 handling.
 * Run against a live deployment (or local dev) with:
 *   PLAYWRIGHT_BASE_URL=https://todo.clossyan.com npx playwright test tests/public.spec.ts
 */

test.describe("Public Pages", () => {
  test("landing page renders sign-in link", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Sign in")).toBeVisible();
  });

  test("login page renders form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[name=email]")).toBeVisible();
    await expect(page.locator("input[name=password]")).toBeVisible();
    await expect(page.locator("button[type=submit]")).toBeVisible();
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[name=email]", "nonexistent@example.com");
    await page.fill("input[name=password]", "wrong-password-123");
    await page.click("button[type=submit]");
    await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 10000 });
  });

  test("signup page renders form with name field", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator("input[name=name]")).toBeVisible();
    await expect(page.locator("input[name=email]")).toBeVisible();
    await expect(page.locator("input[name=password]")).toBeVisible();
    await expect(page.locator("input[name=confirmPassword]")).toBeVisible();
  });

  test("signup with mismatched passwords shows error", async ({ page }) => {
    await page.goto("/signup");
    await page.fill("input[name=name]", "Test User");
    await page.fill("input[name=email]", "test@example.com");
    await page.fill("input[name=password]", "password123");
    await page.fill("input[name=confirmPassword]", "different456");
    await page.click("button[type=submit]");
    await expect(page.locator("text=match")).toBeVisible({ timeout: 10000 });
  });

  test("404 page returns proper status", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist-xyz");
    expect(res?.status()).toBe(404);
  });
});
