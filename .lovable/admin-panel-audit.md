# Admin Panel Audit — SDK / Platform Admin Visibility

**Date:** 2026-05-07  
**Scope:** `/admin` (Admin.tsx) + lazy-loaded sub-panels, `useAdminAccess`, `useAllUsers/Teams/Stations`, RLS policies on customer-facing tables, edge-function gating for support/troubleshooting.  
**Goal:** Confirm SDK admins (`user_roles.role = 'admin'`) and developers (`'developer'`) can view, edit, troubleshoot, and support **any** customer org without being blocked by frontend gates or RLS.

---

## 1. Executive Summary

| Area | Status | Notes |
|---|---|---|
| Tab visibility / role gating | ✅ OK | `hasPlatformAccess`, `hasTestingAccess`, `hasOrgAdminAccess` cleanly distinguish scopes. |
| User / org / station data fetch | ✅ OK | Backed by admin-aware policies on `profiles`, `organizations`, `organization_members`, `teams`, `stations`. |
| Org-scoped support data (NCRs, quality, integrations, invites, audit, AI chat, billing usage…) | ❌ **BLOCKED** | 26 customer tables have **no platform-admin SELECT policy** — admins see *empty* lists when supporting a customer. |
| Sensitive credentials (integrations, webhooks, API keys) | ⚠️ Partial | Org-admin-only. Acceptable for write but blocks read-only support visibility. |
| `/admin` redirect race | ⚠️ Minor | Initial flicker covered by `accessConfirmedRef`, but no toast on access loss. |
| Org-switcher / "view as org" for platform admin | ❌ Missing | Platform admin must change `scopedOrgId` only by being a member; no impersonation switcher in header. |
| Act-As session oversight | ⚠️ Partial | `act_as_sessions` writable by admins, but no admin SELECT-all policy for cross-actor audit. |

**Bottom line:** Frontend gating is sound; the actual blocker is **RLS**. A platform-admin support engineer cannot read most customer-owned rows even though the UI offers tabs that imply they can. This is the single largest fix and it's a server-side concern only.

---

## 2. RLS Gaps — Tables Lacking Platform-Admin SELECT

Each table below restricts SELECT to `is_org_member(...)` or `is_org_admin(...)` only. A platform admin who is **not** a member of the customer's org gets `0 rows` instead of an explicit error — making bugs invisible during support calls.

### 2.1 Production / Quality
- `ncr_reports` — supervisors approve, but admin can't read NCRs across orgs.
- `quality_inspections`, `quality_checkpoints`
- `dimension_readings`, `dimension_check_requests`
- `routing_templates`, `setup_sheets`, `part_catalog`
- `equipment`, `maintenance_records`, `material_lots`
- `downtime_events`, `delivery_requests`
- `shift_assignments`, `announcements`, `announcement_reads`

### 2.2 Org-management surfaces
- `organization_invites` — can't audit pending invites
- `organization_branding`
- `organization_integrations` (sensitive — see §3)
- `organization_webhooks` (sensitive — see §3)
- `organization_usage` — admin can't audit seat/feature usage
- `organization_machine_purchases`
- `organization_audit_events` — admin **cannot read the audit trail** of customer orgs ⚠️

### 2.3 Talent / AI / Misc
- `operator_profiles` — admin can't troubleshoot a public profile
- `planning_chat_sessions` — admin can't replay AI sessions for support
- `entitlements` — admin sees only orgs they belong to

### Already covered (no change needed)
`queue_items`, `handoff_records`, `current_station_status`, `stations`, `teams`, `team_members`, `profiles`, `organizations`, `organization_members`, `organization_billing`, `subscriptions`, `app_settings`, `activity_logs`, `data_access_logs`, `user_roles`, `act_as_sessions` (insert), `issues`, `changelogs`, `dev_issue_queue`, `rls_health_checks`.

---

## 3. Sensitive Credentials — Read vs. Write

| Table | Read-by-admin? | Recommendation |
|---|---|---|
| `organization_integrations` | ❌ | Add platform-admin SELECT **on a redacted view** (e.g. `organization_integrations_safe` excluding encrypted secrets) — never expose plaintext credentials, even to admins. |
| `organization_webhooks` | ❌ (existing `organization_webhooks_safe` view exists per memory) | Confirm the safe view has admin SELECT and that `OrgDetailView` queries it. |
| `organization_api_keys` | not tested | Mirror webhook pattern. |

Per project memory: **credential isolation** is intentional. Recommendation is therefore *visibility via safe views* (metadata only) — not raw access.

---

## 4. UI / UX Gaps in Admin.tsx

