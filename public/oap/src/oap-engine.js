// ═══════════════════════════════════════════════════════════════════
// OAP-ENGINE.JS — Full UI Engine for JobLine OAP Program
// Depends on: OAP_TYPES, OAP_DATA, OAP_EMPLOYER, OAP_CERT
// WeCr8 Solutions LLC | JobLine.ai | v1.0.0
// ═══════════════════════════════════════════════════════════════════

'use strict';

var OAP_STATE = {
  view: 'home',           // home | employer | program | mentor | mentee | course | cert | standalone
  subView: null,
  activeMentee: null,
  activeMentor: null,
  activeProgram: null,
  activeCourse: null,
  activeCert: null,
  courseState: null,      // running test state
};

// ── INIT ──────────────────────────────────────────────────────────
function oapInit() {
  oapRender();
}

function oapSetView(v, sub) {
  OAP_STATE.view = v;
  OAP_STATE.subView = sub || null;
  oapRender();
}

function oapRender() {
  var el = document.getElementById('oap-root');
  if (!el) return;
  var profile = OAP_EMPLOYER.getProfile();
  switch(OAP_STATE.view) {
    case 'home':       el.innerHTML = oapHome(profile);      break;
    case 'employer':   el.innerHTML = oapEmployerCenter();   break;
    case 'program':    el.innerHTML = oapProgramBuilder();   break;
    case 'mentor':     el.innerHTML = oapMentorPanel();      break;
    case 'mentee':     el.innerHTML = oapMenteePanel();      break;
    case 'course':     el.innerHTML = oapCourseRunner();     break;
    case 'standalone': el.innerHTML = oapStandalone();       break;
    default:           el.innerHTML = oapHome(profile);
  }
}

// ── SECTION COLOR MAP ─────────────────────────────────────────────
var SEC_COLOR = { orientation:'#a78bfa', safety:'#ff4757', materials:'#f5c518', measuring:'#4a9eff', tooling:'#00e5b0', machine:'#ff6b35', floor:'#00e5b0' };
var SEC_ICON  = { orientation:'🏢', safety:'🦺', materials:'📦', measuring:'📐', tooling:'🔧', machine:'🏭', floor:'✅' };

// ── HOME / DASHBOARD ──────────────────────────────────────────────
function oapHome(profile) {
  var mentees  = OAP_EMPLOYER.getMentees();
  var programs = OAP_EMPLOYER.getPrograms();
  var menteeCount = Object.keys(mentees).length;
  var activeCount = Object.values(mentees).filter(function(m){ return m.status===OAP_STATUS.IN_PROGRESS; }).length;
  var certCount   = Object.values(mentees).filter(function(m){ return m.status===OAP_STATUS.COMPLETE; }).length;

  var h = '<div class="oap-hero">';
  h += '<div class="oap-logo-row"><span class="oap-badge">JobLine</span> <span class="oap-title">Operator Acceptance Program</span></div>';
  h += '<p class="oap-hero-desc">Structured onboarding, skill verification, and portable certification for manufacturing operators.</p>';
  h += '</div>';

  if (!profile) {
    h += '<div class="oap-setup-cta">';
    h += '<div class="oap-setup-icon">🏢</div>';
    h += '<h2>Set Up Your Employer Center</h2>';
    h += '<p>Configure your company profile, define role-specific OAP programs, and start enrolling operators.</p>';
    h += '<button class="oap-btn-primary" onclick="oapSetView(\'employer\',\'setup\')">Set Up Employer Profile →</button>';
    h += '<div style="margin-top:14px"><button class="oap-btn-ghost" onclick="oapSetView(\'standalone\')">📋 Take a Standalone OAP Test (No employer)</button></div>';
    h += '</div>';
    return h;
  }

  // Employer dashboard
  h += '<div class="oap-dash-grid">';
  h += oapStatCard('🧑‍🏭 Enrolled', menteeCount, 'Total mentees');
  h += oapStatCard('📋 In Progress', activeCount, 'Currently training');
  h += oapStatCard('✅ Certified', certCount, 'Completed OAP');
  h += oapStatCard('📝 Programs', Object.keys(programs).length, 'Active role programs');
  h += '</div>';

  h += '<div class="oap-section-grid">';
  // Quick actions
  h += '<div class="oap-card"><div class="oap-card-title">Quick Actions</div>';
  h += '<div class="oap-action-list">';
  h += '<button class="oap-action-btn" onclick="oapSetView(\'mentee\',\'enroll\')">➕ Enroll New Operator</button>';
  h += '<button class="oap-action-btn" onclick="oapSetView(\'mentor\',\'list\')">👤 Manage Mentors</button>';
  h += '<button class="oap-action-btn" onclick="oapSetView(\'program\',\'list\')">📋 Manage Programs</button>';
  h += '<button class="oap-action-btn" onclick="oapSetView(\'employer\',\'profile\')">🏢 Edit Company Profile</button>';
  h += '<button class="oap-action-btn" onclick="oapSetView(\'standalone\')">🎓 Standalone Certification</button>';
  h += '</div></div>';

  // Recent mentees
  h += '<div class="oap-card"><div class="oap-card-title">Active Operators</div>';
  var recent = Object.values(mentees).filter(function(m){ return m.status===OAP_STATUS.IN_PROGRESS; }).slice(0,5);
  if (!recent.length) {
    h += '<p class="oap-empty">No operators currently in training. <span class="oap-link" onclick="oapSetView(\'mentee\',\'enroll\')">Enroll one →</span></p>';
  } else {
    recent.forEach(function(m) {
      var prog = OAP_EMPLOYER.getSectionProgress(m.id);
      var totalSec = Object.keys(prog).length || 1;
      var doneSec  = Object.values(prog).filter(function(p){ return p.pct===100; }).length;
      var pct = Math.round(doneSec/totalSec*100);
      h += '<div class="oap-mentee-row" onclick="oapOpenMentee(\'' + m.id + '\')">';
      h += '<div class="oap-avatar">' + (m.name||'?')[0].toUpperCase() + '</div>';
      h += '<div style="flex:1;min-width:0"><div class="oap-mentee-name">' + m.name + '</div>';
      h += '<div class="oap-mentee-role">' + ((OAP_ROLES[m.roleId]||{}).label||m.roleId) + '</div>';
      h += '<div class="oap-prog-bar"><div class="oap-prog-fill" style="width:' + pct + '%"></div></div></div>';
      h += '<div class="oap-pct">' + pct + '%</div></div>';
    });
  }
  h += '</div>';
  h += '</div>'; // section-grid

  return h;
}

