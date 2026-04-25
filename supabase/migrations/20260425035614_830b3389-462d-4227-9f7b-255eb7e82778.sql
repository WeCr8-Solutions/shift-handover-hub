-- ============================================================
-- HANDBOOK CONTENT SEED — production sync (idempotent)
-- Combines: 20260423143141, 20260423144228, 20260423145333,
--           20260424130500, 20260424132000, 20260424214500
-- ============================================================

-- Handbook categories
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
CREATE POLICY "handbook_categories read all" ON public.handbook_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "handbook_categories canonical write platform admin" ON public.handbook_categories;
CREATE POLICY "handbook_categories canonical write platform admin" ON public.handbook_categories
  FOR ALL USING (is_canonical = true AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (is_canonical = true AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "handbook_categories org write" ON public.handbook_categories;
CREATE POLICY "handbook_categories org write" ON public.handbook_categories
  FOR ALL USING (
    is_canonical = false AND organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
    )
  ) WITH CHECK (
    is_canonical = false AND organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
    )
  );

-- Handbook references
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

ALTER TABLE public.handbook_references ADD COLUMN IF NOT EXISTS source_url text;

DROP POLICY IF EXISTS "handbook_references read all" ON public.handbook_references;
CREATE POLICY "handbook_references read all" ON public.handbook_references FOR SELECT USING (true);
DROP POLICY IF EXISTS "handbook_references canonical write platform admin" ON public.handbook_references;
CREATE POLICY "handbook_references canonical write platform admin" ON public.handbook_references
  FOR ALL USING (is_canonical = true AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (is_canonical = true AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "handbook_references org write" ON public.handbook_references;
CREATE POLICY "handbook_references org write" ON public.handbook_references
  FOR ALL USING (
    is_canonical = false AND organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
    )
  ) WITH CHECK (
    is_canonical = false AND organization_id IN (
      SELECT om.organization_id FROM public.organization_members om
      WHERE om.user_id = auth.uid() AND om.role IN ('admin','supervisor')
    )
  );

-- Handbook links
CREATE TABLE IF NOT EXISTS public.handbook_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id uuid NOT NULL REFERENCES public.handbook_references(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN (
    'inspection_tool','machining_operation','gca_question_bank','gca_question',
    'oap_course','oap_lesson','oap_quiz_question','operator_tool'
  )),
  entity_id uuid,
  entity_key text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT handbook_links_target_present CHECK (entity_id IS NOT NULL OR entity_key IS NOT NULL),
  CONSTRAINT handbook_links_unique UNIQUE (reference_id, entity_type, entity_id, entity_key)
);
CREATE INDEX IF NOT EXISTS idx_handbook_links_entity ON public.handbook_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_handbook_links_entity_key ON public.handbook_links(entity_type, entity_key);
ALTER TABLE public.handbook_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "handbook_links read all" ON public.handbook_links;
CREATE POLICY "handbook_links read all" ON public.handbook_links FOR SELECT USING (true);
DROP POLICY IF EXISTS "handbook_links write platform admin" ON public.handbook_links;
CREATE POLICY "handbook_links write platform admin" ON public.handbook_links
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_handbook_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_handbook_categories_touch ON public.handbook_categories;
CREATE TRIGGER trg_handbook_categories_touch BEFORE UPDATE ON public.handbook_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_handbook_updated_at();
DROP TRIGGER IF EXISTS trg_handbook_references_touch ON public.handbook_references;
CREATE TRIGGER trg_handbook_references_touch BEFORE UPDATE ON public.handbook_references
  FOR EACH ROW EXECUTE FUNCTION public.touch_handbook_updated_at();

