
-- ============================================================
-- AUTO-POPULATE organization_id FROM team_id FOR DATA INTEGRITY
-- ============================================================

-- Function to auto-populate organization_id from team_id
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_from_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If organization_id is null but team_id is set, populate from team
  IF NEW.organization_id IS NULL AND NEW.team_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM teams
    WHERE id = NEW.team_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to stations
DROP TRIGGER IF EXISTS auto_populate_station_org_id ON public.stations;
CREATE TRIGGER auto_populate_station_org_id
  BEFORE INSERT OR UPDATE ON public.stations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_org_id_from_team();

-- Add trigger to queue_items
DROP TRIGGER IF EXISTS auto_populate_queue_item_org_id ON public.queue_items;
CREATE TRIGGER auto_populate_queue_item_org_id
  BEFORE INSERT OR UPDATE ON public.queue_items
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_populate_org_id_from_team();

-- Add trigger to departments
DROP TRIGGER IF EXISTS auto_populate_department_org_id ON public.departments;

-- Note: departments uses team_id but doesn't have organization_id column
-- so we don't need a trigger for it

-- Add comment explaining the trigger
COMMENT ON FUNCTION public.auto_populate_org_id_from_team() IS 
  'Automatically populates organization_id from team_id for multi-tenant data isolation';
