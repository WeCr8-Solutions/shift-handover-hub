
DO $$
DECLARE
  t text;
  pol text;
  tables text[] := ARRAY[
    'operator_certifications','operator_skills','operator_education',
    'operator_work_history','operator_machine_proficiencies',
    'operator_references','operator_recommendations','operator_resume_versions',
    'operator_connections','operator_follows',
    'oap_operator_credentials',
    'talent_contact_requests','talent_message_replies',
    'talent_saved_candidates','talent_saved_lists',
    'org_messages'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    pol := format('Platform admins can view all %s', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND policyname=pol
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role))',
        pol, t
      );
    END IF;
  END LOOP;
END$$;

DROP POLICY IF EXISTS op_certs_public_select ON public.operator_certifications;
CREATE POLICY op_certs_public_select ON public.operator_certifications
FOR SELECT
USING (
  COALESCE(is_public, true) = true
  AND EXISTS (
    SELECT 1 FROM public.operator_profiles p
    WHERE p.user_id = operator_certifications.user_id
      AND p.profile_visibility = 'public'::operator_profile_visibility
      AND p.is_discoverable = true
      AND p.public_published_at IS NOT NULL
  )
);

DROP POLICY IF EXISTS op_skills_public_select ON public.operator_skills;
CREATE POLICY op_skills_public_select ON public.operator_skills
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.operator_profiles p
    WHERE p.user_id = operator_skills.user_id
      AND p.profile_visibility = 'public'::operator_profile_visibility
      AND p.is_discoverable = true
      AND p.public_published_at IS NOT NULL
  )
);

DROP POLICY IF EXISTS op_edu_public_select ON public.operator_education;
CREATE POLICY op_edu_public_select ON public.operator_education
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.operator_profiles p
    WHERE p.user_id = operator_education.user_id
      AND p.profile_visibility = 'public'::operator_profile_visibility
      AND p.is_discoverable = true
      AND p.public_published_at IS NOT NULL
  )
);

DROP POLICY IF EXISTS op_work_public_select ON public.operator_work_history;
CREATE POLICY op_work_public_select ON public.operator_work_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.operator_profiles p
    WHERE p.user_id = operator_work_history.user_id
      AND p.profile_visibility = 'public'::operator_profile_visibility
      AND p.is_discoverable = true
      AND p.public_published_at IS NOT NULL
  )
);

DROP POLICY IF EXISTS op_machines_public_select ON public.operator_machine_proficiencies;
CREATE POLICY op_machines_public_select ON public.operator_machine_proficiencies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.operator_profiles p
    WHERE p.user_id = operator_machine_proficiencies.user_id
      AND p.profile_visibility = 'public'::operator_profile_visibility
      AND p.is_discoverable = true
      AND p.public_published_at IS NOT NULL
  )
);

-- operator_references consolidation
DROP POLICY IF EXISTS op_ref_block_anon ON public.operator_references;
DROP POLICY IF EXISTS op_ref_authenticated_owner_only ON public.operator_references;

DROP POLICY IF EXISTS op_ref_employer_select ON public.operator_references;
CREATE POLICY op_ref_employer_select ON public.operator_references
FOR SELECT TO authenticated
USING (
  public.is_verified_employer(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.operator_profiles op
    WHERE op.user_id = operator_references.user_id
      AND op.is_discoverable = true
  )
);

-- operator_recommendations: public + employer SELECT
-- Recipient must not have hidden it; parent profile must be public+discoverable+published
DROP POLICY IF EXISTS op_rec_public_select ON public.operator_recommendations;
CREATE POLICY op_rec_public_select ON public.operator_recommendations
FOR SELECT
USING (
  COALESCE(is_hidden_by_recipient, false) = false
  AND EXISTS (
    SELECT 1 FROM public.operator_profiles p
    WHERE p.user_id = operator_recommendations.recipient_id
      AND p.profile_visibility = 'public'::operator_profile_visibility
      AND p.is_discoverable = true
      AND p.public_published_at IS NOT NULL
  )
);

DROP POLICY IF EXISTS op_rec_employer_select ON public.operator_recommendations;
CREATE POLICY op_rec_employer_select ON public.operator_recommendations
FOR SELECT TO authenticated
USING (
  public.is_verified_employer(auth.uid())
  AND COALESCE(is_hidden_by_recipient, false) = false
  AND EXISTS (
    SELECT 1 FROM public.operator_profiles p
    WHERE p.user_id = operator_recommendations.recipient_id
      AND p.is_discoverable = true
  )
);

-- Storage bucket: drop duplicate older policies
DROP POLICY IF EXISTS "operator_profiles_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "operator_profiles_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "operator_profiles_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "operator_profiles_owner_delete" ON storage.objects;

-- Replace broad public read with scoped allowlist
DROP POLICY IF EXISTS "op_files_public_profile_read" ON storage.objects;
CREATE POLICY "op_files_public_profile_read"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'operator-profiles'
  AND (
    (storage.foldername(name))[2] = 'public'
    OR (storage.foldername(name))[2] = 'gallery'
    OR name ~* '(^|/)(avatar|banner)(\.|_)'
  )
  AND EXISTS (
    SELECT 1 FROM public.operator_profiles op
    WHERE (op.user_id)::text = (storage.foldername(name))[1]
      AND op.profile_visibility = 'public'::operator_profile_visibility
      AND op.is_discoverable = true
      AND op.public_published_at IS NOT NULL
  )
);

-- Admin SELECT for storage support
DROP POLICY IF EXISTS "op_files_admin_read" ON storage.objects;
CREATE POLICY "op_files_admin_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'operator-profiles'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);
