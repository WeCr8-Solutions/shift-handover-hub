-- Create a dedicated helper function for dev/admin access checking
-- This follows the same pattern as has_role() but provides a cleaner interface
CREATE OR REPLACE FUNCTION public.is_dev_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'developer')
  )
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_dev_or_admin(uuid) TO authenticated;

-- Drop existing policies on dev_issue_queue to replace with more granular ones
DROP POLICY IF EXISTS "Devs can view queue" ON public.dev_issue_queue;
DROP POLICY IF EXISTS "Devs can manage queue" ON public.dev_issue_queue;

-- Create granular RLS policies using the new helper function
-- SELECT: Devs and admins can view all queue items
CREATE POLICY "dev_queue_select_policy" ON public.dev_issue_queue
  FOR SELECT
  TO authenticated
  USING (is_dev_or_admin(auth.uid()));

-- INSERT: Devs and admins can add items to queue
CREATE POLICY "dev_queue_insert_policy" ON public.dev_issue_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (is_dev_or_admin(auth.uid()));

-- UPDATE: Devs can update their own assignments, admins can update all
CREATE POLICY "dev_queue_update_policy" ON public.dev_issue_queue
  FOR UPDATE
  TO authenticated
  USING (
    is_dev_or_admin(auth.uid())
    AND (
      -- Admins can update anything
      has_role(auth.uid(), 'admin')
      -- Developers can update items assigned to them or unassigned
      OR assigned_developer_id IS NULL
      OR assigned_developer_id = auth.uid()
    )
  );

-- DELETE: Only admins can remove items from queue
CREATE POLICY "dev_queue_delete_policy" ON public.dev_issue_queue
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Add comment documenting the security model
COMMENT ON FUNCTION public.is_dev_or_admin IS 'Security helper: Returns true if user has admin or developer platform role. Used for RLS on developer-only resources.';