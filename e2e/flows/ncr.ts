import type { Page } from "@playwright/test";
import { recordGap } from "../helpers/gapReport";
import { withBudget, BUDGETS } from "../helpers/perfBudget";

interface FlowCtx {
  spec: string;
  scenario?: string;
  role?: string;
  pathway?: string;
}

/**
 * Open NCR creation from a work order context. Records dead-ends rather than throwing.
 */
export async function openNcrForm(page: Page, ctx: FlowCtx) {
  await page.goto("/ncr").catch(() => {});
  const trigger = page
    .getByRole("button", { name: /new ncr|create ncr|report ncr|non.?conformance/i })
    .first();
  const visible = await trigger.isVisible().catch(() => false);
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "openNcrForm",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "ncr",
      severity: "error",
      category: "missing_ui",
      message: "No 'New NCR' trigger on /ncr",
      url: page.url(),
      repairHint: "Verify NCR list page renders create CTA for current role.",
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
    if (!(await qty.isVisible().catch(() => false))) {
      recordGap({
        spec: ctx.spec,
        step: "submitNcr",
        scenario: ctx.scenario,
        role: ctx.role,
        pathway: "ncr",
        severity: "error",
        category: "missing_ui",
        message: "NCR form missing quantity field",
        url: page.url(),
      });
      return false;
    }
    await qty.fill(String(data.qty));
    await reason.fill(data.reason).catch(() => {});
    const submit = page
      .getByRole("button", { name: /submit|create|save/i })
      .first();
    if (!(await submit.isVisible().catch(() => false))) {
      recordGap({
        spec: ctx.spec,
        step: "submitNcr",
        scenario: ctx.scenario,
        role: ctx.role,
        pathway: "ncr",
        severity: "error",
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
