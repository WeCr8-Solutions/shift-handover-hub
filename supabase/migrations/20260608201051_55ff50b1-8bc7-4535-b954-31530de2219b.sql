CREATE OR REPLACE FUNCTION public.verify_org_production_ready(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_blockers text[] := '{}';
  v_dept int; v_station int; v_equip int;
  v_admin int; v_operator int;
  v_routing int; v_branding int;
  v_sub int; v_itar bool; v_persistence text;
  v_erp_conn int;
  v_station_with_equip int;
  v_operator_signed_in int;
  v_queue_with_routing int;
  v_branding_logo bool;
  v_sub_tier text;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::public.app_role)
       OR public.has_role(auth.uid(),'developer'::public.app_role)
       OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT COUNT(*) INTO v_dept    FROM public.departments WHERE organization_id = p_org_id;
  SELECT COUNT(*) INTO v_station FROM public.stations    WHERE organization_id = p_org_id AND is_active = true;
  SELECT COUNT(*) INTO v_equip   FROM public.equipment   WHERE organization_id = p_org_id;
  SELECT COUNT(*) INTO v_admin
    FROM public.organization_members om
    WHERE om.organization_id = p_org_id AND om.role IN ('admin','owner');
  SELECT COUNT(*) INTO v_operator
    FROM public.organization_members om
    WHERE om.organization_id = p_org_id AND om.role IN ('operator','supervisor','member');
  SELECT COUNT(*) INTO v_routing
    FROM public.routing_templates rt
    WHERE rt.organization_id = p_org_id
      AND EXISTS (SELECT 1 FROM public.routing_template_steps s WHERE s.template_id = rt.id);
  SELECT COUNT(*) INTO v_branding FROM public.organization_branding WHERE organization_id = p_org_id;
  SELECT COUNT(*) INTO v_sub
    FROM public.subscriptions
    WHERE organization_id = p_org_id AND status IN ('active','trialing');
  SELECT COALESCE(metadata->>'tier', stripe_price_id) INTO v_sub_tier
    FROM public.subscriptions
    WHERE organization_id = p_org_id AND status IN ('active','trialing')
    ORDER BY created_at DESC LIMIT 1;

  SELECT requires_us_person_declaration INTO v_itar
    FROM public.organizations WHERE id = p_org_id;

  SELECT COUNT(*) INTO v_erp_conn FROM public.erp_connections WHERE organization_id = p_org_id;
  SELECT COALESCE(
      (SELECT erp_persistence_mode FROM public.erp_connections
        WHERE organization_id = p_org_id
        ORDER BY created_at DESC LIMIT 1),
      'read_through'
    ) INTO v_persistence;

  SELECT COUNT(DISTINCT e.station_id) INTO v_station_with_equip
    FROM public.equipment e
   WHERE e.organization_id = p_org_id AND e.station_id IS NOT NULL;

  SELECT COUNT(DISTINCT om.user_id) INTO v_operator_signed_in
    FROM public.organization_members om
    JOIN auth.users u ON u.id = om.user_id
   WHERE om.organization_id = p_org_id AND u.last_sign_in_at IS NOT NULL;

  SELECT COUNT(*) INTO v_queue_with_routing
    FROM public.queue_items qi
   WHERE qi.organization_id = p_org_id AND qi.routing_template_id IS NOT NULL;

  SELECT logo_url IS NOT NULL AND logo_url <> '' INTO v_branding_logo
    FROM public.organization_branding
    WHERE organization_id = p_org_id LIMIT 1;
  v_branding_logo := COALESCE(v_branding_logo, false);

  IF v_dept    = 0 THEN v_blockers := v_blockers || 'No departments configured'; END IF;
  IF v_station = 0 THEN v_blockers := v_blockers || 'No active stations'; END IF;
  IF v_equip   = 0 THEN v_blockers := v_blockers || 'No equipment registered'; END IF;
  IF v_admin   = 0 THEN v_blockers := v_blockers || 'No org admin assigned'; END IF;
  IF v_operator = 0 THEN v_blockers := v_blockers || 'No operator/supervisor members'; END IF;
  IF v_routing = 0 THEN v_blockers := v_blockers || 'No routing templates with steps'; END IF;
  IF v_branding = 0 THEN v_blockers := v_blockers || 'Organization branding missing'; END IF;
  IF v_sub = 0 THEN v_blockers := v_blockers || 'No active subscription tier'; END IF;
  IF v_itar AND v_persistence <> 'read_through' THEN
    v_blockers := v_blockers || 'ITAR org must use read-through ERP persistence';
  END IF;
  IF v_station_with_equip = 0 THEN v_blockers := v_blockers || 'No station has equipment assigned'; END IF;
  IF v_operator_signed_in = 0 THEN v_blockers := v_blockers || 'No member has signed in yet'; END IF;
  IF v_queue_with_routing = 0 THEN v_blockers := v_blockers || 'No queue items have a routing template applied'; END IF;
  IF NOT v_branding_logo THEN v_blockers := v_blockers || 'Branding logo is missing'; END IF;

  RETURN jsonb_build_object(
    'ready', array_length(v_blockers,1) IS NULL,
    'blockers', to_jsonb(v_blockers),
    'counts', jsonb_build_object(
      'departments', v_dept,
      'stations', v_station,
      'equipment', v_equip,
      'admins', v_admin,
      'operators', v_operator,
      'routing_templates', v_routing,
      'branding', v_branding,
      'subscriptions', v_sub,
      'erp_connections', v_erp_conn,
      'stations_with_equipment', v_station_with_equip,
      'members_signed_in', v_operator_signed_in,
      'queue_items_with_routing', v_queue_with_routing,
      'persistence_mode', v_persistence,
      'itar', COALESCE(v_itar,false),
      'subscription_tier', COALESCE(v_sub_tier,'none'),
      'has_logo', v_branding_logo
    )
  );
END;
$function$;