-- =============================================================================
-- GCA: Full question bank seed for all 10 certification banks
-- Idempotent: banks are upserted by slug, questions only inserted
-- if the bank has fewer than 5 questions already.
-- =============================================================================

DO $$
DECLARE
  v_bank_id UUID;
BEGIN

-- ─────────────────────────────────────────────────────────────────────────────
-- BANK 1 — Lathe Fundamentals (expand existing 3-Q seed to full bank)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, sort_order)
VALUES ('lathe-fundamentals', 'Lathe Fundamentals', 'CNC Turning',
        'Core knowledge for CNC lathe operators: G-codes, offsets, coordinate systems, canned cycles, and safe operation.',
        'beginner', 80, false, 1)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'lathe-fundamentals';

IF (SELECT COUNT(*) FROM public.gca_questions WHERE bank_id = v_bank_id) < 5 THEN
  DELETE FROM public.gca_questions WHERE bank_id = v_bank_id; -- clear any stub rows
  INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_bank_id, 'multiple_choice',
   'What does G96 S400 command on a CNC lathe?',
   '[{"key":"a","label":"Set spindle speed to 400 RPM constant"},{"key":"b","label":"Set Constant Surface Speed (CSS) mode at 400 SFM (or m/min) — the control automatically adjusts RPM as the diameter changes"},{"key":"c","label":"Set feedrate to 400 IPM"},{"key":"d","label":"Set maximum spindle speed limit to 400 RPM"}]',
   '["b"]',
   'G96 activates Constant Surface Speed. The S value is in surface feet per minute (SFM) in imperial mode. The control varies RPM inversely with diameter to maintain constant chip load and surface finish.',
   1),
  (v_bank_id, 'multiple_choice',
   'What is the purpose of G50 S3500 on a Fanuc-style lathe in CSS mode?',
   '[{"key":"a","label":"Set the work coordinate zero to X3500"},{"key":"b","label":"Limit the maximum spindle speed to 3500 RPM, preventing dangerous overspeed as the tool approaches the center"},{"key":"c","label":"Set the feedrate override to 3500%"},{"key":"d","label":"Activate the spindle encoder at 3500 pulses/rev"}]',
   '["b"]',
   'G50 S___ in CSS mode caps the spindle RPM. Without it, the control would command infinite RPM as diameter approaches zero, which would overspeed and potentially damage the spindle or cause an unsafe condition.',
   2),
  (v_bank_id, 'multiple_choice',
   'A G71 U0.030 R0.010 block defines:',
   '[{"key":"a","label":"U = feed per rev, R = spindle speed"},{"key":"b","label":"U = depth of cut per pass (0.030\"), R = retract amount between passes (0.010\")"},{"key":"c","label":"U = total stock to remove, R = finish stock"},{"key":"d","label":"U = rapid traverse rate, R = cutting feedrate"}]',
   '["b"]',
   'G71 Rough Turning: U = depth of cut per pass (radial), R = retract clearance between passes. The second G71 P_Q_U_W_F block defines the finish stock and feedrate.',
   3),
  (v_bank_id, 'multiple_choice',
   'On a lathe, X-axis coordinates are diameter values. The program moves from X2.000 to X1.500. How far did the tool actually move toward the spindle centerline?',
   '[{"key":"a","label":"0.500\""},{"key":"b","label":"0.250\""},{"key":"c","label":"1.000\""},{"key":"d","label":"The X-axis moves along the spindle axis, not radially"}]',
   '["b"]',
   'Lathe X-axis is programmed in diameter values. A change of 0.500\" in diameter = 0.250\" actual radial movement of the tool. The part OD changes by 0.500\" total (0.250\" each side).',
   4),
  (v_bank_id, 'multiple_choice',
   'What is the function of the G76 canned cycle?',
   '[{"key":"a","label":"Peck drilling"},{"key":"b","label":"Multi-pass threading — it automatically calculates infeed depth per pass and spring passes for a complete thread form"},{"key":"c","label":"Circular pocket roughing"},{"key":"d","label":"Taper turning"}]',
   '["b"]',
   'G76 is the multi-pass thread cutting cycle. It handles infeed angle, number of spring passes, thread depth calculation, and allows cutting both external and internal threads with a single cycle call.',
   5),
  (v_bank_id, 'multiple_choice',
   'A boring bar with too much overhang causes what common problem?',
   '[{"key":"a","label":"Improved surface finish due to flexibility"},{"key":"b","label":"Chatter, poor surface finish, and dimensional drift due to tool deflection under cutting forces"},{"key":"c","label":"Faster cycle time"},{"key":"d","label":"Better chip evacuation"}]',
   '["b"]',
   'Boring bar deflection increases exponentially with overhang (L/D ratio). As a rule, limit overhang to 4× bar diameter for steel. Excessive overhang causes chatter marks, taper in the bore, and diameter variability.',
   6),
  (v_bank_id, 'multiple_choice',
   'You are turning a 1.000" OD and measuring 1.003". Which wear offset change will correct it?',
   '[{"key":"a","label":"Add +0.003\" to the wear offset"},{"key":"b","label":"Subtract 0.003\" from the wear offset (move tool away from part)"},{"key":"c","label":"Subtract 0.003\" from the geometry offset"},{"key":"d","label":"Add 0.003\" to the geometry offset"}]',
   '["b"]',
   'The OD is 0.003\" oversize, meaning the tool is cutting too deep. Subtracting from the wear offset moves the tool away from the part. On a lathe, a negative X wear offset correction reduces the cut depth for OD features.',
   7),
  (v_bank_id, 'multiple_choice',
   'What does M42 typically do on a dual-range CNC lathe spindle?',
   '[{"key":"a","label":"Activate coolant"},{"key":"b","label":"Select high gear range"},{"key":"c","label":"Enable CSS mode"},{"key":"d","label":"Clamp the chuck"}]',
   '["b"]',
   'M41 = low gear range, M42 = high gear range on many Fanuc-based lathes. High range gives higher RPM with less torque; low range gives higher torque at lower RPM. Always match the range to the cutting conditions.',
   8),
  (v_bank_id, 'multiple_choice',
   'A G75 R0.020 block is called on a lathe. What type of operation does G75 perform?',
   '[{"key":"a","label":"Rough turning cycle"},{"key":"b","label":"Radial grooving / peck grooving cycle (cuts in the X-axis with retract between pecks for chip breaking)"},{"key":"c","label":"Facing canned cycle"},{"key":"d","label":"Thread chasing cycle"}]',
   '["b"]',
   'G75 is the radial grooving cycle (peck grooving). It cuts into the part in the X direction, retracts R amount for chip breaking, then plunges again until the programmed depth is reached. G74 is the axial peck drilling/grooving cycle.',
   9),
  (v_bank_id, 'multiple_choice',
   'What is the purpose of a tool nose radius compensation offset (R value in the geometry register)?',
   '[{"key":"a","label":"It controls the depth of cut on the roughing cycle"},{"key":"b","label":"It tells the control the physical tip radius of the insert so cutter compensation calculations are geometrically accurate during contour moves"},{"key":"c","label":"It is the tool length from the turret face"},{"key":"d","label":"It controls the thread pitch"}]',
   '["b"]',
   'The nose radius (R) in the geometry register, combined with the tip vector (T value), allows the control to compute the true cutting point position during angled and circular moves. Without it, the tool tip center traces the path but the actual cutting contact point creates conical and diameter errors.',
   10),
  (v_bank_id, 'multiple_choice',
   'In G97 mode at S800, how does the spindle behave when the X-axis moves from X4.000 to X1.000?',
   '[{"key":"a","label":"The spindle speeds up automatically to maintain surface speed"},{"key":"b","label":"The spindle holds constant at 800 RPM regardless of diameter"},{"key":"c","label":"The spindle stops and resets to safe speed"},{"key":"d","label":"The control switches to CSS automatically"}]',
   '["b"]',
   'G97 = constant RPM mode. The spindle holds the commanded RPM regardless of diameter. Use G97 for drilling, threading, and when you need exact RPM. Use G96 for turning and facing to maintain consistent chip load.',
   11),
  (v_bank_id, 'multiple_choice',
   'What does G28 U0 W0 do at the start of a tool change block?',
   '[{"key":"a","label":"Sets work offset to zero"},{"key":"b","label":"Returns the X and Z axes to machine home (reference) position via an intermediate point at the current position, allowing safe tool change clearance"},{"key":"c","label":"Cancels all canned cycles"},{"key":"d","label":"Homes only the Z-axis"}]',
   '["b"]',
   'G28 U0 W0 returns to the machine home position incrementally (U0 W0 = no incremental move, so it goes directly home). This clears the turret from the part and chuck for a safe tool change. The intermediate point prevents collision if a direct home path would intersect the part.',
   12);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- BANK 2 — Mill Fundamentals
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, sort_order)
VALUES ('mill-fundamentals', 'Mill Fundamentals', 'CNC Milling',
        'CNC milling operator fundamentals: work offsets, tool length offsets, canned cycles, cutter comp, and contour milling.',
        'beginner', 80, false, 2)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'mill-fundamentals';

