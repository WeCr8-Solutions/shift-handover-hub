-- =============================================================================
-- OAP: Full quiz seed for all 7 certification sections
-- Idempotent: courses are upserted by slug, quizzes/questions only inserted
-- if the quiz has no questions yet.
-- FAI offset correction note: questions about offset adjustment explicitly
-- require the operator to adjust during the FAI run, work into tolerance,
-- re-measure, and re-run if needed — NOT defer to the "next part".
-- =============================================================================

DO $$
DECLARE
  v_course_id   UUID;
  v_quiz_id     UUID;
BEGIN

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1 — Company Orientation
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.oap_courses (slug, section_number, title, summary, estimated_minutes, sort_order)
VALUES ('company-orientation', 1, 'Company Orientation',
        'Facility layout, quality system overview, chain of command, near-miss reporting, and shift handover.',
        60, 1)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_course_id FROM public.oap_courses WHERE slug = 'company-orientation';

SELECT id INTO v_quiz_id FROM public.oap_quizzes WHERE course_id = v_course_id LIMIT 1;
IF v_quiz_id IS NULL THEN
  INSERT INTO public.oap_quizzes (course_id, title, description, passing_score_pct)
  VALUES (v_course_id, 'Company Orientation Certification Test',
          'Covers facility layout, quality system, reporting procedures, and shift handover.', 80)
  RETURNING id INTO v_quiz_id;
END IF;

IF NOT EXISTS (SELECT 1 FROM public.oap_quiz_questions WHERE quiz_id = v_quiz_id) THEN
  INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_quiz_id, 'multiple_choice',
   'When handing off a running job at shift change, what information MUST you communicate to the incoming operator?',
   '[{"key":"a","label":"Current part count and material grade only"},{"key":"b","label":"Current program name, any active tool wear adjustments, part count, any in-process anomalies, and next scheduled inspection interval"},{"key":"c","label":"Machine number and operator name"},{"key":"d","label":"Start time and expected end time"}]',
   '["b"]',
   'Shift handover must include program status, any offset or wear adjustments in effect, part count, anomalies noted, and upcoming quality checkpoints so the incoming operator can run safely without interruption.',
   1),
  (v_quiz_id, 'true_false',
   'A near-miss event (an incident that caused no injury or damage) does not need to be reported because nothing actually happened.',
   '[{"key":"true","label":"True"},{"key":"false","label":"False"}]',
   '["false"]',
   'Near-miss events must always be reported. They indicate a hazardous condition that could cause injury or quality escape next time. Reporting allows root-cause correction before an incident occurs.',
   2),
  (v_quiz_id, 'multiple_choice',
   'Your company operates under ISO 9001 / AS9100. What does this mean for your daily work as an operator?',
   '[{"key":"a","label":"Quality is only the quality department''s responsibility"},{"key":"b","label":"You are required to follow documented work instructions, record required data, and report nonconformances"},{"key":"c","label":"You only need to check finished parts, not in-process work"},{"key":"d","label":"The standard applies only to engineering and management"}]',
   '["b"]',
   'ISO 9001 / AS9100 make every employee responsible for quality at their station. Operators must follow documented procedures, complete required records, and escalate nonconformances.',
   3),
  (v_quiz_id, 'multiple_choice',
   'A part fails an in-process inspection. What is the correct first action?',
   '[{"key":"a","label":"Run the rest of the batch and report at end of shift"},{"key":"b","label":"Stop production, quarantine the suspect parts, and notify your supervisor immediately"},{"key":"c","label":"Adjust the offset and continue, noting the issue in the log later"},{"key":"d","label":"Ask a coworker to inspect it again before stopping"}]',
   '["b"]',
   'Any confirmed nonconformance requires immediate stop, physical quarantine of affected parts, and supervisor notification. Running additional nonconforming parts increases scrap cost and customer risk.',
   4),
  (v_quiz_id, 'multiple_choice',
   'Who is the first person you should contact when you discover a safety hazard on the shop floor?',
   '[{"key":"a","label":"Company president"},{"key":"b","label":"Your direct supervisor or lead operator"},{"key":"c","label":"The customer"},{"key":"d","label":"The maintenance scheduler — log a work order for next week"}]',
   '["b"]',
   'Your direct supervisor or lead is the first escalation point for safety hazards. They can authorize an immediate stop and involve safety or maintenance as needed.',
   5),
  (v_quiz_id, 'true_false',
   'It is acceptable to run production parts before a First Article Inspection (FAI) has been approved, as long as you believe the setup is correct.',
   '[{"key":"true","label":"True"},{"key":"false","label":"False"}]',
   '["false"]',
   'Production may not begin until the FAI is approved by the designated authority. Running unapproved production creates a risk of mass nonconforming product.',
   6),
  (v_quiz_id, 'multiple_choice',
   'Where is the master copy of the current approved drawing and revision level for a job typically located?',
   '[{"key":"a","label":"Taped to the side of the machine by the previous operator"},{"key":"b","label":"In your personal notes from training"},{"key":"c","label":"In the controlled document system — accessed through the job traveler or your organization''s DMS"},{"key":"d","label":"On the customer''s website"}]',
   '["c"]',
   'Only the controlled document system (traveler packet / DMS) contains the current approved revision. Personal copies or photocopies may be outdated and must not be used for production.',
   7),
  (v_quiz_id, 'multiple_choice',
   'At end of shift you notice the coolant concentration is low. What do you do?',
   '[{"key":"a","label":"Ignore it — the next shift will handle it"},{"key":"b","label":"Add tap water to top it off"},{"key":"c","label":"Check and record the concentration using a refractometer, mix coolant at the correct ratio per the SDS, and log the adjustment in the coolant maintenance record"},{"key":"d","label":"Add concentrate directly to the sump without mixing"}]',
   '["c"]',
   'Coolant must be maintained at the specified concentration using a refractometer. Incorrect concentration leads to bacterial growth, corrosion, poor chip clearing, and tool wear. All adjustments must be logged.',
   8);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2 — Safety & EHS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.oap_courses (slug, section_number, title, summary, estimated_minutes, sort_order)
