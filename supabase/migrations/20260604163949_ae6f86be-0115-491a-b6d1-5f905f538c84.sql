
CREATE TABLE public.mfg_100_nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  nominee_name text NOT NULL,
  nominee_company text,
  nominee_role text,
  nominee_linkedin text,
  nominee_website text,
  category text NOT NULL,
  reason text NOT NULL,
  evidence_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  nominator_name text NOT NULL,
  nominator_email text NOT NULL,
  consent boolean NOT NULL,
  interest_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'public_form',
  status text NOT NULL DEFAULT 'new',
  reviewed_at timestamptz,
  reviewed_by uuid,
  notes text,
  ip_hash text,
  user_agent text,
  CONSTRAINT mfg_100_nominations_status_chk CHECK (status IN ('new','under_review','shortlisted','declined','published'))
);

GRANT INSERT ON public.mfg_100_nominations TO anon, authenticated;
GRANT SELECT, UPDATE ON public.mfg_100_nominations TO authenticated;
GRANT ALL ON public.mfg_100_nominations TO service_role;

ALTER TABLE public.mfg_100_nominations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a nomination"
  ON public.mfg_100_nominations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (consent = true);

CREATE POLICY "Developers can read nominations"
  ON public.mfg_100_nominations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role));

CREATE POLICY "Developers can update nominations"
  ON public.mfg_100_nominations
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'developer'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'developer'::app_role));

CREATE TRIGGER trg_mfg_100_nominations_updated_at
  BEFORE UPDATE ON public.mfg_100_nominations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_mfg_100_nominations_status ON public.mfg_100_nominations(status);
CREATE INDEX idx_mfg_100_nominations_category ON public.mfg_100_nominations(category);
CREATE INDEX idx_mfg_100_nominations_created_at ON public.mfg_100_nominations(created_at DESC);
