
-- Migration 3: Create data_access_logs table for ITAR audit trail
CREATE TABLE IF NOT EXISTS public.data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id),
  table_name text NOT NULL,
  record_id text,
  operation text NOT NULL,  -- READ, WRITE, DELETE, EXPORT
  user_display_name text,
  user_email text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_data_access_logs_org_date
  ON public.data_access_logs (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_user
  ON public.data_access_logs (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;

-- Insert: authenticated users can log their own access
CREATE POLICY "Users can insert own access logs"
  ON public.data_access_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Select: org admins and platform admins/devs can read logs for their org
CREATE POLICY "Org admins can read org access logs"
  ON public.data_access_logs FOR SELECT TO authenticated
  USING (
    public.is_dev_or_admin(auth.uid())
    OR (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id))
  );

-- No UPDATE or DELETE — audit logs are immutable
COMMENT ON TABLE public.data_access_logs IS 'Immutable audit log for ITAR data access traceability. No updates or deletes allowed.';
