DROP POLICY IF EXISTS "handbook_references read all" ON public.handbook_references;
CREATE POLICY "handbook_references read"
  ON public.handbook_references FOR SELECT
  USING (
    is_canonical = true
    OR (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id))
  );

DROP POLICY IF EXISTS "handbook_categories read all" ON public.handbook_categories;
CREATE POLICY "handbook_categories read"
  ON public.handbook_categories FOR SELECT
  USING (
    is_canonical = true
    OR (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id))
  );