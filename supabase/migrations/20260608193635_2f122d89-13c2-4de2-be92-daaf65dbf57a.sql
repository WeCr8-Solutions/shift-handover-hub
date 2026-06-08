
CREATE OR REPLACE FUNCTION public._audit_onboarding_checklist_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_actor uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    v_actor := auth.uid();
    IF v_actor IS NULL THEN
      SELECT assigned_admin_id INTO v_actor FROM public.onboarding_engagements WHERE id = NEW.engagement_id;
    END IF;
    IF v_actor IS NULL THEN
      SELECT created_by INTO v_actor FROM public.onboarding_engagements WHERE id = NEW.engagement_id;
    END IF;
    IF v_actor IS NULL THEN
      RETURN NEW;
    END IF;
    INSERT INTO public.admin_audit_events
      (actor_id, event_category, event_action, target_type, target_id, target_label, previous_state, new_state, organization_id)
    VALUES (
      v_actor, 'support', 'onboarding.checklist_item_updated', 'checklist_item',
      NEW.id, NEW.module_key,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status, 'engagement_id', NEW.engagement_id),
      NEW.organization_id
    );
  END IF;
  RETURN NEW;
END;
$function$;
