-- 1. Cover media + overlay columns on GCA banks, OAP courses, OAP lessons
ALTER TABLE public.gca_question_banks
  ADD COLUMN IF NOT EXISTS cover_media_id uuid REFERENCES public.training_media(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cover_overlay_text text,
  ADD COLUMN IF NOT EXISTS cover_overlay_opacity numeric(3,2) DEFAULT 0.45,
  ADD COLUMN IF NOT EXISTS cover_overlay_position text DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS cover_overlay_text_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS content_year integer,
  ADD COLUMN IF NOT EXISTS last_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_published_by uuid;

ALTER TABLE public.oap_courses
  ADD COLUMN IF NOT EXISTS cover_media_id uuid REFERENCES public.training_media(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cover_overlay_text text,
  ADD COLUMN IF NOT EXISTS cover_overlay_opacity numeric(3,2) DEFAULT 0.45,
  ADD COLUMN IF NOT EXISTS cover_overlay_position text DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS cover_overlay_text_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS content_year integer,
  ADD COLUMN IF NOT EXISTS last_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_published_by uuid;

ALTER TABLE public.oap_lessons
  ADD COLUMN IF NOT EXISTS cover_media_id uuid REFERENCES public.training_media(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cover_overlay_text text,
  ADD COLUMN IF NOT EXISTS cover_overlay_opacity numeric(3,2) DEFAULT 0.45,
  ADD COLUMN IF NOT EXISTS cover_overlay_position text DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS cover_overlay_text_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS content_year integer,
  ADD COLUMN IF NOT EXISTS last_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_published_by uuid;

ALTER TABLE public.certificate_templates
  ADD COLUMN IF NOT EXISTS content_year integer,
  ADD COLUMN IF NOT EXISTS last_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_published_by uuid;

-- Sanity constraints on overlay opacity + position
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gca_banks_overlay_opacity_chk') THEN
    ALTER TABLE public.gca_question_banks
      ADD CONSTRAINT gca_banks_overlay_opacity_chk
      CHECK (cover_overlay_opacity IS NULL OR (cover_overlay_opacity >= 0 AND cover_overlay_opacity <= 1));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oap_courses_overlay_opacity_chk') THEN
    ALTER TABLE public.oap_courses
      ADD CONSTRAINT oap_courses_overlay_opacity_chk
      CHECK (cover_overlay_opacity IS NULL OR (cover_overlay_opacity >= 0 AND cover_overlay_opacity <= 1));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'oap_lessons_overlay_opacity_chk') THEN
    ALTER TABLE public.oap_lessons
      ADD CONSTRAINT oap_lessons_overlay_opacity_chk
      CHECK (cover_overlay_opacity IS NULL OR (cover_overlay_opacity >= 0 AND cover_overlay_opacity <= 1));
  END IF;
END $$;

-- 2. Program release log table
CREATE TABLE IF NOT EXISTS public.program_release_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program text NOT NULL CHECK (program IN ('OAP','GCA','CERT')),
  entity_type text NOT NULL CHECK (entity_type IN ('bank','course','lesson','quiz','template')),
  entity_id uuid NOT NULL,
  entity_label text,
  content_year integer NOT NULL CHECK (content_year BETWEEN 2000 AND 2100),
  release_notes text,
  released_by uuid,
  released_at timestamptz NOT NULL DEFAULT now(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS program_release_log_program_idx
  ON public.program_release_log (program, released_at DESC);
CREATE INDEX IF NOT EXISTS program_release_log_entity_idx
  ON public.program_release_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS program_release_log_org_idx
  ON public.program_release_log (organization_id);

ALTER TABLE public.program_release_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "release_log_select_all" ON public.program_release_log;
CREATE POLICY "release_log_select_all"
  ON public.program_release_log
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "release_log_insert_admin_or_org" ON public.program_release_log;
CREATE POLICY "release_log_insert_admin_or_org"
  ON public.program_release_log
  FOR INSERT
  WITH CHECK (
    -- platform admin can publish anything (canonical or org-scoped)
    public.has_role(auth.uid(), 'admin')
    OR (
      -- org admin/owner/supervisor can publish only for their own org
      organization_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = program_release_log.organization_id
          AND om.user_id = auth.uid()
          AND om.role IN ('owner','admin','supervisor')
      )
    )
  );

DROP POLICY IF EXISTS "release_log_delete_admin" ON public.program_release_log;
CREATE POLICY "release_log_delete_admin"
  ON public.program_release_log
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
