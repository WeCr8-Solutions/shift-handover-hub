
# RLS and Role-Based Organization-Scoped Access Control Plan

## Overview
This plan addresses critical RLS policy gaps that prevent organization admins from managing supervisor/operator roles within their organizations, while ensuring platform-level roles (admin, developer) remain reserved for platform owners only.

## Current State Analysis

### What's Working Correctly
- **Three-tier role hierarchy** is well-documented and understood
- **useAdminAccess hook** correctly distinguishes between platform roles and org roles
- **useOrganizationMembers hook** has proper client-side validation (lines 169-171, 196-199) that restricts org admins to assigning only `supervisor` and `operator` roles
- **Header component** correctly gates access based on combined role checks
- **Testing dashboard** is properly restricted to `developer` and `admin` roles

### Critical RLS Policy Gaps

#### Issue 1: Org Admins Cannot Insert User Roles
Current `user_roles` INSERT policy:
```sql
-- Only platform admins can insert
WITH CHECK: has_role(auth.uid(), 'admin'::app_role)
```

**Problem**: When org admins try to assign supervisor/operator roles via `useOrganizationMembers.assignAppRole()`, the RLS policy blocks the operation.

#### Issue 2: Org Admins Cannot Delete User Roles  
Current `user_roles` DELETE policy:
```sql
-- Only platform admins can delete
USING: has_role(auth.uid(), 'admin'::app_role)
```

**Problem**: Org admins cannot remove supervisor/operator roles from their org members.

#### Issue 3: Org Admins Cannot View Org Member Roles
Current SELECT policies:
- Platform admins can view all
- Supervisors can view org member roles
- Users can view own roles

**Missing**: Org admins should also be able to view roles of their org members.

---

## Implementation Plan

### Step 1: Create Database Helper Functions

Create a security definer function to verify that a role is organization-assignable:

```sql
CREATE OR REPLACE FUNCTION is_org_assignable_role(_role app_role)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT _role IN ('supervisor', 'operator', 'viewer')
$$;
```

Create function to check if user is in same org as target user:

```sql
CREATE OR REPLACE FUNCTION is_in_same_org(_caller_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = _caller_id 
      AND om2.user_id = _target_user_id
  )
$$;
```

### Step 2: Update RLS Policies on user_roles Table

#### Add SELECT Policy for Org Admins
```sql
CREATE POLICY "Org admins view org member roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om1.role IN ('owner', 'admin')
      AND om2.user_id = user_roles.user_id
  )
);
```

#### Add INSERT Policy for Org Admins (Restricted Roles Only)
```sql
CREATE POLICY "Org admins can assign org-scoped roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  -- Only allow supervisor, operator, viewer roles
  role IN ('supervisor', 'operator', 'viewer')
  -- AND caller must be org admin/owner
  AND EXISTS (
    SELECT 1
    FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om1.role IN ('owner', 'admin')
      AND om2.user_id = user_roles.user_id
  )
);
```

#### Add DELETE Policy for Org Admins (Restricted Roles Only)
```sql
CREATE POLICY "Org admins can remove org-scoped roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (
  -- Only allow removing supervisor, operator, viewer roles
  role IN ('supervisor', 'operator', 'viewer')
  -- AND caller must be org admin/owner
  AND EXISTS (
    SELECT 1
    FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om1.role IN ('owner', 'admin')
      AND om2.user_id = user_roles.user_id
  )
);
```

### Step 3: Verify Platform Admin Isolation

Ensure platform-level roles remain protected:

| Role | Can Be Assigned By |
|------|-------------------|
| `admin` | Platform admin only (no change) |
| `developer` | Platform admin only (no change) |
| `supervisor` | Platform admin OR Org admin (same org) |
| `operator` | Platform admin OR Org admin (same org) |
| `viewer` | Platform admin OR Org admin (same org) |

### Step 4: Update Client-Side Validation (Minor)

The `useOrganizationMembers` hook already validates roles correctly at lines 169-171 and 196-199. No changes needed, but we'll add an explicit type guard.

**Files to Update:**
- `src/hooks/useOrganizationMembers.ts` - Add type constant for assignable roles

```typescript
const ORG_ASSIGNABLE_ROLES: AppRole[] = ['supervisor', 'operator', 'viewer'];
```

---

## Technical Details

### Role Access Matrix After Changes

| Actor | Can Assign/Remove | Scope |
|-------|------------------|-------|
| Platform Admin (`admin` role) | All roles | Global |
| Org Owner/Admin | supervisor, operator, viewer | Own org members only |
| Supervisor | None | - |
| Operator | None | - |

### Data Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                        USER ROLES TABLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Platform Admin (admin role)                                     │
│  ├── INSERT: any role ✓                                         │
│  ├── UPDATE: any role ✓                                         │
│  ├── DELETE: any role ✓                                         │
│  └── SELECT: all users ✓                                        │
│                                                                  │
│  Org Admin/Owner (organization_members.role = owner|admin)       │
│  ├── INSERT: supervisor/operator/viewer only ✓                   │
│  │           └── Target must be in same org                     │
│  ├── UPDATE: N/A (not needed)                                   │
│  ├── DELETE: supervisor/operator/viewer only ✓                  │
│  │           └── Target must be in same org                     │
│  └── SELECT: own org members only ✓                             │
│                                                                  │
│  SDK Developer (developer role)                                  │
│  ├── INSERT: ✗ (no role changes)                                │
│  ├── UPDATE: ✗                                                  │
│  ├── DELETE: ✗                                                  │
│  └── SELECT: own roles only ✓                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

1. **Database Migration** (New)
   - Create helper function `is_org_assignable_role`
   - Create helper function `is_in_same_org`
   - Add 3 new RLS policies on `user_roles` for org admin access

2. **src/hooks/useOrganizationMembers.ts**
   - Add `viewer` to the list of assignable roles (line 170, 197)
   - Add type constant for org-assignable roles

---

## Security Guarantees

1. **Platform roles remain isolated**: `admin` and `developer` can ONLY be assigned by platform admins
2. **Org-scoped enforcement**: Org admins can only modify roles for users within their organization
3. **Role restriction**: Even within an org, admins cannot assign platform-reserved roles
4. **No privilege escalation**: A user cannot grant themselves higher privileges than they have
5. **SDK/Developer access protected**: Testing dashboard and billing features remain exclusive to `developer` role holders

---

## Testing Checklist

After implementation, verify:

- [ ] Platform admin can assign any role to any user
- [ ] Org admin can assign supervisor/operator/viewer to org members
- [ ] Org admin CANNOT assign admin/developer roles (should fail)
- [ ] Org admin CANNOT modify roles for users outside their org
- [ ] Developer role users can access Testing dashboard
- [ ] Developer role users CANNOT access admin role management
- [ ] Operator users cannot access admin dashboard
- [ ] All existing functionality continues to work
