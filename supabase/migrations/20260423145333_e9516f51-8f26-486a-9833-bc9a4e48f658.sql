-- Phase 1: Consolidate duplicate handbook categories
-- Keep: fits-tolerances, inspection-measurement (renamed from measurement), safety-standards
-- Drop: tolerances-fits, inspection, safety

-- Rename measurement -> inspection-measurement (keeper)
UPDATE public.handbook_categories
SET slug = 'inspection-measurement', name = 'Inspection & Measurement'
WHERE slug = 'measurement';

-- Repoint references from duplicates to keepers
UPDATE public.handbook_references
SET category_id = (SELECT id FROM public.handbook_categories WHERE slug = 'fits-tolerances')
WHERE category_id = (SELECT id FROM public.handbook_categories WHERE slug = 'tolerances-fits');

UPDATE public.handbook_references
SET category_id = (SELECT id FROM public.handbook_categories WHERE slug = 'inspection-measurement')
WHERE category_id = (SELECT id FROM public.handbook_categories WHERE slug = 'inspection');

UPDATE public.handbook_references
SET category_id = (SELECT id FROM public.handbook_categories WHERE slug = 'safety-standards')
WHERE category_id = (SELECT id FROM public.handbook_categories WHERE slug = 'safety');

-- Drop now-empty duplicate categories
DELETE FROM public.handbook_categories
WHERE slug IN ('tolerances-fits', 'inspection', 'safety')
  AND NOT EXISTS (SELECT 1 FROM public.handbook_references r WHERE r.category_id = handbook_categories.id);

-- Ensure sort_order is sane
UPDATE public.handbook_categories SET sort_order = 1 WHERE slug = 'materials';
UPDATE public.handbook_categories SET sort_order = 2 WHERE slug = 'feeds-speeds';
UPDATE public.handbook_categories SET sort_order = 3 WHERE slug = 'threads';
UPDATE public.handbook_categories SET sort_order = 4 WHERE slug = 'fits-tolerances';
UPDATE public.handbook_categories SET sort_order = 5 WHERE slug = 'gdt';
UPDATE public.handbook_categories SET sort_order = 6 WHERE slug = 'formulas';
UPDATE public.handbook_categories SET sort_order = 7 WHERE slug = 'inspection-measurement';
UPDATE public.handbook_categories SET sort_order = 8 WHERE slug = 'safety-standards';