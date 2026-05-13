# E2E Tests (Playwright)

End-to-end and usability test harness for the Jobline.AI app. Runs real
browser sessions against a deployed environment (Live, Preview, or local
dev) and emits a structured failure report suitable for triage by humans
*or* the Lovable agent.

---

## TL;DR

```bash
# 1. One-time setup
bunx playwright install chromium
export E2E_SEED_SECRET="<value from Lovable Cloud secrets>"
export E2E_ADMIN_PASSWORD="<value from Lovable Cloud secrets>"
export E2E_OPERATOR_PASSWORD="<value from Lovable Cloud secrets>"

# 2. Run the full matrix against Live (smoke + usability + regression)
bun smoke:matrix              # → live
bun smoke:matrix:preview      # → id-preview Lovable URL
bun smoke:matrix:local        # → http://localhost:8080

# 3. Inspect outputs
open playwright-report/index.html   # screenshots + traces
cat e2e-failure-report.md           # human-readable summary
cat e2e-gap-report.json             # machine-readable, every issue
```

If you only want a fast sanity check that requires *no* seed:

```bash
CHROMIUM_BIN=/bin/chromium \
E2E_BASE_URL=https://joblineai.lovable.app \
  bunx playwright test e2e/regression.spec.ts --reporter=line
```

---

## Suites at a glance

| Spec | Needs seed? | What it covers |
|---|---|---|
| `regression.spec.ts` | ❌ | Locks in fixes from `e2e-failure-report.md` (mounted `/work-orders*` routes, NotFound recovery link, mobile-menu `data-testid`). Fast, anonymous-only. |
| `usability-matrix.spec.ts` | ❌ | Public-route health, anon→`/auth` guard bounces, mobile vs desktop viewports, 404 dead-end recovery. Captures console errors / 5xx via `instrumentation.ts`. |
| `smoke-matrix.spec.ts` | ✅ | Role × pathway grid (operator, supervisor) running the full WO + handoff + NCR + routing lifecycle through `e2e/flows/*`. |
| `smoke-wo-handoff.spec.ts` | ✅ | Portable single-flow smoke — point at any deployment with just `E2E_SEED_SECRET`. |
| `operator-daily.spec.ts` | ✅ | Full operator day: auth → dashboard → WO start/pause/resume/complete → handoff → NCR. |
| `org-admin-daily.spec.ts` | ✅ | Org/team/station setup, WO create + routing, invite codes, member mgmt. |
| `combined-team.spec.ts` | ✅ | Sequential admin setup → operator lifecycle → realtime verification. |
| `cert-lifecycle.spec.ts` | ❌ | Public certificate lookup + verify. |
| `gca.spec.ts` / `oap.spec.ts` | ❌ | G-Code Academy + OAP public-facing flows. |
| `status.spec.ts` | ❌ | `/status` page health. |

---

## Directory layout

```
e2e/
├── README.md                    ← you are here
├── *.spec.ts                    ← Playwright specs (top-level)
├── flows/                       ← Reusable user-flow helpers (composable)
│   ├── workOrder.ts             ← startWorkOrder, completeWorkOrder, pauseWorkOrder
│   ├── handoff.ts               ← startNewHandoff, submitHandoff
│   ├── ncr.ts                   ← reportNCR, approveNCR
│   ├── routing.ts               ← passToNextStep, editRouting
│   ├── notifications.ts         ← openNotificationBell, dismissNotification
│   ├── quarantine.ts            ← openQuarantineList
│   ├── talent.ts                ← public talent profile + search assertions
│   ├── billing.ts               ← entitlement-wall checks
│   ├── adminSupport.ts          ← support tools, impersonation flows
│   └── cert.ts                  ← certificate lookup + verification
└── helpers/                     ← Cross-cutting utilities
    ├── seed.ts                  ← seedFixture(scenario) — calls seed-e2e edge fn
    ├── auth.ts                  ← loginAs("operator" | "admin")
    ├── instrumentation.ts       ← Console + network noise filter; gap recorder
    ├── gapReport.ts             ← recordGap() + flushGapReport()
    ├── roleMatrix.ts            ← Role → routes/scenarios/pathways table
    ├── navAudit.ts              ← Click-every-nav-link discovery pass
    └── perfBudget.ts            ← Page-load time budgets
```

---

