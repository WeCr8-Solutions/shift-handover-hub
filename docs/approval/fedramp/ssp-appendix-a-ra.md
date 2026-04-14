# SSP Appendix A â€” Risk Assessment (RA) Family

### **RA-1** Policy and Procedures
**Implementation Status:** Implemented  
**Description:** The organization has a Vulnerability Management Program (VMP) that outlines policies and procedures for managing vulnerabilities, including how to address identified risks. This program is referenced in the SSP.  
**Responsible Role:** Security Officer  
**Test Method:** Review of VMP documentation and adherence to its guidelines.

### **RA-2** Security Categorization
**Implementation Status:** Completed  
**Description:** The organization has completed a FIPS 199 worksheet, categorizing the system as SC={C:Moderate, I:High, A:Moderate}, with an overall Moderate impact. This categorization is documented in the SSP.  
**Responsible Role:** Security Officer  
**Test Method:** Review of FIPS 199 categorization document and alignment with NIST SP 800-53 Rev. 5.

### **RA-3** Risk Assessment
**Implementation Status:** Implemented  
**Description:** An informal risk assessment was conducted by the Engineering Lead, identifying risks and documenting a gap roadmap in the SSP. A formal risk assessment is planned before engaging with the 3PAO.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of informal risk assessment report and gap remediation roadmap.

### **RA-3(1)** Supply Chain Risk Assessment
**Implementation Status:** Implemented  
**Description:** Supply chain risks are documented in the Supply Chain Risk Management Plan (SCRMP). Dependencies are assessed using Dependabot and Trivy SBOM scans.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of SCRMP document and results from Dependabot and Trivy scans.

### **RA-5** Vulnerability Monitoring and Scanning
**Implementation Status:** Implemented  
**Description:** The organization uses Dependabot to alert on GitHub, Codacy for static application security testing (SAST) on every PR, and Trivy for container and SBOM scanning. Scan results are reviewed weekly. No network/infrastructure scan is conducted yet as the cloud providers manage these aspects.  
**Responsible Role:** Security Officer  
**Test Method:** Review of Dependabot alerts, Codacy reports, and Trivy scan results.

### **RA-5(2)** Update Vulnerabilities to Be Scanned
**Implementation Status:** Implemented  
**Description:** Dependabot uses the NVD/GitHub Advisory DB for auto-updating vulnerabilities. Codacy rulesets are updated per their release cycle.  
**Responsible Role:** Security Officer  
**Test Method:** Review of Dependabot and Codacy configurations.

### **RA-5(11)** Public Disclosure Program
**Implementation Status:** Planned  
**Description:** A responsible disclosure policy is planned (G-05). No formal bug bounty program has been established yet.  
**Responsible Role:** Security Officer  
**Test Method:** Review of responsible disclosure policy document and planning status.

### **RA-7** Risk Response
**Implementation Status:** Implemented  
**Description:** CVE remediation follows the VMP SLAs, with open risk items tracked in a POA&M document. The Engineering Lead is designated as the risk owner.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of CVE remediation logs and POA&M document.

### **RA-9** Criticality Analysis
**Implementation Status:** Planned  
**Description:** A criticality analysis will be performed informally during architecture decisions. A formal analysis is planned before engaging with the 3PAO.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of planned criticality analysis process and timeline.
