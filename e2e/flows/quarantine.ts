import type { Page } from "@playwright/test";
import { recordGap } from "../helpers/gapReport";

interface FlowCtx {
  spec: string;
  scenario?: string;
  role?: string;
  pathway?: string;
}

export async function openQuarantine(page: Page, ctx: FlowCtx) {
  await page.goto("/quarantine").catch(() => {});
  const visible = await page
    .getByRole("heading", { name: /quarantine/i })
    .first()
    .isVisible()
    .catch(() => false);
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "openQuarantine",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "quarantine",
      severity: "error",
      category: "missing_ui",
      message: "Quarantine page heading missing",
      url: page.url(),
      repairHint: "Confirm /quarantine route mounted in App.tsx.",
    });
  }
  return visible;
}

export async function findQuarantinedWO(
  page: Page,
  ctx: FlowCtx,
  workOrderCode: string,
) {
  const row = page.getByText(new RegExp(workOrderCode, "i")).first();
  const visible = await row.isVisible().catch(() => false);
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "findQuarantinedWO",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "quarantine",
      severity: "warn",
      category: "data",
      message: `WO ${workOrderCode} not visible in quarantine list`,
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
