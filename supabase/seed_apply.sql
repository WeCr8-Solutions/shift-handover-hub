-- =====================================================================
-- OAP + GCA comprehensive content seed (idempotent)
-- =====================================================================
BEGIN;

-- ─── OAP LESSONS ────────────────────────────────────────────────────────
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'welcome-to-the-shop', 'Welcome to the Shop', '# Welcome

Manufacturing shops follow strict standards: AS9100 (aerospace), ISO 9001 (quality), and OSHA (safety).
Your first day covers:

- **Clock-in & PPE check** — safety glasses, steel-toe boots, hearing protection in designated zones.
- **Site map** — emergency exits, eye-wash stations, fire extinguishers, first-aid.
- **Shift cadence** — pre-shift huddle, mid-shift handoff, end-of-shift cleanup.
- **Communication** — handoff system, supervisor escalation, anonymous safety reporting.

Manufacturing is a team sport. Your awareness keeps everyone home safe.', 12, 1, true
FROM public.oap_courses WHERE slug = 'orientation'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'quality-systems-overview', 'Quality Systems Overview', '# Quality Systems

Three pillars protect every part you touch:

1. **Traveler / Routing** — the document that follows a job from raw stock to ship.
2. **First Article Inspection (FAI)** — full dimensional verification on the first piece.
3. **Non-Conformance Reports (NCRs)** — written record when something is out of spec.

You will sign off on every operation you complete. Your signature carries weight in an AS9100 audit.', 10, 2, true
FROM public.oap_courses WHERE slug = 'orientation'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'ethics-itar-and-confidentiality', 'Ethics, ITAR & Confidentiality', '# Ethics & ITAR

Many shops handle controlled data under **ITAR** (International Traffic in Arms Regulations).

- **Never** photograph parts, drawings, or fixtures without written approval.
- **Never** discuss customer programs off-site.
- **US Person status** is required for ITAR work — your HR file documents this.
- Drawings stay in the shop. Memory sticks are forbidden in ITAR cells.

Violations are a federal offense.', 10, 3, true
FROM public.oap_courses WHERE slug = 'orientation'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'ppe-and-housekeeping', 'PPE & Housekeeping', '# PPE & 5S

Required PPE:
- Safety glasses (Z87.1) at all times in production zones
- Steel-toe ASTM F2413 footwear
- Hearing protection in marked zones (>85 dBA)
- Cut-resistant gloves for handling raw stock — **never** at a spinning spindle

5S floor: **Sort, Set in order, Shine, Standardize, Sustain.**', 8, 1, true
FROM public.oap_courses WHERE slug = 'safety-ehs'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'lockout-tagout-loto', 'Lockout / Tagout (LOTO)', '# Lockout / Tagout

Before any maintenance, tooling change inside a machine, or chip evacuation:

1. **Notify** affected operators
2. **Shut down** the machine via normal stop
3. **Isolate** energy (electrical, pneumatic, hydraulic)
4. **Lock & Tag** with your personal lock
5. **Verify** zero energy state

Each operator carries one personal lock and one tag. Locks are never shared.', 12, 2, true
FROM public.oap_courses WHERE slug = 'safety-ehs'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'emergency-and-incident-reporting', 'Emergencies & Incident Reporting', '# Emergency Response

- **Fire** — pull the alarm, evacuate via primary route, account at muster point.
- **Injury** — call first responder by extension or radio; do not move severely injured.
- **Chemical spill** — consult SDS sheet, isolate, notify EHS lead.

Every near-miss is reported within 24h. **Reporting is never punished — concealment is.**', 8, 3, true
FROM public.oap_courses WHERE slug = 'safety-ehs'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'raw-stock-id-and-traceability', 'Raw Stock ID & Traceability', '# Material Traceability

Every piece of metal carries a **heat number** and **certificate of conformance (CoC)**.

- Verify heat lot matches the traveler before cutting.
- Stamp or etch the heat lot onto the part if required by the print.
- Keep cut-off pieces with their heat lot for FAI / re-inspection.

Wrong material = automatic NCR + customer notification.', 10, 1, true
FROM public.oap_courses WHERE slug = 'material-handling'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'lifting-rigging-forklift', 'Lifting, Rigging & Forklift Basics', '# Lifting Safely

- Anything > 50 lb requires a hoist, jib, or forklift.
- Inspect slings & chains before each use — replace if frayed or kinked.
- Forklifts: only certified operators, horn at intersections, never lift personnel.
- Keep loads low while traveling. Pedestrians always have right of way.', 10, 2, true
FROM public.oap_courses WHERE slug = 'material-handling'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'wip-and-staging-areas', 'WIP & Staging', '# Work-in-Process Flow

- Every part stays with its **traveler** at all times.
- Yellow stripe = quarantine: do not touch.
- Blue bins = first-piece inspection pending.
- Green tag = released to next operation.

Mis-staged parts are the #1 cause of mixed lots.', 8, 3, true
FROM public.oap_courses WHERE slug = 'material-handling'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'basic-measurement-tape-rule-caliper', 'Basic Measurement — Tape, Rule & Caliper', '# Basic Measurement

The three workhorses of the shop:

| Tool | Resolution | Best for |
|------|-----------|----------|
| Tape measure | 1/16" | rough cuts, layouts |
| Steel rule | 1/64" | scribing, short measures |
| Vernier / dial caliper | 0.001" | OD, ID, depth, step |

**Caliper rules:**
- Zero before every measurement
- Square the jaws — no rocking
- Clean the part and the jaws
- Read at eye level

A dropped caliper is a scrap caliper until calibration confirms otherwise.', 12, 1, true
FROM public.oap_courses WHERE slug = 'measurement-inspection'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'micrometers-and-bore-gauges', 'Micrometers & Bore Gauges', '# Precision Measurement

Micrometers measure to **0.0001"** (tenths). Bore gauges and pin gauges verify ID.

- Use ratchet/friction thimble — **don''t crank**.
- Wring on Jo blocks to verify zero before critical features.
- Bore gauges: zero on a master ring, not a caliper.
- Temperature matters: a part hot off the spindle reads big.

Document every reading on the inspection sheet.', 12, 2, true
FROM public.oap_courses WHERE slug = 'measurement-inspection'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'gdt-fundamentals', 'GD&T Fundamentals', '# GD&T Symbols

ASME Y14.5 defines geometric tolerancing:

- **Position** — true location of a feature
- **Flatness** — surface variation across a plane
- **Perpendicularity** — 90° to a datum
- **Cylindricity** — round + straight at every cross section
- **Profile** — deviation from an ideal contour

Every tolerance ties back to **datums** (A, B, C). Without datums, the callout is meaningless.', 14, 3, true
FROM public.oap_courses WHERE slug = 'measurement-inspection'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'tool-id-and-cribb', 'Tool ID & The Crib', '# The Tool Crib

Each tool has a **T-number** matching the program''s tool table.

- Pull tools by part #/T#, not by sight.
- Inspect insert + holder before assembling.
- Return tools clean — chips ruin presetters.', 8, 1, true
FROM public.oap_courses WHERE slug = 'tooling-preset'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'presetting-tool-length-and-diameter', 'Presetting Tool Length & Diameter', '# Presetting

The presetter records:
- **Length** — Z offset from gauge line to tool tip
- **Diameter** — for milling tools (radius compensation)

Update the offset table **before** the next job loads. Old offsets crash machines.', 10, 2, true
FROM public.oap_courses WHERE slug = 'tooling-preset'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'wear-and-replacement', 'Tool Wear & Replacement', '# Wear

- Inspect inserts every 30 min on hard materials.
- Watch for: built-up edge, flank wear, chipping, cratering.
- Log replaced inserts in the tool life sheet.
- A worn tool wrecks surface finish before it breaks.', 8, 3, true
FROM public.oap_courses WHERE slug = 'tooling-preset'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'controller-walkaround', 'Controller Walkaround', '# Controller Basics

Every CNC has these key zones on the panel:
- **MDI** — manual data input
- **Edit** — program editing
- **Memory / Auto** — production mode
- **Handle / Jog** — manual axis motion
- **Override knobs** — feed, rapid, spindle

Know the **E-stop**, **cycle start**, **feed hold**, and **reset** without looking.', 12, 1, true
FROM public.oap_courses WHERE slug = 'machine-qualification'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'warm-up-and-first-piece', 'Warm-Up & First Piece', '# Warm-Up & First Piece

- Run a 10–15 min warm-up program — spindle + axes through their full range.
- First-piece inspection (FPI) is required after every setup change.
- Do not run production until FPI is signed off.', 10, 2, true
FROM public.oap_courses WHERE slug = 'machine-qualification'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'in-process-monitoring', 'In-Process Monitoring', '# In-Process Checks

- Spot-check critical features every 5–10 parts (or per the routing).
- Watch chip color & sound — red/blue chips = burning = re-check feed/speed.
- Listen for chatter — back off DOC or feed before damage.

Catching drift early prevents scrap runs.', 8, 3, true
FROM public.oap_courses WHERE slug = 'machine-qualification'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'mentor-walkthrough', 'Mentor Walkthrough', '# Mentor Walkthrough

Your assigned mentor signs off on each station-specific competency:

- Setup, qualify, and run a documented job
- Perform an in-process inspection
- Produce a clean handoff record
- React appropriately to a simulated NCR

Walkthrough sections live in **/oap/walkthrough**.', 10, 1, true
FROM public.oap_courses WHERE slug = 'floor-certification'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'handoff-and-documentation', 'Handoff & Documentation', '# Documentation

Every shift end:
- Record parts complete, scrap, rework
- Note tooling status (life remaining, replaced)
- Flag any open issues for the next operator
- Sign the traveler

A clean handoff = zero surprises for the next shift.', 8, 2, true
FROM public.oap_courses WHERE slug = 'floor-certification'
ON CONFLICT DO NOTHING;
INSERT INTO public.oap_lessons (course_id, slug, title, body_markdown, estimated_minutes, sort_order, is_published)
SELECT id, 'certification-and-renewal', 'Certification & Renewal', '# Certification

Once all OAP courses + walkthrough sign-offs are complete:

1. Final assessment (mentor + supervisor)
2. **Certificate issued** — verifiable at /verify/:certId
3. Annual renewal required for ITAR / aerospace cells
4. Recert events logged in your transcript

Your certificate travels with you across shops via the **Talent Network**.', 8, 3, true
FROM public.oap_courses WHERE slug = 'floor-certification'
ON CONFLICT DO NOTHING;

