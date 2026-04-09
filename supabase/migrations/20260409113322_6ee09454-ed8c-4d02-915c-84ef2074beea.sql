
-- Fix 1: queue_item_comments INSERT - add org membership check
DROP POLICY IF EXISTS "Team members can add comments" ON public.queue_item_comments;
CREATE POLICY "Team members can add comments" ON public.queue_item_comments
FOR INSERT WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM queue_items qi
    WHERE qi.id = queue_item_comments.queue_item_id
      AND qi.organization_id IS NOT NULL
      AND is_org_member(auth.uid(), qi.organization_id)
  )
);

-- Fix 2: erp_connections - restrict org admin SELECT to safe view pattern
-- Drop the ALL policy and replace with separate INSERT/UPDATE/DELETE (no SELECT)
DROP POLICY IF EXISTS "Org admins can manage ERP connections" ON public.erp_connections;

CREATE POLICY "Org admins can insert ERP connections" ON public.erp_connections
FOR INSERT TO authenticated
WITH CHECK (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can update ERP connections" ON public.erp_connections
FOR UPDATE TO authenticated
USING (is_org_admin(auth.uid(), organization_id))
WITH CHECK (is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Org admins can delete ERP connections" ON public.erp_connections
FOR DELETE TO authenticated
USING (is_org_admin(auth.uid(), organization_id));

-- Org admins read via erp_connections_safe view (excludes encrypted credentials)
-- Grant SELECT on the safe view
GRANT SELECT ON public.erp_connections_safe TO authenticated;

-- Fix 3: Add UPDATE policies for storage buckets missing them
CREATE POLICY "ncr_attachments_update_own_files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'ncr-attachments'
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

CREATE POLICY "handoff_attachments_update_own_files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'handoff-attachments'
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

CREATE POLICY "part_images_update_own_files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'part-images'
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

CREATE POLICY "setup_sheets_update_own_files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'setup-sheets'
  AND (auth.uid())::text = (storage.foldername(name))[2]
);
