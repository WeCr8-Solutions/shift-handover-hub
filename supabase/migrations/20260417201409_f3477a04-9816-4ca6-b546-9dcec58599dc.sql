
-- =========================================================
-- TRAINING LIBRARY — PHASE 2: Polymorphic Media Table + Buckets
-- =========================================================

-- Entity types media can attach to
DO $$ BEGIN
  CREATE TYPE public.training_media_entity AS ENUM (
    'inspection_tool',
    'inspection_tool_category',
    'oap_lesson',
    'oap_course',
    'oap_quiz_question',
    'oap_walkthrough_item',
    'oap_walkthrough_section',
    'gca_question',
    'gca_question_bank'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.training_media_program AS ENUM ('gca','oap','both');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.training_media_type AS ENUM ('image','video','audio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.training_media_visibility AS ENUM ('public','private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- TABLE ----------
CREATE TABLE public.training_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  program public.training_media_program NOT NULL DEFAULT 'both',
  entity_type public.training_media_entity NOT NULL,
  entity_id uuid NOT NULL,
  media_type public.training_media_type NOT NULL,
  mime_type text NOT NULL,
  storage_bucket text NOT NULL CHECK (storage_bucket IN ('training-media-public','training-media-private')),
  storage_path text NOT NULL,
  file_name text,
  file_size_bytes bigint,
  duration_ms integer,
  width integer,
  height integer,
  caption text,
  alt_text text,
  transcript text,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  visibility public.training_media_visibility NOT NULL DEFAULT 'public',
  is_canonical boolean NOT NULL DEFAULT false,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storage_bucket, storage_path)
);

CREATE INDEX idx_training_media_entity ON public.training_media(entity_type, entity_id);
CREATE INDEX idx_training_media_org ON public.training_media(organization_id);
CREATE INDEX idx_training_media_program ON public.training_media(program);

-- MIME validation trigger (AVIF/GIF/JPEG/PNG/WebP, MP3/M4A, MP4/WebM)
CREATE OR REPLACE FUNCTION public.validate_training_media_mime()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.media_type = 'image' AND NEW.mime_type NOT IN
    ('image/avif','image/gif','image/jpeg','image/png','image/webp') THEN
    RAISE EXCEPTION 'Unsupported image MIME: %', NEW.mime_type;
  ELSIF NEW.media_type = 'audio' AND NEW.mime_type NOT IN
    ('audio/mpeg','audio/mp4','audio/x-m4a','audio/aac') THEN
    RAISE EXCEPTION 'Unsupported audio MIME: %', NEW.mime_type;
  ELSIF NEW.media_type = 'video' AND NEW.mime_type NOT IN
    ('video/mp4','video/webm','video/quicktime') THEN
    RAISE EXCEPTION 'Unsupported video MIME: %', NEW.mime_type;
  END IF;

  -- Canonical rows must not have an org; org rows must have an org
  IF NEW.is_canonical = true AND NEW.organization_id IS NOT NULL THEN
    RAISE EXCEPTION 'Canonical training_media rows cannot have organization_id';
  END IF;
  IF NEW.is_canonical = false AND NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Non-canonical training_media rows must have organization_id';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_training_media_mime
  BEFORE INSERT OR UPDATE ON public.training_media
  FOR EACH ROW EXECUTE FUNCTION public.validate_training_media_mime();

CREATE TRIGGER trg_training_media_updated_at
  BEFORE UPDATE ON public.training_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- RLS ----------
ALTER TABLE public.training_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View canonical or own-org media"
  ON public.training_media FOR SELECT
  TO authenticated
  USING (
    is_canonical = true
    OR organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Platform admins manage canonical media"
  ON public.training_media FOR ALL
  TO authenticated
  USING (is_canonical = true AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (is_canonical = true AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org leaders manage own-org media"
  ON public.training_media FOR ALL
  TO authenticated
  USING (
    organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
        AND role IN ('org_admin','org_supervisor')
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
        AND role IN ('org_admin','org_supervisor')
    )
  );

-- =========================================================
-- STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('training-media-public','training-media-public', true, 52428800,
    ARRAY['image/avif','image/gif','image/jpeg','image/png','image/webp',
          'audio/mpeg','audio/mp4','audio/x-m4a','audio/aac',
          'video/mp4','video/webm','video/quicktime']),
  ('training-media-private','training-media-private', false, 209715200,
    ARRAY['image/avif','image/gif','image/jpeg','image/png','image/webp',
          'audio/mpeg','audio/mp4','audio/x-m4a','audio/aac',
          'video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- ---------- STORAGE POLICIES ----------
-- Public bucket: anyone can read; authed org leaders + platform admins can write under their scope
CREATE POLICY "Public training media is readable by all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'training-media-public');

CREATE POLICY "Org leaders upload public training media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'training-media-public'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR (
        (storage.foldername(name))[1] IN (
          SELECT organization_id::text FROM public.organization_members
          WHERE user_id = auth.uid()
            AND role IN ('org_admin','org_supervisor')
        )
      )
      OR (storage.foldername(name))[1] = 'canonical'
    )
  );

CREATE POLICY "Org leaders update public training media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'training-media-public'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM public.organization_members
        WHERE user_id = auth.uid() AND role IN ('org_admin','org_supervisor')
      )
    )
  );

CREATE POLICY "Org leaders delete public training media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'training-media-public'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM public.organization_members
        WHERE user_id = auth.uid() AND role IN ('org_admin','org_supervisor')
      )
    )
  );

-- Private bucket: org-scoped reads + writes
CREATE POLICY "Org members read their private training media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'training-media-private'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Org leaders upload private training media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'training-media-private'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM public.organization_members
        WHERE user_id = auth.uid() AND role IN ('org_admin','org_supervisor')
      )
    )
  );

CREATE POLICY "Org leaders update private training media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'training-media-private'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM public.organization_members
        WHERE user_id = auth.uid() AND role IN ('org_admin','org_supervisor')
      )
    )
  );

CREATE POLICY "Org leaders delete private training media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'training-media-private'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM public.organization_members
        WHERE user_id = auth.uid() AND role IN ('org_admin','org_supervisor')
      )
    )
  );
