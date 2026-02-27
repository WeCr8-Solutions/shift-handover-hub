
-- 1. Create missing authorization helper functions for work order RPC

CREATE OR REPLACE FUNCTION public.can_supervisor_override_in_org(
  _user_id uuid, 
  _org_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT (
    public.is_org_admin(_user_id, _org_id)
    OR public.is_supervisor_in_org(_user_id, _org_id)
    OR public.has_role(_user_id, 'admin'::public.app_role)
  )
$$;

CREATE OR REPLACE FUNCTION public.can_operator_act_on_station(
  _user_id uuid, 
  _station_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.operator_station_sessions
    WHERE user_id = _user_id
      AND station_id = _station_id
      AND is_active = true
      AND checked_out_at IS NULL
  )
$$;

-- 2. Fix stripe_events overly permissive RLS policy

DROP POLICY IF EXISTS "Service role can manage stripe events" ON public.stripe_events;

CREATE POLICY "Platform admins can view stripe events"
ON public.stripe_events FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Developers can view stripe events"
ON public.stripe_events FOR SELECT
USING (public.has_role(auth.uid(), 'developer'::public.app_role));

-- 3. Add explicit deny policies for subscriptions table writes

CREATE POLICY "Deny user inserts on subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Deny user updates on subscriptions"
ON public.subscriptions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Deny user deletes on subscriptions"
ON public.subscriptions FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