-- ─── OAP QUIZZES ────────────────────────────────────────────────────────
INSERT INTO public.oap_quizzes (course_id, title, passing_score_pct, max_attempts, time_limit_minutes, is_published)
SELECT id, 'Company Orientation — Final Quiz', 80, 5, 30, true
FROM public.oap_courses WHERE slug = 'orientation'
AND NOT EXISTS (SELECT 1 FROM public.oap_quizzes WHERE course_id = (SELECT id FROM public.oap_courses WHERE slug='orientation'));
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Which standard governs aerospace quality systems?', '["ISO 14001", "AS9100", "OSHA 1910", "ASME Y14.5"]'::jsonb, '[1]'::jsonb, 'AS9100 builds on ISO 9001 with aerospace-specific clauses.', 1, 1
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='orientation'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='orientation' AND qq.sort_order=1
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'What document follows a job through every operation?', '["Purchase Order", "Traveler / Routing", "Bill of Lading", "Tool sheet"]'::jsonb, '[1]'::jsonb, 'The traveler is the master record of every operation, sign-off, and inspection.', 1, 2
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='orientation'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='orientation' AND qq.sort_order=2
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Who is allowed to take photos of an ITAR-controlled drawing?', '["Anyone with a phone", "Only the operator running the job", "Only an authorized US Person with written approval", "Quality inspectors only"]'::jsonb, '[2]'::jsonb, 'ITAR data is restricted to authorized US Persons with documented approval.', 1, 3
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='orientation'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='orientation' AND qq.sort_order=3
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'multi_choice', 'Select required PPE for the production floor.', '["Safety glasses", "Open-toe shoes", "Hearing protection in marked zones", "Loose neck jewelry", "Steel-toe footwear"]'::jsonb, '[0, 2, 4]'::jsonb, 'Glasses, hearing protection (when marked), and steel-toe boots are baseline.', 1, 4
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='orientation'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='orientation' AND qq.sort_order=4
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'true_false', 'Near-misses must be reported even when no one is injured.', '["True", "False"]'::jsonb, '[0]'::jsonb, 'Reporting near-misses prevents future incidents and is never punished.', 1, 5
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='orientation'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='orientation' AND qq.sort_order=5
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'First Article Inspection (FAI) verifies which?', '["Average dimensions on the run", "Every dimension on the first piece", "Final ship-out only", "Tool life only"]'::jsonb, '[1]'::jsonb, 'FAI confirms the setup is producing parts within full print tolerance.', 1, 6
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='orientation'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='orientation' AND qq.sort_order=6
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Where do you go during a fire alarm?', '["Stay at machine", "Check email", "Designated muster point", "Break room"]'::jsonb, '[2]'::jsonb, 'All personnel report to the muster point so headcount can verify safety.', 1, 7
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='orientation'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='orientation' AND qq.sort_order=7
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'An NCR is opened when…', '["A part runs faster than estimate", "A part is out of spec", "A tool is replaced", "Shift change occurs"]'::jsonb, '[1]'::jsonb, 'Any departure from drawing requirements is documented as a Non-Conformance.', 1, 8
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='orientation'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='orientation' AND qq.sort_order=8
);
INSERT INTO public.oap_quizzes (course_id, title, passing_score_pct, max_attempts, time_limit_minutes, is_published)
SELECT id, 'Safety & EHS — Final Quiz', 80, 5, 30, true
FROM public.oap_courses WHERE slug = 'safety-ehs'
AND NOT EXISTS (SELECT 1 FROM public.oap_quizzes WHERE course_id = (SELECT id FROM public.oap_courses WHERE slug='safety-ehs'));
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'What is the correct LOTO sequence?', '["Lock \u2192 Verify \u2192 Notify \u2192 Isolate", "Notify \u2192 Shut down \u2192 Isolate \u2192 Lock/Tag \u2192 Verify", "Isolate \u2192 Lock \u2192 Notify \u2192 Run", "Notify \u2192 Run \u2192 Verify"]'::jsonb, '[1]'::jsonb, 'OSHA 1910.147: Notify, shutdown, isolate, lock & tag, verify zero energy.', 1, 1
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='safety-ehs'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='safety-ehs' AND qq.sort_order=1
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Hearing protection is required above what dBA?', '["65", "75", "85", "100"]'::jsonb, '[2]'::jsonb, 'OSHA action level is 85 dBA TWA.', 1, 2
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='safety-ehs'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='safety-ehs' AND qq.sort_order=2
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'multi_choice', 'Which are valid sources of hazardous energy?', '["Electrical", "Pneumatic", "Hydraulic", "Stored mechanical (springs)", "Operator''s lunch"]'::jsonb, '[0, 1, 2, 3]'::jsonb, 'All stored energy must be released or restrained before work.', 1, 3
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='safety-ehs'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='safety-ehs' AND qq.sort_order=3
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'true_false', 'Personal LOTO locks may be shared with a coworker.', '["True", "False"]'::jsonb, '[1]'::jsonb, 'Each person uses their own lock — never shared.', 1, 4
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='safety-ehs'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='safety-ehs' AND qq.sort_order=4
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'If a coworker is unconscious after a fall, you should:', '["Move them to a safer location", "Call first responder; do not move them", "Check email for procedure", "Continue your job"]'::jsonb, '[1]'::jsonb, 'Do not move someone with possible spinal injury. Call for trained help.', 1, 5
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='safety-ehs'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='safety-ehs' AND qq.sort_order=5
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Cut-resistant gloves must NEVER be worn:', '["When handling sharp stock", "Near a rotating spindle", "During inspection", "While palletizing"]'::jsonb, '[1]'::jsonb, 'Gloves can wrap into rotating tooling — strict no-glove rule at the spindle.', 1, 6
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='safety-ehs'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='safety-ehs' AND qq.sort_order=6
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'SDS stands for:', '["System Diagnostic Sheet", "Safety Data Sheet", "Standard Daily Schedule", "Sealed Document Store"]'::jsonb, '[1]'::jsonb, 'Safety Data Sheet — chemical hazard reference.', 1, 7
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='safety-ehs'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='safety-ehs' AND qq.sort_order=7
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'true_false', 'All near-misses must be reported within 24 hours.', '["True", "False"]'::jsonb, '[0]'::jsonb, 'Standard EHS expectation.', 1, 8
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='safety-ehs'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='safety-ehs' AND qq.sort_order=8
);
INSERT INTO public.oap_quizzes (course_id, title, passing_score_pct, max_attempts, time_limit_minutes, is_published)
SELECT id, 'Material Handling — Final Quiz', 80, 5, 30, true
FROM public.oap_courses WHERE slug = 'material-handling'
AND NOT EXISTS (SELECT 1 FROM public.oap_quizzes WHERE course_id = (SELECT id FROM public.oap_courses WHERE slug='material-handling'));
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'A heat number traces:', '["The shift it was made", "The metallurgical lot of the raw stock", "Tooling life", "Fixture serial"]'::jsonb, '[1]'::jsonb, 'Heat lot is the metallurgical traceability number.', 1, 1
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='material-handling'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='material-handling' AND qq.sort_order=1
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'A yellow stripe on a WIP bin means:', '["Released to next op", "Quarantine \u2014 do not touch", "Scrap", "Ready for shipping"]'::jsonb, '[1]'::jsonb, 'Yellow = on hold pending disposition.', 1, 2
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='material-handling'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='material-handling' AND qq.sort_order=2
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Loads above ~50 lb require:', '["Two operators", "A hoist or forklift", "Stretching first", "No special handling"]'::jsonb, '[1]'::jsonb, 'Mechanical aid required to prevent back injury.', 1, 3
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='material-handling'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='material-handling' AND qq.sort_order=3
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'multi_choice', 'Inspect a sling for:', '["Frays", "Kinks", "Rust pits", "Color of the operator''s shirt", "Damaged eye splice"]'::jsonb, '[0, 1, 2, 4]'::jsonb, 'Visual sling inspection before every use.', 1, 4
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='material-handling'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='material-handling' AND qq.sort_order=4
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'true_false', 'Forklifts may be used to lift coworkers.', '["True", "False"]'::jsonb, '[1]'::jsonb, 'Never. Use an aerial lift or scissor lift only.', 1, 5
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='material-handling'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='material-handling' AND qq.sort_order=5
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Mixed lots typically result from:', '["Slow machining", "Mis-staged WIP", "Tool changes", "Changeover time"]'::jsonb, '[1]'::jsonb, 'Parts separated from their traveler are the leading cause.', 1, 6
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='material-handling'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='material-handling' AND qq.sort_order=6
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Cut-off remnants from a heat lot should be:', '["Discarded", "Saved with the heat tag for re-inspection", "Sent to recycling immediately", "Given to apprentices"]'::jsonb, '[1]'::jsonb, 'Retain remnants for FAI verification or material claim.', 1, 7
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='material-handling'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='material-handling' AND qq.sort_order=7
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'If raw stock has no CoC, you should:', '["Run it", "Stop and notify the supervisor", "Stamp it yourself", "Use last week''s CoC"]'::jsonb, '[1]'::jsonb, 'No certificate = no traceability = stop the job.', 1, 8
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='material-handling'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='material-handling' AND qq.sort_order=8
);
INSERT INTO public.oap_quizzes (course_id, title, passing_score_pct, max_attempts, time_limit_minutes, is_published)
SELECT id, 'Measurement & Inspection — Final Quiz', 80, 5, 30, true
FROM public.oap_courses WHERE slug = 'measurement-inspection'
AND NOT EXISTS (SELECT 1 FROM public.oap_quizzes WHERE course_id = (SELECT id FROM public.oap_courses WHERE slug='measurement-inspection'));
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'A standard dial caliper resolves to:', '["0.01\"", "0.001\"", "0.0001\"", "1/64\""]'::jsonb, '[1]'::jsonb, 'Dial calipers read to 0.001 inch.', 1, 1
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='measurement-inspection'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='measurement-inspection' AND qq.sort_order=1
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'A micrometer is best read with:', '["The thimble cranked tight", "The friction/ratchet thimble", "Hand pressure on the jaws", "Eye estimation"]'::jsonb, '[1]'::jsonb, 'Ratchet provides consistent measuring force.', 1, 2
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='measurement-inspection'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='measurement-inspection' AND qq.sort_order=2
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Datums in GD&T are labeled:', '["1, 2, 3", "X, Y, Z", "A, B, C", "\u03b1, \u03b2, \u03b3"]'::jsonb, '[2]'::jsonb, 'Datums use letters, typically A, B, C in primary, secondary, tertiary order.', 1, 3
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='measurement-inspection'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='measurement-inspection' AND qq.sort_order=3
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'multi_choice', 'Which symbols are GD&T form controls?', '["Flatness", "Cylindricity", "Position", "Straightness", "Profile"]'::jsonb, '[0, 1, 3]'::jsonb, 'Form: flatness, straightness, circularity, cylindricity. Position & profile are location/profile controls.', 1, 4
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='measurement-inspection'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='measurement-inspection' AND qq.sort_order=4
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'true_false', 'A part hot off the spindle reads larger than at room temperature.', '["True", "False"]'::jsonb, '[0]'::jsonb, 'Thermal expansion — let parts stabilize before final measurement.', 1, 5
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='measurement-inspection'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='measurement-inspection' AND qq.sort_order=5
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Bore gauges are zeroed using:', '["A caliper", "A master ring", "A pin gauge", "An outside mic"]'::jsonb, '[1]'::jsonb, 'Master ring provides traceable zero reference.', 1, 6
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='measurement-inspection'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='measurement-inspection' AND qq.sort_order=6
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'If a caliper is dropped, it is:', '["Fine to keep using", "Suspect \u2014 verify calibration before use", "Always trash", "Used only for rough work"]'::jsonb, '[1]'::jsonb, 'Re-verify against gauge blocks before trusting.', 1, 7
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='measurement-inspection'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='measurement-inspection' AND qq.sort_order=7
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', '''0.0001"'' is commonly called:', '["A thou", "A tenth", "A mil", "A point"]'::jsonb, '[1]'::jsonb, 'Machinist slang: ''a tenth'' = one ten-thousandth of an inch.', 1, 8
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='measurement-inspection'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='measurement-inspection' AND qq.sort_order=8
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'multi_choice', 'Position tolerance requires which datum scheme?', '["Primary", "Secondary", "Tertiary (when needed)", "Material symbol"]'::jsonb, '[0, 1, 2]'::jsonb, 'Position is meaningless without a datum reference frame.', 1, 9
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='measurement-inspection'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='measurement-inspection' AND qq.sort_order=9
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'true_false', 'Wringing Jo blocks together creates a traceable length stack.', '["True", "False"]'::jsonb, '[0]'::jsonb, 'Gauge block wringing is the foundation of metrology.', 1, 10
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='measurement-inspection'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='measurement-inspection' AND qq.sort_order=10
);
INSERT INTO public.oap_quizzes (course_id, title, passing_score_pct, max_attempts, time_limit_minutes, is_published)
SELECT id, 'Tooling & Preset — Final Quiz', 80, 5, 30, true
FROM public.oap_courses WHERE slug = 'tooling-preset'
AND NOT EXISTS (SELECT 1 FROM public.oap_quizzes WHERE course_id = (SELECT id FROM public.oap_courses WHERE slug='tooling-preset'));
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'A T-number identifies:', '["The operator", "The tool position in the tool table", "The shift", "The fixture"]'::jsonb, '[1]'::jsonb, 'T-number maps the program''s tool calls to the physical tool.', 1, 1
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='tooling-preset'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='tooling-preset' AND qq.sort_order=1
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Tool length offset is the distance from:', '["Tool tip to chuck face", "Gauge line to tool tip", "Spindle nose to part top", "Z-zero to home"]'::jsonb, '[1]'::jsonb, 'Length is measured from gauge line (BT/CAT/HSK reference) to the cutting tip.', 1, 2
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='tooling-preset'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='tooling-preset' AND qq.sort_order=2
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Built-up edge typically appears on:', '["Hardened steel at low feed", "Aluminum and gummy materials", "Cast iron at high RPM", "Plastics at low RPM"]'::jsonb, '[1]'::jsonb, 'BUE is most common on soft, ductile metals.', 1, 3
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='tooling-preset'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='tooling-preset' AND qq.sort_order=3
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'multi_choice', 'Causes of premature insert wear include:', '["Wrong grade", "Incorrect feed/speed", "Coolant failure", "Operator color preference", "Excessive depth of cut"]'::jsonb, '[0, 1, 2, 4]'::jsonb, 'All are real causes — color preference is not.', 1, 4
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='tooling-preset'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='tooling-preset' AND qq.sort_order=4
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'true_false', 'An old offset value left in the table can crash a machine.', '["True", "False"]'::jsonb, '[0]'::jsonb, 'Always update offsets before running production.', 1, 5
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='tooling-preset'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='tooling-preset' AND qq.sort_order=5
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Tools should be returned to the crib:', '["Loose in a drawer", "Cleaned and tagged", "Still mounted in a holder", "Submerged in coolant"]'::jsonb, '[1]'::jsonb, 'Cleaning prevents chip damage at preset & extends tool life.', 1, 6
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='tooling-preset'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='tooling-preset' AND qq.sort_order=6
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'An end mill''s effective diameter is used for:', '["Spindle speed", "Feed rate", "Cutter compensation (D-offset)", "Tool length"]'::jsonb, '[2]'::jsonb, 'D-offset corrects for tool radius variation.', 1, 7
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='tooling-preset'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='tooling-preset' AND qq.sort_order=7
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Coolant primarily controls:', '["Operator comfort", "Heat and chip evacuation", "Spindle balance", "Power draw"]'::jsonb, '[1]'::jsonb, 'Heat removal and chip evacuation are coolant''s main jobs.', 1, 8
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='tooling-preset'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='tooling-preset' AND qq.sort_order=8
);
INSERT INTO public.oap_quizzes (course_id, title, passing_score_pct, max_attempts, time_limit_minutes, is_published)
SELECT id, 'Machine Qualification — Final Quiz', 80, 5, 30, true
FROM public.oap_courses WHERE slug = 'machine-qualification'
AND NOT EXISTS (SELECT 1 FROM public.oap_quizzes WHERE course_id = (SELECT id FROM public.oap_courses WHERE slug='machine-qualification'));
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'E-stop should be used:', '["For routine stops", "Only in genuine emergencies", "To pause for lunch", "To swap tools"]'::jsonb, '[1]'::jsonb, 'E-stop is for emergencies — feed-hold or cycle stop is for normal pauses.', 1, 1
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='machine-qualification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='machine-qualification' AND qq.sort_order=1
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Warm-up cycles are run:', '["Never", "Before the first job of the day or after long idles", "Only at year-end", "Only on weekends"]'::jsonb, '[1]'::jsonb, 'Thermal stability of the spindle and ways requires warm-up.', 1, 2
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='machine-qualification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='machine-qualification' AND qq.sort_order=2
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'First piece inspection (FPI) is required:', '["Once a year", "After every setup change", "Only on aerospace jobs", "When supervisor asks"]'::jsonb, '[1]'::jsonb, 'FPI catches setup errors before producing scrap.', 1, 3
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='machine-qualification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='machine-qualification' AND qq.sort_order=3
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'multi_choice', 'Causes of chatter include:', '["Long tool overhang", "Worn spindle bearings", "Excessive depth of cut", "Fluorescent lighting", "Poor work-holding"]'::jsonb, '[0, 1, 2, 4]'::jsonb, 'Mechanical & rigidity causes — lighting is irrelevant.', 1, 4
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='machine-qualification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='machine-qualification' AND qq.sort_order=4
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'true_false', 'Red or blue chip color usually indicates the cut is too aggressive.', '["True", "False"]'::jsonb, '[0]'::jsonb, 'Heat color shows excessive temperature — back off feed or speed.', 1, 5
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='machine-qualification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='machine-qualification' AND qq.sort_order=5
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Feed-hold differs from cycle-stop in that:', '["Feed-hold maintains spindle and pauses motion", "Cycle-stop continues motion", "They are identical", "Feed-hold ends the program"]'::jsonb, '[0]'::jsonb, 'Feed-hold pauses axis motion while keeping spindle on.', 1, 6
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='machine-qualification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='machine-qualification' AND qq.sort_order=6
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Override knobs should normally sit at:', '["50%", "75%", "100%", "150%"]'::jsonb, '[2]'::jsonb, '100% = programmed value. Use overrides for proving out, not production.', 1, 7
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='machine-qualification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='machine-qualification' AND qq.sort_order=7
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Best place to learn the panel layout is:', '["During an emergency", "With a mentor before running unsupervised", "Only from YouTube", "Trial and error"]'::jsonb, '[1]'::jsonb, 'Mentor walkthrough is required by OAP before unsupervised running.', 1, 8
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='machine-qualification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='machine-qualification' AND qq.sort_order=8
);
INSERT INTO public.oap_quizzes (course_id, title, passing_score_pct, max_attempts, time_limit_minutes, is_published)
SELECT id, 'Floor Certification — Final Quiz', 80, 5, 30, true
FROM public.oap_courses WHERE slug = 'floor-certification'
AND NOT EXISTS (SELECT 1 FROM public.oap_quizzes WHERE course_id = (SELECT id FROM public.oap_courses WHERE slug='floor-certification'));
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Who signs off on station-specific competencies?', '["You", "Your assigned mentor", "Anyone passing by", "HR"]'::jsonb, '[1]'::jsonb, 'Mentors are designated by the org and tracked in oap_designated_mentors.', 1, 1
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='floor-certification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='floor-certification' AND qq.sort_order=1
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'A clean shift handoff includes:', '["Just clocking out", "Counts, scrap, rework, tool status, and open issues", "Only a verbal note", "An email to HR"]'::jsonb, '[1]'::jsonb, 'Documented handoffs prevent surprises.', 1, 2
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='floor-certification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='floor-certification' AND qq.sort_order=2
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Where is your certificate verifiable publicly?', '["LinkedIn only", "/verify/:certId", "Facebook", "Nowhere"]'::jsonb, '[1]'::jsonb, 'Public verification page with no ITAR-sensitive data.', 1, 3
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='floor-certification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='floor-certification' AND qq.sort_order=3
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'multi_choice', 'Annual recertification is typical for which cells?', '["ITAR / aerospace", "Medical (when required)", "Floor sweeping", "Lunchroom"]'::jsonb, '[0, 1]'::jsonb, 'Critical compliance cells require annual refresh.', 1, 4
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='floor-certification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='floor-certification' AND qq.sort_order=4
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'true_false', 'Your OAP transcript travels with you between shops via the Talent Network.', '["True", "False"]'::jsonb, '[0]'::jsonb, 'Operators control profile visibility & transfer tokens.', 1, 5
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='floor-certification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='floor-certification' AND qq.sort_order=5
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'If you encounter an out-of-spec part during your shift:', '["Hide it", "Open an NCR and notify supervisor", "Mix it with good parts", "Send it to ship"]'::jsonb, '[1]'::jsonb, 'Always open an NCR and follow the disposition process.', 1, 6
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='floor-certification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='floor-certification' AND qq.sort_order=6
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'The walkthrough sections live at:', '["/help", "/oap/walkthrough", "/talent", "/billing"]'::jsonb, '[1]'::jsonb, 'Mentor sessions are tracked under /oap/walkthrough.', 1, 7
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='floor-certification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='floor-certification' AND qq.sort_order=7
);
INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT q.id, 'single_choice', 'Recert events are stored in:', '["A Word doc", "oap_recert_events", "Email", "Nowhere"]'::jsonb, '[1]'::jsonb, 'All certification & recert events are auditable in the database.', 1, 8
FROM public.oap_quizzes q JOIN public.oap_courses c ON c.id=q.course_id
WHERE c.slug='floor-certification'
AND NOT EXISTS (
  SELECT 1 FROM public.oap_quiz_questions qq
  JOIN public.oap_quizzes qz ON qz.id=qq.quiz_id
  JOIN public.oap_courses cc ON cc.id=qz.course_id
  WHERE cc.slug='floor-certification' AND qq.sort_order=8
);

