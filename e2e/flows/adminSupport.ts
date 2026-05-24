import type { Page } from "@playwright/test";
import { recordGap } from "../helpers/gapReport";

interface FlowCtx {
  spec: string;
  scenario?: string;
  role?: string;
  pathway?: string;
}

/** Navigate to /admin and click a desktop tab trigger by its value. */
export async function openAdminTab(page: Page, tabValue: string) {
  await page.goto("/admin", { waitUntil: "domcontentloaded" });
  // The desktop tabs are `role=tab` triggers. Try clicking by name fallback.
  const trigger = page
    .locator(`[data-state], [role="tab"]`)
    .filter({ has: page.locator(`[data-value="${tabValue}"]`) })
    .first();
  if (await trigger.isVisible().catch(() => false)) {
    await trigger.click();
  } else {
    // Fallback: find tab trigger whose inner text matches the data-value slug
    const tabs = page.getByRole("tab");
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      const t = tabs.nth(i);
      const v = await t.getAttribute("data-value").catch(() => null);
      if (v === tabValue) {
        await t.click();
        break;
      }
    }
  }
}

/** Assert the Policy Acceptance Ledger tab renders its key heading. */
export async function assertPolicyLedger(page: Page, ctx: FlowCtx) {
  await openAdminTab(page, "policy-acceptance");
  const heading = page
    .getByRole("heading", { name: /policy acceptance|ledger/i })
    .first();
  const card = page.locator('[data-testid="policy-ledger"], .policy-ledger').first();
  const visible =
    (await heading.isVisible().catch(() => false)) ||
    (await card.isVisible().catch(() => false)) ||
    (await page.getByText(/policy version|version label/i).first().isVisible().catch(() => false));
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "assertPolicyLedger",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "admin",
      severity: "error",
      category: "missing_ui",
      message: "Policy Acceptance Ledger tab did not render",
      url: page.url(),
      repairHint: "Check PolicyAcceptanceLedger.tsx and Admin.tsx policy-acceptance TabsContent.",
    });
  }
  return visible;
}

/** Assert the Billing Back-Office tab renders its key heading. */
export async function assertBillingOps(page: Page, ctx: FlowCtx) {
  await openAdminTab(page, "billing-ops");
  const visible = await page
    .getByRole("heading", { name: /billing|back.?office/i })
    .first()
    .isVisible()
    .catch(() => false) ||
    await page.getByText(/billing event|billing note/i).first().isVisible().catch(() => false);
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "assertBillingOps",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "admin",
      severity: "error",
      category: "missing_ui",
      message: "Billing Back-Office tab did not render",
      url: page.url(),
      repairHint: "Check BillingBackOffice.tsx and Admin.tsx billing-ops TabsContent.",
    });
  }
  return visible;
}

/** Assert the Email Operations Center tab renders its key UI. */
export async function assertEmailOps(page: Page, ctx: FlowCtx) {
  await openAdminTab(page, "email-ops");
  const visible =
    (await page.getByRole("heading", { name: /email|template|suppression/i }).first().isVisible().catch(() => false)) ||
    (await page.getByText(/email template|suppression|delivery event/i).first().isVisible().catch(() => false));
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "assertEmailOps",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "admin",
      severity: "error",
      category: "missing_ui",
      message: "Email Operations Center tab did not render",
      url: page.url(),
      repairHint: "Check EmailOperationsCenter.tsx and Admin.tsx email-ops TabsContent.",
    });
  }
  return visible;
}

/** Assert the Audit Log tab renders the filter controls. */
export async function assertAuditLog(page: Page, ctx: FlowCtx) {
  await openAdminTab(page, "audit-log");
  const filterVisible =
    (await page.getByRole("combobox").first().isVisible().catch(() => false)) ||
    (await page.getByPlaceholder(/search|filter/i).first().isVisible().catch(() => false)) ||
    (await page.getByText(/audit|event_action|actor/i).first().isVisible().catch(() => false));
  if (!filterVisible) {
    recordGap({
      spec: ctx.spec,
      step: "assertAuditLog",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "admin",
      severity: "error",
      category: "missing_ui",
      message: "Admin Audit Log tab did not render filter controls",
      url: page.url(),
      repairHint: "Check AdminAuditLog.tsx and Admin.tsx audit-log TabsContent.",
    });
  }
  return filterVisible;
}

/** Assert the Talent Governance tab renders with its sub-tabs. */
export async function assertTalentGovernance(page: Page, ctx: FlowCtx) {
  await openAdminTab(page, "talent-governance");
  const visible =
    (await page.getByRole("tab", { name: /reports|limits/i }).first().isVisible().catch(() => false)) ||
    (await page.getByText(/abuse report|messaging limit|recruiter/i).first().isVisible().catch(() => false));
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "assertTalentGovernance",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "admin",
      severity: "error",
      category: "missing_ui",
      message: "Talent Governance tab did not render sub-tabs",
      url: page.url(),
      repairHint: "Check TalentGovernance.tsx and Admin.tsx talent-governance TabsContent.",
    });
  }
  return visible;
}

/** Assert the Executive Overview tab renders KPI stat cards. */
export async function assertExecutiveOverview(page: Page, ctx: FlowCtx) {
  await openAdminTab(page, "executive-overview");
  const visible =
    (await page.getByRole("heading", { name: /executive|platform health|overview/i }).first().isVisible().catch(() => false)) ||
    (await page.getByText(/health score|at.?risk|org count/i).first().isVisible().catch(() => false));
  if (!visible) {
    recordGap({
      spec: ctx.spec,
      step: "assertExecutiveOverview",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "admin",
      severity: "error",
      category: "missing_ui",
      message: "Executive Overview tab did not render KPI cards",
      url: page.url(),
      repairHint: "Check ExecutiveOverview.tsx and Admin.tsx executive-overview TabsContent.",
    });
  }
  return visible;
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
