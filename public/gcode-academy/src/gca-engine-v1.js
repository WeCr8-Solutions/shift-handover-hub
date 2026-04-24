// ═══════════════════════════════════════════════════════════════════
// GCA ENGINE v1.0.0 | WeCr8 Solutions LLC
// Depends on: GCA_CONFIG, GCA_AUTH, GCA_SYMBOLS, GCA_META,
//             CURRICULUM, GCA_TESTS
// ═══════════════════════════════════════════════════════════════════

const STATE = {
  view: 'lathe', track: 'lathe', level: 'beginner',
  activeLesson: null, testCat: 'all',
  activeTest: null, testState: null, authMode: 'login',
};

function openJobLinePath(path) {
  var target = path || '/';
  try {
    if (window.top && window.top.location && window.top.location.origin === window.location.origin) {
      window.top.location.href = target;
      return;
    }
  } catch (error) {
    // Fall back to same-frame navigation when top is unavailable.
  }
  window.location.href = target;
}

window.addEventListener('DOMContentLoaded', async () => {
  GCA_CONFIG.injectTokens();
  applyTenantBranding();
  await GCA_AUTH.init();
  GCA_AUTH.onChange(() => renderAuthState());
  renderAuthState();
  if (!GCA_CONFIG.active.features.changelog) {
    const cl = document.getElementById('pill-cl');
    if (cl) cl.style.display = 'none';
  }
  document.getElementById('ver-display').textContent = GCA_META.version;
  setView('lathe');
});

function applyTenantBranding() {
  const t = GCA_CONFIG.active;
  document.title = t.productName + ' | ' + t.brand;
  const tb = document.getElementById('tenant-badge');
  if (tb) tb.textContent = t.domain;
  const fb = document.getElementById('footer-brand');
  if (fb) fb.textContent = t.productName;
  const fl = document.getElementById('footer-links');
  if (fl) fl.innerHTML = t.footerLinks.map(l => '<a href="' + l.href + '">' + l.label + '</a>').join(' &nbsp;&middot;&nbsp; ');
  const p = t.pricing;
  const pm = document.getElementById('price-monthly'); if (pm) pm.textContent = p.monthly.price;
  const pperiod = document.getElementById('period-monthly'); if (pperiod) pperiod.textContent = p.monthly.period;
  const pa = document.getElementById('price-annual'); if (pa) pa.textContent = p.annual.price;
  const paperiod = document.getElementById('period-annual'); if (paperiod) paperiod.textContent = p.annual.period;
  const psav = document.getElementById('price-savings'); if (psav) psav.textContent = p.annual.savings;
  const pcta = document.getElementById('pro-cta-btn'); if (pcta) pcta.textContent = p.cta;
  const pnote = document.getElementById('pro-modal-note'); if (pnote) pnote.textContent = p.contactNote;
}

function renderAuthState() {
  const user = GCA_AUTH.getUser();
  const btn = document.getElementById('auth-btn');
  if (!btn) return;
  if (user) {
    btn.className = 'auth-btn logged-in';
    const initial = (user.name || user.email || 'U')[0].toUpperCase();
    btn.innerHTML = '<span class="auth-avatar">' + initial + '</span><span>' + (user.name || 'Account') + '</span>';
  } else {
    btn.className = 'auth-btn';
    btn.innerHTML = '<span>Sign In</span>';
  }
}

function setView(v) {
  STATE.view = v;
  if (v === 'lathe' || v === 'mill') STATE.track = v;
  ['lathe','mill','gdnt','test','progress'].forEach(function(k) {
    var el = document.getElementById('hb-' + k);
    if (el) el.className = 'h-btn' + (k === v ? ' sel-' + k : '');
  });
  document.getElementById('level-nav').style.display = (v === 'lathe' || v === 'mill') ? '' : 'none';
  document.getElementById('test-nav').style.display  = (v === 'test') ? '' : 'none';
  // When entering test view, reset to ALL tab
  if (v === 'test') {
    STATE.testCat = 'all';
    ['all','controllers','machines','gdnt','interview','lesson'].forEach(function(k) {
      var el = document.getElementById('tn-' + k); if (el) el.className = 'nav-tab' + (k === 'all' ? ' a-test' : '');
    });
  }
  if (v !== 'lathe' && v !== 'mill' && v !== 'test') document.getElementById('sidebar').innerHTML = '';
  if      (v === 'lathe' || v === 'mill') renderCurriculumView();
  else if (v === 'gdnt')     renderGDnTView();
  else if (v === 'test')     renderTestCenter();
  else if (v === 'progress') renderProgressView();
}

function setLevel(l) {
  STATE.level = l; STATE.activeLesson = null;
  const pillMap = {beginner:'beg', intermediate:'int', advanced:'adv', automation:'auto'};
  Object.entries(pillMap).forEach(function(entry) {
    const p = document.getElementById('pill-' + entry[1]);
    if (p) p.className = 'nav-tab' + (entry[0] === l ? ' a-' + entry[1] : '');
  });
  const cl = document.getElementById('pill-cl');
  if (cl) cl.className = 'nav-tab' + (l === 'changelog' ? ' a-test' : '');
  renderCurriculumView();
}

function sufOf(l) { return ({beginner:'beg', intermediate:'int', advanced:'adv', automation:'auto'})[l] || 'beg'; }
function colOf(l) { return ({beginner:'var(--beg)', intermediate:'var(--int)', advanced:'var(--adv)', automation:'var(--auto)'})[l] || 'var(--beg)'; }

function renderCurriculumView() {
  if (STATE.level === 'changelog') { renderChangelog(); return; }
  renderSidebar(); renderLessons();
}

function renderSidebar() {
  const levels = ['beginner','intermediate','advanced','automation'];
  const lm = GCA_META.levels;
  let html = '<div class="sb-head" style="color:' + GCA_META.tracks[STATE.track].color + '">' + GCA_META.tracks[STATE.track].icon + ' ' + STATE.track.toUpperCase() + ' TRACK</div>';
  levels.forEach(function(lv) {
    const d = CURRICULUM[STATE.track][lv];
    const suf = sufOf(lv);
    const col = lm[lv].color;
    html += '<div class="sb-section" style="color:' + col + '"><span class="lvl-dot" style="background:' + col + '"></span>' + lm[lv].label + '</div>';
    d.lessons.forEach(function(ls, i) {
      const isAct = (lv === STATE.level && STATE.activeLesson === ls.id);
      const done  = GCA_AUTH.isLessonComplete(ls.id);
      const simple = /^(INTRO|SAFETY|ANATOMY|POWER ON|PANEL|SETUP|RUN|ALARMS|COOLANT|TOOLING|WORKHOLDING|FULL PROG|HAND PROG|MDI|SPEEDS & FEEDS|PROBING|ADAPTIVE|MTConnect|DIGITAL TWIN|PALLET|PMC\/PLC|AI\+CNC|MACRO B|POCKET|TCPC)$/.test(ls.gcode);
      const label = simple ? ls.title.split(' ').slice(0,5).join(' ') : (ls.gcode + ' — ' + ls.title.split(' ').slice(0,3).join(' '));
      html += '<div class="sb-item' + (isAct ? ' act-' + suf : '') + '" onclick="openLesson(\'' + lv + '\',\'' + ls.id + '\')">';
      html += '<span class="sb-num">' + String(i+1).padStart(2,'0') + '</span>';
      html += '<span style="flex:1;font-size:11px;line-height:1.3">' + label + '</span>';
      html += (done ? '<span class="sb-check">\u2713</span>' : (!ls.free ? '<span class="sb-lock">\u26a1</span>' : ''));
      html += '</div>';
    });
  });
  const lvL = CURRICULUM[STATE.track][STATE.level] ? CURRICULUM[STATE.track][STATE.level].lessons : [];
  const dc = lvL.filter(function(l) { return GCA_AUTH.isLessonComplete(l.id); }).length;
  html += '<div class="sb-prog"><div class="sb-prog-label"><span>Level Progress</span><span>' + dc + '/' + lvL.length + '</span></div>';
  html += '<div class="prog-bar"><div class="prog-fill" style="width:' + (lvL.length ? Math.round(dc/lvL.length*100) : 0) + '%;background:' + colOf(STATE.level) + '"></div></div></div>';
  document.getElementById('sidebar').innerHTML = html;
}

