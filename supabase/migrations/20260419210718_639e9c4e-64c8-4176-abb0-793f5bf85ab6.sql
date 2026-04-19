-- ============================================================
-- Phase A — Tighten talent reply gating to "accepted only"
-- ============================================================

DROP POLICY IF EXISTS "tmr_insert" ON public.talent_message_replies;
CREATE POLICY "tmr_insert"
  ON public.talent_message_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.talent_contact_requests r
      WHERE r.id = talent_message_replies.request_id
        AND r.candidate_response = 'accepted'
        AND (
          (sender_role = 'candidate' AND r.candidate_user_id = auth.uid())
          OR (sender_role = 'employer' AND (
            public.is_org_admin(auth.uid(), r.organization_id)
            OR public.is_supervisor_in_org(auth.uid(), r.organization_id)
          ))
        )
    )
  );

-- ============================================================
-- Phase B — Connection-gated intra-org direct messages
-- ============================================================

-- Connection requests between two users in the same org
CREATE TABLE IF NOT EXISTS public.org_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','blocked')),
  message text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_connections_distinct CHECK (requester_id <> recipient_id),
  CONSTRAINT org_connections_unique UNIQUE (organization_id, requester_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_org_connections_recipient
  ON public.org_connections(recipient_id, status);
CREATE INDEX IF NOT EXISTS idx_org_connections_requester
  ON public.org_connections(requester_id, status);

ALTER TABLE public.org_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "oc_select" ON public.org_connections;
CREATE POLICY "oc_select"
  ON public.org_connections FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "oc_insert" ON public.org_connections;
CREATE POLICY "oc_insert"
  ON public.org_connections FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND public.is_org_member(auth.uid(), organization_id)
    AND public.is_org_member(recipient_id, organization_id)
  );

-- Recipient can accept/decline; either party can block
DROP POLICY IF EXISTS "oc_update_recipient" ON public.org_connections;
CREATE POLICY "oc_update_recipient"
  ON public.org_connections FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid() OR requester_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid() OR requester_id = auth.uid());

DROP TRIGGER IF EXISTS tg_org_connections_updated_at ON public.org_connections;
CREATE TRIGGER tg_org_connections_updated_at
  BEFORE UPDATE ON public.org_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: are A and B connected (accepted) in the given org?
CREATE OR REPLACE FUNCTION public.users_are_connected(_a uuid, _b uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_connections
    WHERE organization_id = _org_id
      AND status = 'accepted'
      AND (
        (requester_id = _a AND recipient_id = _b)
        OR (requester_id = _b AND recipient_id = _a)
      )
  );
$$;

-- Direct messages between two users
CREATE TABLE IF NOT EXISTS public.org_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_messages_distinct CHECK (sender_id <> recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_org_messages_recipient
  ON public.org_messages(recipient_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_messages_thread
  ON public.org_messages(organization_id, sender_id, recipient_id, created_at DESC);

ALTER TABLE public.org_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "om_select" ON public.org_messages;
CREATE POLICY "om_select"
  ON public.org_messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "om_insert" ON public.org_messages;
CREATE POLICY "om_insert"
  ON public.org_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_org_member(auth.uid(), organization_id)
    AND public.is_org_member(recipient_id, organization_id)
    AND (
      public.users_are_connected(auth.uid(), recipient_id, organization_id)
      -- Org admins/supervisors can always message their members for operational needs
      OR public.is_org_admin(auth.uid(), organization_id)
      OR public.is_supervisor_in_org(auth.uid(), organization_id)
    )
  );

-- Recipient can mark messages read
DROP POLICY IF EXISTS "om_update_read" ON public.org_messages;
CREATE POLICY "om_update_read"
  ON public.org_messages FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Realtime
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'org_messages';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.org_messages';
  END IF;
END $$;

DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'org_connections';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.org_connections';
  END IF;
END $$;