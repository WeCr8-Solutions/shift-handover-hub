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
| `handoff` | `flows/handoff.ts` | Open `/handoff`, mount New Handoff form |
| `ncr` | `flows/ncr.ts` | Submit NCR with qty + reason; verify qty integrity (Completed+Scrap+Rework=Original) |
| `quarantine` | `flows/quarantine.ts` | `/quarantine` heading, locate WO row, disposition CTA |
| `notifications` | `flows/notifications.ts` | Bell renders, panel opens (perf budget 2s), event copy present |
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

- `e2e-gap-report.json` — aggregate
- `e2e-gap-report.ndjson` — stream
- `.lovable/smoke-repair-queue.md` — agent-friendly checklist (run `bun smoke:repair-queue`)

## Run locally

```bash
E2E_BASE_URL=https://id-preview--059e6965-215c-439a-949e-fcc8a2e6d939.lovable.app \
E2E_SEED_SECRET=<token> \
E2E_SMOKE_ROLES=operator,supervisor,org_admin \
E2E_SMOKE_PATHWAYS=nav,wo,handoff,ncr,notifications \
bunx playwright test e2e/smoke-matrix.spec.ts

bun smoke:repair-queue
```
