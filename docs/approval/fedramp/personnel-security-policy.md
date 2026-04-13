# Personnel Security Policy
**Organization:** WeCr8 Solutions  
**Version:** 1.0  
**Date:** April 13, 2026  
**Classification:** Internal  
**Owner:** CEO (HR function)  
**Approved By:** CEO  
**Review Cycle:** Annual  
**NIST Controls:** PS-1, PS-2, PS-3, PS-4, PS-5, PS-6, PS-7, PS-8  

---

## 1. Purpose

This Personnel Security Policy establishes requirements for screening, onboarding, offboarding, and managing personnel with access to WeCr8 Solutions systems and customer data, in accordance with NIST SP 800-53 Rev. 5 PS controls required for FedRAMP Moderate.

---

## 2. Scope

Applies to all:
- Full-time and part-time WeCr8 Solutions employees
- Contractors and vendors with access to production systems or customer data
- Interns with access to any internal systems

---

## 3. Position Risk Designation (PS-2)

| Access Level | Risk Level | Examples | Screening Required |
|-------------|-----------|---------|-------------------|
| **Level 1 — High** | High-risk | Production DB access, GitHub admin, Supabase service-role key | Identity verification + employment history + criminal background |
| **Level 2 — Moderate** | Moderate | GitHub read/write, staging environment access | Identity verification + employment history |
| **Level 3 — Low** | Low | Customer support, limited read-only access | Identity verification |

All current WeCr8 Solutions engineer/founder roles are classified **Level 1 (High-risk)** due to full production access.

---

## 4. Pre-Employment Screening (PS-3)

Before granting access to any Level 1 or Level 2 systems, the following must be completed:

| Check | Level 1 | Level 2 | Level 3 |
|-------|---------|---------|---------|
| Government-issued ID verification | ✅ Required | ✅ Required | ✅ Required |
| Employment history verification (past 5 years) | ✅ Required | ✅ Required | — |
| Criminal background check | ✅ Required | — | — |
| Reference check (2 professional references) | ✅ Required | ✅ Required | — |
| For contractors: business verification | ✅ Required | ✅ Required | — |

**Note:** Records of screening are retained for duration of employment plus 3 years. All screening is conducted using a reputable third-party service (e.g., Checkr, HireRight) where applicable.

---

## 5. Onboarding (Access Provisioning) (PS-3)

New access follows the principle of **least privilege**:

1. CEO or Engineering Lead creates user account in Supabase Auth with minimum required role.
2. GitHub repository access granted at minimum necessary level (read vs. write vs. admin).
3. New user reads and signs the **Rules of Behavior** (Appendix F / `rules-of-behavior.md`) before access is granted.
4. New user completes **Security Awareness Training** within 30 days of start.
5. MFA enrollment required before first production access.
6. Access is documented in an access roster (maintained by CEO).

---

## 6. Access Review

| Review Type | Frequency | Owner |
|-------------|-----------|-------|
| Full access roster review | Quarterly | CEO |
| Privileged access review (Level 1) | Monthly | Engineering Lead |
| After any role change | Within 24 hours | Engineering Lead |

---

## 7. Offboarding (Access Revocation) (PS-4, PS-5)

**Upon separation (voluntary or involuntary):**

| Action | Timing | Owner |
|--------|--------|-------|
| Revoke Supabase Auth account | Within 1 hour of departure | Engineering Lead |
| Remove GitHub access | Within 1 hour of departure | Engineering Lead |
| Revoke Vercel access | Within 1 hour of departure | Engineering Lead |
| Rotate any shared service keys the individual had access to | Within 24 hours | Engineering Lead |
| Collect any company devices or credentials | Day of departure | CEO |
| Conduct exit security briefing | Day of departure | CEO |
| Verify removal from all access rosters | Within 48 hours | Engineering Lead |

**For involuntary or for-cause terminations:** All access revoked **before** or **simultaneously with** notification of termination.

---

## 8. Third-Party and Contractor Access (PS-7)

Contractors and vendors with system access must:
1. Complete the same screening appropriate to their access level
2. Sign a Non-Disclosure Agreement (NDA) and the Rules of Behavior
3. Access systems only through their individually assigned credentials (no shared accounts)
4. Have access revoked immediately upon contract completion or termination
5. Be listed in the vendor inventory in the Supply Chain Risk Management Plan (G-22)

---

## 9. Sanctions (PS-8)

Violations of security policies by personnel are subject to:
1. **Minor violations** (first offense, no data impact): Written warning, retraining
2. **Significant violations** (repeated or with data impact): Suspension or termination
3. **Malicious actions** (intentional unauthorized access, data theft): Immediate termination and legal referral

---

## 10. US Person Declaration (ITAR Path)

For employees or contractors working on ITAR-controlled features (self-hosted deployment path):
- Must confirm US Person status (US citizen or lawful permanent resident) prior to access
- Declaration is logged in `activity_logs` with event type `us_person_declaration`
- Non-US persons must be reviewed by CEO before any access to ITAR-relevant systems

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | April 13, 2026 | CEO / Engineering Lead | Initial release for FedRAMP Moderate gap remediation (G-18) |
