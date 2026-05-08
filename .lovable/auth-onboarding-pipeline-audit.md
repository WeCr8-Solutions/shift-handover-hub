# Authentication & Onboarding Pipeline Audit

**Scope:** Auth → session → role resolution → onboarding routing across Operators (Talent), Students (GCA), Operators in Qualification (OAP), Recruiters/Employers, Org Admins, Platform Admins/Developers.
**Date:** 2026-05-08
**Method:** Code review of `src/pages/{Auth,Index,TalentDashboard,TalentSearch,EmployerDashboard,GcaEmployer,GcaTestPage,OapEmployer,OapWalkthrough,OperatorProfile,Admin}.tsx`, `src/hooks/{useOnboarding,useGcaAccess,useSubscription,useTrialStatus,useOrganization,useAdminAccess,useHasOperatorProfile}.ts`, `src/contexts/{AuthContext,OrgContext,ActAsContext}.tsx`, `src/App.tsx` router, plus prior `.lovable/talent-system-audit.md` and `.lovable/gca-oap-system-audit.md` posture.

This audit complements (does not replace) the Talent and GCA/OAP audits — it focuses on the **routing & role-resolution seams** between auth, onboarding state, organization context, and subscription tier.

---

## Executive Summary

| Severity | Count |
|----------|-------|
| ERROR    | 9     |
| WARN     | 8     |
| INFO     | 4     |

**Top 5 risks:**
1. **F-1** `useOnboarding.skipOnboarding` is a client-side `UPDATE user_onboarding SET is_complete=true` — bypasses org/talent staging entirely.
2. **F-3** Employer-only pages (`/talent/search`, `/oap/employer`, `/gca/employer`, `EmployerDashboard`) gate on **role only**, not on **subscription tier** or **`is_verified_employer()`** — premium gating is client-side trust.
3. **F-5** `Auth.tsx` post-login redirect ignores org-membership: routes everyone with `is_complete=true` to `/dashboard`, causing a double-redirect through `Index` for talent-only users (visible flash + race).
4. **F-7** `/setup` (org-creation wizard) has no guard preventing a talent-only user from accidentally creating an org via deep-link, inadvertently self-elevating to `org_admin`.
5. **F-9** No router-level role guards. Each page rolls its own check (some forget — e.g., `EmployerDashboard` only checks `!user`, defers role to RLS-empty results).

---

## Findings

### Pipeline Routing

#### F-1 — `[ERROR]` Onboarding completion is client-writable
`src/hooks/useOnboarding.ts:194` (`skipOnboarding`) and `:171` (`completeStep`) directly `UPDATE user_onboarding` from the client. RLS allows owner update, so a user can set `is_complete=true` without ever creating an org or completing required core steps (organization-setup, shop-setup, data-source).
**Impact:** Bypasses staging logic; users land on `/dashboard` with no org, then bounce to `/talent/dashboard` — but they also pass any `is_complete`-gated check (e.g., dismissal of trial/onboarding nudges).
**Fix:** Convert to SECURITY DEFINER RPC `mark_onboarding_complete(_path 'org'|'talent')` that:
- For `org`: requires the caller to actually have an `organization_members` row.
- For `talent`: requires `operator_profiles` row to exist.
- Writes `completion_path` column for analytics + downstream routing.
RLS on `user_onboarding`: keep SELECT for owner, REVOKE direct UPDATE on `is_complete`/`completed_steps`, allow only `has_seen_welcome` and `setup_wizard_dismissed` from client.

#### F-2 — `[ERROR]` `Auth.tsx` post-login routing ignores user-type
`src/pages/Auth.tsx:115-120` queries only `user_onboarding.is_complete` and routes to `/dashboard` or `/setup`. It does **not** branch on:
- Org membership (`organization_members`)
- Existence of `operator_profiles` (talent path)
- Pending invite (`inviteCode` is handled, but only when present in URL)
**Impact:** Talent-only signups land on `/dashboard` → `Index.tsx` then redirects to `/talent/dashboard` (visible flash, two history entries, broken back button). Worse, users with `is_complete=false` are sent to `/setup` (org wizard) even when they signed up via `/talent` and have no intent to create an org.
**Fix:** Replace inline query with a single RPC `resolve_post_login_destination()` returning one of `org_dashboard | talent_dashboard | org_setup | talent_setup | invite_redeem | employer_dashboard`. Frontend just navigates to the returned target.

