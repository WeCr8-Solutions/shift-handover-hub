-- Fix search_path for is_org_assignable_role function
CREATE OR REPLACE FUNCTION public.is_org_assignable_role(_role app_role)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT _role IN ('supervisor', 'operator', 'viewer')
$$;