
-- =========================================================
-- 1. Realtime channel authorization (org-scoped subscriptions)
-- =========================================================
-- Enable RLS (already on, but idempotent)
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Helper: derive org id from topic naming convention "org:<uuid>:..." or "<uuid>:..."
CREATE OR REPLACE FUNCTION public.realtime_topic_org_id(_topic text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  candidate text;
  result uuid;
BEGIN
  IF _topic IS NULL THEN RETURN NULL; END IF;
  -- Strip optional "org:" prefix
  candidate := regexp_replace(_topic, '^org:', '');
  -- Take first colon-delimited segment
  candidate := split_part(candidate, ':', 1);
  -- Must look like a UUID
  IF candidate ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    BEGIN
      result := candidate::uuid;
    EXCEPTION WHEN others THEN
      result := NULL;
    END;
  END IF;
  RETURN result;
END;
$$;

-- Drop any existing JobLine policies (idempotent)
DROP POLICY IF EXISTS "jobline_realtime_select_org_scoped" ON realtime.messages;
DROP POLICY IF EXISTS "jobline_realtime_insert_org_scoped" ON realtime.messages;

-- SELECT (subscribe): authenticated users may read messages on a topic only if
-- the topic's encoded org_id matches one of their org memberships, OR they are platform admin.
CREATE POLICY "jobline_realtime_select_org_scoped"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (
      public.realtime_topic_org_id(topic) IS NOT NULL
      AND public.is_org_member(auth.uid(), public.realtime_topic_org_id(topic))
    )
  );

-- INSERT (broadcast): same scoping
CREATE POLICY "jobline_realtime_insert_org_scoped"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (
      public.realtime_topic_org_id(topic) IS NOT NULL
      AND public.is_org_member(auth.uid(), public.realtime_topic_org_id(topic))
    )
  );

-- =========================================================
-- 2. user_roles — close supervisor escalation gap
-- =========================================================
DROP POLICY IF EXISTS "Org admins can assign org-scoped roles" ON public.user_roles;
DROP POLICY IF EXISTS "Org admins can remove org-scoped roles" ON public.user_roles;

CREATE POLICY "Org admins can assign org-scoped roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    role = ANY (ARRAY['operator'::public.app_role, 'viewer'::public.app_role])
    AND EXISTS (
      SELECT 1
      FROM public.organization_members om1
      JOIN public.organization_members om2
        ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.role = ANY (ARRAY['owner'::text, 'admin'::text])
        AND om2.user_id = user_roles.user_id
    )
  );

CREATE POLICY "Org admins can remove org-scoped roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    role = ANY (ARRAY['operator'::public.app_role, 'viewer'::public.app_role])
    AND EXISTS (
      SELECT 1
      FROM public.organization_members om1
      JOIN public.organization_members om2
        ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.role = ANY (ARRAY['owner'::text, 'admin'::text])
        AND om2.user_id = user_roles.user_id
    )
  );

-- =========================================================
-- 3. Public bucket listing — tighten path requirement
-- =========================================================
-- Certificates: only allow SELECT when name has at least the cert id prefix segment
DROP POLICY IF EXISTS "Certificate PDFs publicly readable by exact path" ON storage.objects;
CREATE POLICY "Certificate PDFs publicly readable by exact path"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'oap-gca-certificates'
    AND name IS NOT NULL
    AND length(name) > 8
    AND lower(right(name, 4)) = '.pdf'
    AND position('/' in name) > 0
  );

-- Operator profile files: must include a uuid-shaped first folder AND a real filename
DROP POLICY IF EXISTS "op_files_public_read_user_scoped" ON storage.objects;
CREATE POLICY "op_files_public_read_user_scoped"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'operator-profiles'
    AND name IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND length((storage.foldername(name))[1]) = 36
    AND position('/' in name) > 0
    AND length(name) > 37
  );

-- =========================================================
-- 4. organization_webhooks — explicit admin SELECT (excluding secret column already DB-enforced via app layer)
-- =========================================================
DROP POLICY IF EXISTS "Org admins can read webhooks" ON public.organization_webhooks;
CREATE POLICY "Org admins can read webhooks"
  ON public.organization_webhooks
  FOR SELECT
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));
