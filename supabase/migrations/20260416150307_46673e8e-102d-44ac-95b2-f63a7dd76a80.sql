-- 1. Fix flyer_zone_assignments invite_token exposure
CREATE OR REPLACE VIEW public.flyer_zone_assignments_safe
WITH (security_invoker = on) AS
SELECT 
  id, campaign_id, assignee_name, assignee_email, zone_numbers,
  assigned_by, assigned_to_user_id, is_active, created_at, updated_at
FROM public.flyer_zone_assignments;

-- Drop the overly permissive flyer worker SELECT policy on base table
DROP POLICY IF EXISTS "Flyer workers can view their assignments" ON public.flyer_zone_assignments;

-- Re-create a restrictive SELECT policy: flyer workers can only see their OWN assignments
CREATE POLICY "Flyer workers can view own assignments"
ON public.flyer_zone_assignments
FOR SELECT
USING (
  is_dev_or_admin(auth.uid())
  OR assigned_to_user_id = auth.uid()
);

-- 2. Fix public bucket listing
DROP POLICY IF EXISTS "Email assets are publicly accessible by path" ON storage.objects;

CREATE POLICY "Email assets accessible by authenticated path"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'email-assets'
  AND auth.role() = 'authenticated'
  AND name IS NOT NULL
  AND length(name) > 0
);