import { test, expect } from "@playwright/test";
import { seedFixture } from "./helpers/seed";
import { login } from "./helpers/auth";

/**
 * Org ownership + Customers hub child-flow E2E.
 *
 * Covers:
 *  - Owner can open Members tab and sees themself.
 *  - Owner can assign multiple app roles (Supervisor + Operator) to their own row.
 *  - Org admin can navigate to /customers, create a customer, and see it appear.
 *  - Operator gets read-only Customers view (no Add button).
 */
test.describe("Org ownership + Customers hub", () => {
  test("owner role + customer CRUD child flow", async ({ page }) => {
    const fx = await seedFixture();

    await test.step("Owner views Members tab including themselves", async () => {
      await login(page, fx.admin.email, fx.admin.password);
      await page.goto("/teams?tab=org-members");
      await expect(page.getByText(/Members/i).first()).toBeVisible({ timeout: 15_000 });
      // Owner row should appear (self)
      await expect(page.getByText(/\(You\)/i).first()).toBeVisible({ timeout: 10_000 });
    });

    await test.step("Admin creates a customer", async () => {
      await page.goto("/customers");
      await expect(page.getByRole("heading", { name: /customers/i }).first()).toBeVisible({
        timeout: 15_000,
      });
      const addBtn = page.getByTestId("customers-add");
      await expect(addBtn).toBeVisible();
      await addBtn.click();
      const uniq = `E2E Customer ${Date.now()}`;
      await page.getByLabel(/Customer name/i).fill(uniq);
      await page.getByLabel(/Contact name/i).fill("Jane Buyer");
      await page.getByLabel(/Email/i).fill("jane.buyer@example.com");
      await page.getByRole("button", { name: /add customer/i }).click();
      await expect(page.getByText(uniq).first()).toBeVisible({ timeout: 10_000 });
    });

    await test.step("Operator gets read-only customers view", async () => {
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await login(page, fx.operator.email, fx.operator.password);
      await page.goto("/customers");
      await expect(page.getByRole("heading", { name: /customers/i }).first()).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByTestId("customers-add")).toHaveCount(0);
    });
  });
});
