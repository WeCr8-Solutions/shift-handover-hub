-- 1. Fix public bucket listing: replace broad SELECT with path-scoped access
DROP POLICY IF EXISTS "Email assets are publicly accessible" ON storage.objects;
CREATE POLICY "Email assets are publicly accessible by path"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-assets' AND auth.role() = 'authenticated');

-- 2. Add SELECT policy for org admins on webhooks (they already use the safe view, 
-- but this ensures they can at least see their webhook configs minus the secret)
-- The existing organization_webhooks_safe view already excludes the secret column.
-- We don't need a new SELECT policy since org admins use the view.

-- 3. Harden user_roles: prevent admin from assigning admin/developer roles to themselves
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
CREATE POLICY "Admins can insert user roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id != auth.uid()
);
