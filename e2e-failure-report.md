# E2E Failure Report — Post-Fix Pass

**Generated:** 2026-05-13 (post-fix)
**Target:** `https://joblineai.lovable.app` (Live, Supabase `dpajcbhfwmfnzgldrveu`)
**Suites:** `e2e/usability-matrix.spec.ts` + `e2e/smoke-matrix.spec.ts` + `e2e/regression.spec.ts`
**Raw artifacts:** `e2e-gap-report.json`, `e2e-gap-report.ndjson`, `e2e-gap-summary.md`, `playwright-report/`

> This document is the running record of the failure-report follow-up pass. The
> original 62-cell baseline is preserved in `e2e-gap-report.json`. Sections 2–5
> below now track **what was fixed**, **what's still open**, and **how to verify**.

---

## 1. Status After Fix Pass

| Bucket | Before | After | Notes |
|---|---|---|---|
| **P0 critical failures** | 3 | **0 in code** (1 needs republish) | NotFound recovery + WO routes mounted |
| **P1 functional blockers** | 6 | **2** (drawer deep-link, handoff trigger) | Both depend on seed-e2e org membership |
| **P2 / warnings** | ~30 | ~20 | Mobile menu + WO selector classes resolved |
| **Network 5xx** | 0 | 0 | ✅ |
| **Permission/RLS leaks** | 0 | 0 | ✅ |

---

## 2. P0 — Critical (Status)

### CF-1 Guarded route renders 404 instead of auth bounce — ✅ FIXED
- `/work-orders`, `/work-orders/cancelled`, `/work-orders/completed`,
  `/work-orders/on-hold` are now mounted in `src/App.tsx`
  (`WorkOrdersHub`, `CompletedWorkOrders`, `CancelledWorkOrders`,
  `OnHoldWorkOrders` — all wrapped in `<RequireAuth><RequireOrg>`).
- `src/pages/NotFound.tsx` rebuilt with:
  - `data-testid="not-found"`
  - Visible `<Link to="/">Return Home</Link>` (`data-testid="not-found-home"`)
  - Authenticated users also see `Go to Dashboard` (`data-testid="not-found-dashboard"`)
- Stale paths in `e2e/helpers/roleMatrix.ts` and `e2e/usability-matrix.spec.ts`
  GUARDED_ROUTES (`/handoff`, `/operator-tools`, `/notifications`, `/gca`,
  `/admin/users`, `/admin/orgs`, `/billing`) replaced with real mounted routes.

### CF-2 `/queue?item=<uuid>` deep link does not open WO drawer — 🟠 PARTIAL
- **Frontend hardening done:**
  - `src/pages/Queue.tsx` root now exposes
    `data-testid="queue-page"`, `data-deep-link-state` (`none|opened|loading|not-found`),
    and `data-deep-link-item` so E2E can deterministically distinguish a
    "drawer never opened" (data/RLS) failure from a routing/render failure.
  - `QueueItemDetailDialog` `<DialogContent>` now carries
    `data-testid="wo-drawer"`, `data-wo-id`, `data-wo-code` selectors.
  - `QueueItemActions` lifecycle buttons now expose
    `data-testid="wo-start" | "wo-pause" | "wo-complete" | "wo-next-op" | "wo-edit-routing" | "ncr-create" | "new-handoff"`.
- **Still open (data, not code):** seeded operator/admin lack the
  `organization_members` rows required by `queue_items` RLS on Live. Until the
  next `seed-e2e` deployment patches that, deep links will land on
  `data-deep-link-state="not-found"` and the cascading lifecycle assertions
  remain blocked.
- **Verification command:**
  ```bash
  curl -s https://joblineai.lovable.app/queue?item=<seeded-uuid> \
    -H "Cookie: $E2E_OPERATOR_COOKIE" | grep -o 'data-deep-link-state="[^"]*"'
  # Expect: data-deep-link-state="opened"
  ```

### CF-3 Live missing NotificationBell aria-label — 🟢 CODE READY, AWAITING PUBLISH
- Fix is committed in `src/components/Header.tsx`. Republishing Lovable
  propagates it to Live.

---

## 3. P1 — Functional Blockers (Status)

| ID | Issue | Status | Notes |
|---|---|---|---|
| FB-1 | Start Work Order button missing | ✅ Selector added (`wo-start`); cascade resolves once CF-2 data is fixed |
| FB-2 | Complete Work Order button missing | ✅ Selectors added (`wo-complete`, `wo-next-op`) |
| FB-3 | `passToNextStep` Next-Operation CTA | ✅ `data-testid="wo-next-op"` |
| FB-4 | Handoff entry point not discoverable | ✅ `data-testid="new-handoff"` added on the in-drawer "Create Handoff" button. Documented precondition: only renders for `item_type="work_order"` and non-completed status. |
| FB-5 | Quarantine view not reachable | 🟠 Open — needs `data-testid="quarantine-list"` on the NCR/Quality tab in `Queue.tsx` (low risk; tab exists). |
| FB-6 | NCR "Report" CTA not labeled | ✅ `data-testid="ncr-create"` |

---

## 4. P2 — Warnings & Polish (Status)

