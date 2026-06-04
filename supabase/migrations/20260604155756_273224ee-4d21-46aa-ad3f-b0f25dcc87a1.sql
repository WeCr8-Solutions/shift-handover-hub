
-- ============================================================
-- Concierge Phase 2: refunds, accounting export, invoicing, tax
-- ============================================================

-- 1. New columns on onboarding_engagements
ALTER TABLE public.onboarding_engagements
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS refund_amount_cents integer,
  ADD COLUMN IF NOT EXISTS refund_reason text,
  ADD COLUMN IF NOT EXISTS refund_method text,
  ADD COLUMN IF NOT EXISTS refund_reference text,
  ADD COLUMN IF NOT EXISTS refund_proof_path text,
  ADD COLUMN IF NOT EXISTS exported_to_accounting_at timestamptz,
  ADD COLUMN IF NOT EXISTS customer_tax_id text,
  ADD COLUMN IF NOT EXISTS customer_billing_address jsonb,
  ADD COLUMN IF NOT EXISTS invoice_number text;

-- Refund method check
ALTER TABLE public.onboarding_engagements
  DROP CONSTRAINT IF EXISTS onboarding_engagements_refund_method_check;
ALTER TABLE public.onboarding_engagements
  ADD CONSTRAINT onboarding_engagements_refund_method_check
  CHECK (refund_method IS NULL OR refund_method IN ('stripe','check','ach','wire','other'));

-- Backfill invoice numbers for existing engagements: INV-YYYYMM-shortId
UPDATE public.onboarding_engagements
   SET invoice_number = 'INV-' || to_char(started_at, 'YYYYMM') || '-' || upper(substr(replace(id::text, '-', ''), 1, 6))
 WHERE invoice_number IS NULL;

