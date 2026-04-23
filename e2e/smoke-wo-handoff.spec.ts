import { test } from "@playwright/test";
import { seedFixture, type SeedScenario } from "./helpers/seed";
import { login } from "./helpers/auth";
import { flushGapReport, getGaps, recordGap } from "./helpers/gapReport";
import {
  openWorkOrder,
  startWorkOrder,
  pauseWorkOrder,
  resumeWorkOrder,
  completeWorkOrder,
  assertWorkOrderState,
} from "./flows/workOrder";
import {
  openHandoffPage,
  startNewHandoff,
  assertStationStatus,
} from "./flows/handoff";

/**
 * Composable WO + Handoff smoke test.
 *
 * Runs the full lifecycle for one or more scenarios (controlled via
 * E2E_SMOKE_SCENARIOS, comma-separated). Defaults to "wo_basic".
 *
 * On completion, writes:
 *   - e2e-gap-report.json    (aggregate)
 *   - e2e-gap-report.ndjson  (stream)
 *
 * Override path with E2E_GAP_REPORT_PATH=/tmp/my-report
 *
 * Usage from another repo:
 *   E2E_BASE_URL=https://other.app E2E_SEED_SECRET=... \
 *     bun run test:e2e -- e2e/smoke-wo-handoff.spec.ts
 */
const SCENARIOS = (process.env.E2E_SMOKE_SCENARIOS ?? "wo_basic")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean) as SeedScenario[];

test.describe("WO + Handoff smoke (composable)", () => {
  test.afterAll(() => {
    flushGapReport();
    const gaps = getGaps();
    const errors = gaps.filter((g) => g.severity === "error").length;
    // eslint-disable-next-line no-console
    console.log(
      `[SMOKE] Recorded ${gaps.length} gap(s) — ${errors} error(s). Report: e2e-gap-report.json`,
    );
  });

  for (const scenario of SCENARIOS) {
    test(`scenario: ${scenario}`, async ({ page }) => {
      const ctx = { spec: "smoke-wo-handoff", scenario };
      const fx = await seedFixture(scenario);

      await test.step("login operator", async () => {
        try {
          await login(page, fx.operator.email, fx.operator.password);
        } catch (e) {
          recordGap({
            ...ctx,
            step: "login",
            severity: "error",
            message: `Login failed: ${(e as Error).message}`,
          });
          throw e;
        }
      });

      await test.step("station status visible", async () => {
        await assertStationStatus(page, fx, ctx);
      });

      await test.step("WO lifecycle", async () => {
        await openWorkOrder(page, fx, ctx);
        await startWorkOrder(page, ctx);
        await pauseWorkOrder(page, ctx);
        await resumeWorkOrder(page, ctx);
        await assertWorkOrderState(page, /running|in progress|started/i, ctx);
        await completeWorkOrder(page, ctx);
      });

      await test.step("handoff flow", async () => {
        const opened = await openHandoffPage(page, ctx);
        if (opened) await startNewHandoff(page, ctx);
      });
    });
  }
});
