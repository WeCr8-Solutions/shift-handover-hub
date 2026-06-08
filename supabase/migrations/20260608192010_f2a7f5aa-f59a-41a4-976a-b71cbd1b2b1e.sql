
-- 1) Intake responses table -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.onboarding_intake_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.onboarding_engagements(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  version int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, module_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_intake_responses TO authenticated;
GRANT ALL ON public.onboarding_intake_responses TO service_role;

ALTER TABLE public.onboarding_intake_responses ENABLE ROW LEVEL SECURITY;

-- Org admins/owners of the engagement's org can read/write their own intake.
CREATE POLICY "Org admins read own intake responses"
  ON public.onboarding_intake_responses FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'developer'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = onboarding_intake_responses.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin','owner')
    )
  );

CREATE POLICY "Platform admins manage intake responses"
  ON public.onboarding_intake_responses FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'developer'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'developer'::public.app_role)
  );

CREATE INDEX IF NOT EXISTS idx_oir_engagement ON public.onboarding_intake_responses(engagement_id);
CREATE INDEX IF NOT EXISTS idx_oir_org ON public.onboarding_intake_responses(organization_id);

CREATE OR REPLACE FUNCTION public.tg_oir_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_oir_updated_at ON public.onboarding_intake_responses;
CREATE TRIGGER trg_oir_updated_at BEFORE UPDATE ON public.onboarding_intake_responses
  FOR EACH ROW EXECUTE FUNCTION public.tg_oir_set_updated_at();

-- 2) submit_intake_step RPC -------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_intake_step(
  p_engagement_id uuid,
  p_module_key text,
  p_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_uid uuid := auth.uid();
  v_is_admin bool;
  v_row uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT organization_id INTO v_org FROM public.onboarding_engagements WHERE id = p_engagement_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Engagement not found'; END IF;

  v_is_admin := public.has_role(v_uid, 'admin'::public.app_role)
             OR public.has_role(v_uid, 'developer'::public.app_role);

  IF NOT v_is_admin THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = v_org
        AND om.user_id = v_uid
        AND om.role IN ('admin','owner')
    ) THEN
      RAISE EXCEPTION 'Forbidden: only org admins/owners can submit intake';
    END IF;
  END IF;

  -- Whitelist of allowed module_keys (matches admin checklist modules).
  IF p_module_key NOT IN (
    'org_profile','equipment','stations','users_roles','routing',
    'quality','erp','training','documents','review'
  ) THEN
    RAISE EXCEPTION 'Unknown module_key: %', p_module_key;
  END IF;

  INSERT INTO public.onboarding_intake_responses (engagement_id, organization_id, module_key, payload, submitted_by)
  VALUES (p_engagement_id, v_org, p_module_key, COALESCE(p_payload, '{}'::jsonb), v_uid)
  ON CONFLICT (engagement_id, module_key) DO UPDATE
    SET payload = EXCLUDED.payload,
        submitted_by = EXCLUDED.submitted_by,
        submitted_at = now(),
        version = public.onboarding_intake_responses.version + 1
  RETURNING id INTO v_row;

  -- Advance matching admin checklist item from todo -> in_progress (don't override blocked/done).
  UPDATE public.onboarding_checklist_items
     SET status = 'in_progress'
   WHERE engagement_id = p_engagement_id
     AND module_key   = p_module_key
     AND status       = 'todo';

  -- Audit
  INSERT INTO public.admin_audit_events (actor_id, action_type, target_type, target_id, organization_id, metadata)
  VALUES (v_uid, 'concierge.intake.submitted', 'engagement', p_engagement_id, v_org,
          jsonb_build_object('module_key', p_module_key));

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_intake_step(uuid, text, jsonb) TO authenticated;

-- 3) Deepen verify_org_production_ready ------------------------------------
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
  v_erp_conn int;
  v_station_with_equip int;
  v_operator_signed_in int;
  v_queue_with_routing int;
  v_branding_logo bool;
  v_sub_tier text;
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
  SELECT tier INTO v_sub_tier
    FROM public.subscriptions
    WHERE organization_id = p_org_id AND status IN ('active','trialing')
    ORDER BY created_at DESC LIMIT 1;

  SELECT requires_us_person_declaration, COALESCE(erp_persistence_mode, 'read_through')
    INTO v_itar, v_persistence
    FROM public.organizations WHERE id = p_org_id;

  SELECT COUNT(*) INTO v_erp_conn FROM public.erp_connections WHERE organization_id = p_org_id;

  -- Deepened checks
  SELECT COUNT(DISTINCT sma.station_id) INTO v_station_with_equip
    FROM public.station_machine_assignments sma
    JOIN public.stations s ON s.id = sma.station_id
    WHERE s.organization_id = p_org_id AND s.is_active = true;

  SELECT COUNT(DISTINCT om.user_id) INTO v_operator_signed_in
    FROM public.organization_members om
    JOIN auth.users u ON u.id = om.user_id
    WHERE om.organization_id = p_org_id
      AND om.role IN ('operator','supervisor','member','admin','owner')
      AND u.last_sign_in_at IS NOT NULL;

  SELECT COUNT(*) INTO v_queue_with_routing
    FROM public.queue_items qi
    WHERE qi.organization_id = p_org_id
      AND qi.routing_template_id IS NOT NULL;

  SELECT (logo_url IS NOT NULL AND length(logo_url) > 0)
    INTO v_branding_logo
    FROM public.organization_branding
    WHERE organization_id = p_org_id
    LIMIT 1;
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

  -- New deeper checks
  IF v_station_with_equip = 0 THEN v_blockers := v_blockers || 'No station has equipment assigned'; END IF;
  IF v_operator_signed_in = 0 THEN v_blockers := v_blockers || 'No member has signed in yet'; END IF;
  IF v_queue_with_routing = 0 THEN v_blockers := v_blockers || 'No queue items have a routing template applied'; END IF;
  IF NOT v_branding_logo THEN v_blockers := v_blockers || 'Branding logo is missing'; END IF;
  IF v_sub_tier IN ('team','enterprise') AND v_station < 2 THEN
    v_blockers := v_blockers || 'Team/Enterprise tier requires at least 2 active stations';
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
    'erp_persistence_mode', v_persistence,
    'stations_with_equipment', v_station_with_equip,
    'members_signed_in', v_operator_signed_in,
    'queue_items_with_routing', v_queue_with_routing,
    'branding_logo', v_branding_logo,
    'subscription_tier', COALESCE(v_sub_tier, 'none')
  );

  RETURN jsonb_build_object(
    'ready', cardinality(v_blockers) = 0,
    'blockers', to_jsonb(v_blockers),
    'counts', v_counts
  );
END;
$$;