-- ─── GCA BANKS ─────────────────────────────────────────────────────────
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, is_published, sort_order)
VALUES ('lathe-fundamentals', 'Lathe Fundamentals', 'Lathe', 'Lathe Fundamentals — comprehensive question bank with 25+ questions covering core competencies.',
'beginner', 80, false, true, 1)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, topic = EXCLUDED.topic, difficulty = EXCLUDED.difficulty,
  is_pro_only = EXCLUDED.is_pro_only, is_published = EXCLUDED.is_published, sort_order = EXCLUDED.sort_order;
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, is_published, sort_order)
VALUES ('mill-fundamentals', 'Mill Fundamentals', 'Mill', 'Mill Fundamentals — comprehensive question bank with 25+ questions covering core competencies.',
'beginner', 80, false, true, 2)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, topic = EXCLUDED.topic, difficulty = EXCLUDED.difficulty,
  is_pro_only = EXCLUDED.is_pro_only, is_published = EXCLUDED.is_published, sort_order = EXCLUDED.sort_order;
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, is_published, sort_order)
VALUES ('fanuc-controller', 'Fanuc Controller', 'Controls', 'Fanuc Controller — comprehensive question bank with 25+ questions covering core competencies.',
'intermediate', 80, false, true, 3)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, topic = EXCLUDED.topic, difficulty = EXCLUDED.difficulty,
  is_pro_only = EXCLUDED.is_pro_only, is_published = EXCLUDED.is_published, sort_order = EXCLUDED.sort_order;
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, is_published, sort_order)
VALUES ('haas-controller', 'Haas Controller', 'Controls', 'Haas Controller — comprehensive question bank with 25+ questions covering core competencies.',
'intermediate', 80, false, true, 4)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, topic = EXCLUDED.topic, difficulty = EXCLUDED.difficulty,
  is_pro_only = EXCLUDED.is_pro_only, is_published = EXCLUDED.is_published, sort_order = EXCLUDED.sort_order;
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, is_published, sort_order)
VALUES ('gdt-basics', 'GD&T Basics', 'GD&T', 'GD&T Basics — comprehensive question bank with 25+ questions covering core competencies.',
'intermediate', 80, true, true, 5)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, topic = EXCLUDED.topic, difficulty = EXCLUDED.difficulty,
  is_pro_only = EXCLUDED.is_pro_only, is_published = EXCLUDED.is_published, sort_order = EXCLUDED.sort_order;
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, is_published, sort_order)
VALUES ('speeds-and-feeds', 'Speeds & Feeds', 'Machining', 'Speeds & Feeds — comprehensive question bank with 25+ questions covering core competencies.',
'intermediate', 80, true, true, 6)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, topic = EXCLUDED.topic, difficulty = EXCLUDED.difficulty,
  is_pro_only = EXCLUDED.is_pro_only, is_published = EXCLUDED.is_published, sort_order = EXCLUDED.sort_order;
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, is_published, sort_order)
VALUES ('inspection-metrology', 'Inspection & Metrology', 'Quality', 'Inspection & Metrology — comprehensive question bank with 25+ questions covering core competencies.',
'advanced', 80, true, true, 7)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, topic = EXCLUDED.topic, difficulty = EXCLUDED.difficulty,
  is_pro_only = EXCLUDED.is_pro_only, is_published = EXCLUDED.is_published, sort_order = EXCLUDED.sort_order;

