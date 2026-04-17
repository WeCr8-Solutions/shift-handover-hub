// ═══════════════════════════════════════════════════════════════════
// OAP-DATA.JS — Course Content & Checkpoint Definitions
// Safety courses, measuring training, tooling training,
// machine-specific OAK checklists
// WeCr8 Solutions LLC | JobLine.ai | v1.0.0
// ═══════════════════════════════════════════════════════════════════

'use strict';

const OAP_COURSES = {

  // ── SAFETY COURSES ───────────────────────────────────────────────
  safety_general: {
    id: 'safety_general', label: 'General Shop Safety', icon: '🦺',
    section: 'safety', linkedSafety: 'shop_safety', duration: '45 min',
    passMark: 80, required: true,
    desc: 'Foundational shop safety for all manufacturing environments.',
    topics: [
      { id:'sg1', title:'PPE Requirements',
        content:`<strong>Required PPE in a manufacturing environment:</strong><br><br>
<strong style="color:var(--accent)">Eyes:</strong> ANSI Z87.1 safety glasses at minimum. Full face shield when grinding, using coolant, or handling chemicals.<br><br>
<strong style="color:var(--accent)">Feet:</strong> Steel or composite toe boots are mandatory on the shop floor. No exceptions — ever.<br><br>
<strong style="color:var(--accent)">Hearing:</strong> Foam earplugs (NRR 29+) or earmuffs when in high-noise areas. Prolonged exposure above 85 dB causes permanent hearing loss.<br><br>
<strong style="color:var(--accent)">Hands:</strong> Never wear gloves near rotating machinery (lathes, mills, drill presses). Gloves can catch and pull a hand into the machine. Gloves ARE required for handling sheet metal, chemicals, and raw stock edges.<br><br>
<strong style="color:var(--accent)">Hair & clothing:</strong> Long hair must be tied back or netted. No loose sleeves, jewelry, or dangling items near moving equipment.`,
        quiz: { q:'When is it UNSAFE to wear gloves?', opts:['When handling sheet metal edges','Near rotating machinery (lathes, mills, drill presses)','When using chemicals','When handling sharp tooling'], ans:1, fb:'Gloves near rotating spindles or chucks can catch and pull your hand into the machine — a fraction of a second, no recovery.' }
      },
      { id:'sg2', title:'Emergency Stop & Procedures',
        content:`<strong>Know before you press Cycle Start:</strong><br><br>
<strong style="color:var(--red)">Emergency Stop (E-Stop):</strong> The large red mushroom button. Cuts all power to axes and spindle instantly. Know its location before anything moves.<br><br>
<strong style="color:var(--accent)">Fire:</strong> Know the nearest fire extinguisher location and the nearest exit. RACE: Rescue, Alarm, Contain, Extinguish/Evacuate.<br><br>
<strong style="color:var(--accent)">Medical emergency:</strong> Know the location of the first aid kit, AED, and eyewash station. Know who the trained first responders are.<br><br>
<strong style="color:var(--accent)">Chemical spill:</strong> SDS (Safety Data Sheet) binder location. Spill kit location. Ventilation procedure.`,
        quiz: { q:'What does pressing the E-Stop button do?', opts:['Pauses the program at the next line','Cuts all power to axes and spindle immediately','Retracts the tool to home position','Opens the machine door'], ans:1, fb:'E-Stop immediately kills all powered motion — spindle, axes, coolant. It is the universal emergency cut-off on all CNC equipment.' }
      },
      { id:'sg3', title:'Housekeeping & Machine Guarding',
        content:`<strong>A clean shop is a safe shop:</strong><br><br>
<strong style="color:var(--accent)">Machine guards:</strong> NEVER remove or bypass a machine guard. Guards are required by OSHA and are there to prevent contact with hazardous moving parts. If a guard is missing or damaged, red-tag the machine and report it immediately.<br><br>
<strong style="color:var(--accent)">Floor cleanliness:</strong> Oil or coolant on floors causes slips that send people into machines. Report spills immediately. Use absorbent materials. Chip conveyors must be kept clear.<br><br>
<strong style="color:var(--accent)">Aisle clearance:</strong> Fire exits, electrical panels, and emergency equipment must be accessible at all times. Minimum 36" aisle clearance required by code.`,
        quiz: { q:'You notice the door guard on a lathe is cracked and partially blocked. What is the correct action?', opts:['Continue using the machine carefully','Remove the guard so it does not interfere','Red-tag the machine, do not operate it, report to supervisor immediately','Tape the crack and continue'], ans:2, fb:'A damaged guard must be reported and the machine taken out of service until repaired. Operating without proper guarding violates OSHA 1910.212 and puts lives at risk.' }
      },
    ],
  },

  safety_loto: {
    id: 'safety_loto', label: 'Lockout / Tagout (LOTO)', icon: '🔐',
    section: 'safety', linkedSafety: 'lockout_tagout', duration: '30 min',
    passMark: 90, required: true,
    desc: 'OSHA 29 CFR 1910.147 — control of hazardous energy.',
    topics: [
      { id:'loto1', title:'What is LOTO and When is it Required?',
        content:`<strong>LOTO (Lockout/Tagout)</strong> is required any time you:<br><br>
• Perform maintenance, repair, or adjustment on equipment<br>
• Clear jams or blockages<br>
• Change tooling when a power source is involved<br>
• Service electrical, hydraulic, pneumatic, or mechanical systems<br><br>
<strong style="color:var(--red)">The hazard:</strong> Unexpected energization or startup of equipment causes approximately 50,000 injuries and 120 deaths per year in the US (OSHA data). CNC machines store multiple energy sources: electrical, hydraulic (clamping), pneumatic, gravity (axes that can drop).<br><br>
<strong style="color:var(--accent)">OSHA Standard:</strong> 29 CFR 1910.147 mandates written procedures, trained personnel, and proper equipment for all lockout operations.`,
        quiz: { q:'You need to clear a chip jam inside the machine. The E-Stop is pressed. Is this sufficient before reaching inside?', opts:['Yes — E-Stop cuts all power','No — you must follow full LOTO procedure including mechanical lockout of all energy sources','Yes — if the spindle is stopped','Only if a supervisor is present'], ans:1, fb:'E-Stop alone is not LOTO. Hydraulic clamping, pneumatic systems, and stored mechanical energy (axes under gravity) can still be active. Full LOTO procedure is required.' }
      },
      { id:'loto2', title:'LOTO Procedure Steps',
        content:`<strong>OSHA-compliant LOTO sequence:</strong><br><br>
<strong style="color:var(--accent)">1. Notify</strong> — Tell all affected employees the machine is being locked out.<br>
<strong style="color:var(--accent)">2. Identify energy sources</strong> — Electrical, hydraulic, pneumatic, gravity, thermal.<br>
<strong style="color:var(--accent)">3. Shut down</strong> — Use normal stopping procedures.<br>
<strong style="color:var(--accent)">4. Isolate</strong> — Turn off / disconnect all energy isolation devices (main disconnect, air valve, hydraulic shutoff).<br>
<strong style="color:var(--accent)">5. Apply lockout device</strong> — Your personal padlock goes on EVERY isolation point.<br>
<strong style="color:var(--accent)">6. Release / restrain stored energy</strong> — Bleed pneumatics, block axes, discharge capacitors.<br>
<strong style="color:var(--accent)">7. Verify</strong> — Try to start the machine. Verify it will NOT energize before reaching in.<br><br>
<strong style="color:var(--red)">ONE person = ONE lock. Only you remove your lock. Never remove another person's lock.</strong>`,
        quiz: { q:'You applied your lock to the main disconnect. A co-worker needs to also work on the same machine. What must happen?', opts:['Your lock covers both workers — one lock is fine','The co-worker must apply THEIR OWN padlock to the same isolation point using a hasp','Only the supervisor needs a lock','A tagout alone is sufficient for the second person'], ans:1, fb:'Each authorized employee who is working on the equipment must apply their own personal padlock. This ensures the machine cannot be re-energized until every worker has cleared and removed their own lock.' }
      },
    ],
  },

  safety_fire: {
    id: 'safety_fire', label: 'Fire Extinguisher Operation', icon: '🧯',
    section: 'safety', linkedSafety: 'fire_ext', duration: '20 min',
    passMark: 90, required: true,
    desc: 'PASS method, extinguisher types, fire classes, when NOT to fight.',
    topics: [
      { id:'fire1', title:'Fire Classes & Extinguisher Types',
        content:`<strong>Know your fire class before reaching for an extinguisher:</strong><br><br>
<strong style="color:var(--accent)">Class A:</strong> Ordinary combustibles — wood, paper, cardboard, cloth. Water or ABC extinguisher.<br>
<strong style="color:var(--accent)">Class B:</strong> Flammable liquids — oil, grease, coolant, hydraulic fluid, solvents. CO₂, dry chemical, or ABC.<br>
<strong style="color:var(--accent)">Class C:</strong> Electrical fires — live electrical equipment, control panels, motors. CO₂ or dry chemical ONLY. Never water.<br>
<strong style="color:var(--accent)">Class D:</strong> Combustible metals — magnesium chips, titanium, aluminum swarf. Class D extinguisher ONLY. Standard extinguishers can make it worse.<br>
<strong style="color:var(--accent)">Class K:</strong> Cooking oils/fats — not common in machining.<br><br>
<strong style="color:var(--gold)">Most common in machining shops:</strong> ABC dry chemical (multipurpose) and CO₂. Always verify rating before fire breaks out — not during.`,
        quiz: { q:'A CNC machine control panel is smoking and flames are visible. Which extinguisher type should you use?', opts:['Water extinguisher — fastest knockdown','Class A dry chemical','CO₂ or ABC dry chemical — never water on electrical','Class D metal fire extinguisher'], ans:2, fb:'Electrical fires (Class C) require CO₂ or dry chemical. Water conducts electricity and will electrocute the person using it and spread the fire. Never use water on live electrical fires.' }
      },
      { id:'fire2', title:'PASS Method & When to Evacuate',
        content:`<strong>The PASS Method — the only way to use a fire extinguisher:</strong><br><br>
<strong style="color:var(--red)">P</strong> — <strong>Pull</strong> the pin (breaks the tamper seal)<br>
<strong style="color:var(--red)">A</strong> — <strong>Aim</strong> at the BASE of the fire, not the flames<br>
<strong style="color:var(--red)">S</strong> — <strong>Squeeze</strong> the handle<br>
<strong style="color:var(--red)">S</strong> — <strong>Sweep</strong> side to side across the base<br><br>
<strong style="color:var(--gold)">When NOT to fight a fire (evacuate immediately):</strong><br>
• The fire is larger than a wastebasket<br>
• You don't know what's burning<br>
• The fire is spreading rapidly<br>
• You don't have the right extinguisher type<br>
• There is smoke obscuring your exit path<br>
• Your instinct says GET OUT — trust it<br><br>
<strong>Your safety is more important than the equipment.</strong>`,
        quiz: { q:'Using the PASS method, where do you aim the extinguisher?', opts:['At the flames to knock them down','At the top of the fire','At the base of the fire','At the fuel source above the fire line'], ans:2, fb:'Always aim at the BASE of the fire — the fuel/heat interface. Aiming at flames just pushes them around without eliminating the heat source. Sweep side to side at the base.' }
      },
    ],
  },

  safety_hazcom: {
    id: 'safety_hazcom', label: 'HazCom / GHS / SDS', icon: '⚗️',
    section: 'safety', linkedSafety: 'hazcom', duration: '25 min',
    passMark: 80, required: true,
    desc: 'OSHA Hazard Communication Standard — SDS sheets, GHS labels, chemical handling.',
    topics: [
      { id:'haz1', title:'GHS Labels & Pictograms',
        content:`<strong>Every chemical container must have a GHS-compliant label:</strong><br><br>
<strong style="color:var(--accent)">Product identifier</strong> — Name or code on the SDS<br>
<strong style="color:var(--accent)">Signal word</strong> — "DANGER" (severe) or "WARNING" (moderate)<br>
<strong style="color:var(--accent)">Hazard statements</strong> — Specific nature of the hazard<br>
<strong style="color:var(--accent)">Precautionary statements</strong> — PPE and handling instructions<br>
<strong style="color:var(--accent)">Supplier info</strong> — Name, address, phone<br>
<strong style="color:var(--accent)">Pictograms</strong> — 9 standardized GHS symbols (flame, skull & crossbones, corrosion, etc.)<br><br>
In a machining shop you regularly encounter: cutting fluids (coolant), lubricants, parts washer solvents, rust preventives, thread-cutting oils, and grinding compounds — all require SDS sheets.`,
        quiz: { q:'A container of coolant concentrate has no label. What should you do?', opts:['Use it — coolant is generally safe','Smell it to identify it','Do not use it. Label it as unknown, remove from service, contact supervisor','Ask a coworker if they know what it is'], ans:2, fb:'An unlabeled chemical must NEVER be used. OSHA HazCom requires proper labeling on all hazardous chemicals. Remove from service and contact a supervisor for identification.' }
      },
    ],
  },

  // ── MATERIAL HANDLING COURSES ─────────────────────────────────
  material_handling: {
    id: 'material_handling', label: 'Raw Material Handling & Saw Operation', icon: '📦',
    section: 'materials', duration: '45 min',
    passMark: 80, required: true,
    desc: 'Material identification, storage, handling procedures, bandsaw/cold saw operation.',
    topics: [
      { id:'mat1', title:'Raw Material Identification',
        content:`<strong>Every material in the shop has specific handling requirements:</strong><br><br>
<strong style="color:var(--accent)">Aluminum (6061, 7075, 2024):</strong> Lightweight, soft, sharp burrs. Cuts easily. Chips are stringy and can be sharp. Handle with leather gloves at edges.<br><br>
<strong style="color:var(--accent)">Steel (1018, 4140, 4340, 17-4 SS):</strong> Heavy — get help or use a hoist for anything over 50 lbs. Mill scale on hot-rolled is rough and abrasive. Stainless work-hardens — handle edges carefully.<br><br>
<strong style="color:var(--accent)">Titanium:</strong> Looks like steel but weighs ~60% as much. Combustible chips — DO NOT grind without proper precautions. Very heat-sensitive when cutting.<br><br>
<strong style="color:var(--accent)">Brass / Copper:</strong> Dense, heavy. Chips are curly and sharp. Can tarnish tooling quickly.<br><br>
<strong style="color:var(--accent)">Material tags / certs:</strong> Every piece of raw material should have a tag (heat number, alloy, spec). Never remove tags until the job is complete. In aerospace and medical, lost certs = scrap.`,
        quiz: { q:'You receive a bar of material with no identifying tag. What is the correct action?', opts:['Assume it is 6061 aluminum since most jobs use it','Test it with a magnet to figure it out','Quarantine the material, do not use it, notify your supervisor to verify the material cert','Use it for a practice piece first'], ans:2, fb:'Unidentified material must never be used in production. In regulated industries (aerospace, medical), material traceability is mandatory. An unlabeled bar could be the wrong alloy entirely.' }
      },
      { id:'mat2', title:'Bandsaw & Cold Saw Safety',
        content:`<strong>Saw operation is one of the highest injury-risk operations in a job shop:</strong><br><br>
<strong style="color:var(--accent)">Before cutting:</strong><br>
• Verify blade condition — check for missing teeth, cracks, proper tension<br>
• Set the blade guide to within ¼" of the material<br>
• Confirm vise/clamp is fully secured — material must not shift during cut<br>
• Clear chips from the previous cut and verify coolant flow (cold saw)<br><br>
<strong style="color:var(--accent)">During cutting:</strong><br>
• Never put your hands in the blade path<br>
• Use push sticks or clamps for small pieces<br>
• Let the saw do the work — do not force feed<br>
• Keep eyes on the cut — watch for blade wandering<br><br>
<strong style="color:var(--accent)">After cutting:</strong><br>
• Let the blade fully stop before reaching near it<br>
• Deburr cut ends before handling — freshly cut metal is razor sharp<br>
• Tag the cut piece immediately with job/material info`,
        quiz: { q:'You are about to cut a small 3" piece of round stock on the bandsaw. The piece is too short to hold safely by hand. What do you do?', opts:['Hold it as carefully as possible — it will be quick','Use the vise/clamp to secure it — never hold small pieces by hand near the blade','Ask someone to hold it steady while you cut','Skip the cut and order the right size'], ans:1, fb:'Small pieces must always be clamped. Hands near the blade is never acceptable regardless of how short the cut will be. The vise exists for exactly this situation.' }
      },
    ],
  },

  // ── MEASURING COURSES ─────────────────────────────────────────
  measuring_basic: {
    id: 'measuring_basic', label: 'Basic Measurement — Tape, Rule & Caliper', icon: '📏',
    section: 'measuring', duration: '40 min',
    passMark: 85, required: true,
    linkedEquip: ['tape_25','steel_rule','caliper_6','caliper_vernier'],
    desc: 'Tape measure, steel rule, digital caliper, vernier caliper — read and use correctly.',
    topics: [
      { id:'meas1', title:'Tape Measure & Steel Rule',
        content:`<strong>The starting point of all dimensional awareness:</strong><br><br>
<strong style="color:var(--accent)">Tape measure hook:</strong> The hook at the end floats by exactly 1/16" — this is intentional. It accounts for hook thickness in inside vs outside measurements. Never force it tight for an inside measurement.<br><br>
<strong style="color:var(--accent)">Reading fractions:</strong> Most tapes read to 1/16". Count tick marks from the last inch. The longest mark = 1/2". Medium marks = 1/4" and 3/4". Shorter = 1/8" increments. Shortest = 1/16".<br><br>
<strong style="color:var(--accent)">Steel rule:</strong> Reads to 1/64" or 1/100" (decimal). For precision layout and short measurements. Never use as a straightedge for scribing unless it is a true straight rule.`,
        quiz: { q:'A tape measure reads 4 full inches plus 3 marks past the 1/2" line (counting by 1/8" increments). What is the measurement?', opts:['4-3/4"','4-7/8"','4-5/8"','4-1/2"'], ans:1, fb:'1/2" + 3 × 1/8" = 4/8" + 3/8" = 7/8". Answer: 4-7/8". Always count from the last inch, not from zero.' }
      },
      { id:'meas2', title:'Digital Caliper Use & Care',
        content:`<strong>The caliper is the most-used precision tool in a machine shop:</strong><br><br>
<strong style="color:var(--accent)">Four ways to measure:</strong><br>
1. <strong>Outside jaws (bottom)</strong> — OD, thickness, length<br>
2. <strong>Inside jaws (top small jaws)</strong> — ID, slot width<br>
3. <strong>Depth rod</strong> — hole depth, shoulder depth<br>
4. <strong>Step measurement</strong> — shoulder height<br><br>
<strong style="color:var(--accent)">Zero/calibrate:</strong> Always close and zero before measuring. With inch/mm calipers, verify the display is in the correct unit.<br><br>
<strong style="color:var(--accent)">Care:</strong> Never drop. Keep clean — chips in the rail cause inaccurate readings. Store in case. Check calibration annually or after drops. Resolution: 0.0005" (digital). Do not use as a scribe or pry tool.`,
        quiz: { q:'You are measuring a bore with a caliper. The display reads 1.2530" but the drawing calls for 1.253±0.002". Is this part in spec?', opts:['Yes — 1.2530" is within ±0.002" of 1.253"','No — the measurement is over by 0.003"','Cannot determine from caliper reading alone','Yes — all caliper readings are within spec by default'], ans:0, fb:'1.253" ± 0.002" = 1.251" to 1.255". The reading 1.2530" falls within that range. Part is in spec.' }
      },
    ],
  },

  measuring_precision: {
    id: 'measuring_precision', label: 'Precision Measurement — Micrometer & Gauges', icon: '🎯',
    section: 'measuring', duration: '45 min',
    passMark: 85, required: true,
    linkedEquip: ['mic_outside','mic_inside','mic_depth','bore_gauge','thread_ring','thread_plug'],
    desc: 'Outside/inside/depth micrometers, bore gauges, thread gauges — read to 0.0001".',
    topics: [
      { id:'mic1', title:'Outside Micrometer Reading',
        content:`<strong>The micrometer reads to 0.0001" — 10x finer than a caliper:</strong><br><br>
<strong style="color:var(--accent)">The thimble:</strong> One full turn = 0.025". The sleeve has marks at 0.025" intervals. The thimble has 25 divisions (each = 0.001").<br><br>
<strong style="color:var(--accent)">Reading steps:</strong><br>
1. Read the whole + quarter-turn marks visible on the sleeve (e.g., 0.275")<br>
2. Add the thimble line reading (e.g., 18 = 0.018")<br>
3. Add vernier line if present (e.g., 2 = 0.0002")<br>
Total: 0.2932"<br><br>
<strong style="color:var(--accent)">Ratchet / friction thimble:</strong> Always use the ratchet stop for consistent gaging force. Never overtighten — it distorts the part and the measurement.<br><br>
<strong style="color:var(--accent)">Zeroing:</strong> Clean faces, close on setting standard or direct zero contact, adjust sleeve index to 0.`,
        quiz: { q:'A micrometer sleeve shows 0.250" visible plus the thimble reads 14.5. What is the measurement?', opts:['0.2645"','0.2645"','0.2645"','0.2650"'], ans:0, fb:'0.250" + (14.5 × 0.001") = 0.250" + 0.0145" = 0.2645". Always: sleeve + thimble + vernier (if equipped).' }
      },
      { id:'mic2', title:'Bore Gauge & Thread Gauges',
        content:`<strong>Measuring inside diameters and thread acceptance:</strong><br><br>
<strong style="color:var(--accent)">Bore gauge:</strong> A telescoping or dial bore gauge measures IDs that a caliper can't reliably reach. Set the gauge in the bore, rock to find minimum reading, then measure the set dimension with an outside mic. The bore gauge + micrometer combination gives you true bore size to 0.0001".<br><br>
<strong style="color:var(--accent)">Thread plug gauges (GO/NOGO):</strong><br>
• GO gauge must enter freely — thread is not undersized<br>
• NOGO gauge must NOT enter — thread is not oversized<br>
• If NOGO enters: the thread is out of tolerance. Reject the part.<br><br>
<strong style="color:var(--accent)">Pi tape / OD tape:</strong> Wraps around a cylinder to read the circumference as a diameter. Used for large ODs that won't fit in a mic. Accurate to 0.001".`,
        quiz: { q:'You check a threaded hole with a 1/2-13 UNC thread plug gauge. The GO gauge enters. The NOGO gauge also enters. What does this mean?', opts:['The thread is perfect — both gauges should enter','The thread is acceptable — NOGO just means optional check','The thread is OUT OF TOLERANCE — too large. Reject the part.','Re-tap the thread and check again before deciding'], ans:2, fb:'NOGO entering means the thread is oversized (pitch diameter too large). The part must be rejected. Re-tapping will only make it worse. The hole may be reworkable by inserts in some cases — but it is definitely out of tolerance as-is.' }
      },
    ],
  },

  // ── TOOLING COURSES ───────────────────────────────────────────
  tooling_id: {
    id: 'tooling_id', label: 'Tool Identification & Holders', icon: '🔧',
    section: 'tooling', duration: '50 min',
    passMark: 80, required: true,
    linkedEquip: ['endmill_flat','endmill_ball','drill_hss','drill_carbide','tap_hss','tap_spiral','collet_er','tool_holder_ext','insert_turning'],
    desc: 'End mills, drills, taps, turning inserts, tool holders — identify, select, and handle correctly.',
    topics: [
      { id:'tool1', title:'End Mills — Types & Selection',
        content:`<strong>End mills are the backbone of milling operations:</strong><br><br>
<strong style="color:var(--accent)">Flat (Square) End Mill:</strong> General purpose — slots, pockets, contouring, facing. 2-flute for aluminum (chip evacuation), 4-flute for steel (strength, finish).<br><br>
<strong style="color:var(--accent)">Ball Nose End Mill:</strong> Produces 3D contoured surfaces. Radius on tip = half the tool diameter. Used for mold work, sculpted surfaces, ramp-ins.<br><br>
<strong style="color:var(--accent)">Bull Nose (Corner Radius):</strong> Flat floor with a radius corner. More rigid than ball nose. Used for floor finishing and mold cavities where a corner break is needed.<br><br>
<strong style="color:var(--accent)">Key markings:</strong> Diameter is stamped on shank (e.g., "1/2" or "12mm"). Number of flutes usually visible. Length of cut (LOC) and overall length (OAL) matter for reach.`,
        quiz: { q:'You need to rough out a large aluminum pocket. Which end mill geometry and flute count is most appropriate?', opts:['4-flute carbide ball nose','2-flute flat end mill — better chip evacuation in aluminum','4-flute flat end mill — more flutes = faster material removal in aluminum','Single-flute insert mill'], ans:1, fb:'Aluminum produces long, stringy chips that need room to escape. 2-flute end mills have larger flute valleys for chip evacuation, preventing re-cutting and built-up edge. 4-flute mills work in aluminum only with aggressive chip thinning or peck strategies.' }
      },
      { id:'tool2', title:'Drills & Taps',
        content:`<strong>Hole-making is the most common operation in a machine shop:</strong><br><br>
<strong style="color:var(--accent)">HSS vs Carbide drills:</strong> HSS is flexible (forgiving of runout), carbide is faster and holds size better but is brittle. Always start with a spot drill or center drill to prevent walking.<br><br>
<strong style="color:var(--accent)">Tap selection:</strong><br>
• <strong>Spiral point (gun tap):</strong> Pushes chips forward — for through holes<br>
• <strong>Spiral flute:</strong> Pulls chips upward — for blind holes<br>
• <strong>Form/roll tap:</strong> Displaces material (no chips) — strongest thread, for ductile materials<br><br>
<strong style="color:var(--accent)">Tap drill size:</strong> Tap drill = major diameter − (1/number of threads per inch). Example: 1/4-20 UNC → 0.250 − 0.050 = 0.200" ≈ #7 drill (0.201"). Always verify with a tap drill chart — memorizing is not enough.`,
        quiz: { q:'You are tapping a blind hole in aluminum. Which tap type should you select?', opts:['Spiral point (gun tap) — chips go forward','Spiral flute tap — pulls chips out of the blind hole','Straight flute tap — neutral chip direction','Form tap — no chips at all is always best'], ans:1, fb:'Spiral flute taps pull chips upward and out of the blind hole. A gun tap would pack chips at the bottom, cause tap breakage, and potentially destroy the part. Form taps are a valid alternative for aluminum but require correct drill size for proper thread form.' }
      },
    ],
  },
};

