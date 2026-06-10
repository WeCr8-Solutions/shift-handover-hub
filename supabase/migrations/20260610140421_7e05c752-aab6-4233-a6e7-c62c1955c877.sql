CREATE OR REPLACE FUNCTION public.internal_run_aymar_concierge_seed()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', '7d924865-7e19-4bf8-a503-75eeeab26d03', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  SELECT public.repair_seed_aymar_concierge() INTO _result;

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.internal_run_aymar_concierge_seed() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.internal_run_aymar_concierge_seed() FROM anon;
REVOKE ALL ON FUNCTION public.internal_run_aymar_concierge_seed() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.internal_run_aymar_concierge_seed() TO service_role;