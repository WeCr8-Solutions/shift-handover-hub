-- ITAR v1.2: Data access audit log table
-- Records reads and writes to ITAR-sensitive tables so compliance officers
-- can demonstrate who accessed controlled technical data and when.

CREATE TABLE IF NOT EXISTS data_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  record_id uuid,
  operation text NOT NULL CHECK (operation IN ('READ', 'WRITE', 'DELETE', 'EXPORT')),
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address inet,
  user_display_name text,
  user_email text,
  metadata jsonb
);

COMMENT ON TABLE data_access_logs IS
  'Audit trail for reads/writes to ITAR-sensitive tables (queue_items, handoff_records, stations, etc.). Required for ITAR compliance.';

-- Indexes for common access patterns
CREATE INDEX IF NOT EXISTS idx_data_access_logs_org_time
  ON data_access_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_user_time
  ON data_access_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_table_time
  ON data_access_logs(table_name, created_at DESC);

-- RLS: Users can only see their own org's access logs
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can read data_access_logs"
  ON data_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = data_access_logs.organization_id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer')
    )
  );

-- Application inserts logs using service role key — no user INSERT policy needed
-- (logs are written server-side to prevent tampering)

-- Auto-purge policy: retain logs for 2 years (configurable per org in future)
-- This is implemented at the application layer via a scheduled function.
-- The table has no automatic deletion — org admins export and manage retention.