function renderTestSidebar() {
  var html = '<div class="sb-head" style="color:var(--gold)">🎯 TEST CENTER</div>';
  var sections = [
    { key: 'all', label: 'All Tests', meta: 'Overview' },
    { key: 'controllers', label: 'Controller Tests', meta: Object.keys(GCA_TESTS.controllers).length + ' banks' },
    { key: 'machines', label: 'Machine Type', meta: Object.keys(GCA_TESTS.machines).length + ' banks' },
    { key: 'gdnt', label: 'GD&T', meta: '1 specialty test' },
    { key: 'interview', label: 'Interview Prep', meta: '1 timed bank' },
    { key: 'lesson', label: 'Lesson Quizzes', meta: 'Embedded checks' }
  ];
  html += '<div class="sb-section" style="color:var(--gold)"><span class="lvl-dot" style="background:var(--gold)"></span>Categories</div>';
  sections.forEach(function(section) {
    var active = (STATE.testCat || 'all') === section.key && !STATE.activeTest;
    html += '<div class="sb-item' + (active ? ' act-test' : '') + '" onclick="setTestCat(\'' + section.key + '\')">';
    html += '<span style="flex:1"><span style="display:block;font-size:11px;line-height:1.3">' + section.label + '</span><span style="display:block;font-size:9px;color:var(--muted);margin-top:2px">' + section.meta + '</span></span>';
    html += '</div>';
  });
  if (STATE.activeTest && STATE.testState) {
    var qs = STATE.testState.questions || [];
    var idx = STATE.testState.idx || 0;
    var answered = STATE.testState.answers ? Object.keys(STATE.testState.answers).length : 0;
    html += '<div class="sb-section" style="color:var(--gold)"><span class="lvl-dot" style="background:var(--gold)"></span>Active Test</div>';
    html += '<div class="sb-prog"><div class="sb-prog-label"><span>' + (STATE.activeTest.label || 'Current Test') + '</span><span>' + Math.min(idx + 1, qs.length) + '/' + qs.length + '</span></div>';
    html += '<div class="prog-bar"><div class="prog-fill" style="width:' + (qs.length ? Math.round((idx + 1) / qs.length * 100) : 0) + '%;background:var(--gold)"></div></div>';
    html += '<div style="font-size:10px;color:var(--muted);margin-top:7px">Answered: ' + answered + ' · Best score saved locally</div>';
    html += '<div style="margin-top:8px"><button class="btn-back" style="width:100%" onclick="exitTest()">← Exit Test</button></div></div>';
  }
  document.getElementById('sidebar').innerHTML = html;
}

function openLesson(lv, id) {
  if (lv !== STATE.level) { STATE.level = lv; STATE.activeLesson = id; setLevel(lv); }
  else { STATE.activeLesson = id; renderSidebar(); setTimeout(function() { var el = document.getElementById('card-' + id); if (el) el.scrollIntoView({behavior:'smooth',block:'start'}); }, 60); }
}

function renderLessons() {
  const data = CURRICULUM[STATE.track][STATE.level];
  const suf = sufOf(STATE.level);
  const lv = GCA_META.levels[STATE.level];
  const tb = STATE.track === 'lathe' ? '<span class="badge b-lathe">LATHE</span>' : '<span class="badge b-mill">MILL</span>';
  const rev = 'v' + GCA_META.version + ' \u00b7 ' + GCA_META.changelog[0].date;
  let html = '<div class="lvl-banner ' + suf + '"><div class="banner-ico">' + lv.icon + '</div><div class="banner-body">';
  html += '<div class="banner-lv" style="color:' + lv.color + '">' + lv.label.toUpperCase() + ' \u00b7 ' + GCA_META.tracks[STATE.track].label + '</div>';
  html += '<div class="banner-title">' + data.title + '</div><div class="banner-sub">' + data.subtitle + '</div></div>';
  html += '<div class="banner-right"><div style="color:' + lv.color + ';font-family:var(--mono);font-size:11px">' + data.lessons.filter(function(l){return l.free;}).length + ' Free</div>';
  html += '<div>' + data.lessons.length + ' Total</div><div style="font-size:9px;margin-top:3px;color:var(--muted)">' + rev + '</div></div></div>';
  data.lessons.forEach(function(ls) {
    html += (ls.pro && !ls.free) ? renderLockedCard(ls, suf, tb, lv.color) : renderLessonCard(ls, suf, tb, lv.color);
  });
  document.getElementById('content').innerHTML = html;
  if (!STATE.activeLesson) { var f = data.lessons.find(function(l){return l.free;}); if (f) STATE.activeLesson = f.id; }
  if (STATE.activeLesson) { setTimeout(function() { var el = document.getElementById('card-' + STATE.activeLesson); if (el) el.scrollIntoView({behavior:'smooth',block:'start'}); }, 80); }
}

