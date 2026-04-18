CREATE OR REPLACE FUNCTION public.list_public_operator_profiles(
  _limit integer DEFAULT 24,
  _search text DEFAULT NULL,
  _city text DEFAULT NULL,
  _region text DEFAULT NULL,
  _country text DEFAULT NULL,
  _certification text DEFAULT NULL,
  _open_to_work boolean DEFAULT NULL
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
  verified_cert_count integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    op.user_id,
    op.public_username,
    p.display_name,
    op.headline,
    op.location_city,
    op.location_region,
    op.location_country,
    op.years_experience,
    op.open_to_work,
    op.willing_to_relocate,
    op.avatar_url,
    op.public_published_at,
    COALESCE((SELECT COUNT(*)::int FROM public.operator_certifications oc WHERE oc.user_id = op.user_id), 0) AS cert_count,
    COALESCE((SELECT COUNT(*)::int FROM public.operator_certifications oc WHERE oc.user_id = op.user_id AND oc.verification_source LIKE 'verified_%'), 0) AS verified_cert_count
  FROM public.operator_profiles op
  LEFT JOIN public.profiles p ON p.user_id = op.user_id
  WHERE op.profile_visibility = 'public'
    AND op.public_username IS NOT NULL
    AND (
      _search IS NULL
      OR op.headline ILIKE '%' || _search || '%'
      OR op.bio ILIKE '%' || _search || '%'
      OR p.display_name ILIKE '%' || _search || '%'
      OR EXISTS (
        SELECT 1 FROM public.operator_skills os
        WHERE os.user_id = op.user_id AND os.skill ILIKE '%' || _search || '%'
      )
    )
    AND (_city IS NULL OR op.location_city ILIKE '%' || _city || '%')
    AND (_region IS NULL OR op.location_region ILIKE '%' || _region || '%')
    AND (_country IS NULL OR op.location_country ILIKE '%' || _country || '%')
    AND (_open_to_work IS NULL OR op.open_to_work = _open_to_work)
    AND (
      _certification IS NULL
      OR EXISTS (
        SELECT 1 FROM public.operator_certifications oc
        WHERE oc.user_id = op.user_id
          AND oc.name ILIKE '%' || _certification || '%'
      )
    )
  ORDER BY op.public_published_at DESC NULLS LAST
  LIMIT LEAST(GREATEST(_limit, 1), 100);
$function$;