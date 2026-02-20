
-- Create a trigger function to protect billing fields from non-platform-admin/non-service-role updates
CREATE OR REPLACE FUNCTION public.protect_org_billing_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow service_role (used by Stripe webhooks) and platform admins to update anything
  -- current_setting('role') = 'service_role' when using service role key
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Allow platform admins to update billing fields
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  -- For everyone else, prevent changes to billing/subscription fields
  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier THEN
    RAISE EXCEPTION 'Only platform admins or system processes can modify subscription_tier';
  END IF;

  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    RAISE EXCEPTION 'Only platform admins or system processes can modify subscription_status';
  END IF;

  IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
    RAISE EXCEPTION 'Only platform admins or system processes can modify stripe_customer_id';
  END IF;

  -- Also protect system fields
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Cannot modify organization id';
  END IF;

  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'Cannot modify organization creator';
  END IF;

  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify organization creation timestamp';
  END IF;

  RETURN NEW;
END;
$$;

-- Attach the trigger to the organizations table
CREATE TRIGGER protect_org_billing_fields_trigger
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_org_billing_fields();