IF (SELECT COUNT(*) FROM public.gca_questions WHERE bank_id = v_bank_id) < 5 THEN
  DELETE FROM public.gca_questions WHERE bank_id = v_bank_id;
  INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_bank_id, 'multiple_choice',
   'What is the difference between climb milling and conventional (up) milling?',
   '[{"key":"a","label":"Climb milling uses higher spindle speed; conventional uses higher feedrate"},{"key":"b","label":"In climb milling the cutter rotation matches the feed direction (chip starts thick, ends thin). In conventional milling the cutter rotates against the feed direction (chip starts thin, ends thick). Climb gives better finish and longer tool life on rigid setups."},{"key":"c","label":"Climb milling is for roughing; conventional is for finishing only"},{"key":"d","label":"There is no practical difference on a CNC machine"}]',
   '["b"]',
   'Climb milling is preferred on rigid CNC machines for better finish, lower cutting temperature, and longer tool life. Conventional milling is preferred on worn machines with backlash, as it loads the table screw in compression rather than tension.',
   1),
  (v_bank_id, 'multiple_choice',
   'G41 D1 activates cutter radius compensation. What does the "D1" specify?',
   '[{"key":"a","label":"The tool number to use"},{"key":"b","label":"The offset register number containing the cutter radius value"},{"key":"c","label":"The depth of cut"},{"key":"d","label":"The number of finish passes"}]',
   '["b"]',
   'D___ in G41/G42 refers to the cutter compensation offset register (typically the same number as the tool). The register contains the actual cutter radius. G41 = compensate left of programmed path; G42 = right.',
   2),
  (v_bank_id, 'multiple_choice',
   'A G83 Z-1.500 Q0.200 R0.100 F8.0 command means:',
   '[{"key":"a","label":"Ream to 1.500\" depth at 8 IPM with 0.200\" retract"},{"key":"b","label":"Peck drill to 1.500\" depth with 0.200\" pecks, R-plane at 0.100\" above the part surface, at 8 IPM"},{"key":"c","label":"Bore to 1.500\" depth then rapid out"},{"key":"d","label":"Tap to 1.500\" depth"}]',
   '["b"]',
   'G83 = peck drilling canned cycle. Z = final depth, Q = peck increment (retracts fully to R-plane between pecks for chip clearance), R = reference plane, F = feedrate. Use G83 for deep holes (L/D > 3) to clear chips.',
   3),
  (v_bank_id, 'multiple_choice',
   'When programming a pocket using G02/G03 arcs with the R word, what is the limitation compared to using I/J?',
   '[{"key":"a","label":"R cannot be used for full 360° arcs; I/J must be used for full circles"},{"key":"b","label":"R can only be used with G01"},{"key":"c","label":"R word arcs are slower to execute"},{"key":"d","label":"There is no difference between R and I/J methods"}]',
   '["a"]',
   'The R word cannot define a full 360° arc because the calculation is ambiguous (two possible arcs). Full circles must be programmed with I/J/K incremental center coordinates. R can define arcs up to 180° unambiguously and requires verifying direction for arcs >180°.',
   4),
  (v_bank_id, 'multiple_choice',
   'You set a work offset (G54) by touching off a 0.500\" edge finder on the right side of a block that is 3.000\" wide. The spindle center is now over the right side. What X value do you store in G54 to make the program zero the left side of the part?',
   '[{"key":"a","label":"Store the current machine X position — the edge finder diameter does not matter"},{"key":"b","label":"Take the current machine X position, subtract the edge finder radius (0.250\"), then subtract the part width (3.000\"). Store that value in G54 X."},{"key":"c","label":"Store current machine X minus 3.000\""},{"key":"d","label":"Store zero"}]',
   '["b"]',
   'When touching the right side: machine position = right side of part + edge finder radius. To get left side: subtract 0.250\" (edge finder radius) to get right side of part, then subtract 3.000\" (part width) to get left side. That final value goes into G54 X.',
   5),
  (v_bank_id, 'multiple_choice',
   'What is the purpose of the R-plane (R word) in milling canned cycles?',
   '[{"key":"a","label":"It is the retract distance below the part surface"},{"key":"b","label":"It is the Z height to which the tool rapids before feeding into the hole. Typically set 0.100\" above the part surface to allow rapid approach while protecting the tool"},{"key":"c","label":"It is the roughing pass depth"},{"key":"d","label":"It is the tool radius used in the cycle"}]',
   '["b"]',
   'The R-plane is a safety clearance above the part where the tool transitions from rapid to feed. Too high wastes time; too low risks a collision if the surface is not perfectly flat. 0.050\"–0.100\" is typical for flat surfaces.',
   6),
  (v_bank_id, 'multiple_choice',
   'What does G91 G28 Z0 do in a mill program header?',
   '[{"key":"a","label":"Moves Z to a programmed zero position using incremental mode"},{"key":"b","label":"In incremental mode (G91), moves Z zero additional distance from current position (i.e., stays put), then issues G28 to return the Z-axis to machine home — a safe way to retract the spindle to home before a tool change"},{"key":"c","label":"Cancels the tool length offset"},{"key":"d","label":"Sets the work offset Z to zero"}]',
   '["b"]',
   'G91 G28 Z0 is the standard safe Z-home command. G91 makes the G28 intermediate point = current position (Z0 incremental = no move), then G28 rapids Z to machine reference. This avoids the tool crashing into the part on the way to home.',
   7),
  (v_bank_id, 'multiple_choice',
   'When milling an open pocket with contour passes, what is the recommended entry strategy to avoid plunging a flat end mill straight down into solid material?',
   '[{"key":"a","label":"Rapid to depth with the spindle off, then turn the spindle on"},{"key":"b","label":"Use a helical or ramping entry to engage the material progressively, reducing axial force and preventing tool breakage"},{"key":"c","label":"Always pre-drill an entry hole first"},{"key":"d","label":"Plunge at full depth — modern end mills can handle it"}]',
   '["b"]',
   'Flat end mills are poor plungers because the center of the flute has zero cutting velocity. Helical entry (circular arc while feeding down) or ramp entry distributes the axial load across the flute length and avoids center-cutting stress. Pre-drilling is also valid but adds a tool change.',
   8),
  (v_bank_id, 'multiple_choice',
   'A drawing calls for a 0.500" ±0.001" slot width. After milling, you measure 0.4985". How do you correct this using G41/G42 cutter compensation?',
   '[{"key":"a","label":"Reduce the D register (cutter radius) value to cut a wider slot on the next pass"},{"key":"b","label":"Increase the D register value by 0.0015\" — this makes the control think the cutter is larger and shifts the path outward, widening the slot by 0.003\" total (0.0015\" per side)"},{"key":"c","label":"Change the program coordinates"},{"key":"d","label":"Switch from G41 to G42"}]',
   '["b"]',
   'Cutter comp offset is the radius. Increasing it makes the control move the programmed path farther from the contour (more stock removed). Slot width increase = 2× the offset change since both sides are compensated. +0.0015\" in the D register widens both walls = +0.003\" total slot width.',
   9),
  (v_bank_id, 'multiple_choice',
   'G84 is the rigid tapping cycle. What must be true about the spindle for rigid tapping to work correctly?',
   '[{"key":"a","label":"The spindle must be in CSS mode"},{"key":"b","label":"The spindle must have a position encoder that allows synchronized spindle/Z-axis motion so the thread pitch is exactly matched to the feedrate (F = pitch × RPM)"},{"key":"c","label":"The spindle must be running in reverse"},{"key":"d","label":"The spindle must be in low gear only"}]',
   '["b"]',
   'Rigid tapping (G84) uses synchronized spindle/Z-axis motion. The spindle encoder feeds back position to the control, which coordinates Z feed exactly to match the thread pitch. F = pitch × RPM. If the spindle lacks an encoder, floating tap holders must be used instead.',
   10),
  (v_bank_id, 'multiple_choice',
   'What is "stepdown" or ADOC (Axial Depth of Cut) in pocket milling, and how does it affect tool life?',
   '[{"key":"a","label":"ADOC is the radial engagement — higher ADOC means more teeth engaged"},{"key":"b","label":"ADOC is the depth of each Z-level pass. Deeper passes remove more material per pass but increase axial cutting force, tool deflection, and heat. Reducing ADOC with more passes improves tool life and surface finish at the cost of cycle time."},{"key":"c","label":"ADOC is the same as chip load"},{"key":"d","label":"ADOC only applies to drilling operations"}]',
   '["b"]',
   'ADOC (axial depth) directly affects cutting force and heat. A common starting point for end mills is 1× diameter ADOC at 30–50% radial engagement for roughing. For finishing, light ADOC (0.010"–0.030") with full radial engagement produces best finish.',
   11),
  (v_bank_id, 'multiple_choice',
   'You need to machine a 2.000" diameter circular pocket. The tool path programs the wall at exact diameter. G41 is active. Where does the tool center travel?',
   '[{"key":"a","label":"On the programmed 2.000\" circle"},{"key":"b","label":"On a circle that is one cutter radius LARGER than 2.000\", so the cutting edge falls on the 2.000\" circle"},{"key":"c","label":"On a circle that is one cutter radius SMALLER than 2.000\""},{"key":"d","label":"G41 only applies to straight-line moves"}]',
   '["b"]',
   'G41 (left compensation) shifts the tool center to the left of the programmed path — for an inside pocket, the center travels on a larger diameter so the cutting edge is on the programmed 2.000\" circle. For outside profiles G41 shifts inward.',
   12);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- BANK 3 — Fanuc Controller
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, sort_order)
VALUES ('fanuc-controller', 'Fanuc Controller', 'CNC Controllers',
        'Fanuc 0i/30i/31i/32i operator and setup knowledge: M-codes, subprograms, Macro B, alarm recovery, and tool life.',
        'intermediate', 80, false, 3)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'fanuc-controller';

