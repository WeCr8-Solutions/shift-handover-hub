-- Extend public talent browse RPC with richer filters + sort + skills/machines
CREATE OR REPLACE FUNCTION public.list_public_operator_profiles(
  _limit integer DEFAULT 24,
  _search text DEFAULT NULL,
  _city text DEFAULT NULL,
  _region text DEFAULT NULL,
  _country text DEFAULT NULL,
  _certification text DEFAULT NULL,
  _open_to_work boolean DEFAULT NULL,
  _skill text DEFAULT NULL,
  _machine text DEFAULT NULL,
  _min_years integer DEFAULT NULL,
  _relocate boolean DEFAULT NULL,
  _verified_only boolean DEFAULT NULL,
  _sort text DEFAULT 'recent'
)
RETURNS TABLE(
  user_id uuid,
  public_username text,
  display_name text,
  headline text,
  location_city text,
  location_region text,
  location_country text,
  years_experience integer,
  open_to_work boolean,
  willing_to_relocate boolean,
  avatar_url text,
  public_published_at timestamp with time zone,
  cert_count integer,
  verified_cert_count integer,
  top_skills text[],
  top_machines text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      op.user_id,
      op.public_username,
      pr.display_name,
      op.headline,
      op.location_city,
      op.location_region,
      op.location_country,
      op.years_experience,
      op.open_to_work,
      op.willing_to_relocate,
      op.avatar_url,
      op.public_published_at,
      COALESCE((SELECT count(*)::int FROM operator_certifications oc WHERE oc.user_id = op.user_id), 0) AS cert_count,
      COALESCE((SELECT count(*)::int FROM operator_certifications oc
                WHERE oc.user_id = op.user_id AND oc.verification_source LIKE 'verified_%'), 0) AS verified_cert_count,
      COALESCE((SELECT array_agg(DISTINCT s.skill ORDER BY s.skill) FILTER (WHERE s.skill IS NOT NULL)
                FROM (SELECT skill FROM operator_skills WHERE user_id = op.user_id LIMIT 6) s), ARRAY[]::text[]) AS top_skills,
      COALESCE((SELECT array_agg(DISTINCT m.machine_category ORDER BY m.machine_category) FILTER (WHERE m.machine_category IS NOT NULL)
                FROM (SELECT machine_category FROM operator_machine_proficiencies WHERE user_id = op.user_id LIMIT 6) m), ARRAY[]::text[]) AS top_machines
    FROM operator_profiles op
    LEFT JOIN profiles pr ON pr.user_id = op.user_id
    WHERE op.profile_visibility = 'public'
      AND op.is_discoverable = true
      AND op.public_username IS NOT NULL
      AND op.public_published_at IS NOT NULL
      AND (_search IS NULL OR op.headline ILIKE '%' || _search || '%' OR op.bio ILIKE '%' || _search || '%' OR pr.display_name ILIKE '%' || _search || '%')
      AND (_city IS NULL OR op.location_city ILIKE '%' || _city || '%')
      AND (_region IS NULL OR op.location_region ILIKE '%' || _region || '%')
      AND (_country IS NULL OR op.location_country = _country)
      AND (_open_to_work IS NULL OR op.open_to_work = _open_to_work)
      AND (_relocate IS NULL OR op.willing_to_relocate = _relocate)
      AND (_min_years IS NULL OR COALESCE(op.years_experience, 0) >= _min_years)
      AND (_certification IS NULL OR EXISTS (
            SELECT 1 FROM operator_certifications oc
            WHERE oc.user_id = op.user_id AND (oc.name ILIKE '%' || _certification || '%' OR oc.issuer ILIKE '%' || _certification || '%')
          ))
      AND (_skill IS NULL OR EXISTS (
            SELECT 1 FROM operator_skills os
            WHERE os.user_id = op.user_id AND os.skill ILIKE '%' || _skill || '%'
          ))
      AND (_machine IS NULL OR EXISTS (
            SELECT 1 FROM operator_machine_proficiencies omp
            WHERE omp.user_id = op.user_id
              AND (omp.machine_category ILIKE '%' || _machine || '%'
                   OR omp.machine_make ILIKE '%' || _machine || '%'
                   OR omp.machine_model ILIKE '%' || _machine || '%')
          ))
  )
  SELECT *
  FROM base
  WHERE (_verified_only IS NULL OR _verified_only = false OR base.verified_cert_count > 0)
  ORDER BY
    CASE WHEN _sort = 'experience' THEN base.years_experience END DESC NULLS LAST,
    CASE WHEN _sort = 'verified' THEN base.verified_cert_count END DESC NULLS LAST,
    CASE WHEN _sort = 'name' THEN lower(coalesce(base.display_name, base.public_username)) END ASC NULLS LAST,
    base.public_published_at DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(_limit, 200));
$$;

GRANT EXECUTE ON FUNCTION public.list_public_operator_profiles(
  integer, text, text, text, text, text, boolean, text, text, integer, boolean, boolean, text
) TO anon, authenticated;