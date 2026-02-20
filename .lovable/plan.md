

# Role Isolation: Separate Org-Scoped Admin from SDK/Developer Tools

## Problem

Currently, **supervisors** and **org admins** land on the same Admin Dashboard page as **platform admins** and **SDK developers**. This exposes them to:

- Issues Management (global issue queue -- SDK tool)
- Changelog Manager (platform-level release notes -- SDK tool)
- Activity Logs (global system logs -- SDK tool)
- Seed Test Data button (developer utility)
- Bulk Upload button (should be org-admin only, not supervisor)
- Global system stats (cross-org counts)

Operators and viewers cannot reach `/admin` at all (correct), but the boundary between "org admin/supervisor" and "platform admin/developer" is blurred once inside.

## Solution

Restructure the Admin page to show **only org-scoped tabs** to supervisors/org-admins and reserve **global/SDK tabs** for platform admin and developer roles. No new pages needed -- just conditional tab visibility within the existing Admin page.

---

## Changes

### 1. Admin Page Tab Visibility (src/pages/Admin.tsx)

Split tabs into three visibility tiers:

| Tier | Who sees it | Tabs |
|------|-------------|------|
| **Org-scoped** | Supervisors, Org Admins, Platform Admin, Developer | Overview, Organizations (own only), Users (own org), Stations (own org), Work Orders, History, Routing, Performance |
| **SDK/Global** | Platform Admin and Developer only | Issues, Changelog, Activity Logs |
| **Dev Tools** | Developer and Platform Admin only (already correct) | Dev Queue, Dev Settings, RLS Health, User Journey |

Concrete changes:
- Wrap the "Activity" bucket (Activity, Issues, Changelog tabs) in `{(isAdmin or isDeveloper) && ...}` guard
- Wrap `SeedTestDataButton` in `{hasTestingAccess && ...}` guard
- Wrap `BulkUpload` in `{(isAdmin or isDeveloper or isOrgAdmin) && ...}` guard (supervisors should not seed/bulk-upload)
- Update the page header subtitle: show "Organization Management" for supervisors, "System Management" for admin/dev

### 2. Scope AdminStatsCards for Non-Platform Users (src/components/admin/AdminStatsCards.tsx)

Currently shows global counts (totalUsers across all orgs, totalOrgs, etc.). For org-scoped users (supervisors/org-admins), these stats should either:
- Show org-scoped counts only, or
- Be hidden entirely

Plan: Hide the full stats row for non-admin/developer users and show a simplified org-scoped summary instead.

### 3. Org-Scoped Data in Overview Tab

When a supervisor or org admin views the Overview tab, the data queries should be filtered to their org. The `isAdmin` prop passed to child components like `OrganizationOversight`, `UserManagement`, `StationManagement` already controls this -- verify they correctly scope data for non-platform-admin users.

### 4. Update useAdminAccess Hook (src/hooks/useAdminData.ts)

Add a new computed flag:
```
hasPlatformAccess: isAdmin || isDeveloper  // SDK-level tools
```
This is cleaner than checking `isAdmin || isDeveloper` throughout the UI.

### 5. Header Badge Label (src/pages/Admin.tsx)

Currently shows "Administrator" / "Developer" / "Supervisor". Add "Org Admin" distinction:
- Platform Admin -> "Platform Admin"
- Developer -> "SDK Developer"  
- Org Owner -> "Org Owner"
- Org Admin -> "Org Admin"
- Supervisor -> "Supervisor"

---

## Files Modified

| File | Change |
|------|--------|
| `src/hooks/useAdminData.ts` | Add `hasPlatformAccess` computed flag |
| `src/pages/Admin.tsx` | Gate Activity/Issues/Changelog tabs behind `hasPlatformAccess`; gate SeedTestData behind `hasTestingAccess`; gate BulkUpload behind org-admin+; update badge labels |
| `src/components/admin/AdminStatsCards.tsx` | Accept `hasPlatformAccess` prop; show simplified org stats for org-scoped users |

## What Does NOT Change

- `/testing` page -- already correctly gated by `hasTestingAccess`
- Header navigation -- supervisors still see the Admin shield icon (they need their org dashboard)
- Signup flow -- `handle_new_user` correctly assigns only `operator` role; org roles come from org membership
- RLS policies -- already enforce org-scoped data isolation at the database level
- Dev Tools bucket -- already gated by `hasTestingAccess`

## Security Notes

- This is a **UI-level enforcement** layered on top of existing **RLS-level enforcement**. Even if a supervisor somehow navigated to a global tab, the RLS policies on `issues`, `changelogs`, `dev_issue_queue`, and `activity_logs` already prevent them from seeing data they shouldn't.
- The `changelogs` table RLS uses `is_dev_or_admin()` -- supervisors cannot read it.
- The `issues` table RLS restricts non-admin/dev users to their own reported issues.
- This change ensures the UI matches the database security boundaries.

