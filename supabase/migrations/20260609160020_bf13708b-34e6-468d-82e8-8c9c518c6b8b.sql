-- ============================================================
-- 1. concierge_uploaded_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS public.concierge_uploaded_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  engagement_id   uuid REFERENCES public.onboarding_engagements(id) ON DELETE SET NULL,
  category        text NOT NULL CHECK (category IN ('manual','sop','reference')),
  title           text NOT NULL,
  description     text,
  tags            text[] NOT NULL DEFAULT '{}',
  storage_bucket  text NOT NULL DEFAULT 'concierge-docs',
  storage_path    text NOT NULL,
  file_size_bytes bigint,
  mime_type       text,
  version         integer NOT NULL DEFAULT 1,
  superseded_by   uuid REFERENCES public.concierge_uploaded_documents(id) ON DELETE SET NULL,
  uploaded_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cud_org_category ON public.concierge_uploaded_documents(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_cud_engagement ON public.concierge_uploaded_documents(engagement_id) WHERE engagement_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.concierge_uploaded_documents TO authenticated;
GRANT ALL ON public.concierge_uploaded_documents TO service_role;

ALTER TABLE public.concierge_uploaded_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cud_select_org_members"
  ON public.concierge_uploaded_documents FOR SELECT TO authenticated
  USING (
    public.is_org_member(organization_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'developer'::app_role)
  );

CREATE POLICY "cud_insert_admins"
  ON public.concierge_uploaded_documents FOR INSERT TO authenticated
  WITH CHECK (
    public.is_org_admin(organization_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'developer'::app_role)
  );

CREATE POLICY "cud_update_admins"
  ON public.concierge_uploaded_documents FOR UPDATE TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'developer'::app_role)
  );

CREATE POLICY "cud_delete_admins"
  ON public.concierge_uploaded_documents FOR DELETE TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'developer'::app_role)
  );

CREATE OR REPLACE TRIGGER trg_cud_updated_at
  BEFORE UPDATE ON public.concierge_uploaded_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies on existing concierge-docs bucket (path = {orgId}/uploads/...)
DROP POLICY IF EXISTS "concierge_uploads_read" ON storage.objects;
CREATE POLICY "concierge_uploads_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'concierge-docs'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'developer'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.user_id = auth.uid()
          AND om.organization_id::text = split_part(name, '/', 1)
      )
    )
  );

DROP POLICY IF EXISTS "concierge_uploads_write" ON storage.objects;
CREATE POLICY "concierge_uploads_write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'concierge-docs'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'developer'::app_role)
      OR public.is_org_admin(split_part(name, '/', 1)::uuid, auth.uid())
    )
  );

DROP POLICY IF EXISTS "concierge_uploads_delete" ON storage.objects;
CREATE POLICY "concierge_uploads_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'concierge-docs'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'developer'::app_role)
      OR public.is_org_admin(split_part(name, '/', 1)::uuid, auth.uid())
    )
  );

-- ============================================================
-- 2. oap_mentor_policy
-- ============================================================
CREATE TABLE IF NOT EXISTS public.oap_mentor_policy (
  organization_id            uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  org_role_auto_mentors      boolean NOT NULL DEFAULT true,
  delay_day_fallback_enabled boolean NOT NULL DEFAULT true,
  delay_days                 integer NOT NULL DEFAULT 30 CHECK (delay_days BETWEEN 0 AND 365),
  allow_self_certify_on_delay boolean NOT NULL DEFAULT false,
  notes                      text,
  updated_by                 uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.oap_mentor_policy TO authenticated;
GRANT ALL ON public.oap_mentor_policy TO service_role;

ALTER TABLE public.oap_mentor_policy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "omp_select_org_members"
  ON public.oap_mentor_policy FOR SELECT TO authenticated
  USING (
    public.is_org_member(organization_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'developer'::app_role)
  );

CREATE POLICY "omp_write_admins"
  ON public.oap_mentor_policy FOR ALL TO authenticated
  USING (
    public.is_org_admin(organization_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'developer'::app_role)
  )
  WITH CHECK (
    public.is_org_admin(organization_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'developer'::app_role)
  );

CREATE OR REPLACE TRIGGER trg_omp_updated_at
  BEFORE UPDATE ON public.oap_mentor_policy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. can_certify_oap helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_certify_oap(_user_id uuid, _enrollment_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_user uuid;
  v_started timestamptz;
  v_policy record;
  v_is_designated boolean;
  v_is_role_mentor boolean;
  v_role text;
  v_days_elapsed integer;
BEGIN
  SELECT organization_id, user_id, started_at
    INTO v_org, v_user, v_started
  FROM public.oap_enrollments
  WHERE id = _enrollment_id;

  IF v_org IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'enrollment_not_found');
  END IF;

  IF public.has_role(_user_id, 'admin'::app_role) OR public.has_role(_user_id, 'developer'::app_role) THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'platform_admin');
  END IF;

  IF v_user = _user_id THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'self_certify_forbidden');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.certifying_mentors cm
    WHERE cm.user_id = _user_id
      AND cm.is_active = true
      AND cm.approval_status = 'approved'
      AND 'OAP' = ANY(cm.programs)
      AND (cm.scope = 'platform' OR cm.organization_id = v_org)
  ) INTO v_is_designated;

  IF v_is_designated THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'designated_mentor');
  END IF;

  SELECT om.role::text INTO v_role
    FROM public.organization_members om
   WHERE om.user_id = _user_id AND om.organization_id = v_org
   LIMIT 1;

  SELECT * INTO v_policy FROM public.oap_mentor_policy WHERE organization_id = v_org;

  IF v_policy IS NULL THEN
    v_policy.org_role_auto_mentors := true;
    v_policy.delay_day_fallback_enabled := true;
    v_policy.delay_days := 30;
    v_policy.allow_self_certify_on_delay := false;
  END IF;

  v_is_role_mentor := COALESCE(v_policy.org_role_auto_mentors, true)
                       AND v_role IN ('admin','supervisor','owner');

  IF v_is_role_mentor THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'role_auto_mentor', 'role', v_role);
  END IF;

  IF COALESCE(v_policy.delay_day_fallback_enabled, true)
     AND COALESCE(v_policy.allow_self_certify_on_delay, false)
     AND v_role IN ('admin','supervisor','owner')
     AND v_started IS NOT NULL THEN
    v_days_elapsed := EXTRACT(DAY FROM (now() - v_started))::int;
    IF v_days_elapsed >= COALESCE(v_policy.delay_days, 30) THEN
      RETURN jsonb_build_object(
        'allowed', true, 'reason', 'delay_day_override',
        'days_elapsed', v_days_elapsed, 'delay_days', v_policy.delay_days
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('allowed', false, 'reason', 'no_authority', 'role', v_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_certify_oap(uuid, uuid) TO authenticated;

-- ============================================================
-- 4. Seed Aymar Engineering default policy
-- ============================================================
INSERT INTO public.oap_mentor_policy (
  organization_id, org_role_auto_mentors, delay_day_fallback_enabled,
  delay_days, allow_self_certify_on_delay, notes
)
VALUES (
  '41f0e268-87d6-4981-b21e-a3c4e8245688',
  true, true, 30, true,
  'Default policy seeded with concierge power-up — owners/supervisors auto-mentor; 30-day override available.'
)
ON CONFLICT (organization_id) DO NOTHING;