-- Future inserts: trigger to compute invoice_number
CREATE OR REPLACE FUNCTION public.set_engagement_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || to_char(COALESCE(NEW.started_at, now()), 'YYYYMM') ||
                          '-' || upper(substr(replace(NEW.id::text, '-', ''), 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_engagement_invoice_number ON public.onboarding_engagements;
CREATE TRIGGER trg_engagement_invoice_number
  BEFORE INSERT ON public.onboarding_engagements
  FOR EACH ROW EXECUTE FUNCTION public.set_engagement_invoice_number();

-- ------------------------------------------------------------
-- 2. record_concierge_refund RPC
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_concierge_refund(
  p_engagement_id uuid,
  p_amount_cents integer,
  p_reason text,
  p_method text DEFAULT 'stripe',
  p_reference text DEFAULT NULL,
  p_proof_path text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_org uuid;
  v_paid_cents integer;
  v_prev jsonb;
BEGIN
  -- Allow platform admin + developer; also allow service_role (webhook) which has v_uid IS NULL
  IF v_uid IS NOT NULL AND NOT (
       public.has_role(v_uid, 'admin'::public.app_role) OR
       public.has_role(v_uid, 'developer'::public.app_role)
     ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_method NOT IN ('stripe','check','ach','wire','other') THEN
    RAISE EXCEPTION 'Unknown refund method: %', p_method;
  END IF;

  SELECT organization_id, payment_amount_cents,
         jsonb_build_object('payment_status', payment_status, 'status', status,
                            'refund_amount_cents', refund_amount_cents)
    INTO v_org, v_paid_cents, v_prev
    FROM public.onboarding_engagements
   WHERE id = p_engagement_id
   FOR UPDATE;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Engagement not found'; END IF;

  IF p_amount_cents IS NULL OR p_amount_cents <= 0 THEN
    RAISE EXCEPTION 'Refund amount must be > 0';
  END IF;
  IF v_paid_cents IS NOT NULL AND p_amount_cents > v_paid_cents THEN
    RAISE EXCEPTION 'Refund (%) exceeds paid amount (%)', p_amount_cents, v_paid_cents;
  END IF;

  UPDATE public.onboarding_engagements
     SET payment_status = 'refunded',
         refunded_at = now(),
         refunded_by = v_uid,
         refund_amount_cents = COALESCE(refund_amount_cents, 0) + p_amount_cents,
         refund_reason = p_reason,
         refund_method = p_method,
         refund_reference = p_reference,
         refund_proof_path = COALESCE(p_proof_path, refund_proof_path),
         status = CASE WHEN p_amount_cents >= COALESCE(v_paid_cents, p_amount_cents)
                       THEN 'cancelled' ELSE status END,
         updated_at = now()
   WHERE id = p_engagement_id;

  -- Full refund → roll org back to a non-live state
  IF p_amount_cents >= COALESCE(v_paid_cents, p_amount_cents) THEN
    UPDATE public.organizations
       SET onboarding_status = 'concierge_cancelled',
           is_production_active = false,
           updated_at = now()
     WHERE id = v_org;
  END IF;

  INSERT INTO public.admin_audit_events
    (actor_id, event_category, event_action, target_type, target_id,
     organization_id, previous_state, new_state, reason)
  VALUES
    (COALESCE(v_uid, '00000000-0000-0000-0000-000000000000'::uuid),
     'billing', 'concierge.refund_recorded', 'engagement', p_engagement_id::text,
     v_org, v_prev,
     jsonb_build_object('amount_cents', p_amount_cents, 'method', p_method,
                        'reference', p_reference, 'full_refund',
                        p_amount_cents >= COALESCE(v_paid_cents, p_amount_cents)),
     p_reason);

  RETURN p_engagement_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_concierge_refund(uuid, integer, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_concierge_refund(uuid, integer, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_concierge_refund(uuid, integer, text, text, text, text) TO service_role;

-- ------------------------------------------------------------
-- 3. void_concierge_contract RPC
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.void_concierge_contract(
  p_engagement_id uuid,
  p_reason text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_org uuid;
  v_prev jsonb;
BEGIN
  IF NOT (public.has_role(v_uid, 'admin'::public.app_role)
       OR public.has_role(v_uid, 'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_reason IS NULL OR length(btrim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'Reason is required';
  END IF;

  SELECT organization_id,
         jsonb_build_object('contract_signed_at', contract_signed_at,
                            'contract_signer_name', contract_signer_name,
                            'contract_signer_title', contract_signer_title,
                            'contract_proof_path', contract_proof_path)
    INTO v_org, v_prev
    FROM public.onboarding_engagements WHERE id = p_engagement_id;
  IF v_org IS NULL THEN RAISE EXCEPTION 'Engagement not found'; END IF;

  UPDATE public.onboarding_engagements
     SET contract_signed_at = NULL,
         contract_signer_name = NULL,
         contract_signer_title = NULL,
         contract_proof_path = NULL,
         updated_at = now()
   WHERE id = p_engagement_id;

  INSERT INTO public.admin_audit_events
    (actor_id, event_category, event_action, target_type, target_id,
     organization_id, previous_state, new_state, reason)
  VALUES
    (v_uid, 'billing', 'concierge.contract_voided', 'engagement', p_engagement_id::text,
     v_org, v_prev, '{}'::jsonb, p_reason);
  RETURN p_engagement_id;
END;
$$;

REVOKE ALL ON FUNCTION public.void_concierge_contract(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.void_concierge_contract(uuid, text) TO authenticated;

-- ------------------------------------------------------------
-- 4. mark_concierge_exported_to_accounting
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_concierge_exported_to_accounting(
  p_engagement_ids uuid[],
  p_format text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_count integer;
BEGIN
  IF NOT (public.has_role(v_uid, 'admin'::public.app_role)
       OR public.has_role(v_uid, 'developer'::public.app_role)) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.onboarding_engagements
     SET exported_to_accounting_at = now(),
         updated_at = now()
   WHERE id = ANY(p_engagement_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.admin_audit_events
    (actor_id, event_category, event_action, target_type, target_id,
     organization_id, new_state)
  VALUES
    (v_uid, 'billing', 'concierge.accounting_exported', 'engagement_batch',
     NULL, NULL,
     jsonb_build_object('format', p_format, 'count', v_count,
                        'engagement_ids', to_jsonb(p_engagement_ids)));
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_concierge_exported_to_accounting(uuid[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_concierge_exported_to_accounting(uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_concierge_exported_to_accounting(uuid[], text) TO service_role;

-- ------------------------------------------------------------
-- 5. Reporting views (security_invoker so RLS applies via underlying tables)
-- ------------------------------------------------------------
DROP VIEW IF EXISTS public.concierge_sales_performance;
CREATE VIEW public.concierge_sales_performance
WITH (security_invoker = true)
AS
SELECT
  COALESCE(e.sales_rep_id, e.created_by) AS sales_rep_id,
  count(*) AS engagement_count,
  count(*) FILTER (WHERE e.payment_status = 'paid') AS paid_count,
  count(*) FILTER (WHERE e.payment_status IN ('unpaid','invoiced')) AS outstanding_count,
  count(*) FILTER (WHERE e.payment_status = 'refunded') AS refunded_count,
  COALESCE(sum(CASE WHEN e.payment_status = 'paid' THEN e.payment_amount_cents ELSE 0 END), 0) AS paid_cents,
  COALESCE(sum(CASE WHEN e.payment_status IN ('unpaid','invoiced')
                    THEN e.payment_amount_cents ELSE 0 END), 0) AS outstanding_cents,
  COALESCE(sum(e.refund_amount_cents), 0) AS refunded_cents
FROM public.onboarding_engagements e
GROUP BY COALESCE(e.sales_rep_id, e.created_by);

GRANT SELECT ON public.concierge_sales_performance TO authenticated;

DROP VIEW IF EXISTS public.concierge_payment_aging;
CREATE VIEW public.concierge_payment_aging
WITH (security_invoker = true)
AS
SELECT
  e.id,
  e.organization_id,
  o.name AS organization_name,
  e.invoice_number,
  e.payment_status,
  e.payment_amount_cents,
  e.started_at,
  e.sales_rep_id,
  GREATEST(0, EXTRACT(EPOCH FROM (now() - e.started_at))::int / 86400) AS age_days,
  CASE
    WHEN now() - e.started_at <= interval '30 days' THEN '0-30'
    WHEN now() - e.started_at <= interval '60 days' THEN '31-60'
    WHEN now() - e.started_at <= interval '90 days' THEN '61-90'
    ELSE '90+'
  END AS age_bucket
FROM public.onboarding_engagements e
JOIN public.organizations o ON o.id = e.organization_id
WHERE e.payment_status IN ('unpaid','invoiced');

GRANT SELECT ON public.concierge_payment_aging TO authenticated;

-- ------------------------------------------------------------
-- 6. Storage RLS: allow refund proof uploads under refunds/{engagementId}/
-- ------------------------------------------------------------
-- Platform admins can read/write everything in the bucket; reuse existing policies.
-- Org admins remain read-only on payments/ and contracts/ — refunds/ stays admin-only.
-- (No policy change required if the bucket already restricts non-platform writes.)
