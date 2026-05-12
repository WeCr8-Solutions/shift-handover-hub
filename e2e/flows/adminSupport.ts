import type { Page } from "@playwright/test";
import { recordGap } from "../helpers/gapReport";

interface FlowCtx {
  spec: string;
  scenario?: string;
  role?: string;
  pathway?: string;
}

export async function openAdminUsers(page: Page, ctx: FlowCtx) {
  await page.goto("/admin/users").catch(() => {});
  const heading = page
    .getByRole("heading", { name: /users|members/i })
    .first();
  const visible = await heading.isVisible().catch(() => false);
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "openAdminUsers",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "admin",
      severity: "error",
      category: "missing_ui",
      message: "Admin users page did not render",
      url: page.url(),
    });
  }
  return visible;
}

export async function startActAs(page: Page, ctx: FlowCtx, targetEmail: string) {
  const search = page.getByPlaceholder(/search|email|user/i).first();
  if (await search.isVisible().catch(() => false)) {
    await search.fill(targetEmail);
  }
  const actBtn = page.getByRole("button", { name: /act as|impersonate/i }).first();
  if (!(await actBtn.isVisible().catch(() => false))) {
    recordGap({
      spec: ctx.spec,
      step: "startActAs",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "admin",
      severity: "warn",
      category: "missing_ui",
      message: "Act-As button missing for target user",
      url: page.url(),
      repairHint: "Check ActAsContext + admin user-row actions.",
    });
    return false;
  }
  await actBtn.click();
  return true;
}
