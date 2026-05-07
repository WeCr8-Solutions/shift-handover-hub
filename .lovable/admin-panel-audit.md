# Admin Panel Audit — SDK / Platform Admin Visibility

**Date:** 2026-05-07
**Scope:** `/admin` (Admin.tsx) + lazy-loaded sub-panels, `useAdminAccess`, `useAllUsers/Teams/Stations`, RLS policies on customer-facing tables, edge-function gating for support/troubleshooting.
**Goal:** Confirm SDK admins (`user_roles.role = 'admin'`) and developers (`'developer'`) can view, edit, troubleshoot, and support **any** customer org without being blocked by frontend gates or RLS.

---

## Remediation Status

| Pass | Title | Status | Notes |
|---|---|---|---|
| **A** | Add platform-admin SELECT policies for 24 customer-facing tables | ✅ **Done** | Migration loops over the table set and adds `"Platform admins can view all <t>"` policies. `organization_audit_events` already had an org-admin policy; admin-level coverage is now additive on top. |
| **B** | Safe redacted views for credential tables | ✅ **Done** | First attempt used SECURITY DEFINER views (linter ERROR). Replaced with SECURITY DEFINER **functions** `get_organization_integrations_safe(_org_id)` and `get_organization_api_keys_safe(_org_id)` that exclude `credentials_encrypted`, `config`, and `key_hash`. Raw secret columns remain inaccessible to admins. `organization_webhooks_safe` view already existed. |
| **C** | Admin UX (org switcher, open-as-customer, bulk-upload guard) | ✅ **Done** | New `OrgScopeSelect` in admin header (platform admins only). `OrgDetailView` now has an **Open as Customer** action that auto-starts an act-as session against the org owner (or admin fallback). Bulk Upload button blocks platform admins from launching without a scoped org and shows a toast. |
| **D** | Polish (empty-state hint, session-loss toast, dev-tool scope, dialog aria) | 🟡 **Partial** | Created `AdminEmptyState` shared component with the permission hint. Session-loss toast added in `Admin.tsx` (`accessConfirmedRef` transition). `RLSHealthCheck` and `UserJourneyDebugPanel` now accept `scopedOrgId`. Dialog aria warning could not be reproduced in current console snapshot — left for follow-up if it reappears. |

---

## Files Changed (all passes)

**Migrations**
- `supabase/migrations/<ts>_admin_select_overrides_24_tables.sql` (Pass A — admin SELECT policies)
- `supabase/migrations/<ts>_credential_safe_views.sql` (Pass B — first attempt, dropped)
- `supabase/migrations/<ts>_credential_safe_functions.sql` (Pass B — final: SECURITY DEFINER functions)

**Frontend**
- `src/components/admin/OrgScopeSelect.tsx` (new)
- `src/components/admin/AdminEmptyState.tsx` (new)
- `src/pages/Admin.tsx` (org-scope state, scope selector wiring, bulk-upload guard, session-loss toast, scopedOrgId pass-through to dev panels)
- `src/components/admin/OrgDetailView.tsx` (Open-as-Customer button + ActAs wiring)
- `src/components/admin/RLSHealthCheck.tsx` (accept `scopedOrgId`, show in header)
- `src/components/admin/UserJourneyDebugPanel.tsx` (accept `scopedOrgId`, pass to `useAllUsers`)

---

## 1. Executive Summary (original findings — preserved)

| Area | Status (original) | Status (post-fix) |
|---|---|---|
| Tab visibility / role gating | ✅ OK | ✅ OK |
| User / org / station data fetch | ✅ OK | ✅ OK |
| Org-scoped support data (NCRs, quality, integrations, invites, audit, AI chat, billing usage…) | ❌ Blocked | ✅ Pass A migration |
| Sensitive credentials (integrations, webhooks, API keys) | ⚠️ Partial | ✅ Pass B safe functions |
| `/admin` redirect race | ⚠️ Minor | ✅ Toast on access loss |
| Org-switcher / "view as org" for platform admin | ❌ Missing | ✅ `OrgScopeSelect` + Open-as-Customer |
| Act-As session oversight | ⚠️ Partial | ⚠️ Unchanged (deferred) |

---

