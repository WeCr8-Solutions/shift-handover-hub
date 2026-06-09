
CREATE TABLE public.campaign_marketing_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.flyer_campaigns(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('flyer_image','mailing_list_xlsx','document','other')),
  title text NOT NULL,
  notes text,
  used_on date,
  zone_number integer,
  utm_content text,
  utm_target_url text,
  storage_path text NOT NULL,
  mime_type text,
  byte_size bigint,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX campaign_marketing_assets_campaign_idx
  ON public.campaign_marketing_assets(campaign_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_marketing_assets TO authenticated;
GRANT ALL ON public.campaign_marketing_assets TO service_role;

ALTER TABLE public.campaign_marketing_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/devs manage campaign marketing assets"
  ON public.campaign_marketing_assets
  FOR ALL
  USING (public.is_dev_or_admin(auth.uid()))
  WITH CHECK (public.is_dev_or_admin(auth.uid()));

CREATE POLICY "Flyer workers view campaign marketing assets"
  ON public.campaign_marketing_assets
  FOR SELECT
  USING (public.has_role(auth.uid(), 'flyer_worker'::app_role));

CREATE TRIGGER set_campaign_marketing_assets_updated_at
  BEFORE UPDATE ON public.campaign_marketing_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage RLS for the private 'campaign-marketing' bucket
CREATE POLICY "campaign-marketing admin read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-marketing' AND public.is_dev_or_admin(auth.uid()));

CREATE POLICY "campaign-marketing admin write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'campaign-marketing' AND public.is_dev_or_admin(auth.uid()));

CREATE POLICY "campaign-marketing admin update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'campaign-marketing' AND public.is_dev_or_admin(auth.uid()));

CREATE POLICY "campaign-marketing admin delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'campaign-marketing' AND public.is_dev_or_admin(auth.uid()));

CREATE POLICY "campaign-marketing flyer_worker read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-marketing' AND public.has_role(auth.uid(), 'flyer_worker'::app_role));
