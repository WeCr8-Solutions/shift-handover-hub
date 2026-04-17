DROP POLICY IF EXISTS "Certificates are publicly readable" ON storage.objects;

CREATE POLICY "Certificate PDFs publicly readable by exact path"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'oap-gca-certificates'
  AND lower(right(name, 4)) = '.pdf'
);