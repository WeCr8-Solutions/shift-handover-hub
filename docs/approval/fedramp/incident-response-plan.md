# Incident Response Plan (IRP)
**Organization:** WeCr8 Solutions (JobLine AI)  
**Version:** 1.0  
**Date:** April 13, 2026  
**Classification:** Internal  
**Owner:** Engineering Lead  
**Approved By:** CEO  
**Review Cycle:** Annual; after any declared incident  
**NIST Controls:** IR-1, IR-2, IR-4, IR-5, IR-6, IR-8  

---

## 1. Purpose

This Incident Response Plan (IRP) establishes procedures for detecting, containing, eradicating, and recovering from security incidents affecting JobLine AI. It fulfills NIST SP 800-53 Rev. 5 IR family controls required for FedRAMP Moderate authorization.

---

## 2. Scope

This plan applies to all security incidents affecting:
- JobLine AI SaaS production environment (Supabase + Vercel)
- Electron desktop self-hosted deployments
- Customer data processed by JobLine AI
- WeCr8 Solutions development and build systems (GitHub, CI/CD)

---

## 3. Incident Response Team

| Role | Person | Contact | Escalation |
|------|--------|---------|-----------|
| **Incident Commander** | Engineering Lead | security@jobline.ai | Primary responder for all incidents |
| **Executive Sponsor** | CEO | [CEO personal contact] | Escalated within 1 hour for Critical/High incidents |
| **Communications Lead** | CEO | — | Customer notification decisions |
| **External IR Support** | TBD (retain IR firm before FedRAMP assessment) | — | Engaged for Critical or data breach scenarios |

---

## 4. Incident Severity Classification

| Severity | Criteria | Examples | Response SLA |
|----------|---------|---------|-------------|
| **P1 — Critical** | Active breach, data exfiltration, production down, ransomware | Unauthorized DB access; mass data export; production outage | Respond within 1 hour; CEO notified within 1 hour |
| **P2 — High** | Successful attack contained, potential data exposure, credential compromise | Compromised admin account; SQL injection attempt; high CVE exploited | Respond within 4 hours; CEO notified within 4 hours |
| **P3 — Medium** | Failed attack attempts, policy violation, suspicious activity | Brute force attempt blocked; unauthorized access attempt; anomalous API usage | Respond within 24 hours |
| **P4 — Low** | Informational, near-miss, minor policy deviation | Expired certificate warning; single failed login; low-severity CVE | Respond within 72 hours |

---

## 5. Incident Detection Sources

| Source | Detection Method | Who Reviews |
|--------|----------------|-------------|
| Codacy / Trivy | CVE findings on every PR | Engineering Lead |
| Supabase audit logs (`activity_logs`) | Abnormal login patterns, mass data access | Engineering Lead |
| GitHub security alerts | Dependabot, secret scanning, code scanning | Engineering Lead |
| External reports | `security@jobline.ai` or responsible disclosure | Engineering Lead |
| User reports | In-app issue report button, email | Engineering Lead |
| Monitoring / alerts | Supabase dashboard, Vercel status | Engineering Lead |

---

## 6. Incident Response Procedures

### 6.1 Phase 1: Identification

1. Receive alert or report from detection source.
2. Open a private GitHub Issue titled: `[INCIDENT] [P1/P2/P3/P4] Brief description` and mark as **confidential** (do not include in public repo until remediated).
3. Record:
   - Date/time detected
   - Detection source
   - Preliminary severity assessment
   - Affected systems/data
4. Notify CEO if P1 or P2 within the defined SLA.

### 6.2 Phase 2: Containment

**Short-term containment (first 2 hours for P1):**
- Revoke compromised credentials via Supabase Auth dashboard
- Disable affected user accounts or API keys
- Block suspicious IP addresses (Supabase network rules)
- Isolate affected Edge Functions if compromised (disable via Supabase dashboard)
- Preserve all logs before any remediation (copy to secure location)

