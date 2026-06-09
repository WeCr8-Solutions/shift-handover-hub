
-- 1. Drop overly broad storage policies if they still exist
DROP POLICY IF EXISTS "operator_profiles_path_scoped_read" ON storage.objects;
DROP POLICY IF EXISTS "op_files_public_read_user_scoped" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view performance update images" ON storage.objects;

-- 2. Lock down GCA answer-key columns at the column-grant level so that
-- even with the row-level SELECT policy, the `authenticated` / `anon` roles
-- cannot read `correct_answers` or `explanation` from the base table.
-- Admin reads happen via the `gca_questions_admin` view (service_role / admin path).
REVOKE SELECT (correct_answers, explanation) ON public.gca_questions FROM authenticated;
REVOKE SELECT (correct_answers, explanation) ON public.gca_questions FROM anon;
-- Re-grant SELECT on the remaining safe columns to authenticated so frontend reads still work.
GRANT SELECT (id, bank_id, question_type, prompt, choices, points, sort_order, created_at, updated_at)
  ON public.gca_questions TO authenticated;