function renderLessonCard(ls, suf, tb, color) {
  const done = GCA_AUTH.isLessonComplete(ls.id);
  const fb = ls.free ? '<span class="badge b-free">FREE</span>' : '<span class="badge b-pro">PRO</span>';
  const lb = '<span class="badge b-' + suf + '">' + ({beg:'BEG',int:'INT',adv:'ADV',auto:'AUTO'})[suf] + '</span>';
  const rv = ls.rev ? '<span class="badge" style="background:rgba(100,100,100,.08);color:var(--muted);border:1px solid var(--border)">r' + ls.rev + '</span>' : '';
  const tabs = [];
  if (ls.theory) tabs.push('theory');
  if (ls.code && ls.code.length) tabs.push('code');
  if (ls.calc) tabs.push('calc');
  if (ls.quiz) tabs.push('quiz');
  const tabsHtml = '<div class="tabs">' + tabs.map(function(t,i){ return '<div class="tab' + (i===0?' active':'') + '" onclick="switchTab(this,\'' + ls.id + '\',\'' + t + '\')">' + t.charAt(0).toUpperCase() + t.slice(1) + '</div>'; }).join('') + '</div>';
  let bodies = '';
  if (ls.theory) {
    bodies += '<div class="tab-content active" data-tab="' + ls.id + '-theory"><div class="desc">' + ls.theory + '</div>';
    if (ls.table) bodies += buildTable(ls.table);
    if (ls.table2) bodies += buildTable(ls.table2);
    if (ls.tip) bodies += '<div class="tip-box"><strong>\ud83d\udca1 Tip:</strong> ' + ls.tip + '</div>';
    if (ls.warn) bodies += '<div class="warn-box"><strong>\u26a0 Warning:</strong> ' + ls.warn + '</div>';
    if (ls.auto_note) bodies += '<div class="auto-box"><strong>\ud83e\udd16 Automation Note:</strong> ' + ls.auto_note + '</div>';
    if (ls.steps) bodies += buildSteps(ls.steps);
    bodies += '</div>';
  }
  if (ls.code) {
    bodies += '<div class="tab-content" data-tab="' + ls.id + '-code">';
    ls.code.forEach(function(blk, bi) {
      const cid = 'c-' + ls.id + '-' + bi;
      bodies += '<div class="code-block"><div class="cb-head"><span class="cb-fn">' + blk.file + '</span><button class="copy-btn" onclick="copyCode(this,\'' + cid + '\')">COPY</button></div><div class="cb-lines" id="' + cid + '">';
      blk.lines.forEach(function(line) { bodies += '<div class="cl"><span class="ln">' + line[0] + '</span><span>' + line[1] + '</span></div>'; });
      bodies += '</div></div>';
    });
    bodies += '</div>';
  }
  if (ls.calc) bodies += '<div class="tab-content" data-tab="' + ls.id + '-calc">' + buildCalc(ls.id) + '</div>';
  if (ls.quiz) bodies += buildQuizBlock(ls.id, ls.quiz);
  const doneStyle = done ? ' style="border-color:rgba(0,229,176,.2)"' : '';
  return '<div class="lcard"' + doneStyle + ' id="card-' + ls.id + '"><div class="lc-head"><div class="lc-info"><div class="lc-gc" style="color:' + color + '">' + ls.gcode + '</div><div class="lc-title">' + ls.title + (done ? ' <span style="color:var(--green);font-size:13px">\u2713</span>' : '') + '</div><div class="lc-sub">' + ls.sub + '</div></div><div class="badges">' + fb + lb + tb + rv + '</div></div><div class="lc-body">' + tabsHtml + bodies + '</div></div>';
}

function renderLockedCard(ls, suf, tb, color) {
  const feats = ({beginner:['Coolant Selection','Tooling Recognition','Workholding Basics'],intermediate:['G71/G70 Cycles','G76 Threading','G84 Tapping','G02/G03 Arcs','Multi-WCS'],advanced:['Contour Programming','Macro Variables','Subprograms','4th Axis','Full Programs'],automation:['Macro B Logic','In-Process Probing','Bar Feeder','MTConnect','AI+CNC']})[STATE.level] || [];
  return '<div class="lcard" id="card-' + ls.id + '" style="opacity:.6"><div class="lc-head"><div class="lc-info"><div class="lc-gc" style="color:var(--gold);font-size:13px">\u26a1 ' + ls.gcode + '</div><div class="lc-title">' + ls.title + '</div><div class="lc-sub">' + ls.sub + '</div></div><div class="badges"><span class="badge b-pro">PRO</span>' + tb + '</div></div><div class="lc-body"><div class="pro-gate"><h3>\ud83d\udd12 Pro Content</h3><p>Unlock all ' + GCA_META.levels[STATE.level].label + ' lessons across both tracks and all four levels.</p><div class="pro-feats">' + feats.map(function(f){return '<span class="pro-feat">'+f+'</span>';}).join('') + '</div><button class="pg-btn" onclick="showModal(\'pro\')">' + GCA_CONFIG.active.pricing.cta + '</button></div></div></div>';
}

function renderGDnTView() {
  document.getElementById('sidebar').innerHTML = '';
  let html = '<div class="lvl-banner gdnt"><div class="banner-ico">\ud83d\udccf</div><div class="banner-body"><div class="banner-lv" style="color:var(--purple)">GD&amp;T \u00b7 ASME Y14.5-2018</div><div class="banner-title">Geometric Dimensioning &amp; Tolerancing</div><div class="banner-sub">Proper SVG symbol pack \u00b7 All 14 characteristics + modifiers</div></div><div class="banner-right"><div style="color:var(--purple);font-family:var(--mono);font-size:11px">' + GCA_SYMBOLS._order.length + ' Symbols</div></div></div>';
  html += '<div class="lcard"><div class="lc-head"><div class="lc-info"><div class="lc-gc" style="color:var(--purple)">SYMBOLS</div><div class="lc-title">GD&amp;T Symbol Reference \u2014 ASME Y14.5-2018</div><div class="lc-sub">Proper engineering SVG symbols \u00b7 hover for standard reference</div></div></div><div class="lc-body"><div class="desc">All 14 GD&T characteristics grouped by type. Form tolerances require no datum. Orientation, Location, and Runout require at least one datum reference. \u2020 symbols were removed in ASME Y14.5-2018 but remain in active industry use.</div>';
  Object.entries(GCA_SYMBOLS._groups).forEach(function(entry) {
    const group = entry[0], keys = entry[1];
    html += '<div class="gdnt-group"><div class="gdnt-group-title">' + group + '</div><div class="sym-grid">';
    keys.forEach(function(key) {
      const sym = GCA_SYMBOLS[key]; if (!sym) return;
      html += '<div class="sym-card' + (sym.deprecated ? ' deprecated' : '') + '" title="' + sym.standard + '">';
      if (sym.deprecated) html += '<span class="sym-depr">\u20202009</span>';
      html += '<div class="sym-svg">' + sym.svg + '</div>';
      html += '<div class="sym-name">' + sym.name + '</div>';
      html += '<div class="sym-type">' + sym.type + '</div>';
      html += '<div class="sym-datum-tag ' + (sym.datumReq ? 'req' : 'no') + '">' + (sym.datumReq ? '\u2713 Datum req.' : 'No datum') + '</div></div>';
    });
    html += '</div></div>';
  });
  html += buildTable([['Type','Characteristics','Datum Required?'],['Form','Straightness, Flatness, Circularity, Cylindricity','No \u2014 self-contained'],['Profile','Profile of a Line, Profile of a Surface','Optional (with or without datum)'],['Orientation','Angularity, Perpendicularity, Parallelism','Yes \u2014 always'],['Location','True Position, Concentricity\u2020, Symmetry\u2020','Yes'],['Runout','Circular Runout, Total Runout','Yes \u2014 requires axis datum'],['Modifiers','\u24c2 MMC, \u24c1 LMC, \u24c7 RFS, \u24c5 Projected','Applied to other controls']]);
  html += '</div></div>';
  html += '<div class="lcard"><div class="lc-head"><div class="lc-info"><div class="lc-gc" style="color:var(--purple)">DATUMS</div><div class="lc-title">Datum Reference Frame \u2014 3-2-1 Principle</div></div></div><div class="lc-body">';
  html += buildTable([['Datum','Contact Points','DOF Removed','What It Establishes'],['A (Primary)','3 point min','3: 1 translation + 2 rotations','Primary plane \u2014 part sits here'],['B (Secondary)','2 point min','2: 1 translation + 1 rotation','Stops lateral shift and rotation'],['C (Tertiary)','1 point min','1: 1 translation','Final constraint \u2014 fully located']]);
  html += '<div class="tip-box"><strong>\ud83d\udca1 Machinist Application:</strong> Your G54 datum surface IS Datum A. When you edge-find and set work zero, you establish the same reference the CMM uses. Matching your setup to the DRF eliminates measurement bias between machining and inspection.</div>';
  html += '<div style="margin-top:14px"><button class="calc-btn" onclick="setView(\'test\');setTestCat(\'gdnt\')">Take the GD&amp;T Test \u2192</button></div></div></div>';
  document.getElementById('content').innerHTML = html;
}

