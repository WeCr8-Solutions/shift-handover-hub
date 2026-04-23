-- Handbook categories (canonical + org-extendable)
CREATE TABLE IF NOT EXISTS public.handbook_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_canonical boolean NOT NULL DEFAULT true,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT handbook_categories_canonical_org_check
    CHECK ((is_canonical = true AND organization_id IS NULL)
        OR (is_canonical = false AND organization_id IS NOT NULL)),
  CONSTRAINT handbook_categories_slug_scope_unique UNIQUE (slug, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_handbook_categories_slug ON public.handbook_categories(slug);
ALTER TABLE public.handbook_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "handbook_categories read all" ON public.handbook_categories;
CREATE POLICY "handbook_categories read all"
  ON public.handbook_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "handbook_categories canonical write platform admin" ON public.handbook_categories;
CREATE POLICY "handbook_categories canonical write platform admin"
  ON public.handbook_categories FOR ALL
  USING (is_canonical = true AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (is_canonical = true AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "handbook_categories org write" ON public.handbook_categories;
CREATE POLICY "handbook_categories org write"
  ON public.handbook_categories FOR ALL
  USING (
    is_canonical = false
    AND organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
    )
  )
  WITH CHECK (
    is_canonical = false
    AND organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
    )
  );

-- Handbook references (the actual articles/entries)
CREATE TABLE IF NOT EXISTS public.handbook_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.handbook_categories(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  summary text,
  body_md text NOT NULL DEFAULT '',
  formula text,
  units text,
  source_citation text,
  tags text[] NOT NULL DEFAULT '{}',
  difficulty text,
  is_canonical boolean NOT NULL DEFAULT true,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT handbook_references_canonical_org_check
    CHECK ((is_canonical = true AND organization_id IS NULL)
        OR (is_canonical = false AND organization_id IS NOT NULL)),
  CONSTRAINT handbook_references_slug_scope_unique UNIQUE (slug, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_handbook_references_category ON public.handbook_references(category_id);
CREATE INDEX IF NOT EXISTS idx_handbook_references_tags ON public.handbook_references USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_handbook_references_slug ON public.handbook_references(slug);
ALTER TABLE public.handbook_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "handbook_references read all" ON public.handbook_references;
CREATE POLICY "handbook_references read all"
  ON public.handbook_references FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "handbook_references canonical write platform admin" ON public.handbook_references;
CREATE POLICY "handbook_references canonical write platform admin"
  ON public.handbook_references FOR ALL
  USING (is_canonical = true AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (is_canonical = true AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "handbook_references org write" ON public.handbook_references;
CREATE POLICY "handbook_references org write"
  ON public.handbook_references FOR ALL
  USING (
    is_canonical = false
    AND organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
    )
  )
  WITH CHECK (
    is_canonical = false
    AND organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
    )
  );

-- Polymorphic link table: attach handbook entry to any other entity
CREATE TABLE IF NOT EXISTS public.handbook_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL REFERENCES public.handbook_references(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN (
    'inspection_tool','machining_operation','gca_question_bank','gca_question',
    'oap_course','oap_lesson','oap_quiz_question','operator_tool'
  )),
  entity_id uuid,                  -- nullable for entity_type='operator_tool' which uses entity_key
  entity_key text,                 -- e.g. 'speed-feed-calculator', 'thread-selection'
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT handbook_links_target_present
    CHECK (entity_id IS NOT NULL OR entity_key IS NOT NULL),
  CONSTRAINT handbook_links_unique UNIQUE (reference_id, entity_type, entity_id, entity_key)
);
CREATE INDEX IF NOT EXISTS idx_handbook_links_entity ON public.handbook_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_handbook_links_entity_key ON public.handbook_links(entity_type, entity_key);
ALTER TABLE public.handbook_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "handbook_links read all" ON public.handbook_links;
CREATE POLICY "handbook_links read all"
  ON public.handbook_links FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "handbook_links write platform admin" ON public.handbook_links;
CREATE POLICY "handbook_links write platform admin"
  ON public.handbook_links FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_handbook_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_handbook_categories_touch ON public.handbook_categories;
CREATE TRIGGER trg_handbook_categories_touch
  BEFORE UPDATE ON public.handbook_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_handbook_updated_at();

DROP TRIGGER IF EXISTS trg_handbook_references_touch ON public.handbook_references;
CREATE TRIGGER trg_handbook_references_touch
  BEFORE UPDATE ON public.handbook_references
  FOR EACH ROW EXECUTE FUNCTION public.touch_handbook_updated_at();

-- Seed canonical categories
INSERT INTO public.handbook_categories (slug, name, description, sort_order) VALUES
  ('materials',          'Materials & Alloys',        'Steel, aluminum, stainless, titanium, plastics — properties & machinability', 10),
  ('feeds-speeds',       'Feeds & Speeds',            'Cutting parameters by tool, material, operation', 20),
  ('threads',            'Threads & Fasteners',       'Unified, metric, pipe, tap drill sizes, thread classes', 30),
  ('tolerances-fits',    'Tolerances & Fits',         'ISO/ANSI fits, hole/shaft tolerances, surface finish', 40),
  ('gdt',                'GD&T',                      'Geometric dimensioning & tolerancing symbols, datums, modifiers', 50),
  ('formulas',           'Formulas & Calculations',   'SFM↔RPM, chip load, MRR, taper, trig for machining', 60),
  ('measurement',        'Measurement & Inspection',  'Reading verniers, micrometers, indicators, CMM basics', 70),
  ('safety-standards',   'Safety & Standards',        'OSHA, ANSI, AS9100, ISO 9001 essentials for the floor', 80)
ON CONFLICT (slug, organization_id) DO NOTHING;

-- Seed a starter set of canonical references
WITH cats AS (SELECT id, slug FROM public.handbook_categories WHERE is_canonical = true)
INSERT INTO public.handbook_references (category_id, slug, title, summary, body_md, formula, units, source_citation, tags, difficulty)
SELECT id, v.slug, v.title, v.summary, v.body_md, v.formula, v.units, v.source_citation, v.tags, v.difficulty
FROM cats
JOIN (VALUES
  ('feeds-speeds','sfm-to-rpm','SFM → RPM Conversion',
    'Convert surface feet per minute to spindle RPM for a given cutter diameter.',
    E'## SFM to RPM\n\nSurface speed (SFM) is the linear speed of the cutting edge. Spindle speed (RPM) depends on cutter diameter.\n\n**Use:** pick SFM from material chart, plug in tool diameter, get RPM.\n\n### Worked example\n4140 steel, ½″ end mill, recommended SFM = 100.\n\n`RPM = (3.82 × 100) / 0.500 = 764 RPM`',
    'RPM = (3.82 × SFM) / D_inches',
    'inch',
    'Machinery''s Handbook, 31st ed., "Speeds and Feeds"',
    ARRAY['milling','turning','feeds-speeds','formula'],
    'beginner'),
  ('feeds-speeds','chip-load','Chip Load (Feed per Tooth)',
    'Recommended chip load by material and end mill diameter.',
    E'## Chip Load\n\nChip load is the amount of material each flute removes per revolution. Too low = rubbing & heat; too high = breakage.\n\n`Feed (IPM) = RPM × #Flutes × Chip Load`\n\nTypical chip loads (½″ end mill):\n- Aluminum: 0.004–0.006 in/tooth\n- Mild steel: 0.002–0.004 in/tooth\n- Stainless: 0.0015–0.003 in/tooth\n- Titanium: 0.001–0.002 in/tooth',
    'IPM = RPM × Z × FPT',
    'inch',
    'Machinery''s Handbook, 31st ed., "Milling Feed Rates"',
    ARRAY['milling','chip-load','formula'],
    'intermediate'),
  ('threads','tap-drill-unified','Tap Drill Sizes — Unified (75% thread)',
    'Standard 75%-thread tap drill table for UNC/UNF.',
    E'## Tap Drill — UNC/UNF (75% thread)\n\n| Thread | Tap Drill |\n|---|---|\n| #6-32 | #36 (.1065) |\n| #8-32 | #29 (.1360) |\n| #10-24 | #25 (.1495) |\n| #10-32 | #21 (.1590) |\n| ¼-20 | #7 (.2010) |\n| ¼-28 | #3 (.2130) |\n| 5/16-18 | F (.2570) |\n| 5/16-24 | I (.2720) |\n| 3/8-16 | 5/16 (.3125) |\n| 3/8-24 | Q (.3320) |\n| ½-13 | 27/64 (.4219) |\n| ½-20 | 29/64 (.4531) |',
    'TapDrill ≈ MajorDia − (1/TPI)',
    'inch',
    'Machinery''s Handbook, 31st ed., "Tap Drill Sizes"',
    ARRAY['threads','tapping','reference-table'],
    'beginner'),
  ('tolerances-fits','iso-fits-h7','ISO Fits — H7/g6, H7/h6, H7/k6, H7/p6',
    'Common shaft/hole fit classes used in production drawings.',
    E'## Common ISO Fits (hole basis, H7)\n\n- **H7/g6** — sliding fit, lubricated, free movement\n- **H7/h6** — slide/locational, hand assembly\n- **H7/k6** — light press, mallet assembly\n- **H7/p6** — medium press, requires arbor press\n\nPick fit class based on assembly method and required play.',
    NULL,
    'metric',
    'Machinery''s Handbook, 31st ed., "ISO System of Limits and Fits"',
    ARRAY['tolerances','fits','iso','gd-t'],
    'intermediate'),
  ('gdt','position-tolerance','Position Tolerance (⌖)',
    'True position controls location of a feature relative to datums.',
    E'## Position (⌖)\n\n- Always applied to a feature of size with a tolerance zone (cylindrical for holes).\n- Modifier ⓜ (MMC) allows bonus tolerance equal to the departure from MMC.\n- Reference frame: typically |A|B|C| primary/secondary/tertiary datums.\n\n`Bonus = Actual − MMC` (added to stated position tolerance when ⓜ used)',
    NULL,
    'unitless',
    'ASME Y14.5-2018, Section 7',
    ARRAY['gdt','position','asme-y14-5'],
    'advanced'),
  ('formulas','mrr-milling','Material Removal Rate — Milling',
    'Volumetric material removal rate for milling operations.',
    E'## MRR (Milling)\n\n`MRR = WOC × DOC × IPM`\n\n- WOC = width of cut (radial engagement), in\n- DOC = depth of cut (axial), in\n- IPM = feed rate, in/min\n\nResult is in³/min — useful for spindle horsepower estimation.',
    'MRR = WOC × DOC × IPM',
    'in³/min',
    'Machinery''s Handbook, 31st ed., "Power Constants"',
    ARRAY['milling','mrr','formula','planning'],
    'intermediate'),
  ('measurement','reading-vernier-caliper','Reading a Vernier Caliper',
    'Step-by-step on resolving 0.001″ from main scale + vernier.',
    E'## Vernier Caliper\n\n1. Read whole inches and tenths from the main scale at the 0 line of the vernier.\n2. Find the vernier line that aligns exactly with a main-scale line — that is your thousandths.\n3. Add: main reading + (vernier line × 0.001).\n\nAlways close jaws and verify zero before measuring.',
    NULL,
    'inch',
    'Machinery''s Handbook, 31st ed., "Measuring Instruments"',
    ARRAY['inspection','vernier','measurement'],
    'beginner'),
  ('safety-standards','as9100-fod','AS9100 — Foreign Object Debris (FOD)',
    'AS9100 expectations for FOD prevention on the shop floor.',
    E'## FOD Control (AS9100)\n\n- Defined FOD-critical zones with signage and clean-as-you-go discipline.\n- Tool accountability (shadow boards, tethered tools above part).\n- Pre/post-op visual checks logged at the operation.\n- NCR + root cause if FOD is detected post-process.\n\nAuditors look for evidence: photos, sign-offs, training records.',
    NULL,
    'unitless',
    'AS9100 Rev D §8.5.4 + IAQG FOD guidance',
    ARRAY['as9100','safety','quality','fod'],
    'intermediate')
) AS v(category_slug, slug, title, summary, body_md, formula, units, source_citation, tags, difficulty)
ON cats.slug = v.category_slug
ON CONFLICT (slug, organization_id) DO NOTHING;