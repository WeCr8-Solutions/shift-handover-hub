# CSO-Specific Laws, Regulations, and Standards — SSP Appendix L
**System:** JobLine AI  
**Organization:** WeCr8 Solutions LLC  
**Version:** 1.0  
**Date:** April 13, 2026  
**FedRAMP Reference:** SSP Appendix L — Laws, Regulations, Standards, and Guidance  
**Owner:** Engineering Lead / Legal Counsel  
**Review Cycle:** Annual; updated when new regulatory requirements apply

---

## Purpose

This document identifies all applicable federal laws, executive orders, directives, policies, regulations, standards, and guidance that govern the security posture and operation of JobLine AI as a cloud service used by or considered for use by federal contractors and agencies. Appendix L is a required component of the FedRAMP System Security Plan (SSP).

---

## 1. Federal Laws

| Law / Statute | Relevance to JobLine AI | Compliance Status |
|--------------|------------------------|------------------|
| **Federal Information Security Modernization Act (FISMA) of 2014** (44 U.S.C. § 3551 et seq.) | Requires federal agencies and their service providers to implement NIST-based security programs. JobLine AI must maintain FISMA-compliant controls when processing federal contractor data. | ⚠️ Pursuing compliance — FedRAMP authorization path underway |
| **Federal Information Security Management Act (FISMA) of 2002** (44 U.S.C. § 3541 et seq.) | Original FISMA mandate; superseded by 2014 act but foundational to NIST RMF framework used by FedRAMP. | N/A (superseded) |
| **E-Government Act of 2002** (44 U.S.C. § 3501 note) | Requires privacy impact assessments and security for federal IT systems. FedRAMP is authorized under this act. | ⚠️ Addressed through SSP and PIA process |
| **Privacy Act of 1974** (5 U.S.C. § 552a) | Governs collection, maintenance, use, and disclosure of information about individuals maintained in federal systems of records. Applies if JobLine AI processes PII on behalf of a federal agency. | ⚠️ Limited PII (user accounts only); privacy notice and data handling policy in place |
| **Computer Fraud and Abuse Act (CFAA)** (18 U.S.C. § 1030) | Criminal penalties for unauthorized computer access. Relevant to security incident response and VDP safe harbor provisions. | ✅ VDP safe harbor documented |
| **National Defense Authorization Act (NDAA)** | Various sections impose supply chain security requirements on defense contractors and their vendors. Section 889 prohibits use of certain Chinese technology vendors. | ✅ No prohibited vendors (Huawei, ZTE, Hytera, Hikvision, Dahua) in supply chain |
| **Cybersecurity Information Sharing Act (CISA) of 2015** | Establishes information sharing framework for cyber threat indicators. Relevant to incident reporting and voluntary threat sharing. | ✅ Aligned; can participate in CISA Information Sharing and Analysis Organizations (ISAOs) |

---

## 2. Executive Orders and Presidential Directives

| Directive | Summary | Relevance to JobLine AI |
|-----------|---------|------------------------|
| **EO 14028 — Improving the Nation's Cybersecurity** (May 2021) | Mandates zero-trust architecture, software supply chain security (SBOM), MFA, encryption at rest and in transit, EDR, and secure software development practices. | High relevance — drives G-03 (SBOM), G-13 (AI security), MFA enforcement, TLS requirements |
| **EO 13873 — Securing the Information and Communications Technology Supply Chain** (May 2019) | Authorizes prohibition of ICT products/services from foreign adversaries. | ✅ Supply chain review documented in SCRMP (G-22) |
| **OMB M-22-09 — Moving the U.S. Government Toward Zero Trust Cybersecurity Principles** | Requires agencies to achieve zero-trust architecture goals. CSPs doing business with agencies must align ZTNA concepts. | ⚠️ Architecture review needed post G-06 (SAML SSO); RLS provides some ZTA alignment |
| **OMB M-21-31 — Improving the Federal Government's Investigative and Remediation Capabilities** | Requires enhanced logging for federal systems (EL3 log preservation 12 months; EL0 baseline 30 days). | ⚠️ Audit log retention review — current 90-day hot; 1-year cold; EL3 not yet achieved |
| **OMB M-23-16 — FedRAMP Memorandum** | Updated FedRAMP policy for CSP authorization and agency use of cloud services. | ✅ FedRAMP authorization path aligned with M-23-16 requirements |
| **NSPM-33 — National Security Presidential Memorandum on National Security Research and Development** | Research security policies including disclosure requirements. Relevant for AI features. | Low relevance; noted for awareness |

