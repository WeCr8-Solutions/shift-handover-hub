
-- ============================================================
-- Phase 2: Org-Scoping Hardening
-- ============================================================

-- ========== ISSUE 1: Add organization_id to 4 remaining tables ==========

-- 1a. current_station_status
ALTER TABLE public.current_station_status
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

UPDATE public.current_station_status css
SET organization_id = s.organization_id
FROM public.stations s WHERE s.id = css.station_id AND css.organization_id IS NULL;

-- 1b. routing_template_steps
ALTER TABLE public.routing_template_steps
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

UPDATE public.routing_template_steps rts
SET organization_id = rt.organization_id
FROM public.routing_templates rt WHERE rt.id = rts.template_id AND rts.organization_id IS NULL;

-- 1c. shift_assignments
ALTER TABLE public.shift_assignments
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

UPDATE public.shift_assignments sa
SET organization_id = ss.organization_id
FROM public.shift_schedules ss WHERE ss.id = sa.shift_schedule_id AND sa.organization_id IS NULL;

-- 1d. webhook_deliveries
ALTER TABLE public.webhook_deliveries
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

UPDATE public.webhook_deliveries wd
SET organization_id = w.organization_id
FROM public.organization_webhooks w WHERE w.id = wd.webhook_id AND wd.organization_id IS NULL;

-- ========== Auto-populate triggers for the 4 new tables ==========

-- current_station_status trigger
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_station_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.station_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.stations WHERE id = NEW.station_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_station_status_auto_org_id ON public.current_station_status;
CREATE TRIGGER trg_station_status_auto_org_id
  BEFORE INSERT OR UPDATE ON public.current_station_status
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_station_status();

-- routing_template_steps trigger
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_routing_step()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.template_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.routing_templates WHERE id = NEW.template_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_routing_step_auto_org_id ON public.routing_template_steps;
CREATE TRIGGER trg_routing_step_auto_org_id
  BEFORE INSERT OR UPDATE ON public.routing_template_steps
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_routing_step();

-- shift_assignments trigger
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_shift_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.shift_schedule_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.shift_schedules WHERE id = NEW.shift_schedule_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shift_assignment_auto_org_id ON public.shift_assignments;
CREATE TRIGGER trg_shift_assignment_auto_org_id
  BEFORE INSERT OR UPDATE ON public.shift_assignments
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_shift_assignment();

-- webhook_deliveries trigger
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_webhook_delivery()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.webhook_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.organization_webhooks WHERE id = NEW.webhook_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_webhook_delivery_auto_org_id ON public.webhook_deliveries;
CREATE TRIGGER trg_webhook_delivery_auto_org_id
  BEFORE INSERT OR UPDATE ON public.webhook_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_webhook_delivery();

-- ========== ISSUE 3: Enforce NOT NULL on 10 core tables ==========
-- (All currently have 0 NULL rows based on audit)

ALTER TABLE public.queue_items ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.stations ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.teams ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.team_members ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.handoff_records ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.work_order_routing ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.departments ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.job_performance_updates ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.queue_item_comments ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.queue_item_history ALTER COLUMN organization_id SET NOT NULL;

-- Also NOT NULL on 3 of the 4 new columns (current_station_status excluded - station_id can be NULL)
ALTER TABLE public.routing_template_steps ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.shift_assignments ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE public.webhook_deliveries ALTER COLUMN organization_id SET NOT NULL;

-- ========== ISSUE 4: Org-scoped name uniqueness ==========

CREATE UNIQUE INDEX IF NOT EXISTS teams_org_id_name_key
  ON public.teams (organization_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS quality_checkpoints_org_id_name_key
  ON public.quality_checkpoints (organization_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS saved_views_org_user_name_key
  ON public.saved_views (organization_id, user_id, name);

CREATE UNIQUE INDEX IF NOT EXISTS stations_org_id_name_key
  ON public.stations (organization_id, name);

-- ========== ISSUE 5: Drop duplicate index ==========

DROP INDEX IF EXISTS work_center_config_org_id_type_key;
