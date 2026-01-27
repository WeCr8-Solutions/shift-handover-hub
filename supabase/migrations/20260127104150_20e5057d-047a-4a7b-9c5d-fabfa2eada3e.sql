-- Harden org/team creation against RLS failures during onboarding

-- 1) Ensure created_by is always present (prevents auth.uid() = created_by from evaluating to null)
ALTER TABLE public.organizations
  ALTER COLUMN created_by SET NOT NULL;

ALTER TABLE public.teams
  ALTER COLUMN created_by SET NOT NULL;

-- 2) Make sure org policies apply to authenticated users (not anon/public)
ALTER POLICY "Authenticated users can create organizations"
  ON public.organizations
  TO authenticated;

ALTER POLICY "Org admins can update organization"
  ON public.organizations
  TO authenticated;

ALTER POLICY "Org members can view their organization"
  ON public.organizations
  TO authenticated;

ALTER POLICY "Users can view organizations they created"
  ON public.organizations
  TO authenticated;

-- 3) Also scope org membership policies to authenticated
ALTER POLICY "Org admins can add members"
  ON public.organization_members
  TO authenticated;

ALTER POLICY "Org admins can remove members"
  ON public.organization_members
  TO authenticated;

ALTER POLICY "Org admins can update member roles"
  ON public.organization_members
  TO authenticated;

ALTER POLICY "Org members can view membership"
  ON public.organization_members
  TO authenticated;
