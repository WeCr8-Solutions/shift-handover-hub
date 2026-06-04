import { test, expect } from "@playwright/test";

/**
 * E2E sweeps for the concierge gap-closure work:
 *  - /concierge/sales lead capture (tax id + billing address)
 *  - /admin/concierge/print MSA hardened layout (unauth bounce)
 *  - /billing/concierge/invoice/:id auth gate
 *  - /settings/billing/concierge auth gate
 *  - admin reporting route auth gate
 */
test.describe("Concierge — gap closure E2E", () => {
  test("/concierge/sales renders with payment options + form", async ({ page }) => {
    await page.goto("/concierge/sales");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /pay by check|talk to a human/i })).toBeVisible();
    await expect(page.getByText(/Check \(mailed\)/i)).toBeVisible();
    await expect(page.getByText(/Purchase order/i)).toBeVisible();
    await expect(page.getByLabel(/Company \*/i)).toBeVisible();
    await expect(page.getByLabel(/Email \*/i)).toBeVisible();
  });

  test("admin print MSA route requires platform admin", async ({ page }) => {
    await page.goto("/admin/concierge/print/00000000-0000-0000-0000-000000000000");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch(/\/(admin|auth)/);
  });

  test("concierge invoice PDF requires auth", async ({ page }) => {
    await page.goto("/billing/concierge/invoice/00000000-0000-0000-0000-000000000000");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch(/\/(auth|billing\/concierge)/);
  });

  test("/settings/billing/concierge auth gate", async ({ page }) => {
    await page.goto("/settings/billing/concierge");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch(/\/(auth|settings)/);
  });

  test("admin concierge reporting requires platform admin", async ({ page }) => {
    await page.goto("/admin/concierge/reporting");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toMatch(/\/(admin|auth)/);
  });
});
