// ═══════════════════════════════════════════════════════════════════
// OAP-TYPES.JS — JobLine Operator Acceptance Program
// Typed constants, enums, and schema definitions
// All equipment, tools, roles, and checkpoints live here —
// referenced by employer config, course data, and cert engine.
// WeCr8 Solutions LLC | JobLine.ai | v1.0.0
// ═══════════════════════════════════════════════════════════════════

'use strict';

// ── ROLE DEFINITIONS ─────────────────────────────────────────────
const OAP_ROLES = {
  lathe_op:    { id:'lathe_op',    label:'CNC Lathe Operator',           icon:'⚙',  track:'lathe', level:'operator'  },
  mill_op:     { id:'mill_op',     label:'CNC Mill Operator',            icon:'🔩', track:'mill',  level:'operator'  },
  lathe_setup: { id:'lathe_setup', label:'Lathe Setup Technician',       icon:'⚙',  track:'lathe', level:'setup'     },
  mill_setup:  { id:'mill_setup',  label:'Mill Setup Technician',        icon:'🔩', track:'mill',  level:'setup'     },
  grinder:     { id:'grinder',     label:'Surface / CNC Grinder Op.',    icon:'💠', track:'grind', level:'operator'  },
  saw_op:      { id:'saw_op',      label:'Saw / Material Handler',       icon:'🪚', track:'mat',   level:'operator'  },
  inspector:   { id:'inspector',   label:'Quality / CMM Inspector',      icon:'📐', track:'qc',    level:'tech'      },
  multi_op:    { id:'multi_op',    label:'Multi-Machine Operator',       icon:'🏭', track:'multi', level:'operator'  },
  swiss_op:    { id:'swiss_op',    label:'Swiss-Type CNC Operator',      icon:'🔬', track:'swiss', level:'operator'  },
  edm_op:      { id:'edm_op',      label:'EDM Operator',                 icon:'⚡', track:'edm',   level:'operator'  },
  custom:      { id:'custom',      label:'Custom Role',                  icon:'✏️', track:'any',   level:'custom'    },
};

