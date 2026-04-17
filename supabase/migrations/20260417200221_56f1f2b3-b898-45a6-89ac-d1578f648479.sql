-- OAP Mentor Walkthrough: ordered, org-scoped, mentor-signed checkoff system
-- Section order is fixed: 1=Safety, 2=Measuring, 3=Hand Tools, 4=Tooling, 5=Machine Types, 6=Floor Check-offs, 7=Skills Proficiency

-- ============================================================
-- 1. SECTIONS (canonical, fixed order — same every time)
-- ============================================================
CREATE TABLE public.oap_walkthrough_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  section_order integer NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed canonical 7-section order
INSERT INTO public.oap_walkthrough_sections (section_key, section_order, title, description) VALUES
  ('safety', 1, 'Shop Safety', 'PPE, e-stops, SDS, lockout/tagout, emergency procedures'),
  ('measuring', 2, 'Measuring Tools', 'Calipers, micrometers, indicators, gauges — basic to advanced'),
  ('hand_tools', 3, 'Hand Tools', 'Wrenches, screwdrivers, deburring, files, taps & dies'),
  ('tooling', 4, 'Cutting Tooling', 'Inserts, end mills, drills, taps, holders, presetting'),
  ('machine_types', 5, 'Machine Types', 'Mills, lathes, swiss, EDM, grinders — identification & operation basics'),
  ('floor_checkoffs', 6, 'Floor Check-offs', 'Walk-the-floor verifications: housekeeping, coolant, chip mgmt, tool crib'),
  ('skills_proficiency', 7, 'Skills Proficiency', 'Self-rated skills validated by mentor');

-- ============================================================
-- 2. ITEMS within each section (canonical master list, org can override later)
-- ============================================================
CREATE TABLE public.oap_walkthrough_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.oap_walkthrough_sections(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE, -- NULL = canonical/global
  item_order integer NOT NULL,
  title text NOT NULL,
  description text,
  instructions text, -- detailed mentor walkthrough text
  is_required boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_oap_items_section ON public.oap_walkthrough_items(section_id, item_order);
CREATE INDEX idx_oap_items_org ON public.oap_walkthrough_items(organization_id) WHERE organization_id IS NOT NULL;

-- ============================================================
-- 3. WALKTHROUGH SESSIONS (one per operator)
-- ============================================================
CREATE TABLE public.oap_walkthrough_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  operator_id uuid NOT NULL,
  operator_name text,
  primary_mentor_id uuid,
  primary_mentor_name text,
  status text NOT NULL DEFAULT 'in_progress', -- in_progress | completed | abandoned
  current_section_order integer NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_oap_sessions_org ON public.oap_walkthrough_sessions(organization_id);
CREATE INDEX idx_oap_sessions_operator ON public.oap_walkthrough_sessions(operator_id);

-- ============================================================
-- 4. CHECK-OFF RESULTS (Pass / Needs Practice / Fail + signature + timestamp)
-- ============================================================
CREATE TYPE public.oap_checkoff_result AS ENUM ('pass', 'needs_practice', 'fail');

CREATE TABLE public.oap_walkthrough_checkoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.oap_walkthrough_sessions(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.oap_walkthrough_sections(id),
  item_id uuid NOT NULL REFERENCES public.oap_walkthrough_items(id),
  result public.oap_checkoff_result NOT NULL,
  notes text,
  mentor_id uuid NOT NULL,
  mentor_name text NOT NULL,
  mentor_signature text NOT NULL, -- typed name confirming sign-off
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, item_id)
);

CREATE INDEX idx_oap_checkoffs_session ON public.oap_walkthrough_checkoffs(session_id);
CREATE INDEX idx_oap_checkoffs_org ON public.oap_walkthrough_checkoffs(organization_id);

-- ============================================================
-- 5. MENTOR DESIGNATION (separate from supervisor role)
-- ============================================================
CREATE TABLE public.oap_designated_mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text,
  designated_by uuid NOT NULL,
  designated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_oap_mentors_org ON public.oap_designated_mentors(organization_id);

-- ============================================================
-- 6. HELPER FUNCTION: can this user act as an OAP mentor?
-- Either supervisor/admin in the org OR designated mentor
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_act_as_oap_mentor(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    public.is_org_admin(_user_id, _org_id)
    OR public.is_supervisor_in_org(_user_id, _org_id)
    OR public.has_role(_user_id, 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.oap_designated_mentors
      WHERE organization_id = _org_id
        AND user_id = _user_id
        AND is_active = true
    )
  )
$$;

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================
ALTER TABLE public.oap_walkthrough_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oap_walkthrough_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oap_walkthrough_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oap_walkthrough_checkoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oap_designated_mentors ENABLE ROW LEVEL SECURITY;