function oapStatCard(label, val, sub) {
  return '<div class="oap-stat-card"><div class="oap-stat-val">' + val + '</div><div class="oap-stat-label">' + label + '</div><div class="oap-stat-sub">' + sub + '</div></div>';
}

// ── EMPLOYER CENTER ───────────────────────────────────────────────
function oapEmployerCenter() {
  var profile = OAP_EMPLOYER.getProfile() || {};
  var sub = OAP_STATE.subView || (profile.id ? 'profile' : 'setup');

  var h = '<div class="oap-page-header"><button class="oap-back" onclick="oapSetView(\'home\')">← Dashboard</button><h1>🏢 Employer Center</h1></div>';
  h += '<div class="oap-tabs"><span class="oap-tab' + (sub==='profile'?' active':'') + '" onclick="oapSetView(\'employer\',\'profile\')">Profile</span>';
  h += '<span class="oap-tab' + (sub==='requirements'?' active':'') + '" onclick="oapSetView(\'employer\',\'requirements\')">OAP Requirements</span>';
  h += '<span class="oap-tab' + (sub==='schedule'?' active':'') + '" onclick="oapSetView(\'employer\',\'schedule\')">Schedule</span></div>';

  if (sub === 'setup' || sub === 'profile') {
    h += '<div class="oap-card"><div class="oap-card-title">Company Information</div>';
    h += '<div class="oap-form-grid">';
    h += oapField('Company Name','text','emp-companyName',profile.companyName||'','Your legal business name');
    h += oapField('Industry','select','emp-industry',profile.industry||'',OAP_INDUSTRIES.map(function(i){ return {val:i,label:i}; }));
    h += oapField('Contact Name','text','emp-contactName',profile.contactName||'','Primary OAP administrator');
    h += oapField('Contact Title','text','emp-contactTitle',profile.contactTitle||'','e.g. Quality Manager');
    h += oapField('Email','email','emp-email',profile.email||'','');
    h += oapField('Phone','tel','emp-phone',profile.phone||'','');
    h += oapField('City','text','emp-city',profile.city||'','');
    h += oapField('State','text','emp-state',profile.state||'','');
    h += '</div>';
    h += '<div class="oap-form-grid" style="margin-top:12px">';
    h += oapField('Cert Valid (years)','number','emp-certYears',profile.certValidYears||2,'2 = standard');
    h += oapField('Recert Interval','select','emp-recert',profile.recertWeeks||104,[{val:52,label:'1 Year'},{val:104,label:'2 Years'},{val:156,label:'3 Years'}]);
    h += '</div>';
    h += '<div style="margin-top:12px"><label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer"><input type="checkbox" id="emp-buyoff"' + (profile.requireEmployerBuyOff!==false?' checked':'') + '> Require employer final buy-off for certification</label></div>';
    h += '<div style="margin-top:6px"><label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer"><input type="checkbox" id="emp-portable"' + (profile.allowPortableCert!==false?' checked':'') + '> Issue portable certificates (operator can use at other employers)</label></div>';
    h += '<button class="oap-btn-primary" style="margin-top:16px" onclick="oapSaveProfile()">Save Company Profile</button></div>';
  }

  if (sub === 'requirements') {
    h += '<div class="oap-card"><div class="oap-card-title">Default OAP Requirements</div>';
    h += '<p class="oap-hint">These defaults apply to all programs unless overridden per role. Configure per-role requirements in Program Builder.</p>';
    h += '<div class="oap-section-list">';
    OAP_SECTIONS.forEach(function(sec) {
      h += '<div class="oap-sec-row"><div class="oap-sec-dot" style="background:' + SEC_COLOR[sec.id] + '"></div>';
      h += '<div style="flex:1"><strong>' + sec.label + '</strong><div class="oap-hint">' + sec.desc + '</div></div>';
      h += '<span class="oap-badge-sm">' + (OAP_CHECKPOINT_LIBRARY[sec.id]||[]).length + ' checkpoints</span></div>';
    });
    h += '</div>';
    h += '<button class="oap-btn-primary" style="margin-top:14px" onclick="oapSetView(\'program\',\'new\')">Build Role-Specific Program →</button></div>';
  }

  if (sub === 'schedule') {
    h += '<div class="oap-card"><div class="oap-card-title">Schedule Templates</div>';
    Object.entries(OAP_SCHEDULE_TEMPLATES).forEach(function(entry) {
      var k=entry[0], t=entry[1];
      h += '<div class="oap-sched-card"><div class="oap-sched-title">' + t.label + '</div>';
      h += '<div class="oap-hint">' + t.desc + '</div>';
      h += '<div class="oap-sched-timeline">';
      t.weeks.forEach(function(w) {
        h += '<div class="oap-sched-week"><span class="oap-sched-wk">Wk ' + w.week + '</span>';
        h += '<span class="oap-sched-sec" style="color:' + SEC_COLOR[w.section] + '">' + SEC_ICON[w.section] + ' ' + w.section + '</span>';
        h += '<span class="oap-sched-tasks">' + w.tasks.join(' · ') + '</span></div>';
      });
      h += '</div></div>';
    });
  }

  return h;
}