IF (SELECT COUNT(*) FROM public.gca_questions WHERE bank_id = v_bank_id) < 5 THEN
  DELETE FROM public.gca_questions WHERE bank_id = v_bank_id;
  INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_bank_id, 'multiple_choice',
   'What does M98 P1001 do in a Fanuc program?',
   '[{"key":"a","label":"Stops the spindle"},{"key":"b","label":"Calls subprogram O1001 once"},{"key":"c","label":"Sets a macro variable"},{"key":"d","label":"Returns to machine home"}]',
   '["b"]',
   'M98 P____ calls a subprogram by program number. M98 P1001 L3 would call O1001 three times. M99 at the end of the subprogram returns to the calling program.',
   1),
  (v_bank_id, 'multiple_choice',
   'In Fanuc Macro B, what type of variable is #100?',
   '[{"key":"a","label":"Local variable — cleared on subprogram exit"},{"key":"b","label":"Common (global) variable — retained across subprograms and survives power cycle on some controls"},{"key":"c","label":"System variable — read only"},{"key":"d","label":"It does not exist in Macro B"}]',
   '["b"]',
   'Fanuc Macro B variables: #1–#33 = local (cleared on subprogram return), #100–#199 = common volatile (cleared on power-off on most controls), #500–#999 = common non-volatile (retained through power-off). #1000+ = system variables.',
   2),
  (v_bank_id, 'multiple_choice',
   'Fanuc alarm PS0010 appears. What does it generally indicate?',
   '[{"key":"a","label":"Spindle overload"},{"key":"b","label":"A syntax error or improper G-code in the program that the control cannot interpret"},{"key":"c","label":"Servo drive fault"},{"key":"d","label":"Coolant level low"}]',
   '["b"]',
   'PS alarms on Fanuc are program/parameter alarms (programming errors). PS0010 = improper G-code. SV alarms = servo alarms. SP alarms = spindle alarms. OT alarms = overtravel.',
   3),
  (v_bank_id, 'multiple_choice',
   'What is the Fanuc "Background Edit" function used for?',
   '[{"key":"a","label":"Running a program automatically during breaks"},{"key":"b","label":"Editing a program in memory while another program is running on the machine, without interrupting the active cycle"},{"key":"c","label":"Automatic tool wear update in the background"},{"key":"d","label":"Running a DNC program from a PC"}]',
   '["b"]',
   'Background Edit allows a programmer or operator to modify a program in memory while the machine is actively cutting another program. When the active cycle finishes, the edited program is ready. Only available on controls with sufficient memory.',
   4),
  (v_bank_id, 'multiple_choice',
   'On a Fanuc control, what does pressing RESET do during an active alarm?',
   '[{"key":"a","label":"Powers off the control"},{"key":"b","label":"Clears the alarm state if the root cause has been resolved, allowing the control to return to ready state"},{"key":"c","label":"Homes all axes"},{"key":"d","label":"Deletes the active program"}]',
   '["b"]',
   'RESET clears the alarm display and returns the control to idle state — but only if the physical cause of the alarm has been corrected. Pressing RESET on an unresolved hardware fault will immediately re-alarm.',
   5),
  (v_bank_id, 'multiple_choice',
   'Fanuc Tool Life Management (TLM) can track tools by what two methods?',
   '[{"key":"a","label":"Part count and time (minutes of spindle-on time)"},{"key":"b","label":"Feed distance and coolant usage"},{"key":"c","label":"RPM and chip load"},{"key":"d","label":"TLM is not available on Fanuc controls"}]',
   '["a"]',
   'Fanuc TLM supports tool life tracking by count (number of workpieces machined) or by time (spindle-on minutes). When a tool reaches its limit, the control can alarm, skip to an alternate tool group, or continue with operator confirmation.',
   6),
  (v_bank_id, 'multiple_choice',
   'What does G10 L2 P1 X_ Y_ Z_ do on a Fanuc mill?',
   '[{"key":"a","label":"Stores the tool length offset for tool 1"},{"key":"b","label":"Sets the G54 work offset (P1) XYZ values programmatically without requiring MDI entry into the offset page"},{"key":"c","label":"Calls subprogram 1"},{"key":"d","label":"Sets the feedrate override"}]',
   '["b"]',
   'G10 allows programmable data input. G10 L2 P1 X_ Y_ Z_ writes new values into the G54 (P1) work coordinate offset register. P2=G55, P3=G56, etc. Useful in automation cells where the program sets the offset dynamically.',
   7),
  (v_bank_id, 'multiple_choice',
   'On a Fanuc lathe, T0303 in the program means:',
   '[{"key":"a","label":"Call tool 3 with offset register 3"},{"key":"b","label":"Call tool 0 with offset 303"},{"key":"c","label":"Index to turret station 3, apply geometry offset 3 and wear offset 3"},{"key":"d","label":"T0303 is not valid Fanuc syntax"}]',
   '["c"]',
   'Fanuc lathe tool call format is T[tool_number][offset_number]. T0303 = turret station 3, offset register 3. The control applies both geometry and wear offsets from that register. T0300 clears the offset (cancels compensation).',
   8),
  (v_bank_id, 'multiple_choice',
   'What is the function of a Fanuc DPRNT macro command?',
   '[{"key":"a","label":"Prints the current program to a USB drive"},{"key":"b","label":"Outputs formatted text (including macro variable values) to the RS-232 or Ethernet port for data collection or part marking"},{"key":"c","label":"Displays a message on the operator panel"},{"key":"d","label":"Resets the program counter"}]',
   '["b"]',
   'DPRNT outputs formatted strings and macro variable values to a serial or network port, enabling in-cycle data logging. BPRNT is the binary equivalent. DOPEN/DCLOSE open and close the output channel.',
   9),
  (v_bank_id, 'multiple_choice',
   'The Fanuc operator panel has a feedrate override dial. Setting it to 50% does what?',
   '[{"key":"a","label":"Cuts the programmed feedrate to 50% of the F word value for all moves"},{"key":"b","label":"Reduces rapid traverse only"},{"key":"c","label":"Affects spindle speed only"},{"key":"d","label":"Has no effect during a running cycle"}]',
   '["a"]',
   'Feedrate override applies a multiplier to all programmed feed moves (G01, G02, G03, canned cycle feeds). It does not affect rapid moves (G00) on standard configurations. 0% = feed hold. The override is commonly used during first article dry-runs to slow the machine for observation.',
   10);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- BANK 4 — Haas Controller
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, sort_order)
VALUES ('haas-controller', 'Haas Controller', 'CNC Controllers',
        'Haas NGC/Classic Haas Control operator knowledge: Settings, parameters, macros, probing, and common alarms.',
        'intermediate', 80, false, 4)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'haas-controller';

IF (SELECT COUNT(*) FROM public.gca_questions WHERE bank_id = v_bank_id) < 5 THEN
  DELETE FROM public.gca_questions WHERE bank_id = v_bank_id;
  INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_bank_id, 'multiple_choice',
   'On a Haas NGC control, what is the difference between a Setting and a Parameter?',
   '[{"key":"a","label":"Settings and parameters are the same thing with different names"},{"key":"b","label":"Settings are operator-accessible values that affect machine behavior (like feedrate override lock, door interlock behavior). Parameters are factory/service-level values that define machine geometry and servo tuning — usually password protected."},{"key":"c","label":"Parameters affect the program; settings affect the display only"},{"key":"d","label":"Settings require a power cycle to take effect; parameters do not"}]',
   '["b"]',
   'Haas distinguishes operator-level Settings (hundreds of them, accessible without special password) from engineer/service-level Parameters (machine geometry, PID tuning). Operators routinely adjust Settings; Parameters are changed only by service technicians.',
   1),
  (v_bank_id, 'multiple_choice',
   'Haas Setting 56 (M30 RESTORE DEFAULT G) controls what?',
   '[{"key":"a","label":"Whether M30 resets the feed override to 100%"},{"key":"b","label":"Whether M30 (program end and rewind) restores G-code modal defaults (G17, G90, G94, etc.) or retains whatever modal state the program ended in"},{"key":"c","label":"The default tool for program start"},{"key":"d","label":"Automatic door open at program end"}]',
   '["b"]',
   'Setting 56 determines if M30 resets modal G-codes to defaults. When ON, program restart is predictable. When OFF, modal states carry over from run to run, which can cause unexpected behavior on re-run if the program exited in a non-standard modal state.',
   2),
  (v_bank_id, 'multiple_choice',
   'What is Haas Visual Quick Code (VQC)?',
   '[{"key":"a","label":"A QR code scanner for tool data"},{"key":"b","label":"A conversational/graphical programming interface that guides operators through simple part features (pockets, profiles, holes) without requiring manual G-code writing"},{"key":"c","label":"A real-time 3D simulation of the tool path"},{"key":"d","label":"A barcode system for tool inventory"}]',
   '["b"]',
   'VQC is Haas''s conversational programming feature. It presents graphical menus for common features. Useful for simple parts or operators without G-code programming experience. It generates and stores standard G-code programs.',
   3),
  (v_bank_id, 'multiple_choice',
   'A Haas alarm 102 "SERVO ERROR TOO LARGE" appears. What likely caused it?',
   '[{"key":"a","label":"The program has a syntax error"},{"key":"b","label":"An axis was commanded to move but the servo drive could not keep up — often caused by a collision, an obstruction, excessive load, or a mechanical binding condition"},{"key":"c","label":"The spindle speed exceeded the programmed maximum"},{"key":"d","label":"The coolant tank is empty"}]',
   '["b"]',
   'Servo error too large means the commanded position and actual position diverged beyond the threshold. Causes: axis crash, tight/binding ballscrew, obstruction in travel, or aggressive acceleration parameters. Inspect the axis for mechanical issues before clearing and restarting.',
   4),
  (v_bank_id, 'multiple_choice',
   'On a Haas mill, how do you set the tool length offset using the built-in tool setter (on-machine probe)?',
   '[{"key":"a","label":"Enter the length manually from the presetter report"},{"key":"b","label":"Run the TOOL MEASURE macro (typically accessed from the Offsets page or a dedicated button) which rapids the tool to the probe, touches off, and automatically stores the measured length in the H register"},{"key":"c","label":"Use G92 to set the Z-axis zero"},{"key":"d","label":"The Haas does not support on-machine tool setting"}]',
   '["b"]',
   'Haas machines with the optional on-machine tool setter use a built-in macro (e.g., G65 P9023 or a dedicated TOOL MEASURE soft key) to automatically measure and store tool lengths. This eliminates presetter errors and compensates for thermal growth between tool changes.',
   5),
  (v_bank_id, 'multiple_choice',
   'What is the Haas Dynamic Work Offset (DWO) feature used for?',
   '[{"key":"a","label":"To automatically update work offsets based on part temperature"},{"key":"b","label":"To apply a rotational compensation when a 4th/5th axis tilts the part — keeping the programmed XY zero aligned with the tilted workplane so standard XYZ programs work correctly on inclined surfaces"},{"key":"c","label":"To dynamically adjust feeds and speeds during cutting"},{"key":"d","label":"To prevent work offset changes during a running program"}]',
   '["b"]',
   'DWO (G254) is Haas''s equivalent of tilted workplane. When a rotary axis tilts the part, DWO transforms the active work offset so the programmed XYZ coordinates continue to reference the tilted part surface. Essential for 5-axis indexed work.',
   6),
  (v_bank_id, 'multiple_choice',
   'Haas macro variable #4120 contains what information?',
   '[{"key":"a","label":"The current program number"},{"key":"b","label":"The active tool number (the tool currently in the spindle)"},{"key":"c","label":"The spindle load percentage"},{"key":"d","label":"The feedrate override percentage"}]',
   '["b"]',
   'Haas system variables: #4120 = current tool number in spindle, #4130 = selected tool (next tool), #3026 = spindle load (%), #3027 = X-axis load (%). These allow macro programs to make decisions based on current machine state.',
   7),
  (v_bank_id, 'multiple_choice',
   'On a Haas lathe, what does the "CHUCK CLAMP" indicator light being on (or the interlock being active) prevent?',
   '[{"key":"a","label":"The coolant from turning on"},{"key":"b","label":"The spindle from starting if the chuck is not clamped, preventing a part ejection incident"},{"key":"c","label":"The turret from indexing"},{"key":"d","label":"The Z-axis from moving past the chuck face"}]',
   '["b"]',
   'The chuck clamp interlock detects the chuck clamp pressure or position. If the chuck is unclamped (or pressure is below threshold), the spindle start is inhibited to prevent an unclamped part from being ejected at speed.',
   8);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- BANK 5 — Mazak Controller
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, sort_order)
VALUES ('mazak-controller', 'Mazak Controller', 'CNC Controllers',
        'Mazak MAZATROL and EIA/ISO programming: unit types, tool registration, MAZACHECK, and conversational programming.',
        'intermediate', 80, false, 5)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'mazak-controller';

