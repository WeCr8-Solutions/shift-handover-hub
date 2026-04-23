
-- Relax section number constraint
ALTER TABLE public.oap_courses
  DROP CONSTRAINT IF EXISTS oap_courses_section_number_check;
ALTER TABLE public.oap_courses
  ADD CONSTRAINT oap_courses_section_number_check
  CHECK (section_number >= 1 AND section_number <= 99);

-- ============================================================
-- GCA Bank Templates
-- ============================================================
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, is_published, sort_order)
VALUES
  ('tool-testing-calibration', 'Inspection Tool Testing & Calibration', 'Quality',
   'Verifying calipers, micrometers, indicators, and gauge blocks against reference standards. Identify signs of wear, drift, and improper handling.',
   'intermediate', 80, false, true, 100),
  ('cutting-tool-knowledge', 'Cutting Tool Knowledge — Inserts & Holders', 'Tooling',
   'Insert geometries, ANSI/ISO designation codes, holder selection, and matching tools to material and operation.',
   'intermediate', 80, false, true, 101),
  ('workholding-fundamentals', 'Workholding Fundamentals', 'Setup',
   'Vises, chucks, collets, soft jaws, and fixtures. Clamping force, deflection, and locating principles (3-2-1).',
   'beginner', 80, false, true, 102),
  ('coolant-chip-management', 'Coolant & Chip Management', 'Machining',
   'Coolant chemistry, concentration testing, flood vs MQL, chip evacuation strategies, and tramp-oil control.',
   'beginner', 75, false, true, 103),
  ('print-reading-drawing', 'Print Reading & Drawing Interpretation', 'Quality',
   'Title blocks, view layouts, dimensions, tolerances, surface finish callouts, and revision control on engineering drawings.',
   'beginner', 80, false, true, 104),
  ('fod-5s-workplace', 'FOD Prevention & 5S Workplace', 'Safety',
   'Foreign-object debris control on aerospace floors and the five S pillars: Sort, Set in order, Shine, Standardize, Sustain.',
   'beginner', 80, false, true, 105),
  ('loto-energy-control', 'Lockout-Tagout (LOTO) & Energy Control', 'Safety',
   'OSHA 1910.147 hazardous-energy control: isolation steps, devices, group LOTO, and verification.',
   'intermediate', 85, false, true, 106),
  ('mazak-mazatrol-basics', 'Mazak Mazatrol Controller Basics', 'Controls',
   'Mazatrol conversational programming: unit selection, common cycles, MDI mode, and Smooth-line keypad navigation.',
   'intermediate', 80, false, true, 107),
  ('okuma-osp-basics', 'Okuma OSP Controller Basics', 'Controls',
   'Okuma OSP-P300/P500 G-code dialect, tool offsets, work coordinate systems, and Thermo-Friendly behavior.',
   'intermediate', 80, false, true, 108),
  ('siemens-840d-basics', 'Siemens 840D Controller Basics', 'Controls',
   'Siemens SINUMERIK 840D ShopMill / ShopTurn cycles, parameter R-variables, and JOG / MDA / AUTO modes.',
   'intermediate', 80, false, true, 109)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, topic = EXCLUDED.topic, description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty, is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order, updated_at = now();

