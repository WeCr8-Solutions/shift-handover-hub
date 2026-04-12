-- Flyer drop campaign tracking
-- Tables: flyer_campaigns, flyer_zones, flyer_drop_logs
-- Storage bucket: flyer-qr-codes (admin-only)
-- Campaign: san_diego_drop (22 zones, SD County)

-- ─────────────────────────────────────────────
-- 1. flyer_campaigns  (one row per campaign run)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flyer_campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,           -- e.g. "san_diego_drop"
  description   text,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','archived')),
  started_at    date,
  ended_at      date,
  total_zones   int NOT NULL DEFAULT 0,
  total_flyers  int NOT NULL DEFAULT 0,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 2. flyer_zones  (one row per zone per campaign)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flyer_zones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES flyer_campaigns(id) ON DELETE CASCADE,
  zone_number     int NOT NULL,
  zone_name       text NOT NULL,
  city            text NOT NULL,
  utm_content     text NOT NULL,
  full_utm_url    text NOT NULL,
  bitly_back_half text,
  bitly_short_url text,
  qr_filename     text,
  qr_storage_path text,                        -- path in flyer-qr-codes bucket
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','printed','dropped','active','complete')),
  flyer_count     int NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, zone_number)
);

-- ─────────────────────────────────────────────
-- 3. flyer_drop_logs  (each drop event)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flyer_drop_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    uuid NOT NULL REFERENCES flyer_campaigns(id) ON DELETE CASCADE,
  zone_id        uuid NOT NULL REFERENCES flyer_zones(id) ON DELETE CASCADE,
  dropped_by     uuid REFERENCES auth.users(id),
  dropped_at     timestamptz NOT NULL DEFAULT now(),
  flyer_count    int NOT NULL DEFAULT 0,
  business_count int NOT NULL DEFAULT 0,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 4. Results tracking columns on flyer_zones
--    (weekly fill-in: scans, signups, hires)
-- ─────────────────────────────────────────────
ALTER TABLE flyer_zones
  ADD COLUMN IF NOT EXISTS total_scans   int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_signups int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_hires   int NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────
-- 5. updated_at triggers
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_flyer_campaigns_updated_at ON flyer_campaigns;
CREATE TRIGGER trg_flyer_campaigns_updated_at
  BEFORE UPDATE ON flyer_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_flyer_zones_updated_at ON flyer_zones;
CREATE TRIGGER trg_flyer_zones_updated_at
  BEFORE UPDATE ON flyer_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────
-- 6. RLS — platform admin only
-- ─────────────────────────────────────────────
ALTER TABLE flyer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE flyer_zones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE flyer_drop_logs ENABLE ROW LEVEL SECURITY;

-- Helper: is the caller a platform admin?
-- Reuses the same roles check used elsewhere in this project.
CREATE POLICY "Platform admins full access — flyer_campaigns"
  ON flyer_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Platform admins full access — flyer_zones"
  ON flyer_zones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Platform admins full access — flyer_drop_logs"
  ON flyer_drop_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer')
    )
  );

-- ─────────────────────────────────────────────
-- 7. Seed: san_diego_drop campaign + 22 zones
-- ─────────────────────────────────────────────
INSERT INTO flyer_campaigns (name, slug, description, status, started_at, total_zones, total_flyers)
VALUES (
  'San Diego County Drop',
  'san_diego_drop',
  'Physical flyer drop across 22 industrial zones in San Diego County targeting machinists, CNC operators, gunsmiths, and aerospace workers.',
  'active',
  '2026-04-11',
  22,
  0
)
ON CONFLICT (slug) DO NOTHING;

