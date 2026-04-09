-- 1. Fix performance-updates storage SELECT policies
DROP POLICY IF EXISTS "Team members can view team performance update images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view performance update images" ON storage.objects;

-- Replace with org-scoped policy: the folder structure is {org_id}/{user_id}/{filename}
-- Org members can view any performance-updates image within their org folder
CREATE POLICY "Org members can view performance update images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'performance-updates'
  AND is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- 2. Fix notification_queue INSERT policy - restrict to admins only
DROP POLICY IF EXISTS "Authenticated users can create own notifications" ON public.notification_queue;

CREATE POLICY "Only admins can queue notifications"
ON public.notification_queue FOR INSERT
TO authenticated
WITH CHECK (is_dev_or_admin(auth.uid()));

-- 3. Add SELECT policy for org admins on organization_webhooks
-- They already have INSERT/UPDATE/DELETE but need to read their webhooks back
CREATE POLICY "Org admins can read own webhooks"
ON public.organization_webhooks FOR SELECT
TO authenticated
USING (is_org_admin(auth.uid(), organization_id));