VALUES ('safety-ehs', 2, 'Safety & EHS',
        'Lockout/tagout, GHS/SDS, machine guarding, PPE selection, emergency response, and ergonomics.',
        90, 2)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_course_id FROM public.oap_courses WHERE slug = 'safety-ehs';

SELECT id INTO v_quiz_id FROM public.oap_quizzes WHERE course_id = v_course_id LIMIT 1;
IF v_quiz_id IS NULL THEN
  INSERT INTO public.oap_quizzes (course_id, title, description, passing_score_pct)
  VALUES (v_course_id, 'Safety & EHS Certification Test',
          'Lockout/tagout, hazard communication, PPE, machine guarding, and emergency procedures.', 80)
  RETURNING id INTO v_quiz_id;
END IF;

IF NOT EXISTS (SELECT 1 FROM public.oap_quiz_questions WHERE quiz_id = v_quiz_id) THEN
  INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_quiz_id, 'multiple_choice',
   'When performing a Lockout/Tagout (LOTO) procedure, what is the correct sequence of steps?',
   '[{"key":"a","label":"Notify, isolate energy, apply lock, verify zero energy state"},{"key":"b","label":"Apply lock first, then notify supervisor"},{"key":"c","label":"Tag only — locks are optional if the job is quick"},{"key":"d","label":"Turn the machine off and begin work immediately"}]',
   '["a"]',
   'OSHA 29 CFR 1910.147 requires: notify affected employees, shut down equipment, isolate all energy sources, apply personal lock and tag, then verify zero energy (test for stored energy, try controls).',
   1),
  (v_quiz_id, 'multiple_choice',
   'Under GHS, what does a Safety Data Sheet (SDS) Section 8 contain?',
   '[{"key":"a","label":"Disposal methods"},{"key":"b","label":"Exposure controls and required PPE"},{"key":"c","label":"Physical and chemical properties"},{"key":"d","label":"Regulatory information"}]',
   '["b"]',
   'SDS Section 8 (Exposure Controls / Personal Protection) lists PELs, TLVs, required ventilation, and specific PPE (gloves, respirator type, eye protection) for safe handling.',
   2),
  (v_quiz_id, 'true_false',
   'Safety glasses with side shields provide adequate eye protection against high-pressure coolant splash.',
   '[{"key":"true","label":"True"},{"key":"false","label":"False"}]',
   '["false"]',
   'High-pressure coolant or chemical splash requires chemical splash goggles (ANSI Z87.1) or a face shield over safety glasses. Side-shield glasses do not seal against the face and allow liquid ingress.',
   3),
  (v_quiz_id, 'multiple_choice',
   'You see a coworker about to reach into a running CNC without stopping the program. What do you do?',
   '[{"key":"a","label":"Watch to see if anything goes wrong"},{"key":"b","label":"Warn them verbally after they finish"},{"key":"c","label":"Immediately call out to stop — intervene and report the unsafe act to a supervisor"},{"key":"d","label":"Nothing; it is their machine and their responsibility"}]',
   '["c"]',
   'You have an obligation to intervene in any imminent danger situation. Speak up immediately, ensure the hazard is controlled, then report to a supervisor for corrective action.',
   4),
  (v_quiz_id, 'multiple_choice',
   'Which class of fire extinguisher is appropriate for a coolant/solvent fire on the shop floor?',
   '[{"key":"a","label":"Class A"},{"key":"b","label":"Class B"},{"key":"c","label":"Class C"},{"key":"d","label":"Class D"}]',
   '["b"]',
   'Class B extinguishers (CO₂, dry chemical, foam) are rated for flammable liquid fires including cutting oils, solvents, and hydraulic fluid. Class A is for ordinary combustibles; C for electrical; D for combustible metals.',
   5),
  (v_quiz_id, 'multiple_choice',
   'When lifting a heavy part manually, which technique reduces spinal injury risk the most?',
   '[{"key":"a","label":"Bend at the waist, keep legs straight, and lift quickly"},{"key":"b","label":"Keep the load close to your body, bend your knees, keep your back straight, and lift with your legs"},{"key":"c","label":"Ask someone else to watch while you lift"},{"key":"d","label":"Twist your torso to position the part where you need it while lifting"}]',
   '["b"]',
   'Proper lift mechanics: load close to body, knees bent, back straight, lift with legs. Twisting under load is a leading cause of lumbar injury. Use mechanical assists for parts over 35 lbs.',
   6),
  (v_quiz_id, 'multiple_choice',
   'A machine guard is removed for maintenance. Production is now running on that machine. What must happen before parts are run?',
   '[{"key":"a","label":"The operator can run parts carefully while watching the exposed area"},{"key":"b","label":"The guard must be reinstalled and verified before production resumes"},{"key":"c","label":"A sign is enough — the guard can be replaced at the next PM"},{"key":"d","label":"Run one part first to confirm nothing is wrong, then reinstall the guard"}]',
   '["b"]',
   'Machine guards are required by OSHA 1910.212. Production must not resume until all guards are reinstalled and confirmed functional. There are no exceptions for production pressure.',
   7),
  (v_quiz_id, 'true_false',
   'Chips and coolant on the floor are a minor housekeeping issue and can be cleaned at the end of the shift.',
   '[{"key":"true","label":"True"},{"key":"false","label":"False"}]',
   '["false"]',
   'Chips and coolant create slip, trip, and cut hazards. They must be cleared continuously. Allowing accumulation violates 5S standards and OSHA general duty clause requirements.',
   8),
  (v_quiz_id, 'multiple_choice',
   'What does the diamond-shaped NFPA 704 "fire diamond" number in the blue quadrant indicate?',
   '[{"key":"a","label":"Flammability hazard"},{"key":"b","label":"Reactivity hazard"},{"key":"c","label":"Health hazard"},{"key":"d","label":"Special hazard"}]',
   '["c"]',
   'NFPA 704: Blue (left) = Health; Red (top) = Flammability; Yellow (right) = Instability/Reactivity; White (bottom) = Special hazards. Scale 0–4 where 4 is most severe.',
   9);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3 — Material Handling
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.oap_courses (slug, section_number, title, summary, estimated_minutes, sort_order)
VALUES ('material-handling', 3, 'Material Handling',
        'Crane signals, forklift safety zones, part traceability, bar stock handling, chip disposal.',
        60, 3)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_course_id FROM public.oap_courses WHERE slug = 'material-handling';

