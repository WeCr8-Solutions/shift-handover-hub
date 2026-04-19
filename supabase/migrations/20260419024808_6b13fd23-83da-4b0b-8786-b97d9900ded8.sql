-- Fix: previous migration's RLS exposed ALL organization columns (incl. billing_email, stripe_customer_id) to anon.
-- Replace with column-restricted SECURITY DEFINER RPC + revoke the broad anon policy.

DROP POLICY IF EXISTS "organizations_public_employer_select" ON public.organizations;

-- Public RPC: returns only safe, employer-branding fields for a public_employer org.
CREATE OR REPLACE FUNCTION public.get_public_employer(_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  public_slug text,
  organization_kind public.organization_kind,
  employer_tagline text,
  employer_about text,
  employer_logo_url text,
  employer_cover_url text,
  employer_website text,
  employer_linkedin text,
  employer_hiring_email text,
  employer_locations text[],
  employer_industries text[],
  employer_paid_contact boolean,
  logo_url text,
  description text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id,
    o.name,
    o.public_slug,
    o.organization_kind,
    o.employer_tagline,
    o.employer_about,
    o.employer_logo_url,
    o.employer_cover_url,
    o.employer_website,
    o.employer_linkedin,
    o.employer_hiring_email,
    o.employer_locations,
    o.employer_industries,
    o.employer_paid_contact,
    o.logo_url,
    o.description,
    o.created_at
  FROM public.organizations o
  WHERE o.public_employer = true
    AND o.public_slug = _slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_employer(text) TO anon, authenticated;

-- Public RPC: list public employers for /employers index
CREATE OR REPLACE FUNCTION public.list_public_employers(_search text DEFAULT NULL, _limit int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  name text,
  public_slug text,
  employer_tagline text,
  employer_logo_url text,
  employer_cover_url text,
  employer_locations text[],
  employer_industries text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id, o.name, o.public_slug, o.employer_tagline,
    o.employer_logo_url, o.employer_cover_url,
    o.employer_locations, o.employer_industries
  FROM public.organizations o
  WHERE o.public_employer = true
    AND o.public_slug IS NOT NULL
    AND (_search IS NULL OR o.name ILIKE '%' || _search || '%' OR o.employer_tagline ILIKE '%' || _search || '%')
  ORDER BY o.name
  LIMIT GREATEST(LEAST(_limit, 200), 1);
$$;

GRANT EXECUTE ON FUNCTION public.list_public_employers(text, int) TO anon, authenticated;

-- Public RPC: list jobs for a given public employer slug
CREATE OR REPLACE FUNCTION public.get_public_employer_jobs(_slug text)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  title text,
  description text,
  location text,
  remote boolean,
  employment_type text,
  salary_min int,
  salary_max int,
  required_skills text[],
  published_at timestamptz,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    j.id, j.organization_id, j.title, j.description, j.location, j.remote,
    j.employment_type, j.salary_min, j.salary_max, j.required_skills,
    j.published_at, j.expires_at
  FROM public.job_postings j
  JOIN public.organizations o ON o.id = j.organization_id
  WHERE o.public_employer = true
    AND o.public_slug = _slug
    AND j.status = 'published'
    AND (j.expires_at IS NULL OR j.expires_at > now())
  ORDER BY j.published_at DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_employer_jobs(text) TO anon, authenticated;