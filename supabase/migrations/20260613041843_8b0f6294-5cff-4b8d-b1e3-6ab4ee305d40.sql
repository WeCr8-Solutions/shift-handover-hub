DO $$
DECLARE
  zach_user_id uuid := '7d924865-7e19-4bf8-a503-75eeeab26d03';
BEGIN
  INSERT INTO public.oap_certificates (
    cert_id, user_id, organization_id, recipient_name, recipient_email,
    role_program_id, program_name, status, valid_from, valid_until,
    pdf_url, stripe_session_id, amount_cents, issued_at, created_at, updated_at,
    vertical, signed_by_user_id, signed_by_name, signed_by_title,
    signed_by_signature_url, recipient_username, acting_via_user_id
  )
  SELECT
    'OAP-98C3D6-2026', zach_user_id, 'e6031d24-caad-4f32-8632-a6efc03e69c0'::uuid,
    'Zach Goodbody', 'zach@wecr8solutions.com', 'a93d1d4f-1d27-465a-b18e-13dd5148191c'::uuid,
    'Master Machinist — Certified Program', 'active', '2026-04-06'::date, '2028-04-26'::date,
    NULL, NULL, 0, '2026-04-06 14:29:18.266001+00'::timestamptz,
    '2026-04-26 14:29:18.266001+00'::timestamptz, '2026-04-26 14:29:18.266001+00'::timestamptz,
    'machining'::public.oap_vertical, NULL, 'WeCr8 Designated Mentor', 'Master Machinist & Programming Lead',
    NULL, 'zachgoodbody', NULL
  WHERE NOT EXISTS (SELECT 1 FROM public.oap_certificates WHERE cert_id = 'OAP-98C3D6-2026');

  INSERT INTO public.gca_certificates (
    cert_id, user_id, recipient_name, recipient_email, bank_id, program_name,
    status, valid_from, valid_until, pdf_url, stripe_session_id, amount_cents,
    issued_at, created_at, updated_at, signed_by_user_id, signed_by_name,
    signed_by_title, signed_by_signature_url, recipient_username,
    issuing_organization_id, acting_via_user_id
  )
  SELECT cert_id, zach_user_id, 'Zach Goodbody', 'zach@wecr8solutions.com', NULL::uuid, program_name,
    'active', '2026-03-19'::date, '2028-04-26'::date, NULL::text, NULL::text, 0,
    '2026-03-19 14:29:18.266001+00'::timestamptz,
    '2026-04-26 14:29:18.266001+00'::timestamptz,
    '2026-04-26 14:29:18.266001+00'::timestamptz,
    NULL::uuid, 'JobLine.ai Examiner', 'Certified GCA Proctor', NULL::text, 'zachgoodbody', NULL::uuid, NULL::uuid
  FROM (VALUES
    ('GCA-87DAA5-2026', 'G-Code Academy — Mill Fundamentals'),
    ('GCA-27766F-2026', 'G-Code Academy — Haas Controller'),
    ('GCA-6F4D3D-2026', 'G-Code Academy — GD&T Basics'),
    ('GCA-86AD0F-2026', 'G-Code Academy — Cutting Tool Knowledge'),
    ('GCA-6E5BB1-2026', 'G-Code Academy — Workholding Fundamentals'),
    ('GCA-474322-2026', 'G-Code Academy — Print Reading & Drawing Interpretation'),
    ('GCA-65C028-2026', 'G-Code Academy — Mazak Mazatrol Controller'),
    ('GCA-3E1260-2026', 'G-Code Academy — Okuma OSP Controller'),
    ('GCA-912308-2026', 'G-Code Academy — Siemens 840D Controller'),
    ('GCA-400B3E-2026', 'G-Code Academy — Speeds & Feeds'),
    ('GCA-546FF1-2026', 'G-Code Academy — Inspection & Metrology'),
    ('GCA-1560FD-2026', 'G-Code Academy — Lathe Fundamentals'),
    ('GCA-EF086D-2026', 'G-Code Academy — Fanuc Controller')
  ) AS seed(cert_id, program_name)
  WHERE NOT EXISTS (SELECT 1 FROM public.gca_certificates gc WHERE gc.cert_id = seed.cert_id);

  INSERT INTO public.operator_certifications (
    user_id, name, issuer, issued_date, expires_date, credential_id,
    credential_url, attachment_url, verification_source, linked_cert_id,
    description, is_public
  )
  SELECT zach_user_id, seed.name, seed.issuer, seed.issued_date::date, seed.expires_date::date, NULL::text,
    'https://jobline.ai/verify/' || seed.linked_cert_id, NULL::text, 'jobline', seed.linked_cert_id,
    NULL::text, true
  FROM (VALUES
    ('Master Machinist — Certified Program', 'JobLine.ai · WeCr8 Solutions', '2026-04-06', '2028-04-26', 'OAP-98C3D6-2026'),
    ('G-Code Academy — Mill Fundamentals', 'JobLine.ai', '2026-03-19', '2028-04-26', 'GCA-87DAA5-2026'),
    ('G-Code Academy — Haas Controller', 'JobLine.ai', '2026-03-19', '2028-04-26', 'GCA-27766F-2026'),
    ('G-Code Academy — GD&T Basics', 'JobLine.ai', '2026-03-19', '2028-04-26', 'GCA-6F4D3D-2026'),
    ('G-Code Academy — Cutting Tool Knowledge', 'JobLine.ai', '2026-03-19', '2028-04-26', 'GCA-86AD0F-2026'),
    ('G-Code Academy — Workholding Fundamentals', 'JobLine.ai', '2026-03-19', '2028-04-26', 'GCA-6E5BB1-2026'),
    ('G-Code Academy — Print Reading & Drawing Interpretation', 'JobLine.ai', '2026-03-19', '2028-04-26', 'GCA-474322-2026'),
    ('G-Code Academy — Mazak Mazatrol Controller', 'JobLine.ai', '2026-03-19', '2028-04-26', 'GCA-65C028-2026'),
    ('G-Code Academy — Okuma OSP Controller', 'JobLine.ai', '2026-03-19', '2028-04-26', 'GCA-3E1260-2026'),
    ('G-Code Academy — Siemens 840D Controller', 'JobLine.ai', '2026-03-19', '2028-04-26', 'GCA-912308-2026'),
    ('G-Code Academy — Speeds & Feeds', 'JobLine.ai', '2026-03-19', '2028-04-26', 'GCA-400B3E-2026'),
    ('G-Code Academy — Inspection & Metrology', 'JobLine.ai', '2026-03-19', '2028-04-26', 'GCA-546FF1-2026'),
    ('G-Code Academy — Lathe Fundamentals', 'JobLine.ai', '2026-03-19', '2028-04-26', 'GCA-1560FD-2026'),
    ('G-Code Academy — Fanuc Controller', 'JobLine.ai', '2026-03-19', '2028-04-26', 'GCA-EF086D-2026')
  ) AS seed(name, issuer, issued_date, expires_date, linked_cert_id)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.operator_certifications oc
    WHERE oc.user_id = zach_user_id AND oc.linked_cert_id = seed.linked_cert_id
  );
END $$;