-- ─── GCA QUESTIONS ─────────────────────────────────────────────────────
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'On a CNC lathe, what does G96 specify?', '["Constant surface speed (CSS)", "Constant RPM", "Rapid feed", "Tool change"]'::jsonb, '[0]'::jsonb, 'G96 holds surface speed constant; spindle RPM varies as diameter changes.', 1, 1
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=1
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'G97 is used to:', '["Cancel CSS and command direct RPM", "Engage threading", "Set work offset", "Start coolant"]'::jsonb, '[0]'::jsonb, 'G97 returns to direct RPM control, often before drilling or tapping at the centerline.', 1, 2
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=2
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Which axis on a lathe is along the spindle centerline?', '["X", "Y", "Z", "C"]'::jsonb, '[2]'::jsonb, 'Z runs along the spindle; X is the cross slide.', 1, 3
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=3
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Diameter mode (X) measures:', '["Radius", "Full diameter", "Tool offset", "Chuck depth"]'::jsonb, '[1]'::jsonb, 'Most lathe controls program X as full diameter.', 1, 4
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=4
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'G71 on a Fanuc lathe is:', '["Threading cycle", "Multiple-pass turning rough cycle", "Drilling", "Tool change"]'::jsonb, '[1]'::jsonb, 'G71 is the multiple-pass roughing cycle for OD/ID turning.', 1, 5
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=5
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'G70 follows G71 to perform:', '["A finish pass along the defined contour", "Another rough pass", "Spindle stop", "Coolant off"]'::jsonb, '[0]'::jsonb, 'G70 references the same P/Q block range and finishes to programmed contour.', 1, 6
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=6
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Threading on a lathe most commonly uses:', '["G32 / G92 / G76", "G81 / G82", "G54 / G55", "M03 / M05"]'::jsonb, '[0]'::jsonb, 'G32 single-pass, G92 simple cycle, G76 compound threading cycle.', 1, 7
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=7
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'M03 commands:', '["Spindle CCW", "Spindle CW", "Spindle stop", "Coolant on"]'::jsonb, '[1]'::jsonb, 'M03 = clockwise.', 1, 8
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=8
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'M05 commands:', '["Spindle stop", "Coolant on", "End of program", "Tool change"]'::jsonb, '[0]'::jsonb, 'Spindle off.', 1, 9
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=9
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'M30 typically:', '["Pauses", "Resets and rewinds program to start", "Tool change", "Spindle CW"]'::jsonb, '[1]'::jsonb, 'End of program with reset (rewind).', 1, 10
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=10
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Which strategies reduce chatter when turning?', '["Reduce overhang", "Increase rigidity", "Use sharper insert", "Run dry", "Increase nose radius slightly"]'::jsonb, '[0, 1, 2, 4]'::jsonb, 'Rigidity, sharp tooling, and slight nose radius help; running dry usually worsens it.', 1, 11
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=11
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'A live tool on a lathe lets you:', '["Drill at centerline only", "Mill or cross-drill off centerline", "Run two spindles", "Engage threading"]'::jsonb, '[1]'::jsonb, 'Live tooling spins independently for milling and cross drilling.', 1, 12
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=12
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'true_false', 'X positive moves the turret away from the spindle centerline.', '["True", "False"]'::jsonb, '[0]'::jsonb, '+X is away from spindle on a standard lathe coordinate system.', 1, 13
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=13
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Tool nose radius compensation uses:', '["G40 / G41 / G42", "G54", "G70", "G92"]'::jsonb, '[0]'::jsonb, 'G41 left, G42 right, G40 cancel.', 1, 14
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=14
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'A peck drilling cycle is commonly:', '["G83", "G70", "G50", "G96"]'::jsonb, '[0]'::jsonb, 'G83 (Fanuc) is deep peck; G74 is also used on lathes.', 1, 15
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=15
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'CSS is most useful when:', '["Facing toward center", "Threading", "Tool changing", "Idle"]'::jsonb, '[0]'::jsonb, 'Surface speed stays consistent as diameter shrinks during a face cut.', 1, 16
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=16
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Chip control on long-chipping aluminum is improved by:', '["Larger nose radius", "Chipbreaker geometry", "Higher cutting fluid pressure", "All of the above"]'::jsonb, '[3]'::jsonb, 'Geometry and coolant strategy combine to break chips.', 1, 17
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=17
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'A ''parting'' tool is used to:', '["Drill", "Cut off the finished piece from stock", "Thread", "Bore"]'::jsonb, '[1]'::jsonb, 'Also called a cut-off tool.', 1, 18
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=18
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Soft jaws are typically:', '["Forged hard", "Bored to fit a specific OD/ID", "Used for raw bar", "One-time use"]'::jsonb, '[1]'::jsonb, 'Soft jaws are turned to match the specific workpiece for concentricity.', 1, 19
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=19
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'A common problem with too-fast feed in finishing is:', '["Better surface", "Visible feed marks / poor Ra", "Less chatter", "Lower power"]'::jsonb, '[1]'::jsonb, 'Feed marks become visible; surface roughness rises.', 1, 20
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=20
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Which insert shape is most rigid for roughing?', '["C (80\u00b0)", "V (35\u00b0)", "D (55\u00b0)", "T (60\u00b0)"]'::jsonb, '[0]'::jsonb, 'Larger included angle (C, S, R) = more rigid for roughing.', 1, 21
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=21
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Coolant directed at the cutting edge primarily:', '["Wastes fluid", "Removes heat & chips", "Stops the spindle", "Calibrates the tool"]'::jsonb, '[1]'::jsonb, 'Heat removal and chip evacuation.', 1, 22
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=22
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'On Fanuc, work offsets G54–G59 store:', '["Tool length", "Part zero locations", "Spindle speed", "Feed rate"]'::jsonb, '[1]'::jsonb, 'Each offset stores a part-zero relative to machine zero.', 1, 23
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=23
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Which checks belong in a lathe FPI?', '["OD", "Length", "Surface finish", "Heat lot match", "Operator''s birthday"]'::jsonb, '[0, 1, 2, 3]'::jsonb, 'Critical features and traceability — not personal info.', 1, 24
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=24
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'true_false', 'Spindle override at 50% during proveout is a safe practice.', '["True", "False"]'::jsonb, '[0]'::jsonb, 'Reduced override gives time to react during first runs.', 1, 25
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='lathe-fundamentals' AND qq.sort_order=25
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'On a vertical machining center (VMC), Z+ is:', '["Toward part", "Away from part (up)", "Left", "Right"]'::jsonb, '[1]'::jsonb, 'Standard convention: Z+ raises the spindle away from work.', 1, 1
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=1
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Climb milling means:', '["Cutter rotation opposes feed", "Cutter rotation matches feed direction", "No coolant", "Tool reversal"]'::jsonb, '[1]'::jsonb, 'Climb (down-milling) = cutter rotation moves with feed direction.', 1, 2
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=2
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Conventional milling is preferred when:', '["Backlash is a concern", "Climbing is impossible", "Maximum surface finish on rigid machine", "Modern CNCs only"]'::jsonb, '[0]'::jsonb, 'Conventional was historically used on machines with backlash; climb is preferred on tight ballscrew machines.', 1, 3
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=3
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'G81 is typically:', '["Drilling cycle", "Boring cycle", "Tapping cycle", "Threading"]'::jsonb, '[0]'::jsonb, 'G81 = simple drilling, retract to R-plane.', 1, 4
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=4
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'G83 is:', '["Peck drilling", "Boring", "Tap", "Pocket"]'::jsonb, '[0]'::jsonb, 'Deep-hole peck drill clears chips between pecks.', 1, 5
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=5
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'G84 is:', '["Tapping cycle", "Drilling", "Pocket mill", "Probe"]'::jsonb, '[0]'::jsonb, 'Right-hand tapping cycle (G74 = left-hand).', 1, 6
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=6
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Cutter compensation G41 / G42:', '["Switch coolant", "Apply tool radius offset to left/right", "Stop spindle", "Set feed"]'::jsonb, '[1]'::jsonb, 'G41 left, G42 right of programmed path.', 1, 7
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=7
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'G43 H## activates:', '["Tool length offset", "Cutter comp", "Coolant", "Reset"]'::jsonb, '[0]'::jsonb, 'Length offset H value loads the tool length compensation.', 1, 8
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=8
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'G54 typically refers to:', '["Machine zero", "Work coordinate system 1", "Tool zero", "Spindle stop"]'::jsonb, '[1]'::jsonb, 'WCS1; G55–G59 are additional work offsets.', 1, 9
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=9
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Causes of poor pocket finish include:', '["Worn cutter", "Excessive radial DOC", "Broken corners", "Wrong spindle speed", "Operator''s mood"]'::jsonb, '[0, 1, 2, 3]'::jsonb, 'All technical causes are valid; mood is not.', 1, 10
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=10
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Helical interpolation cuts:', '["Straight slot", "Spiral down a circular path", "Pure facing", "Square pocket only"]'::jsonb, '[1]'::jsonb, 'Used for ramping into pockets without a plunge.', 1, 11
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=11
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Adaptive (HSM) toolpaths typically use:', '["Heavy radial, light axial", "Light radial, heavy axial", "Heavy axial, heavy radial", "No coolant"]'::jsonb, '[1]'::jsonb, 'High-feed, light radial engagement keeps tool engaged longer.', 1, 12
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=12
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Best end mill for slotting in steel is usually:', '["2-flute", "4-flute", "6-flute", "8-flute"]'::jsonb, '[0]'::jsonb, '2-flute provides chip clearance in slots.', 1, 13
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=13
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Best end mill for finishing a side wall is usually:', '["2-flute", "4-flute", "Single-flute", "Carbide insert face mill"]'::jsonb, '[1]'::jsonb, 'More flutes = better finish at higher feed.', 1, 14
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=14
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Trochoidal milling reduces:', '["Surface finish", "Tool engagement & heat", "Spindle RPM", "Coolant"]'::jsonb, '[1]'::jsonb, 'Constant low engagement extends tool life.', 1, 15
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=15
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'A face mill leaves witness marks if:', '["Insert heights are uneven", "Insert heights are even", "Spindle is squared", "Vise is tight"]'::jsonb, '[0]'::jsonb, 'Tramming and insert seating must be uniform.', 1, 16
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=16
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Tool length is loaded into:', '["H register (G43 H##)", "D register", "Work offset", "Macro variable"]'::jsonb, '[0]'::jsonb, 'H is length, D is diameter.', 1, 17
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=17
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Material removal rate (MRR) =', '["WOC \u00d7 DOC \u00d7 Feed", "RPM \u00d7 Diameter", "Feed \u00d7 RPM", "Coolant flow"]'::jsonb, '[0]'::jsonb, 'MRR = radial × axial × linear feed.', 1, 18
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=18
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Which fixture is best for a thin-wall part?', '["Vise jaws crushing the wall", "Soft fixture that supports & doesn''t distort", "No work-holding", "Magnetic chuck only"]'::jsonb, '[1]'::jsonb, 'Custom soft fixture or vacuum fixture prevents distortion.', 1, 19
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=19
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Which improve tool life on a face mill?', '["Correct lead angle", "Even insert seating", "Adequate coolant flow", "Lower feed than spec", "Properly tightened pull stud"]'::jsonb, '[0, 1, 2, 4]'::jsonb, 'Lower feed than spec actually causes rubbing, not life.', 1, 20
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=20
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'M06 is:', '["Tool change", "Coolant on", "Spindle CW", "Pallet change"]'::jsonb, '[0]'::jsonb, 'Tool change.', 1, 21
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=21
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Probe cycles are useful for:', '["Manual setting only", "Automated work-coordinate setup", "Threading", "Tool dressing"]'::jsonb, '[1]'::jsonb, 'Probing automates work zero & in-process inspection.', 1, 22
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=22
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'true_false', 'Climb milling produces lower cutting forces with sharp tooling on rigid machines.', '["True", "False"]'::jsonb, '[0]'::jsonb, 'Generally yes — modern CNCs default to climb.', 1, 23
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=23
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Air blast on aluminum:', '["Causes BUE", "Helps clear chips", "Replaces coolant entirely", "Stops spindle"]'::jsonb, '[1]'::jsonb, 'Air blast clears chips; flood or MQL still preferred.', 1, 24
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=24
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Pocket entry strategies include:', '["Plunge, ramp, helix, pre-drilled hole", "Climb only", "Conventional only", "Spindle off"]'::jsonb, '[0]'::jsonb, 'All are valid depending on tool & material.', 1, 25
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='mill-fundamentals' AND qq.sort_order=25
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Fanuc ''edit'' mode allows:', '["Editing programs in memory", "Running programs", "Tool change", "Spindle override"]'::jsonb, '[0]'::jsonb, 'EDIT enables program modification; AUTO runs programs.', 1, 1
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=1
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Single block button:', '["Skips over blocks", "Executes one block at a time", "Runs faster", "Disables overrides"]'::jsonb, '[1]'::jsonb, 'Stops after each block, useful in proveout.', 1, 2
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=2
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Dry run on Fanuc:', '["Disables coolant", "Replaces feed with dry-run feed for proveout", "Stops the spindle", "Skips tool changes"]'::jsonb, '[1]'::jsonb, 'Common proveout aid — combine with single block.', 1, 3
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=3
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Optional stop is triggered by:', '["M00", "M01 with OSP on", "M02", "M30"]'::jsonb, '[1]'::jsonb, 'M01 stops only when ''Optional Stop'' is enabled.', 1, 4
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=4
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Macro variables on Fanuc are prefixed with:', '["#", "$", "%", "@"]'::jsonb, '[0]'::jsonb, '#100, #500-series, etc.', 1, 5
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=5
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'System variable #5021 typically reads:', '["Tool length", "Machine X position", "Work offset", "Spindle load"]'::jsonb, '[1]'::jsonb, '#5021 = current X axis position (machine).', 1, 6
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=6
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'G65 is:', '["Macro call (single)", "Macro modal", "Coolant", "Work offset"]'::jsonb, '[0]'::jsonb, 'Single-shot macro call; G66 is modal.', 1, 7
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=7
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Fanuc thread cycles include:', '["G32, G92, G76", "G81, G83", "G54-G59", "G98, G99"]'::jsonb, '[0]'::jsonb, 'Three primary thread cycles.', 1, 8
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=8
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'To switch IPM/IPR feed mode:', '["G94 / G95", "G54 / G55", "M03 / M05", "G40 / G41"]'::jsonb, '[0]'::jsonb, 'G94 = IPM, G95 = IPR (per-rev).', 1, 9
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=9
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Common alarms during proveout include:', '["Soft over-travel", "No tool length offset", "Cutter comp interference", "Wrong workspace"]'::jsonb, '[0, 1, 2]'::jsonb, 'All real, recoverable alarms during setup.', 1, 10
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=10
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Background editing lets you:', '["Edit one program while running another", "Lose data", "Override feed", "Replace controller"]'::jsonb, '[0]'::jsonb, 'Useful for prep on a busy machine.', 1, 11
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=11
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'DNC mode means:', '["Direct numerical control \u2014 drip-feed program", "Drive Network Connect", "Dynamic Number Control", "Defaults Not Captured"]'::jsonb, '[0]'::jsonb, 'Streams programs from external storage.', 1, 12
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=12
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Soft over-travel limits are:', '["Hardware limit switches", "Software-defined axis bounds", "Coolant limits", "Tool length max"]'::jsonb, '[1]'::jsonb, 'Software boundaries prevent hard limit crashes.', 1, 13
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=13
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Reference return (zero-return) typically uses:', '["G28", "G54", "G92", "M30"]'::jsonb, '[0]'::jsonb, 'G28 returns axes to machine reference.', 1, 14
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=14
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Cancel cutter comp:', '["G40", "G41", "G42", "G43"]'::jsonb, '[0]'::jsonb, 'G40 cancels comp.', 1, 15
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=15
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Polar coordinate programming:', '["G15 / G16", "G54 / G55", "M07 / M08", "G40 / G41"]'::jsonb, '[0]'::jsonb, 'G16 enable, G15 cancel.', 1, 16
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=16
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'M19 typically:', '["Spindle orient", "Coolant", "Tool change", "Pallet"]'::jsonb, '[0]'::jsonb, 'Spindle orient for tool change or boring.', 1, 17
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=17
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'M98 calls a:', '["Subprogram", "Macro", "Tool change", "Coolant"]'::jsonb, '[0]'::jsonb, 'Subprogram call by O number.', 1, 18
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=18
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'M99 returns from:', '["Subprogram", "Macro modal", "Spindle", "Tool change"]'::jsonb, '[0]'::jsonb, 'End of subprogram, return to caller.', 1, 19
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=19
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Auxiliary axes on Fanuc are addressed via:', '["A, B, C, U, V, W", "Only XYZ", "E, F, G", "R, S, T"]'::jsonb, '[0]'::jsonb, 'Rotary (A/B/C) and parallel auxiliary (U/V/W) axes.', 1, 20
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=20
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Fanuc 0i vs 31i differ in:', '["High-speed look-ahead", "Macro capacity", "Number of axes", "Color choice"]'::jsonb, '[0, 1, 2]'::jsonb, 'Performance & capacity differ; color is irrelevant.', 1, 21
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=21
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'true_false', 'G54.1 P# extends additional work offsets beyond G59.', '["True", "False"]'::jsonb, '[0]'::jsonb, 'Up to 48 additional offsets via G54.1 Px.', 1, 22
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=22
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'To save a parameter snapshot:', '["Backup via I/O screen", "Reboot", "Power cycle", "Spindle warm-up"]'::jsonb, '[0]'::jsonb, 'Use the I/O page to back up parameters and macros.', 1, 23
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=23
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Block skip is triggered by ''/'':', '["Always", "Only when block-skip toggle is on", "Never", "Only in MDI"]'::jsonb, '[1]'::jsonb, 'Forward slash blocks are skipped when the toggle is enabled.', 1, 24
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=24
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Manual handle interrupt:', '["Allows MPG offset during auto cycle", "Stops the program", "Resets work offset", "Disables overrides"]'::jsonb, '[0]'::jsonb, 'Add temporary offset via the handwheel during cycle.', 1, 25
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='fanuc-controller' AND qq.sort_order=25
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Haas ''Cycle Start'' button:', '["Begins a program in Auto", "Stops the spindle", "Tool changes", "Resets alarms"]'::jsonb, '[0]'::jsonb, 'Cycle start launches/resumes program execution.', 1, 1
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=1
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Haas ''Reset'' clears:', '["Most alarms and resets the program to start", "Tool offsets", "Work offsets", "Coolant"]'::jsonb, '[0]'::jsonb, 'Clears recoverable alarms and rewinds program.', 1, 2
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=2
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Setting 9 controls:', '["Inch / metric mode", "Tool change height", "Spindle speed", "Backlash"]'::jsonb, '[0]'::jsonb, 'Inch vs Metric is Setting 9.', 1, 3
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=3
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Haas WIPS stands for:', '["Wireless Intuitive Probing System", "Web Integrated Power Source", "Workpiece Inspection Position Sensor", "None"]'::jsonb, '[0]'::jsonb, 'WIPS is the wireless probing package.', 1, 4
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=4
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'To enter Tool Offset page:', '["OFFSET key, then F4", "RESET", "ALARM", "CYCLE START"]'::jsonb, '[0]'::jsonb, 'OFFSET → toggle to TOOL with F4 / cursor.', 1, 5
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=5
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Haas Visual Quick Code (VQC) is for:', '["Macro library calls", "Quick-fix templates for common geometry", "Tool offsets", "Spindle warmup"]'::jsonb, '[1]'::jsonb, 'VQC builds programs from templates.', 1, 6
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=6
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Setting 32 controls:', '["Coolant override", "Coolant control", "Spindle CW", "Block delete"]'::jsonb, '[0]'::jsonb, 'Coolant on/off override behavior.', 1, 7
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=7
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Haas tool table holds offsets for:', '["200 tools", "999 tools", "Up to 200 (varies)", "Unlimited"]'::jsonb, '[2]'::jsonb, 'Most Haas controls support 200 tools (model-dependent).', 1, 8
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=8
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Active Work Offset is selected via:', '["G54\u2013G59 / G54 P##", "M01", "M99", "Setting 1"]'::jsonb, '[0]'::jsonb, 'Same Fanuc-style WCS selection.', 1, 9
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=9
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Haas-specific G/M codes include:', '["G187 (surface accuracy)", "M97 (local subprogram)", "G143 (5-axis comp)", "M30 (end of program)"]'::jsonb, '[0, 1, 2]'::jsonb, 'G187, M97, G143 are Haas conventions; M30 is universal.', 1, 10
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=10
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'M97 calls a:', '["Local subprogram by line number", "External program", "Tool change", "Coolant"]'::jsonb, '[0]'::jsonb, 'M97 P## calls a local subroutine inside the same file.', 1, 11
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=11
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'M98 calls an:', '["External O-number subprogram", "Macro", "Tool change", "Pallet"]'::jsonb, '[0]'::jsonb, 'External O-program.', 1, 12
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=12
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Haas ''Setup Mode'' switch:', '["Allows door-open jog at safe speed", "Locks the door", "Stops the spindle", "Tool changes"]'::jsonb, '[0]'::jsonb, 'Setup mode permits limited door-open operations.', 1, 13
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=13
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Spindle warm-up program is launched from:', '["Current Commands \u2192 Maintenance", "RESET", "ALARM", "SETTING"]'::jsonb, '[0]'::jsonb, 'Maintenance tab includes warm-up macros.', 1, 14
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=14
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Haas TSC stands for:', '["Through Spindle Coolant", "Tool Speed Calculator", "Tap Spindle Cycle", "Total Speed Control"]'::jsonb, '[0]'::jsonb, 'Through-spindle coolant option.', 1, 15
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=15
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Setting 103:', '["CYC START in MDI requires lock", "Tool change height", "Coolant", "Mist"]'::jsonb, '[0]'::jsonb, 'Safety setting controlling MDI cycle start.', 1, 16
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=16
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'To reset spindle load monitor:', '["Current Commands \u2192 spindle, F1 to clear", "RESET button", "Cycle start", "Tool change"]'::jsonb, '[0]'::jsonb, 'F1 clears max spindle load history.', 1, 17
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=17
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Probe macros on Haas commonly use:', '["G/M code wrappers around macro #1000+", "No macros", "Manual entry", "External PC"]'::jsonb, '[0]'::jsonb, 'WIPS macros call Renishaw-style routines.', 1, 18
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=18
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Best-practice tool change height should:', '["Clear all fixtures", "Be safe but not excessive", "Be tested in single block", "Equal home position only"]'::jsonb, '[0, 1, 2]'::jsonb, 'Test thoughtfully; home isn''t always required.', 1, 19
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=19
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'true_false', 'Haas G103 limits look-ahead to a number of blocks for predictable behavior.', '["True", "False"]'::jsonb, '[0]'::jsonb, 'G103 P# limits look-ahead — useful with macros that update offsets dynamically.', 1, 20
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=20
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Haas MDI:', '["Manual Data Input \u2014 type and run a single block or short program", "Multi-Drive Interlock", "Major Diagnostic Interrupt", "None"]'::jsonb, '[0]'::jsonb, 'Same MDI concept as Fanuc.', 1, 21
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=21
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Setting 31 (''Reset Program Pointer''):', '["Returns program to top on reset", "Tool change", "Coolant", "Spindle"]'::jsonb, '[0]'::jsonb, 'Setting controlling pointer behavior on RESET.', 1, 22
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=22
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Probing rapid speed is governed by:', '["Setting 25/26 / Renishaw macro speeds", "RESET", "Cycle start", "Spindle override"]'::jsonb, '[0]'::jsonb, 'Settings define probe approach rapid feed.', 1, 23
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=23
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Haas Door Hold:', '["Stops feed if door opens", "Locks the door", "Coolant", "Spindle"]'::jsonb, '[0]'::jsonb, 'Safety interlock pauses motion.', 1, 24
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=24
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Operator data backup is best done via:', '["List Program \u2192 USB Backup", "Reset", "Power cycle", "Manual transcription"]'::jsonb, '[0]'::jsonb, 'USB backups save settings, programs, and macros.', 1, 25
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='haas-controller' AND qq.sort_order=25
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'GD&T standard governing engineering drawings is:', '["ASME Y14.5", "ISO 9001", "OSHA 1910", "AWS D1.1"]'::jsonb, '[0]'::jsonb, 'ASME Y14.5 is the dimensioning & tolerancing standard.', 1, 1
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=1
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Datums are referenced as:', '["Numbers", "Letters (A, B, C\u2026)", "Greek symbols", "Colors"]'::jsonb, '[1]'::jsonb, 'Letters in primary, secondary, tertiary order.', 1, 2
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=2
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', '''⌖'' (crosshair) symbol is:', '["Position", "Flatness", "Cylindricity", "Profile"]'::jsonb, '[0]'::jsonb, 'Position tolerance — true location of a feature axis or center plane.', 1, 3
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=3
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Flatness applies to:', '["A surface only", "An axis", "A point", "A datum letter"]'::jsonb, '[0]'::jsonb, 'Flatness controls surface variation across a single feature.', 1, 4
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=4
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Maximum Material Condition (MMC) symbol is:', '["\u24c2", "\u24c1", "\u24c8", "\u24c5"]'::jsonb, '[0]'::jsonb, 'Ⓜ=MMC, Ⓛ=LMC, Ⓢ=RFS (assumed by default in Y14.5-2009+).', 1, 5
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=5
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Bonus tolerance applies when:', '["Feature departs from MMC", "Feature is at LMC only", "Feature is at perfect form", "Never"]'::jsonb, '[0]'::jsonb, 'Bonus = departure from MMC, applied to position or orientation tolerance.', 1, 6
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=6
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Form controls include:', '["Flatness", "Straightness", "Circularity", "Cylindricity", "Position"]'::jsonb, '[0, 1, 2, 3]'::jsonb, 'Form: flatness, straightness, circularity, cylindricity. Position is location.', 1, 7
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=7
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Profile of a surface controls:', '["Form, location, and orientation of a contour", "Only flatness", "Only position", "Only roughness"]'::jsonb, '[0]'::jsonb, 'Profile is a powerful 2D/3D control.', 1, 8
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=8
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Datum reference frame requires:', '["1 datum", "Up to 3 datums", "Always 6 datums", "No datums"]'::jsonb, '[1]'::jsonb, 'Primary, secondary, tertiary establish a 3D coordinate reference.', 1, 9
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=9
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Concentricity is:', '["Rarely used; superseded by position/runout", "The same as TIR", "Always required", "Easy to inspect"]'::jsonb, '[0]'::jsonb, 'ASME Y14.5-2009 deprecates concentricity in favor of position/runout.', 1, 10
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=10
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Total runout controls:', '["Form + orientation + location relative to a datum axis", "Surface roughness", "Color", "Only roundness"]'::jsonb, '[0]'::jsonb, 'Combined control along the full surface.', 1, 11
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=11
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Circular runout is checked at:', '["A single cross section", "Full surface", "Multiple datums simultaneously", "Never"]'::jsonb, '[0]'::jsonb, 'Single cross section as part rotates 360°.', 1, 12
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=12
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Material condition modifiers include:', '["MMC", "LMC", "RFS", "Position"]'::jsonb, '[0, 1, 2]'::jsonb, 'Position is a tolerance, not a modifier.', 1, 13
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=13
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Datum target points are used when:', '["The full surface is unsuitable as a datum", "Always", "Never", "On printed parts only"]'::jsonb, '[0]'::jsonb, 'E.g., castings with rough surfaces — define specific contact points.', 1, 14
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=14
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'true_false', 'Without datums, a position tolerance is meaningless.', '["True", "False"]'::jsonb, '[0]'::jsonb, 'Position requires a datum reference frame.', 1, 15
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=15
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Perpendicularity is:', '["Orientation control to a datum", "Form control", "Location control", "Surface roughness"]'::jsonb, '[0]'::jsonb, 'Orientation = perpendicular, parallel, angularity.', 1, 16
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=16
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Cylindricity controls:', '["Round + straight at all cross sections", "Position", "Color", "Roughness"]'::jsonb, '[0]'::jsonb, 'Combined form control for cylindrical surfaces.', 1, 17
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=17
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', '''Ⓢ'' modifier:', '["Regardless of feature size (default)", "Always at MMC", "Always at LMC", "Surface finish"]'::jsonb, '[0]'::jsonb, 'RFS — applies regardless of feature size.', 1, 18
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=18
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'A feature control frame contains:', '["Symbol, tolerance, modifiers, datums", "Only the tolerance", "Only the symbol", "Just datums"]'::jsonb, '[0]'::jsonb, 'Standard feature control frame structure.', 1, 19
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=19
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Composite position tolerance has:', '["Two stacked rows in the FCF", "Only one row", "No datums", "Always rejected"]'::jsonb, '[0]'::jsonb, 'Upper row = pattern location; lower = pattern interrelation.', 1, 20
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=20
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Common inspection method for position is:', '["CMM", "Calipers only", "Eyeballing", "Feeler gauge"]'::jsonb, '[0]'::jsonb, 'Coordinate Measuring Machine for true position.', 1, 21
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=21
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Surface profile may have:', '["Bilateral or unilateral tolerance zones", "Only bilateral", "Only unilateral", "No tolerance zone"]'::jsonb, '[0]'::jsonb, 'Profile zones can be symmetric or shifted to one side.', 1, 22
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=22
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Datum simulator is:', '["A physical reference like a chuck, vise, or surface plate", "A digital model only", "An operator", "An inspector"]'::jsonb, '[0]'::jsonb, 'Real-world feature simulating the datum.', 1, 23
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=23
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Tolerance stack-up analysis:', '["Adds individual tolerances to predict assembly fit", "Replaces drawings", "Replaces inspection", "Is irrelevant"]'::jsonb, '[0]'::jsonb, 'Analyzes worst-case or statistical stacks.', 1, 24
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=24
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Drawings should always specify:', '["Units", "Tolerance type", "Datums (when applicable)", "Surface finish (when applicable)", "Operator name"]'::jsonb, '[0, 1, 2, 3]'::jsonb, 'Operator name is not a drawing requirement.', 1, 25
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='gdt-basics' AND qq.sort_order=25
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Surface speed (SFM) formula is:', '["RPM \u00d7 \u03c0 \u00d7 D / 12", "RPM \u00d7 D", "Feed \u00d7 RPM", "DOC \u00d7 Feed"]'::jsonb, '[0]'::jsonb, 'SFM = RPM × π × D ÷ 12 (D in inches).', 1, 1
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=1
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Solving for RPM from SFM:', '["RPM = (SFM \u00d7 12) / (\u03c0 \u00d7 D)", "RPM = SFM \u00d7 D", "RPM = \u03c0 \u00d7 D / SFM", "RPM = SFM"]'::jsonb, '[0]'::jsonb, 'Algebraic rearrangement.', 1, 2
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=2
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Feed per tooth (Fz) is:', '["Feed (IPM) \u00f7 (RPM \u00d7 Z)", "Feed (IPM) \u00d7 Z", "Feed (IPM) \u00d7 RPM", "RPM \u00f7 Z"]'::jsonb, '[0]'::jsonb, 'Fz quantifies chip load per cutting edge.', 1, 3
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=3
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Chip thinning occurs when:', '["Radial engagement is low", "DOC is high", "Spindle is slow", "Tool is dull"]'::jsonb, '[0]'::jsonb, 'Low ae produces thinner chips than commanded — compensate by increasing feed.', 1, 4
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=4
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Roughing typically prioritizes:', '["Surface finish", "Material removal rate", "Visual aesthetics", "Tool color"]'::jsonb, '[1]'::jsonb, 'MRR drives roughing; finishing prioritizes Ra.', 1, 5
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=5
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Increasing feed at constant SFM tends to:', '["Reduce cycle time", "Increase forces", "Improve chip evacuation", "Lower surface finish"]'::jsonb, '[0, 1, 2, 3]'::jsonb, 'All true — feed is a powerful lever.', 1, 6
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=6
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Carbide vs HSS — carbide can typically run at:', '["Lower SFM", "2-4\u00d7 higher SFM", "Same SFM", "Half SFM"]'::jsonb, '[1]'::jsonb, 'Carbide tolerates much higher cutting temperatures.', 1, 7
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=7
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Coated carbides (TiAlN) are best for:', '["Soft aluminum", "Hard steels & high temps", "Plastics", "Wood"]'::jsonb, '[1]'::jsonb, 'TiAlN coating provides hot hardness for steels.', 1, 8
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=8
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Aluminum cuts best with:', '["Sharp uncoated carbide or polished carbide", "Heavily coated dull tools", "HSS only", "Insert with negative geometry"]'::jsonb, '[0]'::jsonb, 'Aluminum loves sharp positive-rake tooling.', 1, 9
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=9
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Built-up edge mitigation:', '["Increase SFM, change geometry, use coolant", "Run dry", "Drop SFM", "Add larger nose radius"]'::jsonb, '[0]'::jsonb, 'Higher cutting temperature window plus chip-flow geometry.', 1, 10
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=10
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Power requirement scales with:', '["MRR \u00d7 specific cutting energy", "RPM only", "Coolant flow", "Tool color"]'::jsonb, '[0]'::jsonb, 'P = MRR × Kc (specific cutting energy).', 1, 11
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=11
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'DOC = depth of cut, ae = ?:', '["Radial width of cut", "Axial depth", "Spindle RPM", "Feed per tooth"]'::jsonb, '[0]'::jsonb, 'ae = radial engagement; ap = axial depth.', 1, 12
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=12
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'HSM (high-speed machining) typically uses:', '["High RPM, light DOC, high feed", "Low RPM, heavy DOC", "No coolant", "Manual control"]'::jsonb, '[0]'::jsonb, 'Light-engagement, high-feed strategies.', 1, 13
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=13
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Chip load too low can cause:', '["Rubbing & accelerated wear", "Better tool life", "Lower forces", "No effect"]'::jsonb, '[0]'::jsonb, 'Below the minimum chip load, the edge rubs instead of cuts.', 1, 14
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=14
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'To improve surface finish on a finishing pass:', '["Increase flutes", "Lower feed per tooth", "Use sharp insert", "Reduce overhang", "Run dry intentionally"]'::jsonb, '[0, 1, 2, 3]'::jsonb, 'Running dry usually doesn''t help finish.', 1, 15
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=15
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Reciprocal SFM for HSS in mild steel ~ ?', '["80-120 SFM", "500 SFM", "2000 SFM", "10 SFM"]'::jsonb, '[0]'::jsonb, 'Classic HSS in 1018: ~80-120 SFM.', 1, 16
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=16
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Carbide in 1018 mild steel typical SFM:', '["80", "250-400", "2000", "10000"]'::jsonb, '[1]'::jsonb, 'Coated carbide pushes 250-400 SFM in mild steel.', 1, 17
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=17
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Stainless 304 typical carbide SFM:', '["50-80", "150-250", "1000", "2000"]'::jsonb, '[1]'::jsonb, 'Work-hardening grade — moderate SFM, never dwell.', 1, 18
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=18
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Tool life vs SFM follows:', '["Linear", "Taylor''s equation (V \u00d7 T^n = C)", "Random", "Quadratic only"]'::jsonb, '[1]'::jsonb, 'Taylor: tool life vs cutting velocity is exponential.', 1, 19
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=19
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Increasing SFM by 50% typically:', '["Doubles tool life", "Reduces tool life dramatically", "No change", "Improves finish only"]'::jsonb, '[1]'::jsonb, 'Heat ramps non-linearly with cutting speed.', 1, 20
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=20
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'HEM (high-efficiency milling) uses:', '["Heavy axial, light radial, full-flute engagement", "Heavy radial only", "No axial", "Manual"]'::jsonb, '[0]'::jsonb, 'Maximizes flute usage and dissipates heat.', 1, 21
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=21
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Coolant strategies include:', '["Flood", "Through-spindle", "MQL", "Air blast", "Manual brushing"]'::jsonb, '[0, 1, 2, 3]'::jsonb, 'Brushing is not a real strategy.', 1, 22
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=22
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Chip color guideline (steel):', '["Silver = ok, blue = hot, dark/burnt = too hot", "All colors are fine", "Red is best", "Black is ideal"]'::jsonb, '[0]'::jsonb, 'Color is a real-time temperature indicator.', 1, 23
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=23
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'SFM for 6061-T6 aluminum (carbide):', '["30-80", "800-2000", "100", "20"]'::jsonb, '[1]'::jsonb, 'Aluminum runs very fast — limited often by spindle RPM.', 1, 24
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=24
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'true_false', 'Doubling RPM at constant feed doubles MRR.', '["True", "False"]'::jsonb, '[1]'::jsonb, 'Feed (IPM) is fixed; doubling RPM lowers chip load per tooth — MRR unchanged.', 1, 25
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='speeds-and-feeds' AND qq.sort_order=25
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Traceability of measurement means:', '["Records track back to NIST/national standards", "No paperwork", "Random checks", "Operator approval"]'::jsonb, '[0]'::jsonb, 'Calibration chains back to recognized national standards.', 1, 1
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=1
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Rule of 10 in metrology:', '["Inspection device should be ~10\u00d7 more accurate than the tolerance", "Always run 10 parts", "Inspect 10% of parts", "Calibrate every 10 days"]'::jsonb, '[0]'::jsonb, 'Gauge resolution ≪ tolerance.', 1, 2
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=2
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'CMM stands for:', '["Coordinate Measuring Machine", "Controlled Material Method", "Combined Manufacturing Module", "Center Mark Method"]'::jsonb, '[0]'::jsonb, 'Programmable touch-probe inspection device.', 1, 3
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=3
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Surface plate flatness is graded:', '["Grade A, B, AA", "Color", "Weight", "Hardness"]'::jsonb, '[0]'::jsonb, 'Granite plate grades define max flatness deviation.', 1, 4
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=4
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Gauge R&R measures:', '["Repeatability + Reproducibility of a measurement system", "Tool life", "Material strength", "Operator IQ"]'::jsonb, '[0]'::jsonb, 'Variability from gauge & operators.', 1, 5
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=5
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Acceptable %GR&R is typically:', '["<10% excellent, <30% acceptable", "Anything", "100%", "\u226550%"]'::jsonb, '[0]'::jsonb, 'AIAG MSA guidelines.', 1, 6
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=6
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Calibration interval is determined by:', '["Manufacturer rec. + usage + criticality", "Always 1 year", "Operator preference", "Never"]'::jsonb, '[0]'::jsonb, 'Risk-based interval setting.', 1, 7
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=7
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'CMM probe-tip qualification confirms:', '["Probe diameter", "Probe location", "Stylus deflection", "Operator ID"]'::jsonb, '[0, 1, 2]'::jsonb, 'Probe geometry calibration before measurement.', 1, 8
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=8
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Optical comparator is best for:', '["Profile/silhouette inspection", "Surface roughness", "Hardness", "Material analysis"]'::jsonb, '[0]'::jsonb, 'Magnified shadow against an overlay or DRO.', 1, 9
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=9
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Surface roughness Ra is:', '["Arithmetic mean roughness", "Peak-to-valley", "Just visual", "Color"]'::jsonb, '[0]'::jsonb, 'Average of absolute deviations from mean line.', 1, 10
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=10
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'ISO 1302 governs:', '["Surface texture symbology", "Welding", "GD&T", "Drawings size"]'::jsonb, '[0]'::jsonb, 'Surface finish indication on drawings.', 1, 11
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=11
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Pin gauges measure:', '["Hole sizes", "Surface finish", "Hardness", "Roughness"]'::jsonb, '[0]'::jsonb, 'Plus and minus pin gauges check ID.', 1, 12
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=12
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Bore gauge calibration uses a:', '["Master ring", "Caliper", "Outside mic", "Tape"]'::jsonb, '[0]'::jsonb, 'Master ring sets traceable zero.', 1, 13
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=13
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Hardness scales include:', '["Rockwell, Brinell, Vickers, Knoop", "RPM, SFM, IPM", "HRC, HRB, HRD only", "ISO/IEC"]'::jsonb, '[0]'::jsonb, 'Common hardness test methods.', 1, 14
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=14
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Inspection records should capture:', '["Date/time", "Operator", "Tool used (gauge ID)", "Reading", "Operator''s lunch order"]'::jsonb, '[0, 1, 2, 3]'::jsonb, 'All audit-quality fields except meal preferences.', 1, 15
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=15
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'First Article Inspection (FAI) per AS9102 includes:', '["Forms 1, 2, 3 with full dimensional verification", "Just one dimension", "Verbal approval", "Photo only"]'::jsonb, '[0]'::jsonb, 'Three-form structure for aerospace FAIs.', 1, 16
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=16
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'SPC (Statistical Process Control) uses:', '["Control charts (X-bar/R, P, etc.)", "Eyeball", "Random sampling only", "Lottery"]'::jsonb, '[0]'::jsonb, 'Charts identify common vs special-cause variation.', 1, 17
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=17
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Cpk measures:', '["Process capability adjusted for centering", "Tool life", "Operator skill", "Coolant"]'::jsonb, '[0]'::jsonb, 'Process capability with mean offset.', 1, 18
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=18
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Cpk ≥ 1.33 is typically:', '["Capable", "Always rejected", "Insufficient", "Out of control"]'::jsonb, '[0]'::jsonb, 'Common minimum acceptable capability.', 1, 19
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=19
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Out-of-control conditions include:', '["1 point > 3\u03c3 from mean", "All points within limits", "Stable trend", "Random scatter"]'::jsonb, '[0]'::jsonb, 'Western Electric rules for control charts.', 1, 20
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=20
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Why let parts thermally stabilize before measurement?', '["Eliminate thermal expansion error", "Save time", "Add wear", "Reduce coolant"]'::jsonb, '[0]'::jsonb, 'Steel changes ~6 µin/in/°F — significant on tight tolerances.', 1, 21
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=21
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Air gauging measures:', '["Bore size by air back-pressure", "Flatness", "Hardness", "Roughness"]'::jsonb, '[0]'::jsonb, 'Fast, repeatable bore inspection in production.', 1, 22
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=22
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Vision systems are best for:', '["High-throughput 2D feature inspection", "Surface roughness", "Hardness", "Material chemistry"]'::jsonb, '[0]'::jsonb, 'Cameras + algorithms inspect features quickly.', 1, 23
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=23
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'single_choice', 'Profilometer measures:', '["Surface roughness", "Hardness", "Length", "Color"]'::jsonb, '[0]'::jsonb, 'Stylus or optical scan of surface texture.', 1, 24
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=24
);
INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, points, sort_order)
SELECT b.id, 'multi_choice', 'Common gauge maintenance tasks:', '["Cleaning", "Calibration", "Damage inspection", "Storage in cases", "Painting"]'::jsonb, '[0, 1, 2, 3]'::jsonb, 'Proper care extends gauge life.', 1, 25
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.gca_questions qq
  JOIN public.gca_question_banks bb ON bb.id=qq.bank_id
  WHERE bb.slug='inspection-metrology' AND qq.sort_order=25
);

