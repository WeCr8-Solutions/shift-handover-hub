-- Add username + publish-timestamp columns
ALTER TABLE public.operator_profiles
  ADD COLUMN IF NOT EXISTS public_username text UNIQUE,
  ADD COLUMN IF NOT EXISTS public_published_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_operator_profiles_public_username
  ON public.operator_profiles (public_username)
  WHERE public_username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_operator_profiles_public_published_at
  ON public.operator_profiles (public_published_at DESC)
  WHERE profile_visibility = 'public';

-- Validate username format + lowercase normalization
CREATE OR REPLACE FUNCTION public.normalize_operator_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.public_username IS NOT NULL THEN
    NEW.public_username := lower(trim(NEW.public_username));
    IF NEW.public_username !~ '^[a-z0-9][a-z0-9_-]{2,29}$' THEN
      RAISE EXCEPTION 'Username must be 3-30 chars: lowercase letters, numbers, hyphens, underscores (cannot start with hyphen/underscore)';
    END IF;
  END IF;

  -- Stamp first-publish time when transitioning to public
  IF NEW.profile_visibility = 'public'
     AND (OLD IS NULL OR OLD.profile_visibility IS DISTINCT FROM 'public')
     AND NEW.public_published_at IS NULL THEN
    NEW.public_published_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_operator_username ON public.operator_profiles;
CREATE TRIGGER trg_normalize_operator_username
  BEFORE INSERT OR UPDATE ON public.operator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.normalize_operator_username();

-- Helper RPC: lookup a public profile by username (anon-callable)
-- Returns NULL if username doesn't exist or profile isn't public.
CREATE OR REPLACE FUNCTION public.get_public_operator_profile(_username text)
RETURNS TABLE (
  user_id uuid,
  public_username text,
  headline text,
  bio text,
  years_experience integer,
  location_city text,
  location_region text,
  location_country text,
  linkedin_url text,
  portfolio_url text,
  avatar_url text,
  willing_to_relocate boolean,
  open_to_work boolean,
  preferred_employment_types text[],
  display_name text,
  public_published_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    op.user_id,
    op.public_username,
    op.headline,
    op.bio,
    op.years_experience,
    op.location_city,
    op.location_region,
    op.location_country,
    op.linkedin_url,
    op.portfolio_url,
    op.avatar_url,
    op.willing_to_relocate,
    op.open_to_work,
    op.preferred_employment_types,
    p.display_name,
    op.public_published_at
  FROM public.operator_profiles op
  LEFT JOIN public.profiles p ON p.user_id = op.user_id
  WHERE op.public_username = lower(trim(_username))
    AND op.profile_visibility = 'public'
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_operator_profile(text) TO anon, authenticated;

-- Helper RPC: list recent public profiles (for /talent landing directory)
CREATE OR REPLACE FUNCTION public.list_public_operator_profiles(
  _limit integer DEFAULT 24,
  _search text DEFAULT NULL
)
RETURNS TABLE (
  user_id uuid,
  public_username text,
  display_name text,
  headline text,
  location_city text,
  location_region text,
  years_experience integer,
  open_to_work boolean,
  willing_to_relocate boolean,
  avatar_url text,
  public_published_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    op.user_id,
    op.public_username,
    p.display_name,
    op.headline,
    op.location_city,
    op.location_region,
    op.years_experience,
    op.open_to_work,
    op.willing_to_relocate,
    op.avatar_url,
    op.public_published_at
  FROM public.operator_profiles op
  LEFT JOIN public.profiles p ON p.user_id = op.user_id
  WHERE op.profile_visibility = 'public'
    AND op.public_username IS NOT NULL
    AND (
      _search IS NULL
      OR op.headline ILIKE '%' || _search || '%'
      OR op.bio ILIKE '%' || _search || '%'
      OR op.location_city ILIKE '%' || _search || '%'
      OR op.location_region ILIKE '%' || _search || '%'
      OR p.display_name ILIKE '%' || _search || '%'
    )
  ORDER BY op.public_published_at DESC NULLS LAST
  LIMIT LEAST(GREATEST(_limit, 1), 100);
$$;

GRANT EXECUTE ON FUNCTION public.list_public_operator_profiles(integer, text) TO anon, authenticated;