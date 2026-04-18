-- 1. Add designated OAP mentor to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS designated_oap_mentor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Add signer + username snapshot columns to oap_certificates
ALTER TABLE public.oap_certificates
  ADD COLUMN IF NOT EXISTS signed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS signed_by_name text,
  ADD COLUMN IF NOT EXISTS signed_by_title text,
  ADD COLUMN IF NOT EXISTS signed_by_signature_url text,
  ADD COLUMN IF NOT EXISTS recipient_username text;

-- 3. Same parity columns for gca_certificates (signer + username)
ALTER TABLE public.gca_certificates
  ADD COLUMN IF NOT EXISTS signed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS signed_by_name text,
  ADD COLUMN IF NOT EXISTS signed_by_title text,
  ADD COLUMN IF NOT EXISTS signed_by_signature_url text,
  ADD COLUMN IF NOT EXISTS recipient_username text;

-- 4. Replace public verification RPCs to expose new non-PII fields
--    (drop & recreate so return signature can change cleanly)
DROP FUNCTION IF EXISTS public.verify_oap_certificate(text);
DROP FUNCTION IF EXISTS public.verify_oap_certificate_by_qr(text);
DROP FUNCTION IF EXISTS public.verify_gca_certificate(text);
DROP FUNCTION IF EXISTS public.verify_gca_certificate_by_qr(text);

CREATE OR REPLACE FUNCTION public.verify_oap_certificate(p_cert_id text)
RETURNS TABLE (
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
  signed_by_signature_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.cert_id,
    c.recipient_name,
    c.recipient_username,
    c.program_name,
    c.organization_id,
    o.name AS organization_name,
    c.vertical::text,
    c.status::text,
    c.valid_from,
    c.valid_until,
    c.created_at AS issued_at,
    c.signed_by_name,
    c.signed_by_title,
    c.signed_by_signature_url
  FROM public.oap_certificates c
  LEFT JOIN public.organizations o ON o.id = c.organization_id
  WHERE c.cert_id = p_cert_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.verify_oap_certificate_by_qr(p_qr_token text)
RETURNS TABLE (
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
  signed_by_signature_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.cert_id,
    c.recipient_name,
    c.recipient_username,
    c.program_name,
    c.organization_id,
    o.name AS organization_name,
    c.vertical::text,
    c.status::text,
    c.valid_from,
    c.valid_until,
    c.created_at AS issued_at,
    c.signed_by_name,
    c.signed_by_title,
    c.signed_by_signature_url
  FROM public.oap_certificates c
  LEFT JOIN public.organizations o ON o.id = c.organization_id
  WHERE c.qr_token = p_qr_token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.verify_gca_certificate(p_cert_id text)
RETURNS TABLE (
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
  signed_by_signature_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.cert_id,
    c.recipient_name,
    c.recipient_username,
    c.program_name,
    c.status::text,
    c.valid_from,
    c.valid_until,
    c.created_at AS issued_at,
    c.signed_by_name,
    c.signed_by_title,
    c.signed_by_signature_url
  FROM public.gca_certificates c
  WHERE c.cert_id = p_cert_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.verify_gca_certificate_by_qr(p_qr_token text)
RETURNS TABLE (
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
  signed_by_signature_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.cert_id,
    c.recipient_name,
    c.recipient_username,
    c.program_name,
    c.status::text,
    c.valid_from,
    c.valid_until,
    c.created_at AS issued_at,
    c.signed_by_name,
    c.signed_by_title,
    c.signed_by_signature_url
  FROM public.gca_certificates c
  WHERE c.qr_token = p_qr_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_oap_certificate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_oap_certificate_by_qr(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_gca_certificate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_gca_certificate_by_qr(text) TO anon, authenticated;