# 03 — Department / Persona Audits

One section per persona. Each section: **Today / Friction / Missing / Quick wins / Strategic.**

---

## 3.1 Shop Floor Operator

**Today.**
- Operator Station Kanban (`src/components/dashboard/OperatorStationPanel.tsx`, mem://features/operator-station-dashboard).
- Station check-in (`StationCheckIn.tsx`); session tracked in `operator_station_sessions`.
- Handoff submission (`NewHandoffForm.tsx`) with mandatory quantity accounting.
- Operator tools: speed/feed calc (mem://features/operator-tools/speed-feed-calculator), thread selection (mem://features/operator-tools/thread-selection-system).
- OAP/GCA learning surfaces in-app.
- Handbook references on inspection_tools / machining_operations / GCA / OAP / operator_tool keys (mem://features/handbook/reference-layer).

**Friction.** Quantity-accounting form requires keyboard; no glove mode. No barcode scan for WO lookup.

**Missing.** Voice-to-text for handoff notes. Offline handoff queue. Personal "my numbers this week" view.

**Quick wins.** "My Numbers" widget on operator dashboard (parts produced, scrap%, on-time%); voice-to-text on handoff notes textarea.

**Strategic.** Native mobile app with offline-first handoff queue.

---

## 3.2 Lead (Working Operator with Oversight)

**Today.** No first-class "lead" role; leads are treated as operators with additional team-membership. Team Management lets supervisors reassign work-center membership (mem://features/team-management-system).

**Friction.** Leads cannot dispatch WOs to peers without supervisor permissions. Leads cannot approve other operators' handoffs.

**Missing.** Dedicated "Lead" role between Operator and Supervisor with: dispatch authority for own team, handoff peer-acknowledge, mentor sign-off authority for OAP (currently only certifying mentors can).

**Quick wins.** Add `lead` flag to `team_members` and a `useIsLead` hook; surface "Reassign" + "Acknowledge handoff" actions for leads.

**Strategic.** Tie lead role to GCA/OAP advanced credentials so promotion is data-driven.

---

## 3.3 Supervisor

**Today.**
- Supervisor Dashboard (`SupervisorDashboard.tsx`) with KPI cards, status pie, output chart, utilization, trend, alerts.
- Queue management Kanban/List/Calendar (mem://features/queue-management-system/architecture-and-tracking).
- AI Planning Assistant (mem://features/ai-planning-assistant/capabilities) with live execution context + routing-change approval flow (mem://features/ai-planning-assistant/routing-change-approval).
- Org/team/station management (mem://features/team-management-system, mem://features/shop-organization-structure).
- Notifications (`NotificationPanel.tsx`).

**Friction.** Production Analytics has many small charts; no single "morning brief" landing summary. Bottleneck identification weak (see 02-shop-floor-execution §2.6).

**Missing.** Daily auto-emailed shop summary. Shift-change baton handoff (one supervisor → next).

**Quick wins.** "Morning brief" email digest (parts produced last shift, scrap rate, stations down, today's release plan); bottlenecks tab.

**Strategic.** Position Supervisor Dashboard as the daily home screen — make AI Planning Assistant a persistent sidebar, not a separate tab.

---

## 3.4 Production Manager

**Today.** Inherits supervisor surfaces + Admin (`src/pages/Admin.tsx`) + org settings + entitlements/billing visibility.

**Friction.** No weekly/monthly rollup distinct from daily ops. Capacity planning is heuristic (mem://features/queue/capacity-planning-and-load-balancing) — 8-hour daily threshold, no machine-by-machine finite-capacity model.

**Missing.** Finite-capacity scheduling, demand-driven planning (MRP), throughput trend over months, cost variance.

**Quick wins.** Weekly KPI digest. Configurable per-station daily-hour threshold (override the 8-hour default).

**Strategic.** Finite-capacity scheduler is the #1 gap for this persona. Without it, production managers at 100+ shops cannot trust JobLine as their primary planning system.

---

## 3.5 Manufacturing Engineer

**Today.** Routing templates (`routing_templates`, `routing_template_steps`), setup sheets (`setup_sheets`), machine manuals (`machine_manuals` + `machine_manual_pages`), part catalog (`part_catalog`), routing-step dimensions (`routing_step_dimensions`, 14 cols), AI routing-change approval flow.

**Friction.** Engineering changes have no formal ECN workflow (see 01-work-order-management §1.3). Drawing/print versioning is informal.

**Missing.** ECN module, CAD/print versioned attachments with diff, process-FMEA, control-plan generator, PFMEA→Control-Plan→FAI traceability chain (AS9100 / IATF 16949 staple).

**Quick wins.** "Process notes" timestamped log per routing template; print-revision field on `work_order_routing`.

**Strategic.** Full PFMEA / Control-Plan / FAI chain. This is what wins aerospace + medical shops away from Plex.

---

## 3.6 CNC Programmer

**Today.**
- VS Code extensions for G-Code with multi-dialect intelligence + real-time backend sync (mem://features/integrations/vs-code-extensions).
- G-Code DNC + live streaming via VS Code extension relay (mem://features/manufacturing/gcode-dnc-integration).
- AI "where can I move this program?" portability analysis (mem://features/ai-planning-assistant/programming-portability).
- Setup sheets + program release log (`program_release_log`).

**Friction.** No in-app G-Code editor (programmer leaves to VS Code). No simulation/verify hook.

**Missing.** Program library with version diff in-app. Toolpath simulation viewer (CAMplete/Vericut-class). Post-processor management. NC program approval workflow (programmer → quality → release).

**Quick wins.** Read-only in-app G-Code viewer w/ syntax highlight (the lexer already exists in the extension).

**Strategic.** Programmer module is currently spread across VS Code + setup sheets + program release log. Consolidate into a "Programs" hub at `/programs` with: library, diff, releases, portability analysis, approval queue.

---

## 3.7 Quality Personnel

**Today.**
- `ncr_reports` (25 cols, 4 policies), `ncr_audit_log`, `useNCR.ts`.
- `quality_inspections` (15 cols, 4 policies), `quality_checkpoints` (10 cols, 3 policies).
- `dimension_readings` (12 cols, 4 policies), `dimension_check_requests` (14 cols, 4 policies), `routing_step_dimensions`.
- Certificate templates / issuance ($12 Stripe one-time per project knowledge).

**Friction.** Inspection data is captured but not statistically analyzed.

**Missing.** SPC (Xbar-R, Cpk, Pp/Ppk, control charts). AS9102 FAI Form 1/2/3 generator. Corrective Action Request (CAR) workflow distinct from NCR. Gage R&R study workflow. Supplier quality scorecard.

**Quick wins.** Add basic Cpk per dimension on the dimension trend chart. CAR as `ncr_reports.type='car'` initially.

**Strategic.** SPC + FAI together are table stakes for AS9100 / IATF 16949 / ISO 13485 shops. This is the second-biggest enterprise-readiness gap after finite scheduling.

---

## 3.8 Tool Crib Personnel

**Today.** `inspection_tools` (20 cols, 4 policies), `inspection_tool_categories`, tool proficiency tests (mem://features/oap/tool-proficiency-tests) for measuring tools.

**Friction.** Inspection tools (gages) are tracked; **cutting tools and tool assemblies are not**.

**Missing (large gap).** Cutting-tool inventory, tool-life tracking by use count or cycle time, tool-assembly (holder + collet + tool) records, crib check-out/check-in with operator attribution, tool-presetter integration (Speroni / Zoller), tool-cost roll-up to WO, Tooling Hero / MachiningCloud integration.

**Quick wins.** New `cutting_tools` and `tool_assemblies` tables (mirror structure of `inspection_tools`); barcode check-out UI.

**Strategic.** Tooling Hero integration explicitly called out in request. Partnership + API connector unlocks this entire persona and lets us out-flank both Plex and Epicor (neither does tool-assembly natively at the SMB tier).

---

## 3.9 Maintenance Personnel

**Today.** `equipment` (20 cols, 4 policies), `maintenance_records` (18 cols, 3 policies), `downtime_events` (19 cols, 4 policies) — mem://features/manufacturing/manufacturing-operations-infrastructure.

**Friction.** PMs are records, not schedules. No recurring-PM generator. No work-order linkage when a machine goes down (the maintenance job doesn't enter the same planning queue).

**Missing.** PM schedule generator (every 500 hours, every 90 days, every 10,000 cycles), maintenance work-order type, MTBF/MTTR analytics, condition-based maintenance triggered from machine-monitoring relay, predictive-maintenance ML on vibration/temp data.

**Quick wins.** `maintenance_schedules` table + cron edge function generating PM tasks. Render alongside production WOs with a different visual treatment.

**Strategic.** Predictive maintenance using the machine-monitoring data stream. This is a high-margin add-on for the 100+ machine customer.

---

## 3.10 Purchasing

**Today.** `material_lots` (16 cols, 3 policies), `delivery_requests` (21 cols, 5 policies), outside processing (mem://features/outside-processing-management) via PO numbers + expected return dates.

**Friction.** Outside processing is tracked but no vendor portal — vendors are emailed PO numbers; status updates come back via phone/email.

**Missing.** Vendor master, RFQ workflow, purchase requisition workflow, multi-vendor PO comparison, ASN (advance ship notice) ingestion, EDI 850/810/856, vendor scorecards, raw-material inventory beyond lot tracking, MRP demand-to-supply netting.

**Quick wins.** Vendor master table + per-vendor delivery_requests view. Email-template for outbound PO. Status webhook the vendor can hit.

**Strategic.** Supplier portal as a $X/vendor/mo add-on. EDI gateway as a service (use EDI-as-a-service vendor like SPS Commerce — don't build EDI primitives).

---

## 3.11 Planning & Scheduling

**Today.**
- Queue Management (Kanban/List/Calendar) with hand-ordering via `reorder_queue_item` RPC.
- Capacity planning with 8-hour daily thresholds and load balancing (mem://features/queue/capacity-planning-and-load-balancing).
- AI Planning Assistant evaluates capability + workload + availability with live ERP enrichment (mem://features/ai-planning-assistant/capabilities, mem://features/erp-connector/unified-queue-and-ai-enrichment).
- Shift schedules (`shift_schedules`, 12 cols, 2 policies), shift assignments (`shift_assignments`, 10 cols).

**Friction.** Planning is mostly manual reordering augmented by AI suggestions. No automated schedule generation.

**Missing.** Finite-capacity forward/backward scheduling. Resource-constrained optimization (operator availability × machine availability × tooling availability). Schedule lock + re-plan workflow. Visual Gantt by station.

**Quick wins.** Per-station Gantt view (read-only) from existing queue ordering. AI Planning Assistant prompt: "Schedule WO-1234 by Friday."

**Strategic.** Solver-backed scheduler (open-source OR-Tools, or commercial Preactor-class). This is the single biggest "enterprise gate" feature for the 100-500 person segment.

---

## 3.12 Human Resources

**Today.**
- `operator_profiles` (49 cols), `operator_skills`, `operator_certifications`, `operator_education`, `operator_work_history`, `operator_machine_proficiencies`, `operator_references`, `operator_resume_versions` — comprehensive operator data model.
- OAP credentialing + mentor sign-off (mem://features/oap/tool-proficiency-tests).
- GCA learning + assignments.
- Talent network (`/talent`) with three-tier visibility (mem://features/talent/profile-visibility).
- Profile views tracker (`profile_views`, 7 cols).

**Friction.** No HRIS integration (BambooHR, Rippling, Gusto). No PTO/time-off. No performance review template tied to OAP/GCA progress.

**Missing.** Time-off requests, performance reviews, training matrix per role (we have OAP role programs but no "skills gap by team" view for HR), 1:1 meeting tracking, onboarding checklist (separate from app onboarding).

**Quick wins.** Skills-gap view: per-team, what % of operators are certified on each machining_operation_category. Surface to HR + Production Manager.

**Strategic.** "Workforce Intelligence" report: turnover forecast based on OAP completion velocity, certification age, internal vs external profile views. This is a unique angle no MES has.

---

## 3.13 Executive Leadership

**Today.** Admin (`src/pages/Admin.tsx`) + Supervisor Dashboard. `org_health_snapshots` (13 cols), `organization_usage` (10 cols), `erp_usage_metering` (7 cols), billing visibility for billing roles.

**Friction.** No CEO-grade KPI screen. KPIs scattered across supervisor dashboard, billing, OAP, Talent.

**Missing.** Executive dashboard: revenue impact (requires costing), OEE rollup, on-time delivery, scrap %, capacity forecast, workforce capacity, top-5 bottleneck stations. Multi-site rollup (today we are single-org).

**Quick wins.** New `/dashboard/executive` route: 6-tile KPI grid pulling from existing handoff/WO/station data. Weekly emailed snapshot.

**Strategic.** Multi-site / multi-org rollup for groups that own multiple shops. Adjacent: benchmark anonymized data ("your scrap rate vs peer shops your size") — this is the data-network-effect play.

---

## Cross-Persona Heat Map

| Persona | Today | Friction | Missing | Priority gap |
|---|---|---|---|---|
| Operator | Excels | Glove-mode UI | Native mobile, voice notes | UX polish |
| Lead | Missing role | Permissions | Lead role + dispatch | New role |
| Supervisor | Excels | No morning brief | Bottlenecks tab | Bottlenecks |
| Production Mgr | Adequate | Heuristic capacity | Finite scheduling | **Scheduling** |
| Mfg Engineer | Adequate | No ECN | ECN, PFMEA, Control Plan | **ECN + AS9100 chain** |
| CNC Programmer | Strong (via VS Code) | Fragmented | Programs hub, simulation | Consolidation |
| Quality | Adequate | No SPC | SPC, FAI Forms, CAR | **SPC + FAI** |
| Tool Crib | Weak | No cutting tools | Cutting-tool & assembly mgmt | **Tooling Hero integration** |
| Maintenance | Adequate | No PM schedules | Recurring PMs, predictive | PM scheduling |
| Purchasing | Weak | No vendor portal | Vendor portal, EDI, MRP | **Supplier portal** |
| Planning/Sched | Adequate | Manual+AI | Finite-capacity solver | **Finite scheduling** |
| HR | Strong on credentials | No HRIS | Time-off, perf reviews, skills gap | Skills-gap view |
| Executive | Weak | Scattered KPIs | Exec dashboard, multi-site | Exec dashboard |

**The three persona-level gaps that block the 100-person deal**: finite scheduling, SPC+FAI, supplier portal.
