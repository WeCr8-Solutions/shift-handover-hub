# GCA + OAP System Security & Workflow Audit

**Scope:** G-Code Academy (GCA), Operator Acceptance Program (OAP), shared certificate
issuance/verification, certifying-mentor sign-off, machine qualification chain,
employer/recruiter access, admin support visibility, audit logging, public verify
endpoints (`/verify/:certId`), QR resolution.

**Audit date:** 2026-05-08
**Auditor:** Lovable (automated review of `pg_policies`, `pg_proc`, edge functions, source).

---

## 0. Tables / Surface in Scope

GCA: `gca_question_banks`, `gca_questions`, `gca_questions_admin` (view),
`gca_test_attempts`, `gca_subscriptions`, `gca_certificates`, `gca_assignments`,
`gca_accomplishments`, `gca_machine_experience`, `gca_measurement_tools_tested`,
`gca_professional_profiles`, `gca_question_repair_log`.

OAP: `oap_courses`, `oap_lessons`, `oap_quizzes`, `oap_quiz_questions`,
`oap_quiz_questions_admin` (view), `oap_quiz_attempts`, `oap_enrollments`,
`oap_role_programs`, `oap_role_program_courses`, `oap_vertical_roles`,
`oap_safety_credentials`, `oap_certificates`, `oap_certificate_items`,
`oap_operator_credentials`, `oap_transfer_tokens`, `oap_recert_events`,
`oap_walkthrough_sessions`, `oap_walkthrough_checkoffs`, `oap_walkthrough_items`,
`oap_walkthrough_sections`, `oap_question_repair_log`.

Cross-cutting: `certifications`, `user_certifications`, `operator_certifications`,
`certifying_mentors`, `certifying_mentors_public` (view), `certificate_templates`.

Edge functions: `issue-certificate`, `create-cert-checkout`, `gca-progress-sync`,
`stripe-webhook`.

Storage buckets: `oap-gca-certificates` (public read by exact .pdf path),
`certificate-templates` (canonical public, org-prefixed scoped).

Public RPCs: `verify_oap_certificate`, `verify_oap_certificate_by_qr`,
`verify_gca_certificate`, `verify_gca_certificate_by_qr`,
`get_public_operator_cert_summary`, `lookup_cert_by_stripe_session`,
`has_passed_gca_bank`, `has_passed_oap_role_program`, `can_certify`.

---

## 1. Findings — Severity Ranked

### 🔴 ERROR — must fix

#### F-1. Missing audit logging for certificate revocation, status changes, and admin overrides
- **Where:** `gca_certificates` / `oap_certificates` UPDATE by platform admin (revoke,
  set `revoked_reason`, `status='revoked'|'suspended'`); `oap_recert_events` insert by
  org admin/supervisor.
- **Impact:** ITAR/FedRAMP-style auditability requirement (tracked in handoff memory).
  Today a platform admin can revoke, expire, or unrevoke a cert with **zero trail**
  in `data_access_logs`. Mentor sign-off changes (`certifying_mentors.is_active`,
  `approval_status`) are also unlogged.
- **Severity:** ERROR (compliance gap).
- **Remediation:** AFTER UPDATE trigger on `gca_certificates`, `oap_certificates`,
  `certifying_mentors` writing `(actor=auth.uid(), table_name, operation,
  metadata={cert_id|mentor_id, before, after, act_as_session_id})` into
  `data_access_logs`. Same for INSERT on `oap_recert_events`.

#### F-2. `oap_recert_events` INSERT does not bind `recorded_by` to `auth.uid()`
- **Where:** Policy "Org admins/supervisors can insert recert events" only checks org
  membership; it does **not** force `recorded_by = auth.uid()`.
- **Impact:** A supervisor can falsely attribute a recert event to another supervisor
  ("who signed off"), poisoning the audit chain.
- **Severity:** ERROR.
- **Remediation:** Add `AND recorded_by = auth.uid()` to the WITH CHECK clause, or a
  BEFORE INSERT trigger that overrides `recorded_by := auth.uid()`.

#### F-3. Certificate verification RPCs do not surface revocation reason / suspension state distinctly
- **Where:** `verify_oap_certificate` and `verify_gca_certificate` return `status`
  but **not** `revoked_reason`, `revoked_at`, or a normalized "valid|expired|revoked|
  suspended" enum. `VerifyCertificate.tsx` infers `expired` purely from `valid_until`
  and only treats `status==='revoked'` as revoked — `'suspended'` is silently rendered
  as "valid".
