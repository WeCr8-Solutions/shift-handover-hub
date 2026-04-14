# FIPS 199 / NIST SP 800-60 Security Categorization Worksheet

## 1. System Identification

**System Name:** JobLine (shift-handover-hub)  
**System Version:** v1.2  
**System Type:** Major Application  
**Authorization Level:** FedRAMP Moderate  
**Operator:** WeCr8 Solutions LLC  
**Date:** [Insert Date]

## 2. System Description

JobLine is a SaaS web application designed for manufacturing facility shift handovers, work order management, NCR (non-conformance report) tracking, and equipment calibration management. It is used by manufacturing facility employees, supervisors, and organizational administrators to streamline processes and ensure compliance with regulatory requirements. The system is deployed on Vercel CDN with a Supabase PostgreSQL database for data storage.

## 3. Information Types

| Information Type | Description | NIST 800-60 Vol II ID | Confidentiality Impact | Integrity Impact | Availability Impact |
|------------------|-------------|----------------------|------------------------|----------------------|-----------------------|
| Administrative and Management Information | System configuration, user roles, access controls | A.1 | Low | Moderate | High |
| Process and Operational Data (work orders, NCRs, shift notes) | Work order details, non-conformance reports, shift handover notes | A.2 | Moderate | High | Moderate |
| Personally Identifiable Information (employee names, emails) | Employee names and work email addresses | A.3 | High | Low | Moderate |
| Audit and Accountability Records (activity logs, auth events) | User activity logs, authentication events | A.4 | Low | Moderate | High |
| Equipment and Asset Management Data (calibration records) | Equipment calibration details | A.5 | Moderate | High | Moderate |

## 4. System Security Categorization

**Overall SC = {Confidentiality: Moderate, Integrity: High, Availability: Moderate}**

The overall security category is determined by the HIGH WATER MARK rule. The highest impact for Confidentiality and Availability is Moderate, while the highest impact for Integrity is High.

## 5. Impact Rating Rationale

- **Confidentiality:** The system handles Personally Identifiable Information (PII) such as employee names and work email addresses. A compromise could lead to unauthorized access to sensitive personnel information.
- **Integrity:** Process and operational data, including work orders, NCRs, and shift notes, are critical for maintaining the accuracy of facility operations. Compromise could result in incorrect or fraudulent records, leading to potential safety hazards and financial losses.
- **Availability:** The system is essential for day-to-day operations and compliance reporting. A disruption could cause significant delays and operational disruptions.

## 6. Authorization Signatures

**System Owner:** [Insert Name]  
**Information System Security Officer (ISSO):** [Insert Name]  
**Authorizing Official (AO):** [Insert Name]  
**Date:** [Insert Date]

---

Please note that this worksheet is a template and should be reviewed and customized by a qualified security professional to ensure compliance with specific requirements and regulations.
