# Smoke Matrix Spec

Source of truth for what `e2e/smoke-matrix.spec.ts` covers. Update this file
whenever a new pathway, role, or scenario is added.

## Roles

| Role | Login fixture | Notes |
|------|---------------|-------|
| `operator` | `fx.operator` | Default org member, runs WO/handoff/NCR/notifications |
| `supervisor` | `fx.admin` | Same login as admin in seed; covers routing + quarantine |
| `org_admin` | `fx.admin` | Settings, billing, admin pages |
| `platform_admin` | `fx.admin` | `/dev`, cross-org admin (when seed is upgraded) |
| `talent` | `fx.operator` | Public talent profile + privacy checks |

## Pathways

| Pathway | Flow module | What it asserts |
|---------|-------------|-----------------|
| `nav` | `helpers/navAudit.ts` | Every role's sidebar routes render non-empty body, no 404 dead-end, no auth bounce |
| `wo` | `flows/workOrder.ts` | open → start → pause → resume → complete |
| `handoff` | `flows/handoff.ts` | Open dashboard → station card → mount handoff form (handoff is **not** its own route) |
| `ncr` | `flows/ncr.ts` | From `/queue?item=<id>` WO drawer → submit NCR → verify qty integrity (Completed+Scrap+Rework=Original) |
| `quarantine` | `flows/quarantine.ts` | `/queue?status=quality_hold` filtered list, locate WO, disposition CTA |
| `notifications` | `flows/notifications.ts` | Bell renders (`data-testid="notification-bell"`), panel opens (perf budget 2s), event copy present |
| `routing` | `flows/routing.ts` | `pass_work_order_to_next_step` UI path, routing-proposal approval |
| `talent` | `flows/talent.ts` | Public profile loads; **no email/phone leak** (RLS gap if so) |
| `billing` | `flows/billing.ts` | Premium routes (`/talent/search`, `/oap/employer`) show upgrade wall to free tier |
| `admin` | `flows/adminSupport.ts` | `/admin/users` heading, Act-As button presence |

## Scenarios (from `seed-e2e` edge function)

| Scenario | State | Owner |
|----------|-------|-------|
| `wo_basic` | 1 queued WO, 1 station | seeded today |
| `wo_routed` | Multi-op routed WO | **TODO**: extend seed-e2e |
| `handoff_chain` | Two prior handoffs on same station | **TODO** |
| `ncr_path` | WO with active NCR + quarantine row | **TODO** |
| `cert_paid` | Paid cert + recert event | **TODO** |
| `recert_lifecycle` | Cert near expiry → renewed | **TODO** |

Until extended scenarios land, all cells fall back to `wo_basic` and rely on
non-throwing helpers to record gaps rather than fail the run.

## Performance budgets

See `e2e/helpers/perfBudget.ts → BUDGETS`. Misses log a `warn` gap with
`category: "perf"` and never fail CI.

## Output

- `e2e-gap-report.json` — aggregate gap entries (machine-readable)
- `e2e-gap-report.ndjson` — streaming JSONL
- `e2e-gap-summary.md` — categorized human report (Critical / Blockers / Warnings / Console-Net / Routes touched)
- `.lovable/smoke-repair-queue.md` — agent-friendly checklist (run `bun smoke:repair-queue`)

## Companion suite — `e2e/usability-matrix.spec.ts`

Runs alongside the smoke matrix to catch usability blockers the role/pathway
matrix doesn't cover:

- **Public route health** (anon): `/`, `/pricing`, `/talent`, `/oap`,
  `/gcode-academy`, `/handbook`, `/resources`, `/auth`, `/shift-handoff`,
  `/manufacturing-visibility`, etc. — tested at **desktop (1366×768)** and
  **mobile (390×844)** viewports.
- **Route guard correctness** (anon): every guarded route
  (`/dashboard`, `/queue`, `/teams`, `/admin`, `/settings`,
  `/talent/dashboard`, `/talent/search`, `/oap/employer`, `/gca/employer`,
  `/work-orders`, `/history`) MUST bounce anon users to `/auth` — never to
  404 and never render protected content.
- **404 recovery**: any unknown route renders a Home/Dashboard recovery link.
- **Stuck-loading detection**: pages that show only "Loading…" after 1.5s
  are flagged as dead-ends.
- **Mobile critical actions**: ensures hamburger menu / interactive elements
  are visible on `mobile` viewport.
