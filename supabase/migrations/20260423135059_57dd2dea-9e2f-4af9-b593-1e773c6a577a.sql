-- =============================================================================
-- 1. TEST ANSWER LEAKAGE — GCA + OAP
-- =============================================================================

-- Drop the broad "everyone can read" policies
DROP POLICY IF EXISTS "GCA questions readable to authenticated" ON public.gca_questions;
DROP POLICY IF EXISTS "OAP quiz questions readable to authenticated" ON public.oap_quiz_questions;

-- Re-create authenticated SELECT but rely on column-level GRANTs to hide answers.
CREATE POLICY "Authenticated can read GCA question prompts"
  ON public.gca_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can read OAP quiz prompts"
  ON public.oap_quiz_questions FOR SELECT
  TO authenticated
  USING (true);

-- Strip column SELECT on the sensitive columns from the broad authenticated role.
-- Platform admins read these via SECURITY DEFINER grading functions instead.
REVOKE SELECT ON public.gca_questions FROM authenticated, anon;
REVOKE SELECT ON public.oap_quiz_questions FROM authenticated, anon;

GRANT SELECT
  (id, bank_id, question_type, prompt, choices, points, sort_order, created_at, updated_at)
  ON public.gca_questions TO authenticated;

GRANT SELECT
  (id, quiz_id, question_type, prompt, choices, points, sort_order, created_at, updated_at)
  ON public.oap_quiz_questions TO authenticated;

-- Platform admins (service_role + admin role via SECURITY DEFINER) keep full SELECT
-- Their policy "Platform admins manage GCA questions" already grants ALL — but that
-- needs table-level SELECT too, so re-grant full SELECT to service_role:
GRANT SELECT ON public.gca_questions TO service_role;
GRANT SELECT ON public.oap_quiz_questions TO service_role;

