
-- 1) Add purpose to act_as_sessions
ALTER TABLE public.act_as_sessions
  ADD COLUMN IF NOT EXISTS purpose text;

-- 2) Public business card RPC for /p/:slug
CREATE OR REPLACE FUNCTION public.get_public_operator_business_card(_slug text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  card_slug text,
  vcard_full_name text,
  vcard_title text,
  vcard_company text,
  headline text,
  bio text,
  avatar_url text,
  banner_url text,
  theme_color text,
  accent_color text,
  cta_label text,
  cta_url text,
  location_city text,
  location_region text,
  location_country text,
  website_url text,
  linkedin_url text,
  twitter_url text,
  instagram_url text,
  facebook_url text,
  youtube_url text,
  github_url text,
  portfolio_url text,
  services jsonb,
  gallery jsonb,
  testimonials jsonb,
  business_hours jsonb,
  latitude numeric,
  longitude numeric,
  public_username text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    op.id, op.user_id, op.card_slug,
    op.vcard_full_name, op.vcard_title, op.vcard_company,
    op.headline, op.bio, op.avatar_url, op.banner_url,
    op.theme_color, op.accent_color, op.cta_label, op.cta_url,
    op.location_city, op.location_region, op.location_country,
    op.website_url, op.linkedin_url, op.twitter_url,
    op.instagram_url, op.facebook_url, op.youtube_url, op.github_url,
    op.portfolio_url, op.services, op.gallery, op.testimonials,
    op.business_hours, op.latitude, op.longitude, op.public_username
  FROM public.operator_profiles op
  WHERE op.card_slug = _slug
    AND op.profile_visibility = 'public'::operator_profile_visibility
    AND op.is_discoverable = true
    AND op.public_published_at IS NOT NULL
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_operator_business_card(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_operator_business_card(text) TO anon, authenticated;

-- 3) talent_contact_requests_safe view (metadata only, no message body)
DROP VIEW IF EXISTS public.talent_contact_requests_safe;
CREATE VIEW public.talent_contact_requests_safe
WITH (security_invoker = true) AS
SELECT
  id,
  organization_id,
  organization_name,
  candidate_user_id,
  sender_user_id,
  sender_display_name,
  subject,
  candidate_response,
  responded_at,
  created_at
FROM public.talent_contact_requests;

GRANT SELECT ON public.talent_contact_requests_safe TO authenticated;

-- 4) Audited message body RPC for admins
CREATE OR REPLACE FUNCTION public.get_talent_message_body(_request_id uuid)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  candidate_user_id uuid,
  sender_user_id uuid,
  subject text,
  message text,
  candidate_response text,
  candidate_response_message text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.talent_contact_requests%ROWTYPE;
  _is_admin boolean;
  _is_party boolean;
BEGIN
  SELECT * INTO _row FROM public.talent_contact_requests WHERE id = _request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not found' USING ERRCODE = 'P0002';
  END IF;

  _is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  _is_party := (auth.uid() = _row.candidate_user_id OR auth.uid() = _row.sender_user_id);

  IF NOT (_is_admin OR _is_party) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  -- Audit only privileged (admin, non-party) reads
  IF _is_admin AND NOT _is_party THEN
    INSERT INTO public.data_access_logs (
      user_id, organization_id, table_name, record_id, operation, metadata
    ) VALUES (
      auth.uid(), _row.organization_id,
      'talent_contact_requests', _row.id, 'admin_read_body',
      jsonb_build_object('candidate_user_id', _row.candidate_user_id, 'sender_user_id', _row.sender_user_id)
    );
  END IF;

  RETURN QUERY
  SELECT _row.id, _row.organization_id, _row.candidate_user_id, _row.sender_user_id,
         _row.subject, _row.message, _row.candidate_response, _row.candidate_response_message, _row.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.get_talent_message_body(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_talent_message_body(uuid) TO authenticated;

-- 5) Drop verified-employer branch from operator_profiles_public view
DROP VIEW IF EXISTS public.operator_profiles_public;
CREATE VIEW public.operator_profiles_public
WITH (security_invoker = true) AS
SELECT
  id, user_id, headline, bio, years_experience,
  location_city, location_region, location_country,
  linkedin_url, portfolio_url, resume_pdf_url, avatar_url,
  willing_to_relocate, open_to_work, is_discoverable,
  preferred_employment_types, profile_visibility,
  created_at, updated_at,
  CASE WHEN auth.uid() = user_id THEN contact_email ELSE NULL END AS contact_email,
  CASE WHEN auth.uid() = user_id THEN contact_phone ELSE NULL END AS contact_phone,
  CASE WHEN auth.uid() = user_id THEN desired_salary_min ELSE NULL END AS desired_salary_min,
  CASE WHEN auth.uid() = user_id THEN desired_salary_max ELSE NULL END AS desired_salary_max
FROM public.operator_profiles;

GRANT SELECT ON public.operator_profiles_public TO anon, authenticated;
