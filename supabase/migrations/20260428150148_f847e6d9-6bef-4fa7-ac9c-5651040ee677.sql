-- Allow anonymous (public) visitors to read canonical inspection tools & categories
-- so the public /resources/measuring-tools learner library renders without login.
-- Canonical rows are reference data (same as training_media for GCA images).

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='inspection_tool_categories' AND policyname='Anyone can view canonical categories (public)') THEN
    CREATE POLICY "Anyone can view canonical categories (public)"
      ON public.inspection_tool_categories
      FOR SELECT
      TO anon, authenticated
      USING (is_canonical = true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='inspection_tools' AND policyname='Anyone can view canonical tools (public)') THEN
    CREATE POLICY "Anyone can view canonical tools (public)"
      ON public.inspection_tools
      FOR SELECT
      TO anon, authenticated
      USING (is_canonical = true AND is_active = true);
  END IF;
END $$;