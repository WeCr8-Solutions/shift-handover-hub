/**
 * Self-contained printable marketing sheets for flyer drops.
 * Each function returns a complete HTML document (Letter size, 0.5" margins)
 * that can be opened in a new window and printed without depending on the
 * app's Tailwind/CSS pipeline.
 *
 * Keep pricing numbers in sync with src/hooks/useSubscription.ts PRICING_TIERS.
 */

import { LOGO_DATA_URI, ICON_DATA_URI } from "./logoData";


const SHARED_STYLES = `
  * { box-sizing: border-box; }
  @page { size: Letter; margin: 0.5in; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #0f172a;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    width: 7.5in;          /* Letter 8.5" - 2 x 0.5" margins */
    min-height: 10in;
    margin: 0 auto;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid #0f172a;
    padding-bottom: 12px;
    margin-bottom: 18px;
    gap: 16px;
  }
  .header-left { display: flex; align-items: center; gap: 14px; }
  .header-logo {
    height: 64px;
    width: auto;
    flex: 0 0 auto;
    object-fit: contain;
  }
  .tagline {
    font-size: 12px;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    font-weight: 600;
    border-left: 2px solid #cbd5e1;
    padding-left: 14px;
  }


  .hero h1 {
    font-size: 30px;
    line-height: 1.15;
    margin: 0 0 6px 0;
    letter-spacing: -0.5px;
  }
  .hero p {
    margin: 0 0 16px 0;
    color: #475569;
    font-size: 14px;
  }
  .footer {
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid #cbd5e1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #475569;
  }
  .footer .url { font-weight: 700; color: #0f172a; }
  .footer .meta { text-align: right; }
  .badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    background: #dbeafe;
    color: #1d4ed8;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .footer-brand { display: flex; align-items: center; gap: 8px; }
  .footer-icon { width: 18px; height: 18px; object-fit: contain; }
`;

const FOOTER_HTML = `
  <div class="footer">
    <div class="footer-brand">
      <img class="footer-icon" src="${ICON_DATA_URI}" alt="" />
      <div>Sign up free at <span class="url">jobline.ai</span> &nbsp;·&nbsp; 14-day trial · No card required</div>
    </div>
    <div class="meta">
      Built for AS9100 / ISO 9001 / ITAR job shops
    </div>
  </div>
`;

const HEADER_HTML = `
  <div class="header">
    <div class="header-left">
      <img class="header-logo" src="${LOGO_DATA_URI}" alt="Jobline.ai" />
      <div class="tagline">The Digital Expeditor &amp; Smart Shift Handoff</div>
    </div>
    <div class="badge">Made for Machinists</div>
  </div>
`;



// ─────────────────────────────────────────────────────────────────────────────
// PRICING SHEET
// ─────────────────────────────────────────────────────────────────────────────

