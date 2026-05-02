-- ============================================================
-- Certifying Mentors: unified, JobLine-approved mentor registry
-- ============================================================
-- Extends the existing oap_designated_mentors table to also support:
--   • Platform-scope mentors (organization_id IS NULL) approved by JobLine.
--   • Multiple programs per mentor (OAP / GCA).
--   • Explicit approval workflow (pending -> approved/revoked).
-- Backwards-compatible: all existing rows are flagged scope='org',
-- programs=ARRAY['OAP'], approval_status='approved' so currently-working
-- orgs continue issuing OAP certs without disruption.

-- 1. Rename the table (keeps RLS, indexes, FKs).
ALTER TABLE IF EXISTS public.oap_designated_mentors
  RENAME TO certifying_mentors;

-- 2. Allow NULL organization_id for platform-scope mentors.
ALTER TABLE public.certifying_mentors
  ALTER COLUMN organization_id DROP NOT NULL;

-- 3. New columns (idempotent guards).
ALTER TABLE public.certifying_mentors
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'org',
  ADD COLUMN IF NOT EXISTS programs text[] NOT NULL DEFAULT ARRAY['OAP']::text[],
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS credentials_url text,
  ADD COLUMN IF NOT EXISTS signature_url text,
  ADD COLUMN IF NOT EXISTS title text;

-- 4. Constraints (drop-then-add for idempotency).
ALTER TABLE public.certifying_mentors
  DROP CONSTRAINT IF EXISTS certifying_mentors_scope_check,
  DROP CONSTRAINT IF EXISTS certifying_mentors_status_check,
  DROP CONSTRAINT IF EXISTS certifying_mentors_scope_org_match,
  DROP CONSTRAINT IF EXISTS certifying_mentors_programs_nonempty;

ALTER TABLE public.certifying_mentors
  ADD CONSTRAINT certifying_mentors_scope_check
    CHECK (scope IN ('platform','org')),
  ADD CONSTRAINT certifying_mentors_status_check
    CHECK (approval_status IN ('pending','approved','revoked')),
  ADD CONSTRAINT certifying_mentors_scope_org_match
    CHECK (
      (scope = 'platform' AND organization_id IS NULL)
      OR (scope = 'org' AND organization_id IS NOT NULL)
    ),
  ADD CONSTRAINT certifying_mentors_programs_nonempty
    CHECK (
      array_length(programs, 1) >= 1
      AND programs <@ ARRAY['OAP','GCA']::text[]
    );

-- 5. Backfill existing rows (one-time, safe to re-run).
UPDATE public.certifying_mentors
SET
  scope = 'org',
  programs = COALESCE(NULLIF(programs, ARRAY[]::text[]), ARRAY['OAP']::text[]),
  approval_status = 'approved',
  approved_at = COALESCE(approved_at, designated_at)
WHERE approval_status = 'pending'
  AND organization_id IS NOT NULL;

-- 6. Unique index that allows one platform mentor row per user (org_id NULL).
DROP INDEX IF EXISTS certifying_mentors_unique_platform;
CREATE UNIQUE INDEX certifying_mentors_unique_platform
  ON public.certifying_mentors (user_id)
  WHERE scope = 'platform';

CREATE INDEX IF NOT EXISTS idx_certifying_mentors_status
  ON public.certifying_mentors (approval_status);
CREATE INDEX IF NOT EXISTS idx_certifying_mentors_user
  ON public.certifying_mentors (user_id);