## How a test run works

1. **Spec calls `seedFixture("wo_basic")`** (or another scenario). This POSTs
   to the `seed-e2e` edge function with the `x-e2e-secret` header. The
   function provisions a fresh org, team, station, users, and WOs and
   returns the IDs needed for deep-linking.
2. **Spec calls `loginAs("operator")`** — fills `/auth` with the seeded
   credentials and waits for `/dashboard`.
3. **`instrumentPage(page, ctx)` is attached** before any navigation so
   every console.error, pageerror, requestfailed, and 5xx response gets
   recorded into `e2e-gap-report.{json,ndjson}` with role/scenario context.
4. **Spec invokes flow helpers** from `e2e/flows/`. Helpers never throw on
   missing UI — they call `recordGap({ severity, category, repairHint, … })`
   and continue, so a single run surfaces *every* dead-end instead of
   stopping at the first.
5. **`test.afterAll(flushGapReport)`** writes the aggregate report to disk.
6. **`scripts/smoke-matrix-run.sh`** (the wrapper used by `bun smoke:matrix`)
   runs the smoke + usability + regression suites in serial workers and
   exits non-zero only if Playwright itself fails — gap-report errors are
   surfaced via the report files for triage.

---

## Required env vars

| Var | Used by | Notes |
|---|---|---|
| `E2E_BASE_URL` | All | Defaults to `http://localhost:8080`. The wrapper script sets this per target. |
| `E2E_SUPABASE_URL` | All seeded specs | Live = `https://dpajcbhfwmfnzgldrveu.supabase.co`. Preview = `https://kgrstnbxqdmadtoankqr.supabase.co`. |
| `E2E_SEED_SECRET` | `seedFixture` | Same value stored in Lovable Cloud secrets — gates the `seed-e2e` edge function. |
| `E2E_ADMIN_PASSWORD` | `loginAs("admin")` | Password for `admin-e2e@jobline.test`. |
| `E2E_OPERATOR_PASSWORD` | `loginAs("operator")` | Password for `operator-e2e@jobline.test`. |
| `CHROMIUM_BIN` | Playwright launch | Optional — set to `/bin/chromium` in CI sandboxes that already have Chromium installed. |
| `E2E_SMOKE_ROLES` | `smoke-matrix` | Comma-separated subset of `operator,supervisor,org_admin,platform_admin,talent`. Default = `operator,supervisor`. |
| `E2E_SMOKE_PATHWAYS` | `smoke-matrix` | Subset of `wo,routing,ncr,quarantine,notifications,nav,gca,oap,talent,billing,admin,handoff`. Default = all. |
| `E2E_SMOKE_SCENARIO` | `smoke-matrix` | One of `wo_basic`, `wo_routed`, `handoff_chain`, `ncr_path`. Default = `wo_basic`. |
| `E2E_USABILITY_BASE_PUBLIC` | `usability-matrix` | Comma-separated public route list. Defaults to the marketing surface. |
| `E2E_USABILITY_BASE_GUARDED` | `usability-matrix` | Comma-separated guarded route list. **Must mirror `src/App.tsx` mounted routes.** |
| `E2E_GAP_REPORT_PATH` | `gapReport` | Override output path. Default: `e2e-gap-report.{json,ndjson}` in the repo root. |
| `WORKERS` | wrapper script | Defaults to `1` (serial) — needed so seeded fixtures don't collide. |
| `SUITES` | wrapper script | Override which spec(s) to run. Default = `e2e/smoke-matrix.spec.ts e2e/usability-matrix.spec.ts e2e/regression.spec.ts`. |

---

## Common commands

```bash
# Full default matrix against Live
bun smoke:matrix

# Same against Preview / Local
bun smoke:matrix:preview
bun smoke:matrix:local

# Just one suite
SUITES=e2e/regression.spec.ts        bash scripts/smoke-matrix-run.sh live
SUITES=e2e/usability-matrix.spec.ts  bash scripts/smoke-matrix-run.sh live

# Limit smoke matrix to one role × one pathway
E2E_SMOKE_ROLES=operator E2E_SMOKE_PATHWAYS=wo bun smoke:matrix

# Run against any URL ad-hoc (no seed needed for regression/usability)
CHROMIUM_BIN=/bin/chromium \
E2E_BASE_URL=https://joblineai.lovable.app \
  bunx playwright test e2e/regression.spec.ts --reporter=line

# Open the HTML report
bunx playwright show-report

# Convert the gap report into a Lovable repair queue
bun smoke:repair-queue   # → .lovable/smoke-repair-queue.md
```