-- ─── TRAINING MEDIA (YouTube + SVG diagrams via storage_bucket='external') ─
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'both', 'oap_lesson', l.id, 'image', 'image/svg+xml',
       'external', 'https://upload.wikimedia.org/wikipedia/commons/4/40/Vernier_caliper.svg', 'Vernier_caliper.svg',
       'Vernier caliper anatomy', 'Diagram of a vernier caliper showing main scale and vernier scale', 1, true, 'public', true
FROM public.oap_lessons l
JOIN public.oap_courses c ON c.id = l.course_id
WHERE c.slug = 'measurement-inspection' AND l.slug = 'basic-measurement-tape-rule-caliper'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='oap_lesson' AND tm.entity_id=l.id AND tm.storage_path='https://upload.wikimedia.org/wikipedia/commons/4/40/Vernier_caliper.svg'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'both', 'oap_lesson', l.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/Wx2I3xX1pNw', 'Wx2I3xX1pNw',
       'How to read a caliper', 'How to read a caliper video', 2, false, 'public', true
FROM public.oap_lessons l
JOIN public.oap_courses c ON c.id = l.course_id
WHERE c.slug = 'measurement-inspection' AND l.slug = 'basic-measurement-tape-rule-caliper'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='oap_lesson' AND tm.entity_id=l.id AND tm.storage_path='https://www.youtube.com/embed/Wx2I3xX1pNw'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'both', 'oap_lesson', l.id, 'image', 'image/svg+xml',
       'external', 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Micrometer_no_zoom.svg', 'Micrometer_no_zoom.svg',
       'Outside micrometer', 'Outside micrometer parts diagram', 1, true, 'public', true
