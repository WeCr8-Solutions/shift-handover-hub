# SSP Appendix A â€” Configuration Management (CM) Family

### **CM-1** Policy and Procedures
**Implementation Status:** Implemented  
**Description:** The organization maintains a Configuration Management Plan (CMP) that outlines policies and procedures for configuration management. This CMP is referenced in all relevant documents, including the System Security Plan (SSP).  
**Responsible Role:** IT Manager  
**Test Method:** Review of the CMP document and its references within other SSP components.

### **CM-2** Baseline Configuration
**Implementation Status:** Implemented  
**Description:** The baseline configuration for the system includes settings for Vite build config, Supabase project settings, Vercel environment variables, Edge Function configs. These configurations are versioned in Git and managed through a configuration management tool.  
**Responsible Role:** DevOps Engineer  
**Test Method:** Verification of baseline configurations against the CMP document and code repository.

### **CM-3** Configuration Change Control
**Implementation Status:** Implemented  
**Description:** All changes to the system are made via GitHub PRs, with Vercel preview deployments before merge. The Engineering Lead is responsible for approving all production changes. No change control board (CCB) exists due to the small team size.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of recent PRs and their approval status.

### **CM-4** Impact Analysis
**Implementation Status:** Implemented  
**Description:** The PR description must include an impact assessment, which is reviewed by the Engineering Lead. Codacy/ESLint run automatically on PRs to ensure code quality. Breaking changes require a smoke test in staging before merging into production.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of recent PR descriptions and impact assessments.

### **CM-5** Access Restrictions for Change
**Implementation Status:** Implemented  
**Description:** GitHub branch protection is enabled on the main branch, allowing only the Engineering Lead to merge changes. Supabase production changes require a service role key stored in GitHub Secrets.  
**Responsible Role:** DevOps Engineer  
**Test Method:** Verification of branch protection settings and review of recent PRs.

### **CM-6** Configuration Settings
**Implementation Status:** Implemented  
**Description:** Secure-by-default configurations are used for Vercel and Supabase. Environment variables are stored in GitHub Secrets and Vercel project settings, with no plaintext secrets in the codebase.  
**Responsible Role:** DevOps Engineer  
**Test Method:** Review of environment variable usage and configuration files.

### **CM-7** Least Functionality
**Implementation Status:** Implemented  
**Description:** Supabase Edge Functions expose only required endpoints, and there are no unused ports/services. Vercel serverless functions are scope-limited to ensure minimal functionality.  
**Responsible Role:** DevOps Engineer  
**Test Method:** Verification of exposed endpoints and serverless function configurations.

### **CM-7(1)** Periodic Review of Unnecessary Software
**Implementation Status:** Implemented  
**Description:** Quarterly review of npm dependencies is conducted, with Dependabot automatically creating PRs for outdated packages. Unused Edge Functions are removed as part of this process.  
**Responsible Role:** DevOps Engineer  
**Test Method:** Review of quarterly dependency reviews and unused function removals.

### **CM-8** System Component Inventory
**Implementation Status:** Implemented  
**Description:** An asset inventory is maintained at `docs/approval/fedramp/asset-inventory.md`, which includes all software components, cloud services, and third-party integrations.  
**Responsible Role:** IT Manager  
**Test Method:** Review of the asset inventory document.

### **CM-9** Configuration Management Plan
**Implementation Status:** Implemented  
**Description:** The Configuration Management Plan is documented at `docs/approval/fedramp/configuration-management-plan.md` and serves as a reference for all configuration management activities.  
**Responsible Role:** IT Manager  
**Test Method:** Review of the CMP document.

### **CM-10** Software Usage Restrictions
**Implementation Status:** Implemented  
**Description:** All npm packages are open-source software with compatible licenses, and no commercial software is used without license review. The `license-checker` tool is run in CI to ensure compliance.  
**Responsible Role:** DevOps Engineer  
**Test Method:** Review of recent CI logs for license compliance.

### **CM-11** User-Installed Software
**Implementation Status:** Not Applicable  
**Description:** N/A for SaaS; users cannot install software into the application.  
**Responsible Role:** N/A  
**Test Method:** N/A

### **CM-12** Information Location
**Implementation Status:** Implemented  
**Description:** The SSP Section 9 documents data flows, and Supabase is the authoritative data store for all information. No shadow IT data stores are used.  
**Responsible Role:** IT Manager  
**Test Method:** Review of data flow diagrams and asset inventory.

### **CM-14** Signed Components
**Implementation Status:** Implemented  
**Description:** npm package integrity is verified via lockfile checksums, and Vercel deployment signatures ensure that no unsigned runtime components are used.  
**Responsible Role:** DevOps Engineer  
**Test Method:** Review of recent deployments for signature verification.

These implementation statements provide a comprehensive overview of how the JobLine system adheres to NIST SP 800-53 Rev. 5 Configuration Management (CM) controls.
