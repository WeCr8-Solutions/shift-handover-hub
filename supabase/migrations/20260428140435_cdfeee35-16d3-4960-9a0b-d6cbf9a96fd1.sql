-- =====================================================================
-- Add is_paid (true when stripe_session_id IS NOT NULL) to public verify RPCs.
-- RETURNS TABLE column changes require DROP + CREATE.
-- Only the boolean is added; no PII (no email, no session id) leaks.
-- =====================================================================

DROP FUNCTION IF EXISTS public.verify_oap_certificate(text);
DROP FUNCTION IF EXISTS public.verify_gca_certificate(text);
DROP FUNCTION IF EXISTS public.verify_oap_certificate_by_qr(text);
DROP FUNCTION IF EXISTS public.verify_gca_certificate_by_qr(text);

CREATE OR REPLACE FUNCTION public.verify_oap_certificate(_cert_id text)
RETURNS TABLE(
  cert_id text,
  recipient_name text,
  recipient_username text,
  program_name text,
  status text,
  valid_from date,
  valid_until date,
  issued_at timestamptz,
  signed_by_name text,
  signed_by_title text,
  signed_by_signature_url text,
  is_paid boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.cert_id, c.recipient_name, c.recipient_username, c.program_name,
         c.status, c.valid_from, c.valid_until, c.issued_at,
         c.signed_by_name, c.signed_by_title, c.signed_by_signature_url,
         (c.stripe_session_id IS NOT NULL) AS is_paid
  FROM public.oap_certificates c
  WHERE c.cert_id = _cert_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.verify_gca_certificate(_cert_id text)
RETURNS TABLE(
  cert_id text,
  recipient_name text,
  recipient_username text,
  program_name text,
  status text,
  valid_from date,
  valid_until date,
  issued_at timestamptz,
  signed_by_name text,
  signed_by_title text,
  signed_by_signature_url text,
  is_paid boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.cert_id, c.recipient_name, c.recipient_username, c.program_name,
         c.status, c.valid_from, c.valid_until, c.issued_at,
         c.signed_by_name, c.signed_by_title, c.signed_by_signature_url,
         (c.stripe_session_id IS NOT NULL) AS is_paid
  FROM public.gca_certificates c
  WHERE c.cert_id = _cert_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.verify_oap_certificate_by_qr(_qr_token text)
RETURNS TABLE(
  cert_id text,
  recipient_name text,
  recipient_username text,
  program_name text,
  organization_id uuid,
  organization_name text,
  vertical text,
  status text,
  valid_from date,
  valid_until date,
  issued_at timestamptz,
  signed_by_name text,
  signed_by_title text,
  signed_by_signature_url text,
  is_paid boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.cert_id, c.recipient_name, c.recipient_username, c.program_name,
         c.organization_id, o.name AS organization_name, c.vertical::text,
         c.status, c.valid_from, c.valid_until, c.issued_at,
         c.signed_by_name, c.signed_by_title, c.signed_by_signature_url,
         (c.stripe_session_id IS NOT NULL) AS is_paid
  FROM public.oap_certificates c
  LEFT JOIN public.organizations o ON o.id = c.organization_id
  WHERE c.qr_token = _qr_token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.verify_gca_certificate_by_qr(_qr_token text)
RETURNS TABLE(
  cert_id text,
  recipient_name text,
  recipient_username text,
  program_name text,
  organization_id uuid,
  organization_name text,
  vertical text,
  status text,
  valid_from date,
  valid_until date,
  issued_at timestamptz,
  signed_by_name text,
  signed_by_title text,
  signed_by_signature_url text,
  is_paid boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.cert_id, c.recipient_name, c.recipient_username, c.program_name,
         c.issuing_organization_id AS organization_id,
         o.name AS organization_name,
         NULL::text AS vertical,
         c.status, c.valid_from, c.valid_until, c.issued_at,
         c.signed_by_name, c.signed_by_title, c.signed_by_signature_url,
         (c.stripe_session_id IS NOT NULL) AS is_paid
  FROM public.gca_certificates c
  LEFT JOIN public.organizations o ON o.id = c.issuing_organization_id
  WHERE c.qr_token = _qr_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_oap_certificate(text)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_gca_certificate(text)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_oap_certificate_by_qr(text)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_gca_certificate_by_qr(text)  TO anon, authenticated;
