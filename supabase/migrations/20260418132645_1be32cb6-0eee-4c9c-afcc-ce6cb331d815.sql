ALTER TABLE public.training_media DROP CONSTRAINT IF EXISTS training_media_storage_bucket_check;
ALTER TABLE public.training_media ADD CONSTRAINT training_media_storage_bucket_check
  CHECK (storage_bucket = ANY (ARRAY['training-media-public','training-media-private','external']));