// ── MEASURING EQUIPMENT ──────────────────────────────────────────
const OAP_MEASURING = {
  // Hand measuring
  tape_25:      { id:'tape_25',      label:'25ft Tape Measure',          category:'linear', icon:'📏', unit:'in/ft',  precision:'1/16"' },
  tape_16:      { id:'tape_16',      label:'16ft Tape Measure',          category:'linear', icon:'📏', unit:'in/ft',  precision:'1/16"' },
  steel_rule:   { id:'steel_rule',   label:'6" Steel Rule',              category:'linear', icon:'📏', unit:'in/mm',  precision:'1/64"' },
  caliper_6:    { id:'caliper_6',    label:'6" Digital Caliper',         category:'linear', icon:'🔧', unit:'in/mm',  precision:'0.0005"' },
  caliper_12:   { id:'caliper_12',   label:'12" Digital Caliper',        category:'linear', icon:'🔧', unit:'in/mm',  precision:'0.0005"' },
  caliper_vernier: { id:'caliper_vernier', label:'Vernier Caliper',      category:'linear', icon:'🔧', unit:'in/mm',  precision:'0.001"' },
  mic_outside:  { id:'mic_outside',  label:'Outside Micrometer (0-1")',  category:'linear', icon:'🎯', unit:'in/mm',  precision:'0.0001"' },
  mic_outside_set: { id:'mic_outside_set', label:'Outside Mic Set (0-6")', category:'linear', icon:'🎯', unit:'in/mm', precision:'0.0001"' },
  mic_inside:   { id:'mic_inside',   label:'Inside Micrometer',          category:'linear', icon:'🎯', unit:'in/mm',  precision:'0.0001"' },
  mic_depth:    { id:'mic_depth',    label:'Depth Micrometer',           category:'linear', icon:'🎯', unit:'in/mm',  precision:'0.0001"' },
  mic_thread:   { id:'mic_thread',   label:'Thread Micrometer',          category:'linear', icon:'🎯', unit:'in/mm',  precision:'0.0001"' },
  // Gauges
  bore_gauge:   { id:'bore_gauge',   label:'Bore Gauge / Telescoping',   category:'gauge',  icon:'⭕', unit:'in/mm',  precision:'0.0001"' },
  pin_gauges:   { id:'pin_gauges',   label:'Pin Gauge Set',              category:'gauge',  icon:'📌', unit:'in/mm',  precision:'0.0001"' },
  thread_ring:  { id:'thread_ring',  label:'Thread Ring Gauges (GO/NOGO)', category:'gauge', icon:'🔘', unit:'class', precision:'thread class' },
  thread_plug:  { id:'thread_plug',  label:'Thread Plug Gauges (GO/NOGO)', category:'gauge', icon:'🔘', unit:'class', precision:'thread class' },
  radius_gauge: { id:'radius_gauge', label:'Radius / Fillet Gauge',      category:'gauge',  icon:'🌊', unit:'in/mm',  precision:'0.005"' },
  feeler_gauge: { id:'feeler_gauge', label:'Feeler / Thickness Gauge',   category:'gauge',  icon:'📄', unit:'in/mm',  precision:'0.001"' },
  height_gauge: { id:'height_gauge', label:'Digital Height Gauge',       category:'linear', icon:'📐', unit:'in/mm',  precision:'0.0001"' },
  surface_plate: { id:'surface_plate', label:'Surface Plate / Granite', category:'reference', icon:'⬜', unit:'class', precision:'Grade A/B' },
  // Angle
  protractor:   { id:'protractor',   label:'Bevel Protractor',           category:'angle',  icon:'📐', unit:'deg',    precision:'5 min' },
  angle_blocks: { id:'angle_blocks', label:'Angle Block Set',            category:'angle',  icon:'📐', unit:'deg',    precision:'1 min' },
  // Pipe / specialty
  pipe_tape:    { id:'pipe_tape',    label:'Pi Tape (Circumference)',     category:'linear', icon:'⭕', unit:'in/mm',  precision:'0.001"' },
  od_tape:      { id:'od_tape',      label:'OD Tape Measure',            category:'linear', icon:'📏', unit:'in/mm',  precision:'0.001"' },
  // CMM / Inspection
  cmm:          { id:'cmm',          label:'CMM (Coordinate Measuring)', category:'cmm',    icon:'🤖', unit:'in/mm',  precision:'0.00005"' },
  surface_rough: { id:'surface_rough', label:'Surface Roughness Tester', category:'surface', icon:'〰️', unit:'Ra/Rz', precision:'0.01μin' },
};

