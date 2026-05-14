-- AI request audit log (FedRAMP SI-3 / SI-10 / AU-2)
CREATE TABLE IF NOT EXISTS public.ai_request_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID,
  function_name TEXT NOT NULL,
  model TEXT,
  input_length INTEGER NOT NULL DEFAULT 0,
  output_length INTEGER NOT NULL DEFAULT 0,
  input_sha256 TEXT,
  flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reasons TEXT[] NOT NULL DEFAULT '{}',
  latency_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'ok',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_request_log_org_created
  ON public.ai_request_log (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_request_log_flagged
  ON public.ai_request_log (flagged, created_at DESC) WHERE flagged = true;
CREATE INDEX IF NOT EXISTS idx_ai_request_log_user
  ON public.ai_request_log (user_id, created_at DESC);

ALTER TABLE public.ai_request_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can view AI request log" ON public.ai_request_log;
CREATE POLICY "Org members can view AI request log"
  ON public.ai_request_log
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND public.is_org_member(auth.uid(), organization_id)
  );

DROP POLICY IF EXISTS "Platform admins can view all AI logs" ON public.ai_request_log;
CREATE POLICY "Platform admins can view all AI logs"
  ON public.ai_request_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Append-only: no UPDATE / DELETE policies => denied by default under RLS.
-- Inserts are performed by edge functions using the service role, which bypasses RLS.