# SSP Appendix A - Control Implementation Statements

## Access Controls (AC)

### **AC-1** Authorization to System Components
**Implementation Status:** Implemented  
**Implementation Description:** Role-based access control (RBAC) is enforced using PostgreSQL Row Level Security (RLS). Each user role (admin, supervisor, technician, viewer) has specific permissions defined in the database schema.  
**Responsible Role:** Engineering Lead  
**Test Method:** Automated tests and manual verification of RLS policies.

### **AC-2** Access Control Policies
**Implementation Status:** Implemented  
**Implementation Description:** Access control policies are defined using Supabase's JWT authentication, which includes 1-hour session validity with TOTP MFA. Invite-only access is enforced through a custom invite system.  
**Responsible Role:** Engineering Lead  
**Test Method:** Automated tests and manual verification of JWT and MFA implementation.

### **AC-3** Access Control Policy Maintenance
**Implementation Status:** Implemented  
**Implementation Description:** Access control policies are maintained in the database schema, with regular reviews and updates based on user role changes.  
**Responsible Role:** Engineering Lead  
**Test Method:** Automated tests and manual verification of policy updates.

### **AC-4** Access Control Policy Documentation
**Implementation Status:** Implemented  
**Implementation Description:** Access control policies are documented in the system's security plan, including roles, permissions, and access procedures.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of documentation by a security officer.

### **AC-5** Access Control Policy Testing
**Implementation Status:** Implemented  
**Implementation Description:** Access control policies are tested regularly through automated tests and manual verification to ensure proper enforcement.  
**Responsible Role:** Engineering Lead  
**Test Method:** Automated tests and manual verification of policy enforcement.

### **AC-6** Access Control Policy Auditing
**Implementation Status:** Implemented  
**Implementation Description:** Access control policies are audited periodically using logging mechanisms, with activity logs capturing 22 event types.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of audit logs by a security officer.

### **AC-7** Access Control Policy Compliance
**Implementation Status:** Implemented  
**Implementation Description:** Access control policies comply with relevant regulations and standards, including NIST SP 800-53.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of compliance documentation by a security officer.

### **AC-8** Access Control Policy Change Management
**Implementation Status:** Implemented  
**Implementation Description:** Access control policy changes are managed through a change management process, with PR reviews required for any modifications to access controls.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of change requests and PRs by a security officer.

### **AC-11** Access Control Policy Change Notification
**Implementation Status:** Implemented  
**Implementation Description:** Access control policy changes are communicated to affected users through email notifications, with a 4-hour SLA for response.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of notification logs and user feedback.

### **AC-12** Access Control Policy Change Approval
**Implementation Status:** Implemented  
**Implementation Description:** Access control policy changes are approved by authorized personnel (Engineering Lead) after PR reviews.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review of approval logs by a security officer.

## Audit and Accountability (AU)

### **AU-1** Audit and Accountability Policy and Procedures
**Implementation Status:** Implemented  
**Implementation Description:** JobLine maintains a formal Audit and Accountability policy documenting log requirements, retention periods, review responsibilities, and escalation paths. Policy is reviewed annually and upon significant system changes.  
**Responsible Role:** Engineering Lead / Compliance Officer  
**Test Method:** Review of policy document version history and approval signatures.

### **AU-2** Event Logging
**Implementation Status:** Implemented  
**Implementation Description:** The `activity_logs` table captures 22 event types including: `login`, `logout`, `work_order_create`, `work_order_update`, `work_order_close`, `handoff_create`, `handoff_acknowledge`, `ncr_create`, `ncr_update`, `user_invite`, `user_role_change`, `org_settings_update`, `bulk_upload`, `export`, `api_key_create`, `api_key_revoke`, `mfa_enroll`, `mfa_challenge`, `password_reset`, `session_expire`, `permission_denied`, and `admin_action`. Events were selected in coordination with security requirements per NIST SP 800-92.  
**Responsible Role:** Engineering Lead  
**Test Method:** Automated tests verify all 22 event types are inserted on trigger; log table row counts validated post-action.

### **AU-3** Content of Audit Records
**Implementation Status:** Implemented  
**Implementation Description:** Each audit record in `activity_logs` contains: `id` (UUID), `created_at` (UTC timestamp), `user_id` (actor), `org_id` (tenant scope), `event_type` (one of 22 types), `resource_type`, `resource_id`, `metadata` (JSONB for additional context), and `ip_address` where available. This covers the NIST-required fields: type, time, where, source, outcome, and subject identity.  
**Responsible Role:** Engineering Lead  
**Test Method:** Schema inspection of `activity_logs` table; sample record verification against AU-3 field requirements.

