
-- Fix: Restrict organization_api_keys SELECT to admins only
-- Regular members should not see key_hash values

-- Drop the overly permissive member SELECT policy
DROP POLICY IF EXISTS "Org members can view API key metadata" ON public.organization_api_keys;

-- Create admin-only SELECT policy for full table access
CREATE POLICY "Org admins can view API keys"
ON public.organization_api_keys FOR SELECT
USING (public.is_org_admin(auth.uid(), organization_id) OR public.has_role(auth.uid(), 'admin'::public.app_role));
