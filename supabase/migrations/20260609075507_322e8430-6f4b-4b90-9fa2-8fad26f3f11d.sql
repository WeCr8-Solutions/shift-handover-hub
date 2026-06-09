
CREATE TABLE public.concierge_pack_finalizations (
  engagement_id uuid PRIMARY KEY REFERENCES public.onboarding_engagements(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','finalized')),
  finalized_by uuid,
  finalized_at timestamptz,
  reopened_by uuid,
  reopened_at timestamptz,
  reopen_reason text,
  pack_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.concierge_pack_finalizations TO authenticated;
GRANT ALL ON public.concierge_pack_finalizations TO service_role;

ALTER TABLE public.concierge_pack_finalizations ENABLE ROW LEVEL SECURITY;

-- Read: platform admin/developer, or the engagement's assigned admin / creator
CREATE POLICY "concierge_pack_finalizations select"
ON public.concierge_pack_finalizations
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'developer'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.onboarding_engagements e
    WHERE e.id = engagement_id
      AND (e.assigned_admin_id = auth.uid() OR e.created_by = auth.uid())
  )
);

-- Insert: same audience as select
CREATE POLICY "concierge_pack_finalizations insert"
ON public.concierge_pack_finalizations
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'developer'::public.app_role)
  OR EXISTS (
    SELECT 1 FROM public.onboarding_engagements e
    WHERE e.id = engagement_id
      AND (e.assigned_admin_id = auth.uid() OR e.created_by = auth.uid())
  )
);

-- Update drafts: assigned admin / creator may keep editing while draft;
-- once finalized, only platform admins / developers may update (reopen).
CREATE POLICY "concierge_pack_finalizations update"
ON public.concierge_pack_finalizations
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'developer'::public.app_role)
  OR (
    status = 'draft' AND EXISTS (
      SELECT 1 FROM public.onboarding_engagements e
      WHERE e.id = engagement_id
        AND (e.assigned_admin_id = auth.uid() OR e.created_by = auth.uid())
    )
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'developer'::public.app_role)
  OR (
    status = 'draft' AND EXISTS (
      SELECT 1 FROM public.onboarding_engagements e
      WHERE e.id = engagement_id
        AND (e.assigned_admin_id = auth.uid() OR e.created_by = auth.uid())
    )
  )
);

CREATE OR REPLACE FUNCTION public.tg_concierge_pack_finalizations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER concierge_pack_finalizations_updated_at
BEFORE UPDATE ON public.concierge_pack_finalizations
FOR EACH ROW EXECUTE FUNCTION public.tg_concierge_pack_finalizations_updated_at();
