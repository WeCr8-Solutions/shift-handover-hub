
-- 1) Cert tables: act-as attribution
ALTER TABLE public.gca_certificates ADD COLUMN IF NOT EXISTS acting_via_user_id uuid;
ALTER TABLE public.oap_certificates ADD COLUMN IF NOT EXISTS acting_via_user_id uuid;

-- 2) Cert status audit trigger
CREATE OR REPLACE FUNCTION public.log_cert_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _changed boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.revoked_at IS DISTINCT FROM OLD.revoked_at
       OR NEW.revoked_reason IS DISTINCT FROM OLD.revoked_reason
       OR NEW.valid_until IS DISTINCT FROM OLD.valid_until
    THEN _changed := true; END IF;
  END IF;
  IF _changed OR TG_OP = 'INSERT' THEN
    INSERT INTO public.data_access_logs(user_id, table_name, record_id, operation, metadata)
    VALUES (
      auth.uid(), TG_TABLE_NAME, COALESCE(NEW.cert_id, NEW.id::text),
      CASE TG_OP WHEN 'INSERT' THEN 'cert_issue' ELSE 'cert_status_change' END,
      jsonb_build_object(
        'cert_id', NEW.cert_id,
        'before_status', CASE WHEN TG_OP='UPDATE' THEN OLD.status END,
        'after_status', NEW.status,
        'revoked_at', NEW.revoked_at,
        'revoked_reason', NEW.revoked_reason,
        'valid_until', NEW.valid_until,
        'acting_via', NEW.acting_via_user_id
      )
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_gca_cert_status_audit ON public.gca_certificates;
CREATE TRIGGER trg_gca_cert_status_audit AFTER INSERT OR UPDATE ON public.gca_certificates
FOR EACH ROW EXECUTE FUNCTION public.log_cert_status_change();
DROP TRIGGER IF EXISTS trg_oap_cert_status_audit ON public.oap_certificates;
CREATE TRIGGER trg_oap_cert_status_audit AFTER INSERT OR UPDATE ON public.oap_certificates
FOR EACH ROW EXECUTE FUNCTION public.log_cert_status_change();

-- 3) Mentor lifecycle audit
CREATE OR REPLACE FUNCTION public.log_certifying_mentor_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
       NEW.is_active IS DISTINCT FROM OLD.is_active
    OR NEW.approval_status IS DISTINCT FROM OLD.approval_status
    OR NEW.scope IS DISTINCT FROM OLD.scope
    OR NEW.programs IS DISTINCT FROM OLD.programs
  ) THEN
    INSERT INTO public.data_access_logs(user_id, organization_id, table_name, record_id, operation, metadata)
    VALUES (
      auth.uid(), NEW.organization_id, 'certifying_mentors', NEW.id::text,
      'mentor_lifecycle_change',
      jsonb_build_object(
        'mentor_user_id', NEW.user_id,
        'before_is_active', OLD.is_active, 'after_is_active', NEW.is_active,
        'before_approval_status', OLD.approval_status, 'after_approval_status', NEW.approval_status,
        'before_scope', OLD.scope, 'after_scope', NEW.scope,
        'before_programs', OLD.programs, 'after_programs', NEW.programs
      )
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_certifying_mentor_audit ON public.certifying_mentors;
CREATE TRIGGER trg_certifying_mentor_audit AFTER UPDATE ON public.certifying_mentors
FOR EACH ROW EXECUTE FUNCTION public.log_certifying_mentor_change();

-- 4) Recert event actor binding + audit
CREATE OR REPLACE FUNCTION public.enforce_recert_actor_and_log()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN NEW.acted_by := auth.uid(); END IF;
  INSERT INTO public.data_access_logs(user_id, organization_id, table_name, record_id, operation, metadata)
  VALUES (
    auth.uid(), NEW.organization_id, 'oap_recert_events', NEW.id::text, 'recert_event',
    jsonb_build_object(
      'event_type', NEW.event_type, 'enrollment_id', NEW.enrollment_id,
      'operator_user_id', NEW.operator_user_id,
      'previous_due', NEW.previous_due, 'new_due', NEW.new_due, 'reason', NEW.reason
    )
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_recert_event_actor ON public.oap_recert_events;
CREATE TRIGGER trg_recert_event_actor BEFORE INSERT ON public.oap_recert_events
FOR EACH ROW EXECUTE FUNCTION public.enforce_recert_actor_and_log();

DROP POLICY IF EXISTS "Org admins/supervisors can insert recert events" ON public.oap_recert_events;
CREATE POLICY "Org admins/supervisors can insert recert events"
ON public.oap_recert_events FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = oap_recert_events.organization_id
      AND om.user_id = auth.uid()
      AND om.role = ANY (ARRAY['owner','admin','supervisor'])
  )
  AND (acted_by IS NULL OR acted_by = auth.uid())
);

