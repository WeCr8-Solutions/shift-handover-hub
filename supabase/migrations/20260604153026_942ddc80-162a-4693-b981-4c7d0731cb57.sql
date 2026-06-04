
CREATE OR REPLACE FUNCTION public.create_concierge_engagement_from_payment(
  p_org_id uuid,
  p_payment_intent_id text,
  p_plan_tier text DEFAULT 'standard',
  p_purchased_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_engagement_id uuid;
  v_org_exists boolean;
  v_is_admin boolean;
BEGIN
  -- Verify the organization exists.
  SELECT EXISTS(SELECT 1 FROM public.organizations WHERE id = p_org_id) INTO v_org_exists;
  IF NOT v_org_exists THEN
    RAISE EXCEPTION 'organization % not found', p_org_id USING ERRCODE = 'P0002';
  END IF;

  -- If a purchaser is supplied, verify they are an admin of that org (defense in depth;
  -- the edge function already checks this, but we re-verify before persisting the link).
  IF p_purchased_by IS NOT NULL THEN
    SELECT public.is_org_admin(p_purchased_by, p_org_id) INTO v_is_admin;
    IF NOT COALESCE(v_is_admin, false) THEN
      RAISE EXCEPTION 'user % is not an admin of org %', p_purchased_by, p_org_id USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Idempotency: if an engagement already exists for this payment intent, return it.
  SELECT id INTO v_engagement_id
  FROM public.onboarding_engagements
  WHERE stripe_payment_intent_id = p_payment_intent_id
  LIMIT 1;

  IF v_engagement_id IS NOT NULL THEN
    -- Backfill created_by if we now know the purchaser and it wasn't recorded before.
    IF p_purchased_by IS NOT NULL THEN
      UPDATE public.onboarding_engagements
      SET created_by = COALESCE(created_by, p_purchased_by)
      WHERE id = v_engagement_id;
    END IF;
    RETURN v_engagement_id;
  END IF;

  INSERT INTO public.onboarding_engagements (
    organization_id, purchased_via, stripe_payment_intent_id, plan_tier, status, percent_complete, created_by
  ) VALUES (
    p_org_id, 'stripe', p_payment_intent_id, COALESCE(p_plan_tier, 'standard'), 'intake', 0, p_purchased_by
  )
  RETURNING id INTO v_engagement_id;

  UPDATE public.organizations
  SET onboarding_status = 'concierge_intake',
      onboarding_engagement_id = v_engagement_id,
      updated_at = now()
  WHERE id = p_org_id;

  PERFORM public.seed_onboarding_checklist(v_engagement_id);

  -- Audit trail tying purchaser → org → engagement
  INSERT INTO public.admin_audit_events (organization_id, actor_id, event_type, payload)
  VALUES (
    p_org_id,
    p_purchased_by,
    'concierge_engagement_created',
    jsonb_build_object(
      'engagement_id', v_engagement_id,
      'payment_intent', p_payment_intent_id,
      'plan_tier', COALESCE(p_plan_tier, 'standard'),
      'purchased_by', p_purchased_by
    )
  );

  RETURN v_engagement_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_concierge_engagement_from_payment(uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_concierge_engagement_from_payment(uuid, text, text, uuid) TO service_role;