| ID | Status |
|---|---|
| W-1/W-2 Landing & handbook nav semantics | Open (cosmetic; `<header>` wrapping landing nav is non-blocking). |
| W-3 Mobile hamburger selector mismatch on 14 routes | ✅ Marketing `MarketingNav` and app `Header` triggers now expose `aria-label="Open menu"` + `data-testid="mobile-menu"`. |
| W-4 NotificationBell cascade | Republish (CF-3). |
| W-5 Pause/Resume/Complete | Selectors now stable; will pass once CF-2 data is unblocked. |

---

## 5. Tooling & Test-Harness Changes

### `e2e/helpers/instrumentation.ts`
- Documented every entry in `NOISE_PATTERNS` (no silent muting).
- Split network aborts into a dedicated `NETWORK_ABORT_PATTERNS` list covering
  `ERR_ABORTED`, `NS_BINDING_ABORTED`, `ERR_CANCELED`, and "signal is aborted".
- Added `cdn.gpteng.co` (Lovable preview shell), `gtm.js`, and
  `ResizeObserver loop limit exceeded` (browser quirk — never an app bug) to
  the noise list.
- Real 5xx responses, real `pageerror` exceptions, and non-abort
  `requestfailed` events are still recorded with full context.

### `e2e/regression.spec.ts` (new)
Locked-in regressions for every fix in this pass:

1. `/work-orders[/cancelled|/completed|/on-hold]` anon visit → bounces to `/auth`
   (asserts NotFound is **not** rendered).
2. `/__missing__` route renders `[data-testid="not-found"]` + visible
   `[data-testid="not-found-home"]` link with `href="/"`.
3. Marketing header at 390×844 exposes `[data-testid="mobile-menu"]` with an
   aria-label matching `/menu/i`.

### `e2e/helpers/roleMatrix.ts`
- Reconciled with `src/App.tsx` (timestamped header comment).
- Removed unmounted paths (`/handoff`, `/operator-tools`, `/notifications`,
  `/gca`, `/admin/users`, `/admin/orgs`, `/billing`).

### `scripts/smoke-matrix-run.sh`
- Default `SUITES` now includes `e2e/regression.spec.ts`.

---

## 6. Files Modified

| File | Change |
|---|---|
| `src/App.tsx` | Mounted `/work-orders`, `/work-orders/{cancelled,completed,on-hold}` |
| `src/pages/NotFound.tsx` | Real recovery UI + testids |
| `src/pages/Queue.tsx` | `data-deep-link-state` instrumentation on root |
| `src/components/Header.tsx` | `aria-label="Open menu"` + `data-testid="mobile-menu"` |
| `src/components/marketing/MarketingNav.tsx` | Same |
| `src/components/queue/QueueItemDetailDialog.tsx` | `data-testid="wo-drawer"` + WO id attrs |
| `src/components/queue/QueueItemActions.tsx` | `wo-start`/`wo-pause`/`wo-complete`/`wo-next-op`/`ncr-create`/`new-handoff` testids |
| `e2e/helpers/instrumentation.ts` | Documented + tightened noise filter |
| `e2e/helpers/roleMatrix.ts` | Reconciled with App.tsx |
| `e2e/usability-matrix.spec.ts` | GUARDED_ROUTES synced with mounted routes |
| `e2e/regression.spec.ts` | **New** — locks in this pass |
| `scripts/smoke-matrix-run.sh` | Runs regression suite by default |

---

## 7. Verification Commands

```bash
# Full matrix (smoke + usability + regression) — Live
CHROMIUM_BIN=/bin/chromium \
  E2E_SEED_SECRET=… E2E_ADMIN_PASSWORD=… E2E_OPERATOR_PASSWORD=… \
  bash scripts/smoke-matrix-run.sh live

# Just the new regression suite (fast, no seed required)
CHROMIUM_BIN=/bin/chromium \
  E2E_BASE_URL=https://joblineai.lovable.app \
  npx playwright test e2e/regression.spec.ts --reporter=line

# Local preview (after publish)
CHROMIUM_BIN=/bin/chromium \
  npx playwright test e2e/regression.spec.ts e2e/usability-matrix.spec.ts \
    --reporter=line
```

> **Note:** the regression suite must be run *after* republishing Lovable so
> the four new `/work-orders*` routes reach Live. Until then, tests CF-1
> regressions will still report "rendered NotFound" against the stale build.

---

## 8. Remaining Work (Open Tickets)

1. **Republish Lovable** so `/work-orders*` routes, NotFound recovery,
   NotificationBell aria-label, and stable WO drawer selectors reach Live.
2. **Patch `supabase/functions/seed-e2e/index.ts`** to insert
   `organization_members` (org + team + station) rows for
   `operator-e2e@jobline.test` and `admin-e2e@jobline.test` on every scenario
   so `queue_items` RLS allows the deep-linked WO to load.
3. **Add `data-testid="quarantine-list"`** to the NCR/Quality tab on
   `Queue.tsx` (small follow-up).
4. **Wrap landing top nav in `<header><nav>`** (cosmetic accessibility).
5. **Decide & mount or remove** unmounted nav targets still referenced in
   `src/components/Header.tsx`: `/queue-hub`, `/quotes`, `/planning-center`,
   `/messages`, `/operator/inbox`. These were out of scope for this pass but
   will trigger 404s if a user clicks them from the mobile sheet.