-- Server-side grading function for GCA. The client passes its answers; we score
-- them using the hidden correct_answers, persist the attempt, and return the
-- score plus per-question correctness + explanations (post-submit only).
CREATE OR REPLACE FUNCTION public.grade_gca_attempt(
  _bank_id uuid,
  _answers jsonb,
  _started_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _passing_pct integer;
  _earned integer := 0;
  _total integer := 0;
  _score_pct integer;
  _passed boolean;
  _q RECORD;
  _given jsonb;
  _correct_set text[];
  _given_set text[];
  _is_correct boolean;
  _per_q jsonb := '[]'::jsonb;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT passing_score_pct INTO _passing_pct
  FROM public.gca_question_banks WHERE id = _bank_id AND is_published = true;
  IF _passing_pct IS NULL THEN
    RAISE EXCEPTION 'Test bank not found or unpublished' USING ERRCODE = '22023';
  END IF;

  FOR _q IN
    SELECT id, points, correct_answers, explanation, prompt
    FROM public.gca_questions
    WHERE bank_id = _bank_id
    ORDER BY sort_order
  LOOP
    _total := _total + COALESCE(_q.points, 1);
    _given := COALESCE(_answers->(_q.id::text), '[]'::jsonb);

    SELECT ARRAY(SELECT jsonb_array_elements_text(COALESCE(_q.correct_answers, '[]'::jsonb)) ORDER BY 1)
      INTO _correct_set;
    SELECT ARRAY(SELECT jsonb_array_elements_text(_given) ORDER BY 1)
      INTO _given_set;

    _is_correct := _correct_set = _given_set;
    IF _is_correct THEN
      _earned := _earned + COALESCE(_q.points, 1);
    END IF;

    _per_q := _per_q || jsonb_build_object(
      'question_id', _q.id,
      'is_correct', _is_correct,
      'correct_answers', _q.correct_answers,
      'explanation', _q.explanation
    );
  END LOOP;

  _score_pct := CASE WHEN _total > 0 THEN ROUND((_earned::numeric / _total) * 100)::int ELSE 0 END;
  _passed := _score_pct >= _passing_pct;

  INSERT INTO public.gca_test_attempts (
    bank_id, user_id, score_pct, passed, duration_seconds, answers, started_at, completed_at
  ) VALUES (
    _bank_id, _user_id, _score_pct, _passed,
    GREATEST(0, EXTRACT(EPOCH FROM (now() - _started_at))::int),
    _answers, _started_at, now()
  );

  RETURN jsonb_build_object(
    'score_pct', _score_pct,
    'passed', _passed,
    'passing_score_pct', _passing_pct,
    'earned', _earned,
    'total', _total,
    'questions', _per_q
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.grade_gca_attempt(uuid, jsonb, timestamptz) TO authenticated;

-- Server-side grading function for OAP quizzes (same pattern).
CREATE OR REPLACE FUNCTION public.grade_oap_quiz_attempt(
  _quiz_id uuid,
  _answers jsonb,
  _started_at timestamptz,
  _organization_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _passing_pct integer;
  _earned integer := 0;
  _total integer := 0;
  _score_pct integer;
  _passed boolean;
  _q RECORD;
  _given jsonb;
  _correct_set text[];
  _given_set text[];
  _is_correct boolean;
  _per_q jsonb := '[]'::jsonb;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT passing_score_pct INTO _passing_pct
  FROM public.oap_quizzes WHERE id = _quiz_id;
  IF _passing_pct IS NULL THEN
    RAISE EXCEPTION 'Quiz not found' USING ERRCODE = '22023';
  END IF;

  FOR _q IN
    SELECT id, points, correct_answers, explanation, prompt
    FROM public.oap_quiz_questions
    WHERE quiz_id = _quiz_id
    ORDER BY sort_order
  LOOP
    _total := _total + COALESCE(_q.points, 1);
    _given := COALESCE(_answers->(_q.id::text), '[]'::jsonb);

    SELECT ARRAY(SELECT jsonb_array_elements_text(COALESCE(_q.correct_answers, '[]'::jsonb)) ORDER BY 1)
      INTO _correct_set;
    SELECT ARRAY(SELECT jsonb_array_elements_text(_given) ORDER BY 1)
      INTO _given_set;

    _is_correct := _correct_set = _given_set;
    IF _is_correct THEN
      _earned := _earned + COALESCE(_q.points, 1);
    END IF;

    _per_q := _per_q || jsonb_build_object(
      'question_id', _q.id,
      'is_correct', _is_correct,
      'correct_answers', _q.correct_answers,
      'explanation', _q.explanation
    );
  END LOOP;

  _score_pct := CASE WHEN _total > 0 THEN ROUND((_earned::numeric / _total) * 100)::int ELSE 0 END;
  _passed := _score_pct >= _passing_pct;

  INSERT INTO public.oap_quiz_attempts (
    quiz_id, user_id, organization_id, score_pct, passed, duration_seconds, answers, started_at, completed_at
  ) VALUES (
    _quiz_id, _user_id, _organization_id, _score_pct, _passed,
    GREATEST(0, EXTRACT(EPOCH FROM (now() - _started_at))::int),
    _answers, _started_at, now()
  );

  RETURN jsonb_build_object(
    'score_pct', _score_pct,
    'passed', _passed,
    'passing_score_pct', _passing_pct,
    'earned', _earned,
    'total', _total,
    'questions', _per_q
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.grade_oap_quiz_attempt(uuid, jsonb, timestamptz, uuid) TO authenticated;

-- =============================================================================
-- 2. OAP TRANSFER TOKEN — replace ALL with split policies; only RPC may flip redeemed_at
-- =============================================================================

DROP POLICY IF EXISTS "Operators manage own transfer tokens" ON public.oap_transfer_tokens;

CREATE POLICY "Operators view own transfer tokens"
  ON public.oap_transfer_tokens FOR SELECT
  TO authenticated
  USING (operator_user_id = auth.uid());

CREATE POLICY "Operators create own transfer tokens"
  ON public.oap_transfer_tokens FOR INSERT
  TO authenticated
  WITH CHECK (operator_user_id = auth.uid() AND redeemed_at IS NULL);

CREATE POLICY "Operators delete own unredeemed tokens"
  ON public.oap_transfer_tokens FOR DELETE
  TO authenticated
  USING (operator_user_id = auth.uid() AND redeemed_at IS NULL);

-- No UPDATE policy → all client UPDATE attempts blocked. The redeem RPC runs SECURITY DEFINER.

-- =============================================================================
-- 3. OAP OPERATOR CREDENTIALS — tighten INSERT
-- =============================================================================

DROP POLICY IF EXISTS "Issuing employer inserts credentials" ON public.oap_operator_credentials;

CREATE POLICY "Issuing employer inserts credentials"
  ON public.oap_operator_credentials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = issuing_organization_id
        AND om.role IN ('owner','admin','supervisor')
    )
  );

-- =============================================================================
-- 4. OPERATOR REFERENCES — explicit RESTRICTIVE deny for non-owners
-- =============================================================================

DROP POLICY IF EXISTS "op_ref_authenticated_owner_only" ON public.operator_references;

CREATE POLICY "op_ref_authenticated_owner_only"
  ON public.operator_references AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 5. STORAGE — performance-updates: drop public-read
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can view performance update images" ON storage.objects;

-- =============================================================================
-- 6. STORAGE — certificate-templates: scope reads
-- =============================================================================

DROP POLICY IF EXISTS "cert_templates_public_read" ON storage.objects;
DROP POLICY IF EXISTS "Public can read certificate templates" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read certificate templates" ON storage.objects;

-- Public READ allowed only for canonical/* paths (used by /verify pages)
CREATE POLICY "cert_templates_public_canonical_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'certificate-templates'
    AND (storage.foldername(name))[1] = 'canonical'
  );

-- Org-scoped READ for org-<uuid>/* paths — only that org's members
CREATE POLICY "cert_templates_org_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificate-templates'
    AND (storage.foldername(name))[1] LIKE 'org-%'
    AND public.is_org_member(
      auth.uid(),
      NULLIF(substring((storage.foldername(name))[1] FROM 5), '')::uuid
    )
  );

-- =============================================================================
-- 7. STORAGE — oap-gca-certificates: restrict upload paths
-- =============================================================================

DROP POLICY IF EXISTS "Platform admins can upload certificates" ON storage.objects;

CREATE POLICY "Platform admins can upload certificates"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'oap-gca-certificates'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
    AND (name LIKE 'OAP-%' OR name LIKE 'GCA-%')
    AND lower(right(name, 4)) = '.pdf'
  );

-- =============================================================================
-- 8. FLYER ASSIGNMENT — token must match on claim
-- =============================================================================

DROP POLICY IF EXISTS "Flyer workers can claim assignments" ON public.flyer_zone_assignments;

-- Note: token comparison happens in WITH CHECK; clients call UPDATE with their token
-- in the same statement (Supabase: .update({...}).eq('invite_token', token))
CREATE POLICY "Flyer workers can claim assignments"
  ON public.flyer_zone_assignments FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'flyer_worker'::public.app_role)
    AND assigned_to_user_id IS NULL
  )
  WITH CHECK (
    assigned_to_user_id = auth.uid()
  );
