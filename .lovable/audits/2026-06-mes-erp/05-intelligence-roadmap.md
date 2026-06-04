# 05 — Manufacturing Intelligence Roadmap

AI · ML · IoT · Integrations. What exists, what's near, what's strategic.

---

## 5.1 AI-Assisted Scheduling

**Today.** AI Planning Assistant evaluates Capability + Workload + Availability with live ERP enrichment (mem://features/ai-planning-assistant/capabilities, mem://features/erp-connector/unified-queue-and-ai-enrichment). Routing-change approval flow via `RoutingProposalCard` → `apply-routing-change` edge function with org/role/step validation + audit log (mem://features/ai-planning-assistant/routing-change-approval). Programming portability analysis with 4-tier effort classification (mem://features/ai-planning-assistant/programming-portability).

**Status: Shipped.** Probably the single most differentiated AI feature in the SMB MES space.

**Next.**
- Constraint-aware schedule generation ("schedule all open WOs to minimize tardiness given current staffing"). Pair with finite-capacity solver (OR-Tools).
- What-if simulation: "what happens to on-time delivery if Mazak-2 goes down for 3 days?"
- Workforce-aware scheduling: only assign ops to operators with current OAP cert + sufficient GCA mastery.

**Risk.** AI Planning Assistant is currently advisory. Until it can write a schedule and have supervisors approve it, it doesn't replace a planning meeting.

---

## 5.2 Predictive Maintenance

**Today.** Foundation only — `equipment`, `maintenance_records`, `downtime_events`, `current_station_status`, machine-monitoring relay.

**Status: Not built.**

**Path to MVP.**
1. Capture sufficient downtime + machine-monitoring history per machine (need 90+ days at-volume).
2. Per-machine anomaly detection on cycle-time drift, axis-load drift, temperature, vibration if available.
3. Surface as "Maintenance risk: this machine has 3x normal axis-load on Z; recommend inspection." Don't claim "we predicted the failure" — claim "we surfaced the anomaly."

**Effort.** XL. Defer until 2027 once data corpus is large enough.

---

## 5.3 ML Recommendations

**Today.** Programming-portability tiering is a heuristic + LLM hybrid (mem://features/ai-planning-assistant/programming-portability). Capability matching is structured.

**Near-term wins.**
- "Operators most likely to succeed on this op" — rank by historical scrap rate + OAP cert + machine proficiency.
- "WOs likely to slip" — early-warning based on op-progress vs plan + upstream queue depth.
- "Operators likely to leave" — based on profile-view spike from external recruiters + dropping GCA engagement.

All three are XGBoost-class problems with existing labeled data inside the platform; none requires deep learning.

---

## 5.4 Workforce Skill Tracking

**Today.** OAP (`oap_*` 20+ tables), GCA (`gca_*` 10+ tables), operator profiles (49 cols), tool proficiency tests (mem://features/oap/tool-proficiency-tests), Handbook reference layer (mem://features/handbook/reference-layer), `oap_role_programs` + `oap_role_program_courses` for role-based training paths.

**Status: Excels.** No MES competitor has anything comparable.

**Next.**
- Skills-gap dashboard per team (which ops cannot be staffed because nobody is currently certified).
- Auto-recommend GCA modules when an operator is consistently assigned ops their cert is weakest on.
- Recert calendar with auto-email reminders 30 days before expiry.

---

## 5.5 OAP Integration

**Today.** Tight integration with operator profile, mentor sign-off, recert events, certificate issuance, transfer tokens (`oap_transfer_tokens` — expiring single-use), proficiency tests.

**Status: Mature for individuals, immature for org-level reporting.**

**Next.**
- Org Admin "Workforce Readiness" report: % of ops covered, near-expiry certs, top mentors.
- AS9100/ISO9001 audit-ready evidence export (PDF bundle with cert chain + signoff timestamps).

---

## 5.6 Talent Profile Integration

**Today.** Three-tier visibility (mem://features/talent/profile-visibility), public `/talent/:username` with SEO+JSON-LD, anonymized RPCs, contact privacy enforced (mem://features/talent/contact-privacy), messaging gated (mem://features/messaging/architecture), accept-gated talent replies.

**Status: Shipped.** Unique LinkedIn-for-machinists position.

**Next.**
- Internal-mobility: Talent profile visible to operator's own org's HR (with consent) for internal promotion paths.
- "Verified by JobLine" badge backed by OAP/GCA — the trust signal recruiters pay for.
- Recruiter subscription tier with bulk-outreach + saved searches (`talent_saved_lists` exists).

---

## 5.7 G-Code Academy Integration

**Today.** 10 question banks, in-app test player at `/gca/test/:bankSlug`, employer-facing scorecard at `/gca/employer`, paid-tier gated. Question repair log (`gca_question_repair_log`).

**Status: Shipped.**

**Next.**
- Adaptive testing (raise difficulty when operator answers correctly).
- Cross-reference GCA mastery against op-success rate to validate that test scores predict performance.
- Live-leaderboard org-wide (opt-in) — gamification for retention.

---

## 5.8 Tooling Hero Integration

**Today.** Not present. Cutting-tool inventory is the prerequisite gap.

**Path.**
1. Build cutting-tool + tool-assembly tables.
2. Build tool-crib check-in/out UI.
3. Integration with Tooling Hero API: sync tool master + receive tool-availability events.

**Why it matters.** Tooling Hero owns the tool-management mindshare in the SMB segment. Native integration is a low-effort, high-marketing-value play even before we build deep tool-life analytics.

---

## 5.9 MTConnect Integration

**Today.** Not present. We have a proprietary relay (mem://features/machine-monitoring/relay-infrastructure).

**Path.** Build an MTConnect-agent listener as an edge-runnable Docker container. Map MTConnect data items to `current_station_status` + `downtime_events`. Officially supported machines list = anything 2015+.

**Effort.** M (well-understood standard).

**Strategic.** This single integration is the difference between "supports your machines if you install our app" and "supports your machines, full stop." It's a sales-cycle accelerant.

---

## 5.10 OPC-UA Integration

**Today.** Not present.

**Path.** Open-source `node-opcua` client packaged in the same edge container. Map common PLC tags (cycle counter, program name, alarms) to station status.

**Effort.** L.

**Strategic.** Required for non-CNC discrete manufacturers (assembly lines, presses, weld cells). Opens the door beyond pure machine shops.

---

## 5.11 ERP Connectors

**Today.**
- **JobBOSS:** Connector live, native dispatch in `useUnifiedQueue` (mem://features/integrations/three-path-architecture).
- **SAP S/4HANA:** Phase 5 production + queue sync via `sap-sync` edge function with OAuth client_credentials and write-through to `queue_items` (mem://features/erp-connector/sap-phase-5). ITAR orgs forced to read_through (mem://features/erp-connector/persistence-modes).
- **Epicor Kinetic:** Not present.
- **NetSuite:** Not present.
- **Infor / Oracle:** Not present.

**Path.**
- **Epicor Kinetic** (next): REST API is reasonable; pattern follows `jobboss` connector. Effort M.
- **NetSuite SuiteTalk SOAP/REST**: pattern follows but auth (TBA) is more involved. Effort L.
- **Infor / Oracle**: Defer to demand. ION (Infor) and OIC (Oracle) are integration platforms; let the customer integrate via their own platform.

**Architectural strength.** The three-path data architecture (Native / JobBOSS / SAP) and the read-through vs write-through persistence-mode contract is already a moat. Adding Epicor follows the established pattern.

---

## 5.12 Capability Status Matrix

| Capability | Status | Next milestone | Effort | When |
|---|---|---|---|---|
| AI-assisted scheduling (advisory) | ✅ Shipped | What-if sim | L | Q3 2026 |
| AI-assisted scheduling (autoplan) | ❌ | Constraint solver pilot | XL | Q4 2026 |
| Predictive maintenance | ❌ | Data corpus build | XL | 2027 |
| ML "ops likely to slip" | ❌ | XGBoost MVP | M | Q3 2026 |
| Workforce skills gap dash | 🟡 | Per-team gap report | S | Q3 2026 |
| OAP recert calendar+digest | 🟡 | Auto email 30d before | S | Q3 2026 |
| Talent recruiter tier | 🟡 | Bulk outreach UI | M | Q4 2026 |
| GCA adaptive testing | ❌ | Adaptive engine | M | Q4 2026 |
| Tooling Hero integration | ❌ | Cutting-tool tables first | M+M | Q4 2026 |
| MTConnect adapter | ❌ | Edge container | M | **Q3 2026 (priority)** |
| OPC-UA client | ❌ | Same container as MTConnect | L | Q4 2026 |
| Epicor connector | ❌ | REST sync, persistence-mode aware | M | Q4 2026 |
| NetSuite connector | ❌ | SuiteTalk REST | L | 2027 |

**Strategic order of operations.** (1) MTConnect — opens machine-shop market wider. (2) Skills-gap dash + recert calendar — squeeze more value from OAP investment. (3) Constraint-solver scheduler — enterprise gate. (4) Tooling Hero integration — differentiator.
