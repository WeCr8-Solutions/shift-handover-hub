-- Temporarily allow authenticated/service writes to canonical GCA + media tables for seeding.
-- Add a 'seed admin' policy gated to the postgres role only (which is what direct psql uses).
DO $$ BEGIN
  EXECUTE 'GRANT INSERT, UPDATE ON public.gca_question_banks TO authenticator';
  EXECUTE 'GRANT INSERT, UPDATE ON public.gca_questions TO authenticator';
  EXECUTE 'GRANT INSERT, UPDATE ON public.training_media TO authenticator';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DROP POLICY IF EXISTS "seed: platform admin can insert canonical banks" ON public.gca_question_banks;
CREATE POLICY "seed: platform admin can insert canonical banks"
ON public.gca_question_banks FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "seed: platform admin can update canonical banks" ON public.gca_question_banks;
CREATE POLICY "seed: platform admin can update canonical banks"
ON public.gca_question_banks FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "seed: platform admin can insert canonical questions" ON public.gca_questions;
CREATE POLICY "seed: platform admin can insert canonical questions"
ON public.gca_questions FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "seed: platform admin can insert canonical media" ON public.training_media;
CREATE POLICY "seed: platform admin can insert canonical media"
ON public.training_media FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') AND organization_id IS NULL);