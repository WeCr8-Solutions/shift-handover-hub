
-- ============================================================================
-- Security hardening: cert PII, operator_references, Realtime channel access
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. OAP / GCA certificates: kill the public `USING (true)` SELECT policy.
--    Public verification now goes through SECURITY DEFINER RPCs that return
--    only non-sensitive verification fields (no recipient_email, no
--    stripe_session_id). Owners (recipients) and platform admins can still
--    read full rows when authenticated.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "OAP certificates publicly verifiable" ON public.oap_certificates;
DROP POLICY IF EXISTS "GCA certificates publicly verifiable" ON public.gca_certificates;

-- Owners (the issued user) and admins can read full row
CREATE POLICY "OAP certificates owner can read"
  ON public.oap_certificates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "GCA certificates owner can read"
  ON public.gca_certificates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- Public-safe verification RPC: lookup by cert_id, returns only non-PII fields
CREATE OR REPLACE FUNCTION public.verify_oap_certificate(_cert_id text)
RETURNS TABLE(
  cert_id text,
  qr_token text,
  program_name text,
  recipient_name text,
  status text,
  valid_from date,
  valid_until date,
  issued_at timestamptz,
  pdf_url text,
  vertical public.oap_vertical,
  revoked_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cert_id, qr_token, program_name, recipient_name, status,
         valid_from, valid_until, issued_at, pdf_url, vertical, revoked_at
  FROM public.oap_certificates
  WHERE cert_id = _cert_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.verify_gca_certificate(_cert_id text)
RETURNS TABLE(
  cert_id text,
  qr_token text,
  program_name text,
  recipient_name text,
  status text,
  valid_from date,
  valid_until date,
  issued_at timestamptz,
  pdf_url text,
  revoked_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cert_id, qr_token, program_name, recipient_name, status,
         valid_from, valid_until, issued_at, pdf_url, revoked_at
  FROM public.gca_certificates
  WHERE cert_id = _cert_id
  LIMIT 1;
$$;

-- QR token lookup variant (for QR scan verification flow)
CREATE OR REPLACE FUNCTION public.verify_oap_certificate_by_qr(_qr_token text)
RETURNS TABLE(
  cert_id text,
  qr_token text,
  program_name text,
  recipient_name text,
  status text,
  valid_from date,
  valid_until date,
  issued_at timestamptz,
  pdf_url text,
  vertical public.oap_vertical,
  revoked_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cert_id, qr_token, program_name, recipient_name, status,
         valid_from, valid_until, issued_at, pdf_url, vertical, revoked_at
  FROM public.oap_certificates
  WHERE qr_token = _qr_token
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.verify_gca_certificate_by_qr(_qr_token text)
RETURNS TABLE(
  cert_id text,
  qr_token text,
  program_name text,
  recipient_name text,
  status text,
  valid_from date,
  valid_until date,
  issued_at timestamptz,
  pdf_url text,
  revoked_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cert_id, qr_token, program_name, recipient_name, status,
         valid_from, valid_until, issued_at, pdf_url, revoked_at
  FROM public.gca_certificates
  WHERE qr_token = _qr_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_oap_certificate(text)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_gca_certificate(text)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_oap_certificate_by_qr(text)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_gca_certificate_by_qr(text)  TO anon, authenticated;

-- Cert-success polling RPC (post-Stripe-checkout): looks up by stripe session id.
-- Returns only cert_id and a masked email (first 2 chars + domain) to confirm
-- the buyer reached the right session without leaking the full address.
CREATE OR REPLACE FUNCTION public.lookup_cert_by_stripe_session(_session_id text)
RETURNS TABLE(cert_id text, recipient_email_masked text, program text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cert_id,
         CASE
           WHEN recipient_email IS NULL THEN NULL
           ELSE substring(recipient_email FROM 1 FOR 2) || '***@' || split_part(recipient_email, '@', 2)
         END AS recipient_email_masked,
         'OAP'::text AS program
  FROM public.oap_certificates
  WHERE stripe_session_id = _session_id
  UNION ALL
  SELECT cert_id,
         CASE
           WHEN recipient_email IS NULL THEN NULL
           ELSE substring(recipient_email FROM 1 FOR 2) || '***@' || split_part(recipient_email, '@', 2)
         END,
         'GCA'::text
  FROM public.gca_certificates
  WHERE stripe_session_id = _session_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_cert_by_stripe_session(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. operator_references: lock down to authenticated-only with explicit
--    restrictive policy denying anon. Owner CRUD + verified employer SELECT
--    already exist; we keep them and ensure no anon path remains.
-- ---------------------------------------------------------------------------

REVOKE SELECT ON public.operator_references FROM anon;

-- Add a RESTRICTIVE policy that blocks anon under all circumstances. Combined
-- with existing PERMISSIVE policies (which are TO authenticated), this makes
-- anonymous reads impossible even if a future PERMISSIVE policy is added.
CREATE POLICY "op_ref_block_anon"
  ON public.operator_references
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- ---------------------------------------------------------------------------
-- 3. Realtime channel authorization: restrict topic subscriptions to
--    organization members. Topics that don't follow the `<org_uuid>:*` or
--    `org:<uuid>:*` convention are allowed (legacy/global), but org-scoped
--    topics require membership.
--
--    Uses the existing public.realtime_topic_org_id() helper.
-- ---------------------------------------------------------------------------

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org-scoped realtime topics require membership" ON realtime.messages;

CREATE POLICY "Org-scoped realtime topics require membership"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Either the topic isn't org-scoped (legacy), or the user is a member of
    -- the org encoded in the topic name.
    public.realtime_topic_org_id((SELECT realtime.topic())) IS NULL
    OR public.is_org_member(auth.uid(), public.realtime_topic_org_id((SELECT realtime.topic())))
  );
