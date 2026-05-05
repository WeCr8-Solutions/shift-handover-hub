
# Final Onboarding & Dashboard Data-Scoping Audit

## Part A — New User Signup → First Shop Operation

### A.1 What is already correct (verified)

| Layer | Status | Evidence |
|---|---|---|
| Auth — SSO-first | ✅ | `Auth.tsx` shows Google SSO above email; uses `lovable.auth.signInWithOAuth` |
| Auth — unverified email | ✅ | Amber banner + "Resend verification" CTA on login error (Phase 1 shipped) |
| Auth redirect | ✅ | `signUp` `emailRedirectTo` set to `/setup?verified=1` |
| Org creation RLS | ✅ | `organizations` INSERT requires `auth.uid() = created_by`; `organization_members` first-owner insert requires no prior members |
| ITAR flag at creation | ✅ | Toggle on `OrganizationSetup` writes `requires_us_person_declaration` (Phase 5 shipped) |
| Auto-default team & station | ✅ | `OrganizationSetup` creates `Shop Floor` team + `Station 1` in same transaction |
| 5-step wizard | ✅ | Org → Teams → Stations → Members → First Work Order (Phase 2 shipped) |
| RLS on every onboarding-touched table | ✅ | `user_onboarding`, `organizations`, `organization_members`, `teams`, `stations`, `team_members`, `queue_items`, `profiles`, `activity_logs`, `user_roles` — all `rowsecurity=true` |
| `user_onboarding` row isolation | ✅ | INSERT/SELECT/UPDATE all gated on `auth.uid() = user_id` |
| AI Planner discoverable | ✅ | Tour step + `data-tour="ai-planner"` on FAB (Phase 4) |
| Bulk-upload templates | ✅ | Excel + per-entity CSV downloads in `BulkUploadDialog` |

### A.2 Remaining gaps and proposed fixes

**G1. `/setup?verified=1` shows no acknowledgement** (Phase 1 wrote the redirect but Setup.tsx ignores the param)
- Fix: Read `searchParams.get("verified")` in Setup.tsx; show one-time success toast `"Email verified — let's finish setup."`; strip the query param after firing.

**G2. New user landing on `/setup` before session is ready can flash the auth redirect**
- `Setup.tsx` redirects on `isReady && !user`, but the verification email arrives in a fresh tab where session may take 200–500ms to hydrate. Fix: add a short `loading` skeleton when `isReady && user && !setupStatus` so the redirect-to-auth never flashes for a verified-but-still-loading user.

**G3. Org-creation owner-member insert is silently best-effort**
- In `OrganizationSetup.handleCreateOrganization`, if `organization_members` insert fails (e.g. seat-limit policy `check_limit_access`), the org row exists but the user is orphaned outside it — they'll see a blank dashboard. Fix: wrap in a Postgres RPC `create_org_with_owner(name, slug, description, requires_itar)` that performs all 4 inserts atomically and rolls back on any failure. Returns `org_id`.

**G4. Welcome verification email may land in spam — no in-app fallback path**
- If user never receives the verification email, only the `Resend` button surfaces (and only after attempting to sign in). Fix: add a passive "Didn't get it? Resend verification" link directly under the "Account created!" success toast immediately after sign-up, surfaced for 60s in a Sonner action toast.

**G5. `WelcomeModal` data-source step can let an ITAR org silently pick `write_through`-style integration**
- `requires_us_person_declaration=true` orgs are forced to read_through by DB trigger, but the picker UI doesn't reflect that — leading to a confusing "saved" → "actually didn't" experience. Fix: in `WelcomeModal` data-source step, fetch `organization.requires_us_person_declaration`; if true, hard-disable JobBOSS/SAP write_through CTAs with tooltip `"ITAR-controlled — read-through enforced."`

**G6. First Work Order step is gated on `hasStations` but not surfaced if user picks JobBOSS/SAP read-through**
- ERP-only orgs never write to `queue_items`, so wizard step 5 will never tick to green. Fix: when `useDataSourceMode()` returns `read_through`, treat step 5 as auto-complete with badge `"ERP-managed"` and replace the CTA with `"View ERP Queue"` linking to `/queue`.