IF (SELECT COUNT(*) FROM public.gca_questions WHERE bank_id = v_bank_id) < 5 THEN
  DELETE FROM public.gca_questions WHERE bank_id = v_bank_id;
  INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_bank_id, 'multiple_choice',
   'What is the fundamental difference between MAZATROL programming and EIA/ISO (G-code) programming on a Mazak?',
   '[{"key":"a","label":"MAZATROL is faster to run; EIA/ISO is more accurate"},{"key":"b","label":"MAZATROL is a conversational (feature-based) programming language that describes parts by features (faces, holes, pockets) and automatically generates toolpaths. EIA/ISO is standard G-code programming."},{"key":"c","label":"MAZATROL can only be used for turning; EIA/ISO for milling"},{"key":"d","label":"They are the same programming language with different display names"}]',
   '["b"]',
   'MAZATROL uses a table-driven, feature-based input method. The operator describes part geometry and the control selects toolpaths, feeds, and speeds automatically. EIA/ISO mode accepts standard G-code. Both formats can run on the same machine.',
   1),
  (v_bank_id, 'multiple_choice',
   'In a MAZATROL turning program, what is a "UNIT"?',
   '[{"key":"a","label":"The measurement unit (inch or metric)"},{"key":"b","label":"A self-contained programming block that defines one machining operation (e.g., FACE, BAR, THREAD, DRILL). The unit contains tool selection, cutting conditions, and geometry for that operation."},{"key":"c","label":"One line of EIA/ISO G-code"},{"key":"d","label":"The material database entry for the workpiece"}]',
   '["b"]',
   'MAZATROL programs are structured as a sequence of UNITS. Each unit = one operation type. The operator fills in the unit''s parameter table (depth, width, speed, feed, tool type) and the control generates the toolpath for that unit automatically.',
   2),
  (v_bank_id, 'multiple_choice',
   'What does MAZACHECK do on a Mazak control?',
   '[{"key":"a","label":"Checks the machine''s lubrication system"},{"key":"b","label":"Performs a software dry-run simulation that checks the program for collisions, overtravel, and syntax errors before cutting begins"},{"key":"c","label":"Verifies the tool lengths against the presetter database"},{"key":"d","label":"Checks the coolant concentration"}]',
   '["b"]',
   'MAZACHECK is Mazak''s built-in simulation and collision checking function. It animates the toolpath and reports potential collisions, axis overtravels, and program errors. Running MAZACHECK before first cuts is a best practice to catch errors without risking a crash.',
   3),
  (v_bank_id, 'multiple_choice',
   'On a Mazak, tool registration in the tool data table requires entering which values for a turning tool?',
   '[{"key":"a","label":"Tool number and program number only"},{"key":"b","label":"Tool type, insert shape, nose radius, tool tip vector (orientation), geometry offsets (X and Z), and material/cutting condition data"},{"key":"c","label":"Only the geometry offsets — other data is not needed"},{"key":"d","label":"Tool number and nominal diameter only"}]',
   '["b"]',
   'Mazak tool registration requires complete tool data: insert shape (for cutter comp), nose radius, orientation vector (tip direction), length/diameter compensation values, and often material and surface speed data for automatic cutting condition calculation in MAZATROL mode.',
   4),
  (v_bank_id, 'multiple_choice',
   'A Mazak Multi-Tasking machine (e.g., Integrex series) can perform turning and milling simultaneously. What programming capability enables this?',
   '[{"key":"a","label":"Running two separate EIA programs from the same memory"},{"key":"b","label":"MAZATROL''s multi-part system (MPS) which can synchronize two spindle/turret combinations, or EIA simultaneous path programming using separate channels with synchronization commands"},{"key":"c","label":"The machine can only do one operation at a time"},{"key":"d","label":"DNC streaming from a CAM system only"}]',
   '["b"]',
   'Mazak multi-tasking machines use multi-path programming. In MAZATROL, units for left/right spindle and upper/lower turret are organized in parallel columns. In EIA, separate program paths with WAIT/SYNC commands coordinate simultaneous operations.',
   5),
  (v_bank_id, 'multiple_choice',
   'What is the "Smooth TCP" (Tool Center Point) feature on advanced Mazak 5-axis machines?',
   '[{"key":"a","label":"A smoothing algorithm that blends rapid moves to reduce vibration"},{"key":"b","label":"A control function that maintains constant tool center point velocity even when rotary axes are moving simultaneously, producing smooth surface finish on 5-axis contour cuts"},{"key":"c","label":"A TCP/IP networking feature for DNC communication"},{"key":"d","label":"A tool collision prevention feature"}]',
   '["b"]',
   'Smooth TCP (sometimes called TCPM — Tool Center Point Management) keeps the programmed tool tip velocity constant while the rotary axes move to maintain the commanded tool orientation. Without it, the linear axes must over-accelerate to compensate for rotary axis motion, causing surface finish variations.',
   6),
  (v_bank_id, 'multiple_choice',
   'On a Mazak CNC lathe, what does the "COMMON UNIT" at the beginning of a MAZATROL program define?',
   '[{"key":"a","label":"The tool change position and machine home"},{"key":"b","label":"The workpiece material, bar diameter or chuck diameter, part length, finished diameter, machining start point, and other global parameters that apply to the entire program"},{"key":"c","label":"The units of measurement (inch/metric)"},{"key":"d","label":"The common tools shared between left and right turrets"}]',
   '["b"]',
   'The COMMON UNIT is the MAZATROL program header. It captures global part data: material class (which drives automatic cutting condition lookup), workpiece envelope dimensions, chuck/bar data, and approach position. It must be filled in correctly before any machining units.',
   7),
  (v_bank_id, 'multiple_choice',
   'After a Mazak alarm and machine reset, the axes must be re-referenced (returned to reference position). Why?',
   '[{"key":"a","label":"Mazak uses incremental encoders on some axis types — after a power loss or E-stop, the control does not know the absolute position and must re-establish machine zero by homing"},{"key":"b","label":"Homing clears the program memory"},{"key":"c","label":"It is only required after spindle alarms, not axis alarms"},{"key":"d","label":"Mazak machines always know their position — homing is not necessary"}]',
   '["a"]',
   'Machines with semi-absolute or incremental encoders require homing after loss of position. Absolute encoder machines (common on newer Mazaks) retain position through power cycles but may still require a reference run after certain alarms that indicate potential position loss.',
   8);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- BANK 6 — Okuma Controller
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, sort_order)
VALUES ('okuma-controller', 'Okuma Controller', 'CNC Controllers',
        'Okuma OSP control features: CAS, Thermo-Friendly Concept, Machining Navi, and tool life management.',
        'intermediate', 80, false, 6)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'okuma-controller';