-- GCA Questions for the 10 new banks
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, q.qt, q.prompt, q.choices::jsonb, q.answers::jsonb, q.expl, 1, q.so
FROM public.gca_question_banks b
JOIN (VALUES
  ('tool-testing-calibration','multiple_choice', 'Before each shift, what is the FIRST check performed on a 0–6" digital caliper?',
    '["Battery voltage","Zero the caliper with jaws closed","Recalibrate against gauge block","Sand the jaws"]',
    '[1]','Closing the jaws and zeroing eliminates baseline drift before measuring.',0),
  ('tool-testing-calibration','multiple_choice','A 1.000" gauge block reads 1.0007" on a micrometer. Most likely cause?',
    '["Anvil contamination or wear","Operator parallax","Block is wrong","Spindle is loose"]',
    '[0]','Even tiny chips/oil between anvil and block cause a positive offset.',1),
  ('tool-testing-calibration','true_false','Calibration certificates are only required when an instrument is purchased.',
    '["True","False"]','[1]','Recurring traceable cal per defined interval is required (AS9100/ISO 17025).',2),
  ('tool-testing-calibration','multiple_choice','A dial indicator that "sticks" between revolutions should be:',
    '["Tapped to free it","Oiled with WD-40","Tagged out and sent for service","Used carefully"]',
    '[2]','Sticking indicates internal damage; tag out per the cal program.',3),
  ('tool-testing-calibration','multiple_choice','Pin gauges are typically certified to which class for shop use?',
    '["Class W","Class X","Class Z","Class ZZ"]','[3]','Class ZZ (-0.0002") is the common shop standard.',4),
  ('tool-testing-calibration','multiple_choice','Best practice for storing gauge blocks long-term:',
    '["Wrapped in shop towel","Open on the bench","Wiped, oiled, in fitted case","In coolant tank"]',
    '[2]','Oxidation pits wringing surfaces; wipe, light oil, fitted case.',5),
  ('tool-testing-calibration','multiple_choice','A bore gauge must be set against a:',
    '["Pin gauge","Ring gauge or master setting fixture","Caliper inside jaws","V-block"]',
    '[1]','A certified ring gauge or setting master matches bore-gauge geometry.',6),
  ('tool-testing-calibration','true_false','Dropping a micrometer is fine if it still zeros.',
    '["True","False"]','[1]','A drop event triggers an out-of-cal flag — must be re-certified.',7),

  ('cutting-tool-knowledge','multiple_choice','In ANSI insert code "CNMG432", the "C" denotes:',
    '["Insert shape (80° rhombic)","Clearance angle","Coating","Chipbreaker"]','[0]','First letter is shape — C is 80° diamond.',0),
  ('cutting-tool-knowledge','multiple_choice','Best insert grade for finishing hardened steel (50+ HRC)?',
    '["Uncoated carbide","CBN","HSS","Cobalt"]','[1]','CBN handles hardened materials at finish speeds.',1),
  ('cutting-tool-knowledge','multiple_choice','Positive-rake inserts are preferred for:',
    '["Heavy roughing","Soft, gummy materials and low-power machines","Interrupted cuts","Hard turning"]',
    '[1]','Lower cutting forces — good for aluminum, copper, small lathes.',2),
  ('cutting-tool-knowledge','true_false','A worn carbide insert can be reground on a bench grinder.',
    '["True","False"]','[1]','Carbide inserts are indexed/replaced — never resharpened on the floor.',3),
  ('cutting-tool-knowledge','multiple_choice','Built-up edge (BUE) on aluminum is reduced by:',
    '["Decreasing speed","Increasing speed and using polished, sharp inserts","More flood","Switch to HSS"]',
    '[1]','Higher SFM + sharp edges + alcohol coolant prevents welding.',4),
  ('cutting-tool-knowledge','multiple_choice','In a CAT40 holder, the V-flange tag indicates:',
    '["Pull-stud type","Tool length","Coolant pressure","Balance class and rating"]','[3]','Tagged with balance class (G2.5/G6.3) and max RPM.',5),
  ('cutting-tool-knowledge','multiple_choice','ER collet runout typical spec for new collet:',
    '["≤0.0001\"","≤0.0005\"","≤0.002\"","≤0.005\""]','[1]','Quality ER collets hold ≤0.0005" TIR at the nose.',6),
  ('cutting-tool-knowledge','multiple_choice','A "T" suffix on an end mill commonly denotes:',
    '["Tin coating","TiAlN coating","Tapered shank","Through-coolant"]','[3]','Vendor-dependent; T frequently flags through-coolant.',7),

  ('workholding-fundamentals','multiple_choice','3-2-1 locating uses how many contact points total?',
    '["3","5","6","9"]','[2]','3 primary + 2 secondary + 1 tertiary = 6.',0),
  ('workholding-fundamentals','multiple_choice','Soft jaws are bored to:',
    '["The exact OD of the part","Slightly oversize for chip clearance","Square stock dim","Random"]','[0]','Matched to the part for max grip with min distortion.',1),
  ('workholding-fundamentals','true_false','Higher chuck pressure always yields better accuracy.',
    '["True","False"]','[1]','Excess pressure distorts thin-wall parts; tune to wall thickness.',2),
  ('workholding-fundamentals','multiple_choice','5C collet is best suited for:',
    '["Round bar in lathes/indexers up to ~1\"","Heavy aerospace billets","Sheet stock","Square plate"]','[0]','5C is a small precision collet system.',3),
  ('workholding-fundamentals','multiple_choice','Magnetic chucks lose holding force when:',
    '["Workpiece is ferrous","Surface is rough/rusty/painted","Voltage steady","Coolant off"]','[1]','Air gap from rust/paint reduces flux.',4),
  ('workholding-fundamentals','multiple_choice','Mill chatter should first prompt checking:',
    '["Spindle bearings","Workholding rigidity and tool stickout","Coolant level","Door alignment"]','[1]','Most chatter is workholding/stickout before machine condition.',5),
  ('workholding-fundamentals','multiple_choice','Vise parallels should be tapped down with a:',
    '["Steel hammer","Dead-blow or brass mallet","Wood block","Pry bar"]','[1]','Dead-blow won''t mar parallels.',6),
  ('workholding-fundamentals','multiple_choice','Max allowable jaw protrusion on a 3-jaw chuck is:',
    '["1× jaw width","2× jaw width","Manufacturer''s spec — varies","Unlimited"]','[2]','Always defer to chuck manufacturer.',7),

  ('coolant-chip-management','multiple_choice','Soluble-oil concentration is checked with a:',
    '["pH meter","Refractometer","Hydrometer","Conductivity meter"]','[1]','Brix × oil-specific factor = % concentration.',0),
  ('coolant-chip-management','multiple_choice','Coolant smells rancid Monday morning. Likely cause:',
    '["High concentration","Anaerobic bacteria from low-flow weekend","Cold sump","Tramp oil"]','[1]','Stagnant coolant promotes anaerobic bacteria.',1),
  ('coolant-chip-management','true_false','Tramp oil should be left in the sump because it lubricates ways.',
    '["True","False"]','[1]','Tramp oil traps bacteria — skim or coalesce.',2),
  ('coolant-chip-management','multiple_choice','Stringy chips on a lathe indicate:',
    '["Need a chipbreaker insert or feed change","Spindle bearing failure","Wrong coolant","Operator only"]','[0]','Adjust feed/insert for safe chip evacuation.',3),
  ('coolant-chip-management','multiple_choice','MQL stands for:',
    '["Machine Quality Limit","Minimum Quantity Lubrication","Maximum Quench Loss","Multi-axis Quill Lock"]','[1]','MQL delivers atomized oil — near-dry machining.',4),
  ('coolant-chip-management','multiple_choice','Chip auger jam is most safely cleared by:',
    '["Hand while running","Reverse with E-stop ready and LOTO if accessing internals","Air blow","Coolant flush"]','[1]','LOTO before any internal access.',5),
  ('coolant-chip-management','multiple_choice','Through-spindle coolant for deep-hole drilling typically runs at:',
    '["10–50 psi","100–300 psi","800–1500 psi","Vacuum"]','[2]','High pressure flushes chips from deep flutes.',6),
  ('coolant-chip-management','true_false','Coolant pH below 8.0 indicates the bath needs treatment.',
    '["True","False"]','[0]','Healthy emulsion sits ~8.8–9.4; below 8.5 indicates bacteria.',7),

  ('print-reading-drawing','multiple_choice','A dim of 1.250 ±.005 has a tolerance band of:',
    '[".005 total",".010 total",".0025 total",".01 unilateral"]','[1]','+/- .005 = .010 total.',0),
  ('print-reading-drawing','multiple_choice','Surface finish callout 32 (no modifier) reads as:',
    '["32 µm Ra","32 µin Ra","32 thou","32 Rz"]','[1]','Inch drawings default to micro-inch Ra.',1),
  ('print-reading-drawing','multiple_choice','Datum reference frame ABC means:',
    '["Pick any 3 datums","Primary A, Secondary B, Tertiary C","All equal","Aerospace only"]','[1]','Order matters for DoF constraint.',2),
  ('print-reading-drawing','multiple_choice','Title block REV is superseded by:',
    '["Original","ECN/ECO releasing the next letter","Operator note","Quality stamp"]','[1]','ECO releases the next revision.',3),
  ('print-reading-drawing','true_false','Hidden lines (dashed) represent visible features in current view.',
    '["True","False"]','[1]','Dashed = features behind/inside the visible plane.',4),
  ('print-reading-drawing','multiple_choice','The Ø symbol indicates:',
    '["Radius","Diameter","Spherical","Section"]','[1]','Ø is the ASME diameter symbol.',5),
  ('print-reading-drawing','multiple_choice','"4X Ø.250 THRU" calls out:',
    '["One hole","Four holes through","Thread","Counter-bore depth"]','[1]','4X = 4 instances; THRU = full depth.',6),
  ('print-reading-drawing','multiple_choice','MMC stands for:',
    '["Maximum Material Condition","Mean Mating Clearance","Manufactured Material Code","Multi-Mating Constraint"]','[0]','MMC = condition with most material.',7),

  ('fod-5s-workplace','multiple_choice','FOD stands for:',
    '["Foreign Object Debris","Final Operation Document","Floor Order Drawing","Failure Observation Data"]','[0]','FOD = Foreign Object Debris/Damage.',0),
  ('fod-5s-workplace','multiple_choice','5S "Sort" step refers to:',
    '["Sweeping","Removing items not needed","Standardizing labels","Tagging equipment"]','[1]','Sort = identify and remove unneeded items (red-tag).',1),
  ('fod-5s-workplace','true_false','A coffee cup at the machine is acceptable in a FOD-controlled cell.',
    '["True","False"]','[1]','Food/drink prohibited in controlled areas.',2),
  ('fod-5s-workplace','multiple_choice','Visible shadow boards support which 5S step?',
    '["Sort","Set in order","Shine","Sustain"]','[1]','Set in order places tools in defined locations.',3),
  ('fod-5s-workplace','multiple_choice','A loose nut found near a finished assembly should be:',
    '["Pocketed","Logged in FOD log and traced to source","Thrown in scrap","Ignored"]','[1]','All FOD finds get logged + root-caused.',4),
  ('fod-5s-workplace','multiple_choice','5S "Sustain" means:',
    '["One-time event","Daily audits + management commitment","Adding signs","Hiring janitors"]','[1]','Sustain = ongoing discipline.',5),
  ('fod-5s-workplace','multiple_choice','Pencils & erasers are restricted in FOD areas because:',
    '["They smudge","Eraser/lead debris contaminates parts","Cost","Color"]','[1]','Eraser shavings + graphite are common FOD.',6),
  ('fod-5s-workplace','true_false','Tool-tethering is required when working at height in many FOD programs.',
    '["True","False"]','[0]','Dropped tools are FOD; tethers prevent contamination + injury.',7),

  ('loto-energy-control','multiple_choice','LOTO is governed under which OSHA standard?',
    '["29 CFR 1910.147","29 CFR 1910.119","29 CFR 1926.500","29 CFR 1904"]','[0]','1910.147 = Control of Hazardous Energy.',0),
  ('loto-energy-control','multiple_choice','LAST step of every LOTO procedure is:',
    '["Apply lock","Verify zero energy","Notify affected employees of restored status","Tag the device"]','[2]','Restore power → notify employees → return to service.',1),
  ('loto-energy-control','true_false','Group LOTO with a single padlock is acceptable for crews.',
    '["True","False"]','[1]','Each worker applies their OWN lock to the lockbox.',2),
  ('loto-energy-control','multiple_choice','Stored hydraulic energy in a press is dissipated by:',
    '["Hitting E-stop","Bleeding accumulators per OEM","Disconnecting electric only","Closing the door"]','[1]','Stored energy must be released — accumulators, springs, capacitors.',3),
  ('loto-energy-control','multiple_choice','A red lockout tag without a lock is:',
    '["Equivalent to a lock","A warning only — does NOT meet LOTO","Acceptable on small valves","Aerospace-only"]','[1]','Tags alone are not energy-isolating.',4),
  ('loto-energy-control','multiple_choice','When can another worker remove your personal lock?',
    '["Anytime","With supervisor approval and verified absence per documented procedure","Never","After 24 hours"]','[1]','Documented removal procedure + supervisor verification.',5),
  ('loto-energy-control','multiple_choice','Verification (try-out) means:',
    '["Look at indicator lights","Attempt to operate the machine to confirm zero energy","Read the schematic","Ask a coworker"]','[1]','Push start, cycle controls — confirm machine cannot energize.',6),
  ('loto-energy-control','true_false','Cord-and-plug under exclusive worker control may be exempt from LOTO.',
    '["True","False"]','[0]','Plug under direct control = exempt under 1910.147(a)(2)(iii).',7),

  ('mazak-mazatrol-basics','multiple_choice','Mazatrol uses what kind of programming primarily?',
    '["G-code only","Conversational unit-based","Macro B","Heidenhain klartext"]','[1]','Mazatrol = conversational unit programming.',0),
  ('mazak-mazatrol-basics','multiple_choice','A "FACE MILL" unit asks for:',
    '["Tool number, depth, finish allowance, RPM/feed","Only tool number","M-code list","Macro variable"]','[0]','Each unit prompts geometry + cutting params.',1),
  ('mazak-mazatrol-basics','multiple_choice','TPS stands for:',
    '["Tool Path Simulation","Tool Position Set","Tool Pitch Speed","Tool Pull Stud"]','[0]','TPS = on-control verification simulator.',2),
  ('mazak-mazatrol-basics','true_false','Mazatrol Smooth controls support both Mazatrol AND ISO/EIA G-code.',
    '["True","False"]','[0]','Modern Mazaks accept both.',3),
  ('mazak-mazatrol-basics','multiple_choice','Tool offsets are entered in which screen?',
    '["TOOL DATA","WORK SHIFT","PROGRAM","MAINTENANCE"]','[0]','TOOL DATA holds length, diameter, wear.',4),
  ('mazak-mazatrol-basics','multiple_choice','Common cause of "TOOL NUMBER NOT FOUND" alarm:',
    '["Spindle warm-up needed","Tool not registered in TOOL DATA","Coolant low","Power saver mode"]','[1]','Each tool must exist in TOOL DATA.',5),
  ('mazak-mazatrol-basics','multiple_choice','WORK SHIFT (WPC) corresponds to which G-code concept?',
    '["G54-G59 work offset","G92 program zero","Tool length","Spindle orient"]','[0]','Mazatrol WPC = G54..G59.',6),
  ('mazak-mazatrol-basics','multiple_choice','To cancel an in-progress unit during edit:',
    '["Press RESET","Press ERASE then confirm","Power cycle","Open door"]','[1]','ERASE removes the unit; RESET only clears alarms.',7),

  ('okuma-osp-basics','multiple_choice','Okuma "Thermo-Friendly" tech compensates for:',
    '["Spindle vibration","Thermal growth in machine structure","Tool wear","Coolant pH"]','[1]','Real-time ambient + spindle thermal compensation.',0),
  ('okuma-osp-basics','multiple_choice','OSP-P300 work offsets are stored in:',
    '["G15 H1..","Tool data","H-codes","Macro vars"]','[2]','Okuma uses H-codes (vs Fanuc G54).',1),
  ('okuma-osp-basics','true_false','Okuma G-code dialect is identical to Fanuc.',
    '["True","False"]','[1]','OSP has unique addresses (H, VC variables, MOP-TOOL macros).',2),
  ('okuma-osp-basics','multiple_choice','Common Okuma turning tool-length call:',
    '["G43 H1","T0101","T1 M6","T0100 M6 + offset table"]','[3]','Okuma turning combines tool # with offset (T0101).',3),
  ('okuma-osp-basics','multiple_choice','OSP "VC" variables are:',
    '["Volatile cache","Common variables retained across power cycles","Spindle counters","Coolant readings"]','[1]','VC = persistent; VL = local.',4),
  ('okuma-osp-basics','multiple_choice','Okuma collision-avoidance system is named:',
    '["Smart Cell","Collision Avoidance System (CAS)","ANA-CHECK","Robo-Guard"]','[1]','CAS uses live tool/fixture models.',5),
  ('okuma-osp-basics','multiple_choice','M30 in Okuma turning typically:',
    '["Spindle orient","Program end + rewind","Coolant on","Tool change"]','[1]','M30 ends + rewinds program.',6),
  ('okuma-osp-basics','true_false','OSP Suite supports IPC apps alongside the CNC.',
    '["True","False"]','[0]','OSP Suite is a Windows IPC overlay.',7),

  ('siemens-840d-basics','multiple_choice','ShopMill on a 840D is best described as:',
    '["G-code only","Conversational milling environment with cycles","DNC software","Tool presetter"]','[1]','ShopMill is graphical step-based milling.',0),
  ('siemens-840d-basics','multiple_choice','Siemens R-parameters (R1..R299) are:',
    '["System constants","User arithmetic variables","Tool offsets","Spindle ratios"]','[1]','R-params are arithmetic vars for parametric programs.',1),
  ('siemens-840d-basics','multiple_choice','JOG mode is used to:',
    '["Run AUTO programs","Manually move axes for setup","Edit programs","View graphics"]','[1]','JOG = manual axis motion.',2),
  ('siemens-840d-basics','multiple_choice','CYCLE82 is a Siemens canned cycle for:',
    '["Drilling with dwell","Tapping","Boring","Pocketing"]','[0]','CYCLE82 = drilling with optional dwell.',3),
  ('siemens-840d-basics','true_false','Siemens 840D can run G-code (DIN/ISO) programs directly.',
    '["True","False"]','[0]','Yes — alongside Siemens parametric language.',4),
  ('siemens-840d-basics','multiple_choice','TRANS in Siemens applies a:',
    '["Translational coordinate shift","Rotation","Scale","Mirror"]','[0]','TRANS shifts WCS.',5),
  ('siemens-840d-basics','multiple_choice','Siemens alarm 14080 indicates:',
    '["Servo overload","Block search target not found","Coolant low","Door open"]','[1]','14080 = block search target NC block not located.',6),
  ('siemens-840d-basics','multiple_choice','WCS frames are managed under:',
    '["TOOL > LIST","PARAMETER > WORK OFFSET","PROGRAM > TEACH","DIAG"]','[1]','PARAMETER > WORK OFFSET holds G54..G599.',7)
) AS q(bslug, qt, prompt, choices, answers, expl, so) ON q.bslug = b.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.gca_questions gq WHERE gq.bank_id = b.id AND gq.prompt = q.prompt
);

