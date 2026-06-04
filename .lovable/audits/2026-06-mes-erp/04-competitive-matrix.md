# 04 — Competitive Matrix

JobLine.ai vs Epicor Kinetic+MES · SAP S/4HANA Manufacturing · Plex MES · Oracle Mfg Cloud · Infor CloudSuite Industrial · NetSuite Manufacturing.

**Cell legend:** ✅ Solid · 🟡 Partial · ❌ Absent · 🚫 Intentionally out of scope

**Source:** JobLine cells are codebase-grounded. Competitor cells are from public product docs and general industry knowledge as of mid-2026; they may lag actual current releases.

---

## A. Shop Floor Execution

| Capability | JobLine | Epicor | SAP S/4 Mfg | Plex | Oracle Mfg | Infor CSI | NetSuite Mfg |
|---|---|---|---|---|---|---|---|
| Shift handoff (structured) | ✅ category-leading | ❌ | ❌ | 🟡 (shift logs) | ❌ | ❌ | ❌ |
| Operator Kanban / station UI | ✅ | 🟡 | 🟡 (MES UI) | ✅ | 🟡 | 🟡 | ❌ |
| Quantity accounting integrity | ✅ trigger-enforced | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | ❌ |
| Live status + realtime | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ❌ |
| Digital traveler | ✅ | 🟡 (paper-first) | 🟡 | 🟡 | 🟡 | 🟡 | ❌ |
| Mobile-first operator UX | ✅ | ❌ | ❌ | 🟡 | ❌ | ❌ | ❌ |
| Floor map | ❌ | 🟡 | ❌ | ✅ | 🟡 | 🟡 | ❌ |
| Barcode/QR scan | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Native mobile app | ❌ | 🟡 | ✅ | ✅ | ✅ | 🟡 | 🟡 |
| Offline operator capture | ❌ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | ❌ |

**Recommendation per ❌/🟡:**

| Gap | Priority | Effort | Notes |
|---|---|---|---|
| Floor map | High | M | Reuse existing station detail view |
| Barcode/QR scan | High | S | BarcodeDetector API + camera |
| Native mobile app | High | XL | Capacitor wrap of operator surfaces |
| Offline capture | Medium | L | Service-worker + queue + sync |

---

## B. Work Order Management

| Capability | JobLine | Epicor | SAP | Plex | Oracle | Infor | NetSuite |
|---|---|---|---|---|---|---|---|
| Work order creation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| WO release w/ gates | 🟡 | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Engineering Change Notice | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Routing template + per-WO override | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Parallel/alternate routings | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Outside-processing tracking | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Scrap qty integrity | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Scrap → NCR auto-link | ❌ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ❌ |
| Rework as child WO | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Cert of Conformance gen | 🟡 (templates exist) | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| WO cancellation/hold audit | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |

| Gap | Priority | Effort |
|---|---|---|
| WO release gates checklist | Critical | M |
| ECN module | Critical | L |
| Parallel/alternate routings | High | M |
| Scrap → NCR auto-link | High | S |
| Rework as child WO | High | M |
| C of C generation | High | S |

---

## C. Scheduling & Capacity Planning

| Capability | JobLine | Epicor | SAP | Plex | Oracle | Infor | NetSuite |
|---|---|---|---|---|---|---|---|
| Capacity heuristic (daily threshold) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Finite-capacity scheduler | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Forward + backward scheduling | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Constraint solver (resources × ops × tooling) | ❌ | 🟡 | ✅ | 🟡 | 🟡 | 🟡 | ❌ |
| Drag-to-reorder queue | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | 🟡 |
| Visual Gantt by station | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| AI-suggested schedule | ✅ (Planning Assistant) | 🟡 | 🟡 (Joule) | 🟡 | 🟡 | 🟡 | ❌ |
| What-if simulation | ❌ | ✅ | ✅ | ✅ | ✅ | 🟡 | ❌ |

| Gap | Priority | Effort |
|---|---|---|
| **Finite-capacity scheduler** | **Critical (enterprise gate)** | **XL** |
| Visual Gantt | Critical | L |
| What-if simulation | High | L |

---

## D. Quality Management

| Capability | JobLine | Epicor | SAP | Plex | Oracle | Infor | NetSuite |
|---|---|---|---|---|---|---|---|
| NCR workflow | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| In-process dimension capture | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| SPC (Xbar-R, Cpk) | ❌ | 🟡 | ✅ | ✅ | ✅ | 🟡 | ❌ |
| FAI / AS9102 forms | ❌ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ❌ |
| CAR (Corrective Action Request) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| PFMEA / Control Plan | ❌ | 🟡 | ✅ | ✅ | ✅ | 🟡 | ❌ |
| Gage R&R | ❌ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ❌ |
| Tool/gage calibration tracking | ✅ (inspection_tools) | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Supplier quality scorecard | ❌ | 🟡 | ✅ | ✅ | ✅ | 🟡 | ❌ |

