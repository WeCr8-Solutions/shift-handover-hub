
-- =========================================================
-- TRAINING LIBRARY — PHASE 1: Inspection Tool Catalog
-- =========================================================

-- Profession + role tag enums (extensible via ALTER TYPE later)
DO $$ BEGIN
  CREATE TYPE public.inspection_profession_tag AS ENUM (
    'machinist','qc_inspector','welder','fabricator','assembler',
    'op_lead','programmer','toolmaker','grinder','edm_operator',
    'cmm_operator','maintenance'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.inspection_role_tag AS ENUM (
    'operator','supervisor','qc','mentor','trainee','admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- CATEGORIES ----------
CREATE TABLE public.inspection_tool_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  icon text,
  is_canonical boolean NOT NULL DEFAULT true,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_tool_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authed can view canonical categories"
  ON public.inspection_tool_categories FOR SELECT
  TO authenticated
  USING (is_canonical = true OR organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Platform admins manage canonical categories"
  ON public.inspection_tool_categories FOR ALL
  TO authenticated
  USING (is_canonical = true AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (is_canonical = true AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org admins manage org categories"
  ON public.inspection_tool_categories FOR ALL
  TO authenticated
  USING (
    organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
        AND role IN ('org_admin','org_supervisor')
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
        AND role IN ('org_admin','org_supervisor')
    )
  );

-- ---------- TOOLS ----------
CREATE TABLE public.inspection_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  category_id uuid NOT NULL REFERENCES public.inspection_tool_categories(id) ON DELETE RESTRICT,
  description text,
  typical_use text,
  precision_spec text,
  measurement_range text,
  manufacturer_examples text[],
  safety_notes text,
  profession_tags public.inspection_profession_tag[] NOT NULL DEFAULT '{}',
  role_tags public.inspection_role_tag[] NOT NULL DEFAULT '{}',
  difficulty text NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner','intermediate','advanced','expert')),
  is_canonical boolean NOT NULL DEFAULT true,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, organization_id)
);

CREATE INDEX idx_inspection_tools_category ON public.inspection_tools(category_id);
CREATE INDEX idx_inspection_tools_org ON public.inspection_tools(organization_id);
CREATE INDEX idx_inspection_tools_profession ON public.inspection_tools USING GIN(profession_tags);
CREATE INDEX idx_inspection_tools_role ON public.inspection_tools USING GIN(role_tags);

ALTER TABLE public.inspection_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authed users view canonical tools"
  ON public.inspection_tools FOR SELECT
  TO authenticated
  USING (
    is_canonical = true
    OR organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Platform admins manage canonical tools"
  ON public.inspection_tools FOR ALL
  TO authenticated
  USING (is_canonical = true AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (is_canonical = true AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Org leaders manage org tools"
  ON public.inspection_tools FOR ALL
  TO authenticated
  USING (
    organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
        AND role IN ('org_admin','org_supervisor')
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
        AND role IN ('org_admin','org_supervisor')
    )
  );

-- ---------- PER-ORG OVERRIDES ----------
CREATE TABLE public.org_inspection_tool_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES public.inspection_tools(id) ON DELETE CASCADE,
  is_hidden boolean NOT NULL DEFAULT false,
  custom_notes text,
  custom_precision_spec text,
  required_for_roles public.inspection_role_tag[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, tool_id)
);

ALTER TABLE public.org_inspection_tool_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view their overrides"
  ON public.org_inspection_tool_overrides FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org leaders manage their overrides"
  ON public.org_inspection_tool_overrides FOR ALL
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('org_admin','org_supervisor')
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid() AND role IN ('org_admin','org_supervisor')
  ));

-- ---------- updated_at triggers ----------
CREATE TRIGGER trg_inspection_tool_categories_updated_at
  BEFORE UPDATE ON public.inspection_tool_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_inspection_tools_updated_at
  BEFORE UPDATE ON public.inspection_tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_org_inspection_tool_overrides_updated_at
  BEFORE UPDATE ON public.org_inspection_tool_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- SEED CANONICAL CATEGORIES
-- =========================================================
INSERT INTO public.inspection_tool_categories (slug, name, description, sort_order, icon) VALUES
  ('linear','Linear & Layout','Tapes, rules, squares, and basic layout tools',10,'Ruler'),
  ('calipers','Calipers','Vernier, dial, and digital calipers for ID/OD/depth',20,'Move'),
  ('micrometers','Micrometers','Outside, inside, and specialty micrometers',30,'Circle'),
  ('depth_height','Depth & Height','Depth mics, depth gauges, height gauges',40,'ArrowUpDown'),
  ('bore_id','Bore & ID','Telescoping gauges, bore gauges, small-hole gauges',50,'CircleDot'),
  ('thread_pitch','Thread & Pitch','Thread gauges, pitch gauges, thread mics',60,'Spiral'),
  ('reference','Reference & Setting','Gauge blocks, pin gauges, sine bars, surface plates',70,'Square'),
  ('indicators','Indicators','Dial indicators, test indicators, magnetic bases',80,'Activity'),
  ('surface_form','Surface & Form','Surface roughness, profilometers, optical flats',90,'Waves'),
  ('gdt_optical','GD&T & Optical','Optical comparators, video measuring, vision systems',100,'Eye'),
  ('hardness_material','Hardness & Material','Rockwell, Brinell, Vickers, ultrasonic thickness',110,'Diamond'),
  ('cmm','CMM & Coordinate','Bridge CMMs, portable arms, laser trackers',120,'Box'),
  ('specialty','Specialty Inspection','Borescopes, NDT, leak testers, alignment tools',130,'Wrench');

-- =========================================================
-- SEED ~60 CANONICAL TOOLS
-- =========================================================
WITH cats AS (SELECT id, slug FROM public.inspection_tool_categories)
INSERT INTO public.inspection_tools
  (slug, name, category_id, description, typical_use, precision_spec, measurement_range, manufacturer_examples, profession_tags, role_tags, difficulty, sort_order)
SELECT v.slug, v.name, c.id, v.description, v.typical_use, v.precision_spec, v.measurement_range,
       v.manufacturer_examples, v.profession_tags::public.inspection_profession_tag[],
       v.role_tags::public.inspection_role_tag[], v.difficulty, v.sort_order
FROM (VALUES
  -- Linear & Layout
  ('tape-measure','Tape Measure','linear','Retractable steel tape for rough linear measurement.','Stock cut-off, layout, fixture spacing','±1/32"','0–25 ft',ARRAY['Stanley','Milwaukee','Lufkin'],ARRAY['machinist','fabricator','welder','assembler']::text[],ARRAY['operator','trainee']::text[],'beginner',10),
  ('pi-tape','Pi Tape','linear','Wraps around cylindrical part to read diameter directly.','Large-diameter shaft / vessel OD','±0.001"','6"–600" OD',ARRAY['Pi Tape Texas'],ARRAY['machinist','qc_inspector','fabricator']::text[],ARRAY['operator','qc','trainee']::text[],'intermediate',20),
  ('steel-rule','Steel Rule','linear','Rigid graduated rule, decimal/fractional/metric.','Quick layout, scribing, rough setup','±0.015"','6"–48"',ARRAY['Starrett','Mitutoyo','PEC'],ARRAY['machinist','toolmaker','assembler']::text[],ARRAY['operator','trainee']::text[],'beginner',30),
  ('combination-square','Combination Square','linear','Rule + square head + center finder + protractor head.','90°/45° layout, depth, center finding','±0.002"/6"','12" rule typical',ARRAY['Starrett','Mitutoyo'],ARRAY['machinist','toolmaker','fabricator']::text[],ARRAY['operator','trainee']::text[],'beginner',40),
  ('protractor','Bevel Protractor','linear','Universal bevel protractor for angle measurement.','Angle layout, weld prep, fixture verify','±5 arcmin','0–360°',ARRAY['Starrett','Mitutoyo'],ARRAY['machinist','welder','fabricator']::text[],ARRAY['operator','qc']::text[],'beginner',50),
  ('scriber','Scriber','linear','Hardened point for marking layout lines on metal.','Layout for cutting, drilling','n/a','n/a',ARRAY['Starrett','General'],ARRAY['machinist','fabricator','welder']::text[],ARRAY['operator','trainee']::text[],'beginner',60),
  ('center-punch','Center Punch','linear','Marks divot to start drill bit accurately.','Drill start location','n/a','n/a',ARRAY['Starrett','Mayhew'],ARRAY['machinist','fabricator']::text[],ARRAY['operator','trainee']::text[],'beginner',70),

  -- Calipers
  ('vernier-caliper','Vernier Caliper','calipers','Mechanical caliper read via vernier scale.','OD/ID/depth measurement','±0.001"','0–6"/12"',ARRAY['Mitutoyo','Starrett'],ARRAY['machinist','qc_inspector','toolmaker']::text[],ARRAY['operator','qc','trainee']::text[],'intermediate',10),
  ('dial-caliper','Dial Caliper','calipers','Mechanical caliper with dial indicator readout.','Daily shop measurements','±0.001"','0–6"/8"/12"',ARRAY['Mitutoyo','Starrett','Brown & Sharpe'],ARRAY['machinist','qc_inspector']::text[],ARRAY['operator','qc','trainee']::text[],'beginner',20),
  ('digital-caliper','Digital Caliper','calipers','Electronic caliper, in/mm toggle, zero anywhere.','General-purpose precision measurement','±0.0005"','0–6"/8"/12"',ARRAY['Mitutoyo','Starrett','iGaging'],ARRAY['machinist','qc_inspector','assembler']::text[],ARRAY['operator','qc','trainee']::text[],'beginner',30),
  ('large-caliper','Large Capacity Caliper','calipers','Extended-jaw caliper for big parts.','Large weldments, castings','±0.002"','0–24"/40"/60"',ARRAY['Mitutoyo','Fowler'],ARRAY['machinist','qc_inspector','fabricator']::text[],ARRAY['operator','qc']::text[],'intermediate',40),
  ('inside-caliper','Inside Caliper (spring)','calipers','Spring-loaded caliper transferred to a rule.','Quick ID transfer','±0.005"','0–12"',ARRAY['Starrett'],ARRAY['machinist','toolmaker']::text[],ARRAY['operator']::text[],'beginner',50),
  ('outside-caliper','Outside Caliper (spring)','calipers','Spring-loaded OD transfer caliper.','Quick OD transfer','±0.005"','0–12"',ARRAY['Starrett'],ARRAY['machinist','toolmaker']::text[],ARRAY['operator']::text[],'beginner',60),

  -- Micrometers
  ('outside-micrometer','Outside Micrometer','micrometers','Frame + thimble, measures OD precisely.','Shaft OD, gauge pin verification','±0.0001"','0–1", sets to 12"',ARRAY['Mitutoyo','Starrett','Brown & Sharpe'],ARRAY['machinist','qc_inspector','toolmaker']::text[],ARRAY['operator','qc']::text[],'intermediate',10),
  ('digital-micrometer','Digital Outside Micrometer','micrometers','Electronic readout, in/mm, data output.','High-volume OD checks','±0.00005"','0–1"/2"/3"',ARRAY['Mitutoyo','Mahr'],ARRAY['machinist','qc_inspector']::text[],ARRAY['operator','qc']::text[],'intermediate',20),
  ('inside-micrometer','Inside Micrometer','micrometers','Tubular mic for direct ID measurement.','Bore ID, large hole','±0.0002"','2–40"',ARRAY['Mitutoyo','Starrett'],ARRAY['machinist','qc_inspector','toolmaker']::text[],ARRAY['qc','operator']::text[],'advanced',30),
  ('three-point-bore-mic','3-Point Bore Mic','micrometers','Three contacts for true bore diameter.','Precision bore inspection','±0.0001"','0.275"–12"',ARRAY['Mitutoyo','Bowers'],ARRAY['qc_inspector','machinist']::text[],ARRAY['qc']::text[],'advanced',40),
  ('tube-micrometer','Tube Micrometer','micrometers','Ball anvil for measuring tube wall thickness.','Tubing wall thickness','±0.0001"','0–1"',ARRAY['Mitutoyo','Starrett'],ARRAY['machinist','qc_inspector','fabricator']::text[],ARRAY['qc']::text[],'intermediate',50),
  ('blade-micrometer','Blade Micrometer','micrometers','Thin blade anvils reach narrow grooves.','Groove width, narrow shoulders','±0.0001"','0–1"',ARRAY['Mitutoyo','Starrett'],ARRAY['machinist','qc_inspector']::text[],ARRAY['qc']::text[],'intermediate',60),
  ('point-micrometer','Point Micrometer','micrometers','Conical points for thread minor diameter, web thickness.','Thread minor dia, drill web','±0.0001"','0–1"',ARRAY['Mitutoyo'],ARRAY['machinist','qc_inspector','toolmaker']::text[],ARRAY['qc']::text[],'advanced',70),
  ('thread-micrometer','Thread Micrometer','micrometers','V-anvil + cone for pitch diameter.','Thread pitch diameter inspection','±0.0001"','0–1"/2"',ARRAY['Mitutoyo','Starrett'],ARRAY['qc_inspector','machinist','toolmaker']::text[],ARRAY['qc']::text[],'advanced',80),

  -- Depth & Height
  ('depth-micrometer','Depth Micrometer','depth_height','Bridge + interchangeable rods for depth.','Hole/pocket/step depth','±0.0001"','0–6" with rods',ARRAY['Mitutoyo','Starrett'],ARRAY['machinist','qc_inspector']::text[],ARRAY['operator','qc']::text[],'intermediate',10),
  ('depth-gauge','Depth Gauge (rule)','depth_height','Rule + base for shallow depth checks.','Quick step/shoulder depth','±0.005"','0–6"',ARRAY['Starrett','Mitutoyo'],ARRAY['machinist','assembler']::text[],ARRAY['operator','trainee']::text[],'beginner',20),
  ('digital-depth-gauge','Digital Depth Gauge','depth_height','Electronic depth gauge with LCD readout.','Pocket/blind hole depth','±0.001"','0–6"/12"',ARRAY['Mitutoyo','iGaging'],ARRAY['machinist','qc_inspector']::text[],ARRAY['operator','qc']::text[],'beginner',30),
  ('height-gauge-vernier','Vernier Height Gauge','depth_height','Granite-base height gauge with scribe.','Layout, height transfer','±0.001"','0–12"/24"/40"',ARRAY['Mitutoyo','Starrett'],ARRAY['machinist','qc_inspector','toolmaker']::text[],ARRAY['qc']::text[],'intermediate',40),
  ('height-gauge-digital','Digital Height Gauge','depth_height','Electronic height gauge, often probe-equipped.','QC inspection on surface plate','±0.0005"','0–12"/24"/40"',ARRAY['Mitutoyo','Trimos'],ARRAY['qc_inspector','machinist']::text[],ARRAY['qc']::text[],'advanced',50),

  -- Bore & ID
  ('telescoping-gauge','Telescoping Gauge','bore_id','T-handle gauge transferred to a mic.','Bore ID transfer to micrometer','±0.0005" with mic','5/16"–6"',ARRAY['Starrett','Mitutoyo'],ARRAY['machinist','qc_inspector']::text[],ARRAY['operator','qc']::text[],'intermediate',10),
  ('small-hole-gauge','Small Hole Gauge','bore_id','Split-ball gauge for tiny bores.','Small bore ID transfer','±0.0005"','0.125"–0.500"',ARRAY['Starrett'],ARRAY['machinist','qc_inspector','toolmaker']::text[],ARRAY['qc']::text[],'intermediate',20),
  ('dial-bore-gauge','Dial Bore Gauge','bore_id','Centralizing dial gauge for bore inspection.','Engine bore, hydraulic cylinder','±0.0001"','0.4"–6"',ARRAY['Mitutoyo','Sunnen'],ARRAY['qc_inspector','machinist']::text[],ARRAY['qc']::text[],'advanced',30),
  ('bore-mic-2-point','2-Point Bore Mic','bore_id','Self-centering 2-point bore mic.','Larger bore precision','±0.0002"','2–24"',ARRAY['Bowers','Mitutoyo'],ARRAY['qc_inspector']::text[],ARRAY['qc']::text[],'advanced',40),

  -- Thread & Pitch
  ('thread-pitch-gauge','Thread Pitch Gauge','thread_pitch','Leaf gauge to identify thread TPI / pitch.','Thread identification','n/a','UN, Metric, BSP, NPT',ARRAY['Starrett','General'],ARRAY['machinist','assembler','toolmaker']::text[],ARRAY['operator','trainee']::text[],'beginner',10),
  ('go-no-go-thread','Go/No-Go Thread Gauge','thread_pitch','Plug or ring set for thread pass/fail.','Production thread acceptance','Per ASME B1','UN/Metric per spec',ARRAY['Vermont','PMC'],ARRAY['qc_inspector','machinist']::text[],ARRAY['qc']::text[],'intermediate',20),
  ('thread-ring-gauge','Thread Ring Gauge','thread_pitch','External thread Go/No-Go ring.','OD thread inspection','Per ASME B1','UN/Metric per spec',ARRAY['Vermont','PMC'],ARRAY['qc_inspector']::text[],ARRAY['qc']::text[],'intermediate',30),
  ('thread-plug-gauge','Thread Plug Gauge','thread_pitch','Internal thread Go/No-Go plug.','ID thread inspection','Per ASME B1','UN/Metric per spec',ARRAY['Vermont','PMC'],ARRAY['qc_inspector']::text[],ARRAY['qc']::text[],'intermediate',40),
  ('screw-pitch-mic','Screw Pitch Micrometer','thread_pitch','Mic for measuring thread pitch directly.','Pitch diameter verification','±0.0001"','0–1"',ARRAY['Mitutoyo'],ARRAY['qc_inspector','toolmaker']::text[],ARRAY['qc']::text[],'advanced',50),

  -- Reference & Setting
  ('gauge-block-set','Gauge Block Set','reference','Stack-able precision blocks for setup/cal.','Mic/indicator setup, traceability','Grade 0/AS-1','0.050"–4" set',ARRAY['Mitutoyo','Starrett','Mahr'],ARRAY['qc_inspector','toolmaker','machinist']::text[],ARRAY['qc']::text[],'advanced',10),
  ('pin-gauge-set','Pin Gauge Set','reference','Class ZZ/Z pins for hole size verification.','Hole sizing, slot width','±0.0002"','0.011"–1.000"',ARRAY['Vermont','Meyer'],ARRAY['qc_inspector','machinist']::text[],ARRAY['qc']::text[],'intermediate',20),
  ('sine-bar','Sine Bar','reference','Precision bar + gauge blocks to set angles.','Angle setup on surface plate','±5 arcsec','5"/10" common',ARRAY['Suburban','Starrett'],ARRAY['toolmaker','qc_inspector']::text[],ARRAY['qc']::text[],'advanced',30),
  ('surface-plate','Granite Surface Plate','reference','Reference flat surface for layout/inspection.','Inspection datum','Grade AA/A/B','12x18 to 48x96',ARRAY['Standridge','Starrett'],ARRAY['qc_inspector','toolmaker','machinist']::text[],ARRAY['qc','operator']::text[],'beginner',40),
  ('v-block','V-Block & Clamp','reference','Holds round stock for layout/inspection.','Round-stock layout, indicator runout','±0.0005" parallel','1"–6"',ARRAY['Starrett','Suburban'],ARRAY['machinist','qc_inspector','toolmaker']::text[],ARRAY['qc','operator']::text[],'beginner',50),
  ('parallels','Precision Parallels','reference','Matched ground bars for vise setup.','Workholding parallelism','±0.0002"','1/8"–2" sets',ARRAY['Suburban','Mitutoyo'],ARRAY['machinist']::text[],ARRAY['operator']::text[],'beginner',60),

  -- Indicators
  ('dial-indicator','Dial Indicator','indicators','Plunger-style indicator for runout/flatness.','TIR, parallelism, repeatability','±0.0005"','0.250"/1" travel',ARRAY['Mitutoyo','Starrett','Mahr'],ARRAY['machinist','qc_inspector','toolmaker']::text[],ARRAY['operator','qc']::text[],'intermediate',10),
  ('test-indicator','Test (Lever) Indicator','indicators','Lever-style indicator for tight spots.','Indicating into bores, tramming','±0.0001"','0.030"–0.100"',ARRAY['Interapid','Mitutoyo','Brown & Sharpe'],ARRAY['machinist','qc_inspector','toolmaker']::text[],ARRAY['operator','qc']::text[],'advanced',20),
  ('digital-indicator','Digital Indicator','indicators','Electronic plunger indicator, data output.','SPC data collection','±0.00005"','0.5"/1"/2"',ARRAY['Mitutoyo','Mahr'],ARRAY['qc_inspector']::text[],ARRAY['qc']::text[],'intermediate',30),
  ('magnetic-base','Magnetic Base / Indicator Stand','indicators','On/off magnetic holder for indicators.','Indicator mounting on machines','n/a','Universal',ARRAY['Noga','Starrett'],ARRAY['machinist','qc_inspector','toolmaker']::text[],ARRAY['operator','qc']::text[],'beginner',40),
  ('coaxial-indicator','Coaxial (Centering) Indicator','indicators','Indicator for centering spindles to bores.','Mill spindle alignment to bore','±0.0001"','varies',ARRAY['Blake','Haimer'],ARRAY['machinist','programmer']::text[],ARRAY['operator']::text[],'advanced',50),

  -- Surface & Form
  ('surface-roughness-tester','Surface Roughness Tester','surface_form','Portable Ra/Rz profilometer.','Ra verification per print','Ra ±5%','Ra 0.025–12.5 μm',ARRAY['Mitutoyo','Mahr','Mitutoyo'],ARRAY['qc_inspector','machinist']::text[],ARRAY['qc']::text[],'advanced',10),
  ('roughness-comparator','Roughness Comparator Plates','surface_form','Tactile/visual roughness reference set.','Quick Ra estimate','Visual','Ra 0.4–25 μm',ARRAY['Rubert','GAR'],ARRAY['machinist','qc_inspector']::text[],ARRAY['operator','qc']::text[],'beginner',20),
  ('feeler-gauge','Feeler Gauge Set','surface_form','Stack of thin blades for clearance/gap.','Gap, parallelism, valve clearance','±0.0005"','0.0015"–0.035"',ARRAY['Starrett','Mitutoyo'],ARRAY['machinist','assembler','maintenance']::text[],ARRAY['operator']::text[],'beginner',30),
  ('radius-gauge-set','Radius Gauge Set','surface_form','Convex/concave radius templates.','Fillet/round radius verification','Per template','1/64"–1" sets',ARRAY['Starrett','Mitutoyo'],ARRAY['machinist','qc_inspector','toolmaker']::text[],ARRAY['operator','qc']::text[],'beginner',40),

  -- GD&T / Optical
  ('optical-comparator','Optical Comparator','gdt_optical','Profile projector for 2D shadow inspection.','Profile, thread form, contour','±0.0002"','10x–100x',ARRAY['Deltronic','Starrett'],ARRAY['qc_inspector']::text[],ARRAY['qc']::text[],'advanced',10),
  ('video-measuring','Video Measuring System','gdt_optical','CNC vision system for 2D/2.5D inspection.','High-volume small parts QC','±0.0001"','varies',ARRAY['OGP','Keyence','Mitutoyo'],ARRAY['qc_inspector','cmm_operator']::text[],ARRAY['qc']::text[],'expert',20),
  ('gdt-fixture','GD&T Functional Gauge','gdt_optical','Custom fixture verifying position/profile.','Hole pattern position, profile','Per design','Custom',ARRAY['Custom']::text[],ARRAY['qc_inspector','toolmaker']::text[],ARRAY['qc']::text[],'expert',30),

  -- Hardness & Material
  ('rockwell-tester','Rockwell Hardness Tester','hardness_material','Indenter-based hardness tester (HRA/B/C).','Heat-treat verification','±0.5 HR','HRA/HRB/HRC',ARRAY['Wilson','Mitutoyo'],ARRAY['qc_inspector']::text[],ARRAY['qc']::text[],'advanced',10),
  ('brinell-tester','Brinell Hardness Tester','hardness_material','Ball indenter for soft/heterogeneous materials.','Castings, soft metals','±2 HBW','HBW',ARRAY['Wilson'],ARRAY['qc_inspector']::text[],ARRAY['qc']::text[],'advanced',20),
  ('ultrasonic-thickness','Ultrasonic Thickness Gauge','hardness_material','Sound-pulse gauge for wall thickness without cutting.','Pipe wall, corrosion mapping','±0.001"','0.040"–20"',ARRAY['Olympus','Dakota'],ARRAY['qc_inspector','maintenance']::text[],ARRAY['qc']::text[],'advanced',30),

  -- CMM & Coordinate
  ('bridge-cmm','Bridge CMM','cmm','Stationary 3-axis coordinate measuring machine.','Full-feature dimensional inspection','±0.0001"','varies',ARRAY['Zeiss','Mitutoyo','Hexagon'],ARRAY['cmm_operator','qc_inspector']::text[],ARRAY['qc']::text[],'expert',10),
  ('portable-cmm-arm','Portable CMM Arm','cmm','Articulated arm with probe / laser scanner.','In-process or large-part inspection','±0.0005"','6"–12 ft reach',ARRAY['FARO','Hexagon'],ARRAY['cmm_operator','qc_inspector']::text[],ARRAY['qc']::text[],'expert',20),
  ('laser-tracker','Laser Tracker','cmm','Tracks SMR over large volumes.','Large weldments, alignment','±0.0005" + ppm','Up to 160 ft',ARRAY['FARO','Leica'],ARRAY['cmm_operator']::text[],ARRAY['qc']::text[],'expert',30),

  -- Specialty
  ('borescope','Borescope / Videoscope','specialty','Flexible camera for internal inspection.','Bore wall, weld root, cavity inspection','Visual','3 mm–10 mm dia',ARRAY['Olympus','Karl Storz'],ARRAY['qc_inspector','maintenance']::text[],ARRAY['qc']::text[],'intermediate',10),
  ('dye-penetrant-kit','Dye Penetrant (NDT) Kit','specialty','Liquid penetrant for surface crack detection.','Weld + casting NDT','Per ASTM E165','n/a',ARRAY['Magnaflux','Met-L-Chek'],ARRAY['qc_inspector','welder']::text[],ARRAY['qc']::text[],'intermediate',20),
  ('mag-particle','Magnetic Particle (NDT)','specialty','Detects subsurface defects in ferrous parts.','Weld/forging NDT','Per ASTM E709','n/a',ARRAY['Magnaflux'],ARRAY['qc_inspector','welder']::text[],ARRAY['qc']::text[],'advanced',30),
  ('alignment-laser','Laser Alignment Tool','specialty','Aligns shafts/spindles via laser receiver.','Maintenance shaft alignment','±0.0005"','varies',ARRAY['SKF','Pruftechnik'],ARRAY['maintenance']::text[],ARRAY['operator']::text[],'advanced',40),
  ('leak-tester','Pressure / Leak Tester','specialty','Verifies seal integrity by pressure decay.','Hydraulic/pneumatic leak checks','±1% FS','varies',ARRAY['ATEQ','Cincinnati Test'],ARRAY['qc_inspector','assembler']::text[],ARRAY['qc']::text[],'intermediate',50)
) AS v(slug,name,cat_slug,description,typical_use,precision_spec,measurement_range,manufacturer_examples,profession_tags,role_tags,difficulty,sort_order)
JOIN cats c ON c.slug = v.cat_slug;
