# FedRAMP Authorization — Progress & Gap Tracker

**Service:** JobLine AI
**Target:** FedRAMP Moderate (initial), Moderate→High path
**Authorization Path:** Agency Sponsorship (preferred) or JAB P-ATO
**Status:** Pre-Authorization (Readiness Phase)
**Last Updated:** April 2026

---

## TL;DR

JobLine AI is in the **pre-authorization readiness phase** of FedRAMP. We do **NOT yet have**:
- An AWS GovCloud account
- A federal agency sponsor
- A contracted 3PAO (Third-Party Assessment Organization)
- An approved SSP (System Security Plan)

We **DO have** a phased plan that lets us continue serving commercial customers today while building toward a defensible FedRAMP package. Federal-only infrastructure (GovCloud, Statping-ng, isolated SIEM) is **deferred until first federal LOI** to avoid burning $2k–10k/mo on idle infra.

---

## Why we're not in GovCloud yet

| Concern | Decision |
|---|---|
| GovCloud minimum spend | ~$100/mo idle, $2–10k/mo with full FedRAMP boundary (VPC, GuardDuty, Inspector, Config, CloudTrail, Macie, KMS, etc.) |
| Federal customer pipeline | No signed LOI yet. Talking to prospects but no procurement-ready opportunity. |
| Sponsor agency | Not identified. FedRAMP-ATO without agency sponsorship is impractical for a startup. |
| 3PAO engagement | $80–250k typical. Don't engage until SSP is 80% complete. |
| Trade-off | Burning runway on infra without a contract = company risk. Better to be **ATO-ready in 90 days from LOI signing** than ATO-active with no customers. |

**Decision: Build the paper trail now (controls, runbooks, evidence). Provision GovCloud the week we sign a federal LOI.**

---

## Progress Snapshot

| Domain | Status | Notes |
|---|---|---|
| Status page (G-16) | 🟡 Phase 0 live | UptimeRobot Free → Upptime (Q2 2026) → Statping-ng GovCloud (post-LOI). See `status-page-runbook.md` |
| Multi-tenant isolation | 🟢 Implemented | Postgres RLS on every table, NOT NULL `organization_id`, hardened SECURITY DEFINER functions |
| Audit logging | 🟢 Implemented | `activity_logs`, `data_access_logs`, `oap_recert_events` cover SC-7, AU-2, AU-3 |
| Authentication | 🟢 Implemented | Supabase Auth + 3-tier role architecture (Platform/Org/Team) |
| Encryption in transit | 🟢 Implemented | TLS 1.2+ enforced, HSTS via Cloudflare |
| Encryption at rest | 🟢 Inherited | Supabase manages (commercial AWS today; GovCloud post-LOI) |
| Secrets management | 🟢 Implemented | Lovable Cloud secrets vault; no secrets in code or repo |
| ITAR controls | 🟢 Implemented | `requires_us_person_declaration` org flag, US Person declaration gate, talent contact masking, `enforce_itar_read_through` trigger, formal procedure doc at `docs/approval/fedramp/itar-screening-procedure.md` |
| AI safety controls (SI-3, SI-10, AU-2) | 🟢 Implemented | Org-level `ai_enabled` opt-out; `_shared/aiGuard.ts` prompt-injection screen + append-only `ai_request_log` audit table; gated in `ai-planning-assistant` and `parse-resume` |
| Incident Response (IR) Plan | 🟢 Implemented | `docs/approval/fedramp/incident-response-plan.md` (NIST 800-61r3 phases). Tabletop pending annually. |
| Contingency Plan (CP) | 🟢 Implemented | `iscp.md` + `backup-recovery-plan.md` + new `backup-restore-test-runbook.md` (CP-4 quarterly cadence) |
| System Security Plan (SSP) | 🔴 Not started | Need to start NIST 800-53 Rev 5 control mapping |
| 3PAO selected | 🔴 Not started | Defer until SSP draft exists |
| Agency sponsor | 🔴 Not identified | Active prospecting via DoD primes, .mil shop networks |
| GovCloud account | 🔴 Not opened | Trigger: signed federal LOI |
| Continuous Monitoring (ConMon) | 🔴 Not started | Will inherit from GovCloud + SIEM in Phase 2 |

Legend: 🟢 done · 🟡 in progress · 🔴 not started

---

## Phased Roadmap

### Phase A — Readiness (Now → Q3 2026)

**Goal:** Be 80% of the way to a defensible SSP without spending money on infra.

- [ ] Draft SSP using FedRAMP Moderate Baseline template (NIST 800-53 Rev 5)
- [ ] Complete control implementation summaries for already-built controls (RLS, audit, auth, encryption)
- [ ] Document Customer Responsibility Matrix (CRM) for shared controls
- [ ] Formalize Incident Response Plan + run one tabletop
- [x] Formalize Contingency Plan (backup/restore runbook, RTO/RPO documented) — `backup-recovery-plan.md` + `backup-restore-test-runbook.md`
- [ ] Execute first quarterly restore test under the new runbook (CP-4 evidence)
- [x] Formalize Configuration Management Plan — `configuration-management-plan.md`
- [ ] Complete Phase 1 status page migration (Upptime at `status.jobline.ai`)
- [x] Complete ITAR / US Person screening procedure document — `itar-screening-procedure.md`
- [ ] Quarterly evidence capture (uptime screenshots, access reviews, vuln scan reports)
- [ ] Build target federal customer list, identify potential sponsors

