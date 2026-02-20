
-- Create planning_chat_sessions table
CREATE TABLE public.planning_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Planning Session',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_planning_chat_sessions_user_org ON public.planning_chat_sessions(user_id, organization_id);

-- Enable RLS
ALTER TABLE public.planning_chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own sessions within their org (must be supervisor or org admin)
CREATE POLICY "Users can view own planning sessions"
ON public.planning_chat_sessions FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  AND (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
    OR public.is_dev_or_admin(auth.uid())
  )
);

-- RLS: Users can create sessions in their org (must be supervisor or org admin)
CREATE POLICY "Users can create planning sessions"
ON public.planning_chat_sessions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
    OR public.is_dev_or_admin(auth.uid())
  )
);

-- RLS: Users can update their own sessions
CREATE POLICY "Users can update own planning sessions"
ON public.planning_chat_sessions FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
    OR public.is_dev_or_admin(auth.uid())
  )
);

-- RLS: Users can delete their own sessions
CREATE POLICY "Users can delete own planning sessions"
ON public.planning_chat_sessions FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND (
    public.is_org_admin(auth.uid(), organization_id)
    OR public.is_supervisor_in_org(auth.uid(), organization_id)
    OR public.is_dev_or_admin(auth.uid())
  )
);

-- Auto-update updated_at
CREATE TRIGGER update_planning_chat_sessions_updated_at
BEFORE UPDATE ON public.planning_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