// ── PROGRAM BUILDER ───────────────────────────────────────────────
function oapProgramBuilder() {
  var programs = OAP_EMPLOYER.getPrograms();
  var sub = OAP_STATE.subView || 'list';

  var h = '<div class="oap-page-header"><button class="oap-back" onclick="oapSetView(\'home\')">← Dashboard</button><h1>📋 Program Builder</h1></div>';

  if (sub === 'list') {
    h += '<div class="oap-card"><div class="oap-card-title" style="display:flex;justify-content:space-between;align-items:center">Role Programs <button class="oap-btn-sm" onclick="oapSetView(\'program\',\'new\')">+ New Program</button></div>';
    var progs = Object.values(programs);
    if (!progs.length) {
      h += '<p class="oap-empty">No programs yet. Create one for each role you hire for.</p>';
    } else {
      progs.forEach(function(p) {
        var role = OAP_ROLES[p.roleId] || {};
        h += '<div class="oap-prog-row"><div class="oap-prog-icon">' + (role.icon||'📋') + '</div>';
        h += '<div style="flex:1"><div class="oap-prog-name">' + p.roleLabel + '</div>';
        h += '<div class="oap-hint">' + (p.machines||[]).length + ' machines · ' + (p.safetyCerts||[]).length + ' safety certs</div></div>';
        h += '<button class="oap-btn-sm" onclick="oapEditProgram(\'' + p.id + '\')">Edit</button></div>';
      });
    }
    h += '</div>';
    return h;
  }

  if (sub === 'new' || sub === 'edit') {
    var prog = OAP_STATE.activeProgram ? programs[OAP_STATE.activeProgram] : null;
    h += '<div class="oap-card"><div class="oap-card-title">' + (prog ? 'Edit Program' : 'New OAP Program') + '</div>';

    // Role selection
    h += '<div class="oap-form-section"><div class="oap-form-label">Role</div>';
    h += '<div class="oap-role-grid">';
    Object.entries(OAP_ROLES).forEach(function(entry) {
      var k=entry[0], r=entry[1];
      var sel = prog && prog.roleId===k;
      h += '<div class="oap-role-card' + (sel?' selected':'') + '" onclick="oapSelectRole(\'' + k + '\')" id="role-card-' + k + '">';
      h += r.icon + ' ' + r.label + '</div>';
    });
    h += '</div></div>';

    // Sections to include
    h += '<div class="oap-form-section"><div class="oap-form-label">Sections to Include</div>';
    OAP_SECTIONS.forEach(function(sec) {
      var checked = !prog || (prog.sections||[]).includes(sec.id);
      h += '<label class="oap-check-row"><input type="checkbox" id="sec-' + sec.id + '"' + (checked?' checked':'') + '>';
      h += '<span class="oap-sec-dot" style="background:' + SEC_COLOR[sec.id] + '"></span>' + SEC_ICON[sec.id] + ' <strong>' + sec.label + '</strong> — <span class="oap-hint-inline">' + sec.desc + '</span></label>';
    });
    h += '</div>';

    // Machine selection
    h += '<div class="oap-form-section"><div class="oap-form-label">Machines This Role Operates</div>';
    h += '<div class="oap-equip-grid">';
    var machCats = {};
    Object.entries(OAP_MACHINES).forEach(function(e){ var m=e[1]; (machCats[m.category]=machCats[m.category]||[]).push(e); });
    Object.entries(machCats).forEach(function(ce) {
      var cat=ce[0], items=ce[1];
      h += '<div class="oap-equip-cat"><div class="oap-equip-cat-label">' + cat.toUpperCase() + '</div>';
      items.forEach(function(e) {
        var k=e[0], m=e[1];
        var checked = prog && (prog.machines||[]).includes(k);
        h += '<label class="oap-check-sm"><input type="checkbox" class="prog-machine" value="' + k + '"' + (checked?' checked':'') + '>' + m.icon + ' ' + m.label + '</label>';
      });
      h += '</div>';
    });
    h += '</div></div>';

    // Measuring equipment
    h += '<div class="oap-form-section"><div class="oap-form-label">Required Measuring Equipment</div>';
    h += '<div class="oap-equip-grid">';
    var measCats = {};
    Object.entries(OAP_MEASURING).forEach(function(e){ var m=e[1]; (measCats[m.category]=measCats[m.category]||[]).push(e); });
    Object.entries(measCats).forEach(function(ce) {
      var cat=ce[0], items=ce[1];
      h += '<div class="oap-equip-cat"><div class="oap-equip-cat-label">' + cat.toUpperCase() + '</div>';
      items.forEach(function(e) {
        var k=e[0], m=e[1];
        var checked = prog && (prog.measuring||[]).includes(k);
        h += '<label class="oap-check-sm"><input type="checkbox" class="prog-measuring" value="' + k + '"' + (checked?' checked':'') + '>' + m.icon + ' ' + m.label + ' <span class="oap-precision">' + m.precision + '</span></label>';
      });
      h += '</div>';
    });
    h += '</div></div>';

    // Safety certs
    h += '<div class="oap-form-section"><div class="oap-form-label">Required Safety Certifications</div>';
    Object.entries(OAP_SAFETY).forEach(function(e) {
      var k=e[0], s=e[1];
      var checked = !prog || (prog.safetyCerts||['shop_safety','ppe_cert','lockout_tagout','fire_ext','hazcom']).includes(k);
      h += '<label class="oap-check-row"><input type="checkbox" class="prog-safety" value="' + k + '"' + (checked?' checked':'') + '>';
      h += s.icon + ' ' + s.label;
      if (s.required) h += ' <span class="oap-req-badge">Required</span>';
      h += ' <span class="oap-hint-inline">Renew every ' + s.renewYears + ' yr</span></label>';
    });
    h += '</div>';

    // Schedule
    h += '<div class="oap-form-section"><div class="oap-form-label">Schedule Template</div>';
    h += '<div class="oap-sched-select">';
    Object.entries(OAP_SCHEDULE_TEMPLATES).forEach(function(e) {
      var k=e[0], t=e[1];
      var sel = prog ? prog.scheduleTemplate===k : k==='standard_90';
      h += '<div class="oap-sched-opt' + (sel?' selected':'') + '" onclick="oapSelectSched(\'' + k + '\')" id="sched-' + k + '">';
      h += '<strong>' + t.label + '</strong><div class="oap-hint">' + t.desc + '</div></div>';
    });
    h += '</div></div>';

    h += '<button class="oap-btn-primary" onclick="oapSaveProgram()">Save Program</button>';
    if (prog) h += ' <button class="oap-btn-ghost" style="margin-left:8px" onclick="oapSetView(\'program\',\'list\')">Cancel</button>';
    h += '</div>';
  }

  return h;
}

