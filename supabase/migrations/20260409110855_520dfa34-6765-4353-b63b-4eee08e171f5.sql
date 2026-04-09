
-- Fix 1: Remove the SELECT policy on organization_webhooks that exposes the secret column.
-- Only the organization_webhooks_safe view (which excludes the secret) should be used for reads.
DROP POLICY IF EXISTS "Org admins can read own webhooks" ON public.organization_webhooks;

-- Ensure only service_role can SELECT from the raw table (for edge functions that need the secret)
-- Keep existing service-role policy if present, otherwise create one
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organization_webhooks' 
    AND policyname = 'Service role can read webhooks'
  ) THEN
    EXECUTE 'CREATE POLICY "Service role can read webhooks" ON public.organization_webhooks FOR SELECT TO service_role USING (true)';
  END IF;
END $$;

-- Fix 2: Remove the overly broad storage SELECT policy on performance-updates bucket
DROP POLICY IF EXISTS "Anyone can view performance update images" ON storage.objects;
