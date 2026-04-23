-- 1. Certificate Templates table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program text NOT NULL CHECK (program IN ('OAP', 'GCA')),
  variant text NOT NULL CHECK (variant IN ('diploma', 'digital')),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  is_canonical boolean NOT NULL DEFAULT false,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- Visual overrides
  seal_logo_path text,
  background_watermark_path text,
  signature_default_path text,
  accent_color_hex text,
  border_style text CHECK (border_style IN ('ornate', 'minimal', 'modern')),
  header_text text,
  footer_text text,
  font_family_serif text,
  font_family_sans text,
  -- Audit
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cert_templates_program_variant
  ON public.certificate_templates(program, variant, is_active);
CREATE INDEX IF NOT EXISTS idx_cert_templates_org
  ON public.certificate_templates(organization_id) WHERE organization_id IS NOT NULL;

-- 2. Canonical invariant trigger
CREATE OR REPLACE FUNCTION public.validate_cert_template_canonical()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_canonical = true AND NEW.organization_id IS NOT NULL THEN
    RAISE EXCEPTION 'Canonical certificate templates cannot have organization_id';
  END IF;
  IF NEW.is_canonical = false AND NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Non-canonical certificate templates must have organization_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cert_template_canonical ON public.certificate_templates;
CREATE TRIGGER trg_cert_template_canonical
  BEFORE INSERT OR UPDATE ON public.certificate_templates
  FOR EACH ROW EXECUTE FUNCTION public.validate_cert_template_canonical();

DROP TRIGGER IF EXISTS trg_cert_templates_updated_at ON public.certificate_templates;
CREATE TRIGGER trg_cert_templates_updated_at
  BEFORE UPDATE ON public.certificate_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. RLS
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Templates are publicly readable" ON public.certificate_templates;
CREATE POLICY "Templates are publicly readable"
  ON public.certificate_templates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Platform admins manage canonical templates" ON public.certificate_templates;
CREATE POLICY "Platform admins manage canonical templates"
  ON public.certificate_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Org admins manage own org templates" ON public.certificate_templates;
CREATE POLICY "Org admins manage own org templates"
  ON public.certificate_templates FOR ALL
  TO authenticated
  USING (
    is_canonical = false
    AND organization_id IS NOT NULL
    AND is_org_admin(auth.uid(), organization_id)
  )
  WITH CHECK (
    is_canonical = false
    AND organization_id IS NOT NULL
    AND is_org_admin(auth.uid(), organization_id)
  );

-- 4. Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificate-templates',
  'certificate-templates',
  true,
  2097152,
  ARRAY['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'];

-- 5. Storage policies
DROP POLICY IF EXISTS "Cert template assets publicly readable" ON storage.objects;
CREATE POLICY "Cert template assets publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'certificate-templates');

DROP POLICY IF EXISTS "Platform admins upload canonical cert assets" ON storage.objects;
CREATE POLICY "Platform admins upload canonical cert assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certificate-templates'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Platform admins update canonical cert assets" ON storage.objects;
CREATE POLICY "Platform admins update canonical cert assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'certificate-templates'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Platform admins delete cert assets" ON storage.objects;
CREATE POLICY "Platform admins delete cert assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'certificate-templates'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Org admins upload to own org cert path" ON storage.objects;
CREATE POLICY "Org admins upload to own org cert path"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'certificate-templates'
    AND (storage.foldername(name))[1] LIKE 'org-%'
    AND is_org_admin(
      auth.uid(),
      substring((storage.foldername(name))[1] from 5)::uuid
    )
  );

DROP POLICY IF EXISTS "Org admins update own org cert path" ON storage.objects;
CREATE POLICY "Org admins update own org cert path"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'certificate-templates'
    AND (storage.foldername(name))[1] LIKE 'org-%'
    AND is_org_admin(
      auth.uid(),
      substring((storage.foldername(name))[1] from 5)::uuid
    )
  );

DROP POLICY IF EXISTS "Org admins delete own org cert path" ON storage.objects;
CREATE POLICY "Org admins delete own org cert path"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'certificate-templates'
    AND (storage.foldername(name))[1] LIKE 'org-%'
    AND is_org_admin(
      auth.uid(),
      substring((storage.foldername(name))[1] from 5)::uuid
    )
  );