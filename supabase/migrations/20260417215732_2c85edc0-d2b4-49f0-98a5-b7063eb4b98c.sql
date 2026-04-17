-- 1) Realtime: restrict channel subscriptions
-- Enable RLS on realtime.messages (idempotent) and add scoped policies.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can subscribe to org-scoped topics" ON realtime.messages;
DROP POLICY IF EXISTS "Users can subscribe to their own user topics" ON realtime.messages;

-- Allow subscription/broadcast on topics like "org:<organization_id>:*"
-- only when the user is a member of that organization.
CREATE POLICY "Org members can subscribe to org-scoped topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE 'org:%')
  AND EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id::text = split_part(realtime.topic(), ':', 2)
  )
);

-- Allow subscription on topics scoped to the user themselves: "user:<user_id>:*"
CREATE POLICY "Users can subscribe to their own user topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE 'user:%')
  AND split_part(realtime.topic(), ':', 2) = auth.uid()::text
);

-- 2) Storage: remove the unscoped upload policy on performance-updates.
-- The narrower org-scoped policy ('perf_updates_insert_org_scoped') remains.
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;