FROM public.oap_lessons l
JOIN public.oap_courses c ON c.id = l.course_id
WHERE c.slug = 'measurement-inspection' AND l.slug = 'micrometers-and-bore-gauges'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='oap_lesson' AND tm.entity_id=l.id AND tm.storage_path='https://upload.wikimedia.org/wikipedia/commons/c/cd/Micrometer_no_zoom.svg'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'both', 'oap_lesson', l.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/CIzlO8FF44A', 'CIzlO8FF44A',
       'Reading a micrometer', 'Reading a micrometer tutorial', 2, false, 'public', true
FROM public.oap_lessons l
JOIN public.oap_courses c ON c.id = l.course_id
WHERE c.slug = 'measurement-inspection' AND l.slug = 'micrometers-and-bore-gauges'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='oap_lesson' AND tm.entity_id=l.id AND tm.storage_path='https://www.youtube.com/embed/CIzlO8FF44A'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'both', 'oap_lesson', l.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/BkvVKiNHjK4', 'BkvVKiNHjK4',
       'GD&T crash course', 'GD&T crash course video', 1, true, 'public', true
FROM public.oap_lessons l
JOIN public.oap_courses c ON c.id = l.course_id
WHERE c.slug = 'measurement-inspection' AND l.slug = 'gdt-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='oap_lesson' AND tm.entity_id=l.id AND tm.storage_path='https://www.youtube.com/embed/BkvVKiNHjK4'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'oap', 'oap_lesson', l.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/dV2XBN6S43I', 'dV2XBN6S43I',
       'OSHA LOTO overview', 'OSHA Lockout Tagout overview', 1, true, 'public', true
