import type { Page } from "@playwright/test";
import { recordGap } from "../helpers/gapReport";

interface FlowCtx {
  spec: string;
  scenario?: string;
  role?: string;
  pathway?: string;
}

/**
 * Advance a multi-step routed work order via the UI. Records gaps when the
 * "next operation" CTA is missing, blocked, or fails to advance state.
 */
export async function passToNextStep(
  page: Page,
  ctx: FlowCtx,
  workOrderCode: string,
) {
  await page.goto(`/queue?item=${workOrderCode}`).catch(() => {});
  const next = page
    .getByRole("button", { name: /next (op|step|operation)|advance|hand off/i })
    .first();
  if (!(await next.isVisible().catch(() => false))) {
    recordGap({
      spec: ctx.spec,
      step: "passToNextStep",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "routing",
      severity: "error",
      category: "missing_ui",
      message: `'Next operation' CTA not visible for ${workOrderCode}`,
      url: page.url(),
      repairHint:
        "Verify pass_work_order_to_next_step RPC binding in WO detail.",
    });
    return false;
  }
  await next.click();
  return true;
}

export async function approveRoutingProposal(page: Page, ctx: FlowCtx) {
  const approve = page
    .getByRole("button", { name: /approve (proposal|change)|apply routing/i })
    .first();
  if (!(await approve.isVisible().catch(() => false))) {
    recordGap({
      spec: ctx.spec,
      step: "approveRoutingProposal",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "routing",
      severity: "info",
      category: "missing_ui",
      message: "No pending routing proposal to approve (may be expected)",
      url: page.url(),
    });
    return false;
  }
  await approve.click();
  return true;
}
