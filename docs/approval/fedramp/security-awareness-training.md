# Security Awareness and Training Program
**Organization:** WeCr8 Solutions (JobLine AI)  
**Version:** 1.0  
**Date:** April 13, 2026  
**Classification:** Internal  
**Owner:** CEO / Engineering Lead  
**Review Cycle:** Annual  
**NIST Controls:** AT-1, AT-2, AT-3, AT-4  

---

## 1. Purpose

This document defines the WeCr8 Solutions Security Awareness and Training Program. It ensures that all personnel with access to the JobLine AI system understand their security responsibilities prior to receiving access and receive refresher training at least annually thereafter. This fulfills FedRAMP Moderate requirements for AT-1 (Policy), AT-2 (Literacy Training and Awareness), AT-3 (Role-Based Training), and AT-4 (Training Records).

---

## 2. Scope

**Covered Personnel:**
- All WeCr8 Solutions employees and founders
- Any contractors or third-party personnel with access to production systems, production data, or the GitHub repository
- New hires before production system access is granted

**Out of Scope:**
- End users of the JobLine AI application (customers) — covered by in-app guidance and help documentation

---

## 3. Training Requirements (AT-2)

### 3.1 Onboarding Training (Before Access Is Granted)

All new personnel must complete initial security awareness training **before** being granted access to any production system, including:
- GitHub repository access
- Supabase dashboard access
- Vercel project access
- Any production credentials or secrets

**Required onboarding training topics:**

| Topic | Content Summary |
|-------|----------------|
| Security policies overview | Review of the Information Security Program document |
| Rules of Behavior | Read, understand, and sign the Rules of Behavior document |
| Data classification | Understanding of CUI, PII, and production data handling requirements |
| Password and credential security | Strong passwords, no shared credentials, secrets vault usage |
| Phishing awareness | How to identify phishing emails, what to report and how |
| Incident reporting | How to report a suspected security incident (see Incident Response Plan) |
| Social engineering awareness | Impersonation attacks, pretexting, vishing awareness |
| ITAR awareness | Overview of export control rules and ITAR applicability (relevant to federal deployment path) |

### 3.2 Annual Refresher Training (AT-2)

All personnel must complete refresher training **at least annually**, covering the same topics as onboarding. Training completion must be tracked in the training records log (Section 6).

**Deadline:** Each person must complete refresher training within 12 months of their last training date.

**Consequence of non-compliance:** Production access is suspended until training is completed.

### 3.3 Event-Based Training

Training must also be provided when:
- A significant security incident occurs (training on lessons learned)
- A major policy change is made (awareness notification + acknowledgment)
- A new high-risk technology is introduced (e.g., new LLM integration, new payment processing)

---

## 4. Role-Based Training (AT-3)

Certain roles carry elevated privilege and require additional specialized training:

### 4.1 Engineering / Development Roles

Personnel in engineering roles must additionally complete training on:

| Topic | Rationale |
|-------|-----------|
| OWASP Top 10 | Web application security — XSS, SQLi, SSRF, broken access control |
| Secure coding practices | Input validation, parameterized queries, avoiding hardcoded secrets |
| Dependency management security | Using npm audit, Trivy, reviewing third-party libraries |
| Secrets management | Never commit secrets to Git; use Vercel/Supabase env vars |
| CI/CD security | Reviewing GitHub Actions permissions, pinned action versions |
| Database security | RLS design, parameterized queries in Edge Functions |

### 4.2 Administrative / Founder Roles

Personnel with CEO or administrative access must additionally complete:

| Topic | Rationale |
|-------|-----------|
| Vendor and supply chain security | Third-party risk, DPA requirements, FedRAMP vendor chain |
| FedRAMP compliance overview | ATO process, continuous monitoring obligations, POA&M management |
| Incident communication | Customer and agency notification requirements |
| Business continuity | Understanding of RTO/RPO objectives (see Backup & Recovery Plan) |

---

## 5. Training Delivery Method

### 5.1 Recommended Training Platforms

| Platform | Cost | FedRAMP Notes |
|----------|------|--------------|
| **CISA Cybersecurity Awareness** | Free | Government-curated materials, publicly available at cisa.gov |
| **Wizer Security Awareness** | Low cost (free tier available) | SCORM-compatible, completion tracking, phishing simulation |
| **KnowBe4** | Subscription | Industry standard, phishing simulation, comprehensive library |
| **SANS Security Awareness** | Subscription | Tier 1 quality for engineering/security-focused teams |

**Current status:** WeCr8 Solutions uses self-directed study via CISA materials and Engineering Lead-led review sessions until a commercial platform is selected. This is acceptable for pre-authorization phase.

**Pre-ATO target:** Select and deploy a trackable training platform before FedRAMP authorization package submission.

### 5.2 Training Session Documentation

When conducting training sessions:
1. Record the date, attendees, topics covered, and instructor.
2. For self-paced modules: record completion date and platform confirmation.
3. Store signed Rules of Behavior acknowledgments in the personnel records file.
4. Update the Training Records Log (Section 6).

---

## 6. Training Records (AT-4)

Training records must be retained for **3 years** (FedRAMP evidence continuity requirement).

### Training Records Log

| Personnel | Role | Onboarding Training | Last Annual Refresher | Next Due | Status |
|-----------|------|--------------------|-----------------------|----------|--------|
| Zach Goodbody | CEO / Founder | Q1 2026 | Q1 2026 | Q1 2027 | ✅ Current |
| [Engineering Lead] | Engineering | Q1 2026 | Q1 2026 | Q1 2027 | ✅ Current |
| [Add personnel as hired] | | | | | |

> **Instructions:** Update this table when new personnel are onboarded or when annual training is completed. This document (or a linked spreadsheet/platform report) serves as the AT-4 training record evidence for FedRAMP audit.

---

## 7. Phishing Simulation (Recommended)

**When:** Quarterly  
**How:** Use a platform such as Wizer or KnowBe4 to send simulated phishing emails to all personnel.  
**Track:** Click rate, report rate, failure-to-report rate.  
**Response:** Personnel who fail phishing simulations are notified and must complete immediate remedial training.  

**Pre-ATO:** Phishing simulations should begin at least 6 months before ATO submission so results can be presented as evidence of program effectiveness.

---

## 8. Policy Compliance

Violations of this training policy are treated as violations of the Information Security Program and are subject to consequences outlined in the Personnel Security Policy, up to and including termination.

---

## 9. Document Updates

This program is reviewed annually and updated when:
- Training platform changes
- New threat landscape developments require new topic coverage
- Regulatory guidance updates AT requirements
- A security incident exposes a training gap

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial release for FedRAMP Moderate gap remediation (G-17) |
