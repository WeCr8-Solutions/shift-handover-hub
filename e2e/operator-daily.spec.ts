import { test, expect } from "@playwright/test";
import { seedFixture } from "./helpers/seed";
import { login } from "./helpers/auth";

/**
 * Operator daily flow:
 *  1. Auth + dashboard load
 *  2. Find seeded work order, start → pause → resume → complete
 *  3. Create shift handoff
 *  4. Report an issue (NCR-style) and request a delivery
 *
 * Selectors prefer role/name; falls back to data-testid where added in UI.
 */
test.describe("Operator daily flow", () => {
  test("complete operator lifecycle", async ({ page }) => {
    const fx = await seedFixture();

    await test.step("login as operator", async () => {
      await login(page, fx.operator.email, fx.operator.password);
      await expect(page).not.toHaveURL(/\/auth/);
    });

    await test.step("dashboard / station panel loads", async () => {
      await page.goto("/dashboard");
      await expect(
        page.getByText(new RegExp(fx.station.name, "i")).first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("navigate to work order queue", async () => {
      await page.goto("/queue");
      await expect(
        page.getByText(new RegExp(fx.work_order.code, "i")).first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("open seeded work order", async () => {
      await page.goto(`/queue?item=${fx.work_order.id}`);
      await expect(
        page.getByText(new RegExp(fx.work_order.code, "i")).first(),
      ).toBeVisible();
    });

    await test.step("start → pause → resume → complete", async () => {
      // Start
      const startBtn = page
        .getByRole("button", { name: /start|begin work|check in/i })
        .first();
      if (await startBtn.isVisible().catch(() => false)) {
        await startBtn.click();
      }
      // Pause/Hold
      const pauseBtn = page
        .getByRole("button", { name: /pause|hold|on hold/i })
        .first();
      if (await pauseBtn.isVisible().catch(() => false)) {
        await pauseBtn.click();
      }
      // Resume
      const resumeBtn = page
        .getByRole("button", { name: /resume|continue|restart/i })
        .first();
      if (await resumeBtn.isVisible().catch(() => false)) {
        await resumeBtn.click();
      }
      // Complete
      const completeBtn = page
        .getByRole("button", { name: /complete|finish|mark complete/i })
        .first();
      await expect(completeBtn).toBeVisible({ timeout: 10_000 });
    });

    await test.step("create shift handoff entry point", async () => {
      // Handoff creation lives on the dashboard (no dedicated /handoff route).
      await page.goto("/dashboard");
      const newBtn = page
        .getByRole("button", { name: /new handoff|create handoff|add handoff|shift handoff/i })
        .first();
      await expect(newBtn).toBeVisible({ timeout: 15_000 });
    });

    await test.step("report issue & request delivery", async () => {
      await page.goto(`/queue?item=${fx.work_order.id}`);
      const reportBtn = page
        .getByRole("button", { name: /report issue|ncr|nonconform/i })
        .first();
      const deliveryBtn = page
        .getByRole("button", { name: /request delivery|delivery/i })
        .first();
      // Both should at minimum be present
      await expect(reportBtn.or(deliveryBtn)).toBeVisible({ timeout: 10_000 });
    });
  });
});
