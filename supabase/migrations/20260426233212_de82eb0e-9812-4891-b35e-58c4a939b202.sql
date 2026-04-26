-- Public, anon-callable summary of a talent profile's verified credentials.
-- Used by the OG-card renderer at /api/og-image to build branded share cards.
CREATE OR REPLACE FUNCTION public.get_public_operator_cert_summary(_username text)
RETURNS TABLE (
  gca_count       integer,
  oap_count       integer,
  partner_count   integer,
  verified_total  integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH target AS (
    SELECT op.user_id
    FROM public.operator_profiles op
    WHERE op.public_username = _username
      AND op.is_discoverable = true
      AND op.public_published_at IS NOT NULL
    LIMIT 1
  ),
  certs AS (
    SELECT
      oc.verification_source,
      oc.linked_cert_id
    FROM public.operator_certifications oc
    JOIN target t ON t.user_id = oc.user_id
    WHERE oc.is_public = true
      AND oc.verification_source IN ('jobline','partner','employer','verified_gca','verified_oap')
  )
  SELECT
    COUNT(*) FILTER (
      WHERE verification_source = 'verified_gca'
         OR (verification_source = 'jobline' AND linked_cert_id LIKE 'GCA-%')
    )::int AS gca_count,
    COUNT(*) FILTER (
      WHERE verification_source = 'verified_oap'
         OR (verification_source = 'jobline' AND linked_cert_id LIKE 'OAP-%')
    )::int AS oap_count,
    COUNT(*) FILTER (
      WHERE verification_source IN ('partner','employer')
    )::int AS partner_count,
    COUNT(*)::int AS verified_total
  FROM certs;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_operator_cert_summary(text) TO anon, authenticated;
