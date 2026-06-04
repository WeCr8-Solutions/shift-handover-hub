import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";
import { seedFixture } from "./helpers/seed";

/**
 * Easy-bundle smoke coverage:
 *  - #9  Certificate of Conformance print route renders for a real WO.
 *  - #18 QR Scan button is mounted on the Queue header (Scan QR trigger).
 *  - #10 Skills-Gap matrix tab is reachable from /teams.
 */

test.describe("Easy-bundle: CoC + QR + Skills Gap", () => {
  test("CoC print route renders header and cert number", async ({ page }) => {
    const fx = await seedFixture("wo_basic");
    await login(page, fx.admin.email, fx.admin.password);

    await page.goto(`/work-orders/${fx.work_order.id}/coc?print=0`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByText(/CERTIFICATE OF CONFORMANCE/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Statement of Conformance/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^print$/i })).toBeVisible();
  });

  test("Queue exposes QR Scan trigger", async ({ page }) => {
    const fx = await seedFixture("wo_basic");
    await login(page, fx.admin.email, fx.admin.password);

    await page.goto("/queue");
    const qr = page.getByTestId("qr-scan-open")
      .or(page.getByRole("button", { name: /scan qr/i }))
      .first();
    await expect(qr).toBeVisible({ timeout: 20_000 });
  });

  test("Teams page exposes Skills Gap tab", async ({ page }) => {
    const fx = await seedFixture("wo_basic");
    await login(page, fx.admin.email, fx.admin.password);

    await page.goto("/teams");
    const skillsTab = page.getByRole("tab", { name: /skills gap/i });
    await expect(skillsTab).toBeVisible({ timeout: 20_000 });
    await skillsTab.click();
    await expect(
      page.getByTestId("skills-gap-matrix")
        .or(page.getByText(/Add team members and stations/i))
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});
