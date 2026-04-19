-- 1) Operator references: remove direct employer SELECT, expose safe view without contact info
DROP POLICY IF EXISTS "op_ref_employer_select" ON public.operator_references;

CREATE OR REPLACE VIEW public.operator_references_safe
WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  reference_name,
  relationship,
  company,
  notes,
  created_at
FROM public.operator_references
WHERE
  -- Owner can see their own
  auth.uid() = user_id
  OR (
    -- Verified employers can see references for discoverable operators
    public.is_verified_employer(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.operator_profiles op
      WHERE op.user_id = operator_references.user_id
        AND op.is_discoverable = true
    )
  );

GRANT SELECT ON public.operator_references_safe TO authenticated;

-- 2) Prevent org admins from self-assigning roles
DROP POLICY IF EXISTS "Org admins can assign org-scoped roles" ON public.user_roles;

CREATE POLICY "Org admins can assign org-scoped roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id <> auth.uid()
  AND role = ANY (ARRAY['operator'::app_role, 'viewer'::app_role])
  AND EXISTS (
    SELECT 1
    FROM organization_members om1
    JOIN organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
      AND om1.role = ANY (ARRAY['owner'::text, 'admin'::text])
      AND om2.user_id = user_roles.user_id
  )
);