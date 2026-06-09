
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
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid token');
  END IF;
  _hash := encode(extensions.digest(p_token, 'sha256'), 'hex');

  SELECT * INTO _row FROM public.account_activation_tokens WHERE token_hash = _hash;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Activation link not found');
  END IF;
  IF _row.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This activation link has already been used');
  END IF;
  IF _row.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This activation link has expired. Request a new one.');
  END IF;
  IF p_expected_email IS NOT NULL
     AND lower(trim(p_expected_email)) <> lower(_row.email) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Email does not match concierge record for this link');
  END IF;

  IF p_dry_run THEN
    RETURN jsonb_build_object(
      'ok', true, 'dry_run', true,
      'email', _row.email,
      'organization_id', _row.organization_id,
      'invite_id', _row.invite_id,
      'expires_at', _row.expires_at
    );
  END IF;

  UPDATE public.account_activation_tokens
  SET used_at = now(), used_by = auth.uid()
  WHERE id = _row.id;

  RETURN jsonb_build_object(
    'ok', true,
    'email', _row.email,
    'organization_id', _row.organization_id,
    'invite_id', _row.invite_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_activation_token(text, boolean, text) TO anon, authenticated;
