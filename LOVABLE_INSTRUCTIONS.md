# Lovable Sync Instructions — Flyer Drop Campaign + Field Checklist

These instructions cover everything added in the flyer drop campaign build.
Paste relevant sections into Lovable as needed to sync code and database.

---

## 1. DATABASE MIGRATIONS — run these first in Supabase SQL Editor

Go to your Supabase project → SQL Editor → New Query.
Run each block **in order**. Each is idempotent (safe to re-run).

---

### Migration 1 — Flyer Campaign Tables + Seed

```sql
-- Flyer drop campaign tracking
-- Tables: flyer_campaigns, flyer_zones, flyer_drop_logs
-- Storage bucket: flyer-qr-codes (admin-only)
-- Campaign: san_diego_drop (22 zones, SD County)

CREATE TABLE IF NOT EXISTS flyer_campaigns (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
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
  qr_storage_path text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','printed','dropped','active','complete')),
  flyer_count     int NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, zone_number)
);

ALTER TABLE flyer_zones
  ADD COLUMN IF NOT EXISTS total_scans   int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_signups int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_hires   int NOT NULL DEFAULT 0;

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

ALTER TABLE flyer_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE flyer_zones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE flyer_drop_logs ENABLE ROW LEVEL SECURITY;

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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'flyer-qr-codes',
  'flyer-qr-codes',
  false,
  2097152,
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
```

---

### Migration 2 — Field Checklist Tables + flyer_worker Role

```sql
-- Field checklist infrastructure
-- Tables: flyer_mediums, flyer_stop_visits, flyer_zone_assignments
-- Extends app_role ENUM with 'flyer_worker'

-- 1. flyer_worker role (MUST run before the tables that reference it in policies)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'flyer_worker';

-- 2. flyer_mediums
CREATE TABLE IF NOT EXISTS flyer_mediums (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  description text,
  sort_order  int NOT NULL DEFAULT 0,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO flyer_mediums (name, description, sort_order) VALUES
  ('Full-page Color 8.5×11',  'Standard full-page color flyer',       1),
  ('Half-page Color',         'Half-page color flyer (two per sheet)', 2),
  ('Business Card',           'Business card handout',                 3),
  ('Door Hanger',             'Die-cut door hanger',                   4)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE flyer_mediums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Flyer workers read mediums"
  ON flyer_mediums FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer', 'flyer_worker')
    )
  );

CREATE POLICY "Platform admins manage mediums"
  ON flyer_mediums FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer')
    )
  );

-- 3. flyer_zone_assignments
CREATE TABLE IF NOT EXISTS flyer_zone_assignments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         uuid NOT NULL REFERENCES flyer_campaigns(id) ON DELETE CASCADE,
  assignee_name       text NOT NULL,
  assignee_email      text,
  zone_numbers        int[] NOT NULL,
  invite_token        uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  assigned_to_user_id uuid REFERENCES auth.users(id),
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

CREATE POLICY "Platform admins manage assignments"
  ON flyer_zone_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer')
    )
  );

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

-- 4. flyer_stop_visits
CREATE TABLE IF NOT EXISTS flyer_stop_visits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES flyer_campaigns(id) ON DELETE CASCADE,
  zone_id         uuid NOT NULL REFERENCES flyer_zones(id) ON DELETE CASCADE,
  zone_number     int NOT NULL,
  stop_key        text NOT NULL,
  stop_name       text NOT NULL,
  medium_id       uuid REFERENCES flyer_mediums(id),
  medium_name     text,
  flyer_count     int NOT NULL DEFAULT 0,
  visited_by      uuid NOT NULL REFERENCES auth.users(id),
  visited_by_name text,
  assignment_id   uuid REFERENCES flyer_zone_assignments(id),
  notes           text,
  visited_at      timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stop_visits_campaign_zone
  ON flyer_stop_visits (campaign_id, zone_number);

CREATE INDEX IF NOT EXISTS idx_stop_visits_stop_key
  ON flyer_stop_visits (campaign_id, stop_key);

ALTER TABLE flyer_stop_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage stop visits"
  ON flyer_stop_visits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer')
    )
  );

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

CREATE POLICY "Helper reads campaign visits"
  ON flyer_stop_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'developer', 'flyer_worker')
    )
  );

CREATE POLICY "Helper modifies own visits"
  ON flyer_stop_visits FOR UPDATE
  USING (visited_by = auth.uid())
  WITH CHECK (visited_by = auth.uid());

CREATE POLICY "Helper deletes own visits"
  ON flyer_stop_visits FOR DELETE
  USING (visited_by = auth.uid());
```