-- 5) Verify RPCs: drop + recreate with effective_status
DROP FUNCTION IF EXISTS public.verify_oap_certificate(text);
DROP FUNCTION IF EXISTS public.verify_gca_certificate(text);

CREATE FUNCTION public.verify_oap_certificate(_cert_id text)
RETURNS TABLE(
  cert_id text, recipient_name text, recipient_username text, program_name text,
  status text, effective_status text,
  valid_from date, valid_until date, issued_at timestamptz,
  revoked_at timestamptz, revoked_reason text,
  signed_by_name text, signed_by_title text, signed_by_signature_url text,
  is_paid boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.cert_id, c.recipient_name, c.recipient_username, c.program_name,
    c.status,
    CASE
      WHEN c.status = 'revoked'   THEN 'revoked'
      WHEN c.status = 'suspended' THEN 'suspended'
      WHEN c.valid_until IS NOT NULL AND c.valid_until < CURRENT_DATE THEN 'expired'
      ELSE 'valid'
    END,
    c.valid_from, c.valid_until, c.issued_at, c.revoked_at, c.revoked_reason,
    c.signed_by_name, c.signed_by_title, c.signed_by_signature_url,
    (c.stripe_session_id IS NOT NULL)
  FROM public.oap_certificates c WHERE c.cert_id = _cert_id LIMIT 1;
$$;

CREATE FUNCTION public.verify_gca_certificate(_cert_id text)
RETURNS TABLE(
  cert_id text, recipient_name text, recipient_username text, program_name text,
  status text, effective_status text,
  valid_from date, valid_until date, issued_at timestamptz,
  revoked_at timestamptz, revoked_reason text,
  signed_by_name text, signed_by_title text, signed_by_signature_url text,
  is_paid boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.cert_id, c.recipient_name, c.recipient_username, c.program_name,
    c.status,
    CASE
      WHEN c.status = 'revoked'   THEN 'revoked'
      WHEN c.status = 'suspended' THEN 'suspended'
      WHEN c.valid_until IS NOT NULL AND c.valid_until < CURRENT_DATE THEN 'expired'
      ELSE 'valid'
    END,
    c.valid_from, c.valid_until, c.issued_at, c.revoked_at, c.revoked_reason,
    c.signed_by_name, c.signed_by_title, c.signed_by_signature_url,
    (c.stripe_session_id IS NOT NULL)
  FROM public.gca_certificates c WHERE c.cert_id = _cert_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_oap_certificate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_gca_certificate(text) TO anon, authenticated;

-- 6) Operator self-completion guard for gca_assignments
CREATE OR REPLACE FUNCTION public.guard_gca_assignment_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _is_supervisor boolean; _is_admin boolean; _has_passed boolean;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN ('completed','passed')
  THEN
    _is_admin := has_role(auth.uid(), 'admin'::app_role);
    _is_supervisor := is_org_admin(auth.uid(), NEW.organization_id)
                       OR is_supervisor_in_org(auth.uid(), NEW.organization_id);
    IF NOT (_is_admin OR _is_supervisor) THEN
      SELECT public.has_passed_gca_bank(auth.uid(), NEW.bank_id) INTO _has_passed;
      IF NOT COALESCE(_has_passed, false) THEN
        RAISE EXCEPTION 'Cannot mark GCA assignment complete without a passing test attempt'
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_gca_assignment_completion_guard ON public.gca_assignments;
CREATE TRIGGER trg_gca_assignment_completion_guard BEFORE UPDATE ON public.gca_assignments
FOR EACH ROW EXECUTE FUNCTION public.guard_gca_assignment_completion();

-- 7) Tighten oap_certificate_items public read
DROP POLICY IF EXISTS "OAP certificate items publicly readable" ON public.oap_certificate_items;
CREATE POLICY "OAP cert items readable for non-revoked certs"
ON public.oap_certificate_items FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.oap_certificates c
    WHERE c.id = oap_certificate_items.certificate_id
      AND COALESCE(c.status, 'valid') NOT IN ('revoked','suspended')
  )
);
