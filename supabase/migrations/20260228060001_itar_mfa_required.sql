-- ITAR v1.2: Add MFA enforcement flag to organizations
-- When mfa_required = true, all org members must enroll TOTP before
-- accessing org data. Enforced at the application layer via AuthContext.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS mfa_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_required_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS mfa_required_updated_by uuid REFERENCES auth.users(id);

COMMENT ON COLUMN organizations.mfa_required IS
  'When true, all members must complete Supabase MFA enrollment before accessing org data. Required for ITAR self-hosted deployments.';

-- Only org owners and admins can toggle the MFA requirement
CREATE POLICY "Org admins can update mfa_required"
  ON organizations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
        AND organization_members.role IN ('owner', 'admin')
    )
  );
