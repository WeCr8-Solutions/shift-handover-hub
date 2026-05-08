
-- 1) Drop redundant overlapping policies on certifying_mentors
DROP POLICY IF EXISTS "Org admins manage mentors" ON public.certifying_mentors;
DROP POLICY IF EXISTS "Org members read mentors" ON public.certifying_mentors;

-- 2) Admin SELECT visibility for oap_transfer_tokens
DROP POLICY IF EXISTS "Platform admins can view all oap_transfer_tokens" ON public.oap_transfer_tokens;
CREATE POLICY "Platform admins can view all oap_transfer_tokens"
ON public.oap_transfer_tokens FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3) Safe view for certifying mentors (public-safe — approved active platform mentors only)
DROP VIEW IF EXISTS public.certifying_mentors_safe;
CREATE VIEW public.certifying_mentors_safe
WITH (security_invoker = true) AS
SELECT
  m.id,
  m.user_id,
  m.user_name,
  m.title,
  m.scope,
  m.programs,
  m.signature_url,
  m.approval_status,
  m.is_active,
  m.organization_id
FROM public.certifying_mentors m
WHERE m.scope = 'platform'
  AND m.approval_status = 'approved'
  AND m.is_active = true;

GRANT SELECT ON public.certifying_mentors_safe TO anon, authenticated;

-- 4) Tighten enumerable public PDF bucket exposure
DROP POLICY IF EXISTS "Certificate PDFs publicly readable by exact path" ON storage.objects;
-- Replacement: only platform admins / service role read directly.
-- Public verification will return signed URLs via the verify_*_certificate RPCs in the future.
CREATE POLICY "Platform admins read cert PDFs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'oap-gca-certificates'
  AND has_role(auth.uid(), 'admin'::app_role)
);