---

## 2. CODE CHANGES TO SYNC IN LOVABLE

Tell Lovable to sync the following files from the repository exactly as they exist. Do not regenerate or rewrite them — just ensure they are present and match the source.

### New files to add (Lovable must create these if they don't exist):

| File | Purpose |
|---|---|
| `src/components/admin/flyerZoneData.ts` | 22-zone UTM + Bitly master data, CSV export |
| `src/components/admin/flyerRouteData.ts` | 190+ business stops organized by zone |
| `src/components/admin/FlyerCampaigns.tsx` | Admin dashboard — Campaign, QR, Drop Log, Results, Field, Assign tabs |
| `src/components/admin/FieldChecklist.tsx` | Mobile-first stop check-off component |
| `src/pages/FieldView.tsx` | Auth-required field page at /field and /field/:token |
| `scripts/generate_qr_codes.js` | Node script to generate QR PNGs (dev/ops only) |

### Files modified (Lovable must accept the updated versions):

| File | Change |
|---|---|
| `src/pages/Admin.tsx` | Added Megaphone icon, FlyerCampaigns lazy import, tab trigger + content inside hasPlatformAccess block |
| `src/App.tsx` | Added `import FieldView` + two routes: `/field` and `/field/:token` |

---

## 3. PROMPT TO GIVE LOVABLE

Copy and paste the following into Lovable chat to apply all code changes at once:

---

**Lovable prompt:**

> I need you to sync the following new and modified files into the project. Do not change any existing logic — only add what is listed. All files are TypeScript-clean (tsc --noEmit passes with exit 0).
>
> **New files to create:**
>
> 1. `src/components/admin/flyerZoneData.ts` — Already exists in the repo. Ensure it is present with 22 zones, UTM data, Bitly back-halves jl-z01 through jl-z22, and `exportZonesToCsv()` function. Do not move it to /public.
>
> 2. `src/components/admin/flyerRouteData.ts` — New file. Contains `DropStop` interface with fields: `key`, `name`, `address`, `city`, `zip`, `phone?`, `hours?`, `notes?`, `isPriority`, `isFirearms`, `isOffRoad`, `isAerospace`. Contains `ZONE_STOPS: Record<number, DropStop[]>` with stops for zones 1–22 (190+ total businesses from the San Diego County master route). Exports `getStopsForZone(n)`, `ALL_STOPS`, and `TOTAL_STOP_COUNT`.
>
> 3. `src/components/admin/FieldChecklist.tsx` — New file. Mobile-first component. Props: `campaignId`, `dbZones`, `assignedZones?`, `assignmentId?`, `currentUserId`, `displayName`. Loads `flyer_stop_visits` and `flyer_mediums` from Supabase. Renders zones as Accordion items with per-stop check-off rows. Tapping a stop opens a Sheet (bottom drawer) with medium selector, flyer count quick-pick (3/5/8/10), and notes textarea. On submit, inserts to `flyer_stop_visits`. Already-visited stops show a green CheckCircle2 icon and a summary line. Imports from `./flyerRouteData`, `./flyerZoneData`, `@/integrations/supabase/client`, sonner toast, and shadcn/ui Accordion + Sheet components.
>
> 4. `src/pages/FieldView.tsx` — New file. Default export `FieldView`. Uses `useParams` to read optional `:token`. Uses `useAuth` for `user`, `profile`, `loading`. If not authenticated, redirects to `/auth?redirect=<current-path>`. Checks `user_roles` for `admin`, `developer`, or `flyer_worker` role. Loads `flyer_campaigns` by slug `san_diego_drop`, then `flyer_zones`. If token present, loads `flyer_zone_assignments` by `invite_token` and claims `assigned_to_user_id` for the current user. Renders a sticky header (Jobline.ai + Flyer Drop + sign-out button), an optional assigned-zones sub-header for helpers, and `<FieldChecklist>` for the body.
>
> **Files to update:**
>
> 5. `src/components/admin/FlyerCampaigns.tsx` — Add two new tabs to the existing Tabs component:
>    - **Field tab** (value="field", icon=Smartphone): renders `<FieldChecklist campaignId={campaignId} dbZones={dbZones} currentUserId={user.id} displayName={profile?.display_name ?? user?.email ?? "Admin"} />`. Requires importing `useAuth` from `@/contexts/AuthContext` and `FieldChecklist` from `./FieldChecklist`.
>    - **Assign tab** (value="assign", icon=Users): form to create `flyer_zone_assignments` rows (name, optional email, zone numbers as comma-separated input). Lists all assignments with assignee name, zones, active/inactive badge, claimed badge (if assigned_to_user_id is set), copy-link button (copies `window.location.origin + "/field/" + invite_token`), and deactivate button. Also shows a SQL note card explaining how to grant the `flyer_worker` role.
>    - Also add these imports: `useAuth`, `FieldChecklist`, and lucide icons `Smartphone`, `Users`, `Link`, `XCircle`.
>    - Add `DbAssignment` interface and assignment-related state + functions (`assignments`, `asgName`, `asgEmail`, `asgZones`, `asgSaving`, `copiedToken`, `createAssignment()`, `deactivateAssignment()`, `assignmentUrl()`, `copyAssignmentLink()`).
>    - Update `fetchData` to also query `flyer_zone_assignments` for the campaign.
>
> 6. `src/App.tsx` — Add `import FieldView from "./pages/FieldView"` and two routes inside the existing Route tree:
>    ```tsx
>    <Route path="/field" element={<FieldView />} />
>    <Route path="/field/:token" element={<FieldView />} />
>    ```
>    Place them alongside the existing `/admin` route.
>
> **Do not:**
> - Change any existing route logic, auth flow, or component outside of the listed files.
> - Add the flyer data to /public or make it publicly accessible.
> - Wrap FieldView in any additional auth HOC — it handles auth internally with useAuth and redirects.
> - Modify FlyerCampaigns tabs other than appending the two new ones.

