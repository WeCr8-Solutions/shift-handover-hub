
-- Add tolerance and surface finish fields to queue_items
ALTER TABLE public.queue_items
  ADD COLUMN IF NOT EXISTS required_tolerance TEXT,
  ADD COLUMN IF NOT EXISTS surface_finish TEXT;

-- Add tolerance and surface finish fields to part_catalog
ALTER TABLE public.part_catalog
  ADD COLUMN IF NOT EXISTS required_tolerance TEXT,
  ADD COLUMN IF NOT EXISTS surface_finish TEXT;

-- Add comments
COMMENT ON COLUMN public.queue_items.required_tolerance IS 'Required tolerance e.g. ±0.001, ±0.005, ±0.010';
COMMENT ON COLUMN public.queue_items.surface_finish IS 'Required surface finish e.g. 32Ra, 63Ra, 125Ra, as-machined';
COMMENT ON COLUMN public.part_catalog.required_tolerance IS 'Default tolerance for this part';
COMMENT ON COLUMN public.part_catalog.surface_finish IS 'Default surface finish for this part';