---

## 3. Department of Defense (DoD) / ITAR / EAR Applicability

### 3.1 ITAR (International Traffic in Arms Regulations — 22 C.F.R. §§ 120–130)

| Item | Status |
|------|--------|
| **Applicability** | JobLine AI **does not manufacture, export, or broker defense articles or defense services** as defined under 22 C.F.R. § 120.6. WeCr8 Solutions is a software company providing operational management tools. |
| **Direct ITAR applicability** | **Not directly applicable** to WeCr8 Solutions as a software publisher. |
| **Indirect applicability** | JobLine AI may be **deployed by ITAR-controlled companies** (e.g., aerospace manufacturers, defense contractors) to manage work orders and shift handoffs in ITAR-controlled facilities. In that context, **the customer is the ITAR-obligated party**; WeCr8 Solutions is a software tool vendor, not a subject of ITAR regulation for the software itself. |
| **Self-hosted deployment** | The self-hosted Electron desktop deployment (ITAR mode) is specifically designed so that **no customer data leaves the customer's premises**. All processing is local; no federal or ITAR-controlled data is transmitted to WeCr8 Solutions servers. |
| **Technical data caution** | WeCr8 Solutions employees must not access or view customer-specific technical data (work orders, part numbers, manufacturing specs) stored in customer-controlled self-hosted instances. This is enforced by design — WeCr8 Solutions has no access to self-hosted data. |
| **EAR (Export Administration Regulations — 15 C.F.R. §§ 730–774)** | JobLine AI is a general-purpose business software application. As a mass-market software product (ECCN 5D992), it is likely **EAR99 or ECCN 5D992** (mass-market software, no encryption above 64-bit key length that is not standard). Export classification review recommended before marketing to restricted countries. |

**ITAR Self-Hosted Mode Controls:**

The `desktop/` Electron application with ITAR mode (`ITAR_MODE=true` environment flag) enforces:

| Control | Implementation |
|---------|---------------|
| Data residency | All data stored in local SQLite or customer-controlled Supabase instance; no WeCr8 cloud connection |
| Analytics disabled | `VITE_DISABLE_ANALYTICS=true` removes GA4 and any telemetry |
| AI features disabled | LLM API calls disabled in ITAR mode (no data to external AI provider) |
| No call-home | No telemetry, no usage reporting, no cloud sync |
| Audit: fully local | Audit logs stored locally; customer controls log access |

### 3.2 DFARS (Defense Federal Acquisition Regulation Supplement)

| Clause | Applicability | Status |
|--------|-------------|--------|
| **DFARS 252.204-7012** — Safeguarding Covered Defense Information (CDI) | Applies to DoD contractors that process, store, or transmit Covered Defense Information (CDI) or that operate on behalf of DoD. **WeCr8 Solutions is not currently a DoD prime or subcontractor.** If JobLine AI is deployed by a DoD contractor to process CDI, the contractor (not WeCr8) bears the DFARS obligation; WeCr8 Solutions may need to provide supporting evidence of CMMC compliance. | ⚠️ Monitor — if WeCr8 Solutions becomes a DoD subcontractor, DFARS 7012 applies |
| **CMMC 2.0 (Cybersecurity Maturity Model Certification)** | CMMC Level 2 (based on NIST SP 800-171 — 110 controls) required for DoD contractors processing CUI. JobLine AI overlaps significantly with CMMC Level 2 requirements given FedRAMP Moderate alignment. | ⚠️ FedRAMP Moderate controls ≈ CMMC Level 2 (with some gaps); consider parallel CMMC assessment |
| **DFARS 252.239-7010** — Cloud Computing Services | Governs DoD use of cloud services; requires FedRAMP Moderate or DoD IL2+ authorization. | ⚠️ Prerequisite for DoD contracts — requires FedRAMP authorization (G-01) |

