
CREATE OR REPLACE FUNCTION public._audit_onboarding_checklist_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.admin_audit_events
      (actor_id, event_category, event_action, target_type, target_id, target_label, previous_state, new_state, organization_id)
    VALUES (
      auth.uid(),
      'onboarding',
      'checklist_item_updated',
      'checklist_item',
      NEW.id,
      NEW.module_key,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status, 'engagement_id', NEW.engagement_id),
      NEW.organization_id
    );
  END IF;
  RETURN NEW;
END;
$function$;
