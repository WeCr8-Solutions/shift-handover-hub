INSERT INTO public.oap_role_programs (
  id, organization_id, name, description, vertical,
  is_active, is_canonical, recert_interval_months, recert_grace_days,
  template_slug, vertical_role_slug
)
VALUES (
  gen_random_uuid(),
  NULL,
  'Master Machinist — Certified Program',
  'Master-level CNC machinist credential covering 5-axis & multi-axis milling, multi-axis turning, EDM, laser & waterjet, advanced GD&T, and CAM programming. Awarded after mentor sign-off on full machine, operation, and inspection-tool walkthroughs.',
  'machining',
  true,
  true,
  24,
  60,
  'machining-master-machinist',
  'master-machinist'
)
ON CONFLICT DO NOTHING;