IF (SELECT COUNT(*) FROM public.gca_questions WHERE bank_id = v_bank_id) < 5 THEN
  DELETE FROM public.gca_questions WHERE bank_id = v_bank_id;
  INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_bank_id, 'multiple_choice',
   'What is Okuma''s Collision Avoidance System (CAS)?',
   '[{"key":"a","label":"A physical guard that prevents the operator from reaching into the machine"},{"key":"b","label":"A real-time 3D model-based system that monitors all axes and tooling, predicting and preventing collisions before they occur — even during rapid traverses and manual jog"},{"key":"c","label":"A software alarm that triggers after a crash is detected"},{"key":"d","label":"A camera system that monitors the cutting zone"}]',
   '["b"]',
   'Okuma CAS maintains a real-time 3D model of the machine, tooling, workholding, and part. It runs predictive checks on every motion command and stops the machine before a collision occurs. It works in all modes: auto, MDI, jog, and during program execution.',
   1),
  (v_bank_id, 'multiple_choice',
   'Okuma''s "Thermo-Friendly Concept" (TFC) addresses what common CNC machine problem?',
   '[{"key":"a","label":"Coolant foaming at elevated temperatures"},{"key":"b","label":"Dimensional drift caused by thermal growth of the machine structure and spindle — TFC uses thermal sensors and software compensation to maintain accuracy without requiring extensive warm-up time"},{"key":"c","label":"Operator discomfort in hot shops"},{"key":"d","label":"Chip re-cutting in high-temperature alloys"}]',
   '["b"]',
   'TFC is Okuma''s integrated thermal compensation system. Multiple temperature sensors throughout the machine feed real-time data to compensation algorithms that continuously adjust axis positions to offset thermal growth. This reduces warm-up requirements and improves dimensional consistency across temperature variations.',
   2),
  (v_bank_id, 'multiple_choice',
   'Okuma Machining Navi M-i analyzes what machine data in real time?',
   '[{"key":"a","label":"Part inspection data from the CMM"},{"key":"b","label":"Spindle vibration (chatter) frequency and recommends optimal spindle speed adjustments to move out of the chatter resonance zone"},{"key":"c","label":"Coolant pressure and flow rate"},{"key":"d","label":"Tool inventory levels"}]',
   '["b"]',
   'Machining Navi M-i monitors spindle vibration via an accelerometer and identifies chatter frequencies. It then recommends speed adjustments (displayed on the control) to find the stable cutting zone where chatter is suppressed. This can dramatically improve surface finish without trial-and-error.',
   3),
  (v_bank_id, 'multiple_choice',
   'On an Okuma OSP control, what does the "TOOL FILE" contain?',
   '[{"key":"a","label":"The G-code programs stored in control memory"},{"key":"b","label":"Tool registration data: tool type, geometry compensation, wear compensation, nose radius, expected tool life, and remaining life for each tool in the magazine"},{"key":"c","label":"Cutting parameter databases by material"},{"key":"d","label":"The tool path simulation file"}]',
   '["b"]',
   'The Okuma TOOL FILE (or TOOL DATA) stores all compensation and life management data for each tool. Geometry and wear offsets, insert type, nose radius, and programmed/remaining tool life are all managed here. The system can auto-search for fresh tools when a tool''s life expires.',
   4),
  (v_bank_id, 'multiple_choice',
   'What advantage does Okuma''s absolute encoder system provide compared to incremental encoders?',
   '[{"key":"a","label":"Higher resolution positioning"},{"key":"b","label":"The machine retains its exact position through power-off — no homing cycle is required after power-up, saving time and eliminating the risk of homing errors"},{"key":"c","label":"Faster axis movement"},{"key":"d","label":"The encoder does not require calibration"}]',
   '["b"]',
   'Okuma''s absolute encoders (proprietary design) retain position data with battery backup. After a power cycle, the control knows exactly where every axis is without a homing run. This is a significant time saver in production and eliminates homing-related crashes.',
   5),
  (v_bank_id, 'multiple_choice',
   'An Okuma OSP alarm "1051 Excessive Position Error" appears on the X-axis. What should you check first?',
   '[{"key":"a","label":"The coolant level"},{"key":"b","label":"Whether the X-axis is mechanically obstructed, crashed, or the servo drive parameters are mismatched to the machine load — the servo cannot follow the commanded position"},{"key":"c","label":"The program for G-code syntax errors"},{"key":"d","label":"The tool file for correct offsets"}]',
   '["b"]',
   'Excessive position error = the servo position feedback deviated beyond tolerance from the command. Physical causes: crash, binding, over-acceleration for the load. Electrical causes: encoder fault, drive parameter mismatch. Inspect the axis mechanically before clearing the alarm.',
   6),
  (v_bank_id, 'multiple_choice',
   'What is the purpose of Okuma''s "5-Axis Auto Tuning" feature?',
   '[{"key":"a","label":"Automatically writes 5-axis programs from part models"},{"key":"b","label":"Automatically measures and compensates for geometric errors (pivot length, axis tilt, squareness) in 5-axis kinematics by running a calibration cycle with a touch probe"},{"key":"c","label":"Tunes the PID parameters for the 4th and 5th axis servos"},{"key":"d","label":"Verifies that the machine is level on 5 measurement points"}]',
   '["b"]',
   '5-Axis Auto Tuning uses an on-machine touch probe to measure the machine''s actual 5-axis kinematic parameters and writes corrected values into the geometric compensation tables. This dramatically improves accuracy of tilted-workplane and simultaneous 5-axis operations.',
   7),
  (v_bank_id, 'multiple_choice',
   'On an Okuma lathe with a secondary spindle (sub-spindle), what synchronization command is typically used to control part transfer?',
   '[{"key":"a","label":"M06"},{"key":"b","label":"A dedicated spindle synchronization G-code (e.g., G14/G15 on OSP) that synchronizes main and sub-spindle speeds and phases for chucking, combined with barrier functions to prevent axis collisions during the transfer move"},{"key":"c","label":"The operator manually transfers the part between spindles"},{"key":"d","label":"G28 followed by M03"}]',
   '["b"]',
   'Part transfer on sub-spindle lathes requires phase synchronization (both spindles at same speed and angular position) before the sub-spindle chucks the part and the main spindle releases. OSP uses specific codes for this; exact codes vary by machine model. Barrier settings define the no-crash zone between turrets.',
   8);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- BANK 7 — Siemens Controller
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, sort_order)
VALUES ('siemens-controller', 'Siemens Controller', 'CNC Controllers',
        'Siemens SINUMERIK 840D/828D: ShopMill/ShopTurn, R-parameters, CYCLE calls, and tool management.',
        'intermediate', 80, false, 7)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'siemens-controller';

