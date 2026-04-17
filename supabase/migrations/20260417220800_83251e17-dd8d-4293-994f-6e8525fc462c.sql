
-- 1. Visibility enum + column
DO $$ BEGIN
  CREATE TYPE public.operator_profile_visibility AS ENUM ('private', 'employers_only', 'public');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.operator_profiles
  ADD COLUMN IF NOT EXISTS profile_visibility public.operator_profile_visibility NOT NULL DEFAULT 'private';

-- Back-fill from existing flag
UPDATE public.operator_profiles
   SET profile_visibility = 'employers_only'
 WHERE is_discoverable = true AND profile_visibility = 'private';

-- 2. Helper: hide raw contact fields from public view via a SECURITY INVOKER view
CREATE OR REPLACE VIEW public.operator_profiles_public
WITH (security_invoker = on) AS
SELECT
  id, user_id, headline, bio, years_experience,
  location_city, location_region, location_country,
  linkedin_url, portfolio_url, resume_pdf_url, avatar_url,
  willing_to_relocate, open_to_work, is_discoverable,
  preferred_employment_types, profile_visibility,
  created_at, updated_at,
  -- Contact info only revealed to owner or verified employers
  CASE
    WHEN auth.uid() = user_id THEN contact_email
    WHEN public.is_verified_employer(auth.uid()) THEN contact_email
    ELSE NULL
  END AS contact_email,
  CASE
    WHEN auth.uid() = user_id THEN contact_phone
    WHEN public.is_verified_employer(auth.uid()) THEN contact_phone
    ELSE NULL
  END AS contact_phone,
  CASE
    WHEN auth.uid() = user_id THEN desired_salary_min
    WHEN public.is_verified_employer(auth.uid()) THEN desired_salary_min
    ELSE NULL
  END AS desired_salary_min,
  CASE
    WHEN auth.uid() = user_id THEN desired_salary_max
    WHEN public.is_verified_employer(auth.uid()) THEN desired_salary_max
    ELSE NULL
  END AS desired_salary_max
FROM public.operator_profiles;

GRANT SELECT ON public.operator_profiles_public TO anon, authenticated;

-- 3. Public-visibility SELECT policy on base table (additive)
DROP POLICY IF EXISTS op_profile_public_select ON public.operator_profiles;
CREATE POLICY op_profile_public_select
ON public.operator_profiles
FOR SELECT
TO anon, authenticated
USING (profile_visibility = 'public');

-- 4. Companion public-read policies for related sections
-- Helper inline lambda: a row's owner has a public profile?
-- (use scalar subquery in policies)

-- operator_certifications
DROP POLICY IF EXISTS op_certs_public_select ON public.operator_certifications;
CREATE POLICY op_certs_public_select
ON public.operator_certifications
FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.operator_profiles p
   WHERE p.user_id = operator_certifications.user_id
     AND p.profile_visibility = 'public'
));

-- operator_skills
DROP POLICY IF EXISTS op_skills_public_select ON public.operator_skills;
CREATE POLICY op_skills_public_select
ON public.operator_skills
FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.operator_profiles p
   WHERE p.user_id = operator_skills.user_id
     AND p.profile_visibility = 'public'
));

-- operator_machine_proficiencies
DROP POLICY IF EXISTS op_machines_public_select ON public.operator_machine_proficiencies;
CREATE POLICY op_machines_public_select
ON public.operator_machine_proficiencies
FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.operator_profiles p
   WHERE p.user_id = operator_machine_proficiencies.user_id
     AND p.profile_visibility = 'public'
));

-- operator_work_history
DROP POLICY IF EXISTS op_work_public_select ON public.operator_work_history;
CREATE POLICY op_work_public_select
ON public.operator_work_history
FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.operator_profiles p
   WHERE p.user_id = operator_work_history.user_id
     AND p.profile_visibility = 'public'
));

-- operator_education
DROP POLICY IF EXISTS op_edu_public_select ON public.operator_education;
CREATE POLICY op_edu_public_select
ON public.operator_education
FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.operator_profiles p
   WHERE p.user_id = operator_education.user_id
     AND p.profile_visibility = 'public'
));

-- 5. Keep is_discoverable in sync with visibility for legacy code paths
CREATE OR REPLACE FUNCTION public.sync_operator_discoverable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_discoverable := (NEW.profile_visibility IN ('employers_only', 'public'));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_operator_profiles_sync_discoverable ON public.operator_profiles;
CREATE TRIGGER tg_operator_profiles_sync_discoverable
BEFORE INSERT OR UPDATE ON public.operator_profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_operator_discoverable();
