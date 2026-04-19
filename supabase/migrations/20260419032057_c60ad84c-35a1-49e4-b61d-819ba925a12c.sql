-- 1) Talent socials
ALTER TABLE public.operator_profiles
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS website_url text;

-- 2) Replace list_public_employers (drop first because return type changes)
DROP FUNCTION IF EXISTS public.list_public_employers(text, integer);
DROP FUNCTION IF EXISTS public.list_public_employers(text, integer, text, text, boolean, text);

CREATE OR REPLACE FUNCTION public.list_public_employers(
  _search text DEFAULT NULL,
  _limit integer DEFAULT 50,
  _industry text DEFAULT NULL,
  _location text DEFAULT NULL,
  _hiring_only boolean DEFAULT NULL,
  _sort text DEFAULT 'recent'
)
RETURNS TABLE(
  id uuid,
  name text,
  public_slug text,
  employer_tagline text,
  employer_logo_url text,
  employer_cover_url text,
  employer_locations text[],
  employer_industries text[],
  open_jobs_count integer,
  published_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      o.id,
      o.name,
      o.public_slug,
      o.employer_tagline,
      o.employer_logo_url,
      o.employer_cover_url,
      o.employer_locations,
      o.employer_industries,
      COALESCE((
        SELECT count(*)::int FROM job_postings jp
        WHERE jp.organization_id = o.id AND jp.status = 'published'
      ), 0) AS open_jobs_count,
      o.created_at AS published_at
    FROM organizations o
    WHERE o.public_slug IS NOT NULL
      AND (_search IS NULL OR o.name ILIKE '%' || _search || '%' OR o.employer_tagline ILIKE '%' || _search || '%' OR o.employer_about ILIKE '%' || _search || '%')
      AND (_industry IS NULL OR EXISTS (
            SELECT 1 FROM unnest(coalesce(o.employer_industries, ARRAY[]::text[])) AS ind
            WHERE ind ILIKE '%' || _industry || '%'
          ))
      AND (_location IS NULL OR EXISTS (
            SELECT 1 FROM unnest(coalesce(o.employer_locations, ARRAY[]::text[])) AS loc
            WHERE loc ILIKE '%' || _location || '%'
          ))
  )
  SELECT *
  FROM base
  WHERE (_hiring_only IS NULL OR _hiring_only = false OR base.open_jobs_count > 0)
  ORDER BY
    CASE WHEN _sort = 'jobs' THEN base.open_jobs_count END DESC NULLS LAST,
    CASE WHEN _sort = 'name' THEN lower(base.name) END ASC NULLS LAST,
    base.published_at DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(_limit, 200));
$$;

GRANT EXECUTE ON FUNCTION public.list_public_employers(text, integer, text, text, boolean, text) TO anon, authenticated;