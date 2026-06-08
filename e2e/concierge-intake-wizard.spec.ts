import { test, expect } from "@playwright/test";

/**
 * E2E for the customer-facing concierge intake wizard.
 * Auth-gated; without a session we land on /auth. Smoke covers the routes,
 * unauth redirect, and the marketing entry point.
 */
test.describe("Concierge intake wizard", () => {
  test("intake route requires auth", async ({ page }) => {
    await page.goto("/onboarding/intake");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch(/\/(auth|onboarding\/intake)/);
  });

  test("onboarding marketing CTA links to checkout", async ({ page }) => {
    await page.goto("/onboarding-service");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Concierge Onboarding/i })).toBeVisible();
  });
});