#### F-3 — `[ERROR]` Employer/Recruiter pages gate on role, not on subscription tier
- `src/pages/TalentSearch.tsx:40-41` — `isAuthorized = organizationRole in (owner|admin|supervisor)`
- `src/pages/OapEmployer.tsx`, `src/pages/GcaEmployer.tsx` — `hasOrgAdminAccess || hasOrgSupervisorAccess`
- `src/pages/EmployerDashboard.tsx:204` — only `!user` guard
None check `subscribed && tier in (team|enterprise)` or `is_verified_employer(auth.uid())`.
**Impact:** Free-tier orgs see the employer UI and submit queries that RLS silently filters to zero rows → users perceive bug. Worse, `EmployerDashboard` job-posting writes are not tier-gated client-side; they rely entirely on RLS / DB triggers (no `entitlements_check_seat('job_posting')` enforcement found).
**Fix:**
- Add server-side `entitlements_check_feature(_org_id, 'employer_search'|'job_posting')` Postgres helper, called in BEFORE INSERT trigger on `job_postings` and `talent_contact_requests`.
- Client: `<EntitlementGate feature="employer_search">` wrapper component that surfaces a clear upgrade CTA instead of empty results.

#### F-4 — `[WARN]` `/setup` has no talent-vs-org branching guard
`src/App.tsx:193` mounts `Setup` for any signed-in user. A talent-only user who clicks a stale link or has the wizard auto-redirect can complete the org-creation wizard and self-elevate to `org_admin`. There is no "are you sure you want to create a shop?" gate when an `operator_profiles` row already exists.
**Fix:** Add a top-level guard in `Setup.tsx`: if `operator_profiles` exists AND no `organization_members` row AND no `?intent=create_org` query param, render a chooser ("Continue to Talent Profile" vs "Set up a Shop").

#### F-5 — `[ERROR]` `Index.tsx` talent redirect depends on transient client state
`src/pages/Index.tsx:184-188` redirects to `/talent/dashboard` whenever `isReady && user && !organization`. But `organization` comes from `useOrgContext`, which can briefly be `null` during refetch / org-switch / RLS error. A momentary RLS hiccup or org-switch lands the user on `/talent/dashboard` — and on next refresh they're back to `/dashboard`.
**Fix:** Wait for `orgLoading === false` AND distinguish "no org row" from "fetch failed". Track `orgFetchSucceeded` state and only redirect on confirmed empty result. Better: make the routing decision server-side via the RPC in F-2.

#### F-6 — `[WARN]` Multi-org users: stale subscription/role state on org switch
`useOrganization` exposes one active org at a time, but `useSubscription`, `useAdminAccess`, and `useGcaAccess` cache against `user.id` not `(user.id, organization.id)`. Switching orgs does not invalidate `useSubscription` or `useAdminAccess` query keys.
**Impact:** Briefly after switching from a paid org to a free org, the user retains "Pro" UI affordances (e.g., access to TalentSearch button, GcaEmployer panel).
**Fix:** Include `organization?.id` in the query keys for `useSubscription`, `useAdminAccess`, `useEntitlements`, `useGcaAccess`. Force a `queryClient.invalidateQueries` on org switch in `OrgContext`.

### Auth & Session

#### F-7 — `[ERROR]` Session revocation not propagated to active tabs
`AuthContext` subscribes to `onAuthStateChange` but does not handle `USER_DELETED` or detect server-side session invalidation between refreshes (the JWT is valid until expiry even if the user is deleted/banned). A revoked user keeps using the app until the token rolls.
**Fix:**
- Add a periodic `supabase.auth.getUser()` (server round-trip) every 5 min OR on visibility change; on 401, hard sign-out.
- Subscribe to a Realtime channel on `user_status` table; emit `force_signout` when `is_suspended=true`.

