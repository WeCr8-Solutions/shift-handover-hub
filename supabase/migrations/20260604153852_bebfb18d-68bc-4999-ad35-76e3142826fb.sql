
-- 1. Schema: payment + contract + sales-rep fields on engagements
ALTER TABLE public.onboarding_engagements
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_amount_cents integer NOT NULL DEFAULT 150000,
  ADD COLUMN IF NOT EXISTS payment_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_proof_path text,
  ADD COLUMN IF NOT EXISTS contract_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS contract_signer_name text,
  ADD COLUMN IF NOT EXISTS contract_signer_title text,
  ADD COLUMN IF NOT EXISTS contract_proof_path text,
  ADD COLUMN IF NOT EXISTS sales_rep_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop old check constraint if it exists, then add a broader one.
ALTER TABLE public.onboarding_engagements
  DROP CONSTRAINT IF EXISTS onboarding_engagements_payment_status_check;
ALTER TABLE public.onboarding_engagements
  ADD CONSTRAINT onboarding_engagements_payment_status_check
  CHECK (payment_status IN ('unpaid','invoiced','paid','refunded','waived'));

ALTER TABLE public.onboarding_engagements
  DROP CONSTRAINT IF EXISTS onboarding_engagements_payment_method_check;
ALTER TABLE public.onboarding_engagements
  ADD CONSTRAINT onboarding_engagements_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN
    ('stripe','check','credit_card_offline','ach','wire','po','other','complimentary'));

-- 2. Backfill: anything bought via Stripe is already paid; complimentary tier is waived.
UPDATE public.onboarding_engagements
   SET payment_status = 'paid',
       payment_method = COALESCE(payment_method, 'stripe'),
       payment_received_at = COALESCE(payment_received_at, created_at)
 WHERE purchased_via = 'stripe' AND payment_status = 'unpaid';

UPDATE public.onboarding_engagements
   SET payment_status = 'waived',
       payment_method = COALESCE(payment_method, 'complimentary'),
       payment_received_at = COALESCE(payment_received_at, created_at)
 WHERE (purchased_via = 'complimentary' OR plan_tier = 'complimentary')
   AND payment_status = 'unpaid';