function setTestCat(cat) {
  STATE.testCat = cat; STATE.activeTest = null; STATE.testState = null;
  ['all','controllers','machines','gdnt','interview','lesson'].forEach(function(k) {
    var el = document.getElementById('tn-' + k); if (el) el.className = 'nav-tab' + (k === cat ? ' a-test' : '');
  });
  renderTestCenter();
}

function renderTestCenter() {
  renderTestSidebar();
  if (STATE.activeTest && STATE.testState) { renderTestRunner(); return; }
  var cat = STATE.testCat || 'all';

  // ── ALL TESTS OVERVIEW ──────────────────────────────────────────
  if (cat === 'all') {
    var html = '<div class="test-center">';
    html += '<div class="lvl-banner test-gold"><div class="banner-ico">🎯</div><div class="banner-body">';
    html += '<div class="banner-lv" style="color:var(--gold)">ALL TESTS</div>';
    html += '<div class="banner-title">Full Test Library</div>';
    html += '<div class="banner-sub">Controller knowledge · Machine type · GD\u0026T · Interview prep · Lesson quizzes</div>';
    html += '</div><div class="banner-right"><div style="color:var(--gold);font-family:var(--mono);font-size:11px">10 Test Banks</div><div>72 Questions</div></div></div>';

    // Controllers section
    html += '<div class="test-section-head">🎮 Controller Tests</div><div class="test-grid">';
    Object.entries(GCA_TESTS.controllers).forEach(function(e) { html += buildTestCard(e[0], e[1], 'controllers'); });
    html += '</div>';

    // Machine type section
    html += '<div class="test-section-head">🏭 Machine Type Tests</div><div class="test-grid">';
    Object.entries(GCA_TESTS.machines).forEach(function(e) { html += buildTestCard(e[0], e[1], 'machines'); });
    html += '</div>';

    // GD&T + Interview
    html += '<div class="test-section-head">📐 Specialty Tests</div><div class="test-grid">';
    html += buildTestCard('main', GCA_TESTS.gdnt, 'gdnt');
    html += buildTestCard('main', GCA_TESTS.interview, 'interview');
    html += '</div>';

    // Lesson quizzes section
    html += '<div class="test-section-head">📚 Lesson Quizzes</div>';
    html += '<div class="desc" style="font-size:12px;margin-bottom:12px">Quick comprehension checks embedded in each lesson. Click any to launch as a standalone quiz.</div>';
    html += '<div class="test-grid">';
    var qcount = 0;
    ['lathe','mill'].forEach(function(tr) {
      ['beginner','intermediate','advanced','automation'].forEach(function(lv) {
        var d = CURRICULUM[tr] && CURRICULUM[tr][lv]; if (!d) return;
        d.lessons.forEach(function(ls) {
          if (!ls.quiz) return;
          var done = GCA_AUTH.isLessonComplete(ls.id);
          html += '<div class="test-card" onclick="startLessonQuiz(\'' + ls.id + '\')">';
          html += '<div class="tc-icon">' + (tr==='lathe'?'⚙':'🔩') + '</div>';
          html += '<div class="tc-label">' + ls.gcode + '</div>';
          html += '<div class="tc-desc">' + ls.title + '</div>';
          html += '<div class="tc-meta"><span class="tc-tag" style="background:rgba(0,229,176,.07);color:var(--' + ({beginner:'beg',intermediate:'int',advanced:'adv',automation:'auto'})[lv] + ');border:1px solid rgba(100,100,100,.15)">' + lv.slice(0,3).toUpperCase() + ' ' + tr.toUpperCase() + '</span>';
          if (done) html += '<span class="tc-tag" style="background:rgba(0,229,176,.07);color:var(--green);border:1px solid rgba(0,229,176,.15)">✓ Done</span>';
          html += '</div><div class="tc-qcount">1 question</div></div>';
          qcount++;
        });
      });
    });
    html += '</div>';
    html += '</div>';
    document.getElementById('content').innerHTML = html;
    return;
  }

  // ── FILTERED VIEWS ──────────────────────────────────────────────
  var banners = {
    controllers: ['test-gold','🎮','CONTROLLER TESTS','Know Your Control','Fanuc \u00b7 Haas \u00b7 Siemens \u00b7 Heidenhain'],
    machines:    ['test-red','🏭','MACHINE TYPE TESTS','Machine-Specific Knowledge','VMC \u00b7 Lathe \u00b7 Swiss \u00b7 HMC'],
    gdnt:        ['gdnt','📐','GD\u0026T TEST','Geometric Dimensioning \u0026 Tolerancing','ASME Y14.5-2018'],
    interview:   ['test-gold','💼','INTERVIEW PREP','CNC Shop Interview Simulator','Timed \u00b7 Professional scoring'],
    lesson:      ['gdnt','📚','LESSON QUIZZES','Comprehension Checks','One question per lesson — all tracks and levels'],
  };
  var b = banners[cat] || banners['controllers'];
  var html = '<div class="test-center"><div class="lvl-banner ' + b[0] + '"><div class="banner-ico">' + b[1] + '</div>';
  html += '<div class="banner-body"><div class="banner-lv" style="color:' + (cat==='gdnt'||cat==='lesson'?'var(--purple)':'var(--gold)') + '">' + b[2] + '</div>';
  html += '<div class="banner-title">' + b[3] + '</div><div class="banner-sub">' + b[4] + '</div></div></div>';
  html += '<div class="test-grid">';

  if (cat === 'controllers') {
    Object.entries(GCA_TESTS.controllers).forEach(function(e) { html += buildTestCard(e[0], e[1], 'controllers'); });
  } else if (cat === 'machines') {
    Object.entries(GCA_TESTS.machines).forEach(function(e) { html += buildTestCard(e[0], e[1], 'machines'); });
  } else if (cat === 'gdnt') {
    html += buildTestCard('main', GCA_TESTS.gdnt, 'gdnt');
  } else if (cat === 'interview') {
    html += buildTestCard('main', GCA_TESTS.interview, 'interview');
  } else if (cat === 'lesson') {
    html = html.replace('<div class="test-grid">', '</div><div class="test-grid">');
    ['lathe','mill'].forEach(function(tr) {
      ['beginner','intermediate','advanced','automation'].forEach(function(lv) {
        var d = CURRICULUM[tr] && CURRICULUM[tr][lv]; if (!d) return;
        d.lessons.forEach(function(ls) {
          if (!ls.quiz) return;
          var done = GCA_AUTH.isLessonComplete(ls.id);
          html += '<div class="test-card" onclick="startLessonQuiz(\'' + ls.id + '\')">';
          html += '<div class="tc-icon">' + (tr==='lathe'?'⚙':'🔩') + '</div>';
          html += '<div class="tc-label">' + ls.gcode + '</div>';
          html += '<div class="tc-desc">' + ls.title + '</div>';
          html += '<div class="tc-meta"><span class="tc-tag" style="background:rgba(0,229,176,.07);color:var(--' + ({beginner:'beg',intermediate:'int',advanced:'adv',automation:'auto'})[lv] + ');border:1px solid rgba(100,100,100,.15)">' + lv.slice(0,3).toUpperCase() + ' ' + tr.toUpperCase() + '</span>';
          if (done) html += '<span class="tc-tag" style="background:rgba(0,229,176,.07);color:var(--green);border:1px solid rgba(0,229,176,.15)">✓ Done</span>';
          html += '</div><div class="tc-qcount">1 question</div></div>';
        });
      });
    });
  }

  html += '</div></div>';
  document.getElementById('content').innerHTML = html;
}

