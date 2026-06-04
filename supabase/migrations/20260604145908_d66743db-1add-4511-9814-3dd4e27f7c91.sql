
DO $$ BEGIN
  CREATE TYPE public.org_onboarding_status AS ENUM (
    'self_serve','concierge_intake','concierge_in_progress','ready_for_production','live'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS onboarding_status public.org_onboarding_status NOT NULL DEFAULT 'self_serve',
  ADD COLUMN IF NOT EXISTS onboarding_engagement_id UUID;

CREATE TABLE IF NOT EXISTS public.onboarding_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  purchased_via TEXT NOT NULL DEFAULT 'manual' CHECK (purchased_via IN ('stripe','manual','complimentary')),
  stripe_payment_intent_id TEXT,
  plan_tier TEXT NOT NULL DEFAULT 'standard',
  assigned_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'intake'
    CHECK (status IN ('intake','in_progress','review','ready_for_production','live','cancelled')),
  percent_complete INTEGER NOT NULL DEFAULT 0 CHECK (percent_complete BETWEEN 0 AND 100),
  notes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ready_at TIMESTAMPTZ,
  went_live_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_engagements_org ON public.onboarding_engagements(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_engagements_status ON public.onboarding_engagements(status);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_engagement_active_per_org
  ON public.onboarding_engagements(organization_id)
  WHERE status NOT IN ('live','cancelled');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_engagements TO authenticated;
GRANT ALL ON public.onboarding_engagements TO service_role;
ALTER TABLE public.onboarding_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage engagements"
  ON public.onboarding_engagements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'developer'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'developer'::public.app_role));

CREATE POLICY "Org admins read own engagement"
  ON public.onboarding_engagements FOR SELECT TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE TABLE IF NOT EXISTS public.onboarding_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES public.onboarding_engagements(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo','in_progress','blocked','done','skipped')),
  customer_blocker_note TEXT,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_checklist_items_engagement ON public.onboarding_checklist_items(engagement_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_checklist_items TO authenticated;
GRANT ALL ON public.onboarding_checklist_items TO service_role;
ALTER TABLE public.onboarding_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage checklist items"
  ON public.onboarding_checklist_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'developer'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'developer'::public.app_role));

CREATE POLICY "Org admins read own checklist"
  ON public.onboarding_checklist_items FOR SELECT TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

CREATE OR REPLACE FUNCTION public.touch_onboarding_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_engagements_updated_at ON public.onboarding_engagements;
CREATE TRIGGER trg_engagements_updated_at BEFORE UPDATE ON public.onboarding_engagements
  FOR EACH ROW EXECUTE FUNCTION public.touch_onboarding_updated_at();

DROP TRIGGER IF EXISTS trg_checklist_updated_at ON public.onboarding_checklist_items;
CREATE TRIGGER trg_checklist_updated_at BEFORE UPDATE ON public.onboarding_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_onboarding_updated_at();

CREATE OR REPLACE FUNCTION public.seed_onboarding_checklist(p_engagement_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org UUID;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'developer'::public.app_role)) THEN
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
    (p_engagement_id, v_org, 'training',     'Training programs & OAP enrollments seeded',     80, false),
    (p_engagement_id, v_org, 'documents',    'Policies, manuals & setup sheets uploaded',      90, true),
    (p_engagement_id, v_org, 'review',       'Final review & customer handoff',               100, true);
END $$;
REVOKE ALL ON FUNCTION public.seed_onboarding_checklist(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.seed_onboarding_checklist(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.recompute_engagement_progress()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_total INTEGER; v_done INTEGER; v_engagement UUID := COALESCE(NEW.engagement_id, OLD.engagement_id);
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'done')
    INTO v_total, v_done
  FROM public.onboarding_checklist_items
  WHERE engagement_id = v_engagement AND required = true;
  UPDATE public.onboarding_engagements
     SET percent_complete = CASE WHEN v_total = 0 THEN 0 ELSE ROUND(100.0 * v_done / v_total) END
   WHERE id = v_engagement;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_recompute_progress ON public.onboarding_checklist_items;
CREATE TRIGGER trg_recompute_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.onboarding_checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.recompute_engagement_progress();

CREATE OR REPLACE FUNCTION public.mark_engagement_ready(p_engagement_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org UUID; v_open INTEGER;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT organization_id INTO v_org FROM public.onboarding_engagements WHERE id = p_engagement_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Engagement not found'; END IF;

  SELECT COUNT(*) INTO v_open
  FROM public.onboarding_checklist_items
  WHERE engagement_id = p_engagement_id AND required = true AND status <> 'done';
  IF v_open > 0 THEN RAISE EXCEPTION 'Cannot mark ready: % required item(s) still open', v_open; END IF;

  UPDATE public.onboarding_engagements SET status='ready_for_production', ready_at=now(), percent_complete=100 WHERE id=p_engagement_id;
  UPDATE public.organizations SET onboarding_status='ready_for_production', onboarding_engagement_id=p_engagement_id WHERE id=v_org;

  INSERT INTO public.admin_audit_events (actor_id, action_type, target_type, target_id, organization_id, metadata)
  VALUES (auth.uid(), 'onboarding.ready_for_production', 'organization', v_org, v_org,
          jsonb_build_object('engagement_id', p_engagement_id));
  RETURN p_engagement_id;
END $$;
REVOKE ALL ON FUNCTION public.mark_engagement_ready(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.mark_engagement_ready(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.activate_org_for_production(p_engagement_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org UUID;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT organization_id INTO v_org FROM public.onboarding_engagements WHERE id = p_engagement_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Engagement not found'; END IF;

  UPDATE public.onboarding_engagements SET status='live', went_live_at=now() WHERE id=p_engagement_id;
  UPDATE public.organizations SET onboarding_status='live' WHERE id=v_org;

  INSERT INTO public.admin_audit_events (actor_id, action_type, target_type, target_id, organization_id, metadata)
  VALUES (auth.uid(), 'onboarding.went_live', 'organization', v_org, v_org,
          jsonb_build_object('engagement_id', p_engagement_id));
  RETURN p_engagement_id;
END $$;
REVOKE ALL ON FUNCTION public.activate_org_for_production(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.activate_org_for_production(UUID) TO authenticated;
