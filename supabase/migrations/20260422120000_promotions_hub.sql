ALTER TABLE public.flyer_campaigns
  ADD COLUMN IF NOT EXISTS campaign_type TEXT NOT NULL DEFAULT 'flyer_drop'
    CHECK (campaign_type IN ('flyer_drop', 'event', 'promo')),
  ADD COLUMN IF NOT EXISTS location_name TEXT,
  ADD COLUMN IF NOT EXISTS location_address TEXT,
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qr_target_url TEXT,
  ADD COLUMN IF NOT EXISTS cta_label TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS attachment_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS promo_copy TEXT,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

UPDATE public.flyer_campaigns
SET campaign_type = 'flyer_drop'
WHERE campaign_type IS NULL;

CREATE TABLE IF NOT EXISTS public.company_social_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  profile_name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'generic')),
  profile_url TEXT NOT NULL,
  handle TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_social_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins/devs can manage company_social_profiles" ON public.company_social_profiles;
CREATE POLICY "Admins/devs can manage company_social_profiles"
  ON public.company_social_profiles FOR ALL
  TO authenticated
  USING (public.is_dev_or_admin(auth.uid()))
  WITH CHECK (public.is_dev_or_admin(auth.uid()));

DROP TRIGGER IF EXISTS update_company_social_profiles_updated_at ON public.company_social_profiles;
CREATE TRIGGER update_company_social_profiles_updated_at
  BEFORE UPDATE ON public.company_social_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'flyer-promo-media',
  'flyer-promo-media',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Platform admins manage flyer promo media" ON storage.objects;
CREATE POLICY "Platform admins manage flyer promo media"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'flyer-promo-media'
    AND public.is_dev_or_admin(auth.uid())
  )
  WITH CHECK (
    bucket_id = 'flyer-promo-media'
    AND public.is_dev_or_admin(auth.uid())
  );