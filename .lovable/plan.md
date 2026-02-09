
# Complete User Journey RLS Audit & Admin/Developer Access Protection Plan

## Executive Summary

This plan addresses two critical concerns:
1. **User Journey RLS Verification** - Ensure new users can complete the full onboarding flow (signup → org creation → team setup → stations → work orders → handoffs)
2. **Admin/Developer Access Isolation** - Ensure regular operators/org users cannot access admin/developer tools and sensitive data

---

## Current State Analysis

### What's Working Well

The recent migration (`20260209090429`) fixed the "chicken-and-egg" RLS issue for onboarding:
- **Organizations**: Users can create orgs with themselves as `created_by`
- **Organization Members**: Users can add themselves as owner during org creation
- **Teams**: Org admins/owners can create teams with proper org scope
- **Team Members**: Users can join teams within their org
- **Stations**: Org/team admins can create stations within their scope

### Admin/Developer Protection (Already Implemented)

| Resource | Protection Level | Mechanism |
|----------|------------------|-----------|
| `dev_issue_queue` | Dev/Admin only | `is_dev_or_admin(auth.uid())` RLS |
| `rls_health_checks` | Dev/Admin only | `has_role('admin'/'developer')` RLS |
| `stripe_events` | Dev/Admin only | `has_role('admin'/'developer')` RLS |
| `issues` (view all) | Dev/Admin only | `has_role('admin'/'developer')` for SELECT |
| Testing page | Dev/Admin only | `hasTestingAccess` UI gate |
| Admin page | Supervisor+ only | `hasAdminAccess` UI gate |

### UI Access Controls (Already Implemented)

```
Header.tsx:
- /admin route: Visible only when hasAdminAccess === true
- /testing route: Visible only when hasTestingAccess === true
- Teams link: Visible only when hasOrgSupervisorAccess === true
```

---

## Issues Identified

### Issue 1: Missing Entitlements Auto-Creation (CRITICAL)

**Problem**: When organizations are created, no `entitlements` record is created. This causes:
- `check_limit_access()` returns NULL → limit checks fail silently
- New orgs may be blocked from creating stations/work orders

**Evidence**: All 5 existing orgs have NULL entitlements:
```
Cr8 Coin       → entitlement_id: NULL
Real Test Org  → entitlement_id: NULL
Test Org       → entitlement_id: NULL
Silly Goose Crew → entitlement_id: NULL
WeCr8          → entitlement_id: NULL
```

**Fix Required**: Create a trigger to auto-generate entitlements with free tier defaults when an org is created.

### Issue 2: Entitlements INSERT Policy Missing

**Problem**: The `entitlements` table only has a SELECT policy. If we add a trigger with SECURITY DEFINER, this is fine. But without that, service role is needed.

**Current policies on entitlements**:
- SELECT: `is_org_member(auth.uid(), organization_id)` ✓
- INSERT: None ⚠️
- UPDATE: None ⚠️

### Issue 3: User Roles Assignment Validation

**Problem**: While RLS prevents org admins from assigning `admin`/`developer` roles at the database level, there's no UI validation message explaining why the action failed.

**Current protection (WORKING)**:
```sql
-- Org admins can only assign: supervisor, operator, viewer
role IN ('supervisor', 'operator', 'viewer')
AND is_org_admin(auth.uid(), organization_id)
```

---

## Implementation Plan

### Phase 1: Auto-Create Entitlements on Org Creation

Create a database trigger that automatically creates an entitlements record when a new organization is created:

```sql
-- 1. Create trigger function
CREATE OR REPLACE FUNCTION public.auto_create_org_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create free tier entitlements for new org
  INSERT INTO public.entitlements (
    organization_id,
    plan,
    features,
    limits
  ) VALUES (
    NEW.id,
    'free',
    '{"handoff_hub": true, "work_orders": true, "analytics": false, "api_access": false, "bulk_upload": false}'::jsonb,
    '{"users": 5, "work_orders_per_month": 100, "stations": 3}'::jsonb
  );
  RETURN NEW;
END;
$$;

-- 2. Create trigger
CREATE TRIGGER trigger_auto_create_entitlements
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_org_entitlements();

-- 3. Backfill existing orgs without entitlements
INSERT INTO public.entitlements (organization_id, plan, features, limits)
SELECT 
  o.id,
  'free',
  '{"handoff_hub": true, "work_orders": true, "analytics": false, "api_access": false, "bulk_upload": false}'::jsonb,
  '{"users": 5, "work_orders_per_month": 100, "stations": 3}'::jsonb
FROM organizations o
LEFT JOIN entitlements e ON o.id = e.organization_id
WHERE e.id IS NULL;
```

