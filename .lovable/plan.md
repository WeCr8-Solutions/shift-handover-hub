
# Fix: New Users Unable to Create Teams

## Problem Summary

A new user signed up, created an organization successfully, but **cannot create teams** because the team creation function doesn't include the required `organization_id` field.

## Root Cause

The `createTeam` function in `src/hooks/useTeams.ts` inserts a team without specifying `organization_id`:

```text
teams table insert: { name, description, created_by }  <-- Missing organization_id
```

However, the RLS policy requires `organization_id IS NOT NULL` for team creation by non-admin users:

```text
RLS: (organization_id IS NOT NULL) AND is_org_member(auth.uid(), organization_id)
```

This causes a silent RLS policy violation, blocking team creation for new organization owners.

## Solution

### Step 1: Update the `useTeams` hook

Modify `createTeam` to accept and include `organization_id`:

```text
createTeam(name, description, organizationId) 
  -> INSERT { name, description, created_by, organization_id }
```

### Step 2: Update all callers of `createTeam`

**TeamManagement.tsx** - The component needs access to the current organization:

```text
1. Import useUserOrganization hook
2. Get organization.id from the hook
3. Pass organization_id to createTeam()
4. Show error if user has no organization
```

**BulkUploadDialog.tsx** (if applicable) - Same pattern for bulk team creation

### Step 3: Add the same fix for team_members insert

The `createTeam` function also adds the creator to `team_members`. The RLS policy for `team_members` INSERT includes a check that the team must belong to the user's organization:

```text
EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id 
        AND t.organization_id IS NOT NULL 
        AND is_org_member(auth.uid(), t.organization_id))
```

This should work once the team is created with `organization_id`, but we should verify.

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useTeams.ts` | Add `organizationId` parameter to `createTeam`, include in INSERT |
| `src/components/TeamManagement.tsx` | Get org from `useUserOrganization`, pass to `createTeam` |
| `src/components/BulkUploadDialog.tsx` | Ensure bulk team creation includes `organization_id` |

### Updated `createTeam` signature

```typescript
const createTeam = async (
  name: string, 
  description?: string, 
  organizationId?: string
) => {
  // If no organizationId provided, we can't create (RLS will block anyway)
  if (!organizationId) {
    return { error: new Error("Organization required to create a team") };
  }
  
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name,
      description,
      created_by: user.id,
      organization_id: organizationId,  // NEW
    })
    .select()
    .single();
  // ...rest unchanged
};
```

### Updated TeamManagement usage

```typescript
import { useUserOrganization } from "@/hooks/useUserOrganization";

export function TeamManagement() {
  const { organization } = useUserOrganization();
  const { teams, loading, createTeam, deleteTeam } = useTeams();
  
  const handleCreateTeam = async () => {
    if (!organization?.id) {
      toast({ title: "No organization", 
              description: "You must belong to an organization to create teams.",
              variant: "destructive" });
      return;
    }
    
    const { data, error } = await createTeam(
      newTeamName, 
      newTeamDescription, 
      organization.id  // Pass organization ID
    );
    // ...
  };
}
```

---

## Impact

- **New users**: Will be able to create teams after creating/joining an organization
- **Existing users**: No impact (their teams already exist)
- **RLS security**: Maintained - teams are properly scoped to organizations

## Testing Checklist

1. New user signup flow
2. Create organization
3. Navigate to Teams page
4. Create a new team (should succeed now)
5. Verify team appears in list with correct `organization_id`
6. Add stations to the team
7. Verify team_members record is created for the owner