function buildTestCard(key, ct, category) {
  var scoreKey = category === 'gdnt' ? 'gdnt-main' : category === 'interview' ? 'interview-main' : category + '-' + key;
  var best = GCA_AUTH.getBestScore(scoreKey);
  var accentColor = category === 'gdnt' ? 'var(--purple)' : 'var(--gold)';
  var borderColor = category === 'gdnt' ? 'rgba(167,139,250,.12)' : 'rgba(245,197,24,.12)';
  var bgColor     = category === 'gdnt' ? 'rgba(167,139,250,.07)' : 'rgba(245,197,24,.07)';
  return '<div class="test-card" onclick="startTest(\'' + category + '\',\'' + key + '\')">' +
    '<div class="tc-icon">' + (ct.icon || '📝') + '</div>' +
    '<div class="tc-label">' + ct.label + '</div>' +
    '<div class="tc-desc">' + ct.desc + '</div>' +
    '<div class="tc-meta">' +
    '<span class="tc-tag" style="background:' + bgColor + ';color:' + accentColor + ';border:1px solid ' + borderColor + '">Pass: ' + ct.passMark + '%' + (ct.timeLimit ? ' \u00b7 ' + Math.round(ct.timeLimit/60) + 'min' : '') + '</span>' +
    (best !== undefined ? '<span class="tc-tag" style="background:rgba(0,229,176,.07);color:var(--green);border:1px solid rgba(0,229,176,.15)">Best: ' + best + '%</span>' : '') +
    '</div>' +
    '<div class="tc-qcount">' + ct.questions.length + ' questions</div></div>';
}

function startLessonQuiz(lessonId) {
  var ls = findLesson(lessonId);
  if (!ls || (!ls.quiz && !(ls.quizPool && ls.quizPool.length))) return;
  // Prefer the larger quizPool (random subset of up to 10) if available; fall back to the single legacy quiz.
  var pool = (ls.quizPool && ls.quizPool.length)
    ? ls.quizPool.slice()
    : [{ q: ls.quiz.q, opts: ls.quiz.opts, ans: ls.quiz.ans, fb: ls.quiz.fb || '' }];
  pool.sort(function(){ return Math.random() - 0.5; });
  var subset = pool.slice(0, Math.min(10, pool.length));
  var questions = subset.map(function(q){
    return { q: q.q, opts: q.opts, ans: q.ans, exp: q.fb || '', diff: q.diff || 1 };
  });
  var passMark = pool.length > 1 ? 80 : 100;
  STATE.activeTest = { cat: 'lesson', key: lessonId };
  STATE.testState  = {
    questions: questions,
    current: 0, answers: [],
    startTime: Date.now(),
    timerLimit: null, timerInterval: null,
    label: ls.gcode + ' — ' + ls.title,
    passMark: passMark,
  };
  renderTestRunner();
}

function startTest(cat, key) {
  var qs;
  if (cat==='controllers') qs = GCA_TESTS.controllers[key].questions;
  else if (cat==='machines') qs = GCA_TESTS.machines[key].questions;
  else if (cat==='gdnt') qs = GCA_TESTS.gdnt.questions;
  else qs = GCA_TESTS.interview.questions;
  STATE.activeTest = {cat:cat, key:key};
  STATE.testState  = {
    questions:[].concat(qs).sort(function(){return Math.random()-.5;}),
    current:0, answers:[], startTime:Date.now(),
    timerLimit:cat==='interview'?GCA_TESTS.interview.timeLimit:null, timerInterval:null,
    label: cat==='controllers'?GCA_TESTS.controllers[key].label : cat==='machines'?GCA_TESTS.machines[key].label : cat==='gdnt'?GCA_TESTS.gdnt.label : GCA_TESTS.interview.label,
    passMark: cat==='controllers'?GCA_TESTS.controllers[key].passMark : cat==='machines'?GCA_TESTS.machines[key].passMark : cat==='gdnt'?GCA_TESTS.gdnt.passMark : GCA_TESTS.interview.passMark,
  };
  if (cat === 'interview') {
    STATE.testState.timerInterval = setInterval(function() {
      var rem = STATE.testState.timerLimit - Math.floor((Date.now()-STATE.testState.startTime)/1000);
      var el = document.getElementById('tr-timer');
      if (el) { if(rem<=0){clearInterval(STATE.testState.timerInterval);finishTest();return;} el.textContent=Math.floor(rem/60)+':'+String(rem%60).padStart(2,'0'); el.style.color=rem<120?'var(--red)':'var(--gold)'; }
    }, 1000);
  }
  renderTestRunner();
}

function renderTestRunner() {
  renderTestSidebar();
  var ts = STATE.testState;
  if (ts.current >= ts.questions.length) { finishTest(); return; }
  var q = ts.questions[ts.current];
  var cat = STATE.activeTest.cat;
  var pct = Math.round(ts.current/ts.questions.length*100);
  var letters = ['A','B','C','D'];
  var label = ts.label || 'Test';

  var html = '<div class="test-runner show">';
  html += '<div class="tr-header"><div class="tr-title">' + label + '</div><div class="tr-timer" id="tr-timer">';
  if (cat === 'interview') html += Math.round(GCA_TESTS.interview.timeLimit/60) + ':00';
  html += '</div></div>';
  html += '<div class="tr-progress"><div class="tr-fill" style="width:' + pct + '%"></div></div>';
  html += '<div class="tr-qnum">Question ' + (ts.current+1) + ' of ' + ts.questions.length + '</div>';
  html += '<div class="tr-diff">' + [1,2,3].map(function(d){return '<span class="diff-dot'+(d<=q.diff?' lit':'')+'"></span>';}).join('') + '<span style="font-size:10px;color:var(--muted);margin-left:6px">' + (q.diff===1?'Fundamental':q.diff===2?'Intermediate':'Advanced') + '</span></div>';
  html += '<div class="tr-q">' + q.q + '</div>';
  html += '<div class="quiz-opts">' + q.opts.map(function(o,i){ return '<div class="qopt" onclick="answerTest(' + i + ')" id="topt-' + i + '"><span class="qopt-l">' + letters[i] + '</span>' + o + '</div>'; }).join('') + '</div>';
  html += '<div class="tr-exp" id="tr-exp"></div>';
  html += '<div class="tr-nav"><button class="btn-next" id="btn-next" style="display:none" onclick="nextTestQ()">Next \u2192</button><div style="flex:1"></div><button class="btn-back" onclick="exitTest()">\u2190 Exit</button></div>';
  html += '</div>';
  document.getElementById('content').innerHTML = html;
}

