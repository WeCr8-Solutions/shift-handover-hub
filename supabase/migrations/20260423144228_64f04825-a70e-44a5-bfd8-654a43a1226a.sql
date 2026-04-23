-- Categories (idempotent via NOT EXISTS)
INSERT INTO public.handbook_categories (slug, name, description, sort_order, is_canonical, organization_id)
SELECT * FROM (VALUES
  ('materials', 'Materials', 'Material properties, machinability, and recommended cutting parameters', 10, true, NULL::uuid),
  ('feeds-speeds', 'Feeds & Speeds', 'SFM, RPM, chip load, and feedrate formulas', 20, true, NULL::uuid),
  ('threads', 'Threads', 'UN/Metric/NPT thread specifications and tap drill charts', 30, true, NULL::uuid),
  ('gdt', 'GD&T', 'Geometric Dimensioning & Tolerancing symbols and usage', 40, true, NULL::uuid),
  ('fits-tolerances', 'Fits & Tolerances', 'ANSI/ISO fit classes, shrink and press fits', 50, true, NULL::uuid),
  ('inspection', 'Inspection', 'Measurement instruments, gage R&R, and CMM basics', 60, true, NULL::uuid),
  ('safety', 'Safety', 'LOTO, chip handling, coolant safety, PPE', 70, true, NULL::uuid)
) AS t(slug, name, description, sort_order, is_canonical, organization_id)
WHERE NOT EXISTS (
  SELECT 1 FROM public.handbook_categories c
  WHERE c.slug = t.slug AND c.organization_id IS NULL
);

DO $$
DECLARE
  cat_materials uuid;
  cat_feeds uuid;
  cat_threads uuid;
  cat_gdt uuid;
  cat_fits uuid;
  cat_insp uuid;
  cat_safety uuid;
  r record;
  ref_id uuid;