// ── MENTOR PANEL ──────────────────────────────────────────────────
function oapMentorPanel() {
  var mentors = OAP_EMPLOYER.getMentors();
  var sub = OAP_STATE.subView || 'list';

  var h = '<div class="oap-page-header"><button class="oap-back" onclick="oapSetView(\'home\')">← Dashboard</button><h1>👤 Mentor Management</h1></div>';

  if (sub === 'list') {
    h += '<div class="oap-card"><div class="oap-card-title" style="display:flex;justify-content:space-between;align-items:center">Mentors <button class="oap-btn-sm" onclick="oapSetView(\'mentor\',\'add\')">+ Add Mentor</button></div>';
    var mlist = Object.values(mentors);
    if (!mlist.length) {
      h += '<p class="oap-empty">No mentors registered. Add one to begin enrolling operators.</p>';
    } else {
      mlist.forEach(function(m) {
        h += '<div class="oap-mentor-row"><div class="oap-avatar" style="background:#4a9eff">' + (m.name||'?')[0].toUpperCase() + '</div>';
        h += '<div style="flex:1"><div class="oap-prog-name">' + m.name + '</div>';
        h += '<div class="oap-hint">' + m.title + ' · ' + (m.roles||[]).map(function(r){ return (OAP_ROLES[r]||{}).label||r; }).join(', ') + '</div></div>';
        h += '<span class="oap-badge-sm">' + (m.machines||[]).length + ' machines</span></div>';
      });
    }
    h += '</div>';
    return h;
  }

  if (sub === 'add') {
    h += '<div class="oap-card"><div class="oap-card-title">Add Mentor</div>';
    h += '<div class="oap-form-grid">';
    h += oapField('Full Name','text','mentor-name','','');
    h += oapField('Title / Position','text','mentor-title','','e.g. Lead Machinist, Setup Tech');
    h += oapField('Email','email','mentor-email','','');
    h += oapField('Phone','tel','mentor-phone','','');
    h += '</div>';
    h += '<div class="oap-form-section"><div class="oap-form-label">Can Mentor These Roles</div>';
    Object.entries(OAP_ROLES).forEach(function(e) {
      var k=e[0], r=e[1];
      h += '<label class="oap-check-sm"><input type="checkbox" class="mentor-role" value="' + k + '">' + r.icon + ' ' + r.label + '</label>';
    });
    h += '</div>';
    h += '<div class="oap-form-section"><div class="oap-form-label">Qualified to Sign Off These Machines</div>';
    Object.entries(OAP_MACHINES).forEach(function(e) {
      var k=e[0], m=e[1];
      h += '<label class="oap-check-sm"><input type="checkbox" class="mentor-machine" value="' + k + '">' + m.icon + ' ' + m.label + '</label>';
    });
    h += '</div>';
    h += '<button class="oap-btn-primary" onclick="oapSaveMentor()">Add Mentor</button>';
    h += ' <button class="oap-btn-ghost" onclick="oapSetView(\'mentor\',\'list\')">Cancel</button></div>';
  }

  return h;
}

// ── MENTEE PANEL ──────────────────────────────────────────────────
function oapMenteePanel() {
  var sub = OAP_STATE.subView || 'list';
  var mentees  = OAP_EMPLOYER.getMentees();
  var programs = OAP_EMPLOYER.getPrograms();
  var mentors  = OAP_EMPLOYER.getMentors();

  var h = '<div class="oap-page-header"><button class="oap-back" onclick="oapSetView(\'home\')">← Dashboard</button><h1>🧑‍🏭 Operator Dashboard</h1></div>';

  if (sub === 'enroll') {
    h += '<div class="oap-card"><div class="oap-card-title">Enroll New Operator</div>';
    h += '<div class="oap-form-grid">';
    h += oapField('Full Name','text','ment-name','','');
    h += oapField('Email','email','ment-email','','');
    h += oapField('Phone','tel','ment-phone','','');
    h += oapField('Hire Date','date','ment-hire',new Date().toISOString().slice(0,10),'');
    h += '</div>';
    h += '<div class="oap-form-section"><div class="oap-form-label">OAP Program (Role)</div>';
    h += '<div class="oap-role-grid">';
    Object.values(programs).forEach(function(p) {
      var role = OAP_ROLES[p.roleId]||{};
      h += '<div class="oap-role-card" onclick="oapSelectMenteeProg(\'' + p.id + '\')" id="mp-' + p.id + '">';
      h += (role.icon||'📋') + ' ' + p.roleLabel + '</div>';
    });
    h += '</div><input type="hidden" id="ment-progId" value=""></div>';
    h += '<div class="oap-form-section"><div class="oap-form-label">Assign Mentor</div>';
    h += '<select id="ment-mentorId" class="oap-select">';
    h += '<option value="">— Select mentor —</option>';
    Object.values(mentors).forEach(function(m){ h += '<option value="' + m.id + '">' + m.name + ' (' + m.title + ')</option>'; });
    h += '</select></div>';
    h += '<button class="oap-btn-primary" onclick="oapEnrollMentee()">Enroll Operator</button>';
    h += ' <button class="oap-btn-ghost" onclick="oapSetView(\'home\')">Cancel</button></div>';
    return h;
  }

  if (sub === 'detail' && OAP_STATE.activeMentee) {
    return oapMenteeDetail(OAP_STATE.activeMentee);
  }

  // List
  h += '<div class="oap-card"><div class="oap-card-title" style="display:flex;justify-content:space-between;align-items:center">All Operators <button class="oap-btn-sm" onclick="oapSetView(\'mentee\',\'enroll\')">+ Enroll</button></div>';
  var mlist = Object.values(mentees);
  if (!mlist.length) {
    h += '<p class="oap-empty">No operators enrolled yet.</p>';
  } else {
    mlist.forEach(function(m) {
      var prog = OAP_EMPLOYER.getSectionProgress(m.id);
      var totalSec = Object.keys(prog).length || 1;
      var doneSec  = Object.values(prog).filter(function(p){ return p.pct===100; }).length;
      var pct = Math.round(doneSec/totalSec*100);
      var statusColor = {in_progress:'#f5c518',complete:'#00e5b0',not_started:'#566070'}[m.status]||'#566070';
      h += '<div class="oap-mentee-row" onclick="oapOpenMentee(\'' + m.id + '\')">';
      h += '<div class="oap-avatar">' + (m.name||'?')[0].toUpperCase() + '</div>';
      h += '<div style="flex:1;min-width:0"><div class="oap-mentee-name">' + m.name + '</div>';
      h += '<div class="oap-mentee-role">' + ((OAP_ROLES[m.roleId]||{}).label||m.roleId) + ' · ' + m.hireDate + '</div>';
      h += '<div class="oap-prog-bar"><div class="oap-prog-fill" style="width:' + pct + '%"></div></div></div>';
      h += '<div style="text-align:right"><div class="oap-pct">' + pct + '%</div>';
      h += '<div style="font-size:9px;color:' + statusColor + ';text-transform:uppercase;letter-spacing:1px">' + m.status.replace('_',' ') + '</div></div></div>';
    });
  }
  h += '</div>';
  return h;
}