-- ============================================================
-- 7. Trigger: only platform admins can create / approve platform mentors
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_platform_mentor_admin_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Platform-scope rows must be created/modified by a platform admin.
  IF NEW.scope = 'platform' THEN
    IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Only platform admins can manage platform-scope mentors';
    END IF;
  END IF;

  -- Approval transitions (pending -> approved) must be done by platform admin.
  IF TG_OP = 'UPDATE'
     AND OLD.approval_status IS DISTINCT FROM NEW.approval_status
     AND NEW.approval_status = 'approved' THEN
    IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
      RAISE EXCEPTION 'Only platform admins can approve certifying mentors';
    END IF;
    NEW.approved_by := COALESCE(NEW.approved_by, auth.uid());
    NEW.approved_at := COALESCE(NEW.approved_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_platform_mentor_admin_only
  ON public.certifying_mentors;
CREATE TRIGGER trg_enforce_platform_mentor_admin_only
  BEFORE INSERT OR UPDATE ON public.certifying_mentors
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_platform_mentor_admin_only();

-- ============================================================
-- 8. RLS policies — refresh with explicit scope handling
-- ============================================================
ALTER TABLE public.certifying_mentors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view their org mentors"
  ON public.certifying_mentors;
DROP POLICY IF EXISTS "Org admins can manage their org mentors"
  ON public.certifying_mentors;
DROP POLICY IF EXISTS "Platform admins manage all mentors"
  ON public.certifying_mentors;
DROP POLICY IF EXISTS "Public can view approved platform mentors"
  ON public.certifying_mentors;
-- Drop any legacy policies from the old table name.
DROP POLICY IF EXISTS "Org members can view OAP mentors"
  ON public.certifying_mentors;
DROP POLICY IF EXISTS "Org admins manage OAP mentors"
  ON public.certifying_mentors;

-- Anyone (including anon) can see APPROVED platform mentors so the cert
-- checkout dialog can render the picker for self-pay users.
CREATE POLICY "Public can view approved platform mentors"
ON public.certifying_mentors
FOR SELECT
TO anon, authenticated
USING (
  scope = 'platform'
  AND approval_status = 'approved'
);

-- Org members can see their org's mentors (any status, for transparency).
CREATE POLICY "Org members can view their org mentors"
ON public.certifying_mentors
FOR SELECT
TO authenticated
USING (
  scope = 'org'
  AND organization_id IS NOT NULL
  AND public.is_org_member(auth.uid(), organization_id)
);

-- Org admins / supervisors can designate / revoke their org mentors
-- (approval is platform-only, enforced by trigger).
CREATE POLICY "Org admins can manage their org mentors"
ON public.certifying_mentors
FOR ALL
TO authenticated
USING (
  scope = 'org'
  AND organization_id IS NOT NULL
  AND (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
  )
)
WITH CHECK (
  scope = 'org'
  AND organization_id IS NOT NULL
  AND (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
  )
);

-- Platform admins manage everything.
CREATE POLICY "Platform admins manage all mentors"
ON public.certifying_mentors
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================
-- 9. New helper: can_certify(_user_id, _org_id, _program)
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_certify(
  _user_id uuid,
  _org_id uuid,
  _program text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Platform admin always
    public.has_role(_user_id, 'admin'::public.app_role)
    -- Approved platform mentor for this program
    OR EXISTS (
      SELECT 1 FROM public.certifying_mentors cm
      WHERE cm.user_id = _user_id
        AND cm.scope = 'platform'
        AND cm.approval_status = 'approved'
        AND _program = ANY(cm.programs)
    )
    -- Approved org mentor for this program in a paid employer org
    OR (
      _org_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.certifying_mentors cm
        JOIN public.organizations o ON o.id = cm.organization_id
        WHERE cm.user_id = _user_id
          AND cm.organization_id = _org_id
          AND cm.scope = 'org'
          AND cm.approval_status = 'approved'
          AND cm.is_active = true
          AND _program = ANY(cm.programs)
          AND COALESCE(o.subscription_tier, 'free') <> 'free'
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.can_certify(uuid, uuid, text)
  TO anon, authenticated;

-- Compatibility shim so older callers keep working.
CREATE OR REPLACE FUNCTION public.can_act_as_oap_mentor(
  _user_id uuid,
  _org_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.can_certify(_user_id, _org_id, 'OAP');
$$;

-- ============================================================
-- 10. Public-readable mentor directory view (safe columns only)
--     Used by /talent and the cert checkout mentor picker.
-- ============================================================
DROP VIEW IF EXISTS public.certifying_mentors_public;
CREATE VIEW public.certifying_mentors_public
WITH (security_invoker = true)
AS
SELECT
  cm.id,
  cm.user_id,
  cm.user_name,
  cm.title,
  cm.scope,
  cm.organization_id,
  cm.programs,
  cm.approval_status,
  cm.approved_at
FROM public.certifying_mentors cm
WHERE cm.approval_status = 'approved'
  AND cm.is_active = true;

GRANT SELECT ON public.certifying_mentors_public TO anon, authenticated;