---

## Outputs

| File | Format | Purpose |
|---|---|---|
| `playwright-report/` | HTML | Standard Playwright report — screenshots + per-step traces. Open with `bunx playwright show-report`. |
| `e2e-gap-report.json` | JSON | Aggregate of every gap (one record per missing element / failed assertion / console error / 5xx). |
| `e2e-gap-report.ndjson` | NDJSON | Streaming line-delimited variant — easier to grep / pipe in CI. |
| `e2e-gap-summary.md` | Markdown | Human-readable summary grouped by severity (`error` / `warn` / `info`). |
| `e2e-failure-report.md` | Markdown | Curated triage report — what's fixed, what's open, verification steps. **Updated by the agent after each remediation pass.** |
| `.lovable/smoke-repair-queue.md` | Markdown | Checklist generated by `bun smoke:repair-queue` for the Lovable agent to pick up. |

### Gap-report record shape

```jsonc
{
  "spec": "smoke-matrix",
  "role": "operator",
  "pathway": "wo",
  "scenario": "wo_basic",
  "step": "wo-start",
  "severity": "error",            // "error" | "warn" | "info"
  "category": "missing_ui",        // "missing_ui" | "auth" | "rls" | "data" | "routing" | "perf" | "dead_end" | "other"
  "message": "Start Work button not found within 5s",
  "url": "https://.../queue?item=…",
  "repairHint": "Add data-testid=\"wo-start\" to QueueItemActions Start button",
  "elapsedMs": 5012
}
```

---

## Stable selectors (contract between app & E2E)

These `data-testid` attributes are the contract between the app and the E2E
harness. **Don't rename them** without updating the matching helper.

| Selector | Lives in | Used by |
|---|---|---|
| `not-found` / `not-found-home` / `not-found-dashboard` | `src/pages/NotFound.tsx` | `regression.spec.ts`, `usability-matrix.spec.ts` |
| `mobile-menu` | `src/components/Header.tsx`, `src/components/marketing/MarketingNav.tsx` | `usability-matrix`, `regression` |
| `notification-bell` | `src/components/Header.tsx` | `flows/notifications.ts` |
| `queue-page` + `data-deep-link-state` (`none\|opened\|loading\|not-found`) + `data-deep-link-item` | `src/pages/Queue.tsx` | `flows/workOrder.ts`, deep-link assertions |
| `wo-drawer` (+ `data-wo-id`, `data-wo-code`) | `QueueItemDetailDialog` | All WO-flow helpers |
| `wo-start` / `wo-pause` / `wo-complete` / `wo-next-op` / `wo-edit-routing` | `QueueItemActions` | `flows/workOrder.ts`, `flows/routing.ts` |
| `ncr-create` | `QueueItemActions` (in-drawer) | `flows/ncr.ts` |
| `new-handoff` | `QueueItemActions` (in-drawer) | `flows/handoff.ts` |
| `quarantine-list` | *(pending — NCR/Quality tab on `Queue.tsx`)* | `flows/quarantine.ts` |
| `wo-action-bar` | `QueueItemActions` | Smoke checks |

---

## Seed fixture (`seed-e2e` edge function)

Gated by the `x-e2e-secret` header. Calling `seedFixture(scenario)`:

1. Resets / re-creates the `e2e-shop` org, day shift team, and `E2E-CNC-01` station.
2. Re-creates `admin-e2e@jobline.test` (org owner + supervisor) and
   `operator-e2e@jobline.test` (org member + operator) and inserts the
   `organization_members` rows so RLS lets them see seeded data.
3. Inserts the scenario-specific WOs / routing / NCR rows and resets WO state to `queued`.
4. Returns `{ organization, admin, operator, work_order, station, … }` so
   the spec can deep-link straight to the seeded UUIDs.

**Scenarios:**

| Scenario | Provisions |
|---|---|
| `wo_basic` | One WO, one operator, no routing |
| `wo_routed` | One WO with multi-step routing for `pass_work_order_to_next_step` |
| `handoff_chain` | Two operators across two shifts for handoff hand-off |
| `ncr_path` | WO with quantity discrepancy ready to spawn an NCR |