SELECT id INTO v_quiz_id FROM public.oap_quizzes WHERE course_id = v_course_id LIMIT 1;
IF v_quiz_id IS NULL THEN
  INSERT INTO public.oap_quizzes (course_id, title, description, passing_score_pct)
  VALUES (v_course_id, 'Material Handling Certification Test',
          'Overhead crane, forklift zones, traceability, raw stock, and chip/scrap disposal.', 80)
  RETURNING id INTO v_quiz_id;
END IF;

IF NOT EXISTS (SELECT 1 FROM public.oap_quiz_questions WHERE quiz_id = v_quiz_id) THEN
  INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_quiz_id, 'multiple_choice',
   'What does the standard overhead crane hand signal "both fists in front of the body with thumbs pointing outward" mean?',
   '[{"key":"a","label":"Hoist up"},{"key":"b","label":"Travel toward me"},{"key":"c","label":"Extend the boom"},{"key":"d","label":"Stop all motion"}]',
   '["c"]',
   'ASME B30.2 hand signals: thumbs pointing outward = extend boom (or spread). Hoist up = one finger pointing up, rotating. Stop = arm horizontal, palm down, moving sideways.',
   1),
  (v_quiz_id, 'true_false',
   'It is safe to stand under a suspended load while the crane operator positions it over your workstation.',
   '[{"key":"true","label":"True"},{"key":"false","label":"False"}]',
   '["false"]',
   'Never stand under or near a suspended load. Rigging or hardware failure can drop the load instantly. Clear the area and signal the operator from a safe position.',
   2),
  (v_quiz_id, 'multiple_choice',
   'You receive a bar of 303 stainless steel for a job. The job traveler calls for 316L stainless. What do you do?',
   '[{"key":"a","label":"Use the 303 — stainless is stainless"},{"key":"b","label":"Hold the material, tag it as suspect, and notify your supervisor to verify material certs before running"},{"key":"c","label":"Run one piece to see if it machines OK"},{"key":"d","label":"Write a note and leave it for the next shift"}]',
   '["b"]',
   'Material traceability is critical. 303 and 316L have different corrosion resistance, weldability, and mechanical properties. Running wrong material is a quality escape. Hold and verify material certs against the traveler.',
   3),
  (v_quiz_id, 'multiple_choice',
   'After completing a batch of parts, what must happen to the chips before they go into the recycle bin?',
   '[{"key":"a","label":"They can go directly into any bin — chips are inert"},{"key":"b","label":"Separate by material type (aluminum, steel, stainless, etc.), drain excess coolant, and place in the correct labeled recycle container"},{"key":"c","label":"Mix them all together to save time"},{"key":"d","label":"Put them in the regular trash"}]',
   '["b"]',
   'Chips must be segregated by alloy family for scrap value and to prevent contamination of melt batches at the recycler. Coolant must be drained to reduce hazardous waste classification.',
   4),
  (v_quiz_id, 'multiple_choice',
   'A forklift is moving toward your workstation. You are not in the designated pedestrian aisle. What should you do?',
   '[{"key":"a","label":"Wave at the driver and keep working"},{"key":"b","label":"Move immediately to the nearest marked pedestrian aisle or a safe position out of the travel path"},{"key":"c","label":"Stand still so the driver can see you"},{"key":"d","label":"Run across the travel aisle quickly"}]',
   '["b"]',
   'Forklifts have large blind spots and long stopping distances with a load. Always give right-of-way and move to a pedestrian zone. Do not rely on eye contact — the driver''s view may be obstructed.',
   5),
  (v_quiz_id, 'multiple_choice',
   'What is the purpose of a material heat number / lot number on incoming bar stock?',
   '[{"key":"a","label":"It is just a shipping label — it has no production significance"},{"key":"b","label":"It links the physical material to its mill certificate, enabling full traceability from finished part back to the melt"},{"key":"c","label":"It tells you which supplier to reorder from"},{"key":"d","label":"It is the machine number the material should be run on"}]',
   '["b"]',
   'Heat/lot traceability is required by AS9100, NADCAP, and many customer flow-downs. If a material problem is discovered later, the heat number lets you identify every part made from that melt.',
   6),
  (v_quiz_id, 'true_false',
   'It is acceptable to store finished parts and raw material in the same bin as long as you keep them to opposite sides.',
   '[{"key":"true","label":"True"},{"key":"false","label":"False"}]',
   '["false"]',
   'Finished parts and raw material must be stored separately and clearly labeled to prevent mix-up, contamination, or damage to finished surfaces. Co-mingling is a traceability and FOD risk.',
   7),
  (v_quiz_id, 'multiple_choice',
   'When deburring a part, what PPE is required at minimum?',
   '[{"key":"a","label":"No PPE is needed for hand deburring"},{"key":"b","label":"Cut-resistant gloves and safety glasses"},{"key":"c","label":"Leather welding gloves only"},{"key":"d","label":"Face shield only"}]',
   '["b"]',
   'Deburring creates sharp chips and the possibility of the tool slipping. Cut-resistant gloves (ANSI A2 or higher) protect the hand; safety glasses protect against flying chips.',
   8);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4 — Measurement & Inspection
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.oap_courses (slug, section_number, title, summary, estimated_minutes, sort_order)
VALUES ('measurement-inspection', 4, 'Measurement & Inspection',
        'Caliper and micrometer technique, GO/NO-GO gauges, CMM basics, surface finish, gage calibration.',
        90, 4)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_course_id FROM public.oap_courses WHERE slug = 'measurement-inspection';