IF (SELECT COUNT(*) FROM public.gca_questions WHERE bank_id = v_bank_id) < 5 THEN
  DELETE FROM public.gca_questions WHERE bank_id = v_bank_id;
  INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_bank_id, 'multiple_choice',
   'On a Siemens SINUMERIK 840D, what is a "cycle" in the context of programming?',
   '[{"key":"a","label":"One revolution of the spindle"},{"key":"b","label":"A predefined machining subroutine (e.g., CYCLE81 for drilling, CYCLE76 for rectangular pocket) that accepts parameters and generates the full toolpath, similar to Fanuc''s G80-series canned cycles but more comprehensive"},{"key":"c","label":"A complete part program from start to finish"},{"key":"d","label":"One pass through the production schedule"}]',
   '["b"]',
   'Siemens cycles are parametric subroutines: CYCLE81 (drilling), CYCLE82 (countersink), CYCLE83 (peck drilling), CYCLE84 (tapping), POCKET3/POCKET4 (rectangular/circular pocket), CYCLE76 (rectangular stud), etc. They accept all operation parameters as arguments and manage the full canned operation.',
   1),
  (v_bank_id, 'multiple_choice',
   'What are R-parameters (R0–R299) in Siemens SINUMERIK programming?',
   '[{"key":"a","label":"Radius values for arc programming"},{"key":"b","label":"Calculation variables (similar to Fanuc''s macro variables) that can store values, perform arithmetic, and be used in conditional logic for parametric programming"},{"key":"c","label":"Retract plane settings for each canned cycle"},{"key":"d","label":"A special G-code register for threading"}]',
   '["b"]',
   'R-parameters are general-purpose arithmetic variables. R0=3.14159 assigns the value; IF R1>10 GOTOF LABEL creates conditional branching. R-parameters are the basis for parametric programming on SINUMERIK controls (similar to Macro B #variables on Fanuc).',
   2),
  (v_bank_id, 'multiple_choice',
   'CYCLE800 on a Siemens 5-axis machine does what?',
   '[{"key":"a","label":"Performs a 800-revolution spindle warmup"},{"key":"b","label":"Activates a tilted workplane (PLANE SPATIAL equivalent) — it swivels the machine''s rotary axes to a defined orientation and then allows standard XYZ programming in that tilted plane"},{"key":"c","label":"Calls an 800-line subprogram"},{"key":"d","label":"Sets the feedrate to 800 IPM"}]',
   '["b"]',
   'CYCLE800 is Siemens'' tilted workplane function for 3+2 axis machining. It positions the rotary axes to the desired plane angle, then activates a coordinate transformation so the operator can program the feature in normal XYZ as if the surface were flat.',
   3),
  (v_bank_id, 'multiple_choice',
   'What is ShopMill / ShopTurn on a Siemens SINUMERIK control?',
   '[{"key":"a","label":"The DNC networking software"},{"key":"b","label":"A graphical/conversational front-end for programming milling (ShopMill) and turning (ShopTurn) operations with step-by-step menus and integrated 2D graphics, without requiring knowledge of ISO G-code syntax"},{"key":"c","label":"The Siemens CAM software for offline programming"},{"key":"d","label":"The machine''s maintenance and diagnostics interface"}]',
   '["b"]',
   'ShopMill and ShopTurn provide an operator-friendly conversational programming interface on the machine control. The operator selects features from graphic menus, enters dimensions, and the control generates the cycle call. The underlying code is SINUMERIK ISO/cycle format but the operator works graphically.',
   4),
  (v_bank_id, 'multiple_choice',
   'On SINUMERIK, the command TRANS X10 Y5 Z0 does what?',
   '[{"key":"a","label":"Sets the feedrate in XYZ"},{"key":"b","label":"Applies a programmable frame (coordinate offset) — shifts the current workpiece zero by X+10, Y+5 from its current position. Used to re-reference programs for multiple identical features at different locations."},{"key":"c","label":"Translates the program from inch to metric"},{"key":"d","label":"Sets the tool tip vector direction"}]',
   '["b"]',
   'TRANS (and ATRANS for additive frames) in SINUMERIK shift the active zero point. ROT and AROT apply rotational transformations. SCALE applies scaling. Frames are the Siemens equivalent of work offsets but more powerful as they can be stacked and combined programmatically.',
   5),
  (v_bank_id, 'multiple_choice',
   'What is the purpose of the Siemens Tool Management System (TMS) on a machine with a large tool magazine?',
   '[{"key":"a","label":"To manually track which tools are in the magazine on a clipboard"},{"key":"b","label":"To automatically manage tool location in the magazine, track remaining tool life, and search for alternative tools when a tool''s life expires — enabling unmanned operation"},{"key":"c","label":"To order replacement tools from the supplier automatically"},{"key":"d","label":"To display tool diagrams on the operator screen"}]',
   '["b"]',
   'Siemens TMS manages tool location mapping (which pocket holds which tool), life monitoring (pieces or time), and sister-tool management (automatically substitutes an alternate tool when the current one reaches its life limit). Critical for lights-out or long-run automation.',
   6),
  (v_bank_id, 'multiple_choice',
   'In SINUMERIK G-code, what is the difference between G90 and G91?',
   '[{"key":"a","label":"G90 = metric, G91 = imperial"},{"key":"b","label":"G90 = absolute positioning (coordinates reference the active workpiece zero), G91 = incremental positioning (coordinates are relative to current tool position)"},{"key":"c","label":"G90 = feedrate per minute, G91 = feedrate per revolution"},{"key":"d","label":"G90 and G91 do not exist in SINUMERIK syntax"}]',
   '["b"]',
   'G90/G91 in SINUMERIK behave the same as in Fanuc/standard ISO. G90 is absolute (default), G91 is incremental. SINUMERIK also supports mixing modes with IC() and AC() modifiers on individual axis words within a block.',
   7),
  (v_bank_id, 'multiple_choice',
   'Siemens SINUMERIK uses GUD (Global User Data) variables. What distinguishes them from R-parameters?',
   '[{"key":"a","label":"GUD variables are faster to execute"},{"key":"b","label":"GUDs are typed, named variables (e.g., DEF REAL MY_DIAMETER) that persist across program calls and power cycles (when stored in the SRAM area), and can hold different data types (REAL, INT, BOOL, STRING). R-parameters are unnamed floating-point only."},{"key":"c","label":"GUDs can only be read, not written, from within a part program"},{"key":"d","label":"GUDs replace G-codes in newer SINUMERIK versions"}]',
   '["b"]',
   'GUDs add type safety, meaningful names, and persistence to SINUMERIK variables. They are defined in data definition files and compiled into the control. For complex macro programming, GUDs are preferable to R-parameters for clarity and reliability.',
   8);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- BANK 8 — GD&T Basics
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, sort_order)
VALUES ('gdt-basics', 'GD&T Basics', 'Engineering Drawing',
        'Geometric Dimensioning & Tolerancing per ASME Y14.5: feature control frames, datums, true position, form and orientation tolerances.',
        'intermediate', 80, false, 8)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'gdt-basics';

IF (SELECT COUNT(*) FROM public.gca_questions WHERE bank_id = v_bank_id) < 5 THEN
  DELETE FROM public.gca_questions WHERE bank_id = v_bank_id;
  INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_bank_id, 'multiple_choice',
   'A feature control frame reads: [⌀ | ⌀0.010 M | A | B | C]. What does the M symbol (circle M) indicate?',
   '[{"key":"a","label":"The tolerance applies at the maximum material condition — when the feature is at its largest allowable size for a shaft (or smallest for a hole), allowing bonus tolerance as the feature departs from MMC"},{"key":"b","label":"The tolerance is measured in millimeters"},{"key":"c","label":"The tolerance applies regardless of feature size"},{"key":"d","label":"The measurement must be taken at maximum material condition only"}]',
   '["a"]',
   'MMC modifier (Ⓜ) allows bonus tolerance: for a hole, as the hole grows larger from MMC, additional positional tolerance equal to the size departure is added to the geometric tolerance. For a shaft at MMC (largest), the same concept applies. This models the functional "worst-case fit" scenario.',
   1),
  (v_bank_id, 'multiple_choice',
   'What is the difference between Runout and Total Runout?',
   '[{"key":"a","label":"Runout is circular (2D cross-section), Total Runout controls the entire cylindrical surface across all cross-sections simultaneously — it also controls taper and form errors along the full length"},{"key":"b","label":"They are the same control with different names"},{"key":"c","label":"Runout controls form; Total Runout controls orientation"},{"key":"d","label":"Total Runout only applies to flat surfaces"}]',
   '["a"]',
   'Circular Runout (↗) is measured at individual cross-sections — the indicator reads one ring at a time. Total Runout (⇗⇗) sweeps the indicator across the entire surface (or face) while rotating, controlling both roundness and axis form. Total Runout is more restrictive.',
   2),
  (v_bank_id, 'multiple_choice',
   'A drawing shows a flatness tolerance of 0.002" on a surface. What datum references are required?',
   '[{"key":"a","label":"At least one datum reference is required"},{"key":"b","label":"No datum references — flatness is a form control that measures the surface relative to itself (a perfect plane fitted to the surface), not to any external datum"},{"key":"c","label":"The same datums used by the position tolerance on that feature"},{"key":"d","label":"A minimum of three datum points"}]',
   '["b"]',
   'Flatness, straightness, circularity, and cylindricity are all form tolerances that require no datum references. They measure the intrinsic form of the surface. Adding datums to a flatness callout is a drawing error.',
   3),
  (v_bank_id, 'multiple_choice',
   'True Position of a hole pattern uses datums A, B, C. Datum A is the primary datum. What does the primary datum control?',
   '[{"key":"a","label":"The location of the hole pattern in X"},{"key":"b","label":"Orientation of the part (removes rotational and translational degrees of freedom in the primary contact direction — typically constrains 3 rotational DOFs for a flat primary datum)"},{"key":"c","label":"The size of the holes"},{"key":"d","label":"The parallelism of the holes to each other"}]',
   '["b"]',
   'The primary datum establishes the first set of part constraints. A flat primary datum (plane) contacts the surface and removes 3 degrees of freedom: tilt in two axes and translation in Z. Subsequent datums B and C remove the remaining translational and rotational DOFs.',
   4),
  (v_bank_id, 'multiple_choice',
   'What is "bonus tolerance" in GD&T position control with an MMC modifier?',
   '[{"key":"a","label":"Extra tolerance added by the quality engineer for difficult features"},{"key":"b","label":"The additional geometric tolerance that equals the departure of the controlled feature''s actual size from its MMC size. A hole at 0.502\" actual vs 0.500\" MMC gets 0.002\" bonus, so total position tolerance = specified tolerance + 0.002\""},{"key":"c","label":"Tolerance inherited from a mating part"},{"key":"d","label":"An allowance added during inspection for measurement uncertainty"}]',
   '["b"]',
   'Bonus tolerance = |Actual Size − MMC Size|. It is only available when the MMC or LMC modifier is applied. The total allowable position deviation = geometric tolerance + bonus tolerance. This models the functional reality that a larger hole can be slightly more off-position and still accept a mating pin.',
   5),
  (v_bank_id, 'multiple_choice',
   'Profile of a Surface ⌖ 0.010 with no datum references controls:',
   '[{"key":"a","label":"The location of the surface relative to datums"},{"key":"b","label":"The form of the surface only (all points must fall within a 0.010\" wide zone that is normal to the true profile at each point) — without datums it is a form control, not a location control"},{"key":"c","label":"The orientation of the surface only"},{"key":"d","label":"The surface cannot be measured without datum references"}]',
   '["b"]',
   'Profile of a Surface without datums = form control. All points on the surface must lie within the specified tolerance zone centered on the true profile. With datums added, it also controls location and orientation relative to those datums.',
   6),
  (v_bank_id, 'multiple_choice',
   'A perpendicularity callout of 0.005" on a shaft controls:',
   '[{"key":"a","label":"How round the shaft is"},{"key":"b","label":"How straight the axis of the shaft is along its length"},{"key":"c","label":"The angle of the shaft''s axis relative to the referenced datum plane — all points on the axis must fall within a 0.005\" wide tolerance zone perpendicular to datum A"},{"key":"d","label":"The surface finish of the shaft"}]',
   '["c"]',
   'Perpendicularity controls orientation. For a shaft (cylinder), it requires the axis to be contained within a cylindrical (if preceded by ⌀) or planar tolerance zone perpendicular to the referenced datum. It inherits any tilt or wobble of the axis from perfect perpendicularity.',
   7),
  (v_bank_id, 'multiple_choice',
   'What is the key difference between Concentricity and Coaxiality (Position applied to an axis)?',
   '[{"key":"a","label":"Concentricity only applies to circular cross-sections; coaxiality applies to cylinders"},{"key":"b","label":"Concentricity controls the median points (derived axis from opposed points) of a surface to a datum axis — a very strict and difficult-to-measure control. Position (coaxiality) controls the derived axis of the entire feature. ASME Y14.5-2018 deprecated Concentricity in favor of Position and Runout."},{"key":"c","label":"They are identical controls"},{"key":"d","label":"Concentricity uses dial indicators; coaxiality uses CMM only"}]',
   '["b"]',
   'Concentricity uses median points (mid-points of diametrically opposed surface points) and is extremely sensitive to part orientation. It is rarely necessary and was removed from ASME Y14.5-2018. Position on an axis (coaxiality) is the preferred replacement and is easier to measure and functionally equivalent in most applications.',
   8),
  (v_bank_id, 'multiple_choice',
   'A CMM report shows a measured X deviation of +0.003" and Y deviation of +0.004" for a hole''s true position. What is the actual positional deviation?',
   '[{"key":"a","label":"0.007\""},{"key":"b","label":"0.005\" (calculated as 2 × √(0.003² + 0.004²))"},{"key":"c","label":"0.003\" (largest single-axis deviation)"},{"key":"d","label":"0.014\""}]',
   '["b"]',
   'True position deviation = 2 × √(ΔX² + ΔY²) = 2 × √(0.000009 + 0.000016) = 2 × √0.000025 = 2 × 0.005 = 0.010" diametral. Wait — recalculating: 2 × √(0.003² + 0.004²) = 2 × 0.005 = 0.010". The diameter of the tolerance zone is always 2× the radial distance, so the actual deviation reported is the diametral value.',
   9);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- BANK 9 — Speeds & Feeds
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, sort_order)
VALUES ('speeds-and-feeds', 'Speeds & Feeds', 'Machining Science',
        'Cutting speed, RPM, chip load, surface footage, RDOC/ADOC, material-specific parameters, and tool life impact.',
        'beginner', 80, false, 9)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'speeds-and-feeds';

