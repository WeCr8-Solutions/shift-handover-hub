# SSP Appendix A â€” Program Management (PM) Family

### **PM-1** Information Security Program Plan
**Implementation Status:** Implemented  
**Description:** The information security program document is maintained at `docs/approval/fedramp/information-security-program.md`. It is reviewed annually and approved by the CEO, with maintenance handled by the Engineering Lead.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of the ISPP document and confirmation from the CEO.

### **PM-2** Information Security Program Leadership Roles
**Implementation Status:** Implemented  
**Description:** The CEO serves as the ISSM (Information System Security Manager), and the Engineering Lead acts as the ISSO (Information System Security Officer). There is no dedicated security staff.  
**Responsible Role:** CEO, Engineering Lead  
**Test Method:** Verification of roles through organizational charts and confirmation from leadership.

### **PM-3** Information Security and Privacy Resources
**Implementation Status:** Implemented  
**Description:** Security activities are funded from the general operating budget. The Engineering Lead allocates approximately 20% of their time to security responsibilities.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of budget allocations and time tracking records.

### **PM-4** Plan of Action and Milestones Process
**Implementation Status:** Implemented  
**Description:** A POA&M document is maintained at `docs/approval/fedramp/poam.md`. It is reviewed monthly, updated when new gaps are identified, and linked to the gap remediation roadmap.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of the POA&M document and confirmation from the Engineering Lead.

### **PM-5** System Inventory
**Implementation Status:** Implemented  
**Description:** An asset inventory is maintained at `docs/approval/fedramp/asset-inventory.md`, which includes all system components, cloud services, and dependencies.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of the asset inventory document.

### **PM-6** Measures of Performance
**Implementation Status:** Implemented  
**Description:** Security metrics tracked include open CVE count, patch SLA compliance, training completion rate, and incident response time. These are reviewed quarterly.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of the security metrics dashboard and confirmation from the Engineering Lead.

### **PM-7** Enterprise Architecture
**Implementation Status:** Implemented  
**Description:** The architecture is documented in the SSP, ERD, RLS matrix diagrams. It is reviewed when significant changes occur.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of architectural documentation and confirmation from the Engineering Lead.

### **PM-8** Critical Infrastructure Plan
**Implementation Status:** Not Applicable  
**Description:** JobLine is not considered critical infrastructure, so this control does not apply.  
**Responsible Role:** N/A  
**Test Method:** Verification through organizational risk assessments.

### **PM-9** Risk Management Strategy
**Implementation Status:** Implemented  
**Description:** Risk management strategies are documented in the information security program. The gap roadmap serves as the primary risk register for FedRAMP.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of the risk management documentation and confirmation from the Engineering Lead.

### **PM-10** Authorization Process
**Implementation Status:** Implemented  
**Description:** The FedRAMP authorization process is tracked per the gap roadmap, with CA-6 addressing ATO status.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of the authorization documentation and confirmation from the Engineering Lead.

### **PM-11** Mission and Business Process Definition
**Implementation Status:** Implemented  
**Description:** The SSP Section 3 defines the system purpose (shift handovers, work orders, NCR tracking). Mission-critical functions are documented.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of the SSP document and confirmation from the Engineering Lead.

### **PM-12** Insider Threat Program
**Implementation Status:** Implemented  
**Description:** The 2-person organization covers insider threat awareness through AT-2(2). No formal insider threat program at this scale.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of insider threat awareness practices and confirmation from the Engineering Lead.

### **PM-13** Security Workforce
**Implementation Status:** Implemented  
**Description:** The Engineering Lead is the sole security practitioner, with continuing education via OWASP, industry training. Plans to hire a security-focused engineer as the company scales.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of security workforce documentation and confirmation from the Engineering Lead.

### **PM-14** Testing, Training, and Monitoring
**Implementation Status:** Implemented  
**Description:** Security testing is integrated into the SDLC (CI tests on every PR). Annual security training (AT-2) and weekly monitoring reviews are conducted.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of testing and training records and confirmation from the Engineering Lead.

### **PM-15** Security and Privacy Groups and Associations
**Implementation Status:** Implemented  
**Description:** The Engineering Lead subscribes to GitHub security advisories, CISA alerts, OWASP newsletter, NVD RSS feed.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of subscription records and confirmation from the Engineering Lead.

### **PM-16** Threat Awareness Program
**Implementation Status:** Implemented  
**Description:** CISA Known Exploited Vulnerabilities are monitored. GitHub Dependabot for CVE awareness. The Engineering Lead reviews security news weekly.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of threat awareness practices and confirmation from the Engineering Lead.

### **PM-28** Risk Framing
**Implementation Status:** Implemented  
**Description:** Risk framing is documented in FIPS 199 categorization + gap roadmap. The risk tolerance is defined as FedRAMP Moderate.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of the risk framing documentation and confirmation from the Engineering Lead.