#### F-8 — `[WARN]` Open-redirect surface in `?redirect=` param
`src/pages/Auth.tsx:111` allows any `redirectTo.startsWith("/") && !startsWith("//")`. This blocks protocol-relative URLs but still allows `/javascript:alert(1)` (won't navigate) and arbitrary internal paths including `/admin`. While internal-only, it's worth restricting to a known allowlist to avoid future XSS sinks via `<a href={redirect}>`.
**Fix:** Match against a regex allowlist: `^/(dashboard|talent|oap|gcode-academy|operator|settings|queue|teams)(/.*)?$`.

#### F-9 — `[ERROR]` No router-level role/subscription guards
Each page implements its own check or omits it. `EmployerDashboard.tsx:204` only checks `!user` — relies on RLS to hide org data, but the page still mounts and runs queries.
**Fix:** Introduce `<RequireRole roles={["org_admin","org_supervisor"]} requireSubscription>` and `<RequireOrg>` wrappers in `App.tsx`. Standardizes empty/forbidden UX and prevents accidentally shipping unguarded routes.

### Talent / Public Visibility

#### F-10 — `[WARN]` `useHasOperatorProfile` allows owner-side spoofing of public/private split
The `is_discoverable` flag on `operator_profiles` is a client-toggleable boolean. Consider gating "publicly discoverable" on a server-validated minimum-completeness check (display_name + skills + at least one cert) via BEFORE UPDATE trigger.
**Fix:** `enforce_operator_profile_publishable_trigger`: blocks `is_discoverable=true` OR `visibility='public'` if required fields are empty, returning a clear error so the UI can surface the missing field.

#### F-11 — `[INFO]` `/talent/:username` race with profile deletion
Public route reads `operator_profiles_public`. If the underlying row is deleted between SSR/SEO crawl and render, page returns 404 — fine, but no `Cache-Control: no-store` is set on the response (Lovable hosting limitation; tracked separately).

### GCA

#### F-12 — `[ERROR]` Admin/supervisor bypass of GCA Pro paywall is not audited
`src/pages/GcaTestPage.tsx:62` lets `isAdmin || hasOrgAdminAccess || hasOrgSupervisorAccess` bypass `hasProAccess`. There is no `data_access_logs` write recording that an admin took a paywalled test for free.
**Fix:** Edge function `gca-progress-sync` should detect admin-bypass test attempts and write `data_access_logs` with `reason='admin_paywall_bypass'`. Also strongly recommend showing a banner on the test page itself ("You are taking this test under admin override — this attempt is logged").

#### F-13 — `[WARN]` `useGcaAccess.tier === 'gca_pro'` derived from client subscription
The client trusts `useSubscription`'s `tier`. The `gca-progress-sync` edge function (per the prior GCA audit) validates server-side, so test attempts cannot be spoofed. However, `GCA_PRICES.priceId` is hardcoded in the bundle — if Stripe price IDs are rotated, stale bundles could attempt invalid checkouts. **Fix:** Move price IDs to the `create-checkout` edge function (server-resolved by `interval`).

### OAP

#### F-14 — `[ERROR]` Supervisor sign-off does not verify supervisor's org match
The prior GCA/OAP audit (Pass A) added a trigger requiring `oap_recert_events.recorded_by = auth.uid()`. Verify also that the recorder has `org_supervisor` or `org_admin` at the operator's organization. Without this, any supervisor of *any* org could sign off on any operator's qualification (RLS may already block via row visibility, but the trigger should be the authoritative check).
**Fix:** Extend `enforce_recert_recorder_role_trigger`:
```sql
IF NOT EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.user_id = NEW.recorded_by
    AND om.organization_id = (SELECT organization_id FROM oap_certificates WHERE id = NEW.certificate_id)
    AND om.role IN ('owner','admin','supervisor')
) THEN RAISE EXCEPTION 'recorder is not a supervisor at the operator''s organization';
END IF;
```

#### F-15 — `[ERROR]` Expired machine qualifications do not revoke routing access
There is no scheduled job (or query-time check) that flips `oap_certificates.status` to `expired` when `valid_until < CURRENT_DATE`. The `verify_*_certificate` RPCs were patched to compute `effective_status` server-side (good), but **app routing & queue-eligibility checks** (e.g., "can this operator pick this work order?") still read `status` directly.
**Fix:** Either (a) nightly pg_cron `UPDATE oap_certificates SET status='expired' WHERE valid_until < CURRENT_DATE AND status='valid'`, or (b) introduce `oap_certificates_effective` view that exposes the computed `effective_status` and migrate all readers.

#### F-16 — `[WARN]` Operator self-approval gap on `oap_walkthrough_sessions`
Verify `oap_walkthrough_sessions.completed_by` cannot equal the operator being walked through (i.e., self-walkthrough). Add `CHECK (completed_by <> operator_user_id)` or trigger.

### Org & Subscription

#### F-17 — `[ERROR]` Subscription tier gates not enforced server-side on writes
`job_postings` insert, `talent_saved_lists` insert, `talent_contact_requests` insert have no `entitlements_check_*` BEFORE INSERT trigger that I could verify. Free-tier orgs may be able to write past the client gate.
**Fix:** Add `enforce_entitlements_trigger` on each premium write table.

#### F-18 — `[WARN]` Trial expiry does not block premium pipeline routing
`useTrialStatus` is read by some banners but no router/RPC enforces it. An expired-trial org still mounts `/talent/search`, `/oap/employer` etc., showing UI that then errors on write.
**Fix:** Include trial state in the `resolve_post_login_destination()` RPC (F-2) and in the proposed `<RequireRole requireSubscription>` wrapper (F-9).

### Admin / Support / Audit

#### F-19 — `[ERROR]` No admin-support summary RPC for pipeline troubleshooting
SDK admins lack a single read returning `{gca_cert_count_by_bank, oap_cert_count_by_machine, talent_visibility, org_memberships, subscription_tier, trial_state, onboarding_step, last_login_at}` for a user. Today they must hit 8+ tables.
**Fix:** New SECURITY DEFINER RPC `admin_get_user_pipeline_summary(_user_id uuid)` — restricted to platform admins, **logs every call** to `data_access_logs`.

#### F-20 — `[WARN]` Act-As impersonation routing is not surfaced in the URL
`ActAsContext` swaps the queried user but the JWT remains the admin's. Pages do not render an "Acting as: <user>" banner consistently. Risk: an admin makes a change thinking they're "looking" at a user.
**Fix:** Persistent top-bar banner whenever `actingAs` is set; require a re-confirmation modal before any write while in Act-As. Confirm `data_access_logs.acting_via_user_id` is populated for every Act-As write (already partially in place per GCA/OAP Pass A — extend to Talent + Org writes).

#### F-21 — `[INFO]` Empty-state vs forbidden distinction
The shared `PermissionAwareEmpty` component (created during the Talent + GCA/OAP audits) is only wired into a subset of pages. Outstanding integrations: `EmployerDashboard` (Candidates tab), `TalentSearch` (results grid), `GcaEmployer`, `OapEmployer` panels.
**Fix:** Add `<PermissionAwareEmpty reason="needs_subscription"|"needs_role"|"empty">` to those four surfaces.

---

## Recommended Schema Migrations (ordered)

1. **`mark_onboarding_complete(_path text)` RPC** + REVOKE direct UPDATE on `user_onboarding.is_complete` (F-1)
2. **`resolve_post_login_destination()` RPC** (F-2, F-5, F-18)
3. **`enforce_entitlements_trigger`** on `job_postings`, `talent_saved_lists`, `talent_contact_requests` (F-3, F-17)
4. **`enforce_operator_profile_publishable_trigger`** (F-10)
5. **Extend `enforce_recert_recorder_role_trigger`** with org-match check (F-14)
6. **`oap_certificates_effective` view** + nightly pg_cron expiry sweep (F-15)
7. **`CHECK (completed_by <> operator_user_id)` on `oap_walkthrough_sessions`** (F-16)
8. **`admin_get_user_pipeline_summary(_user_id)` RPC** with audit logging (F-19)
9. **`acting_via_user_id` columns** on `talent_*` and `organization_members` audit triggers (F-20 — extension of Pass A)

## Recommended Frontend Fixes (ordered)

1. Replace `Auth.tsx` post-login query with `resolve_post_login_destination()` RPC
2. Add `<RequireRole>`, `<RequireOrg>`, `<RequireSubscription>` HOCs in `App.tsx`; apply to `/admin`, `/queue`, `/teams`, `/settings`, `/talent/search`, `/oap/employer`, `/gca/employer`, `/employers/dashboard`
3. Add `?intent` chooser to `/setup` for talent-only users (F-4)
4. Fix `Index.tsx` talent redirect to require confirmed empty org-fetch result (F-5)
5. Include `organization?.id` in React Query keys for `useSubscription`/`useAdminAccess`/`useEntitlements`/`useGcaAccess`; invalidate on org switch (F-6)
6. Add periodic `supabase.auth.getUser()` heartbeat in `AuthContext` (F-7)
7. Restrict `?redirect=` param to allowlist regex (F-8)
8. Move GCA `priceId` resolution to `create-checkout` edge function (F-13)
9. Banner + audit log for GCA admin paywall bypass (F-12)
10. Persistent Act-As banner + write-confirmation modal (F-20)
11. Wire `<PermissionAwareEmpty>` into the four remaining recruiter/employer surfaces (F-21)

## Out of Scope / Already Resolved
- Public `/verify/:certId` integrity — resolved by GCA/OAP Pass A (`effective_status` server-computed).
- Talent profile public-view leakage — resolved by Talent Pass A/B/C/D (safe-view + employer-verified SELECT).
- Storage bucket exposure for certificates — resolved by GCA/OAP Pass B (admin/service-only bucket).

---

## Severity Definitions
- **ERROR** — Exploitable today OR causes broken pipeline routing for a real user class.
- **WARN** — Defense-in-depth gap or UX-correctness issue with low immediate exploitability.
- **INFO** — Hardening or hygiene item.

## Next Step
Awaiting approval to execute remediation in passes:
- **Pass A** (ERROR): F-1, F-2, F-3, F-5, F-7, F-9, F-12, F-14, F-15, F-17, F-19
- **Pass B** (WARN): F-4, F-6, F-8, F-10, F-13, F-16, F-18, F-20
- **Pass C** (INFO + cleanup): F-11, F-21

---

## Pass A Remediation Log (2026-05-08)

**Migration `20260508_pass_a_auth_onboarding`:**
- `mark_onboarding_complete(_path text)` SECURITY DEFINER RPC — verifies org membership (path='org') or operator profile (path='talent') before completion
- `guard_user_onboarding_completion` BEFORE UPDATE trigger on `user_onboarding` — blocks direct client toggling of `is_complete`/`completed_at`; only the RPC may set them (via session flag `app.via_onboarding_rpc`)
- `resolve_post_login_destination()` SECURITY DEFINER STABLE RPC — returns `{destination, has_org, org_id, org_role, has_talent, onboarding_complete, plan}`
- `enforce_employer_entitlement` BEFORE INSERT trigger applied to `job_postings`, `talent_saved_lists`, `talent_contact_requests` — rejects writes when org plan is free/null (platform admins exempt)
- `enforce_recert_actor_and_log` extended — recorder must be owner/admin/supervisor of the operator's organization (platform admins exempt)
- `oap_certificates_effective` view (security_invoker) exposes server-computed `effective_status` (revoked/suspended/expired/valid)
- `sweep_expired_oap_certificates()` admin/service-role function flips `active → expired` when `valid_until < CURRENT_DATE`
- `admin_get_user_pipeline_summary(_user_id uuid)` SECURITY DEFINER RPC — platform-admin-only consolidated view (onboarding, orgs+plans, talent profile, GCA cert counts by bank, OAP cert counts by effective status, user_roles); writes audit row to `data_access_logs`

**Frontend changes:**
- `src/contexts/AuthContext.tsx` — added 5-min + visibilitychange `auth.getUser()` heartbeat; force-signout on revoked session (F-7)
- `src/pages/Auth.tsx` — replaced inline `user_onboarding` query with `resolve_post_login_destination` RPC; added `?redirect=` allowlist regex (F-2/F-8)
- `src/pages/Index.tsx` — talent redirect now waits for `orgLoading=false` before triggering (F-5)
- `src/hooks/useOnboarding.ts` — `completeStep` (when isComplete) and `skipOnboarding` now route through `mark_onboarding_complete` RPC; helper `resolveOnboardingPath` infers path from org membership (F-1)
- `src/components/auth/RouteGuards.tsx` — new `RequireAuth`, `RequireOrg`, `RequireRole`, `RequireSubscription` HOCs with shared Forbidden/Loading panes (F-9)
- `src/App.tsx` — wrapped `/dashboard`, `/teams`, `/admin`, `/testing`, `/queue`, `/history`, `/quote-history`, `/setup`, `/settings`, `/oap/employer`, `/gca/employer`, `/gca/test/:bankSlug`, `/oap/my-transcript`, `/talent/dashboard`, `/talent/search` with appropriate guards
- `src/pages/GcaTestPage.tsx` — admin/supervisor paywall-bypass clone of canonical Pro bank now writes `data_access_logs` row with `operation='admin_paywall_bypass_clone'` (F-12)

**Verification:** Supabase linter run after migration — no new ERROR-level findings introduced; all WARNs are pre-existing (per Security Audit Policy memory: ignore non-error warnings).

**Pass B / Pass C:** Deferred to a follow-up turn (defense-in-depth + UX cleanup per audit doc — not started this turn due to time).

---

## Pass B/C Remediation Log (2026-05-08)

**Migration `20260508_pass_b_c_hardening.sql`:**

- `enforce_operator_profile_publishable` BEFORE INSERT OR UPDATE trigger (F-10) — blocks `is_discoverable=true` when `headline` is null/empty OR no `operator_skills` rows exist for the user; error message includes the failing field name in `HINT` for UI surfacing
- `enforce_walkthrough_no_self_sign` BEFORE INSERT OR UPDATE trigger (F-16) — blocks `primary_mentor_id = operator_id` on `oap_walkthrough_sessions` with SQLSTATE 23000
- `resolve_post_login_destination` RPC updated (F-18) — reads `organizations.subscription_status` + `trial_ends_at` for the org; returns `trial_expired: true` and routes to `/pricing` when trial has lapsed and plan is `none`

**Frontend changes:**

- `src/pages/Setup.tsx` (F-4) — detects talent-only users (has `operator_profiles` row, no `organization_members` row) and renders a two-card chooser ("Continue as Talent" → `/talent/dashboard` vs "Set up a Shop" → adds `?intent=create_org`) unless `?intent=create_org` is already present
- `src/hooks/useSubscription.ts` + `src/hooks/useAdminData.ts` (F-6) — both now import `useOrgContext` and include `organization?.id` in their `useEffect`/`useCallback` dependency arrays; `check-subscription` also receives `org_id` in its body so org-scoped subscription state invalidates on org switch
- `supabase/functions/create-checkout/index.ts` + `src/hooks/useGcaAccess.ts` (F-13) — edge function resolves GCA price IDs from `GCA_PRICE_ID_MONTHLY`/`GCA_PRICE_ID_ANNUAL` env vars (with hardcoded fallback); client now passes `gca_interval: 'monthly'|'annual'` instead of the raw `priceId` so rotating Stripe IDs only requires a server-side env update
- `src/contexts/ActAsContext.tsx` + `src/components/admin/ActAsBanner.tsx` (F-20) — `ActAsContext` exposes `confirmWrite(description)` async function and `resolveWriteConfirm(confirmed)`; `ActAsBanner` renders a shadcn `AlertDialog` gated on `writeConfirm.pending`; write-critical surfaces call `confirmWrite()` before proceeding in test mode
- F-21 (Pass C): `PermissionAwareEmpty` wired into all four outstanding employer surfaces:
  - `TalentSearch.tsx` — no-org gate (`mode="tier"`) + role gate (`mode="permission"`) + empty results grid (`mode="empty"`)
  - `EmployerDashboard.tsx` — no-org guard replaced with `mode="permission"`
  - `GcaEmployer.tsx` — role guard replaced with `mode="permission"`
  - `OapEmployer.tsx` — role guard replaced with `mode="permission"`
- Removed unused imports (`Card`, `CardContent`, `ShieldAlert`, `Globe`) from pages where `PermissionAwareEmpty` replaced inline guards

**Out of scope this pass (F-11):** Cache-Control on `/talent/:username` is a hosting layer concern (Lovable/Vercel); no actionable code change available.

**All ERRORs (Pass A) and WARNs (Pass B) addressed. Only F-11 INFO remains (hosting limitation).**
