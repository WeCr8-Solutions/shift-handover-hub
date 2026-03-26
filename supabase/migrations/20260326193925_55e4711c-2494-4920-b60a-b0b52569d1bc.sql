
-- Drop the permissive SELECT policy that exposes the secret column
DROP POLICY IF EXISTS "Org admins can view webhooks" ON public.organization_webhooks;

-- Drop the ALL policy (which includes SELECT) and recreate as INSERT/UPDATE/DELETE only
DROP POLICY IF EXISTS "Org admins can manage webhooks" ON public.organization_webhooks;

-- Recreate management policy for INSERT only
CREATE POLICY "Org admins can insert webhooks"
ON public.organization_webhooks
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_org_admin(auth.uid(), organization_id)
);

-- Recreate management policy for UPDATE only
CREATE POLICY "Org admins can update webhooks"
ON public.organization_webhooks
FOR UPDATE
TO authenticated
USING (
  public.is_org_admin(auth.uid(), organization_id)
)
WITH CHECK (
  public.is_org_admin(auth.uid(), organization_id)
);

-- Recreate management policy for DELETE only
CREATE POLICY "Org admins can delete webhooks"
ON public.organization_webhooks
FOR DELETE
TO authenticated
USING (
  public.is_org_admin(auth.uid(), organization_id)
);

-- Allow SELECT only for service_role (edge functions, server-side)
CREATE POLICY "Service role can read webhooks"
ON public.organization_webhooks
FOR SELECT
TO service_role
USING (true);
