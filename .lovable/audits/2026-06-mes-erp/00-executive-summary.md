# JobLine.ai — Platform Audit & Competitive Roadmap

**Executive Summary** · June 2026 · Codebase-grounded against `main` @ release `2026.6.4`

---

## TL;DR

JobLine.ai is, today, the most operator-first shift-handoff and shop-floor-visibility product on the market for small-and-mid CNC job shops. It has **shipped real depth** in three categories the major MES/ERPs treat as afterthoughts:

1. **Shift handoff as a first-class workflow** (52-column `handoff_records` with quantity accounting, photo evidence, multi-tenant attachments, and a 3-column operator Kanban).
2. **Operator identity & growth** (OAP cert system with mentor sign-off, GCA learning, Talent network, Handbook reference layer, tool proficiency tests).
3. **AI Planning Assistant that sees the actual shop floor** in real time (capability + workload + availability + ERP enrichment + routing-change approval flow).

It also has **real gaps** that will block deals north of ~75 operators today: finite-capacity scheduling, SPC, FAI as a structured workflow (vs free-form `routing_step_dimensions`), MRP/inventory, supplier portal, time & attendance/payroll export, and EDI. These are not surprises — they're the table stakes Plex/Epicor/SAP charge $100k+ ARR to provide.

The strategic question is **not "should we copy Epicor?"** — it's **"which 10 capabilities should we ship to make the 100-person shop fire Epicor for us, and which 15 ERP modules should we deliberately never build, instead exposing via clean ERP connectors?"** This audit answers both.

---

## Headline findings

### Where JobLine excels (keep widening the moat)

| Capability | Evidence | Verdict |
|---|---|---|
| Shift handoff workflow | `handoff_records` (52 cols), `src/components/HandoffCard.tsx`, `src/components/NewHandoffForm.tsx`, mem://features/handoff-system/architecture | **Category-leading.** No competitor treats handoffs as a structured artifact with quantity accounting. |
| Operator station Kanban + check-in | `src/pages/OperatorStation*`, `src/components/dashboard/OperatorStationPanel.tsx`, `current_station_status` (14 cols, 8 policies) | **Best-in-class.** Plex's "Control Panel" is closest; ours is more operator-centric. |
| AI Planning Assistant w/ live execution context | `supabase/functions/ai-planning-assistant/`, `src/hooks/usePlanningAssistant.ts`, mem://features/ai-planning-assistant/* | **Unique.** Epicor Prism / SAP Joule do conversational reporting; nobody else does live "where can I move this program" with effort tiering. |
| Operator credentialing (OAP) with mentor sign-off | `oap_*` tables (15+), `src/pages/OapHub.tsx`, `src/pages/OapWalkthrough.tsx`, mem://features/oap/tool-proficiency-tests | **No direct ERP analog.** Closest is Plex Workforce + 3rd-party LMS bolt-ons. |
| Talent network tied to verified competencies | `operator_profiles` (49 cols), `/talent/:username`, `oap_certificates`, mem://features/talent/* | **Unique.** This is the LinkedIn-for-machinists wedge. No MES has it. |
| G-Code DNC + VS Code extension | `useDNCConnector`, `useJobLineRelay`, mem://features/integrations/vs-code-extensions, mem://features/manufacturing/gcode-dnc-integration | **Differentiator.** Most MES DNC is a 1998-vintage Windows app. |
| Multi-tenant + ITAR hardening | mem://technical/database/multi-tenant-isolation-hardening, mem://technical/security/database-hardening, `enforce_itar_read_through` trigger | **Enterprise-ready.** Most SMB MES products fail this audit. |
| Three-path data architecture (Native / JobBOSS / SAP) | `useUnifiedQueue`, `src/connectors/sap/`, mem://features/integrations/three-path-architecture, mem://features/erp-connector/persistence-modes | **Unusually elegant.** Lets us land both green-field and ERP-replacement-resistant customers. |

### Where JobLine has critical gaps (top 10)

