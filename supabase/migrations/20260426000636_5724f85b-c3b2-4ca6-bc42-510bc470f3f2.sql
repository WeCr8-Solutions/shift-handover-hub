DROP FUNCTION IF EXISTS public.get_public_talent_profile_bundle(text);

CREATE OR REPLACE FUNCTION public.get_public_talent_profile_bundle(_username text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
WITH profile AS (
  SELECT *
  FROM public.get_public_operator_profile(_username)
  LIMIT 1
),
mini_site AS (
  SELECT
    op.services,
    op.gallery,
    op.testimonials,
    op.business_hours,
    op.latitude,
    op.longitude,
    op.vcard_full_name,
    op.vcard_title,
    op.vcard_company,
    op.card_slug,
    op.cta_label,
    op.cta_url
  FROM public.operator_profiles op
  JOIN profile p ON p.user_id = op.user_id
)
SELECT CASE
  WHEN EXISTS (SELECT 1 FROM profile) THEN jsonb_build_object(
    'profile', (SELECT to_jsonb(p) FROM profile p),
    'certs', COALESCE((
      SELECT jsonb_agg(to_jsonb(c) ORDER BY c.issued_date DESC NULLS LAST, c.created_at DESC NULLS LAST)
      FROM (
        SELECT
          oc.id,
          oc.name,
          oc.issuer,
          oc.issued_date,
          oc.expires_date,
          oc.credential_id,
          oc.credential_url,
          oc.attachment_url,
          oc.verification_source,
          oc.linked_cert_id,
          oc.is_public,
          oc.created_at
        FROM public.operator_certifications oc
        JOIN profile p ON p.user_id = oc.user_id
        WHERE oc.is_public = true
      ) c
    ), '[]'::jsonb),
    'skills', COALESCE((
      SELECT jsonb_agg(to_jsonb(s) ORDER BY s.skill)
      FROM (
        SELECT os.id, os.skill, os.proficiency, os.years_used
        FROM public.operator_skills os
        JOIN profile p ON p.user_id = os.user_id
      ) s
    ), '[]'::jsonb),
    'machines', COALESCE((
      SELECT jsonb_agg(to_jsonb(m) ORDER BY m.machine_category, m.machine_make, m.machine_model)
      FROM (
        SELECT
          om.id,
          om.machine_category,
          om.machine_make,
          om.machine_model,
          om.control_type,
          om.proficiency,
          om.years_experience
        FROM public.operator_machine_proficiencies om
        JOIN profile p ON p.user_id = om.user_id
      ) m
    ), '[]'::jsonb),
    'work', COALESCE((
      SELECT jsonb_agg(to_jsonb(w) ORDER BY w.start_date DESC NULLS LAST)
      FROM (
        SELECT
          ow.id,
          ow.employer_name,
          ow.job_title,
          ow.start_date,
          ow.end_date,
          ow.is_current,
          ow.location,
          ow.description
        FROM public.operator_work_history ow
        JOIN profile p ON p.user_id = ow.user_id
      ) w
    ), '[]'::jsonb),
    'education', COALESCE((
      SELECT jsonb_agg(to_jsonb(e) ORDER BY e.end_date DESC NULLS LAST)
      FROM (
        SELECT
          oe.id,
          oe.school_name,
          oe.degree,
          oe.field_of_study,
          oe.start_date,
          oe.end_date
        FROM public.operator_education oe
        JOIN profile p ON p.user_id = oe.user_id
      ) e
    ), '[]'::jsonb),
    'mini_site', COALESCE((SELECT to_jsonb(ms) FROM mini_site ms), '{}'::jsonb)
  )
  ELSE NULL::jsonb
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_talent_profile_bundle(text) TO anon, authenticated;