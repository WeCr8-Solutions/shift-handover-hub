# Plan of Action & Milestones (POA&M)
**System:** JobLine AI  
**Organization:** WeCr8 Solutions  
**Version:** 1.0  
**Date:** April 13, 2026  
**NIST Control:** CA-5  
**Owner:** Engineering Lead  
**Review Cycle:** Monthly after ATO; quarterly during pre-authorization  

> This POA&M is derived from the gap analysis in `docs/approval/fedramp/gap-remediation-roadmap.md`. All open gaps are tracked here as formal POA&M items. After FedRAMP ATO, this document is submitted to the sponsoring agency monthly and updated after every 3PAO finding.

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total open items | 29 |
| Critical / Blocking | 1 (G-00) |
| High priority | 7 |
| Medium priority | 18 |
| Low priority | 3 |
| Completed | 1 (G-10 VMP) |

---

## POA&M Table

| ID | Weakness / Finding | NIST Control(s) | Severity | Responsible Party | Planned Completion | Status | Milestones |
|----|-------------------|-----------------|----------|------------------|-------------------|--------|-----------|
| **G-00** | Non-FedRAMP authorized infrastructure — Supabase commercial and Vercel are not on FedRAMP Marketplace | All SC, AC, AU controls | 🔴 BLOCKING | CEO + Engineering Lead | Q4 2026 – Q1 2027 | OPEN | M1: Decide AWS GovCloud vs. Azure Gov (Q2 2026); M2: Architecture design (Q3 2026); M3: Parallel env build (Q4 2026); M4: Cutover (Q1 2027) |
| G-01 | FedRAMP Moderate Authorization — full Agency ATO not yet obtained | CA-6, CA-9 | 🔴 CRITICAL | CEO | 2027–2028 | OPEN — long term | Contingent on G-00, G-02, G-23, G-24, G-25 |
| G-02 | FedRAMP Moderate Equivalency — 3PAO assessment not yet conducted | CA-2, CA-8 | 🔴 CRITICAL | CEO + Engineering Lead | Q2–Q3 2027 | OPEN | M1: Complete all Phase 1 docs (Q2 2026); M2: Pen test complete (Q3 2026); M3: Engage 3PAO readiness review (Q1 2027); M4: Full assessment (Q2 2027) |
| G-03 | SBOM generation — Software Bill of Materials not auto-generated in CI pipeline | SR-3, SA-12 | 🟠 HIGH | Engineering | Q3 2026 | OPEN | M1: Add syft/cyclonedx to CI workflow; M2: Publish SBOM on each release |
| G-04 | Third-party penetration test — no external pen test has been conducted | CA-8, RA-5 | 🟠 HIGH | CEO (procurement) | Q3 2026 | OPEN | M1: Request quotes from CREST/OSCP firms (Q2 2026); M2: Conduct test (Q3 2026); M3: Remediate findings (Q4 2026) |
| G-05 | Responsible disclosure program — no formal bug bounty or security.txt | IR-6, SI-2 | 🟠 HIGH | Engineering | Q2 2026 | OPEN | M1: Create security.txt at /.well-known/security.txt; M2: Define disclosure email and process |
| G-06 | SAML 2.0 / Active Directory SSO — no enterprise SSO integration | IA-2, IA-8, AC-2 | 🟠 HIGH | Engineering | Q4 2026 | OPEN | M1: Design SAML/OIDC flow; M2: Implement; M3: Test with AD |
| G-07 | SIEM log export — no external SIEM integration for audit log forwarding | AU-6, AU-9 | 🟡 MEDIUM | Engineering | Q4 2026 | OPEN | M1: Design Supabase webhook → SIEM bridge; M2: Implement Splunk/Elastic forwarder |
| G-08 | Formal security program document — no written information security policy | PL-2, AC-1, all -1 controls | 🟡 MEDIUM | Engineering Lead | Q2 2026 | OPEN | M1: Draft policy (2 days); M2: CEO review and sign-off |
| G-09 | Incident response plan (IRP) — no formal written IRP | IR-1, IR-8 | 🟡 MEDIUM | Engineering Lead | Q2 2026 | OPEN | M1: Draft IRP using NIST 800-61r3 template; M2: Tabletop exercise |
| **G-10** | Vulnerability Management Program — formal VMP | RA-1, RA-5 | 🟡 MEDIUM | Engineering Lead | April 2026 | ✅ **COMPLETE** | VMP v1.1 at `docs/approval/fedramp/vulnerability management program/vulnerability-management-program.md` |
| G-11 | Backup and recovery plan — no formal written plan | CP-9, CP-10 | 🟡 MEDIUM | Engineering Lead | Q2 2026 | OPEN | M1: Document Supabase PITR + backup schedule; M2: Define RTOs/RPOs; M3: Test restore |
| G-12 | AI opt-out toggle — no explicit org-level AI feature disable | AC-20, SA-9 | 🟡 MEDIUM | Engineering | Q3 2026 | OPEN | M1: Add AI feature flag to org settings; M2: Gate AI calls behind flag |
| G-13 | Prompt injection controls — no input sanitization layer on AI assistant | SI-3, SI-10 | 🟡 MEDIUM | Engineering | Q3 2026 | OPEN | M1: Add input validation; M2: Add output validation; M3: Log all AI requests/responses |
| G-14 | AI data retention policy — no documented policy for AI-processed data | AU-11, MP-6 | 🟡 MEDIUM | Engineering Lead | Q2 2026 | OPEN | M1: Define retention periods; M2: Implement automated purge; M3: Document in SSP |
| G-15 | Backup restore test cadence — restores not periodically tested | CP-4 | 🟢 LOW | Engineering | Q3 2026 | OPEN | M1: Schedule quarterly restore test; M2: Document results |
| G-16 | Status page — no public uptime statistics page | CP-2, SA-17 | 🟢 LOW | Engineering | Q2 2026 | OPEN | M1: Set up status.jobline.ai via Atlassian Statuspage or BetterUptime |
| G-17 | Security awareness training — no formal training program | AT-2, AT-3 | 🟡 MEDIUM | Engineering Lead | Q2 2026 | OPEN | M1: Select training platform (KnowBe4, Wizer, or free CISA materials); M2: All staff complete initial training; M3: Annual recurrence |
| G-18 | Personnel security policy — no formal background check or onboarding policy | PS-1, PS-3, PS-4 | 🟡 MEDIUM | CEO | Q2 2026 | OPEN | M1: Write policy; M2: CEO sign-off; M3: Apply to all current and new hires |
| G-19 | Rules of Behavior (RoB) — no formal acceptable use policy for system access | PL-4 | 🟡 MEDIUM | Engineering Lead | Q2 2026 | OPEN | M1: Draft RoB document (FedRAMP Appendix F template); M2: All users acknowledge in writing |
| G-20 | Configuration Management Plan (CMP) — no formal plan | CM-1, CM-2, CM-9 | 🟡 MEDIUM | Engineering Lead | Q2 2026 | OPEN | M1: Document current config controls; M2: Define baseline; M3: Version-control all configs |
| G-21 | Information System Contingency Plan (ISCP) — no formal plan | CP-2, CP-7 | 🟡 MEDIUM | Engineering Lead | Q2 2026 | OPEN | M1: Draft ISCP (FedRAMP Appendix G template); M2: Tabletop test |
| G-22 | Supply Chain Risk Management Plan (SCRMP) — no formal plan | SR-1, SR-2, SR-3 | 🟠 HIGH | Engineering Lead | Q2 2026 | OPEN | M1: Inventory third-party components; M2: Write SCRMP; M3: Add to SSP Appendix P |
| G-23 | FIPS 140-2/140-3 cryptographic validation — not in FIPS mode on current infrastructure | SC-13, IA-7 | 🔴 HIGH | Engineering | Q1 2027 | OPEN — blocked by G-00 | M1: Complete G-00 infrastructure migration; M2: Enable FIPS mode; M3: Document cert numbers in SSP Appendix Q |
| G-24 | SSP Appendix A — 323-control implementation descriptions not yet written | All 18 NIST families | 🔴 HIGH | Engineering Lead | Q1–Q2 2027 | OPEN | M1: Complete high-scoring families first (AC, IA, AU, SC); M2: Address gap families (IR, CP, AT, PS); M3: Submit to 3PAO |
| G-25 | SSP Appendix J — CIS/CRM Workbook not created | All families | 🔴 HIGH | Engineering Lead | Q1 2027 | OPEN | M1: Download FedRAMP CIS/CRM template; M2: Define CSP vs. customer responsibilities per control |
| G-26 | FIPS 199 / NIST 800-60 data categorization — formal worksheet not completed | RA-2, CA-3 | 🟡 MEDIUM | Engineering Lead | Q2 2026 | OPEN | M1: Complete FIPS 199 worksheet using SSP draft G-26 analysis; M2: Include in SSP Section 3 |
| G-27 | Digital Identity Worksheet (NIST 800-63B) — Appendix E not created | IA-1, IA-2 | 🟡 MEDIUM | Engineering Lead | Q2 2026 | OPEN | M1: Complete FedRAMP Digital Identity Worksheet; M2: Confirm IAL2/AAL2/FAL2 determination |
| G-28 | Integrated Inventory Workbook (Appendix M) — complete asset inventory not formalized | CM-8, SA-4 | 🟡 MEDIUM | Engineering Lead | Q2 2026 | OPEN | M1: Generate from SBOM + Supabase services + Vercel; M2: Version per release |
| G-29 | POA&M — formal POA&M not previously created | CA-5 | 🟡 MEDIUM | Engineering Lead | April 2026 | ✅ **COMPLETE** | This document |

