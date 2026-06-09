
CREATE OR REPLACE FUNCTION public.stamp_owner_claimed(p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _existing timestamptz;
BEGIN
  IF _uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated'); END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_organization_id AND user_id = _uid
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not a member of this organization');
  END IF;

  SELECT claimed_at INTO _existing FROM public.organizations WHERE id = p_organization_id;
  IF _existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_claimed', true, 'claimed_at', _existing);
  END IF;

  UPDATE public.organizations
    SET claimed_at = now(),
        claimed_by_user_id = _uid
    WHERE id = p_organization_id;

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES (p_organization_id, _uid, 'owner', 'owner.claimed', 'Owner account claimed', '{}'::jsonb);

  INSERT INTO public.organization_audit_events
    (organization_id, actor_id, actor_type, event_type, metadata)
  VALUES (p_organization_id, _uid, 'user', 'org.claimed', '{}'::jsonb);

  RETURN jsonb_build_object('ok', true, 'claimed_at', now());
END;
$function$;
