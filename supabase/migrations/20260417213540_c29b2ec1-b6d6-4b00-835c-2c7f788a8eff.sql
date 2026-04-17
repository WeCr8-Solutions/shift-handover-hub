-- ============================================================
-- OAP Recertification + Portable Operator Transcript
-- ============================================================

-- 1. Recert cadence on role programs (default for the role)
ALTER TABLE public.oap_role_programs
  ADD COLUMN IF NOT EXISTS recert_interval_months INTEGER,
  ADD COLUMN IF NOT EXISTS recert_grace_days INTEGER NOT NULL DEFAULT 30;

COMMENT ON COLUMN public.oap_role_programs.recert_interval_months IS
  'Default months between recerts for operators on this role. NULL = no recert required.';

-- 2. Recert lifecycle on enrollments
ALTER TABLE public.oap_enrollments
  ADD COLUMN IF NOT EXISTS next_recert_due TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recert_interval_months_override INTEGER,
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT NOT NULL DEFAULT 'active'
    CHECK (lifecycle_status IN ('active','suspended','waived','revoked','transferred','departed')),
  ADD COLUMN IF NOT EXISTS lifecycle_reason TEXT,
  ADD COLUMN IF NOT EXISTS lifecycle_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lifecycle_changed_by UUID;

CREATE INDEX IF NOT EXISTS idx_oap_enrollments_next_recert
  ON public.oap_enrollments(organization_id, next_recert_due)
  WHERE lifecycle_status = 'active' AND next_recert_due IS NOT NULL;

-- 3. Recert event log (audit trail for AS9100/ISO)
CREATE TABLE IF NOT EXISTS public.oap_recert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES public.oap_enrollments(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  operator_user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN
    ('scheduled','rescheduled','reminder_sent','waived','suspended','reinstated','revoked','recertified','transferred')),
  previous_due TIMESTAMPTZ,
  new_due TIMESTAMPTZ,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  acted_by UUID,
  acted_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oap_recert_events_enrollment
  ON public.oap_recert_events(enrollment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oap_recert_events_org
  ON public.oap_recert_events(organization_id, created_at DESC);

ALTER TABLE public.oap_recert_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view recert events"
  ON public.oap_recert_events FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
    OR operator_user_id = auth.uid()
  );

CREATE POLICY "Org admins/supervisors can insert recert events"
  ON public.oap_recert_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = oap_recert_events.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','supervisor')
    )
  );

-- 4. Portable operator transcript (operator-owned, follows them across employers)
-- Each row = a credential the operator earned at one employer. ITAR-safe:
-- only non-proprietary fields (employer name, machine tags, cert id, dates).
CREATE TABLE IF NOT EXISTS public.oap_operator_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_user_id UUID NOT NULL,
  -- Employer where it was earned (kept even after operator leaves)
  issuing_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  issuing_organization_name TEXT NOT NULL, -- snapshot, survives org deletion
  -- Source records (nullable so transcript survives if employer deletes the row)
  cert_id TEXT,                -- e.g. OAP-XXXXXX-2026
  enrollment_id UUID REFERENCES public.oap_enrollments(id) ON DELETE SET NULL,
  role_program_name TEXT,
  -- What was approved (non-proprietary tags only)
  machine_tags TEXT[] NOT NULL DEFAULT '{}',
  approved_operations TEXT[] NOT NULL DEFAULT '{}',
  -- Dates
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','expired','revoked','superseded')),
  -- Operator-controlled portability
  is_portable BOOLEAN NOT NULL DEFAULT true, -- operator can show to prospective employers
  notes TEXT, -- operator-visible only
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oap_op_creds_operator
  ON public.oap_operator_credentials(operator_user_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_oap_op_creds_cert
  ON public.oap_operator_credentials(cert_id);

ALTER TABLE public.oap_operator_credentials ENABLE ROW LEVEL SECURITY;

-- Operator owns their own transcript
CREATE POLICY "Operators view own credentials"
  ON public.oap_operator_credentials FOR SELECT
  USING (operator_user_id = auth.uid());

CREATE POLICY "Operators update own portability flag"
  ON public.oap_operator_credentials FOR UPDATE
  USING (operator_user_id = auth.uid())
  WITH CHECK (operator_user_id = auth.uid());

-- Issuing employer can see what they issued
CREATE POLICY "Issuing employer views their issued credentials"
  ON public.oap_operator_credentials FOR SELECT
  USING (
    issuing_organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner','admin','supervisor')
    )
  );

-- Issuing employer can insert (when they issue a cert)
CREATE POLICY "Issuing employer inserts credentials"
  ON public.oap_operator_credentials FOR INSERT
  WITH CHECK (
    issuing_organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner','admin','supervisor')
    )
  );

