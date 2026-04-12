
-- 1. flyer_campaigns
CREATE TABLE IF NOT EXISTS public.flyer_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flyer_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/devs can manage flyer_campaigns"
  ON public.flyer_campaigns FOR ALL
  TO authenticated
  USING (public.is_dev_or_admin(auth.uid()))
  WITH CHECK (public.is_dev_or_admin(auth.uid()));

CREATE POLICY "Flyer workers can view campaigns"
  ON public.flyer_campaigns FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'flyer_worker'::public.app_role));

-- 2. flyer_zones
CREATE TABLE IF NOT EXISTS public.flyer_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.flyer_campaigns(id) ON DELETE CASCADE,
  zone_number INTEGER NOT NULL,
  zone_name TEXT NOT NULL,
  city TEXT NOT NULL,
  utm_content TEXT NOT NULL,
  full_utm_url TEXT NOT NULL,
  bitly_back_half TEXT,
  bitly_short_url TEXT,
  qr_filename TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  flyer_count INTEGER NOT NULL DEFAULT 0,
  total_scans INTEGER NOT NULL DEFAULT 0,
  total_signups INTEGER NOT NULL DEFAULT 0,
  total_hires INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, zone_number)
);

ALTER TABLE public.flyer_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/devs can manage flyer_zones"
  ON public.flyer_zones FOR ALL
  TO authenticated
  USING (public.is_dev_or_admin(auth.uid()))
  WITH CHECK (public.is_dev_or_admin(auth.uid()));

CREATE POLICY "Flyer workers can view zones"
  ON public.flyer_zones FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'flyer_worker'::public.app_role));

-- 3. flyer_drop_logs
CREATE TABLE IF NOT EXISTS public.flyer_drop_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.flyer_campaigns(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.flyer_zones(id) ON DELETE CASCADE,
  dropped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dropped_by UUID DEFAULT auth.uid(),
  flyer_count INTEGER NOT NULL DEFAULT 0,
  business_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flyer_drop_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/devs can manage drop_logs"
  ON public.flyer_drop_logs FOR ALL
  TO authenticated
  USING (public.is_dev_or_admin(auth.uid()))
  WITH CHECK (public.is_dev_or_admin(auth.uid()));

CREATE POLICY "Flyer workers can view drop_logs"
  ON public.flyer_drop_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'flyer_worker'::public.app_role));

CREATE POLICY "Flyer workers can insert drop_logs"
  ON public.flyer_drop_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'flyer_worker'::public.app_role));

-- 4. flyer_zone_assignments
CREATE TABLE IF NOT EXISTS public.flyer_zone_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.flyer_campaigns(id) ON DELETE CASCADE,
  assignee_name TEXT NOT NULL,
  assignee_email TEXT,
  zone_numbers INTEGER[] NOT NULL DEFAULT '{}',
  invite_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  assigned_by UUID,
  assigned_to_user_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flyer_zone_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/devs can manage assignments"
  ON public.flyer_zone_assignments FOR ALL
  TO authenticated
  USING (public.is_dev_or_admin(auth.uid()))
  WITH CHECK (public.is_dev_or_admin(auth.uid()));

CREATE POLICY "Flyer workers can view their assignments"
  ON public.flyer_zone_assignments FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'flyer_worker'::public.app_role)
    AND (assigned_to_user_id = auth.uid() OR assigned_to_user_id IS NULL)
  );

CREATE POLICY "Flyer workers can claim assignments"
  ON public.flyer_zone_assignments FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'flyer_worker'::public.app_role)
    AND assigned_to_user_id IS NULL
  )
  WITH CHECK (assigned_to_user_id = auth.uid());

-- 5. Triggers for updated_at
CREATE TRIGGER update_flyer_campaigns_updated_at
  BEFORE UPDATE ON public.flyer_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flyer_zones_updated_at
  BEFORE UPDATE ON public.flyer_zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flyer_zone_assignments_updated_at
  BEFORE UPDATE ON public.flyer_zone_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Seed campaign and zones
INSERT INTO public.flyer_campaigns (slug, name, description, status)
VALUES ('san_diego_drop', 'San Diego County Flyer Drop', '22 zones · 190+ target businesses in East County, Poway, Miramar, and surrounding areas', 'active')
ON CONFLICT (slug) DO NOTHING;

