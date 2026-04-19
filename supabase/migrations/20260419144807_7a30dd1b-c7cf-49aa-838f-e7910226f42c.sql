-- Extend blog_posts with rich vlog/blog media fields
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_provider TEXT, -- 'youtube' | 'vimeo' | 'upload' | 'embed'
  ADD COLUMN IF NOT EXISTS gallery JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of {url, caption, alt}
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_title TEXT,
  ADD COLUMN IF NOT EXISTS seo_description TEXT,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

-- Public storage bucket for blog media (images + video uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-media', 'blog-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: public read; writes restricted to platform admins / developers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Blog media public read') THEN
    CREATE POLICY "Blog media public read"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'blog-media');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Blog media admin insert') THEN
    CREATE POLICY "Blog media admin insert"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'blog-media'
        AND (
          public.has_role(auth.uid(), 'admin'::public.app_role)
          OR public.has_role(auth.uid(), 'developer'::public.app_role)
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Blog media admin update') THEN
    CREATE POLICY "Blog media admin update"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'blog-media'
        AND (
          public.has_role(auth.uid(), 'admin'::public.app_role)
          OR public.has_role(auth.uid(), 'developer'::public.app_role)
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Blog media admin delete') THEN
    CREATE POLICY "Blog media admin delete"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'blog-media'
        AND (
          public.has_role(auth.uid(), 'admin'::public.app_role)
          OR public.has_role(auth.uid(), 'developer'::public.app_role)
        )
      );
  END IF;
END $$;