
-- Drop existing policies that may conflict
DROP POLICY IF EXISTS "perf_updates_insert_org_scoped" ON storage.objects;
DROP POLICY IF EXISTS "perf_updates_delete_own_org_scoped" ON storage.objects;
DROP POLICY IF EXISTS "setup_sheets_select_org_member" ON storage.objects;
DROP POLICY IF EXISTS "setup_sheets_insert_org_member" ON storage.objects;
DROP POLICY IF EXISTS "setup_sheets_update_own_files" ON storage.objects;
DROP POLICY IF EXISTS "setup_sheets_delete_own_files" ON storage.objects;

-- Also drop the remaining legacy policies we missed
DROP POLICY IF EXISTS "Users can upload performance update images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own performance update images" ON storage.objects;

-- ============================================================
-- PERFORMANCE-UPDATES: Properly scoped policies
-- ============================================================

-- SELECT: Org members can view (keep existing "Org members can view performance update images")
-- It already uses is_org_member check — no change needed

-- INSERT: Org members upload to own folder within org
CREATE POLICY "perf_updates_insert_org_scoped"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'performance-updates'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- UPDATE: Users can update own files (org-scoped path)
CREATE POLICY "perf_updates_update_own_org_scoped"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'performance-updates'
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- DELETE: Users can delete own files (handles both legacy and org-scoped paths)
CREATE POLICY "perf_updates_delete_own_org_scoped"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'performance-updates'
  AND (
    ((storage.foldername(name))[2] IS NOT NULL AND (auth.uid())::text = (storage.foldername(name))[2])
    OR ((storage.foldername(name))[2] IS NULL AND (auth.uid())::text = (storage.foldername(name))[1])
  )
);

-- ============================================================
-- SETUP-SHEETS: Full policy set
-- ============================================================

CREATE POLICY "setup_sheets_select_org_member"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'setup-sheets'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "setup_sheets_insert_org_member"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'setup-sheets'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

CREATE POLICY "setup_sheets_update_own_files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'setup-sheets'
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

CREATE POLICY "setup_sheets_delete_own_files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'setup-sheets'
  AND (auth.uid())::text = (storage.foldername(name))[2]
);
