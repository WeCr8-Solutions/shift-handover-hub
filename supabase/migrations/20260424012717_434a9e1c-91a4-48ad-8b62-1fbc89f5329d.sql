-- ============================================================
-- 1. SCHEMA: add org-cloning + learning content to GCA banks
-- ============================================================
ALTER TABLE public.gca_question_banks
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS source_bank_id  uuid REFERENCES public.gca_question_banks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS learning_content text;

-- The slug must stay unique per (organization scope). Drop the global unique
-- and replace with a partial index per scope.
ALTER TABLE public.gca_question_banks DROP CONSTRAINT IF EXISTS gca_question_banks_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS gca_banks_slug_canonical_key
  ON public.gca_question_banks (slug) WHERE organization_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS gca_banks_slug_org_key
  ON public.gca_question_banks (organization_id, slug) WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gca_banks_org ON public.gca_question_banks(organization_id);

-- ============================================================
-- 2. RLS: split canonical (platform-admin) vs org (org-admin)
-- ============================================================
DROP POLICY IF EXISTS "GCA banks readable when published"             ON public.gca_question_banks;
DROP POLICY IF EXISTS "Platform admins manage GCA banks"              ON public.gca_question_banks;
DROP POLICY IF EXISTS "seed: platform admin can insert canonical banks" ON public.gca_question_banks;
DROP POLICY IF EXISTS "seed: platform admin can update canonical banks" ON public.gca_question_banks;

-- Read: published canonical OR any bank owned by your org OR platform admin
CREATE POLICY "gca_banks_select"
  ON public.gca_question_banks FOR SELECT
  USING (
    (organization_id IS NULL AND is_published = true)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id))
  );

-- Platform admin owns all canonical writes
CREATE POLICY "gca_banks_canonical_admin_all"
  ON public.gca_question_banks FOR ALL
  USING (organization_id IS NULL AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (organization_id IS NULL AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Org admins/owners/supervisors manage their org's clones
CREATE POLICY "gca_banks_org_admin_all"
  ON public.gca_question_banks FOR ALL
  USING (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = gca_question_banks.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','supervisor')
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = gca_question_banks.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','supervisor')
    )
  );

-- ============================================================
-- 3. RLS for gca_questions: cascade based on parent bank ownership
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can read GCA question prompts"        ON public.gca_questions;
DROP POLICY IF EXISTS "Platform admins manage GCA questions"               ON public.gca_questions;
DROP POLICY IF EXISTS "seed: platform admin can insert canonical questions" ON public.gca_questions;

CREATE POLICY "gca_questions_select"
  ON public.gca_questions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.gca_question_banks b
      WHERE b.id = gca_questions.bank_id
        AND (
          (b.organization_id IS NULL AND b.is_published = true)
          OR public.has_role(auth.uid(), 'admin'::public.app_role)
          OR (b.organization_id IS NOT NULL AND public.is_org_member(auth.uid(), b.organization_id))
        )
    )
  );

CREATE POLICY "gca_questions_admin_all"
  ON public.gca_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gca_question_banks b
      WHERE b.id = gca_questions.bank_id
        AND (
          (b.organization_id IS NULL AND public.has_role(auth.uid(), 'admin'::public.app_role))
          OR (b.organization_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.organization_members om
                WHERE om.organization_id = b.organization_id
                  AND om.user_id = auth.uid()
                  AND om.role IN ('owner','admin','supervisor')
              ))
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.gca_question_banks b
      WHERE b.id = gca_questions.bank_id
        AND (
          (b.organization_id IS NULL AND public.has_role(auth.uid(), 'admin'::public.app_role))
          OR (b.organization_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM public.organization_members om
                WHERE om.organization_id = b.organization_id
                  AND om.user_id = auth.uid()
                  AND om.role IN ('owner','admin','supervisor')
              ))
        )
    )
  );

-- ============================================================
-- 4. RPC: clone canonical GCA bank into an organization
-- ============================================================
CREATE OR REPLACE FUNCTION public.clone_gca_bank_to_org(
  _source_bank_id   uuid,
  _organization_id  uuid,
  _override_title   text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _src   public.gca_question_banks%ROWTYPE;
  _new_id uuid;
  _new_slug text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Permission: platform admin OR org owner/admin/supervisor of target org
  IF NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = _organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner','admin','supervisor')
    )
  ) THEN
    RAISE EXCEPTION 'You do not have permission to clone tests into this organization';
  END IF;

  SELECT * INTO _src FROM public.gca_question_banks WHERE id = _source_bank_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source test bank not found';
  END IF;

  -- Force a unique slug within the org (append -copy, -copy-2, …)
  _new_slug := _src.slug || '-copy';
  WHILE EXISTS (
    SELECT 1 FROM public.gca_question_banks
    WHERE organization_id = _organization_id AND slug = _new_slug
  ) LOOP
    _new_slug := _src.slug || '-copy-' || floor(random()*9999)::int;
  END LOOP;

  INSERT INTO public.gca_question_banks (
    organization_id, source_bank_id, slug, title, topic, description,
    difficulty, passing_score_pct, is_pro_only, is_published, sort_order,
    cover_media_id, cover_overlay_text, cover_overlay_opacity,
    cover_overlay_position, cover_overlay_text_color, learning_content
  ) VALUES (
    _organization_id, _source_bank_id, _new_slug,
    COALESCE(_override_title, _src.title || ' (Org Copy)'),
    _src.topic, _src.description,
    _src.difficulty, _src.passing_score_pct, false, true, _src.sort_order,
    _src.cover_media_id, _src.cover_overlay_text, _src.cover_overlay_opacity,
    _src.cover_overlay_position, _src.cover_overlay_text_color, _src.learning_content
  )
  RETURNING id INTO _new_id;

  -- Copy questions
  INSERT INTO public.gca_questions
    (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
  SELECT _new_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order
  FROM public.gca_questions WHERE bank_id = _source_bank_id;

  RETURN _new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.clone_gca_bank_to_org(uuid, uuid, text) TO authenticated;
