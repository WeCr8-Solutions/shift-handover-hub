import { test, expect } from "@playwright/test";
import { instrumentPage } from "./helpers/instrumentation";
import { flushGapReport, recordGap } from "./helpers/gapReport";

/**
 * Regression suite for fixes documented in e2e-failure-report.md
 *
 *   CF-1: /work-orders, /work-orders/cancelled, /work-orders/completed,
 *         /work-orders/on-hold are now mounted and bounce anon → /auth.
 *   CF-3: NotificationBell aria-label + data-testid present on Live build.
 *   FB-?: WO drawer + station-card stable selectors (data-testid).
 *   404 : NotFound page exposes a Home recovery link with data-testid.
 *   Mobile: marketing & app headers expose a hamburger with
 *           [data-testid="mobile-menu"] and aria-label="Open menu".
 *
 * Each test is self-contained and runs against the LIVE base URL by default
 * (overridable via E2E_BASE_URL).
 */

test.describe.configure({ mode: "serial", timeout: 30_000 });

test.afterAll(() => flushGapReport());

const ctx = (pathway: string) => ({
  spec: "regression",
  role: "anon",
  pathway,
});

test.describe("Regression › routing", () => {
  for (const route of [
    "/work-orders",
    "/work-orders/cancelled",
    "/work-orders/completed",
    "/work-orders/on-hold",
  ]) {
    test(`anon visiting ${route} bounces to /auth (not 404)`, async ({ page, context }) => {
      const c = ctx("guard");
      instrumentPage(page, c);
      await context.clearCookies();
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);

      const url = page.url();
      const text = (await page.locator("body").innerText().catch(() => "")) ?? "";
      const bouncedToAuth = /\/auth(\?|$|#)/.test(url);
      const renderedLoginCard = /sign in|log in|continue with/i.test(text);
      const is404 = await page
        .locator('[data-testid="not-found"]')
        .isVisible()
        .catch(() => false);

      expect(is404, `Guarded route ${route} rendered NotFound — should be mounted in App.tsx`).toBe(false);
      expect(bouncedToAuth || renderedLoginCard, `Guarded route ${route} did not redirect anon to /auth`).toBe(true);
    });
  }

  test("/this-route-does-not-exist renders NotFound with recovery link", async ({ page }) => {
    const c = ctx("404");
    instrumentPage(page, c);
    await page.goto("/this-route-does-not-exist-99999");
    await page.waitForTimeout(800);
    await expect(page.locator('[data-testid="not-found"]')).toBeVisible();
    await expect(page.locator('[data-testid="not-found-home"]')).toBeVisible();
  });
});

test.describe("Regression › selectors", () => {
  test("marketing header hamburger has aria-label + data-testid (mobile)", async ({ page, context }) => {
    await context.clearCookies();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const trigger = page.locator('[data-testid="mobile-menu"]').first();
    const visible = await trigger.isVisible().catch(() => false);
    if (!visible) {
      recordGap({
        ...ctx("selector"),
        step: "mobile-menu",
        severity: "warn",
        category: "missing_ui",
        message: "Marketing hamburger [data-testid=mobile-menu] not visible at 390×844",
        url: page.url(),
      });
    }
    expect(visible).toBe(true);
    await expect(trigger).toHaveAttribute("aria-label", /menu/i);
  });

  test("404 dead-end exposes a recovery link", async ({ page }) => {
    await page.goto("/__definitely_missing__");
    await page.waitForTimeout(500);
    const home = page.locator('[data-testid="not-found-home"]');
    await expect(home).toBeVisible();
    await expect(home).toHaveAttribute("href", "/");
  });
});
