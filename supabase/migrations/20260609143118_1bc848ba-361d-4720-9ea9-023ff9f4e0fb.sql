
-- Audit table for every activation attempt (success or failure)
CREATE TABLE IF NOT EXISTS public.activation_token_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text,
  attempted_email text,
  outcome text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.activation_token_audit TO authenticated;
GRANT ALL ON public.activation_token_audit TO service_role;
ALTER TABLE public.activation_token_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ata_admin_select" ON public.activation_token_audit;
CREATE POLICY "ata_admin_select" ON public.activation_token_audit
FOR SELECT TO authenticated
USING (public.is_platform_admin_or_dev(auth.uid()));

-- Replace BOTH overloads with hardened versions sharing the same logic.
DROP FUNCTION IF EXISTS public.consume_activation_token(text);
DROP FUNCTION IF EXISTS public.consume_activation_token(text, boolean, text);

CREATE OR REPLACE FUNCTION public.consume_activation_token(
  p_token text,
  p_dry_run boolean DEFAULT false,
  p_expected_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _hash text;
  _row RECORD;
  _generic_err jsonb := jsonb_build_object('ok', false, 'error', 'This activation link is invalid, expired, or already used. Contact your concierge for a fresh link.');
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    INSERT INTO public.activation_token_audit(token_hash, attempted_email, outcome, user_id)
    VALUES (NULL, lower(p_expected_email), 'malformed', auth.uid());
    RETURN _generic_err;
  END IF;
  _hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

  SELECT * INTO _row FROM public.account_activation_tokens WHERE token_hash = _hash;

  -- Single generic error for not-found / used / expired / email-mismatch
  -- prevents email enumeration via differentiated responses.
  IF NOT FOUND
     OR _row.used_at IS NOT NULL
     OR _row.expires_at < now()
     OR (p_expected_email IS NOT NULL
         AND lower(trim(p_expected_email)) <> lower(_row.email)) THEN
    INSERT INTO public.activation_token_audit(token_hash, attempted_email, outcome, user_id)
    VALUES (_hash, lower(p_expected_email), 'rejected', auth.uid());
    RETURN _generic_err;
  END IF;

  IF p_dry_run THEN
    INSERT INTO public.activation_token_audit(token_hash, attempted_email, outcome, user_id)
    VALUES (_hash, lower(p_expected_email), 'dry_run_ok', auth.uid());
    -- Only echo email back when caller already proved knowledge of it.
    RETURN jsonb_build_object(
      'ok', true,
      'dry_run', true,
      'email', CASE WHEN p_expected_email IS NOT NULL THEN _row.email ELSE NULL END,
      'organization_id', _row.organization_id,
      'expires_at', _row.expires_at
    );
  END IF;

  UPDATE public.account_activation_tokens
  SET used_at = now(), used_by = auth.uid()
  WHERE id = _row.id;

  INSERT INTO public.activation_token_audit(token_hash, attempted_email, outcome, user_id)
  VALUES (_hash, lower(_row.email), 'consumed', auth.uid());

  RETURN jsonb_build_object(
    'ok', true,
    'email', _row.email,
    'organization_id', _row.organization_id,
    'invite_id', _row.invite_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_activation_token(text, boolean, text) TO anon, authenticated;

-- Prevent the final owner from leaving their own org (orphans the tenant)
CREATE OR REPLACE FUNCTION public.leave_organization(_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _my_role text;
  _owner_count int;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT role INTO _my_role
  FROM public.organization_members
  WHERE organization_id = _organization_id AND user_id = _uid;

  IF _my_role IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not a member of this organization');
  END IF;

  IF _my_role = 'owner' THEN
    SELECT count(*) INTO _owner_count
    FROM public.organization_members
    WHERE organization_id = _organization_id AND role = 'owner';
    IF _owner_count <= 1 THEN
      RETURN jsonb_build_object('ok', false, 'error',
        'You are the only owner. Transfer ownership to another admin before leaving.');
    END IF;
  END IF;

  DELETE FROM public.organization_members
  WHERE organization_id = _organization_id AND user_id = _uid;

  UPDATE public.user_org_preferences
  SET active_org_id = NULL
  WHERE user_id = _uid AND active_org_id = _organization_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_organization(uuid) TO authenticated;
