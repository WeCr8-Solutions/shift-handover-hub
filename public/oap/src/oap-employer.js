// ═══════════════════════════════════════════════════════════════════
// OAP-EMPLOYER.JS — Employer Center
// Business profile, OAP configuration, role setup, schedule,
// mentor management
// WeCr8 Solutions LLC | JobLine.ai | v1.0.0
// ═══════════════════════════════════════════════════════════════════

'use strict';

const OAP_EMPLOYER = {

  // ── STORAGE KEYS ────────────────────────────────────────────────
  _keys: {
    profile:   'oap-employer-profile',
    programs:  'oap-employer-programs',
    mentors:   'oap-employer-mentors',
    mentees:   'oap-employer-mentees',
    certs:     'oap-certs',
  },

  // ── LOAD / SAVE ──────────────────────────────────────────────────
  getProfile()           { return this._load(this._keys.profile)   || null; },
  getPrograms()          { return this._load(this._keys.programs)  || {}; },
  getMentors()           { return this._load(this._keys.mentors)   || {}; },
  getMentees()           { return this._load(this._keys.mentees)   || {}; },
  getCerts()             { return this._load(this._keys.certs)     || {}; },
  saveProfile(p)         { this._save(this._keys.profile,  p); },
  savePrograms(p)        { this._save(this._keys.programs, p); },
  saveMentors(m)         { this._save(this._keys.mentors,  m); },
  saveMentees(m)         { this._save(this._keys.mentees,  m); },
  saveCerts(c)           { this._save(this._keys.certs,    c); },

  // ── EMPLOYER PROFILE ────────────────────────────────────────────
  // @returns {Object} employer business profile
  createProfile(data) {
    var p = {
      id:           'emp-' + Date.now(),
      companyName:  data.companyName   || '',
      industry:     data.industry      || '',
      address:      data.address       || '',
      city:         data.city          || '',
      state:        data.state         || '',
      zip:          data.zip           || '',
      phone:        data.phone         || '',
      email:        data.email         || '',
      website:      data.website       || '',
      contactName:  data.contactName   || '',
      contactTitle: data.contactTitle  || '',
      // OAP program settings
      oapEnabled:   true,
      certValidYears: data.certValidYears || 2,
      recertWeeks:  data.recertWeeks   || 104, // 2 years
      requireEmployerBuyOff: data.requireEmployerBuyOff !== false,
      allowPortableCert: data.allowPortableCert !== false,
      logoData:     data.logoData      || null, // base64 for cert
      createdAt:    new Date().toISOString(),
      updatedAt:    new Date().toISOString(),
    };
    this.saveProfile(p);
    return p;
  },

  updateProfile(data) {
    var p = Object.assign(this.getProfile() || {}, data, { updatedAt: new Date().toISOString() });
    this.saveProfile(p);
    return p;
  },

  // ── OAP PROGRAM CREATION ─────────────────────────────────────────
  // An employer creates a "program" for each role they hire for.
  // @param {string} roleId   — OAP_ROLES key
  // @param {Object} config   — sections, checkpoints, schedule, required equipment
  createProgram(roleId, config) {
    var programs = this.getPrograms();
    var progId = 'prog-' + roleId + '-' + Date.now();
    programs[progId] = {
      id:          progId,
      roleId:      roleId,
      roleLabel:   OAP_ROLES[roleId] ? OAP_ROLES[roleId].label : config.roleLabel || roleId,
      // Which sections are active for this role
      sections:    config.sections    || ['orientation','safety','materials','measuring','tooling','machine','floor'],
      // Employer-selected checkpoints per section
      checkpoints: config.checkpoints || this._defaultCheckpoints(roleId),
      // Which machines this role will be qualified on
      machines:    config.machines    || [],
      // Which measuring tools required
      measuring:   config.measuring   || [],
      // Which tooling to be familiar with
      tooling:     config.tooling     || [],
      // Which safety certs required
      safetyCerts: config.safetyCerts || ['shop_safety','ppe_cert','lockout_tagout','fire_ext','hazcom'],
      // Which OAK template to use
      oakTemplate: config.oakTemplate || null,
      // Custom OAK checkpoints (employer-added)
      oakCustom:   config.oakCustom   || [],
      // Schedule template
      scheduleTemplate: config.scheduleTemplate || 'standard_90',
      customSchedule:   config.customSchedule   || null,
      passMark:    config.passMark    || 80,
      active:      true,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    };
    this.savePrograms(programs);
    return programs[progId];
  },

  updateProgram(progId, data) {
    var programs = this.getPrograms();
    if (!programs[progId]) return null;
    programs[progId] = Object.assign(programs[progId], data, { updatedAt: new Date().toISOString() });
    this.savePrograms(programs);
    return programs[progId];
  },

  _defaultCheckpoints(roleId) {
    var role = OAP_ROLES[roleId];
    var track = role ? role.track : 'lathe';
    var base = {};
    // Always include all orientation + safety checkpoints
    base.orientation = (OAP_CHECKPOINT_LIBRARY.orientation || []).map(function(c){ return c.id; });
    base.safety      = (OAP_CHECKPOINT_LIBRARY.safety      || []).map(function(c){ return c.id; });
    base.materials   = (OAP_CHECKPOINT_LIBRARY.materials   || []).map(function(c){ return c.id; });
    base.measuring   = (OAP_CHECKPOINT_LIBRARY.measuring   || []).map(function(c){ return c.id; });
    base.tooling     = (OAP_CHECKPOINT_LIBRARY.tooling     || []).map(function(c){ return c.id; });
    return base;
  },

  // ── MENTOR MANAGEMENT ────────────────────────────────────────────
  addMentor(data) {
    var mentors = this.getMentors();
    var mentorId = 'mentor-' + Date.now();
    mentors[mentorId] = {
      id:        mentorId,
      name:      data.name      || '',
      title:     data.title     || '',
      email:     data.email     || '',
      phone:     data.phone     || '',
      roles:     data.roles     || [],   // which OAP_ROLES they can mentor
      machines:  data.machines  || [],   // which machines they are certified to sign off
      // Mentor credentials
      certifiedBy: data.certifiedBy || '',
      certDate:    data.certDate    || '',
      active:    true,
      createdAt: new Date().toISOString(),
    };
    this.saveMentors(mentors);
    return mentors[mentorId];
  },

  // ── MENTEE ENROLLMENT ────────────────────────────────────────────
  enrollMentee(data) {
    var mentees = this.getMentees();
    var menteeId = 'mentee-' + Date.now();
    var prog = data.programId ? this.getPrograms()[data.programId] : null;
    mentees[menteeId] = {
      id:         menteeId,
      name:       data.name       || '',
      email:      data.email      || '',
      phone:      data.phone      || '',
      hireDate:   data.hireDate   || new Date().toISOString().slice(0,10),
      roleId:     data.roleId     || '',
      programId:  data.programId  || '',
      mentorId:   data.mentorId   || '',
      employerId: (this.getProfile() || {}).id || '',
      // Progress tracking
      status:     OAP_STATUS.IN_PROGRESS,
      currentSection: 'orientation',
      // Checkpoint completion: { checkpointId: { status, signedBy, signedAt, menteeNotes, mentorNotes } }
      checkpoints: {},
      // Section completion dates
      sectionDates: {},
      // Test scores
      courseScores: {},
      // Equipment sign-offs: { equipId: { signedBy, signedAt, notes } }
      equipSignOffs: {},
      // Machine buy-offs: { machineId: { mentorSignOff, employerBuyOff, date, notes } }
      machineBuyOffs: {},
      // Mentee notes (free form per section)
      menteeNotes: {},
      // Final cert
      certId: null,
      enrolledAt: new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    };
    this.saveMentees(mentees);
    return mentees[menteeId];
  },

  getMentee(menteeId) {
    return (this.getMentees())[menteeId] || null;
  },

  updateMentee(menteeId, data) {
    var mentees = this.getMentees();
    if (!mentees[menteeId]) return null;
    mentees[menteeId] = Object.assign(mentees[menteeId], data, { updatedAt: new Date().toISOString() });
    this.saveMentees(mentees);
    return mentees[menteeId];
  },

  // Sign off a checkpoint (mentor action)
  signCheckpoint(menteeId, checkpointId, signedBy, passed, notes) {
    var mentee = this.getMentee(menteeId);
    if (!mentee) return false;
    mentee.checkpoints[checkpointId] = {
      status:    passed ? OAP_STATUS.COMPLETE : OAP_STATUS.FAILED,
      signedBy:  signedBy,
      signedAt:  new Date().toISOString(),
      passed:    passed,
      notes:     notes || '',
    };
    mentee.updatedAt = new Date().toISOString();
    var mentees = this.getMentees();
    mentees[menteeId] = mentee;
    this.saveMentees(mentees);
    return mentee;
  },

  // Buy-off a machine (employer final action)
  buyOffMachine(menteeId, machineId, employerName, notes) {
    var mentee = this.getMentee(menteeId);
    if (!mentee) return false;
    mentee.machineBuyOffs[machineId] = {
      mentorSignOff:   true,
      employerBuyOff:  true,
      employerName:    employerName,
      date:            new Date().toISOString(),
      notes:           notes || '',
    };
    mentee.updatedAt = new Date().toISOString();
    var mentees = this.getMentees();
    mentees[menteeId] = mentee;
    this.saveMentees(mentees);
    return mentee;
  },

  // Add mentee equipment sign-off
  signEquipment(menteeId, equipId, signedBy, notes) {
    var mentee = this.getMentee(menteeId);
    if (!mentee) return false;
    mentee.equipSignOffs[equipId] = { signedBy, signedAt: new Date().toISOString(), notes: notes||'' };
    var mentees = this.getMentees();
    mentees[menteeId] = mentee;
    this.saveMentees(mentees);
    return mentee;
  },

  // Record a course score
  recordCourseScore(menteeId, courseId, score, passed) {
    var mentee = this.getMentee(menteeId);
    if (!mentee) return false;
    var existing = mentee.courseScores[courseId] || {};
    mentee.courseScores[courseId] = {
      score, passed,
      attempts:  (existing.attempts || 0) + 1,
      bestScore: Math.max(existing.bestScore || 0, score),
      lastAt:    new Date().toISOString(),
      passedAt:  (passed && !existing.passedAt) ? new Date().toISOString() : existing.passedAt,
    };
    var mentees = this.getMentees();
    mentees[menteeId] = mentee;
    this.saveMentees(mentees);
    return mentee;
  },

  // Compute section completion % for a mentee
  getSectionProgress(menteeId) {
    var mentee = this.getMentee(menteeId);
    if (!mentee) return {};
    var prog = this.getPrograms()[mentee.programId];
    if (!prog) return {};
    var result = {};
    OAP_SECTIONS.forEach(function(sec) {
      var cpIds = prog.checkpoints[sec.id] || [];
      if (!cpIds.length) { result[sec.id] = { pct:0, done:0, total:0, unlocked:false }; return; }
      var done = cpIds.filter(function(id){ return mentee.checkpoints[id] && mentee.checkpoints[id].passed; }).length;
      // Section is unlocked if all required-before sections are 100%
      var unlocked = (sec.requiredBefore || []).every(function(req){
        return result[req] && result[req].pct === 100;
      }) || sec.requiredBefore.length === 0;
      result[sec.id] = { pct: Math.round(done/cpIds.length*100), done, total: cpIds.length, unlocked };
    });
    return result;
  },

  // ── CERTIFICATE ISSUANCE ─────────────────────────────────────────
  issueCertificate(menteeId, employerSignature) {
    var mentee = this.getMentee(menteeId);
    var profile = this.getProfile();
    var programs = this.getPrograms();
    var mentors  = this.getMentors();
    if (!mentee || !profile) return null;

    var prog   = programs[mentee.programId] || {};
    var mentor = mentors[mentee.mentorId]   || {};

    var certId = 'CERT-' + Math.random().toString(36).slice(2,8).toUpperCase() + '-' + new Date().getFullYear();
    var issued = new Date().toISOString();
    var expires = new Date(Date.now() + (profile.certValidYears||2) * 365.25*24*3600*1000).toISOString();

    // Collect what was passed
    var machinesPassed  = Object.keys(mentee.machineBuyOffs).filter(function(k){ return mentee.machineBuyOffs[k].employerBuyOff; });
    var equipPassed     = Object.keys(mentee.equipSignOffs);
    var safetyCertsDone = (prog.safetyCerts||[]).filter(function(sc){ return mentee.courseScores['safety_'+sc] && mentee.courseScores['safety_'+sc].passed; });

    var cert = {
      certId,
      certType:    'initial',
      menteeId,
      menteeName:  mentee.name,
      menteeEmail: mentee.email,
      employerId:  profile.id,
      employerName: profile.companyName,
      employerCity: profile.city + ', ' + profile.state,
      roleId:      mentee.roleId,
      roleLabel:   prog.roleLabel || (OAP_ROLES[mentee.roleId]||{}).label || '',
      machinesPassed,
      toolingPassed:   equipPassed.filter(function(id){ return OAP_TOOLING[id]; }),
      measuringPassed: equipPassed.filter(function(id){ return OAP_MEASURING[id]; }),
      safetyCerts:     safetyCertsDone,
      mentorName:      mentor.name || '',
      mentorTitle:     mentor.title || '',
      employerSignature: employerSignature || profile.contactName,
      issuedDate:   issued,
      expiresDate:  expires,
      checkpoints:  mentee.checkpoints,
      // Portable verification string
      qrPayload:    JSON.stringify({ certId, menteeName: mentee.name, employerName: profile.companyName, roleLabel: prog.roleLabel, issuedDate: issued, machinesPassed }),
      issuedAt:     issued,
    };

    var certs = this.getCerts();
    certs[certId] = cert;
    this.saveCerts(certs);

    // Update mentee record
    this.updateMentee(menteeId, { certId, status: OAP_STATUS.COMPLETE });

    return cert;
  },

  // ── RECERTIFICATION ──────────────────────────────────────────────
  issueRecert(originalCertId, employerSignature) {
    var certs  = this.getCerts();
    var orig   = certs[originalCertId];
    if (!orig) return null;
    var recert = Object.assign({}, orig, {
      certId:   'RECERT-' + Math.random().toString(36).slice(2,8).toUpperCase() + '-' + new Date().getFullYear(),
      certType: 'recert',
      originalCertId: originalCertId,
      issuedDate:  new Date().toISOString(),
      expiresDate: new Date(Date.now() + 2*365.25*24*3600*1000).toISOString(),
      employerSignature: employerSignature,
      issuedAt: new Date().toISOString(),
    });
    certs[recert.certId] = recert;
    this.saveCerts(certs);
    return recert;
  },

  // ── PERSISTENCE ──────────────────────────────────────────────────
  _load(key) { try { var r=localStorage.getItem(key); return r?JSON.parse(r):null; } catch(e){ return null; } },
  _save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){} },

  // Export mentee portable record (for resume/job change)
  exportPortableRecord(menteeId) {
    var mentee = this.getMentee(menteeId);
    var certs  = this.getCerts();
    if (!mentee) return null;
    var cert = mentee.certId ? certs[mentee.certId] : null;
    return {
      exportedAt:  new Date().toISOString(),
      version:     '1.0',
      mentee:      { name: mentee.name, email: mentee.email },
      certificates: cert ? [cert] : [],
      machinesPassed: cert ? cert.machinesPassed : [],
      measuringPassed: cert ? cert.measuringPassed : [],
      toolingPassed:  cert ? cert.toolingPassed   : [],
      safetyCerts:    cert ? cert.safetyCerts      : [],
      courseScores:   mentee.courseScores,
    };
  },
};