// ── MENTEE DETAIL / OAK TRACKER ──────────────────────────────────
function oapMenteeDetail(menteeId) {
  var mentee   = OAP_EMPLOYER.getMentee(menteeId);
  if (!mentee) return '<p>Operator not found.</p>';
  var programs = OAP_EMPLOYER.getPrograms();
  var prog     = programs[mentee.programId]||{};
  var progress = OAP_EMPLOYER.getSectionProgress(menteeId);
  var mentors  = OAP_EMPLOYER.getMentors();
  var mentor   = mentors[mentee.mentorId]||{};

  var h = '<div class="oap-page-header"><button class="oap-back" onclick="oapSetView(\'mentee\',\'list\')">← All Operators</button><h1>' + mentee.name + '</h1></div>';

  // Header card
  h += '<div class="oap-card" style="margin-bottom:14px">';
  h += '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">';
  h += '<div class="oap-avatar oap-avatar-lg">' + mentee.name[0].toUpperCase() + '</div>';
  h += '<div style="flex:1;min-width:0"><div style="font-family:var(--oap-head);font-weight:900;font-size:20px">' + mentee.name + '</div>';
  h += '<div style="font-size:12px;color:var(--oap-muted)">' + ((OAP_ROLES[mentee.roleId]||{}).label||mentee.roleId) + ' · Hired: ' + mentee.hireDate + '</div>';
  h += '<div style="font-size:12px;color:var(--oap-muted)">Mentor: ' + (mentor.name||'Unassigned') + '</div></div>';
  if (mentee.status !== OAP_STATUS.COMPLETE) {
    h += '<button class="oap-btn-primary" onclick="oapIssueCert(\'' + menteeId + '\')">Issue Certificate ✓</button>';
  } else {
    h += '<button class="oap-btn-sm" onclick="oapPrintCert(\'' + mentee.certId + '\')">🖨 Print Cert</button>';
  }
  h += '</div></div>';

  // Section flow with checkpoints
  OAP_SECTIONS.forEach(function(sec) {
    var sp = progress[sec.id] || { pct:0, done:0, total:0, unlocked:false };
    var cpIds = prog.checkpoints ? (prog.checkpoints[sec.id]||[]) : (OAP_CHECKPOINT_LIBRARY[sec.id]||[]).map(function(c){ return c.id; });
    var locked = !sp.unlocked && sec.requiredBefore && sec.requiredBefore.length > 0;
    h += '<div class="oap-section-card' + (locked?' oap-locked':'') + '">';
    h += '<div class="oap-sec-header" onclick="oapToggleSec(\'' + sec.id + '\')">';
    h += '<div class="oap-sec-dot-lg" style="background:' + SEC_COLOR[sec.id] + '"></div>';
    h += '<div style="flex:1"><div class="oap-sec-label">' + SEC_ICON[sec.id] + ' ' + sec.label + '</div>';
    h += '<div class="oap-prog-bar" style="max-width:200px;margin-top:4px"><div class="oap-prog-fill" style="width:' + sp.pct + '%;background:' + SEC_COLOR[sec.id] + '"></div></div></div>';
    h += '<div style="font-family:var(--oap-mono);font-size:12px;color:' + SEC_COLOR[sec.id] + '">' + sp.pct + '%</div>';
    h += (locked ? '<span style="color:#f5c518;font-size:12px">🔒</span>' : '<span style="font-size:12px">▼</span>');
    h += '</div>';

    // Checkpoints
    h += '<div class="oap-sec-body" id="sec-body-' + sec.id + '" style="display:' + (sp.pct<100?'block':'none') + '">';
    // Lookup actual checkpoint objects
    var libAll = Object.values(OAP_CHECKPOINT_LIBRARY).flat();
    // Also include OAK checkpoints
    var oakTpl = null;
    if (sec.id==='machine'||sec.id==='floor') {
      Object.entries(OAP_OAK_TEMPLATES).forEach(function(e){ if((prog.machines||[]).includes(e[1].machine)) oakTpl=e[1]; });
    }
    var checkpointsToShow = libAll.filter(function(cp){ return cpIds.includes(cp.id); });
    if (oakTpl && (sec.id==='machine'||sec.id==='floor')) {
      checkpointsToShow = checkpointsToShow.concat(oakTpl.checkpoints.filter(function(cp){ return cp.section===sec.id; }));
    }
    checkpointsToShow.forEach(function(cp) {
      var status = mentee.checkpoints[cp.id] || {};
      var done = status.passed;
      h += '<div class="oap-cp-row' + (done?' done':'') + '">';
      h += '<div class="oap-cp-check" onclick="oapSignCP(\'' + menteeId + '\',\'' + cp.id + '\',true)" title="Sign Off">' + (done?'✓':'○') + '</div>';
      h += '<div style="flex:1;min-width:0">';
      h += '<div class="oap-cp-label">' + cp.label + '</div>';
      h += '<div class="oap-cp-meta">';
      h += '<span class="oap-cp-type">' + cp.type + '</span>';
      if (cp.mentorSignOff) h += ' <span class="oap-cp-badge">Mentor</span>';
      if (cp.employerBuyOff) h += ' <span class="oap-cp-badge oap-cp-emp">Buy-Off</span>';
      if (cp.linkedCourse) h += ' <span class="oap-cp-course" onclick="oapRunCourse(\'' + cp.linkedCourse + '\',\'' + menteeId + '\')" title="Take course">📚 Course</span>';
      h += '</div>';
      if (done && status.signedBy) h += '<div class="oap-cp-signed">✓ ' + status.signedBy + ' · ' + new Date(status.signedAt).toLocaleDateString() + '</div>';
      h += '</div>';
      if (!done) h += '<button class="oap-btn-xs" onclick="oapSignCP(\'' + menteeId + '\',\'' + cp.id + '\',true)">Sign</button>';
      else h += '<button class="oap-btn-xs oap-btn-undo" onclick="oapSignCP(\'' + menteeId + '\',\'' + cp.id + '\',false)">Undo</button>';
      h += '</div>';
    });

    // Mentee notes
    h += '<div class="oap-notes-block">';
    h += '<div class="oap-notes-label">Mentee Notes — ' + sec.label + '</div>';
    h += '<textarea class="oap-notes-ta" id="notes-' + menteeId + '-' + sec.id + '" placeholder="Notes, observations, equipment encountered...">' + ((mentee.menteeNotes||{})[sec.id]||'') + '</textarea>';
    h += '<button class="oap-btn-xs" onclick="oapSaveNotes(\'' + menteeId + '\',\'' + sec.id + '\')">Save Notes</button>';
    h += '</div>';

    h += '</div>'; // sec-body
    h += '</div>'; // section-card
  });

  // Machine buy-offs
  if (prog.machines && prog.machines.length) {
    h += '<div class="oap-card"><div class="oap-card-title">🏭 Machine Buy-Offs</div>';
    prog.machines.forEach(function(machId) {
      var mach = OAP_MACHINES[machId] || { label:machId, icon:'🏭' };
      var buyoff = mentee.machineBuyOffs[machId];
      h += '<div class="oap-cp-row' + (buyoff?' done':'') + '">';
      h += '<div class="oap-cp-check">' + (buyoff?'✓':'○') + '</div>';
      h += '<div style="flex:1"><div class="oap-cp-label">' + mach.icon + ' ' + mach.label + '</div>';
      if (buyoff) h += '<div class="oap-cp-signed">Employer buy-off: ' + buyoff.employerName + ' · ' + new Date(buyoff.date).toLocaleDateString() + '</div>';
      h += '</div>';
      if (!buyoff) h += '<button class="oap-btn-sm" onclick="oapBuyOffMachine(\'' + menteeId + '\',\'' + machId + '\')">Buy Off</button>';
      h += '</div>';
    });
    h += '</div>';
  }

  return h;
}