SELECT id INTO v_quiz_id FROM public.oap_quizzes WHERE course_id = v_course_id LIMIT 1;
IF v_quiz_id IS NULL THEN
  INSERT INTO public.oap_quizzes (course_id, title, description, passing_score_pct)
  VALUES (v_course_id, 'Measurement & Inspection Certification Test',
          'Caliper, micrometer, GO/NO-GO gauges, surface finish, CMM basics, and gage R&R concepts.', 80)
  RETURNING id INTO v_quiz_id;
END IF;

IF NOT EXISTS (SELECT 1 FROM public.oap_quiz_questions WHERE quiz_id = v_quiz_id) THEN
  INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_quiz_id, 'multiple_choice',
   'A drawing calls for 1.2500" ±0.0005". What is the maximum allowable dimension?',
   '[{"key":"a","label":"1.2505\""},{"key":"b","label":"1.2510\""},{"key":"c","label":"1.2495\""},{"key":"d","label":"1.2500\" exactly"}]',
   '["a"]',
   'Maximum = nominal + tolerance = 1.2500 + 0.0005 = 1.2505". Minimum = 1.2500 - 0.0005 = 1.2495".',
   1),
  (v_quiz_id, 'multiple_choice',
   'When measuring a turned diameter with a micrometer, what technique ensures the most accurate reading?',
   '[{"key":"a","label":"Apply maximum torque to the thimble to close the gap completely"},{"key":"b","label":"Rock the micrometer slightly while turning the thimble until the spindle barely contacts the part at the true diameter, using the ratchet stop for consistent feel"},{"key":"c","label":"Measure only once and record immediately"},{"key":"d","label":"Hold the part in one hand and the mic in the other without supporting either"}]',
   '["b"]',
   'The micrometer must be rocked to find the minimum reading at the true diameter. Always use the ratchet stop for repeatable feel. Multiple readings at different angular positions confirm roundness.',
   2),
  (v_quiz_id, 'true_false',
   'A GO gauge that will not enter the feature means the feature is within the specified tolerance.',
   '[{"key":"true","label":"True"},{"key":"false","label":"False"}]',
   '["false"]',
   'A GO gauge must pass freely through (or onto) the feature. If it does NOT go, the feature is out of tolerance on the material-condition side (hole is too small, shaft is too large).',
   3),
  (v_quiz_id, 'multiple_choice',
   'A surface finish callout reads Ra 63 (µin). What does Ra measure?',
   '[{"key":"a","label":"The maximum peak-to-valley height in the evaluation length"},{"key":"b","label":"The arithmetic average of absolute profile deviations from the mean line"},{"key":"c","label":"The number of surface peaks per inch"},{"key":"d","label":"The waviness of the surface"}]',
   '["b"]',
   'Ra (Roughness Average) is the arithmetic mean of the absolute values of the profile departures from the mean line. Ra 63 µin ≈ 1.6 µm. Rz (DIN) measures average of 5 max peak-to-valley heights.',
   4),
  (v_quiz_id, 'multiple_choice',
   'You pick up a micrometer and notice the calibration sticker is expired. What do you do?',
   '[{"key":"a","label":"Use it — micrometers don''t go out of calibration"},{"key":"b","label":"Zero it against the anvil and use it"},{"key":"c","label":"Remove it from service, tag it OUT OF CALIBRATION, and send to the calibration department before using any measurement data"},{"key":"d","label":"Use it for this job only, then report it"}]',
   '["c"]',
   'Out-of-calibration gages must be removed from service immediately. Any measurements taken with them are suspect and may require a quality review. Tag and return per your calibration system procedure.',
   5),
  (v_quiz_id, 'multiple_choice',
   'What is the primary purpose of a Gage R&R (Repeatability & Reproducibility) study?',
   '[{"key":"a","label":"To calibrate the gage against NIST standards"},{"key":"b","label":"To determine whether the measurement system variation is acceptable relative to the part tolerance, and whether operators are measuring consistently"},{"key":"c","label":"To train new operators on gage use"},{"key":"d","label":"To count how many gages the shop owns"}]',
   '["b"]',
   'Gage R&R quantifies measurement system variation. Repeatability = gage variation, Reproducibility = operator-to-operator variation. The combined % Gage R&R must typically be <10% of tolerance for a capable measurement system.',
   6),
  (v_quiz_id, 'multiple_choice',
   'A CMM measurement report shows a feature TRUE POSITION deviation of 0.008" on a drawing callout of ⌀0.010" True Position. Is the part in spec?',
   '[{"key":"a","label":"No — the deviation must be zero"},{"key":"b","label":"Yes — 0.008\" is within the ⌀0.010\" cylindrical tolerance zone"},{"key":"c","label":"Cannot tell without knowing the material condition modifier"},{"key":"d","label":"No — CMM values must be halved before comparing to the drawing"}]',
   '["b"]',
   'True position tolerance is a diametral zone. The deviation of 0.008" falls inside the ⌀0.010" tolerance zone, so the feature is in specification (assuming RFS or that bonus tolerance is not needed).',
   7),
  (v_quiz_id, 'multiple_choice',
   'Why must you allow measuring instruments to thermally stabilize with the part before measuring?',
   '[{"key":"a","label":"It is only necessary for CMMs, not hand tools"},{"key":"b","label":"Because metals expand and contract with temperature; measuring at a temperature other than 68°F (20°C) standard can introduce error proportional to the CTE of the material and the temperature difference"},{"key":"c","label":"Because cold instruments can damage part surfaces"},{"key":"d","label":"There is no need — modern instruments compensate automatically"}]',
   '["b"]',
   'Dimensional measurements reference 68°F (20°C). A 1°F temperature difference on a 12" steel part introduces ~0.00007" error. For tight tolerances (±0.0005" or tighter) this matters. Let parts and instruments equalize.',
   8);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5 — Tooling & Preset
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.oap_courses (slug, section_number, title, summary, estimated_minutes, sort_order)
VALUES ('tooling-preset', 5, 'Tooling & Preset',
        'Tool offset types, insert grades, presetting procedure, FAI offset adjustment, and tool life.',
        90, 5)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_course_id FROM public.oap_courses WHERE slug = 'tooling-preset';