**Cost:** ~$0 incremental. All work is documentation + existing tooling.

### Phase B — Sponsorship & GovCloud Provisioning (Triggered by federal LOI)

**Trigger event:** Signed Letter of Intent or contracted federal pilot.

- [ ] Open AWS GovCloud account (us-gov-west-1)
- [ ] Provision FedRAMP-aligned base VPC, KMS, CloudTrail, Config, GuardDuty, Inspector, Security Hub
- [ ] Migrate Supabase project to GovCloud-compatible deployment (or document hybrid boundary)
- [ ] Deploy Statping-ng on ECS Fargate, cut over `status.jobline.ai`
- [ ] Engage 3PAO (target: Coalfire, A-LIGN, Schellman, or similar)
- [ ] Complete SSP to 100%
- [ ] Begin Security Assessment (SAR)
- [ ] Submit POA&M for any open findings

**Cost estimate:** $2–10k/mo infra + $80–250k one-time 3PAO + 3–6 month timeline.

### Phase C — Authorization & ConMon (Post-Phase B, ~6–9 months)

- [ ] Receive Agency ATO (or P-ATO via JAB)
- [ ] Listed on FedRAMP Marketplace
- [ ] Stand up Continuous Monitoring (monthly POA&M updates, annual assessment)
- [ ] Annual penetration test
- [ ] Significant change requests filed for any architecture changes

**Recurring cost:** ~$5–15k/mo infra + ~$50–100k/yr 3PAO + ConMon tooling.

---

## What we need (asks / blockers)

### Need now

1. **Federal sponsor identification** — single biggest blocker. Even a small agency or DoD program office willing to sponsor an Agency ATO is the unlock. Without this, we cannot start.
2. **SSP author bandwidth** — drafting NIST 800-53 control narratives is ~120–200 hours of focused work. Either internal (founder/eng lead) or contract a FedRAMP advisor (~$15–30k for SSP shell).
3. ~~Backup/restore runbook~~ ✅ done — `backup-restore-test-runbook.md`. Need to **execute** first quarterly test.
4. ~~Formal IR Plan~~ ✅ done — `incident-response-plan.md`. Annual tabletop still pending.

### Need after federal LOI

1. AWS GovCloud account + initial Terraform modules
2. 3PAO engagement
3. FedRAMP advisor / consultant for the assessment phase

### Nice to have

1. SOC 2 Type II in parallel — many federal procurements ask for it as an interim trust signal pre-FedRAMP
2. CMMC Level 2 readiness (for DoD CUI) — heavily overlaps with FedRAMP Moderate

---

## Risks

| Risk | Mitigation |
|---|---|
| Burn runway provisioning GovCloud with no contract | **Defer GovCloud until LOI signed** (current strategy) |
| 3PAO timeline blocks deal | Engage 3PAO immediately at LOI; signal commitment to sponsor |
| Supabase as upstream CSP — not separately FedRAMP-authorized | Document boundary inheritance carefully; may need to migrate to self-hosted Postgres on GovCloud for true authorization |
| ITAR data leakage via talent / messaging | Already mitigated via contact masking + US Person gate; needs formal screening doc |
| Insider threat (eng access to prod) | Need formalized least-privilege review + just-in-time access for any prod DB access |

---

## Reference Documents

- `docs/enterprise/status-page-runbook.md` — Status page (CP-2, SA-17)
- `docs/enterprise/security-controls.md` — TODO: control implementation summaries
- `docs/enterprise/incident-response-plan.md` — TODO: draft
- `docs/enterprise/contingency-plan.md` — TODO: draft
- `docs/enterprise/itar-screening.md` — TODO: draft
- `docs/approval/fedramp/evidence/` — Quarterly evidence captures (created as evidence accrues)

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04 | Defer GovCloud account opening until first federal LOI | Avoid $2–10k/mo idle infra cost; documentation-first readiness is more capital-efficient |
| 2026-04 | UptimeRobot Free → Upptime → Statping-ng (3-phase status page) | $0 today, branded URL in Q2, GovCloud-native at LOI. See `status-page-runbook.md` |
| 2026-04 | Pursue Agency ATO over JAB P-ATO | JAB is impractical for early-stage SaaS; agency sponsorship is the realistic path |
| 2026-04 | Target FedRAMP **Moderate** initially, plan upgrade path to **High** | Moderate covers most civilian federal workloads; High is a 12–18 month follow-on |

---

*This document is the authoritative status of FedRAMP readiness. Update at least quarterly and on any phase transition.*
