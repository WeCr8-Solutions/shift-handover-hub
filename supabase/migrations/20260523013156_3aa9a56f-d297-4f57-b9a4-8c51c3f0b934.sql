
-- Helper: paid-contact employer check
CREATE OR REPLACE FUNCTION public.is_paid_contact_employer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.organization_members om
      JOIN public.organizations o ON o.id = om.organization_id
     WHERE om.user_id = _user_id
       AND o.employer_paid_contact = true
       AND (o.employer_paid_contact_until IS NULL OR o.employer_paid_contact_until > now())
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_paid_contact_employer(uuid) TO anon, authenticated;

-- Tighten base-table employer SELECT to paid-contact employers only.
-- Non-paid employers should browse via the operator_profiles_public view, which masks PII.
DROP POLICY IF EXISTS op_profile_employer_select ON public.operator_profiles;
CREATE POLICY op_profile_employer_select
ON public.operator_profiles
FOR SELECT
TO authenticated
USING (
  is_discoverable = true
  AND public.is_verified_employer(auth.uid())
  AND public.is_paid_contact_employer(auth.uid())
);

-- Rebuild masked public view: contact fields only revealed to owner or paid-contact employers.
CREATE OR REPLACE VIEW public.operator_profiles_public
WITH (security_invoker = on) AS
SELECT
  id, user_id, headline, bio, years_experience,
  location_city, location_region, location_country,
  linkedin_url, portfolio_url, resume_pdf_url, avatar_url,
  willing_to_relocate, open_to_work, is_discoverable,
  preferred_employment_types, profile_visibility,
  created_at, updated_at,
  CASE
    WHEN auth.uid() = user_id THEN contact_email
    WHEN public.is_paid_contact_employer(auth.uid()) THEN contact_email
    ELSE NULL
  END AS contact_email,
  CASE
    WHEN auth.uid() = user_id THEN contact_phone
    WHEN public.is_paid_contact_employer(auth.uid()) THEN contact_phone
    ELSE NULL
  END AS contact_phone,
  CASE
    WHEN auth.uid() = user_id THEN desired_salary_min
    WHEN public.is_paid_contact_employer(auth.uid()) THEN desired_salary_min
    ELSE NULL
  END AS desired_salary_min,
  CASE
    WHEN auth.uid() = user_id THEN desired_salary_max
    WHEN public.is_paid_contact_employer(auth.uid()) THEN desired_salary_max
    ELSE NULL
  END AS desired_salary_max
FROM public.operator_profiles;

GRANT SELECT ON public.operator_profiles_public TO anon, authenticated;
