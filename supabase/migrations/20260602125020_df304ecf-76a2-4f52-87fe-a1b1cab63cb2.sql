
CREATE TABLE IF NOT EXISTS public.organization_traveler_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  logo_path TEXT,
  company_name_line TEXT,
  footer_text TEXT,
  paper_size TEXT NOT NULL DEFAULT 'letter' CHECK (paper_size IN ('letter','a4')),
  show_routing BOOLEAN NOT NULL DEFAULT true,
  show_serials BOOLEAN NOT NULL DEFAULT true,
  show_signoff BOOLEAN NOT NULL DEFAULT true,
  priority_color_map JSONB NOT NULL DEFAULT '{"critical":"red","urgent":"orange","high":"yellow","normal":"white","low":"blue"}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_traveler_settings TO authenticated;
GRANT ALL ON public.organization_traveler_settings TO service_role;

ALTER TABLE public.organization_traveler_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view traveler settings"
  ON public.organization_traveler_settings FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins insert traveler settings"
  ON public.organization_traveler_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins update traveler settings"
  ON public.organization_traveler_settings FOR UPDATE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins delete traveler settings"
  ON public.organization_traveler_settings FOR DELETE TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE OR REPLACE FUNCTION public.tg_traveler_settings_touch()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_traveler_settings_touch ON public.organization_traveler_settings;
CREATE TRIGGER trg_traveler_settings_touch
  BEFORE UPDATE ON public.organization_traveler_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_traveler_settings_touch();

-- Storage RLS for traveler-branding bucket. Path: {org_id}/logo.{ext}
CREATE POLICY "Org members read traveler branding"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'traveler-branding'
    AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org admins upload traveler branding"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'traveler-branding'
    AND public.is_org_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org admins update traveler branding"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'traveler-branding'
    AND public.is_org_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Org admins delete traveler branding"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'traveler-branding'
    AND public.is_org_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
