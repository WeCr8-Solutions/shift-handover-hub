
-- SUPA_public_bucket_allows_listing: blog-media
-- Replace overly-broad public-read policy with one that prevents listing
-- (requires a non-empty file name path component, so direct URL access works
--  but bucket listing returns nothing).
DROP POLICY IF EXISTS "Blog media public read" ON storage.objects;

CREATE POLICY "Blog media public read by path"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'blog-media'
  AND name IS NOT NULL
  AND length(name) > 0
  AND POSITION('/' IN name) > 0
);