function answerTest(idx) {
  var ts = STATE.testState; var q = ts.questions[ts.current];
  ts.answers.push({q:q, chosen:idx, correct:idx===q.ans});
  document.querySelectorAll('.qopt').forEach(function(el){el.style.pointerEvents='none';});
  var el = document.getElementById('topt-'+idx); if(el) el.classList.add(idx===q.ans?'correct':'wrong');
  if(idx!==q.ans){var ca=document.getElementById('topt-'+q.ans);if(ca)ca.classList.add('correct');}
  var exp = document.getElementById('tr-exp');
  exp.textContent=(idx===q.ans?'\u2713 Correct \u2014 ':'\u2717 Incorrect \u2014 ')+q.exp;
  exp.style.cssText=idx===q.ans?'display:block;background:rgba(0,229,176,.05);border:1px solid rgba(0,229,176,.12);color:#80d8b8;border-radius:5px;padding:10px 12px;font-size:12px;line-height:1.6;margin-top:9px':'display:block;background:rgba(255,71,87,.05);border:1px solid rgba(255,71,87,.12);color:#ff9aa8;border-radius:5px;padding:10px 12px;font-size:12px;line-height:1.6;margin-top:9px';
  var nb=document.getElementById('btn-next');if(nb)nb.style.display='';
}

function nextTestQ() { STATE.testState.current++; renderTestRunner(); }

function finishTest() {
  if (STATE.testState.timerInterval) clearInterval(STATE.testState.timerInterval);
  var ts = STATE.testState; var cat = STATE.activeTest.cat; var key = STATE.activeTest.key;
  var correct = ts.answers.filter(function(a){return a.correct;}).length;
  var total = ts.questions.length;
  var score = Math.round(correct/total*100);
  var passMark = ts.passMark || 75;
  var passed = score >= passMark;
  var testId = cat === 'lesson' ? 'lesson-' + key : cat + '-' + key;
  GCA_AUTH.recordTestScore(testId, score, passed);
  var elapsed = Math.round((Date.now()-ts.startTime)/1000);
  var review = ts.answers.map(function(a,i){
    return '<div style="background:var(--card);border:1px solid '+(a.correct?'rgba(0,229,176,.2)':'rgba(255,71,87,.2)')+';border-radius:5px;padding:11px;margin-bottom:8px">' +
      '<div style="font-size:12px;font-weight:500;margin-bottom:5px">'+(i+1)+'. '+a.q.q+'</div>' +
      '<div style="font-size:11px;color:'+(a.correct?'var(--green)':'var(--red)')+';margin-bottom:4px">'+(a.correct?'\u2713 Correct':'\u2717 Correct: '+a.q.opts[a.q.ans])+'</div>' +
      '<div style="font-size:11px;color:var(--muted2)">'+a.q.exp+'</div></div>';
  }).join('');
  var retakeBtn = cat === 'lesson'
    ? '<button class="btn-next" onclick="startLessonQuiz(\'' + key + '\')">Retake</button>'
    : '<button class="btn-next" onclick="startTest(\'' + cat + '\',\'' + key + '\')">Retake Test</button>';
  renderTestSidebar();
  document.getElementById('content').innerHTML =
    '<div class="test-runner show">' +
    '<div style="text-align:center;padding:18px 0">' +
    '<div class="res-score '+(passed?'pass':'fail')+'">'+score+'%</div>' +
    '<div style="font-size:13px;color:var(--muted);margin-bottom:16px">'+(passed?'\u2713 PASSED':'\u2717 Did Not Pass')+' \u00b7 Pass mark '+passMark+'%</div>' +
    '<div class="res-breakdown">' +
    '<div class="res-stat"><div class="res-stat-num">'+correct+'</div><div class="res-stat-label">Correct</div></div>' +
    '<div class="res-stat"><div class="res-stat-num">'+(total-correct)+'</div><div class="res-stat-label">Incorrect</div></div>' +
    '<div class="res-stat"><div class="res-stat-num">'+Math.floor(elapsed/60)+':'+String(elapsed%60).padStart(2,'0')+'</div><div class="res-stat-label">Time</div></div>' +
    '</div>' +
    '<div style="display:flex;gap:9px;justify-content:center;flex-wrap:wrap;margin-bottom:22px">'+retakeBtn+'<button class="btn-back" onclick="exitTest()">\u2190 Back</button></div>' +
    '</div>' +
    '<div style="font-family:var(--head);font-weight:700;font-size:14px;margin-bottom:11px">Question Review</div>' +
    review + '</div>';
}

function exitTest() {
  if (STATE.testState && STATE.testState.timerInterval) clearInterval(STATE.testState.timerInterval);
  STATE.activeTest = null; STATE.testState = null;
  renderTestCenter();
}

function renderProgressView() {
  document.getElementById('sidebar').innerHTML = '';
  var progress = GCA_AUTH.getProgress();
  var user = GCA_AUTH.getUser();
  var totalLessons=0, totalDone=0;
  ['lathe','mill'].forEach(function(tr){ ['beginner','intermediate','advanced','automation'].forEach(function(lv){ var d=CURRICULUM[tr]&&CURRICULUM[tr][lv]; if(d){totalLessons+=d.lessons.length;totalDone+=d.lessons.filter(function(l){return GCA_AUTH.isLessonComplete(l.id);}).length;} }); });
  var mData = GCA_META.milestones.map(function(ms) {
    var done=0;
    if(ms.track==='any'){ ['lathe','mill'].forEach(function(tr){var d=CURRICULUM[tr]&&CURRICULUM[tr][ms.level];if(d)done+=d.lessons.filter(function(l){return GCA_AUTH.isLessonComplete(l.id);}).length;}); }
    else{ var d=CURRICULUM[ms.track]&&CURRICULUM[ms.track][ms.level]; if(d)done=d.lessons.filter(function(l){return GCA_AUTH.isLessonComplete(l.id);}).length; }
    done=Math.min(done,ms.req);
    return Object.assign({},ms,{done:done,pct:Math.round(done/ms.req*100),earned:done>=ms.req});
  });
  var scores=[];
  Object.entries(GCA_TESTS.controllers).forEach(function(e){var s=GCA_AUTH.getBestScore('controllers-'+e[0]);if(s!==undefined)scores.push({label:e[1].label,score:s,pass:s>=e[1].passMark});});
  Object.entries(GCA_TESTS.machines).forEach(function(e){var s=GCA_AUTH.getBestScore('machines-'+e[0]);if(s!==undefined)scores.push({label:e[1].label,score:s,pass:s>=e[1].passMark});});
  var gs=GCA_AUTH.getBestScore('gdnt-main');if(gs!==undefined)scores.push({label:'GD&T',score:gs,pass:gs>=75});
  var is=GCA_AUTH.getBestScore('interview-main');if(is!==undefined)scores.push({label:'Interview Prep',score:is,pass:is>=80});
  var html='';
  if(user){html+='<div class="profile-bar"><div class="profile-avatar">'+(user.name||user.email||'U')[0].toUpperCase()+'</div><div><div class="profile-name">'+(user.name||user.email)+'</div><div class="profile-tier '+user.tier+'">'+user.tier.toUpperCase()+'</div></div><div class="profile-actions"><button class="btn-back" onclick="GCA_AUTH.logout()">Sign Out</button>'+ (!GCA_AUTH.isPro()?'<button class="pro-btn" onclick="showModal(\'pro\')">\u26a1 Upgrade</button>':'')+'</div></div>';}
  else{html+='<div class="lcard"><div class="lc-body" style="text-align:center"><p class="desc">Sign in to sync progress across devices.</p><button class="btn-next" onclick="showModal(\'auth\')">Sign In to Save Progress</button></div></div>';}
  html+='<div class="progress-tracker"><div class="pt-title">\ud83d\udcca Progress Dashboard</div><div class="pt-sub">G-Code Academy \u00b7 v'+GCA_META.version+' \u00b7 '+(user?'Synced to account':'Saved locally')+'</div>';
  html+='<div class="stats-grid"><div class="res-stat"><div class="res-stat-num" style="color:var(--accent)">'+totalDone+'</div><div class="res-stat-label">Lessons Done</div></div><div class="res-stat"><div class="res-stat-num">'+totalLessons+'</div><div class="res-stat-label">Total Lessons</div></div><div class="res-stat"><div class="res-stat-num" style="color:var(--gold)">'+mData.filter(function(m){return m.earned;}).length+'</div><div class="res-stat-label">Milestones</div></div></div>';
  html+='<div style="font-family:var(--head);font-weight:700;font-size:14px;margin-bottom:11px">\ud83c\udfc5 Milestones</div><div class="milestone-grid">';
  mData.forEach(function(ms){html+='<div class="milestone'+(ms.earned?' earned':'')+'"><div class="ms-ico">'+ms.icon+'</div><div class="ms-name">'+ms.label+'</div><div class="ms-desc">'+ms.desc+'</div><div class="ms-bar"><div class="ms-fill" style="width:'+ms.pct+'%"></div></div><div class="ms-count">'+ms.done+'/'+ms.req+(ms.earned?' \u2713':'')+'</div></div>';});
  html+='</div></div>';
  if(scores.length){html+='<div class="lcard"><div class="lc-head"><div class="lc-info"><div class="lc-gc" style="color:var(--gold)">SCORES</div><div class="lc-title">Test History</div></div></div><div class="lc-body">'+buildTable([['Test','Best Score','Status']].concat(scores.map(function(s){return[s.label,s.score+'%',s.pass?'\u2713 PASSED':'\u2717 Not Passed'];})))+'</div></div>';}
  html+='<div class="lcard"><div class="lc-head"><div class="lc-info"><div class="lc-title">Data &amp; Privacy</div></div></div><div class="lc-body"><p class="desc">Progress saved locally'+(user?' and synced to your account':'')+'.</p><button class="btn-back" onclick="resetProgress()">Reset Progress</button></div></div>';
  document.getElementById('content').innerHTML=html;
}