1. **Finite-capacity / forward-backward scheduling.** Today `useLoadBalancer` is heuristic-based and `queue_items` is hand-ordered via `reorder_queue_item` RPC. Plex/Epicor have constraint-based schedulers. **Blocks 100+ operator deals.**
2. **MRP / netting / demand-driven planning.** No bill-of-materials explosion, no demand netting, no purchase-requisition auto-generation. `part_catalog` exists (15 cols) but is a part list, not a BOM tree.
3. **Statistical Process Control (SPC).** `dimension_readings` (12 cols) captures inspection data but there are no Xbar-R / Cpk / control charts. Quality teams in regulated shops require this.
4. **First-Article Inspection (FAI) as a structured form.** AS9102 FAI is a federal aerospace requirement. We have `routing_step_dimensions` + `dimension_check_requests` but no AS9102 Form 1/2/3 generator.
5. **Tool life & tool-crib inventory.** `inspection_tools` (20 cols) covers gages but tool-life tracking, tool-assembly management, and crib check-out/check-in are absent. ("Tooling Hero integration opportunity" called out in request.)
6. **Inventory / lot traceability beyond raw material.** `material_lots` (16 cols) exists but WIP/finished-goods inventory, cycle counts, and serialized traceability genealogy are missing.
7. **Supplier portal & EDI.** Outside processing is tracked (mem://features/outside-processing-management) but vendor login, ASN/856, 850/810, and electronic POs do not exist.
8. **Time & attendance / payroll export.** `operator_station_sessions` (9 cols) tracks check-ins but there is no clock-in/clock-out, no PTO, no overtime calc, no ADP/Paychex/Gusto export.
9. **Costing — true job cost roll-up.** We track labor and parts but there's no standard-vs-actual variance, no overhead application, no WIP financial valuation. Accounting teams cannot use today's data for COGS.
10. **OEE in the strict sense.** `current_station_status` + `downtime_events` give us Availability and (with rework/scrap from handoffs) Quality, but Performance requires ideal-cycle-time per operation — not consistently captured.

### Strategic posture vs the named competitors

| Competitor | Their strength | Where we beat them | Where they beat us | Recommended posture |
|---|---|---|---|---|
| **Epicor (Kinetic + MES)** | Full ERP, finite scheduling, deep mfg cost | Operator UX, handoffs, AI, time-to-deploy | MRP, finance, scheduling | **Replace at <50 ops, integrate at 50-200, defer at 200+.** |
| **SAP S/4HANA Mfg** | Enterprise reach, finance, GRC | Everything operator-facing, deployment cost | Everything finance, supply chain | **Never replace — coexist via `sap-sync` connector.** |
| **Plex MES** | OEE, traceability, IoT, food/pharma | Handoffs, operator credentialing, AI, price | Quality (SPC, FAI), serialization, EDI | **Direct competitor at 25-150 ops. Closing the quality gap wins this segment.** |
| **Oracle Mfg Cloud** | Enterprise, finance | Cost, deployment, operator focus | Everything finance/supply | **Never replace — coexist.** |
| **Infor CloudSuite Industrial** | Industry depth, configurable | Mobile UX, AI, deployment speed | MRP, finance | **Replace at <75 ops, integrate above.** |
| **NetSuite Mfg** | Finance-led, light MES | Real shop-floor depth, operator UX | Finance, MRP | **Coexist — NetSuite stays as GL, JobLine owns shop floor.** |

### What we should deliberately **never** build

These are the modules that turn MES products into bloated ERPs. We don't win by adding them — we win by being the system that connects cleanly to whichever the customer already has:

- General ledger, AR, AP
- Full HRIS / benefits administration / 401(k)
- Treasury, fixed-asset depreciation
- CRM beyond a lightweight customer record
- Warehouse Management (full WMS — bins, wave picking, RF guns)
- Commerce / order entry beyond quote-to-cash basics
- Tax filing, multi-currency consolidation, IFRS reporting

The wedge stays: **MES + Workforce + Talent + AI**, with first-class connectors to whatever back-office the customer already runs.

---

## Why a 20 / 100 / 500-person shop buys JobLine

- **20-person shop** buys for **shift handoff + work-order visibility + free trial → $X/seat**, replaces whiteboard + Slack threads. Critical path: onboarding < 1 hour, mobile-first, no IT required. **We are already here.**
- **100-person shop** buys for **AI Planning + Talent retention + ITAR-ready compliance + OEE rollup**, displaces JobBOSS/E2 or a half-implemented Epicor MES. Critical path: SPC + FAI + finite scheduling + time clock + ERP coexistence. **We are 60-70% here.** This is the **2026 growth target.**
- **500-person shop** buys JobLine **as the operator layer on top of SAP/Oracle**, not as a replacement. Critical path: SSO/SAML, audit log export, EDI for outside processing, supplier portal, signed-attestation cert chain for FAR/DFARS, region failover. **We are 30-40% here.** This is the **2027 target.**

---

## How to read the rest of this audit

| File | Use it when… |
|---|---|
| `01-work-order-management.md` | Reviewing the WO lifecycle for a specific gap (release, revision, scrap, traveler). |
| `02-shop-floor-execution.md` | Pitching the "Digital Expeditor" narrative or scoping shop-floor demos. |
| `03-department-audits.md` | Building persona-targeted features or marketing pages. Each of the 13 personas has a section. |
| `04-competitive-matrix.md` | Sales-engineering response to "how do you compare to X?" |
| `05-intelligence-roadmap.md` | Quarterly AI / integration planning. |
| `06-executive-review.md` | Board / investor narrative, top-25 missing features, top-10 differentiators. |
| `07-roadmap-30-90-365.md` | Sprint planning. Each item links back to a gap row. |
| `appendix-a-file-index.md` | Quick `file:line` lookup for any citation in this report. |
| `appendix-b-data-model-map.md` | Which of the 180+ tables back which capability. |

All "current state" claims about JobLine cite source files or table names. All competitor claims are from public documentation and product knowledge — they are **not** codebase-grounded and may lag the competitor's current release.
