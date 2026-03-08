
-- Revert is_supervisor_in_org to NOT include engineering/programming
CREATE OR REPLACE FUNCTION public.is_supervisor_in_org(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.organization_members om ON om.user_id = ur.user_id
    WHERE ur.user_id = _user_id
      AND om.organization_id = _org_id
      AND ur.role = 'supervisor'
  )
$$;

-- New narrow function: can manage dimensions (engineering, programming, supervisor, admin)
CREATE OR REPLACE FUNCTION public.can_manage_dimensions(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    public.is_org_admin(_user_id, _org_id)
    OR public.is_supervisor_in_org(_user_id, _org_id)
    OR public.has_role(_user_id, 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.organization_members om ON om.user_id = ur.user_id
      WHERE ur.user_id = _user_id
        AND om.organization_id = _org_id
        AND ur.role IN ('engineering', 'programming')
    )
  )
$$;

-- Update RLS on routing_step_dimensions to allow engineering/programming
DROP POLICY IF EXISTS "Supervisors can manage routing dimensions" ON public.routing_step_dimensions;
CREATE POLICY "Authorized users can manage routing dimensions"
  ON public.routing_step_dimensions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.work_order_routing wor
      JOIN public.queue_items qi ON qi.id = wor.queue_item_id
      WHERE wor.id = routing_step_dimensions.routing_step_id
        AND qi.organization_id IS NOT NULL
        AND public.can_manage_dimensions(auth.uid(), qi.organization_id)
    )
  );

-- Update RLS on dimension_check_requests to allow engineering/programming to review
DROP POLICY IF EXISTS "Supervisors can review dimension check requests" ON public.dimension_check_requests;
CREATE POLICY "Dimension managers can review requests"
  ON public.dimension_check_requests FOR UPDATE TO authenticated
  USING (public.can_manage_dimensions(auth.uid(), organization_id));
