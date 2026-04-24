ALTER TABLE public.handbook_references
  ADD COLUMN IF NOT EXISTS source_url text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'training_media'
      AND constraint_name = 'training_media_storage_bucket_storage_path_key'
  ) THEN
    ALTER TABLE public.training_media
      DROP CONSTRAINT training_media_storage_bucket_storage_path_key;
  END IF;
END $$;

ALTER TABLE public.training_media
  ADD CONSTRAINT training_media_entity_storage_unique
  UNIQUE (entity_type, entity_id, storage_bucket, storage_path);
