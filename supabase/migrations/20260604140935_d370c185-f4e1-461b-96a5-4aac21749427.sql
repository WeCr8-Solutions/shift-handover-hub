-- OAP recert reminder dedupe log
CREATE TABLE IF NOT EXISTS public.oap_recert_reminder_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.oap_enrollments(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  operator_user_id uuid NOT NULL,
  recipient_email text NOT NULL,
  due_at timestamptz NOT NULL,
  reminder_bucket text NOT NULL, -- e.g. '30d','14d','7d','due','overdue7'
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_oap_recert_reminder_dedupe
  ON public.oap_recert_reminder_log (enrollment_id, reminder_bucket, due_at);

CREATE INDEX IF NOT EXISTS idx_oap_recert_reminder_org
  ON public.oap_recert_reminder_log (organization_id, sent_at DESC);

GRANT SELECT ON public.oap_recert_reminder_log TO authenticated;
GRANT ALL ON public.oap_recert_reminder_log TO service_role;

ALTER TABLE public.oap_recert_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their recert reminder log"
  ON public.oap_recert_reminder_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = oap_recert_reminder_log.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','supervisor')
    )
  );
