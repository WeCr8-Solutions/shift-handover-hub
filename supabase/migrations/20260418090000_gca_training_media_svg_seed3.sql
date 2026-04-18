-- =============================================================================
-- Register additional GCA SVGs: lathe ID ops, lathe parting/knurling/taper,
-- mill complete operations. Also stores curated YouTube video links as
-- training_media rows with media_type='video', mime_type='video/youtube',
-- storage_bucket='external', storage_path = YouTube URL.
-- =============================================================================

DO $$
DECLARE
  v_lathe_id  UUID;
  v_mill_id   UUID;
  v_fanuc_id  UUID;
  v_haas_id   UUID;
  v_gdt_id    UUID;
  v_sf_id     UUID;
  v_ins_id    UUID;
BEGIN

  SELECT id INTO v_lathe_id FROM public.gca_question_banks WHERE slug = 'lathe-fundamentals';
  SELECT id INTO v_mill_id  FROM public.gca_question_banks WHERE slug = 'mill-fundamentals';
  SELECT id INTO v_fanuc_id FROM public.gca_question_banks WHERE slug = 'fanuc-controller';
  SELECT id INTO v_haas_id  FROM public.gca_question_banks WHERE slug = 'haas-controller';
  SELECT id INTO v_gdt_id   FROM public.gca_question_banks WHERE slug = 'gdt-basics';
  SELECT id INTO v_sf_id    FROM public.gca_question_banks WHERE slug = 'speeds-and-feeds';
  SELECT id INTO v_ins_id   FROM public.gca_question_banks WHERE slug = 'inspection-metrology';

  -- ── SVG: lathe-id-operations ───────────────���──────────────────���───────────
  IF v_lathe_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_lathe_id,
      'image','image/svg+xml','training-media-public',
      'canonical/gca/lathe-id-operations.svg',
      'lathe-id-operations.svg',
      'Lathe ID operations: boring, ID grooving, ID threading (G76), reaming (G85), center drilling — selection guide by tolerance achievable',
      'Lathe ID Operations: boring (rough ±0.002"/finish ±0.0005"), ID grooving (G75 peck cycle, O-ring/snap-ring/thread-relief), ID threading with G76 (pre-bore to minor first), center drilling, reaming G85 (H7 fit, feed-in+out). Bar overhang rule: max 4×D unsupported.',
      4,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_lathe_id,
      'image','image/svg+xml','training-media-public',
      'canonical/gca/lathe-parting-knurling-taper.svg',
      'lathe-parting-knurling-taper.svg',
      'Lathe special ops: parting/cutoff (G01/G74), knurling (diamond/straight), taper turning (simultaneous X+Z), thread relief/undercut, face grooving (G74) — canned cycle quick reference G74/G75/G76/G71/G70/G92',
      'Lathe Special Operations: parting (X to -0.060 past center, G50 clamp, G97 near center), knurling (G96 low SFM, high feed, steady rest), taper (simultaneous X+Z, taper formula), thread relief (cut before G76, width ≥ 2×pitch), face grooving (G74 peck facing cycle). Full canned cycle param table.',
      5,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;
  END IF;

  -- ── SVG: mill-operations-complete ─────────────────────────��───────────────
  IF v_mill_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_mill_id,
      'image','image/svg+xml','training-media-public',
      'canonical/gca/mill-operations-complete.svg',
      'mill-operations-complete.svg',
      'Mill operations: face milling, shoulder milling (G41/G42 cutter comp), slotting, boring G76/G85, thread milling G02/G03 helical, T-slot, dovetail, keyway, reaming',
      'Mill Operations Complete: face milling (60–80% stepover, 45° lead insert, climb finish), shoulder milling (G41 cutter comp lead-in rules), slotting (reduce feed 40%, peck strategy), boring G76 orient-retract vs G85 ream, thread milling helical G03 one-pitch-per-360°, T-slot (slot first then T-cutter), dovetail (ball gauge method), keyway H9 fit, reaming G85 H7 tolerance.',
      5,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;
  END IF;

  -- ═════════��═════════════════════════════════════════════════════════════
  -- YouTube video links (media_type='video', mime_type='text/uri-list',
  -- storage_bucket='external', storage_path = canonical YouTube URL)
  -- ═══════════════════════════════════════��═════════════════════════════��═

  -- Lathe: G&M Code Manual Programming — Titans of CNC
  IF v_lathe_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_lathe_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=5XihF05K4yM',
      'titans-gm-code-manual-programming.url',
      'G & M Code — Titan Teaches Manual Programming on a CNC Machine (Titans of CNC)',
      10,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    -- Haas: Rough-Finish-Thread with inserts
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_lathe_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=l1C34QmGuIA',
      'haas-rough-finish-thread.url',
      'Rough → Finish → Thread Using Inserts — Haas Automation (full lathe sequence)',
      11,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    -- G75 grooving cycle
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_lathe_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=G9fzYrdpzXg',
      'g75-grooving-cycle.url',
      'CNC Lathe Grooving Using G75 Canned Cycle',
      12,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    -- Part-off like a pro — Haas
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_lathe_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=vbpeFzG-4vU',
      'haas-part-off.url',
      'Part-Off Like a Pro — Haas Automation',
      13,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    -- G76 single point threading
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_lathe_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=e03pTbEBuGg',
      'g76-threading-programming.url',
      'CNC Lathe Programming — Single Point Threading G76/G92',
      14,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;
  END IF;

  -- Mill: What is G-Code — Haas
  IF v_mill_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_mill_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=iMx_UYrvuos',
      'haas-what-is-gcode.url',
      'What is G-Code? — Haas Automation Tip of the Day',
      10,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    -- G00 G01 G02 G03 — Haas
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_mill_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=XqEWdLbOeZQ',
      'haas-g00-g01-g02-g03.url',
      'G00, G01, G02, G03 — Every Part You Made Used These Codes — Haas Tip of Day',
      11,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    -- Thread milling — Titans
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_mill_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=9J4uJs3VPEo',
      'titans-thread-mill.url',
      'G & M Code — How To Manually Program A Thread Mill (Titans of CNC Vlog #57)',
      12,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    -- Haas boring system
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_mill_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=5v64p2n4AMM',
      'haas-boring-system.url',
      'The Haas Boring System for CNC Mills — size and finish',
      13,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;
  END IF;

  -- Fanuc: 9 Lines Every CNC Machinist Needs — Haas
  IF v_fanuc_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_fanuc_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=hJM8pnUazpk',
      'haas-9-lines-gcode.url',
      '9 Lines of Code Every CNC Machinist Needs to Know — Haas Automation Tip of Day',
      10,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    -- CNC Mill G-code tutorial
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_fanuc_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=hq47wq9qBbs',
      'cnc-mill-gcode-tutorial.url',
      'CNC G Code Programming: A CNC Mill Tutorial Explaining G Codes',
      11,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;
  END IF;

  -- Haas: 9 lines + hand program tutorial
  IF v_haas_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_haas_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=6lUPX0itPFQ',
      'haas-hand-program-mill.url',
      'How to Program G-Code & M-Code by Hand on a Haas Desktop Mill',
      10,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_haas_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=BCVX-iqdWPo',
      'haas-thread-milling.url',
      'HAAS CNC Mill — Thread Milling Without Cutter Comp (G03 internal thread)',
      11,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;
  END IF;

  -- GD&T: beginner guide + 10 minutes
  IF v_gdt_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_gdt_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=OonZQkwSZOk',
      'gdt-beginners-guide.url',
      'An Updated Beginner''s Guide to GD&T (ASME Y14.5 fundamentals)',
      10,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_gdt_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=P5GT9ZSRYl0',
      'gdt-in-10-minutes.url',
      'What is GD&T in 10 Minutes',
      11,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;
  END IF;

  -- Speeds & Feeds: beginner + Haas inch + Haas metric
  IF v_sf_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_sf_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=-aObuoV0Kmw',
      'speeds-feeds-explained.url',
      'Feeds and Speeds Explained: A Beginner''s Guide for Machinists',
      10,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_sf_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=zzzIpC39WUg',
      'haas-speeds-feeds-inch.url',
      'How To Calculate Speeds and Feeds (Inch Version) — Haas Automation Tip of Day',
      11,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_sf_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=gTnkNHB7dss',
      'haas-speeds-feeds-metric.url',
      'How To Calculate Speeds and Feeds (Metric Version) — Haas Automation Tip of Day',
      12,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;
  END IF;

  -- Inspection: micrometer reading + caliper
  IF v_ins_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_ins_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=DwhofhnrVG4',
      'micrometer-caliper-reading.url',
      'How to Read a Vernier Caliper and Micrometer Correctly — INSIDE MACHINES',
      10,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_ins_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=Bkh4a9HR7kY',
      'mitutoyo-micrometer.url',
      'How To Read A Mitutoyo Inch Vernier Micrometer',
      11,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;

    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL,'gca','gca_question_bank',v_ins_id,
      'video','text/uri-list','external',
      'https://www.youtube.com/watch?v=6G_xdekSsS0',
      'haastooling-metric-micrometer.url',
      'Reading a Metric Vernier Micrometer — HaasTooling.com',
      12,false,'public',true
    ) ON CONFLICT (storage_bucket,storage_path) DO NOTHING;
  END IF;

END $$;