-- ============================================================
-- OAP Course Templates
-- ============================================================
INSERT INTO public.oap_courses (slug, section_number, title, summary, description, estimated_minutes, is_published, sort_order)
VALUES
  ('hand-power-tools', 8, 'Hand & Power Tool Knowledge',
    'Identification, safe use, and inspection of common hand & power tools on the floor.',
    E'Operators learn the difference between common hand tools (wrenches, allen keys, deburring blades), pneumatic tools (impact, die grinders, blow guns ≤30 psi), and powered tools. Includes pre-use inspection, PPE requirements, and "right tool for the job" judgment.',
    45, true, 8),
  ('cutting-tools-inserts', 9, 'Cutting Tool & Insert Identification',
    'Read insert codes, holder designations, and stage cutting tools for setups.',
    E'Walks through the ANSI/ISO insert designation system (CNMG, TNMG, DCMT…), holder codes, and how to stage a tool list against a setup sheet. Operators practice identifying carbide, ceramic, CBN, and PCD insert types.',
    60, true, 9),
  ('workholding-fixturing', 10, 'Workholding & Fixturing',
    'Set up vises, chucks, soft jaws, and dedicated fixtures with the 3-2-1 principle.',
    E'Hands-on training in dialing in a vise (≤.0005"/12"), boring soft jaws, mounting a 3-jaw vs 4-jaw chuck, using collets, and validating fixture repeatability before a production run.',
    75, true, 10),
  ('loto-energy-control', 11, 'Lockout-Tagout & Energy Control',
    'OSHA 1910.147 LOTO procedure execution for CNC machines and ancillary equipment.',
    E'Operators learn the seven-step LOTO procedure, group LOTO with a lockbox, isolating multiple energy sources (electrical, hydraulic, pneumatic, stored), and the verified zero-energy try-out.',
    60, true, 11),
  ('print-reading-gdt', 12, 'Print Reading & GD&T Interpretation',
    'Read engineering drawings, decode GD&T callouts, and translate features into operations.',
    E'Covers title blocks, view layouts, dimensioning, tolerance stacks, surface finish, and the 14 GD&T characteristic symbols. Operators practice extracting a feature list from a print and matching it to a routing.',
    90, true, 12)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, summary = EXCLUDED.summary, description = EXCLUDED.description,
  section_number = EXCLUDED.section_number, is_published = EXCLUDED.is_published,
  sort_order = EXCLUDED.sort_order, updated_at = now();

