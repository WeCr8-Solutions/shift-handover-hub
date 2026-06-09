
-- Storage RLS for the concierge-docs bucket.
-- File paths use the form: {engagement_id}/{document_key}/v{n}.{ext}

CREATE POLICY "concierge_docs_read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'concierge-docs'
  AND (
    public.is_platform_admin_or_dev(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.onboarding_engagements e
      WHERE e.id::text = split_part(storage.objects.name, '/', 1)
        AND e.assigned_admin_id = auth.uid()
    )
  )
);

CREATE POLICY "concierge_docs_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'concierge-docs'
  AND (
    public.is_platform_admin_or_dev(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.onboarding_engagements e
      WHERE e.id::text = split_part(storage.objects.name, '/', 1)
        AND e.assigned_admin_id = auth.uid()
    )
  )
);

-- No DELETE / UPDATE — sealed copies are immutable. Service role still has full access.
