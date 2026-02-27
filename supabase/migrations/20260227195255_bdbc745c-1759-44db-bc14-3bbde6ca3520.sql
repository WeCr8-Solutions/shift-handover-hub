
-- Track ERP sync usage per org per month for metered billing
CREATE TABLE public.erp_usage_metering (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  sync_count INTEGER NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, period_start)
);

ALTER TABLE public.erp_usage_metering ENABLE ROW LEVEL SECURITY;

-- Org members can read their own metering
CREATE POLICY "Org members can view ERP usage"
  ON public.erp_usage_metering FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

-- Only service role / triggers increment usage
CREATE POLICY "System can insert ERP usage"
  ON public.erp_usage_metering FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE POLICY "System can update ERP usage"
  ON public.erp_usage_metering FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Function to increment sync count and check limits
CREATE OR REPLACE FUNCTION public.increment_erp_sync_usage(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_count INTEGER;
  _erp_tier TEXT;
  _sync_limit INTEGER;
BEGIN
  -- Get the org's ERP add-on tier from entitlements metadata
  SELECT COALESCE(features->>'erp_tier', 'none') INTO _erp_tier
  FROM public.entitlements WHERE organization_id = _org_id;

  -- Determine sync limit based on tier
  _sync_limit := CASE _erp_tier
    WHEN 'starter' THEN 500
    WHEN 'pro' THEN 2000
    WHEN 'unlimited' THEN -1
    ELSE 0
  END;

  -- Upsert this month's usage
  INSERT INTO public.erp_usage_metering (organization_id, period_start, sync_count, last_sync_at)
  VALUES (_org_id, date_trunc('month', CURRENT_DATE)::date, 1, now())
  ON CONFLICT (organization_id, period_start)
  DO UPDATE SET sync_count = erp_usage_metering.sync_count + 1, last_sync_at = now(), updated_at = now()
  RETURNING sync_count INTO _current_count;

  RETURN jsonb_build_object(
    'sync_count', _current_count,
    'sync_limit', _sync_limit,
    'erp_tier', _erp_tier,
    'limit_reached', (_sync_limit > 0 AND _current_count > _sync_limit)
  );
END;
$$;

-- Add timestamp trigger
CREATE TRIGGER update_erp_usage_metering_updated_at
  BEFORE UPDATE ON public.erp_usage_metering
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
