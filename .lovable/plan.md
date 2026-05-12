## Goal

Expand `smoke-wo-handoff.spec.ts` into a **modular, scenario-driven smoke matrix** that catches dead-ends, broken routing, and role/use-case gaps across the production app — fast enough to run on every deploy, structured enough to auto-file repair tasks from the gap report.

## Strategy

Keep the existing `flows/` + `gapReport` pattern (non-throwing helpers, JSON-lines output) and grow it into a composable matrix:

```text
┌──────────────────────────────────────────────────────────┐
│  smoke-runner.spec.ts  (matrix driver)                   │
│    iterates: roles × scenarios × pathways                │
└─────────────┬────────────────────────────────────────────┘
              │
   ┌──────────┴──────────────────────────────────────┐
   │ flows/  (modular, idempotent, non-throwing)     │
   │   workOrder · handoff · ncr · quarantine        │
   │   notifications · routing · navigation          │
   │   gca · oap · talent · billing · adminSupport   │
   └──────────┬──────────────────────────────────────┘
              │
   ┌──────────┴────────────────┐
   │ helpers/                  │
   │   seed (scenarios)        │
   │   auth (role login)       │
   │   gapReport (NDJSON)      │
   │   perfBudget (timings)    │
   │   navAudit (dead-ends)    │
   └───────────────────────────┘
```

## Plan

### 1. New flow modules (`e2e/flows/`)

Each exports non-throwing, gap-recording helpers; one file per domain:

- `ncr.ts` — open NCR from WO, attach quantity, route to quarantine, supervisor disposition (rework/scrap/use-as-is), verify quarantine bin assignment, verify WO qty integrity (Completed + Scrap + Rework = Original).
- `quarantine.ts` — list view, lookup by WO, release flow, audit trail visibility.
- `notifications.ts` — trigger handoff/NCR/down-state events, assert bell badge increments, in-app drawer renders, `process-notifications` edge function fires (curl + log assertion).
- `routing.ts` — multi-step WO progression via `pass_work_order_to_next_step`, station handoff between operations, blocked-step recovery, `apply-routing-change` proposal approval (supervisor).
- `navigation.ts` — generic dead-end auditor: visit each role's nav links, assert non-empty content OR a `PermissionAwareEmpty` CTA, never a blank page or "Not Found" without back link.
- `gca.ts` (extend existing spec into a flow) — start bank → answer 3 → save progress → resume → completion gating.
- `oap.ts` (extend) — walkthrough → submit → mentor sign-off → cert issuance.
- `talent.ts` — public profile load, contact-request gate, employer paid-tier wall.
- `billing.ts` — entitlement walls (free → upgrade modal route, never silent fail).
- `adminSupport.ts` — Act-As issuance, `admin_get_user_pipeline_summary` RPC sanity, audit log entry.
- `perf.ts` — wraps a step with a budget (`expect(elapsed).toBeLessThan(budgetMs)`); on miss, records a `warn` gap with the timing.

### 2. Helper additions (`e2e/helpers/`)

- `perfBudget.ts` — `withBudget(label, budgetMs, fn)` — records `{label, elapsed, budget, route}` to the gap report when over budget; aggregates a perf summary at run end.
- `navAudit.ts` — given a role, walks the sidebar/menu (extracted via `page.locator('[data-nav-item]')` or by route list per role) and runs the dead-end check.
- `roleMatrix.ts` — exports `ROLE_MATRIX`: `{ role, login, scenarios[], pathways[] }` so the runner can iterate without if/else trees.
- Extend `seed.ts` scenarios: add `ncr_path`, `recert_lifecycle`, `routed_multi_op`, `notification_storm`, `paid_employer`, `act_as_target`. (Most already declared in `SeedScenario` — wire the seed function to actually provision them.)

### 3. New matrix runner (`e2e/smoke-matrix.spec.ts`)

Replaces nothing — runs alongside `smoke-wo-handoff.spec.ts`. Driven by env:

```bash
E2E_SMOKE_ROLES=operator,supervisor,org_admin,platform_admin,talent
E2E_SMOKE_PATHWAYS=wo,routing,ncr,quarantine,notifications,nav,gca,oap,talent,billing,admin
```

For each `(role, pathway)` cell it: logs in, seeds the matching scenario, runs the flow module, records gaps. One Playwright `test()` per cell so the HTML report shows a clear pass/fail grid.

### 4. Gap report → repair pipeline

- Extend `gapReport.ts` with a `category` field (`dead_end | perf | rls | missing_ui | routing | notification`) and a `repairHint` (the failed selector + suggested file from a small route→file map).
- Add `scripts/gap-report-to-tasks.mjs` that reads `e2e-gap-report.json` and prints/upserts a markdown checklist into `.lovable/smoke-repair-queue.md` grouped by severity + category — gives the agent a ready-made repair backlog.
- Add an npm script: `"smoke:repair-queue": "node scripts/gap-report-to-tasks.mjs"`.

### 5. Performance budgets (initial set)

Recorded as `warn` gaps when exceeded so they never break CI but always surface:

| Pathway | Step | Budget |
|---|---|---|
| WO | open queue → first row visible | 1500 ms |
| WO | start → state=running | 1000 ms |
| Handoff | submit → toast | 1200 ms |
| NCR | submit → quarantine row visible | 1500 ms |
| Notifications | trigger → bell badge increment | 2000 ms |
| Nav | any sidebar click → content paint | 1200 ms |

### 6. CI wiring

- Add `test:smoke:matrix` script in `package.json`.
- Update `.github/workflows/test.yml` to run the matrix on PRs against preview URL with the existing `E2E_SEED_SECRET`, upload `e2e-gap-report.json` + `playwright-report/` as artifacts, and attach the `smoke-repair-queue.md` to the PR as a comment (separate follow-up if not already wired).

### 7. Docs

- Update `e2e/README.md` with the matrix table, env knobs, and the repair-queue workflow.
- Add `.lovable/smoke-matrix-spec.md` documenting each pathway, its seeded scenario, and the role(s) that exercise it — single source of truth for what the smoke covers.

## Deliverables

- 10 new flow modules under `e2e/flows/`
- 3 new helpers (`perfBudget`, `navAudit`, `roleMatrix`)
- New `smoke-matrix.spec.ts` runner
- Extended `seed-e2e` edge function for new scenarios
- `gap-report-to-tasks.mjs` script + `.lovable/smoke-repair-queue.md` output
- Updated `e2e/README.md` and new `.lovable/smoke-matrix-spec.md`
- CI artifact + (optional) PR comment wiring

## Out of scope

- Visual regression / pixel diffs (existing Playwright screenshots on failure are sufficient for now).
- Load testing — these are functional smokes with light perf budgets, not k6/Artillery runs.
- Backend RLS fuzzing (handled by `rls-health` edge function).
