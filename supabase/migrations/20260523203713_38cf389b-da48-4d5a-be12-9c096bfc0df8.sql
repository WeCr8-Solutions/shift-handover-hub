
DO $$ BEGIN
  CREATE TYPE public.policy_change_type AS ENUM ('terms', 'privacy', 'cookies', 'billing', 'combined');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.policy_change_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.policy_change_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type public.policy_change_type NOT NULL,
  version_label TEXT NOT NULL,
  effective_date DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  change_highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  full_policy_url TEXT,
  status public.policy_change_status NOT NULL DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pca_status ON public.policy_change_announcements (status);
CREATE INDEX IF NOT EXISTS idx_pca_scheduled ON public.policy_change_announcements (scheduled_for) WHERE status = 'scheduled';

CREATE TABLE IF NOT EXISTS public.policy_change_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES public.policy_change_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pcel_announcement_user
  ON public.policy_change_email_log (announcement_id, user_id);
CREATE INDEX IF NOT EXISTS idx_pcel_status ON public.policy_change_email_log (announcement_id, status);

CREATE OR REPLACE FUNCTION public.set_pca_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_pca_updated_at ON public.policy_change_announcements;
CREATE TRIGGER trg_pca_updated_at BEFORE UPDATE ON public.policy_change_announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_pca_updated_at();

ALTER TABLE public.policy_change_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_change_email_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_platform_admin_or_dev(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin'::public.app_role, 'developer'::public.app_role)
  );
$$;

DROP POLICY IF EXISTS pca_platform_all ON public.policy_change_announcements;
CREATE POLICY pca_platform_all ON public.policy_change_announcements
  FOR ALL TO authenticated
  USING (public.is_platform_admin_or_dev(auth.uid()))
  WITH CHECK (public.is_platform_admin_or_dev(auth.uid()));

DROP POLICY IF EXISTS pca_authenticated_read ON public.policy_change_announcements;
CREATE POLICY pca_authenticated_read ON public.policy_change_announcements
  FOR SELECT TO authenticated
  USING (status IN ('sent', 'sending'));

DROP POLICY IF EXISTS pcel_platform_all ON public.policy_change_email_log;
CREATE POLICY pcel_platform_all ON public.policy_change_email_log
  FOR ALL TO authenticated
  USING (public.is_platform_admin_or_dev(auth.uid()))
  WITH CHECK (public.is_platform_admin_or_dev(auth.uid()));

DROP POLICY IF EXISTS pcel_self_read ON public.policy_change_email_log;
CREATE POLICY pcel_self_read ON public.policy_change_email_log
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
