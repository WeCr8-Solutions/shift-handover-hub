# E2E Tests (Playwright)

Three suites simulating real shop usage against a deterministic seeded fixture:

| Spec | Role | Covers |
|------|------|--------|
| `operator-daily.spec.ts` | Operator | Auth, dashboard, WO start/pause/resume/complete, shift handoff, NCR + delivery request |
| `org-admin-daily.spec.ts` | Org Admin | Org/team/station setup, work order create + routing, invite codes, member mgmt, review/approve outputs |
| `combined-team.spec.ts` | Both | Sequential admin setup → operator lifecycle → final parallel realtime verification |

Plus existing `gca.spec.ts` and `oap.spec.ts`.

## Setup

1. Add the seed secret in Lovable Cloud (already done via `secrets.add_secret`):
   - `E2E_SEED_SECRET` — any long random string
2. Mirror the same value locally as a shell env var:
   ```bash
   export E2E_SEED_SECRET="<same value as in cloud>"
   export E2E_BASE_URL="https://id-preview--059e6965-215c-439a-949e-fcc8a2e6d939.lovable.app"
   ```
3. Install browsers (one-time):
   ```bash
   bunx playwright install chromium
   ```

## Run

```bash
# All three lifecycle suites
bun run test:e2e -- e2e/operator-daily.spec.ts e2e/org-admin-daily.spec.ts e2e/combined-team.spec.ts

# Individual
bun run test:e2e -- e2e/operator-daily.spec.ts
bun run test:e2e -- e2e/org-admin-daily.spec.ts
bun run test:e2e -- e2e/combined-team.spec.ts
```

## Seed fixture

The `seed-e2e` edge function (gated by `x-e2e-secret` header) provisions:

- `admin-e2e@jobline.test` — org owner + supervisor
- `operator-e2e@jobline.test` — org member + operator
- Org "E2E Test Shop" (slug `e2e-shop`)
- Team "E2E Day Shift"
- Station `E2E-CNC-01`
- Work order `E2E-WO-001` (5 parts, queued, assigned to operator)

Re-running the seed resets the WO to `queued` / 0 completed for repeatable runs.
Default passwords are baked into the function (override via `E2E_ADMIN_PASSWORD` /
`E2E_OPERATOR_PASSWORD` env vars in Lovable Cloud secrets if needed).

## Failure handling

The specs use **role+name** queries first and fall back to lenient regex matchers,
so most copy/wording changes won't break them. If a step fails, the HTML report
opens automatically (`playwright-report/`) with screenshots & traces.