BEGIN
  SELECT id INTO cat_materials FROM public.handbook_categories WHERE slug='materials' AND organization_id IS NULL;
  SELECT id INTO cat_feeds FROM public.handbook_categories WHERE slug='feeds-speeds' AND organization_id IS NULL;
  SELECT id INTO cat_threads FROM public.handbook_categories WHERE slug='threads' AND organization_id IS NULL;
  SELECT id INTO cat_gdt FROM public.handbook_categories WHERE slug='gdt' AND organization_id IS NULL;
  SELECT id INTO cat_fits FROM public.handbook_categories WHERE slug='fits-tolerances' AND organization_id IS NULL;
  SELECT id INTO cat_insp FROM public.handbook_categories WHERE slug='inspection' AND organization_id IS NULL;
  SELECT id INTO cat_safety FROM public.handbook_categories WHERE slug='safety' AND organization_id IS NULL;

  -- Use a temp table to seed all references then INSERT only those missing
  CREATE TEMP TABLE _hb_seed (
    cat_id uuid, slug text, title text, summary text, body_md text,
    formula text, units text, source_citation text, tags text[], difficulty text
  ) ON COMMIT DROP;

  INSERT INTO _hb_seed VALUES
  (cat_materials, 'aluminum-6061-t6', 'Aluminum 6061-T6', 'General-purpose structural aluminum. Excellent machinability.',
    E'**Composition:** Al-Mg-Si alloy, T6 temper.\n\n**Machinability rating:** ~90% (very good)\n\n**Recommended SFM:**\n- HSS: 250–400\n- Carbide: 600–1200\n\n**Coolant:** Flood or mist. Avoid dry cutting (chip welding).\n\n**Notes:** Use sharp tools, polished flutes, high rake. Chip evacuation critical in deep pockets.',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed., §Materials', ARRAY['aluminum','6061','machinability'], 'beginner'),
  (cat_materials, 'aluminum-7075-t6', 'Aluminum 7075-T6', 'High-strength aerospace aluminum. More abrasive than 6061.',
    E'**Composition:** Al-Zn-Mg-Cu, T6 temper.\n\n**Machinability:** ~70%\n\n**SFM:** HSS 200–300; Carbide 500–900\n\n**Coolant:** Flood; heat sensitive.',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.', ARRAY['aluminum','7075','aerospace'], 'intermediate'),
  (cat_materials, 'stainless-304', 'Stainless Steel 304', 'Austenitic SS. Work-hardens; requires positive feed.',
    E'**Composition:** 18% Cr, 8% Ni.\n\n**Machinability:** ~45% (work-hardening)\n\n**SFM:** Carbide 200–350; HSS 60–100\n\n**Critical:**\n1. Never dwell\n2. Sharp positive-rake tools\n3. Heavy chip load (0.005–0.015 IPT)\n4. Flood coolant',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.', ARRAY['stainless','304','work-hardening'], 'intermediate'),
  (cat_materials, 'stainless-316', 'Stainless Steel 316', 'Marine-grade SS with molybdenum. Tougher than 304.',
    E'**Composition:** 16% Cr, 10% Ni, 2% Mo.\n\n**SFM (carbide):** 180–300\n\nReduce SFM 15% vs 304. Same work-hardening rules.',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.', ARRAY['stainless','316','marine'], 'intermediate'),
  (cat_materials, 'steel-4140', 'Alloy Steel 4140', 'Chromoly. Pre-hard (28-32 HRC) common in shops.',
    E'**Machinability:** ~65% annealed; ~50% pre-hard.\n\n**SFM:**\n- Annealed carbide: 300–500\n- Pre-hard (30 HRC) carbide: 200–350',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.', ARRAY['steel','4140','alloy'], 'intermediate'),
  (cat_materials, 'titanium-6al4v', 'Titanium Ti-6Al-4V (Grade 5)', 'Aerospace titanium. Heat stays at edge.',
    E'**Machinability:** ~22%\n\n**SFM (carbide):** 100–200\n\n**Critical:**\n1. Sharp tools, positive rake\n2. High-pressure flood coolant\n3. Climb mill only\n4. Avoid dwelling — fire risk',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.', ARRAY['titanium','aerospace','heat'], 'advanced'),
  (cat_materials, 'brass-360', 'Brass C360 (Free-Machining)', 'Excellent machinability. Self-lubricating chips.',
    E'**Machinability:** 100% (reference standard)\n\n**SFM (carbide):** 600–1000\n\nOften run dry. Use neutral-rake tools.',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed.', ARRAY['brass','free-machining'], 'beginner'),
  (cat_materials, 'delrin-acetal', 'Delrin / Acetal (POM)', 'Engineering thermoplastic. Sharp tools mandatory.',
    E'**SFM:** 400–800 (carbide)\n\nSharp single-flute tools for slotting. Air blast OK. Avoid heat — gums flutes.',
    NULL, 'SFM', 'Machinery''s Handbook 31st ed., §Plastics', ARRAY['plastic','delrin','acetal'], 'beginner'),

  (cat_feeds, 'sfm-to-rpm', 'SFM → RPM Conversion', 'Convert surface speed to spindle RPM.',
    E'Convert recommended SFM into spindle RPM for a given tool diameter.\n\nMetric: `RPM = (SMM × 1000) / (π × D_mm)`',
    'RPM = (SFM × 12) / (π × D)', 'inches', 'Machinery''s Handbook 31st ed.', ARRAY['formula','sfm','rpm'], 'beginner'),
  (cat_feeds, 'feed-per-tooth', 'Feed Per Tooth (Chip Load)', 'Calculate feedrate from chip load.',
    E'**Typical chip loads (carbide endmill, 1/2"):**\n- Aluminum: 0.005–0.012 IPT\n- Steel: 0.003–0.006 IPT\n- Stainless: 0.004–0.007 IPT\n- Titanium: 0.002–0.004 IPT',
    'IPM = RPM × Z × IPT', 'inches/min', 'Machinery''s Handbook 31st ed.', ARRAY['formula','chipload','feedrate'], 'beginner'),
  (cat_feeds, 'mrr-formula', 'Material Removal Rate (MRR)', 'Volumetric removal rate for milling.',
    E'**Spindle HP estimate:** `HP = MRR × Kp` where Kp is unit power coefficient (~1.0 steel, ~0.3 aluminum).',
    'MRR = WOC × DOC × IPM', 'in³/min', 'Machinery''s Handbook 31st ed.', ARRAY['formula','mrr','horsepower'], 'intermediate'),
  (cat_feeds, 'turning-sfm', 'Turning Surface Speed', 'SFM ranges for common turning operations.',
    E'**Carbide insert turning:**\n\n| Material | Roughing | Finishing |\n|---|---|---|\n| 1018 | 400 | 600 |\n| 4140 ann | 300 | 500 |\n| 304 SS | 250 | 400 |\n| 6061 | 800 | 1500 |\n| Brass | 600 | 1000 |',
    'RPM = (SFM × 12) / (π × D_workpiece)', 'inches', 'Machinery''s Handbook 31st ed., §Turning', ARRAY['turning','sfm','lathe'], 'intermediate'),

  (cat_threads, 'tap-drill-un', 'UN Tap Drill Chart', 'Tap drill sizes for 75% thread (Unified inch).',
    E'**Common UNC tap drills (75% thread):**\n\n| Size | Tap Drill |\n|---|---|\n| #4-40 | #43 (.089") |\n| #6-32 | #36 (.106") |\n| #8-32 | #29 (.136") |\n| #10-24 | #25 (.149") |\n| #10-32 | #21 (.159") |\n| 1/4-20 | #7 (.201") |\n| 1/4-28 | #3 (.213") |\n| 5/16-18 | F (.257") |\n| 3/8-16 | 5/16" |\n| 1/2-13 | 27/64" |',
    'Tap Drill = Major Dia − (1.0825 / TPI)', 'inches', 'Machinery''s Handbook 31st ed., §Threads', ARRAY['tap','drill','UNC','UNF'], 'beginner'),
  (cat_threads, 'tap-drill-metric', 'Metric Tap Drill Chart', 'ISO metric coarse and fine threads.',
    E'**Metric coarse (75%):**\n\n| Size | Tap Drill |\n|---|---|\n| M3 × 0.5 | 2.5 mm |\n| M4 × 0.7 | 3.3 mm |\n| M5 × 0.8 | 4.2 mm |\n| M6 × 1.0 | 5.0 mm |\n| M8 × 1.25 | 6.8 mm |\n| M10 × 1.5 | 8.5 mm |\n| M12 × 1.75 | 10.2 mm |',
    'Tap Drill (mm) = Major − Pitch', 'mm', 'Machinery''s Handbook 31st ed.', ARRAY['tap','drill','metric','ISO'], 'beginner'),
  (cat_threads, 'npt-pipe-thread', 'NPT Pipe Threads', 'National Pipe Taper — 1.78°/inch taper.',
    E'**NPT** is tapered (1°47'' per side). Sealing by deformation.\n\n| Size | Tap Drill |\n|---|---|\n| 1/8-27 | R (.339") |\n| 1/4-18 | 7/16" |\n| 3/8-18 | 37/64" |\n| 1/2-14 | 23/32" |\n| 3/4-14 | 59/64" |\n\nAlways use thread sealant.',
    NULL, 'inches', 'Machinery''s Handbook 31st ed., §Pipe Threads', ARRAY['NPT','pipe','tapered'], 'intermediate'),

  (cat_gdt, 'gdt-symbols-overview', 'GD&T 14 Symbols', 'ASME Y14.5 geometric tolerance symbols.',
    E'**Form (no datum):** Straightness, Flatness, Circularity, Cylindricity\n\n**Profile:** Profile of a Line, Profile of a Surface\n\n**Orientation:** Angularity, Perpendicularity, Parallelism\n\n**Location:** Position, Concentricity, Symmetry\n\n**Runout:** Circular Runout, Total Runout',
    NULL, NULL, 'ASME Y14.5-2018', ARRAY['gdt','symbols','asme'], 'intermediate'),
  (cat_gdt, 'gdt-position', 'Position Tolerance', 'Most-used GD&T control.',
    E'**Position** controls where a feature is located relative to datums.\n\n**Cylindrical zone:** ⌀ tol\n\n**MMC modifier (M):** Bonus tolerance equal to departure from MMC.\n\n**Example:** ⌀.010 M | A | B | C',
    NULL, NULL, 'ASME Y14.5-2018', ARRAY['gdt','position','mmc'], 'intermediate'),
  (cat_gdt, 'gdt-flatness', 'Flatness', 'Form control — no datum.',
    E'**Flatness** specifies that all points lie between two parallel planes separated by tolerance value. Inspected with surface plate + indicator or CMM.',
    NULL, 'inches or mm', 'ASME Y14.5-2018', ARRAY['gdt','flatness','form'], 'beginner'),

  (cat_fits, 'iso-fits-h7-g6', 'ISO Fit H7/g6 (Sliding)', 'Standard sliding fit.',
    E'**H7/g6** is the most common precision sliding clearance fit.\n\nUse for shafts that rotate or slide freely (bushings, dowel guides).',
    NULL, 'mm', 'ISO 286-1; Machinery''s Handbook 31st ed.', ARRAY['iso','fits','h7','g6','sliding'], 'intermediate'),
  (cat_fits, 'press-fit-interference', 'Press Fit (Interference)', 'Interference and assembly force.',
    E'Typical interference: 0.0005" to 0.002" per inch of diameter.\n\nUse for: dowel pins, bearing races, gears on shafts.',
    'F_assembly ≈ π × D × L × p × μ', 'lbf', 'Machinery''s Handbook 31st ed., §Fits', ARRAY['press','interference','dowel'], 'advanced'),

  (cat_insp, 'micrometer-use', 'Micrometer Technique', 'Outside micrometer use.',
    E'1. Zero check\n2. Workpiece clean\n3. Use ratchet — same pressure\n4. Square the spindle\n5. Read thimble + sleeve + vernier\n\n**Resolution:** 0.001" std, 0.0001" with vernier.',
    NULL, 'inches or mm', 'Machinery''s Handbook 31st ed., §Inspection', ARRAY['micrometer','inspection'], 'beginner'),
  (cat_insp, 'caliper-use', 'Caliper Technique', 'Vernier/dial/digital caliper.',
    E'**Resolution:** 0.001" digital.\n\n**Accuracy:** ±0.001" — NOT a substitute for a micrometer.\n\nZero before use; light contact pressure; inspect jaws annually.',
    NULL, 'inches or mm', 'Machinery''s Handbook 31st ed.', ARRAY['caliper','inspection'], 'beginner'),
  (cat_insp, 'gage-r-and-r', 'Gage R&R Basics', 'Repeatability & Reproducibility.',
    E'**Acceptance:**\n- < 10% of tolerance: acceptable\n- 10–30%: marginal\n- > 30%: unacceptable\n\n**Standard:** AIAG MSA 4th ed.',
    '%R&R = (σ_RR / Tolerance) × 100', '%', 'AIAG MSA 4th ed.', ARRAY['gage','rr','msa','quality'], 'advanced'),

  (cat_safety, 'lockout-tagout', 'Lockout / Tagout (LOTO)', 'OSHA 29 CFR 1910.147 — energy isolation.',
    E'**Six steps:**\n1. Prepare for shutdown\n2. Shut down equipment\n3. Isolate energy\n4. Apply locks & tags\n5. Verify zero energy (try-to-start)\n6. Service. Reverse to restore.',
    NULL, NULL, 'OSHA 29 CFR 1910.147', ARRAY['safety','loto','osha'], 'beginner'),
  (cat_safety, 'chip-handling', 'Chip & Coolant Safety', 'PPE and handling.',
    E'**Chips:** Never clear with bare hands — use brush/hook. Hot chips can ignite.\n\n**Coolant:** Wear nitrile gloves; eye protection mandatory; refer to SDS.',
    NULL, NULL, 'OSHA Machine Guarding §1910.212', ARRAY['safety','chips','coolant','ppe'], 'beginner');

  -- Insert only references that don't already exist
  FOR r IN SELECT * FROM _hb_seed LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.handbook_references hr
      WHERE hr.slug = r.slug AND hr.organization_id IS NULL
    ) THEN
      INSERT INTO public.handbook_references
        (category_id, slug, title, summary, body_md, formula, units, source_citation, tags, difficulty, is_canonical, organization_id)
      VALUES
        (r.cat_id, r.slug, r.title, r.summary, r.body_md, r.formula, r.units, r.source_citation, r.tags, r.difficulty, true, NULL);
    END IF;
  END LOOP;

  -- Wire Speed & Feed Calculator links
  FOR ref_id IN
    SELECT id FROM public.handbook_references
    WHERE slug IN ('sfm-to-rpm','feed-per-tooth','mrr-formula','turning-sfm','aluminum-6061-t6','steel-4140','stainless-304')
      AND organization_id IS NULL
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.handbook_links
      WHERE entity_type='operator_tool' AND entity_key='speed_feed_calculator' AND reference_id=ref_id
    ) THEN
      INSERT INTO public.handbook_links (entity_type, entity_key, reference_id, sort_order)
      VALUES ('operator_tool', 'speed_feed_calculator', ref_id, 0);
    END IF;
  END LOOP;

  -- Wire Thread Selection links
  FOR ref_id IN
    SELECT id FROM public.handbook_references
    WHERE slug IN ('tap-drill-un','tap-drill-metric','npt-pipe-thread')
      AND organization_id IS NULL
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.handbook_links
      WHERE entity_type='operator_tool' AND entity_key='thread_selection' AND reference_id=ref_id
    ) THEN
      INSERT INTO public.handbook_links (entity_type, entity_key, reference_id, sort_order)
      VALUES ('operator_tool', 'thread_selection', ref_id, 0);
    END IF;
  END LOOP;
END $$;