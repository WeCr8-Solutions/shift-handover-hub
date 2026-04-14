# SSP Appendix A â€” System and Services Acquisition (SA) Family

### **SA-1** Policy and Procedures
**Implementation Status:** Implemented  
**Description:** JobLine has a comprehensive set of policies and procedures that include security requirements, change management, incident response, and supply chain risk management. These are documented in various documents such as the SSP, IRP, CMP, ISCP, SCRMP, and Security Awareness Training program.  
**Responsible Role:** System Administrator  
**Test Method:** Review of policy and procedure documents.

### **SA-2** Allocation of Resources â€” security requirements addressed in sprint planning; no formal security budget line (startup); Engineering Lead allocates time for security tasks
**Implementation Status:** Implemented  
**Description:** Security requirements are addressed during the sprint planning process. The Engineering Lead is responsible for allocating time for security tasks, ensuring that security is not an afterthought but a integral part of the development process.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of sprint planning documents and communication with the Engineering Lead.

### **SA-3** System Development Life Cycle â€” Git-based SDLC: feature branch â†’ PR with automated code review (Codacy/ESLint/typecheck) â†’ Engineering Lead review â†’ merge â†’ Vercel auto-deploy; security requirements in PRD documents
**Implementation Status:** Implemented  
**Description:** JobLine uses a Git-based SDLC where changes are made on feature branches, followed by pull requests (PRs) that undergo automated code reviews using Codacy, ESLint, and TypeScript typecheck. The Engineering Lead then reviews the PRs before merging them into the main branch, which triggers automatic deployment on Vercel. Security requirements are documented in PRD documents.  
**Responsible Role:** Development Team  
**Test Method:** Review of PRs and PRD documents.

### **SA-4** Acquisition Process â€” vendor selection criteria in SCRMP; FedRAMP-authorized vendors preferred; security questionnaires for new vendors
**Implementation Status:** Implemented  
**Description:** JobLine follows a structured acquisition process where vendors are evaluated based on the criteria outlined in the SCRMP. Preference is given to FedRAMP-authorized vendors, and all new vendors undergo a security questionnaire to ensure they meet the necessary requirements.  
**Responsible Role:** Procurement Team  
**Test Method:** Review of vendor selection criteria and security questionnaires.

### **SA-4(1)** Functional Properties of Security Controls â€” vendor security capabilities documented in SCRMP and via Supabase/Vercel SOC 2 reports
**Implementation Status:** Implemented  
**Description:** JobLine documents the security capabilities of vendors in the SCRMP. Additionally, SOC 2 reports from Supabase and Vercel are reviewed to ensure that they meet the necessary security standards.  
**Responsible Role:** Procurement Team  
**Test Method:** Review of vendor security capabilities documented in the SCRMP and SOC 2 reports.

### **SA-5** System Documentation â€” SSP, architecture diagrams, ERD, API docs maintained in docs/ directory; README.md for codebase
**Implementation Status:** Implemented  
**Description:** JobLine maintains comprehensive documentation including the SSP, architecture diagrams, entity relationship diagrams (ERDs), and API documentation. All code is also documented with a README.md file.  
**Responsible Role:** Documentation Team  
**Test Method:** Review of documentation in the docs/ directory.

### **SA-8** Security and Privacy Engineering Principles â€” secure-by-default: RLS on all tables, invite-only auth, HTTPS-only, minimal data collection; OWASP ASVS Level 1 as development target
**Implementation Status:** Implemented  
**Description:** JobLine follows a secure-by-default approach with Row-Level Security (RLS) enabled on all tables. Authentication is invite-only, and the platform uses HTTPS-only communication. Minimal data is collected to ensure privacy. The development target is OWASP ASVS Level 1.  
**Responsible Role:** Development Team  
**Test Method:** Review of codebase for RLS implementation, authentication method, and data collection practices.

### **SA-9** External System Services â€” Supabase (SOC 2 Type II), Vercel (SOC 2), Stripe (PCI DSS), GitHub (SOC 2); vendor compliance reviewed annually per SCRMP
**Implementation Status:** Implemented  
**Description:** JobLine uses external services such as Supabase, Vercel, Stripe, and GitHub. These vendors have SOC 2 Type II, PCI DSS, and SOC 2 certifications respectively. Vendor compliance is reviewed annually as per the SCRMP.  
**Responsible Role:** Security Team  
**Test Method:** Review of vendor compliance reports and annual reviews.

### **SA-10** Developer Configuration Management â€” all code in GitHub; IaC (Supabase migrations, Vercel config) versioned in Git; no developer-owned production access
**Implementation Status:** Implemented  
**Description:** All code is stored in GitHub. Infrastructure as Code (IaC) such as Supabase migrations and Vercel configurations are also versioned in Git. There is no direct production access for developers.  
**Responsible Role:** Development Team  
**Test Method:** Review of codebase and IaC files in Git.

### **SA-11** Developer Testing and Evaluation â€” Vitest unit/integration tests; TypeScript strict mode; Codacy static analysis; Trivy SBOM/vuln scan; all run in CI on every PR
**Implementation Status:** Implemented  
**Description:** JobLine uses Vitest for unit and integration testing, TypeScript strict mode, Codacy for static analysis, and Trivy for SBOM and vulnerability scanning. All these tests are run automatically on every pull request (PR) through GitHub Actions.  
**Responsible Role:** Development Team  
**Test Method:** Review of CI/CD pipeline configuration in GitHub Actions.

### **SA-15** Development Process, Standards, and Tools â€” documented in SDLC (SA-3); ESLint + TypeScript enforced; Prettier for formatting; security-focused code review checklist in PR template
**Implementation Status:** Implemented  
**Description:** JobLine documents its development process, standards, and tools in the SDLC. Security is enforced through ESLint, TypeScript strict mode, and Prettier formatting. A security-focused code review checklist is included in the PR template.  
**Responsible Role:** Development Team  
**Test Method:** Review of SDLC documentation and PR templates.

### **SA-16** Developer-Provided Training â€” Engineering Lead responsible for staying current on OWASP, FedRAMP requirements, dependency security; annual security training per AT-3
**Implementation Status:** Implemented  
**Description:** The Engineering Lead is responsible for keeping up-to-date with OWASP, FedRAMP requirements, and dependency security. Annual security training is provided to all developers as per the AT-3 requirement.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of training records and communication with the Engineering Lead.

### **SA-17** Developer Security and Privacy Architecture and Design â€” privacy by design: minimal PII collection; architecture documented in SSP; no unnecessary data retention
**Implementation Status:** Implemented  
**Description:** JobLine follows a privacy-by-design approach, collecting only minimal Personally Identifiable Information (PII). The architecture is documented in the SSP, and there is no unnecessary data retention.  
**Responsible Role:** Development Team  
**Test Method:** Review of architecture documentation and PII collection practices.

### **SA-22** Unsupported System Components â€” Dependabot alerts for EOL packages; annual review of component support lifecycle; unsupported components replaced within 90 days
**Implementation Status:** Implemented  
**Description:** JobLine uses Dependabot to alert developers about End-of-Life (EOL) packages. An annual review of the component support lifecycle is conducted, and unsupported components are replaced within 90 days.  
**Responsible Role:** Development Team  
**Test Method:** Review of Dependabot alerts and component support lifecycle reviews.
