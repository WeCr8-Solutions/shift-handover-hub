
-- Add granular time tracking columns to queue_items
ALTER TABLE public.queue_items
  ADD COLUMN setup_time_minutes integer,
  ADD COLUMN first_article_minutes integer,
  ADD COLUMN cycle_time_minutes integer;

-- Add granular time tracking columns to work_order_routing
ALTER TABLE public.work_order_routing
  ADD COLUMN setup_time_minutes integer,
  ADD COLUMN first_article_minutes integer,
  ADD COLUMN cycle_time_minutes integer;

-- Add granular time tracking columns to routing_template_steps
ALTER TABLE public.routing_template_steps
  ADD COLUMN setup_time_minutes integer,
  ADD COLUMN first_article_minutes integer,
  ADD COLUMN cycle_time_minutes integer;

-- Auto-compute estimated_duration on queue_items
CREATE OR REPLACE FUNCTION public.compute_estimated_duration_queue_item()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Only recompute if any of the component fields changed (or on INSERT)
  IF TG_OP = 'INSERT'
     OR NEW.setup_time_minutes IS DISTINCT FROM OLD.setup_time_minutes
     OR NEW.first_article_minutes IS DISTINCT FROM OLD.first_article_minutes
     OR NEW.cycle_time_minutes IS DISTINCT FROM OLD.cycle_time_minutes
     OR NEW.quantity IS DISTINCT FROM OLD.quantity
  THEN
    -- Only auto-compute if at least one granular field is set
    IF NEW.setup_time_minutes IS NOT NULL
       OR NEW.first_article_minutes IS NOT NULL
       OR NEW.cycle_time_minutes IS NOT NULL
    THEN
      NEW.estimated_duration :=
        COALESCE(NEW.setup_time_minutes, 0)
        + COALESCE(NEW.first_article_minutes, 0)
        + (COALESCE(NEW.cycle_time_minutes, 0) * COALESCE(NEW.quantity, 1));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_compute_estimated_duration_queue_item
  BEFORE INSERT OR UPDATE ON public.queue_items
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_estimated_duration_queue_item();

-- Auto-compute estimated_duration on work_order_routing (uses parent queue item quantity)
CREATE OR REPLACE FUNCTION public.compute_estimated_duration_routing()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
DECLARE
  _quantity integer;
BEGIN
  IF TG_OP = 'INSERT'
     OR NEW.setup_time_minutes IS DISTINCT FROM OLD.setup_time_minutes
     OR NEW.first_article_minutes IS DISTINCT FROM OLD.first_article_minutes
     OR NEW.cycle_time_minutes IS DISTINCT FROM OLD.cycle_time_minutes
  THEN
    IF NEW.setup_time_minutes IS NOT NULL
       OR NEW.first_article_minutes IS NOT NULL
       OR NEW.cycle_time_minutes IS NOT NULL
    THEN
      -- Look up quantity from the parent queue item
      SELECT COALESCE(qi.quantity, 1) INTO _quantity
      FROM public.queue_items qi
      WHERE qi.id = NEW.queue_item_id;

      NEW.estimated_duration :=
        COALESCE(NEW.setup_time_minutes, 0)
        + COALESCE(NEW.first_article_minutes, 0)
        + (COALESCE(NEW.cycle_time_minutes, 0) * COALESCE(_quantity, 1));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_compute_estimated_duration_routing
  BEFORE INSERT OR UPDATE ON public.work_order_routing
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_estimated_duration_routing();
