# SSP Appendix A â€” Security Assessment and Authorization (CA) Family

### **CA-1** Policy and Procedures
**Implementation Status:** Implemented  
**Description:** The organization maintains a comprehensive information security program that includes policies and procedures for all aspects of system operation, including access control, data protection, incident response, and continuous monitoring. These policies are referenced throughout the SSP and are regularly reviewed and updated to ensure compliance with relevant standards and regulations.
**Responsible Role:** Security Officer  
**Test Method:** Review of policy documents, internal audits, and interviews with key personnel.

### **CA-2** Control Assessments
**Implementation Status:** Implemented  
**Description:** The organization conducts an internal self-assessment using the FedRAMP Moderate baseline to identify gaps in compliance. A gap roadmap document tracks all open security findings and is updated regularly. Annual self-assessments are planned to ensure ongoing compliance.
**Responsible Role:** Security Officer  
**Test Method:** Review of self-assessment reports, gap roadmap documents, and annual assessment plans.

### **CA-3** Information Exchange
**Implementation Status:** Not Applicable  
**Description:** The system does not have any current interconnections with external federal systems. Any future interconnections will require signed Interoperability Agreements (ISA) or Memorandums of Understanding (MOU).
**Responsible Role:** System Architect  
**Test Method:** Review of current and planned system architecture diagrams.

### **CA-5** Plan of Action and Milestones
**Implementation Status:** Implemented  
**Description:** The organization maintains a Plan of Action and Milestones (POA&M) document at docs/approval/fedramp/poam.md that tracks all open security findings. The POA&M is updated regularly when new gaps are identified, and it is reviewed monthly by the Engineering Lead.
**Responsible Role:** Security Officer  
**Test Method:** Review of POA&M document, interviews with key personnel, and monthly review logs.

### **CA-6** Authorization
**Implementation Status:** Pre-authorization  
**Description:** The organization has not yet obtained FedRAMP Moderate authorization. The system is pursuing the LI-SaaS pathway and aims to achieve authorization by 2027-2028.
**Responsible Role:** Security Officer  
**Test Method:** Review of authorization status, gap roadmap documents, and plans for future authorization.

### **CA-7** Continuous Monitoring
**Implementation Status:** Implemented (Informal)  
**Description:** The organization conducts informal continuous monitoring through various methods, including Dependabot weekly updates, Codacy on every PR, weekly reviews of the activity_logs table, and Supabase dashboard metrics. A formal Configuration Management Plan (CMP) is planned to ensure ongoing compliance.
**Responsible Role:** Security Officer  
**Test Method:** Review of continuous monitoring activities, CMP document, and internal audit reports.

### **CA-8** Penetration Testing
**Implementation Status:** Not Applicable  
**Description:** The organization has not yet conducted a formal penetration test. An internal ad-hoc security review by the Engineering Lead is performed on a regular basis. A 3PAO penetration test is planned as part of the authorization assessment.
**Responsible Role:** Security Officer  
**Test Method:** Review of internal security reviews, penetration test plans, and 3PAO engagement timeline.

### **CA-9** Internal System Connections
**Implementation Status:** Implemented  
**Description:** The system has no current internal data connections other than Supabase. All connections are authenticated using JWT and encrypted using TLS.
**Responsible Role:** System Architect  
**Test Method:** Review of current and planned system architecture diagrams, authentication mechanisms, and encryption protocols.