### 3.3 CUI (Controlled Unclassified Information) Framework

| Item | Status |
|------|--------|
| **CUI Registry applicability** | Manufacturing work orders and shift records may qualify as CUI under the category "Manufacturing and Industrial" (32 C.F.R. Part 2002) when used by federal contractors. |
| **NIST SP 800-171** | If JobLine AI is used to process CUI, NIST SP 800-171 controls apply. FedRAMP Moderate (NIST 800-53) is a superset of 800-171; Moderate authorization satisfies 800-171 requirements. |
| **CUI Marking** | WeCr8 Solutions does not classify or mark customer data. Customers are responsible for identifying and marking CUI within their JobLine deployments per their CUI programs. |

---

## 4. Federal Standards and NIST Publications

| Standard | Title | Relevance |
|----------|-------|-----------|
| **NIST SP 800-53 Rev. 5** | Security and Privacy Controls for Information Systems and Organizations | ✅ Primary control baseline for JobLine AI — 323 Moderate controls (Appendix A) |
| **NIST SP 800-53A Rev. 5** | Assessing Security and Privacy Controls | Governs 3PAO assessment methodology |
| **NIST SP 800-37 Rev. 2** | Risk Management Framework (RMF) | FedRAMP authorization is based on RMF; governs authorization process |
| **NIST SP 800-60 Vol. II** | Guide for Mapping Types of Information and Information Systems to Security Categories | ✅ Used for FIPS 199 categorization (Appendix K) — system categorized as Moderate |
| **NIST SP 800-63B Rev. 3** | Digital Identity Guidelines — Authentication and Lifecycle Management | ✅ IAL2/AAL2/FAL2 determination documented in Digital Identity Worksheet (Appendix E) |
| **NIST SP 800-137** | Information Security Continuous Monitoring (ISCM) for Federal Information Systems | ✅ Continuous Monitoring Plan (Appendix N) aligned with 800-137 |
| **NIST SP 800-171 Rev. 2** | Protecting CUI in Non-Federal Systems | ⚠️ Relevant if customers process CUI; NIST 800-53 Moderate is a superset |
| **NIST SP 800-218** | Secure Software Development Framework (SSDF) | ⚠️ Mandated by EO 14028 for software sold to federal customers; SDLC practices documented in SA controls |
| **FIPS PUB 140-3** | Security Requirements for Cryptographic Modules | ⚠️ Required for SC-13; current gap documented in Appendix Q (G-23) |
| **FIPS PUB 199** | Standards for Security Categorization of Federal Information and Information Systems | ✅ Completed — Appendix K; system categorized Moderate |
| **FIPS PUB 200** | Minimum Security Requirements for Federal Information and Information Systems | ✅ Satisfied by Moderate baseline selection |
| **NIST SP 800-30 Rev. 1** | Guide for Conducting Risk Assessments | Governs RA-3 risk assessment methodology |
| **NIST SP 800-34 Rev. 1** | Contingency Planning Guide for Federal Information Systems | ✅ ISCP (Appendix G) aligned with 800-34 |
| **NIST SP 800-61 Rev. 2** | Computer Security Incident Handling Guide | ✅ IRP (Appendix I) aligned with 800-61 |
| **NIST SP 800-128** | Guide for Security-Focused Configuration Management of Information Systems | ✅ CMP (Appendix H) aligned with 800-128 |