function renderChangelog() {
  document.getElementById('sidebar').innerHTML='';
  var html='<div class="changelog"><div class="cl-head"><span>\ud83d\udccb Curriculum Changelog</span><span class="cl-version">v'+GCA_META.version+'</span></div>';
  GCA_META.changelog.forEach(function(e){ html+='<div class="cl-entry"><div><span class="cl-ver-tag">v'+e.version+'</span><span class="cl-date">'+e.date+'</span></div><div class="cl-summary">'+e.summary+'</div><ul class="cl-changes">'+e.changes.map(function(c){return '<li>'+c+'</li>';}).join('')+'</ul></div>'; });
  html+='</div>';
  html+='<div class="lcard" style="margin-top:14px"><div class="lc-head"><div class="lc-info"><div class="lc-title">Module Architecture</div><div class="lc-sub">Update curriculum without touching the engine</div></div></div><div class="lc-body">';
  html+=buildTable([['Module','File','Update To...'],['GCA_CONFIG','gca-config.js','Tenant, feature flags, pricing, auth endpoints'],['GCA_AUTH','gca-auth.js','Set auth.enabled=true, fill real API endpoints'],['GCA_SYMBOLS','gca-symbols.js','Add symbols, update SVG paths'],['GCA_META','gca-meta.js','Bump version, changelog, milestones'],['CURRICULUM','gca-curriculum.js','Add/edit lessons \u2014 engine auto-renders'],['GCA_TESTS','gca-tests.js','Add questions, new controller/machine banks'],['Engine','gca-engine.js','New UI features only']]);
  html+='<div class="tip-box"><strong>\ud83d\udca1 Content Workflow:</strong> Add a lesson object to CURRICULUM \u2192 bump GCA_META.version \u2192 add changelog entry. Zero HTML changes required.</div></div></div>';
  document.getElementById('content').innerHTML=html;
}

function handleAuthClick() { if(GCA_AUTH.isLoggedIn())setView('progress'); else showModal('auth'); }
function toggleAuthMode() {
  STATE.authMode=STATE.authMode==='login'?'register':'login';
  document.getElementById('auth-modal-title').textContent=STATE.authMode==='login'?'Sign In':'Create Account';
  document.getElementById('auth-name-field').style.display=STATE.authMode==='register'?'':'none';
  document.querySelector('.auth-switch').innerHTML=STATE.authMode==='login'?'No account? <span onclick="toggleAuthMode()">Create one free</span>':'Already have one? <span onclick="toggleAuthMode()">Sign in</span>';
  document.querySelector('.auth-submit').textContent=STATE.authMode==='login'?'Sign In':'Create Account';
  document.getElementById('auth-error').className='auth-error';
}
async function submitAuth() {
  var email=document.getElementById('auth-email').value.trim();
  var pass=document.getElementById('auth-password').value;
  var name=document.getElementById('auth-name').value.trim();
  var errEl=document.getElementById('auth-error');
  if(!email||!pass){errEl.textContent='Email and password required';errEl.className='auth-error show';return;}
  var res=STATE.authMode==='login'?await GCA_AUTH.login(email,pass):await GCA_AUTH.register(email,pass,name);
  if(res.success){closeModal('auth');setView('progress');}
  else{errEl.textContent=res.error||'Authentication failed';errEl.className='auth-error show';}
}
function handleProCheckout() { if(!GCA_CONFIG.stripe.enabled){closeModal('pro');alert('Stripe checkout coming soon!\n\n'+GCA_CONFIG.active.pricing.contactNote);}else{GCA_AUTH.startCheckout(GCA_CONFIG.stripe.prices.annual);} }

