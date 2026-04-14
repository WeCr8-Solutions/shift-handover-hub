# SSP Appendix A â€” System and Communications Protection (SC) Family

### **SC-1** Policy and Procedures
**Implementation Status:** Implemented  
**Description:** The organization has established policies and procedures for system and communications protection, including access controls, authentication, and data encryption. These policies are documented in the Security Awareness Training program and Personnel Security Policy documents.  
**Responsible Role:** Security Officer  
**Test Method:** Review of policy and procedure documentation.

### **SC-2** Separation of System and User Functionality
**Implementation Status:** Implemented  
**Description:** The system separates user functionality through role-based access control (RBAC) with four roles: admin, supervisor, technician, and viewer. Admin functions are restricted to the admin dashboard route, and data is isolated by organization ID using Row Level Security (RLS).  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of RBAC implementation and RLS policies.

### **SC-3** Security Function Isolation
**Implementation Status:** Implemented  
**Description:** The system isolates security functions through Supabase Auth and RLS, ensuring that no privileged OS access is granted. The application runs in a serverless environment with no persistent TCP connections.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of security function isolation measures.

### **SC-4** Information in Shared Resources
**Implementation Status:** Implemented  
**Description:** Multi-tenant isolation is enforced by RLS, which separates data by organization ID (org_id). There are no shared memory concerns due to the serverless and managed stack.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of RLS policies and multi-tenant architecture.

### **SC-5** Denial of Service Protection
**Implementation Status:** Implemented  
**Description:** The system is protected against denial of service (DoS) attacks through Vercel's edge network with DDoS mitigation, Supabase rate limiting, and a planned Web Application Firewall (WAF).  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of DoS protection measures.

### **SC-7** Boundary Protection
**Implementation Status:** Implemented  
**Description:** The system is protected by Vercel's CDN as the boundary. Supabase connection pooling ensures that no direct database access is from client applications.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of boundary protection measures.

### **SC-8** Transmission Confidentiality and Integrity
**Implementation Status:** Implemented  
**Description:** TLS 1.2+ is enforced by Vercel with HTTP Strict Transport Security (HSTS) enabled, ensuring all connections are encrypted. Supabase enforces TLS on all connections.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of TLS implementation and HSTS configuration.

### **SC-8(1)** Cryptographic Protection in Transmission
**Implementation Status:** Implemented  
**Description:** TLS 1.2+/1.3 with modern cipher suites is used on all endpoints to ensure cryptographic protection during transmission.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of TLS configuration and cipher suite selection.

### **SC-10** Network Disconnect
**Implementation Status:** Implemented  
**Description:** Supabase JWT session tokens have a 1-hour expiry, and Vercel serverless functions are stateless with no persistent TCP connections.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of network disconnect measures.

### **SC-12** Cryptographic Key Establishment and Management
**Implementation Status:** Implemented  
**Description:** TLS certificates are managed by Vercel (auto-renew), and database encryption keys are managed by Supabase.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of key management practices.

### **SC-13** Cryptographic Protection
**Implementation Status:** Implemented  
**Description:** TLS 1.2+ is used for transmission, AES-256 at rest for data encryption, and bcrypt for password hashing. FIPS 140-3 compliance is pending infrastructure migration.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of cryptographic protection measures.

### **SC-15** Collaborative Computing Devices and Applications
**Implementation Status:** Not Applicable  
**Description:** The system does not use collaborative computing devices or applications.  
**Responsible Role:** N/A  
**Test Method:** N/A

### **SC-17** Public Key Infrastructure Certificates
**Implementation Status:** Implemented  
**Description:** TLS certificates are issued by Vercel's CA (Let's Encrypt), and no internal PKI is used.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of public key infrastructure measures.

### **SC-18** Mobile Code
**Implementation Status:** Implemented  
**Description:** The system serves a React SPA from Vercel, with no unsigned or unapproved mobile code. CSP headers are planned for added security.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of mobile code management practices.

### **SC-20** Secure Name/Address Resolution Service
**Implementation Status:** Implemented  
**Description:** DNS is managed via the domain registrar, and DNSSEC is not yet enabled but is planned for future implementation.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of DNS resolution service measures.

### **SC-21** Secure Name/Address Resolution Service (Recursive or Caching)
**Implementation Status:** Implemented  
**Description:** The system inherits secure name/address resolution from Vercel and Supabase infrastructure.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of recursive or caching DNS measures.

### **SC-22** Architecture and Provisioning for Name/Address Resolution
**Implementation Status:** Implemented  
**Description:** The system inherits architecture and provisioning for name/address resolution from cloud providers.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of infrastructure provider's DNS resolution capabilities.

### **SC-23** Session Authenticity
**Implementation Status:** Implemented  
**Description:** Supabase JWT session tokens are validated server-side on every request, and HTTPS-only cookies are used to ensure session authenticity.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of session authentication measures.

### **SC-28** Protection of Information at Rest
**Implementation Status:** Implemented  
**Description:** AES-256 is used for data encryption at rest via Supabase managed infrastructure, and Vercel does not use persistent storage.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of information protection measures.

### **SC-28(1)** Cryptographic Protection of Data at Rest
**Implementation Status:** Implemented  
**Description:** AES-256 is confirmed for Supabase PostgreSQL data volumes, ensuring cryptographic protection of data at rest.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of data encryption measures.

### **SC-39** Process Isolation
**Implementation Status:** Implemented  
**Description:** Vercel serverless functions run in isolated V8 isolates, and Supabase Postgres connections are pooled but isolated per session.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of process isolation measures.