-- ============================================================
-- SEED CATEGORIES
-- ============================================================
INSERT INTO public.handbook_categories (slug, name, description, sort_order, is_canonical, organization_id) VALUES
  ('materials',         'Materials & Alloys',       'Steel, aluminum, stainless, titanium, plastics — properties & machinability', 10, true, NULL),
  ('feeds-speeds',      'Feeds & Speeds',           'Cutting parameters by tool, material, operation', 20, true, NULL),
  ('threads',           'Threads & Fasteners',      'Unified, metric, pipe, tap drill sizes, thread classes', 30, true, NULL),
  ('fits-tolerances',   'Fits & Tolerances',        'ISO/ANSI fits, hole/shaft tolerances, surface finish', 40, true, NULL),
  ('gdt',               'GD&T',                     'Geometric dimensioning & tolerancing symbols, datums, modifiers', 50, true, NULL),
  ('formulas',          'Formulas & Calculations',  'SFM↔RPM, chip load, MRR, taper, trig for machining', 60, true, NULL),
  ('inspection-measurement', 'Measurement & Inspection', 'Reading verniers, micrometers, indicators, CMM basics', 70, true, NULL),
  ('safety-standards',  'Safety & Standards',       'OSHA, ANSI, AS9100, ISO 9001 essentials for the floor', 80, true, NULL)
ON CONFLICT (slug, organization_id) DO NOTHING;