WITH campaign AS (
  SELECT id FROM public.flyer_campaigns WHERE slug = 'san_diego_drop' LIMIT 1
)
INSERT INTO public.flyer_zones (campaign_id, zone_number, zone_name, city, utm_content, full_utm_url, bitly_back_half, bitly_short_url, qr_filename)
SELECT campaign.id, v.zone_number, v.zone_name, v.city, v.utm_content, v.full_utm_url, v.bitly_back_half, v.bitly_short_url, v.qr_filename
FROM campaign, (VALUES
  (1,  'Wheatlands / Abraham Way', 'Santee', 'z01_santee_wheatlands', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z01_santee_wheatlands', 'jl-z01', 'https://bit.ly/jl-z01', 'qr_z01_santee_wheatlands.png'),
  (2,  'Prospect / Buena Vista / Kenney', 'Santee', 'z02_santee_prospect', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z02_santee_prospect', 'jl-z02', 'https://bit.ly/jl-z02', 'qr_z02_santee_prospect.png'),
  (3,  'Cuyamaca / Pathway / Woodside', 'Santee', 'z03_santee_cuyamaca', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z03_santee_cuyamaca', 'jl-z03', 'https://bit.ly/jl-z03', 'qr_z03_santee_cuyamaca.png'),
  (4,  'Magnolia Ave Industrial', 'El Cajon', 'z04_elcajon_magnolia', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z04_elcajon_magnolia', 'jl-z04', 'https://bit.ly/jl-z04', 'qr_z04_elcajon_magnolia.png'),
  (5,  'Raleigh / Vernon / Marshall', 'El Cajon', 'z05_elcajon_raleigh', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z05_elcajon_raleigh', 'jl-z05', 'https://bit.ly/jl-z05', 'qr_z05_elcajon_raleigh.png'),
  (6,  'Bradley / Greenfield / Pioneer', 'El Cajon', 'z06_elcajon_bradley', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z06_elcajon_bradley', 'jl-z06', 'https://bit.ly/jl-z06', 'qr_z06_elcajon_bradley.png'),
  (7,  'Gillespie Field Aerospace', 'El Cajon', 'z07_elcajon_gillespie', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z07_elcajon_gillespie', 'jl-z07', 'https://bit.ly/jl-z07', 'qr_z07_elcajon_gillespie.png'),
  (8,  'Bond / Olde Hwy 80 / East El Cajon', 'El Cajon', 'z08_elcajon_bond', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z08_elcajon_bond', 'jl-z08', 'https://bit.ly/jl-z08', 'qr_z08_elcajon_bond.png'),
  (9,  'Woodside / Riverside / Winter Gardens / Maine Ave', 'Lakeside', 'z09_lakeside', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z09_lakeside', 'jl-z09', 'https://bit.ly/jl-z09', 'qr_z09_lakeside.png'),
  (10, 'La Mesa — Auto / CNC / Gunsmiths', 'La Mesa', 'z10_lamesa', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z10_lamesa', 'jl-z10', 'https://bit.ly/jl-z10', 'qr_z10_lamesa.png'),
  (11, 'Spring Valley / Rancho San Diego', 'Spring Valley', 'z11_springvalley', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z11_springvalley', 'jl-z11', 'https://bit.ly/jl-z11', 'qr_z11_springvalley.png'),
  (12, 'Poway Industrial Corridor', 'Poway', 'z12_poway', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z12_poway', 'jl-z12', 'https://bit.ly/jl-z12', 'qr_z12_poway.png'),
  (13, 'Miramar / Mira Mesa CNC & Manufacturing', 'San Diego', 'z13_miramar', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z13_miramar', 'jl-z13', 'https://bit.ly/jl-z13', 'qr_z13_miramar.png'),
  (14, 'Firearms / Gunsmiths — Regional', 'San Diego County', 'z14_firearms_regional', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z14_firearms_regional', 'jl-z14', 'https://bit.ly/jl-z14', 'qr_z14_firearms_regional.png'),
  (15, 'Mission Gorge / Railroad — Santee North', 'Santee', 'z15_santee_missiongorge', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z15_santee_missiongorge', 'jl-z15', 'https://bit.ly/jl-z15', 'qr_z15_santee_missiongorge.png'),
  (16, 'Lemon Grove', 'Lemon Grove', 'z16_lemongrove', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z16_lemongrove', 'jl-z16', 'https://bit.ly/jl-z16', 'qr_z16_lemongrove.png'),
  (17, 'National City Industrial Corridor', 'National City', 'z17_nationalcity', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z17_nationalcity', 'jl-z17', 'https://bit.ly/jl-z17', 'qr_z17_nationalcity.png'),
  (18, 'Chula Vista', 'Chula Vista', 'z18_chulavista', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z18_chulavista', 'jl-z18', 'https://bit.ly/jl-z18', 'qr_z18_chulavista.png'),
  (19, 'Kearny Mesa / Convoy / Mission Valley', 'San Diego', 'z19_kearnymesa', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z19_kearnymesa', 'jl-z19', 'https://bit.ly/jl-z19', 'qr_z19_kearnymesa.png'),
  (20, 'Mid-City / South Park / Imperial Ave', 'San Diego', 'z20_midcity', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z20_midcity', 'jl-z20', 'https://bit.ly/jl-z20', 'qr_z20_midcity.png'),
  (21, 'Point Loma / Ocean Beach', 'San Diego', 'z21_pointloma', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z21_pointloma', 'jl-z21', 'https://bit.ly/jl-z21', 'qr_z21_pointloma.png'),
  (22, 'Sorrento Valley / Mesa Rim', 'San Diego', 'z22_sorrentovalley', 'https://jobline.ai/start?utm_source=flyer&utm_medium=print&utm_campaign=san_diego_drop&utm_content=z22_sorrentovalley', 'jl-z22', 'https://bit.ly/jl-z22', 'qr_z22_sorrentovalley.png')
) AS v(zone_number, zone_name, city, utm_content, full_utm_url, bitly_back_half, bitly_short_url, qr_filename)
ON CONFLICT (campaign_id, zone_number) DO NOTHING;