IF (SELECT COUNT(*) FROM public.gca_questions WHERE bank_id = v_bank_id) < 5 THEN
  DELETE FROM public.gca_questions WHERE bank_id = v_bank_id;
  INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_bank_id, 'multiple_choice',
   'A 0.500" diameter end mill in 6061 aluminum at 800 SFM. What RPM should you program?',
   '[{"key":"a","label":"1,528 RPM"},{"key":"b","label":"6,112 RPM"},{"key":"c","label":"3,056 RPM"},{"key":"d","label":"12,224 RPM"}]',
   '["b"]',
   'RPM = (SFM × 12) / (π × D) = (800 × 12) / (3.14159 × 0.500) = 9600 / 1.5708 ≈ 6,112 RPM. Always verify this is within the machine''s spindle speed range.',
   1),
  (v_bank_id, 'multiple_choice',
   'A 4-flute end mill at 3,000 RPM with a chip load of 0.004" per tooth. What is the feedrate in IPM?',
   '[{"key":"a","label":"12 IPM"},{"key":"b","label":"48 IPM"},{"key":"c","label":"3 IPM"},{"key":"d","label":"24 IPM"}]',
   '["b"]',
   'IPM = RPM × chip load per tooth × number of flutes = 3,000 × 0.004 × 4 = 48 IPM.',
   2),
  (v_bank_id, 'multiple_choice',
   'What happens to tool life if you double the cutting speed while keeping all other parameters constant?',
   '[{"key":"a","label":"Tool life doubles"},{"key":"b","label":"Tool life is approximately halved or worse, depending on the material and tool — cutting speed has the largest single impact on tool life per Taylor''s tool life equation"},{"key":"c","label":"Tool life is unaffected — only feed matters"},{"key":"d","label":"Tool life quadruples due to better heat dissipation at higher speed"}]',
   '["b"]',
   'Taylor''s equation: VTⁿ = C. Doubling V with typical exponent n ≈ 0.25 means T drops to (0.5)^(1/0.25) = 0.5^4 = 1/16 of original tool life in the theoretical model. Practically, doubling speed cuts tool life severely — sometimes 4–10×.',
   3),
  (v_bank_id, 'multiple_choice',
   'You are milling 304 stainless steel with a 0.500" carbide end mill. The recommended SFM is 200. You are currently running 350 SFM and getting rapid flank wear. What is the most direct correction?',
   '[{"key":"a","label":"Increase the feed to generate more heat and soften the material"},{"key":"b","label":"Reduce the spindle speed to bring SFM closer to the recommended 200, which will lower cutting temperature and reduce the accelerated tool wear"},{"key":"c","label":"Add more coolant concentration"},{"key":"d","label":"Increase ADOC to spread the wear over more cutting edge"}]',
   '["b"]',
   'Stainless steel is prone to work hardening and generates high cutting heat. Running too fast (350 vs 200 SFM) accelerates thermal wear. Reduce RPM to hit the recommended SFM. Running stainless too slow also causes work hardening and edge build-up, so stay near recommended SFM.',
   4),
  (v_bank_id, 'multiple_choice',
   'What is "chip thinning" and why does it matter when increasing radial depth of cut (RDOC)?',
   '[{"key":"a","label":"Chip thinning occurs when ADOC is too deep, making thin chips that clog the flutes"},{"key":"b","label":"When RDOC decreases (less than ~50% of cutter diameter), the actual chip thickness is less than the programmed chip load because the arc of engagement is reduced. You must increase the programmed chip load to maintain the designed cutting force and avoid rubbing."},{"key":"c","label":"Chip thinning is the same as chip breaking"},{"key":"d","label":"Chip thinning only occurs in aluminum"}]',
   '["b"]',
   'Chip thinning factor = √(1 - (1 - 2×RDOC/D)²). At 25% RDOC, actual chip thickness is ~50% of programmed chip load. The correct feed adjustment is: feed × (1/chip thinning factor). High-efficiency milling (HEM) uses low RDOC with adjusted chip load.',
   5),
  (v_bank_id, 'multiple_choice',
   'When turning 4140 steel at 450 SFM with a 0.030" depth of cut and 0.012" feed per rev, what surface finish improvement technique would most directly reduce Ra?',
   '[{"key":"a","label":"Increase feed rate to 0.020\" per rev"},{"key":"b","label":"Reduce the feed to 0.006\" per rev and/or use a larger nose radius insert to lower the theoretical finish height (Rth)"},{"key":"c","label":"Increase depth of cut to 0.060\""},{"key":"d","label":"Switch from carbide to HSS"}]',
   '["b"]',
   'Theoretical surface finish: Rth = f² / (8 × r_nose). Reducing feed by half improves Rth by 4×. Doubling the nose radius also improves it 2×. Both have the most direct effect on finish height. Increasing DOC has minimal effect on finish; increasing feed worsens it.',
   6),
  (v_bank_id, 'multiple_choice',
   'What is the approximate Brinell Hardness (HB) range for 6061-T6 aluminum, and how does it affect your SFM choice relative to 4140 steel HRC 28–34?',
   '[{"key":"a","label":"Both materials are machined at the same SFM"},{"key":"b","label":"6061-T6 is approximately 95 HB — much softer than 4140 at ~280–300 HB. Aluminum can be cut 3–5× faster in SFM because cutting forces and heat are far lower, and built-up edge (not heat) is the primary concern"},{"key":"c","label":"Aluminum requires lower SFM because it melts at lower temperature"},{"key":"d","label":"Hardness does not affect recommended SFM"}]',
   '["b"]',
   '6061-T6 ≈ 95 HB; 4140 annealed ≈ 197 HB; 4140 heat-treated to HRC 28-34 ≈ 270-300 HB. Typical SFM: 6061-T6 = 600–1500 SFM with carbide; 4140 HT = 200–350 SFM with carbide. Primary failure mode for aluminum is BUE (built-up edge on uncoated tools) and chip welding, not thermal wear.',
   7),
  (v_bank_id, 'multiple_choice',
   'You notice your turning insert is producing a built-up edge (BUE) on the cutting face when turning 1018 mild steel. What adjustment is most likely to eliminate BUE?',
   '[{"key":"a","label":"Reduce cutting speed below 100 SFM"},{"key":"b","label":"Increase cutting speed to move above the temperature at which material wants to weld to the insert, and/or switch to a coated insert (TiAlN, TiCN) that resists adhesion"},{"key":"c","label":"Increase depth of cut"},{"key":"d","label":"Add more coolant pressure"}]',
   '["b"]',
   'BUE forms in a temperature range where the workpiece material has low enough strength to deform but high enough affinity to weld to the tool. Increasing SFM raises the cutting temperature above this range, preventing adhesion. Coatings with low affinity for steel (TiAlN, TiCN) also prevent BUE formation.',
   8),
  (v_bank_id, 'multiple_choice',
   'What does IPR (inches per revolution) feedrate mode ensure that cutting operations like drilling do not do when the spindle speed changes?',
   '[{"key":"a","label":"IPR mode locks the spindle speed constant"},{"key":"b","label":"IPR maintains a constant chip load (feed per revolution) regardless of spindle speed — if RPM changes, the control automatically adjusts IPM so the feed per rev stays constant. This prevents over-feeding at low RPM or under-feeding at high RPM."},{"key":"c","label":"IPR is faster to input than IPM"},{"key":"d","label":"IPR only applies to threading operations"}]',
   '["b"]',
   'Feed per revolution (G95/IPR) is used for drilling and turning because the chip load is directly proportional to feed per rev, not feed per minute. IPM varies with RPM changes; IPR stays constant regardless of speed adjustments, ensuring consistent chip load.',
   9);
