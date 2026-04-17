-- ============================================================
-- HARDEN job_performance_updates — close cross-org leakage paths
-- ============================================================

-- Drop all existing policies to rebuild cleanly
DROP POLICY IF EXISTS "Admins can update any updates" ON public.job_performance_updates;
DROP POLICY IF EXISTS "Admins can view all updates" ON public.job_performance_updates;
DROP POLICY IF EXISTS "Org admins can update org performance updates" ON public.job_performance_updates;
DROP POLICY IF EXISTS "Org admins can view org performance updates" ON public.job_performance_updates;
DROP POLICY IF EXISTS "Org members can view updates in their org" ON public.job_performance_updates;
DROP POLICY IF EXISTS "Supervisors can update org updates" ON public.job_performance_updates;
DROP POLICY IF EXISTS "Supervisors can view org updates" ON public.job_performance_updates;
DROP POLICY IF EXISTS "Users can create their own updates" ON public.job_performance_updates;
DROP POLICY IF EXISTS "Users can update their own pending updates" ON public.job_performance_updates;

-- Make organization_id required (already NOT NULL per schema, but enforce explicitly)
ALTER TABLE public.job_performance_updates
  ALTER COLUMN organization_id SET NOT NULL;

-- ---------- SELECT ----------
-- Author can always see their own row, BUT only if they still belong to that org
CREATE POLICY "perf_updates_select_author_in_org"
ON public.job_performance_updates
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  AND public.is_org_member(auth.uid(), organization_id)
);

-- Any org member can see updates in their org (uses row's own organization_id — not team's)
CREATE POLICY "perf_updates_select_org_member"
ON public.job_performance_updates
FOR SELECT
TO authenticated
USING (
  public.is_org_member(auth.uid(), organization_id)
);

-- Platform admins (super-admins) — keep visibility for support
CREATE POLICY "perf_updates_select_platform_admin"
ON public.job_performance_updates
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ---------- INSERT ----------
-- Must be the author AND must be a member of the organization the row claims
CREATE POLICY "perf_updates_insert_author_in_org"
ON public.job_performance_updates
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_org_member(auth.uid(), organization_id)
);

-- ---------- UPDATE ----------
-- Author can edit their own pending row only while still in the org
CREATE POLICY "perf_updates_update_author_pending"
ON public.job_performance_updates
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status = 'pending'
  AND public.is_org_member(auth.uid(), organization_id)
)
WITH CHECK (
  auth.uid() = user_id
  AND public.is_org_member(auth.uid(), organization_id)
);

-- Org admins / supervisors can review/update updates in their org
CREATE POLICY "perf_updates_update_org_leader"
ON public.job_performance_updates
FOR UPDATE
TO authenticated
USING (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.is_supervisor_in_org(auth.uid(), organization_id)
)
WITH CHECK (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.is_supervisor_in_org(auth.uid(), organization_id)
);

-- Platform admin
CREATE POLICY "perf_updates_update_platform_admin"
ON public.job_performance_updates
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ---------- DELETE ----------
-- Only org admins (within the row's org) or platform admins can delete
CREATE POLICY "perf_updates_delete_org_admin"
ON public.job_performance_updates
FOR DELETE
TO authenticated
USING (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- ============================================================
-- HARDEN storage.objects for performance-updates bucket
-- ============================================================
-- Path layout enforced in code: {org_id}/{user_id}/{file}
-- Folder[1] = org_id (must match a member org), Folder[2] = user_id (uploader)

DROP POLICY IF EXISTS "Org members can view performance update images" ON storage.objects;
DROP POLICY IF EXISTS "perf_updates_insert_org_scoped" ON storage.objects;
DROP POLICY IF EXISTS "perf_updates_update_own_org_scoped" ON storage.objects;
DROP POLICY IF EXISTS "perf_updates_delete_own_org_scoped" ON storage.objects;

-- SELECT: any member of the org owning folder[1]
CREATE POLICY "perf_updates_select_org_member"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'performance-updates'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[2] IS NOT NULL
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- INSERT: must be member of folder[1] org AND folder[2] = own user id
CREATE POLICY "perf_updates_insert_org_scoped"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'performance-updates'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[2] IS NOT NULL
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- UPDATE: only original uploader, still in org
CREATE POLICY "perf_updates_update_own_org_scoped"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'performance-updates'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[2] IS NOT NULL
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'performance-updates'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (storage.foldername(name))[2] IS NOT NULL
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- DELETE: original uploader OR org admin of the folder's org
CREATE POLICY "perf_updates_delete_org_scoped"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'performance-updates'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND (
    public.is_org_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (
      (storage.foldername(name))[2] IS NOT NULL
      AND (auth.uid())::text = (storage.foldername(name))[2]
      AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
    )
  )
);