import { type Page } from "@playwright/test";
import type { SeedFixture } from "../helpers/seed";
import { recordGap } from "../helpers/gapReport";

interface FlowCtx {
  spec: string;
  scenario?: string;
  role?: string;
  pathway?: string;
}

/**
 * Handoff is NOT its own route — it lives on the dashboard's active station card
 * and inside the work-order drawer. Try both entry points and record dead-ends.
 */
export async function openHandoffPage(page: Page, ctx: FlowCtx) {
  await page.goto("/dashboard").catch(() => {});
  // Look for any handoff CTA on the dashboard / station cards.
  const trigger = page
    .locator(
      '[data-testid="new-handoff"], button:has-text("New Handoff"), button:has-text("Start Handoff"), button:has-text("Submit Handoff")',
    )
    .first();
  const visible = await trigger.isVisible({ timeout: 5000 }).catch(() => false);
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "openHandoffPage",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "handoff" as never,
      severity: "warn",
      category: "missing_ui",
      message: "No 'New Handoff' CTA on /dashboard station cards",
      url: page.url(),
      repairHint:
        "Add data-testid=new-handoff to station-card handoff trigger.",
    });
  }
  return visible;
}

export async function startNewHandoff(page: Page, ctx: FlowCtx) {
  const btn = page
    .locator(
      '[data-testid="new-handoff"], button:has-text("New Handoff"), button:has-text("Start Handoff")',
    )
    .first();
  if (!(await btn.isVisible().catch(() => false))) {
    recordGap({
      spec: ctx.spec,
      step: "startNewHandoff",
      scenario: ctx.scenario,
      severity: "warn",
      category: "missing_ui",
      message: "Cannot start new handoff — trigger missing",
      url: page.url(),
    });
    return false;
  }
  await btn.click();
  const summary = page
    .getByLabel(/handoff summary|summary|notes/i)
    .or(page.getByPlaceholder(/summary|what did you do/i))
    .first();
  const formed = await summary.isVisible({ timeout: 4000 }).catch(() => false);
  if (!formed) {
    recordGap({
      spec: ctx.spec,
      step: "startNewHandoff",
      scenario: ctx.scenario,
      severity: "warn",
      category: "missing_ui",
      message: "Handoff form did not mount (no summary field)",
      url: page.url(),
    });
  }
  return formed;
}

export async function assertStationStatus(
  page: Page,
  fx: SeedFixture,
  ctx: FlowCtx,
) {
  await page.goto("/dashboard");
  const visible = await page
    .getByText(new RegExp(fx.station.name, "i"))
    .first()
    .isVisible()
    .catch(() => false);
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "assertStationStatus",
      scenario: ctx.scenario,
      severity: "warn",
      category: "data",
      message: `Station ${fx.station.name} not visible on dashboard`,
      url: page.url(),
    });
  }
  return visible;
}
