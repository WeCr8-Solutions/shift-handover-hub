ALTER TABLE public.operator_profiles
  ADD COLUMN IF NOT EXISTS banner_url text;

DROP FUNCTION IF EXISTS public.get_public_operator_profile(text);

CREATE OR REPLACE FUNCTION public.get_public_operator_profile(_username text)
RETURNS TABLE(
  user_id uuid,
  public_username text,
  display_name text,
  headline text,
  bio text,
  years_experience integer,
  location_city text,
  location_region text,
  location_country text,
  linkedin_url text,
  portfolio_url text,
  twitter_url text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  github_url text,
  website_url text,
  avatar_url text,
  banner_url text,
  willing_to_relocate boolean,
  open_to_work boolean,
  preferred_employment_types text[],
  public_published_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    op.user_id, op.public_username, pr.display_name, op.headline, op.bio,
    op.years_experience, op.location_city, op.location_region, op.location_country,
    op.linkedin_url, op.portfolio_url, op.twitter_url, op.instagram_url,
    op.facebook_url, op.youtube_url, op.github_url, op.website_url,
    op.avatar_url, op.banner_url, op.willing_to_relocate, op.open_to_work,
    op.preferred_employment_types, op.public_published_at
  FROM operator_profiles op
  LEFT JOIN profiles pr ON pr.user_id = op.user_id
  WHERE op.public_username = lower(_username)
    AND op.profile_visibility = 'public'
    AND op.is_discoverable = true
    AND op.public_published_at IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_operator_profile(text) TO anon, authenticated;