### Phase 2: Verify Complete User Journey RLS

Run verification queries to confirm all journey steps work:

| Step | Table | Operation | RLS Policy |
|------|-------|-----------|------------|
| 1. Signup | profiles | INSERT | Via `handle_new_user()` trigger |
| 2. Get operator role | user_roles | INSERT | Via `handle_new_user()` trigger |
| 3. Create org | organizations | INSERT | `auth.uid() = created_by` ✓ |
| 4. Join as owner | organization_members | INSERT | `auth.uid() = user_id` ✓ |
| 5. Create team | teams | INSERT | `is_org_admin OR is_org_member+created_by` ✓ |
| 6. Join team | team_members | INSERT | `auth.uid() = user_id + org_member` ✓ |
| 7. Create station | stations | INSERT | `is_org_admin OR team_admin` ✓ |
| 8. Create work order | queue_items | INSERT | `is_org_member(organization_id)` ✓ |
| 9. Submit handoff | handoff_records | INSERT | `is_org_member via team` ✓ |

### Phase 3: Admin/Developer Data Isolation Verification

Already properly isolated via RLS:

| Sensitive Table | Regular User Access | Dev/Admin Access |
|-----------------|---------------------|------------------|
| `dev_issue_queue` | BLOCKED | Full access |
| `stripe_events` | BLOCKED | Full access |
| `rls_health_checks` | BLOCKED | Full access |
| `activity_logs` (all) | BLOCKED | Full access |
| `user_roles` (admin/dev) | Cannot INSERT/DELETE | Full access |

No changes needed - isolation is correctly implemented.

---

## Technical Details

### Database Migration

The migration will:
1. Create `auto_create_org_entitlements()` function with SECURITY DEFINER
2. Create `trigger_auto_create_entitlements` trigger on `organizations`
3. Backfill missing entitlements for existing organizations

### Files Affected

- `supabase/migrations/[new].sql` - New migration for entitlements trigger

### Verification Steps

After implementation:
1. Create a fresh test user
2. Complete full onboarding flow
3. Verify entitlements are created
4. Verify work order/station creation works
5. Attempt to access /admin and /testing routes (should be blocked)
6. Attempt to query dev_issue_queue (should return empty)

---

## Security Considerations

1. **SECURITY DEFINER** is used for the trigger function since the user doesn't have INSERT rights on entitlements during org creation
2. **Org admins cannot escalate privileges** - RLS prevents assigning admin/developer roles
3. **Sensitive billing data is isolated** - stripe_events only readable by dev/admin roles
4. **UI and database are both protected** - Defense in depth with UI gates + RLS policies

---

## Summary

| Area | Status | Action Required |
|------|--------|-----------------|
| Org creation RLS | ✅ Fixed | None |
| Team creation RLS | ✅ Fixed | None |
| Station creation RLS | ✅ Fixed | None |
| Work order creation | ✅ Fixed | None |
| Entitlements auto-creation | ✅ Implemented | None - trigger + backfill complete |
| Admin/Dev UI isolation | ✅ Working | None |
| Admin/Dev data isolation | ✅ Working | None |
| User role escalation prevention | ✅ Working | None |

---

## Implementation Complete (2026-02-09)

Migration `20260209_auto_create_entitlements` deployed:
- ✅ `auto_create_org_entitlements()` trigger function created
- ✅ `trigger_auto_create_entitlements` attached to `organizations` table  
- ✅ All existing orgs backfilled with free tier entitlements

**Note**: The "Leaked Password Protection Disabled" warning is a pre-existing auth configuration setting, not related to this RLS work.