-- Seed zones using a DO block so we can reference the campaign id
DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM flyer_campaigns WHERE slug = 'san_diego_drop';

  INSERT INTO flyer_zones (campaign_id, zone_number, zone_name, city, utm_content, full_utm_url, bitly_back_half, bitly_short_url, qr_filename) VALUES
  (cid, 1,  'Wheatlands / Abraham Way',                   'Santee',          'z01_santee_wheatlands',    'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z01_santee_wheatlands',    'jl-z01', 'https://bit.ly/jl-z01', 'qr_z01_santee_wheatlands.png'),
  (cid, 2,  'Prospect / Buena Vista / Kenney',             'Santee',          'z02_santee_prospect',      'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z02_santee_prospect',      'jl-z02', 'https://bit.ly/jl-z02', 'qr_z02_santee_prospect.png'),
  (cid, 3,  'Cuyamaca / Pathway / Woodside',               'Santee',          'z03_santee_cuyamaca',      'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z03_santee_cuyamaca',      'jl-z03', 'https://bit.ly/jl-z03', 'qr_z03_santee_cuyamaca.png'),
  (cid, 4,  'Magnolia Ave Industrial',                     'El Cajon',        'z04_elcajon_magnolia',     'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z04_elcajon_magnolia',     'jl-z04', 'https://bit.ly/jl-z04', 'qr_z04_elcajon_magnolia.png'),
  (cid, 5,  'Raleigh / Vernon / Marshall',                 'El Cajon',        'z05_elcajon_raleigh',      'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z05_elcajon_raleigh',      'jl-z05', 'https://bit.ly/jl-z05', 'qr_z05_elcajon_raleigh.png'),
  (cid, 6,  'Bradley / Greenfield / Pioneer',              'El Cajon',        'z06_elcajon_bradley',      'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z06_elcajon_bradley',      'jl-z06', 'https://bit.ly/jl-z06', 'qr_z06_elcajon_bradley.png'),
  (cid, 7,  'Gillespie Field Aerospace',                   'El Cajon',        'z07_elcajon_gillespie',    'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z07_elcajon_gillespie',    'jl-z07', 'https://bit.ly/jl-z07', 'qr_z07_elcajon_gillespie.png'),
  (cid, 8,  'Bond / Olde Hwy 80 / East El Cajon',         'El Cajon',        'z08_elcajon_bond',         'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z08_elcajon_bond',         'jl-z08', 'https://bit.ly/jl-z08', 'qr_z08_elcajon_bond.png'),
  (cid, 9,  'Woodside / Riverside / Winter Gardens / Maine Ave', 'Lakeside', 'z09_lakeside',             'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z09_lakeside',             'jl-z09', 'https://bit.ly/jl-z09', 'qr_z09_lakeside.png'),
  (cid, 10, 'La Mesa — Auto / CNC / Gunsmiths',            'La Mesa',         'z10_lamesa',               'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z10_lamesa',               'jl-z10', 'https://bit.ly/jl-z10', 'qr_z10_lamesa.png'),
  (cid, 11, 'Spring Valley / Rancho San Diego',            'Spring Valley',   'z11_springvalley',         'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z11_springvalley',         'jl-z11', 'https://bit.ly/jl-z11', 'qr_z11_springvalley.png'),
  (cid, 12, 'Poway Industrial Corridor',                   'Poway',           'z12_poway',                'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z12_poway',                'jl-z12', 'https://bit.ly/jl-z12', 'qr_z12_poway.png'),
  (cid, 13, 'Miramar / Mira Mesa CNC & Manufacturing',     'San Diego',       'z13_miramar',              'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z13_miramar',              'jl-z13', 'https://bit.ly/jl-z13', 'qr_z13_miramar.png'),
  (cid, 14, 'Firearms / Gunsmiths — Regional',             'San Diego County','z14_firearms_regional',   'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z14_firearms_regional',    'jl-z14', 'https://bit.ly/jl-z14', 'qr_z14_firearms_regional.png'),
  (cid, 15, 'Mission Gorge / Railroad — Santee North',     'Santee',          'z15_santee_missiongorge',  'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z15_santee_missiongorge',  'jl-z15', 'https://bit.ly/jl-z15', 'qr_z15_santee_missiongorge.png'),
  (cid, 16, 'Lemon Grove',                                 'Lemon Grove',     'z16_lemongrove',           'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z16_lemongrove',           'jl-z16', 'https://bit.ly/jl-z16', 'qr_z16_lemongrove.png'),
  (cid, 17, 'National City Industrial Corridor',           'National City',   'z17_nationalcity',         'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z17_nationalcity',         'jl-z17', 'https://bit.ly/jl-z17', 'qr_z17_nationalcity.png'),
  (cid, 18, 'Chula Vista',                                 'Chula Vista',     'z18_chulavista',           'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z18_chulavista',           'jl-z18', 'https://bit.ly/jl-z18', 'qr_z18_chulavista.png'),
  (cid, 19, 'Kearny Mesa / Convoy / Mission Valley',       'San Diego',       'z19_kearnymesa',           'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z19_kearnymesa',           'jl-z19', 'https://bit.ly/jl-z19', 'qr_z19_kearnymesa.png'),
  (cid, 20, 'Mid-City / South Park / Imperial Ave',        'San Diego',       'z20_midcity',              'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z20_midcity',              'jl-z20', 'https://bit.ly/jl-z20', 'qr_z20_midcity.png'),
  (cid, 21, 'Point Loma / Ocean Beach',                    'San Diego',       'z21_pointloma',            'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z21_pointloma',            'jl-z21', 'https://bit.ly/jl-z21', 'qr_z21_pointloma.png'),
  (cid, 22, 'Sorrento Valley / Mesa Rim',                  'San Diego',       'z22_sorrentovalley',       'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z22_sorrentovalley',       'jl-z22', 'https://bit.ly/jl-z22', 'qr_z22_sorrentovalley.png')
  ON CONFLICT (campaign_id, zone_number) DO NOTHING;
END $$;

-- ─────────────────────────────────────────────
-- 8. Storage bucket: flyer-qr-codes
--    (admin-only, not public)
-- ─────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'flyer-qr-codes',
  'flyer-qr-codes',
  false,
  2097152,            -- 2 MB per file
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Platform admins manage flyer QR codes"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'flyer-qr-codes'
    AND EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer')
    )
  );
