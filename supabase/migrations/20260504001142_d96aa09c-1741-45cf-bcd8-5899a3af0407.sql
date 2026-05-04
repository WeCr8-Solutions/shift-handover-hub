-- Harden operator profile storage privacy and remove broad storage reads.
UPDATE storage.buckets
SET public = false
WHERE id = 'operator-profiles'
  AND public IS DISTINCT FROM false;

DROP POLICY IF EXISTS "operator_profiles_path_scoped_read" ON storage.objects;
DROP POLICY IF EXISTS "op_files_public_read_user_scoped" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view performance update images" ON storage.objects;
DROP POLICY IF EXISTS "operator_profiles_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "operator_profiles_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "operator_profiles_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "operator_profiles_owner_delete" ON storage.objects;

CREATE POLICY "operator_profiles_owner_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'operator-profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "operator_profiles_owner_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'operator-profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "operator_profiles_owner_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'operator-profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'operator-profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "operator_profiles_owner_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'operator-profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enforce organization-scoped realtime subscriptions.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth users read own org topics" ON realtime.messages;
DROP POLICY IF EXISTS "auth users write own org topics" ON realtime.messages;

CREATE POLICY "auth users read own org topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    realtime.topic() LIKE 'org:%'
    AND public.is_org_member(
      auth.uid(),
      NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid
    )
  )
);

CREATE POLICY "auth users write own org topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    realtime.topic() LIKE 'org:%'
    AND public.is_org_member(
      auth.uid(),
      NULLIF(split_part(realtime.topic(), ':', 2), '')::uuid
    )
  )
);

-- Ensure Live environments that missed the earlier billing hardening view can still publish.
CREATE OR REPLACE VIEW public.organization_billing_identifiers
WITH (security_invoker = true)
AS
SELECT
  id AS organization_id,
  stripe_customer_id,
  billing_email
FROM public.organizations o
WHERE public.is_org_admin(auth.uid(), o.id)
   OR public.has_role(auth.uid(), 'admin'::public.app_role);

-- Keep regular organization fields readable while denying billing-sensitive columns from direct table reads.
REVOKE SELECT ON TABLE public.organizations FROM anon;
REVOKE SELECT ON TABLE public.organizations FROM authenticated;
REVOKE SELECT (billing_email, stripe_customer_id) ON public.organizations FROM anon;
REVOKE SELECT (billing_email, stripe_customer_id) ON public.organizations FROM authenticated;

GRANT SELECT (
  id,
  name,
  slug,
  description,
  logo_url,
  subscription_status,
  subscription_tier,
  created_by,
  created_at,
  updated_at,
  trial_ends_at,
  mfa_required,
  requires_us_person_declaration,
  designated_oap_mentor_user_id,
  ai_enabled,
  organization_kind,
  public_slug,
  public_employer,
  employer_tagline,
  employer_about,
  employer_logo_url,
  employer_cover_url,
  employer_website,
  employer_linkedin,
  employer_hiring_email,
  employer_locations,
  employer_industries,
  employer_paid_contact,
  employer_paid_contact_until,
  employer_ideal_roles,
  employer_ideal_skills,
  employer_ideal_certs,
  employer_ideal_machines,
  employer_ideal_experience_min,
  employer_ideal_notes,
  oap_default_recert_months,
  is_jobline_approved_mentor,
  is_jobline_approved_vendor,
  is_jobline_approved_verifier,
  verifier_approved_at,
  verifier_display_name,
  verifier_tagline
) ON public.organizations TO authenticated;

GRANT SELECT ON public.organizations_safe TO authenticated;
GRANT SELECT ON public.organization_billing_identifiers TO authenticated;