SELECT id INTO v_quiz_id FROM public.oap_quizzes WHERE course_id = v_course_id LIMIT 1;
IF v_quiz_id IS NULL THEN
  INSERT INTO public.oap_quizzes (course_id, title, description, passing_score_pct)
  VALUES (v_course_id, 'Tooling & Preset Certification Test',
          'Tool offsets, insert selection, presetting, FAI adjustment workflow, and tool life management.', 80)
  RETURNING id INTO v_quiz_id;
END IF;

IF NOT EXISTS (SELECT 1 FROM public.oap_quiz_questions WHERE quiz_id = v_quiz_id) THEN
  INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_quiz_id, 'multiple_choice',
   'What is the difference between a Geometry offset and a Wear offset on a CNC lathe?',
   '[{"key":"a","label":"Geometry offsets are larger numbers; wear offsets are smaller"},{"key":"b","label":"Geometry offsets define the tool''s preset length/radius from the tool-change position; wear offsets are small incremental corrections applied to compensate for gradual tool wear without changing the geometry value"},{"key":"c","label":"They are the same thing with different names"},{"key":"d","label":"Geometry offsets apply to milling tools; wear offsets apply to turning tools only"}]',
   '["b"]',
   'Geometry offsets are set at presetting and represent the tool''s gross dimensional compensation. Wear offsets are fine corrections (typically ±0.010" or less) that are adjusted during production to maintain part dimensions as the tool wears.',
   1),
  (v_quiz_id, 'multiple_choice',
   'During a First Article Inspection (FAI) run, the OD measures 2.0008" and the drawing calls for 2.000" ±0.001". What is the correct action?',
   '[{"key":"a","label":"Note the measurement and plan to adjust the wear offset before the NEXT part"},{"key":"b","label":"The part is in spec so no action is needed — continue to production"},{"key":"c","label":"Adjust the wear offset now (subtract ~0.0008\" from the current offset), re-measure, and if necessary re-run the FAI feature before approving for production"},{"key":"d","label":"Scrap the part and start a new setup from scratch"}]',
   '["c"]',
   'The FAI run IS the adjustment opportunity. Do not defer corrections to "the next part." Make the wear offset adjustment on this part''s feature if possible, re-measure, and re-run if the feature can be corrected. The goal is to prove the process is in control before releasing to production. Running a first article that is 0.0008" off-nominal without correction produces parts biased toward one tolerance wall.',
   2),
  (v_quiz_id, 'multiple_choice',
   'An insert is chipping intermittently on an 8620 steel job. Which change is most likely to resolve it?',
   '[{"key":"a","label":"Increase feed rate to generate more heat and soften the chip"},{"key":"b","label":"Switch to a tougher insert grade (higher cobalt binder / larger grain carbide) and reduce depth of cut if the part allows"},{"key":"c","label":"Reduce coolant to improve chip color visibility"},{"key":"d","label":"Run dry — coolant causes thermal shock on carbide"}]',
   '["b"]',
   'Insert chipping indicates insufficient toughness or excessive interrupted cutting force. A tougher grade (more cobalt) withstands impact better. Reducing ADOC reduces cutting forces. Coolant-induced thermal cracking is a real concern on ceramics but not on coated carbide for steel.',
   3),
  (v_quiz_id, 'multiple_choice',
   'A tool presetter measures T3 at a length of 4.6230" and diameter of 0.6250". Where are these values entered in the control?',
   '[{"key":"a","label":"Directly into the G-code program as literal dimensions"},{"key":"b","label":"Into the geometry offset register for T3 so the control can calculate tool position from the program''s coordinate system"},{"key":"c","label":"Into the wear offset only"},{"key":"d","label":"They are stored in the presetter — the control reads them automatically via wireless"}]',
   '["b"]',
   'Preset dimensions go into the geometry (length and radius/diameter) offset registers for the corresponding tool number. The control uses these to translate programmed coordinates to actual machine motion. Wear offsets start at zero and are adjusted during production.',
   4),
  (v_quiz_id, 'true_false',
   'It is acceptable to run a tool past its programmed tool life limit if visually it looks fine and the parts are still measuring in spec.',
   '[{"key":"true","label":"True"},{"key":"false","label":"False"}]',
   '["false"]',
   'Tool life limits are set proactively based on statistical wear data. A tool may look fine visually but have sub-surface microchipping that causes sudden catastrophic failure. Exceeding tool life limits without engineering approval is a quality and machine damage risk.',
   5),
  (v_quiz_id, 'multiple_choice',
   'After adjusting a wear offset by −0.002" to bring a diameter down, the part now measures 0.0005" under the nominal. What is the appropriate response?',
   '[{"key":"a","label":"Add +0.0005" back to the wear offset, re-run the feature or next part, and re-measure"},{"key":"b","label":"Scrap the part and reset to zero"},{"key":"c","label":"Leave it — 0.0005" under nominal is always acceptable"},{"key":"d","label":"Adjust the program zero instead"}]',
   '["a"]',
   'Small offset corrections are iterative. A −0.002" move that overshot by 0.0005" needs a +0.0005" correction. Add back half the overshoot amount first if uncertain, re-run, re-measure. Adjust program zero only when re-touching off the datum.',
   6),
  (v_quiz_id, 'multiple_choice',
   'What does the ISO insert designation "CNMG 432" tell you about the insert?',
   '[{"key":"a","label":"Cutting speed, feed, and depth of cut for the insert"},{"key":"b","label":"Shape (80° diamond), clearance angle (neutral), tolerance class, chip breaker, 1/2\" IC, 3/16\" thick, 1/32\" nose radius"},{"key":"c","label":"The insert is designed for stainless steel only"},{"key":"d","label":"It is a left-hand insert"}]',
   '["b"]',
   'ISO insert codes: C=80° diamond shape, N=0° clearance (neutral), M=tolerance class, G=chip breaker geometry, 4=1/2" IC, 3=3/16" thickness, 2=1/32" (0.031") nose radius. The nose radius directly affects surface finish and edge strength.',
   7),
  (v_quiz_id, 'multiple_choice',
   'You are setting up a job and the presetter shows a tool is 0.003" longer than the program was written for. What do you do?',
   '[{"key":"a","label":"Adjust the geometry offset for that tool by +0.003\" to reflect the actual length"},{"key":"b","label":"Re-write the entire program to match the new tool length"},{"key":"c","label":"Run the job and see if it causes a crash — 0.003\" is small"},{"key":"d","label":"Ignore it — the control will figure it out"}]',
   '["a"]',
   'The geometry offset for that tool should be updated to the actual measured length. The control uses the offset to calculate the correct tool position. Failing to update it means every Z-axis move with that tool will be 0.003" wrong.',
   8);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6 — Machine Qualification
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.oap_courses (slug, section_number, title, summary, estimated_minutes, sort_order)
VALUES ('machine-qualification', 6, 'Machine Qualification',
        'Machine warmup, spindle warm-up, backlash/thermal compensation, FAI, SPC, Cpk, probing.',
        90, 6)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_course_id FROM public.oap_courses WHERE slug = 'machine-qualification';

