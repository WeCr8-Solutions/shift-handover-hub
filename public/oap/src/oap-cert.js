// ═══════════════════════════════════════════════════════════════════
// OAP-CERT.JS — Certificate Generator (Printable HTML)
// Produces a self-contained printable certificate with:
// - employer stamp and logo area
// - mentee info, role, date
// - full equipment and machine list
// - portability note for job changes
// WeCr8 Solutions LLC | JobLine.ai | v1.0.0
// ═══════════════════════════════════════════════════════════════════

'use strict';

const OAP_CERT = {

  // Generate printable HTML certificate string
  generate(cert) {
    var issued  = new Date(cert.issuedDate).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
    var expires = new Date(cert.expiresDate).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
    var isRecert = cert.certType === 'recert';

    // Build equipment lists
    var machineList = (cert.machinesPassed||[]).map(function(id){
      var m = OAP_MACHINES[id]; return m ? m.label : id;
    });
    var measList = (cert.measuringPassed||[]).map(function(id){
      var m = OAP_MEASURING[id]; return m ? m.label : id;
    });
    var toolList = (cert.toolingPassed||[]).map(function(id){
      var m = OAP_TOOLING[id]; return m ? m.label : id;
    });
    var safetyList = (cert.safetyCerts||[]).map(function(id){
      var m = OAP_SAFETY[id]; return m ? m.label : id;
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>OAP Certificate — ${cert.menteeName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;900&family=Barlow:wght@300;400;500&family=Share+Tech+Mono&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#f5f5f0; font-family:'Barlow',sans-serif; color:#1a1a2e; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
  .cert { background:#fff; width:850px; max-width:100%; border:3px solid #1a1a2e; position:relative; overflow:hidden; }
  /* Border decoration */
  .cert::before { content:''; position:absolute; inset:8px; border:1px solid #c8a96e; pointer-events:none; z-index:0; }
  .cert-inner { position:relative; z-index:1; padding:40px 50px; }
  /* Header */
  .cert-header { text-align:center; border-bottom:2px solid #1a1a2e; padding-bottom:22px; margin-bottom:22px; }
  .cert-program { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:11px; letter-spacing:4px; text-transform:uppercase; color:#c8a96e; margin-bottom:6px; }
  .cert-title { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:38px; line-height:1; color:#1a1a2e; margin-bottom:4px; }
  .cert-sub { font-family:'Barlow Condensed',sans-serif; font-size:16px; font-weight:400; color:#555; letter-spacing:2px; }
  ${isRecert ? '.cert-recert-badge { display:inline-block; background:#c8a96e; color:#fff; font-family:"Barlow Condensed",sans-serif; font-weight:700; font-size:10px; letter-spacing:2px; padding:3px 10px; border-radius:3px; margin-top:6px; }' : ''}
  /* Body */
  .cert-body { text-align:center; margin-bottom:22px; }
  .cert-presented { font-size:12px; color:#888; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; }
  .cert-name { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:42px; color:#1a1a2e; margin-bottom:4px; border-bottom:2px solid #c8a96e; display:inline-block; padding:0 20px; }
  .cert-role-line { font-size:13px; color:#444; margin-top:8px; line-height:1.6; }
  .cert-role { font-weight:600; color:#1a1a2e; }
  /* Equipment grid */
  .cert-section { margin-bottom:18px; }
  .cert-sec-title { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:10px; letter-spacing:2.5px; text-transform:uppercase; color:#c8a96e; border-bottom:1px solid #e0e0d8; margin-bottom:8px; padding-bottom:4px; }
  .cert-pills { display:flex; flex-wrap:wrap; gap:5px; }
  .cert-pill { background:#f0efe8; border:1px solid #d8d6c8; font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:600; padding:3px 10px; border-radius:3px; color:#333; }
  /* Signoff row */
  .cert-sigs { display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; margin-top:24px; border-top:1px solid #ddd; padding-top:20px; }
  .sig-block { text-align:center; }
  .sig-line { border-bottom:1px solid #1a1a2e; margin-bottom:5px; height:32px; display:flex; align-items:flex-end; justify-content:center; }
  .sig-name { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:13px; color:#1a1a2e; }
  .sig-title { font-size:10px; color:#888; letter-spacing:1px; text-transform:uppercase; }
  /* Cert ID / portability */
  .cert-footer { background:#f8f7f0; border-top:2px solid #1a1a2e; padding:14px 40px; display:flex; align-items:center; justify-content:space-between; }
  .cert-id { font-family:'Share Tech Mono',monospace; font-size:11px; color:#666; }
  .cert-dates { font-size:10px; color:#888; text-align:right; line-height:1.6; }
  .cert-portable { font-size:9px; color:#c8a96e; font-weight:600; letter-spacing:1px; text-transform:uppercase; margin-top:3px; }
  /* Employer block */
  .cert-employer { background:#f8f7f0; border:1px solid #e0dfd0; border-radius:4px; padding:12px 16px; margin-bottom:18px; display:flex; align-items:center; justify-content:space-between; }
  .emp-label { font-size:9px; color:#888; letter-spacing:2px; text-transform:uppercase; margin-bottom:2px; }
  .emp-name { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:16px; color:#1a1a2e; }
  .emp-loc { font-size:11px; color:#666; }
  .emp-logo { width:60px; height:40px; border:1px dashed #ccc; display:flex; align-items:center; justify-content:center; font-size:9px; color:#bbb; border-radius:3px; }
  @media print {
    body { background:#fff; padding:0; }
    .cert { border:3px solid #1a1a2e; width:100%; max-width:none; }
    .no-print { display:none !important; }
  }
</style>
</head>
<body>
<div>
  <!-- Print / Save actions (no-print) -->
  <div class="no-print" style="text-align:center;margin-bottom:16px">
    <button onclick="window.print()" style="background:#1a1a2e;color:#fff;border:none;padding:10px 24px;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:14px;letter-spacing:1px;cursor:pointer;border-radius:4px;margin-right:8px">🖨 Print / Save PDF</button>
    <button onclick="window.close()" style="background:#e0e0d8;color:#333;border:none;padding:10px 18px;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:13px;cursor:pointer;border-radius:4px">Close</button>
  </div>

  <div class="cert">
    <div class="cert-inner">

      <!-- Header -->
      <div class="cert-header">
        <div class="cert-program">JobLine OAP Program · Operator Acceptance Certification</div>
        <div class="cert-title">CERTIFICATE OF QUALIFICATION</div>
        <div class="cert-sub">Issued upon successful completion of all OAP requirements</div>
        ${isRecert ? '<div><span class="cert-recert-badge">RECERTIFICATION</span></div>' : ''}
      </div>

      <!-- Employer block -->
      <div class="cert-employer">
        <div>
          <div class="emp-label">Issuing Employer</div>
          <div class="emp-name">${cert.employerName || 'Self-Certified'}</div>
          <div class="emp-loc">${cert.employerCity || ''}</div>
        </div>
        <div class="emp-logo">LOGO</div>
      </div>

      <!-- Name -->
      <div class="cert-body">
        <div class="cert-presented">This certifies that</div>
        <div class="cert-name">${cert.menteeName}</div>
        <div class="cert-role-line">
          has successfully completed the <span class="cert-role">${cert.roleLabel}</span>
          Operator Acceptance Program and demonstrated competency in all required
          areas as specified by ${cert.employerName || 'the certifying authority'}.
        </div>
      </div>

      <!-- Machines passed -->
      ${machineList.length ? `<div class="cert-section">
        <div class="cert-sec-title">🏭 Qualified to Operate</div>
        <div class="cert-pills">${machineList.map(function(m){ return '<span class="cert-pill">'+m+'</span>'; }).join('')}</div>
      </div>` : ''}

      <!-- Measuring equipment -->
      ${measList.length ? `<div class="cert-section">
        <div class="cert-sec-title">📐 Measurement Equipment Sign-Off</div>
        <div class="cert-pills">${measList.map(function(m){ return '<span class="cert-pill">'+m+'</span>'; }).join('')}</div>
      </div>` : ''}

      <!-- Tooling -->
      ${toolList.length ? `<div class="cert-section">
        <div class="cert-sec-title">🔧 Tooling Competency</div>
        <div class="cert-pills">${toolList.map(function(m){ return '<span class="cert-pill">'+m+'</span>'; }).join('')}</div>
      </div>` : ''}

      <!-- Safety -->
      ${safetyList.length ? `<div class="cert-section">
        <div class="cert-sec-title">🦺 Safety Certifications Completed</div>
        <div class="cert-pills">${safetyList.map(function(m){ return '<span class="cert-pill">'+m+'</span>'; }).join('')}</div>
      </div>` : ''}

      <!-- Signatures -->
      <div class="cert-sigs">
        <div class="sig-block">
          <div class="sig-line"><span style="font-family:'Barlow Condensed',sans-serif;font-size:18px;color:#1a1a2e">${cert.mentorName}</span></div>
          <div class="sig-name">${cert.mentorName || '_______________'}</div>
          <div class="sig-title">Mentor / Trainer</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"><span style="font-family:'Barlow Condensed',sans-serif;font-size:18px;color:#1a1a2e">${cert.employerSignature}</span></div>
          <div class="sig-name">${cert.employerSignature || '_______________'}</div>
          <div class="sig-title">Employer / Authorized Sign-Off</div>
        </div>
        <div class="sig-block">
          <div class="sig-line"><span style="font-family:'Barlow Condensed',sans-serif;font-size:18px;color:#1a1a2e">${cert.menteeName}</span></div>
          <div class="sig-name">${cert.menteeName}</div>
          <div class="sig-title">Candidate</div>
        </div>
      </div>

    </div><!-- cert-inner -->

    <!-- Footer -->
    <div class="cert-footer">
      <div>
        <div class="cert-id">Cert ID: ${cert.certId}</div>
        <div class="cert-portable">✓ Portable — present to any employer</div>
      </div>
      <div class="cert-dates">
        <div>Issued: ${issued}</div>
        <div>Expires: ${expires}</div>
      </div>
    </div>

  </div><!-- cert -->
</div>
</body></html>`;
  },

  // Open certificate in new window for print
  openPrintWindow(cert) {
    var html = this.generate(cert);
    var w = window.open('', '_blank', 'width=900,height=700');
    if (w) { w.document.write(html); w.document.close(); }
  },

  // Generate a compact portable record card HTML
  generatePortableCard(exportRecord) {
    var r = exportRecord;
    var cert = r.certificates[0];
    if (!cert) return '<p>No certificate available.</p>';
    var issued = new Date(cert.issuedDate).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});
    return `<div style="background:#fff;border:2px solid #1a1a2e;border-radius:8px;padding:20px;max-width:480px;font-family:'Barlow',sans-serif">
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:11px;letter-spacing:3px;color:#c8a96e;margin-bottom:4px">PORTABLE OAP RECORD</div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:24px;color:#1a1a2e;margin-bottom:2px">${r.mentee.name}</div>
      <div style="font-size:12px;color:#666;margin-bottom:14px">${cert.roleLabel} · ${cert.employerName} · ${issued}</div>
      ${cert.machinesPassed.length ? '<div style="font-size:10px;color:#888;letter-spacing:1px;margin-bottom:5px">QUALIFIED MACHINES</div><div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">' + cert.machinesPassed.map(function(id){ var m=OAP_MACHINES[id]; return '<span style="background:#f0efe8;border:1px solid #ddd;font-size:10px;padding:2px 8px;border-radius:3px">'+(m?m.label:id)+'</span>'; }).join('') + '</div>' : ''}
      <div style="font-family:'Share Tech Mono',monospace;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:8px;margin-top:8px">ID: ${cert.certId} · Expires: ${new Date(cert.expiresDate).toLocaleDateString()}</div>
    </div>`;
  },
};
