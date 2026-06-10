
-- Revoke column-level SELECT on correct_answers so PostgREST will not return it
-- to authenticated or anonymous callers. The grading edge function uses service_role
-- and is unaffected. Platform admins retain access via service_role / has_role checks.
REVOKE SELECT (correct_answers) ON public.oap_quiz_questions FROM authenticated;
REVOKE SELECT (correct_answers) ON public.oap_quiz_questions FROM anon;
REVOKE SELECT (correct_answers) ON public.oap_quiz_questions FROM PUBLIC;
