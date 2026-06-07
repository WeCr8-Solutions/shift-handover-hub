
-- Quiz answer column protection: revoke correct_answers + explanation from non-admin readers.
-- Admins continue reading via the existing gca_questions_admin / oap_quiz_questions_admin views.
REVOKE SELECT (correct_answers, explanation) ON public.gca_questions FROM anon, authenticated;
REVOKE SELECT (correct_answers, explanation) ON public.oap_quiz_questions FROM anon, authenticated;

-- Re-grant SELECT on the remaining safe columns so quiz-taking UI keeps working.
GRANT SELECT (id, bank_id, question_type, prompt, choices, points, sort_order, created_at, updated_at)
  ON public.gca_questions TO authenticated;
GRANT SELECT (id, quiz_id, question_type, prompt, choices, points, sort_order, created_at, updated_at)
  ON public.oap_quiz_questions TO authenticated;

-- service_role retains full access (used by edge functions like grade_gca_attempt / issue-certificate).
GRANT ALL ON public.gca_questions TO service_role;
GRANT ALL ON public.oap_quiz_questions TO service_role;

-- Fix SECURITY DEFINER view: mfg_100_honorees was created with security_invoker=false.
ALTER VIEW public.mfg_100_honorees SET (security_invoker = true);