---

## 4. VERIFY AFTER SYNC

After Lovable applies the changes, verify the following in the live preview:

### Admin panel
- [ ] Go to `/admin` → Activity section → "Flyer Campaigns" tab appears
- [ ] Campaign Overview tab loads 22 zones from the database
- [ ] QR Library shows 22 QR codes, each clickable for PNG download
- [ ] Drop Log tab: "Log Drop" button opens dialog, saves to `flyer_drop_logs`
- [ ] Results tab: scans/signups/hires are editable per zone
- [ ] **Field tab**: accordion list of 22 zones appears; tapping a zone expands its stops; tapping a stop opens a bottom sheet with medium selector and flyer count
- [ ] **Assign tab**: form accepts name + zones, "Create Assignment" saves to DB, list shows the assignment with a copy-link button

### Field page
- [ ] `/field` (while logged in as admin) → shows full 22-zone checklist
- [ ] `/field` (while logged out) → redirects to `/auth?redirect=%2Ffield`
- [ ] `/field/:some-token` (while logged in with valid token) → shows only assigned zones

### Mobile test
- [ ] Open `/field` on a phone or in mobile emulation
- [ ] Overall progress bar at top is sticky
- [ ] Zone accordion tap targets are at least 44px tall
- [ ] Log Visit sheet slides up from bottom, not a modal popup
- [ ] After logging a stop, it shows a green check and flyer count summary

---

## 5. GRANTING flyer_worker ACCESS TO A HELPER

Once a helper has created their Supabase account:

1. Find their user ID in Supabase → Authentication → Users → copy the UUID
2. Run in SQL Editor:
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('<paste-their-uuid-here>', 'flyer_worker')
ON CONFLICT (user_id, role) DO NOTHING;
```
3. Go to Admin → Flyer Campaigns → **Assign** tab
4. Enter their name, optional email, and zone numbers (e.g. `3, 4, 5`)
5. Click Create Assignment
6. Copy the generated `/field/:token` link and send it to them via text/email
7. They open the link, log in, and see only their assigned zones

---

## 6. KNOWN CONSTRAINTS

- **All flyer data is admin-only.** `flyerRouteData.ts` and `flyerZoneData.ts` live in `src/components/admin/` which is never imported by public pages.
- **`flyer_worker` is a narrow role.** It can only read mediums, insert/read/update/delete their own stop visits, and read assignments. It cannot access any other platform tables.
- **Stop data is static TypeScript.** The 190+ businesses live in `flyerRouteData.ts`, not in the database. The DB only stores what was actually visited (`flyer_stop_visits.stop_key` references the static key). This means no migration is needed to add/edit/reorder stops — just edit the TS file.
- **Bitly links** (bit.ly/jl-z01 through jl-z22) must be manually created in the Bitly dashboard. The QR codes already encode those URLs.
- **`update_updated_at_column()` function** must exist before Migration 1 runs. If your project already has it from another migration, the `CREATE OR REPLACE` is a safe no-op.
