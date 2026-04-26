CREATE TABLE IF NOT EXISTS public.operator_resume_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_url text NOT NULL,
  storage_path text,
  source text NOT NULL DEFAULT 'uploaded' CHECK (source IN ('uploaded','generated')),
  file_name text,
  size_bytes bigint,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operator_resume_versions_user_created
  ON public.operator_resume_versions (user_id, created_at DESC);

ALTER TABLE public.operator_resume_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own resume versions" ON public.operator_resume_versions;
CREATE POLICY "Users view own resume versions"
ON public.operator_resume_versions
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own resume versions" ON public.operator_resume_versions;
CREATE POLICY "Users insert own resume versions"
ON public.operator_resume_versions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own resume versions" ON public.operator_resume_versions;
CREATE POLICY "Users delete own resume versions"
ON public.operator_resume_versions
FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view resume versions when profile resume is public" ON public.operator_resume_versions;
CREATE POLICY "Public can view resume versions when profile resume is public"
ON public.operator_resume_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.operator_profiles op
    WHERE op.user_id = operator_resume_versions.user_id
      AND op.resume_public = true
      AND op.profile_visibility = 'public'
  )
);