// ── CUTTING TOOLS & TOOLING ──────────────────────────────────────
const OAP_TOOLING = {
  // Holders
  tool_holder_ext: { id:'tool_holder_ext', label:'External Tool Holder (CNMG/WNMG)', category:'holder', icon:'🔩' },
  tool_holder_bor: { id:'tool_holder_bor', label:'Boring Bar / Internal Holder',     category:'holder', icon:'🔩' },
  vdi_holder:      { id:'vdi_holder',      label:'VDI Tool Holder',                  category:'holder', icon:'🔩' },
  capto_holder:    { id:'capto_holder',    label:'Capto / HSK Holder',               category:'holder', icon:'🔩' },
  collet_er:       { id:'collet_er',       label:'ER Collet Chuck & Collets',         category:'holder', icon:'⭕' },
  endmill_holder:  { id:'endmill_holder',  label:'End Mill Holder',                  category:'holder', icon:'🔩' },
  drill_chuck:     { id:'drill_chuck',     label:'Drill Chuck (Jacobs / Keyless)',    category:'holder', icon:'⭕' },
  shrink_fit:      { id:'shrink_fit',      label:'Shrink Fit Holder',                category:'holder', icon:'🔥' },
  // Inserts / cutting
  insert_turning:  { id:'insert_turning',  label:'Turning Inserts (CNMG/WNMG/DNMG)', category:'insert', icon:'💎' },
  insert_milling:  { id:'insert_milling',  label:'Milling Inserts / Face Mill',      category:'insert', icon:'💎' },
  insert_grooving: { id:'insert_grooving', label:'Grooving / Parting Insert',        category:'insert', icon:'💎' },
  insert_threading: { id:'insert_threading', label:'Threading Insert',               category:'insert', icon:'💎' },
  // Endmills
  endmill_flat:    { id:'endmill_flat',    label:'Flat End Mill (2/4 flute)',         category:'endmill', icon:'🔄' },
  endmill_ball:    { id:'endmill_ball',    label:'Ball Nose End Mill',               category:'endmill', icon:'⚽' },
  endmill_bull:    { id:'endmill_bull',    label:'Bull Nose / Corner Radius',        category:'endmill', icon:'🔄' },
  endmill_rough:   { id:'endmill_rough',   label:'Roughing / Corn Cob End Mill',     category:'endmill', icon:'🌽' },
  endmill_carbide: { id:'endmill_carbide', label:'Solid Carbide End Mill',           category:'endmill', icon:'🔄' },
  // Drills
  drill_hss:       { id:'drill_hss',       label:'HSS Drill Bit',                   category:'drill', icon:'🔩' },
  drill_carbide:   { id:'drill_carbide',   label:'Carbide Drill / Indexable Drill',  category:'drill', icon:'🔩' },
  drill_spot:      { id:'drill_spot',      label:'Spot Drill / Center Drill',        category:'drill', icon:'🔩' },
  drill_spade:     { id:'drill_spade',     label:'Spade / Insert Drill',             category:'drill', icon:'🔩' },
  // Taps & threading
  tap_hss:         { id:'tap_hss',         label:'HSS Tap (Hand / Machine)',         category:'tap', icon:'🔀' },
  tap_spiral:      { id:'tap_spiral',      label:'Spiral Flute Tap',                category:'tap', icon:'🔀' },
  tap_forming:     { id:'tap_forming',     label:'Roll Form / Thread Forming Tap',  category:'tap', icon:'🔀' },
  tap_carbide:     { id:'tap_carbide',     label:'Carbide Tap',                     category:'tap', icon:'🔀' },
  thread_mill:     { id:'thread_mill',     label:'Thread Mill',                     category:'tap', icon:'🔀' },
  die_ext:         { id:'die_ext',         label:'Die (External Threading)',         category:'tap', icon:'⭕' },
  // Reamers & boring
  reamer_hss:      { id:'reamer_hss',      label:'HSS Reamer',                      category:'reamer', icon:'🎯' },
  reamer_carbide:  { id:'reamer_carbide',  label:'Carbide Reamer',                  category:'reamer', icon:'🎯' },
  boring_head:     { id:'boring_head',     label:'Boring Head / Fine Bore',          category:'reamer', icon:'🎯' },
  // Workholding
  chuck_3jaw:      { id:'chuck_3jaw',      label:'3-Jaw Chuck',                     category:'workhold', icon:'🔒' },
  chuck_4jaw:      { id:'chuck_4jaw',      label:'4-Jaw Independent Chuck',         category:'workhold', icon:'🔒' },
  collet_closer:   { id:'collet_closer',   label:'Collet Chuck / Bar Closer',       category:'workhold', icon:'🔒' },
  vise_kurt:       { id:'vise_kurt',       label:'Kurt Vise / Mill Vise',           category:'workhold', icon:'🔒' },
  vise_5axis:      { id:'vise_5axis',      label:'5-Axis / Modular Vise',           category:'workhold', icon:'🔒' },
  fixture_plate:   { id:'fixture_plate',   label:'Fixture Plate / T-Slot Table',    category:'workhold', icon:'⬜' },
  soft_jaws:       { id:'soft_jaws',       label:'Soft Jaw (custom machined)',       category:'workhold', icon:'🔒' },
  live_center:     { id:'live_center',     label:'Live / Dead Center (tailstock)',   category:'workhold', icon:'🎯' },
};