function buildTable(rows) {
  var h='<div class="table-wrap"><table class="ref-table"><thead><tr>'+rows[0].map(function(c){return '<th>'+c+'</th>';}).join('')+'</tr></thead><tbody>';
  rows.slice(1).forEach(function(r){h+='<tr>'+r.map(function(c,i){return '<td'+(i===0?' class="gc"':'')+'>'+c+'</td>';}).join('')+'</tr>';});
  return h+'</tbody></table></div>';
}
function buildSteps(steps){ return '<div class="steps">'+steps.map(function(s){return '<div class="step"><span class="step-n">'+s.n+'</span><div class="step-b">'+s.body+'</div></div>';}).join('')+'</div>'; }
function buildQuizBlock(id,q){
  var letters=['A','B','C','D'];
  return '<div class="tab-content" data-tab="'+id+'-quiz"><p class="quiz-q">'+q.q+'</p><div class="quiz-opts">'+q.opts.map(function(o,i){return '<div class="qopt" onclick="answerLesson(this,'+(i===q.ans)+',\''+id+'\','+q.ans+')"><span class="qopt-l">'+letters[i]+'</span>'+o+'</div>';}).join('')+'</div><div class="quiz-fb" id="qfb-'+id+'"></div><button class="calc-btn" id="qdone-'+id+'" style="display:none;margin-top:6px" onclick="markLessonDone(\''+id+'\')">Mark Complete \u2713</button></div>';
}
function answerLesson(el,correct,id,ansIdx){
  el.parentElement.querySelectorAll('.qopt').forEach(function(o){o.style.pointerEvents='none';});
  el.classList.add(correct?'correct':'wrong');
  if(!correct){var ca=el.parentElement.querySelectorAll('.qopt')[ansIdx];if(ca)ca.classList.add('correct');}
  var fb=document.getElementById('qfb-'+id);
  var ls=findLesson(id);
  fb.textContent=(correct?'\u2713 ':'\u2717 ')+(ls&&ls.quiz?ls.quiz.fb:'');
  fb.className='quiz-fb show '+(correct?'correct':'wrong');
  var done=document.getElementById('qdone-'+id);if(done)done.style.display='';
}
async function markLessonDone(id){
  await GCA_AUTH.markLessonComplete(id);
  renderSidebar();
  var el=document.getElementById('card-'+id);
  if(el){var t=el.querySelector('.lc-title');if(t&&!t.querySelector('span'))t.insertAdjacentHTML('beforeend',' <span style="color:var(--green);font-size:13px">\u2713</span>');}
  checkMilestones();
}
async function checkMilestones(){
  for(var i=0;i<GCA_META.milestones.length;i++){
    var ms=GCA_META.milestones[i];var done=0;
    if(ms.track==='any'){['lathe','mill'].forEach(function(tr){var d=CURRICULUM[tr]&&CURRICULUM[tr][ms.level];if(d)done+=d.lessons.filter(function(l){return GCA_AUTH.isLessonComplete(l.id);}).length;});}
    else{var d=CURRICULUM[ms.track]&&CURRICULUM[ms.track][ms.level];if(d)done=d.lessons.filter(function(l){return GCA_AUTH.isLessonComplete(l.id);}).length;}
    if(done>=ms.req){var newly=await GCA_AUTH.earnMilestone(ms.id);if(newly)showMilestoneToast(ms);}
  }
}
function showMilestoneToast(ms){
  var t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:20px;right:20px;background:var(--surface);border:1px solid var(--accent);border-radius:8px;padding:14px 18px;font-family:var(--head);z-index:1000;max-width:280px;box-shadow:0 4px 20px rgba(0,0,0,.4)';
  t.innerHTML='<div style="font-size:22px;margin-bottom:4px">'+ms.icon+'</div><div style="font-weight:700;font-size:14px;color:var(--accent)">'+ms.label+'</div><div style="font-size:11px;color:var(--muted)">'+ms.desc+'</div>';
  document.body.appendChild(t);setTimeout(function(){t.remove();},4000);
}
function findLesson(id){var tks=Object.keys(CURRICULUM);for(var ti=0;ti<tks.length;ti++){var lvks=Object.keys(CURRICULUM[tks[ti]]);for(var li=0;li<lvks.length;li++){var lv=CURRICULUM[tks[ti]][lvks[li]];if(lv&&lv.lessons){var l=lv.lessons.find(function(l){return l.id===id;});if(l)return l;}}}return null;}
function buildCalc(id){return '<div class="calc-box"><div class="calc-title">\u2699 G96 \u2192 RPM Calculator</div><div class="calc-grid"><div class="field"><label>Mode</label><select id="'+id+'-mode"><option value="sfm">SFM \u2192 RPM (G96 result)</option><option value="rpm">RPM \u2192 SFM (G97 result)</option></select></div><div class="field"><label>Units</label><select id="'+id+'-units"><option value="inch">Inch</option><option value="metric">Metric</option></select></div><div class="field"><label>Speed Value</label><input type="number" id="'+id+'-speed" value="300"></div><div class="field"><label>Diameter (in/mm)</label><input type="number" id="'+id+'-dia" value="2.0" step="0.1"></div></div><button class="calc-btn" onclick="doCalc(\''+id+'\')">CALCULATE</button><div class="calc-result" id="'+id+'-cr"><div class="result-val" id="'+id+'-rv">\u2014</div><div class="result-label" id="'+id+'-rl"></div></div></div><div class="calc-box"><div class="calc-title">\ud83d\udee1 G50 Advisor</div><div class="calc-grid"><div class="field"><label>Chuck \u00d8 (in)</label><input type="number" id="'+id+'-cd" value="8"></div><div class="field"><label>Chuck Type</label><select id="'+id+'-ct"><option value="std">3-jaw Standard</option><option value="col">Collet</option><option value="4j">4-jaw Ind.</option></select></div></div><button class="calc-btn" onclick="doG50(\''+id+'\')">GET G50 VALUE</button><div class="calc-result" id="'+id+'-g50r"><div class="result-val" id="'+id+'-g50v">\u2014</div><div class="result-label" id="'+id+'-g50l"></div></div></div>';}
function doCalc(id){var mode=document.getElementById(id+'-mode').value,units=document.getElementById(id+'-units').value,speed=parseFloat(document.getElementById(id+'-speed').value),dia=parseFloat(document.getElementById(id+'-dia').value),res=document.getElementById(id+'-cr'),rv=document.getElementById(id+'-rv'),rl=document.getElementById(id+'-rl');if(!speed||!dia||dia<=0){rv.textContent='Enter valid values';res.classList.add('show');return;}if(mode==='sfm'){var rpm=units==='inch'?(12*speed)/(Math.PI*dia):(1000*speed)/(Math.PI*dia);rv.textContent=Math.round(rpm).toLocaleString()+' RPM';rl.textContent='G96 S'+speed+' at \u00d8'+dia+' \u2192 set G50 above this';}else{var sfm=units==='inch'?(speed*Math.PI*dia)/12:(speed*Math.PI*dia)/1000;rv.textContent=Math.round(sfm)+(units==='inch'?' SFM':' m/min');rl.textContent='G97 S'+speed+' at \u00d8'+dia;}res.classList.add('show');}
function doG50(id){var dia=parseFloat(document.getElementById(id+'-cd').value),type=document.getElementById(id+'-ct').value,res=document.getElementById(id+'-g50r'),val=document.getElementById(id+'-g50v'),lbl=document.getElementById(id+'-g50l');if(!dia||dia<=0){val.textContent='Enter diameter';res.classList.add('show');return;}var max=type==='col'?Math.min(6000,Math.round(18000/dia)):type==='4j'?Math.min(2000,Math.round(8000/dia)):Math.min(4000,Math.round(12000/dia));val.textContent='G50 S'+max;lbl.textContent='Recommended for '+dia+'" '+(type==='std'?'3-jaw':type==='col'?'collet':'4-jaw')+' \u2014 verify spec plate';res.classList.add('show');}
function switchTab(el,lid,tabId){var card=el.closest('.lcard');card.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});card.querySelectorAll('.tab-content').forEach(function(c){c.classList.remove('active');});el.classList.add('active');var tc=card.querySelector('[data-tab="'+lid+'-'+tabId+'"]');if(tc)tc.classList.add('active');}
function copyCode(btn,id){var el=document.getElementById(id);if(!el)return;var text=[].slice.call(el.querySelectorAll('.cl')).map(function(r){var s=r.querySelectorAll('span');return s[1]?s[1].innerText:'';}).join('\n');navigator.clipboard.writeText(text).then(function(){btn.textContent='COPIED!';setTimeout(function(){btn.textContent='COPY';},2000);});}
function showModal(which){document.getElementById(which+'-modal').classList.add('show');}
function closeModal(which){document.getElementById(which+'-modal').classList.remove('show');}
function resetProgress() {
  if (window.confirm('Reset all local progress data?')) {
    localStorage.clear();
    window.location.reload();
  }
}