---

## 5. FedRAMP Program Documentation

| Document | Relevance |
|----------|-----------|
| **FedRAMP Moderate Baseline** (FedRAMP_Security_Controls_Baseline.xlsx v5.3) | Defines 323 controls required for Moderate authorization level; primary compliance target |
| **FedRAMP High-Moderate-Low-LI-SaaS Baseline SSP Template** (v1.1, Oct 2023) | Official SSP template; JobLine AI SSP draft follows this structure |
| **CSP Authorization Playbook** (Vols. I & II) | Governs the CSP's path to authorization; Agency ATO path selected |
| **Agency Authorization Playbook** | Governs agency sponsorship requirements; relevant when sponsoring agency identified |
| **FedRAMP Boundary Guidance** | Defines what is inside vs. outside the authorization boundary |
| **FedRAMP Continuous Monitoring Strategy Guide v3.3** | Governs post-ATO monitoring requirements; addressed in Appendix N |
| **FedRAMP Incident Communication Procedures** | Defines reporting timelines for security incidents affecting federal data |

---

## 6. Privacy Laws and Regulations

| Law | Applicability | Status |
|-----|-------------|--------|
| **California Consumer Privacy Act (CCPA) / CPRA** | Applies to WeCr8 Solutions if serving California residents. | ⚠️ Privacy notice and data subject rights process needed |
| **GDPR** (EU 2016/679) | Applies if serving EU-based users or processing EU resident data. | ⚠️ Not currently in scope for FedRAMP; tracked separately |
| **OMB Circular A-130** | Federal agencies must ensure privacy protections for federal data; CSPs must cooperate with agency privacy programs. | ✅ Privacy Act Notice and Privacy Impact Assessment (PIA) process initiated |

---

## 7. Industry Standards (Informative)

| Standard | Relevance |
|----------|-----------|
| **SOC 2 Type II** (AICPA TSC) | Common enterprise security assurance standard; overlaps with FedRAMP controls; consider concurrent pursuit |
| **ISO/IEC 27001:2022** | International information security management standard; overlaps FedRAMP |
| **CIS Controls v8** | 18 control groups; used as baseline for CIS/CRM Workbook (Appendix J / G-25) |
| **OWASP ASVS 4.0** | Application security verification; informs SA and SI control implementations |
| **OWASP Top 10 LLM** | AI security framework (LLM01–LLM10); governs G-12, G-13 controls |

---

## 8. Regulatory Compliance Matrix Summary

| Regulation | Directly Applicable | Action Required | Owner |
|-----------|-------------------|----------------|-------|
| FedRAMP Moderate | ✅ Primary objective | Complete all appendices; engage 3PAO | Engineering + CEO |
| FISMA 2014 | ✅ (when serving agencies) | Satisfied via FedRAMP authorization | Engineering |
| EO 14028 | ✅ | SBOM (G-03), MFA, SSDF, ZTA | Engineering |
| ITAR (indirect) | ⚠️ Customer obligation | ITAR self-hosted mode maintained | Engineering |
| DFARS 252.204-7012 | ⚠️ If DoD subcontractor | Monitor; CMMC Level 2 assessment if needed | CEO |
| NIST SP 800-171 (CUI) | ⚠️ If customer processes CUI | FedRAMP Moderate is superset | Engineering |
| Privacy Act | ⚠️ When processing federal PII | PIA completion; privacy notice | Legal |
| CCPA/CPRA | ⚠️ California residents | Privacy program | Legal |
| FIPS 140-3 | ⚠️ Gap — post G-00 migration | See Appendix Q; G-23 POA&M | Engineering |

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial Appendix L — FedRAMP CSO Laws and Regulations |

---

*This document satisfies FedRAMP SSP Appendix L (Laws, Regulations, Standards, and Guidance Applicable to the CSO). For questions regarding regulatory applicability, consult WeCr8 Solutions legal counsel.*
