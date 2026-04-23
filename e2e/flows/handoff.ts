import { type Page } from "@playwright/test";
import type { SeedFixture } from "../helpers/seed";
import { recordGap } from "../helpers/gapReport";

interface FlowCtx {
  spec: string;
  scenario?: string;
}

export async function openHandoffPage(page: Page, ctx: FlowCtx) {
  await page.goto("/handoff");
  const visible = await page
    .getByRole("button", { name: /new handoff|create|add handoff/i })
    .first()
    .isVisible()
    .catch(() => false);
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "openHandoffPage",
      scenario: ctx.scenario,
      severity: "error",
      message: "No 'New Handoff' button on /handoff",
      url: page.url(),
    });
  }
  return visible;
}

export async function startNewHandoff(page: Page, ctx: FlowCtx) {
  const btn = page
    .getByRole("button", { name: /new handoff|create|add handoff/i })
    .first();
  if (!(await btn.isVisible().catch(() => false))) {
    recordGap({
      spec: ctx.spec,
      step: "startNewHandoff",
      scenario: ctx.scenario,
      severity: "error",
      message: "Cannot start new handoff — trigger missing",
      url: page.url(),
    });
    return false;
  }
  await btn.click();
  // Form should mount with a summary textarea
  const summary = page
    .getByLabel(/handoff summary|summary/i)
    .or(page.getByPlaceholder(/summary/i))
    .first();
  const formed = await summary.isVisible().catch(() => false);
  if (!formed) {
    recordGap({
      spec: ctx.spec,
      step: "startNewHandoff",
      scenario: ctx.scenario,
      severity: "error",
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
      message: `Station ${fx.station.name} not visible on dashboard`,
      url: page.url(),
    });
  }
  return visible;
}
