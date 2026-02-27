
-- =============================================
-- Part-Aware Context: inline fields on queue_items + optional part_catalog
-- =============================================

-- 1. Add part spec columns to queue_items for per-WO inline entry
ALTER TABLE public.queue_items
  ADD COLUMN IF NOT EXISTS material_type text,
  ADD COLUMN IF NOT EXISTS part_length_inches numeric,
  ADD COLUMN IF NOT EXISTS part_width_inches numeric,
  ADD COLUMN IF NOT EXISTS part_height_inches numeric,
  ADD COLUMN IF NOT EXISTS part_weight_lbs numeric,
  ADD COLUMN IF NOT EXISTS part_shape text,
  ADD COLUMN IF NOT EXISTS part_catalog_id uuid;

-- Add comment for shape values
COMMENT ON COLUMN public.queue_items.part_shape IS 'General shape: prismatic, cylindrical, complex, flat, tubular';

-- 2. Create the optional part_catalog table for reusable part profiles
CREATE TABLE IF NOT EXISTS public.part_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  part_number text NOT NULL,
  description text,
  material_type text,
  part_length_inches numeric,
  part_width_inches numeric,
  part_height_inches numeric,
  part_weight_lbs numeric,
  part_shape text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, part_number)
);

-- FK from queue_items to part_catalog
ALTER TABLE public.queue_items
  ADD CONSTRAINT queue_items_part_catalog_id_fkey
  FOREIGN KEY (part_catalog_id) REFERENCES public.part_catalog(id) ON DELETE SET NULL;

-- 3. RLS for part_catalog
ALTER TABLE public.part_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their part catalog"
  ON public.part_catalog FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins can insert part catalog entries"
  ON public.part_catalog FOR INSERT
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update part catalog entries"
  ON public.part_catalog FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete part catalog entries"
  ON public.part_catalog FOR DELETE
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Platform admins full access
CREATE POLICY "Platform admins full access to part catalog"
  ON public.part_catalog FOR ALL
  USING (public.is_dev_or_admin(auth.uid()));

-- 4. Updated_at trigger
CREATE TRIGGER update_part_catalog_updated_at
  BEFORE UPDATE ON public.part_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_part_catalog_org_part ON public.part_catalog(organization_id, part_number);
