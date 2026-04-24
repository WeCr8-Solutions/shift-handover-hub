-- Seed canonical certificate templates if missing
INSERT INTO public.certificate_templates
  (program, variant, name, is_active, is_canonical, organization_id,
   accent_color_hex, border_style, header_text, footer_text,
   font_family_serif, font_family_sans, content_year)
SELECT * FROM (VALUES
  ('OAP', 'diploma', 'OAP — Standard Diploma',  true, true, NULL::uuid,
   '#0F172A', 'ornate',  'Operator Acceptance Program',
   'Verify at jobline.ai/verify  ·  Issued by JobLine.ai',
   'Playfair Display, Georgia, serif', 'Inter, sans-serif', 2026),
  ('OAP', 'digital', 'OAP — Digital Card',      true, true, NULL::uuid,
   '#0F172A', 'modern',  'OAP — Floor Certified',
   'jobline.ai/verify',
   'Playfair Display, Georgia, serif', 'Inter, sans-serif', 2026),
  ('GCA', 'diploma', 'GCA — Standard Diploma',  true, true, NULL::uuid,
   '#1E40AF', 'ornate',  'G-Code Academy',
   'Verify at jobline.ai/verify  ·  Issued by JobLine.ai',
   'Playfair Display, Georgia, serif', 'Inter, sans-serif', 2026),
  ('GCA', 'digital', 'GCA — Digital Card',      true, true, NULL::uuid,
   '#1E40AF', 'modern',  'G-Code Academy — Verified',
   'jobline.ai/verify',
   'Playfair Display, Georgia, serif', 'Inter, sans-serif', 2026)
) AS t(program, variant, name, is_active, is_canonical, organization_id,
       accent_color_hex, border_style, header_text, footer_text,
       font_family_serif, font_family_sans, content_year)
WHERE NOT EXISTS (
  SELECT 1 FROM public.certificate_templates ct
   WHERE ct.program = t.program
     AND ct.variant = t.variant
     AND ct.is_canonical = true
);