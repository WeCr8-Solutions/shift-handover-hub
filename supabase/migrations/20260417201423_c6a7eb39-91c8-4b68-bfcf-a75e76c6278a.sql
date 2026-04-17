
-- Replace overly broad public SELECT with one that disallows listing.
-- Direct file fetches by full path still work via Supabase's public URL endpoint,
-- but anonymous clients cannot enumerate bucket contents.
DROP POLICY IF EXISTS "Public training media is readable by all" ON storage.objects;

CREATE POLICY "Authed users read public training media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'training-media-public');