// ── MACHINES / EQUIPMENT ─────────────────────────────────────────
const OAP_MACHINES = {
  // Lathes
  cnc_lathe:       { id:'cnc_lathe',       label:'CNC Turning Center (2-axis)',     category:'lathe',  icon:'⚙' },
  cnc_lathe_live:  { id:'cnc_lathe_live',  label:'CNC Lathe w/ Live Tooling',      category:'lathe',  icon:'⚙' },
  cnc_lathe_sub:   { id:'cnc_lathe_sub',   label:'CNC Lathe w/ Sub-Spindle',       category:'lathe',  icon:'⚙' },
  swiss_cnc:       { id:'swiss_cnc',       label:'Swiss-Type CNC (Sliding Head)',   category:'lathe',  icon:'🔬' },
  manual_lathe:    { id:'manual_lathe',    label:'Manual Engine Lathe',             category:'lathe',  icon:'⚙' },
  // Mills
  cnc_vmc:         { id:'cnc_vmc',         label:'CNC Vertical Machining Center',  category:'mill',   icon:'🔩' },
  cnc_hmc:         { id:'cnc_hmc',         label:'CNC Horizontal Machining Center', category:'mill',  icon:'🔩' },
  cnc_5axis:       { id:'cnc_5axis',       label:'5-Axis CNC Machining Center',    category:'mill',   icon:'🔩' },
  manual_mill:     { id:'manual_mill',     label:'Manual Knee Mill / Bridgeport',  category:'mill',   icon:'🔩' },
  // Grinders
  surface_grinder: { id:'surface_grinder', label:'Surface Grinder',                category:'grind',  icon:'💠' },
  cnc_grinder:     { id:'cnc_grinder',     label:'CNC Cylindrical Grinder',        category:'grind',  icon:'💠' },
  id_grinder:      { id:'id_grinder',      label:'ID / Jig Grinder',               category:'grind',  icon:'💠' },
  // Saws & material
  bandsaw_vert:    { id:'bandsaw_vert',    label:'Vertical Band Saw',              category:'saw',    icon:'🪚' },
  bandsaw_horiz:   { id:'bandsaw_horiz',   label:'Horizontal Band Saw / Cutoff',   category:'saw',    icon:'🪚' },
  cold_saw:        { id:'cold_saw',        label:'Cold Saw',                       category:'saw',    icon:'🪚' },
  chop_saw:        { id:'chop_saw',        label:'Abrasive Chop Saw',              category:'saw',    icon:'🪚' },
  circular_saw:    { id:'circular_saw',    label:'Circular / Panel Saw',           category:'saw',    icon:'🪚' },
  // Other shop
  drill_press:     { id:'drill_press',     label:'Drill Press',                    category:'press',  icon:'🔩' },
  tap_machine:     { id:'tap_machine',     label:'Tapping Machine / Arm Tapper',   category:'press',  icon:'🔀' },
  surface_grind_m: { id:'surface_grind_m', label:'Manual Surface Grinder',         category:'grind',  icon:'💠' },
  deburr_machine:  { id:'deburr_machine',  label:'Deburr / Tumble Machine',        category:'finish', icon:'🔄' },
  wash_station:    { id:'wash_station',    label:'Parts Washer',                   category:'finish', icon:'💧' },
  // Inspection
  cmm_machine:     { id:'cmm_machine',     label:'CMM Machine (Zeiss/Hexagon)',    category:'inspect', icon:'🤖' },
  vision_system:   { id:'vision_system',   label:'Vision Inspection System',       category:'inspect', icon:'👁'  },
  // EDM
  edm_wire:        { id:'edm_wire',        label:'Wire EDM',                       category:'edm',    icon:'⚡' },
  edm_sinker:      { id:'edm_sinker',      label:'Sinker / Ram EDM',               category:'edm',    icon:'⚡' },
  // Safety / support
  overhead_crane:  { id:'overhead_crane',  label:'Overhead Crane / Hoist',         category:'material', icon:'🏗' },
  forklift:        { id:'forklift',        label:'Forklift / Pallet Jack',         category:'material', icon:'🚜' },
  die_grinder:     { id:'die_grinder',     label:'Die Grinder / Angle Grinder',    category:'hand',   icon:'🔄' },
};

