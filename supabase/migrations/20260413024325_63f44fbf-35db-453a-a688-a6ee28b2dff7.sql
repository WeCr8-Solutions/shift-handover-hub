
-- 1. Flyer mediums (format/size options)
CREATE TABLE IF NOT EXISTS public.flyer_mediums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flyer_mediums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to flyer_mediums"
  ON public.flyer_mediums FOR ALL
  TO authenticated
  USING (public.is_dev_or_admin(auth.uid()))
  WITH CHECK (public.is_dev_or_admin(auth.uid()));

CREATE POLICY "Flyer workers can view mediums"
  ON public.flyer_mediums FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'flyer_worker'::public.app_role));

-- Seed mediums
INSERT INTO public.flyer_mediums (name, sort_order) VALUES
  ('Full-page Color 8.5×11', 1),
  ('Half-page Color', 2),
  ('Tri-fold', 3),
  ('Business Card', 4);

-- 2. Flyer stop visits (per-business visit log)
CREATE TABLE IF NOT EXISTS public.flyer_stop_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.flyer_campaigns(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.flyer_zones(id) ON DELETE CASCADE,
  zone_number INT NOT NULL,
  stop_key TEXT NOT NULL,
  stop_name TEXT NOT NULL,
  medium_id UUID REFERENCES public.flyer_mediums(id),
  medium_name TEXT,
  flyer_design TEXT,
  flyer_count INT NOT NULL DEFAULT 1,
  interaction_flags TEXT[] NOT NULL DEFAULT '{}',
  contact_name TEXT,
  contact_title TEXT,
  visited_by UUID NOT NULL,
  visited_by_name TEXT,
  assignment_id UUID REFERENCES public.flyer_zone_assignments(id),
  notes TEXT,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stop_visits_campaign_zone ON public.flyer_stop_visits(campaign_id, zone_id);
CREATE INDEX idx_stop_visits_stop_key ON public.flyer_stop_visits(stop_key);

ALTER TABLE public.flyer_stop_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to flyer_stop_visits"
  ON public.flyer_stop_visits FOR ALL
  TO authenticated
  USING (public.is_dev_or_admin(auth.uid()))
  WITH CHECK (public.is_dev_or_admin(auth.uid()));

CREATE POLICY "Flyer workers can view stop visits"
  ON public.flyer_stop_visits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'flyer_worker'::public.app_role));

CREATE POLICY "Flyer workers can insert stop visits"
  ON public.flyer_stop_visits FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'flyer_worker'::public.app_role)
    AND visited_by = auth.uid()
  );