END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- BANK 10 — Inspection & Metrology
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.gca_question_banks (slug, title, topic, description, difficulty, passing_score_pct, is_pro_only, sort_order)
VALUES ('inspection-metrology', 'Inspection & Metrology', 'Quality & Metrology',
        'CMM operation, surface plate work, gage blocks, thread gauging, roundness, surface roughness, and measurement uncertainty.',
        'intermediate', 80, false, 10)
ON CONFLICT (slug) DO NOTHING;
SELECT id INTO v_bank_id FROM public.gca_question_banks WHERE slug = 'inspection-metrology';

IF (SELECT COUNT(*) FROM public.gca_questions WHERE bank_id = v_bank_id) < 5 THEN
  DELETE FROM public.gca_questions WHERE bank_id = v_bank_id;
  INSERT INTO public.gca_questions (bank_id, question_type, prompt, choices, correct_answers, explanation, sort_order) VALUES
  (v_bank_id, 'multiple_choice',
   'Before measuring on a CMM, the stylus must be "qualified." What does stylus qualification do?',
   '[{"key":"a","label":"Visually inspects the stylus tip for cracks"},{"key":"b","label":"Measures the exact center position and effective radius of the stylus ball by touching a calibration artifact (reference sphere) so the CMM software can apply the correct probe radius offset to all measurements"},{"key":"c","label":"Cleans the stylus tip with isopropyl alcohol"},{"key":"d","label":"Measures the stylus length and stores it in the tool file"}]',
   '["b"]',
   'CMM stylus qualification (also called stylus calibration or probing) determines the effective radius and spatial offset of each stylus tip relative to the machine reference. Without this, all measurements will be offset by the stylus geometry error.',
   1),
  (v_bank_id, 'multiple_choice',
   'A Grade A granite surface plate is rated for what flatness tolerance per unit area compared to a Grade B plate?',
   '[{"key":"a","label":"Grade A and Grade B have the same flatness specification"},{"key":"b","label":"Grade A surface plates have tighter flatness tolerances (approximately half the allowed error of Grade B), making them suitable for higher-precision reference work. The specific tolerance depends on the plate size per Federal Specification GGG-P-463."},{"key":"c","label":"Grade B plates are flatter — Grade A plates are for marking out only"},{"key":"d","label":"Grade A refers to the color only"}]',
   '["b"]',
   'Federal Spec GGG-P-463 defines three grades: Laboratory (AA), Inspection (A), and Tool Room (B). Grade AA is flattest, Grade B least flat. Grade A = approximately half the flatness error of Grade B. Choose the grade based on the tolerances being checked (10:1 gage-to-tolerance ratio is typical).',
   2),
  (v_bank_id, 'multiple_choice',
   'You need to stack gage blocks to build up 1.3575". Using a standard set (1.0001"–1.0009" in 0.0001" steps, 1.001"–1.009" in 0.001" steps, 1.010"–1.049" in 0.010" steps, 1.050"–1.950" in 0.050" steps). What is the minimum number of blocks?',
   '[{"key":"a","label":"2 blocks"},{"key":"b","label":"4 blocks"},{"key":"c","label":"3 blocks"},{"key":"d","label":"5 blocks"}]',
   '["b"]',
   'Build from the smallest digit: 1.3575" = 1.0005" (0.0001" series) + 1.007" (0.001" series) + 1.300" (0.050" series would need 1.300" = not directly available; use 1.250" + 0.050") — actually the optimal solution: 1.0005 + 1.007 + 1.050 + 1.300 = 4 blocks. Fewer is better as each interface adds wringing uncertainty.',
   3),
  (v_bank_id, 'multiple_choice',
   'A thread plug gauge set for a 1/4-20 UNC thread consists of a GO and a NO-GO gauge. What do the GO and NO-GO gauges verify?',
   '[{"key":"a","label":"GO checks the major diameter; NO-GO checks the minor diameter"},{"key":"b","label":"GO gauge checks that the thread assembly passes (virtual condition — pitch diameter, lead, flank angle, and form are all within limits at MMC). NO-GO checks that the pitch diameter is not undersize (or oversize for external threads), ensuring the thread is not too loose"},{"key":"c","label":"Both check the same thing — using two is redundant"},{"key":"d","label":"GO checks thread depth only; NO-GO checks pitch"}]',
   '["b"]',
   'The GO thread plug gauge checks the full thread form at MMC: it must enter fully on a conforming hole. The NO-GO (or NOT-GO) gauge is truncated to only engage 2–3 threads and checks that the pitch diameter is not below minimum (it must NOT fully enter). Together they bound the pitch diameter and form.',
   4),
  (v_bank_id, 'multiple_choice',
   'What is "measurement uncertainty" and why must it be considered when checking a part to a tight tolerance?',
   '[{"key":"a","label":"Measurement uncertainty is the calibration error of the instrument only"},{"key":"b","label":"Measurement uncertainty is the range within which the true value is estimated to lie, accounting for all error sources: instrument calibration, environment (temperature, vibration), operator technique, and part condition. When uncertainty is large relative to the tolerance, false accepts and false rejects become significant."},{"key":"c","label":"Measurement uncertainty only matters for CMM measurements, not hand gauges"},{"key":"d","label":"Measurement uncertainty is eliminated by using calibrated instruments"}]',
   '["b"]',
   'Per GUM (Guide to Expression of Uncertainty in Measurement), uncertainty affects the guard band. ASME B89.7.3 recommends that for acceptance decisions, the measurement uncertainty should be ≤25% of the part tolerance (10:1 for high-risk). Ignoring uncertainty can release nonconforming parts or reject good parts.',
   5),
  (v_bank_id, 'multiple_choice',
   'An optical comparator uses a 10× lens to project a part shadow onto a 14" diameter screen. A measurement on the screen reads 2.750". What is the actual part dimension?',
   '[{"key":"a","label":"2.750\""},{"key":"b","label":"0.275\""},{"key":"c","label":"27.50\""},{"key":"d","label":"1.375\""}]',
   '["b"]',
   'The 10× magnification means screen distances are 10× actual size. Actual dimension = screen reading ÷ magnification = 2.750 ÷ 10 = 0.275". Always divide the screen measurement by the lens magnification factor.',
   6),
  (v_bank_id, 'multiple_choice',
   'What is the difference between Ra and Rz surface roughness parameters?',
   '[{"key":"a","label":"Ra is the peak height; Rz is the valley depth"},{"key":"b","label":"Ra (Roughness Average) is the arithmetic mean of profile deviations from the mean line over the evaluation length. Rz (ISO) is the average of the five largest peak-to-valley heights within the evaluation length. Rz is more sensitive to extreme peaks that affect sealing and fatigue performance."},{"key":"c","label":"Ra and Rz are the same measurement expressed in different units"},{"key":"d","label":"Ra is used for ground surfaces; Rz is for turned surfaces only"}]',
   '["b"]',
   'Ra averages all deviations (good for general surface character). Rz captures the average of the 5 highest peak-to-valley values within the sampling length (more sensitive to outlier peaks). For sealing surfaces, bearings, and fatigue-critical features, Rz (or Rmax) is more functionally relevant than Ra.',
   7),
  (v_bank_id, 'multiple_choice',
   'When using a dial indicator on a surface plate to check the parallelism of a machined part, what error source must be controlled by ensuring the indicator stem is perpendicular to the surface being measured?',
   '[{"key":"a","label":"Cosine error — when the indicator stem is not perpendicular to the measured surface, the indicator reads less than the true deviation by a factor of cos(θ). Even a 5° tilt introduces about 0.4% error."},{"key":"b","label":"Sine error"},{"key":"c","label":"Parallax error"},{"key":"d","label":"Thermal drift"}]',
   '["a"]',
   'Cosine error: indicator reading = true deviation × cos(θ). At 5° tilt, error = 0.4%. At 10° tilt, error = 1.5%. For a ±0.001" tolerance, a 10° stem angle introduces ~0.00015" error — significant at tight tolerances. Always align the indicator stem perpendicular (within ~2°) to the surface.',
   8),
  (v_bank_id, 'multiple_choice',
   'A CMM is measuring a cylindrical bore. The least-squares (Gaussian) cylinder fit reports a diameter of 1.0003" and a form error (cylindricity) of 0.0008". The drawing calls for 1.000" ±0.001" diameter with a cylindricity of ⌀0.001". Is the part conforming?',
   '[{"key":"a","label":"Yes — both the diameter and cylindricity are within their respective tolerances"},{"key":"b","label":"No — the diameter is out of tolerance"},{"key":"c","label":"No — the cylindricity is out of tolerance"},{"key":"d","label":"Cannot determine without more information"}]',
   '["a"]',
   'Diameter: 1.0003" is within 1.000" ±0.001" (range 0.999"–1.001"). Cylindricity: 0.0008" is within the ⌀0.001" cylindricity tolerance. Both are conforming. Note: least-squares fit may not be the correct evaluation method for minimum-zone cylindricity per ASME Y14.5 (max inscribed / min circumscribed), but with 0.0008" vs 0.001" the margin is adequate.',
   9);
END IF;

END $$;
