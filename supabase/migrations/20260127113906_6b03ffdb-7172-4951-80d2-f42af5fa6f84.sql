-- Create organization_invites table for invite codes
CREATE TABLE public.organization_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  org_role TEXT NOT NULL DEFAULT 'member',
  app_role TEXT, -- Optional: supervisor, operator
  expires_at TIMESTAMPTZ,
  max_uses INTEGER, -- NULL = unlimited
  uses_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for fast code lookups
CREATE INDEX idx_organization_invites_code ON public.organization_invites(invite_code);
CREATE INDEX idx_organization_invites_org ON public.organization_invites(organization_id);

-- Enable RLS
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- Org admins can manage invites
CREATE POLICY "Org admins can manage invites"
ON public.organization_invites FOR ALL
USING (is_org_admin(auth.uid(), organization_id));

-- Supervisors can create and view invites
CREATE POLICY "Supervisors can create invites"
ON public.organization_invites FOR INSERT
WITH CHECK (
  is_supervisor_in_org(auth.uid(), organization_id)
);

CREATE POLICY "Supervisors can view org invites"
ON public.organization_invites FOR SELECT
USING (is_supervisor_in_org(auth.uid(), organization_id));

-- Public can validate invite codes (for redemption during signup)
CREATE POLICY "Anyone can validate invite codes"
ON public.organization_invites FOR SELECT
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
  AND (max_uses IS NULL OR uses_count < max_uses)
);

-- Trigger for updated_at
CREATE TRIGGER update_organization_invites_updated_at
BEFORE UPDATE ON public.organization_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create invite_redemptions table to track who used which code
CREATE TABLE public.invite_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id UUID NOT NULL REFERENCES public.organization_invites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invite_redemptions ENABLE ROW LEVEL SECURITY;

-- Org admins can view redemptions
CREATE POLICY "Org admins can view redemptions"
ON public.invite_redemptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_invites oi
    WHERE oi.id = invite_redemptions.invite_id
    AND is_org_admin(auth.uid(), oi.organization_id)
  )
);

-- Users can insert their own redemption
CREATE POLICY "Users can redeem invites"
ON public.invite_redemptions FOR INSERT
WITH CHECK (auth.uid() = user_id);