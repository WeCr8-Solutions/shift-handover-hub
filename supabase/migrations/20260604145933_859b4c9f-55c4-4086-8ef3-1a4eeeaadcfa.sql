
CREATE POLICY "onboarding_docs_admin_all"
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'onboarding-documents'
    AND (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'developer'::public.app_role))
  )
  WITH CHECK (
    bucket_id = 'onboarding-documents'
    AND (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'developer'::public.app_role))
  );

CREATE POLICY "onboarding_docs_org_admin_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'onboarding-documents'
    AND public.is_org_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