- **Console / network watchers**: every spec attaches `instrumentPage()`
  which records `console.error`, `pageerror`, `requestfailed`, and HTTP 5xx
  responses. Known noise (Vite HMR, GA, Sentry, RESET_BLANK_CHECK) is filtered.

The usability suite uses **no seed** and is safe to run against any
environment. It is added to the default `bun smoke:matrix` runner.


## Run locally

There are TWO valid targets — pick one and pair the matching Supabase URL:

**A. Test / Preview backend** (default — uses freshly-seeded data, may need
republish after schema changes):
```bash
CHROMIUM_BIN=/bin/chromium \
E2E_BASE_URL=https://id-preview--059e6965-215c-439a-949e-fcc8a2e6d939.lovable.app \
E2E_SUPABASE_URL=https://kgrstnbxqdmadtoankqr.supabase.co \
E2E_SEED_SECRET=<token> \
bunx playwright test e2e/smoke-matrix.spec.ts --workers=1
```
Note: the `id-preview` URL sits behind the Lovable account gate; only the
project owner / collaborators can authenticate.

**B. Published / Live backend** (`joblineai.lovable.app`, `jobline.ai`):
```bash
CHROMIUM_BIN=/bin/chromium \
E2E_BASE_URL=https://joblineai.lovable.app \
E2E_SUPABASE_URL=https://dpajcbhfwmfnzgldrveu.supabase.co \
E2E_SEED_SECRET=<token> \
bunx playwright test e2e/smoke-matrix.spec.ts --workers=1

bun smoke:repair-queue
```

**One-command runner** (handles env wiring + runs both smoke + usability):
```bash
bun smoke:matrix          # → live (joblineai.lovable.app + Live Supabase)
bun smoke:matrix:preview  # → id-preview Lovable URL + Test Supabase
bun smoke:matrix:local    # → http://localhost:8080 + Test Supabase
```

To run only one spec:
```bash
SUITES=e2e/usability-matrix.spec.ts bun smoke:matrix
SUITES=e2e/smoke-matrix.spec.ts     bun smoke:matrix
```

**CRITICAL:** `E2E_SUPABASE_URL` MUST match the backend the target frontend
talks to. Mismatch → seeded users live in one project, frontend authenticates
against another → `invalid_credentials` 400.

The Live backend requires `E2E_SEED_SECRET`, `E2E_ADMIN_PASSWORD`, and
`E2E_OPERATOR_PASSWORD` to be present in the Live edge function env. They
are copied from Test → Live on **publish**, so after rotating any of these
secrets you must republish before the Live matrix can authenticate.

The matrix is configured `mode: serial, timeout: 120_000` so cells share a
single browser context and don't stampede the seed-e2e edge function.

## CI integration

Recommended CI flow:

1. Build + publish step finishes.
2. Job exports `E2E_SEED_SECRET`, `E2E_ADMIN_PASSWORD`, `E2E_OPERATOR_PASSWORD`
   from the CI secret store.
3. Run `bash scripts/smoke-matrix-run.sh live` (or `preview` for PR runs).
4. Upload `e2e-gap-report.json`, `e2e-gap-summary.md`, and the Playwright
   `playwright-report/` HTML as build artifacts.
5. Optional gate: fail the job if `e2e-gap-summary.md` reports any
   `## Critical failures` or `## Functional blockers` non-zero (parse JSON).

## Failure-mode taxonomy (gap categories)

The gap report uses these `category` values — agents and humans triage by
category first, severity second:

| Category | Meaning | Typical fix |
|----------|---------|-------------|
| `dead_end` | Empty body, stuck loading, 404 with no recovery | Page component crash or guard sending to wrong place |
| `auth` | Login broke, or guarded route did NOT bounce anon | RouteGuard / RequireAuth wrapper missing |
| `routing` | Unexpected URL after navigation | Redirect / nav target wrong |
| `missing_ui` | Expected button/CTA/form field absent | Likely role/permission gating or refactor broke selector |
| `rls` | Public surface leaked private data | Tighten RLS or RPC contract immediately |
| `data` | Failed network, 5xx, missing seeded row | Edge function / RPC / RLS investigation |
| `perf` | Budget exceeded | Profile + optimize the slow flow |
| `notification` | Expected event copy not in panel | Check process-notifications + RLS |
| `other` | Console error, page exception, misc | Read message + URL |