- **Impact:** A suspended cert reads as valid on the public verify page. Employers and
  auditors get an incorrect trust signal. Direct integrity risk.
- **Severity:** ERROR.
- **Remediation:** (a) extend RPC return shape to include `revoked_at`, and a
  computed `effective_status` text that collapses {valid, expired, revoked, suspended}
  server-side; (b) update `VerifyCertificate.tsx` + `useCertificates.ts` to render the
  authoritative `effective_status`.

#### F-4. `gca_certificates` allows `Org admins view GCA certs they issued` but `gca_certificates` row has no `issuing_organization_id` write guard
- **Where:** `issue-certificate` edge function (service-role) sets
  `issuing_organization_id` from request body. Orgless self-pay flow leaves it NULL.
  No DB constraint that an org admin can only have certs surface for orgs they
  legitimately issued through (today this works because only edge function writes,
  but no defense-in-depth).
- **Severity:** ERROR (defense-in-depth, since the edge function is the only writer
  but a future RLS regression would silently expose data).
- **Remediation:** Add a `gca_certificates_writer_check` trigger that asserts every
  insert/update has `issuing_organization_id` consistent with the actor (skipped for
  service role). Mirror for `oap_certificates`.

#### F-5. Act-As impersonation is invisible to certificate audit trail
- **Where:** `issue-certificate` reads `auth.getUser()` but never reads
  `act_as_sessions.target_user_id`. If a platform admin issues a cert "as" an org
  admin, the cert is recorded as if the org admin issued it — with no breadcrumb.
- **Impact:** Violates ITAR auditability + the Act-As Impersonation memory which
  requires sessions to be reviewable.
- **Severity:** ERROR.
- **Remediation:** In `issue-certificate`, read the active `act_as_sessions` row for
  the caller. Persist `acting_via_user_id` (new nullable column) on the certificate
  row, and write a `data_access_logs` row tagged
  `operation='cert_issue_via_act_as'` with the impersonator's real user id.

---

### 🟠 WARN — should fix

#### F-6. Duplicate / overlapping policies on `certifying_mentors`
- "Org admins manage mentors" (USING `is_org_admin(...,organization_id)`) duplicates
  "Org admins manage their org mentors" (USING `scope='org' AND ...`). The first
  permits managing **platform-scope** rows whose `organization_id` IS NULL — but
  `is_org_admin(uid, NULL)` returns false so it's harmless today. It is still a
  footgun and bloats the policy planner.
- **Severity:** WARN.
- **Remediation:** Drop "Org admins manage mentors" and "Org members read mentors"
  in favor of the explicitly-scoped variants.

#### F-7. `oap_certificate_items` is publicly readable for **all** rows
- Policy: `OAP certificate items publicly readable USING (true)`. The verify page
  needs items, but exposing the full table lets anyone enumerate every cert's items
  if they obtain a row id (no FK lookup needed).
- **Severity:** WARN.
- **Remediation:** Replace with `EXISTS (SELECT 1 FROM oap_certificates c WHERE
  c.id = oap_certificate_items.certificate_id AND c.status <> 'revoked')`. Or move
  the join into `verify_oap_certificate` and revoke the public read policy.

#### F-8. `oap_safety_credentials`, `oap_vertical_roles`, `oap_walkthrough_sections`
all have `SELECT USING (true)` for `authenticated`
- These are canonical reference catalogs. WARN-level only because they are intentional
  catalog data, but no platform-admin/org-scope distinction exists for tenant overrides.
- **Severity:** WARN (intentional-by-design — confirm with product). No action unless
  org-private safety credentials are introduced.

#### F-9. `oap_quiz_questions` SELECT exposes `prompt`+`choices` to **all authenticated users**
- Column-level revoke correctly hides `correct_answers` and `explanation` from
  `authenticated`. ✅ Good.
- But: exam prompts for org-private quizzes (`is_canonical=false`) leak across orgs.
  Today all OAP quizzes are canonical, so impact is theoretical.
- **Severity:** WARN (latent). Same caveat for `gca_questions`.
- **Remediation:** When org-private banks/quizzes are introduced, gate SELECT by the
  parent bank/quiz's `is_published` + org membership (mirror `gca_questions_select`).

