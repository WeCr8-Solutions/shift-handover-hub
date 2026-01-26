
# Plan: Fix Team Creation for First-Time Users

## Problem
Users cannot create teams because:
1. The INSERT works, but the `.select().single()` fails because no SELECT policy allows the creator to see their own team
2. New users only get "operator" role, but SELECT policies require "admin/supervisor" or existing team membership

## Solution

### Part 1: Database Migration - Add Missing SELECT Policy

Add a policy that allows team creators to view their teams:

```sql
-- Allow users to see teams they created (needed for RETURNING clause)
CREATE POLICY "Users can view teams they created" 
ON public.teams 
FOR SELECT 
TO authenticated
USING (auth.uid() = created_by);
```

This enables the INSERT + SELECT flow to work for team creators.

### Part 2: Give First-Time Users Admin Privileges

Update the `handle_new_user` database function to also assign the "admin" role to new signups, allowing them to fully configure their manufacturing shop:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile record
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  -- Create operator role (base access)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operator');

  -- Also give admin role for first-time setup (can create teams, manage shop)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');

  RETURN NEW;
END;
$function$;
```

### Part 3: Grant Admin Role to Existing User

Run a one-time insert to give the current user admin privileges:

```sql
INSERT INTO public.user_roles (user_id, role) 
VALUES ('47d2772a-6c62-48d6-bb3b-a23055543a76', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## Technical Details

### Why This Works
| Issue | Fix |
|-------|-----|
| SELECT fails after INSERT | New policy: "Users can view teams they created" |
| User lacks admin/supervisor role | Updated `handle_new_user` to add admin role on signup |
| Existing user blocked | One-time SQL to grant admin role |

### User Flow After Fix
```text
1. User signs up
        ↓
2. handle_new_user trigger fires:
   - Creates profile
   - Assigns "operator" role
   - Assigns "admin" role (NEW)
        ↓
3. User goes to Setup page
        ↓
4. User creates team:
   - INSERT succeeds (auth.uid() = created_by)
   - SELECT succeeds (new policy: created_by = auth.uid())
   - team_members INSERT succeeds (user becomes "owner")
        ↓
5. User can now manage their manufacturing shop
```

### Files Changed
| File | Change |
|------|--------|
| Database migration | Add SELECT policy for team creators |
| Database migration | Update `handle_new_user` to add admin role |
| Database migration | Grant admin role to existing user |

---

## Security Considerations

- Roles remain in separate `user_roles` table (not on profiles)
- Admin role allows team/station management per existing RLS policies
- Team ownership established via `team_members` table with "owner" role
- This follows your requirement: "Operator + team owner" where admin enables team creation
