-- ITAR v1.2: US Person self-certification on user profiles
-- Records whether a user has self-certified as a US Person under
-- 22 C.F.R. § 120.15 (or holds an applicable export authorization).
-- This is a self-certification for audit trail purposes only.
-- Org admins can gate access until declaration is confirmed.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS us_person_declared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS us_person_declared_at timestamptz,
  ADD COLUMN IF NOT EXISTS us_person_declaration_ip inet,
  ADD COLUMN IF NOT EXISTS us_person_declaration_text text;

COMMENT ON COLUMN profiles.us_person_declared IS
  'True when the user has self-certified as a US Person per 22 C.F.R. §120.15 or holds applicable export authorization.';
COMMENT ON COLUMN profiles.us_person_declared_at IS
  'Timestamp of the self-certification. Immutable once set.';
COMMENT ON COLUMN profiles.us_person_declaration_ip IS
  'IP address at time of declaration for audit purposes.';
COMMENT ON COLUMN profiles.us_person_declaration_text IS
  'Exact declaration text the user agreed to at time of certification.';

-- Add requires_us_person_declaration to organizations so non-ITAR orgs
-- can opt out of requiring the declaration screen.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS requires_us_person_declaration boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN organizations.requires_us_person_declaration IS
  'When true, all org members must complete the US Person self-certification before accessing org data. Enable for ITAR deployments.';

-- Index for quick lookup in the declaration gate check
CREATE INDEX IF NOT EXISTS idx_profiles_us_person_declared
  ON profiles(user_id, us_person_declared);

-- Log declaration events in the activity_logs table (reuse existing structure)
-- activity_type will be 'us_person_declaration' — extend enum if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'us_person_declaration'
      AND enumtypid = 'activity_type'::regtype
  ) THEN
    ALTER TYPE activity_type ADD VALUE 'us_person_declaration';
  END IF;
END$$;