// ── COURSE RUNNER ─────────────────────────────────────────────────
function oapCourseRunner() {
  var courseId  = OAP_STATE.activeCourse;
  var menteeId  = OAP_STATE.activeMentee;
  var course    = OAP_COURSES[courseId];
  if (!course) return '<p>Course not found.</p>';

  var cs = OAP_STATE.courseState;
  if (!cs) {
    // Start
    OAP_STATE.courseState = { topicIdx:0, quizMode:false, score:0, total:0, answers:[], qIdx:0, currentPool:null };
    cs = OAP_STATE.courseState;
  }

  var h = '<div class="oap-page-header"><button class="oap-back" onclick="oapExitCourse()">← Exit Course</button><h1>' + course.icon + ' ' + course.label + '</h1></div>';

  var topic = course.topics[cs.topicIdx];
  if (!topic) {
    // All topics done — show score
    return oapCourseComplete(course, menteeId);
  }

  var pct = Math.round(cs.topicIdx / course.topics.length * 100);
  h += '<div class="oap-course-prog"><div class="oap-course-fill" style="width:' + pct + '%"></div></div>';
  h += '<div class="oap-hint" style="margin-bottom:8px">Topic ' + (cs.topicIdx+1) + ' of ' + course.topics.length + ' · Pass mark: ' + course.passMark + '%</div>';

  h += '<div class="oap-card">';
  h += '<div class="oap-card-title">' + topic.title + '</div>';
  h += '<div class="oap-course-content">' + topic.content + '</div>';
  h += '</div>';

  // Quiz for this topic — supports topic.quizPool (array, randomized subset) or topic.quiz (single)
  if (!cs.quizMode) {
    var poolSize = (topic.quizPool && topic.quizPool.length) || (topic.quiz ? 1 : 0);
    var askCount = Math.min(poolSize, topic.quizCount || (topic.quizPool ? Math.min(3, poolSize) : 1));
    var label = askCount > 1 ? ('Take Quiz (' + askCount + ' questions) →') : 'Take Quiz →';
    h += '<div style="margin-top:12px"><button class="oap-btn-primary" onclick="oapStartTopicQuiz()">' + label + '</button></div>';
  } else {
    if (!cs.currentPool) {
      // build randomized question list for this topic
      var pool = topic.quizPool ? topic.quizPool.slice() : (topic.quiz ? [topic.quiz] : []);
      // Fisher-Yates shuffle
      for (var s = pool.length - 1; s > 0; s--) {
        var r = Math.floor(Math.random() * (s + 1));
        var tmp = pool[s]; pool[s] = pool[r]; pool[r] = tmp;
      }
      var ask = topic.quizCount || (topic.quizPool ? Math.min(3, pool.length) : 1);
      cs.currentPool = pool.slice(0, ask);
      cs.qIdx = 0;
    }
    var q = cs.currentPool[cs.qIdx];
    var letters = ['A','B','C','D'];
    h += '<div class="oap-card" style="margin-top:12px"><div class="oap-card-title">Quiz · Question ' + (cs.qIdx+1) + ' of ' + cs.currentPool.length + '</div>';
    h += '<div class="oap-quiz-q">' + q.q + '</div>';
    h += '<div class="oap-quiz-opts">';
    q.opts.forEach(function(opt, i) {
      h += '<div class="oap-qopt" onclick="oapAnswerCourse(' + i + ',' + q.ans + ',\'' + encodeURIComponent(q.fb) + '\')" id="copt-' + i + '">';
      h += '<span class="oap-qopt-l">' + letters[i] + '</span>' + opt + '</div>';
    });
    h += '</div><div class="oap-quiz-fb" id="course-fb"></div>';
    var isLast = cs.qIdx >= cs.currentPool.length - 1;
    var nextLabel = isLast ? 'Next Topic →' : 'Next Question →';
    h += '<button class="oap-btn-primary" id="course-next-btn" style="display:none" onclick="oapNextQuizQuestion()">' + nextLabel + '</button>';
    h += '</div>';
  }

  return h;
}

function oapStartTopicQuiz() {
  OAP_STATE.courseState.quizMode = true;
  OAP_STATE.courseState.currentPool = null;
  OAP_STATE.courseState.qIdx = 0;
  oapRender();
}

function oapNextQuizQuestion() {
  var cs = OAP_STATE.courseState;
  if (cs.currentPool && cs.qIdx < cs.currentPool.length - 1) {
    cs.qIdx++;
    oapRender();
  } else {
    oapNextTopic();
  }
}

function oapAnswerCourse(idx, ans, fbEnc) {
  var correct = idx === ans;
  var cs = OAP_STATE.courseState;
  cs.answers.push({ idx, ans, correct });
  cs.total++;
  if (correct) cs.score++;
  document.querySelectorAll('.oap-qopt').forEach(function(el){ el.style.pointerEvents='none'; });
  var el = document.getElementById('copt-' + idx); if(el) el.classList.add(correct?'correct':'wrong');
  if (!correct) { var ca = document.getElementById('copt-' + ans); if(ca) ca.classList.add('correct'); }
  var fb = document.getElementById('course-fb');
  if (fb) { fb.textContent = (correct?'✓ ':'✗ ') + decodeURIComponent(fbEnc); fb.className = 'oap-quiz-fb show ' + (correct?'correct':'wrong'); }
  var nb = document.getElementById('course-next-btn'); if(nb) nb.style.display='';
}

