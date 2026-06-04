# 06 — Executive Review

The board-deck file. Honest answers to the seven strategic questions.

---

## 6.1 Why would a 20-person machine shop buy JobLine.ai?

**Pain it replaces.** Whiteboard + Slack + paper traveler + Excel.

**Wedge.** Shift handoff. The owner walks in at 5:30 AM, opens JobLine on a phone, sees what happened on night shift, sees which WOs are at-risk, sees which station is down — all in 30 seconds. No phone calls, no chasing.

**Pricing fit.** Single + Team tiers, $X/seat. < 1-hour onboarding (mem://features/onboarding/workflow-and-reset). Free trial enforced server-side (mem://features/subscription/governance-and-trial-enforcement).

**Threats to closing.**
- Spreadsheet inertia.
- Distrust of "the cloud" in ITAR-adjacent shops — countered by ITAR-aware data isolation already enforced (mem://features/erp-connector/persistence-modes).

**State today: Ready to sell.** Convert the "Digital Expeditor" + "Shift Handoff" marketing pages into hand-holdy sales motions. Add a "20-person shop in a day" case study.

---

## 6.2 Why would a 100-person manufacturer buy JobLine.ai?

**Pain it replaces.** Half-implemented JobBOSS / E2 / Global Shop / under-utilized Epicor MES.

**Wedge.** AI Planning Assistant + operator-first UX + ITAR compliance + Talent retention. "Your $80k/yr Epicor MES seat got installed in 2019 and your operators still use paper. Try the system they'll actually use."

**Pricing fit.** Enterprise tier with per-station + per-seat pricing.

**Threats to closing today.**
- Finite-capacity scheduling gap.
- SPC + FAI gap (kills aerospace + medical deals).
- Time clock / payroll-export gap.
- Customer asks "what about MRP?" — we answer "use your existing ERP via our connector."

**State today: 60-70% ready.** Without finite scheduling + SPC/FAI + time clock, the 100-person prospect has a real reason to pick a competitor. **These three gaps are the 2026 H2 priority.**

---

## 6.3 Why would a 500-person manufacturer buy JobLine.ai?

**Pain it replaces.** Operator-facing layer on top of SAP/Oracle. (We do not replace SAP. We become the screen the operator actually uses.)

**Wedge.** SAP S/4 connector with persistence-mode-aware sync (mem://features/erp-connector/sap-phase-5). Operators get a modern UX; finance keeps SAP as source of truth.

**Pricing fit.** Enterprise + per-site licensing. Six-figure ACV.

**Threats to closing today.**
- SSO/SAML hardening + SCIM provisioning.
- Multi-site rollup (we are single-org today).
- Centralized audit-log export.
- FedRAMP / SOC 2 Type II.
- Region failover.
- 24/7 enterprise support SLA.

**State today: 30-40% ready.** Not the 2026 priority. Pick 1-2 SAP-adjacent reference customers in 2026 to prove the connector at scale; defer general 500-person GTM to 2027.

---

## 6.4 What is our unique advantage versus MES competitors?

Ranked:

1. **Shift handoff as a structured artifact.** Nobody else does it. It's the wedge that gets us in the door at every shop.
2. **AI Planning Assistant with live ERP-enriched execution context.** Differentiated even vs SAP Joule + Epicor Prism.
3. **Operator identity layer (OAP + GCA + Talent).** No MES has career-path / credentialing / mobility built into the daily workflow. This creates **employer-side stickiness** (the data lives with us) AND **operator-side stickiness** (the credentials follow the operator across jobs).
4. **Three-path data architecture** (Native / JobBOSS / SAP). We can land both green-field and ERP-locked customers without architectural rework.
5. **Mobile-first / web-first deployment.** No Windows installer, no IT project, no Citrix farm.
6. **Modern engineering practices.** Multi-tenant RLS + ITAR triggers + edge functions + Realtime are not "old MES" defaults.
7. **VS Code G-Code extensions.** Programmers love us before they ever log into the app.

---

## 6.5 What functionality should we NEVER copy from ERP systems?

Pure-finance + pure-supply-chain modules. Specifically:

1. General Ledger
2. Accounts Payable / Receivable
3. Treasury / cash management
4. Fixed-asset depreciation
5. Tax filing / multi-currency consolidation / IFRS
6. Full HRIS (benefits admin, 401(k), COBRA, ACA reporting)
7. Full WMS (bins, wave picking, RF guns, slotting optimization)
8. CRM beyond a lightweight customer record
9. Order management / e-commerce
10. Field service management
11. Project accounting / PSA
12. EDI primitives (use SPS Commerce / Cleo as a partner)
13. Production-line MES for process industries (chemicals, food batches)
14. Compliance suites unrelated to manufacturing (SOX automation, etc.)
15. Marketing / sales automation

**The discipline:** for each of these, the right answer is a **connector**, not a feature.

---

## 6.6 What must exist before enterprise sales begin?

Hard gates (cannot demo without):

1. SSO/SAML hardened with provider tested (Okta, Azure AD, Google Workspace).
2. SCIM 2.0 provisioning.
3. Multi-site / multi-org rollup with a parent-tenant model.
4. Centralized audit-log export (SIEM-friendly).
5. SLA-backed support tier (24/7 P0).
6. SOC 2 Type II report on file.
7. Documented Disaster Recovery (RTO/RPO) and tested.
8. Penetration test report from a recognized firm.
9. Versioned public REST API + SDK.
10. EU + US data-residency commitment.

Soft gates (enterprise procurement asks for):

11. FedRAMP Moderate (for federal/defense).
12. ISO 27001.
13. HIPAA BAA (if medical device shop on-prem servers handle PHI — usually no, but asked).
14. Vendor security questionnaire pre-fill (SIG, CAIQ).
15. Cyber-insurance certificate.

**Status: 0 of 10 hard gates fully complete.** 2027 work, not 2026.

---

## 6.7 Top 25 missing features blocking large-scale adoption

Ordered by sales-blocking severity:

| # | Feature | Persona | Effort |
|---|---|---|---|
| 1 | Finite-capacity / constraint-based scheduler | Production Mgr | XL |
| 2 | SPC (Xbar-R, Cpk, control charts) | Quality | L |
| 3 | AS9102 FAI Form 1/2/3 generator | Quality | L |
| 4 | Time clock + payroll export (ADP/Paychex/Gusto) | HR / Ops | L |
| 5 | MTConnect adapter | Mfg Engineer | M |
| 6 | ECN module (engineering change notice) | Mfg Engineer | L |
| 7 | Cutting-tool inventory + tool life | Tool Crib | L |
| 8 | Vendor / supplier portal | Purchasing | L |
| 9 | Visual Gantt schedule by station | Planner | L |
| 10 | Multi-level BOM | Mfg Engineer | L |
| 11 | Per-WO labor minutes (vs station sessions only) | Costing | M |
| 12 | Std-vs-actual cost variance | Production Mgr / Finance | M |
| 13 | Recurring PM schedule generator | Maintenance | M |
| 14 | Cert-of-Conformance PDF generator | Quality / Customer | S |
| 15 | Scrap → NCR auto-link | Quality | S |
| 16 | Rework as child WO | Production Mgr | M |
| 17 | SSO/SAML hardening + SCIM | IT / Security | M |
| 18 | Multi-site / multi-org rollup | Executive | L |
| 19 | OPC-UA client | Maintenance / Ops | L |
| 20 | Pareto / bottleneck analytics tab | Supervisor | S |
| 21 | Workforce skills-gap dashboard | HR / Production Mgr | S |
| 22 | True OEE (capture ideal cycle time) | Executive | M |
| 23 | Native mobile app (Capacitor) | Operator | XL |
| 24 | Floor map view | Supervisor | M |
| 25 | Epicor Kinetic ERP connector | Mfg Engineer / Ops | M |

**The top 8** items are the difference between losing a 100-person deal and winning it. Everything above #15 should be on the 2026 plan; everything below is 2027 unless a deal pulls it forward.

---

## 6.8 Top 10 differentiators that make JobLine.ai category-defining

The features that, taken together, make us not "MES #47" but a new category — call it **Manufacturing Workforce Execution (MWX).**

| # | Differentiator | Status | Strategic value |
|---|---|---|---|
| 1 | **Shift handoff as a structured artifact** | ✅ Shipped | The wedge. |
| 2 | **OAP credentialing with mentor sign-off** | ✅ Shipped | Employer stickiness. |
| 3 | **G-Code Academy in-app** | ✅ Shipped | Operator engagement. |
| 4 | **Talent network tied to verified competencies** | ✅ Shipped | Two-sided network effect. |
| 5 | **AI Planning Assistant with live ERP enrichment + routing-change approval flow** | ✅ Shipped | The "wow" demo. |
| 6 | **Three-path data architecture (Native / JobBOSS / SAP)** | ✅ Shipped | Sells past ERP incumbency. |
| 7 | **ITAR-aware persistence-mode + US-person declaration** | ✅ Shipped | Defense/aerospace gate. |
| 8 | **Operator-first mobile UX with quantity-accounting integrity** | ✅ Shipped | The reason operators actually log in. |
| 9 | **Handbook reference layer (Machinery's-Handbook-style canonical catalog)** | ✅ Shipped | Trust + SEO + AI grounding. |
| 10 | **VS Code G-Code extensions with backend sync** | ✅ Shipped | Programmer love-affair → org-wide adoption. |

**All 10 are already shipped.** The category is real. The marketing has not caught up yet — `/why-jobline` and the `/features/*` pages tell parts of the story but no single page synthesizes the MWX positioning. **2026 Q3 marketing priority: a "What is Manufacturing Workforce Execution?" pillar page.**

---

## 6.9 The Strategic Frame

Three sentences:

> The 100-person job shop will buy from JobLine because we are the only product that treats the operator as the system's primary user.
>
> We will close the enterprise gap not by becoming an ERP, but by becoming the workforce-and-execution layer that every ERP wishes it had.
>
> The defensible moat is the operator data — credentials, learning, talent profile, handoff history — that lives with us and follows the operator across jobs, creating both employer-side stickiness and operator-side gravity that no MES competitor can replicate without rebuilding from scratch.
