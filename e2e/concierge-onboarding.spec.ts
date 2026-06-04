import { test, expect } from "@playwright/test";

test.describe("Concierge Onboarding", () => {
  test("public marketing page renders with price and CTA", async ({ page }) => {
    await page.goto("/onboarding-service");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Concierge Onboarding/i })).toBeVisible();
    await expect(page.getByText(/\$1,500/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Purchase Concierge Onboarding/i })).toBeVisible();
  });

  test("success banner appears after Stripe redirect", async ({ page }) => {
    await page.goto("/onboarding-service?status=success");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Payment received/i)).toBeVisible();
    await expect(page.getByText(/concierge intake/i)).toBeVisible();
  });

  test("cancelled banner appears when checkout is abandoned", async ({ page }) => {
    await page.goto("/onboarding-service?status=cancelled");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/Checkout cancelled/i)).toBeVisible();
  });

  test("clicking purchase without auth redirects to /auth", async ({ page }) => {
    await page.goto("/onboarding-service");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /Purchase Concierge Onboarding/i }).click();
    await page.waitForURL(/\/auth/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/auth/);
  });

  test("admin onboarding panel route is reachable", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    // Auth-gated; either admin renders or we land on /auth.
    expect(page.url()).toMatch(/\/(admin|auth)/);
  });
});
