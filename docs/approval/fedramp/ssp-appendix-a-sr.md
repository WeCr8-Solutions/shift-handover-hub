# SSP Appendix A â€” Supply Chain Risk Management (SR) Family

### **SR-1** Policy and Procedures
**Implementation Status:** Implemented  
**Description:** The organization has a documented Supply Chain Risk Management Plan (SCRMP) that outlines policies and procedures for managing supply chain risks. This plan is referenced in all relevant documents, including the SSP.  
**Responsible Role:** Security Officer  
**Test Method:** Review of the SCRMP document and its integration into other organizational documents.

### **SR-2** Supply Chain Risk Management Plan
**Implementation Status:** Implemented  
**Description:** The organization maintains a Supply Chain Risk Management Plan (SCRMP) that is updated annually and whenever new vendors are onboarded. The plan is available at `docs/approval/fedramp/supply-chain-risk-management-plan.md`.  
**Responsible Role:** Security Officer  
**Test Method:** Review of the SCRMP document for compliance with NIST SP 800-53 Rev. 5 requirements.

### **SR-3** Supply Chain Controls and Processes
**Implementation Status:** Implemented  
**Description:** The organization uses an npm lockfile (`bun.lockb`) to pin all dependency versions, which helps prevent tampering. Dependabot and Trivy are used for automated SBOM scans on every build. Vendor security questionnaires are conducted annually, and SOC 2 reports are collected from key vendors.  
**Responsible Role:** DevOps Engineer  
**Test Method:** Review of the npm lockfile, Dependabot/Trivy scan results, and vendor compliance reports.

### **SR-5** Acquisition Strategies, Tools, and Methods
**Implementation Status:** Implemented  
**Description:** The organization prefers vendors with SOC 2/FedRAMP ATO certifications. SBOM generation is planned using tools like cyclonedx-npm or similar. Dependency provenance is ensured through npm registry integrity checks.  
**Responsible Role:** Procurement Officer  
**Test Method:** Review of acquisition policies, vendor compliance reports, and SBOM generation plans.

### **SR-6** Supplier Assessments and Reviews
**Implementation Status:** Implemented  
**Description:** The organization conducts an annual review of the compliance reports from key suppliers (Supabase, Vercel, GitHub, Stripe) and documents these reviews in the SCRMP.  
**Responsible Role:** Security Officer  
**Test Method:** Review of the annual supplier assessments and their documentation in the SCRMP.

### **SR-8** Notification Agreements
**Implementation Status:** Implemented  
**Description:** The organization includes vendor security incident notification requirements in contracts and terms of service (ToS). Supabase and Vercel notify customers of incidents as per their ToS.  
**Responsible Role:** Legal Counsel  
**Test Method:** Review of contracts and ToS for notification requirements, and verification of notifications from vendors.

### **SR-9** Tamper Resistance and Detection
**Implementation Status:** Implemented  
**Description:** The organization uses an npm lockfile to prevent tampering, package integrity checksums for additional security, and signed artifacts during Vercel deployments. GitHub commit signing is planned.  
**Responsible Role:** DevOps Engineer  
**Test Method:** Review of the npm lockfile, package integrity checks, and deployment signatures.

### **SR-10** Inspection of Systems and Components
**Implementation Status:** Not Applicable  
**Description:** The organization does not have physical hardware to inspect; all systems are cloud-managed. Dependency audits are performed via Dependabot/Trivy on every PR.  
**Responsible Role:** DevOps Engineer  
**Test Method:** Review of the dependency audit process and confirmation that no physical hardware is involved.

### **SR-11** Component Authenticity
**Implementation Status:** Implemented  
**Description:** The organization verifies npm registry signatures for component authenticity, does not use custom hardware components, and builds Vercel applications from verified Git commits.  
**Responsible Role:** DevOps Engineer  
**Test Method:** Review of the npm registry signature verification process and confirmation that no custom hardware is used.

### **SR-12** Component Disposal
**Implementation Status:** Not Applicable  
**Description:** The organization does not have physical media or hardware components; all systems are cloud-managed. Therefore, there is no need for component disposal procedures.  
**Responsible Role:** DevOps Engineer  
**Test Method:** Confirmation that the organization operates in a cloud environment and has no physical hardware to dispose of.
