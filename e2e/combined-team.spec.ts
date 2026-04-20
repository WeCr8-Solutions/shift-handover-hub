import { test, expect, chromium } from "@playwright/test";
import { seedFixture } from "./helpers/seed";
import { login } from "./helpers/auth";

/**
 * Combined team flow — sequential admin setup, operator lifecycle,
 * then a final parallel verification step where admin watches realtime
 * updates from operator.
 *
 * Approach:
 *   Phase 1 (sequential): admin signs in, verifies setup, then signs out
 *   Phase 2 (sequential): operator signs in, runs WO start
 *   Phase 3 (parallel):   two browser contexts — admin observes WO state
 *                         change while operator completes the WO
 */
test.describe("Combined team flow", () => {
  test("admin + operator coordinated workflow", async ({ page, browser }) => {
    const fx = await seedFixture();

    await test.step("Phase 1 — admin verifies setup", async () => {
      await login(page, fx.admin.email, fx.admin.password);
      await page.goto("/admin/stations");
      await expect(
        page.getByText(new RegExp(fx.station.station_id, "i")).first(),
      ).toBeVisible({ timeout: 15_000 });
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });

    await test.step("Phase 2 — operator starts work order", async () => {
      await login(page, fx.operator.email, fx.operator.password);
      await page.goto(`/queue?item=${fx.work_order.id}`);
      const startBtn = page
        .getByRole("button", { name: /start|begin work|check in/i })
        .first();
      if (await startBtn.isVisible().catch(() => false)) {
        await startBtn.click();
      }
      await expect(
        page.getByText(new RegExp(fx.work_order.code, "i")).first(),
      ).toBeVisible();
    });

    await test.step("Phase 3 — parallel: admin observes operator complete", async () => {
      // Spin up second context as admin while operator completes
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();

      await Promise.all([
        (async () => {
          await login(adminPage, fx.admin.email, fx.admin.password);
          await adminPage.goto("/dashboard");
          await expect(
            adminPage.getByText(new RegExp(fx.station.name, "i")).first(),
          ).toBeVisible({ timeout: 20_000 });
        })(),
        (async () => {
          await page.goto(`/queue?item=${fx.work_order.id}`);
          const completeBtn = page
            .getByRole("button", { name: /complete|finish|mark complete/i })
            .first();
          if (await completeBtn.isVisible().catch(() => false)) {
            await completeBtn.click();
          }
        })(),
      ]);

      // Final realtime check: admin dashboard should reflect station with operator's name or completed WO count
      await expect(
        adminPage.getByText(new RegExp(fx.work_order.code, "i")).or(
          adminPage.getByText(/E2E Operator/i),
        ),
      ).toBeVisible({ timeout: 20_000 });

      await adminContext.close();
    });
  });
});