> **Heads up:** if `seed-e2e` ever loses the `organization_members` insert,
> deep links like `/queue?item=<uuid>` will silently fail because RLS
> blocks the seeded user. The Queue page now exposes
> `data-deep-link-state="not-found"` so this case is detectable instead of
> silent — see `e2e-failure-report.md` § CF-2.

---

## Noise filtering (`helpers/instrumentation.ts`)

Every entry in `NOISE_PATTERNS` / `NETWORK_ABORT_PATTERNS` has a documented
reason — never add a pattern just to silence a real failure. Currently
filtered:

- Vite HMR pings, `@vite/client`, hot-update assets
- Third-party analytics: Google Tag Manager, GA, DoubleClick, Sentry,
  PostHog, Hotjar, FullStory, Datadog, Lovable's `cdn.gpteng.co`
- React DevTools nag and Lovable's `RESET_BLANK_CHECK` postMessage
- `TypeError: Failed to fetch` / `AbortError` — React Query cancels
  in-flight queries on unmount/navigation
- `ResizeObserver loop limit exceeded` — browser quirk, never an app bug
- Network aborts: `ERR_ABORTED`, `NS_BINDING_ABORTED`, `ERR_CANCELED`

Real 5xx responses, real `pageerror` exceptions, and non-abort
`requestfailed` events are still recorded with full context.

---

## Adding a new spec

1. **Add stable `data-testid` selectors** to the UI you want to test, then
   document them in the *Stable selectors* table above.
2. **Pick or extend a flow helper** in `e2e/flows/`. Helpers must:
   - Take `(page: Page, ctx: { spec, role, scenario, pathway })` as args.
   - Use `instrumentPage` for noise filtering.
   - Call `recordGap(...)` instead of throwing on missing UI.
3. **Add the spec to `e2e/`** and import helpers as needed.
4. **Add it to the wrapper script** by extending `SUITES` if it should run
   in the default matrix.
5. **Update this README's *Suites at a glance* table.**
6. **Run** `bun smoke:matrix` and verify the new spec appears in the
   report with the expected role/pathway/scenario context.

---

## CI integration

The wrapper script is CI-friendly:

```bash
- name: Run E2E matrix
  env:
    CHROMIUM_BIN: /usr/bin/chromium
    E2E_SEED_SECRET: ${{ secrets.E2E_SEED_SECRET }}
    E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
    E2E_OPERATOR_PASSWORD: ${{ secrets.E2E_OPERATOR_PASSWORD }}
  run: bash scripts/smoke-matrix-run.sh live

- name: Upload Playwright report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: |
      playwright-report/
      e2e-gap-report.json
      e2e-gap-summary.md
      e2e-failure-report.md
```

The script exits non-zero only if Playwright itself fails or a `severity:
"error"` gap is recorded. `warn` / `info` gaps surface in the report but
don't fail the build — review them in `e2e-gap-summary.md`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `No tests found` | Wrapper passing target arg to Playwright as a filter | Already handled — `scripts/smoke-matrix-run.sh` does `shift`. |
| Every guarded route reports "rendered NotFound" | App.tsx not republished after route mount | Republish Lovable, then re-run. |
| Drawer never opens on `/queue?item=<uuid>` | `seed-e2e` skipped `organization_members` for the seeded users | Re-deploy `supabase/functions/seed-e2e` and confirm membership rows. |
| Hundreds of "TypeError: Failed to fetch" | React Query cancellations on unmount | Already filtered in `instrumentation.ts`. If you see new ones, add a documented pattern. |
| `ECONNREFUSED localhost:8080` | Local target with no dev server | Start `bun dev` first, or use `bun smoke:matrix` against Live. |
| Edge function 401 with seed | Secret mismatch | Verify `E2E_SEED_SECRET` matches the Lovable Cloud value. |

---

## See also

- `e2e-failure-report.md` — current triage status, P0/P1/P2 backlog.
- `.lovable/smoke-matrix-spec.md` — full pathway/role/scenario table + perf budgets.
- `scripts/smoke-matrix-run.sh` — one-command runner.
- `scripts/gap-report-to-tasks.mjs` — converts `e2e-gap-report.json` into a
  Lovable repair-queue checklist.
