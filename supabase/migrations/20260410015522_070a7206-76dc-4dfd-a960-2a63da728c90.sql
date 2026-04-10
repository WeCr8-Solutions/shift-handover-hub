
-- Remove overly broad INSERT policy (no org check)
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;

-- Remove overly broad DELETE policy (no org check)
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

-- Harden UPDATE policy: require org membership + ownership
DROP POLICY IF EXISTS "perf_updates_update_own_org_scoped" ON storage.objects;
CREATE POLICY "perf_updates_update_own_org_scoped"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'performance-updates'
  AND public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
  AND (auth.uid())::text = (storage.foldername(name))[2]
);
