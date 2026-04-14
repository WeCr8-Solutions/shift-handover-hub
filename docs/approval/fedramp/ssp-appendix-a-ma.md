# SSP Appendix A â€” Maintenance (MA) Family

### **MA-1** Policy and Procedures
**Implementation Status:** Implemented  
**Description:** The organization has established a comprehensive policy and procedures document that outlines the maintenance processes, roles, responsibilities, and controls for maintaining the JobLine system. This includes detailed guidelines on how to perform nonlocal maintenance, use authorized tools, and manage changes to the application codebase. The policy is reviewed annually and updated as necessary.  
**Responsible Role:** Security Officer  
**Test Method:** Review of the policy document, interviews with key personnel involved in maintenance activities.

### **MA-2** Controlled Maintenance
**Implementation Status:** Implemented  
**Description:** Supabase and Vercel perform all infrastructure and database maintenance during scheduled windows, providing advance notice via a status page. Application-layer changes are managed through GitHub pull requests (PRs) and the software development lifecycle (SDLC). No unscheduled maintenance is performed without prior approval from the Security Officer.  
**Responsible Role:** Engineering Lead, Security Officer  
**Test Method:** Review of scheduled maintenance logs, PR history, and communication records.

### **MA-3** Maintenance Tools
**Implementation Status:** Implemented  
**Description:** All application-layer maintenance is conducted using authorized developer tools such as VS Code, GitHub, Supabase CLI, and Vercel CLI. These tools are configured to ensure that only authorized personnel can perform changes to the codebase.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of tool usage logs, interviews with developers, and verification that all maintenance activities are performed through authorized channels.

### **MA-4** Nonlocal Maintenance
**Implementation Status:** Implemented  
**Description:** All maintenance activities are conducted nonlocally using the Supabase dashboard, Vercel dashboard, and GitHub. Sessions are protected by TLS 1.2+ encryption and MFA to ensure secure access.  
**Responsible Role:** Engineering Lead, Security Officer  
**Test Method:** Review of session logs, interviews with personnel involved in maintenance activities, and verification that all sessions comply with security requirements.

### **MA-5** Maintenance Personnel
**Implementation Status:** Implemented  
**Description:** The Engineering Lead is authorized to perform maintenance tasks. Supabase and Vercel engineers maintain the infrastructure under their SOC 2 controls, ensuring that they have the necessary expertise and access to perform maintenance activities securely. No unauthorized personnel are granted access to perform maintenance tasks.  
**Responsible Role:** Engineering Lead, Security Officer  
**Test Method:** Review of access logs, interviews with key personnel, and verification that all maintenance activities are performed by authorized personnel.

### **MA-6** Timely Maintenance
**Implementation Status:** Implemented  
**Description:** Supabase and Vercel SLAs govern the timing of infrastructure maintenance. Critical application-layer security patches must be applied within 24 hours as per the Vendor Management Plan (VMP). Regular monitoring and reporting are in place to ensure compliance with these requirements.  
**Responsible Role:** Engineering Lead, Security Officer  
**Test Method:** Review of SLA adherence logs, interviews with key personnel, and verification that all critical security patches are applied within the specified timeframe.
