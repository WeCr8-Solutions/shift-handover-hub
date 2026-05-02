-- Widen the type check constraints first
ALTER TABLE public.gca_questions DROP CONSTRAINT IF EXISTS gca_questions_question_type_check;
ALTER TABLE public.gca_questions ADD CONSTRAINT gca_questions_question_type_check
  CHECK (question_type = ANY (ARRAY['multiple_choice','true_false','fill_in','multi_select','drag_drop','single_choice','multi_choice']));

ALTER TABLE public.oap_quiz_questions DROP CONSTRAINT IF EXISTS oap_quiz_questions_question_type_check;
ALTER TABLE public.oap_quiz_questions ADD CONSTRAINT oap_quiz_questions_question_type_check
  CHECK (question_type = ANY (ARRAY['multiple_choice','true_false','fill_in','multi_select','single_choice','multi_choice']));

-- Audit log tables
CREATE TABLE IF NOT EXISTS public.gca_question_repair_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  bank_id uuid,
  prompt text,
  question_type_before text,
  choices_before jsonb,
  correct_answers_before jsonb,
  choices_after jsonb,
  correct_answers_after jsonb,
  unresolved boolean NOT NULL DEFAULT false,
  notes text,
  repaired_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gca_question_repair_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins read gca repair log" ON public.gca_question_repair_log;
CREATE POLICY "Platform admins read gca repair log"
  ON public.gca_question_repair_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.oap_question_repair_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  quiz_id uuid,
  prompt text,
  question_type_before text,
  choices_before jsonb,
  correct_answers_before jsonb,
  choices_after jsonb,
  correct_answers_after jsonb,
  unresolved boolean NOT NULL DEFAULT false,
  notes text,
  repaired_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.oap_question_repair_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Platform admins read oap repair log" ON public.oap_question_repair_log;
CREATE POLICY "Platform admins read oap repair log"
  ON public.oap_question_repair_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public._normalize_question_choices(
  _choices jsonb,
  _correct jsonb
) RETURNS TABLE (new_choices jsonb, new_correct jsonb, unresolved boolean, notes text)
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  _alphabet text[] := ARRAY['a','b','c','d','e','f','g','h','i','j'];
  _arr jsonb := COALESCE(_choices, '[]'::jsonb);
  _new_choices jsonb := '[]'::jsonb;
  _labels text[] := ARRAY[]::text[];
  _keys text[] := ARRAY[]::text[];
  _i int;
  _elem jsonb;
  _label text;
  _key text;
  _correct_arr text[];
  _new_correct text[] := ARRAY[]::text[];
  _v text;
  _resolved boolean;
  _unresolved boolean := false;
  _notes text := '';
BEGIN
  FOR _i IN 0..jsonb_array_length(_arr)-1 LOOP
    _elem := _arr -> _i;
    IF jsonb_typeof(_elem) = 'object' AND _elem ? 'key' AND _elem ? 'label' THEN
      _key := _elem->>'key';
      _label := _elem->>'label';
    ELSIF jsonb_typeof(_elem) = 'string' THEN
      _key := _alphabet[_i+1];
      _label := _elem #>> '{}';
    ELSE
      _key := _alphabet[_i+1];
      _label := _elem::text;
    END IF;
    _new_choices := _new_choices || jsonb_build_object('key', _key, 'label', _label);
    _labels := _labels || _label;
    _keys := _keys || _key;
  END LOOP;

  SELECT ARRAY(SELECT jsonb_array_elements_text(COALESCE(_correct,'[]'::jsonb)))
    INTO _correct_arr;

  FOREACH _v IN ARRAY _correct_arr LOOP
    _resolved := false;
    IF _v = ANY(_keys) THEN
      _new_correct := _new_correct || _v;
      _resolved := true;
    ELSIF _v ~ '^[0-9]+$' AND _v::int < array_length(_keys,1) THEN
      _new_correct := _new_correct || _keys[_v::int + 1];
      _resolved := true;
    ELSE
      FOR _i IN 1..array_length(_labels,1) LOOP
        IF _labels[_i] = _v THEN
          _new_correct := _new_correct || _keys[_i];
          _resolved := true;
          EXIT;
        END IF;
      END LOOP;
      IF NOT _resolved THEN
        FOR _i IN 1..array_length(_labels,1) LOOP
          IF lower(_labels[_i]) = lower(_v) THEN
            _new_correct := _new_correct || _keys[_i];
            _resolved := true;
            EXIT;
          END IF;
        END LOOP;
      END IF;
    END IF;
    IF NOT _resolved THEN
      _unresolved := true;
      _notes := _notes || format('unresolved="%s"; ', _v);
    END IF;
  END LOOP;

  SELECT ARRAY(SELECT DISTINCT k FROM unnest(_new_correct) k ORDER BY k)
    INTO _new_correct;

  RETURN QUERY SELECT
    _new_choices,
    to_jsonb(_new_correct),
    _unresolved,
    NULLIF(_notes, '');
END;
$$;

DO $$
DECLARE
  _row RECORD;
  _norm RECORD;
  _new_type text;
