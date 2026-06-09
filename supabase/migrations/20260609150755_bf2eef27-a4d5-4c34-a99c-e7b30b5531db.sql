
CREATE OR REPLACE FUNCTION public.mark_org_open_for_operations(p_organization_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _role text;
  _required text[] := ARRAY['profile','organization','data_source','shop_floor','billing'];
  _step text;
  _done boolean;
  _missing text[] := ARRAY[]::text[];
  _eng RECORD;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT role INTO _role FROM public.organization_members
    WHERE organization_id = p_organization_id AND user_id = _uid;
  IF _role NOT IN ('owner','admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Owner or admin role required');
  END IF;

  FOREACH _step IN ARRAY _required LOOP
    SELECT completed INTO _done
    FROM public.organization_setup_steps
    WHERE organization_id = p_organization_id AND step = _step;
    IF NOT COALESCE(_done, false) THEN
      _missing := array_append(_missing, 'setup:' || _step);
    END IF;
  END LOOP;

  SELECT id, payment_status, purchased_via, contract_signed_at
    INTO _eng
    FROM public.onboarding_engagements
    WHERE organization_id = p_organization_id
      AND status NOT IN ('live','cancelled')
    ORDER BY created_at DESC LIMIT 1;

  IF _eng.id IS NOT NULL THEN
    IF _eng.payment_status NOT IN ('paid','waived') THEN
      _missing := array_append(_missing, 'concierge:payment');
    END IF;
    IF _eng.purchased_via <> 'stripe'
       AND _eng.payment_status <> 'waived'
       AND _eng.contract_signed_at IS NULL THEN
      _missing := array_append(_missing, 'concierge:contract_signature');
    END IF;
  END IF;

  IF array_length(_missing, 1) > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Setup incomplete', 'missing', to_jsonb(_missing));
  END IF;

  UPDATE public.organizations
    SET activation_state = 'open_for_operations',
        opened_for_operations_at = now(),
        opened_for_operations_by = _uid
    WHERE id = p_organization_id;

  INSERT INTO public.organization_audit_events
    (organization_id, actor_id, actor_type, event_type, metadata)
  VALUES (
    p_organization_id, _uid, 'user', 'org.opened_for_operations',
    jsonb_build_object('completed_by_role', _role, 'engagement_id', _eng.id)
  );

  INSERT INTO public.concierge_activity_log
    (organization_id, actor_user_id, actor_role, action, summary, details)
  VALUES (
    p_organization_id, _uid, _role, 'org.opened_for_operations',
    'Organization opened for operations by ' || _role, '{}'::jsonb
  );

  RETURN jsonb_build_object('ok', true);
END;
$function$;
