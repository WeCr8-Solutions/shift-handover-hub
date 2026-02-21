

# Fix: Unblock Live Deployment

## Current Blocker
The `work_order_routing` table in Live has 15 rows missing the `organization_id` column (column doesn't exist yet). The migration tries to add it as `NOT NULL`, causing failure.

## Solution

Run in **Lovable Cloud > Run SQL** with **Live** environment:

```sql
ALTER TABLE work_order_routing ADD COLUMN IF NOT EXISTS organization_id UUID;

UPDATE work_order_routing r
SET organization_id = q.organization_id
FROM queue_items q
WHERE r.queue_item_id = q.id
  AND r.organization_id IS NULL;

ALTER TABLE work_order_routing ALTER COLUMN organization_id SET NOT NULL;
```

## Previously Fixed
- `team_members` — resolved
- `queue_item_comments` — resolved
- `queue_item_history` — resolved (user ran SQL)

## After Running the SQL
Click **Publish** again.
