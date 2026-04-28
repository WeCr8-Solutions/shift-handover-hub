-- ============================================================
-- Tool Proficiency Test framework
-- Canonical (org=NULL,is_canonical=true) + per-org templates,
-- attempts with mentor sign-off, pass/fail, retest tracking.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tool_proficiency_tests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  is_canonical    boolean NOT NULL DEFAULT false,
  slug            text NOT NULL,
  name            text NOT NULL,
  tool_slug       text,                    -- references inspection_tools.slug (soft)
  description     text,
  instructions_md text,
  measurements    jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{label,target,tolerance,unit}]
  passing_score   integer NOT NULL DEFAULT 80 CHECK (passing_score BETWEEN 0 AND 100),
  mentor_required boolean NOT NULL DEFAULT true,
  retest_days     integer NOT NULL DEFAULT 365,
  printable_template_md text,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tool_prof_canonical_org_check
    CHECK ((is_canonical = true AND organization_id IS NULL)
        OR (is_canonical = false AND organization_id IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS tool_prof_tests_canonical_slug_key
  ON public.tool_proficiency_tests (slug) WHERE is_canonical = true;
CREATE UNIQUE INDEX IF NOT EXISTS tool_prof_tests_org_slug_key
  ON public.tool_proficiency_tests (organization_id, slug) WHERE is_canonical = false;
CREATE INDEX IF NOT EXISTS tool_prof_tests_org_idx
  ON public.tool_proficiency_tests (organization_id);

CREATE TABLE IF NOT EXISTS public.tool_proficiency_attempts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id            uuid NOT NULL REFERENCES public.tool_proficiency_tests(id) ON DELETE CASCADE,
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id    uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  recorded_measurements jsonb NOT NULL DEFAULT '[]'::jsonb,
  score              integer CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','passed','failed','needs_retest')),
  mentor_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  mentor_signoff_at  timestamptz,
  mentor_notes       text,
  retest_due_at      timestamptz,
  submitted_at       timestamptz NOT NULL DEFAULT now(),
  graded_at          timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tool_prof_attempts_user_idx
  ON public.tool_proficiency_attempts (user_id);
CREATE INDEX IF NOT EXISTS tool_prof_attempts_org_idx
  ON public.tool_proficiency_attempts (organization_id);
CREATE INDEX IF NOT EXISTS tool_prof_attempts_test_idx
  ON public.tool_proficiency_attempts (test_id);

-- Updated-at triggers
CREATE OR REPLACE FUNCTION public.tool_prof_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_tool_prof_tests_touch ON public.tool_proficiency_tests;
CREATE TRIGGER trg_tool_prof_tests_touch BEFORE UPDATE ON public.tool_proficiency_tests
  FOR EACH ROW EXECUTE FUNCTION public.tool_prof_touch_updated_at();

DROP TRIGGER IF EXISTS trg_tool_prof_attempts_touch ON public.tool_proficiency_attempts;
CREATE TRIGGER trg_tool_prof_attempts_touch BEFORE UPDATE ON public.tool_proficiency_attempts
  FOR EACH ROW EXECUTE FUNCTION public.tool_prof_touch_updated_at();

-- RLS
ALTER TABLE public.tool_proficiency_tests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_proficiency_attempts ENABLE ROW LEVEL SECURITY;

-- Tests: read canonical or own-org. Write: org admins/supervisors for own-org; platform admins for canonical.
DROP POLICY IF EXISTS "tool_prof_tests_read" ON public.tool_proficiency_tests;
CREATE POLICY "tool_prof_tests_read" ON public.tool_proficiency_tests
  FOR SELECT TO authenticated
  USING (
    is_canonical = true
    OR organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tool_prof_tests_write_org" ON public.tool_proficiency_tests;
CREATE POLICY "tool_prof_tests_write_org" ON public.tool_proficiency_tests
  FOR ALL TO authenticated
  USING (
    is_canonical = false
    AND organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner','admin','supervisor')
    )
  )
  WITH CHECK (
    is_canonical = false
    AND organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner','admin','supervisor')
    )
  );

DROP POLICY IF EXISTS "tool_prof_tests_write_canonical" ON public.tool_proficiency_tests;
CREATE POLICY "tool_prof_tests_write_canonical" ON public.tool_proficiency_tests
  FOR ALL TO authenticated
  USING (is_canonical = true AND public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (is_canonical = true AND public.has_role(auth.uid(), 'admin'::app_role));

-- Attempts: user can read/insert own; org supervisors/admins can read+grade attempts in their org.
DROP POLICY IF EXISTS "tool_prof_attempts_read_own" ON public.tool_proficiency_attempts;
CREATE POLICY "tool_prof_attempts_read_own" ON public.tool_proficiency_attempts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "tool_prof_attempts_read_org" ON public.tool_proficiency_attempts;
CREATE POLICY "tool_prof_attempts_read_org" ON public.tool_proficiency_attempts
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner','admin','supervisor')
    )
  );

