
-- AI Chat Usage tracking table
CREATE TABLE public.ai_chat_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  usage_date date NOT NULL DEFAULT CURRENT_DATE,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, usage_date)
);

ALTER TABLE public.ai_chat_usage ENABLE ROW LEVEL SECURITY;

-- Org members can read their own org's usage
CREATE POLICY "Org members can view AI usage"
  ON public.ai_chat_usage FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

-- No direct user writes — only service role increments

-- Function to atomically increment usage and return current count + limit
CREATE OR REPLACE FUNCTION public.increment_ai_chat_usage(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _plan text;
  _daily_limit integer;
  _current_count integer;
BEGIN
  -- Get org's entitlement plan
  SELECT COALESCE(plan, 'free') INTO _plan
  FROM public.entitlements
  WHERE organization_id = _org_id;

  IF _plan IS NULL THEN
    _plan := 'free';
  END IF;

  -- Determine daily limit based on plan
  _daily_limit := CASE _plan
    WHEN 'free' THEN 5
    WHEN 'single' THEN 25
    WHEN 'team' THEN 100
    WHEN 'enterprise' THEN -1  -- unlimited
    ELSE 5
  END;

  -- Upsert today's usage row and increment
  INSERT INTO public.ai_chat_usage (organization_id, usage_date, message_count)
  VALUES (_org_id, CURRENT_DATE, 1)
  ON CONFLICT (organization_id, usage_date)
  DO UPDATE SET message_count = ai_chat_usage.message_count + 1, updated_at = now()
  RETURNING message_count INTO _current_count;

  RETURN jsonb_build_object(
    'count', _current_count,
    'daily_limit', _daily_limit,
    'plan', _plan,
    'limit_reached', (_daily_limit > 0 AND _current_count > _daily_limit)
  );
END;
$$;