-- Public-facing transfer view: when an operator shares their transcript with
-- a prospective employer via a one-time token, that employer reads via RPC.

-- 5. One-time transfer tokens — operator generates, prospective employer redeems to view portable history
CREATE TABLE IF NOT EXISTS public.oap_transfer_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
  redeemed_at TIMESTAMPTZ,
  redeemed_by_org_id UUID REFERENCES public.organizations(id),
  redeemed_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oap_transfer_tokens_op
  ON public.oap_transfer_tokens(operator_user_id, created_at DESC);

ALTER TABLE public.oap_transfer_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators manage own transfer tokens"
  ON public.oap_transfer_tokens FOR ALL
  USING (operator_user_id = auth.uid())
  WITH CHECK (operator_user_id = auth.uid());

-- 6. SECURITY DEFINER RPC: redeem a transfer token (subscription-gated)
-- Returns the operator's portable transcript only if:
--   - token valid + not expired + not redeemed
--   - redeeming org has active OAP-eligible subscription
CREATE OR REPLACE FUNCTION public.redeem_oap_transfer_token(
  _token TEXT,
  _redeeming_org_id UUID
)
RETURNS TABLE (
  credential_id UUID,
  operator_user_id UUID,
  issuing_organization_name TEXT,
  cert_id TEXT,
  role_program_name TEXT,
  machine_tags TEXT[],
  approved_operations TEXT[],
  issued_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token_row public.oap_transfer_tokens%ROWTYPE;
  _is_member BOOLEAN;
  _has_active_sub BOOLEAN;
BEGIN
  -- Caller must be admin/supervisor of redeeming org
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = _redeeming_org_id
      AND user_id = auth.uid()
      AND role IN ('owner','admin','supervisor')
  ) INTO _is_member;
  IF NOT _is_member THEN
    RAISE EXCEPTION 'Not authorized for organization %', _redeeming_org_id USING ERRCODE = '42501';
  END IF;

  -- Org must have active subscription (any paid tier participates in OAP)
  SELECT EXISTS (
    SELECT 1 FROM public.organization_subscriptions os
    WHERE os.organization_id = _redeeming_org_id
      AND os.status IN ('active','trialing')
  ) INTO _has_active_sub;
  IF NOT _has_active_sub THEN
    RAISE EXCEPTION 'Organization must have an active OAP-eligible subscription' USING ERRCODE = '42501';
  END IF;

  -- Validate token
  SELECT * INTO _token_row FROM public.oap_transfer_tokens
  WHERE token = _token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid transfer token' USING ERRCODE = '22023';
  END IF;
  IF _token_row.redeemed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Transfer token already redeemed' USING ERRCODE = '22023';
  END IF;
  IF _token_row.expires_at < now() THEN
    RAISE EXCEPTION 'Transfer token expired' USING ERRCODE = '22023';
  END IF;

  -- Mark redeemed
  UPDATE public.oap_transfer_tokens
  SET redeemed_at = now(),
      redeemed_by_org_id = _redeeming_org_id,
      redeemed_by_user_id = auth.uid()
  WHERE id = _token_row.id;

  -- Return only portable, non-proprietary fields
  RETURN QUERY
  SELECT
    c.id,
    c.operator_user_id,
    c.issuing_organization_name,
    c.cert_id,
    c.role_program_name,
    c.machine_tags,
    c.approved_operations,
    c.issued_at,
    c.expires_at,
    c.status
  FROM public.oap_operator_credentials c
  WHERE c.operator_user_id = _token_row.operator_user_id
    AND c.is_portable = true
  ORDER BY c.issued_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_oap_transfer_token(TEXT, UUID) TO authenticated;

-- 7. Trigger: when an enrollment is created or recertified, auto-compute next_recert_due
CREATE OR REPLACE FUNCTION public.oap_compute_next_recert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _months INTEGER;
BEGIN
  -- Override wins; otherwise use role program default
  _months := COALESCE(
    NEW.recert_interval_months_override,
    (SELECT recert_interval_months FROM public.oap_role_programs WHERE id = NEW.role_program_id)
  );
  IF _months IS NOT NULL AND NEW.next_recert_due IS NULL AND NEW.completed_at IS NOT NULL THEN
    NEW.next_recert_due := NEW.completed_at + (_months || ' months')::interval;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_oap_compute_next_recert ON public.oap_enrollments;
CREATE TRIGGER trg_oap_compute_next_recert
BEFORE INSERT OR UPDATE OF completed_at, recert_interval_months_override
ON public.oap_enrollments
FOR EACH ROW EXECUTE FUNCTION public.oap_compute_next_recert();
