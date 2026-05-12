import type { Page } from "@playwright/test";
import { recordGap } from "./gapReport";

export interface PerfCtx {
  spec: string;
  scenario?: string;
  role?: string;
  pathway?: string;
  page?: Page;
}

/**
 * Run `fn` and record a `perf` gap (severity=warn) when it exceeds budgetMs.
 * Never throws on perf miss — always surfaces as a gap.
 */
export async function withBudget<T>(
  label: string,
  budgetMs: number,
  ctx: PerfCtx,
  fn: () => Promise<T>,
): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const elapsed = Date.now() - start;
  if (elapsed > budgetMs) {
    recordGap({
      spec: ctx.spec,
      step: label,
      scenario: ctx.scenario,
      role: ctx.role,
      pathway: ctx.pathway,
      severity: "warn",
      category: "perf",
      message: `Perf budget exceeded: ${elapsed}ms > ${budgetMs}ms`,
      elapsedMs: elapsed,
      budgetMs,
      url: ctx.page?.url(),
    });
  }
  return result;
}

/** Default budgets used across pathways. Tune from CI signal. */
export const BUDGETS = {
  queueListVisible: 1500,
  workOrderStart: 1000,
  handoffSubmit: 1200,
  ncrSubmit: 1500,
  notificationBadge: 2000,
  navClick: 1200,
  pageLoad: 2500,
} as const;
