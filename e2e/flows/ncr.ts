import type { Page } from "@playwright/test";
import { recordGap } from "../helpers/gapReport";
import { withBudget, BUDGETS } from "../helpers/perfBudget";

interface FlowCtx {
  spec: string;
  scenario?: string;
  role?: string;
  pathway?: string;
  workOrderId?: string;
}

/**
 * NCR is not its own route — operators report from inside the WO drawer
 * (`/queue?item=<id>`) and supervisors review inside the "NCR Queue" tab on
 * `/queue`. Try the WO drawer first, then fall back to the queue tab.
 */
export async function openNcrForm(page: Page, ctx: FlowCtx) {
  if (ctx.workOrderId) {
    await page.goto(`/queue?item=${ctx.workOrderId}`).catch(() => {});
  } else {
    await page.goto("/queue").catch(() => {});
  }
  const trigger = page
    .locator(
      '[data-testid="ncr-create"], button:has-text("Report Issue"), button:has-text("Report NCR"), button:has-text("New NCR"), button:has-text("Nonconformance")',
    )
    .first();
  const visible = await trigger.isVisible({ timeout: 5000 }).catch(() => false);
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "openNcrForm",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "ncr",
      severity: "warn",
      category: "missing_ui",
      message: "No 'Report NCR' CTA visible from /queue or WO drawer",
      url: page.url(),
      repairHint:
        "Add data-testid=ncr-create to WO drawer's NCR trigger button.",
    });
    return false;
  }
  await trigger.click();
  return true;
}

export async function submitNcr(
  page: Page,
  ctx: FlowCtx,
  data: { qty: number; reason: string },
) {
  return withBudget("ncrSubmit", BUDGETS.ncrSubmit, { ...ctx, page }, async () => {
    const qty = page.getByLabel(/quantity|qty/i).first();
    const reason = page.getByLabel(/reason|description|notes/i).first();
    if (!(await qty.isVisible({ timeout: 3000 }).catch(() => false))) {
      recordGap({
        spec: ctx.spec,
        step: "submitNcr",
        scenario: ctx.scenario,
        role: ctx.role,
        pathway: "ncr",
        severity: "warn",
        category: "missing_ui",
        message: "NCR form missing quantity field",
        url: page.url(),
      });
      return false;
    }
    await qty.fill(String(data.qty));
    await reason.fill(data.reason).catch(() => {});
    const submit = page
      .locator(
        '[data-testid="ncr-submit"], button[type="submit"], button:has-text("Submit"), button:has-text("Create"), button:has-text("Save")',
      )
      .first();
    if (!(await submit.isVisible().catch(() => false))) {
      recordGap({
        spec: ctx.spec,
        step: "submitNcr",
        scenario: ctx.scenario,
        role: ctx.role,
        pathway: "ncr",
        severity: "warn",
        category: "missing_ui",
        message: "NCR submit button not found",
        url: page.url(),
      });
      return false;
    }
    await submit.click();
    return true;
  });
}

export async function assertQuantityIntegrity(
  page: Page,
  ctx: FlowCtx,
  workOrderCode: string,
) {
  await page.goto(`/queue?item=${workOrderCode}`).catch(() => {});
  const text = (await page.locator("body").innerText().catch(() => "")) ?? "";
  const hasQtyBreakdown = /completed|scrap|rework/i.test(text);
  if (!hasQtyBreakdown) {
    recordGap({
      spec: ctx.spec,
      step: "assertQuantityIntegrity",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "ncr",
      severity: "warn",
      category: "data",
      message: `Quantity breakdown not visible for ${workOrderCode}`,
      url: page.url(),
      repairHint: "Verify WO detail panel surfaces qty_completed/scrap/rework.",
    });
  }
  return hasQtyBreakdown;
}
