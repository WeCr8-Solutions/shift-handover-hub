import { test } from "@playwright/test";
import { seedFixture } from "./helpers/seed";
import { login } from "./helpers/auth";
import {
  flushGapReport,
  getGaps,
  recordGap,
} from "./helpers/gapReport";
import { ROLE_MATRIX, type Pathway, type Role } from "./helpers/roleMatrix";
import { auditRoutes } from "./helpers/navAudit";

import {
  openWorkOrder,
  startWorkOrder,
  pauseWorkOrder,
  resumeWorkOrder,
  completeWorkOrder,
} from "./flows/workOrder";
import { openHandoffPage, startNewHandoff } from "./flows/handoff";
import { openNcrForm, submitNcr, assertQuantityIntegrity } from "./flows/ncr";
import { openQuarantine, findQuarantinedWO } from "./flows/quarantine";
import { openBell, assertHasNotification } from "./flows/notifications";
import { passToNextStep } from "./flows/routing";
import { assertEntitlementWall } from "./flows/billing";
import { visitPublicTalent, assertContactPrivacy } from "./flows/talent";
import { openAdminUsers } from "./flows/adminSupport";

/**
 * Modular smoke matrix.
 *
 * Iterates ROLES × PATHWAYS, records every dead-end / perf miss / missing
 * UI element to e2e-gap-report.json. Each (role,pathway) cell is a discrete
 * Playwright `test()` so the HTML report renders a clear pass/fail grid.
 *
 * Env knobs:
 *   E2E_SMOKE_ROLES=operator,supervisor,org_admin,platform_admin,talent
 *   E2E_SMOKE_PATHWAYS=wo,routing,ncr,quarantine,notifications,nav,talent,billing,admin
 *   E2E_SMOKE_SCENARIO=wo_basic   (single scenario shared across cells)
 */
const ROLES = (process.env.E2E_SMOKE_ROLES ?? "operator,supervisor")
  .split(",")
  .map((s) => s.trim() as Role)
  .filter(Boolean);

const PATHWAYS = (process.env.E2E_SMOKE_PATHWAYS ??
  "wo,handoff,ncr,quarantine,notifications,nav,talent,billing,admin,routing")
  .split(",")
  .map((s) => s.trim() as Pathway)
  .filter(Boolean);

test.describe("Smoke matrix", () => {
  test.afterAll(() => {
    flushGapReport();
    const gaps = getGaps();
    const errors = gaps.filter((g) => g.severity === "error").length;
    const warns = gaps.filter((g) => g.severity === "warn").length;
    // eslint-disable-next-line no-console
    console.log(
      `[SMOKE-MATRIX] ${gaps.length} gap(s) — ${errors} error / ${warns} warn. See e2e-gap-report.json`,
    );
  });

  for (const role of ROLES) {
    const entry = ROLE_MATRIX[role];
    if (!entry) continue;

    for (const pathway of PATHWAYS) {
      if (!entry.pathways.includes(pathway) && pathway !== "nav") continue;

      test(`${role} › ${pathway}`, async ({ page }) => {
        const scenario = entry.scenarios[0] ?? "wo_basic";
        const ctx = {
          spec: "smoke-matrix",
          scenario,
          role,
          pathway,
        };

        const fx = await seedFixture(scenario);
        const creds =
          entry.loginAs === "admin" ? fx.admin : fx.operator;

        try {
          await login(page, creds.email, creds.password);
        } catch (e) {
          recordGap({
            ...ctx,
            step: "login",
            severity: "error",
            category: "auth",
            message: `Login failed: ${(e as Error).message}`,
          });
          return;
        }

        switch (pathway) {
          case "nav":
            await auditRoutes(page, entry.navRoutes, ctx);
            break;
          case "wo":
            await openWorkOrder(page, fx, ctx);
            await startWorkOrder(page, ctx);
            await pauseWorkOrder(page, ctx);
            await resumeWorkOrder(page, ctx);
            await completeWorkOrder(page, ctx);
            break;
          case "handoff" as Pathway:
            if (await openHandoffPage(page, ctx)) {
              await startNewHandoff(page, ctx);
            }
            break;
          case "ncr":
            if (await openNcrForm(page, ctx)) {
              await submitNcr(page, ctx, { qty: 1, reason: "smoke" });
              await assertQuantityIntegrity(page, ctx, fx.work_order.code);
            }
            break;
          case "quarantine":
            if (await openQuarantine(page, ctx)) {
              await findQuarantinedWO(page, ctx, fx.work_order.code);
            }
            break;
          case "notifications":
            await page.goto("/dashboard").catch(() => {});
            if (await openBell(page, ctx)) {
              await assertHasNotification(page, ctx, /handoff|ncr|work order|alert/i);
            }
            break;
          case "routing":
            await passToNextStep(page, ctx, fx.work_order.code);
            break;
          case "talent":
            if (await visitPublicTalent(page, ctx, "demo-operator")) {
              await assertContactPrivacy(page, ctx);
            }
            break;
          case "billing":
            await assertEntitlementWall(page, ctx, "/talent/search");
            await assertEntitlementWall(page, ctx, "/oap/employer");
            break;
          case "admin":
            await openAdminUsers(page, ctx);
            break;
          default:
            recordGap({
              ...ctx,
              step: "dispatch",
              severity: "info",
              category: "other",
              message: `No flow wired for pathway '${pathway}'`,
            });
        }
      });
    }
  }
});
