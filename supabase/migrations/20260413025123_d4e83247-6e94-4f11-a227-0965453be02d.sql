
-- Add contact fields to flyer_stop_visits
ALTER TABLE public.flyer_stop_visits
  ADD COLUMN IF NOT EXISTS business_email TEXT,
  ADD COLUMN IF NOT EXISTS business_phone TEXT,
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS mailing_consent BOOLEAN DEFAULT false;

-- Mailing lists table for organizing contacts by type
CREATE TABLE IF NOT EXISTS public.flyer_mailing_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.flyer_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  list_type TEXT NOT NULL DEFAULT 'email' CHECK (list_type IN ('email', 'postcard', 'flyer', 'business_card')),
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.flyer_mailing_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/devs full access on mailing_lists"
  ON public.flyer_mailing_lists FOR ALL TO authenticated
  USING (public.is_dev_or_admin(auth.uid()))
  WITH CHECK (public.is_dev_or_admin(auth.uid()));

CREATE POLICY "Flyer workers can view mailing_lists"
  ON public.flyer_mailing_lists FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'flyer_worker'::public.app_role));

-- Junction table linking stop visits to mailing lists
CREATE TABLE IF NOT EXISTS public.flyer_mailing_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailing_list_id UUID NOT NULL REFERENCES public.flyer_mailing_lists(id) ON DELETE CASCADE,
  stop_visit_id UUID NOT NULL REFERENCES public.flyer_stop_visits(id) ON DELETE CASCADE,
  added_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mailing_list_id, stop_visit_id)
);

ALTER TABLE public.flyer_mailing_list_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/devs full access on mailing_list_entries"
  ON public.flyer_mailing_list_entries FOR ALL TO authenticated
  USING (public.is_dev_or_admin(auth.uid()))
  WITH CHECK (public.is_dev_or_admin(auth.uid()));

CREATE POLICY "Flyer workers can insert mailing_list_entries"
  ON public.flyer_mailing_list_entries FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'flyer_worker'::public.app_role));

CREATE POLICY "Flyer workers can view mailing_list_entries"
  ON public.flyer_mailing_list_entries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'flyer_worker'::public.app_role));
