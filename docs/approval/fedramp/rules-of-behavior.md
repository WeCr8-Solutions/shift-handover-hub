# Rules of Behavior (RoB)
**System:** JobLine AI  
**Organization:** WeCr8 Solutions  
**Version:** 1.0  
**Date:** April 13, 2026  
**Classification:** Internal  
**Owner:** Engineering Lead  
**Approved By:** CEO  
**NIST Control:** PL-4  

> This document fulfills FedRAMP SSP Appendix F (Rules of Behavior). All individuals with access to JobLine AI systems must read and acknowledge these rules prior to being granted access.

---

## 1. Acknowledgment

By accessing JobLine AI systems, you agree to comply with these Rules of Behavior. Violation of these rules may result in loss of access, disciplinary action up to termination, and potential legal liability.

---

## 2. Acceptable Use

You **MAY:**
- Access JobLine AI systems only for authorized business purposes related to your role
- Use system features in accordance with your assigned role and permissions
- Report security concerns or suspected incidents to `security@jobline.ai`
- Use the AI planning assistant for shift planning within your organization's context
- Export data that belongs to your organization for legitimate business purposes

You **MAY NOT:**
- Access data belonging to another organization, even if technically possible
- Share your login credentials with anyone, including colleagues
- Attempt to bypass authentication, authorization, or auditing controls
- Use the AI planning assistant to process data outside your organization's scope
- Upload malicious files or content to any feature
- Use JobLine AI to store classified, export-controlled (ITAR/EAR), or highly sensitive government data unless specifically authorized by WeCr8 Solutions
- Introduce unauthorized software, integrations, or connections to production systems
- Attempt to reverse-engineer, decompile, or extract proprietary code or data

---

## 3. Authentication Requirements

- You must use your unique, individual account credentials. Shared accounts are not permitted.
- You must enroll in multi-factor authentication (MFA) when required by your organization.
- You must not share or disclose your password or MFA codes to anyone.
- You must immediately report suspected credential compromise to your organization administrator and to `security@jobline.ai`.
- You must log out or lock your session when leaving your workstation unattended.

---

## 4. Data Handling

- All data accessed through JobLine AI is confidential to your organization unless explicitly marked for sharing.
- You must not export, copy, or transmit data outside of authorized workflows.
- If you access data that appears to belong to a different organization (a potential data breach), stop immediately and report to `security@jobline.ai`.
- Do not store JobLine AI export files on public or unprotected file sharing services.

---

## 5. AI Feature Use

- Use the AI Planning Assistant only for legitimate operational planning within your work context.
- Do not attempt to manipulate the AI into producing unauthorized outputs (prompt injection).
- Do not input sensitive personal information (SSNs, financial records, health data) into AI features.
- AI-generated recommendations are advisory only — human judgment governs all final decisions.

---

## 6. Incident Reporting

You must report the following to `security@jobline.ai` or your organization administrator immediately:
- Suspected unauthorized access to your account
- Any data you believe was incorrectly accessed or disclosed
- Suspicious behavior in the system (unexpected data changes, unusual access patterns)
- Phishing or social engineering attempts targeting your JobLine AI credentials

---

## 7. For WeCr8 Solutions Employees and Contractors (Production Access)

In addition to the above, individuals with direct production system access (Supabase dashboard, Vercel, GitHub) must:
- Never commit secrets, credentials, or API keys to any repository (public or private)
- Never access production data for purposes other than authorized support, debugging, or deployment
- Use separate credentials for production vs. development environments where possible
- Follow the configuration management process for all production changes (see Configuration Management Plan)
- Complete annual security awareness training
- Acknowledge this RoB annually

---

## 8. Consequences of Violation

Violation of these Rules of Behavior may result in:
1. Immediate suspension of system access
2. Disciplinary action up to and including termination of employment or contract
3. Legal action if violations involve criminal conduct, breach of contract, or unauthorized access under the Computer Fraud and Abuse Act (CFAA)
4. Notification to affected customers per the Incident Response Plan

---

## 9. User Acknowledgment

*This section is completed by each individual prior to access.*

I have read and understand the Rules of Behavior for JobLine AI. I agree to comply with these rules and understand that violations may result in loss of access and disciplinary action.

```
Name: ___________________________________
Role: ___________________________________
Organization: ___________________________________
Date: ___________________________________
Signature: ___________________________________
```

*Retain signed acknowledgments for the duration of employment plus 3 years.*

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial release for FedRAMP Moderate gap remediation (G-19) |