// ── SAFETY CERTIFICATIONS ────────────────────────────────────────
const OAP_SAFETY = {
  shop_safety:    { id:'shop_safety',    label:'General Shop Safety',            icon:'🦺', required:true,  renewYears:1 },
  ppe_cert:       { id:'ppe_cert',       label:'PPE / Personal Protective Equipment', icon:'🥽', required:true, renewYears:1 },
  lockout_tagout: { id:'lockout_tagout', label:'Lockout / Tagout (LOTO)',         icon:'🔐', required:true,  renewYears:1 },
  fire_ext:       { id:'fire_ext',       label:'Fire Extinguisher Operation',     icon:'🧯', required:true,  renewYears:1 },
  hazcom:         { id:'hazcom',         label:'HazCom / GHS / SDS Awareness',   icon:'⚗️', required:true,  renewYears:1 },
  forklift_cert:  { id:'forklift_cert',  label:'Forklift / Powered Industrial Truck', icon:'🚜', required:false, renewYears:3 },
  crane_signal:   { id:'crane_signal',   label:'Crane Signaling & Rigging',       icon:'🏗', required:false, renewYears:3 },
  first_aid:      { id:'first_aid',      label:'First Aid / CPR',                 icon:'🩺', required:false, renewYears:2 },
  hearing_cons:   { id:'hearing_cons',   label:'Hearing Conservation',            icon:'👂', required:false, renewYears:1 },
  respiratory:    { id:'respiratory',    label:'Respiratory Protection',          icon:'😷', required:false, renewYears:1 },
  ehs_env:        { id:'ehs_env',        label:'Environmental Health & Safety',   icon:'🌿', required:true,  renewYears:1 },
  ergonomics:     { id:'ergonomics',     label:'Ergonomics & Lifting Safety',     icon:'💪', required:false, renewYears:2 },
};

// ── OAP SECTION FLOW ─────────────────────────────────────────────
// Ordered sections every mentee moves through
const OAP_SECTIONS = [
  {
    id: 'orientation',
    label: 'Company Orientation',
    icon: '🏢',
    color: '#a78bfa',
    desc: 'HR onboarding, company policies, facility tour, emergency procedures',
    requiredBefore: [],
  },
  {
    id: 'safety',
    label: 'Safety & EHS',
    icon: '🦺',
    color: '#ff4757',
    desc: 'PPE, LOTO, HazCom, fire extinguisher, emergency exits, first aid',
    requiredBefore: ['orientation'],
  },
  {
    id: 'materials',
    label: 'Material Handling',
    icon: '📦',
    color: '#f5c518',
    desc: 'Raw material ID, storage, handling, saw operation, basic measuring',
    requiredBefore: ['safety'],
  },
  {
    id: 'measuring',
    label: 'Measurement & Inspection',
    icon: '📐',
    color: '#4a9eff',
    desc: 'Tape, rule, caliper, micrometer, gauges, pi tape, reading prints',
    requiredBefore: ['materials'],
  },
  {
    id: 'tooling',
    label: 'Tooling & Preset',
    icon: '🔧',
    color: '#00e5b0',
    desc: 'Tool identification, holders, inserts, end mills, drills, taps, preset station',
    requiredBefore: ['measuring'],
  },
  {
    id: 'machine',
    label: 'Machine Qualification',
    icon: '🏭',
    color: '#ff6b35',
    desc: 'Machine-specific OAK checklist, supervised operation, buy-off sign-off',
    requiredBefore: ['tooling'],
  },
  {
    id: 'floor',
    label: 'Floor Certification',
    icon: '✅',
    color: '#00e5b0',
    desc: 'Final process checklists, quality standards, independent operation sign-off',
    requiredBefore: ['machine'],
  },
];

// ── OAP CHECKPOINT SCHEMA ────────────────────────────────────────
// Used by employer to build role-specific checklists
// @typedef {Object} OAPCheckpoint
// @property {string}   id
// @property {string}   label
// @property {string}   section   — OAP_SECTIONS id
// @property {'demo'|'written'|'observed'|'both'} type
// @property {boolean}  mentorSignOff
// @property {boolean}  employerBuyOff
// @property {string=}  linkedCourse  — oap-data course id
// @property {string=}  linkedEquip   — OAP_MEASURING / OAP_TOOLING / OAP_MACHINES id
// @property {string=}  notes

// ── OAP STATUS ENUM ──────────────────────────────────────────────
const OAP_STATUS = {
  NOT_STARTED:  'not_started',
  IN_PROGRESS:  'in_progress',
  PENDING_SIGNOFF: 'pending_signoff',
  COMPLETE:     'complete',
  FAILED:       'failed',
  RECERT_DUE:   'recert_due',
};

