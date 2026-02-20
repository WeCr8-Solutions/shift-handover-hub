

# Role & Scope Test Target User Picker, Issues/Changelog Global Access Fix

## Overview
Currently the Role & Scope tests only run against the logged-in user's own data. Admins and developers need to select any user or organization and run scope tests against that target to diagnose access issues. Additionally, the global issues system and activity logs need developer-level access fixes, and a changelog system should be added for SDK/admin teams.

---

## Problem Summary

1. **Role & Scope Tests are self-only** -- An admin cannot pick "User X in Org Y" and see what that user's RLS results look like. All 24 tests only query `auth.uid()`.
2. **Activity logs exclude developers** -- The RLS policy only has `has_role('admin')` for global SELECT. Developers cannot see activity logs at all.
3. **No changelog/release notes system** -- Dev teams have no way to track and publish changes made to the platform.

---

## Changes

### 1. Add Target User Picker to RoleScopeTestRunner

Add a user/org selector at the top of the Roles & Scope tab that lets admin/developer users pick a target user to inspect. The test runner will then query that user's roles, org memberships, and team memberships and display them in the User Context Card.

**Important**: RLS means the client SDK can only query data visible to the logged-in user. Since admins can already see all `user_roles`, `organization_members`, `team_members`, `profiles`, etc., the target picker will:
- Fetch all users from `profiles` (admin-visible)
- Let admin select a user
- Query that user's `user_roles`, `organization_members`, `team_members`
- Display the target user's context card with their full role/scope breakdown
- Run a subset of tests that can evaluate the target user's data (read-only checks, not mutations)

**File**: `src/components/testing/RoleScopeTestRunner.tsx`
- Add a `Select` dropdown at the top to pick a target user (populated from `profiles`)
- Add an org filter dropdown to narrow users by organization
- Pass `targetUserId` into test definitions that support it
- Update `UserContextCard` to show the selected target user's roles
- Add new "Target User Analysis" suite with tests like:
  - Target has platform role(s)
  - Target has org membership
  - Target has team membership(s)
  - Target's visible stations count
  - Target's visible queue items count

### 2. Fix Activity Logs RLS for Developers

**Database migration**: Add a new SELECT policy on `activity_logs` for developers.

```sql
CREATE POLICY "Developers can view all activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role));
```

**File**: `src/components/admin/ActivityLogs.tsx`
- Update the `isAdmin` check to also include `isDeveloper` so developers see the full log view (currently they fall through to the org_admin view which may also fail).

### 3. Add Changelog System

Create a `changelogs` table for tracking platform changes visible to admin/dev teams.

**Database migration**:
```sql
CREATE TABLE public.changelogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  version TEXT,
  change_type TEXT NOT NULL DEFAULT 'improvement',
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.changelogs ENABLE ROW LEVEL SECURITY;

-- Only admin/dev can read
CREATE POLICY "Dev and admin can read changelogs"
ON public.changelogs FOR SELECT TO authenticated
USING (is_dev_or_admin(auth.uid()));

-- Only admin/dev can insert
CREATE POLICY "Dev and admin can insert changelogs"
ON public.changelogs FOR INSERT TO authenticated
WITH CHECK (is_dev_or_admin(auth.uid()));

-- Only admin/dev can update
CREATE POLICY "Dev and admin can update changelogs"
ON public.changelogs FOR UPDATE TO authenticated
USING (is_dev_or_admin(auth.uid()));

-- Only admin can delete
CREATE POLICY "Admin can delete changelogs"
ON public.changelogs FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

**New file**: `src/components/admin/ChangelogManager.tsx`
- Card-based UI to create/edit/publish changelog entries
- Fields: title, description, version tag, change type (feature, fix, improvement, breaking)
- Publish toggle
- List of recent entries with edit/delete

**File**: `src/pages/Admin.tsx`
- Add a "Changelog" tab to the admin dashboard alongside Issues and Dev Queue

---

## Technical Details

### Files Created
| File | Purpose |
|------|---------|
| `src/components/admin/ChangelogManager.tsx` | Changelog CRUD UI for admin/dev teams |

### Files Modified
| File | Change |
|------|--------|
| `src/components/testing/RoleScopeTestRunner.tsx` | Add target user picker, target user analysis suite |
| `src/components/admin/ActivityLogs.tsx` | Include `isDeveloper` in full-access check |
| `src/pages/Admin.tsx` | Add Changelog tab |

### Database Migrations
| Change | Purpose |
|--------|---------|
| New SELECT policy on `activity_logs` for developers | Fix developer access to logs |
| New `changelogs` table with RLS | Track platform changes |

### Security Notes
- Target user picker is read-only analysis -- no mutations on behalf of target user
- All target data queries go through existing RLS (admin already has SELECT on all relevant tables)
- Changelog table restricted to admin/dev via `is_dev_or_admin()` helper
- Activity logs developer policy uses same pattern as issues table