| Gap | Priority | Effort |
|---|---|---|
| **SPC** | **Critical (regulated shops)** | **L** |
| **FAI / AS9102** | **Critical (aerospace)** | **L** |
| CAR | High | M |
| PFMEA / Control Plan | High | XL |

---

## E. Inventory · MRP · Supply Chain

| Capability | JobLine | Epicor | SAP | Plex | Oracle | Infor | NetSuite |
|---|---|---|---|---|---|---|---|
| Part catalog | 🟡 (flat) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bill of materials (multi-level) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Material lot tracking | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| WIP / FG inventory | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| MRP run | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cycle counts | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Serialization / traceability | 🟡 (lot only) | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Vendor portal | ❌ | ✅ | ✅ | ✅ | ✅ | 🟡 | 🟡 |
| EDI 850/810/856 | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Auto PO from MRP | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**Strategic note.** Most of column E is **deliberate out-of-scope** for JobLine. We win by **connecting** to the customer's existing inventory/MRP system, not by replacing it. Exceptions where we should build:
- Multi-level BOM (needed for accurate costing).
- Supplier portal (operator-adjacent, big differentiator).

| Gap | Priority | Effort |
|---|---|---|
| Multi-level BOM | High | L |
| Supplier portal | High | L |
| EDI gateway (via 3rd party) | Medium | M |
| Full MRP | 🚫 out of scope | — |
| Cycle counts / WMS | 🚫 out of scope | — |

---

## F. Tool & Asset Management

| Capability | JobLine | Epicor | SAP | Plex | Oracle | Infor | NetSuite |
|---|---|---|---|---|---|---|---|
| Inspection tool (gage) registry | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Gage calibration tracking | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Cutting tool inventory | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Tool assembly tracking | ❌ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | ❌ |
| Tool life tracking | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Tool crib check-out/in | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Tool-presetter integration | ❌ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | ❌ |
| Tooling Hero / MachiningCloud sync | ❌ | ❌ | ❌ | 🟡 | ❌ | ❌ | ❌ |

| Gap | Priority | Effort |
|---|---|---|
| Cutting tool inventory + life | **High** | **L** |
| Tool crib check-in/out | High | M |
| **Tooling Hero integration** | **High (differentiator)** | M |

---

## G. Maintenance

| Capability | JobLine | Epicor | SAP | Plex | Oracle | Infor | NetSuite |
|---|---|---|---|---|---|---|---|
| Equipment registry | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Maintenance records (history) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Downtime events | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Scheduled PMs (recurring) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| MTBF / MTTR analytics | ❌ | 🟡 | ✅ | ✅ | ✅ | 🟡 | ❌ |
| Condition-based maintenance | ❌ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ❌ |
| Predictive maintenance (ML) | ❌ | 🟡 | 🟡 (AI) | ✅ | 🟡 | 🟡 | ❌ |

| Gap | Priority | Effort |
|---|---|---|
| Recurring PM schedules | High | M |
| MTBF / MTTR | High | S |
| Predictive maintenance | Medium | XL (after data history exists) |

---

## H. Labor · Time · HR

| Capability | JobLine | Epicor | SAP | Plex | Oracle | Infor | NetSuite |
|---|---|---|---|---|---|---|---|
| Station check-in sessions | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Per-WO labor attribution | 🟡 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Clock-in/clock-out (time clock) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| PTO / overtime / break tracking | ❌ | 🟡 | ✅ | 🟡 | ✅ | 🟡 | 🟡 |
| Payroll export (ADP/Paychex/Gusto) | ❌ | 🟡 | ✅ | 🟡 | ✅ | 🟡 | 🟡 |
| Operator credential registry (OAP) | ✅ unique | ❌ | ❌ | 🟡 | ❌ | ❌ | ❌ |
| Operator learning (GCA) | ✅ unique | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Talent network | ✅ unique | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Skills-gap analytics | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | ❌ |

| Gap | Priority | Effort |
|---|---|---|
| Per-WO labor minutes | Critical | M |
| Time clock | Critical | L |
| Payroll export | High | M |
| Full HRIS | 🚫 out of scope | — |

---

## I. Costing & Finance

| Capability | JobLine | Epicor | SAP | Plex | Oracle | Infor | NetSuite |
|---|---|---|---|---|---|---|---|
| Job costing (actual labor + material) | 🟡 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Standard vs actual variance | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Overhead application | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| WIP valuation | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| General ledger | 🚫 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AP/AR | 🚫 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| QuickBooks import (Quotes) | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |
| QuickBooks/NetSuite export | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

