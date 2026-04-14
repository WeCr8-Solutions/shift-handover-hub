# Digital Identity Worksheet for JobLine SaaS

## 1. System and Document Information

**System Name:** JobLine  
**Document Title:** Digital Identity Worksheet  
**Date:** [Insert Date]  
**Author:** [Your Name]  
**Version:** 1.0  
**Purpose:** This document outlines the digital identity requirements for JobLine, a SaaS application designed for manufacturing facility employees and supervisors.

## 2. Digital Identity Acceptance Statement

I hereby accept that the digital identity requirements outlined in this worksheet have been met to ensure compliance with NIST SP 800-63-3 for an IAL1/AAL2 level of assurance.

**Acceptance Date:** [Insert Date]  
**Signer Name:** [Your Name]  
**Title:** [Your Title]

## 3. Transaction Types Risk Assessment Table

| **Transaction Type** | **Risk Level** | **Description** |
|----------------------|----------------|-----------------|
| User Login           | Low            | Users authenticate using email/password + TOTP MFA. |
| Admin Account Mgmt   | High           | Administrative actions require multi-factor authentication. |
| Work Order Write     | Medium         | Writing work orders involves sensitive data but does not involve classified information. |
| NCR Submission       | High           | Non-conformance reports (NCRs) are critical and should be protected with strong authentication. |
| Data Export          | High           | Exporting large datasets requires high assurance to prevent unauthorized access. |
| MFA Enrollment       | Medium         | Enrolling in multi-factor authentication enhances security for user accounts. |

## 4. IAL Selection and Justification

**IAL Selection:** IAL1  
**Justification:** The system does not handle classified data, and the risk assessment indicates that IAL1 is sufficient to protect against unauthorized access.

## 5. AAL Selection and Justification

**AAL Selection:** AAL2  
**Justification:** The use of email/password + TOTP MFA (AAL2) ensures a high level of assurance for user authentication, meeting the requirement for AAL2.

## 6. FAL (N/A)

**Federation Assumption Level (FAL):** N/A  
**Justification:** JobLine does not support federation and operates as an isolated system.

## 7. Implementation Summary Table

| **Requirement** | **Status** | **Details** |
|-----------------|------------|-------------|
| User Login      | Implemented| Email/password + TOTP MFA (AAL2) for user authentication. |
| Admin Account Mgmt | Implemented| Multi-factor authentication enforced for administrative actions. |
| Work Order Write  | Implemented| Sensitive data handling with strong authentication. |
| NCR Submission    | Implemented| Critical transactions require high assurance authentication. |
| Data Export       | Implemented| Strong authentication required for exporting large datasets. |
| MFA Enrollment    | Implemented| Users can enroll in multi-factor authentication to enhance security. |

## 8. Gaps and Remediation Plan

**Gaps:**  
- No specific gaps identified based on the current implementation.

**Remediation Plan:**  
- N/A

## 9. Signature Block Placeholders

**Signer Name:** [Your Name]  
**Title:** [Your Title]  
**Date:** [Insert Date]

---

This Digital Identity Worksheet provides a comprehensive overview of the digital identity requirements for JobLine, ensuring compliance with NIST SP 800-63-3 at IAL1/AAL2 levels.

