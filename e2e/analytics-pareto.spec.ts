import { test, expect } from "@playwright/test";
import { seedFixture } from "./helpers/seed";
import { login } from "./helpers/auth";

/**
 * Verifies the supervisor Production Analytics panel exposes the new
 * Pareto chart view. Pareto reads downtime_events; we only assert the
 * view chip is reachable and the chart container renders an empty-state
 * or chart, not specific data values.
 */
test.describe("Supervisor analytics — Pareto", () => {
  test("Pareto chip is selectable on production analytics", async ({ page }) => {
    const fx = await seedFixture();
    await login(page, fx.supervisor?.email ?? fx.operator.email, fx.supervisor?.password ?? fx.operator.password);
    await page.goto("/dashboard");

    const pareto = page.getByRole("button", { name: /^pareto$/i }).first();
    await expect(pareto).toBeVisible({ timeout: 20_000 });
    await pareto.click();

    // Either the empty-state copy or the chart subtitle should render
    await expect(
      page
        .getByText(/No downtime recorded/i)
        .or(page.getByText(/Top downtime reasons/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
