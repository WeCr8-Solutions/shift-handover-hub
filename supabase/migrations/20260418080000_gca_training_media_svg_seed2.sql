-- =============================================================================
-- Register additional GCA learning diagram SVGs in training_media
-- Covers: lathe anatomy, lathe ops, mill offsets, fanuc structure,
--         fanuc canned cycles, haas differences, mazak/okuma/siemens,
--         GD&T datum frame, GD&T tolerance zones, micrometer, surface finish
-- =============================================================================

DO $$
DECLARE
  v_bank_id UUID;
BEGIN

  -- ── lathe-axes-anatomy.svg → Lathe Fundamentals ──────────────────────────
  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'lathe-fundamentals';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/lathe-axes-anatomy.svg',
      'lathe-axes-anatomy.svg',
      'CNC lathe X/Z axis orientation, machine anatomy, spindle direction, and key G-codes (G50/G96/G97)',
      'CNC Lathe Anatomy: X-axis (radial, + away from center) and Z-axis (spindle centerline, + toward tailstock). Headstock, chuck, turret, tailstock, live center labeled. G50/G96/G97/G54 reference and diameter vs radius mode note.',
      2, false, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;

    -- lathe-turning-operations.svg
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/lathe-turning-operations.svg',
      'lathe-turning-operations.svg',
      'Lathe operations reference: OD turning, facing, boring, grooving, G76 threading cycle, taper/arc, canned roughing G71/G72/G73/G70',
      'Lathe Turning Operations: OD turn (G01 Z-feed), facing (G01 X-feed), boring (boring bar ID), grooving, G76 two-call threading (P/Q/F params), G02/G03 taper/arc, G71 roughing + G70 finish. All X in diameter mode.',
      3, false, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  -- ── mill-work-offsets-g54.svg → Mill Fundamentals ────────────────────────
  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'mill-fundamentals';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/mill-work-offsets-g54.svg',
      'mill-work-offsets-g54.svg',
      'Mill work coordinate offsets G54–G59: multi-part fixture layout, MCS vs WCS, G10 L2 Pn X Y Z setting, extended offsets (Fanuc G54.1, Haas G110-G129)',
      'Mill Work Offsets G54–G59: diagram shows three parts on a fixture each with their own origin (G54/G55/G56), all offset from machine home. G10 L2 P1 syntax, use cases (multi-part, Op10/Op20, tombstone), G53 machine-coord move, Fanuc/Haas extended offset systems.',
      4, false, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  -- ── fanuc-program-structure.svg → Fanuc Controller ───────────────────────
  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'fanuc-controller';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/fanuc-program-structure.svg',
      'fanuc-program-structure.svg',
      'Fanuc CNC program structure: % delimiters, O-number, safety init block, T M06 tool call, G43 TLO, motion blocks, M30 end',
      'Fanuc Program Structure: annotated sample program showing % start/end, O-number, comment blocks, G20/G40/G49/G80/G90 safety init, G91 G28 home, T__ M06 ATC, G43 H__ tool length offset, G54 WCS activation, feed/rapid moves, M30 end. Modal vs non-modal G-code group table.',
      1, true, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;

    -- fanuc-canned-cycles.svg
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/fanuc-canned-cycles.svg',
      'fanuc-canned-cycles.svg',
      'Fanuc canned drilling cycles: G81 simple drill, G83 peck (full retract), G73 chip-break peck, G84 rigid tapping with M29 and feed=pitch',
      'Fanuc Canned Cycles: G81 (rapid to R, feed to Z, rapid retract), G83 (full retract peck with Q depth, best chip clearance), G73 (chip-break peck, small retract d), G84 rigid tapping (M29 S__ before, F=1/TPI). G98 vs G99 retract plane. G80 cancel.',
      2, false, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  -- ── haas-control-differences.svg → Haas Controller ───────────────────────
  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'haas-controller';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/haas-control-differences.svg',
      'haas-control-differences.svg',
      'Haas CNC differences from Fanuc: WHILE/DO/END macros, G110-G129 extra offsets, G36/G37 auto probing, NGC touchscreen, DWO G254/G255, M-codes M88/M109',
      'Haas vs Fanuc: macro variables (#100–#199 global, WHILE/DO/END loops), tool probing (G31/G36/G37), offset pages (geometry+wear split), G110–G129 extended WCS, Haas-specific M-codes (M88 high-pres coolant, M109 interactive), NGC DWO (G254/G255), comparison table for loops/offsets/rigid tap.',
      1, true, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  -- ── mazak-okuma-siemens-syntax.svg → Mazak, Okuma, Siemens ──────────────
  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'mazak-controller';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/mazak-okuma-siemens-syntax.svg',
      'mazak-okuma-siemens-syntax.svg',
      'Mazak MAZATROL/EIA, Okuma OSP, Siemens Sinumerik 840D — program structure, variables, cycles, and key syntax differences vs Fanuc',
      'Three-panel controller comparison: Mazak (MAZATROL conversational UNIT flow + EIA SETREG/GETREG, G05.1 AI contour), Okuma OSP (VC/VA variables, DO WHILE LOOP, G23/G24 store/return, thermal compensation), Siemens 840D (named tools T="name" D1, G94/G95/G96/LIMS, CYCLE83/CYCLE840, R-params, DEF typed variables).',
      1, true, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  -- Also link the same SVG to okuma and siemens banks as secondary
  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'okuma-controller';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/mazak-okuma-siemens-syntax-okuma.svg',
      'mazak-okuma-siemens-syntax.svg',
      'Controller syntax comparison — Okuma OSP: VC/VA variables, DO WHILE LOOP, G23/G24, thermal compensation, CALL/RTS sub-programs',
      'Controller Comparison (Okuma focus): OSP VC variables (common), VA variables (local), DO WHILE/LOOP syntax, G23 store position/G24 return, G22 zero set, thermal compensation (no warm-up needed), CALL O____ / RTS sub-program syntax vs Fanuc M98/M99.',
      1, true, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'siemens-controller';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/mazak-okuma-siemens-syntax-siemens.svg',
      'mazak-okuma-siemens-syntax.svg',
      'Controller syntax comparison — Siemens Sinumerik 840D: named tools, G94/G95/G96/LIMS, CYCLE81/83/840, R-params, DEF typed variables, FOR loops',
      'Controller Comparison (Siemens focus): %_N_name_MPF program file format, T="TOOL_NAME" D1 named tool selection, G94 mm/min / G95 mm/rev / G96 CSS / LIMS max-RPM clamp, Sinumerik cycles (CYCLE81/83/840/POCKET3), R0= parameters, DEF REAL typed variables, IF GOTOF / FOR ENDFOR loop syntax.',
      1, true, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  -- ── GD&T datum reference frame ────────────────────────────────────────────
  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'gdt-basics';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/gdt-datum-reference-frame.svg',
      'gdt-datum-reference-frame.svg',
      'GD&T datum reference frame (DRF): 3-2-1 locating rule, primary/secondary/tertiary datums, degrees of freedom constrained, FCF datum order',
      'GD&T Datum Reference Frame: 3D box showing datum A (primary, 3-point contact, 3 rotations), B (secondary, 2-point, 2 translations), C (tertiary, 1-point, 1 translation). Six total DOF constrained = fully located. FCF datum order reading guide. 3-2-1 locating rule for machining fixtures and CMM setup.',
      2, false, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;

    -- GD&T tolerance zones
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/gdt-tolerance-zones.svg',
      'gdt-tolerance-zones.svg',
      'GD&T tolerance zone types: flatness (two parallel planes), perpendicularity (planes from datum), cylindricity (coaxial cylinders), true position (diametral zone Ø)',
      'GD&T Tolerance Zones: flatness (no datum, two planes), perpendicularity (two planes ⊥ to datum A), cylindricity (coaxial cylinders, no datum — controls roundness+straightness+taper combined), true position (cylindrical Ø zone at nominal, Ⓜ bonus tolerance). Full characteristic table: zone shape, datum requirement, measurement method.',
      3, false, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

  -- ── Micrometer reading → Inspection & Metrology ──────────────────────────
  SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'inspection-metrology';
  IF v_bank_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/micrometer-reading.svg',
      'micrometer-reading.svg',
      'Micrometer reading — inch (0.0001" resolution with vernier) and metric (0.001mm), sleeve/thimble/vernier anatomy, worked examples, common mistakes',
      'Micrometer Reading: inch side shows sleeve major divisions (0.025" per turn), thimble (25 divisions × 0.001"), vernier (0.0001" resolution), worked example = 0.2178". Metric side: 0.5mm pitch, thimble 50 divisions × 0.01mm, half-mm below-line marks, worked example = 3.07mm. Common mistakes: forgetting 0.5mm line, inconsistent ratchet feel, body heat expansion.',
      1, true, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;

    -- Surface finish symbols
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES (
      NULL, 'gca', 'gca_question_bank', v_bank_id,
      'image', 'image/svg+xml', 'training-media-public',
      'canonical/gca/surface-finish-symbols.svg',
      'surface-finish-symbols.svg',
      'Surface finish symbols: Ra callout anatomy, lay symbols (= ⊥ X M C R P), Ra values by machining process from rough turning (500µin) to lapping (4µin), application requirements',
      'Surface Finish Reference: callout symbol anatomy (Ra value, lay symbol, machining-required bar). Lay symbol table (=,⊥,X,M,C,R,P). Ra process table from flame cut (1000–2000µin) through rough/semi/finish turning/milling, grinding, honing, lapping. Application guide: 125µin general, 63µin fits, 32µin bearings, 16µin hydraulics. Measurement tools: contact profilometer, comparator, optical.',
      2, false, 'public', true
    ) ON CONFLICT (storage_bucket, storage_path) DO NOTHING;
  END IF;

END $$;