FROM public.oap_lessons l
JOIN public.oap_courses c ON c.id = l.course_id
WHERE c.slug = 'safety-ehs' AND l.slug = 'lockout-tagout-loto'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='oap_lesson' AND tm.entity_id=l.id AND tm.storage_path='https://www.youtube.com/embed/dV2XBN6S43I'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'oap', 'oap_lesson', l.id, 'image', 'image/svg+xml',
       'external', 'https://upload.wikimedia.org/wikipedia/commons/8/85/Pictogrammes_des_dangers_des_substances_chimiques_en.svg', 'Pictogrammes_des_dangers_des_substances_chimiques_en.svg',
       'GHS hazard pictograms', 'GHS pictograms for chemical hazards', 1, true, 'public', true
FROM public.oap_lessons l
JOIN public.oap_courses c ON c.id = l.course_id
WHERE c.slug = 'safety-ehs' AND l.slug = 'ppe-and-housekeeping'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='oap_lesson' AND tm.entity_id=l.id AND tm.storage_path='https://upload.wikimedia.org/wikipedia/commons/8/85/Pictogrammes_des_dangers_des_substances_chimiques_en.svg'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'oap', 'oap_lesson', l.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/oedMBhTJfnM', 'oedMBhTJfnM',
       'Forklift safety', 'Forklift safety basics', 1, true, 'public', true