### **AU-4** Audit Log Storage Capacity
**Implementation Status:** Implemented  
**Implementation Description:** Audit logs are stored in Supabase PostgreSQL managed infrastructure with automatic storage scaling. Supabase manages disk provisioning and alerts on capacity thresholds. Logs are partitioned by `org_id` to support per-tenant capacity planning.  
**Responsible Role:** Engineering Lead / Supabase (infrastructure)  
**Test Method:** Supabase dashboard storage metrics review; confirm no auto-purge policy is active before retention period expires.

### **AU-5** Response to Audit Processing Failures
**Implementation Status:** Partially Implemented  
**Implementation Description:** Database write failures to `activity_logs` surface as 500 errors to the application layer and are logged to Supabase error tracking. An alert is triggered if log insertion failure rate exceeds 1% over a 5-minute window. Full automated shutdown-on-failure (ASOF) is planned for a future release.  
**Responsible Role:** Engineering Lead  
**Test Method:** Inject database write failure; verify error propagation and alert firing within 5 minutes.

### **AU-6** Audit Record Review, Analysis, and Reporting
**Implementation Status:** Partially Implemented  
**Implementation Description:** Organization administrators can query `activity_logs` via the admin dashboard (filtered by user, event type, and date range). Scheduled weekly review by the Engineering Lead is documented in the operational runbook. Automated anomaly detection is planned for a future sprint.  
**Responsible Role:** Engineering Lead / Org Admin  
**Test Method:** Log into admin dashboard; confirm activity log view with filter controls is accessible; review runbook for documented weekly review process.

### **AU-7** Audit Record Reduction and Report Generation
**Implementation Status:** Partially Implemented  
**Implementation Description:** The admin dashboard supports on-demand CSV export of filtered `activity_logs` records, supporting report generation for specific date ranges, users, or event types. Automated summarization pipelines and SIEM forwarding are planned for Phase 2.  
**Responsible Role:** Engineering Lead  
**Test Method:** Export activity log CSV via admin dashboard; verify completeness of fields in export output.

### **AU-8** Time Stamps
**Implementation Status:** Implemented  
**Implementation Description:** All `activity_logs.created_at` timestamps are set server-side by Supabase PostgreSQL using `now()` (UTC). No client-supplied timestamps are accepted for audit records. UTC offset is zero; timestamps conform to ISO 8601.  
**Responsible Role:** Engineering Lead  
**Test Method:** Insert test audit event; verify `created_at` is set server-side in UTC; confirm no client override path exists.

### **AU-9** Protection of Audit Information
**Implementation Status:** Implemented  
**Implementation Description:** Row Level Security (RLS) on `activity_logs` restricts read access to the record owner's `org_id` (org admins only) and the system service role. End-users cannot query, modify, or delete audit records. The service role key is stored as an environment secret, not client-accessible. No `DELETE` or `UPDATE` grants exist on `activity_logs` for non-service roles.  
**Responsible Role:** Engineering Lead  
**Test Method:** Attempt `DELETE` from `activity_logs` with a non-service JWT; verify 403/RLS denial. Confirm no UI or API endpoint exposes delete/update for audit records.

### **AU-11** Audit Record Retention
**Implementation Status:** Implemented  
**Implementation Description:** Audit records in `activity_logs` are retained for a minimum of 1 year (365 days) per policy. A scheduled job (Supabase cron) runs nightly to archive records older than 1 year to cold storage rather than delete them, preserving forensic availability. Retention schedule is documented in the data retention policy.  
**Responsible Role:** Engineering Lead  
**Test Method:** Review cron job definition; confirm archive function moves (not deletes) records; verify no records under 365 days are removed.

### **AU-12** Audit Record Generation
**Implementation Status:** Implemented  
**Implementation Description:** Audit records are generated at the point of action via Supabase PostgreSQL triggers and application-layer middleware. All 22 defined event types have corresponding trigger or middleware hooks. The `create_activity_log` RPC function is the single insertion point, enforcing consistent schema. New event types require schema migration and trigger update, ensuring no ad-hoc log writes bypass the audit schema.  
**Responsible Role:** Engineering Lead  
**Test Method:** Trigger each of the 22 event types in a staging environment; verify corresponding record appears in `activity_logs` with correct `event_type` and required fields populated.
