
CREATE TABLE IF NOT EXISTS public.billing_reminder_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('trial-ending','renewal-upcoming','payment-failed','test')),
  stripe_event_id TEXT,
  stripe_subscription_id TEXT,
  period_anchor DATE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','skipped')),
  error TEXT,
  metadata JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS billing_reminder_log_dedupe
  ON public.billing_reminder_log (COALESCE(stripe_subscription_id, organization_id::text), reminder_type, period_anchor)
  WHERE period_anchor IS NOT NULL AND status = 'sent';

CREATE INDEX IF NOT EXISTS billing_reminder_log_org_idx
  ON public.billing_reminder_log (organization_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS billing_reminder_log_event_idx
  ON public.billing_reminder_log (stripe_event_id) WHERE stripe_event_id IS NOT NULL;

ALTER TABLE public.billing_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins view their billing reminders"
ON public.billing_reminder_log FOR SELECT
USING (
  organization_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = billing_reminder_log.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin')
  )
);

CREATE POLICY "Platform admins view all billing reminders"
ON public.billing_reminder_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Deny user inserts on billing_reminder_log"
ON public.billing_reminder_log FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny user updates on billing_reminder_log"
ON public.billing_reminder_log FOR UPDATE
USING (false);

CREATE POLICY "Deny user deletes on billing_reminder_log"
ON public.billing_reminder_log FOR DELETE
USING (false);
