-- Fix: Platform admins need to see ALL organizations and org members
-- Currently missing, causing incomplete data in admin dashboard

-- Allow platform admins to view all organizations
CREATE POLICY "Admins can view all organizations"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow platform admins to view all organization members
CREATE POLICY "Admins can view all org members"
  ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow platform admins to update organizations (for granting complimentary access)
CREATE POLICY "Admins can update all organizations"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));