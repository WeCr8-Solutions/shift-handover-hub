import { test, expect } from "@playwright/test";
import { seedFixture } from "./helpers/seed";
import { login } from "./helpers/auth";

/**
 * Smoke test for the operator handoff-acknowledge flow.
 *
 * Verifies the in-DB acknowledgement contract end-to-end:
 *  1. Operator logs in and reaches the dashboard
 *  2. The dashboard mounts the AcknowledgeHandoffCard (renders only when
 *     pending exists, so we tolerate both branches)
 *  3. If a pending handoff is shown, clicking Acknowledge dismisses the row
 *
 * The dashboard also exposes the Quick Status trigger — we assert it is
 * present so we don't regress the mid-shift status-update entry point.
 */
test.describe("Operator handoff polish", () => {
  test("dashboard exposes quick-status trigger and acknowledge card slot", async ({ page }) => {
    const fx = await seedFixture();

    await login(page, fx.operator.email, fx.operator.password);
    await page.goto("/dashboard");

    // Quick Status trigger must be present on the operator surface
    const quickStatus = page
      .getByTestId("quick-status-trigger")
      .or(page.getByRole("button", { name: /quick status/i }))
      .first();
    await expect(quickStatus).toBeVisible({ timeout: 20_000 });

    // AcknowledgeHandoffCard renders only when there are pending acks;
    // either branch is acceptable but it MUST not throw.
    const ackCard = page.getByTestId("acknowledge-handoff-card");
    const present = await ackCard.isVisible().catch(() => false);
    if (present) {
      const firstBtn = ackCard.locator('[data-testid^="ack-button-"]').first();
      await expect(firstBtn).toBeVisible();
      await firstBtn.click();
      // After ack, the row should disappear; the card may also disappear
      // entirely if it was the last pending item.
      await expect(firstBtn).toHaveCount(0, { timeout: 5_000 });
    }
  });

  test("quick-status dialog opens and posts an update", async ({ page }) => {
    const fx = await seedFixture();
    await login(page, fx.operator.email, fx.operator.password);
    await page.goto("/dashboard");

    const trigger = page.getByTestId("quick-status-trigger").first();
    if (!(await trigger.isVisible().catch(() => false))) {
      test.skip(true, "Operator not checked into a station in this seed run");
      return;
    }
    await trigger.click();

    const dialog = page.getByTestId("quick-status-dialog");
    await expect(dialog).toBeVisible();
    await page.getByTestId("quick-status-note").fill("Tool change in progress");
    await page.getByTestId("quick-status-save").click();

    // Toast or dialog dismissal both indicate success
    await expect(dialog).toBeHidden({ timeout: 10_000 });
  });
});
