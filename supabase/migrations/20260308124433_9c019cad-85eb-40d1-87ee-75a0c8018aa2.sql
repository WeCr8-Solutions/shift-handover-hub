
-- Update can_act_as to allow supervisors (view-only) for same-org members
CREATE OR REPLACE FUNCTION public.can_act_as(_actor_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    _actor_id != _target_user_id
    AND (
      -- Platform admin or developer: full test access to any user
      public.is_dev_or_admin(_actor_id)
      -- Org owner/admin: view-only for same-org members
      OR EXISTS (
        SELECT 1
        FROM public.organization_members om_actor
        JOIN public.organization_members om_target
          ON om_actor.organization_id = om_target.organization_id
        WHERE om_actor.user_id = _actor_id
          AND om_target.user_id = _target_user_id
          AND om_actor.role IN ('owner', 'admin')
      )
      -- Supervisor: view-only for same-org members
      OR (
        public.has_role(_actor_id, 'supervisor')
        AND EXISTS (
          SELECT 1
          FROM public.organization_members om_actor
          JOIN public.organization_members om_target
            ON om_actor.organization_id = om_target.organization_id
          WHERE om_actor.user_id = _actor_id
            AND om_target.user_id = _target_user_id
        )
      )
    )
  )
$$;
