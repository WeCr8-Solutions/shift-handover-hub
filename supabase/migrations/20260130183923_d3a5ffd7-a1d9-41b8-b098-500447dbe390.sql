
-- Fix teams RLS: All org members should see teams ONLY within their organization
-- Drop existing fragmented SELECT policies and create clear org-scoped ones

-- First, drop the problematic/redundant policies
DROP POLICY IF EXISTS "Creators can view own teams in their org" ON public.teams;
DROP POLICY IF EXISTS "Team members within org can view teams" ON public.teams;

-- Create a clear, simple policy: Org members can view all teams in their org
CREATE POLICY "Org members can view their org teams"
ON public.teams
FOR SELECT
USING (
  (organization_id IS NOT NULL AND is_org_member(auth.uid(), organization_id))
  OR has_role(auth.uid(), 'admin')
);

-- Also ensure the INSERT policy for creators allows them to see their team immediately after creation
-- (This is already covered by the org member policy above since creators must be org members)
