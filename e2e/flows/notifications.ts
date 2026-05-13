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
 * Open the notification bell and assert at least one notification shape renders.
 * Captures both a missing bell (dead-end) and an empty drawer when seed data
 * should have produced an event.
 */
export async function openBell(page: Page, ctx: FlowCtx) {
  return withBudget(
    "notificationBadge",
    BUDGETS.notificationBadge,
    { ...ctx, page },
    async () => {
      const bell = page
        .locator('[data-testid="notification-bell"]')
        .or(page.getByRole("button", { name: /notification|bell|alerts/i }))
        .first();
      if (!(await bell.isVisible({ timeout: 4000 }).catch(() => false))) {
        recordGap({
          spec: ctx.spec,
          step: "openBell",
          scenario: ctx.scenario,
          role: ctx.role,
          pathway: "notifications",
          severity: "error",
          category: "missing_ui",
          message: "Notification bell not visible in header",
          url: page.url(),
          repairHint:
            "Check Header/AppShell — NotificationBell render condition.",
        });
        return false;
      }
      await bell.click();
      const panel = page
        .getByRole("dialog")
        .or(page.locator("[data-notification-panel]"))
        .first();
      const opened = await panel.isVisible().catch(() => false);
      if (!opened) {
        recordGap({
          spec: ctx.spec,
          step: "openBell",
          scenario: ctx.scenario,
          role: ctx.role,
          pathway: "notifications",
          severity: "warn",
          category: "missing_ui",
          message: "Notification panel did not open after bell click",
          url: page.url(),
        });
      }
      return opened;
    },
  );
}

export async function assertHasNotification(
  page: Page,
  ctx: FlowCtx,
  matcher: RegExp,
) {
  const found = await page.getByText(matcher).first().isVisible().catch(() => false);
  if (!found) {
    recordGap({
      spec: ctx.spec,
      step: "assertHasNotification",
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: "notifications",
      severity: "warn",
      category: "notification",
      message: `No notification matching ${matcher} after seed events`,
      url: page.url(),
      repairHint:
        "Check process-notifications edge function logs and notification RLS.",
    });
  }
  return found;
}