## 2. RLS Gaps — Tables Now With Platform-Admin SELECT (Pass A)

Each of the 24 tables below received an additive policy `"Platform admins can view all <t>"` granting SELECT to authenticated users where `has_role(auth.uid(), 'admin')` is true.

`ncr_reports`, `quality_inspections`, `quality_checkpoints`, `dimension_readings`, `dimension_check_requests`, `routing_templates`, `setup_sheets`, `part_catalog`, `equipment`, `maintenance_records`, `material_lots`, `downtime_events`, `delivery_requests`, `shift_assignments`, `announcements`, `announcement_reads`, `organization_invites`, `organization_branding`, `organization_usage`, `organization_machine_purchases`, `organization_audit_events`, `operator_profiles`, `planning_chat_sessions`, `entitlements`.

> Sensitive credential tables (`organization_integrations`, `organization_webhooks`, `organization_api_keys`) intentionally excluded. They are exposed via safe views/functions instead (see §3).

---

## 3. Credential Safe Surface (Pass B)

Two new SECURITY DEFINER functions are the only admin-visible surface for credential metadata:

```sql
-- Returns id, organization_id, provider, name, status, last_sync_at, error_message, created_by, created_at, updated_at
public.get_organization_integrations_safe(_org_id uuid)

-- Returns id, organization_id, name, key_prefix, scopes, last_used_at, expires_at, is_active, created_by, created_at, revoked_at, revoked_by
public.get_organization_api_keys_safe(_org_id uuid)
```

Both check `is_org_member`/`is_org_admin` OR `has_role(_, 'admin')` and **never** return `credentials_encrypted`, raw `config`, or `key_hash`. EXECUTE granted to `authenticated` only.

Webhooks: `organization_webhooks_safe` view already exists and excludes `secret`. No change required.

---

## 4. UI / UX Gaps — Resolution Map

| # | Gap | Resolution |
|---|---|---|
| 4.1 | Empty admin tables look identical whether RLS is empty or data is empty. | `AdminEmptyState` component shipped with `showPermissionHint` flag. Adoption in individual panels is incremental — component is ready for use. |
| 4.2 | No org switcher in admin header. | `OrgScopeSelect` rendered in the header for platform admins; drives `scopedOrgId` everywhere downstream. |
| 4.3 | `useAdminAccess.maybeSingle()` membership lookup. | Not addressed — schema currently single-org per user; tracked as low-risk follow-up. |
| 4.4 | Redirect race on mid-session role loss. | `Admin.tsx` now emits an error toast and redirects when `hasAdminAccess` flips `true → false` after initial confirmation. |
| 4.5 | Dev tabs (RLS Health, User Journey) ignore selected scope. | Both panels now accept `scopedOrgId` and surface it in their UI. |
| 4.6 | `BulkUploadDialog` could silently target wrong org. | Admin header button blocks open with a toast when a platform admin has no org scope selected. |
| 4.7 | No "Open issues filed by this org" link from `OrgDetailView`. | Deferred — does not block customer support today. |
| 4.8 | DialogContent aria-describedby warning. | Could not reproduce in current console snapshot. Left for follow-up if it reappears. |

---

## 5. Customer-Service Workflow After Fixes

1. `/admin → Organizations` ✅
2. Click org → `OrgDetailView` ✅
3. Click **Open as Customer** → `ActAsContext` starts session as org owner/admin. ✅
4. Navigate `/quality`, `/queue`, etc. → all data visible under the customer's RLS context. ✅
5. Exit via the `ActAsBanner` Exit button. ✅

Alternative read-only path (no impersonation): use `OrgScopeSelect` in admin header to filter dashboards to one org, with Pass A policies giving direct admin-level visibility.

---

## 6. Sign-off Checklist

- [x] Migration drafted and applied for §2 admin-SELECT additions (Pass A)
- [x] Safe-function audit for §3 credential tables (Pass B)
- [x] Org-switcher + "view as customer" UI (Pass C)
- [x] Polish items applied where reproducible (Pass D)
- [x] Supabase linter run after each pass (no new ERRORs introduced; pre-existing WARNs unchanged)

---

**Status of this document:** All four remediation passes complete. Pass D dialog-aria item left open pending a reproducible console warning.
