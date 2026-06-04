
CREATE OR REPLACE FUNCTION public.create_concierge_engagement_from_payment(
  p_org_id uuid,
  p_payment_intent_id text,
  p_plan_tier text DEFAULT 'standard'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_engagement_id uuid;
BEGIN
  -- Idempotency: if an engagement already exists for this payment intent, return it.
  SELECT id INTO v_engagement_id
  FROM public.onboarding_engagements
  WHERE stripe_payment_intent_id = p_payment_intent_id
  LIMIT 1;

  IF v_engagement_id IS NOT NULL THEN
    RETURN v_engagement_id;
  END IF;

  INSERT INTO public.onboarding_engagements (
    organization_id, purchased_via, stripe_payment_intent_id, plan_tier, status, percent_complete
  ) VALUES (
    p_org_id, 'stripe', p_payment_intent_id, COALESCE(p_plan_tier, 'standard'), 'intake', 0
  )
  RETURNING id INTO v_engagement_id;

  UPDATE public.organizations
  SET onboarding_status = 'concierge_intake',
      onboarding_engagement_id = v_engagement_id,
      updated_at = now()
  WHERE id = p_org_id;

  PERFORM public.seed_onboarding_checklist(v_engagement_id);

  RETURN v_engagement_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_concierge_engagement_from_payment(uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_concierge_engagement_from_payment(uuid, text, text) TO service_role;
