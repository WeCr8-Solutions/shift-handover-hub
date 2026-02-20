
-- 1. Add developer SELECT policy on activity_logs
CREATE POLICY "Developers can view all activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'developer'::app_role));

-- 2. Create changelogs table
CREATE TABLE public.changelogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  version TEXT,
  change_type TEXT NOT NULL DEFAULT 'improvement',
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.changelogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dev and admin can read changelogs"
ON public.changelogs FOR SELECT TO authenticated
USING (is_dev_or_admin(auth.uid()));

CREATE POLICY "Dev and admin can insert changelogs"
ON public.changelogs FOR INSERT TO authenticated
WITH CHECK (is_dev_or_admin(auth.uid()));

CREATE POLICY "Dev and admin can update changelogs"
ON public.changelogs FOR UPDATE TO authenticated
USING (is_dev_or_admin(auth.uid()));

CREATE POLICY "Admin can delete changelogs"
ON public.changelogs FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_changelogs_updated_at
BEFORE UPDATE ON public.changelogs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
