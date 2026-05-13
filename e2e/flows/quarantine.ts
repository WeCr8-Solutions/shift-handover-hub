import type { Page } from "@playwright/test";
import { recordGap } from "../helpers/gapReport";

interface FlowCtx {
  spec: string;
  scenario?: string;
  role?: string;
  pathway?: string;
}

/**
 * Quarantine is surfaced inline on /queue with a quality-hold filter and inside
 * the WO drawer's Quality tab. We try the filtered queue view first.
 */
export async function openQuarantine(page: Page, ctx: FlowCtx) {
  await page.goto("/queue?status=quality_hold").catch(() => {});
  const visible = await page
    .locator(
      'h1:has-text("Quality"), h2:has-text("Quality Hold"), h2:has-text("Quarantine"), [data-testid="quarantine-list"]',
    )
    .first()
    .isVisible({ timeout: 4000 })
    .catch(() => false);
  if (!visible) {
    // Fall back to looking for the inline NCR Queue tab on /queue.
    await page.goto("/queue").catch(() => {});
    const ncrTab = page
      .getByRole("tab", { name: /ncr|quality|quarantine/i })
      .first();
    const tabVisible = await ncrTab.isVisible().catch(() => false);
    if (!tabVisible) {
      recordGap({
        spec: ctx.spec,
        step: "openQuarantine",
        scenario: ctx.scenario,
        role: ctx.role,
        pathway: "quarantine",
        severity: "warn",
        category: "missing_ui",
        message:
          "No quarantine view found via /queue?status=quality_hold or NCR Queue tab",
        url: page.url(),
        repairHint:
          "Verify Queue.tsx supports ?status=quality_hold filter and exposes NCR Queue tab.",
      });
      return false;
    }
    await ncrTab.click();
    return true;
  }
  return visible;
}

export async function findQuarantinedWO(
  page: Page,
  ctx: FlowCtx,
  workOrderCode: string,
) {
  const row = page.getByText(new RegExp(workOrderCode, "i")).first();
  const visible = await row.isVisible({ timeout: 3000 }).catch(() => false);
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "findQuarantinedWO",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "quarantine",
      severity: "info",
      category: "data",
      message: `WO ${workOrderCode} not visible in quarantine list (may not be on hold)`,
      url: page.url(),
    });
  }
  return visible;
}

export async function disposition(
  page: Page,
  ctx: FlowCtx,
  decision: "rework" | "scrap" | "use_as_is",
) {
  const btn = page
    .getByRole("button", { name: new RegExp(decision.replace("_", " "), "i") })
    .first();
  if (!(await btn.isVisible().catch(() => false))) {
    recordGap({
      spec: ctx.spec,
      step: `disposition:${decision}`,
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "quarantine",
      severity: "warn",
      category: "missing_ui",
      message: `Disposition button '${decision}' not present`,
      url: page.url(),
    });
    return false;
  }
  await btn.click();
  return true;
}