// ── INDUSTRY / BUSINESS TYPES ────────────────────────────────────
const OAP_INDUSTRIES = [
  'Aerospace & Defense',
  'Automotive / Tier 1-3',
  'Medical Device / Implants',
  'Oil & Gas / Energy',
  'General Precision Machining',
  'Sheet Metal Fabrication',
  'Tool & Die / Mold Making',
  'Electronics / Semiconductor',
  'Heavy Equipment / Agriculture',
  'Job Shop (Mixed)',
  'R&D / Prototype',
  'Other',
];

// ── DEFAULT OAP SCHEDULES ────────────────────────────────────────
const OAP_SCHEDULE_TEMPLATES = {
  standard_90: {
    label: '90-Day Standard',
    desc:  'Industry standard new-hire qualification',
    weeks: [
      { week:1,  section:'orientation', tasks:['HR paperwork','facility tour','emergency procedures'] },
      { week:1,  section:'safety',      tasks:['Shop safety course','PPE fitting','LOTO training','fire extinguisher'] },
      { week:2,  section:'materials',   tasks:['Material identification','saw operation demo','receiving inspection'] },
      { week:3,  section:'measuring',   tasks:['Tape/rule','caliper','micrometer sign-off'] },
      { week:4,  section:'tooling',     tasks:['Tool ID quiz','holder assembly','preset station intro'] },
      { week:5,  section:'machine',     tasks:['Machine anatomy','power-on sequence','supervised run'] },
      { week:6,  section:'machine',     tasks:['Setup documentation','offset adjustment','first article'] },
      { week:8,  section:'floor',       tasks:['Independent run obs.','quality audit','mentor final eval'] },
      { week:12, section:'floor',       tasks:['Employer buy-off','certificate issuance'] },
    ],
  },
  accelerated_30: {
    label: '30-Day Accelerated',
    desc:  'Experienced hire verification track',
    weeks: [
      { week:1, section:'orientation', tasks:['HR, tour, policies'] },
      { week:1, section:'safety',      tasks:['Safety cert verification / refresher'] },
      { week:2, section:'measuring',   tasks:['Precision measurement competency check'] },
      { week:2, section:'tooling',     tasks:['Tooling competency check'] },
      { week:3, section:'machine',     tasks:['Machine-specific supervised trial','first article'] },
      { week:4, section:'floor',       tasks:['Buy-off and certificate'] },
    ],
  },
  material_only: {
    label: 'Material Handler Track',
    desc:  'Saw operator / material prep only',
    weeks: [
      { week:1, section:'orientation', tasks:['HR, tour, policies'] },
      { week:1, section:'safety',      tasks:['Shop safety, PPE, LOTO'] },
      { week:2, section:'materials',   tasks:['Material ID, handling, saw safety, basic measuring'] },
      { week:3, section:'floor',       tasks:['Supervisor buy-off on material ops'] },
    ],
  },
};

// ── CERT SCHEMA ──────────────────────────────────────────────────
// @typedef {Object} OAPCertificate
// @property {string}   certId          — UUID
// @property {string}   menteeId
// @property {string}   menteeName
// @property {string}   menteeEmail
// @property {string}   employerId
// @property {string}   employerName
// @property {string}   employerCity
// @property {string}   roleId          — OAP_ROLES key
// @property {string}   roleLabel
// @property {string[]} machinesPassed  — OAP_MACHINES keys
// @property {string[]} toolingPassed   — OAP_TOOLING keys
// @property {string[]} measuringPassed — OAP_MEASURING keys
// @property {string[]} safetyCerts     — OAP_SAFETY keys
// @property {string}   mentorName
// @property {string}   mentorSignature — base64 or typed name
// @property {string}   employerSignature
// @property {string}   issuedDate      — ISO
// @property {string}   expiresDate     — ISO (null if no expiry)
// @property {'initial'|'recert'} certType
// @property {Object}   checkpoints     — { checkpointId: { status, signedBy, signedAt, notes } }
// @property {string}   qrPayload       — portable verification string