FROM public.oap_lessons l
JOIN public.oap_courses c ON c.id = l.course_id
WHERE c.slug = 'material-handling' AND l.slug = 'lifting-rigging-forklift'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='oap_lesson' AND tm.entity_id=l.id AND tm.storage_path='https://www.youtube.com/embed/oedMBhTJfnM'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'oap', 'oap_lesson', l.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/p2jD5Hj3HPg', 'p2jD5Hj3HPg',
       'Tool presetting overview', 'Tool presetter overview', 1, true, 'public', true
FROM public.oap_lessons l
JOIN public.oap_courses c ON c.id = l.course_id
WHERE c.slug = 'tooling-preset' AND l.slug = 'presetting-tool-length-and-diameter'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='oap_lesson' AND tm.entity_id=l.id AND tm.storage_path='https://www.youtube.com/embed/p2jD5Hj3HPg'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'oap', 'oap_lesson', l.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/4nVm3J3PkQk', '4nVm3J3PkQk',
       'Controller walkaround', 'CNC controller walkaround', 1, true, 'public', true
FROM public.oap_lessons l
JOIN public.oap_courses c ON c.id = l.course_id
WHERE c.slug = 'machine-qualification' AND l.slug = 'controller-walkaround'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='oap_lesson' AND tm.entity_id=l.id AND tm.storage_path='https://www.youtube.com/embed/4nVm3J3PkQk'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'oap', 'oap_lesson', l.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/qHIQIUe0jvw', 'qHIQIUe0jvw',
       'Shift handoff training', 'Effective shift handoff training', 1, true, 'public', true
FROM public.oap_lessons l
JOIN public.oap_courses c ON c.id = l.course_id
WHERE c.slug = 'floor-certification' AND l.slug = 'handoff-and-documentation'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='oap_lesson' AND tm.entity_id=l.id AND tm.storage_path='https://www.youtube.com/embed/qHIQIUe0jvw'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'oap', 'oap_lesson', l.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/dCEN2dl-hxA', 'dCEN2dl-hxA',
       'Intro to AS9100', 'AS9100 introduction', 1, true, 'public', true
FROM public.oap_lessons l
JOIN public.oap_courses c ON c.id = l.course_id
WHERE c.slug = 'orientation' AND l.slug = 'quality-systems-overview'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='oap_lesson' AND tm.entity_id=l.id AND tm.storage_path='https://www.youtube.com/embed/dCEN2dl-hxA'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'gca', 'gca_question_bank', b.id, 'image', 'image/svg+xml',
       'external', 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Lathe-EN.svg', 'Lathe-EN.svg',
       'Lathe anatomy', 'Lathe anatomy diagram', 1, true, 'public', true
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='gca_question_bank' AND tm.entity_id=b.id AND tm.storage_path='https://upload.wikimedia.org/wikipedia/commons/4/4d/Lathe-EN.svg'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'gca', 'gca_question_bank', b.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/Sh4tUz4qF3w', 'Sh4tUz4qF3w',
       'CNC lathe basics', 'CNC lathe basics', 2, false, 'public', true
FROM public.gca_question_banks b
WHERE b.slug = 'lathe-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='gca_question_bank' AND tm.entity_id=b.id AND tm.storage_path='https://www.youtube.com/embed/Sh4tUz4qF3w'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'gca', 'gca_question_bank', b.id, 'image', 'image/svg+xml',
       'external', 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Milling_machine_diagram.svg', 'Milling_machine_diagram.svg',
       'Vertical mill anatomy', 'Vertical mill anatomy', 1, true, 'public', true
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='gca_question_bank' AND tm.entity_id=b.id AND tm.storage_path='https://upload.wikimedia.org/wikipedia/commons/0/0d/Milling_machine_diagram.svg'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'gca', 'gca_question_bank', b.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/Aq7_WHHHnvw', 'Aq7_WHHHnvw',
       'CNC mill fundamentals', 'CNC mill fundamentals video', 2, false, 'public', true
FROM public.gca_question_banks b
WHERE b.slug = 'mill-fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='gca_question_bank' AND tm.entity_id=b.id AND tm.storage_path='https://www.youtube.com/embed/Aq7_WHHHnvw'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'gca', 'gca_question_bank', b.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/2J5kU7Lc5wY', '2J5kU7Lc5wY',
       'Fanuc controller orientation', 'Fanuc controller orientation', 1, true, 'public', true
FROM public.gca_question_banks b
WHERE b.slug = 'fanuc-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='gca_question_bank' AND tm.entity_id=b.id AND tm.storage_path='https://www.youtube.com/embed/2J5kU7Lc5wY'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'gca', 'gca_question_bank', b.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/V60_cWcXIEI', 'V60_cWcXIEI',
       'Haas controller training', 'Haas controller training', 1, true, 'public', true
FROM public.gca_question_banks b
WHERE b.slug = 'haas-controller'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='gca_question_bank' AND tm.entity_id=b.id AND tm.storage_path='https://www.youtube.com/embed/V60_cWcXIEI'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'gca', 'gca_question_bank', b.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/BkvVKiNHjK4', 'BkvVKiNHjK4',
       'GD&T crash course', 'GD&T crash course', 1, true, 'public', true
FROM public.gca_question_banks b
WHERE b.slug = 'gdt-basics'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='gca_question_bank' AND tm.entity_id=b.id AND tm.storage_path='https://www.youtube.com/embed/BkvVKiNHjK4'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'gca', 'gca_question_bank', b.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/Lh1Co1pvlrM', 'Lh1Co1pvlrM',
       'Speeds & feeds tutorial', 'Speeds and feeds tutorial', 1, true, 'public', true
FROM public.gca_question_banks b
WHERE b.slug = 'speeds-and-feeds'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='gca_question_bank' AND tm.entity_id=b.id AND tm.storage_path='https://www.youtube.com/embed/Lh1Co1pvlrM'
);
INSERT INTO public.training_media
(organization_id, program, entity_type, entity_id, media_type, mime_type,
 storage_bucket, storage_path, file_name, caption, alt_text, sort_order, is_primary, visibility, is_canonical)
SELECT NULL, 'gca', 'gca_question_bank', b.id, 'video', 'video/youtube',
       'external', 'https://www.youtube.com/embed/7C0KJ5p8l9c', '7C0KJ5p8l9c',
       'Metrology fundamentals', 'Metrology fundamentals', 1, true, 'public', true
FROM public.gca_question_banks b
WHERE b.slug = 'inspection-metrology'
AND NOT EXISTS (
  SELECT 1 FROM public.training_media tm
  WHERE tm.entity_type='gca_question_bank' AND tm.entity_id=b.id AND tm.storage_path='https://www.youtube.com/embed/7C0KJ5p8l9c'
);

COMMIT;

-- Summary check
-- SELECT 'oap_lessons' t, COUNT(*) FROM public.oap_lessons
-- UNION ALL SELECT 'oap_quizzes', COUNT(*) FROM public.oap_quizzes
-- UNION ALL SELECT 'oap_quiz_questions', COUNT(*) FROM public.oap_quiz_questions
-- UNION ALL SELECT 'gca_question_banks', COUNT(*) FROM public.gca_question_banks
-- UNION ALL SELECT 'gca_questions', COUNT(*) FROM public.gca_questions
-- UNION ALL SELECT 'training_media', COUNT(*) FROM public.training_media;