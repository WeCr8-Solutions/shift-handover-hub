# SSP Appendix A â€” Identification and Authentication (IA) Family

### **IA-1** Policy and Procedures
**Implementation Status:** Implemented  
**Description:** The organization has established policies and procedures for identification and authentication, which are reviewed annually by the CEO and maintained by the Engineering Lead. These policies include requirements for user roles, MFA, and password complexity.  
**Responsible Role:** CEO | Engineering Lead  
**Test Method:** Review of policy documents and annual review logs.

### **IA-2** Identification and Authentication (Organizational Users)
**Implementation Status:** Implemented  
**Description:** The system uses Supabase Auth for organizational user identification and authentication, with an invite-only registration process. All users are required to use TOTP MFA and have a minimum password length of 12 characters.  
**Responsible Role:** Engineering Lead  
**Test Method:** Verification of user registration flow and MFA enforcement.

### **IA-2(1)** MFA for privileged accounts
**Implementation Status:** Implemented  
**Description:** TOTP MFA is enforced for admin and supervisor roles to ensure additional security for these privileged accounts.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of user role assignments and MFA enforcement.

### **IA-2(2)** MFA for non-privileged accounts
**Implementation Status:** Implemented  
**Description:** TOTP MFA is enforced for all roles to ensure consistent security across the system.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of user role assignments and MFA enforcement.

### **IA-3** Device Identification and Authentication
**Implementation Status:** Not Applicable  
**Description:** Device identification and authentication are not applicable for this LI-SaaS platform as device certificates are not used. Device authentication is deferred.  
**Responsible Role:** N/A  
**Test Method:** N/A

### **IA-4** Identifier Management
**Implementation Status:** Implemented  
**Description:** User IDs are managed using UUIDs, scoped by org_id. Invite tokens are used for user registration, and deprovisioning can be done via the admin dashboard.  
**Responsible Role:** Engineering Lead  
**Test Method:** Verification of user ID management and invite token functionality.

### **IA-5** Authenticator Management
**Implementation Status:** Implemented  
**Description:** Passwords have a minimum length of 12 characters, TOTP secrets are stored in Supabase Auth (encrypted), and password resets via email links with a 24-hour expiry. No shared accounts are allowed.  
**Responsible Role:** Engineering Lead  
**Test Method:** Verification of password complexity, encryption of TOTP secrets, and functionality of password reset process.

### **IA-5(1)** Password-based Authentication
**Implementation Status:** Implemented  
**Description:** Supabase Auth enforces a minimum password length of 12 characters with complexity TBD. Bcrypt hashing is used for password storage. No reuse policy is enforced at this time, but it is planned.  
**Responsible Role:** Engineering Lead  
**Test Method:** Verification of password complexity and bcrypt hashing.

### **IA-6** Authentication Feedback
**Implementation Status:** Implemented  
**Description:** The password field is obscured, and there are no success/fail messages that distinguish between username and password errors.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of authentication feedback mechanisms.

### **IA-7** Cryptographic Module Authentication
**Implementation Status:** Implemented  
**Description:** TLS 1.2+ is enforced for transport, AES-256 at rest, and bcrypt for password hashing. FIPS 140-3 equivalency is planned per G-23.  
**Responsible Role:** Engineering Lead  
**Test Method:** Verification of cryptographic module configurations.

### **IA-8** Identification and Authentication (Non-Organizational Users)
**Implementation Status:** Implemented  
**Description:** The same Supabase Auth flow applies for non-organizational users, with no separate non-org user path.  
**Responsible Role:** Engineering Lead  
**Test Method:** Verification of non-organizational user registration and authentication.

### **IA-11** Re-authentication
**Implementation Status:** Implemented  
**Description:** JWT 1-hour expiry is enforced server-side for all sessions, and sessions cannot be extended without re-authentication.  
**Responsible Role:** Engineering Lead  
**Test Method:** Verification of JWT expiration and session management.

### **IA-12** Identity Proofing
**Implementation Status:** Implemented  
**Description:** Invite-only registration is used with IAL1 per digital identity worksheet for identity proofing.  
**Responsible Role:** Org Admin  
**Test Method:** Review of invite token issuance and identity proofing documentation.