### A.3 RLS / FedRAMP-ITAR validation

Verified each user-writable table participating in onboarding has:
- `organization_id` NOT NULL where applicable
- INSERT `WITH CHECK` enforcing org-scope OR self-scope
- SELECT `USING` requiring `is_org_member(auth.uid(), organization_id)` or self
- No table grants `USING (true)` or `WITH CHECK (true)` for unauthenticated role
- No SELECT policy returning rows from `auth.users` directly (joined only via SECURITY DEFINER `is_org_member`/`is_org_admin` with `SET search_path = public`)
- Owner-claim guard: `organization_members` first-owner INSERT requires `NOT EXISTS prior members` — prevents takeover

No spillage paths found in onboarding flow.

---

## Part B — Dashboard Data Correctness (RLS-Scoped per User)

### B.1 What is already correct

| Surface | Org scope source | Evidence |
|---|---|---|
| `Index.tsx` (dashboard) | `useOrgContext().organization.id` passed to `useStations(teamId, orgId)` and `useHandoffRecords(teamId, orgId)` | Lines 167–173 |
| Station/handoff queries | Filter `.eq("organization_id", orgId)` server-side AND RLS `is_org_member` | `useStations.ts` lines 95–151 |
| Planning Assistant | `organizationId={organization.id}` passed; edge function re-validates JWT + membership | `Index.tsx:678` |
| `StationAlertTile` queue/routing reads | Scoped via `station_id` (which is itself org-scoped); RLS on `queue_items`/`work_order_routing` enforces tenant boundary | `StationAlertTile.tsx:222–235` |

### B.2 Gaps that can cause wrong data to appear on the dashboard

**B-G1. Multi-org users see only their "primary" org with no switcher visibility on dashboard**
- A user belonging to 2 orgs (e.g. consultant) silently lands on whichever `useOrgContext` resolves first. They could enter handoff data into the wrong tenant.
- Fix: add an active-org chip in `Header` (only visible when `userRoles.length > 1`) showing org name + dropdown to switch. Persist active org choice to `localStorage:active_org_id` and revalidate on every page load.

**B-G2. `StationAlertTile` queries don't explicitly scope by `organization_id`**
- Relies entirely on RLS. While correct for security, RLS failures (e.g. mid-migration) would silently return zero rows instead of the expected count, masking bugs.
- Fix: add explicit `.eq("organization_id", organization.id)` to all four queries in `StationAlertTile.fetchAlertData` as defense-in-depth.

**B-G3. Empty `useOrgContext.organization` during cold-load shows "no stations" empty state**
- If `OrgContext.loading` is true but `organization` not yet hydrated, the dashboard renders the empty state for ~300–800ms before stations appear. Users on slow connections hit "Set Up Stations" and double-create.
- Fix: in `Index.tsx`, guard the empty state with `!stationsLoading && !orgLoading && stations.length === 0`.

**B-G4. Operator view may see ALL stations in their org rather than only their assigned department**
- `useStations(currentTeam?.id, orgId)` filters by team but not by `department_id` or assignment. For larger shops with 50+ stations, an Operator sees clutter from other departments.
- Fix: respect `primaryRole === 'operator'` and apply additional `.in("station_id", assignedStationIds)` filter using `team_member_stations` join. Supervisors/Admins keep full team view.

**B-G5. KPI cards (parts completed, scrap rate) don't filter by user's shift**
- `DashboardKPICards` aggregates org-wide today's totals. An operator on B-shift sees A-shift's completions and may misreport progress.
- Fix: pass `currentShift` from `useShiftContext()` into KPI queries and filter `started_at`/`completed_at` to the active shift window.

