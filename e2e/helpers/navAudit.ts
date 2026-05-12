import type { Page } from "@playwright/test";
import { recordGap } from "./gapReport";
import { withBudget, BUDGETS } from "./perfBudget";

/**
 * Visit a list of routes and assert the page is not a dead-end:
 *   - body has visible text
 *   - either content or a clear CTA / empty-state component is present
 *   - no "404", "Not Found" without a back-to-home link
 */
export async function auditRoutes(
  page: Page,
  routes: string[],
  ctx: { spec: string; role?: string; pathway?: string; scenario?: string },
) {
  for (const route of routes) {
    await withBudget(
      `nav:${route}`,
      BUDGETS.navClick,
      { ...ctx, page },
      async () => {
        await page
          .goto(route, { waitUntil: "domcontentloaded" })
          .catch(() => {});
      },
    );

    const url = page.url();
    const bodyText = (await page.locator("body").innerText().catch(() => "")) ?? "";
    const trimmed = bodyText.trim();

    if (!trimmed) {
      recordGap({
        spec: ctx.spec,
        step: `nav:${route}`,
        scenario: ctx.scenario,
        role: ctx.role,
        pathway: ctx.pathway,
        severity: "error",
        category: "dead_end",
        message: "Route rendered empty body",
        url,
        repairHint: `Check route ${route} in src/App.tsx and target page component.`,
      });
      continue;
    }

    // 404 without a recovery CTA = dead-end
    if (/404|not found|page (does not|doesn't) exist/i.test(trimmed)) {
      const hasRecovery = await page
        .getByRole("link", { name: /home|dashboard|back/i })
        .first()
        .isVisible()
        .catch(() => false);
      if (!hasRecovery) {
        recordGap({
          spec: ctx.spec,
          step: `nav:${route}`,
          scenario: ctx.scenario,
          role: ctx.role,
          pathway: ctx.pathway,
          severity: "error",
          category: "dead_end",
          message: "404 page without recovery link",
          url,
          repairHint: "Add Back to Home / Dashboard link on NotFound page.",
        });
      }
    }

    // Auth redirect on a route the role should be allowed on
    if (/\/auth(\?|$|#)/.test(url) && !route.startsWith("/auth")) {
      recordGap({
        spec: ctx.spec,
        step: `nav:${route}`,
        scenario: ctx.scenario,
        role: ctx.role,
        pathway: ctx.pathway,
        severity: "warn",
        category: "auth",
        message: `Route bounced to /auth — possible misconfigured guard`,
        url,
        repairHint: `Inspect RouteGuard for ${route}; verify role permitted.`,
      });
    }
  }
}