**Long-term containment (after immediate threat neutralized):**
- Deploy a patched version via Vercel
- Rotate all service-role keys and API keys used by affected systems
- Force all user sessions to expire (`user_sessions` table purge for affected org)

### 6.3 Phase 3: Eradication

1. Identify root cause (code review, log analysis, CVE reference).
2. Remove malicious code, unauthorized access, or vulnerability.
3. Verify fix via PR review and automated scanning (Codacy + Trivy).
4. Confirm no backdoors or persistence mechanisms remain.

### 6.4 Phase 4: Recovery

1. Restore from last known-good backup if data was corrupted (Supabase PITR).
2. Deploy patched application to production.
3. Monitor closely for 24–72 hours post-recovery.
4. Verify all audit logs are intact and monitoring is functioning.

### 6.5 Phase 5: Post-Incident Review

Within 5 business days of incident closure:

1. Conduct post-incident review with all involved parties.
2. Document:
   - Timeline of events
   - Root cause
   - Detection method and gap (if any)
   - Containment and recovery actions taken
   - Lessons learned
   - Process improvements
3. Update VMP, POA&M, and this IRP with any process improvements.
4. Add new vulnerability to POA&M if applicable.

---

## 7. Customer Notification

| Scenario | Notification Threshold | Timeline | Channel |
|---------|----------------------|---------|---------|
| Confirmed data breach (customer data accessed/exfiltrated) | Required | Within 72 hours of confirmation | Email to org admin + in-app banner |
| Potential breach (under investigation) | Discretionary | Within 72 hours if investigation suggests data accessed | Email to org admin |
| Service disruption (P1 outage) | Required | Within 2 hours | Status page + email to org admin |
| No customer data involved | Not required | N/A | Internal only |

**Template notification to customers:**

```
Subject: JobLine AI Security Notice — [Date]

Dear [Organization Name] Administrator,

We are writing to notify you of a security incident that [may have / has] affected your organization's data in JobLine AI.

Incident summary: [Brief description]
Date detected: [Date]
Data potentially affected: [What data, if any]
Actions taken: [What we did]
Next steps: [What you should do, if anything]

We apologize for any concern this may cause. Our security team is [actively investigating / has resolved] this incident.

If you have questions, please contact security@jobline.ai.

— WeCr8 Solutions Security Team
```

---

## 8. Preservation of Evidence

For all P1 and P2 incidents:
1. Export and archive `activity_logs` records for the affected time window.
2. Export and archive `user_sessions` records for affected users.
3. Preserve Supabase Edge Function logs.
4. Preserve GitHub Actions workflow logs.
5. Archive all evidence in a secure, time-stamped location before remediation.
6. Chain of custody documentation is required for any potential legal action.

---

## 9. US-CERT / Agency Reporting (FedRAMP Environment)

If JobLine AI is operating under a FedRAMP ATO with a sponsoring agency:
- **P1 incidents** must be reported to US-CERT within **1 hour** of identification
- **P2 incidents** must be reported within **8 hours**
- Reports are submitted via the US-CERT portal using the FedRAMP incident report template
- The sponsoring agency ISSO must also be notified per the ATO conditions

*Note: This requirement activates only after FedRAMP ATO is issued.*

---

## 10. Tabletop Exercise

An annual tabletop exercise must be conducted to test this plan:
- Scenario: simulated data breach from compromised admin credential
- Participants: Engineering Lead, CEO
- Outcome: documented gaps and plan updates

**Next scheduled exercise:** Q3 2026

---

## Related Documents

| Document | Location |
|----------|----------|
| Vulnerability Management Program | `docs/approval/fedramp/vulnerability management program/vulnerability-management-program.md` |
| POA&M | `docs/approval/fedramp/poam.md` |
| Backup and Recovery Plan | `docs/approval/fedramp/backup-recovery-plan.md` |
| SSP Section 8 (Architecture) | `docs/approval/fedramp/jobline-ssp-draft.md` |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial release for FedRAMP Moderate gap remediation (G-09) |
