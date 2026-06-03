import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { seedFixture } from "./helpers/seed";

/**
 * Work Order Traveler — printable ISO 9001 traveler sheet.
 *
 * Verifies:
 *   1. The print route renders the traveler for a real WO (header, barcodes, sign-off).
 *   2. The ?color= override changes the priority stripe label.
 *   3. The Print Traveler popover button is wired into the queue and links to /traveler.
 *   4. The Traveler Template settings page loads under Production for org admins.
 *   5. Bulk ?ids= renders multiple traveler sheets in one document.
 */

test.describe("Work Order Traveler", () => {
  test("print route renders sheet with barcodes and sign-off", async ({ page }) => {
    const fx = await seedFixture("wo_basic");
    await login(page, fx.admin.email, fx.admin.password);

    // Disable auto-print so the dialog doesn't block the test.
    await page.goto(`/work-orders/${fx.work_order.id}/traveler?print=0&color=red`, {
      waitUntil: "domcontentloaded",
    });

    // Toolbar (only visible on screen, hidden in print).
    await expect(page.getByRole("button", { name: /^print$/i })).toBeVisible();
    await expect(page.getByText(/RED paper/i)).toBeVisible();

    // Traveler header.
    await expect(page.getByText(/WORK ORDER TRAVELER/i).first()).toBeVisible({ timeout: 15_000 });

    // Wait for at least one barcode canvas to mount.
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 15_000 });

    // ISO 9001 sign-off block.
    await expect(page.getByText(/Released by|Inspected by|Closed by/i).first()).toBeVisible();
  });

  test("color override changes the priority stripe label", async ({ page }) => {
    const fx = await seedFixture("wo_basic");
    await login(page, fx.admin.email, fx.admin.password);

    await page.goto(`/work-orders/${fx.work_order.id}/traveler?print=0&color=blue`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByText(/BLUE paper/i)).toBeVisible();
  });

  test("bulk ids= renders multiple traveler sheets", async ({ page }) => {
    const fx = await seedFixture("wo_basic");
    await login(page, fx.admin.email, fx.admin.password);

    // Same id twice is enough to prove the ids= splitter renders N sheets.
    const ids = `${fx.work_order.id},${fx.work_order.id}`;
    await page.goto(`/work-orders/x/traveler?print=0&ids=${ids}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText(/2 travelers/i)).toBeVisible();
    await expect(page.locator(".traveler-sheet")).toHaveCount(2, { timeout: 15_000 });
  });

  test("Traveler Template settings page is reachable for org admins", async ({ page }) => {
    const fx = await seedFixture("wo_basic");
    await login(page, fx.admin.email, fx.admin.password);

    await page.goto("/settings#traveler-template", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: /Work Order Traveler Template/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Priority → Paper Color/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Upload logo/i })).toBeVisible();
  });

  test("Print Traveler popover opens from the queue row actions", async ({ page }) => {
    const fx = await seedFixture("wo_basic");
    await login(page, fx.admin.email, fx.admin.password);

    await page.goto("/queue", { waitUntil: "domcontentloaded" });

    // The button is decorated with data-testid="wo-print-traveler".
    const btn = page.getByTestId("wo-print-traveler").first();
    await expect(btn).toBeVisible({ timeout: 20_000 });

    // Opening it must NOT navigate; it surfaces a color popover.
    const urlBefore = page.url();
    await btn.click();
    await expect(page.getByText(/Paper color/i)).toBeVisible();
    expect(page.url()).toBe(urlBefore);
  });
});
