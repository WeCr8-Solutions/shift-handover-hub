DROP POLICY IF EXISTS op_certs_public_select ON public.operator_certifications;

CREATE POLICY op_certs_public_select ON public.operator_certifications
FOR SELECT
USING (
  is_public = true
  AND EXISTS (
    SELECT 1 FROM public.operator_profiles p
    WHERE p.user_id = operator_certifications.user_id
      AND p.profile_visibility = 'public'::operator_profile_visibility
  )
);