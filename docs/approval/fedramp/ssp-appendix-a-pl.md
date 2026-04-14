# SSP Appendix A â€” Planning (PL) Family

### **PL-1** Policy and Procedures
**Implementation Status:** Implemented  
**Description:** The organization maintains a comprehensive Information Security Program that includes policies and procedures for managing information security risks. These policies and procedures are referenced in the System Security Plan (SSP).  
**Responsible Role:** Information Security Officer (ISO)  
**Test Method:** Review of the SSP to ensure it references the Information Security Program and includes relevant policies and procedures.

### **PL-2** System Security Plan
**Implementation Status:** Implemented  
**Description:** The organization maintains a draft System Security Plan (SSP) that is reviewed annually. The SSP is distributed to the CEO and Engineering Lead, and it serves as the foundation for all security controls. The SSP draft is available at `docs/approval/fedramp/jobline-ssp-draft.md`.  
**Responsible Role:** Information Security Officer (ISO)  
**Test Method:** Review of the SSP draft to ensure it meets the requirements of FedRAMP Moderate baseline and includes all necessary components.

### **PL-4** Rules of Behavior
**Implementation Status:** Implemented  
**Description:** The organization maintains a Rules of Behavior (RoB) document that covers acceptable use, data handling, incident reporting, AI data policy, and social media restrictions. All personnel must sign the RoB before gaining access to the system. The RoB is available at `docs/approval/fedramp/rules-of-behavior.md`.  
**Responsible Role:** Human Resources (HR) Manager  
**Test Method:** Review of the RoB document and verification that all new personnel have signed it.

### **PL-4(1)** Social Media and Networking Restrictions
**Implementation Status:** Implemented  
**Description:** The Rules of Behavior include restrictions on posting system data or customer information on social media. This restriction is enforced through awareness training and monitoring.  
**Responsible Role:** Security Officer (SO)  
**Test Method:** Review of the RoB document, security awareness training records, and monitoring logs to ensure compliance.

### **PL-8** Security and Privacy Architectures
**Implementation Status:** Implemented  
**Description:** The organization maintains a documented security architecture that includes an Entity Relationship Diagram (ERD), Row Level Security (RLS) matrix diagrams, and privacy architecture. The privacy architecture ensures that no Personally Identifiable Information (PII) beyond name/work-email is stored, and there is no storage of health or financial data. The architecture is detailed in the SSP Section 10.  
**Responsible Role:** Chief Architect  
**Test Method:** Review of the security architecture documentation to ensure it meets the requirements of FedRAMP Moderate baseline.

### **PL-9** Central Management
**Implementation Status:** Implemented  
**Description:** The Engineering Lead centrally manages all security configurations, and there is no distributed administration. The central management planes include the Supabase dashboard and GitHub.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of the central management processes and access controls to ensure that only authorized personnel have access to critical systems.

### **PL-10** Baseline Selection
**Implementation Status:** Implemented  
**Description:** The organization has selected the FedRAMP Moderate baseline per FIPS 199 security categorization. This selection is documented in the SSP.  
**Responsible Role:** Information Security Officer (ISO)  
**Test Method:** Review of the SSP to ensure it reflects the FedRAMP Moderate baseline and includes all necessary controls.