**B-G6. ERP read-through orgs see two queue sources blended without provenance**
- Per the [Unified Queue + AI ERP Enrichment](mem://features/erp-connector/unified-queue-and-ai-enrichment) memory, `useUnifiedQueue` merges Native and ERP rows. Dashboard counts may double-count if a row exists in both `queue_items` AND ERP read-through (during a write_through→read_through transition).
- Fix: dedupe by `(source_system, external_id)` tuple in `useUnifiedQueue`; in `DashboardKPICards`, show source breakdown chip ("23 native · 41 from JobBOSS").

**B-G7. Recent Activity / Activity Logs may leak cross-team activity to operators**
- `activity_logs` SELECT policy needs verification for operator scope.
- Fix: confirm `activity_logs` RLS restricts operators to their own activity + team activity, not org-wide. If currently org-wide, add `is_org_admin OR user_id = auth.uid() OR team_id IN user_teams`.

### B.3 FedRAMP / ITAR-specific dashboard checks

- ✅ `requires_us_person_declaration=true` orgs route ERP through read-through (DB trigger `enforce_itar_read_through` confirmed in memory).
- ✅ ERP edge functions (`erp-sync`, `sap-sync`) gate writes by persistence mode.
- ⚠ Need to verify: `DataSourceBanner` displays the ITAR/persistence-mode badge prominently on dashboard so operators always see the data-handling regime they're working under.
- ⚠ Need to verify: AI Planning Assistant context payload (sent to Lovable AI gateway) does NOT include any ITAR-classified part numbers, drawing references, or military program names. Add a server-side scrub in `ai-planning-assistant` edge function that strips fields tagged `is_itar_controlled=true` from work-order rows before sending to the model.

---

## Implementation Sequence (after approval)

**Pass 1 — Onboarding gap closure (≈90 min)**
1. G1: Setup.tsx verified-toast (15 min)
2. G2: Setup.tsx loading guard (10 min)
3. G3: `create_org_with_owner` RPC migration + refactor `OrganizationSetup` (40 min)
4. G4: Sonner action-toast resend link after signup (10 min)
5. G5: Disable ERP write-through CTAs in `WelcomeModal` for ITAR orgs (10 min)
6. G6: Auto-complete step 5 when `read_through` mode (15 min)

**Pass 2 — Dashboard data correctness (≈2 hr)**
7. B-G1: Org switcher chip in `Header` (30 min)
8. B-G2: Explicit `organization_id` filter in `StationAlertTile` (10 min)
9. B-G3: Loading guard on dashboard empty state (5 min)
10. B-G4: Operator-scoped station list (30 min)
11. B-G5: Shift-filtered KPI cards (25 min)
12. B-G6: Dedupe in `useUnifiedQueue` + source breakdown chip (20 min)
13. B-G7: Audit + (if needed) tighten `activity_logs` RLS via migration (15 min)

**Pass 3 — ITAR hardening (≈30 min)**
14. Verify + raise prominence of `DataSourceBanner` on dashboard
15. Add `ai-planning-assistant` ITAR-field scrub before model call

## Technical Notes (for engineering)

- `create_org_with_owner` must be `SECURITY DEFINER SET search_path = public`, accept `_name text, _slug text, _description text, _requires_itar boolean`, run all 4 inserts in one txn, and return new `org_id uuid`. Replace direct table inserts in `OrganizationSetup` with `supabase.rpc('create_org_with_owner', {...})`.
- For B-G7, query `pg_policies` for `activity_logs` first; only migrate if policy `qual` is broader than expected.
- ITAR scrub field list to strip from AI context: `part_number_classified`, `program_code`, `customer_milspec`, `drawing_revision_classified`. Add column `is_itar_controlled boolean default false` to `queue_items` if not present (verify before migrating).
- All new migrations must be idempotent (`IF NOT EXISTS`, `CREATE OR REPLACE`).

## Acceptance Criteria

- New user can sign up → verify email → create org → land on `/setup?verified=1` with success toast → complete 5-step wizard → see their first work order on `/dashboard` without ever hitting an empty state, error toast, or wrong-tenant data.
- Multi-org user can switch active org from header and the dashboard refreshes to that org's data only.
- ITAR org user cannot pick `write_through` ERP integration in any UI surface; AI assistant never receives classified field values.
- All RLS policies remain `error`-level clean in security scan.
