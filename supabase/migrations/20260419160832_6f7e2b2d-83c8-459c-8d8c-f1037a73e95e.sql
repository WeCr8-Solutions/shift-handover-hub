
-- 1. Operator profiles: mask sensitive fields (contact_email, contact_phone, latitude, longitude)
-- Recreate the public view to exclude these fields entirely.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema='public' AND table_name='operator_profiles_public_view') THEN
    EXECUTE 'DROP VIEW public.operator_profiles_public_view';
  END IF;
END $$;

CREATE VIEW public.operator_profiles_public_view
WITH (security_invoker = true)
AS
SELECT
  id, user_id, headline, bio, years_experience,
  location_city, location_region, location_country,
  linkedin_url, portfolio_url, twitter_url, instagram_url, facebook_url, youtube_url, github_url, website_url,
  resume_pdf_url, avatar_url, banner_url,
  willing_to_relocate, open_to_work, is_discoverable,
  profile_visibility, public_username, public_published_at,
  preferred_employment_types,
  -- Mask salary expectations from public consumers
  NULL::numeric AS desired_salary_min,
  NULL::numeric AS desired_salary_max,
  -- Mask direct contact fields
  NULL::text AS contact_email,
  NULL::text AS contact_phone,
  resume_public, show_only_verified_certs, social_visibility
FROM public.operator_profiles
WHERE profile_visibility = 'public';

GRANT SELECT ON public.operator_profiles_public_view TO anon, authenticated;

-- Replace broad authenticated/employer SELECT policies with ones that exclude sensitive columns
-- We restrict raw table SELECT to the OWNER only; everyone else must use the masked view.
DROP POLICY IF EXISTS op_profile_public_select_auth ON public.operator_profiles;
DROP POLICY IF EXISTS op_profile_employer_select ON public.operator_profiles;
DROP POLICY IF EXISTS "op_profile_public_select_auth" ON public.operator_profiles;
DROP POLICY IF EXISTS "op_profile_employer_select" ON public.operator_profiles;

-- Ensure owner can still read their own row (keep existing if present, otherwise create)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='operator_profiles' AND policyname='op_profile_owner_select'
  ) THEN
    EXECUTE 'CREATE POLICY op_profile_owner_select ON public.operator_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id)';
  END IF;
END $$;

-- 2. Realtime: ensure RLS policies exist on realtime.messages restricting topic by uid/org
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS authenticated_can_receive_org_scoped_broadcasts ON realtime.messages;
DROP POLICY IF EXISTS authenticated_can_send_org_scoped_broadcasts ON realtime.messages;

CREATE POLICY authenticated_can_receive_org_scoped_broadcasts
ON realtime.messages FOR SELECT TO authenticated
USING (
  (realtime.topic() LIKE '%' || (auth.uid())::text || '%')
  OR EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND realtime.topic() LIKE '%' || (om.organization_id)::text || '%'
  )
);

CREATE POLICY authenticated_can_send_org_scoped_broadcasts
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  (realtime.topic() LIKE '%' || (auth.uid())::text || '%')
  OR EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND realtime.topic() LIKE '%' || (om.organization_id)::text || '%'
  )
);

-- 3. Restrict listing on public storage buckets while still allowing direct file fetches
-- Drop overly-permissive read policies, then add path-scoped ones for blog-media and operator-profiles.
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname IN (
        'Public read blog-media','blog-media public read','Public can read blog-media',
        'Public read operator-profiles','Public can read operator-profiles','operator-profiles public read'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='blog_media_path_scoped_read') THEN
    EXECUTE $p$CREATE POLICY blog_media_path_scoped_read ON storage.objects FOR SELECT USING (bucket_id = 'blog-media' AND POSITION('/' IN name) > 0)$p$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='operator_profiles_path_scoped_read') THEN
    EXECUTE $p$CREATE POLICY operator_profiles_path_scoped_read ON storage.objects FOR SELECT USING (bucket_id = 'operator-profiles' AND POSITION('/' IN name) > 0)$p$;
  END IF;
END $$;
