
CREATE OR REPLACE FUNCTION public.enforce_itar_read_through()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_itar BOOLEAN;
BEGIN
  SELECT COALESCE(requires_us_person_declaration, false)
    INTO is_itar
  FROM public.organizations
  WHERE id = NEW.organization_id;

  IF is_itar AND NEW.erp_persistence_mode = 'write_through' THEN
    RAISE EXCEPTION 'ITAR-controlled organizations cannot use write_through ERP persistence (set requires_us_person_declaration=false to opt out)';
  END IF;

  RETURN NEW;
END;
$$;
