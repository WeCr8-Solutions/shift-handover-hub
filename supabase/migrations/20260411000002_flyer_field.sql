-- Flyer field checklist infrastructure
-- Tables: flyer_mediums, flyer_stop_visits, flyer_zone_assignments
-- Role:   flyer_worker (narrow access for authenticated field helpers)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. flyer_mediums  (pre-seeded flyer types)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flyer_mediums (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  sort_order  int NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO flyer_mediums (name, description, sort_order) VALUES
  ('Full-page Color 8.5×11',  'Standard full-page color flyer',           1),
  ('Half-page Color',         'Half-page color flyer (two per sheet)',     2),
  ('Business Card',           'Business card handout',                     3),
  ('Door Hanger',             'Die-cut door hanger',                       4)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE flyer_mediums ENABLE ROW LEVEL SECURITY;

-- All authenticated users with flyer access can read mediums
CREATE POLICY "Flyer workers read mediums"
  ON flyer_mediums FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer', 'flyer_worker')
    )
  );

-- Only platform admins can manage mediums
CREATE POLICY "Platform admins manage mediums"
  ON flyer_mediums FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. flyer_zone_assignments  (link a helper to one or more zones)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flyer_zone_assignments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         uuid NOT NULL REFERENCES flyer_campaigns(id) ON DELETE CASCADE,
  assignee_name       text NOT NULL,
  assignee_email      text,
  zone_numbers        int[] NOT NULL,                    -- e.g. {3, 4, 5}
  invite_token        uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  assigned_to_user_id uuid REFERENCES auth.users(id),   -- set once helper logs in
  assigned_by         uuid NOT NULL REFERENCES auth.users(id),
  notes               text,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_flyer_assignments_updated_at ON flyer_zone_assignments;
CREATE TRIGGER trg_flyer_assignments_updated_at
  BEFORE UPDATE ON flyer_zone_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE flyer_zone_assignments ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Platform admins manage assignments"
  ON flyer_zone_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer')
    )
  );

-- Helper can read their own assignment (matched by token OR by their user_id)
CREATE POLICY "Helper reads own assignment"
  ON flyer_zone_assignments FOR SELECT
  USING (
    assigned_to_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer', 'flyer_worker')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. flyer_stop_visits  (each logged stop visit in the field)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flyer_stop_visits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES flyer_campaigns(id) ON DELETE CASCADE,
  zone_id         uuid NOT NULL REFERENCES flyer_zones(id) ON DELETE CASCADE,
  zone_number     int NOT NULL,
  stop_key        text NOT NULL,                         -- matches DropStop.key in flyerRouteData.ts
  stop_name       text NOT NULL,                         -- denormalized for easy display
  medium_id       uuid REFERENCES flyer_mediums(id),
  medium_name     text,                                  -- denormalized snapshot
  flyer_count     int NOT NULL DEFAULT 0,
  visited_by      uuid NOT NULL REFERENCES auth.users(id),
  visited_by_name text,
  assignment_id   uuid REFERENCES flyer_zone_assignments(id),
  notes           text,
  visited_at      timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for fast zone lookups (mobile checklist load)
CREATE INDEX IF NOT EXISTS idx_stop_visits_campaign_zone
  ON flyer_stop_visits (campaign_id, zone_number);

CREATE INDEX IF NOT EXISTS idx_stop_visits_stop_key
  ON flyer_stop_visits (campaign_id, stop_key);

ALTER TABLE flyer_stop_visits ENABLE ROW LEVEL SECURITY;

-- Platform admins see everything
CREATE POLICY "Platform admins manage stop visits"
  ON flyer_stop_visits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer')
    )
  );

-- Helper can insert their own visits
CREATE POLICY "Helper inserts own visits"
  ON flyer_stop_visits FOR INSERT
  WITH CHECK (
    visited_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer', 'flyer_worker')
    )
  );

-- Helper can read all visits for their assigned campaign (to see checkmarks from other helpers)
CREATE POLICY "Helper reads campaign visits"
  ON flyer_stop_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer', 'flyer_worker')
    )
  );

-- Helper can update/delete only their own visits
CREATE POLICY "Helper modifies own visits"
  ON flyer_stop_visits FOR UPDATE
  USING (visited_by = auth.uid())
  WITH CHECK (visited_by = auth.uid());

CREATE POLICY "Helper deletes own visits"
  ON flyer_stop_visits FOR DELETE
  USING (visited_by = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. flyer_worker role — extend app_role ENUM
--    user_roles.role uses public.app_role ENUM (not a text check constraint).
--    ADD VALUE IF NOT EXISTS is safe and idempotent.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'flyer_worker';
