import { expect, type Page } from "@playwright/test";
import type { SeedFixture } from "../helpers/seed";
import { recordGap } from "../helpers/gapReport";

/**
 * Reusable work-order lifecycle flow helpers.
 * Every helper is **non-throwing for missing UI** — instead it records a gap
 * so the smoke test can continue and report all issues at the end.
 */

interface FlowCtx {
  spec: string;
  scenario?: string;
}

async function tryClick(
  page: Page,
  pattern: RegExp,
  ctx: FlowCtx,
  step: string,
  required = false,
): Promise<boolean> {
  const btn = page.getByRole("button", { name: pattern }).first();
  const visible = await btn.isVisible().catch(() => false);
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step,
      scenario: ctx.scenario,
      severity: required ? "error" : "warn",
      message: `Button matching ${pattern} not visible`,
      url: page.url(),
      selector: pattern.toString(),
    });
    return false;
  }
  await btn.click();
  return true;
}

export async function openWorkOrder(
  page: Page,
  fx: SeedFixture,
  ctx: FlowCtx,
) {
  await page.goto(`/queue?item=${fx.work_order.id}`);
  const visible = await page
    .getByText(new RegExp(fx.work_order.code, "i"))
    .first()
    .isVisible()
    .catch(() => false);
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "openWorkOrder",
      scenario: ctx.scenario,
      severity: "error",
      message: `WO ${fx.work_order.code} not found on /queue deep link`,
      url: page.url(),
    });
  }
}

export async function startWorkOrder(page: Page, ctx: FlowCtx) {
  return tryClick(page, /start|begin work|check in/i, ctx, "startWorkOrder", true);
}

export async function pauseWorkOrder(page: Page, ctx: FlowCtx) {
  return tryClick(page, /pause|hold|on hold/i, ctx, "pauseWorkOrder");
}

export async function resumeWorkOrder(page: Page, ctx: FlowCtx) {
  return tryClick(page, /resume|continue|restart/i, ctx, "resumeWorkOrder");
}

export async function completeWorkOrder(page: Page, ctx: FlowCtx) {
  const btn = page
    .getByRole("button", { name: /complete|finish|mark complete/i })
    .first();
  const ok = await btn.isVisible().catch(() => false);
  if (!ok) {
    recordGap({
      spec: ctx.spec,
      step: "completeWorkOrder",
      scenario: ctx.scenario,
      severity: "error",
      message: "Complete button not visible after lifecycle",
      url: page.url(),
    });
    return false;
  }
  await expect(btn).toBeVisible();
  return true;
}

export async function assertWorkOrderState(
  page: Page,
  expectedPattern: RegExp,
  ctx: FlowCtx,
) {
  const found = await page
    .getByText(expectedPattern)
    .first()
    .isVisible()
    .catch(() => false);
  if (!found) {
    recordGap({
      spec: ctx.spec,
      step: "assertWorkOrderState",
      scenario: ctx.scenario,
      severity: "warn",
      message: `Expected state matching ${expectedPattern} not visible`,
      url: page.url(),
    });
  }
  return found;
}
