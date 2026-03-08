
-- ============================================================
-- Production-harden part-images and setup-sheets buckets
-- ============================================================

-- 1. Add file size limits and MIME type restrictions
UPDATE storage.buckets
SET file_size_limit = 10485760,  -- 10MB
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/svg+xml','image/gif']
WHERE id = 'part-images';

UPDATE storage.buckets
SET file_size_limit = 20971520,  -- 20MB (PDFs, drawings can be larger)
    allowed_mime_types = ARRAY[
      'application/pdf',
      'image/jpeg','image/png','image/webp','image/svg+xml',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream'
    ]
WHERE id = 'setup-sheets';

-- Also harden email-assets
UPDATE storage.buckets
SET file_size_limit = 2097152,  -- 2MB
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']
WHERE id = 'email-assets';

-- 2. Drop overly-permissive policies on part-images
DROP POLICY IF EXISTS "Org members can upload part images" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view part images" ON storage.objects;
DROP POLICY IF EXISTS "Supervisors can delete part images" ON storage.objects;

-- 3. Drop overly-permissive policies on setup-sheets
DROP POLICY IF EXISTS "Org members can upload setup sheets" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view setup sheets files" ON storage.objects;
DROP POLICY IF EXISTS "Supervisors can delete setup sheet files" ON storage.objects;

-- 4. Create org-scoped RLS for part-images
-- Path format: {org_id}/{user_id}/{filename}
CREATE POLICY "part_images_insert_org_member"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'part-images'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
    AND (auth.uid())::text = (storage.foldername(name))[2]
  );

CREATE POLICY "part_images_select_org_member"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'part-images'
    AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "part_images_delete_own_files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'part-images'
    AND (auth.uid())::text = (storage.foldername(name))[2]
  );

-- 5. Create org-scoped RLS for setup-sheets
CREATE POLICY "setup_sheets_insert_org_member"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'setup-sheets'
    AND (storage.foldername(name))[1] IS NOT NULL
    AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
    AND (auth.uid())::text = (storage.foldername(name))[2]
  );

CREATE POLICY "setup_sheets_select_org_member"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'setup-sheets'
    AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "setup_sheets_delete_own_files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'setup-sheets'
    AND (auth.uid())::text = (storage.foldername(name))[2]
  );