// ── OAK CHECKLISTS (Machine Floor Qualification) ──────────────
// Default checkpoints employers can select from or copy
const OAP_OAK_TEMPLATES = {
  cnc_lathe: {
    label: 'CNC Lathe OAK Checklist',
    machine: 'cnc_lathe',
    checkpoints: [
      { id:'ltoak01', label:'Identify and locate all E-Stop buttons on machine and control',                    type:'observed', section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'ltoak02', label:'Complete power-on and machine reference/homing procedure',                        type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'ltoak03', label:'Identify machine zones and explain no-entry conditions',                          type:'observed', section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'ltoak04', label:'Load and index a tool in the turret — verify position',                           type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'ltoak05', label:'Set a tool length offset using machine probing or touch-off method',             type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:true  },
      { id:'ltoak06', label:'Locate and load a program from memory or USB',                                    type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'ltoak07', label:'Perform a dry run / single-block first pass correctly',                           type:'observed', section:'machine', mentorSignOff:true, employerBuyOff:true  },
      { id:'ltoak08', label:'Measure a first article part and compare to print — pass/fail decision',          type:'observed', section:'machine', mentorSignOff:true, employerBuyOff:true  },
      { id:'ltoak09', label:'Make a wear offset adjustment based on measurement result',                       type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:true  },
      { id:'ltoak10', label:'Explain and demonstrate proper chip management and coolant operation',             type:'observed', section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'ltoak11', label:'Demonstrate correct alarm acknowledgment and recovery for at least 2 alarms',    type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'ltoak12', label:'Power-down machine following end-of-shift procedure',                             type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'ltoak13', label:'EMPLOYER FINAL BUY-OFF: Unsupervised first production run observed',             type:'observed', section:'floor',   mentorSignOff:true, employerBuyOff:true  },
    ],
  },
  cnc_vmc: {
    label: 'CNC VMC OAK Checklist',
    machine: 'cnc_vmc',
    checkpoints: [
      { id:'vmoak01', label:'Locate all E-Stops, identify operator panel layout',                              type:'observed', section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'vmoak02', label:'Power-on, home axes in correct Z-first sequence',                                 type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'vmoak03', label:'Load a tool into the spindle — verify pull stud and retention',                   type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'vmoak04', label:'Set tool length offset (G43) using probe or gage block method',                   type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:true  },
      { id:'vmoak05', label:'Edge-find a workpiece and set G54 work offset (X, Y, Z)',                         type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:true  },
      { id:'vmoak06', label:'Load and verify a program — check safe state line (G90 G17 G40 G80 G49)',         type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'vmoak07', label:'Run first part in single-block mode at reduced feedrate — explain each move',     type:'observed', section:'machine', mentorSignOff:true, employerBuyOff:true  },
      { id:'vmoak08', label:'Measure first article — in-process inspection to print',                          type:'observed', section:'machine', mentorSignOff:true, employerBuyOff:true  },
      { id:'vmoak09', label:'Demonstrate cutter compensation awareness (G41/G42) — explain purpose',           type:'both',     section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'vmoak10', label:'Toolchange — add/replace a tool and verify offset in ATC',                        type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'vmoak11', label:'EMPLOYER FINAL BUY-OFF: Independent production run observed',                    type:'observed', section:'floor',   mentorSignOff:true, employerBuyOff:true  },
    ],
  },
  saw_bandsaw: {
    label: 'Horizontal Bandsaw OAK Checklist',
    machine: 'bandsaw_horiz',
    checkpoints: [
      { id:'sawoak01', label:'Inspect blade condition, tension, and guide clearance before use',               type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'sawoak02', label:'Set and secure vise to material — no freehand cutting',                          type:'observed', section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'sawoak03', label:'Set blade speed (if variable) appropriate to material type',                     type:'demo',     section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'sawoak04', label:'Demonstrate feed rate control — do not force the blade',                         type:'observed', section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'sawoak05', label:'Coolant flow verification and chip brush use',                                   type:'observed', section:'machine', mentorSignOff:true, employerBuyOff:false },
      { id:'sawoak06', label:'Full stop verification before handling material after cut',                       type:'observed', section:'machine', mentorSignOff:true, employerBuyOff:true  },
      { id:'sawoak07', label:'EMPLOYER FINAL BUY-OFF: Unsupervised cut of production material',               type:'observed', section:'floor',   mentorSignOff:true, employerBuyOff:true  },
    ],
  },
};

