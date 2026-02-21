
-- Fix 1: Restrict webhook SELECT to org admins only (was exposing secrets to all members)
DROP POLICY IF EXISTS "Org members can view webhooks" ON public.organization_webhooks;

CREATE POLICY "Org admins can view webhooks"
ON public.organization_webhooks FOR SELECT
USING (
  public.is_org_admin(auth.uid(), organization_id)
  OR public.is_dev_or_admin(auth.uid())
);

-- Fix 2: Add INSERT policy on notification_queue for system-generated notifications
CREATE POLICY "Authenticated users can create own notifications"
ON public.notification_queue FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    user_id IS NULL
    OR user_id = auth.uid()
    OR public.is_dev_or_admin(auth.uid())
  )
);