| Gap | Priority | Effort |
|---|---|---|
| Std-vs-actual variance | High | M |
| WIP valuation | High | L |
| QB/NS export | High | M |
| GL / AP / AR | 🚫 out of scope | — |

---

## J. OEE / Analytics

| Capability | JobLine | Epicor | SAP | Plex | Oracle | Infor | NetSuite |
|---|---|---|---|---|---|---|---|
| Availability (uptime %) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Performance (vs ideal cycle) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Quality (first-pass yield) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| OEE rollup | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Customizable dashboards | 🟡 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pareto/bottleneck analysis | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| Drill-down from KPI to operator | ✅ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ❌ |
| Cross-shop benchmarking | ❌ | ❌ | ❌ | 🟡 | ❌ | ❌ | ❌ |

| Gap | Priority | Effort |
|---|---|---|
| Ideal cycle time per op (→ Performance %) | High | M |
| True OEE rollup | High | S (after Performance) |
| Pareto charts | High | S |
| Benchmarking (anonymized) | Medium | XL (data network effect) |

---

## K. Integration · Platform

| Capability | JobLine | Epicor | SAP | Plex | Oracle | Infor | NetSuite |
|---|---|---|---|---|---|---|---|
| MTConnect | ❌ | 🟡 | 🟡 | ✅ | 🟡 | 🟡 | ❌ |
| OPC-UA | ❌ | 🟡 | ✅ | ✅ | ✅ | 🟡 | ❌ |
| ERP connector: JobBOSS | ✅ | — | — | — | — | — | — |
| ERP connector: SAP S/4 | ✅ scaffold | — | native | — | — | — | — |
| ERP connector: Epicor | ❌ | native | — | — | — | — | — |
| ERP connector: NetSuite | ❌ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | native |
| Webhooks (org-configurable) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Public REST API | 🟡 (Supabase) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SSO/SAML | 🟡 (Supabase Auth) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| SCIM provisioning | ❌ | 🟡 | ✅ | 🟡 | ✅ | 🟡 | 🟡 |
| Audit log export | 🟡 (per-table) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

| Gap | Priority | Effort |
|---|---|---|
| MTConnect adapter | **Critical (any CNC shop with 2015+ machines)** | M |
| OPC-UA client | High | L |
| Public REST API (versioned) | High | M |
| SSO/SAML hardening | High | M |
| SCIM | Medium (enterprise gate) | M |
| Centralized audit-log export | Medium | S |

---

## L. Compliance · Security

| Capability | JobLine | Epicor | SAP | Plex | Oracle | Infor | NetSuite |
|---|---|---|---|---|---|---|---|
| ITAR-aware data isolation | ✅ (trigger-enforced) | ✅ | ✅ | 🟡 | ✅ | 🟡 | 🟡 |
| US-person declaration flow | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | ❌ |
| Multi-tenant RLS | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | ✅ |
| Audit trail (cancel/hold/etc) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AS9100/ISO9001 doc support | 🟡 (OAP) | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 |
| FedRAMP | ❌ | 🟡 | ✅ | ✅ | ✅ | 🟡 | ❌ |
| GDPR / data export | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cookie consent (Mode v2) | ✅ | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 |

**JobLine excels on compliance for an SMB-focused product**, including ITAR isolation that most peer products at our price tier do not enforce.

---

## Summary Capability Score

| Category | JobLine grade | Closest competitor |
|---|---|---|
| Shop Floor Execution | **A−** | Plex |
| Work Order Mgmt | **B+** | Epicor |
| Scheduling & Capacity | **C** | Epicor / SAP |
| Quality Mgmt | **C+** | Plex |
| Inventory · MRP · SC | **D** (mostly intentional) | SAP / Oracle |
| Tool & Asset Mgmt | **C−** | Plex |
| Maintenance | **C+** | SAP / Plex |
| Labor · Time · HR | **B** (unique on OAP/Talent, weak on time clock) | Plex |
| Costing & Finance | **C−** (mostly intentional) | NetSuite |
| OEE / Analytics | **B−** | Plex |
| Integration · Platform | **B** | Epicor |
| Compliance · Security | **B+** | SAP |

**Strategic read:** We are at parity-or-better with the named ERPs on Shop Floor Execution, ahead on Labor/Talent/OAP/AI, and deliberately behind on Inventory/MRP/Finance. The deltas that **must close** for mid-market wins: Scheduling, Quality, Tool Mgmt, MTConnect/OPC-UA.