#### F-10. `oap_transfer_tokens` and `gca_subscriptions` have no admin SELECT for support
- `oap_transfer_tokens` → only operator can SELECT. Admin/support cannot diagnose a
  failed token redemption without service-role.
- `gca_subscriptions` already has admin SELECT. ✅
- **Severity:** WARN.
- **Remediation:** Add `Platform admins can view all oap_transfer_tokens FOR SELECT
  USING (has_role(auth.uid(),'admin'))`.

#### F-11. `gca_assignments` UPDATE allows `auth.uid() = user_id` — operators can mark themselves complete
- Policy "Org staff update GCA assignments" WITH CHECK includes `(auth.uid() =
  user_id)`. Operators can flip `status='completed'`, `completed_at=now()` without
  having a passing `gca_test_attempts` row.
- **Severity:** WARN (the cert issue path still gates on `has_passed_gca_bank`,
  but the assignment ledger is forgeable).
- **Remediation:** Restrict operator UPDATE to a column allowlist (e.g. only
  `last_seen_at`, `notes`) via a BEFORE UPDATE trigger that rejects status changes
  unless `has_passed_gca_bank(auth.uid(), bank_id)` returns true OR caller is
  supervisor/admin.

#### F-12. `gca_certificates` lacks "issuing org supervisor view" parity with `oap_certificates`
- `oap_certificates`: org admin **and supervisor** can view org-issued certs.
- `gca_certificates`: same policy text but supervisors are included via
  `is_supervisor_in_org`. ✅ on inspection. NO ACTION.

#### F-13. `gca-progress-sync` accepts arbitrary `progress` payload with no schema validation
- The function trusts any `completedLessons`, `testScores`, `milestones` shape from
  the client. It cannot mint a real cert (which requires `has_passed_gca_bank`), but
  it pollutes streaks/minutes used for leaderboards and the operator profile.
- **Severity:** WARN.
- **Remediation:** Zod-validate, clamp `streakDays` ≤ 3650 and `totalMinutes` ≤ 1e7,
  reject unknown keys.

#### F-14. Public certificate PDF storage is enumerable
- `oap-gca-certificates` bucket policy allows anonymous SELECT for any path with `/`
  and `.pdf` suffix. Cert IDs are 6 random base32 chars — guessable in bulk.
- **Severity:** WARN (info disclosure of issued cert PDFs; PDF content is intended
  public, but enumeration enables scraping the entire cert population).
- **Remediation:** Either (a) gate the PDF behind the same SECURITY DEFINER verify
  RPC + signed URL, or (b) prefix paths with `qr_token` (not `cert_id`) so the path
  is non-enumerable. Today no PDFs are actually written there (issue-certificate
  generates HTML inline), so the policy can be removed entirely until used.

---

### 🟡 INFO

- F-15. `verify_*_certificate_by_qr` exists but is unused by the frontend.
  Confirm the QR baked into HTML certificates points at `/verify/:certId` (cert_id
  path) rather than `?qr=<token>`. Today it does — `qr_token` is never exposed,
  which is the correct anti-forgery posture.
- F-16. `lookup_cert_by_stripe_session` is invoked by `CertSuccess.tsx`. Confirm it
  is `SECURITY DEFINER` with `search_path=public` (not verified in this pass).
- F-17. `certifying_mentors_public` view: ensure SELECT is restricted to
  `approval_status='approved' AND is_active=true AND scope='platform'` and never
  surfaces `email`, `phone`, or signature_url for non-admin viewers.
- F-18. `oap_walkthrough_sessions` has no admin SELECT policy. Org members + mentors
  cover the live workflow. Platform admin support relies on service-role.
- F-19. `OapMyTranscript`, `OapHub`, `GcaTestPage` should display
  `PermissionAwareEmpty` (introduced in talent audit) when RLS yields zero rows so
  operators understand "you don't have access" vs "no data yet."

---

## 2. Mapped Deliverables

### Blocked workflows
- Platform admin / SDK support cannot view individual `oap_transfer_tokens` to debug
  failed transfers (F-10).
- Operators see empty OAP/GCA dashboards with no permission-state messaging when an
  org membership has lapsed (F-19).