// ── SECTION CHECKPOINT LIBRARY ────────────────────────────────
// Standard checkpoints employers can drag into any role
const OAP_CHECKPOINT_LIBRARY = {
  orientation: [
    { id:'or01', label:'Complete new hire HR paperwork',                          type:'written',  mentorSignOff:false, employerBuyOff:false },
    { id:'or02', label:'Facility tour — all departments, exits, restrooms',        type:'observed', mentorSignOff:true,  employerBuyOff:false },
    { id:'or03', label:'Emergency exits and muster point identified',              type:'observed', mentorSignOff:true,  employerBuyOff:false },
    { id:'or04', label:'Company quality policy review',                            type:'written',  mentorSignOff:false, employerBuyOff:false },
    { id:'or05', label:'Attendance, break, and cell phone policy acknowledgment',  type:'written',  mentorSignOff:false, employerBuyOff:false },
  ],
  safety: [
    { id:'sf01', label:'General shop safety course — pass quiz at 80%+',           type:'written',  mentorSignOff:true,  employerBuyOff:false, linkedCourse:'safety_general' },
    { id:'sf02', label:'PPE fitted and verified — glasses, boots, hearing',         type:'observed', mentorSignOff:true,  employerBuyOff:false },
    { id:'sf03', label:'LOTO training — pass quiz at 90%+',                        type:'written',  mentorSignOff:true,  employerBuyOff:false, linkedCourse:'safety_loto' },
    { id:'sf04', label:'Fire extinguisher training — location, type, PASS method', type:'both',     mentorSignOff:true,  employerBuyOff:false, linkedCourse:'safety_fire' },
    { id:'sf05', label:'HazCom / SDS review for shop chemicals in use',            type:'written',  mentorSignOff:true,  employerBuyOff:false, linkedCourse:'safety_hazcom' },
    { id:'sf06', label:'Eyewash station and first aid kit locations verified',      type:'observed', mentorSignOff:true,  employerBuyOff:false },
    { id:'sf07', label:'Emergency evacuation drill participation',                  type:'observed', mentorSignOff:false, employerBuyOff:false },
  ],
  materials: [
    { id:'mt01', label:'Material identification quiz — alloys and handling',       type:'written',  mentorSignOff:true,  employerBuyOff:false, linkedCourse:'material_handling' },
    { id:'mt02', label:'Demonstrate safe bar/billet handling with correct PPE',    type:'observed', mentorSignOff:true,  employerBuyOff:false },
    { id:'mt03', label:'Read and verify a material cert / tag',                    type:'demo',     mentorSignOff:true,  employerBuyOff:false },
    { id:'mt04', label:'Saw setup and safe cut demonstration',                     type:'observed', mentorSignOff:true,  employerBuyOff:true  },
    { id:'mt05', label:'Deburr a cut piece safely',                                type:'observed', mentorSignOff:true,  employerBuyOff:false },
  ],
  measuring: [
    { id:'meas01', label:'Read a tape measure to 1/16" — 3 sample readings',       type:'demo',     mentorSignOff:true,  employerBuyOff:false, linkedCourse:'measuring_basic'     },
    { id:'meas02', label:'Read a steel rule to 1/64"',                             type:'demo',     mentorSignOff:true,  employerBuyOff:false, linkedCourse:'measuring_basic'     },
    { id:'meas03', label:'Use digital caliper — OD, ID, depth — 5 sample readings', type:'demo',   mentorSignOff:true,  employerBuyOff:false, linkedCourse:'measuring_basic'     },
    { id:'meas04', label:'Use outside micrometer — read to 0.0001"',               type:'demo',     mentorSignOff:true,  employerBuyOff:true,  linkedCourse:'measuring_precision'  },
    { id:'meas05', label:'Set a bore gauge and transfer to micrometer',            type:'demo',     mentorSignOff:true,  employerBuyOff:false, linkedCourse:'measuring_precision'  },
    { id:'meas06', label:'Use thread GO/NOGO gauges — make accept/reject decision', type:'demo',   mentorSignOff:true,  employerBuyOff:false, linkedCourse:'measuring_precision'  },
    { id:'meas07', label:'Read and interpret a 2D engineering drawing (tolerances, GD&T basics)', type:'written', mentorSignOff:true, employerBuyOff:false },
  ],
  tooling: [
    { id:'tl01', label:'Identify 10 common end mills by geometry and flute count', type:'both',     mentorSignOff:true,  employerBuyOff:false, linkedCourse:'tooling_id' },
    { id:'tl02', label:'Identify common drill types — HSS, carbide, spot drill',   type:'both',     mentorSignOff:true,  employerBuyOff:false, linkedCourse:'tooling_id' },
    { id:'tl03', label:'Select correct tap type for a given hole condition',        type:'written',  mentorSignOff:true,  employerBuyOff:false, linkedCourse:'tooling_id' },
    { id:'tl04', label:'Assemble ER collet chuck to correct torque spec',           type:'demo',     mentorSignOff:true,  employerBuyOff:false },
    { id:'tl05', label:'Identify turning insert grades and geometry (CNMG/WNMG)',  type:'both',     mentorSignOff:true,  employerBuyOff:false },
    { id:'tl06', label:'Operate preset station — set tool length and diameter',    type:'demo',     mentorSignOff:true,  employerBuyOff:true  },
    { id:'tl07', label:'Identify worn/damaged tooling — make replace/use decision', type:'observed', mentorSignOff:true,  employerBuyOff:false },
  ],
};
