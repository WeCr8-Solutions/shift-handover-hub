ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.realtime_topic_uuid_suffix(_topic text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _topic ~ '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    THEN substring(_topic FROM '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')::uuid
    ELSE NULL
  END;
$$;

DROP POLICY IF EXISTS "rt_user_scoped_topics" ON realtime.messages;
DROP POLICY IF EXISTS "rt_user_scoped_broadcast" ON realtime.messages;

CREATE POLICY "rt_user_scoped_topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (
    (
      realtime.topic() LIKE 'org-conn-%'
      OR realtime.topic() LIKE 'org-msg-%'
      OR realtime.topic() LIKE 'org-msg-unread-%'
      OR realtime.topic() LIKE 'talent-inbox-%'
    )
    AND public.realtime_topic_uuid_suffix(realtime.topic()) = auth.uid()
  )
  OR (
    realtime.topic() LIKE 'thread-%'
    AND EXISTS (
      SELECT 1 FROM public.talent_contact_requests r
      WHERE r.id = public.realtime_topic_uuid_suffix(realtime.topic())
        AND (
          r.candidate_user_id = auth.uid()
          OR public.is_org_admin(auth.uid(), r.organization_id)
          OR public.is_supervisor_in_org(auth.uid(), r.organization_id)
        )
    )
  )
);

CREATE POLICY "rt_user_scoped_broadcast"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (
    realtime.topic() LIKE 'org-conn-%'
    OR realtime.topic() LIKE 'org-msg-%'
    OR realtime.topic() LIKE 'org-msg-unread-%'
    OR realtime.topic() LIKE 'talent-inbox-%'
  )
  AND public.realtime_topic_uuid_suffix(realtime.topic()) = auth.uid()
);