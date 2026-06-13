import { expect, test } from "@playwright/test";

test.describe("Tuduvia marketing website", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test("homepage presents Tuduvia positioning", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Tuduvia");
    await expect(page.getByText("No Boards. No Training.").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Start free/i }).first()).toBeVisible();
    await expect(page.getByText("Start alone, invite people when needed")).toBeVisible();
  });

  test("pricing, contact, and legal pages are public", async ({ page }) => {
    const pages = [
      { path: "/pricing", heading: "Start free" },
      { path: "/contact", heading: "Talk to Tuduvia" },
      { path: "/privacy", heading: "Privacy Policy" },
      { path: "/terms", heading: "Terms of Use" },
      { path: "/cookies", heading: "Cookie Policy" },
    ];

    for (const marketingPage of pages) {
      await page.goto(marketingPage.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("h1")).toContainText(marketingPage.heading);
      await expect(page.getByRole("link", { name: /Tuduvia home/i })).toBeVisible();
    }
  });

  test("use-case hub and persona pages render", async ({ page }) => {
    await page.goto("/use-cases", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Find the Tuduvia page");
    await expect(page.getByRole("link", { name: /A to-do list you do not have to learn/i })).toBeVisible();

    await page.goto("/use-cases/simple-personal-todo-list", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("A to-do list you do not have to learn");
    await expect(page.getByText("Personal users")).toBeVisible();

    await page.goto("/use-cases/temporary-team-task-management", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Create a temporary team");
    await expect(page.getByText("school, home, neighbors, friends, business")).toBeVisible();
  });

  test("sitemap, robots, and llms files are available", async ({ page }) => {
    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain("simple-personal-todo-list");

    const robots = await page.request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain("Disallow: /dashboard/");

    const llms = await page.request.get("/llms.txt");
    expect(llms.ok()).toBeTruthy();
    expect(await llms.text()).toContain("The simple way from to-do to done");
  });
});