-- Sections: readable by all authenticated users, manageable only by platform admin
CREATE POLICY "Sections readable by authenticated"
  ON public.oap_walkthrough_sections FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Sections managed by platform admin"
  ON public.oap_walkthrough_sections FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Items: canonical (org_id NULL) readable by all; org-specific readable by org members
CREATE POLICY "Canonical items readable by authenticated"
  ON public.oap_walkthrough_items FOR SELECT
  TO authenticated
  USING (organization_id IS NULL OR public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins manage org-specific items"
  ON public.oap_walkthrough_items FOR ALL
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND public.is_org_admin(auth.uid(), organization_id)
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND public.is_org_admin(auth.uid(), organization_id)
  );

CREATE POLICY "Platform admin manages canonical items"
  ON public.oap_walkthrough_items FOR ALL
  TO authenticated
  USING (organization_id IS NULL AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (organization_id IS NULL AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Sessions: operator sees own; mentors/admins in org see all org sessions
CREATE POLICY "Operators see own sessions"
  ON public.oap_walkthrough_sessions FOR SELECT
  TO authenticated
  USING (
    operator_id = auth.uid()
    OR public.can_act_as_oap_mentor(auth.uid(), organization_id)
  );

CREATE POLICY "Mentors create sessions for org operators"
  ON public.oap_walkthrough_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_act_as_oap_mentor(auth.uid(), organization_id)
    AND public.is_org_member(operator_id, organization_id)
  );

CREATE POLICY "Mentors update org sessions"
  ON public.oap_walkthrough_sessions FOR UPDATE
  TO authenticated
  USING (public.can_act_as_oap_mentor(auth.uid(), organization_id));

CREATE POLICY "Org admins delete sessions"
  ON public.oap_walkthrough_sessions FOR DELETE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Checkoffs: operator sees own session checkoffs; mentors/admins see all org checkoffs
CREATE POLICY "View checkoffs in own session or as mentor"
  ON public.oap_walkthrough_checkoffs FOR SELECT
  TO authenticated
  USING (
    public.can_act_as_oap_mentor(auth.uid(), organization_id)
    OR EXISTS (
      SELECT 1 FROM public.oap_walkthrough_sessions s
      WHERE s.id = session_id AND s.operator_id = auth.uid()
    )
  );

CREATE POLICY "Only mentors create checkoffs"
  ON public.oap_walkthrough_checkoffs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_act_as_oap_mentor(auth.uid(), organization_id)
    AND mentor_id = auth.uid()
  );

CREATE POLICY "Mentors update own checkoffs (correction window)"
  ON public.oap_walkthrough_checkoffs FOR UPDATE
  TO authenticated
  USING (
    mentor_id = auth.uid()
    AND public.can_act_as_oap_mentor(auth.uid(), organization_id)
  );

CREATE POLICY "Org admins delete checkoffs"
  ON public.oap_walkthrough_checkoffs FOR DELETE
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Designated mentors: org members read, org admins manage
CREATE POLICY "Org members read mentors"
  ON public.oap_designated_mentors FOR SELECT
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org admins manage mentors"
  ON public.oap_designated_mentors FOR ALL
  TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- ============================================================
-- 8. TRIGGERS
-- ============================================================
CREATE TRIGGER update_oap_items_updated_at
  BEFORE UPDATE ON public.oap_walkthrough_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oap_sessions_updated_at
  BEFORE UPDATE ON public.oap_walkthrough_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 9. SEED CANONICAL ITEMS (basic → advanced within each section)
-- ============================================================
DO $$
DECLARE
  _safety uuid; _measuring uuid; _hand uuid; _tooling uuid;
  _machines uuid; _floor uuid; _skills uuid;
