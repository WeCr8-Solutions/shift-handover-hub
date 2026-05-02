
-- Re-create the admin views as SECURITY INVOKER. The has_role() filter inside
-- the view still ensures only platform admins receive any rows.
DROP VIEW IF EXISTS public.oap_quiz_questions_admin;
DROP VIEW IF EXISTS public.gca_questions_admin;

CREATE VIEW public.oap_quiz_questions_admin
WITH (security_invoker = true) AS
SELECT q.*
FROM public.oap_quiz_questions q
WHERE public.has_role(auth.uid(), 'admin'::app_role);

CREATE VIEW public.gca_questions_admin
WITH (security_invoker = true) AS
SELECT q.*
FROM public.gca_questions q
WHERE public.has_role(auth.uid(), 'admin'::app_role);

REVOKE ALL ON public.oap_quiz_questions_admin FROM PUBLIC, anon;
REVOKE ALL ON public.gca_questions_admin FROM PUBLIC, anon;
GRANT SELECT ON public.oap_quiz_questions_admin TO authenticated;
GRANT SELECT ON public.gca_questions_admin TO authenticated;

COMMENT ON VIEW public.oap_quiz_questions_admin IS
  'Admin-only view exposing correct_answers + explanation. SECURITY INVOKER; has_role(admin) filter returns rows only for platform admins.';
COMMENT ON VIEW public.gca_questions_admin IS
  'Admin-only view exposing correct_answers + explanation. SECURITY INVOKER; has_role(admin) filter returns rows only for platform admins.';
