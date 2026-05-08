
-- 1) Verified-employer SELECT on operator_profiles base table (discoverable only)
DROP POLICY IF EXISTS op_profile_employer_select ON public.operator_profiles;
CREATE POLICY op_profile_employer_select ON public.operator_profiles
FOR SELECT TO authenticated
USING (
  public.is_verified_employer(auth.uid())
  AND is_discoverable = true
);

-- 2) Username availability RPC (does NOT expose any other field)
CREATE OR REPLACE FUNCTION public.check_operator_username_available(_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.operator_profiles
    WHERE lower(public_username) = lower(_username)
      AND (auth.uid() IS NULL OR user_id <> auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.check_operator_username_available(text) FROM public;
GRANT EXECUTE ON FUNCTION public.check_operator_username_available(text) TO anon, authenticated;

-- 3) Audited reply-body RPC (parallel to get_talent_message_body)
CREATE OR REPLACE FUNCTION public.get_talent_reply_body(_reply_id uuid)
RETURNS TABLE (
  id uuid,
  request_id uuid,
  sender_user_id uuid,
  sender_role text,
  body text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.talent_message_replies%ROWTYPE;
  _req public.talent_contact_requests%ROWTYPE;
  _is_admin boolean;
  _is_party boolean;
BEGIN
  SELECT * INTO _row FROM public.talent_message_replies WHERE id = _reply_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not found' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO _req FROM public.talent_contact_requests WHERE id = _row.request_id;

  _is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  _is_party := (auth.uid() = _row.sender_user_id
                OR auth.uid() = _req.candidate_user_id
                OR auth.uid() = _req.sender_user_id);

  IF NOT (_is_admin OR _is_party) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  IF _is_admin AND NOT _is_party THEN
    INSERT INTO public.data_access_logs (
      user_id, organization_id, table_name, record_id, operation, metadata
    ) VALUES (
      auth.uid(), _req.organization_id,
      'talent_message_replies', _row.id, 'admin_read_body',
      jsonb_build_object('request_id', _row.request_id, 'sender_user_id', _row.sender_user_id)
    );
  END IF;

  RETURN QUERY
  SELECT _row.id, _row.request_id, _row.sender_user_id, _row.sender_role, _row.body, _row.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.get_talent_reply_body(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_talent_reply_body(uuid) TO authenticated;
