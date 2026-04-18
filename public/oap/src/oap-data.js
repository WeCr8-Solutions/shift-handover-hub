// ═══════════════════════════════════════════════════════════════════
// OAP-DATA.JS — Course Content & Checkpoint Definitions
// Safety courses, measuring training, tooling training,
// machine-specific OAK checklists
// WeCr8 Solutions LLC | JobLine.ai | v1.1.0
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
      { id:'sg4', title:'Slips, Trips & Lifting',
        content:`<strong>Most shop injuries are not from machines — they are from the floor and from lifting:</strong><br><br>
<strong style="color:var(--accent)">Slip prevention:</strong> Coolant, oil, and chips on the floor are the #1 cause of shop injuries. Mop spills immediately. Use absorbent on oil. Never walk through a puddle assuming it is just water — it is almost always slippery.<br><br>
<strong style="color:var(--accent)">Trip hazards:</strong> Air hoses, power cords, and pallet jack handles left in walkways. Coil hoses when not in use. Pallets stored flat against walls — never standing in aisles.<br><br>
<strong style="color:var(--accent)">Safe lifting (NIOSH):</strong> Anything over 50 lbs requires a hoist, pallet jack, or two-person lift. Keep load close to your body. Lift with your legs (knees bent, back straight). Do not twist while lifting — pivot your feet.<br><br>
<strong style="color:var(--accent)">Material handling:</strong> Use carts for billets and bar stock. Lay long bars flat — never stand them on end where they can fall.`,
        quiz: { q:'You need to move a 75 lb steel billet from a pallet to your machine. What is the correct approach?', opts:['Lift it carefully with your back straight','Use a hoist, pallet jack, or get a coworker for a two-person lift','Roll it across the floor','Drop it gently from the pallet to the floor and slide it'], ans:1, fb:'Anything over 50 lbs requires mechanical assistance or a two-person lift per NIOSH guidelines. Back injuries from over-lifting are the #1 cause of lost-time injuries in manufacturing.' }
      },
      { id:'sg5', title:'Reporting Near-Misses & Injuries',
        content:`<strong>A near-miss is a free lesson — report it:</strong><br><br>
<strong style="color:var(--accent)">What is a near-miss?</strong> An incident that could have caused injury or damage but did not. Examples: a part fell off a table beside you, a chip flew past your face, a tool slipped from the spindle without hitting anyone.<br><br>
<strong style="color:var(--accent)">Why report?</strong> For every serious injury, there are typically dozens of near-misses with the same root cause. Reporting near-misses lets the team fix the underlying issue before someone gets hurt.<br><br>
<strong style="color:var(--accent)">Injury reporting:</strong> EVERY injury — even a minor cut — must be reported to a supervisor and logged. Untreated minor injuries can become infections; unreported injuries break OSHA recordkeeping requirements.<br><br>
<strong style="color:var(--accent)">No retaliation:</strong> OSHA prohibits employers from retaliating against workers who report injuries or safety concerns. If you see something, say something.`,
        quiz: { q:'A coworker drops a wrench from the top of a machine and it lands inches from your foot. No one was hurt. What should you do?', opts:['Nothing — no one was hurt','Joke about it and move on','Report the near-miss so the team can address why tools are stored unsecured at height','Yell at the coworker'], ans:2, fb:'Near-misses are early warnings. Reporting lets the shop fix the underlying hazard (in this case, unsecured tools at height) before it becomes an injury.' }
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
      { id:'loto3', title:'Stored Energy & Verification',
        content:`<strong>Cutting power is not enough — you must release stored energy:</strong><br><br>
<strong style="color:var(--accent)">Hydraulic pressure:</strong> Hydraulic chucks, clamps, and tailstocks can hold thousands of PSI even with the pump off. Bleed the system per manufacturer instructions before disassembly.<br><br>
<strong style="color:var(--accent)">Pneumatic pressure:</strong> Air lines can hold 80–120 PSI. Open the bleed valve. Listen for full discharge.<br><br>
<strong style="color:var(--accent)">Gravity:</strong> Vertical mill heads, lathe tailstocks, and counterweighted axes can fall when their drive is released. Block them mechanically.<br><br>
<strong style="color:var(--accent)">Stored electrical:</strong> Servo drives and capacitors can hold lethal voltage minutes after disconnect. Wait the manufacturer-specified bleed time before opening drive cabinets.<br><br>
<strong style="color:var(--accent)">Verification step (the one most often skipped):</strong> After lockout, attempt to start the machine using the normal controls. If it does not respond, the lockout is verified. THIS IS NOT OPTIONAL.`,
        quiz: { q:'You completed lockout on a VMC and need to clean inside. The Z-axis is at the top of travel with the spindle head suspended. What additional precaution is required?', opts:['None — the disconnect is locked out','Mechanically block the Z-axis from falling — gravity is stored energy','Tape a sign to the head','Just work quickly'], ans:1, fb:'A vertical spindle head is held up by the servo and brake. With power off, the brake is the only thing holding it. Always block vertical axes mechanically before working underneath.' }
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
      { id:'haz2', title:'Reading an SDS (Safety Data Sheet)',
        content:`<strong>The 16-section SDS is your reference for any chemical:</strong><br><br>
<strong style="color:var(--accent)">Section 1 — Identification:</strong> Product name, manufacturer, emergency phone.<br>
<strong style="color:var(--accent)">Section 2 — Hazards:</strong> Classification, signal word, pictograms.<br>
<strong style="color:var(--accent)">Section 4 — First aid:</strong> What to do for skin/eye/ingestion/inhalation exposure. <strong>Read this BEFORE you need it.</strong><br>
<strong style="color:var(--accent)">Section 7 — Handling & storage:</strong> Compatibility, ventilation, container requirements.<br>
<strong style="color:var(--accent)">Section 8 — Exposure controls / PPE:</strong> Respirators, gloves, eye protection, ventilation.<br>
<strong style="color:var(--accent)">Section 13 — Disposal:</strong> Hazardous waste classification.<br><br>
<strong style="color:var(--gold)">Where are SDS sheets kept?</strong> A binder near the chemicals (legacy) or a digital portal accessible from any workstation. Every employee must know how to access them WITHOUT a supervisor's help.`,
        quiz: { q:'You get coolant splashed in your eye. Where do you find the immediate first-aid steps?', opts:['SDS Section 1 (Identification)','SDS Section 4 (First-aid measures)','SDS Section 8 (Exposure controls)','Ask your supervisor'], ans:1, fb:'Section 4 of every SDS gives the specific first-aid response for that chemical. Read it for any chemical you regularly use BEFORE an exposure happens.' }
      },
      { id:'haz3', title:'Coolant Health & Skin Protection',
        content:`<strong>Cutting fluids are the most-handled chemical in a machine shop — and one of the most under-respected:</strong><br><br>
<strong style="color:var(--accent)">Dermatitis:</strong> Long-term skin contact with coolant causes contact dermatitis (cracked, itching, inflamed skin). Wash exposed skin at every break. Use barrier cream on hands.<br><br>
<strong style="color:var(--accent)">Coolant mist:</strong> Heavy mist from high-pressure coolant or grinding can cause respiratory irritation. Use the machine's mist collector. If your shop has none, ask for one.<br><br>
<strong style="color:var(--accent)">Bacterial growth:</strong> Old or contaminated coolant can grow Mycobacterium and Pseudomonas — both linked to lung disease (Hypersensitivity Pneumonitis). Coolant should be tested weekly (refractometer + dip slides) and changed per the SDS schedule.<br><br>
<strong style="color:var(--accent)">Open cuts:</strong> Never work in coolant with an open cut — bacteria enters easily. Cover with waterproof bandage and gloves until healed.`,
        quiz: { q:'You have a small cut on your finger. The shop runs flood coolant on every machine. What is the right protocol?', opts:['Just keep it dry by wiping it occasionally','Cover with a waterproof bandage AND wear gloves over it. Notify your supervisor.','Use coolant — it cleans the cut','Skip work until it heals'], ans:1, fb:'Open wounds plus shop coolant is a serious infection risk. Cover with waterproof bandage, glove over the bandage, and report it to your supervisor for the injury log.' }
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
      { id:'mat3', title:'Material Storage & Traceability',
        content:`<strong>Bad storage destroys good material:</strong><br><br>
<strong style="color:var(--accent)">Vertical bar storage:</strong> Long bar stock must be stored in racks — never standing free. A falling 12-ft bar weighs hundreds of pounds and can kill.<br><br>
<strong style="color:var(--accent)">Separation:</strong> Carbon steel and stainless must be stored separately. Even small carbon contamination on stainless causes rust spots and cert failures.<br><br>
<strong style="color:var(--accent)">Climate control:</strong> Tool steel and precision-ground stock must be stored indoors with rust preventive applied. Outdoor or humid storage destroys precision finishes in days.<br><br>
<strong style="color:var(--accent)">First In, First Out (FIFO):</strong> Use older material first — many alloys have shelf-life concerns (heat-treated condition, surface oxidation).<br><br>
<strong style="color:var(--accent)">Heat lots:</strong> Material from a single heat batch must be tracked together. For traceable jobs, never mix bars from different heat numbers without documenting it.`,
        quiz: { q:'You finish a job and have leftover stainless drops. The carbon steel rack is closer. What do you do?', opts:['Put them in the carbon rack to save time','Tag, label with material/heat/spec, and store with other stainless','Throw them away — drops are not worth keeping','Stack them on the floor near your machine'], ans:1, fb:'Cross-storing carbon and stainless causes contamination — a single carbon chip on stainless rusts and fails inspection. Always store separately, properly tagged for future use.' }
      },
      { id:'mat4', title:'Deburring & Edge Safety',
        content:`<strong>Cut material is razor sharp — burrs cause more cuts than any other shop hazard:</strong><br><br>
<strong style="color:var(--accent)">Why deburr immediately?</strong> A freshly cut edge has burrs and razor-thin flanges. Handling unburred parts cuts through standard gloves.<br><br>
<strong style="color:var(--accent)">Deburring tools:</strong><br>
• <strong>Hand deburr (Noga or similar):</strong> Quick edge break on most parts<br>
• <strong>File:</strong> Heavier burrs and rough cut edges<br>
• <strong>Sand belt / wire brush:</strong> Larger pieces, mill scale removal<br>
• <strong>Tumbler / vibratory:</strong> Bulk parts<br><br>
<strong style="color:var(--accent)">PPE for deburring:</strong> Cut-resistant gloves (Kevlar/HPPE — NOT around rotating tools), safety glasses, dust mask if grinding.<br><br>
<strong style="color:var(--accent)">Edge break callouts:</strong> Drawings often specify "break all sharp edges 0.005–0.015 R" or "deburr all edges". Follow the print.`,
        quiz: { q:'You just cut a piece of 1/4" steel plate on the saw. Before handing it to the next station, what should you do?', opts:['Nothing — the next operator will handle it','Deburr / break all cut edges and remove loose chips','Wrap it in a rag','Spray it with coolant'], ans:1, fb:'Never pass unburred raw material between stations — it injures whoever picks it up. Always deburr immediately after cutting. This is part of "leaving the station better than you found it."' }
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
        quizPool: [
          { q:'A tape measure reads 4 full inches plus 3 marks past the 1/2" line (counting by 1/8" increments). What is the measurement?', opts:['4-3/4"','4-7/8"','4-5/8"','4-1/2"'], ans:1, fb:'1/2" + 3 × 1/8" = 4/8" + 3/8" = 7/8". Answer: 4-7/8". Always count from the last inch, not from zero.' },
          { q:'Why does the metal hook on a tape measure slide loosely by about 1/16"?', opts:['It is defective and should be replaced','It compensates for hook thickness so inside and outside readings are both accurate','To make the tape easier to retract','Because of manufacturing tolerance only — ignore it'], ans:1, fb:'The float exactly equals the hook thickness so pushing for an inside measurement subtracts the hook, and pulling for an outside measurement adds it. Never bend or force the hook.' },
          { q:'A steel rule is graduated in 1/64" increments. The reading is 1-3/8" plus 5 of the smallest marks. What is the measurement?', opts:['1-3/8" + 5/64" = 1-29/64"','1-3/8" + 5/16" = 1-11/16"','1-43/64"','1-13/32"'], ans:0, fb:'3/8" = 24/64". Add 5/64" to get 29/64". Total = 1-29/64".' },
          { q:'When should you NOT use a steel rule as a straightedge to scribe a line?', opts:['Never — it is always acceptable','When the rule has rounded edges or is not designated as a straight rule','Only when scribing aluminum','Only on parts longer than 12"'], ans:1, fb:'Many flexible rules have slightly rounded or worn edges. Use a hardened straight edge or a designated straight rule for scribing layout lines.' }
        ]
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
        quizPool: [
          { q:'You are measuring a bore with a caliper. The display reads 1.2530" but the drawing calls for 1.253±0.002". Is this part in spec?', opts:['Yes — 1.2530" is within ±0.002" of 1.253"','No — the measurement is over by 0.003"','Cannot determine from caliper reading alone','Yes — all caliper readings are within spec by default'], ans:0, fb:'1.253" ± 0.002" = 1.251" to 1.255". 1.2530" is in range. Part is in spec.' },
          { q:'Which caliper feature should you use to measure the depth of a blind hole?', opts:['Outside jaws','Inside jaws','Depth rod','Step (back of fixed jaw)'], ans:2, fb:'The thin depth rod extends from the rear of the caliper. Set the body flat across the hole and read directly.' },
          { q:'You drop a digital caliper. It still powers on and zeroes correctly. The next part requires ±0.001". What should you do?', opts:['Use it — zero is fine','Tag it OUT and submit for calibration; zero accuracy does not guarantee linearity','Use it but only on the outside jaws','Re-zero a second time and use it'], ans:1, fb:'A drop can shift accuracy across the range while zero still reads correct. Tag, document the drop, and submit for verification before tight-tolerance work.' },
          { q:'Typical resolution of a quality 6" digital caliper is closest to:', opts:['0.0001"','0.0005"','0.005"','0.001 mm'], ans:1, fb:'Most digital calipers display to 0.0005" (0.01 mm). True 0.0001" measurement requires a micrometer.' }
        ]
      },
      { id:'meas3', title:'Vernier Caliper — Reading Without Batteries',
        content:`<strong>The vernier caliper still matters — when batteries die or precision counts:</strong><br><br>
<strong style="color:var(--accent)">Main scale:</strong> Read the inch (or mm) and the largest fraction (typically 0.025") that the vernier zero has passed.<br><br>
<strong style="color:var(--accent)">Vernier scale:</strong> Find the ONE line on the vernier scale that aligns perfectly with a line on the main scale. That number = thousandths (0.001"). On metric verniers it equals 0.02 mm.<br><br>
<strong style="color:var(--accent)">Reading example:</strong> Main scale reads 1.225" + 0.000–0.025" range. Vernier line 18 aligns. Total = 1.225" + 0.018" = 1.243".<br><br>
<strong style="color:var(--accent)">Why learn it?</strong> Digital calipers fail (dead batteries, water damage, drift). A vernier never fails. In aerospace QC and many ISO certs, a backup mechanical instrument is mandatory.`,
        quizPool: [
          { q:'A vernier caliper main scale shows 0.500" + 0.025" line passed. The vernier line 7 aligns with a main scale tick. What is the reading?', opts:['0.5025"','0.5320"','0.5257"','0.5070"'], ans:1, fb:'0.500" + 0.025" + 0.007" = 0.532".' },
          { q:'On a vernier scale, you correctly read the 0.001" value by:', opts:['Reading the longest line on the vernier','Reading whichever vernier line aligns exactly with any line on the main scale','Counting from zero on the main scale','Multiplying the main scale by 10'], ans:1, fb:'The single coincident line on the vernier indicates thousandths past the last main-scale mark.' },
          { q:'Why keep a vernier (non-electronic) caliper available even when digital ones are present?', opts:['It is more accurate than digital','Mechanical reading does not fail from dead batteries, water, or electronic drift — required by many QC plans','It is faster than digital','It uses metric only'], ans:1, fb:'Mechanical backups are required in many AS9100/ISO QC plans precisely because they cannot fail electronically.' },
          { q:'Metric vernier scales typically resolve to:', opts:['0.001 mm','0.01 mm','0.02 mm','0.1 mm'], ans:2, fb:'Standard metric verniers read to 0.02 mm. Higher resolution requires a micrometer or a digital instrument.' }
        ]
      },
      { id:'meas4', title:'Measurement Best Practices',
        content:`<strong>The same instrument can read differently depending on technique:</strong><br><br>
<strong style="color:var(--accent)">Temperature:</strong> Standard inspection temperature is 68°F (20°C). Steel grows ~6 millionths per inch per °F. A part hot off the machine reads larger than it really is — let it cool to room temp before final QC.<br><br>
<strong style="color:var(--accent)">Cleanliness:</strong> Wipe both the part and the instrument anvils. A single chip changes a 0.0001" mic reading by 0.005"+.<br><br>
<strong style="color:var(--accent)">Gaging force:</strong> A caliper can deflect a thin part if you squeeze. A mic with a ratchet stop gives consistent gaging force. For OD mics, the ratchet should click 2–3 times.<br><br>
<strong style="color:var(--accent)">Three-point rule:</strong> Take 3 readings at different points (or rotate the part) and use the average — single readings can hide taper, ovality, or burrs.<br><br>
<strong style="color:var(--accent)">Documenting:</strong> Record the reading exactly as displayed. Do NOT round mid-process. Do NOT erase a measurement on a traveler — line through, write the new value, initial.`,
        quizPool: [
          { q:'You measure a hot part right after machining: 1.0023". The print is 1.000" ± 0.001". The part has just cooled and now reads 1.0010". What was happening?', opts:['The first reading was wrong','Thermal expansion — the hot part was larger. Always measure at room temp for final QC.','The mic is broken','The part contracted abnormally'], ans:1, fb:'Steel expands ~6 millionths per inch per °F. Cool to 68°F before final inspection.' },
          { q:'A single chip stuck on a micrometer anvil can change a 0.0001"-resolution reading by approximately:', opts:['0.000005"','0.0001"','0.005" or more','It will not affect the reading'], ans:2, fb:'Even a tiny chip can shift readings several thou. Always wipe both faces and the part before measuring.' },
          { q:'Three-point rule means:', opts:['Measure once and trust the value','Take three readings (or rotate the part) and average — single readings hide taper, ovality, and burrs','Always measure on a granite plate','Always measure with three different instruments'], ans:1, fb:'Multiple readings reveal form errors that a single measurement cannot.' },
          { q:'If you record a value on a paper traveler and discover the next minute it is wrong, you should:', opts:['Erase the value and write the new one','Use white-out and rewrite','Line through the original, write the corrected value next to it, and initial it','Tear off and start a new traveler'], ans:2, fb:'Travelers are quality records. Single line-through, new value, initial — never erase or obliterate.' }
        ]
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
      { id:'mic3', title:'Depth Mics, Height Gauges & Indicators',
        content:`<strong>Beyond OD and ID — depth and surface measurement:</strong><br><br>
<strong style="color:var(--accent)">Depth micrometer:</strong> Measures the depth of holes, slots, and shoulders. The base sits flat on the reference surface; the rod extends down. Reading reverses direction vs an OD mic — the thimble counts UP as the rod extends. Use multiple anvil rods for different depths (0–3", 3–6", etc.).<br><br>
<strong style="color:var(--accent)">Height gauge:</strong> Sits on a granite surface plate. Reads vertical height with vernier or digital scale to 0.001". Use with a test indicator for finding part height or marking layout lines.<br><br>
<strong style="color:var(--accent)">Dial / test indicators:</strong> Reads RELATIVE motion, not absolute. Used for indicating part true (lathe chuck, vise jaw), checking runout, comparing to a master. Always pre-load the indicator (1–2 turns) so it can read both directions.<br><br>
<strong style="color:var(--accent)">Surface plate:</strong> The reference for all flat-based measurement. Granite, certified flat to a few millionths. Keep clean. Never set hot parts or rough castings directly on it.`,
        quiz: { q:'You need to verify a 0.5000" deep counterbore. Which instrument is most appropriate?', opts:['6" digital caliper depth rod','Outside micrometer','Depth micrometer','Tape measure'], ans:2, fb:'A depth micrometer reads to 0.0001" with a stable flat base — far more accurate than the floppy depth rod on a caliper. For any precision depth ±0.005" or tighter, use a depth mic.' }
      },
      { id:'mic4', title:'Calibration & Tool Care',
        content:`<strong>An out-of-cal instrument lies — and you lie too if you use it:</strong><br><br>
<strong style="color:var(--accent)">Calibration cycles:</strong> Most shops calibrate hand instruments annually. Critical instruments (CMM, height gauges, masters) more often. Each tool has a calibration sticker — check it BEFORE use.<br><br>
<strong style="color:var(--accent)">Daily zero check:</strong> Close the mic on a clean anvil, verify it reads 0.0000". Close the caliper, verify zero. If off, do NOT use — tag it and submit for cal.<br><br>
<strong style="color:var(--accent)">Drop = recalibrate:</strong> Any drop or impact requires the instrument to be re-checked or sent for cal. A dropped mic can read fine for 0.500" and be off 0.001" at 1.000". Report ALL drops.<br><br>
<strong style="color:var(--accent)">Storage:</strong> Always return to case. Keep micrometer faces lightly oiled. Never store mics fully closed (damage from thermal expansion). Calipers stored partially open (~1").<br><br>
<strong style="color:var(--accent)">Cert traceability:</strong> Every cal cert traces back to NIST standards. Lost certs = the tool is non-traceable until recertified.`,
        quiz: { q:'You drop your micrometer on the concrete floor. It still zeros at 0.0000". The current job needs ±0.0005". Can you continue using it?', opts:['Yes — it zeros fine','No — submit for full calibration check first; a drop can affect linearity at higher readings even when zero looks correct','Only if you check it on a 1-2-3 block','Yes if the spindle still moves smoothly'], ans:1, fb:'A dropped instrument may read perfectly at zero but be off elsewhere in its range. Tight tolerances (±0.0005" or less) require re-cal after any drop. The drop log + re-cal protects the parts AND your reputation.' }
      },
    ],
  },

  // ── GD&T / DRAWING READING ────────────────────────────────────
  measuring_gdt: {
    id: 'measuring_gdt', label: 'Reading Drawings — Tolerances & GD&T Basics', icon: '📐',
    section: 'measuring', duration: '40 min',
    passMark: 80, required: false,
    desc: 'Title block, dimensions, tolerances, and the most common GD&T symbols.',
    topics: [
      { id:'gdt1', title:'Title Block, Views & Tolerance Block',
        content:`<strong>Every drawing tells you HOW it should be inspected — read it correctly:</strong><br><br>
<strong style="color:var(--accent)">Title block:</strong> Part number, revision, material, finish, scale, drawn-by, approved-by, date. ALWAYS verify revision matches the work order — a Rev B drawing on a Rev C job = scrap.<br><br>
<strong style="color:var(--accent)">Views:</strong> Standard 3rd-angle projection (US): top view sits above front, right view sits right of front. 1st-angle (Europe/Asia) is reversed. Check the projection symbol in the title block.<br><br>
<strong style="color:var(--accent)">Default tolerance block:</strong> Typically reads:<br>
• Decimal X.X = ± 0.030<br>
• Decimal X.XX = ± 0.010<br>
• Decimal X.XXX = ± 0.005<br>
• Angles = ± 0.5°<br>
Specific callouts override the default block.<br><br>
<strong style="color:var(--accent)">Notes:</strong> Read every general note — they often dictate finish, deburr, marking, and inspection requirements that drawings forget to repeat dimensionally.`,
        quiz: { q:'A drawing has the dimension "1.250" with no specific tolerance. The title block tolerance shows X.XXX = ± 0.005". What is the acceptable range?', opts:['1.245" – 1.255"','1.240" – 1.260"','1.249" – 1.251"','Cannot determine without GD&T callout'], ans:0, fb:'Three decimal places falls under the X.XXX = ±0.005 default. Range: 1.245" to 1.255". Always count decimal places to apply the correct default tolerance.' }
      },
      { id:'gdt2', title:'Common GD&T Symbols',
        content:`<strong>The 14 GD&T symbols control form, orientation, location, runout. Master these 6 first:</strong><br><br>
<strong style="color:var(--accent)">⬜ Flatness:</strong> All points of a surface lie within two parallel planes a specified distance apart.<br>
<strong style="color:var(--accent)">⊕ True Position:</strong> A feature's center must lie within a tolerance zone (cylinder for holes) about its theoretical perfect location relative to datums.<br>
<strong style="color:var(--accent)">⌭ Concentricity:</strong> Center axis of one feature must lie within a cylinder around the axis of a datum.<br>
<strong style="color:var(--accent)">∥ Parallelism:</strong> Surface must be parallel to a datum within a specified tolerance.<br>
<strong style="color:var(--accent)">⊥ Perpendicularity:</strong> Surface must be 90° to a datum within a specified tolerance.<br>
<strong style="color:var(--accent)">↗ Total Runout:</strong> Surface must stay within a tolerance band when rotated about a datum axis.<br><br>
<strong style="color:var(--accent)">Datums:</strong> Letters in boxes (A, B, C) define the inspection reference. Always set the part on the datum reference frame BEFORE measuring GD&T tolerances.`,
        quiz: { q:'A drawing shows "⊕ ⌀0.010 (M) | A | B | C" on a hole. What does this control?', opts:['The diameter of the hole','The position of the hole within a 0.010" cylindrical zone, relative to datums A, B, and C, with material condition modifier','The flatness of the surface around the hole','The depth of the hole'], ans:1, fb:'⊕ is True Position. The hole\'s axis must lie within a 0.010" diameter cylinder centered on its theoretical location, measured from datums A, B, C. The (M) means at Maximum Material Condition — bonus tolerance available as the hole gets larger.' }
      },
      { id:'gdt3', title:'Surface Finish & Common Notes',
        content:`<strong>Surface finish callouts:</strong><br><br>
<strong style="color:var(--accent)">Ra value:</strong> Roughness average in microinches (μin) or micrometers (μm). Common shop values:<br>
• 250 μin — rough sawn, basic milling<br>
• 125 μin — standard machined<br>
• 63 μin — finish machined<br>
• 32 μin — fine finish, ground<br>
• 16 μin and finer — lapped, polished, optical<br><br>
<strong style="color:var(--accent)">The √ symbol:</strong> Triangle indicates surface finish requirement. The number above is Ra (max). Direction lines below specify lay (machining direction).<br><br>
<strong style="color:var(--accent)">Common notes:</strong><br>
• "BREAK ALL SHARP EDGES 0.005–0.015 R" — deburr requirement<br>
• "REMOVE ALL BURRS" — full deburr, no chamfer specified<br>
• "MUST BE FREE OF NICKS, SCRATCHES, DENTS" — visual quality requirement<br>
• "MARK PER MIL-STD-130" — military marking specification`,
        quiz: { q:'A surface finish callout shows √ with "32" above it. What does this require?', opts:['32 mm of material removal','32 μin Ra maximum surface roughness','Surface must be 32" wide','32 holes in the surface'], ans:1, fb:'A √ symbol with a number above is the Ra (roughness average) maximum, in microinches by default in the US. 32 μin is a fine machined finish — typically requires a sharp finish tool, light depth of cut, and proper feeds.' }
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
      { id:'tool3', title:'Tool Holders, Collets & Pull Studs',
        content:`<strong>The tool is only as good as the holder:</strong><br><br>
<strong style="color:var(--accent)">ER collet chuck:</strong> The most common general-purpose holder. ER16, ER20, ER25, ER32, ER40 sizes — number = mm bore. Each collet covers ~1 mm range. Always: clean collet, clean bore, correct collet for tool diameter, snug nut by hand then torque to spec.<br><br>
<strong style="color:var(--accent)">Side-lock / Weldon holders:</strong> Set screw locks against a flat on the tool shank. Higher rigidity than ER for heavy roughing. Tool MUST have a Weldon flat — straight shank tools without a flat will spin and ruin the holder.<br><br>
<strong style="color:var(--accent)">Shrink-fit:</strong> Heated to expand the bore, tool inserted, allowed to cool — clamps with high concentric force. Best runout (<0.0001"). Requires a shrink-fit machine.<br><br>
<strong style="color:var(--accent)">Pull stud / retention knob:</strong> The stud at the back of the toolholder that the spindle drawbar grips. CAT40 pull stud ≠ BT40 ≠ HSK. WRONG stud = tool drops or won't load. Verify stud type matches your spindle every tool change.<br><br>
<strong style="color:var(--accent)">Runout check:</strong> Indicate the tool body to verify <0.0005" TIR before running production. High runout = short tool life and bad finish.`,
        quiz: { q:'You assemble an ER25 collet chuck with a 1/2" end mill. After spindle-up, the tool shows 0.005" TIR. What is the most likely cause?', opts:['The end mill is bad','Dirty or chipped collet, dirty bore, or wrong-size collet','Spindle bearings are bad','The pull stud is loose'], ans:1, fb:'0.005" TIR on an ER chuck almost always points to dirt, a chipped collet, or wrong-size collet (each ER collet covers ~1 mm only). Disassemble, clean everything, re-check the collet size, and reinstall. Spindle issues are rare and require deeper diagnostics.' }
      },
      { id:'tool4', title:'Turning Inserts & Insert Wear',
        content:`<strong>Inserts are coded by ISO standard — read the marking:</strong><br><br>
<strong style="color:var(--accent)">Insert code (e.g., CNMG 432):</strong><br>
• <strong>C</strong> — Shape (C = 80° diamond, W = trigon, T = triangle)<br>
• <strong>N</strong> — Clearance angle (N = 0°, negative)<br>
• <strong>M</strong> — Tolerance class<br>
• <strong>G</strong> — Insert type / chipbreaker<br>
• <strong>4</strong> — Inscribed circle size (4/16" = 1/4")<br>
• <strong>3</strong> — Thickness in 1/16"<br>
• <strong>2</strong> — Corner radius in 1/64"<br><br>
<strong style="color:var(--accent)">Grade selection:</strong> Carbide grade matches the material. Steel grades (P), stainless (M), cast iron (K), aluminum (N), exotic alloys (S/H). Wrong grade = fast wear or chipping.<br><br>
<strong style="color:var(--accent)">Wear modes:</strong><br>
• <strong>Flank wear:</strong> Normal — replace at ~0.015" wear band<br>
• <strong>Crater wear:</strong> Top of insert wears — usually too high SFM<br>
• <strong>Built-up edge (BUE):</strong> Material welded to edge — increase SFM or use coolant/lube<br>
• <strong>Chipping:</strong> Edge fragments — too aggressive feed, interrupted cut, wrong geometry`,
        quiz: { q:'A CNMG 432 insert is wearing rapidly with a deep "crater" on the top face after only a few minutes in 4140 steel. What is the most likely cause?', opts:['Feed rate too low','Cutting speed (SFM) too high — generates excessive heat and crater wear','Coolant is too cold','The insert is the wrong shape'], ans:1, fb:'Crater wear on the rake face is a heat-driven failure. Reducing SFM (cutting speed) is the primary fix. Coolant helps but cannot rescue a process running 30%+ over the recommended SFM for the grade.' }
      },
    ],
  },

  // ── MACHINE OPERATION COURSES ─────────────────────────────────
  machine_basics: {
    id: 'machine_basics', label: 'Machine Basics — Power-On to First Cut', icon: '⚙️',
    section: 'machine', duration: '50 min',
    passMark: 85, required: true,
    desc: 'CNC anatomy, power-on sequence, work offsets, tool offsets, dry run, single-block.',
    topics: [
      { id:'mb1', title:'CNC Anatomy & Power-On Sequence',
        content:`<strong>Every CNC has the same core systems — names vary, function does not:</strong><br><br>
<strong style="color:var(--accent)">Control:</strong> Fanuc, Haas, Siemens, Mitsubishi, Mazak — all interpret G-code and command axes. The Mode switch (MDI / Edit / Memory / Jog / Handle) is your most-used selector.<br><br>
<strong style="color:var(--accent)">Axes:</strong> X, Y, Z (linear) plus B, C (rotary) on multi-axis. Lathes typically have X (radial) and Z (along the spindle).<br><br>
<strong style="color:var(--accent)">Spindle, ATC (Automatic Tool Changer), turret, tailstock, coolant, chip conveyor</strong> — all controlled by M-codes.<br><br>
<strong style="color:var(--accent)">Standard power-on (VMC):</strong><br>
1. Verify air pressure & main breaker on<br>
2. Power on the control<br>
3. Release the E-Stop<br>
4. Reset alarms<br>
5. Home the axes — Z FIRST (clears the table) then X / Y<br>
6. Warm up the spindle (manufacturer-specified cycle, typically 5–15 min)<br><br>
<strong style="color:var(--red)">Never skip homing:</strong> Without homing, all coordinates are unknown. The machine will crash on the first move.`,
        quiz: { q:'On a vertical machining center, in what order should the axes be homed after power-on?', opts:['X first, then Y, then Z','Y first, then X, then Z','Z FIRST (so the spindle clears the table), then X and Y','It does not matter'], ans:2, fb:'Z is always homed first on a VMC. Homing Z while a tool is in the spindle near the table can crash. Z home retracts the head fully UP, ensuring the tool clears any fixture before X/Y move.' }
      },
      { id:'mb2', title:'Work Offsets (G54) & Tool Length Offsets (G43)',
        content:`<strong>The two coordinate systems every operator must understand:</strong><br><br>
<strong style="color:var(--accent)">Work Offset (G54–G59):</strong> Tells the control where the PART zero is. You set it by edge-finding (X, Y) and touching off the top of the part (Z). Stored in the offset table — most jobs use G54.<br><br>
<strong style="color:var(--accent)">Tool Length Offset (G43 H##):</strong> Tells the control how long each TOOL is, measured from the spindle gauge line to the tip. Stored per-tool in the offset table. The H number matches the tool number (T1 → H01).<br><br>
<strong style="color:var(--accent)">Setting work Z (top of part):</strong> Touch the tool tip to the top surface using paper, edge finder, or probe. Then in the WORK OFFSET table, set Z to current machine position (G10 or "set" function).<br><br>
<strong style="color:var(--accent)">Setting tool length:</strong> Use a tool presetter (off-machine) or touch each tool to a fixed reference (gage block on table) and record the difference.<br><br>
<strong style="color:var(--accent)">Verify in air:</strong> After setting offsets, jog Z above the part and run the program in single-block at 0% rapid. Confirm Z lands where you expect BEFORE letting it cut.`,
        quiz: { q:'You set G54 Z to the top of your part using a 1.000" gage block (so machine Z = part Z + 1.000"). You forget to subtract the gage block. What happens on the first move to Z0?', opts:['The tool stops 1.000" above the part','The tool crashes 1.000" INTO the part','Nothing — the offset is automatic','The tool retracts to home'], ans:1, fb:'If you set Z without subtracting the gage block, the machine thinks "part top" is 1.000" lower than it actually is. The tool will plunge 1.000" into the workpiece. ALWAYS subtract the gage block height (or use the offset entry function that does it automatically).' }
      },
      { id:'mb3', title:'Dry Run, Single-Block & Safe First Part',
        content:`<strong>Verifying a program before letting it cut metal:</strong><br><br>
<strong style="color:var(--accent)">Dry Run mode:</strong> Overrides program feed rates and runs all moves at jog speed. Spindle off, no coolant. Lets you watch motion at a safe speed without cutting.<br><br>
<strong style="color:var(--accent)">Single-Block mode:</strong> Stops at every line of code. You press Cycle Start to advance one line at a time. Used to verify each move makes sense.<br><br>
<strong style="color:var(--accent)">Rapid override:</strong> Set rapid traverse to 25% (or even 0%) for the first run. Slows G00 moves so a wrong offset doesn't crash at full speed.<br><br>
<strong style="color:var(--accent)">Feedhold:</strong> The "stop motion now but keep spindle running" button. Your finger should hover over it during the first part.<br><br>
<strong style="color:var(--accent)">Safe first-part procedure:</strong><br>
1. Raise Z 0.500"–1.000" above the part (Z offset shift)<br>
2. Single-block + rapid 25%<br>
3. Verify each rapid lands where you expect (in the air)<br>
4. Restore Z, run single-block on the actual part<br>
5. Stop after first feature, measure<br>
6. Make any wear offset adjustments, then run continuous`,
        quiz: { q:'You are about to run a new program for the first time on a $200 piece of titanium. What sequence minimizes the risk of crash?', opts:['Run continuously at 100% — trust the simulator','Single-block + rapid override 25% + Z raised 0.5" above part for the first pass; then re-run on the actual part','Run at 50% feed rate','Skip the verification — programmers do not make mistakes'], ans:1, fb:'A first-part dry run with raised Z and reduced rapid lets the machine prove every move in the air before cutting metal. This is the standard "safe first part" procedure in every well-run shop. The few extra minutes saves the part — and sometimes the spindle.' }
      },
      { id:'mb4', title:'Alarms, Recovery & End-of-Shift',
        content:`<strong>Reading and recovering from alarms:</strong><br><br>
<strong style="color:var(--accent)">Alarm vs warning:</strong> Alarms STOP motion. Warnings allow continued operation but flag a condition. Always read the alarm number AND text — never just press Reset and try again without understanding why.<br><br>
<strong style="color:var(--accent)">Common alarm categories:</strong><br>
• Servo / overcurrent — possible crash, motor overload<br>
• Overtravel — axis hit a soft or hard limit; back off in jog<br>
• Spindle alarm — drive fault, overspeed, overload<br>
• Communication — control not talking to drive or PLC<br>
• Coolant low / chip conveyor jam — non-critical but stops cycle<br><br>
<strong style="color:var(--accent)">Recovery:</strong> Note the alarm number → check the manual or quick-reference card → fix the underlying cause → reset alarm → cautiously restart (often single-block). Repeated alarms = call a supervisor.<br><br>
<strong style="color:var(--accent)">End-of-shift checklist:</strong><br>
• Park axes at safe position (Z home, X/Y centered or at fixture)<br>
• Spindle off, coolant off<br>
• Clear chips from way covers, table, and chip conveyor<br>
• Wipe down any way oil pooling<br>
• Hand off via the digital handoff log: condition, parts complete, in-progress notes`,
        quiz: { q:'During a cycle, the machine alarms with "OVERTRAVEL Y AXIS". What is the correct first response?', opts:['Press Reset and run again','Note the alarm, jog Y in the OPPOSITE direction (away from the limit), then reset and continue','Power-cycle the machine','Manually push the Y axis back'], ans:1, fb:'Overtravel means an axis hit its soft/hard limit. Reset alone won\'t clear it — you must JOG the axis away from the limit first, then reset. Pressing Reset without backing off can cause repeated alarms or damage.' }
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
    { id:'meas07', label:'Read and interpret a 2D engineering drawing (tolerances, GD&T basics)', type:'written', mentorSignOff:true, employerBuyOff:false, linkedCourse:'measuring_gdt' },
  ],
  tooling: [
    { id:'tl01', label:'Identify 10 common end mills by geometry and flute count', type:'both',     mentorSignOff:true,  employerBuyOff:false, linkedCourse:'tooling_id' },
    { id:'tl02', label:'Identify common drill types — HSS, carbide, spot drill',   type:'both',     mentorSignOff:true,  employerBuyOff:false, linkedCourse:'tooling_id' },
    { id:'tl03', label:'Select correct tap type for a given hole condition',        type:'written',  mentorSignOff:true,  employerBuyOff:false, linkedCourse:'tooling_id' },
    { id:'tl04', label:'Assemble ER collet chuck to correct torque spec',           type:'demo',     mentorSignOff:true,  employerBuyOff:false, linkedCourse:'tooling_id' },
    { id:'tl05', label:'Identify turning insert grades and geometry (CNMG/WNMG)',  type:'both',     mentorSignOff:true,  employerBuyOff:false, linkedCourse:'tooling_id' },
    { id:'tl06', label:'Operate preset station — set tool length and diameter',    type:'demo',     mentorSignOff:true,  employerBuyOff:true  },
    { id:'tl07', label:'Identify worn/damaged tooling — make replace/use decision', type:'observed', mentorSignOff:true,  employerBuyOff:false },
  ],
  machine: [
    { id:'mc01', label:'Pass Machine Basics course — power-on, offsets, dry run', type:'written', mentorSignOff:true, employerBuyOff:false, linkedCourse:'machine_basics' },
    { id:'mc02', label:'Demonstrate correct power-on and homing sequence',         type:'demo',    mentorSignOff:true, employerBuyOff:false, linkedCourse:'machine_basics' },
    { id:'mc03', label:'Set a G54 work offset (X, Y, Z) and verify in air',        type:'demo',    mentorSignOff:true, employerBuyOff:true,  linkedCourse:'machine_basics' },
    { id:'mc04', label:'Set tool length offset (G43) for at least 3 tools',         type:'demo',    mentorSignOff:true, employerBuyOff:false, linkedCourse:'machine_basics' },
    { id:'mc05', label:'Run first part in single-block at reduced rapid override',  type:'observed', mentorSignOff:true, employerBuyOff:true,  linkedCourse:'machine_basics' },
    { id:'mc06', label:'Acknowledge and recover from at least 2 alarms',           type:'demo',    mentorSignOff:true, employerBuyOff:false, linkedCourse:'machine_basics' },
    { id:'mc07', label:'Complete end-of-shift parking and handoff log entry',      type:'observed', mentorSignOff:true, employerBuyOff:false },
  ],
};
