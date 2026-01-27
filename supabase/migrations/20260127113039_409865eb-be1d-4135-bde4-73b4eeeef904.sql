-- Org-scoped RLS for queue_items (work orders), work_order_routing, and enhanced job_performance_updates

-- ============================================
-- QUEUE ITEMS (Work Orders) - Org Admin/Supervisor Access
-- ============================================

-- Org admins can manage all queue items in their organization
CREATE POLICY "Org admins can manage org queue items"
ON public.queue_items FOR ALL
USING (
  organization_id IS NOT NULL 
  AND is_org_admin(auth.uid(), organization_id)
);

-- Org supervisors can view queue items in their organization
CREATE POLICY "Org supervisors can view org queue items"
ON public.queue_items FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND is_supervisor_in_org(auth.uid(), organization_id)
);

-- Org supervisors can update queue items (status changes, assignments, etc.)
CREATE POLICY "Org supervisors can update org queue items"
ON public.queue_items FOR UPDATE
USING (
  organization_id IS NOT NULL 
  AND is_supervisor_in_org(auth.uid(), organization_id)
);

-- Org supervisors can create queue items in their organization
CREATE POLICY "Org supervisors can create org queue items"
ON public.queue_items FOR INSERT
WITH CHECK (
  organization_id IS NOT NULL 
  AND is_supervisor_in_org(auth.uid(), organization_id)
);

-- ============================================
-- WORK ORDER ROUTING - Org Admin/Supervisor Access
-- ============================================

-- Org admins can manage all routing steps
CREATE POLICY "Org admins can manage org routing"
ON public.work_order_routing FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.queue_items qi
    WHERE qi.id = work_order_routing.queue_item_id
    AND qi.organization_id IS NOT NULL
    AND is_org_admin(auth.uid(), qi.organization_id)
  )
);

-- Org supervisors can view routing in their organization
CREATE POLICY "Org supervisors can view org routing"
ON public.work_order_routing FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.queue_items qi
    WHERE qi.id = work_order_routing.queue_item_id
    AND qi.organization_id IS NOT NULL
    AND is_supervisor_in_org(auth.uid(), qi.organization_id)
  )
);

-- Org supervisors can update routing (status changes, moves, stoppages)
CREATE POLICY "Org supervisors can update org routing"
ON public.work_order_routing FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.queue_items qi
    WHERE qi.id = work_order_routing.queue_item_id
    AND qi.organization_id IS NOT NULL
    AND is_supervisor_in_org(auth.uid(), qi.organization_id)
  )
);

-- Org supervisors can create routing steps
CREATE POLICY "Org supervisors can create org routing"
ON public.work_order_routing FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.queue_items qi
    WHERE qi.id = work_order_routing.queue_item_id
    AND qi.organization_id IS NOT NULL
    AND is_supervisor_in_org(auth.uid(), qi.organization_id)
  )
);

-- ============================================
-- QUEUE ITEM HISTORY - Org Admin/Supervisor Access
-- ============================================

-- Org admins can view all history in their organization
CREATE POLICY "Org admins can view org queue history"
ON public.queue_item_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.queue_items qi
    WHERE qi.id = queue_item_history.queue_item_id
    AND qi.organization_id IS NOT NULL
    AND is_org_admin(auth.uid(), qi.organization_id)
  )
);

-- Org supervisors can view history in their organization
CREATE POLICY "Org supervisors can view org queue history"
ON public.queue_item_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.queue_items qi
    WHERE qi.id = queue_item_history.queue_item_id
    AND qi.organization_id IS NOT NULL
    AND is_supervisor_in_org(auth.uid(), qi.organization_id)
  )
);

-- Org admins can insert history entries
CREATE POLICY "Org admins can insert org queue history"
ON public.queue_item_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.queue_items qi
    WHERE qi.id = queue_item_history.queue_item_id
    AND qi.organization_id IS NOT NULL
    AND is_org_admin(auth.uid(), qi.organization_id)
  )
);

-- Org supervisors can insert history entries
CREATE POLICY "Org supervisors can insert org queue history"
ON public.queue_item_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.queue_items qi
    WHERE qi.id = queue_item_history.queue_item_id
    AND qi.organization_id IS NOT NULL
    AND is_supervisor_in_org(auth.uid(), qi.organization_id)
  )
);

-- ============================================
-- QUEUE ITEM COMMENTS - Org Admin/Supervisor Access
-- ============================================

-- Org admins can view all comments in their organization
CREATE POLICY "Org admins can view org queue comments"
ON public.queue_item_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.queue_items qi
    WHERE qi.id = queue_item_comments.queue_item_id
    AND qi.organization_id IS NOT NULL
    AND is_org_admin(auth.uid(), qi.organization_id)
  )
);

-- Org supervisors can view comments in their organization
CREATE POLICY "Org supervisors can view org queue comments"
ON public.queue_item_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.queue_items qi
    WHERE qi.id = queue_item_comments.queue_item_id
    AND qi.organization_id IS NOT NULL
    AND is_supervisor_in_org(auth.uid(), qi.organization_id)
  )
);

-- Org admins can add comments
CREATE POLICY "Org admins can add org queue comments"
ON public.queue_item_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.queue_items qi
    WHERE qi.id = queue_item_comments.queue_item_id
    AND qi.organization_id IS NOT NULL
    AND is_org_admin(auth.uid(), qi.organization_id)
  )
);

-- Org supervisors can add comments
CREATE POLICY "Org supervisors can add org queue comments"
ON public.queue_item_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.queue_items qi
    WHERE qi.id = queue_item_comments.queue_item_id
    AND qi.organization_id IS NOT NULL
    AND is_supervisor_in_org(auth.uid(), qi.organization_id)
  )
);

-- ============================================
-- JOB PERFORMANCE UPDATES - Org Admin Access for Review/Assignment
-- ============================================

-- Org admins can view all performance updates in their organization
CREATE POLICY "Org admins can view org performance updates"
ON public.job_performance_updates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = job_performance_updates.team_id
    AND t.organization_id IS NOT NULL
    AND is_org_admin(auth.uid(), t.organization_id)
  )
);

-- Org admins can update/review performance updates (approve, reject, assign)
CREATE POLICY "Org admins can update org performance updates"
ON public.job_performance_updates FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.teams t
    WHERE t.id = job_performance_updates.team_id
    AND t.organization_id IS NOT NULL
    AND is_org_admin(auth.uid(), t.organization_id)
  )
);

-- Org supervisors can view updates via existing is_supervisor_for_team policy (already exists)
-- Org supervisors can update via existing policy (already exists)