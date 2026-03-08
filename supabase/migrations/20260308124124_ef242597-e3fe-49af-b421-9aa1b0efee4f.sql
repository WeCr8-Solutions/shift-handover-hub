
-- Authorization function: can this actor impersonate the target user?
-- Org admins: same-org members only
-- Platform admins/developers: any user (but we scope to same org in UI)
CREATE OR REPLACE FUNCTION public.can_act_as(_actor_id uuid, _target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    -- Cannot act as yourself
    _actor_id != _target_user_id
    AND (
      -- Platform admin or developer can act as anyone
      public.is_dev_or_admin(_actor_id)
      -- Org admin can act as members of their own org
      OR EXISTS (
        SELECT 1
        FROM public.organization_members om_actor
        JOIN public.organization_members om_target
          ON om_actor.organization_id = om_target.organization_id
        WHERE om_actor.user_id = _actor_id
          AND om_target.user_id = _target_user_id
          AND om_actor.role IN ('owner', 'admin')
      )
    )
  )
$$;

-- Audit table for act_as usage (rate limiting + traceability)
CREATE TABLE IF NOT EXISTS public.act_as_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  target_display_name text,
  organization_id uuid REFERENCES public.organizations(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.act_as_sessions ENABLE ROW LEVEL SECURITY;

-- Only platform admins/developers can read all sessions; org admins can read their own
CREATE POLICY "act_as_sessions_select" ON public.act_as_sessions
  FOR SELECT TO authenticated
  USING (
    actor_id = auth.uid()
    OR public.is_dev_or_admin(auth.uid())
  );

CREATE POLICY "act_as_sessions_insert" ON public.act_as_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND public.can_act_as(auth.uid(), target_user_id)
  );

CREATE POLICY "act_as_sessions_update" ON public.act_as_sessions
  FOR UPDATE TO authenticated
  USING (actor_id = auth.uid())
  WITH CHECK (actor_id = auth.uid());
