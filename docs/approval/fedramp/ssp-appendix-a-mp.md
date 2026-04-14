# SSP Appendix A â€” Media Protection (MP) Family

### **MP-1** Policy and Procedures
**Implementation Status:** Implemented  
**Description:** The organization has established policies and procedures for media protection, including access controls, data encryption, and secure disposal of media. These policies are documented in the Security Policy and are reviewed annually.  
**Responsible Role:** Security Officer  
**Test Method:** Review of policy documents and adherence to policy during security audits.

### **MP-2** Media Access â€” No physical media in the system boundary; Supabase manages cloud storage media; access controlled by Supabase infrastructure team under SOC 2
**Implementation Status:** Implemented  
**Description:** The system does not use any physical media. All data is stored in Supabase managed cloud storage, which is accessed through secure APIs and controlled by the Supabase infrastructure team under their SOC 2 compliance. Access to the system is restricted based on RBAC roles and MFA.  
**Responsible Role:** IT Security Team  
**Test Method:** Verification of access controls and adherence to SOC 2 standards during regular security assessments.

### **MP-3** Media Marking â€” N/A; no physical media
**Implementation Status:** Not Applicable  
**Description:** The system does not use any physical media, so there is no need for media marking.  
**Responsible Role:** N/A  
**Test Method:** N/A

### **MP-4** Media Storage â€” N/A; no physical media storage; all data in Supabase-managed encrypted storage
**Implementation Status:** Implemented  
**Description:** All data is stored in Supabase managed cloud storage, which uses AES-256 encryption at rest. Row Level Security (RLS) enforces tenant isolation and prevents unauthorized access to data.  
**Responsible Role:** IT Security Team  
**Test Method:** Verification of encryption and RLS implementation during regular security assessments.

### **MP-5** Media Transport â€” N/A; no physical media transport; data transmitted via TLS 1.2+
**Implementation Status:** Implemented  
**Description:** Data is transmitted over the internet using TLS 1.2+ encryption, ensuring secure transport of data between the user's device and the system.  
**Responsible Role:** IT Security Team  
**Test Method:** Verification of TLS implementation during regular security assessments.

### **MP-6** Media Sanitization â€” N/A for physical media; logical data deletion: org data deleted per offboarding process; Supabase storage volumes sanitized upon decommission under their SOC 2 controls; AI data retention policy governs AI-processed data
**Implementation Status:** Implemented  
**Description:** Logical data deletion is performed during the offboarding process, and Supabase storage volumes are sanitized upon decommissioning. The AI data retention policy ensures that AI-processed data is securely managed and deleted when no longer needed.  
**Responsible Role:** IT Security Team  
**Test Method:** Verification of data deletion and sanitization processes during regular security assessments.

### **MP-7** Media Use â€” No portable media (USB, external drives) used in system operation; developers use personal endpoints under corporate acceptable use policy
**Implementation Status:** Implemented  
**Description:** The system does not allow the use of portable media. Developers are required to use their personal endpoints and adhere to the corporate acceptable use policy.  
**Responsible Role:** IT Security Team  
**Test Method:** Verification of adherence to the acceptable use policy during regular security audits.
