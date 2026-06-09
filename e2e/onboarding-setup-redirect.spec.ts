import { test, expect } from "@playwright/test";
import { seedFixture } from "./helpers/seed";
import { login } from "./helpers/auth";

test.describe("Onboarding setup redirect guard", () => {
  test("completed or dismissed org admin returns to dashboard and admin tools", async ({ page }) => {
    const fx = await seedFixture();

    await login(page, fx.admin.email, fx.admin.password);
    await expect(page).not.toHaveURL(/\/setup(?:\?|$)/);
    await expect(page.getByText(/setup wizard|welcome to jobline/i)).toHaveCount(0);

    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/setup(?:\?|$)/);
    await expect(page.getByText(/dashboard|station|handoff|work order/i).first()).toBeVisible({ timeout: 15_000 });

    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/setup(?:\?|$)/);
    await expect(page.getByText(/admin|organization|stations|users/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("completed or dismissed operator returns to dashboard and queue", async ({ page }) => {
    const fx = await seedFixture();

    await login(page, fx.operator.email, fx.operator.password);
    await expect(page).not.toHaveURL(/\/setup(?:\?|$)/);
    await expect(page.getByText(/setup wizard|welcome to jobline/i)).toHaveCount(0);

    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/setup(?:\?|$)/);
    await expect(page.getByText(new RegExp(fx.station.name, "i")).first()).toBeVisible({ timeout: 15_000 });

    await page.goto("/queue");
    await expect(page).not.toHaveURL(/\/setup(?:\?|$)/);
    await expect(page.getByText(new RegExp(fx.work_order.code, "i")).first()).toBeVisible({ timeout: 15_000 });
  });
});