-- ============================================================
-- Machine & Control Manuals library
-- ============================================================

-- ----- Tables -----
CREATE TABLE IF NOT EXISTS public.machine_manuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  manufacturer text NOT NULL,
  controller_family text,
  machine_model text,
  manual_type text NOT NULL CHECK (manual_type IN ('operator','maintenance','programming','parameters','alarms','installation','service','other')),
  title text NOT NULL,
  edition text,
  language text NOT NULL DEFAULT 'en',
  source_url text,
  storage_path text NOT NULL,
  file_size_bytes bigint,
  page_count integer,
  copyright_notice text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  is_canonical boolean NOT NULL DEFAULT false,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT machine_manuals_slug_scope_unique UNIQUE (slug, organization_id),
  CONSTRAINT machine_manuals_canonical_org_check CHECK (
    (is_canonical = true AND organization_id IS NULL) OR
    (is_canonical = false AND organization_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_machine_manuals_manufacturer ON public.machine_manuals(manufacturer);
CREATE INDEX IF NOT EXISTS idx_machine_manuals_org ON public.machine_manuals(organization_id);
CREATE INDEX IF NOT EXISTS idx_machine_manuals_tags ON public.machine_manuals USING gin(tags);

CREATE TABLE IF NOT EXISTS public.machine_manual_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manual_id uuid NOT NULL REFERENCES public.machine_manuals(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  text_content text,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(text_content,''))) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT machine_manual_pages_unique UNIQUE (manual_id, page_number)
);
CREATE INDEX IF NOT EXISTS idx_machine_manual_pages_search ON public.machine_manual_pages USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_machine_manual_pages_manual ON public.machine_manual_pages(manual_id, page_number);

CREATE TABLE IF NOT EXISTS public.user_manual_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manual_id uuid NOT NULL REFERENCES public.machine_manuals(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_manual_bookmarks_unique UNIQUE (user_id, manual_id, page_number)
);
CREATE INDEX IF NOT EXISTS idx_user_manual_bookmarks_user ON public.user_manual_bookmarks(user_id);

-- ----- updated_at trigger -----
DROP TRIGGER IF EXISTS update_machine_manuals_updated_at ON public.machine_manuals;
CREATE TRIGGER update_machine_manuals_updated_at
  BEFORE UPDATE ON public.machine_manuals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----- RLS -----
ALTER TABLE public.machine_manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_manual_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_manual_bookmarks ENABLE ROW LEVEL SECURITY;

-- machine_manuals SELECT: canonical visible to all authenticated; org-scoped to members
DROP POLICY IF EXISTS "manuals_select_canonical_or_member" ON public.machine_manuals;
CREATE POLICY "manuals_select_canonical_or_member"
  ON public.machine_manuals FOR SELECT TO authenticated
  USING (
    is_canonical = true
    OR organization_id IN (
      SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
    )
  );

-- INSERT: platform admin for canonical, org admin/supervisor for org-scoped
DROP POLICY IF EXISTS "manuals_insert_canonical_admin" ON public.machine_manuals;
CREATE POLICY "manuals_insert_canonical_admin"
  ON public.machine_manuals FOR INSERT TO authenticated
  WITH CHECK (
    (is_canonical = true AND public.has_role(auth.uid(), 'admin'::public.app_role))
    OR (
      is_canonical = false
      AND organization_id IN (
        SELECT om.organization_id FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
      )
    )
  );

DROP POLICY IF EXISTS "manuals_update_admin" ON public.machine_manuals;
CREATE POLICY "manuals_update_admin"
  ON public.machine_manuals FOR UPDATE TO authenticated
  USING (
    (is_canonical = true AND public.has_role(auth.uid(), 'admin'::public.app_role))
    OR organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
    )
  )
  WITH CHECK (
    (is_canonical = true AND public.has_role(auth.uid(), 'admin'::public.app_role))
    OR organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
    )
  );

DROP POLICY IF EXISTS "manuals_delete_admin" ON public.machine_manuals;
CREATE POLICY "manuals_delete_admin"
  ON public.machine_manuals FOR DELETE TO authenticated
  USING (
    (is_canonical = true AND public.has_role(auth.uid(), 'admin'::public.app_role))
    OR organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role = 'admin'
    )
  );

-- machine_manual_pages mirrors parent visibility
DROP POLICY IF EXISTS "manual_pages_select" ON public.machine_manual_pages;
CREATE POLICY "manual_pages_select"
  ON public.machine_manual_pages FOR SELECT TO authenticated
  USING (
    manual_id IN (
      SELECT id FROM public.machine_manuals
      WHERE is_canonical = true
        OR organization_id IN (
          SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "manual_pages_write_admin" ON public.machine_manual_pages;
CREATE POLICY "manual_pages_write_admin"
  ON public.machine_manual_pages FOR ALL TO authenticated
  USING (
    manual_id IN (
      SELECT id FROM public.machine_manuals
      WHERE (is_canonical = true AND public.has_role(auth.uid(), 'admin'::public.app_role))
        OR organization_id IN (
          SELECT om.organization_id FROM public.organization_members om
          WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
        )
    )
  )
  WITH CHECK (
    manual_id IN (
      SELECT id FROM public.machine_manuals
      WHERE (is_canonical = true AND public.has_role(auth.uid(), 'admin'::public.app_role))
        OR organization_id IN (
          SELECT om.organization_id FROM public.organization_members om
          WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
        )
    )
  );

-- user_manual_bookmarks: each user sees only their own
DROP POLICY IF EXISTS "bookmarks_own" ON public.user_manual_bookmarks;
CREATE POLICY "bookmarks_own"
  ON public.user_manual_bookmarks FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ----- Storage bucket (private) -----
INSERT INTO storage.buckets (id, name, public)
VALUES ('machine-manuals','machine-manuals', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: canonical manuals folder = "canonical/...", org manuals = "{org_id}/..."
DROP POLICY IF EXISTS "manuals_storage_select" ON storage.objects;
CREATE POLICY "manuals_storage_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'machine-manuals' AND (
      (storage.foldername(name))[1] = 'canonical'
      OR (storage.foldername(name))[1] IN (
        SELECT om.organization_id::text FROM public.organization_members om WHERE om.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "manuals_storage_insert" ON storage.objects;
CREATE POLICY "manuals_storage_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'machine-manuals' AND (
      ((storage.foldername(name))[1] = 'canonical' AND public.has_role(auth.uid(), 'admin'::public.app_role))
      OR (storage.foldername(name))[1] IN (
        SELECT om.organization_id::text FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
      )
    )
  );

DROP POLICY IF EXISTS "manuals_storage_delete" ON storage.objects;
CREATE POLICY "manuals_storage_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'machine-manuals' AND (
      ((storage.foldername(name))[1] = 'canonical' AND public.has_role(auth.uid(), 'admin'::public.app_role))
      OR (storage.foldername(name))[1] IN (
        SELECT om.organization_id::text FROM public.organization_members om
        WHERE om.user_id = auth.uid() AND om.role = 'admin'
      )
    )
  );