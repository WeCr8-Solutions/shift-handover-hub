-- 1. Restrict sensitive billing columns on organizations from non-service-role readers.
-- RLS row policies remain unchanged; this is column-level GRANT hardening so even
-- members who can SELECT the row cannot read these two columns.
REVOKE SELECT (stripe_customer_id, billing_email) ON public.organizations FROM PUBLIC;
REVOKE SELECT (stripe_customer_id, billing_email) ON public.organizations FROM anon;
REVOKE SELECT (stripe_customer_id, billing_email) ON public.organizations FROM authenticated;
GRANT  SELECT (stripe_customer_id, billing_email) ON public.organizations TO service_role;

-- 2. Drop the two leaky storage policies on operator-profiles bucket.
-- (op_files_public_profile_read remains and correctly gates anon reads on
--  profile_visibility='public' AND public_published_at IS NOT NULL.)
DROP POLICY IF EXISTS operator_profiles_path_scoped_read ON storage.objects;
DROP POLICY IF EXISTS op_files_public_read_user_scoped   ON storage.objects;
