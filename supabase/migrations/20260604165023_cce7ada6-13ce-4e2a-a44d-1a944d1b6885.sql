
ALTER TABLE public.mfg_100_nominations
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS display_blurb text,
  ADD COLUMN IF NOT EXISTS rank int;

CREATE POLICY "Admins can read nominations"
  ON public.mfg_100_nominations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update nominations"
  ON public.mfg_100_nominations
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read published honorees"
  ON public.mfg_100_nominations
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND published_at IS NOT NULL);

GRANT SELECT ON public.mfg_100_nominations TO anon;

CREATE OR REPLACE VIEW public.mfg_100_honorees AS
  SELECT
    id,
    nominee_name,
    nominee_company,
    nominee_role,
    nominee_linkedin,
    nominee_website,
    category,
    COALESCE(display_blurb, '') AS display_blurb,
    rank,
    published_at
  FROM public.mfg_100_nominations
  WHERE status = 'published' AND published_at IS NOT NULL;

GRANT SELECT ON public.mfg_100_honorees TO anon, authenticated;