| # | Gap | Severity | Fix |
|---|---|---|---|
| 4.1 | When a tab's data is empty due to RLS (rather than truly empty), admin sees a blank table with no diagnostic. | High | After resolving §2, also add an "Empty due to permission?" hint in shared empty-state component when `hasPlatformAccess && rows.length===0`. |
| 4.2 | No **org switcher** in admin header. Platform admin must navigate via `OrganizationOversight → OrgDetailView` on every interaction; sub-tabs don't pick up the selected org. | High | Add a top-bar `<OrgScopeSelect>` wired to `useAdminData.scopedOrgId`. Already partially modeled in `useAllUsers({ organizationId })`. |
| 4.3 | `useAdminAccess` calls `organization_members.maybeSingle()` — fails silently if a platform admin belongs to >1 orgs (currently schema-unique by user, but future risk). | Low | Switch to `.select(...).order('joined_at')` + take first, or surface all memberships. |
| 4.4 | Redirect race: `accessConfirmedRef` correctly suppresses re-redirect on tab refocus, but if RLS revokes the role mid-session the user is stuck on `/admin` with empty data and no toast. | Medium | Show toast on transition `hasAdminAccess: true → false`, then redirect. |
| 4.5 | "Dev" tabs (RLS Health, User Journey, Machine Library) lack scope awareness — they always run platform-wide regardless of any selected org. | Low | Pass `scopedOrgId` so admins can run a journey or health check against one customer. |
| 4.6 | `BulkUploadDialog` does not show which org rows will be inserted into when a platform admin is not a member of any org — risk of silently failing inserts. | Medium | Require explicit org selection before enabling Upload button when `!organizationId`. |
| 4.7 | `ConsoleLogViewer`, `IssuesManagement`, `DevIssueQueue` shown only on `hasTestingAccess` — correct. But missing link from a customer's `OrgDetailView` → "Open issues filed by this org". | Low | Add "Open issues" link in `OrgDetailView`. |
| 4.8 | DialogContent missing `aria-describedby` warning in console (current preview log). | Low | Add `<DialogDescription>` to whichever modal triggers it. |

---

## 5. Customer-Service Workflows — End-to-End Test

Walked the SDK admin path "support a customer reporting NCRs missing":

1. `/admin → Organizations` ✅ list visible
2. Click org → `OrgDetailView` ✅ overview/details visible
3. Switch to `NCRs` view (none exists — admin must navigate to `/quality` while pretending to be the user)
4. **Blocker:** Platform admin opens `/quality` → empty (RLS). No "Act-As" prompt.
5. Workaround today: Use `ActAsContext.startActAs()` to impersonate an org member, then navigate. → Works, but is a 5-step manual loop.

**Recommendation:** Surface a **"Open as customer view"** button in `OrgDetailView` that auto-starts an act-as session for an org admin of that org. Pairs with §4.2 (org switcher).

---

## 6. Edge Function / Server-Side Gaps

- `apply-routing-change`, `ai-planning-assistant`, `erp-sync`, `sap-sync`: all verify org membership; **no platform-admin bypass** for support replays. Acceptable per FedRAMP, but document the limitation in `/dev`.
- `act_as_sessions` rate limit (10/hr) is per-actor — fine. Add admin-only SELECT-all so audit reviewers can pull cross-actor history.
- `data_export_requests` — admin can read but cannot create on a customer's behalf.

---

## 7. Recommended Remediation Order

| Pass | Work | Risk | Files |
|---|---|---|---|
| **A — Critical** | Add `has_role(auth.uid(),'admin')` SELECT override to the 26 tables in §2 (excluding raw credentials). One migration. | Low — additive policy, no behavior change for non-admins. | new migration |
| **B — Sensitive** | Create/confirm `organization_integrations_safe` view + admin SELECT; same for `organization_api_keys`. | Medium — must verify no secret column leaks. | new migration + view |
| **C — UX** | Org switcher in admin header (§4.2) + "Open as customer" button (§5) + bulk-upload guard (§4.6). | Low | `Admin.tsx`, `OrgDetailView.tsx`, `BulkUploadDialog.tsx`, new `OrgScopeSelect.tsx` |
| **D — Polish** | Empty-state hint (§4.1), session-loss toast (§4.4), dev-tools scope (§4.5), aria fix (§4.8). | Low | shared empty-state, `Admin.tsx` |

---

## 8. Sign-off Checklist

- [ ] Migration drafted for §2 admin-SELECT additions (Pass A)
- [ ] Safe-view audit for §3 credential tables (Pass B)
- [ ] Org-switcher + "view as customer" UI (Pass C)
- [ ] Polish items (Pass D)
- [ ] Re-run `supabase--linter` and `RLSHealthCheck` panel after each pass

---

**Status of this document:** Findings only. No code or schema changes have been applied. Awaiting approval to proceed with Pass A.
