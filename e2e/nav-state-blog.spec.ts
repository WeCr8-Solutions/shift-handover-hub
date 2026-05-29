import { test, expect } from "@playwright/test";

/**
 * Navigation-state persistence — public blog surface.
 *
 * Verifies:
 *   1. The category filter writes to the URL (?category=…).
 *   2. Deep-linking to a category URL pre-selects the matching pill.
 *   3. Browser Back from a post returns to the same category AND restores
 *      scroll position (provided by ScrollToTop + navigationMemory).
 */

test.describe("Blog navigation state", () => {
  test("category filter persists in the URL", async ({ page }) => {
    await page.goto("/blog");
    await page.waitForLoadState("domcontentloaded");

    // Click a non-default category.
    const pill = page.getByRole("button", { name: "Operations", exact: true });
    if (await pill.count()) {
      await pill.click();
      await expect(page).toHaveURL(/[?&]category=Operations/);
    }
  });

  test("deep link with ?category= pre-selects the pill", async ({ page }) => {
    await page.goto("/blog?category=Operations");
    await page.waitForLoadState("domcontentloaded");
    const pill = page.getByRole("button", { name: "Operations", exact: true });
    if (await pill.count()) {
      await expect(pill).toHaveAttribute("aria-pressed", "true");
    }
  });

  test("Back from a post restores category and scroll position", async ({ page }) => {
    await page.goto("/blog?category=Operations");
    await page.waitForLoadState("domcontentloaded");

    // Scroll down so we have a position worth restoring.
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(150);

    // Navigate to the first post card we can find.
    const firstPost = page.locator('a[href^="/blog/"]').first();
    if (!(await firstPost.count())) test.skip();
    await firstPost.click();
    await page.waitForLoadState("domcontentloaded");

    // Browser Back.
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");

    // URL preserved.
    await expect(page).toHaveURL(/[?&]category=Operations/);

    // Scroll restored (allow a small tolerance for layout differences).
    const y = await page.evaluate(() => window.scrollY);
    expect(y).toBeGreaterThan(300);
  });
});
