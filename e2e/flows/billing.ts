import type { Page } from "@playwright/test";
import { recordGap } from "../helpers/gapReport";

interface FlowCtx {
  spec: string;
  scenario?: string;
  role?: string;
  pathway?: string;
}

export async function assertEntitlementWall(
  page: Page,
  ctx: FlowCtx,
  route: string,
) {
  await page.goto(route).catch(() => {});
  const text = (await page.locator("body").innerText().catch(() => "")) ?? "";
  const hasUpgradeCta =
    /upgrade|subscribe|start (free )?trial|paid plan|requires (a )?(plan|subscription)/i.test(
      text,
    );
  const isAuthBounce = /\/auth(\?|$)/.test(page.url());
  if (!hasUpgradeCta && !isAuthBounce) {
    recordGap({
      spec: ctx.spec,
      step: "assertEntitlementWall",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "billing",
      severity: "warn",
      category: "routing",
      message: `Premium route ${route} did not show entitlement wall (free user)`,
      url: page.url(),
      repairHint:
        "Wrap route with RequireSubscription guard or render upgrade modal.",
    });
  }
  return hasUpgradeCta;
}
