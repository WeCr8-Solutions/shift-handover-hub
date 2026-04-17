// ─────────────────────────────────────────────
// DATA: COURSE CURRICULUM
// ─────────────────────────────────────────────
const CURRICULUM = {

  // ═══════════════════════════════════════════════════════════════
  // CNC LATHE TRACK
  // ═══════════════════════════════════════════════════════════════
  lathe: {

    // ── LATHE BEGINNER ────────────────────────────────────────────
    // GOAL: A person who has never touched a CNC machine can finish this
    //       level and work safely on a shop floor as a machine operator.
    //       No programming knowledge required. Covers: safety, machine
    //       anatomy, control panel, powering on, homing, loading programs,
    //       reading a setup sheet, tool offsets, running a part, coolant,
    //       alarms, and what to do when something goes wrong.
    beginner: {
      color: 'var(--beginner)',
      icon: '🟢',
      title: 'Lathe Beginner',
      subtitle: 'Become a floor-ready CNC lathe operator — safety, setup, and running parts',
      lessons: [
        {
          id:'l-b-1', free:true,
          gcode:'SAFETY', title:'Shop Floor Safety & Machine Awareness',
          sub:'PPE, machine zones, and what can kill you',
          theory:`Before you touch any CNC machine, safety is non-negotiable. CNC lathes rotate workpieces at hundreds to thousands of RPM and move tools with enormous force. A single wrong action can result in serious injury or death.<br><br>
<strong style="color:var(--accent)">Personal Protective Equipment (PPE):</strong> Safety glasses (always — flying chips are the #1 eye hazard), no loose clothing or gloves near rotating spindles, no jewelry, tie back long hair. Steel-toed boots on most shop floors.<br><br>
<strong style="color:var(--accent)">Machine Zones:</strong> The danger zone is the area around the chuck and spindle when it's rotating. Never reach into the machine while the spindle is running. Never open the door while the spindle is in motion — most modern machines lock the door, but never rely on this.<br><br>
<strong style="color:var(--accent)">Emergency Stop (E-Stop):</strong> Know where it is before the machine moves. The E-Stop is always the large red mushroom button. It cuts all power to axes and spindle immediately.`,
          table:[
            ['Hazard','Risk','Prevention'],
            ['Rotating chuck/spindle','Entanglement — extremely dangerous','Never reach in while running. Door closed, spindle stopped.'],
            ['Flying chips','Eye injury, cuts','Always wear safety glasses. Keep door closed during cuts.'],
            ['Hot chips','Burns','Use chip hook, not your hands. Let chips cool.'],
            ['Coolant','Slip hazard, skin irritation','Clean spills immediately. Avoid prolonged skin contact.'],
            ['Program error / crash','Machine/tooling damage, injury','Single-block first run, feed hold ready, watch the machine.'],
          ],
          warn:'Never wear gloves near a rotating spindle or chuck. Gloves can catch and pull your hand into the machine faster than you can react.',
          quiz:{ q:'You are about to open the machine door to measure a part. What must you verify first?',
            opts:['The coolant is off','The spindle is completely stopped and the program is in Feed Hold or stopped','The lights are on in the machine','The tool is at home position'],
            ans:1, fb:'Always confirm the spindle is fully stopped before opening the door or reaching into the machine. Even a slowly decelerating spindle can cause serious injury.'
          },
          quizPool:[
            { q:'You are about to open the machine door to measure a part. What must you verify first?', opts:['The coolant is off','The spindle is completely stopped and the program is in Feed Hold or stopped','The lights are on in the machine','The tool is at home position'], ans:1, fb:'Always confirm the spindle is fully stopped before opening the door. Even a slowly decelerating spindle can cause serious injury.' },
            { q:'Which is the single most important piece of PPE for any CNC operator?', opts:['Steel-toe boots','ANSI Z87.1 safety glasses','Cut-resistant gloves','Hearing protection'], ans:1, fb:'Safety glasses are mandatory at all times in any machining environment. Flying chips are the #1 eye-injury source in shops.' },
            { q:'Why are gloves dangerous near a rotating spindle or chuck?', opts:['They reduce grip on the workpiece','They can catch on rotating parts and pull a hand into the machine','They make the operator overheat','They block the machine sensors'], ans:1, fb:'A glove caught by a chuck jaw or spindle gives no chance to react. This is the single most common cause of severe hand injury in machine shops.' },
            { q:'The Emergency Stop (E-Stop) on a CNC lathe does what?', opts:['Pauses the program at the next safe block','Cuts all powered motion — spindle, axes, coolant — instantly','Sends the tool to home position','Closes the machine door'], ans:1, fb:'E-Stop is an immediate kill of all powered motion. It is the universal panic button on every CNC.' },
            { q:'You see hot, sharp chips piled around a finished part. The correct way to clear them is:', opts:['Brush them off by hand','Blow them off with shop air directed at your face','Use a chip hook or brush after the spindle has fully stopped','Wipe them with a shop rag'], ans:2, fb:'Hot chips burn and sharp chips cut. Always use a chip hook or brush, never bare hands, and never compressed air directed at skin or eyes.' },
            { q:'A coolant spill on the floor near a CNC lathe is a hazard primarily because:', opts:['It corrodes the floor','It can cause a slip-and-fall into the running machine','It smells bad','It costs money to refill'], ans:1, fb:'A slip near an operating machine can put a person directly into the work envelope. Clean spills immediately.' },
            { q:'When is it safe to reach inside the machine to remove a chip nest from around the chuck?', opts:['When the spindle is decelerating','When the door is open and the spindle has fully stopped','When the program is in Feed Hold','When the operator panel shows green'], ans:1, fb:'Only when the spindle is fully stopped and the program is in a stopped/reset state. Feed Hold leaves the spindle running.' },
            { q:'A new operator wants to wear loose-fitting long sleeves to keep coolant off their forearms. What is the safety policy?', opts:['Allowed if the cuffs are unbuttoned','Not allowed — loose sleeves can be caught by the chuck or turret. Use sleeve guards or fitted shirts.','Allowed if the operator stays 6 ft from the machine','Allowed if the door is closed'], ans:1, fb:'Loose clothing is a primary entanglement hazard. The shop uniform should be fitted, with no dangling material near the machine.' },
            { q:'You hear an unusual grinding noise during a cut. What is the FIRST action?', opts:['Hit E-Stop and investigate','Increase feedrate to push through it','Turn up the radio so you cannot hear it','Open the door to look closer'], ans:0, fb:'Unusual noise = something is wrong. Stop the machine immediately and investigate before damage compounds.' },
            { q:'Why must long hair be tied back in a machining environment?', opts:['It gets in the way of safety glasses','It can be pulled into rotating tooling, chucks, or spindles — fatal entanglement risk','It clogs coolant filters','Company image policy'], ans:1, fb:'Hair caught by a chuck or rotating tool gives no escape. Tie it back, net it, or wear a hat that fully contains it.' },
            { q:'The shop floor is loud (90 dB) for an 8-hour shift. What hearing protection rating is appropriate?', opts:['NRR 5','NRR 15','NRR 25 or higher (foam plugs or muffs)','None required'], ans:2, fb:'OSHA action level is 85 dB averaged over 8 hours. NRR 25+ foam plugs or earmuffs are standard. Permanent hearing loss is cumulative and irreversible.' },
            { q:'A coworker is operating a machine and a chip flies into your eye even though you are 10 ft away. What does this prove about safety glasses?', opts:['Glasses are only required for the operator','Safety glasses are required by anyone in the machining area, not just the operator','You should stand farther away','Eye injuries from chips are rare'], ans:1, fb:'Chips travel. Anyone inside the shop floor — operators, supervisors, visitors — must wear safety glasses at all times.' },
            { q:'Which of these is NOT considered acceptable PPE substitution?', opts:['Prescription safety glasses with side shields','OSHA-rated face shield over safety glasses for grinding','Regular eyeglasses without side shields','Goggles for chemical handling'], ans:2, fb:'Standard prescription glasses without side shields do not meet ANSI Z87.1. They allow chips to enter from the side.' },
            { q:'You smell burning oil during a cut. What is the most likely cause and the correct action?', opts:['Normal smell, ignore it','Tool is dull or coolant has failed — Feed Hold and inspect','Open the door for ventilation','Switch to a higher RPM'], ans:1, fb:'Burning oil smell means heat is high — failed coolant flow, dull tool, or wrong feed/speed. Feed Hold, inspect, fix the cause before continuing.' },
            { q:'A small fire starts inside the machine due to oil-soaked chips. The first response is:', opts:['Hit E-Stop, evacuate the work envelope, alert others, use the appropriate Class B extinguisher','Open the door to fan the flames','Pour coolant on it','Continue running and hope it goes out'], ans:0, fb:'Stop the machine, evacuate the immediate area, sound the alarm, then use a Class B extinguisher (or Class D for combustible metal chips). Never water or coolant on oil fires.' },
            { q:'Why must the chuck jaws be checked for proper grip BEFORE pressing Cycle Start?', opts:['It is a regulatory requirement only','A loose part will be ejected at lethal velocity by the spinning chuck','It saves wear on the jaws','It improves tool life'], ans:1, fb:'A part thrown from a lathe chuck has the energy of a bullet. Always verify jaw pressure, jaw position, and that the part is fully seated before any spindle command.' },
            { q:'What is the purpose of the door interlock on a modern CNC lathe?', opts:['Prevents dirt from entering the machine','Prevents the spindle from running while the door is open (in run mode)','Saves electricity','Reduces noise'], ans:1, fb:'The interlock is a safety device that prevents motion when the door is open. NEVER bypass or defeat a door interlock — it is one of your last lines of defense.' },
            { q:'A coworker disables a door interlock so they can run with the door open for "easier" parts loading. What do you do?', opts:['Help them — it speeds up production','Ignore it — not your machine','Stop the machine, report it to a supervisor immediately. Defeating safety devices violates OSHA and is grounds for termination.','Disable yours too'], ans:2, fb:'Defeating safety interlocks is a serious OSHA violation (1910.212) and a documented cause of fatal accidents. Report it immediately — silence makes you complicit.' },
            { q:'Before starting your shift, what is the recommended walk-around inspection?', opts:['Skip it if the previous operator says it ran fine','Look for fluid leaks, chip buildup, missing guards, alarms on the screen, and verify the E-Stop releases properly','Just check the chuck pressure','Only check coolant level'], ans:1, fb:'A pre-shift walk-around catches problems before they become incidents — leaks, missing guards, prior-shift damage, low coolant. Make it routine.' },
            { q:'Compressed air is sometimes used to blow chips off a part. What is the safety rule?', opts:['Use full shop pressure, point at face for fastest clean','Never direct compressed air at skin (can embolize) or eyes (can drive chips deeper). Use no more than 30 psi at the nozzle.','Always wear gloves while blowing','Air pressure does not matter'], ans:1, fb:'OSHA limits compressed air for cleaning to 30 psi at the nozzle, with chip guards and required PPE. Air injected into skin can cause an embolism — fatal.' },
            { q:'You notice a "Lockout/Tagout" tag on a machine you were planning to operate. What is the correct action?', opts:['Remove the tag and continue','Do NOT operate the machine. Only the person whose name is on the lock may remove it. Notify your supervisor if production is affected.','Operate the machine carefully','Cut the lock off'], ans:1, fb:'A LOTO tag means a worker is performing maintenance with energy isolated. Removing another person’s lock can kill them. One person, one lock — no exceptions, ever.' },
            { q:'During a coolant fill, you spill concentrate on your skin. What does the SDS likely instruct?', opts:['Wipe it off and continue','Wash the affected area with water for 15 minutes; refer to the SDS for specific symptoms; report to supervisor','Apply more coolant to dilute','Wait to see if a rash develops'], ans:1, fb:'SDS sheets give specific first-aid for each chemical. Default for skin contact: flush with water for 15 minutes and consult the SDS. Report all chemical exposure to your supervisor.' },
            { q:'The single most common cause of CNC operator injuries is:', opts:['Falling tools','Failure to follow established safety procedures (taking shortcuts)','Coolant exposure','Electrical shock'], ans:1, fb:'Industry data: the vast majority of machining injuries trace back to a deliberately skipped step — door open, spindle still spinning, gloves worn near rotating parts, guards removed. Procedure exists because someone already paid the price.' },
            { q:'A senior operator tells a new hire "you do not need glasses for this short cut." What is the correct response?', opts:['Trust the senior — they have experience','Politely refuse — safety rules apply to everyone, every cut, every time. Report repeated pressure to bypass safety.','Wear glasses only if a supervisor is watching','Cut quickly and put glasses on for the next job'], ans:1, fb:'Safety rules are non-negotiable regardless of seniority. A senior operator pressuring a junior to bypass PPE is itself a reportable safety issue.' },
            { q:'You discover an unlabeled bottle of fluid near the machine. The correct action is:', opts:['Smell it to identify','Taste a drop','Do NOT use, do NOT move it without gloves, label it as "Unknown — Do Not Use," and report to a supervisor for disposal per SDS protocol','Pour it into the coolant tank'], ans:2, fb:'Unlabeled chemicals violate OSHA HazCom 1910.1200. Never use, never identify by smell or taste. Quarantine it and report immediately.' }
          ]
        },
        {
          id:'l-b-2', free:true,
          gcode:'ANATOMY', title:'CNC Lathe Machine Anatomy',
          sub:'Know every part of the machine before you operate it',
          theory:`Understanding the physical machine is the foundation of safe operation. Every CNC lathe has the same core components regardless of brand (Haas, Mazak, DMG Mori, Okuma, Doosan).<br><br>
<strong style="color:var(--accent)">Spindle & Chuck:</strong> The spindle holds and rotates the workpiece via a chuck (3-jaw, 4-jaw, or collet). The chuck jaws grip the raw material. Chuck speed is measured in RPM.<br><br>
<strong style="color:var(--accent)">Turret:</strong> The rotating tool holder that indexes different cutting tools into position. Most lathes have 8–12 tool stations. Each station holds a different tool (OD turning, boring bar, drill, threading tool, etc.).<br><br>
<strong style="color:var(--accent)">Tailstock:</strong> The support at the far end of the machine. Used with a live center to support long parts, or with a drill chuck for drilling on the centerline.<br><br>
<strong style="color:var(--accent)">Axes:</strong> X axis moves the turret toward/away from the centerline (controls diameter). Z axis moves the turret along the length of the part (controls length).`,
          table:[
            ['Component','Function','Operator Interaction'],
            ['Chuck','Holds and rotates the workpiece','Load/unload parts, confirm jaw pressure'],
            ['Turret','Holds cutting tools, indexes on command','Load tools, verify index position'],
            ['Spindle','Rotates the chuck at programmed RPM','Controlled by program — never touch while running'],
            ['Tailstock','Supports long parts / holds drills','Set position, lock before running'],
            ['Control Panel','Operator interface (Fanuc, Haas, etc.)','All machine control happens here'],
            ['E-Stop','Emergency stop — cuts all power instantly','Know its location before anything else'],
          ],
          tip:'Walk the entire machine before your first run shift. Identify the E-Stop, the door interlock, the chip conveyor on/off, and the coolant valve. Find them without looking — you may need them fast.',
          quiz:{ q:'The turret on a CNC lathe is used for:',
            opts:['Holding and rotating the workpiece','Holding cutting tools and indexing between them','Controlling the Z axis speed','Supporting long parts at the far end'],
            ans:1, fb:'The turret holds multiple cutting tools and rotates (indexes) to bring the correct tool into position. The chuck holds the workpiece.'
          }
        },
        {
          id:'l-b-3', free:true,
          gcode:'POWER ON', title:'Powering On & Homing the Machine',
          sub:'Correct startup sequence every time',
          theory:`Every CNC lathe must follow a specific power-on and homing sequence before any operation. Skipping steps causes errors, alarm states, or — in some cases — machine damage.<br><br>
<strong style="color:var(--accent)">Standard Power-On Sequence:</strong><br>
1. Main power switch (usually on the back or side of the machine) — turn ON<br>
2. Control power button on the panel — press and hold until the controller boots<br>
3. Release E-Stop by twisting it clockwise<br>
4. Press RESET to clear any initial alarms<br>
5. Execute Machine Reference / Home Return (G28 or the HOME button)<br><br>
<strong style="color:var(--accent)">Homing (Reference Return):</strong> CNC machines must return to their reference zero position (machine home) after every power cycle. This re-establishes the machine's coordinate system. Until the machine is homed, axis moves may be restricted or inaccurate.`,
          steps:[
            {n:'1', body:'<strong>Main Power ON</strong> — Breaker or key switch, usually labeled MAIN POWER. Some machines require 30 seconds warm-up after this step.'},
            {n:'2', body:'<strong>Control Power ON</strong> — The panel ON button boots the CNC controller (Fanuc, Haas, Siemens, etc.). Wait for the screen to fully load.'},
            {n:'3', body:'<strong>Release E-Stop</strong> — Twist the red mushroom button clockwise. It should pop up. A pressed E-Stop blocks all machine motion.'},
            {n:'4', body:'<strong>Press RESET</strong> — Clears startup alarms. The alarm light should go out. If alarms persist, read the alarm code before proceeding.'},
            {n:'5', body:'<strong>Home Return</strong> — Select REFERENCE or HOME mode and move each axis to its home position, or press the AUTO HOME / G28 button. All axis home indicators should illuminate.'},
            {n:'6', body:'<strong>Verify ready state</strong> — The controller should show no alarms. The machine is now ready for setup.'},
          ],
          warn:'Never attempt to run a program on a machine that has not been homed. Coordinate positions will be unreliable and a crash is likely.',
          quiz:{ q:'After powering on the control, you see an alarm on the screen. What is the correct next action?',
            opts:['Press cycle start anyway — it will clear during the run','Press RESET — if it persists, read the alarm code before proceeding','Pull the E-Stop and restart','Press HOME immediately without clearing the alarm'],
            ans:1, fb:'Always press RESET first to attempt to clear startup alarms. If the alarm persists, read and understand the alarm code before doing anything else. Running with an active alarm can cause machine damage or injury.'
          }
        },
        {
          id:'l-b-4', free:true,
          gcode:'PANEL', title:'Control Panel Navigation',
          sub:'Modes, keys, overrides — Fanuc & Haas basics',
          theory:`The CNC control panel is your interface to the machine. While panel layouts vary by brand (Fanuc, Haas, Siemens, Mitsubishi), all share the same functional modes. Understanding modes is the #1 skill for a new operator.<br><br>
<strong style="color:var(--accent)">Operating Modes:</strong>`,
          table:[
            ['Mode','What It Does','When You Use It'],
            ['EDIT','Write and edit G-code programs','Programmers and setup techs — not for operators'],
            ['MEM / AUTO','Run stored programs automatically','Production running — your main operator mode'],
            ['MDI','Manual Data Input — type one line and execute','Setting offsets, quick moves, spindle on/off tests'],
            ['JOG / HANDLE','Manually move axes with a joystick or handwheel','Setting tool offsets, checking clearances'],
            ['REF / HOME','Machine reference return','After power-on to establish coordinates'],
            ['SINGLE BLOCK','Run one line of code at a time','First-article prove-out — safest way to run a new program'],
          ],
          tip:'As an operator, your most-used modes are MEM/AUTO (running parts), MDI (quick commands), and JOG (manual positioning). Know how to switch between them instantly.',
          table2:[
            ['Key/Button','Function'],
            ['CYCLE START','Begins program execution — green button'],
            ['FEED HOLD','Pauses motion — spindle keeps running — orange/yellow'],
            ['RESET','Stops everything, rewinds program to start'],
            ['SINGLE BLOCK','Toggle: execute one block at a time'],
            ['Feed Override %','Knob/slider — reduce feed to 0-150% of programmed rate'],
            ['Spindle Override %','Knob — adjust spindle speed 50-150% of programmed speed'],
            ['DRY RUN','Run axes at rapid speed without coolant — for verification'],
          ],
          warn:'Feed Hold does NOT stop the spindle. After Feed Hold, the spindle is still rotating. Use RESET or M05 in MDI to stop the spindle before opening the door.',
          quiz:{ q:'You want to run a brand new program for the first time. Which mode and setting gives you the safest first run?',
            opts:['MEM/AUTO at 100% feedrate override','MEM/AUTO with SINGLE BLOCK ON and feedrate override at 25-50%','MDI mode','EDIT mode'],
            ans:1, fb:'Single Block ON + reduced feedrate override is the safest first-run approach. Single Block stops after every line so you can verify each move before it executes. Low feedrate gives you time to react.'
          }
        },
        {
          id:'l-b-5', free:true,
          gcode:'OFFSETS', title:'Understanding Tool Offsets',
          sub:'Geometry & wear offsets — what they are and why they matter',
          theory:`Tool offsets tell the controller exactly where the cutting tip of each tool is in space. Without correct offsets, the machine does not know where the tool is — and it will cut in the wrong location or crash.<br><br>
<strong style="color:var(--accent)">Geometry Offset:</strong> The measured distance from machine home to the tool tip. Set during setup. This is the big number — usually measured with a tool presetter or by touching off on a known surface.<br><br>
<strong style="color:var(--accent)">Wear Offset:</strong> A small adjustment applied on top of the geometry offset to fine-tune the part dimension. If your OD is 0.002" too large, you add -0.002 to the X wear offset. This is what operators adjust during production.<br><br>
<strong style="color:var(--accent)">How to Apply a Wear Adjustment:</strong><br>
Measure the part → compare to print → calculate the difference → enter the adjustment in the wear column for that tool number. Always enter the error as a signed value: if part is 0.003 too big, enter -0.003 in wear X.`,
          table:[
            ['Offset Type','Who Sets It','Typical Value','When You Change It'],
            ['Geometry X/Z','Setup tech or programmer','Large number (inches/mm from home)','Only at initial setup or tool replacement'],
            ['Wear X','Operator','Small: ±0.001–0.010"','When measured part is out of tolerance'],
            ['Wear Z','Operator','Small: ±0.001–0.005"','When part length is off tolerance'],
          ],
          tip:'When adjusting a wear offset, make the change in small increments — especially on a first article. A 0.003" adjustment is usually the max for any single correction without re-checking.',
          warn:'Never adjust geometry offsets during a production run. Always know whether you are in the GEOMETRY or WEAR column before entering a number.',
          quiz:{ q:'You measure a turned OD and find it is 0.004" oversize (too large). What wear offset adjustment do you make?',
            opts:['Add +0.004 to X wear offset','Add -0.004 to X wear offset','Add +0.002 to X wear offset (radius compensation)','Do not adjust — re-run the program'],
            ans:1, fb:'Add -0.004 to the X wear offset. Negative values move the tool away from the centerline (reducing the diameter). The sign is critical — entering the wrong sign makes the part worse.'
          }
        },
        {
          id:'l-b-6', free:true,
          gcode:'LOAD', title:'Loading & Verifying a Program',
          sub:'Finding, loading, and pre-checking before you press Cycle Start',
          theory:`Loading a program sounds simple, but a wrong program number, wrong revision, or unchecked offset is how scrap parts and crashes happen. A disciplined pre-run checklist is the mark of a professional operator.<br><br>
<strong style="color:var(--accent)">Loading from Memory:</strong> Select MEM/AUTO mode → press PROGRAM → type the O-number (e.g., O1234) → press cursor/search. The program appears on screen.<br><br>
<strong style="color:var(--accent)">Pre-Run Checklist (memorize this):</strong>`,
          steps:[
            {n:'1',body:'<strong>Confirm correct program number</strong> — Match the O-number to your job traveler or setup sheet. Do not assume.'},
            {n:'2',body:'<strong>Read the setup sheet</strong> — Confirm tools in the correct turret stations, all offsets loaded, material loaded correctly in the chuck.'},
            {n:'3',body:'<strong>Verify tool offsets</strong> — Check that geometry offsets are set for all tools in the program. A missing offset (zero in the geometry column) will cause a crash.'},
            {n:'4',body:'<strong>Check work offset / chuck position</strong> — Confirm material stick-out matches the setup sheet. Measure with a scale if needed.'},
            {n:'5',body:'<strong>Coolant ready</strong> — Coolant tank filled, nozzle aimed at the cut zone, coolant type matches the material.'},
            {n:'6',body:'<strong>Program rewind</strong> — Cursor at the top of the program (press RESET or HOME on the program).'},
            {n:'7',body:'<strong>Enable Single Block for first part</strong> — Always run the first article one block at a time with reduced feed override.'},
          ],
          warn:'Never press Cycle Start on a program you have not read at least once. Understand what the first 5–10 lines do before the machine moves.',
          quiz:{ q:'You are handed a job to run. The router says O4455. You load the program and it shows O4455 Rev B, but the router says Rev A. What do you do?',
            opts:['Run it — the O-number matches','Run it — Rev B is probably newer','Stop and notify the setup tech or engineer before running','Check if any lines look different, then decide'],
            ans:1, fb:'Always match the revision to the traveler. Running an unauthorized revision is a quality control violation. Rev B may have changes that affect dimensions, tooling, or setup. Get authorization first.'
          }
        },
        {
          id:'l-b-7', free:true,
          gcode:'RUN', title:'Running a Part — Cycle Start to Completion',
          sub:'What to watch, when to stop, and how to hand off',
          theory:`Pressing Cycle Start is not the end of your job — it's the beginning of active monitoring. A production operator watches the machine through the full cycle every time, not just the first part.<br><br>
<strong style="color:var(--accent)">During the Run — What to Watch:</strong><br>
• Listen for abnormal sounds: chatter, squealing, intermittent cutting, or sudden silence (tool broke)<br>
• Watch chip color and form: blue/purple chips = too hot, long stringy chips = chip control issue<br>
• Watch the coolant: is it hitting the cut zone, is the level adequate<br>
• Watch the part in the chuck: any movement or vibration is dangerous<br>
• Read the feedrate and spindle load on the display — a sudden spike in load = problem`,
          table:[
            ['Condition','What It Means','Action'],
            ['Squealing/chatter sound','Wrong speed/feed, dull tool, poor rigidity','Feed Hold → stop → notify setup'],
            ['Blue/black chips','Cutting temp too high','Check speed, feed, coolant delivery'],
            ['Tool broke mid-program','Program may continue cutting air or crash','RESET immediately, do not run further'],
            ['Spindle load spike','Tool dull, material hard spot, wrong offset','Feed Hold, measure, investigate'],
            ['Part moved in chuck','Inadequate clamping force','RESET, re-indicate part, check chuck pressure'],
            ['Coolant not reaching cut','Poor surface finish, tool overheating','Feed Hold, aim nozzle, check level'],
          ],
          tip:'If something sounds or looks wrong — Feed Hold first, then investigate. It costs far less to pause than to crash. A good operator\'s rule: "If it doesn\'t look right, it isn\'t right."',
          quiz:{ q:'During a turning pass you hear a rhythmic chattering sound and see poor surface finish. What is the correct immediate action?',
            opts:['Let it finish — it might clear up','Increase the feedrate to push through it','Press Feed Hold, note the tool and program line, notify setup tech','Press E-Stop immediately'],
            ans:2, fb:'Feed Hold is the right first response — it stops motion safely. E-Stop is for emergencies where motion must stop instantly (imminent crash or injury). After Feed Hold, investigate the cause: dull tool, wrong speed/feed, inadequate rigidity.'
          }
        },
        {
          id:'l-b-8', free:true,
          gcode:'ALARMS', title:'Reading Alarms & What To Do',
          sub:'Common alarm codes, reset procedure, and who to call',
          theory:`Alarms are the machine telling you something is wrong. Every alarm has a number and a message. <strong style="color:var(--accent)">Never ignore an alarm, never reset it without understanding what caused it.</strong><br><br>
<strong style="color:var(--accent)">Common Alarm Types:</strong>`,
          table:[
            ['Alarm Type','Example','Common Cause','First Action'],
            ['Overtravel','OT0500 X+ Overtravel','Axis moved past its travel limit','Press RESET, jog axis away from limit in opposite direction'],
            ['Spindle alarm','AL-24 Spindle Motor Overheat','Aggressive cut, coolant off, long cycle','Let spindle cool, check coolant, check feeds/speeds'],
            ['Servo alarm','SV0401 Axis Overload','Too much cutting force, dull tool, wrong feed','Reset, check tool condition, reduce feedrate'],
            ['Program error','P0S Alarm — Missing T-word','Bad G-code syntax, missing offset','Notify programmer, do not attempt to run'],
            ['Tool life alarm','Tool Life Expired — T02','Tool has reached programmed life limit','Replace the tool per the setup sheet, reset tool life counter'],
            ['Low lube','Auto Lube Low','Lubrication reservoir empty','Refill per machine manual — do not run without lube'],
          ],
          tip:'Write down the alarm number and what you were doing when it appeared. This is the single most helpful thing you can tell the maintenance tech or setup person.',
          warn:'Resetting an alarm and pressing Cycle Start without understanding the cause is one of the most common ways machines get damaged in production environments.',
          quiz:{ q:'The machine stops mid-cycle with an alarm: "OT0501 — Z- Overtravel." What does this mean and what do you do first?',
            opts:['The program ended normally — press Cycle Start to restart','The Z axis moved past its negative travel limit — press RESET, then jog Z in the positive direction','The coolant is low — refill and reset','The tool life expired — replace tool and reset'],
            ans:1, fb:'OT (Overtravel) alarms mean an axis hit its travel limit. Press RESET, then jog the axis in the opposite direction (Z+ to move away from Z- limit). Find out why the program commanded the overtravel before running again.'
          }
        },
        {
          id:'l-b-9', free:false,
          gcode:'COOLANT', title:'Coolant Types & Management',
          sub:'Water-soluble, neat oil, minimum quantity — selection and maintenance',
          theory:'Coolant selection directly affects tool life, surface finish, and operator health. The wrong coolant for a material can cause built-up edge, smoking, poor finish, and rapid tool wear.',
          pro:true
        },
        {
          id:'l-b-10', free:false,
          gcode:'TOOLING', title:'Basic Lathe Tooling Recognition',
          sub:'OD tools, ID boring bars, drills, threading inserts',
          theory:'Recognizing the correct tool for the operation and verifying correct insert installation is a core operator skill. An upside-down insert or wrong grade destroys tools and ruins parts.',
          pro:true
        },
      ]
    },

    // ── LATHE INTERMEDIATE ────────────────────────────────────────
    // GOAL: Setup technician level. Can set the machine up from scratch,
    //       program simple jobs by hand, use MDI confidently, understand
    //       feeds and speeds, set work offsets, and run basic canned cycles.
    intermediate: {
      color: 'var(--intermediate)',
      icon: '🔵',
      title: 'Lathe Intermediate',
      subtitle: 'Setup tech level: hand programming, MDI, feeds & speeds, and canned cycles',
      lessons: [
        {
          id:'l-i-1', free:true,
          gcode:'SETUP', title:'Setting Up a Lathe from Scratch',
          sub:'Tool loading, presetting, geometry offsets, and first-article procedure',
          theory:`A setup tech receives a job traveler and must prepare the machine to run the first good part. This requires systematically loading tools, setting geometry offsets, loading the program, and verifying before production begins.<br><br>
<strong style="color:var(--intermediate)">Step-by-step Setup Flow:</strong>`,
          steps:[
            {n:'1',body:'<strong>Read the entire setup sheet and print</strong> — Understand the part before touching the machine. Know what features matter most.'},
            {n:'2',body:'<strong>Load cutting tools in correct turret positions</strong> — Match tool station numbers to the program. T0101 = turret station 1, T0202 = station 2. Wrong station = guaranteed crash.'},
            {n:'3',body:'<strong>Set tool geometry offsets</strong> — Use a tool presetter (offline) or touch-off method (on-machine). Enter measured values in the GEOMETRY offset page for each tool.'},
            {n:'4',body:'<strong>Load raw material</strong> — Set stick-out per the setup sheet. Too much stick-out causes vibration and potential chuck release. Use a scale or stop block.'},
            {n:'5',body:'<strong>Load the program</strong> — Verify program number and revision match the traveler.'},
            {n:'6',body:'<strong>Run first article</strong> — Single block, 25% feedrate override, door closed, hand on Feed Hold.'},
            {n:'7',body:'<strong>Measure first article</strong> — Check all critical dimensions against the print. Adjust wear offsets as needed and run second part to confirm.'},
          ],
          tip:'Set up the longest tool first for geometry offsets — it determines your Z reference for all other tools when using the touch-off method.',
          quiz:{ q:'You load T0201 into turret station 3 instead of station 2. The program calls T0202 (tool 2, offset 2). What happens when T0202 is called?',
            opts:['The machine uses station 3 because it\'s close enough','The turret indexes to station 2 — which has the wrong or no tool — risking a crash','The controller detects the mismatch and alarms out','The program skips that tool call'],
            ans:1, fb:'The turret will index to position 2 where the wrong tool (or no tool) is loaded. This can result in a crash into the part or a tool-change collision. Always double-check tool station assignments before running.'
          }
        },
        {
          id:'l-i-2', free:true,
          gcode:'MDI', title:'MDI — Manual Data Input',
          sub:'Running single commands: tool calls, spindle, rapid moves, probing',
          theory:`MDI (Manual Data Input) is where you type and execute individual G-code lines without running a full program. It's one of the most powerful and most-used modes for a setup technician.<br><br>
<strong style="color:var(--intermediate)">Common MDI Uses:</strong><br>
• Calling a tool to inspect it: <code>T0101 M06</code><br>
• Starting the spindle to check: <code>G97 S500 M03</code><br>
• Moving to a known position: <code>G00 X5.0 Z5.0</code><br>
• Touching off a tool to set geometry: <code>G00 Z0</code> then manually jog to the surface<br>
• Running a canned drilling cycle on one hole<br>
• Returning to machine home: <code>G28 U0 W0</code>`,
          code:[
            {file:'MDI_examples.nc', lines:[
              ['—','<span class="cm">( INDEX TOOL 1 TO POSITION )</span>'],
              ['1','<span class="t">T0100</span> <span class="cm">( Index turret to station 1, cancel offset )</span>'],
              ['—',''],
              ['—','<span class="cm">( START SPINDLE — VERIFY DIRECTION )</span>'],
              ['2','<span class="g">G97</span> <span class="s">S300</span> <span class="m">M03</span>  <span class="cm">( 300 RPM clockwise — slow for safety check )</span>'],
              ['3','<span class="m">M05</span>             <span class="cm">( Stop spindle )</span>'],
              ['—',''],
              ['—','<span class="cm">( MOVE TO SAFE POSITION )</span>'],
              ['4','<span class="g">G00</span> <span class="x">X5.0 Z5.0</span>  <span class="cm">( Move to open clearance position )</span>'],
              ['—',''],
              ['—','<span class="cm">( RETURN HOME )</span>'],
              ['5','<span class="g">G28</span> <span class="x">U0 W0</span>      <span class="cm">( Return X and Z to reference zero )</span>'],
            ]},
          ],
          warn:'In MDI, the machine executes exactly what you type — instantly. Double-check every line before pressing Cycle Start. A mistyped X or Z value can crash the turret.',
          quiz:{ q:'In MDI mode, you want to safely return the turret to machine home before a tool change. Which command is correct?',
            opts:['G00 X0 Z0','G28 U0 W0','G54 X0 Z0','M30'],
            ans:1, fb:'G28 U0 W0 commands a safe reference return through an intermediate point at the current position (U0 W0 = no intermediate movement). G00 X0 Z0 would rapid directly to machine zero which may pass through the part.'
          }
        },
        {
          id:'l-i-3', free:true,
          gcode:'G20/G21 + COORDS', title:'Coordinate Systems & Units',
          sub:'Inch vs metric, absolute vs incremental, machine vs work coordinates',
          theory:`Understanding coordinates is the bridge between operator and programmer. You must know where the machine thinks it is at all times.<br><br>
<strong style="color:var(--intermediate)">G20 / G21 — Units:</strong> G20 = Inch. G21 = Metric. Always verify which is active before any move — the wrong unit mode can send an axis 25 times further than intended (confusing 1 inch with 25.4 mm).<br><br>
<strong style="color:var(--intermediate)">G90 / G91 — Absolute vs Incremental:</strong> G90 moves to a coordinate from the active zero. G91 moves a distance from the current position. Most production programs run in G90. G91 is used for specific offset patterns and sub-cycles.<br><br>
<strong style="color:var(--intermediate)">Machine vs Work Coordinates:</strong> The machine has its own fixed home (machine zero / G53). Your program runs from a work zero — the corner, face, or centerline of the part. The offset between machine zero and part zero is stored in work offset registers (G54, G55, etc.).`,
          table:[
            ['Concept','Code','What It Means'],
            ['Inch mode','G20','All values in inches'],
            ['Metric mode','G21','All values in millimeters'],
            ['Absolute positioning','G90','Coordinates measured from work zero'],
            ['Incremental positioning','G91','Coordinates measured from current position'],
            ['Machine coordinates','G53','Absolute from machine home — bypasses all offsets'],
            ['Work offset 1','G54','Part datum programmed for setup 1'],
          ],
          tip:'On a lathe, X is programmed in DIAMETER — not radius. X2.0 means the tool tip is at a 2.0" diameter position. This catches many new programmers and operators off-guard.',
          quiz:{ q:'The controller display shows coordinates in G91 (incremental). You want to move the tool exactly to X=3.000 diameter from the part zero. What is the risk of commanding G00 X3.0 in G91?',
            opts:['None — G91 and G90 handle X3.0 identically','In G91, X3.0 moves 3.0" from the CURRENT position — not to 3.0" from zero. You will end up in the wrong place.','G91 will alarm out on an X command','G91 automatically converts to the correct absolute position'],
            ans:1, fb:'G91 (incremental) treats all coordinates as a distance to travel from the current position. If the tool is currently at X5.0, commanding G00 X3.0 in G91 moves it to X8.0 — not X3.0. Always confirm G90 is active for absolute moves.'
          }
        },
        {
          id:'l-i-4', free:true,
          gcode:'SPEEDS & FEEDS', title:'Feeds, Speeds & Spindle Modes',
          sub:'SFM, RPM, IPR — calculating and applying the right numbers',
          theory:`Feeds and speeds determine tool life, surface finish, and cycle time. Using the wrong values is the fastest way to break tools and scrap parts. As a setup tech, you need to calculate and verify these values — not just accept whatever is in the program.<br><br>
<strong style="color:var(--intermediate)">Spindle Speed — G96 vs G97:</strong><br>
<strong style="color:var(--accent)">G96</strong> (Constant Surface Speed): The controller automatically adjusts RPM as the diameter changes, maintaining constant SFM at the cut. Best for facing, OD/ID turning, and contouring. Always pair with <strong>G50</strong> to set a max RPM limit.<br><br>
<strong style="color:var(--accent)">G97</strong> (Fixed RPM): Spindle turns at a constant RPM regardless of diameter. Required for drilling, tapping, and centerline operations.<br><br>
<strong style="color:var(--intermediate)">Feed Modes — G98 vs G99:</strong><br>
<strong>G99</strong> = Feed per revolution (IPR or mm/rev) — standard for lathe. Chip load stays constant as RPM varies with G96.<br>
<strong>G98</strong> = Feed per minute (IPM or mm/min) — used for tapping and some specialty operations.`,
          table:[
            ['Code','Mode','Use Case'],
            ['G96 S300','CSS — 300 SFM','OD turning aluminum, auto-adjusts RPM for diameter'],
            ['G50 S2500','Max RPM limit','Always precedes G96 — safety ceiling for the spindle'],
            ['G97 S800','Fixed 800 RPM','Drilling, tapping, boring small diameters'],
            ['G99 F0.012','0.012 IPR feed','Standard lathe turning — pairs with G96'],
            ['G98 F8.0','8 IPM feed','Tapping, thread milling at controlled rate'],
          ],
          warn:'G96 increases RPM as the tool approaches the centerline. Without G50 setting a max limit, the spindle can overspeed and the chuck can fail. G50 is not optional — it\'s a safety code.',
          calc:true, calcId:'g9697-calc',
          code:[
            {file:'speeds_feeds_lathe.nc', lines:[
              ['1','<span class="cm">( CORRECT LATHE SPEED/FEED SEQUENCE )</span>'],
              ['2','<span class="g">G20</span>                       <span class="cm">( Inch mode )</span>'],
              ['3','<span class="g">G50</span> <span class="s">S2500</span>              <span class="cm">( Max spindle = 2500 RPM — SET FIRST )</span>'],
              ['4','<span class="g">G96</span> <span class="s">S300</span> <span class="m">M03</span>          <span class="cm">( CSS 300 SFM, CW — SECOND )</span>'],
              ['5','<span class="g">G99</span>                       <span class="cm">( Feed per revolution — lathe standard )</span>'],
              ['6','<span class="t">T0101</span>                      <span class="cm">( OD turning tool )</span>'],
              ['7','<span class="g">G00</span> <span class="x">X2.1 Z0.05</span>'],
              ['8','<span class="g">G01</span> <span class="x">X-0.063</span> <span class="f">F0.010</span>     <span class="cm">( Face to center — 0.010 IPR )</span>'],
              ['9','<span class="cm">( SWITCH TO G97 FOR DRILLING )</span>'],
              ['10','<span class="g">G97</span> <span class="s">S600</span>              <span class="cm">( Fixed RPM for drill )</span>'],
              ['11','<span class="g">G98</span>                       <span class="cm">( Switch to per-minute if tapping )</span>'],
            ]},
          ],
          quiz:{ q:'You are facing a 4" diameter steel billet. You activate G96 S350 M03 without a G50 line. As the tool approaches the centerline, what happens to the spindle speed?',
            opts:['It stays at the same RPM throughout','It decreases toward the center because the diameter gets smaller','It increases continuously toward the center — and can exceed safe chuck limits','It automatically caps at 3000 RPM on all machines'],
            ans:2, fb:'G96 (constant surface speed) increases RPM as the diameter shrinks. Without G50, there is no limit — the spindle can overspeed beyond the chuck\'s safe rating, risking workpiece ejection. Always set G50 before G96.'
          }
        },
        {
          id:'l-i-5', free:true,
          gcode:'HAND PROG', title:'Hand Programming a Basic Lathe Program',
          sub:'Writing G-code from scratch: face, turn, chamfer, part off',
          theory:`Hand programming is writing G-code directly without CAM software. For simple lathe parts — facing, straight turning, chamfers, grooves — hand programming is faster than CAM and expected of any setup technician.<br><br>
<strong style="color:var(--intermediate)">Anatomy of a Lathe Program:</strong><br>
Every lathe program follows the same structure: safety line → units → spindle setup → tool call → positioning → cutting sequence → retract → repeat for next tool → program end.`,
          code:[
            {file:'first_lathe_program.nc', lines:[
              ['1','<span class="cm">( BASIC LATHE PROGRAM — 1.5" DIA STEEL )</span>'],
              ['2','<span class="cm">( TOOL 1: OD TURNING INSERT )</span>'],
              ['3','<span class="g">G20 G40 G99</span>               <span class="cm">( Inch, cancel comp, feed/rev )</span>'],
              ['4','<span class="g">G28</span> <span class="x">U0 W0</span>                <span class="cm">( Reference return )</span>'],
              ['5','<span class="g">G50</span> <span class="s">S2500</span>              <span class="cm">( Max spindle RPM )</span>'],
              ['6','<span class="g">G96</span> <span class="s">S350</span> <span class="m">M03</span>          <span class="cm">( CSS 350 SFM, spindle CW )</span>'],
              ['7','<span class="t">T0101</span>                      <span class="cm">( OD turning tool )</span>'],
              ['8','<span class="g">G00</span> <span class="x">X1.65 Z0.05</span>        <span class="cm">( Rapid to face start, 0.05 clearance )</span>'],
              ['9','<span class="g">G01</span> <span class="x">X-0.063</span> <span class="f">F0.008</span>     <span class="cm">( Face cut to center, 0.008 IPR )</span>'],
              ['10','<span class="g">G00</span> <span class="x">X1.65 Z0.1</span>'],
              ['11','<span class="g">G01</span> <span class="x">X1.500</span> <span class="f">F0.005</span>      <span class="cm">( Feed to finish diameter )</span>'],
              ['12','<span class="g">G01</span> <span class="x">Z-1.250</span> <span class="f">F0.008</span>     <span class="cm">( Turn OD 1.250 length )</span>'],
              ['13','<span class="g">G01</span> <span class="x">X1.600</span> <span class="f">F0.015</span>      <span class="cm">( Retract X )</span>'],
              ['14','<span class="g">G00</span> <span class="x">X5.0 Z5.0</span>          <span class="cm">( Safe retract )</span>'],
              ['15','<span class="m">M05</span>                       <span class="cm">( Spindle stop )</span>'],
              ['16','<span class="m">M30</span>                       <span class="cm">( Program end & rewind )</span>'],
            ]},
          ],
          tip:'The comment on every line is for learning — in production you would typically only comment tool calls and key operations. Heavy commenting slows down program scanning on older controllers.',
          quiz:{ q:'Why does line 9 use X-0.063 instead of X0 for the facing pass?',
            opts:['To compensate for the tool radius automatically','To ensure the tool crosses the centerline and leaves no nub on the part face','Because the part diameter is 0.063" larger than programmed','It is a typo — it should be X0'],
            ans:1, fb:'Programming X-0.063 (slightly past centerline) ensures the tool fully crosses center and removes all material from the face. Programming X0 exactly risks leaving a small pip or nub at the center due to tool nose radius and positioning accuracy.'
          }
        },
        {
          id:'l-i-6', free:false,
          gcode:'G71/G70', title:'Rough Turn & Finish Cycle (G71/G70)',
          sub:'Multi-pass stock removal with finish follow-up',
          theory:'G71 automates rough turning passes referencing a programmed contour. G70 then executes the single finishing pass. Together they replace dozens of individual roughing moves.',
          pro:true
        },
        {
          id:'l-i-7', free:false,
          gcode:'G76', title:'Threading Canned Cycle',
          sub:'Multi-pass thread cutting — external and internal',
          theory:'G76 is the standard Fanuc/Haas threading cycle. Two-line format defines all thread parameters: form, depth per pass, spring passes, and lead. Understand it before hand-programming any thread.',
          pro:true
        },
        {
          id:'l-i-8', free:false,
          gcode:'G74/G75', title:'Peck Drilling & Grooving Cycles',
          sub:'Axial and radial peck for deep holes and grooves',
          theory:'G74 handles axial peck drilling on the Z axis. G75 handles radial pecking for deep grooves on X. Both break chips automatically and retract for chip evacuation.',
          pro:true
        },
      ]
    },

    // ── LATHE ADVANCED ────────────────────────────────────────────
    // GOAL: Full CNC programmer. Writes complex programs from scratch,
    //       handles all canned cycles, subprograms, variables, threading,
    //       taper threading, complete shop programs.
    advanced: {
      color: 'var(--advanced)',
      icon: '🔴',
      title: 'Lathe Advanced',
      subtitle: 'Full programmer level: complex cycles, threading, subprograms, variables',
      lessons: [
        {
          id:'l-a-1', free:false,
          gcode:'G32', title:'Taper & Non-Standard Threading with G32',
          sub:'Single-block thread cutting for NPT, ACME, and custom profiles',
          theory:'G32 gives full control over each threading pass — essential for NPT pipe threads, ACME threads, and non-standard pitches that G76 cannot handle. Requires manual depth-per-pass calculation.',
          pro:true
        },
        {
          id:'l-a-2', free:false,
          gcode:'CONTOUR', title:'Complex Contour Programming',
          sub:'Radii, chamfers, tapers — programming profiles by hand',
          theory:'Contour lathe programming requires calculating tangent points, arc centers, and taper angles geometrically. This lesson covers the math and the G-code for any 2D profile you can put on a print.',
          pro:true
        },
        {
          id:'l-a-3', free:false,
          gcode:'M98/M99', title:'Subprograms for Modular Programming',
          sub:'Call, execute, return — reusable code blocks',
          theory:'M98 calls a subprogram (O-number). M99 returns to the calling program. This enables one subprogram to be called with different offsets to machine multiple identical features — eliminating repeated code.',
          pro:true
        },
        {
          id:'l-a-4', free:false,
          gcode:'#VARS', title:'Fanuc Macro Variables',
          sub:'Local (#100–#149), common (#500–#999), system (#5001+)',
          theory:'Macro B variables bring math, logic, and system data access into G-code. Local variables exist only within the program. Common variables persist across power cycles. System variables read machine state: current position, active offset values, spindle load.',
          pro:true
        },
        {
          id:'l-a-5', free:false,
          gcode:'FULL PROG', title:'Complete Shop Program — Turned Shaft',
          sub:'From raw stock to finished part: face, rough, finish, thread, part off',
          theory:'A complete industrial lathe program for a multi-diameter shaft with OD thread, groove, and chamfers. Every tool, offset, and safety code included with full annotation.',
          pro:true
        },
      ]
    },

    // ── LATHE AUTOMATION ──────────────────────────────────────────
    // GOAL: Senior programmer / manufacturing engineer level.
    //       Macro B logic, in-process probing, bar feeder integration,
    //       PMC/M-code customization, MTConnect for JobLine.ai.
    automation: {
      color: 'var(--automation)',
      icon: '🤖',
      title: 'Lathe Automation',
      subtitle: 'Macro B, in-process probing, bar feeder integration, Industry 4.0',
      lessons: [
        {
          id:'l-au-1', free:false,
          gcode:'MACRO B', title:'Macro B — Conditional Logic & Loops',
          sub:'IF/THEN, WHILE/DO/END, GOTO — adaptive programs',
          theory:'Macro B transforms G-code into a programming language. Conditional branches and loops enable programs that adapt to part measurements, machine state, and production conditions without operator input.',
          auto_note:'A macro that reads in-process probe data and self-corrects tool wear offsets is the foundation of lights-out lathe production.',
          code:[
            {file:'adaptive_turn_macro.nc', lines:[
              ['1','<span class="cm">( ADAPTIVE FINISH — reads probe, self-corrects offset )</span>'],
              ['2','<span class="kw">#100</span> = 1.5000          <span class="cm">( Target OD diameter )</span>'],
              ['3','<span class="kw">#101</span> = <span class="kw">#5021</span>        <span class="cm">( Current X from system var )</span>'],
              ['4','<span class="kw">#102</span> = [<span class="kw">#101</span> - <span class="kw">#100</span>] <span class="cm">( Stock remaining )</span>'],
              ['5','<span class="kw">IF</span> [<span class="kw">#102</span> LE 0.001] <span class="kw">GOTO</span> 99  <span class="cm">( Already in tolerance )</span>'],
              ['6','<span class="g">G01</span> <span class="x">X</span>[<span class="kw">#100</span> + 0.003] <span class="f">F0.006</span>  <span class="cm">( Rough approach )</span>'],
              ['7','<span class="g">G01</span> <span class="x">X</span><span class="kw">#100</span> <span class="f">F0.004</span>            <span class="cm">( Finish to target )</span>'],
              ['8','<span class="n">N99</span> <span class="m">M99</span>'],
            ]},
          ],
          pro:true
        },
        {
          id:'l-au-2', free:false,
          gcode:'PROBING', title:'In-Process Gaging & Probing',
          sub:'G31 skip function, Renishaw cycles, automatic offset update',
          theory:'Probing mid-cycle measures the actual part dimension and calculates how much to adjust the tool wear offset. The machine self-corrects without operator measurement — essential for unattended production.',
          pro:true
        },
        {
          id:'l-au-3', free:false,
          gcode:'BAR FEEDER', title:'Bar Feeder & Parts Catcher Integration',
          sub:'M-code interface, stock advance, part ejection, auto-run',
          theory:'Bar feeders advance raw bar stock automatically between parts. Integration requires specific M-codes (varies by brand) for: advance stock, confirm feed, chuck signal, parts catcher open/close. Programs designed for bar feeding run unattended through full bar capacity.',
          auto_note:'JobLine.ai tracks bar feeder cycles and part counts in real time — automatically updating work order completion status and alerting when bar stock is running low.',
          pro:true
        },
        {
          id:'l-au-4', free:false,
          gcode:'MTConnect', title:'MTConnect & JobLine.ai Integration',
          sub:'Real-time machine data streaming for shop floor intelligence',
          theory:'MTConnect is the open standard for CNC machine data streaming. It exposes spindle speed, feedrate, axis position, alarm codes, part count, and program status over a network. JobLine.ai consumes this data to eliminate manual data entry and enable real-time shift handoffs.',
          auto_note:'With MTConnect connected to JobLine.ai, every part completion, tool change, alarm, and spindle-off event is automatically logged to the work order — no paper, no manual input.',
          pro:true
        },
        {
          id:'l-au-5', free:false,
          gcode:'AI+CNC', title:'AI-Assisted G-Code & Process Optimization',
          sub:'LLM programming assistance, adaptive control, predictive tool life',
          theory:'AI is changing how G-code is written and how machines self-manage. This lesson covers: CAM AI toolpath optimization, LLM-assisted hand programming, spindle-load-based adaptive feedrate, and predictive tool life models based on real cutting data.',
          auto_note:'WeCr8 and ToolingHero.us are building the next layer of this stack — AI-identified tooling, smart tool boxes with usage tracking, and G-Code Academy as the training pipeline for the operators who use them.',
          pro:true
        },
      ]
    },
  }, // end lathe


  // ═══════════════════════════════════════════════════════════════
  // CNC MILL TRACK
  // ═══════════════════════════════════════════════════════════════
  mill: {

    // ── MILL BEGINNER ─────────────────────────────────────────────
    // GOAL: Same as lathe beginner — floor-ready operator on a mill.
    //       Machine anatomy, axes, safety, control panel, loading a program,
    //       tool changes, work offsets (intro), running a part, alarms.
    beginner: {
      color: 'var(--beginner)',
      icon: '🟢',
      title: 'Mill Beginner',
      subtitle: 'Floor-ready CNC mill operator — safety, setup, and running your first part',
      lessons: [
        {
          id:'m-b-1', free:true,
          gcode:'SAFETY', title:'Mill Shop Floor Safety',
          sub:'PPE, rotating tools, chip hazards, and E-Stop location',
          theory:`A CNC mill cuts material with a spinning tool moving through a stationary (or slowly moved) workpiece. High-speed end mills, drills, and face mills generate chips at high velocity. Chip shields and door interlocks exist for a reason — they are not optional.<br><br>
<strong style="color:var(--blue)">Key Mill-Specific Hazards:</strong>`,
          table:[
            ['Hazard','Specific Risk','Prevention'],
            ['Flying chips','Eye injury, cuts — especially aluminum and stainless','Safety glasses always. Keep door closed during cuts.'],
            ['Rotating spindle','Contact with spinning tool causes severe lacerations','Never reach into machine while spindle is running.'],
            ['Tool breakage','End mills and drills can shatter at high speed','Correct feeds/speeds. Door closed. Inspect tools before use.'],
            ['Coolant flood','Slip hazard on floor','Maintain chip pan and floor mats. Clean spills immediately.'],
            ['Vise/fixture release','Improperly clamped part can be ejected at high speed','Verify clamping force before every run. Torque vise handle properly.'],
            ['E-Stop location','Must act fast in an emergency','Find it before you run anything. Both sides of the machine.'],
          ],
          warn:'Never wear gloves while operating a CNC mill. A rotating spindle or tool can catch a glove and pull the hand in faster than any reaction time.',
          quiz:{ q:'Before pressing Cycle Start on a CNC mill, what is the most important physical check to make on the workpiece?',
            opts:['Verify the program number on the screen','Confirm the workpiece is securely clamped and will not move during cutting','Check the coolant level in the reservoir','Verify the tool number in the spindle'],
            ans:1, fb:'Workpiece clamping is the #1 physical safety check on a mill. An improperly clamped part can be grabbed by the cutter and ejected from the machine at high speed. Every other check happens after you confirm secure clamping.'
          }
        },
        {
          id:'m-b-2', free:true,
          gcode:'ANATOMY', title:'CNC Mill Machine Anatomy',
          sub:'Column, spindle, table, axes — know the machine',
          theory:`CNC mills come in vertical and horizontal configurations. Vertical machining centers (VMCs) are by far the most common — the spindle points down. Understanding the machine physically is essential before operating it.<br><br>
<strong style="color:var(--blue)">Core Mill Components:</strong>`,
          table:[
            ['Component','Function','Operator Interaction'],
            ['Spindle','Rotates the cutting tool — vertical (points down) on VMCs','Never touch while running. Tool changes done at spindle.'],
            ['Table','Holds the workpiece via vise, fixture, or direct clamping','Load/unload parts. Do not scratch the table surface.'],
            ['Column','Structural backbone — holds the spindle head','No operator interaction — structural element.'],
            ['ATC (Auto Tool Changer)','Carousel or arm that stores and changes tools automatically','Do not reach near ATC during a tool change.'],
            ['Vise','Most common workholding — swivel, Kurt, toolmaker\'s','Set, tighten, and verify before every run.'],
            ['Control Panel','Fanuc, Haas, Siemens, Heidenhain — your interface','All machine commands originate here.'],
          ],
          table2:[
            ['Axis','Direction','What It Controls'],
            ['X','Left / Right (table moves)','Horizontal width position'],
            ['Y','Front / Back (table moves)','Depth position'],
            ['Z','Up / Down (spindle moves)','Depth of cut — how deep the tool goes'],
            ['A/B/C','Rotational','4th and 5th axis — tilts and rotations (advanced)'],
          ],
          tip:'On most VMCs, the TABLE moves in X and Y while the SPINDLE moves in Z. When you jog X+, the table moves — the part moves with it. This feels counter-intuitive at first but becomes natural quickly.',
          quiz:{ q:'On a vertical machining center, you press jog X+ and the table moves to the RIGHT. The cutter (relative to the part) appears to move:',
            opts:['To the right — same as the table','To the left — the part moves right so the cutter\'s position on the part shifts left','Up — Z is involved','It does not move — only the spindle moves in X'],
            ans:1, fb:'The table carries the part. When the table moves right (+X), the part moves right — so relative to the part, the cutter shifts to the LEFT. Understanding this is critical for setup and offset correction.'
          }
        },
        {
          id:'m-b-3', free:true,
          gcode:'POWER ON', title:'Powering On & Homing a CNC Mill',
          sub:'Startup sequence, reference return, and ready state',
          theory:`The mill power-on sequence is identical in principle to the lathe. Main power → control power → E-Stop release → RESET → HOME return. The differences are in the Z axis: on a VMC, Z must home first (spindle up) before X and Y home, to avoid the tool crashing into the table or vise.`,
          steps:[
            {n:'1',body:'<strong>Main Power ON</strong> — Breaker, key, or wall disconnect. Wait for hydraulic and pneumatic systems to pressurize (if equipped).'},
            {n:'2',body:'<strong>Control Power ON</strong> — Press the green POWER ON button on the panel. Wait for the controller to fully boot.'},
            {n:'3',body:'<strong>Release E-Stop</strong> — Twist clockwise. Confirm it pops up and the E-Stop indicator clears.'},
            {n:'4',body:'<strong>Press RESET</strong> — Clear startup alarms. Confirm no active alarms on the screen.'},
            {n:'5',body:'<strong>Home Z first</strong> — On VMCs, always home Z before X and Y. This retracts the spindle to the top of travel — away from the table and any fixtures.'},
            {n:'6',body:'<strong>Home X and Y</strong> — Once Z is at machine home, home X and Y. All home indicators should illuminate.'},
            {n:'7',body:'<strong>Verify ready state</strong> — No alarms, all axes homed, machine in a known state. Ready for setup.'},
          ],
          warn:'On a VMC, never home X or Y before Z. The tool in the spindle may be low (from a previous setup) and can crash into the vise or fixture as the table moves during homing.',
          quiz:{ q:'Why must Z be homed before X and Y on a VMC?',
            opts:['Machine code requires it — no practical reason','To retract the spindle/tool upward and clear the table before horizontal axes move','Z has the highest load and must home first for safety','So the ATC can index properly'],
            ans:1, fb:'Homing Z first retracts the spindle to the top of travel — lifting any tool in the spindle well above the table, vise, and fixtures. If X or Y homed first with the spindle low, the tool could drag across or crash into the workholding.'
          }
        },
        {
          id:'m-b-4', free:true,
          gcode:'PANEL', title:'Mill Control Panel — Modes & Keys',
          sub:'MEM, MDI, JOG, SINGLE BLOCK, overrides — Fanuc & Haas',
          theory:`Mill and lathe control panels are nearly identical in function. The same modes apply: MEM/AUTO for production, MDI for single commands, JOG/HANDLE for manual positioning, SINGLE BLOCK for safe first-article prove-out.<br><br>
<strong style="color:var(--blue)">Mill-Specific Panel Features:</strong>`,
          table:[
            ['Mode / Key','What It Does','When You Use It'],
            ['MEM / AUTO','Run stored programs','Production operator mode'],
            ['MDI','Type and execute one G-code line','Offsets, tool checks, spindle test, quick moves'],
            ['JOG','Manual axis movement with arrow keys','Setting work offsets, touching off tools'],
            ['HANDLE / MPG','Manual pulse generator (handwheel)','Fine positioning — 0.001" or 0.0001" increments'],
            ['SINGLE BLOCK','Execute one line at a time','First-article prove-out — always use on new programs'],
            ['OPTIONAL STOP M01','Program pauses at M01 if this is ON','Checking parts mid-program'],
            ['DRY RUN','Runs program at rapid speed, no cutting','Verifying tool paths before first cut'],
            ['BLOCK DELETE /','Skips lines beginning with / when active','Conditional program sections'],
          ],
          tip:'DRY RUN + SINGLE BLOCK together is the safest way to verify a new program on a mill. Dry Run moves at rapid speed but with the spindle off — you can trace the path without cutting material. Always retract Z clear before Dry Run.',
          quiz:{ q:'You activate DRY RUN on a mill with a new program. What does this do and what precaution is critical?',
            opts:['Runs the program normally — no difference from standard run','Runs axes at rapid speed with no spindle. CRITICAL: the tool must be retracted above all obstacles — DRY RUN will rapid everywhere the program moves at full speed.','Runs only Z axis to check tool depth','Runs the program in simulation on the screen only'],
            ans:1, fb:'Dry Run moves ALL axes at rapid (maximum) speed with the spindle off. If the tool is still in the machine and not retracted, it will crash into fixtures, clamps, or the part at full rapid speed. Always lift Z to maximum clearance before Dry Run.'
          }
        },
        {
          id:'m-b-5', free:true,
          gcode:'TOOL CHANGE', title:'Tool Changes & Tool Length Offsets',
          sub:'ATC, manual tool changes, H-offsets, and G43',
          theory:`Every cutting tool on a mill has a different length. The controller needs to know exactly how long each tool is — this is the tool length offset (TLO), stored in the H register and activated with G43.<br><br>
<strong style="color:var(--blue)">How Tool Length Offset Works:</strong><br>
The machine measures (or you measure) the distance from the spindle nose to the tool tip. This value is stored in offset register H01, H02, etc. When the program runs G43 H01, the controller adds this offset to all Z moves — so Z0 in the program corresponds to the actual part surface, regardless of tool length.<br><br>
<strong style="color:var(--blue)">ATC Tool Change Sequence:</strong>`,
          code:[
            {file:'tool_change_sequence.nc', lines:[
              ['1','<span class="g">G91 G28 Z0</span>        <span class="cm">( Retract Z to machine home — FIRST, always )</span>'],
              ['2','<span class="t">T02 M06</span>           <span class="cm">( Call tool 2, execute ATC change )</span>'],
              ['3','<span class="g">G90 G54</span>           <span class="cm">( Absolute mode, work offset 1 )</span>'],
              ['4','<span class="g">G43</span> <span class="t">H02</span> <span class="x">Z5.0</span>    <span class="cm">( Apply tool 2 length offset, move to Z5 clearance )</span>'],
              ['5','<span class="g">G97</span> <span class="s">S2500</span> <span class="m">M03</span>   <span class="cm">( Spindle on, 2500 RPM )</span>'],
              ['6','<span class="cm">( Now ready to cut with correct Z reference )</span>'],
            ]},
          ],
          warn:'Never command a tool change (T__ M06) without first retracting Z to machine home (G91 G28 Z0). If the spindle is low, the ATC arm will crash into the vise or part during the change.',
          quiz:{ q:'The program calls G43 H03 Z5.0. Tool 3 has a length offset of 7.250". What does the machine actually do?',
            opts:['Moves to Z=5.0" from machine home','Moves the spindle to a Z position that places the TOOL TIP at 5.0" above the work zero — accounting for the 7.250" tool length','Moves Z 7.250" down from current position','Activates offset H03 without moving Z'],
            ans:1, fb:'G43 H03 tells the controller "add 7.250 to all Z values so that the tool tip — not the spindle nose — is at the programmed Z position." Z5.0 after G43 means the tool tip is 5.0" above part zero, regardless of how long the tool is.'
          }
        },
        {
          id:'m-b-6', free:true,
          gcode:'WORK OFFSETS', title:'Work Offsets — Setting Your Part Zero',
          sub:'G54 setup, edge finding, and why it matters',
          theory:`A work offset (G54–G59) stores the location of your part datum (zero point) relative to machine home. Every program runs from this datum. If the work offset is wrong by 0.100", every feature on the part is wrong by 0.100".<br><br>
<strong style="color:var(--blue)">Common Methods to Set G54:</strong><br>
<strong>Edge Finder / Wiggler:</strong> A mechanical or electronic probe that finds the exact edge of the part. You touch off X and Y edges, calculate center or corner, and enter the value in G54.<br><br>
<strong>Tool Touch-Off (Z):</strong> Lower the tool slowly until it touches the part surface. Use a 0.001" feeler gauge or paper as a feeler. The Z position at that point (minus the feeler thickness) is your Z0 datum.<br><br>
<strong>Haas / Fanuc — Entering the Offset:</strong> Navigate to OFFSET → WORK → G54 row. Use MEASURE or type the value and press INPUT.`,
          steps:[
            {n:'1',body:'<strong>Load your edge finder or probe</strong> in the spindle.'},
            {n:'2',body:'<strong>Find X edge</strong> — Touch left side of part, zero X. Touch right side, read X position. G54 X center = X/2 (or leave at edge for corner datum).'},
            {n:'3',body:'<strong>Find Y edge</strong> — Same process front and back faces.'},
            {n:'4',body:'<strong>Set Z datum</strong> — Touch off with a tool and feeler gauge. The Z machine position at touch is your G54 Z value.'},
            {n:'5',body:'<strong>Enter values</strong> — Type into the G54 row of the Work Offset page.'},
            {n:'6',body:'<strong>Verify</strong> — Move to G54 X0 Y0 Z5.0 in MDI and confirm the tool is where you expect it to be.'},
          ],
          quiz:{ q:'You set G54 Z to -18.4520 (machine Z position at part surface). The program starts with G43 H01 Z5.0. Where is the tool tip at Z5.0?',
            opts:['5.0" above machine home','5.0" above the part surface (your G54 Z zero)','5.0mm below the part — metric error','At machine home'],
            ans:1, fb:'G54 establishes your part surface as Z0. G43 H01 applies the tool length so the spindle nose-to-tip distance is accounted for. Z5.0 in the program = 5.0" above the part surface — your safe clearance plane.'
          }
        },
        {
          id:'m-b-7', free:true,
          gcode:'RUN + ALARMS', title:'Running Parts & Responding to Alarms',
          sub:'First-article discipline, what to watch, common mill alarms',
          theory:`Everything from the lathe operator module applies here — but mills have some distinct alarm types and mid-cycle monitoring differences.<br><br>
<strong style="color:var(--blue)">What to Watch During a Mill Cycle:</strong><br>
• Chip color and form — aluminum makes curly silver chips; too-blue chips = overheating<br>
• Sound — clean milling sounds rhythmic; chatter is unmistakable and must be stopped<br>
• Coolant coverage — end mills need coolant at the flutes, not just sprayed at the part<br>
• Spindle load meter — a spike usually means a dull tool, wrong feed, or wrong depth`,
          table:[
            ['Alarm','Cause','Action'],
            ['ATC Fault / Tool Change Error','ATC arm didn\'t complete — tool not seated','RESET, manually clear ATC if safe, do not force'],
            ['Z Overtravel (OT)','Z axis went past travel limit (too low usually)','RESET, jog Z up, find why Z0 was set wrong'],
            ['Servo Overload','Too much cutting force — aggressive cut or dull tool','Reset, reduce feedrate, inspect tool'],
            ['Spindle Overload','Tool too dull, wrong speed/feed, depth too aggressive','Reset, check tool, reduce parameters'],
            ['M19 Spindle Orient Fault','ATC requires spindle orientation — failed','Reset, retry tool change from MDI'],
          ],
          quiz:{ q:'During a face milling pass you hear a rhythmic thumping and see poor finish. What is the most likely cause and correct action?',
            opts:['Normal — face mills always make some noise','The face mill has a broken or missing insert. Press Feed Hold, stop spindle, inspect inserts before continuing.','The spindle speed is too high — increase feedrate','The coolant is too cold'],
            ans:1, fb:'A rhythmic thumping during face milling almost always indicates a broken, missing, or improperly seated insert in the face mill body. This produces an interrupted cut pattern. Stop immediately — continuing will damage the part surface and may worsen the insert damage.'
          }
        },
        {
          id:'m-b-8', free:false,
          gcode:'TOOLING ID', title:'Recognizing Mill Tooling',
          sub:'End mills, face mills, drills, reamers, taps — types and applications',
          theory:'Identifying the right tool for the operation is a fundamental operator skill. Grabbing a 4-flute end mill for aluminum slotting instead of a 3-flute results in poor chip evacuation and broken tools.',
          pro:true
        },
        {
          id:'m-b-9', free:false,
          gcode:'WORKHOLDING', title:'Vise Setup & Workholding Basics',
          sub:'Vise tramming, parallels, stop blocks, and clamping force',
          theory:'Workholding is as important as cutting parameters. An improperly trammed vise introduces angular error into every feature. This lesson covers setup, tramming, parallel selection, and how to verify before the first cut.',
          pro:true
        },
      ]
    },

    // ── MILL INTERMEDIATE ─────────────────────────────────────────
    // GOAL: Setup tech on a mill. Hand-edits programs, uses MDI to run
    //       canned cycles, sets up complex fixtures, understands cutter
    //       comp, and can write a basic program from scratch.
    intermediate: {
      color: 'var(--intermediate)',
      icon: '🔵',
      title: 'Mill Intermediate',
      subtitle: 'Setup tech level: hand programming, MDI canned cycles, G41/G42, WCS management',
      lessons: [
        {
          id:'m-i-1', free:true,
          gcode:'G90/G91', title:'Absolute vs Incremental Positioning',
          sub:'G90/G91 — when each mode is correct and how to avoid costly errors',
          theory:`<strong style="color:var(--blue)">G90 (Absolute)</strong> — all coordinates measured from the active work zero (G54, etc.). X2.0 always means 2.0" from your part datum, no matter where the tool currently is.<br><br>
<strong style="color:var(--blue)">G91 (Incremental)</strong> — all coordinates are distances from the current tool position. X2.0 means "move 2.0" from wherever I am right now." This is dangerous if you don't know exactly where the tool is.<br><br>
<strong style="color:var(--intermediate)">Practical Rule:</strong> Always start programs in G90. Use G91 only for specific patterns (bolt circles, slot arrays) or sub-calls, and immediately return to G90 afterward.`,
          table:[
            ['Mode','Code','X3.0 means...','Best For'],
            ['Absolute','G90','Go TO X=3.0 from part datum','All normal positioning — primary mode'],
            ['Incremental','G91','Move 3.0" IN X from current position','Patterns, hole arrays, Z depth plunges'],
          ],
          code:[
            {file:'abs_vs_inc_mill.nc', lines:[
              ['1','<span class="g">G90</span>              <span class="cm">( Absolute — normal mode )</span>'],
              ['2','<span class="g">G00</span> <span class="x">X1.0 Y1.0</span>  <span class="cm">( Move TO X1, Y1 from datum )</span>'],
              ['3','<span class="g">G00</span> <span class="x">X3.0 Y1.0</span>  <span class="cm">( Move TO X3, Y1 )</span>'],
              ['—',''],
              ['4','<span class="g">G91</span>              <span class="cm">( Incremental — use carefully )</span>'],
              ['5','<span class="g">G00</span> <span class="x">X1.0</span>       <span class="cm">( Move 1.0" in +X from wherever we are )</span>'],
              ['6','<span class="g">G00</span> <span class="x">X1.0</span>       <span class="cm">( Move another 1.0" in +X )</span>'],
              ['7','<span class="g">G90</span>              <span class="cm">( RETURN TO ABSOLUTE — always )</span>'],
            ]},
          ],
          quiz:{ q:'You are in G91 mode. The tool is at X=4.000. You program G00 X2.0. Where does the tool go?',
            opts:['To X=2.000 (absolute)','To X=6.000 (moved 2.0" from current position)','It alarms — G00 requires G90','Depends on the active work offset'],
            ans:1, fb:'G91 adds the commanded value to the current position. X=4.0 + 2.0 = X=6.0. Many tool crashes happen when operators or programmers lose track of the active positioning mode.'
          }
        },
        {
          id:'m-i-2', free:true,
          gcode:'MDI MILL', title:'MDI on the Mill — Real Shop Commands',
          sub:'Tool changes, spindle check, probing, and quick positioning',
          theory:`MDI is your most powerful setup tool on the mill. Every setup tech uses MDI constantly for tool changes, offset verification, spindle direction checks, and moving to specific positions for measurement.<br><br>
<strong style="color:var(--intermediate)">The 10 MDI Commands Every Mill Setup Tech Needs:</strong>`,
          code:[
            {file:'mill_MDI_essentials.nc', lines:[
              ['—','<span class="cm">( 1. RETRACT Z TO HOME )</span>'],
              ['1','<span class="g">G91 G28 Z0</span>              <span class="cm">( Safe Z retract — use this before tool changes )</span>'],
              ['—',''],
              ['—','<span class="cm">( 2. TOOL CHANGE TO T03 )</span>'],
              ['2','<span class="g">G91 G28 Z0</span>'],
              ['3','<span class="t">T03 M06</span>                 <span class="cm">( Bring tool 3 to spindle )</span>'],
              ['—',''],
              ['—','<span class="cm">( 3. SPINDLE ON — VERIFY DIRECTION )</span>'],
              ['4','<span class="g">G97</span> <span class="s">S500</span> <span class="m">M03</span>          <span class="cm">( CW — standard for right-hand tools )</span>'],
              ['5','<span class="m">M05</span>                     <span class="cm">( Stop )</span>'],
              ['—',''],
              ['—','<span class="cm">( 4. MOVE TO WORK OFFSET ORIGIN )</span>'],
              ['6','<span class="g">G90 G54</span>'],
              ['7','<span class="g">G43</span> <span class="t">H01</span> <span class="x">Z50.0</span>        <span class="cm">( Apply TLO, move to Z50 clearance )</span>'],
              ['8','<span class="g">G00</span> <span class="x">X0 Y0</span>             <span class="cm">( Move to part datum XY )</span>'],
              ['—',''],
              ['—','<span class="cm">( 5. RETURN ALL AXES TO HOME )</span>'],
              ['9','<span class="g">G91 G28 Z0</span>'],
              ['10','<span class="g">G91 G28 X0 Y0</span>           <span class="cm">( Home X and Y after Z )</span>'],
            ]},
          ],
          quiz:{ q:'In MDI, you want to call tool 4 and apply its length offset to move to Z10.0 above the part. Write the correct two-line sequence.',
            opts:['T04 M06 → G00 Z10.0','G91 G28 Z0 → T04 M06 → G90 G43 H04 Z10.0','G43 H04 → T04 M06 → Z10.0','G28 Z0 → T04 H04 M06 Z10.0'],
            ans:1, fb:'G91 G28 Z0 safely retracts Z first. Then T04 M06 executes the tool change. Then G90 G43 H04 Z10.0 applies the tool length offset (H04) and moves the tool tip to 10.0" above part zero. Never forget the Z retract before a tool change.'
          }
        },
        {
          id:'m-i-3', free:true,
          gcode:'HAND PROG MILL', title:'Hand Programming a Basic Mill Program',
          sub:'Safe state line, G54, tool call, drill pattern, contour — from scratch',
          theory:`A well-structured mill program always begins with a "safe state line" that cancels all modal codes that could cause a problem if left active from a previous program. This is non-negotiable in professional shop programming.`,
          code:[
            {file:'first_mill_program.nc', lines:[
              ['1','<span class="cm">( BASIC MILL PROGRAM — Drill 3 holes, face pass )</span>'],
              ['2','<span class="g">G90 G17 G20 G40 G80 G49</span>   <span class="cm">( SAFE STATE: abs, XY plane, inch, cancel comp/cycles/TLO )</span>'],
              ['3','<span class="g">G91 G28 Z0</span>               <span class="cm">( Retract Z to home )</span>'],
              ['4','<span class="g">G91 G28 X0 Y0</span>            <span class="cm">( Home X Y )</span>'],
              ['5','<span class="g">G90</span>                       <span class="cm">( Return to absolute )</span>'],
              ['—',''],
              ['6','<span class="cm">( TOOL 1 — 0.5" DRILL )</span>'],
              ['7','<span class="t">T01 M06</span>                   <span class="cm">( ATC — bring drill to spindle )</span>'],
              ['8','<span class="g">G90 G54</span>                   <span class="cm">( Absolute, WCS 1 )</span>'],
              ['9','<span class="g">G43</span> <span class="t">H01</span> <span class="x">Z5.0</span>          <span class="cm">( TLO, move to clearance )</span>'],
              ['10','<span class="g">G97</span> <span class="s">S2200</span> <span class="m">M03</span>         <span class="cm">( 2200 RPM, CW )</span>'],
              ['11','<span class="m">M08</span>                       <span class="cm">( Coolant ON )</span>'],
              ['—',''],
              ['12','<span class="cm">( DRILL CYCLE — G81 )</span>'],
              ['13','<span class="g">G81</span> <span class="x">X1.0 Y1.0</span> <span class="x">Z-0.75 R0.1</span> <span class="f">F6.0</span>  <span class="cm">( Hole 1 )</span>'],
              ['14','<span class="x">X2.5</span>                      <span class="cm">( Hole 2 — cycle repeats )</span>'],
              ['15','<span class="x">X4.0 Y2.5</span>                <span class="cm">( Hole 3 )</span>'],
              ['16','<span class="g">G80</span>                       <span class="cm">( Cancel drill cycle — REQUIRED )</span>'],
              ['—',''],
              ['17','<span class="m">M09</span>                       <span class="cm">( Coolant OFF )</span>'],
              ['18','<span class="g">G91 G28 Z0</span>               <span class="cm">( Z home )</span>'],
              ['19','<span class="m">M05 M30</span>                   <span class="cm">( Spindle stop, program end )</span>'],
            ]},
          ],
          tip:'The safe state line (G90 G17 G20 G40 G80 G49) should be memorized and typed at the top of every program you write. It cancels cutter comp (G40), all canned cycles (G80), tool length comp (G49), and sets known modal states.',
          quiz:{ q:'Why is G80 required after the drilling cycle on line 16?',
            opts:['It turns off the coolant','It cancels the active canned cycle — without it, the machine will drill a hole at every subsequent XY position it moves to','It resets the tool length offset','It returns Z to the R plane'],
            ans:1, fb:'G80 cancels the active canned cycle. Any canned cycle (G81, G83, G84, etc.) remains active until explicitly cancelled with G80. A subsequent G00 X100 Y100 for a tool change would attempt to drill at X100 Y100.'
          }
        },
        {
          id:'m-i-4', free:true,
          gcode:'G81/G82/G83', title:'Drilling Canned Cycles',
          sub:'G81 drill, G82 dwell, G83 peck — parameters and MDI use',
          theory:`Drilling canned cycles are among the most-used G-codes in mill programming. Understanding their parameters lets you run them from the program OR from MDI for one-off holes during setup.<br><br>
<strong style="color:var(--blue)">Canned Cycle Parameters (all drilling cycles):</strong><br>
<strong>X Y</strong> = hole position<br>
<strong>Z</strong> = final depth (from R plane or from Z0, depending on G98/G99)<br>
<strong>R</strong> = retract plane (clearance above part before drilling begins)<br>
<strong>F</strong> = feedrate (IPM for mills in G98 mode)<br>
<strong>Q</strong> = peck increment (G83 only)<br>
<strong>P</strong> = dwell time in milliseconds (G82 only)`,
          table:[
            ['Code','Operation','Key Parameter','Use Case'],
            ['G81','Standard drill','Z, R, F','All standard holes — through and blind'],
            ['G82','Drill with dwell','P=dwell ms','Counterbores, spotting — needs flat bottom'],
            ['G83','Peck drill','Q=peck depth','Deep holes >3x diameter — chip clearing'],
            ['G73','Chip break drill','Q=retract amount','Moderate depth — shorter retract than G83'],
            ['G80','Cancel cycle','—','Always after your last cycle hole'],
          ],
          code:[
            {file:'drill_cycles_complete.nc', lines:[
              ['1','<span class="cm">( G81 — STANDARD DRILL )</span>'],
              ['2','<span class="g">G81</span> <span class="x">X1.0 Y1.0 Z-0.75 R0.1</span> <span class="f">F5.0</span>  <span class="cm">( Drill to -0.750, retract to R0.1 )</span>'],
              ['3','<span class="x">X2.5 Y1.0</span>                       <span class="cm">( Drill again at new XY — same Z/R/F )</span>'],
              ['4','<span class="g">G80</span>                              <span class="cm">( Cancel )</span>'],
              ['—',''],
              ['5','<span class="cm">( G83 — PECK DRILL — deep hole )</span>'],
              ['6','<span class="g">G83</span> <span class="x">X3.0 Y2.0 Z-2.0 R0.1 Q0.25</span> <span class="f">F4.0</span>  <span class="cm">( Peck 0.25" per pass to -2.0" )</span>'],
              ['7','<span class="g">G80</span>'],
              ['—',''],
              ['8','<span class="cm">( G82 — DWELL DRILL — counterbore )</span>'],
              ['9','<span class="g">G82</span> <span class="x">X4.0 Y1.0 Z-0.25 R0.1 P500</span> <span class="f">F6.0</span>  <span class="cm">( 500ms dwell at depth )</span>'],
              ['10','<span class="g">G80</span>'],
            ]},
          ],
          quiz:{ q:'You need to drill a 5/8" hole 3.0" deep in steel. Which canned cycle is correct and why?',
            opts:['G81 — standard drill is always fine','G83 with Q=0.25 — deep hole requires peck drilling to clear chips and prevent drill breakage','G82 with P=1000 — dwell at bottom ensures full depth','G73 — always use chip break for any steel'],
            ans:1, fb:'At 3.0" deep with a 5/8" drill (almost 5x diameter), chips cannot exit the hole without peck drilling. G83 retracts fully to clear chips on each peck — preventing packing, heat buildup, and drill breakage. G81 would likely break the drill.'
          }
        },
        {
          id:'m-i-5', free:true,
          gcode:'G41/G42', title:'Cutter Radius Compensation',
          sub:'Program the part profile — let the controller handle tool offset',
          theory:`Cutter radius compensation (CRC) offsets the tool path by the cutter radius so you program the <em>actual part profile</em> instead of the tool centerline path. This means one program works for any cutter diameter — you just update the D-register value.<br><br>
<strong style="color:var(--blue)">G41</strong> — Left compensation (climb milling on external contours — standard)<br>
<strong style="color:var(--blue)">G42</strong> — Right compensation (internal pockets, conventional milling)<br>
<strong style="color:var(--blue)">G40</strong> — Cancel compensation<br><br>
<strong style="color:var(--intermediate)">Rules for CRC:</strong><br>
• Must activate on a G01 linear move (never on G00)<br>
• Must have a lead-in move long enough for the controller to calculate the offset<br>
• Must cancel with G40 on a linear move before tool change or program end`,
          code:[
            {file:'cutter_comp_G41.nc', lines:[
              ['1','<span class="cm">( EXTERNAL CONTOUR — G41 climb mill )</span>'],
              ['2','<span class="g">G00</span> <span class="x">X-1.0 Y-1.0</span>              <span class="cm">( Start position — outside contour )</span>'],
              ['3','<span class="g">G41</span> <span class="g">G01</span> <span class="x">X0 Y0</span> <span class="f">F15.0</span> <span class="t">D01</span>   <span class="cm">( Activate comp on LINEAR approach )</span>'],
              ['4','<span class="g">G01</span> <span class="x">X4.0</span>                     <span class="cm">( Program part profile — controller handles offset )</span>'],
              ['5','<span class="g">G01</span> <span class="x">Y3.0</span>'],
              ['6','<span class="g">G01</span> <span class="x">X0</span>'],
              ['7','<span class="g">G01</span> <span class="x">Y0</span>'],
              ['8','<span class="g">G40</span> <span class="g">G01</span> <span class="x">X-1.0 Y-1.0</span>        <span class="cm">( Cancel comp on exit move )</span>'],
            ]},
          ],
          warn:'Activating G41 or G42 with a G00 (rapid) move will cause an alarm on most Fanuc controllers. Always activate and cancel cutter comp with a G01 linear move.',
          quiz:{ q:'You change from a 0.500" end mill to a 0.375" end mill for the same contour program. What change do you need to make to run the same program?',
            opts:['Rewrite the entire program with new coordinates','Update the D-offset register for that tool with the new radius (0.1875"). The program code is unchanged.','Change G41 to G42','Change the feedrate only'],
            ans:1, fb:'That\'s the power of cutter comp — you update the D-register with the new radius (0.1875"), and the controller recalculates all the offsets automatically. The program contour coordinates never change. This is why professional programs always use G41/G42.'
          }
        },
        {
          id:'m-i-6', free:false,
          gcode:'G84', title:'Rigid Tapping Cycle',
          sub:'G84 with synchronized feed — the right way to tap on a mill',
          theory:'G84 is the rigid tapping canned cycle. Feed must exactly equal pitch × RPM. The spindle reverses automatically at depth. Rigid tapping requires a controller and spindle that support synchronized rotation.',
          pro:true
        },
        {
          id:'m-i-7', free:false,
          gcode:'G02/G03', title:'Arc Motion — Radii and Full Circles',
          sub:'CW and CCW arcs with I/J and R format',
          theory:'G02 (CW) and G03 (CCW) machine arcs and full circles. Radius R format is simple but cannot define full circles — use I/J center offset format for complete arcs and circles.',
          pro:true
        },
        {
          id:'m-i-8', free:false,
          gcode:'MULTI-WCS', title:'Multi-WCS Setup — G54 Through G59',
          sub:'Multiple parts, pallets, and multi-face setups',
          theory:'G54 through G59 (and extended offsets G54.1 P1–P48 on Fanuc) enable multiple part datums in a single setup. Essential for tombstone machining, multiple fixtures, and rotary table work.',
          pro:true
        },
      ]
    },

    // ── MILL ADVANCED ─────────────────────────────────────────────
    advanced: {
      color: 'var(--advanced)',
      icon: '🔴',
      title: 'Mill Advanced',
      subtitle: 'Full mill programmer: complex cycles, contour, 4/5-axis, variables',
      lessons: [
        {
          id:'m-a-1', free:false,
          gcode:'CONTOUR', title:'Contour Milling & Pocket Programming',
          sub:'Profile milling strategy, pocket entry, finish passes',
          theory:'Contour mill programming covers profile finishing, pocket roughing strategies (zig-zag vs spiral), ramping entry, island avoidance, and depth-of-cut sequencing for consistent finish.',
          pro:true
        },
        {
          id:'m-a-2', free:false,
          gcode:'#VARS MILL', title:'Macro Variables on the Mill',
          sub:'Parametric programming — one program for a family of parts',
          theory:'Macro variables (#100–#999) make mill programs parametric. Store feature dimensions as variables, pass them between sub-calls, and change the entire part size by editing a single line.',
          pro:true
        },
        {
          id:'m-a-3', free:false,
          gcode:'G65', title:'Custom Macro Calls with Arguments',
          sub:'User-defined canned cycles — G65 P9000 argument passing',
          theory:'G65 calls a macro (O9xxx range) and passes argument values to local variables. This enables programmable boss cycles, pocket cycles, and bolt-circle patterns callable with a single line.',
          pro:true
        },
        {
          id:'m-a-4', free:false,
          gcode:'4TH AXIS', title:'4th Axis Rotary Programming',
          sub:'A-axis continuous and index programming',
          theory:'4th axis (rotary A-axis) enables machining multiple faces of a part in one setup. Index programming uses M-codes to lock the rotary at specific angles. Continuous 4-axis uses simultaneous A + XYZ motion.',
          pro:true
        },
        {
          id:'m-a-5', free:false,
          gcode:'FULL PROG', title:'Complete Mill Program — Aluminum Fixture Plate',
          sub:'From raw stock: face, pocket, contour, drill, tap — full annotation',
          theory:'A complete industrial mill program for an aluminum fixture plate. Face milling, pocketing, contour profiling with G41, drilling with G83, rigid tapping with G84. All safety and structural conventions included.',
          pro:true
        },
      ]
    },

    // ── MILL AUTOMATION ───────────────────────────────────────────
    automation: {
      color: 'var(--automation)',
      icon: '🤖',
      title: 'Mill Automation',
      subtitle: 'Probing, adaptive control, 5-axis, Industry 4.0 integration',
      lessons: [
        {
          id:'m-au-1', free:false,
          gcode:'G31 PROBE', title:'Work Offset Probing with G31',
          sub:'Auto-set G54 from part surface measurement',
          theory:'G31 (skip function) stops motion when the probe triggers, capturing the exact axis position in system variables. This position updates G54 automatically — eliminating manual edge finding and ensuring repeatability in automation cells.',
          auto_note:'JobLine.ai logs probe events as setup completion milestones — automatically timestamping when setup was locked in and by whom.',
          code:[
            {file:'probe_G54_update.nc', lines:[
              ['1','<span class="cm">( PROBE X EDGE — auto set G54 X )</span>'],
              ['2','<span class="g">G91 G31</span> <span class="x">X-50.0</span> <span class="f">F80.0</span>       <span class="cm">( Move until probe triggers )</span>'],
              ['3','<span class="kw">#100</span> = <span class="kw">#5061</span>              <span class="cm">( Capture X at trigger moment )</span>'],
              ['4','<span class="g">G90 G10 L2 P1</span> <span class="x">X</span>[<span class="kw">#100</span> + 6.0]  <span class="cm">( Update G54 X — probe radius 6mm )</span>'],
              ['5','<span class="cm">( G54 X is now the part edge )</span>'],
            ]},
          ],
          pro:true
        },
        {
          id:'m-au-2', free:false,
          gcode:'IN-PROCESS SPC', title:'In-Process Measurement & SPC',
          sub:'Mid-cycle gauging, automatic offset correction, Cpk tracking',
          theory:'In-process probing measures actual part features mid-cycle, calculates deviation from nominal, and adjusts tool wear offsets automatically. Combined with SPC tracking, this enables real-time process control without stopping the machine.',
          pro:true
        },
        {
          id:'m-au-3', free:false,
          gcode:'ADAPTIVE', title:'Adaptive Feedrate & Spindle Load Control',
          sub:'Dynamic feed adjustment based on real-time cutting force',
          theory:'Adaptive control monitors spindle motor current (load) and dynamically adjusts the feedrate to maintain optimal cutting conditions. Heavy cuts get reduced feed; light cuts get increased feed — maximizing tool life and cycle time simultaneously.',
          pro:true
        },
        {
          id:'m-au-4', free:false,
          gcode:'MTConnect', title:'MTConnect + OPC-UA + JobLine.ai',
          sub:'Mill data streaming for real-time shop floor intelligence',
          theory:'MTConnect adapters attached to the CNC controller stream spindle data, feedrate, program name, alarm codes, and part counts to network consumers. OPC-UA extends this to ERP and MES systems. JobLine.ai consumes this stream to auto-populate work orders, shift reports, and NCR logs.',
          auto_note:'A mill connected to JobLine.ai via MTConnect eliminates 100% of manual cycle time entry, part count reporting, and program verification sign-offs on that machine.',
          pro:true
        },
        {
          id:'m-au-5', free:false,
          gcode:'AI+CNC', title:'AI-Assisted Mill Programming & Optimization',
          sub:'CAM AI toolpaths, LLM-assisted code, generative process planning',
          theory:'AI-assisted CAM is already reshaping how complex parts are programmed. This lesson covers current AI toolpath tools, how to use LLMs effectively for G-code generation and debugging, and the roadmap for fully autonomous mill process planning.',
          auto_note:'WeCr8 G-Code Academy is the training pipeline for the operators and programmers who will use the next generation of AI-assisted machining tools — including those in the ToolingHero.us and JobLine.ai ecosystems.',
          pro:true
        },
      ]
    },
  }, // end mill

};
