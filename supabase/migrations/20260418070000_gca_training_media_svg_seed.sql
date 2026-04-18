-- =============================================================================
-- Add SVG support to training-media-public bucket + trigger
-- Register canonical GCA learning diagram SVGs in training_media
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Update the MIME validation trigger to allow image/svg+xml
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validate_training_media_mime()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.media_type = 'image' AND NEW.mime_type NOT IN (
    'image/avif','image/gif','image/jpeg','image/png','image/webp','image/svg+xml'
  ) THEN
    RAISE EXCEPTION 'Unsupported image MIME: %', NEW.mime_type;
  ELSIF NEW.media_type = 'audio' AND NEW.mime_type NOT IN (
    'audio/mpeg','audio/mp4','audio/x-m4a','audio/aac'
  ) THEN
    RAISE EXCEPTION 'Unsupported audio MIME: %', NEW.mime_type;
  ELSIF NEW.media_type = 'video' AND NEW.mime_type NOT IN (
    'video/mp4','video/webm','video/quicktime'
  ) THEN
    RAISE EXCEPTION 'Unsupported video MIME: %', NEW.mime_type;
  END IF;

  IF NEW.is_canonical = true AND NEW.organization_id IS NOT NULL THEN
    RAISE EXCEPTION 'Canonical training_media rows cannot have organization_id';
  END IF;
  IF NEW.is_canonical = false AND NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Non-canonical training_media rows must have organization_id';
  END IF;

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Update the storage bucket allowed_mime_types to include SVG
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE storage.buckets
SET allowed_mime_types = array_append(
  array_remove(allowed_mime_types, 'image/svg+xml'),
  'image/svg+xml'
)
WHERE id = 'training-media-public'
  AND NOT ('image/svg+xml' = ANY(allowed_mime_types));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Insert canonical training_media rows for GCA learning diagram SVGs
--    entity_type = 'gca_question_bank', entity_id = bank.id (by slug lookup)
--    storage_path follows convention: canonical/gca/{filename}
--    These rows assume the files will be uploaded to the bucket at that path.
--    For local dev the /gca-images/ static route serves them directly.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_bank_id UUID;
BEGIN

  -- contour-milling-endmill.svg → Mill Fundamentals
  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'mill-fundamentals';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order,
      is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/contour-milling-endmill.svg',
      'contour-milling-endmill.svg',
      'Contour milling with end mill — G41 cutter compensation, climb milling, chip formation diagram',
      'Contour Milling with End Mill: shows programmed path vs tool center path, G41 offset, chip thickness (thick→thin), and ADOC callout.',
      1, true, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  -- pocket-milling-strategies.svg → Mill Fundamentals
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order,
      is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/pocket-milling-strategies.svg',
      'pocket-milling-strategies.svg',
      'Pocket milling strategies — raster zigzag, contour offset HSM, trochoidal, and entry methods',
      'Pocket Milling Strategies: compares raster (zigzag), contour/HSM offset, and trochoidal toolpaths. Shows helical, ramp, and pre-drilled entry methods.',
      2, false, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  -- climb-vs-conventional-milling.svg → Mill Fundamentals
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order,
      is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/climb-vs-conventional-milling.svg',
      'climb-vs-conventional-milling.svg',
      'Climb vs conventional milling — chip formation, cutting forces, and when to use each method',
      'Climb vs Conventional Milling: side-by-side chip thickness diagrams (thick-to-thin vs thin-to-thick), table force direction, and comparison table.',
      3, false, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  -- tool-offset-geometry-wear.svg → Lathe Fundamentals (primary) + Mill Fundamentals (secondary)
  -- Register against lathe as primary
  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'lathe-fundamentals';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order,
      is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/tool-offset-geometry-wear.svg',
      'tool-offset-geometry-wear.svg',
      'Tool offsets: geometry vs wear — how both offset types position the tool, with FAI adjustment workflow',
      'Tool Offset Diagram: geometry offset (machine home to nominal tip) vs wear offset (fine production correction). Includes FAI workflow: adjust wear now, not on the next part.',
      1, true, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  -- Also link the same SVG to mill-fundamentals as a secondary reference
  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'mill-fundamentals';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order,
      is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/tool-offset-geometry-wear-mill.svg',
      'tool-offset-geometry-wear.svg',
      'Tool offsets geometry vs wear (mill context)',
      'Tool Length Offset (H register) for milling: geometry offset from spindle nose to tool tip, wear correction, and FAI workflow.',
      4, false, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  -- gdt-feature-control-frame.svg → GD&T Basics
  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'gdt-basics';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order,
      is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/gdt-feature-control-frame.svg',
      'gdt-feature-control-frame.svg',
      'GD&T feature control frame anatomy — symbol, tolerance, modifiers, and datums with bonus tolerance example',
      'GD&T Feature Control Frame: left-to-right breakdown (geometric symbol, ⌀ tolerance, MMC modifier, primary/secondary datums). Includes hole with tolerance zone and MMC bonus tolerance example. Full symbol reference table.',
      1, true, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  -- speeds-feeds-calculator.svg → Speeds & Feeds
  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'speeds-and-feeds';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order,
      is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/speeds-feeds-calculator.svg',
      'speeds-feeds-calculator.svg',
      'Speeds & feeds formulas — RPM, IPM, chip load, worked example, and SFM reference table by material',
      'Speeds & Feeds Reference: RPM = (SFM×12)/(π×D), IPM = RPM×f_z×Z, metric equivalent. Worked example for 0.500" 4-flute end mill in 6061 Al. SFM table for aluminum, mild steel, 4140 HT, 304 stainless, and Ti-6Al-4V.',
      1, true, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. OAP: also register the tool-offset-geometry-wear diagram against
--    the Tooling & Preset course (entity_type = oap_course)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_course_id UUID;
BEGIN
  SELECT id INTO v_course_id FROM public.oap_courses WHERE slug = 'tooling-preset';
  IF v_course_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order,
      is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'oap', 'oap_course', v_course_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/tool-offset-geometry-wear.svg',
      'tool-offset-geometry-wear.svg',
      'Tool offsets: geometry vs wear — OAP Tooling & Preset section reference',
      'Geometry vs Wear Offset reference for OAP Section 5 (Tooling & Preset). Includes the FAI adjustment workflow: adjust wear offset during the FAI run, re-measure, re-run if needed.',
      1, true, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;
END $$;
