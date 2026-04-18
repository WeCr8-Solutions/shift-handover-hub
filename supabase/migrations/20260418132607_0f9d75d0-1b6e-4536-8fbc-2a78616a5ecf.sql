DO $$ BEGIN
  EXECUTE 'GRANT INSERT, UPDATE ON public.gca_question_banks TO sandbox_exec';
  EXECUTE 'GRANT INSERT, UPDATE ON public.gca_questions TO sandbox_exec';
  EXECUTE 'GRANT INSERT, UPDATE ON public.training_media TO sandbox_exec';
  EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sandbox_exec';
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'grant failed: %', SQLERRM; END $$;