export function getPricingSheetHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Jobline.ai — Pricing</title>
<style>
${SHARED_STYLES}
.tiers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin: 6px 0 16px;
}
.tier {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
}
.tier.featured {
  border-color: #2563eb;
  border-width: 2px;
  background: #f8fafc;
  position: relative;
}
.tier.featured::before {
  content: "MOST POPULAR";
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #2563eb;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 3px 10px;
  border-radius: 4px;
}
.tier h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  letter-spacing: -0.3px;
}
.tier .price {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -1px;
  margin: 4px 0 0;
}
.tier .price small {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}
.tier .sub {
  font-size: 11px;
  color: #475569;
  margin: 2px 0 12px;
  min-height: 28px;
}
.tier ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  flex: 1;
}
.tier li {
  padding-left: 16px;
  position: relative;
  margin-bottom: 4px;
}
.tier li::before {
  content: "✓";
  position: absolute;
  left: 0;
  top: 0;
  color: #2563eb;
  font-weight: 800;
}
.addons {
  background: #f1f5f9;
  border-radius: 10px;
  padding: 14px 16px;
  margin-top: 6px;
}
.addons h2 {
  margin: 0 0 8px 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #0f172a;
}
.addon-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px dashed #cbd5e1;
}
.addon-row:last-child { border-bottom: none; }
.addon-row .name { font-weight: 600; }
.addon-row .price { color: #2563eb; font-weight: 700; }
.faq {
  margin-top: 12px;
  font-size: 11px;
  color: #475569;
  line-height: 1.5;
}
.faq strong { color: #0f172a; }
</style></head>
<body>
<div class="sheet">
  ${HEADER_HTML}

  <div class="hero">
    <h1>Simple, honest pricing — built for the shop floor.</h1>
    <p>From a one-person shop to a 100-station enterprise. Start free, no card needed.</p>
  </div>

  <div class="tiers">
    <div class="tier">
      <h3>Single User</h3>
      <div class="price">$49<small>/mo</small></div>
      <div class="sub">For solo machinists &amp; small shops</div>
      <ul>
        <li>Full dashboard access</li>
        <li>Unlimited handoff submissions</li>
        <li>Real-time station monitoring</li>
        <li>Performance tracking</li>
        <li>Mobile-friendly interface</li>
      </ul>
    </div>

    <div class="tier featured">
      <h3>Team</h3>
      <div class="price">$149<small>/mo</small></div>
      <div class="sub">Up to 10 users — best for growing shops</div>
      <ul>
        <li>Everything in Single User</li>
        <li>Up to 10 users included</li>
        <li>Team management dashboard</li>
        <li>Shared station assignments</li>
        <li>Team analytics &amp; reports</li>
        <li>Priority email support</li>
      </ul>
    </div>

    <div class="tier">
      <h3>Enterprise</h3>
      <div class="price">$399<small>/mo</small></div>
      <div class="sub">10 seats included · $12/seat after</div>
      <ul>
        <li>Everything in Team</li>
        <li>Admin control panel</li>
        <li>SSO &amp; advanced security</li>
        <li>API access</li>
        <li>ERP Connector eligibility</li>
        <li>Dedicated account manager</li>
      </ul>
    </div>
  </div>

  <div class="addons">
    <h2>Optional Add-ons (Enterprise)</h2>
    <div class="addon-row"><span class="name">ERP Connector — Starter (500 syncs/mo)</span><span class="price">$100/mo</span></div>
    <div class="addon-row"><span class="name">ERP Connector — Pro (2,000 syncs/mo)</span><span class="price">$150/mo</span></div>
    <div class="addon-row"><span class="name">ERP Connector — Unlimited (real-time)</span><span class="price">$200/mo</span></div>
    <div class="addon-row"><span class="name">Verified Operator Certificate (AS9100 / ISO)</span><span class="price">$12 one-time</span></div>
  </div>

  <div class="faq">
    <strong>14-day free trial on every paid plan.</strong> Cancel anytime. Standalone G-Code Academy is available for individual operators at a separate per-user price — ask us or visit jobline.ai/resources/gcode-academy.
  </div>

  ${FOOTER_HTML}
</div>
</body></html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURES SHEET
// ─────────────────────────────────────────────────────────────────────────────

export function getFeaturesSheetHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Jobline.ai — Features</title>
<style>
${SHARED_STYLES}
.intro {
  background: #0f172a;
  color: #fff;
  border-radius: 10px;
  padding: 16px 18px;
  margin-bottom: 14px;
}
.intro h1 {
  margin: 0 0 6px 0;
  font-size: 22px;
  letter-spacing: -0.3px;
}
.intro p {
  margin: 0;
  font-size: 13px;
  color: #cbd5e1;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.feature {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 11px 13px;
}
.feature h3 {
  margin: 0 0 4px 0;
  font-size: 13px;
  color: #1d4ed8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.feature p {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: #334155;
}
.compliance {
  background: #f1f5f9;
  border-left: 4px solid #2563eb;
  padding: 10px 14px;
  margin: 14px 0 10px;
  font-size: 12px;
  color: #334155;
  border-radius: 4px;
}
.compliance strong { color: #0f172a; }
.who {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 8px;
  margin: 6px 0 10px;
}
.who div {
  border: 1px dashed #94a3b8;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 11px;
  text-align: center;
  color: #475569;
  font-weight: 600;
}
</style></head>
<body>
<div class="sheet">
  ${HEADER_HTML}

  <div class="intro">
    <h1>Stop losing $$$ on bad handoffs and missing job context.</h1>
    <p>Jobline.ai is the digital expeditor for CNC and precision-machining shops — shift handoffs, work-order tracking, operator certification, and ERP integration in one place.</p>
  </div>

  <div class="grid">
    <div class="feature">
      <h3>Smart Shift Handoff</h3>
      <p>Operators submit structured handoffs per station &amp; shift. Quantity accounting (good / scrap / rework) is enforced so nothing falls through the cracks.</p>
    </div>
    <div class="feature">
      <h3>Live Work-Order Routing</h3>
      <p>8-step routing with auto-progression. Cancellations &amp; holds require a reason — full audit trail, no hard deletes.</p>
    </div>
    <div class="feature">
      <h3>Operator Acceptance Program (OAP)</h3>
      <p>AS9100 / ISO 9001 / OSHA-aligned cert system. Mentor sign-off, retest tracking, printable backup records.</p>
    </div>
    <div class="feature">
      <h3>G-Code Academy (GCA)</h3>
      <p>Self-study with 10 question banks and an in-app test player. Verified completion certs your shop can hire on.</p>
    </div>
    <div class="feature">
      <h3>AI Planning Assistant</h3>
      <p>Real-time view of capability, workload, and machine availability. Suggests where to move programs and routes proposals to supervisors.</p>
    </div>
    <div class="feature">
      <h3>ERP Connector (Optional)</h3>
      <p>Read-through or write-through sync with JobBOSS, SAP S/4HANA, Epicor, and Plex. ITAR orgs default to read-only.</p>
    </div>
    <div class="feature">
      <h3>Machine Monitoring &amp; G-Code DNC</h3>
      <p>Live CNC status via WebSocket bridge plus a VS Code extension for syntax intelligence and program streaming.</p>
    </div>
    <div class="feature">
      <h3>Talent Network</h3>
      <p>Public operator profiles (privacy-controlled) — recruit verified, certified machinists without recruiters.</p>
    </div>
    <div class="feature">
      <h3>Real-time Dashboards</h3>
      <p>Operator station Kanban, supervisor KPIs, admin oversight. Shift-aware analytics with capacity planning.</p>
    </div>
    <div class="feature">
      <h3>Shop Floor Displays</h3>
      <p>Cast queues to TVs over QR, IP, or Bluetooth. Tokenized read-only — safe for the production floor.</p>
    </div>
  </div>

  <div class="compliance">
    <strong>Built for regulated shops:</strong> AS9100 · ISO 9001 · ITAR (US-person declaration gate) · FedRAMP-aligned data isolation · Full RLS multi-tenant security.
  </div>

  <div class="who">
    <div>CNC Operators</div>
    <div>Shift Supervisors</div>
    <div>Org Admins</div>
    <div>Hiring Employers</div>
  </div>

  ${FOOTER_HTML}
</div>
</body></html>`;
}

/** Open the given HTML in a new tab and trigger the print dialog. */
export function openAndPrint(html: string, title: string) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1100");
  if (!win) {
    // Popup blocked — fall back to a data URL download
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  // Wait for layout/fonts before printing
  win.addEventListener("load", () => {
    setTimeout(() => win.print(), 250);
  });
}

/** Download HTML as a file (for emailing to a print shop, etc.). */
export function downloadHtml(html: string, filename: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
