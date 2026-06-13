import { expect, test } from "@playwright/test";

test.describe("theme bootstrap", () => {
  test("renders dark immediately for system dark when no stored theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      window.localStorage.removeItem("theme");
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const classes = await page.evaluate(() => document.documentElement.className);
    expect(classes.split(/\s+/).filter(Boolean)).toContain("dark");
  });

  test("respects explicit dark theme from localStorage on first load", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript(() => {
      window.localStorage.setItem("theme", "dark");
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const classes = await page.evaluate(() => document.documentElement.className);
    expect(classes.split(/\s+/).filter(Boolean)).toContain("dark");
  });

  test("respects explicit light theme over system dark", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => {
      window.localStorage.setItem("theme", "light");
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const classes = await page.evaluate(() => document.documentElement.className);
    expect(classes.split(/\s+/).filter(Boolean)).not.toContain("dark");
  });
});