-- 3. Create-offline-engagement RPC (platform admins only)
CREATE OR REPLACE FUNCTION public.create_offline_concierge_engagement(
  p_org_id uuid,
  p_plan_tier text DEFAULT 'standard',
  p_sales_rep_id uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_engagement_id uuid;
  v_uid uuid := auth.uid();
  v_amount int;
BEGIN
  IF NOT (public.has_role(v_uid, 'admin'::public.app_role)
       OR public.has_role(v_uid, 'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM public.organizations WHERE id = p_org_id) THEN
    RAISE EXCEPTION 'Organization % not found', p_org_id;
  END IF;

  v_amount := CASE COALESCE(p_plan_tier, 'standard')
    WHEN 'enterprise' THEN 450000
    WHEN 'complimentary' THEN 0
    ELSE 150000
  END;

  INSERT INTO public.onboarding_engagements (
    organization_id, purchased_via, plan_tier, status, percent_complete,
    created_by, assigned_admin_id, sales_rep_id, notes,
    payment_amount_cents,
    payment_status,
    payment_method
  ) VALUES (
    p_org_id,
    CASE WHEN p_plan_tier = 'complimentary' THEN 'complimentary' ELSE 'manual' END,
    COALESCE(p_plan_tier, 'standard'),
    'intake', 0,
    v_uid, v_uid, COALESCE(p_sales_rep_id, v_uid), p_notes,
    v_amount,
    CASE WHEN p_plan_tier = 'complimentary' THEN 'waived' ELSE 'unpaid' END,
    CASE WHEN p_plan_tier = 'complimentary' THEN 'complimentary' ELSE NULL END
  )
  RETURNING id INTO v_engagement_id;

  UPDATE public.organizations
     SET onboarding_status = 'concierge_intake',
         onboarding_engagement_id = v_engagement_id,
         updated_at = now()
   WHERE id = p_org_id;

  PERFORM public.seed_onboarding_checklist(v_engagement_id);

  INSERT INTO public.admin_audit_events (actor_id, action_type, target_type, target_id, organization_id, metadata)
  VALUES (v_uid, 'concierge.offline_engagement_created', 'engagement', v_engagement_id, p_org_id,
          jsonb_build_object('plan_tier', p_plan_tier, 'sales_rep_id', COALESCE(p_sales_rep_id, v_uid)));

  RETURN v_engagement_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_offline_concierge_engagement(uuid, text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_offline_concierge_engagement(uuid, text, uuid, text) TO authenticated;

-- 4. Record-payment RPC
CREATE OR REPLACE FUNCTION public.record_concierge_payment(
  p_engagement_id uuid,
  p_method text,
  p_reference text,
  p_amount_cents integer,
  p_received_at timestamptz,
  p_proof_path text DEFAULT NULL,
  p_status text DEFAULT 'paid'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_uid uuid := auth.uid();
BEGIN
  IF NOT (public.has_role(v_uid, 'admin'::public.app_role)
       OR public.has_role(v_uid, 'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_method NOT IN ('stripe','check','credit_card_offline','ach','wire','po','other','complimentary') THEN
    RAISE EXCEPTION 'Unknown payment method: %', p_method;
  END IF;
  IF p_status NOT IN ('unpaid','invoiced','paid','refunded','waived') THEN
    RAISE EXCEPTION 'Unknown payment status: %', p_status;
  END IF;

  SELECT organization_id INTO v_org FROM public.onboarding_engagements WHERE id = p_engagement_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Engagement not found'; END IF;

  UPDATE public.onboarding_engagements
     SET payment_status = p_status,
         payment_method = p_method,
         payment_reference = p_reference,
         payment_amount_cents = COALESCE(p_amount_cents, payment_amount_cents),
         payment_received_at = COALESCE(p_received_at, now()),
         payment_recorded_by = v_uid,
         payment_proof_path = COALESCE(p_proof_path, payment_proof_path),
         updated_at = now()
   WHERE id = p_engagement_id;

  INSERT INTO public.admin_audit_events (actor_id, action_type, target_type, target_id, organization_id, metadata)
  VALUES (v_uid, 'concierge.payment_recorded', 'engagement', p_engagement_id, v_org,
          jsonb_build_object('method', p_method, 'reference', p_reference,
                             'amount_cents', p_amount_cents, 'status', p_status));
  RETURN p_engagement_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_concierge_payment(uuid, text, text, integer, timestamptz, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_concierge_payment(uuid, text, text, integer, timestamptz, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_concierge_payment(uuid, text, text, integer, timestamptz, text, text) TO service_role;

-- 5. Record-contract-signature RPC
CREATE OR REPLACE FUNCTION public.record_concierge_contract_signature(
  p_engagement_id uuid,
  p_signer_name text,
  p_signer_title text,
  p_signed_at timestamptz,
  p_contract_proof_path text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_org uuid; v_uid uuid := auth.uid();
BEGIN
  IF NOT (public.has_role(v_uid, 'admin'::public.app_role)
       OR public.has_role(v_uid, 'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF COALESCE(trim(p_signer_name), '') = '' THEN
    RAISE EXCEPTION 'Signer name is required';
  END IF;

  SELECT organization_id INTO v_org FROM public.onboarding_engagements WHERE id = p_engagement_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Engagement not found'; END IF;

  UPDATE public.onboarding_engagements
     SET contract_signed_at = COALESCE(p_signed_at, now()),
         contract_signer_name = p_signer_name,
         contract_signer_title = p_signer_title,
         contract_proof_path = COALESCE(p_contract_proof_path, contract_proof_path),
         updated_at = now()
   WHERE id = p_engagement_id;

  INSERT INTO public.admin_audit_events (actor_id, action_type, target_type, target_id, organization_id, metadata)
  VALUES (v_uid, 'concierge.contract_signed', 'engagement', p_engagement_id, v_org,
          jsonb_build_object('signer_name', p_signer_name, 'signer_title', p_signer_title,
                             'signed_at', COALESCE(p_signed_at, now())));
  RETURN p_engagement_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_concierge_contract_signature(uuid, text, text, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_concierge_contract_signature(uuid, text, text, timestamptz, text) TO authenticated;

-- 6. Updated mark_engagement_ready: require payment paid/waived
CREATE OR REPLACE FUNCTION public.mark_engagement_ready(p_engagement_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid; v_open int; v_check jsonb;
  v_pay_status text; v_signed timestamptz;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::public.app_role)
       OR public.has_role(auth.uid(),'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT organization_id, payment_status, contract_signed_at
    INTO v_org, v_pay_status, v_signed
    FROM public.onboarding_engagements WHERE id = p_engagement_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Engagement not found'; END IF;

  IF v_pay_status NOT IN ('paid','waived') THEN
    RAISE EXCEPTION 'Payment must be recorded as paid or waived before marking ready (current: %)', v_pay_status;
  END IF;

  SELECT COUNT(*) INTO v_open
    FROM public.onboarding_checklist_items
   WHERE engagement_id = p_engagement_id AND required = true AND status <> 'done';
  IF v_open > 0 THEN
    RAISE EXCEPTION 'Cannot mark ready: % required checklist item(s) still open', v_open;
  END IF;

  v_check := public.verify_org_production_ready(v_org);
  IF (v_check->>'ready')::bool = false THEN
    RAISE EXCEPTION 'Cannot mark ready: %', v_check->>'blockers';
  END IF;

  UPDATE public.onboarding_engagements
     SET status='ready_for_production', ready_at=now(), percent_complete=100
   WHERE id=p_engagement_id;
  UPDATE public.organizations
     SET onboarding_status='ready_for_production', onboarding_engagement_id=p_engagement_id
   WHERE id=v_org;

  INSERT INTO public.admin_audit_events (actor_id, action_type, target_type, target_id, organization_id, metadata)
  VALUES (auth.uid(), 'onboarding.ready_for_production', 'organization', v_org, v_org,
          jsonb_build_object('engagement_id', p_engagement_id, 'verification', v_check,
                             'payment_status', v_pay_status, 'contract_signed_at', v_signed));
  RETURN p_engagement_id;
END;
$$;

-- 7. Updated activate_org_for_production: require signed contract (unless complimentary)
CREATE OR REPLACE FUNCTION public.activate_org_for_production(p_engagement_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_pay_status text;
  v_signed timestamptz;
  v_purchased text;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin'::public.app_role)
       OR public.has_role(auth.uid(),'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT organization_id, payment_status, contract_signed_at, purchased_via
    INTO v_org, v_pay_status, v_signed, v_purchased
    FROM public.onboarding_engagements WHERE id = p_engagement_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Engagement not found'; END IF;

  IF v_pay_status NOT IN ('paid','waived') THEN
    RAISE EXCEPTION 'Cannot activate: payment is %', v_pay_status;
  END IF;
  -- Require signed contract for offline engagements (Stripe checkouts count
  -- as accepting the terms presented at purchase time).
  IF v_purchased <> 'stripe' AND v_pay_status <> 'waived' AND v_signed IS NULL THEN
    RAISE EXCEPTION 'Cannot activate: signed contract is not on file';
  END IF;

  PERFORM public.seed_org_production_defaults(v_org);

  UPDATE public.onboarding_engagements SET status='live', went_live_at=now() WHERE id=p_engagement_id;
  UPDATE public.organizations SET onboarding_status='live' WHERE id=v_org;

  INSERT INTO public.admin_audit_events (actor_id, action_type, target_type, target_id, organization_id, metadata)
  VALUES (auth.uid(), 'onboarding.went_live', 'organization', v_org, v_org,
          jsonb_build_object('engagement_id', p_engagement_id,
                             'payment_status', v_pay_status,
                             'contract_signed_at', v_signed));
  RETURN p_engagement_id;
END;
$$;
