
CREATE OR REPLACE FUNCTION public.seed_basic_shop_scaffold(p_org_id uuid, p_engagement_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_team_id uuid;
  v_dept_office uuid;
  v_dept_cnc uuid;
  v_dept_weld uuid;
  v_dept_ship uuid;
  v_dept_qa uuid;
  v_station_id uuid;
  v_station_count int := 0;
  v_linked int := 0;
  v_eq record;
  v_suffix text;
  v_st_code text;
  v_wc text;
  v_wct text;
BEGIN
  IF NOT (
       auth.role() = 'service_role'
    OR public.has_role(v_uid,'admin'::public.app_role)
    OR public.has_role(v_uid,'developer'::public.app_role)
    OR EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = p_org_id AND om.user_id = v_uid AND om.role IN ('admin','owner')
      )
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = p_org_id) THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  SELECT id INTO v_team_id FROM public.teams
    WHERE organization_id = p_org_id AND name = 'Production' LIMIT 1;
  IF v_team_id IS NULL THEN
    SELECT id INTO v_team_id FROM public.teams
      WHERE organization_id = p_org_id ORDER BY created_at ASC LIMIT 1;
  END IF;
  IF v_team_id IS NULL THEN
    INSERT INTO public.teams (organization_id, name, description, created_by)
    VALUES (p_org_id, 'Production', 'Default production team', COALESCE(v_uid, '00000000-0000-0000-0000-000000000000'::uuid))
    RETURNING id INTO v_team_id;
  END IF;

  INSERT INTO public.departments (organization_id, team_id, name, description)
  VALUES
    (p_org_id, v_team_id, 'Office',                'Front office, planning, sales'),
    (p_org_id, v_team_id, 'CNC Operations',        'Milling, turning, 5-axis, honing'),
    (p_org_id, v_team_id, 'Welding & Assembly',    'Weld and assembly bench operations'),
    (p_org_id, v_team_id, 'Shipping & Receiving',  'Inbound/outbound material handling'),
    (p_org_id, v_team_id, 'Quality / Inspection',  'CMM, first-article and final inspection')
  ON CONFLICT (team_id, name) DO UPDATE SET description = EXCLUDED.description;

  SELECT id INTO v_dept_office FROM public.departments WHERE team_id=v_team_id AND name='Office';
  SELECT id INTO v_dept_cnc    FROM public.departments WHERE team_id=v_team_id AND name='CNC Operations';
  SELECT id INTO v_dept_weld   FROM public.departments WHERE team_id=v_team_id AND name='Welding & Assembly';
  SELECT id INTO v_dept_ship   FROM public.departments WHERE team_id=v_team_id AND name='Shipping & Receiving';
  SELECT id INTO v_dept_qa     FROM public.departments WHERE team_id=v_team_id AND name='Quality / Inspection';

  INSERT INTO public.stations (organization_id, team_id, department_id, station_id, name, work_center, work_center_type, is_active, daily_capacity_hours)
  VALUES
    (p_org_id, v_team_id, v_dept_office, 'OFFICE-01',  'Front Office',      'OFFICE', 'office',     true, 8),
    (p_org_id, v_team_id, v_dept_weld,   'WELD-01',    'Weld Bay',          'WELD',   'welding',    true, 8),
    (p_org_id, v_team_id, v_dept_weld,   'ASSY-01',    'Assembly Bench',    'ASSY',   'assembly',   true, 8),
    (p_org_id, v_team_id, v_dept_ship,   'RECV-01',    'Receiving',         'RECV',   'receiving',  true, 8),
    (p_org_id, v_team_id, v_dept_ship,   'SHIP-01',    'Shipping',          'SHIP',   'shipping',   true, 8),
    (p_org_id, v_team_id, v_dept_qa,     'INSP-01',    'Inspection Bench',  'INSP',   'inspection', true, 8)
  ON CONFLICT (organization_id, name) DO NOTHING;

  FOR v_eq IN
    SELECT id, manufacturer, model, serial_number, equipment_type
    FROM public.equipment
    WHERE organization_id = p_org_id
    ORDER BY created_at ASC
  LOOP
    v_suffix := COALESCE(NULLIF(right(v_eq.serial_number, 4), ''), substr(v_eq.id::text, 1, 4));
    v_st_code := upper(regexp_replace(COALESCE(v_eq.model, 'MACHINE'), '[^A-Za-z0-9]+', '', 'g')) || '-' || v_suffix;
    v_wc := COALESCE(NULLIF(upper(v_eq.equipment_type), ''), 'CNC');
    v_wct := COALESCE(v_eq.equipment_type, 'cnc');

    v_station_id := NULL;
    INSERT INTO public.stations (organization_id, team_id, department_id, station_id, name, work_center, work_center_type, is_active, daily_capacity_hours)
    VALUES (
      p_org_id, v_team_id, v_dept_cnc, v_st_code,
      COALESCE(v_eq.manufacturer, 'Machine') || ' ' || COALESCE(v_eq.model, '') || ' (' || v_suffix || ')',
      v_wc, v_wct, true, 8
    )
    ON CONFLICT (organization_id, name) DO NOTHING
    RETURNING id INTO v_station_id;

    IF v_station_id IS NULL THEN
      SELECT id INTO v_station_id FROM public.stations
        WHERE organization_id = p_org_id
          AND name = COALESCE(v_eq.manufacturer, 'Machine') || ' ' || COALESCE(v_eq.model, '') || ' (' || v_suffix || ')';
    END IF;

    IF v_station_id IS NOT NULL THEN
      UPDATE public.equipment
        SET station_id = v_station_id, updated_at = now()
        WHERE id = v_eq.id AND (station_id IS NULL OR station_id <> v_station_id);
      v_linked := v_linked + 1;
    END IF;
  END LOOP;

  SELECT count(*) INTO v_station_count FROM public.stations
    WHERE organization_id = p_org_id AND is_active = true;

  IF p_engagement_id IS NOT NULL THEN
    UPDATE public.onboarding_checklist_items
       SET status = 'done',
           completed_by = COALESCE(v_uid, completed_by),
           completed_at = now(),
           updated_at = now()
     WHERE engagement_id = p_engagement_id
       AND module_key = 'stations'
       AND status <> 'done';
  END IF;

  RETURN jsonb_build_object(
    'team_id', v_team_id,
    'departments', 5,
    'stations_total', v_station_count,
    'equipment_linked', v_linked
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.seed_basic_shop_scaffold(uuid, uuid) TO authenticated, service_role;