SELECT id INTO v_quiz_id FROM public.oap_quizzes WHERE course_id = v_course_id LIMIT 1;
IF v_quiz_id IS NULL THEN
  INSERT INTO public.oap_quizzes (course_id, title, description, passing_score_pct)
  VALUES (v_course_id, 'Machine Qualification Certification Test',
          'Warmup routines, thermal compensation, FAI approval workflow, SPC, Cpk, and in-process probing.', 80)
  RETURNING id INTO v_quiz_id;
END IF;

IF NOT EXISTS (SELECT 1 FROM public.oap_quiz_questions WHERE quiz_id = v_quiz_id) THEN
  INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_quiz_id, 'multiple_choice',
   'Why is a spindle warm-up program run before machining tight-tolerance parts?',
   '[{"key":"a","label":"To lubricate the spindle bearings with oil"},{"key":"b","label":"Because the spindle generates heat as it runs, causing thermal growth in the Z-axis. A warm-up routine brings the spindle to thermal equilibrium so Z-axis dimensions are stable during production"},{"key":"c","label":"Warm-up is only required on older machines"},{"key":"d","label":"To burn off coolant residue from the previous shift"}]',
   '["b"]',
   'CNC spindles can grow 0.001"–0.005" in the Z-axis as bearings reach operating temperature. Warm-up programs ramp through the production speed range for 10–30 minutes until thermal equilibrium is reached, after which the machine holds stable dimensions.',
   1),
  (v_quiz_id, 'multiple_choice',
   'A Cpk value of 0.85 on a critical dimension means:',
   '[{"key":"a","label":"The process is highly capable"},{"key":"b","label":"The process is marginally incapable — it cannot reliably hold the tolerance and will produce some out-of-spec parts"},{"key":"c","label":"The process mean is perfectly centered"},{"key":"d","label":"Cpk below 1.0 is always acceptable for aerospace parts"}]',
   '["b"]',
   'Cpk < 1.0 means the process spread extends beyond one or both tolerance limits at current sigma levels, guaranteeing some defects at any volume. Minimum acceptable Cpk is typically 1.33 for production, 1.67 for safety-critical features.',
   2),
  (v_quiz_id, 'true_false',
   'A First Article Inspection (FAI) must be re-performed any time a machine is repaired, a program is modified, or tooling is changed on a part number.',
   '[{"key":"true","label":"True"},{"key":"false","label":"False"}]',
   '["true"]',
   'AS9102 and most customer flow-downs require a new FAI (or partial FAI delta) when any of the following occur: machine change, program change, tooling change, process change, or a lapse in production beyond a defined period.',
   3),
  (v_quiz_id, 'multiple_choice',
   'During production you notice an SPC chart shows 7 consecutive points on one side of the centerline but all within control limits. What does this mean?',
   '[{"key":"a","label":"The process is stable — no action needed"},{"key":"b","label":"A non-random (special cause) pattern is present; the process may be drifting and requires investigation even though no points are outside the control limits"},{"key":"c","label":"The control limits need to be widened"},{"key":"d","label":"The gage needs recalibration"}]',
   '["b"]',
   '7 consecutive points on one side of the centerline is a Western Electric Rule violation (run rule). It indicates a shift in the process mean, likely from tool wear, temperature drift, or material lot change. Investigate and correct before a defect occurs.',
   4),
  (v_quiz_id, 'multiple_choice',
   'After a machine crash, what must be verified before running production parts?',
   '[{"key":"a","label":"Visually inspect the tooling and run one part"},{"key":"b","label":"Notify the supervisor, have maintenance inspect the machine for geometry errors (axis squareness, spindle runout, backlash), re-establish all work offsets, run a new FAI, and get sign-off before production resumes"},{"key":"c","label":"Reset the controller and continue"},{"key":"d","label":"Replace only the broken tool and continue"}]',
   '["b"]',
   'A crash can shift the machine geometry, damage the spindle, change workholding alignment, and corrupt work offsets. A full geometry check, offset re-verification, and new FAI are required before any production.',
   5),
  (v_quiz_id, 'multiple_choice',
   'In-process probing on the machine confirms a bore is 0.0015" undersize. The drawing tolerance is ±0.001". What is the correct action?',
   '[{"key":"a","label":"The bore is undersize but close — release the part and note it on the traveler"},{"key":"b","label":"The bore is nonconforming. Place the part on hold, tag it, and notify the supervisor. Do not attempt to re-bore without a disposition from engineering."},{"key":"c","label":"Re-bore immediately to bring it into spec"},{"key":"d","label":"The probe may be wrong — use a hand gage and if it reads OK, release the part"}]',
   '["b"]',
   'A bore that is 0.0015" undersize on a ±0.001" tolerance is 0.0005" outside the lower limit. It is nonconforming and must be tagged and held. Re-machining a bore without engineering review can scrap the part or mask additional problems.',
   6),
  (v_quiz_id, 'multiple_choice',
   'What is the purpose of backlash compensation in a CNC machine tool?',
   '[{"key":"a","label":"To compensate for tool deflection during heavy cuts"},{"key":"b","label":"To electronically correct for the mechanical play (lost motion) in the ballscrew and nut, so the axis moves the commanded distance when reversing direction"},{"key":"c","label":"To adjust spindle speed when the load changes"},{"key":"d","label":"To keep the coolant pressure constant"}]',
   '["b"]',
   'Backlash is the lost motion when an axis reverses direction due to clearance between the ballscrew and nut. Backlash compensation injects an extra pulse to take up this play, improving positioning accuracy on direction reversals.',
   7),
  (v_quiz_id, 'multiple_choice',
   'What does it mean when an operator says they are "qualifying the machine" before a production run?',
   '[{"key":"a","label":"Verifying that the machine''s hourly rate is correctly billed"},{"key":"b","label":"Running a defined warm-up cycle, verifying work offsets by probing or touching off, and confirming the machine''s positioning accuracy is within spec for the job''s tolerance requirements"},{"key":"c","label":"Cleaning and lubricating the machine"},{"key":"d","label":"Calling maintenance to certify the machine is safe to operate"}]',
   '["b"]',
   'Qualifying the machine means confirming it is thermally stable, that all work and tool offsets are correct, and that the machine''s repeatable accuracy is adequate for the tightest tolerances on the job. This is done through warm-up, probe cycles, and/or air-cut verification.',
   8);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7 — Floor Certification
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.oap_courses (slug, section_number, title, summary, estimated_minutes, sort_order)
VALUES ('floor-certification', 7, 'Floor Certification',
        'Mentor sign-off process, documentation requirements, recertification triggers, and credential portability.',
        60, 7)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_course_id FROM public.oap_courses WHERE slug = 'floor-certification';

