-- Clean up duplicate queue_items insert policy causing migration cycle
DROP POLICY IF EXISTS "Team members can create queue items via team" ON queue_items;