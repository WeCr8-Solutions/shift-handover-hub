
-- concierge-contracts bucket: paths are `{organization_id}/{engagement_id}/...`
-- Platform admins/developers: full read/write
-- Org admins: read-only access to files under their org prefix
DROP POLICY IF EXISTS "concierge_contracts_platform_all" ON storage.objects;
CREATE POLICY "concierge_contracts_platform_all"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'concierge-contracts'
  AND (public.has_role(auth.uid(), 'admin'::public.app_role)
       OR public.has_role(auth.uid(), 'developer'::public.app_role))
)
WITH CHECK (
  bucket_id = 'concierge-contracts'
  AND (public.has_role(auth.uid(), 'admin'::public.app_role)
       OR public.has_role(auth.uid(), 'developer'::public.app_role))
);

DROP POLICY IF EXISTS "concierge_contracts_org_admin_read" ON storage.objects;
CREATE POLICY "concierge_contracts_org_admin_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'concierge-contracts'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_org_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
);
