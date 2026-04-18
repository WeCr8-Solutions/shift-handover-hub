-- 1. Schema: canonical templates ----------------------------------------
ALTER TABLE public.oap_role_programs
  ADD COLUMN IF NOT EXISTS is_canonical boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_slug text,
  ADD COLUMN IF NOT EXISTS vertical_role_slug text,
  ADD COLUMN IF NOT EXISTS source_template_id uuid REFERENCES public.oap_role_programs(id) ON DELETE SET NULL;

ALTER TABLE public.oap_role_programs
  ALTER COLUMN organization_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS oap_role_programs_template_slug_key
  ON public.oap_role_programs (template_slug)
  WHERE is_canonical = true;

-- Enforce canonical/org integrity
CREATE OR REPLACE FUNCTION public.validate_oap_role_program()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_canonical = true AND NEW.organization_id IS NOT NULL THEN
    RAISE EXCEPTION 'Canonical role programs cannot have organization_id';
  END IF;
  IF NEW.is_canonical = false AND NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Non-canonical role programs require organization_id';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_oap_role_program ON public.oap_role_programs;
CREATE TRIGGER trg_validate_oap_role_program
BEFORE INSERT OR UPDATE ON public.oap_role_programs
FOR EACH ROW EXECUTE FUNCTION public.validate_oap_role_program();

-- 2. RLS: canonical templates readable by any authenticated user ---------
DROP POLICY IF EXISTS "Canonical role programs readable to authenticated" ON public.oap_role_programs;
CREATE POLICY "Canonical role programs readable to authenticated"
ON public.oap_role_programs
FOR SELECT
TO authenticated
USING (is_canonical = true);

-- Platform admins manage canonical templates
DROP POLICY IF EXISTS "Platform admins manage canonical role programs" ON public.oap_role_programs;
CREATE POLICY "Platform admins manage canonical role programs"
ON public.oap_role_programs
FOR ALL
TO authenticated
USING (is_canonical = true AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (is_canonical = true AND has_role(auth.uid(), 'admin'::app_role));

-- Mirror SELECT on oap_role_program_courses for canonical programs
DROP POLICY IF EXISTS "Canonical role program courses readable to authenticated" ON public.oap_role_program_courses;
CREATE POLICY "Canonical role program courses readable to authenticated"
ON public.oap_role_program_courses
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.oap_role_programs rp
  WHERE rp.id = oap_role_program_courses.role_program_id
    AND rp.is_canonical = true
));

DROP POLICY IF EXISTS "Platform admins manage canonical role program courses" ON public.oap_role_program_courses;
CREATE POLICY "Platform admins manage canonical role program courses"
ON public.oap_role_program_courses
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.oap_role_programs rp
  WHERE rp.id = oap_role_program_courses.role_program_id
    AND rp.is_canonical = true
    AND has_role(auth.uid(), 'admin'::app_role)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.oap_role_programs rp
  WHERE rp.id = oap_role_program_courses.role_program_id
    AND rp.is_canonical = true
    AND has_role(auth.uid(), 'admin'::app_role)
));

-- 3. Clone RPC -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clone_oap_role_program_to_org(
  _template_id uuid,
  _organization_id uuid,
  _override_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_id uuid;
  _tpl public.oap_role_programs%ROWTYPE;
BEGIN
  -- Authorization: must be admin/owner/supervisor of target org, or platform admin.
  IF NOT (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = _organization_id
        AND om.user_id = auth.uid()
        AND om.role = ANY (ARRAY['owner','admin','supervisor'])
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized to clone into this organization';
  END IF;

  SELECT * INTO _tpl FROM public.oap_role_programs
  WHERE id = _template_id AND is_canonical = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Canonical template not found';
  END IF;

  INSERT INTO public.oap_role_programs (
    organization_id, name, description, required_machine_tags,
    required_inspection_tool_slugs, required_machining_operation_slugs,
    is_active, created_by, recert_interval_months, recert_grace_days,
    vertical, is_canonical, template_slug, vertical_role_slug,
    source_template_id
  ) VALUES (
    _organization_id,
    COALESCE(_override_name, _tpl.name),
    _tpl.description,
    _tpl.required_machine_tags,
    _tpl.required_inspection_tool_slugs,
    _tpl.required_machining_operation_slugs,
    true, auth.uid(),
    _tpl.recert_interval_months, _tpl.recert_grace_days,
    _tpl.vertical, false, NULL, _tpl.vertical_role_slug,
    _tpl.id
  )
  RETURNING id INTO _new_id;

  INSERT INTO public.oap_role_program_courses (role_program_id, course_id, is_required, sort_order)
  SELECT _new_id, c.course_id, c.is_required, c.sort_order
  FROM public.oap_role_program_courses c
  WHERE c.role_program_id = _template_id;

  RETURN _new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.clone_oap_role_program_to_org(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clone_oap_role_program_to_org(uuid, uuid, text) TO authenticated;

-- 4. Seed: one canonical program per vertical role -----------------------
WITH inserted AS (
  INSERT INTO public.oap_role_programs (
    organization_id, name, description, vertical, is_canonical,
    template_slug, vertical_role_slug, recert_interval_months, recert_grace_days, is_active
  )
  SELECT
    NULL,
    vr.name || ' — Certified Program',
    COALESCE(vr.description, vr.name || ' certification track covering safety, quality, and core competencies.'),
    CASE WHEN vr.vertical::text IN (
      'machining','cabinetry','automotive','welding','construction','electrical','plumbing','hvac'
    ) THEN vr.vertical ELSE 'machining'::oap_vertical END,
    true,
    'preset-' || vr.slug,
    vr.slug,
    24, 30, true
  FROM public.oap_vertical_roles vr
  WHERE vr.is_active = true
  ON CONFLICT (template_slug) WHERE is_canonical = true DO NOTHING
  RETURNING id, template_slug
)
SELECT count(*) FROM inserted;

-- Link every canonical program to all 7 OAP courses
INSERT INTO public.oap_role_program_courses (role_program_id, course_id, is_required, sort_order)
SELECT rp.id, c.id, true, c.section_number
FROM public.oap_role_programs rp
CROSS JOIN public.oap_courses c
WHERE rp.is_canonical = true
  AND c.is_published = true
ON CONFLICT (role_program_id, course_id) DO NOTHING;