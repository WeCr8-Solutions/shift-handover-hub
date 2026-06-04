-- Stop exposing nominator PII via the broad public read policy on the base table.
DROP POLICY IF EXISTS "Public can read published honorees" ON public.mfg_100_nominations;

-- The public view should bypass RLS on the base table and project only safe columns.
ALTER VIEW public.mfg_100_honorees SET (security_invoker = false);

-- Belt-and-suspenders: anon should not be able to query the base table directly.
REVOKE SELECT ON public.mfg_100_nominations FROM anon;

-- Ensure the safe view remains readable by everyone.
GRANT SELECT ON public.mfg_100_honorees TO anon, authenticated;