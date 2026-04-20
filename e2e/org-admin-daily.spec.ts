import { test, expect } from "@playwright/test";
import { seedFixture } from "./helpers/seed";
import { login } from "./helpers/auth";

/**
 * Org-admin daily flow:
 *  1. Auth + admin dashboard
 *  2. Org / team / station setup verification (seeded; admin can edit)
 *  3. Work order create + routing template + assign
 *  4. Invite codes & member management
 *  5. Review/approve operator outputs (handoffs, performance updates, NCRs)
 */
test.describe("Org admin daily flow", () => {
  test("complete admin lifecycle", async ({ page }) => {
    const fx = await seedFixture();

    await test.step("login as admin", async () => {
      await login(page, fx.admin.email, fx.admin.password);
      await expect(page).not.toHaveURL(/\/auth/);
    });

    await test.step("admin dashboard loads", async () => {
      await page.goto("/admin");
      // Admin landing should mention org name or "Admin" header
      await expect(
        page.getByText(/admin|organization|stations|users/i).first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("teams page accessible", async () => {
      await page.goto("/teams");
      await expect(
        page.getByText(new RegExp(fx.team.name, "i")).first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("stations management accessible", async () => {
      await page.goto("/admin/stations");
      await expect(
        page.getByText(new RegExp(fx.station.station_id, "i")).first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("create work order entry point", async () => {
      await page.goto("/queue");
      const newWo = page
        .getByRole("button", { name: /new work order|add work order|create work/i })
        .first();
      await expect(newWo).toBeVisible({ timeout: 15_000 });
    });

    await test.step("routing templates accessible", async () => {
      await page.goto("/admin/routing");
      await expect(
        page.getByText(/routing|template|operation/i).first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step("invite codes accessible", async () => {
      await page.goto("/teams");
      const inviteTab = page.getByRole("tab", { name: /invite|qr|code/i }).first();
      if (await inviteTab.isVisible().catch(() => false)) {
        await inviteTab.click();
      }
      await expect(
        page.getByText(/invite|qr|code/i).first(),
      ).toBeVisible({ timeout: 10_000 });
    });

    await test.step("member management accessible", async () => {
      await page.goto("/teams");
      const membersTab = page.getByRole("tab", { name: /member/i }).first();
      if (await membersTab.isVisible().catch(() => false)) {
        await membersTab.click();
      }
      await expect(
        page.getByText(new RegExp(fx.operator.email.split("@")[0], "i")).or(
          page.getByText(/operator|member/i).first(),
        ),
      ).toBeVisible({ timeout: 10_000 });
    });

    await test.step("review queue: performance updates / NCRs", async () => {
      await page.goto("/admin/performance");
      await expect(
        page.getByText(/performance|update|review|ncr/i).first(),
      ).toBeVisible({ timeout: 15_000 });
    });
  });
});