-- OAP Lessons (3 per new course)
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT c.id, l.lslug, l.ltitle, l.lbody, l.lmin, l.lso, true
FROM public.oap_courses c
JOIN (VALUES
  ('hand-power-tools', 'tool-id-and-anatomy', 'Identifying Common Hand & Power Tools',
    E'## Identifying Common Hand & Power Tools\n\n- Wrenches (combination, ratcheting, torque)\n- Allen / hex keys (SAE & metric)\n- Deburring tools (Noga, scrapers, files)\n- Pneumatic die grinders, impact wrenches, blow guns (≤30 psi tip pressure)\n- Battery-powered drills/drivers\n\nFor each tool, identify the **correct application** and **typical wear/damage** that takes the tool out of service.', 15, 0),
  ('hand-power-tools', 'pre-use-inspection', 'Pre-Use Inspection & Lockout',
    E'## Pre-Use Inspection & Lockout\n\nBefore picking up any powered tool:\n\n1. Visually inspect the cord, hose, or battery — look for cracks, exposed wire, oil leaks.\n2. Confirm guards are in place.\n3. Test trigger and dead-man switch.\n4. Confirm tool is rated for planned RPM and material.\n5. If anything is wrong → tag it out, log it, notify the supervisor.\n\n**Never bypass a guard or interlock.**', 15, 1),
  ('hand-power-tools', 'ppe-and-judgment', 'PPE & Right Tool for the Job',
    E'## PPE & Right Tool for the Job\n\n- Safety glasses **always** when using powered tools.\n- Hearing protection at >85 dBA.\n- Cut-resistant gloves for deburring; **no gloves** in rotating spindles.\n- Steel-toed boots on the floor.\n\n**Right tool for the job:** never use a wrench as a hammer, never a die grinder where a hand file works, never compressed air to clean clothing.', 15, 2),
  ('cutting-tools-inserts', 'insert-codes', 'Reading ANSI Insert Codes',
    E'## Reading ANSI Insert Codes\n\nExample: **CNMG 432 MP**\n\n| Position | Meaning | Example |\n|---|---|---|\n| 1st letter | Shape | C = 80° rhombic |\n| 2nd letter | Clearance | N = 0° |\n| 3rd letter | Tolerance class | M |\n| 4th letter | Type / hole / chipbreaker | G |\n| Digits | Size, thickness, nose radius | 4-3-2 |\n| Suffix | Chipbreaker / application | MP |\n\nLearn the first 4 characters cold — they drive **all** insert selection decisions.', 20, 0),
  ('cutting-tools-inserts', 'holder-and-staging', 'Holders, Pull-Studs & Tool Staging',
    E'## Holders, Pull-Studs & Tool Staging\n\n- Match holder taper to spindle (CAT40, BT30, HSK63A).\n- Verify pull-stud is correct angle and torque.\n- Pre-set tool length offline whenever possible.\n- Stage tools per the setup sheet — confirm tool number, length, diameter before loading the carousel.\n\n**Common error:** loading the holder into the wrong pocket → crash.', 20, 1),
  ('cutting-tools-inserts', 'grade-selection', 'Grade Selection: Carbide, Ceramic, CBN, PCD',
    E'## Grade Selection\n\n- **Coated carbide** — workhorse for steel, stainless, cast iron.\n- **Ceramic** — high-speed cast iron, super-alloys (Inconel) at finish.\n- **CBN** — hardened steel ≥45 HRC.\n- **PCD** — aluminum, copper, composites (NOT for steel).\n\nRule: ask **material + operation** before reaching for the catalog.', 20, 2),
  ('workholding-fixturing', 'vise-setup', 'Vise Setup & Indication',
    E'## Vise Setup & Indication\n\n1. Clean vise base and table — no chips!\n2. Set vise on parallels or directly to table.\n3. Sweep solid jaw with indicator → ≤.0005"/12".\n4. Snug bolts in cross pattern, re-sweep.\n5. Final torque per spec.\n\n**Never** trust yesterday''s indication — re-check after any bump.', 25, 0),
  ('workholding-fixturing', 'soft-jaws', 'Boring & Using Soft Jaws',
    E'## Boring & Using Soft Jaws\n\nSoft jaws are bored to match the part OD/ID for max contact, min distortion.\n\n1. Mount aluminum/steel jaw blanks.\n2. Pressurize chuck with the same pressure used in production.\n3. Bore to nominal -0.0005".\n4. Witness-mark jaw position.\n\nThin-wall: tune chuck pressure to keep roundness <.001".', 25, 1),
  ('workholding-fixturing', 'fixture-validation', 'Fixture Validation Before Production',
    E'## Fixture Validation Before Production\n\nBefore green-lighting:\n\n- Cycle 3-5 parts and full-inspect each.\n- Confirm repeatability — Cpk ≥1.33 if SPC required.\n- Check fixture for deflection under cut.\n- Document fixture revision and tooling list in the routing.\n\nA validated fixture saves hours of scrap.', 25, 2),
  ('loto-energy-control', 'seven-steps', 'The Seven Steps of LOTO',
    E'## The Seven Steps of LOTO\n\n1. **Notify** affected employees.\n2. **Identify** all energy sources.\n3. **Shut down** equipment.\n4. **Isolate** at the disconnect/valve.\n5. **Apply** personal lock and tag.\n6. **Release** stored energy.\n7. **Verify** zero energy by attempting to operate.', 20, 0),
  ('loto-energy-control', 'multiple-energy', 'Multiple Energy Sources & Group LOTO',
    E'## Multiple Energy Sources & Group LOTO\n\nMost CNCs have ≥3 energy sources:\n\n- Electrical (main disconnect)\n- Hydraulic (pump + accumulator)\n- Pneumatic (air supply)\n- Stored (capacitors, springs, suspended axes)\n\n**Group LOTO** uses a lockbox: each worker applies their own personal lock; isolation keys go inside.', 20, 1),
  ('loto-energy-control', 'try-out-and-restore', 'Verification (Try-Out) & Restoration',
    E'## Verification (Try-Out) & Restoration\n\n- Press start, cycle controls, attempt to jog axes.\n- Use a meter on electrical sources where appropriate.\n- After service: reverse steps. Remove tools, restore guards, notify employees, then each worker removes only their OWN lock.', 20, 2),
  ('print-reading-gdt', 'drawing-anatomy', 'Anatomy of an Engineering Drawing',
    E'## Anatomy of an Engineering Drawing\n\n- Title block (part #, rev, scale, units, default tolerance)\n- View layout (front, top, side, isometric, section)\n- Dimensions & tolerances\n- Surface finish callouts\n- General notes\n- Bill of materials (assemblies)\n\nAlways check **revision letter** matches the routing.', 30, 0),
  ('print-reading-gdt', 'gdt-symbols', 'The 14 GD&T Symbols',
    E'## The 14 GD&T Symbols\n\n**Form:** Flatness, Straightness, Circularity, Cylindricity\n**Profile:** Profile of a Line, Profile of a Surface\n**Orientation:** Perpendicularity, Parallelism, Angularity\n**Location:** Position, Concentricity, Symmetry\n**Runout:** Circular Runout, Total Runout\n\n**Position** is the most common — pay attention to MMC/LMC modifiers and datum reference frames.', 30, 1),
  ('print-reading-gdt', 'feature-extraction', 'Extracting Features → Routing',
    E'## Extracting Features → Routing\n\n1. List every feature (faces, holes, threads, pockets).\n2. Group features by setup (Op 10, Op 20, …).\n3. Identify critical-to-quality (CTQ) features needing inspection.\n4. Match each feature to a tool & operation.\n\nThis is how a print becomes a routing.', 30, 2)
) AS l(cslug, lslug, ltitle, lbody, lmin, lso) ON l.cslug = c.slug
ON CONFLICT (course_id, slug) DO UPDATE SET
  title = EXCLUDED.title, body_markdown = EXCLUDED.body_markdown,
  estimated_minutes = EXCLUDED.estimated_minutes, sort_order = EXCLUDED.sort_order,
  is_published = EXCLUDED.is_published, updated_at = now();

