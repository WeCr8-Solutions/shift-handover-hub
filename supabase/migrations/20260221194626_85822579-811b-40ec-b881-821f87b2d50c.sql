
-- ==========================================
-- Global Update & System Notice Engine
-- ==========================================

-- 1. Create enums
CREATE TYPE public.update_category AS ENUM (
  'feature', 'improvement', 'bug_fix', 'system_notice', 'security', 'maintenance'
);

CREATE TYPE public.update_status AS ENUM (
  'live', 'scheduled', 'investigating', 'resolved', 'deprecated'
);

CREATE TYPE public.impact_level AS ENUM (
  'low', 'medium', 'high', 'critical'
);

-- 2. Create global_updates table
CREATE TABLE public.global_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number text,
  revision_number integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  summary text,
  full_description text,
  category public.update_category NOT NULL DEFAULT 'improvement',
  status public.update_status NOT NULL DEFAULT 'scheduled',
  impact_level public.impact_level NOT NULL DEFAULT 'low',
  affected_modules text[] DEFAULT '{}',
  how_it_helps_users text,
  issues_addressed text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  is_visible_to_users boolean NOT NULL DEFAULT false,
  requires_acknowledgement boolean NOT NULL DEFAULT false
);

-- 3. Create acknowledgements table
CREATE TABLE public.global_update_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id uuid NOT NULL REFERENCES public.global_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (update_id, user_id)
);

-- 4. Indexes
CREATE INDEX idx_global_updates_category ON public.global_updates(category);
CREATE INDEX idx_global_updates_status ON public.global_updates(status);
CREATE INDEX idx_global_updates_published_at ON public.global_updates(published_at DESC);
CREATE INDEX idx_global_updates_visible ON public.global_updates(is_visible_to_users) WHERE is_visible_to_users = true;
CREATE INDEX idx_global_update_acks_user ON public.global_update_acknowledgements(user_id);
CREATE INDEX idx_global_update_acks_update ON public.global_update_acknowledgements(update_id);

-- 5. Enable RLS
ALTER TABLE public.global_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_update_acknowledgements ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for global_updates
CREATE POLICY "Users can read visible updates or admins read all"
  ON public.global_updates FOR SELECT TO authenticated
  USING (
    is_visible_to_users = true
    OR public.is_dev_or_admin(auth.uid())
  );

CREATE POLICY "Admins and devs can insert updates"
  ON public.global_updates FOR INSERT TO authenticated
  WITH CHECK (public.is_dev_or_admin(auth.uid()));

CREATE POLICY "Admins and devs can update updates"
  ON public.global_updates FOR UPDATE TO authenticated
  USING (public.is_dev_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete updates"
  ON public.global_updates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 7. RLS Policies for acknowledgements
CREATE POLICY "Users can read own acknowledgements"
  ON public.global_update_acknowledgements FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_dev_or_admin(auth.uid())
  );

CREATE POLICY "Users can insert own acknowledgements"
  ON public.global_update_acknowledgements FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 8. Auto-increment revision_number trigger
CREATE OR REPLACE FUNCTION public.auto_increment_revision_number()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _max_rev integer;
BEGIN
  SELECT COALESCE(MAX(revision_number), 0) INTO _max_rev FROM public.global_updates;
  NEW.revision_number := _max_rev + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_revision_number
  BEFORE INSERT ON public.global_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_increment_revision_number();

-- 9. updated_at trigger
CREATE TRIGGER trg_global_updates_updated_at
  BEFORE UPDATE ON public.global_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_updates;
