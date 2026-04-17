// ═══════════════════════════════════════════════════════════════════
// GCA-TESTS.JS — Controller Tests, Machine Type Tests, GD&T Tests
// Interview Prep Bank | WeCr8 Solutions LLC
// Rev 1.0 | 2025-04-16
// ═══════════════════════════════════════════════════════════════════

const GCA_TESTS = {

  // ─────────────────────────────────────────────────────────────────
  // CONTROLLER TEST BANKS
  // Each test: { q, opts[4], ans(0-indexed), exp, diff(1-3), tags[] }
  // ─────────────────────────────────────────────────────────────────
  controllers: {

    fanuc: {
      label: 'Fanuc 0i / 30i / 31i',
      icon: '🟦',
      color: '#4a9eff',
      desc: 'The most widely deployed CNC control in North American manufacturing.',
      passMark: 75,
      questions: [
        {
          q: 'On a Fanuc lathe, what is the correct sequence for spindle speed control before a facing pass?',
          opts: ['G96 S350 M03 → G50 S2500','G50 S2500 → G96 S350 M03','G97 S2500 → G96 S350','M03 → G50 S2500 → G96 S350'],
          ans: 1, diff: 1,
          exp: 'G50 MUST precede G96. G50 sets the maximum RPM ceiling. If G96 is activated first, the spindle can overspeed as the tool approaches the centerline — a safety hazard.',
          tags: ['spindle','G96','G50','lathe']
        },
        {
          q: 'On a Fanuc mill, which "safe state" line cancels cutter compensation, canned cycles, and tool length offset simultaneously?',
          opts: ['G40 G80 G49','G90 G40 G80','G90 G17 G20 G40 G80 G49','G49 G80 M09'],
          ans: 2, diff: 1,
          exp: 'G90 G17 G20 G40 G80 G49 is the standard Fanuc safe state line. G40=cancel cutter comp, G80=cancel canned cycles, G49=cancel tool length comp, G17=XY plane, G20=inch, G90=absolute.',
          tags: ['safety','modal','mill']
        },
        {
          q: 'Fanuc Macro B: which variable range is persistent across power cycles?',
          opts: ['#1–#33 (local arguments)','#100–#149 (local variables)','#500–#999 (common variables)','#1000–#1015 (interface signals)'],
          ans: 2, diff: 2,
          exp: '#500–#999 are Fanuc "common" variables — they retain their value after power off. #100–#149 are local and cleared at M30. Use common variables for part counters, tool life, and persistent process data.',
          tags: ['macro','variables','advanced']
        },
        {
          q: 'What does G28 U0 W0 do on a Fanuc CNC lathe?',
          opts: ['Moves to machine home via X=0, Z=0 absolute','Returns X and Z axes to reference (home) through an intermediate point at the current position','Cancels all work offsets','Sets the work zero to the current position'],
          ans: 1, diff: 1,
          exp: 'G28 commands a reference return (homing) through an intermediate point. U0 W0 (incremental zeroes) means the intermediate point IS the current position — so the machine goes directly to machine home from wherever it is.',
          tags: ['G28','homing','lathe']
        },
        {
          q: 'On a Fanuc mill, G91 G28 Z0 is programmed before a tool change. Why G91 instead of G90?',
          opts: ['G91 is required by the ATC','G91 makes the intermediate point the CURRENT position — so Z homes directly from where it is. G90 G28 Z0 would first move to Z=0 (part surface) then home — crashing into the part.','G90 and G91 are identical for G28','G91 is faster'],
          ans: 1, diff: 2,
          exp: 'G91 G28 Z0 is the safe idiom: "home Z through an intermediate point that is 0 distance from here (i.e., right here)." G90 G28 Z0 would move the spindle to Z=0 (your part surface!) before executing the home move — a guaranteed crash.',
          tags: ['G28','G91','mill','tool-change']
        },
        {
          q: 'A Fanuc program uses G99 F0.012. What does the 0.012 represent?',
          opts: ['0.012 inches per minute','0.012 inches per revolution','0.012 millimeters per minute','Feed override at 12%'],
          ans: 1, diff: 1,
          exp: 'G99 activates feed-per-revolution mode. F0.012 = 0.012 inches (or mm in G21) per spindle revolution. This is the standard for lathe turning — chip load stays consistent as RPM changes with G96.',
          tags: ['G99','feedrate','lathe']
        },
        {
          q: 'On Fanuc, the alarm "OT0500 Z- OVERTRAVEL" appears. What caused this and what is the first corrective action?',
          opts: ['Coolant is low — refill and reset','The Z axis moved past its negative travel limit. Press RESET then jog Z in the positive direction.','The program ended normally','Servo motor overheated — wait 15 minutes'],
          ans: 1, diff: 1,
          exp: 'OT (Overtravel) alarms indicate an axis exceeded its software or hardware travel limit. Press RESET to clear the alarm, then jog the offending axis in the opposite direction (Z+ to escape a Z- overtravel). Investigate why before running again.',
          tags: ['alarms','overtravel','operator']
        },
        {
          q: 'In Fanuc G76 threading cycle, what does the "Q" value represent?',
          opts: ['Total thread depth','Depth of first pass (in microns × 1000)','Number of spring passes','Thread pitch'],
          ans: 1, diff: 2,
          exp: 'In G76, Q is the minimum cutting depth (depth of the last pass). It is programmed in units × 0.001 — so Q50 = 0.050mm minimum depth. The cycle automatically reduces pass depth as it approaches final depth.',
          tags: ['G76','threading','advanced']
        },
        {
          q: 'What is the purpose of the D-word in a Fanuc mill cutter compensation block (G41 D01)?',
          opts: ['D selects the drill cycle type','D01 points to the offset register containing the cutter radius for the compensation calculation','D sets the cutting direction','D specifies the depth of cut'],
          ans: 1, diff: 1,
          exp: 'The D-word points to the tool offset register that stores the cutter radius (or diameter, depending on controller setting). G41 D01 = activate left compensation using the value stored in offset register 01. This is why changing cutter diameter only requires updating the D-register.',
          tags: ['G41','cutter-comp','mill']
        },
        {
          q: 'On a Fanuc control, M01 is programmed in a part program. When will the machine stop?',
          opts: ['Always — M01 is an unconditional stop','Only when the OPTIONAL STOP switch on the panel is ON','Only on the first part — ignored on subsequent cycles','Never — M01 is a comment code'],
          ans: 1, diff: 1,
          exp: 'M01 is an Optional Stop. The machine only pauses at M01 when the Optional Stop switch on the operator panel is in the ON position. This allows setup techs to pause for inspection without permanently modifying the program.',
          tags: ['M-codes','M01','operator']
        },
        {
          q: 'A Fanuc lathe program uses G71 U0.5 R0.1. What does U0.5 specify?',
          opts: ['Total depth of all roughing passes combined','Depth of cut per roughing pass (0.5mm or 0.5" per side)','The finish stock amount left after roughing','The retract distance between passes'],
          ans: 1, diff: 2,
          exp: 'In G71, U specifies the depth of cut for each roughing pass (per side). R specifies the retract amount between passes. These two parameters control the aggressiveness of each roughing pass.',
          tags: ['G71','lathe','cycles']
        },
        {
          q: 'What is the function of Fanuc system variable #5041?',
          opts: ['Current spindle speed in RPM','Current X-axis machine position','Current feedrate override %','Active tool number'],
          ans: 1, diff: 3,
          exp: '#5041 is the Fanuc system variable for the current X-axis machine position. #5041-#5048 cover the 8 axes. These are read-only variables used in macro programs for in-process measurement and adaptive control.',
          tags: ['macro','system-variables','automation']
        },
      ]
    },

    haas: {
      label: 'Haas VF / ST Series',
      icon: '🟧',
      color: '#ff6b35',
      desc: 'The dominant US-made CNC — used in job shops, education, and high-volume production.',
      passMark: 75,
      questions: [
        {
          q: 'On a Haas mill, what does pressing RECOVER do?',
          opts: ['Resets all offsets to zero','Steps through a safe recovery sequence after a crash or E-Stop — rehoming axes in the correct order','Returns the program to line 1','Clears all alarms immediately'],
          ans: 1, diff: 1,
          exp: 'RECOVER on a Haas walks the operator through a guided recovery sequence. It homes one axis at a time in the safe order, preventing secondary crashes during recovery from an E-Stop or fault condition.',
          tags: ['haas','recovery','operator']
        },
        {
          q: 'On a Haas lathe (ST series), how do you set a tool length offset using the "Part Zero Set" method?',
          opts: ['Type the machine position into the geometry offset page manually','Touch the tool to a known surface, then press PART ZERO SET on the offset page — it calculates and enters the offset automatically','Use a Renishaw probe only','Press AUTO OFFSET while the spindle is running'],
          ans: 1, diff: 1,
          exp: 'Haas "Part Zero Set" automates offset entry. Touch off on a known surface (like the faced part), navigate to the geometry offset page, highlight the correct axis cell, and press PART ZERO SET. The control calculates and stores the correct offset value.',
          tags: ['haas','offsets','setup']
        },
        {
          q: 'On a Haas mill, G187 P1 E0.001 is programmed. What does this do?',
          opts: ['Sets the work offset to E0.001','Activates Haas Smoothness setting P1 with an accuracy tolerance of 0.001" — affects how aggressively the control pre-plans corners','Sets feedrate to 0.001 IPR','Activates tool life monitoring'],
          ans: 1, diff: 3,
          exp: 'G187 is Haas-specific smoothness control. P1=Rough, P2=Medium, P3=Finish. E sets the corner rounding tolerance. G187 P3 E0.0001 gives very tight corner accuracy at the cost of some speed — used for die/mold work.',
          tags: ['haas','G187','advanced','smoothness']
        },
        {
          q: 'A Haas alarm reads "Alarm 138 — Cannot Home, Limit Switch." What does this mean?',
          opts: ['The axis is already at home','The axis limit switch is not being triggered during homing — the axis may have traveled past its limit or the switch has failed','Tool length offset is incorrect','The spindle cannot reach the home speed'],
          ans: 1, diff: 2,
          exp: 'Alarm 138 indicates the axis moved to its expected home position but the limit switch was not triggered. Causes: debris blocking the switch, a damaged switch, or the axis mechanically cannot reach the switch. Do not force — call maintenance.',
          tags: ['haas','alarms','maintenance']
        },
        {
          q: 'On a Haas control, what is the purpose of the NEXT TOOL button during a manual tool change?',
          opts: ['Indexes the carousel to the NEXT empty pocket','Advances the carousel one position to allow manual loading of the next tool in the queue','Executes the next tool call in the program','Moves the tool that is currently in the spindle back to its home pocket and advances the next called tool'],
          ans: 1, diff: 1,
          exp: 'NEXT TOOL on a Haas steps the ATC carousel to the next position. This is used during manual setup to cycle through all pockets for inspection or loading without running a program.',
          tags: ['haas','ATC','setup']
        },
        {
          q: 'In Haas macro programming, what variable stores the current machine X position in machine coordinates?',
          opts: ['#5021','#5041','#2001','#4014'],
          ans: 1, diff: 3,
          exp: '#5041 stores the machine X position on both Fanuc and Haas (Haas uses Fanuc-compatible macro B). #5021 stores the X position in work coordinates. #2001 and similar are tool offset values.',
          tags: ['haas','macro','variables']
        },
        {
          q: 'On a Haas ST lathe, you want to jog the turret in very small increments to touch off a tool. Which jog mode should you select?',
          opts: ['.1 handle jog mode — 0.1" per click','Handle jog at .0001 — 0.0001" per click (finest increment)','Continuous jog — hold the direction key','Remote jog handle at 100%'],
          ans: 1, diff: 1,
          exp: 'The .0001 handle jog mode gives 0.0001" per handwheel click — the finest increment available. This is the correct mode for touching off tools and setting geometry offsets where precision is critical.',
          tags: ['haas','jog','setup','offsets']
        },
        {
          q: 'A Haas alarm "Servo: 156 — Drive Fault" appears. What is the appropriate first response?',
          opts: ['Press RESET and continue running','Press E-Stop, power cycle the machine, and if it reoccurs immediately, call maintenance — a drive fault indicates a hardware-level servo issue','Increase the feedrate to push past the fault','Check the oil level'],
          ans: 1, diff: 2,
          exp: 'Drive Fault alarms (Alarm 156 series on Haas) indicate a servo drive hardware issue — overcurrent, overvoltage, encoder fault, or motor failure. Power cycling may clear a transient fault, but recurring drive faults require maintenance investigation. Do not continue cutting.',
          tags: ['haas','alarms','servo','maintenance']
        },
      ]
    },

    siemens: {
      label: 'Siemens Sinumerik 840D/828D',
      icon: '🟩',
      color: '#00e5b0',
      desc: 'The European standard — dominant in precision machining, aerospace, and automotive.',
      passMark: 75,
      questions: [
        {
          q: 'On Siemens Sinumerik, what replaces the Fanuc G96/G97 constant surface speed command?',
          opts: ['CSS ON / CSS OFF','LIMS and G96','G96 is used on Siemens too','G964 and G963'],
          ans: 0, diff: 1,
          exp: 'Siemens uses CSS (Constant Surface Speed) with the command syntax: G96 S[speed] LIMS=[max RPM] M3. LIMS sets the maximum spindle limit (equivalent to Fanuc\'s G50). The modal cancel is G97.',
          tags: ['siemens','CSS','spindle']
        },
        {
          q: 'On Siemens Sinumerik, how do you define a subroutine (equivalent to Fanuc\'s M98 subprogram call)?',
          opts: ['M98 P[number] is identical on Siemens','L[name] or CALL [name] — Siemens uses named subroutines, not O-number programs','GOSUB [line number]','G65 P[name]'],
          ans: 1, diff: 2,
          exp: 'Siemens uses L-codes for subroutine calls (L100, L_BORE_CYCLE) or the CALL instruction. Subroutines are named files, not O-numbered programs. The return is M17 (not M99). This is a fundamental difference from Fanuc architecture.',
          tags: ['siemens','subprograms','advanced']
        },
        {
          q: 'On Siemens Sinumerik, what does CYCLE81 do?',
          opts: ['Activates the Siemens automatic tool changer','Standard drilling canned cycle — equivalent to Fanuc G81','Enables the CSS spindle mode','Activates contour following mode'],
          ans: 1, diff: 1,
          exp: 'Siemens uses named CYCLE commands instead of G-code numbers for canned cycles. CYCLE81 = drill. CYCLE83 = deep hole peck drill. CYCLE84 = tapping. They function similarly to Fanuc G81/G83/G84 but use named argument parameters.',
          tags: ['siemens','cycles','drilling']
        },
        {
          q: 'On a Siemens 840D, what is the RESET + NC START sequence used for during program prove-out?',
          opts: ['Hard reboot of the controller','Reset moves program pointer to start; NC START executes. Used to re-run from the beginning after a stop or edit.','Emergency stop and restart','Clears all tool offsets'],
          ans: 1, diff: 1,
          exp: 'RESET on Sinumerik moves the program cursor to the beginning (equivalent to Fanuc RESET). NC START is the cycle start button. The sequence RESET → NC START reruns the program from line 1 — standard prove-out practice.',
          tags: ['siemens','operation','prove-out']
        },
        {
          q: 'Siemens G-code uses TRANS X10 Y20. What does this do?',
          opts: ['Sets the feedrate to X=10, Y=20 IPM','Activates a programmable zero offset — shifts the current coordinate system by X10, Y20 from the current datum','Scales all dimensions by 10 in X and 20 in Y','Rotates the coordinate system 10 degrees around Z'],
          ans: 1, diff: 2,
          exp: 'TRANS is the Siemens programmable zero offset (equivalent to G52 on Fanuc). TRANS X10 Y20 shifts the active work zero by 10 in X and 20 in Y. ATRANS accumulates offsets. ROT rotates. SCALE scales. These are powerful pattern programming tools.',
          tags: ['siemens','offsets','TRANS','advanced']
        },
        {
          q: 'On Sinumerik 828D, a "channel" refers to:',
          opts: ['A coolant delivery path','An independent machining axis group that can execute its own NC program simultaneously — used in multi-spindle and multi-turret machines','A specific controller memory bank','A communication port for DNC transfer'],
          ans: 1, diff: 3,
          exp: 'Sinumerik channels are independent NC program execution paths. A machine with two turrets and two spindles uses two channels running simultaneously. Channel synchronization (WAITM) coordinates operations between channels — essential for multi-spindle lathe and mill-turn machines.',
          tags: ['siemens','multi-channel','advanced']
        },
      ]
    },

    heidenhain: {
      label: 'Heidenhain iTNC 530 / TNC7',
      icon: '🟪',
      color: '#a78bfa',
      desc: 'The preferred control for high-precision die/mold, aerospace, and 5-axis work in Europe.',
      passMark: 75,
      questions: [
        {
          q: 'Heidenhain programming uses a different paradigm than ISO G-code. What is the primary programming language on Heidenhain TNC controls?',
          opts: ['ISO G-code identical to Fanuc','Heidenhain Conversational Programming (HEIDENHAIN Klartext) — using plain-language blocks like L X+25 Y+30 F200','APT (Automatically Programmed Tool)','Only CAM-generated code'],
          ans: 1, diff: 1,
          exp: 'Heidenhain Klartext (Conversational) is the native language. L = Linear move. CC = Circle Center. C = Arc. Heidenhain also accepts DIN/ISO (G-code), but Klartext is what differentiates it. L X+25 Y+30 F200 is a linear move to X25 Y30 at 200 mm/min.',
          tags: ['heidenhain','programming','klartext']
        },
        {
          q: 'In Heidenhain Klartext, what does "L X+50 Y+30 R0 FMAX M3" mean?',
          opts: ['Arc to X50 Y30 at max feed','Linear move to X=50, Y=30, no cutter compensation (R0), at maximum rapid speed, spindle CW','Loop 50 times at Y=30','Return to home at max speed'],
          ans: 1, diff: 1,
          exp: 'L = Linear move. X+50 Y+30 = coordinates. R0 = no radius compensation (R+ = left comp, R- = right comp). FMAX = maximum rapid speed. M3 = spindle CW. This is a clean, readable positioning move in Klartext format.',
          tags: ['heidenhain','klartext','motion']
        },
        {
          q: 'On a Heidenhain TNC, what is the function of CYCL DEF 247?',
          opts: ['Defines a drilling cycle','Sets the datum/work zero using a KinematicsOpt calibration artifact','Defines a rigid tapping cycle','Sets the active tool length'],
          ans: 1, diff: 2,
          exp: 'CYCL DEF 247 is the Heidenhain "SET DATUM" cycle — it sets the work zero (equivalent to setting G54). When combined with a touch probe, it automatically finds the datum from a measured surface or bore. Essential for automation cell setups.',
          tags: ['heidenhain','datum','probing','CYCL']
        },
        {
          q: 'Heidenhain M128 activates what 5-axis function?',
          opts: ['Spindle speed in CSS mode','TCPM — Tool Center Point Management (equivalent to Fanuc G43.4 RTCP). Keeps the tool tip stationary while rotating axes move.','Axis mirroring in XY plane','Automatic cutter radius compensation'],
          ans: 1, diff: 2,
          exp: 'M128 activates TCPM (Tool Center Point Management) on Heidenhain — the 5-axis feature that compensates for rotary axis motion to keep the tool tip at the programmed position. Without M128 on 5-axis work, the tool tip arcs away from the programmed surface as rotary axes move.',
          tags: ['heidenhain','5-axis','TCPM','advanced']
        },
        {
          q: 'On a Heidenhain control, what does "FN 0: Q25 = +1.5" do?',
          opts: ['Sets feedrate to 1.5 mm/min','Assigns the value 1.5 to Q parameter Q25 — Q parameters are Heidenhain\'s equivalent to Fanuc macro variables','Activates cycle 25','Sets the origin offset to 1.5mm'],
          ans: 1, diff: 2,
          exp: 'Q parameters (Q0–Q1999+) are Heidenhain\'s parametric variables. FN 0 is the assignment function. FN 1 = add. FN 2 = subtract. Q parameters enable parametric programming equivalent to Fanuc Macro B — family of parts, calculated coordinates, and adaptive logic.',
          tags: ['heidenhain','Q-parameters','parametric']
        },
        {
          q: 'When switching from Heidenhain TNC 530 to TNC7, which significant programming difference must you be aware of?',
          opts: ['TNC7 uses only G-code — Klartext is no longer supported','TNC7 introduces a modernized Klartext with function-based programming and extended Q parameter syntax, while remaining backward compatible with 530 programs. CAD/CAM file import and conversational 3D simulation are significantly enhanced.','TNC7 is identical to TNC 530 — no changes','TNC7 requires all programs to be rewritten in ISO'],
          ans: 1, diff: 3,
          exp: 'TNC7 is largely backward compatible but introduces extended functions, improved 3D simulation, enhanced probing cycles, and better network/DNC integration. Programs from 530 generally run on TNC7 with minor adjustments. Understanding the extended Q parameter and FN function set is key.',
          tags: ['heidenhain','TNC7','compatibility']
        },
      ]
    },
  }, // end controllers

  // ─────────────────────────────────────────────────────────────────
  // MACHINE TYPE TESTS
  // ─────────────────────────────────────────────────────────────────
  machines: {

    vmc: {
      label: 'Vertical Machining Center',
      icon: '🔩',
      color: '#4a9eff',
      desc: '3-axis VMC operation, setup, and programming fundamentals.',
      passMark: 75,
      questions: [
        {
          q: 'On a VMC, the spindle is at Z+5.0 (5" above part zero). You need to plunge to Z-0.5" for a pocket. What is the correct move sequence?',
          opts: ['G00 Z-0.5 — rapid directly to depth','G00 Z0.1 (rapid to clearance above part), then G01 Z-0.5 F[feed] (feed to depth)','G01 Z-0.5 at full rapid — G01 is always safe','G28 Z0 then G01 Z-0.5'],
          ans: 1, diff: 1,
          exp: 'Always rapid to a clearance plane just above the surface (Z0.1 or your R plane), then feed into the cut with G01. Rapid directly to Z-0.5 would plunge at full rapid speed into the material — certain tool breakage.',
          tags: ['VMC','plunge','safety']
        },
        {
          q: 'Why do VMC programs require G43 H[n] when calling a new tool?',
          opts: ['G43 activates the ATC (Auto Tool Changer)','G43 applies the tool length offset — it tells the controller how long the tool is so Z0 corresponds to the part surface, not the spindle nose','G43 sets the spindle RPM','G43 activates coolant through the tool'],
          ans: 1, diff: 1,
          exp: 'Without G43 H[n], the controller has no knowledge of tool length. All Z moves would reference the spindle nose — and every tool has a different length. G43 H[n] adds the stored tool length value to all Z commands, so Z0 = part surface regardless of tool length.',
          tags: ['VMC','G43','TLO']
        },
        {
          q: 'You are setting up a VMC to machine two identical parts simultaneously in one vise. What is the best approach?',
          opts: ['Offset all XY coordinates for the second part manually in the program','Set G54 for part 1 datum and G55 for part 2 datum. Use the same program with G54/G55 calls to machine both.','Run the program twice, stopping between parts to reposition','Combine both parts into one coordinate system and adjust coordinates'],
          ans: 1, diff: 1,
          exp: 'Dual Work Coordinate Systems (G54 and G55) are purpose-built for this. Each stores an independent datum. The program calls G54 to machine part 1, then G55 for part 2 — identical code, different physical location. This scales easily to G56, G57, etc.',
          tags: ['VMC','WCS','multi-part']
        },
        {
          q: 'During a face milling operation on a VMC, you observe chatter (vibration/noise) and poor surface finish. Which combination of changes is most likely to resolve the issue?',
          opts: ['Increase RPM and feedrate — faster is better','Reduce depth of cut, increase feedrate per tooth, verify workholding rigidity, check insert condition','Reduce feedrate only and continue','Increase coolant flow'],
          ans: 1, diff: 2,
          exp: 'Chatter is caused by vibration resonance. Solutions: reduce radial depth (reduce cutting forces), increase chipload per tooth (faster feed, fewer teeth engaged), verify the vise is torqued and the parallels are seated, and inspect inserts for wear. Reducing feed alone often makes chatter worse.',
          tags: ['VMC','chatter','feeds-speeds']
        },
      ]
    },

    lathe_machine: {
      label: 'CNC Lathe / Turning Center',
      icon: '⚙️',
      color: '#00e5b0',
      desc: 'Lathe-specific operation, tooling, and programming tests.',
      passMark: 75,
      questions: [
        {
          q: 'On a CNC lathe, the chuck jaws are set for a 2.0" diameter billet. You load a 3.0" billet. What is the immediate risk?',
          opts: ['The machine will alarm and stop automatically','The jaws will crush the larger billet','The jaws cannot achieve proper grip pressure — the billet can be ejected from the chuck at operating RPM','The chuck will automatically adjust'],
          ans: 2, diff: 1,
          exp: 'Chucks must be set for the correct diameter range. Oversized stock with under-jaw-travel means insufficient grip surface contact. At cutting RPM and force, the workpiece can eject — a serious safety hazard. Always confirm jaw travel matches the stock diameter.',
          tags: ['lathe','chuck','safety']
        },
        {
          q: 'What is the correct Z direction convention for most CNC lathes?',
          opts: ['Z+ moves the turret toward the chuck face; Z- moves away','Z+ moves the turret away from the chuck (toward the tailstock); Z- moves toward the chuck','Z is the radial axis on a lathe','Z direction is machine-specific and cannot be generalized'],
          ans: 1, diff: 1,
          exp: 'Standard convention: Z+ points away from the chuck (toward tailstock). Z- moves toward the chuck face. This means a facing pass (cutting toward center of the face) moves in the Z- direction, and turning along the OD moves in Z-.',
          tags: ['lathe','axes','coordinates']
        },
        {
          q: 'A lathe is in the middle of a threading cycle when you press Feed Hold. What happens?',
          opts: ['The machine stops immediately at the current position','Feed Hold is ignored during threading — the cycle must complete or be RESET. Stopping mid-thread ruins the thread and can crash the tool.','The spindle stops but the Z continues','The Z axis stops but the spindle continues'],
          ans: 1, diff: 2,
          exp: 'During a threading cycle (G32, G76, or G92), spindle rotation and Z feed are synchronized. Feed Hold interrupts Z motion but the spindle continues — destroying the synchronization and ruining the thread. Threading cycles must be allowed to complete or fully RESET.',
          tags: ['lathe','threading','safety','critical']
        },
        {
          q: 'What is the purpose of the nose radius compensation (G41/G42) on a CNC lathe?',
          opts: ['Compensates for the tool nose radius so contoured profiles are dimensionally accurate at tangent points','Controls the spindle direction','Compensates for tool wear','Sets the maximum depth of cut'],
          ans: 0, diff: 2,
          exp: 'Tool nose radius compensation (TNRC) accounts for the physical radius on the tool tip. Without it, turning a taper or radius will produce undersized features at tangent points because the program assumes a sharp point tool. G41/G42 with T (imaginary tool tip number 1-8) corrects this automatically.',
          tags: ['lathe','TNRC','G41','contouring']
        },
      ]
    },

    swiss: {
      label: 'Swiss-Type CNC Lathe',
      icon: '🇨🇭',
      color: '#f5c518',
      desc: 'Swiss screw machine concepts — guide bushing, gang tooling, sliding headstock.',
      passMark: 70,
      questions: [
        {
          q: 'What is the primary advantage of a Swiss-type lathe\'s guide bushing over a standard CNC lathe chuck?',
          opts: ['Guide bushings are cheaper than chucks','The guide bushing supports the workpiece at the cutting zone — eliminating the long overhang that causes deflection. This enables high-precision turning of small-diameter, long parts at very close tolerances.','Guide bushings allow higher RPM','Guide bushings hold a wider range of diameters'],
          ans: 1, diff: 1,
          exp: 'The guide bushing is the defining feature of Swiss machining. It supports the bar at the point of cutting, not at the chuck. For small-diameter parts (under 32mm typically), this eliminates flexion and enables tolerances of ±0.0001" or better on long turned features.',
          tags: ['swiss','guide-bushing','fundamentals']
        },
        {
          q: 'On a Swiss CNC, what does "Z-axis on the headstock" mean for programming?',
          opts: ['Z is always positive on a Swiss','The headstock (and the bar) moves in Z — not the tool. The tool is fixed. Z+ feeds material through the guide bushing toward the tools.','Z controls the spindle speed','There is no Z axis on a Swiss lathe'],
          ans: 1, diff: 2,
          exp: 'Swiss lathes are inverted: the headstock carries the bar and moves in Z. The tools are fixed on the gang slide. Programming Z+ advances the bar toward the tools. This is the opposite conceptual motion from a conventional lathe where the turret moves in Z.',
          tags: ['swiss','axes','programming']
        },
      ]
    },

    hmc: {
      label: 'Horizontal Machining Center',
      icon: '🏭',
      color: '#ff6b35',
      desc: 'HMC fundamentals — tombstone fixturing, pallet systems, and multi-face setups.',
      passMark: 70,
      questions: [
        {
          q: 'What is the primary production advantage of an HMC with a pallet changer over a VMC?',
          opts: ['HMCs are faster on all operations','The pallet changer allows workpiece loading/unloading to occur simultaneously with machining on the other pallet — eliminating spindle-down time during part changes','HMCs have higher spindle speeds','HMCs use less coolant'],
          ans: 1, diff: 1,
          exp: 'The pallet changer is the key productivity advantage. While one pallet is in the machining envelope being cut, the operator loads the next part on the second pallet outside the machine. Part change time approaches zero — the machine never stops for loading.',
          tags: ['HMC','pallet','productivity']
        },
        {
          q: 'On an HMC with a B-axis rotary table, you need to machine 4 faces of a cube. How many setups are required if you use a tombstone fixture?',
          opts: ['4 setups — one per face','1 setup — the B-axis indexes to each face. Multiple parts can be fixtured on a tombstone and all faces machined in a single pallet cycle.','2 setups — top and sides','8 setups — every surface'],
          ans: 1, diff: 1,
          exp: 'The B-axis (rotary table) is the HMC\'s power feature. A tombstone holds multiple parts. The B-axis indexes 90° between operations, exposing each face. All 4 faces are machined in one pallet cycle — dramatically reducing setup time compared to VMC multi-setup approaches.',
          tags: ['HMC','tombstone','B-axis','setup']
        },
      ]
    },
  }, // end machines

  // ─────────────────────────────────────────────────────────────────
  // GD&T TEST BANK
  // ─────────────────────────────────────────────────────────────────
  gdnt: {
    label: 'GD&T — Geometric Dimensioning & Tolerancing',
    icon: '📐',
    color: '#a78bfa',
    desc: 'ASME Y14.5 — symbols, tolerance zones, datum reference frames, bonus tolerance.',
    passMark: 75,

    symbols: [
      { symbol: '⏤',  name: 'Straightness',       type: 'Form',        datumReq: false },
      { symbol: '○',  name: 'Circularity',         type: 'Form',        datumReq: false },
      { symbol: '⏥',  name: 'Flatness',            type: 'Form',        datumReq: false },
      { symbol: '⌭',  name: 'Cylindricity',        type: 'Form',        datumReq: false },
      { symbol: '∥',  name: 'Parallelism',         type: 'Orientation', datumReq: true  },
      { symbol: '⊥',  name: 'Perpendicularity',    type: 'Orientation', datumReq: true  },
      { symbol: '∠',  name: 'Angularity',          type: 'Orientation', datumReq: true  },
      { symbol: '⌖',  name: 'True Position',       type: 'Location',    datumReq: true  },
      { symbol: '◎',  name: 'Concentricity',       type: 'Location',    datumReq: true  },
      { symbol: '⌯',  name: 'Symmetry',            type: 'Location',    datumReq: true  },
      { symbol: '↗',  name: 'Line Profile',        type: 'Profile',     datumReq: false },
      { symbol: '⌓',  name: 'Surface Profile',     type: 'Profile',     datumReq: false },
      { symbol: '↻',  name: 'Circular Runout',     type: 'Runout',      datumReq: true  },
      { symbol: '↺',  name: 'Total Runout',        type: 'Runout',      datumReq: true  },
    ],

    questions: [
      {
        q: 'A feature control frame reads: [⊥ | 0.005 | A]. What does this specify?',
        opts: [
          'The surface must be flat within 0.005"',
          'The surface (or axis) must be perpendicular to Datum A within a 0.005" tolerance zone',
          'The surface must be parallel to Datum A within 0.005"',
          'The bore must be concentric to Datum A within 0.005"'
        ],
        ans: 1, diff: 1,
        exp: '⊥ = Perpendicularity. 0.005 = tolerance zone width. A = datum reference. The feature (surface or axis) must fall within a 0.005" wide zone that is perfectly perpendicular to Datum A. This is an Orientation control and requires a datum.',
        tags: ['GD&T','perpendicularity','orientation','feature-control-frame']
      },
      {
        q: 'Which GD&T tolerance type does NOT require a datum reference in the feature control frame?',
        opts: ['True Position','Perpendicularity','Flatness','Runout'],
        ans: 2, diff: 1,
        exp: 'Form tolerances (Flatness, Straightness, Circularity, Cylindricity) are self-contained — they control the shape of the feature itself, not its relationship to anything else. Therefore, they require NO datum. All Location, Orientation, Runout, and Profile-to-datum controls require a datum reference.',
        tags: ['GD&T','form','flatness','datum']
      },
      {
        q: 'A bore is called out with True Position of ⌀0.010 at MMC (Maximum Material Condition). The bore nominal is ⌀0.500 with a +0.002/-0.000 tolerance. If the bore measures ⌀0.501 (0.001 over MMC), what is the total available position tolerance?',
        opts: ['0.010" (no bonus — MMC is fixed)','0.011" (0.010 + 0.001 bonus from departure from MMC)','0.009" (departure reduces tolerance)','0.010" at any size — MMC only affects form'],
        ans: 1, diff: 2,
        exp: 'Bonus tolerance = departure from MMC. MMC for a bore (internal feature) = smallest size = 0.500". Actual = 0.501" = 0.001" larger than MMC. Bonus = 0.001". Total position tolerance = 0.010 + 0.001 = 0.011". This is the power of MMC — parts get more position tolerance as they depart from worst-case material condition.',
        tags: ['GD&T','true-position','MMC','bonus-tolerance']
      },
      {
        q: 'What is the difference between Circular Runout and Total Runout?',
        opts: [
          'They are identical — the terms are interchangeable',
          'Circular Runout checks each individual cross-section as the part rotates. Total Runout sweeps the entire surface simultaneously and controls both circularity AND cylindricity combined.',
          'Circular Runout applies to flat faces; Total Runout to cylindrical surfaces',
          'Total Runout is more lenient than Circular Runout'
        ],
        ans: 1, diff: 2,
        exp: 'Circular Runout: indicator reads one circular cross-section at a time as the part rotates — controls circular error at each cross-section. Total Runout: indicator traverses the full surface while the part rotates — controls the entire surface simultaneously, combining both out-of-roundness and taper errors. Total Runout is the stricter control.',
        tags: ['GD&T','runout','circular-runout','total-runout']
      },
      {
        q: 'A Datum Reference Frame (DRF) is established with Datums A, B, C. What is the purpose of the DRF?',
        opts: [
          'It defines the three largest surfaces of the part',
          'It establishes a mutually perpendicular coordinate system (3-2-1 constraint) that eliminates all 6 degrees of freedom — providing a repeatable, unambiguous reference for all GD&T callouts on the part',
          'It specifies the order of machining operations',
          'It defines the tolerance stack between features'
        ],
        ans: 1, diff: 2,
        exp: 'The DRF (3-2-1 principle): Datum A (primary, 3-point contact) removes 3 DOF (1 translation + 2 rotations). Datum B (secondary, 2-point contact) removes 2 more DOF. Datum C (tertiary, 1-point contact) removes the final DOF. The result is a fully constrained, repeatable coordinate system — ensuring every inspector, machinist, and CAM programmer measures from the same reference.',
        tags: ['GD&T','datum','DRF','3-2-1']
      },
      {
        q: 'Surface Profile [0.010 A B C] is called out on a complex curved surface. What does this control?',
        opts: [
          'Only the surface roughness (Ra)',
          'The entire surface must fall within a 0.010" wide tolerance band (0.005 each side of the true profile) relative to Datums A, B, C — controlling size, form, orientation, AND location of the surface simultaneously',
          'Only the form of the surface — not its location',
          'Only the location of the surface center — not its shape'
        ],
        ans: 1, diff: 2,
        exp: 'Surface Profile is one of the most powerful GD&T controls — it simultaneously constrains form (shape), orientation, AND location of a surface. The tolerance zone is a uniform band offset equally on each side of the true profile. With datums, it is a full 3D constraint. This is the primary control used in aerospace, mold, and die work where complex surfaces must be tightly controlled.',
        tags: ['GD&T','profile','surface-profile','advanced']
      },
      {
        q: 'The symbol ⌖ (True Position) with a tolerance of ⌀0.014 means the tolerance zone is:',
        opts: [
          'A square zone ±0.014" in X and ±0.014" in Y',
          'A cylindrical zone of diameter 0.014" — the feature axis must fall within this cylinder centered on the true position',
          'A ±0.007" bilateral tolerance in each direction',
          'The feature must be within 0.014" of the datum surface'
        ],
        ans: 1, diff: 2,
        exp: 'The ⌀ symbol before the tolerance value indicates a CYLINDRICAL tolerance zone. The feature axis must fall within a cylinder of ⌀0.014" centered on the true position. This is more lenient than a ±0.007 square zone — the cylindrical zone has 57% more area than the equivalent square zone, which is why position tolerances typically use cylindrical zones.',
        tags: ['GD&T','true-position','cylindrical-zone','tolerance']
      },
      {
        q: 'What does "Regardless of Feature Size" (RFS) mean on a GD&T callout?',
        opts: [
          'The tolerance increases as the part size increases',
          'The stated geometric tolerance applies at ALL sizes of the feature — no bonus tolerance is available. The tolerance is fixed regardless of actual measured size.',
          'The tolerance only applies at the maximum material condition',
          'The feature size tolerance is disregarded for inspection'
        ],
        ans: 1, diff: 2,
        exp: 'RFS (Regardless of Feature Size) means the geometric tolerance is fixed and does not change with the actual feature size. There is no bonus tolerance. In ASME Y14.5-2009 and later, RFS is the DEFAULT condition — you must explicitly call out MMC or LMC modifiers (circled M or L) if you want bonus tolerance.',
        tags: ['GD&T','RFS','MMC','modifiers']
      },
    ]
  }, // end gdnt

  // ─────────────────────────────────────────────────────────────────
  // INTERVIEW PREP — General CNC Knowledge
  // ─────────────────────────────────────────────────────────────────
  interview: {
    label: 'Interview Prep — CNC Knowledge',
    icon: '💼',
    color: '#f5c518',
    desc: 'Timed 20-question test covering general CNC knowledge. Simulates a real shop interview.',
    passMark: 80,
    timeLimit: 1200, // 20 minutes in seconds
    questions: [
      {
        q: 'An employer asks: "What is the difference between a geometry offset and a wear offset?" How do you answer?',
        opts: [
          '"They are the same thing — offsets are offsets."',
          '"Geometry offset is the large measured distance from machine home to the tool tip — set once during setup. Wear offset is a small incremental adjustment applied during production to fine-tune part dimensions without re-touching tools."',
          '"Wear offset is set during setup; geometry is adjusted during production."',
          '"Geometry offset controls X; wear offset controls Z."'
        ],
        ans: 1, diff: 1,
        exp: 'This is a standard interview qualifier question. A clear, confident answer distinguishing geometry (one-time measured, large value) from wear (production trim, small value) demonstrates real floor experience.',
        tags: ['interview','offsets','operator']
      },
      {
        q: 'You are asked: "What would you do if you were running a part and the OD measured 0.005" oversize?" How do you respond?',
        opts: [
          '"Scrap the part and start over."',
          '"Apply -0.005" to the X wear offset of the OD turning tool, run the next part, measure, and verify before resuming production."',
          '"Increase the spindle speed by 10%."',
          '"Reset the machine and re-home."'
        ],
        ans: 1, diff: 1,
        exp: 'This tests your understanding of the offset correction workflow. The correct answer shows: identify the tool, apply the signed correction to wear, verify with the next part. A good follow-up would be to mention you would not adjust more than the error amount in one step.',
        tags: ['interview','offsets','production']
      },
      {
        q: 'An interviewer asks: "What is SFM and how does it affect tool selection?"',
        opts: [
          '"Surface Footage per Minute — I adjust it by changing the RPM. Lower SFM for harder materials, higher SFM for aluminum."',
          '"I don\'t use SFM — I just use the speed on the screen."',
          '"SFM is the same as feedrate."',
          '"SFM is only relevant for grinding operations."'
        ],
        ans: 0, diff: 1,
        exp: 'SFM (Surface Feet per Minute) is the cutting speed at the tool-material interface. Higher SFM for soft materials (aluminum 800-1200 SFM), lower for hard materials (steel 200-400 SFM, titanium 50-100 SFM). Knowing this shows you understand the physics of cutting, not just button-pushing.',
        tags: ['interview','SFM','feeds-speeds']
      },
      {
        q: '"Have you ever caused a crash? What happened?" This is a common interview question. What is the best response?',
        opts: [
          '"No — never. I have a perfect record."',
          '"Deny it — crashes look bad on your record."',
          '"Yes, early in my career [brief honest description]. Here is what I learned and how I changed my process to prevent recurrence." Honesty + lesson learned > perfect record claim.',
          '"I refuse to answer that question."'
        ],
        ans: 2, diff: 1,
        exp: 'Experienced CNC professionals know that everyone causes a crash eventually. Claiming a perfect record is either dishonest or signals inexperience. Experienced interviewers prefer candidates who can honestly describe a mistake, explain what caused it, and articulate what they changed afterward.',
        tags: ['interview','soft-skills','professional']
      },
      {
        q: 'What does "first article inspection" mean in a production context?',
        opts: [
          'Inspecting the first machine ever purchased',
          'A thorough dimensional inspection of the first part produced from a new setup — verifying ALL print dimensions before releasing the setup for production',
          'Inspecting only the most critical dimension on the first part',
          'The first inspection of the day'
        ],
        ans: 1, diff: 1,
        exp: 'First Article Inspection (FAI) is a formal process to verify that a new setup produces a part that conforms to all print requirements before starting a production run. It typically involves measuring every dimension on the print, documenting results, and having the setup approved by quality or engineering.',
        tags: ['interview','FAI','quality']
      },
      {
        q: 'An interviewer asks about your experience with tolerances. "What is the tightest tolerance you have personally held in production?"',
        opts: [
          '"±0.500" — that\'s what most prints call out."',
          '"I have held ±0.0005" on turned diameters using G96 CSS mode, fine-finishing inserts, and post-process measurement with digital micrometers." (Adjust to your actual experience — specificity demonstrates authenticity.)',
          '"I don\'t pay attention to tolerances — the machine is automatic."',
          '"I have never looked at tolerances — that\'s the engineer\'s job."'
        ],
        ans: 1, diff: 1,
        exp: 'This question tests experience depth. A confident, specific answer with the process behind it (CSS mode, correct tooling, measurement method) is far more compelling than a vague number. Be honest — they may ask follow-up technical questions about how you achieved it.',
        tags: ['interview','tolerances','experience']
      },
    ]
  },
};