-- ============================================================
-- SEED REFERENCES
-- ============================================================
WITH cats AS (SELECT id, slug FROM public.handbook_categories WHERE is_canonical = true)
INSERT INTO public.handbook_references (category_id, slug, title, summary, body_md, formula, units, source_citation, tags, difficulty)
SELECT cats.id, v.slug, v.title, v.summary, v.body_md, v.formula, v.units, v.source_citation, v.tags, v.difficulty
FROM cats
JOIN (VALUES
  ('feeds-speeds','sfm-to-rpm','SFM → RPM Conversion',
    'Convert surface feet per minute to spindle RPM for a given cutter diameter.',
    E'## SFM to RPM\n\nSurface speed (SFM) is the linear speed of the cutting edge. Spindle speed (RPM) depends on cutter diameter.\n\n**Use:** pick SFM from material chart, plug in tool diameter, get RPM.\n\n### Worked example\n4140 steel, 1/2" end mill, recommended SFM = 100.\n\n`RPM = (3.82 × 100) / 0.500 = 764 RPM`',
    'RPM = (3.82 × SFM) / D_inches', 'inch',
    'Machinery''s Handbook, 31st ed., "Speeds and Feeds"',
    ARRAY['milling','turning','feeds-speeds','formula'], 'beginner'),
  ('feeds-speeds','chip-load','Chip Load (Feed per Tooth)',
    'Recommended chip load by material and end mill diameter.',
    E'## Chip Load\n\nChip load is the amount of material each flute removes per revolution. Too low = rubbing & heat; too high = breakage.\n\n`Feed (IPM) = RPM × #Flutes × Chip Load`\n\nTypical chip loads (1/2" end mill):\n- Aluminum: 0.004–0.006 in/tooth\n- Mild steel: 0.002–0.004 in/tooth\n- Stainless: 0.0015–0.003 in/tooth\n- Titanium: 0.001–0.002 in/tooth',
    'IPM = RPM × Z × FPT', 'inch',
    'Machinery''s Handbook, 31st ed., "Milling Feed Rates"',
    ARRAY['milling','chip-load','formula'], 'intermediate'),
  ('threads','tap-drill-unified','Tap Drill Sizes — Unified (75% thread)',
    'Standard 75%-thread tap drill table for UNC/UNF.',
    E'## Tap Drill — UNC/UNF (75% thread)\n\n| Thread | Tap Drill |\n|---|---|\n| #6-32 | #36 (.1065) |\n| #8-32 | #29 (.1360) |\n| #10-24 | #25 (.1495) |\n| #10-32 | #21 (.1590) |\n| 1/4-20 | #7 (.2010) |\n| 1/4-28 | #3 (.2130) |\n| 5/16-18 | F (.2570) |\n| 3/8-16 | 5/16 (.3125) |\n| 1/2-13 | 27/64 (.4219) |',
    NULL, 'inch',
    'Machinery''s Handbook, 31st ed., "Tap Drill Sizes"',
    ARRAY['threads','tap','drill','unified'], 'beginner'),
  ('gdt','position-tolerance','Position Tolerance (⌖)',
    'True position controls location of a feature relative to datums.',
    E'## Position (⌖)\n\n- Always applied to a feature of size with a tolerance zone (cylindrical for holes).\n- Modifier (M) (MMC) allows bonus tolerance equal to the departure from MMC.\n- Reference frame: typically |A|B|C| primary/secondary/tertiary datums.\n\n`Bonus = Actual − MMC` (added to stated position tolerance when (M) used)',
    NULL, 'unitless',
    'ASME Y14.5-2018, Section 7',
    ARRAY['gdt','position','asme-y14-5'], 'advanced'),
  ('formulas','mrr-milling','Material Removal Rate — Milling',
    'Volumetric material removal rate for milling operations.',
    E'## MRR (Milling)\n\n`MRR = WOC × DOC × IPM`\n\n- WOC = width of cut (radial engagement), in\n- DOC = depth of cut (axial), in\n- IPM = feed rate, in/min\n\nResult is in³/min — useful for spindle horsepower estimation.',
    'MRR = WOC × DOC × IPM', 'in³/min',
    'Machinery''s Handbook, 31st ed., "Power Constants"',
    ARRAY['milling','mrr','formula','planning'], 'intermediate'),
  ('inspection-measurement','reading-vernier-caliper','Reading a Vernier Caliper',
    'Step-by-step on resolving 0.001" from main scale + vernier.',
    E'## Vernier Caliper\n\n1. Read whole inches and tenths from the main scale at the 0 line of the vernier.\n2. Find the vernier line that aligns exactly with a main-scale line — that is your thousandths.\n3. Add: main reading + (vernier line × 0.001).\n\nAlways close jaws and verify zero before measuring.',
    NULL, 'inch',
    'Machinery''s Handbook, 31st ed., "Measuring Instruments"',
    ARRAY['inspection','vernier','measurement'], 'beginner'),
  ('inspection-measurement','reading-micrometer','Reading an Outside Micrometer',
    'Sleeve + thimble + vernier (when present) to resolve 0.0001".',
    E'## Outside Micrometer (0–1")\n\n1. Read whole turns of the thimble on the sleeve (each = 0.025").\n2. Read the thimble mark aligned with the sleeve datum line (each = 0.001").\n3. If equipped with a vernier on the sleeve, read aligned vernier line (each = 0.0001").\n\nAlways verify zero on a gage block. Use the ratchet/friction thimble for repeatable feel.',
    NULL, 'inch',
    'Machinery''s Handbook, 31st ed., "Measuring Instruments"',
    ARRAY['inspection','micrometer','measurement'], 'beginner'),
  ('inspection-measurement','height-gage-basics','Height Gage — Setup & Use',
    'Vernier/dial/digital height gage for layout and inspection on a surface plate.',
    E'## Height Gage\n\n- Always use on a clean, calibrated granite surface plate.\n- Zero the gage to the surface plate (or a known gage block stack) before use.\n- For scribing: use a sharp carbide scriber and snug the locking screw.\n- For inspection with a dial test indicator attachment, sweep the surface and record the high/low.\n- Account for cosine error when the indicator is not square to the feature.',
    NULL, 'inch',
    'Machinery''s Handbook, 31st ed., "Surface Plate Work"',
    ARRAY['inspection','height-gage','layout','measurement'], 'intermediate'),
  ('safety-standards','as9100-fod','AS9100 — Foreign Object Debris (FOD)',
    'AS9100 expectations for FOD prevention on the shop floor.',
    E'## FOD Control (AS9100)\n\n- Defined FOD-critical zones with signage and clean-as-you-go discipline.\n- Tool accountability (shadow boards, tethered tools above part).\n- Pre/post-op visual checks logged at the operation.\n- NCR + root cause if FOD is detected post-process.\n\nAuditors look for evidence: photos, sign-offs, training records.',
    NULL, 'unitless',
    'AS9100 Rev D §8.5.4 + IAQG FOD guidance',
    ARRAY['as9100','safety','quality','fod'], 'intermediate'),
  ('materials','aluminum-6061-t6','Aluminum 6061-T6',
    'General-purpose structural aluminum. Excellent machinability.',
    E'**Composition:** Al-Mg-Si alloy, T6 temper.\n\n**Machinability rating:** ~90% (very good)\n\n**Recommended SFM:**\n- HSS: 250–400\n- Carbide: 600–1200\n\n**Coolant:** Flood or mist. Avoid dry cutting (chip welding).\n\n**Notes:** Use sharp tools, polished flutes, high rake. Chip evacuation critical in deep pockets.',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.',
    ARRAY['aluminum','6061','machinability'], 'beginner'),
  ('materials','aluminum-7075-t6','Aluminum 7075-T6',
    'High-strength aerospace aluminum. More abrasive than 6061.',
    E'**Composition:** Al-Zn-Mg-Cu, T6 temper.\n\n**Machinability:** ~70%\n\n**SFM:** HSS 200–300; Carbide 500–900\n\n**Coolant:** Flood; heat sensitive.',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.',
    ARRAY['aluminum','7075','aerospace'], 'intermediate'),
  ('materials','stainless-304','Stainless Steel 304',
    'Austenitic SS. Work-hardens; requires positive feed.',
    E'**Composition:** 18% Cr, 8% Ni.\n\n**Machinability:** ~45% (work-hardening)\n\n**SFM:** Carbide 200–350; HSS 60–100\n\n**Critical:** Never dwell. Sharp positive-rake tools. Heavy chip load. Flood coolant.',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.',
    ARRAY['stainless','304','work-hardening'], 'intermediate'),
  ('materials','stainless-316','Stainless Steel 316',
    'Marine-grade SS with molybdenum. Tougher than 304.',
    E'**Composition:** 16% Cr, 10% Ni, 2% Mo.\n\n**SFM (carbide):** 180–300\n\nReduce SFM 15% vs 304. Same work-hardening rules.',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.',
    ARRAY['stainless','316','marine'], 'intermediate'),
  ('materials','steel-4140','Alloy Steel 4140',
    'Chromoly. Pre-hard (28-32 HRC) common in shops.',
    E'**Machinability:** ~65% annealed; ~50% pre-hard.\n\n**SFM:**\n- Annealed carbide: 300–500\n- Pre-hard (30 HRC) carbide: 200–350',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.',
    ARRAY['steel','4140','alloy'], 'intermediate'),
  ('materials','titanium-6al4v','Titanium Ti-6Al-4V (Grade 5)',
    'Aerospace titanium. Heat stays at edge.',
    E'**Machinability:** ~22%\n\n**SFM (carbide):** 100–200\n\n**Critical:** Sharp tools, positive rake. High-pressure flood coolant. Climb mill only. Avoid dwelling — fire risk.',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.',
    ARRAY['titanium','aerospace','heat'], 'advanced'),
  ('materials','brass-360','Brass C360 (Free-Machining)',
    'Excellent machinability. Self-lubricating chips.',
    E'**Machinability:** 100% (reference standard)\n\n**SFM (carbide):** 600–1000\n\nOften run dry. Use neutral-rake tools.',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.',
    ARRAY['brass','free-machining'], 'beginner'),
  ('materials','delrin-acetal','Delrin / Acetal (POM)',
    'Engineering thermoplastic. Sharp tools mandatory.',
    E'**Machinability:** Excellent\n\n**SFM:** 600–1500 (carbide)\n\nUse sharp, polished tools. Air blast or mist (no flood — moisture absorption).',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.',
    ARRAY['plastic','delrin','acetal'], 'beginner'),
  ('fits-tolerances','iso-fits-h7','ISO Fit H7/g6 — Sliding Fit',
    'Standard sliding fit for shafts and bores.',
    E'## H7/g6 Sliding Fit\n\n- H7 = hole tolerance (basic size +0/+IT7).\n- g6 = shaft tolerance (small clearance).\n- Use: precision sliding parts, locating pins, light bearings.\n\nFor a 25 mm nominal: hole 25.000/25.021; shaft 24.993/24.980.',
    NULL, 'mm', 'ISO 286-1, Machinery''s Handbook 31st ed.',
    ARRAY['fits','iso','h7','tolerances'], 'intermediate')
) AS v(category_slug, slug, title, summary, body_md, formula, units, source_citation, tags, difficulty)
  ON cats.slug = v.category_slug
ON CONFLICT (slug, organization_id) DO NOTHING;

-- ============================================================
-- BACKFILL public flag on verified operator certifications
-- ============================================================
UPDATE public.operator_certifications
SET is_public = true
WHERE verification_source IN ('verified_oap', 'verified_gca', 'local_oap')
  AND is_public = false;