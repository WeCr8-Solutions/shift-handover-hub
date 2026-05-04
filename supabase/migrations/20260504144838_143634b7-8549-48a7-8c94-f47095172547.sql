DO $$
BEGIN
  IF to_regclass('public.certifying_mentors') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.certifying_mentors'::regclass
        AND conname = 'oap_designated_mentors_pkey'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.certifying_mentors'::regclass
        AND conname = 'certifying_mentors_pkey'
    ) THEN
      ALTER TABLE public.certifying_mentors
        RENAME CONSTRAINT oap_designated_mentors_pkey TO certifying_mentors_pkey;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.certifying_mentors'::regclass
        AND conname = 'oap_designated_mentors_organization_id_user_id_key'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.certifying_mentors'::regclass
        AND conname = 'certifying_mentors_organization_id_user_id_key'
    ) THEN
      ALTER TABLE public.certifying_mentors
        RENAME CONSTRAINT oap_designated_mentors_organization_id_user_id_key TO certifying_mentors_organization_id_user_id_key;
    END IF;

    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.certifying_mentors'::regclass
        AND conname = 'oap_designated_mentors_organization_id_fkey'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.certifying_mentors'::regclass
        AND conname = 'certifying_mentors_organization_id_fkey'
    ) THEN
      ALTER TABLE public.certifying_mentors
        RENAME CONSTRAINT oap_designated_mentors_organization_id_fkey TO certifying_mentors_organization_id_fkey;
    END IF;

    IF to_regclass('public.idx_oap_mentors_org') IS NOT NULL
       AND to_regclass('public.idx_certifying_mentors_org') IS NULL THEN
      ALTER INDEX public.idx_oap_mentors_org RENAME TO idx_certifying_mentors_org;
    END IF;
  END IF;
END $$;