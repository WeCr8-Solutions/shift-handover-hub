-- flyer_stop_visits + flyer_mediums
-- Adds per-business visit history with interaction flags, contact name, and point-of-contact tracking.
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. flyer_mediums
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flyer_mediums (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  sort_order  int  NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.flyer_mediums (name, description, sort_order) VALUES
  ('Full-page Color 8.5×11',  'Standard full-page color flyer',        1),
  ('Half-page Color',         'Half-page color flyer (two per sheet)',  2),
  ('Business Card',           'Business card handout',                  3),
  ('Door Hanger',             'Die-cut door hanger',                    4)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.flyer_mediums ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'flyer_mediums' AND policyname = 'Flyer workers read mediums'
  ) THEN
    CREATE POLICY "Flyer workers read mediums"
      ON public.flyer_mediums FOR SELECT TO authenticated
      USING (
        public.is_dev_or_admin(auth.uid())
        OR public.has_role(auth.uid(), 'flyer_worker'::public.app_role)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'flyer_mediums' AND policyname = 'Platform admins manage mediums'
  ) THEN
    CREATE POLICY "Platform admins manage mediums"
      ON public.flyer_mediums FOR ALL TO authenticated
      USING (public.is_dev_or_admin(auth.uid()))
      WITH CHECK (public.is_dev_or_admin(auth.uid()));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. flyer_stop_visits
--    One row per visit to a business stop.
--    Multiple rows per stop_key are intentional — full running history.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.flyer_stop_visits (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      uuid NOT NULL REFERENCES public.flyer_campaigns(id)  ON DELETE CASCADE,
  zone_id          uuid NOT NULL REFERENCES public.flyer_zones(id)       ON DELETE CASCADE,
  zone_number      int  NOT NULL,
  stop_key         text NOT NULL,           -- stable slug from flyerRouteData.ts
  stop_name        text NOT NULL,           -- denormalized for display
  medium_id        uuid REFERENCES public.flyer_mediums(id),
  medium_name      text,                    -- snapshot at time of visit
  flyer_count      int  NOT NULL DEFAULT 0,
  -- Interaction detail
  interaction_flags text[] NOT NULL DEFAULT '{}',
  -- Flags (any subset):
  --   spoke_to_person     left_front_desk     left_lobby
  --   left_with_manager   qr_scanned          follow_up
  --   no_one_available    closed              not_interested
  contact_name     text,                    -- name of person spoken to
  contact_title    text,                    -- their role / title
  -- Metadata
  visited_by       uuid NOT NULL REFERENCES auth.users(id),
  visited_by_name  text,
  assignment_id    uuid REFERENCES public.flyer_zone_assignments(id),
  notes            text,
  visited_at       timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- In case the table was created by an earlier migration without the new columns:
ALTER TABLE public.flyer_stop_visits ADD COLUMN IF NOT EXISTS interaction_flags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.flyer_stop_visits ADD COLUMN IF NOT EXISTS contact_name  text;
ALTER TABLE public.flyer_stop_visits ADD COLUMN IF NOT EXISTS contact_title text;

CREATE INDEX IF NOT EXISTS idx_stop_visits_campaign_zone
  ON public.flyer_stop_visits (campaign_id, zone_number);

CREATE INDEX IF NOT EXISTS idx_stop_visits_stop_key
  ON public.flyer_stop_visits (campaign_id, stop_key, visited_at DESC);

ALTER TABLE public.flyer_stop_visits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'flyer_stop_visits' AND policyname = 'Admins manage stop visits'
  ) THEN
    CREATE POLICY "Admins manage stop visits"
      ON public.flyer_stop_visits FOR ALL TO authenticated
      USING (public.is_dev_or_admin(auth.uid()))
      WITH CHECK (public.is_dev_or_admin(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'flyer_stop_visits' AND policyname = 'Flyer workers insert own visits'
  ) THEN
    CREATE POLICY "Flyer workers insert own visits"
      ON public.flyer_stop_visits FOR INSERT TO authenticated
      WITH CHECK (
        visited_by = auth.uid()
        AND (
          public.is_dev_or_admin(auth.uid())
          OR public.has_role(auth.uid(), 'flyer_worker'::public.app_role)
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'flyer_stop_visits' AND policyname = 'Flyer workers read campaign visits'
  ) THEN
    CREATE POLICY "Flyer workers read campaign visits"
      ON public.flyer_stop_visits FOR SELECT TO authenticated
      USING (
        public.is_dev_or_admin(auth.uid())
        OR public.has_role(auth.uid(), 'flyer_worker'::public.app_role)
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'flyer_stop_visits' AND policyname = 'Flyer workers modify own visits'
  ) THEN
    CREATE POLICY "Flyer workers modify own visits"
      ON public.flyer_stop_visits FOR UPDATE TO authenticated
      USING (visited_by = auth.uid())
      WITH CHECK (visited_by = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'flyer_stop_visits' AND policyname = 'Flyer workers delete own visits'
  ) THEN
    CREATE POLICY "Flyer workers delete own visits"
      ON public.flyer_stop_visits FOR DELETE TO authenticated
      USING (visited_by = auth.uid());
  END IF;
END $$;
