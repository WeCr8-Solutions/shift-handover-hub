DO $$
DECLARE
  v_oap_measurement_id uuid;
  v_gca_inspection_id uuid;
BEGIN
  SELECT id INTO v_oap_measurement_id
  FROM public.oap_courses
  WHERE slug = 'measurement-inspection';

  SELECT id INTO v_gca_inspection_id
  FROM public.gca_question_banks
  WHERE slug = 'inspection-metrology';

  IF v_oap_measurement_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES
    (
      NULL, 'oap', 'oap_course', v_oap_measurement_id,
      'video', 'text/uri-list', 'external', 'https://www.youtube.com/watch?v=DwhofhnrVG4',
      'vernier-caliper-micrometer.url',
      'How to Read a Vernier Caliper and Micrometer Correctly — INSIDE MACHINES',
      'How to Read a Vernier Caliper and Micrometer Correctly — INSIDE MACHINES',
      10, false, 'public', true
    ),
    (
      NULL, 'oap', 'oap_course', v_oap_measurement_id,
      'video', 'text/uri-list', 'external', 'https://www.youtube.com/watch?v=Bkh4a9HR7kY',
      'inch-vernier-micrometer.url',
      'How To Read A Mitutoyo Inch Vernier Micrometer',
      'How To Read A Mitutoyo Inch Vernier Micrometer',
      11, false, 'public', true
    ),
    (
      NULL, 'oap', 'oap_course', v_oap_measurement_id,
      'video', 'text/uri-list', 'external', 'https://www.youtube.com/watch?v=6G_xdekSsS0',
      'metric-vernier-micrometer.url',
      'Reading a Metric Vernier Micrometer — HaasTooling.com',
      'Reading a Metric Vernier Micrometer — HaasTooling.com',
      12, false, 'public', true
    )
    ON CONFLICT (entity_type, entity_id, storage_bucket, storage_path) DO NOTHING;
  END IF;

  IF v_gca_inspection_id IS NOT NULL THEN
    INSERT INTO public.training_media (
      organization_id, program, entity_type, entity_id,
      media_type, mime_type, storage_bucket, storage_path,
      file_name, alt_text, caption, sort_order, is_primary, visibility, is_canonical
    ) VALUES
    (
      NULL, 'gca', 'gca_question_bank', v_gca_inspection_id,
      'video', 'text/uri-list', 'external', 'https://www.youtube.com/watch?v=DwhofhnrVG4',
      'vernier-caliper-micrometer.url',
      'How to Read a Vernier Caliper and Micrometer Correctly — INSIDE MACHINES',
      'How to Read a Vernier Caliper and Micrometer Correctly — INSIDE MACHINES',
      10, false, 'public', true
    ),
    (
      NULL, 'gca', 'gca_question_bank', v_gca_inspection_id,
      'video', 'text/uri-list', 'external', 'https://www.youtube.com/watch?v=Bkh4a9HR7kY',
      'inch-vernier-micrometer.url',
      'How To Read A Mitutoyo Inch Vernier Micrometer',
      'How To Read A Mitutoyo Inch Vernier Micrometer',
      11, false, 'public', true
    ),
    (
      NULL, 'gca', 'gca_question_bank', v_gca_inspection_id,
      'video', 'text/uri-list', 'external', 'https://www.youtube.com/watch?v=6G_xdekSsS0',
      'metric-vernier-micrometer.url',
      'Reading a Metric Vernier Micrometer — HaasTooling.com',
      'Reading a Metric Vernier Micrometer — HaasTooling.com',
      12, false, 'public', true
    )
    ON CONFLICT (entity_type, entity_id, storage_bucket, storage_path) DO NOTHING;
  END IF;
END $$;
