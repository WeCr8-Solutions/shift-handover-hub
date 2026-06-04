# 01 — Work Order Management Audit

Scope: end-to-end work order lifecycle from creation to traveler replacement.

Scoring legend: **Excels** · **Adequate** · **Incomplete** · **Missing**

---

## 1.1 Work Order Creation

**Today.** Work orders are created via the Work Orders hub (`src/pages/WorkOrdersHub.tsx`), backed by `queue_items` (67 columns, 9 RLS policies — see `supabase-tables`). Native creation, JobBOSS import, and SAP import all converge on the same hook (`src/hooks/useUnifiedQueue.ts`, mem://features/erp-connector/unified-queue-and-ai-enrichment).

**Score: Adequate.** Creation works; field count is comprehensive.

**Friction.**
- 67 columns on `queue_items` is a smell — it's accreted from too many flows. No clear separation between "header" and "execution context" fields.
- Bulk creation exists (`src/hooks/useBulkUpload.ts`, `src/components/BulkUploadDialog.tsx`) but lacks validation preview ("3 of 12 rows will fail because part_number missing") before committing.
- No template-from-existing-WO ("clone last week's WO for this customer").

**Missing.**
- Sales-order → work-order conversion. Quotes hub exists (`src/pages/QuotesHub.tsx`, `useQuoteSystem.ts`) but the bridge from accepted quote → released WO is manual.
- Customer PO line-item ingestion (CSV/EDI 850).

**Quick wins (<1 sprint).**
- Add "clone WO" action on the WO detail page.
- Bulk-upload preview/dry-run mode.

**Strategic.**
- Decompose `queue_items` into `work_orders` (header) + `work_order_operations` (already in `work_order_routing`, 24 cols) + `work_order_execution_state`. Will require a multi-week migration but unlocks proper costing later.

---

## 1.2 Work Order Release

**Today.** State machine via BEFORE UPDATE triggers (mem://technical/database/state-transition-triggers). States include queued / in_progress / on_hold / completed / cancelled (see `OnHoldWorkOrders.tsx`, `CancelledWorkOrders.tsx`, `CompletedWorkOrders.tsx`).

**Score: Adequate → Incomplete on release gates.**

**Friction.**
- No release checklist (material received, program proven, tools staged, FAI complete, operator certified).
- No "scheduled release date" vs "actual release date" — only `due_date` exists.

**Missing.**
- **Material availability check at release.** Today nothing blocks releasing a WO when `material_lots` shows zero qty.
- **Program release log integration.** `program_release_log` exists (10 cols, 3 policies, `useProgramReleaseLog.ts`) but is not a hard gate on WO release.
- **Operator-certification check at release.** OAP `oap_operator_credentials` (18 cols) is not consulted at release time.

**Quick wins.**
- Wire `useEntitlements`-style gate function: `canReleaseWorkOrder(woId)` returning `{ok, blockers[]}`. Render as collapsible "Release checklist" in WO detail.

**Strategic.**
- Tie release to operator-certification matrix so an aerospace WO cannot be released to a queue whose ops lack a current AS9100-trained operator. Pairs with OAP.

---

## 1.3 Revision Control

**Today.** Routing templates have revisions (`routing_templates`, 9 cols; `routing_template_steps`, 12 cols). `work_order_routing` (24 cols, 6 policies) holds the per-WO instantiation. No engineering-change-notice (ECN) artifact.

**Score: Incomplete.**

**Missing.**
- ECN workflow (draft → review → approve → propagate → notify).
- Drawing/print attachment versioning (which print rev is this WO running?).
- "WOs affected by this ECN" report.

**Quick wins.**
- Add `revision` + `revision_notes` columns to `work_order_routing`; surface diff on traveler.

**Strategic.**
- New `engineering_change_notices` table + UI flow + email digest. Required for AS9100/ISO 9001 audits.

---

## 1.4 Routing Management

**Today.** Routing templates exist with steps; per-WO routing in `work_order_routing`. `pass_work_order_to_next_step` RPC progresses ops (mem://features/work-order/routing-system-architecture). AI Routing Proposal flow allows supervisor-approved routing changes (mem://features/ai-planning-assistant/routing-change-approval).

**Score: Excels** — the AI routing-change approval flow with audit log is genuinely ahead of Epicor/SAP.

**Friction.**
- Routing templates are flat (no sub-routings, no parallel paths).
- No "what-if" simulation before applying a proposed routing change.

**Missing.**
- Parallel/alternate routings (e.g., "OP30 can run on Mazak-A *or* Mazak-B").
- Outside-processing step embedded in routing tree with vendor lead-time roll-up.

**Quick wins.**
- Mark alternate work centers per step as an array column (`alternate_station_ids text[]`); planner can pick during release.

---

## 1.5 Operation Sequencing

**Today.** `work_order_routing.sequence` is the canonical order; `pass_work_order_to_next_step` enforces forward progression.

**Score: Adequate.**

**Missing.**
- Out-of-sequence operation tracking with required-approval flow (common in repair / overhaul workflows).
- Concurrent operations (two ops on the same WO running on different machines simultaneously).

---

## 1.6 Labor Tracking

**Today.** `operator_station_sessions` (9 cols, 5 policies) tracks station check-ins. `current_station_status` reflects who is on a station now.

**Score: Incomplete.**

**Friction.**
- Sessions track presence, not productive labor minutes per WO/op.
- No labor split when one operator runs two stations.

**Missing.**
- Per-operation actual labor minutes (vs estimate).
- Indirect-labor codes (cleanup, training, meeting).
- Daily timecard rollup + supervisor approval flow.
- Export to ADP / Paychex / Gusto / QuickBooks Time.

**Quick wins.**
- Add `wo_id` + `operation_sequence` to `operator_station_sessions` so labor can be attributed to specific ops.

**Strategic.**
- Build a real time-clock module (clock-in/out, breaks, PTO). Adjacent: payroll export. Without this, manufacturing shops keep using a separate time-clock system, which is a daily friction point.

---

## 1.7 Setup Tracking

**Today.** `setup_sheets` (15 cols, 5 policies, `useSetupSheets.ts`) — structured setup sheet artifact per op. Handoff form captures "setup complete? setup notes?" via `NewHandoffForm.tsx`.

**Score: Adequate.**

**Missing.**
- Setup-time vs run-time split in time captured (currently both are bundled into operator session minutes).
- "First good piece" timestamp tied to FAI signoff.

**Quick wins.**
- Two-button start: "Setup start" / "Run start" buttons on operator station, both writing to `operator_station_sessions` with a `phase` enum.

---

## 1.8 Downtime Tracking

**Today.** `downtime_events` (19 cols, 4 policies), captured via the handoff flow and via supervisor "report downtime" actions.

**Score: Adequate, trending Excels.**

**Friction.**
- Downtime reasons are free-text-leaning; no controlled vocabulary by default per org.
- No Pareto chart in supervisor dashboard.

**Missing.**
- MTBF / MTTR per machine.
- Automatic downtime detection from machine-monitoring relay (mem://features/machine-monitoring/relay-infrastructure) — currently manual.

**Quick wins.**
- Per-org reason taxonomy with required category (Mechanical / Tooling / Material / Programming / Inspection / Operator / Other).
- Pareto chart in `ProductionAnalytics.tsx`.

---

## 1.9 Scrap Tracking

**Today.** Mandatory quantity accounting on handoff (mem://features/quality-control/quantity-integrity-enforcement): Completed + Scrap + Rework = Original. Stored on `handoff_records`.

**Score: Excels** at the operator-entry level.

**Missing.**
- Scrap cost roll-up (qty × standard cost) — no standard cost field.
- Scrap reason → NCR linkage (we have `ncr_reports`, 25 cols, but the handoff scrap event does not auto-prompt to create an NCR above a threshold).
- Scrap-by-operator / scrap-by-shift Pareto.

**Quick wins.**
- "Create NCR" button auto-populated from a handoff with scrap > 0.

---

## 1.10 Rework Tracking

**Today.** Rework qty captured in handoff. Rework as a separate routing-step is not modeled.

**Score: Incomplete.**

**Missing.**
- Rework as a generated work order with its own routing, traceable back to the parent WO + originating NCR.
- "Cost of poor quality" (COPQ) report.

**Strategic.**
- New `rework_orders` table referencing `parent_wo_id` and `ncr_id`. Auto-create on NCR disposition = "rework."

---

## 1.11 Completion Processes

**Today.** WO transitions to `completed`; `/work-orders/completed` page exists. `pass_work_order_to_next_step` handles last-op closeout.

**Score: Adequate.**

**Missing.**
- Final inspection signoff gate (today's quality flow does not block completion).
- Customer-facing "Certificate of Conformance" generation.
- Auto-issue of operator credit toward OAP recerts on completed ops (currently manual via `oap_recert_events`).
- Auto-invoice trigger to QuickBooks/NetSuite.

**Quick wins.**
- Generate a printable C of C PDF on WO completion using existing certificate templates (`certificate_templates`, 22 cols).

---

## 1.12 Traveler Replacement Capability

**Today.** Digital traveler at `/work-orders/:id/traveler` (`src/pages/WorkOrderTraveler.tsx`, `useWorkOrderTraveler.ts`, `organization_traveler_settings` 12 cols, 4 policies). Print-ready.

**Score: Excels** — this is the clearest paper-replacement narrative.

**Friction.**
- Print layout per-org customization is limited.
- No barcode/QR on the printed traveler that scans back to the WO page on a phone.

**Quick wins.**
- Add QR code linking to deep-linked traveler URL (mem://technical/routing/deep-linking already supports this).
- Add "operator signoff" stamps with timestamp on each op completion that appear on the printed traveler.

**Strategic.**
- Position "Digital Traveler" as a free standalone trial product → land-and-expand for shops still on paper.

---

## Summary Scorecard

| Capability | Score | Top gap |
|---|---|---|
| WO Creation | Adequate | Quote → WO bridge |
| WO Release | Incomplete | Release gates/checklist |
| Revision Control | Incomplete | ECN workflow |
| Routing Mgmt | **Excels** | Parallel routings |
| Op Sequencing | Adequate | Out-of-sequence approvals |
| Labor Tracking | Incomplete | Time clock + payroll export |
| Setup Tracking | Adequate | Setup/run time split |
| Downtime Tracking | Adequate→Excels | Auto-detect from machine monitor |
| Scrap Tracking | **Excels** | Cost roll-up |
| Rework Tracking | Incomplete | Rework as child WO |
| Completion | Adequate | C of C generation |
| Traveler | **Excels** | QR + signature stamps |

**Overall WO Management grade: B+.** Two excels, three adequate-trending-excels, two real incompletes (release gates, labor tracking) that block enterprise deals.
