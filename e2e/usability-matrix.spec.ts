import { test, expect } from "@playwright/test";
import { flushGapReport, recordGap } from "./helpers/gapReport";
import { instrumentPage } from "./helpers/instrumentation";

/**
 * Usability matrix — softer-failure detection complementing the smoke matrix.
 *
 * Goals:
 *  - Catch broken navigation, dead buttons, missing aria, mobile-hidden CTAs.
 *  - Verify route guards bounce *unauthenticated* users to /auth (and not 404).
 *  - Verify public pages render meaningful content (no blank/loading-stuck).
 *  - Capture console errors / failed network / uncaught exceptions per route.
 *
 * No seed required — covers public surfaces + guard checks. Uses the gap report
 * so every issue surfaces with an actionable repair hint.
 *
 * Env knobs:
 *   E2E_USABILITY_BASE_PUBLIC=/,/pricing,/talent,...
 *   E2E_USABILITY_BASE_GUARDED=/dashboard,/queue,/admin,...
 */

const PUBLIC_ROUTES = (
  process.env.E2E_USABILITY_BASE_PUBLIC ??
  [
    "/",
    "/pricing",
    "/talent",
    "/talent/browse",
    "/oap",
    "/gcode-academy",
    "/handbook",
    "/resources",
    "/resources/glossary",
    "/resources/gcode",
    "/verify",
    "/auth",
    "/shift-handoff",
    "/manufacturing-visibility",
  ].join(",")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Routes here MUST exist in src/App.tsx — anon visits should bounce to /auth,
// not 404. If you add a guarded route to App.tsx, mirror it here.
const GUARDED_ROUTES = (
  process.env.E2E_USABILITY_BASE_GUARDED ??
  [
    "/dashboard",
    "/queue",
    "/teams",
    "/admin",
    "/settings",
    "/talent/dashboard",
    "/talent/search",
    "/oap/employer",
    "/gca/employer",
    "/work-orders",
    "/work-orders/completed",
    "/work-orders/cancelled",
    "/work-orders/on-hold",
    "/history",
  ].join(",")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const VIEWPORTS: Array<{ name: string; width: number; height: number }> = [
  { name: "desktop", width: 1366, height: 768 },
  { name: "mobile", width: 390, height: 844 },
];

test.describe.configure({ mode: "serial", timeout: 60_000 });

test.afterAll(() => {
  flushGapReport();
});

for (const vp of VIEWPORTS) {
  test.describe(`Usability › ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const route of PUBLIC_ROUTES) {
      test(`public ${route}`, async ({ page }) => {
        const ctx = {
          spec: "usability",
          role: "anon",
          pathway: "public",
          scenario: vp.name,
        };
        instrumentPage(page, ctx);

        const start = Date.now();
        const response = await page
          .goto(route, { waitUntil: "domcontentloaded", timeout: 20_000 })
          .catch((e) => {
            recordGap({
              ...ctx,
              step: `goto ${route}`,
              severity: "error",
              category: "routing",
              message: `Navigation threw: ${(e as Error).message}`,
              url: route,
            });
            return null;
          });

        const elapsed = Date.now() - start;
        if (elapsed > 5000) {
          recordGap({
            ...ctx,
            step: `goto ${route}`,
            severity: "warn",
            category: "perf",
            message: `Slow load: ${elapsed}ms (>5000ms budget)`,
            elapsedMs: elapsed,
            budgetMs: 5000,
            url: page.url(),
          });
        }

        if (response && response.status() >= 400) {
          recordGap({
            ...ctx,
            step: `status ${route}`,
            severity: "error",
            category: "routing",
            message: `HTTP ${response.status()} on public route`,
            url: page.url(),
          });
        }

        // Stuck-loading detection: skeletons or spinners after 4s = concern.
        await page.waitForTimeout(1500);
        const text = (await page.locator("body").innerText().catch(() => "")) ?? "";
        if (!text.trim()) {
          recordGap({
            ...ctx,
            step: `render ${route}`,
            severity: "error",
            category: "dead_end",
            message: "Empty body — page rendered nothing",
            url: page.url(),
            repairHint: `Check ${route} component for runtime error or stuck Suspense.`,
          });
          return;
        }

        const stuckLoading =
          /^(loading|please wait)\.\.?\.?$/i.test(text.trim()) ||
          (text.length < 30 && /loading|spinner/i.test(text));
        if (stuckLoading) {
          recordGap({
            ...ctx,
            step: `render ${route}`,
            severity: "error",
            category: "dead_end",
            message: "Page appears stuck in loading state",
            url: page.url(),
          });
        }

        // Mobile-only: top-level CTAs / nav must be reachable.
        if (vp.name === "mobile") {
          const hasMenu = await page
            .locator(
              'button[aria-label*="menu" i], [data-testid="mobile-menu"], button:has(svg.lucide-menu)',
            )
            .first()
            .isVisible({ timeout: 2000 })
            .catch(() => false);
          const hasInteractive = await page
            .locator('a, button')
            .first()
            .isVisible()
            .catch(() => false);
          if (!hasMenu && !hasInteractive) {
            recordGap({
              ...ctx,
              step: `mobile ${route}`,
              severity: "warn",
              category: "missing_ui",
              message: "No mobile menu or interactive element visible",
              url: page.url(),
              repairHint: "Verify Header renders mobile hamburger menu.",
            });
          }
        }

        // Test internal-link sanity: at least 1 nav link present on most public pages.
        if (route !== "/auth") {
          const navLinks = await page
            .locator('nav a, header a')
            .count()
            .catch(() => 0);
          if (navLinks === 0) {
            recordGap({
              ...ctx,
              step: `nav-links ${route}`,
              severity: "warn",
              category: "missing_ui",
              message: "Page has no nav/header links",
              url: page.url(),
            });
          }
        }
      });
    }

    for (const route of GUARDED_ROUTES) {
      test(`guard ${route} bounces anon`, async ({ page, context }) => {
        const ctx = {
          spec: "usability",
          role: "anon",
          pathway: "guard",
          scenario: vp.name,
        };
        instrumentPage(page, ctx);

        // Ensure no session.
        await context.clearCookies();
        await page.goto(route, { waitUntil: "domcontentloaded" }).catch(() => {});
        await page.waitForTimeout(1500);

        const url = page.url();
        const text = (await page.locator("body").innerText().catch(() => "")) ?? "";

        const bouncedToAuth = /\/auth(\?|$|#)/.test(url);
        const renderedLoginCard = /sign in|log in|continue with/i.test(text);

        if (!bouncedToAuth && !renderedLoginCard) {
          recordGap({
            ...ctx,
            step: `guard ${route}`,
            severity: "error",
            category: "auth",
            message: `Guarded route did not redirect anon user to /auth`,
            url,
            repairHint: `Wrap ${route} in <RequireAuth> in src/App.tsx.`,
          });
        }

        if (/404|not found/i.test(text) && !text.match(/sign in|log in/i)) {
          recordGap({
            ...ctx,
            step: `guard ${route}`,
            severity: "error",
            category: "dead_end",
            message: "Anon user lands on 404 instead of auth bounce",
            url,
          });
        }
      });
    }
  });
}

test("404 dead-end has recovery link", async ({ page }) => {
  const ctx = { spec: "usability", role: "anon", pathway: "404" };
  instrumentPage(page, ctx);
  await page.goto("/this-route-definitely-does-not-exist-12345");
  await page.waitForTimeout(800);
  const recovery = await page
    .getByRole("link", { name: /home|dashboard|back/i })
    .first()
    .isVisible()
    .catch(() => false);
  if (!recovery) {
    recordGap({
      ...ctx,
      step: "404-recovery",
      severity: "error",
      category: "dead_end",
      message: "Unknown route renders without a recovery link",
      url: page.url(),
      repairHint: "Add a Home/Dashboard link to NotFound.tsx.",
    });
  }
  expect(true).toBeTruthy(); // soft test — gap-report carries failures
});