BEGIN
  SELECT id INTO _safety FROM public.oap_walkthrough_sections WHERE section_key='safety';
  SELECT id INTO _measuring FROM public.oap_walkthrough_sections WHERE section_key='measuring';
  SELECT id INTO _hand FROM public.oap_walkthrough_sections WHERE section_key='hand_tools';
  SELECT id INTO _tooling FROM public.oap_walkthrough_sections WHERE section_key='tooling';
  SELECT id INTO _machines FROM public.oap_walkthrough_sections WHERE section_key='machine_types';
  SELECT id INTO _floor FROM public.oap_walkthrough_sections WHERE section_key='floor_checkoffs';
  SELECT id INTO _skills FROM public.oap_walkthrough_sections WHERE section_key='skills_proficiency';

  -- 1. SAFETY
  INSERT INTO public.oap_walkthrough_items (section_id, item_order, title, instructions) VALUES
    (_safety, 1, 'PPE Identification & Use', 'Identify safety glasses, hearing protection, steel-toe boots, gloves (when allowed/not allowed near rotating tools).'),
    (_safety, 2, 'Locate all E-Stops', 'Walk the operator to every E-Stop on the floor and at each machine. Have them physically point to each one.'),
    (_safety, 3, 'SDS Lookup', 'Demonstrate locating the SDS binder/portal and looking up coolant, way oil, and cleaning solvent.'),
    (_safety, 4, 'Lockout/Tagout Basics', 'Demonstrate LOTO process on a designated machine. Operator explains back the steps.'),
    (_safety, 5, 'Fire Extinguisher & Eye Wash Locations', 'Walk to each location. Operator points out without prompting.'),
    (_safety, 6, 'Chip & Coolant Hazards', 'Explain hot chip burns, never blow chips with air, never reach into coolant reservoirs.'),
    (_safety, 7, 'Emergency Evacuation Route', 'Walk the route. Identify primary and secondary exit.');

  -- 2. MEASURING (basic → advanced)
  INSERT INTO public.oap_walkthrough_items (section_id, item_order, title, instructions) VALUES
    (_measuring, 1, '6" Steel Rule', 'Measure 3 features. Read to 1/64".'),
    (_measuring, 2, 'Tape Measure', 'Measure stock and read fractional inch.'),
    (_measuring, 3, 'Dial / Digital Calipers', 'Measure OD, ID, depth, step. Demonstrate zeroing.'),
    (_measuring, 4, '0-1" Outside Micrometer', 'Read to .0001". Demonstrate proper feel using ratchet/thimble.'),
    (_measuring, 5, '1-2", 2-3" Micrometers', 'Demonstrate setting with standard before measuring.'),
    (_measuring, 6, 'Inside Micrometer / Telescoping Gauges', 'Measure a bored hole and transfer to outside mic.'),
    (_measuring, 7, 'Depth Micrometer', 'Measure step depth and shoulder.'),
    (_measuring, 8, 'Dial Indicator on Magnetic Base', 'Tram a vise, indicate a hole.'),
    (_measuring, 9, 'Test Indicator (DTI)', 'Pick up edge / center of hole.'),
    (_measuring, 10, 'Pin Gauges', 'Identify go/no-go usage and proper handling.'),
    (_measuring, 11, 'Thread Gauges (ring/plug)', 'Verify a tapped hole and a threaded OD.'),
    (_measuring, 12, 'Surface Plate & Height Gauge', 'Set up a part on the surface plate, scribe a line, transfer dimension.'),
    (_measuring, 13, 'Bore Gauge / Sunnen', 'Demonstrate or describe usage on precision ID.'),
    (_measuring, 14, 'CMM Familiarization (if equipped)', 'Identify probe, ruby, machine axes. Do NOT operate without further training.');

  -- 3. HAND TOOLS
  INSERT INTO public.oap_walkthrough_items (section_id, item_order, title, instructions) VALUES
    (_hand, 1, 'Wrench Set (SAE & Metric)', 'Identify combination, box-end, open-end. Pick correct size for fastener.'),
    (_hand, 2, 'Allen / Hex Key Set', 'Match correct hex to socket head cap screw.'),
    (_hand, 3, 'T-Handles', 'Demonstrate proper grip and torque feel for tooling clamps.'),
    (_hand, 4, 'Screwdrivers (Phillips, Flat, Torx)', 'Identify and use without cam-out.'),
    (_hand, 5, 'Deburring Tools (NOGA, scraper)', 'Properly deburr a sharp edge without gouging.'),
    (_hand, 6, 'Files (flat, half-round, needle)', 'Demonstrate single-direction stroke, file card cleaning.'),
    (_hand, 7, 'Tap & Die Handles', 'Hand-tap a pre-drilled hole, back off every 1/2 turn to break chips.'),
    (_hand, 8, 'Dead Blow / Soft Mallet', 'Seat a vise jaw or tap a part flat without marring.'),
    (_hand, 9, 'Pliers (needle nose, channel locks, snap ring)', 'Identify each and proper application.'),
    (_hand, 10, 'Torque Wrench', 'Set to spec, demonstrate click. Explain why never used to loosen.');

  -- 4. CUTTING TOOLING
  INSERT INTO public.oap_walkthrough_items (section_id, item_order, title, instructions) VALUES
    (_tooling, 1, 'Insert Identification', 'Identify CNMG/CCMT/DNMG by ANSI nomenclature. Match to holder.'),
    (_tooling, 2, 'End Mill Types', 'Identify square, ball, bull, roughing, finishing end mills.'),
    (_tooling, 3, 'Drills (jobber, screw machine, parabolic, spot)', 'Match drill type to operation.'),
    (_tooling, 4, 'Taps (cut, form, spiral point, spiral flute)', 'Match tap to material and hole condition.'),
    (_tooling, 5, 'Tool Holders (ER collet, shrink fit, hydraulic, side-lock)', 'Identify each, explain runout pros/cons.'),
    (_tooling, 6, 'Tool Presetter Use', 'Measure tool length and diameter, write/transfer offset.'),
    (_tooling, 7, 'Insert Wear Identification', 'Identify normal wear, chipping, BUE, crater, thermal cracking.'),
    (_tooling, 8, 'Coolant-Through Tooling', 'Identify and explain why through-coolant matters in deep holes.');

  -- 5. MACHINE TYPES
  INSERT INTO public.oap_walkthrough_items (section_id, item_order, title, instructions) VALUES
    (_machines, 1, 'Manual Mill (Bridgeport-style)', 'Identify quill, knee, table, ram. Demonstrate or describe basic moves.'),
    (_machines, 2, 'Manual Lathe (engine lathe)', 'Identify chuck, tailstock, carriage, cross-slide, compound.'),
    (_machines, 3, 'Vertical Machining Center (VMC)', 'Identify spindle, tool changer, axes (X/Y/Z), control type.'),
    (_machines, 4, 'Horizontal Machining Center (HMC)', 'Identify pallet changer, B-axis, tombstone fixturing.'),
    (_machines, 5, 'CNC Lathe / Turning Center', 'Identify chuck, turret, tailstock, sub-spindle (if equipped).'),
    (_machines, 6, 'Swiss-Type Lathe', 'Identify guide bushing, gang tools, sub-spindle. Explain barfeed.'),
    (_machines, 7, '5-Axis Machining Center', 'Identify additional rotary axes (A/B/C). Explain trunnion vs head/head.'),
    (_machines, 8, 'EDM (sinker/wire)', 'Identify electrode/wire, dielectric tank, generator.'),
    (_machines, 9, 'Surface Grinder', 'Identify wheel, magnetic chuck, dressing diamond.'),
    (_machines, 10, 'Saw (cold, band, abrasive)', 'Identify and explain material/speed selection.');

  -- 6. FLOOR CHECK-OFFS
  INSERT INTO public.oap_walkthrough_items (section_id, item_order, title, instructions) VALUES
    (_floor, 1, 'Workstation 5S / Housekeeping', 'Operator demonstrates clean-as-you-go, swept floor, organized tool box.'),
    (_floor, 2, 'Coolant Concentration Check', 'Use refractometer, log reading, top off if low.'),
    (_floor, 3, 'Chip Bin / Recycle Procedure', 'Identify ferrous vs non-ferrous bins, never mix coolant.'),
    (_floor, 4, 'Tool Crib Sign-Out Procedure', 'Demonstrate checkout and return.'),
    (_floor, 5, 'Material Staging Area', 'Locate raw stock area, identify material tags / heat numbers.'),
    (_floor, 6, 'Finished Goods / Inspection Drop', 'Show where finished parts go and what tag is required.'),
    (_floor, 7, 'Air Hose / Compressed Air Use', 'Demonstrate safe blow-off (NEVER on body, NEVER toward others).'),
    (_floor, 8, 'Spill Kit Location & Use', 'Locate kit, demonstrate containment of small coolant spill.');

  -- 7. SKILLS PROFICIENCY (operator self-rates, mentor validates)
  INSERT INTO public.oap_walkthrough_items (section_id, item_order, title, instructions) VALUES
    (_skills, 1, 'Read a Mechanical Print', 'Identify title block, revision, datums, basic dimensions, tolerance block.'),
    (_skills, 2, 'Interpret GD&T', 'Identify position, profile, runout, flatness, perpendicularity.'),
    (_skills, 3, 'Load/Unload Workholding', 'Vise, chuck, fixture — properly seat and torque.'),
    (_skills, 4, 'Touch Off Tools (Manual)', 'Z and X (lathe) or Z (mill) touch off.'),
    (_skills, 5, 'Touch Off Tools (Probe)', 'Use spindle probe or tool setter where equipped.'),
    (_skills, 6, 'Set Work Offset (G54+)', 'Edge-find or probe a part zero, enter into control.'),
    (_skills, 7, 'Run a Proven Program (Single Block)', 'Cycle start, single block through, raise feed rate to 100%.'),
    (_skills, 8, 'First Article Inspection', 'Measure all critical dimensions, fill out FAI sheet.'),
    (_skills, 9, 'In-Process Inspection / SPC', 'Pull a part every N pieces, log measurements.'),
    (_skills, 10, 'Tool Wear Adjustment', 'Adjust offsets to bring a drifting dimension back to nominal.'),
    (_skills, 11, 'Edit a Program (offset / feedrate only)', 'Make a safe edit, save, restart at correct line.'),
    (_skills, 12, 'Identify a Bad Part / Initiate NCR', 'Recognize out-of-tolerance, segregate, start NCR process.');
END $$;