BEGIN
  FOR _row IN SELECT id, bank_id, prompt, question_type, choices, correct_answers FROM public.gca_questions LOOP
    SELECT * INTO _norm FROM public._normalize_question_choices(_row.choices, _row.correct_answers);
    _new_type := CASE
      WHEN _row.question_type = 'true_false' THEN 'true_false'
      WHEN _row.question_type IN ('multi_choice','multi_select') THEN 'multi_choice'
      ELSE 'single_choice'
    END;
    INSERT INTO public.gca_question_repair_log (
      question_id, bank_id, prompt, question_type_before,
      choices_before, correct_answers_before,
      choices_after, correct_answers_after, unresolved, notes
    ) VALUES (
      _row.id, _row.bank_id, _row.prompt, _row.question_type,
      _row.choices, _row.correct_answers,
      _norm.new_choices, _norm.new_correct, _norm.unresolved, _norm.notes
    );
    UPDATE public.gca_questions
       SET choices = _norm.new_choices,
           correct_answers = _norm.new_correct,
           question_type = _new_type
     WHERE id = _row.id;
  END LOOP;

  FOR _row IN SELECT id, quiz_id, prompt, question_type, choices, correct_answers FROM public.oap_quiz_questions LOOP
    SELECT * INTO _norm FROM public._normalize_question_choices(_row.choices, _row.correct_answers);
    _new_type := CASE
      WHEN _row.question_type = 'true_false' THEN 'true_false'
      WHEN _row.question_type IN ('multi_choice','multi_select') THEN 'multi_choice'
      ELSE 'single_choice'
    END;
    INSERT INTO public.oap_question_repair_log (
      question_id, quiz_id, prompt, question_type_before,
      choices_before, correct_answers_before,
      choices_after, correct_answers_after, unresolved, notes
    ) VALUES (
      _row.id, _row.quiz_id, _row.prompt, _row.question_type,
      _row.choices, _row.correct_answers,
      _norm.new_choices, _norm.new_correct, _norm.unresolved, _norm.notes
    );
    UPDATE public.oap_quiz_questions
       SET choices = _norm.new_choices,
           correct_answers = _norm.new_correct,
           question_type = _new_type
     WHERE id = _row.id;
  END LOOP;
END $$;

DO $$
DECLARE
  _bad int;
BEGIN
  SELECT COUNT(*) INTO _bad
  FROM public.gca_questions q
  WHERE NOT (
    ARRAY(SELECT jsonb_array_elements_text(q.correct_answers))
    <@ ARRAY(SELECT (c->>'key') FROM jsonb_array_elements(q.choices) c)
  );
  IF _bad > 0 THEN
    RAISE EXCEPTION 'GCA question normalization left % rows with orphan correct keys', _bad;
  END IF;

  SELECT COUNT(*) INTO _bad
  FROM public.oap_quiz_questions q
  WHERE NOT (
    ARRAY(SELECT jsonb_array_elements_text(q.correct_answers))
    <@ ARRAY(SELECT (c->>'key') FROM jsonb_array_elements(q.choices) c)
  );
  IF _bad > 0 THEN
    RAISE EXCEPTION 'OAP question normalization left % rows with orphan correct keys', _bad;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.grade_gca_attempt(
  _bank_id uuid, _answers jsonb, _started_at timestamp with time zone
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  _choice_keys text[];
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
    SELECT id, points, correct_answers, explanation, question_type, choices
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
    SELECT ARRAY(SELECT (c->>'key') FROM jsonb_array_elements(_q.choices) c)
      INTO _choice_keys;
    IF EXISTS (SELECT 1 FROM unnest(_given_set) k WHERE k <> ALL(_choice_keys)) THEN
      RAISE EXCEPTION 'Submission contains unknown choice key for question %', _q.id
        USING ERRCODE = '22023';
    END IF;
    IF _q.question_type IN ('single_choice','true_false') AND array_length(_given_set,1) IS DISTINCT FROM 1 THEN
      _is_correct := false;
    ELSE
      _is_correct := _correct_set = _given_set;
    END IF;
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
$function$;

CREATE OR REPLACE FUNCTION public.grade_oap_quiz_attempt(
  _quiz_id uuid, _answers jsonb, _started_at timestamp with time zone, _organization_id uuid DEFAULT NULL::uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  _choice_keys text[];
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
    SELECT id, points, correct_answers, explanation, question_type, choices
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
    SELECT ARRAY(SELECT (c->>'key') FROM jsonb_array_elements(_q.choices) c)
      INTO _choice_keys;
    IF EXISTS (SELECT 1 FROM unnest(_given_set) k WHERE k <> ALL(_choice_keys)) THEN
      RAISE EXCEPTION 'Submission contains unknown choice key for question %', _q.id
        USING ERRCODE = '22023';
    END IF;
    IF _q.question_type IN ('single_choice','true_false') AND array_length(_given_set,1) IS DISTINCT FROM 1 THEN
      _is_correct := false;
    ELSE
      _is_correct := _correct_set = _given_set;
    END IF;
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
$function$;

DROP FUNCTION IF EXISTS public._normalize_question_choices(jsonb, jsonb);