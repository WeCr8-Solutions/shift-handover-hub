
-- ============================================================
-- Step 1: Create two new storage buckets
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
  ('ncr-attachments', 'ncr-attachments', false, 10485760),
  ('handoff-attachments', 'handoff-attachments', false, 10485760);

-- ============================================================
-- Step 2: Add image_urls columns to ncr_reports and handoff_records
-- ============================================================
ALTER TABLE public.ncr_reports
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

ALTER TABLE public.handoff_records
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- ============================================================
-- Step 3: RLS policies for ncr-attachments bucket
-- ============================================================
CREATE POLICY "ncr_attachments_insert_org_member"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ncr-attachments'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "ncr_attachments_select_org_member"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ncr-attachments'
  AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "ncr_attachments_delete_own_files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ncr-attachments'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- ============================================================
-- Step 3b: RLS policies for handoff-attachments bucket
-- ============================================================
CREATE POLICY "handoff_attachments_insert_org_member"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'handoff-attachments'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "handoff_attachments_select_org_member"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'handoff-attachments'
  AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "handoff_attachments_delete_own_files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'handoff-attachments'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- ============================================================
-- Step 4: Harden performance-updates bucket RLS
-- Add org-scoped policies for new {org_id}/{user_id}/file uploads
-- Keep backward compat for old {user_id}/file paths
-- ============================================================

-- New org-scoped INSERT policy for performance-updates
CREATE POLICY "perf_updates_insert_org_scoped"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'performance-updates'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (
    -- New org-scoped path: {org_id}/{user_id}/file
    (
      (storage.foldername(name))[2] IS NOT NULL
      AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
      AND auth.uid()::text = (storage.foldername(name))[2]
    )
    -- Legacy path: {user_id}/file (backward compat)
    OR (
      (storage.foldername(name))[2] IS NULL
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
  )
);

-- New org-scoped SELECT policy for performance-updates
CREATE POLICY "perf_updates_select_org_scoped"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'performance-updates'
  AND (
    -- New org-scoped path: {org_id}/{user_id}/file
    (
      (storage.foldername(name))[2] IS NOT NULL
      AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
    )
    -- Legacy path: {user_id}/file — allow if same org via organization_members
    OR (
      (storage.foldername(name))[2] IS NULL
      AND EXISTS (
        SELECT 1 FROM public.organization_members om1
        JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
        WHERE om1.user_id = auth.uid()
          AND om2.user_id = (storage.foldername(name))[1]::uuid
      )
    )
  )
);

-- New org-scoped DELETE policy for performance-updates
CREATE POLICY "perf_updates_delete_own_files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'performance-updates'
  AND (
    -- New path: own files in {org_id}/{user_id}/
    (
      (storage.foldername(name))[2] IS NOT NULL
      AND auth.uid()::text = (storage.foldername(name))[2]
    )
    -- Legacy path: own files in {user_id}/
    OR (
      (storage.foldername(name))[2] IS NULL
      AND auth.uid()::text = (storage.foldername(name))[1]
    )
  )
);