SELECT id INTO v_quiz_id FROM public.oap_quizzes WHERE course_id = v_course_id LIMIT 1;
IF v_quiz_id IS NULL THEN
  INSERT INTO public.oap_quizzes (course_id, title, description, passing_score_pct)
  VALUES (v_course_id, 'Floor Certification Test',
          'Mentor walkthrough, sign-off authority, recertification triggers, and portable credential use.', 80)
  RETURNING id INTO v_quiz_id;
END IF;

IF NOT EXISTS (SELECT 1 FROM public.oap_quiz_questions WHERE quiz_id = v_quiz_id) THEN
  INSERT INTO public.oap_quiz_questions (quiz_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_quiz_id, 'multiple_choice',
   'Who is authorized to sign off an OAP walkthrough section as "Pass"?',
   '[{"key":"a","label":"Any coworker who has worked at the company for more than one year"},{"key":"b","label":"Only the designated OAP mentor or a supervisor who holds current mentor authorization for the relevant section"},{"key":"c","label":"The operator themselves after self-assessment"},{"key":"d","label":"The quality inspector assigned to the cell"}]',
   '["b"]',
   'OAP sign-off authority is restricted to designated mentors or supervisors holding current mentor authorization. Self-attestation is not permitted for walkthrough items.',
   1),
  (v_quiz_id, 'multiple_choice',
   'Which of the following events requires an operator to re-certify (full or partial OAP recertification)?',
   '[{"key":"a","label":"Working on a different machine model or machine type not covered in the original certification"},{"key":"b","label":"Taking a vacation of more than one week"},{"key":"c","label":"Changing from day shift to night shift"},{"key":"d","label":"Receiving a pay raise"}]',
   '["a"]',
   'Recertification is required when the scope of work changes: new machine type, new process, gap in practice beyond the recert window, or when a compliance audit identifies a competency gap. Shift changes and pay changes are not recert triggers.',
   2),
  (v_quiz_id, 'true_false',
   'An OAP certificate issued by Employer A is automatically valid at Employer B if both companies use the JobLine.ai platform.',
   '[{"key":"true","label":"True"},{"key":"false","label":"False"}]',
   '["false"]',
   'OAP certificates are portable and verifiable by any employer on the platform, but acceptance is at the receiving employer''s discretion. The employer may choose to honor the credential, require a gap assessment, or require a full or partial recertification based on their specific operations.',
   3),
  (v_quiz_id, 'multiple_choice',
   'An operator''s OAP certificate shows a "valid until" date of 3 months from now. What should happen?',
   '[{"key":"a","label":"Nothing — 3 months is plenty of time"},{"key":"b","label":"The employer should initiate the recertification process now to avoid a lapse, typically scheduling the walkthrough and any required training before the expiry date"},{"key":"c","label":"Wait until the certificate expires, then recertify"},{"key":"d","label":"The operator can self-extend the certificate for 90 days"}]',
   '["b"]',
   'Best practice is to begin the recert process well before expiry. A lapse in certification can remove the operator from qualified-operator rosters, creating a compliance gap and production disruption.',
   4),
  (v_quiz_id, 'multiple_choice',
   'During a walkthrough, the mentor marks an item as "Needs Practice." What does this mean for the operator?',
   '[{"key":"a","label":"The item is failed and the operator cannot proceed"},{"key":"b","label":"The operator demonstrated the skill but not yet at the proficiency level required for independent production. Additional supervised practice is scheduled and the item must be re-evaluated before it can be signed off as Pass"},{"key":"c","label":"The item is waived for this cycle"},{"key":"d","label":"The operator should study the lesson again and re-take the quiz"}]',
   '["b"]',
   '"Needs Practice" is a development indicator, not a fail. The operator is making progress but needs more supervised repetitions before independent sign-off. The mentor schedules follow-up evaluation.',
   5),
  (v_quiz_id, 'multiple_choice',
   'What must an operator do before their OAP certificate can be issued after completing all walkthrough sections?',
   '[{"key":"a","label":"Nothing — completion of walkthroughs is sufficient"},{"key":"b","label":"Pass all required section quizzes at or above the passing score, have all walkthrough items signed off as Pass by the designated mentor, and have the certificate issuance authorized by the mentor or supervisor"},{"key":"c","label":"Pay the $12 certificate fee only — the quiz is optional"},{"key":"d","label":"Submit a written essay to the quality department"}]',
   '["b"]',
   'Certificate issuance requires: (1) all section quizzes passed at ≥80%, (2) all required walkthrough items signed off as Pass, (3) mentor/supervisor authorization. The $12 fee then unlocks the verifiable PDF certificate.',
   6),
  (v_quiz_id, 'multiple_choice',
   'An employer wants to verify that a new hire''s OAP certificate is authentic and not expired. What is the fastest way?',
   '[{"key":"a","label":"Ask the employee to show you the PDF on their phone"},{"key":"b","label":"Call the previous employer"},{"key":"c","label":"Scan the QR code on the certificate or enter the Certificate ID at the public verification URL — the system shows real-time status including expiry and issuing organization"},{"key":"d","label":"Check the employee''s LinkedIn profile"}]',
   '["c"]',
   'The public /verify/:certId page (or QR scan) provides real-time certificate status: active/revoked/expired, program, issuing organization, and valid-until date. It cannot be faked or altered by the holder.',
   7),
  (v_quiz_id, 'true_false',
   'A supervisor can revoke an operator''s OAP certification without any documented reason.',
   '[{"key":"true","label":"True"},{"key":"false","label":"False"}]',
   '["false"]',
   'Revocation requires a documented reason and is recorded in the audit trail (oap_recert_events). Undocumented revocations undermine the integrity of the credential system and may violate employment agreements.',
   8);
END IF;

END $$;
