
-- 1. Make the "public" training bucket non-public so the linter rule no longer applies.
UPDATE storage.buckets SET public = false WHERE id = 'training-media-public';

-- 2. Replace SELECT policy with a stricter, scoped one (canonical = any authed user; org content = org members).
DROP POLICY IF EXISTS "Authed users read public training media" ON storage.objects;

CREATE POLICY "Read training media public bucket scoped"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'training-media-public'
    AND (
      -- canonical Jobline assets stored under the canonical/ prefix
      (storage.foldername(name))[1] = 'canonical'
      -- OR an org member reading their own org's assets (folder = org_id)
      OR (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM public.organization_members
        WHERE user_id = auth.uid()
      )
      -- OR platform admin
      OR public.has_role(auth.uid(), 'admin')
    )
  );
