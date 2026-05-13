# E2E Failure Report

**Generated:** 2026-05-13
**Target:** `https://joblineai.lovable.app` (Live, Supabase `dpajcbhfwmfnzgldrveu`)
**Suites:** `e2e/usability-matrix.spec.ts` + `e2e/smoke-matrix.spec.ts`
**Cells executed:** 62 (40 usability + 22 smoke)
**Raw artifacts:** `e2e-gap-report.json`, `e2e-gap-report.ndjson`, `e2e-gap-summary.md`, Playwright HTML at `playwright-report/`

---

## 1. Executive Summary

The full E2E + usability matrix completed end-to-end against Live with **318 gap entries** logged: **13 errors / 305 warnings / 0 info**. After noise filtering (in-flight `ERR_ABORTED` fetches that React Query cancels on navigation), the actionable picture is:

| Bucket | Count | Status |
|---|---|---|
| Critical failures (auth/RLS/dead-end) | **3** | 🔴 fix now |
| Functional blockers (workflow can't complete) | **6** | 🟠 fix this sprint |
| Usability concerns (UX warnings) | **~30 unique** | 🟡 schedule |
| Console errors (real, not abort-noise) | **~12 unique** | 🟡 mostly cascade from drawer-not-open |
| Network failures (real 4xx/5xx) | **0** | ✅ |
| Permission / RLS leaks | **0** | ✅ talent privacy holds |
| Mobile layout misses | **14 routes** | 🟡 hamburger selector mismatch |

**Headline issues**

1. **Several role-matrix routes do not exist in `src/App.tsx`** (`/work-orders`, `/work-orders/cancelled`, `/operator-tools`, `/notifications`, `/handoff`, `/gca`, `/admin/users`, `/admin/orgs`, `/admin/stations`, `/admin/routing`, `/billing`). Anonymous users hitting these get a 404 instead of being bounced to `/auth`, and authenticated users see broken nav links. Either mount the routes or remove them from `roleMatrix.ts` / left nav.
2. **WO drawer never opens from `/queue?item=<uuid>` deep link on Live.** Cascades into Start/Pause/Resume/Complete/Routing failures. Most likely the seeded operator/admin lacks the org-membership rows needed to satisfy `queue_items` RLS — a `seed-e2e` data gap, not a runtime regression.
3. **NotificationBell aria-label fix is in `main` but not yet on Live** — the test still cannot find the bell. Re-publish to propagate.
4. **Mobile hamburger selector does not match the actual header on `/`, `/talent*`, `/oap`, `/gcode-academy`, `/handbook`, `/resources*`, `/auth`, `/shift-handoff`, `/manufacturing-visibility`** — either the marketing header doesn't render a `<button aria-label*="menu">` or it lives outside `<header>/<nav>`. Either label the trigger or update the test selector after inspection.

No critical security regressions. RLS enforcement on `/talent/:username` correctly masks email/phone — privacy assertions all pass.

---

## 2. Critical Failures

### CF-1 — Guarded route renders 404 instead of auth bounce
- **Page/route:** `/work-orders` (also affects `/work-orders/cancelled`, `/admin/users`, `/admin/orgs`, `/admin/stations`, `/admin/routing`, `/billing`, `/operator-tools`, `/notifications`, `/handoff`, `/gca`)
- **Role:** anonymous (`anon`)
- **Steps to reproduce:** open an Incognito window → visit `https://joblineai.lovable.app/work-orders`
- **Expected:** redirect to `/auth?redirect=/work-orders` (or render the appropriate page if mounted)
- **Actual:** generic `404 Error: User attempted to access non-existent route: /work-orders` — no recovery link, no auth bounce
- **Severity:** **Critical**
- **Console:** `404 Error: User attempted to access non-existent route: /work-orders`
- **Suggested fix:**
  - If the page exists under a different path (e.g. `/queue` for work orders), update the role matrix + sidebar links and add a `<Route path="/work-orders" element={<Navigate to="/queue" replace />} />` shim so old links don't 404.
  - For each missing admin path, mount the real component or remove from `ROLE_MATRIX.platform_admin.navRoutes` / `ROLE_MATRIX.org_admin.navRoutes` in `e2e/helpers/roleMatrix.ts`.
  - Add a Home/Dashboard recovery link to `src/pages/NotFound.tsx`.

### CF-2 — `/queue?item=<uuid>` deep link does not open WO drawer
- **Page/route:** `https://joblineai.lovable.app/queue?item=b66d6abd-8944-4f75-be26-46c6fc774523`
- **Role:** seeded `operator` AND `supervisor` (cascades to BOTH roles, BOTH scenarios)
- **Steps to reproduce:**
  1. POST to `seed-e2e` to seed the `wo_basic` fixture
  2. Log in with `operator-e2e@jobline.test`
  3. Navigate to `/queue?item=<fx.work_order.id>`
- **Expected:** Queue list renders AND the WO drawer auto-opens for the seeded UUID, exposing Start / Pause / Resume / Complete / Report NCR / Next Operation buttons
- **Actual:** Queue page renders but the drawer never mounts; WO code `E2E-WO-001` is not in DOM. All downstream lifecycle assertions fail.
- **Severity:** **Critical** (blocks 5 cascading test cells per role)
- **Suggested fix:**
  1. Verify `queue_items` row exists for `fx.work_order.id` on Live (`select * from queue_items where work_order_id = 'b66d6abd-…'`).
  2. Verify `fx.admin.id` and `fx.operator.id` are members of `f12d7de3-e035-4a7d-8322-6c96fb70d766` via `organization_members` (RLS on `queue_items` requires this).
  3. If membership missing → patch `supabase/functions/seed-e2e/index.ts` to insert organization + team + station memberships for both seeded users.
  4. Add `data-testid="wo-drawer"` to the drawer root and `data-testid="wo-start"|"wo-pause"|"wo-resume"|"wo-complete"|"wo-next-op"` to the lifecycle buttons so future selector refactors don't silently break.

### CF-3 — Live is missing the NotificationBell aria-label fix
- **Page/route:** `/dashboard`
- **Role:** operator + supervisor
- **Steps to reproduce:** log in → look for the bell icon in the header
- **Expected:** `<button aria-label="Notifications…" data-testid="notification-bell">` is queryable
- **Actual:** Live still ships the old build with `title="Notifications"` only; selector returns no element
- **Severity:** **Critical** (a11y, WCAG 4.1.2 violation) — the fix is committed in `src/components/Header.tsx`
- **Suggested fix:** Re-publish Lovable so the fix reaches Live.

---

## 3. Functional Blockers

### FB-1 — Start Work Order button missing
- **Route:** `/queue?item=<uuid>` after deep link · **Role:** operator/supervisor · **Severity:** High
- **Expected:** "Start" / "Begin Work" / "Check In" button visible on opened WO
- **Actual:** Button not visible (cascade from CF-2)
- **Fix:** Resolve CF-2; add `data-testid="wo-start"`.

### FB-2 — Complete Work Order button missing
- Same root cause as FB-1. **Severity:** High.

### FB-3 — `passToNextStep` Next-Operation CTA missing
- **Route:** `/queue?item=E2E-WO-001` · **Role:** supervisor · **Severity:** High
- Cascade from CF-2. Once drawer opens, verify `pass_work_order_to_next_step` RPC binding still exists on the routing tab.

### FB-4 — Handoff entry point not discoverable from `/dashboard`
- **Route:** `/dashboard` · **Role:** operator · **Severity:** Medium
- **Expected:** station card surfaces a "New Handoff" / "Start Handoff" / "Submit Handoff" button (`data-testid="new-handoff"`)
- **Actual:** No matching button visible within 5s
- **Fix:** Add `data-testid="new-handoff"` to the dashboard station card's handoff trigger; if the trigger only renders mid-shift, document the precondition.

### FB-5 — Quarantine view not reachable
- **Route:** `/queue?status=quality_hold` (with `/queue` NCR-Queue tab fallback) · **Role:** supervisor · **Severity:** Medium
- **Expected:** `<h2>Quality Hold</h2>` or NCR-Queue tab visible
- **Actual:** Neither the filtered heading nor the tab matches the selector
- **Fix:** Either expose `?status=quality_hold` on `src/pages/Queue.tsx` filters or label the existing NCR/Quality tab with `data-testid="quarantine-list"`.

### FB-6 — NCR "Report" CTA not labeled in WO drawer
- **Route:** `/queue?item=<uuid>` · **Role:** operator · **Severity:** Medium
- Cascade from CF-2; when fixed, add `data-testid="ncr-create"` to the in-drawer trigger.

---

## 4. Warnings / Concern-Level Issues

| # | Page | Role | Issue | Severity | Fix |
|---|---|---|---|---|---|
| W-1 | `/` (Landing) | anon | Test reports `nav a, header a` count = 0 — landing CTAs are not inside `<nav>` or `<header>` | Low | Wrap top nav in `<header><nav>…</nav></header>` semantics so screen-readers + the audit pick it up |
| W-2 | `/handbook` | anon | Same as W-1 | Low | Same fix |
| W-3 | All marketing pages on **mobile (390×844)** | anon | Hamburger selector `[aria-label*="menu" i]` finds nothing on 14 routes | Medium | Add `aria-label="Open menu"` + `data-testid="mobile-menu"` to the marketing-header burger button |
| W-4 | `/dashboard` notifications | operator/supervisor | Cascade of CF-3 | Critical | Re-publish |
| W-5 | All seeded WO flows | operator/supervisor | Pause / Resume buttons not found (warn level) | Medium | Cascade of CF-2 |

---

## 5. Console Errors

After noise filtering, the only real console errors are the route-not-found logs already covered in CF-1:

```
404 Error: User attempted to access non-existent route: /work-orders     (×4)
404 Error: User attempted to access non-existent route: /operator-tools  (×2)
404 Error: User attempted to access non-existent route: /notifications   (×2)
404 Error: User attempted to access non-existent route: /work-orders/cancelled (×2)
404 Error: User attempted to access non-existent route: /handoff         (×2)
404 Error: User attempted to access non-existent route: /gca             (×1)
```
The 60+ `TypeError: Failed to fetch` console.errors are benign React Query aborts on navigation (now filtered in `e2e/helpers/instrumentation.ts`).

**No uncaught `pageerror` events were observed.**

---

## 6. Network Failures

- **Real failures:** 0 (no 4xx/5xx responses, no DNS errors)
- **Aborted in-flight fetches:** ~138 against `dpajcbhfwmfnzgldrveu.supabase.co` and ~74 against `joblineai.lovable.app/assets/*`. These are normal navigation cancellations and are now filtered out via `net::ERR_ABORTED` in `instrumentPage()`.

---

## 7. Permission / RLS Issues

| Check | Result |
|---|---|
| `/talent/:username` masks email/phone | ✅ pass |
| `/talent/search` shows entitlement wall to free tier | ✅ pass |
| `/oap/employer` shows entitlement wall to free tier | ✅ pass |
| `queue_items` visible to seeded operator on `/queue?item=…` | ❌ fail (CF-2) — likely missing org membership for seeded users on Live |
| Anon → guarded route bounce to `/auth` | ❌ fail on `/work-orders` only (because the route isn't mounted, so RouteGuard never runs) |

---

## 8. Mobile Layout Issues

**Viewport tested:** 390×844 (iPhone 12/13)

| Route | Issue | Severity |
|---|---|---|
| `/`, `/pricing`, `/talent`, `/talent/browse`, `/oap`, `/gcode-academy`, `/handbook`, `/resources`, `/resources/glossary`, `/resources/gcode`, `/auth`, `/shift-handoff`, `/manufacturing-visibility` | Mobile hamburger selector `[aria-label*="menu" i], [data-testid="mobile-menu"], button:has(svg.lucide-menu)` matches no element. Either the marketing header omits the burger on these routes or the trigger has no accessible label. | Medium |
| `/verify` | ✅ pass | — |

**Recommended fix:** add `aria-label="Open menu"` and `data-testid="mobile-menu"` to the marketing `MarketingNav` hamburger trigger; verify it renders below the `md:` breakpoint.

---

## 9. Routes Tested

**Public (anon, both viewports — 28 cells):**
`/`, `/pricing`, `/talent`, `/talent/browse`, `/oap`, `/gcode-academy`, `/handbook`, `/resources`, `/resources/glossary`, `/resources/gcode`, `/verify`, `/auth`, `/shift-handoff`, `/manufacturing-visibility`

**Guarded-bounce verification (anon, both viewports — 22 cells):**
`/dashboard`, `/queue`, `/teams`, `/admin`, `/settings`, `/talent/dashboard`, `/talent/search`, `/oap/employer`, `/gca/employer`, `/work-orders` (404 — see CF-1), `/history`

**Smoke matrix (operator + supervisor, all pathways — 11 cells per role):**
`/dashboard`, `/queue`, `/queue?item=<uuid>`, `/handoff` (404), `/ncr` (404), `/quarantine` (404), `/talent/demo-operator`, `/talent/search`, `/oap/employer`, `/admin/users`, plus nav audits per `roleMatrix.ts`

**404 recovery test:** `/this-route-definitely-does-not-exist-12345`

**Total unique paths exercised:** 38

---

## 10. Recommended Fix Priority

### P0 — Ship within 24 h
1. **Re-publish Lovable** so the NotificationBell `aria-label` reaches Live (CF-3).
2. **Add Home/Dashboard recovery link to `src/pages/NotFound.tsx`** (CF-1 mitigation).
3. **Patch `supabase/functions/seed-e2e/index.ts`** to insert org/team/station memberships for the seeded admin + operator users on every scenario (CF-2).

### P1 — Same sprint
4. Reconcile `roleMatrix.ts` `navRoutes` and `usability-matrix.spec.ts` `GUARDED_ROUTES` with the actual mounted routes in `src/App.tsx`. Either mount the missing pages (`/work-orders`, `/admin/users`, `/admin/orgs`, `/admin/stations`, `/admin/routing`, `/billing`, `/operator-tools`, `/notifications`) or remove them from the matrix and from any sidebar links pointing to them.
5. Add a `<Navigate to="/queue" replace />` shim for `/work-orders` so legacy bookmarks/marketing links don't 404.
6. Add the following stable selectors to the WO drawer + station cards:
   - `data-testid="wo-drawer"` (drawer root)
   - `data-testid="wo-start" | "wo-pause" | "wo-resume" | "wo-complete" | "wo-next-op"`
   - `data-testid="ncr-create"` (in-drawer NCR trigger)
   - `data-testid="new-handoff"` (dashboard station card)
   - `data-testid="quarantine-list"` (NCR/Quality tab on `/queue`)
7. Add `aria-label="Open menu"` + `data-testid="mobile-menu"` to the marketing hamburger.

### P2 — Polish
8. Wrap landing top nav in semantic `<header><nav>` so the audit and screen readers register it.
9. Once CF-2 is resolved, re-run the matrix and verify Pause/Resume/Complete/Next-Op selectors still match the rendered button copy. Promote them to assertions instead of soft gaps.

### How to reproduce this report
```bash
CHROMIUM_BIN=/bin/chromium \
E2E_BASE_URL=https://joblineai.lovable.app \
E2E_SUPABASE_URL=https://dpajcbhfwmfnzgldrveu.supabase.co \
E2E_SEED_SECRET=… E2E_ADMIN_PASSWORD=… E2E_OPERATOR_PASSWORD=… \
bash scripts/smoke-matrix-run.sh live
```
Outputs land at `e2e-gap-report.json`, `e2e-gap-summary.md`, `e2e-failure-report.md` (this file), and `playwright-report/index.html` (with screenshots + traces for every failed cell).
