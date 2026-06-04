
-- 1. Production readiness verification
CREATE OR REPLACE FUNCTION public.verify_org_production_ready(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blockers text[] := '{}';
  v_counts jsonb;
  v_dept int; v_station int; v_equip int;
  v_admin int; v_operator int;
  v_routing int; v_branding int;
  v_sub int; v_itar bool; v_persistence text;
  v_erp_choice text; v_erp_conn int;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::public.app_role)
       OR public.has_role(auth.uid(),'developer'::public.app_role)) THEN
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

  SELECT requires_us_person_declaration, COALESCE(erp_persistence_mode, 'read_through')
    INTO v_itar, v_persistence
    FROM public.organizations WHERE id = p_org_id;

  SELECT COUNT(*) INTO v_erp_conn FROM public.erp_connections WHERE organization_id = p_org_id;

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

  v_counts := jsonb_build_object(
    'departments', v_dept,
    'stations', v_station,
    'equipment', v_equip,
    'admins', v_admin,
    'operators', v_operator,
    'routing_templates', v_routing,
    'branding', v_branding,
    'subscriptions', v_sub,
    'erp_connections', v_erp_conn,
    'itar', v_itar,
    'erp_persistence_mode', v_persistence
  );

  RETURN jsonb_build_object(
    'ready', cardinality(v_blockers) = 0,
    'blockers', to_jsonb(v_blockers),
    'counts', v_counts
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_org_production_ready(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_org_production_ready(uuid) TO authenticated;

-- 2. Seed production defaults at activation
CREATE OR REPLACE FUNCTION public.seed_org_production_defaults(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Idle station status for any station missing a current row
  INSERT INTO public.current_station_status (station_id, organization_id, current_job_state, updated_at)
  SELECT s.id, s.organization_id, 'idle', now()
  FROM public.stations s
  WHERE s.organization_id = p_org_id
    AND s.is_active = true
    AND NOT EXISTS (SELECT 1 FROM public.current_station_status c WHERE c.station_id = s.id);

  -- Default downtime reasons (skip if any already exist for org)
  IF NOT EXISTS (SELECT 1 FROM public.org_downtime_reasons WHERE organization_id = p_org_id) THEN
    INSERT INTO public.org_downtime_reasons (organization_id, code, label, category, sort_order, is_active)
    VALUES
      (p_org_id, 'tooling',     'Tooling change/break',  'planned',   10, true),
      (p_org_id, 'material',    'Material shortage',     'unplanned', 20, true),
      (p_org_id, 'maintenance', 'Maintenance',           'planned',   30, true),
      (p_org_id, 'setup',       'Setup/changeover',      'planned',   40, true),
      (p_org_id, 'quality',     'Quality hold',          'unplanned', 50, true),
      (p_org_id, 'other',       'Other',                 'other',     99, true);
  END IF;

  -- Default shift schedules (only if none exist)
  IF NOT EXISTS (SELECT 1 FROM public.shift_schedules WHERE organization_id = p_org_id) THEN
    INSERT INTO public.shift_schedules
      (organization_id, shift_name, shift_code, start_time, end_time, days_of_week, is_active)
    VALUES
      (p_org_id, 'Day',   'DAY', '06:00', '14:30', ARRAY[1,2,3,4,5], true),
      (p_org_id, 'Swing', 'SWG', '14:00', '22:30', ARRAY[1,2,3,4,5], true);
  END IF;

  -- Default notification preferences per org admin
  INSERT INTO public.notification_preferences (user_id, email_morning_brief, subscribe_all_stations)
  SELECT om.user_id, true, true
  FROM public.organization_members om
  WHERE om.organization_id = p_org_id AND om.role IN ('admin','owner')
    AND NOT EXISTS (SELECT 1 FROM public.notification_preferences np WHERE np.user_id = om.user_id);

  -- Default work-center config rows per distinct station work_center_type
  INSERT INTO public.work_center_config (organization_id, work_center_type, display_name, is_active)
  SELECT DISTINCT p_org_id, s.work_center_type, INITCAP(REPLACE(s.work_center_type, '_', ' ')), true
  FROM public.stations s
  WHERE s.organization_id = p_org_id
    AND s.work_center_type IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.work_center_config w
      WHERE w.organization_id = p_org_id AND w.work_center_type = s.work_center_type
    );
END;
$$;

REVOKE ALL ON FUNCTION public.seed_org_production_defaults(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_org_production_defaults(uuid) TO service_role;

-- 3. Strengthen mark_engagement_ready
CREATE OR REPLACE FUNCTION public.mark_engagement_ready(p_engagement_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_org uuid; v_open int; v_check jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::public.app_role)
       OR public.has_role(auth.uid(),'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT organization_id INTO v_org FROM public.onboarding_engagements WHERE id = p_engagement_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Engagement not found'; END IF;

  SELECT COUNT(*) INTO v_open
  FROM public.onboarding_checklist_items
  WHERE engagement_id = p_engagement_id AND required = true AND status <> 'done';
  IF v_open > 0 THEN RAISE EXCEPTION 'Cannot mark ready: % required checklist item(s) still open', v_open; END IF;

  v_check := public.verify_org_production_ready(v_org);
  IF (v_check->>'ready')::bool = false THEN
    RAISE EXCEPTION 'Cannot mark ready: %', v_check->>'blockers';
  END IF;

  UPDATE public.onboarding_engagements
     SET status='ready_for_production', ready_at=now(), percent_complete=100
   WHERE id=p_engagement_id;
  UPDATE public.organizations
     SET onboarding_status='ready_for_production', onboarding_engagement_id=p_engagement_id
   WHERE id=v_org;

  INSERT INTO public.admin_audit_events (actor_id, action_type, target_type, target_id, organization_id, metadata)
  VALUES (auth.uid(), 'onboarding.ready_for_production', 'organization', v_org, v_org,
          jsonb_build_object('engagement_id', p_engagement_id, 'verification', v_check));
  RETURN p_engagement_id;
END;
$$;

-- 4. Activation seeds defaults and audits
CREATE OR REPLACE FUNCTION public.activate_org_for_production(p_engagement_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_org uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::public.app_role)
       OR public.has_role(auth.uid(),'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT organization_id INTO v_org FROM public.onboarding_engagements WHERE id = p_engagement_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Engagement not found'; END IF;

  PERFORM public.seed_org_production_defaults(v_org);

  UPDATE public.onboarding_engagements SET status='live', went_live_at=now() WHERE id=p_engagement_id;
  UPDATE public.organizations SET onboarding_status='live' WHERE id=v_org;

  INSERT INTO public.admin_audit_events (actor_id, action_type, target_type, target_id, organization_id, metadata)
  VALUES (auth.uid(), 'onboarding.went_live', 'organization', v_org, v_org,
          jsonb_build_object('engagement_id', p_engagement_id));

  RETURN p_engagement_id;
END;
$$;

-- 5. Audit trigger on checklist status changes
CREATE OR REPLACE FUNCTION public._audit_onboarding_checklist_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.admin_audit_events
      (actor_id, action_type, target_type, target_id, organization_id, metadata)
    VALUES
      (auth.uid(), 'onboarding.checklist_item_updated', 'checklist_item', NEW.id, NEW.organization_id,
       jsonb_build_object('module', NEW.module_key,
                          'from', OLD.status, 'to', NEW.status,
                          'engagement_id', NEW.engagement_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_onboarding_checklist_change ON public.onboarding_checklist_items;
CREATE TRIGGER audit_onboarding_checklist_change
  AFTER UPDATE ON public.onboarding_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public._audit_onboarding_checklist_change();

-- 6. Mark training as required in future checklist seeds
CREATE OR REPLACE FUNCTION public.seed_onboarding_checklist(p_engagement_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_org uuid;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::public.app_role)
       OR public.has_role(auth.uid(),'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT organization_id INTO v_org FROM public.onboarding_engagements WHERE id = p_engagement_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Engagement not found'; END IF;

  INSERT INTO public.onboarding_checklist_items
    (engagement_id, organization_id, module_key, label, sort_order, required)
  VALUES
    (p_engagement_id, v_org, 'org_profile',  'Organization profile, branding, ITAR posture',   10, true),
    (p_engagement_id, v_org, 'equipment',    'Equipment & machine registry uploaded',          20, true),
    (p_engagement_id, v_org, 'stations',     'Departments & stations configured',              30, true),
    (p_engagement_id, v_org, 'users_roles',  'Users, roles, and invites generated',            40, true),
    (p_engagement_id, v_org, 'routing',      'Routing templates loaded',                       50, true),
    (p_engagement_id, v_org, 'quality',      'Quality checkpoints & inspection tools set',     60, true),
    (p_engagement_id, v_org, 'erp',          'ERP / integrations configured',                  70, false),
    (p_engagement_id, v_org, 'training',     'Training programs & OAP enrollments seeded',     80, true),
    (p_engagement_id, v_org, 'documents',    'Policies, manuals & setup sheets uploaded',      90, true),
    (p_engagement_id, v_org, 'review',       'Final review & customer handoff',               100, true);
END;
$$;