---

## Remediation Priority Order (Next 30 Days)

These items can be completed immediately with no application code changes:

| Priority | Gap | Owner | Estimated Effort | Action |
|---------|-----|-------|-----------------|--------|
| 1 | G-08 Security Program Doc | Engineering Lead | 1–2 days | Write policy document |
| 2 | G-09 Incident Response Plan | Engineering Lead | 1–2 days | Write IRP using NIST 800-61r3 |
| 3 | G-11 Backup & Recovery Plan | Engineering Lead | 1 day | Document Supabase PITR + RTOs/RPOs |
| 4 | G-14 AI Data Retention Policy | Engineering Lead | 1 day | Write policy; link to SSP |
| 5 | G-17 Security Awareness Training | CEO | 2–3 days | Select platform; schedule training |
| 6 | G-18 Personnel Security Policy | CEO | 1 day | Write and sign policy |
| 7 | G-19 Rules of Behavior | Engineering Lead | 1 day | Draft using FedRAMP Appendix F template |
| 8 | G-20 Configuration Management Plan | Engineering Lead | 2 days | Document existing controls; define baseline |
| 9 | G-21 ISCP | Engineering Lead | 2–3 days | Draft using FedRAMP Appendix G template |
| 10 | G-22 SCRMP | Engineering Lead | 2 days | Inventory vendors; write plan |
| 11 | G-26 FIPS 199 Worksheet | Engineering Lead | 1 day | Complete worksheet from SSP draft analysis |
| 12 | G-27 Digital Identity Worksheet | Engineering Lead | 1 day | Complete IAL2/AAL2/FAL2 form |
| 13 | G-28 Asset Inventory | Engineering | 1 day | Build from package.json + Edge Functions list |
| 14 | G-05 Responsible Disclosure | Engineering | 1 day | Create security.txt |
| 15 | G-16 Status Page | Engineering | 1 day | Set up status.jobline.ai |

**Estimated total: 3 weeks of part-time documentation work. Zero application risk.**

---

## Monthly Update Process

At the start of each month:
1. Review all OPEN items
2. Update `Status` and `Milestones` for any progress made
3. Mark items `COMPLETE` with date and evidence file reference
4. Add any new findings from vulnerability scans (VMP-sourced)
5. Commit with message: `docs(fedramp): poam update [YYYY-MM]`

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial release — derived from gap-remediation-roadmap.md v1.1. All 29 gaps entered. G-10 and G-29 marked complete. |