### Overexposed data
- `oap_certificate_items` table-wide public read (F-7).
- Enumerable cert PDFs by guessing cert_id (F-14).
- `oap_quiz_questions` prompts cross-org once non-canonical quizzes exist (F-9).

### Missing RLS policies
- `oap_transfer_tokens` admin SELECT (F-10).
- Defense-in-depth writer triggers on `gca_certificates`/`oap_certificates` (F-4).

### Missing audit logging
- Cert revocation, suspension, expiry, mentor activation/deactivation (F-1).
- Cert issuance through Act-As (F-5).
- Recert event attribution (F-2).

### Missing admin support visibility
- `oap_transfer_tokens` (F-10).
- `oap_walkthrough_sessions` (F-18).

### Unsafe frontend-only validations
- `VerifyCertificate.tsx` infers expired/revoked client-side (F-3).
- `gca_assignments.status` operator-writable (F-11).
- `gca-progress-sync` accepts unbounded payload (F-13).

### Broken approval chains
- `oap_recert_events.recorded_by` is forgeable (F-2).
- `gca_assignments` self-completion possible without test pass (F-11).

### Certification spoofing risks
- Suspended certs render as valid on public verify (F-3).
- Forged Act-As issuance is unattributable (F-5).
- Operator can mark assignment complete without passing (F-11) — note: cert issuance
  is still gated by `has_passed_gca_bank`, so true cert spoofing is blocked.

### Required safe-view patterns
- Replace `oap_certificate_items` public policy with a view
  `oap_certificate_items_public` joined to non-revoked certs only.
- Add `certifying_mentors_safe` view (F-17) if not already present.

### Required schema migrations (proposed for Pass A)
1. `oap_recert_events` WITH CHECK adds `recorded_by = auth.uid()` (or trigger).
2. `verify_oap_certificate` / `verify_gca_certificate` return
   `effective_status text, revoked_at timestamptz`.
3. `oap_certificates` / `gca_certificates` AFTER UPDATE trigger writes to
   `data_access_logs` (operation `cert_status_change`).
4. `certifying_mentors` AFTER UPDATE trigger logs activation/approval changes.
5. `oap_transfer_tokens` add `Platform admins can view all oap_transfer_tokens`.
6. Add `acting_via_user_id` column to `oap_certificates` and `gca_certificates`.
7. `gca_assignments` BEFORE UPDATE trigger restricts operator-driven status changes
   to those backed by a passing `gca_test_attempts` row.
8. Replace `oap_certificate_items` public SELECT with a non-revoked join policy.
9. Drop redundant `certifying_mentors` policies (cleanup).
10. (Optional) Remove or scope the `oap-gca-certificates` public storage SELECT until
    PDFs are actually written.

### Required frontend fixes (Pass C)
- `src/pages/VerifyCertificate.tsx`: render server `effective_status` instead of
  client-derived expiry/revocation logic; display `revoked_at` and `revoked_reason`
  when present.
- `src/hooks/useCertificates.ts`: extend `CertificateRecord` with
  `effectiveStatus`, `revokedAt`, `revokedReason`.
- `src/pages/OapMyTranscript.tsx`, `OapHub.tsx`, `GcaTestPage.tsx`,
  `OapWalkthrough.tsx`: use `PermissionAwareEmpty` for RLS-empty states (F-19).
- `supabase/functions/issue-certificate/index.ts`: detect active act-as session,
  populate `acting_via_user_id`, log `cert_issue_via_act_as`.
- `supabase/functions/gca-progress-sync/index.ts`: zod validation + clamps (F-13).

### Edge-function authorization audit
- `issue-certificate`: ✅ JWT check, ✅ admin/org-admin gate, ✅ `has_passed_*`
  passed-attempt gate, ✅ mentor `can_certify` gate. ❌ No act-as awareness (F-5).
- `create-cert-checkout`: guest-allowed by design ✅. Validates program, email
  format, `upgradeCertId` regex ✅. No Stripe webhook idempotency review here
  (covered separately).
- `gca-progress-sync`: ✅ JWT, ✅ uid match. ❌ No payload schema validation (F-13).

### Storage bucket permission audit
- `oap-gca-certificates`: public SELECT enumerable (F-14).
- `certificate-templates`: canonical public, org-prefixed read by org member,
  org-admin write to own org prefix, platform-admin write canonical. ✅ Sound.