function oapNextTopic() {
  OAP_STATE.courseState.topicIdx++;
  OAP_STATE.courseState.quizMode = false;
  OAP_STATE.courseState.currentPool = null;
  OAP_STATE.courseState.qIdx = 0;
  oapRender();
}

function oapCourseComplete(course, menteeId) {
  var cs = OAP_STATE.courseState;
  var score = cs.total ? Math.round(cs.score/cs.total*100) : 100;
  var passed = score >= course.passMark;
  if (menteeId) OAP_EMPLOYER.recordCourseScore(menteeId, course.id, score, passed);

  var h = '<div class="oap-page-header"><button class="oap-back" onclick="oapExitCourse()">← Done</button><h1>' + course.icon + ' ' + course.label + '</h1></div>';
  h += '<div class="oap-card" style="text-align:center;padding:32px 20px">';
  h += '<div style="font-family:var(--oap-head);font-size:60px;font-weight:900;color:' + (passed?'#00e5b0':'#ff4757') + '">' + score + '%</div>';
  h += '<div style="font-size:16px;margin-bottom:16px">' + (passed?'✓ PASSED':'✗ Did Not Pass') + ' · Pass mark ' + course.passMark + '%</div>';
  if (!passed) h += '<div style="font-size:13px;color:#888;margin-bottom:16px">Review the course material and retake to continue.</div>';
  h += '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">';
  if (!passed) h += '<button class="oap-btn-primary" onclick="oapRestartCourse()">Retake Course</button>';
  h += '<button class="oap-btn-ghost" onclick="oapExitCourse()">Back to Operator</button>';
  h += '</div></div>';
  return h;
}

function oapExitCourse() {
  OAP_STATE.courseState = null;
  OAP_STATE.activeCourse = null;
  if (OAP_STATE.activeMentee) { OAP_STATE.subView = 'detail'; OAP_STATE.view = 'mentee'; oapRender(); }
  else { oapSetView('standalone'); }
}

function oapRestartCourse() { OAP_STATE.courseState = null; oapRender(); }

// ── STANDALONE MODE ───────────────────────────────────────────────
function oapStandalone() {
  var h = '<div class="oap-page-header"><button class="oap-back" onclick="oapSetView(\'home\')">← Home</button><h1>🎓 Standalone OAP Certification</h1></div>';
  h += '<div class="oap-card"><p class="oap-hint" style="margin-bottom:14px">Complete all sections independently. Pass all quizzes to earn a portable certificate you can present to any employer. Your scores are saved locally.</p>';

  Object.entries(OAP_COURSES).forEach(function(e) {
    var k=e[0], course=e[1];
    var scores = JSON.parse(localStorage.getItem('oap-standalone-scores')||'{}');
    var score = scores[k];
    var passed = score && score.passed;
    h += '<div class="oap-course-row" onclick="oapRunStandaloneCourse(\'' + k + '\')">';
    h += '<div style="font-size:22px">' + course.icon + '</div>';
    h += '<div style="flex:1"><div class="oap-prog-name">' + course.label + '</div>';
    h += '<div class="oap-hint">' + course.duration + ' · Pass ' + course.passMark + '%</div></div>';
    if (passed) h += '<span style="color:#00e5b0;font-weight:700">✓ ' + score.score + '%</span>';
    else if (score) h += '<span style="color:#ff4757">' + score.score + '%</span>';
    else h += '<span style="color:#566070;font-size:12px">Not started</span>';
    h += '</div>';
  });

  h += '<button class="oap-btn-primary" style="margin-top:14px" onclick="oapGenerateStandaloneCert()">Generate Portable Certificate</button>';
  h += '</div>';
  return h;
}

// ── FORM HELPERS ─────────────────────────────────────────────────
function oapField(label, type, id, val, hintOrOpts) {
  var h = '<div class="oap-field"><label class="oap-label">' + label + '</label>';
  if (type === 'select') {
    h += '<select id="' + id + '" class="oap-select">';
    if (Array.isArray(hintOrOpts)) hintOrOpts.forEach(function(o){ h += '<option value="' + (o.val||o) + '"' + ((o.val||o)===val?' selected':'') + '>' + (o.label||o) + '</option>'; });
    else if (typeof hintOrOpts==='string') h += '<option value="">' + hintOrOpts + '</option>';
    h += '</select>';
  } else {
    h += '<input type="' + type + '" id="' + id + '" class="oap-input" value="' + (val||'') + '"' + (typeof hintOrOpts==='string' && hintOrOpts ? ' placeholder="' + hintOrOpts + '"' : '') + '>';
  }
  h += '</div>';
  return h;
}

// ── ACTIONS ──────────────────────────────────────────────────────
function oapSaveProfile() {
  var data = {
    companyName:  _val('emp-companyName'),
    industry:     _val('emp-industry'),
    contactName:  _val('emp-contactName'),
    contactTitle: _val('emp-contactTitle'),
    email:        _val('emp-email'),
    phone:        _val('emp-phone'),
    city:         _val('emp-city'),
    state:        _val('emp-state'),
    certValidYears: parseInt(_val('emp-certYears'))||2,
    recertWeeks:  parseInt(_val('emp-recert'))||104,
    requireEmployerBuyOff: document.getElementById('emp-buyoff') && document.getElementById('emp-buyoff').checked,
    allowPortableCert:     document.getElementById('emp-portable') && document.getElementById('emp-portable').checked,
  };
  OAP_EMPLOYER.createProfile(data);
  oapSetView('home');
}

