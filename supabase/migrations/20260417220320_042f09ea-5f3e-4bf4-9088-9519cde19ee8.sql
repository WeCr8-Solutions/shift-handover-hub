
-- 1. Make training-media-public bucket private (was leaking via URL guessing)
UPDATE storage.buckets SET public = false WHERE id = 'training-media-public';

-- 2. Tighten operator-profiles public read: only files under {user_id}/... readable publicly
DROP POLICY IF EXISTS op_files_public_read ON storage.objects;

CREATE POLICY op_files_public_read_user_scoped
ON storage.objects FOR SELECT
USING (
  bucket_id = 'operator-profiles'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND length((storage.foldername(name))[1]) = 36  -- uuid shape
);

-- 3. Harden part-images: require uuid-shaped org folder (fail-closed on malformed paths)
DROP POLICY IF EXISTS part_images_select_org_member ON storage.objects;
CREATE POLICY part_images_select_org_member
ON storage.objects FOR SELECT
USING (
  bucket_id = 'part-images'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND length((storage.foldername(name))[1]) = 36
  AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- 4. Harden handoff-attachments SELECT with same uuid-shape guard
DROP POLICY IF EXISTS handoff_attachments_select_org_member ON storage.objects;
CREATE POLICY handoff_attachments_select_org_member
ON storage.objects FOR SELECT
USING (
  bucket_id = 'handoff-attachments'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND length((storage.foldername(name))[1]) = 36
  AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- 5. Harden ncr-attachments SELECT
DROP POLICY IF EXISTS ncr_attachments_select_org_member ON storage.objects;
CREATE POLICY ncr_attachments_select_org_member
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ncr-attachments'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND length((storage.foldername(name))[1]) = 36
  AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- 6. Harden setup-sheets SELECT
DROP POLICY IF EXISTS setup_sheets_select_org_member ON storage.objects;
CREATE POLICY setup_sheets_select_org_member
ON storage.objects FOR SELECT
USING (
  bucket_id = 'setup-sheets'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND length((storage.foldername(name))[1]) = 36
  AND is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);
