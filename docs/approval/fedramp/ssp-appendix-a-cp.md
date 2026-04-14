# SSP Appendix A â€” Contingency Planning (CP) Family

### **CP-1** Policy and Procedures
**Implementation Status:** Implemented  
**Description:** The organization maintains a documented policy and procedures for contingency planning, which is referenced in the Information System Contingency Plan (ISCP). This includes roles, responsibilities, and activation criteria.  
**Responsible Role:** IT Security Manager  
**Test Method:** Review of the ISCP document and related policies.

### **CP-2** Contingency Plan
**Implementation Status:** Implemented  
**Description:** The organization has a documented contingency plan that defines Recovery Time Objective (RTO) = 4 hours, Recovery Point Objective (RPO) = 24 hours. The plan includes roles such as CEO and Engineering Lead, and specifies the activation criteria. The plan is maintained in the ISCP document at docs/approval/fedramp/iscp.md.  
**Responsible Role:** IT Security Manager  
**Test Method:** Review of the ISCP document for RTO, RPO, roles, and activation criteria.

### **CP-3** Contingency Training
**Implementation Status:** Implemented  
**Description:** The organization conducts an annual tabletop exercise based on the ISCP. Training records are maintained to ensure that all relevant personnel have been trained in contingency planning procedures.  
**Responsible Role:** IT Security Manager  
**Test Method:** Review of training records and documentation of the last tabletop exercise.

### **CP-4** Contingency Plan Testing
**Implementation Status:** Implemented  
**Description:** The organization conducts an annual test based on the ISCP, including testing of backup restoration. Quarterly tests are conducted to ensure that backups can be restored in a timely manner.  
**Responsible Role:** IT Security Manager  
**Test Method:** Review of test documentation and results from the last annual and quarterly tests.

### **CP-6** Alternate Storage Site
**Implementation Status:** Implemented  
**Description:** The organization uses Supabase, which manages geographic redundancy for backups. No separate CSP-managed alternate storage site is required.  
**Responsible Role:** IT Security Manager  
**Test Method:** Review of backup strategy and confirmation that geographic redundancy is in place.

### **CP-7** Alternate Processing Site
**Implementation Status:** Implemented  
**Description:** The organization uses Vercel, which automatically routes to an alternate edge PoP on failure. Supabase has regional failover capabilities. No manual alternate processing site is required.  
**Responsible Role:** IT Security Manager  
**Test Method:** Review of deployment strategy and confirmation that automatic routing and regional failover are in place.

### **CP-8** Telecommunications Services
**Implementation Status:** Implemented  
**Description:** The organization uses Vercel CDN with global PoPs and Supabase multi-region services, ensuring no single-telco dependency.  
**Responsible Role:** IT Security Manager  
**Test Method:** Review of telecommunications service providers and confirmation that global PoPs and multi-regions are in place.

### **CP-9** System Backup
**Implementation Status:** Implemented  
**Description:** The organization has daily automated backups with 7-day retention provided by Supabase. Backup integrity is validated by Supabase, and the Engineering Lead verifies monthly.  
**Responsible Role:** IT Security Manager  
**Test Method:** Review of backup schedule, retention policy, and validation process.

### **CP-10** System Recovery and Reconstitution
**Implementation Status:** Implemented  
**Description:** The organization has a documented recovery plan in the ISCP that includes steps for system recovery and reconstitution. Supabase's Point-In-Time Recovery (PITR) enables database reconstitution, and Vercel can redeploy from Git tags for the application layer.  
**Responsible Role:** IT Security Manager  
**Test Method:** Review of recovery plan and confirmation that PITR and Vercel deployment processes are in place.

### **CP-11** Alternate Communications Protocols
**Implementation Status:** Not Applicable  
**Description:** All communications are conducted via HTTPS, so alternate communication protocols are not required.  
**Responsible Role:** IT Security Manager  
**Test Method:** Review of communication protocols and confirmation that all communications are via HTTPS.

### **CP-13** Alternative Security Mechanisms
**Implementation Status:** Implemented  
**Description:** If Supabase Auth fails, the organization has a break-glass procedure in place as documented in the ISCP. This includes access using a service role key.  
**Responsible Role:** IT Security Manager  
**Test Method:** Review of the ISCP document and confirmation that the break-glass procedure is documented and accessible.
