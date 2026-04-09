-- Fix: Recreate view without security_barrier (which causes SECURITY DEFINER)
DROP VIEW IF EXISTS public.organizations_member_view;

CREATE VIEW public.organizations_member_view AS
SELECT
  id, name, slug, description, logo_url,
  subscription_status, subscription_tier,
  created_by, created_at, updated_at,
  trial_ends_at, mfa_required, requires_us_person_declaration
FROM public.organizations;

-- Set as SECURITY INVOKER explicitly
ALTER VIEW public.organizations_member_view SET (security_invoker = true);

GRANT SELECT ON public.organizations_member_view TO authenticated;

-- Create separate billing table with admin-only access
CREATE TABLE IF NOT EXISTS public.organization_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  billing_email text,
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_billing ENABLE ROW LEVEL SECURITY;

-- Only org owners/admins and platform admins can view billing
CREATE POLICY "Org admins can view billing"
ON public.organization_billing FOR SELECT TO authenticated
USING (
  is_org_admin(auth.uid(), organization_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Only org owners/admins and platform admins can update billing
CREATE POLICY "Org admins can update billing"
ON public.organization_billing FOR UPDATE TO authenticated
USING (
  is_org_admin(auth.uid(), organization_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Only org admins can insert billing
CREATE POLICY "Org admins can insert billing"
ON public.organization_billing FOR INSERT TO authenticated
WITH CHECK (
  is_org_admin(auth.uid(), organization_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Migrate existing data
INSERT INTO public.organization_billing (organization_id, billing_email, stripe_customer_id)
SELECT id, billing_email, stripe_customer_id
FROM public.organizations
WHERE billing_email IS NOT NULL OR stripe_customer_id IS NOT NULL
ON CONFLICT (organization_id) DO NOTHING;

-- Auto-update timestamps
CREATE TRIGGER update_organization_billing_updated_at
BEFORE UPDATE ON public.organization_billing
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();