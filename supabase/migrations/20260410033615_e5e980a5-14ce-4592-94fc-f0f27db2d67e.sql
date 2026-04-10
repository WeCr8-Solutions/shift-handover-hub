
-- 1. Harden storage UPDATE policies to include org membership check

-- ncr-attachments
DROP POLICY IF EXISTS "ncr_attachments_update_own_files" ON storage.objects;
CREATE POLICY "ncr_attachments_update_own_files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'ncr-attachments'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- handoff-attachments
DROP POLICY IF EXISTS "handoff_attachments_update_own_files" ON storage.objects;
CREATE POLICY "handoff_attachments_update_own_files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'handoff-attachments'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- part-images
DROP POLICY IF EXISTS "part_images_update_own_files" ON storage.objects;
CREATE POLICY "part_images_update_own_files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'part-images'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- setup-sheets
DROP POLICY IF EXISTS "setup_sheets_update_own_files" ON storage.objects;
CREATE POLICY "setup_sheets_update_own_files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'setup-sheets'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- Similarly harden DELETE policies to also require org membership

-- ncr-attachments
DROP POLICY IF EXISTS "ncr_attachments_delete_own_files" ON storage.objects;
CREATE POLICY "ncr_attachments_delete_own_files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'ncr-attachments'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- handoff-attachments
DROP POLICY IF EXISTS "handoff_attachments_delete_own_files" ON storage.objects;
CREATE POLICY "handoff_attachments_delete_own_files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'handoff-attachments'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- part-images
DROP POLICY IF EXISTS "part_images_delete_own_files" ON storage.objects;
CREATE POLICY "part_images_delete_own_files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'part-images'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- setup-sheets
DROP POLICY IF EXISTS "setup_sheets_delete_own_files" ON storage.objects;
CREATE POLICY "setup_sheets_delete_own_files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'setup-sheets'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- 2. Fix organization_members owner race condition
-- Tighten: only the org creator can self-insert as owner, AND no members exist yet (atomic check)
DROP POLICY IF EXISTS "Users can join as member or admins can add members" ON public.organization_members;
CREATE POLICY "Users can join as member or admins can add members"
ON public.organization_members FOR INSERT TO authenticated
WITH CHECK (
  -- Self-join as member (any org member can join themselves as member)
  (auth.uid() = user_id AND role = 'member')
  -- Creator self-inserts as owner: must be org creator AND no members exist yet
  OR (
    auth.uid() = user_id
    AND role = 'owner'
    AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND o.created_by = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
    )
  )
  -- Org admins can add admin or member roles
  OR (
    public.is_org_admin(auth.uid(), organization_id)
    AND role IN ('admin', 'member')
  )
  -- Platform admins can add anyone
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);