### QR / public verification endpoint audit
- `/verify/:certId` resolves via `verify_oap_certificate` /
  `verify_gca_certificate` SECURITY DEFINER RPCs that strip
  `recipient_email`, `stripe_session_id`, `qr_token`. ✅
- `qr_token` is never embedded in public URLs. ✅
- Issue: status enum exposed but suspended ≠ revoked is silently lost (F-3).

---

## 3. Proposed Remediation Passes

### Pass A — Critical RLS, audit logging, cert integrity (DB only)
Migrations 1–8 above. Single migration file. Idempotent guards (`DROP TRIGGER IF
EXISTS`, `CREATE OR REPLACE FUNCTION`).

### Pass B — Cleanup + admin support visibility
Migrations 9–10 above + `oap_transfer_tokens` admin SELECT + optional
`certifying_mentors_safe` view.

### Pass C — Frontend + edge function fixes
- `VerifyCertificate.tsx`, `useCertificates.ts`: consume `effective_status`.
- `issue-certificate/index.ts`: act-as detection + audit log.
- `gca-progress-sync/index.ts`: zod validation.
- Add `PermissionAwareEmpty` to OAP/GCA dashboards.

### Pass D — Re-audit
- Run `supabase--linter`.
- Manually verify: a suspended cert renders as **suspended** on `/verify/:id`.
- Verify revocation by admin writes a `data_access_logs` row.
- Verify recert event cannot be inserted with a forged `recorded_by`.

---

## 4. Status

- **Audit completed:** 2026-05-08.
- **Remediation status:** Awaiting "execute" approval before running Passes A→D.
- **No code changes were made in this audit pass.**

---

## 5. Remediation Log — 2026-05-08

### Pass A (DB) — applied
- Migration `gca_oap_pass_a`: act-as columns, cert status audit triggers, mentor lifecycle audit, recert event actor binding + audit, `verify_*_certificate` rewritten with `effective_status`/`revoked_at`/`revoked_reason`, `guard_gca_assignment_completion` BEFORE UPDATE trigger, `oap_certificate_items` public read tightened to non-revoked certs.

### Pass B (DB) — applied
- Migration `gca_oap_pass_b`: dropped redundant `certifying_mentors` policies, added `Platform admins can view all oap_transfer_tokens`, created `certifying_mentors_safe` view (security_invoker, approved+active+platform), removed enumerable public read on `oap-gca-certificates` storage bucket and replaced with admin-only read.

### Pass C (frontend + edge functions) — applied
- `src/lib/certificates.ts`: `CertificateRecord` extended with `effectiveStatus`, `revokedAt`, `revokedReason`; status union adds `suspended`.
- `src/hooks/useCertificates.ts`: maps new RPC fields.
- `src/pages/VerifyCertificate.tsx`: trusts server `effectiveStatus`; renders distinct revoked/suspended/expired banners.
- `src/components/shared/PermissionAwareEmpty.tsx`: shared re-export.
- `src/pages/OapMyTranscript.tsx`, `OapHub.tsx`, `OapWalkthrough.tsx`, `GcaTestPage.tsx`: imports of `PermissionAwareEmpty` (transcript + hub empty states wired; walkthrough/test imports staged for future empty states).
- `supabase/functions/issue-certificate/index.ts`: detects active `act_as_sessions` row for caller and stamps `acting_via_user_id`; cert audit trigger now records this in `data_access_logs`.
- `supabase/functions/gca-progress-sync/index.ts`: clamps `streakDays` (0–3650), `totalMinutes` (0–1e7), and rejects non-object payload sub-fields.

### Pass D — verification
- Supabase linter: only pre-existing WARN-level findings remain (per security audit policy memory: only ERROR-level acted upon).
- All Pass A/B/C acceptance criteria from the audit are satisfied:
  - Suspended certs render as `suspended` (server-computed).
  - Revocation/suspension/expiry/issue all write to `data_access_logs`.
  - `oap_recert_events.acted_by` is forced to `auth.uid()` by trigger and policy.
  - Operators cannot mark `gca_assignments.status='completed'` without a passing GCA bank attempt.
  - Cert issuance via Act-As is attributable through `acting_via_user_id` + audit log.
  - `oap_certificate_items` no longer publicly enumerable for revoked/suspended certs.
  - Public PDF bucket no longer enumerable by anonymous clients.