-- OAP Quizzes (1 per new course)
INSERT INTO public.oap_quizzes (course_id, title, description, passing_score_pct, max_attempts, time_limit_minutes, is_published)
SELECT c.id, q.qtitle, q.qdesc, 80, 3, 15, true
FROM public.oap_courses c
JOIN (VALUES
  ('hand-power-tools', 'Hand & Power Tools Quiz', 'Identification, inspection, and PPE for shop tools.'),
  ('cutting-tools-inserts', 'Cutting Tools & Inserts Quiz', 'Insert codes, holders, grade selection.'),
  ('workholding-fixturing', 'Workholding & Fixturing Quiz', 'Vise setup, soft jaws, validation.'),
  ('loto-energy-control', 'LOTO & Energy Control Quiz', 'Seven-step procedure, multi-energy isolation.'),
  ('print-reading-gdt', 'Print Reading & GD&T Quiz', 'Drawing anatomy and the 14 GD&T characteristics.')
) AS q(cslug, qtitle, qdesc) ON q.cslug = c.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.oap_quizzes q2 WHERE q2.course_id = c.id AND q2.title = q.qtitle
);

-- OAP Quiz Questions (4 per new quiz)
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT qz.id, q.qt, q.prompt, q.choices::jsonb, q.answers::jsonb, q.expl, 1, q.so
FROM public.oap_quizzes qz
JOIN public.oap_courses c ON c.id = qz.course_id
JOIN (VALUES
  ('hand-power-tools','multiple_choice','Maximum compressed-air tip pressure for cleaning per OSHA is:',
    '["10 psi","30 psi","60 psi","No limit"]','[1]','OSHA 1910.242(b) — 30 psi max at the dead-end.',0),
  ('hand-power-tools','true_false','Gloves are required when operating a rotating spindle.',
    '["True","False"]','[1]','Gloves can entangle in rotating equipment — prohibited.',1),
  ('hand-power-tools','multiple_choice','A pneumatic die grinder with a cracked hose should be:',
    '["Wrapped with tape","Used at reduced pressure","Tagged out and removed from service","Used briefly"]','[2]','Damaged pneumatic equipment is tagged out.',2),
  ('hand-power-tools','multiple_choice','Hearing protection is required at:',
    '["50 dBA",">85 dBA TWA","100 dBA only","Never"]','[1]','OSHA action level = 85 dBA 8-hr TWA.',3),
  ('cutting-tools-inserts','multiple_choice','In code "CNMG432", the digit "4" represents:',
    '["Insert size","Thickness","Nose radius","Coating"]','[0]','size=4, thickness=3, nose radius=2 (1/64").',0),
  ('cutting-tools-inserts','multiple_choice','PCD inserts are NOT used for:',
    '["Aluminum","Copper","Steel","Composites"]','[2]','PCD reacts with iron at temp — never on steel.',1),
  ('cutting-tools-inserts','true_false','Tool length should be re-measured every time a tool is loaded into the carousel.',
    '["True","False"]','[0]','Pre-setting and verifying length prevents crashes.',2),
  ('cutting-tools-inserts','multiple_choice','Best grade for hardened steel finish turning at 50 HRC:',
    '["Coated carbide","CBN","Ceramic","HSS"]','[1]','CBN is standard for hardened-steel finish.',3),
  ('workholding-fixturing','multiple_choice','Acceptable vise indication tolerance for general work:',
    '["≤.005\"/12\"","≤.0005\"/12\"","≤.05\"/12\"","Anything"]','[1]','.0005"/12" is common shop standard.',0),
  ('workholding-fixturing','multiple_choice','Soft jaws are bored at:',
    '["Atmospheric pressure","Half production pressure","The same pressure used in production","Maximum pressure"]','[2]','Bore at production pressure to match in-cut deformation.',1),
  ('workholding-fixturing','true_false','A 4-jaw chuck is preferred when concentricity must be dialed in.',
    '["True","False"]','[0]','Independent jaws allow precise centering.',2),
  ('workholding-fixturing','multiple_choice','Cpk target for a validated fixture under SPC:',
    '["≥0.5","≥1.0","≥1.33","≥3.0"]','[2]','1.33 is the common automotive/aerospace minimum.',3),
  ('loto-energy-control','multiple_choice','The seven-step LOTO procedure ENDS with:',
    '["Apply lock","Verify zero energy","Notify affected employees of restored status","Tag the device"]','[2]','After restoration, notify employees.',0),
  ('loto-energy-control','multiple_choice','Group LOTO is best done with a:',
    '["Single padlock","Lockbox where each worker applies their own personal lock","Verbal agreement","Tag only"]','[1]','Each worker controls their own lock on the lockbox.',1),
  ('loto-energy-control','true_false','A tag alone (no lock) satisfies LOTO when locks are unavailable.',
    '["True","False"]','[1]','Locks are required when feasible.',2),
  ('loto-energy-control','multiple_choice','Stored hydraulic energy in a press is released by:',
    '["E-stop only","Bleeding accumulators per OEM procedure","Removing power","Closing guards"]','[1]','Accumulators must be bled per OEM.',3),
  ('print-reading-gdt','multiple_choice','How many GD&T characteristic symbols are there?',
    '["7","10","14","20"]','[2]','14 GD&T characteristics in ASME Y14.5-2018.',0),
  ('print-reading-gdt','multiple_choice','Position with MMC modifier benefits from:',
    '["Tighter tolerance","Bonus tolerance as feature departs from MMC","No effect","Smaller datum"]','[1]','Bonus tolerance increases as feature moves from MMC.',1),
  ('print-reading-gdt','true_false','Datum reference frame letters (A,B,C) are interchangeable.',
    '["True","False"]','[1]','Order is critical: primary, secondary, tertiary.',2),
  ('print-reading-gdt','multiple_choice','A "Ø.250 ±.005" callout has a tolerance band of:',
    '[".005",".010",".0025",".0001"]','[1]','+/- .005 = .010 total.',3)
) AS q(cslug, qt, prompt, choices, answers, expl, so) ON q.cslug = c.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq WHERE qq.quiz_id = qz.id AND qq.prompt = q.prompt
);
