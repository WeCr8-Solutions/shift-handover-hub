-- Helper: returns true if the linked entity is org-owned and the caller is an
-- admin/supervisor of that org. Used by the handbook_links org-write policy.
CREATE OR REPLACE FUNCTION public.handbook_link_target_is_my_org(
  _entity_type text,
  _entity_id uuid
) RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
BEGIN
  IF _entity_id IS NULL THEN RETURN false; END IF;

  CASE _entity_type
    WHEN 'gca_question_bank' THEN
      SELECT organization_id INTO _org_id FROM public.gca_question_banks WHERE id = _entity_id;
    WHEN 'gca_question' THEN
      SELECT b.organization_id INTO _org_id
        FROM public.gca_questions q
        JOIN public.gca_question_banks b ON b.id = q.bank_id
        WHERE q.id = _entity_id;
    WHEN 'oap_course' THEN
      SELECT organization_id INTO _org_id FROM public.oap_courses WHERE id = _entity_id;
    WHEN 'oap_lesson' THEN
      SELECT c.organization_id INTO _org_id
        FROM public.oap_lessons l
        JOIN public.oap_courses c ON c.id = l.course_id
        WHERE l.id = _entity_id;
    WHEN 'oap_quiz_question' THEN
      SELECT c.organization_id INTO _org_id
        FROM public.oap_quiz_questions qq
        JOIN public.oap_quizzes qz ON qz.id = qq.quiz_id
        JOIN public.oap_courses c ON c.id = qz.course_id
        WHERE qq.id = _entity_id;
    ELSE
      RETURN false;
  END CASE;

  IF _org_id IS NULL THEN RETURN false; END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid()
      AND organization_id = _org_id
      AND role = ANY (ARRAY['admin','supervisor'])
  );
END;
$$;

-- New RLS policy: org admins/supervisors can manage handbook_links for their
-- own org-owned content. Platform admins are already covered by the existing
-- "handbook_links write platform admin" policy.
DROP POLICY IF EXISTS "handbook_links org write" ON public.handbook_links;
CREATE POLICY "handbook_links org write"
ON public.handbook_links
FOR ALL
TO authenticated
USING (public.handbook_link_target_is_my_org(entity_type, entity_id))
WITH CHECK (public.handbook_link_target_is_my_org(entity_type, entity_id));