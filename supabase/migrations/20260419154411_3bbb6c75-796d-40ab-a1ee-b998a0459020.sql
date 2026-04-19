
-- ============================================================
-- 1) EXPOSED_SENSITIVE_DATA: hide contact_email/contact_phone
--    from anonymous users on operator_profiles
-- ============================================================
-- Replace the anon+authenticated public-select policy with one
-- that ONLY allows authenticated users to read full rows.
-- Anonymous users can still see public profile data via the
-- column-masked view operator_profiles_public_view.
DROP POLICY IF EXISTS op_profile_public_select ON public.operator_profiles;

CREATE POLICY op_profile_public_select_auth
ON public.operator_profiles
FOR SELECT
TO authenticated
USING (profile_visibility = 'public'::operator_profile_visibility);

-- Keep anon read access only via the masked view (which does
-- not expose contact_email / contact_phone). Ensure the view
-- has SELECT granted to anon.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='operator_profiles_public_view') THEN
    EXECUTE 'GRANT SELECT ON public.operator_profiles_public_view TO anon, authenticated';
  END IF;
END $$;

-- ============================================================
-- 2) REALTIME_NO_CHANNEL_AUTHORIZATION:
--    Add RLS on realtime.messages so users can only subscribe
--    to channels they're authorized for. We restrict realtime
--    to authenticated users and require that the topic name
--    matches a known org-scoped pattern they belong to, OR is
--    a user-scoped private channel keyed by their auth.uid().
-- ============================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_receive_org_scoped_broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "authenticated_can_send_org_scoped_broadcasts" ON realtime.messages;

-- Allow authenticated users to RECEIVE messages on a channel only when:
--   * The topic equals one of the known global channel names AND they are members of an org
--     (postgres_changes channels currently used: activity_logs_changes, etc.)
--   * OR the topic contains an organization_id substring they are a member of
--   * OR the topic contains their own auth.uid()
CREATE POLICY "authenticated_can_receive_org_scoped_broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- user-scoped private channel
  (realtime.topic() LIKE '%' || (auth.uid())::text || '%')
  OR
  -- org-scoped channel: topic contains an org_id the user belongs to
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND realtime.topic() LIKE '%' || (om.organization_id)::text || '%'
  )
  OR
  -- platform admins / developers can receive everything (admin dashboards)
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'developer'::public.app_role)
);

CREATE POLICY "authenticated_can_send_org_scoped_broadcasts"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  (realtime.topic() LIKE '%' || (auth.uid())::text || '%')
  OR EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND realtime.topic() LIKE '%' || (om.organization_id)::text || '%'
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'developer'::public.app_role)
);
