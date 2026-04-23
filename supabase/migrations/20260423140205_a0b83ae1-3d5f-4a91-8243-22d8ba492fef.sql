-- 1. Org-level recert cadence default (months). NULL = no auto expiry.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS oap_default_recert_months INTEGER DEFAULT 12;

-- 2. Track issuing org on GCA certs (already exists on oap_certificates).
ALTER TABLE public.gca_certificates
  ADD COLUMN IF NOT EXISTS issuing_organization_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_gca_certificates_issuing_org
  ON public.gca_certificates(issuing_organization_id);

-- 3. Org admins/supervisors can SELECT certs issued by/for their org.
DROP POLICY IF EXISTS "Org admins view OAP certs they issued" ON public.oap_certificates;
CREATE POLICY "Org admins view OAP certs they issued"
  ON public.oap_certificates
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND (
      public.is_org_admin(auth.uid(), organization_id)
      OR public.is_supervisor_in_org(auth.uid(), organization_id)
    )
  );

DROP POLICY IF EXISTS "Org admins view GCA certs they issued" ON public.gca_certificates;
CREATE POLICY "Org admins view GCA certs they issued"
  ON public.gca_certificates
  FOR SELECT
  TO authenticated
  USING (
    issuing_organization_id IS NOT NULL
    AND (
      public.is_org_admin(auth.uid(), issuing_organization_id)
      OR public.is_supervisor_in_org(auth.uid(), issuing_organization_id)
    )
  );

-- 4. Extend lookup_cert_by_stripe_session to return recipient_name + program_name
--    (already publicly readable; just convenient for the success page).
DROP FUNCTION IF EXISTS public.lookup_cert_by_stripe_session(text);

CREATE OR REPLACE FUNCTION public.lookup_cert_by_stripe_session(_session_id text)
RETURNS TABLE(
  cert_id text,
  recipient_email_masked text,
  recipient_name text,
  program_name text,
  program text
)
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
         recipient_name,
         program_name,
         'OAP'::text AS program
  FROM public.oap_certificates
  WHERE stripe_session_id = _session_id
  UNION ALL
  SELECT cert_id,
         CASE
           WHEN recipient_email IS NULL THEN NULL
           ELSE substring(recipient_email FROM 1 FOR 2) || '***@' || split_part(recipient_email, '@', 2)
         END,
         recipient_name,
         program_name,
         'GCA'::text
  FROM public.gca_certificates
  WHERE stripe_session_id = _session_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_cert_by_stripe_session(text) TO anon, authenticated;