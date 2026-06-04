
-- 1) Downtime reason taxonomy
CREATE TABLE public.org_downtime_reasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_downtime_reasons TO authenticated;
GRANT ALL ON public.org_downtime_reasons TO service_role;

ALTER TABLE public.org_downtime_reasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view downtime reasons"
  ON public.org_downtime_reasons FOR SELECT
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members insert downtime reasons"
  ON public.org_downtime_reasons FOR INSERT
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Supervisors and admins update downtime reasons"
  ON public.org_downtime_reasons FOR UPDATE
  USING (is_supervisor_in_org(auth.uid(), organization_id) OR is_org_admin(auth.uid(), organization_id));

CREATE POLICY "Supervisors and admins delete downtime reasons"
  ON public.org_downtime_reasons FOR DELETE
  USING (is_supervisor_in_org(auth.uid(), organization_id) OR is_org_admin(auth.uid(), organization_id));

CREATE TRIGGER update_org_downtime_reasons_updated_at
  BEFORE UPDATE ON public.org_downtime_reasons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_org_downtime_reasons_org ON public.org_downtime_reasons (organization_id, is_active, sort_order);

-- 2) Handoff acknowledgement fields
ALTER TABLE public.handoff_records
  ADD COLUMN IF NOT EXISTS acknowledged_at timestamptz,
  ADD COLUMN IF NOT EXISTS acknowledged_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS acknowledged_by_name text;

CREATE INDEX IF NOT EXISTS idx_handoff_records_ack
  ON public.handoff_records (organization_id, station_id, acknowledged_at);
