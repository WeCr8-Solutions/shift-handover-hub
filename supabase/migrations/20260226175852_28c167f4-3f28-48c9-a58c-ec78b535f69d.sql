
-- Step 1: Add trial_ends_at column (nullable first for safe migration)
ALTER TABLE public.organizations
ADD COLUMN trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Backfill existing orgs with 14-day trial from creation date
UPDATE public.organizations
SET trial_ends_at = created_at + interval '14 days'
WHERE trial_ends_at IS NULL;

-- Step 3: Set NOT NULL with default for new orgs
ALTER TABLE public.organizations
ALTER COLUMN trial_ends_at SET DEFAULT now() + interval '14 days',
ALTER COLUMN trial_ends_at SET NOT NULL;

-- Step 4: Create can_manage_billing function
CREATE OR REPLACE FUNCTION public.can_manage_billing(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Platform admins
    public.has_role(_user_id, 'admin'::public.app_role)
    -- Platform developers
    OR public.has_role(_user_id, 'developer'::public.app_role)
    -- Org owners
    OR EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = _user_id
        AND organization_id = _org_id
        AND role = 'owner'
    )
  )
$$;
