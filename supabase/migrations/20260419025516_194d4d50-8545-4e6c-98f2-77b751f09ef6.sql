ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS employer_ideal_roles text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS employer_ideal_skills text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS employer_ideal_certs text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS employer_ideal_machines text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS employer_ideal_experience_min int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS employer_ideal_notes text DEFAULT NULL;

DROP FUNCTION IF EXISTS public.get_public_employer(text);

CREATE OR REPLACE FUNCTION public.get_public_employer(_slug text)
RETURNS TABLE(
  id uuid, name text, public_slug text, organization_kind organization_kind,
  employer_tagline text, employer_about text,
  employer_logo_url text, employer_cover_url text,
  employer_website text, employer_linkedin text, employer_hiring_email text,
  employer_locations text[], employer_industries text[],
  employer_paid_contact boolean,
  employer_ideal_roles text[], employer_ideal_skills text[],
  employer_ideal_certs text[], employer_ideal_machines text[],
  employer_ideal_experience_min int, employer_ideal_notes text,
  logo_url text, description text, created_at timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    o.id, o.name, o.public_slug, o.organization_kind,
    o.employer_tagline, o.employer_about,
    o.employer_logo_url, o.employer_cover_url,
    o.employer_website, o.employer_linkedin, o.employer_hiring_email,
    o.employer_locations, o.employer_industries,
    o.employer_paid_contact,
    o.employer_ideal_roles, o.employer_ideal_skills,
    o.employer_ideal_certs, o.employer_ideal_machines,
    o.employer_ideal_experience_min, o.employer_ideal_notes,
    o.logo_url, o.description, o.created_at
  FROM public.organizations o
  WHERE o.public_slug = _slug
    AND o.public_employer = true;
$function$;