function oapSaveProgram() {
  var selectedRole = document.querySelector('.oap-role-card.selected');
  if (!selectedRole) { alert('Please select a role.'); return; }
  var roleId = selectedRole.getAttribute('data-role');
  var sections = OAP_SECTIONS.filter(function(s){ var el=document.getElementById('sec-'+s.id); return el&&el.checked; }).map(function(s){ return s.id; });
  var machines  = _checked('prog-machine');
  var measuring = _checked('prog-measuring');
  var safety    = _checked('prog-safety');
  var schedEl   = document.querySelector('.oap-sched-opt.selected');
  var sched     = schedEl ? schedEl.getAttribute('data-sched') : 'standard_90';
  var checkpoints = {};
  sections.forEach(function(sid){ checkpoints[sid] = (OAP_CHECKPOINT_LIBRARY[sid]||[]).map(function(c){ return c.id; }); });
  if (OAP_STATE.activeProgram) {
    OAP_EMPLOYER.updateProgram(OAP_STATE.activeProgram, { sections, machines, measuring, safetyCerts:safety, scheduleTemplate:sched, checkpoints });
  } else {
    OAP_EMPLOYER.createProgram(roleId, { sections, machines, measuring, safetyCerts:safety, scheduleTemplate:sched, checkpoints });
  }
  OAP_STATE.activeProgram = null;
  oapSetView('program','list');
}

function oapSaveMentor() {
  var data = {
    name:   _val('mentor-name'), title:  _val('mentor-title'),
    email:  _val('mentor-email'), phone: _val('mentor-phone'),
    roles:    _checked('mentor-role'),
    machines: _checked('mentor-machine'),
  };
  if (!data.name) { alert('Name required'); return; }
  OAP_EMPLOYER.addMentor(data);
  oapSetView('mentor','list');
}

function oapEnrollMentee() {
  var progId = _val('ment-progId');
  if (!progId) { alert('Select a program/role.'); return; }
  var prog = OAP_EMPLOYER.getPrograms()[progId];
  var data = {
    name: _val('ment-name'), email: _val('ment-email'), phone: _val('ment-phone'),
    hireDate: _val('ment-hire'), roleId: prog ? prog.roleId : '',
    programId: progId, mentorId: _val('ment-mentorId'),
  };
  if (!data.name) { alert('Name required.'); return; }
  OAP_EMPLOYER.enrollMentee(data);
  oapSetView('home');
}

function oapOpenMentee(id) { OAP_STATE.activeMentee=id; OAP_STATE.subView='detail'; OAP_STATE.view='mentee'; oapRender(); }
function oapEditProgram(id) { OAP_STATE.activeProgram=id; oapSetView('program','edit'); }
function oapSelectRole(k) { document.querySelectorAll('.oap-role-card').forEach(function(el){ el.classList.remove('selected'); el.removeAttribute('data-role'); }); var el=document.getElementById('role-card-'+k); if(el){ el.classList.add('selected'); el.setAttribute('data-role',k); } }
function oapSelectSched(k) { document.querySelectorAll('.oap-sched-opt').forEach(function(el){ el.classList.remove('selected'); el.removeAttribute('data-sched'); }); var el=document.getElementById('sched-'+k); if(el){ el.classList.add('selected'); el.setAttribute('data-sched',k); } }
function oapSelectMenteeProg(id) { document.querySelectorAll('.oap-role-card').forEach(function(el){ el.classList.remove('selected'); }); var el=document.getElementById('mp-'+id); if(el) el.classList.add('selected'); var inp=document.getElementById('ment-progId'); if(inp) inp.value=id; }
function oapToggleSec(id) { var el=document.getElementById('sec-body-'+id); if(el) el.style.display=el.style.display==='none'?'block':'none'; }
function oapSignCP(menteeId,cpId,passed) { OAP_EMPLOYER.signCheckpoint(menteeId,cpId,'Mentor',passed,''); oapMenteeDetail(menteeId); var el=document.getElementById('oap-root'); if(el) el.innerHTML=oapMenteeDetail(menteeId); }
function oapSaveNotes(menteeId,secId) { var ta=document.getElementById('notes-'+menteeId+'-'+secId); if(!ta) return; var mentee=OAP_EMPLOYER.getMentee(menteeId); if(!mentee) return; mentee.menteeNotes=mentee.menteeNotes||{}; mentee.menteeNotes[secId]=ta.value; var mentees=OAP_EMPLOYER.getMentees(); mentees[menteeId]=mentee; OAP_EMPLOYER.saveMentees(mentees); }
function oapBuyOffMachine(menteeId,machId) { var name=prompt('Employer sign-off name:'); if(name) OAP_EMPLOYER.buyOffMachine(menteeId,machId,name,''); oapOpenMentee(menteeId); }
function oapIssueCert(menteeId) { var sig=prompt('Employer authorizing signature (type name):'); if(!sig) return; var cert=OAP_EMPLOYER.issueCertificate(menteeId,sig); if(cert) OAP_CERT.openPrintWindow(cert); oapRender(); }
function oapPrintCert(certId) { var certs=OAP_EMPLOYER.getCerts(); var cert=certs[certId]; if(cert) OAP_CERT.openPrintWindow(cert); }
function oapRunCourse(courseId,menteeId) { OAP_STATE.activeCourse=courseId; OAP_STATE.activeMentee=menteeId||null; OAP_STATE.courseState=null; oapSetView('course'); }
function oapRunStandaloneCourse(courseId) { OAP_STATE.activeCourse=courseId; OAP_STATE.activeMentee=null; OAP_STATE.courseState=null; oapSetView('course'); }
function oapGenerateStandaloneCert() {
  var scores=JSON.parse(localStorage.getItem('oap-standalone-scores')||'{}');
  var passed=Object.values(scores).filter(function(s){ return s.passed; });
  if (!passed.length) { alert('Complete at least one course to generate a certificate.'); return; }
  var name=prompt('Your full name:'); if(!name) return;
  var cert={
    certId:'SA-'+Math.random().toString(36).slice(2,8).toUpperCase(),
    certType:'initial', menteeName:name, menteeEmail:'',
    employerName:'Self-Certified / JobLine OAP',
    employerCity:'Independent',
    roleLabel:'Manufacturing Operator (Self-Certified)',
    machinesPassed:[], toolingPassed:[], measuringPassed:[],
    safetyCerts:Object.keys(scores).filter(function(k){ return scores[k].passed; }),
    mentorName:'Self-Directed',
    employerSignature:'JobLine OAP Platform',
    issuedDate:new Date().toISOString(),
    expiresDate:new Date(Date.now()+2*365.25*24*3600*1000).toISOString(),
    checkpoints:{},
  };
  OAP_CERT.openPrintWindow(cert);
}

// ── UTILS ─────────────────────────────────────────────────────────
function _val(id) { var el=document.getElementById(id); return el?(el.value||''):''; }
function _checked(cls) { return [].slice.call(document.querySelectorAll('.'+cls+':checked')).map(function(el){ return el.value; }); }
