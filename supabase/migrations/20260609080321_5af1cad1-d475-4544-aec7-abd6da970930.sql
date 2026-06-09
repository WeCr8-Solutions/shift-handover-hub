
-- ============================================================================
-- 1. concierge_document_records — versioned, immutable master records
-- ============================================================================
CREATE TABLE public.concierge_document_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES public.onboarding_engagements(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  document_key text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  format text NOT NULL DEFAULT 'pdf',
  storage_bucket text NOT NULL DEFAULT 'concierge-docs',
  storage_path text NOT NULL,
  needs_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  cost_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_master boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  superseded_at timestamptz,
  UNIQUE (engagement_id, document_key, version)
);
CREATE INDEX idx_cdr_engagement ON public.concierge_document_records (engagement_id, document_key, version DESC);

GRANT SELECT, INSERT, UPDATE ON public.concierge_document_records TO authenticated;
GRANT ALL ON public.concierge_document_records TO service_role;

ALTER TABLE public.concierge_document_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "concierge_doc_records_read"
ON public.concierge_document_records FOR SELECT
TO authenticated
USING (
  public.is_platform_admin_or_dev(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.onboarding_engagements e
    WHERE e.id = concierge_document_records.engagement_id
      AND e.assigned_admin_id = auth.uid()
  )
);

CREATE POLICY "concierge_doc_records_insert"
ON public.concierge_document_records FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.is_platform_admin_or_dev(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.onboarding_engagements e
      WHERE e.id = concierge_document_records.engagement_id
        AND e.assigned_admin_id = auth.uid()
    )
  )
);

CREATE POLICY "concierge_doc_records_update_nonmaster"
ON public.concierge_document_records FOR UPDATE
TO authenticated
USING (
  is_master = false
  AND (
    public.is_platform_admin_or_dev(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.onboarding_engagements e
      WHERE e.id = concierge_document_records.engagement_id
        AND e.assigned_admin_id = auth.uid()
    )
  )
)
WITH CHECK (is_master = false);

CREATE OR REPLACE FUNCTION public.cdr_block_master_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.is_master = true THEN
    RAISE EXCEPTION 'concierge_document_records: master records are immutable';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cdr_block_master_updates_trg
BEFORE UPDATE ON public.concierge_document_records
FOR EACH ROW EXECUTE FUNCTION public.cdr_block_master_updates();

-- ============================================================================
-- 2. account_activation_tokens — secure single-use activation link fallback
-- ============================================================================
CREATE TABLE public.account_activation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  invite_id uuid REFERENCES public.organization_invites(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_act_email ON public.account_activation_tokens (lower(email));

GRANT SELECT ON public.account_activation_tokens TO authenticated;
GRANT ALL ON public.account_activation_tokens TO service_role;

ALTER TABLE public.account_activation_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "act_admins_select"
ON public.account_activation_tokens FOR SELECT
TO authenticated
USING (
  public.is_platform_admin_or_dev(auth.uid())
  OR (organization_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.organization_members m
    WHERE m.organization_id = account_activation_tokens.organization_id
      AND m.user_id = auth.uid()
      AND m.role IN ('owner','admin')
  ))
);

CREATE OR REPLACE FUNCTION public.consume_activation_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  _hash text;
  _row RECORD;
BEGIN
  IF _token IS NULL OR length(_token) < 16 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid token');
  END IF;
  _hash := encode(extensions.digest(_token, 'sha256'), 'hex');

  SELECT * INTO _row
  FROM public.account_activation_tokens
  WHERE token_hash = _hash;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Activation link not found');
  END IF;
  IF _row.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This activation link has already been used');
  END IF;
  IF _row.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This activation link has expired. Request a new one.');
  END IF;

  UPDATE public.account_activation_tokens
  SET used_at = now(), used_by = auth.uid()
  WHERE id = _row.id;

  RETURN jsonb_build_object(
    'ok', true,
    'email', _row.email,
    'organization_id', _row.organization_id,
    'invite_id', _row.invite_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_activation_token(text) TO anon, authenticated;

-- ============================================================================
-- 3. leave_organization — user can remove their own membership
-- ============================================================================
CREATE OR REPLACE FUNCTION public.leave_organization(_organization_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row RECORD;
  _owner_count integer;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO _row
  FROM public.organization_members
  WHERE organization_id = _organization_id AND user_id = _uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'You are not a member of this organization');
  END IF;

  IF _row.role = 'owner' THEN
    SELECT COUNT(*) INTO _owner_count
    FROM public.organization_members
    WHERE organization_id = _organization_id AND role = 'owner';
    IF _owner_count <= 1 THEN
      RETURN jsonb_build_object('ok', false, 'error',
        'You are the only owner of this organization. Transfer ownership before leaving.');
    END IF;
  END IF;

  DELETE FROM public.team_members
  WHERE user_id = _uid AND organization_id = _organization_id;

  DELETE FROM public.organization_members
  WHERE organization_id = _organization_id AND user_id = _uid;

  UPDATE public.user_org_preferences
  SET active_org_id = NULL
  WHERE user_id = _uid AND active_org_id = _organization_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_organization(uuid) TO authenticated;
