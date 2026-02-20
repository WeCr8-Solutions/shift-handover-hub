
-- =============================================
-- MIGRATION: Org-Scoping & Name Reuse Hardening
-- =============================================

-- =============================================
-- PRIORITY 1: Add organization_id to tables missing it
-- =============================================

-- handoff_records
ALTER TABLE public.handoff_records 
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

UPDATE public.handoff_records hr
SET organization_id = t.organization_id
FROM public.teams t WHERE t.id = hr.team_id AND hr.organization_id IS NULL;

-- work_order_routing
ALTER TABLE public.work_order_routing 
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

UPDATE public.work_order_routing wor
SET organization_id = qi.organization_id
FROM public.queue_items qi WHERE qi.id = wor.queue_item_id AND wor.organization_id IS NULL;

-- job_performance_updates
ALTER TABLE public.job_performance_updates 
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

UPDATE public.job_performance_updates jpu
SET organization_id = t.organization_id
FROM public.teams t WHERE t.id = jpu.team_id AND jpu.organization_id IS NULL;

-- activity_logs: add org + team columns
ALTER TABLE public.activity_logs 
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.activity_logs 
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id);

UPDATE public.activity_logs al
SET organization_id = om.organization_id
FROM public.organization_members om WHERE om.user_id = al.user_id AND al.organization_id IS NULL;

-- departments
ALTER TABLE public.departments 
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

UPDATE public.departments d
SET organization_id = t.organization_id
FROM public.teams t WHERE t.id = d.team_id AND d.organization_id IS NULL;

-- queue_item_comments
ALTER TABLE public.queue_item_comments 
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

UPDATE public.queue_item_comments qic
SET organization_id = qi.organization_id
FROM public.queue_items qi WHERE qi.id = qic.queue_item_id AND qic.organization_id IS NULL;

-- queue_item_history
ALTER TABLE public.queue_item_history 
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

UPDATE public.queue_item_history qih
SET organization_id = qi.organization_id
FROM public.queue_items qi WHERE qi.id = qih.queue_item_id AND qih.organization_id IS NULL;

-- =============================================
-- PRIORITY 3: Org-Scoped Unique Constraints
-- =============================================

-- Departments: unique name per team
CREATE UNIQUE INDEX IF NOT EXISTS departments_team_id_name_key 
  ON public.departments (team_id, name);

-- Routing templates: unique name per org
CREATE UNIQUE INDEX IF NOT EXISTS routing_templates_org_id_name_key 
  ON public.routing_templates (organization_id, name);

-- Shift schedules: unique shift_name per org  
CREATE UNIQUE INDEX IF NOT EXISTS shift_schedules_org_id_name_key 
  ON public.shift_schedules (organization_id, shift_name);

-- Work center config: one config per type per org
CREATE UNIQUE INDEX IF NOT EXISTS work_center_config_org_id_type_key 
  ON public.work_center_config (organization_id, work_center_type);

-- =============================================
-- Auto-Populate Triggers
-- =============================================

-- handoff_records: populate org_id from team_id
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_handoff()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.team_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.teams WHERE id = NEW.team_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handoff_auto_org_id ON public.handoff_records;
CREATE TRIGGER trg_handoff_auto_org_id
  BEFORE INSERT OR UPDATE ON public.handoff_records
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_handoff();

-- work_order_routing: populate org_id from queue_item_id
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_routing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.queue_item_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.queue_items WHERE id = NEW.queue_item_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_routing_auto_org_id ON public.work_order_routing;
CREATE TRIGGER trg_routing_auto_org_id
  BEFORE INSERT OR UPDATE ON public.work_order_routing
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_routing();

-- departments: populate org_id from team_id (reuse existing function)
DROP TRIGGER IF EXISTS trg_departments_auto_org_id ON public.departments;
CREATE TRIGGER trg_departments_auto_org_id
  BEFORE INSERT OR UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_from_team();

-- job_performance_updates: populate org_id from team_id
DROP TRIGGER IF EXISTS trg_jpu_auto_org_id ON public.job_performance_updates;
CREATE TRIGGER trg_jpu_auto_org_id
  BEFORE INSERT OR UPDATE ON public.job_performance_updates
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_from_team();

-- queue_item_comments & history: populate org_id from queue_item_id
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_from_queue_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.queue_item_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id FROM public.queue_items WHERE id = NEW.queue_item_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comments_auto_org_id ON public.queue_item_comments;
CREATE TRIGGER trg_comments_auto_org_id
  BEFORE INSERT OR UPDATE ON public.queue_item_comments
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_from_queue_item();

DROP TRIGGER IF EXISTS trg_history_auto_org_id ON public.queue_item_history;
CREATE TRIGGER trg_history_auto_org_id
  BEFORE INSERT OR UPDATE ON public.queue_item_history
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_from_queue_item();

-- activity_logs: populate org_id from user's org membership
CREATE OR REPLACE FUNCTION public.auto_populate_org_id_for_activity_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.organization_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM public.organization_members WHERE user_id = NEW.user_id LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activity_log_auto_org_id ON public.activity_logs;
CREATE TRIGGER trg_activity_log_auto_org_id
  BEFORE INSERT ON public.activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.auto_populate_org_id_for_activity_log();
