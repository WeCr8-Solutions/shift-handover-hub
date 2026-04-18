-- Enable RLS on realtime.messages (idempotent)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop prior versions if re-running
DROP POLICY IF EXISTS "Org members can read realtime messages for their org" ON realtime.messages;
DROP POLICY IF EXISTS "Org members can send realtime messages for their org" ON realtime.messages;
DROP POLICY IF EXISTS "Platform admins full realtime access" ON realtime.messages;

-- SELECT: only allow receiving messages for channels scoped to an org the user belongs to
CREATE POLICY "Org members can read realtime messages for their org"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.realtime_topic_org_id((realtime.topic())::text) IS NOT NULL
  AND public.is_org_member(auth.uid(), public.realtime_topic_org_id((realtime.topic())::text))
);

-- INSERT: allow broadcast/presence sends only on org-scoped channels the user belongs to
CREATE POLICY "Org members can send realtime messages for their org"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.realtime_topic_org_id((realtime.topic())::text) IS NOT NULL
  AND public.is_org_member(auth.uid(), public.realtime_topic_org_id((realtime.topic())::text))
);

-- Platform admins: unrestricted access for support/diagnostics
CREATE POLICY "Platform admins full realtime access"
ON realtime.messages
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));