DROP POLICY IF EXISTS "tool_prof_attempts_insert_own" ON public.tool_proficiency_attempts;
CREATE POLICY "tool_prof_attempts_insert_own" ON public.tool_proficiency_attempts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "tool_prof_attempts_update_grader" ON public.tool_proficiency_attempts;
CREATE POLICY "tool_prof_attempts_update_grader" ON public.tool_proficiency_attempts
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner','admin','supervisor')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('owner','admin','supervisor')
    )
  );

-- Seed 4 canonical Jobline templates (idempotent)
INSERT INTO public.tool_proficiency_tests
  (slug, is_canonical, organization_id, name, tool_slug, description, instructions_md, measurements, passing_score, mentor_required, retest_days, printable_template_md)
VALUES
  ('digital-caliper-proficiency', true, NULL,
   'Digital Caliper Proficiency',
   'digital-caliper',
   'Verify the operator can take accurate measurements with a 6" digital caliper across OD, ID, depth, and step features.',
   E'**Setup**: Calibrate caliper to zero on closed jaws. Use provided gauge block set.\n\n**Pass/Fail**: All measurements within stated tolerance. ≥80% required.',
   '[
     {"label":"OD of Ø1.0000 gauge pin","target":1.0000,"tolerance":0.0010,"unit":"in"},
     {"label":"ID of Ø0.7500 ring gauge","target":0.7500,"tolerance":0.0015,"unit":"in"},
     {"label":"Depth of 0.5000 step block","target":0.5000,"tolerance":0.0015,"unit":"in"},
     {"label":"Width across step","target":0.7500,"tolerance":0.0010,"unit":"in"}
   ]'::jsonb,
   80, true, 365,
   E'# Digital Caliper Proficiency — Printable Backup\n\nOperator: ______________________  Date: __________\nMentor: ________________________  Signature: __________\n\n| # | Feature | Target | Tol | Reading | Pass/Fail |\n|---|---------|--------|-----|---------|-----------|\n| 1 | Ø1.0000 pin OD | 1.0000 | ±0.0010 | | |\n| 2 | Ø0.7500 ring ID | 0.7500 | ±0.0015 | | |\n| 3 | 0.5000 step depth | 0.5000 | ±0.0015 | | |\n| 4 | 0.7500 step width | 0.7500 | ±0.0010 | | |\n\nResult: ☐ PASS  ☐ FAIL  ☐ NEEDS RETEST\n'),
  ('outside-micrometer-proficiency', true, NULL,
   'Outside Micrometer (0–1") Proficiency',
   'outside-micrometer',
   'Verify operator can read a 0–1" outside micrometer to 0.0001" with proper anvil contact and ratchet usage.',
   E'**Setup**: Wipe anvil + spindle, zero against standard. Always close with ratchet/friction thimble.\n\n**Pass/Fail**: All readings within ±0.0002". ≥80% required.',
   '[
     {"label":"Gauge pin Ø0.2500","target":0.2500,"tolerance":0.0002,"unit":"in"},
     {"label":"Gauge pin Ø0.5000","target":0.5000,"tolerance":0.0002,"unit":"in"},
     {"label":"Gauge pin Ø0.7500","target":0.7500,"tolerance":0.0002,"unit":"in"},
     {"label":"Gauge block 0.1000 stack","target":0.1000,"tolerance":0.0002,"unit":"in"}
   ]'::jsonb,
   80, true, 365,
   E'# Outside Micrometer Proficiency — Printable Backup\n\nOperator: ______________________  Date: __________\nMentor: ________________________  Signature: __________\n\n| # | Feature | Target | Tol | Reading | Pass/Fail |\n|---|---------|--------|-----|---------|-----------|\n| 1 | Ø0.2500 pin | 0.2500 | ±0.0002 | | |\n| 2 | Ø0.5000 pin | 0.5000 | ±0.0002 | | |\n| 3 | Ø0.7500 pin | 0.7500 | ±0.0002 | | |\n| 4 | 0.1000 gauge block | 0.1000 | ±0.0002 | | |\n\nResult: ☐ PASS  ☐ FAIL  ☐ NEEDS RETEST\n'),
  ('dial-indicator-proficiency', true, NULL,
   'Dial Indicator Setup & Reading',
   'dial-indicator',
   'Verify operator can mount a dial indicator on a magnetic base, sweep a surface, and read deviation in 0.0005" increments.',
   E'**Setup**: Mount on mag base, contact perpendicular to surface, preload ~25%. Sweep 4 cardinal points.\n\n**Pass/Fail**: Reported TIR within ±0.0005" of inspector value. ≥80% required.',
   '[
     {"label":"Surface plate flatness sweep TIR","target":0.0000,"tolerance":0.0005,"unit":"in"},
     {"label":"Indicator preload at zero","target":0.0250,"tolerance":0.0050,"unit":"in"},
     {"label":"Bar parallelism over 4\"","target":0.0010,"tolerance":0.0005,"unit":"in"}
   ]'::jsonb,
   80, true, 365,
   E'# Dial Indicator Proficiency — Printable Backup\n\nOperator: ______________________  Date: __________\nMentor: ________________________  Signature: __________\n\n| # | Check | Target | Tol | Reading | Pass/Fail |\n|---|-------|--------|-----|---------|-----------|\n| 1 | Surface plate TIR | 0.0000 | ±0.0005 | | |\n| 2 | Preload at zero | 0.0250 | ±0.0050 | | |\n| 3 | Bar parallelism | 0.0010 | ±0.0005 | | |\n\nResult: ☐ PASS  ☐ FAIL  ☐ NEEDS RETEST\n'),
  ('height-gauge-proficiency', true, NULL,
   'Height Gauge Proficiency',
   'height-gauge',
   'Verify operator can zero a height gauge on a surface plate, scribe a layout line, and read steps with a test indicator attachment.',
   E'**Setup**: Wipe surface plate + base. Zero on plate. Use scriber for layout, indicator for steps.\n\n**Pass/Fail**: All readings within ±0.001". ≥80% required.',
   '[
     {"label":"Step block 1.0000 height","target":1.0000,"tolerance":0.0010,"unit":"in"},
     {"label":"Step block 2.0000 height","target":2.0000,"tolerance":0.0010,"unit":"in"},
     {"label":"Scribed layout line @ 0.500","target":0.5000,"tolerance":0.0020,"unit":"in"}
   ]'::jsonb,
   80, true, 365,
   E'# Height Gauge Proficiency — Printable Backup\n\nOperator: ______________________  Date: __________\nMentor: ________________________  Signature: __________\n\n| # | Check | Target | Tol | Reading | Pass/Fail |\n|---|-------|--------|-----|---------|-----------|\n| 1 | 1.0000 step | 1.0000 | ±0.0010 | | |\n| 2 | 2.0000 step | 2.0000 | ±0.0010 | | |\n| 3 | 0.500 scribe line | 0.5000 | ±0.0020 | | |\n\nResult: ☐ PASS  ☐ FAIL  ☐ NEEDS RETEST\n')
ON CONFLICT DO NOTHING;
