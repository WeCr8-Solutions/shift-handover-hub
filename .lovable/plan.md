

# Fix: Unblock Live Deployment

## Problem
The publish to Live keeps failing because the `queue_item_history` table in the Live database is missing the `organization_id` column. The migration tries to add it as `NOT NULL`, but the 6 existing rows would violate that constraint.

The other two previously-blocking tables (`team_members` and `queue_item_comments`) are already fixed.

## Solution

Run this single SQL statement in **Lovable Cloud > Run SQL** with the **Live** environment selected:

```sql
-- Step 1: Add column as nullable
ALTER TABLE queue_item_history ADD COLUMN IF NOT EXISTS organization_id UUID;

-- Step 2: Backfill from queue_items (all 6 rows have valid parent records)
UPDATE queue_item_history h
SET organization_id = q.organization_id
FROM queue_items q
WHERE h.queue_item_id = q.id
  AND h.organization_id IS NULL;

-- Step 3: Set NOT NULL constraint
ALTER TABLE queue_item_history ALTER COLUMN organization_id SET NOT NULL;
```

## After Running the SQL

Click **Publish** again. This should now succeed because:
- `team_members` -- already fixed (0 NULL rows)
- `queue_item_comments` -- already fixed (column exists, NOT NULL, no NULLs)
- `queue_item_history` -- will be fixed after running the SQL above

Once published, the `/zach` route, UTM tracking, and demo page will all be live on jobline.ai.

## Edge Functions

No edge function changes are needed -- the existing functions (`rls-health`, `ai-planning-assistant`, `send-email`, etc.) are already deployed and working. The deployment failure is purely a database schema migration issue, not a function issue.
