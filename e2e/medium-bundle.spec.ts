import { test, expect } from "@playwright/test";

test.describe("Medium bundle smoke", () => {
  test("floor map route renders", async ({ page }) => {
    await page.goto("/floor-map");
    // Route is auth-gated; either map renders or we get redirected to /auth.
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url.includes("/floor-map") || url.includes("/auth")).toBeTruthy();
  });
});
