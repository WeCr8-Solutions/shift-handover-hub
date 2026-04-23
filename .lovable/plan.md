

# Security Hardening — Certificates, OAP/GCA Tests, Storage Buckets, Realtime

A focused remediation pass on the certificate, recert, test-content, and storage layers. Two database migrations + one auth setting + one tiny client change. No UI/behavior changes for end users.

## What gets fixed (priority order)

### 1. Test answer leakage (GCA + OAP) — **critical for cert integrity**
Today any authenticated user can `SELECT correct_answers` from `gca_questions` and `oap_quiz_questions`. That breaks the entire certification value prop.

- Drop the broad `SELECT … USING (true)` policies on both tables.
- Replace with: platform admins keep full SELECT; everyone else reads via a new **column-restricted view** (`gca_questions_public`, `oap_quiz_questions_public`) that omits `correct_answers` and `explanation`.
- Add a `SECURITY DEFINER` RPC `grade_gca_attempt(_attempt_id)` / `grade_oap_quiz_attempt(_attempt_id)` so grading happens server-side; the client never sees correct answers until after submission, and only its own attempt's explanations.
- Update `useGcaTest` / OAP quiz player to read from the new views and call the grader RPC on submit.

### 2. Storage bucket scoping
- **`performance-updates`**: confirm + drop any residual broad `SELECT bucket_id = 'performance-updates'` policy; rely on existing `perf_updates_select_org_member` (org-scoped path policy).
- **`certificate-templates`** (currently public + listable): keep public READ for canonical assets at `canonical/*` only; restrict listing of `org-<uuid>/*` paths to that org's admins. Add explicit DENY-anon LIST policy.
- **`oap-gca-certificates`** (PDFs publicly readable by exact path): keep — cert IDs are unguessable UUIDs and `/verify/:certId` depends on this — but document the contract and add a `WHERE` clause requiring `name LIKE 'OAP-%' OR name LIKE 'GCA-%'` to prevent uploads from poisoning unrelated paths.
- **All private buckets** (`handoff-attachments`, `ncr-attachments`, `setup-sheets`, `part-images`, `training-media-private`): audit policies are org-folder-scoped and not bucket-wide.

### 3. Org billing data exposure
Move `billing_email` and `stripe_customer_id` reads from `organizations` to the existing admin-only `organization_billing` table. Drop those two columns from the broad org SELECT by creating a `organizations_public` view that excludes them, and update the `is_org_member` SELECT policy to allow only non-billing columns. (Or simpler: revoke direct `SELECT` on those two columns via a column-level grant — Postgres supports this; faster than refactoring all reads.)

### 4. Reference contact PII (`operator_references`)
Add an explicit RESTRICTIVE policy on `authenticated` that denies SELECT unless `auth.uid() = user_id`. Belt-and-suspenders alongside the existing permissive owner-only policy.

### 5. Recertification + transfer token hardening
- `oap_transfer_tokens`: today `ALL` to owner. Replace with: SELECT to owner; INSERT to owner; UPDATE forbidden client-side (only the `redeem_oap_transfer_token` RPC may flip `redeemed_at`); DELETE to owner only when `redeemed_at IS NULL`. Enforce single-use in the RPC by `WHERE redeemed_at IS NULL AND expires_at > now()` with a row lock.
- `oap_operator_credentials`: tighten "Issuing employer inserts credentials" to require the inserting user be `owner|admin|supervisor` of `issuing_organization_id` AND that a matching active `oap_enrollments` row exists for `(operator_user_id, issuing_organization_id)`.
- `oap_recert_events`: add WITH CHECK on INSERT to verify the actor is admin/supervisor of `organization_id` (today INSERT policy is `qual=NULL` with no with_check — anyone authenticated can insert).
- `certificate_templates` already correctly gated; no change.

### 6. Realtime channel authorization
Add policies on `realtime.messages` so subscriptions to org-scoped topics (`org:<uuid>:*`, `station:<uuid>:*`, `queue:<uuid>:*`) require `is_org_member(auth.uid(), <uuid>)`. Public topics (e.g. `verify:*`) explicitly allowed.

### 7. Flyer invite token exposure (out of cert scope, but flagged error)
- Move `invite_token` out of the row that flyer workers can SELECT (separate `flyer_zone_invites` table OR strip token from a view).
- UPDATE policy on `flyer_zone_assignments`: require token match in WITH CHECK, not just `assigned_to_user_id IS NULL`.

### 8. Auth: Leaked Password Protection
Enable HIBP check on signup/password change.

## Migration layout

```text
supabase/migrations/
  <ts>_secure_test_answers_and_grading.sql
    - DROP broad SELECT policies on gca_questions / oap_quiz_questions
    - CREATE VIEW gca_questions_public, oap_quiz_questions_public (no correct_answers)
    - CREATE FUNCTION grade_gca_attempt(...) SECURITY DEFINER
    - CREATE FUNCTION grade_oap_quiz_attempt(...) SECURITY DEFINER
    - GRANT SELECT on views to authenticated; REVOKE direct SELECT of correct_answers
  <ts>_storage_and_pii_hardening.sql
    - Drop "Anyone can view performance update images" if present
    - Tighten certificate-templates SELECT to canonical/* + org-<uuid>/* (membership)
    - Restrict oap-gca-certificates uploads to OAP-%/GCA-% paths
    - RESTRICTIVE policy on operator_references for authenticated non-owner
    - Column-level revoke on organizations.billing_email, stripe_customer_id from authenticated; admins keep via has_role
    - Replace oap_transfer_tokens ALL policy with split SELECT/INSERT/DELETE; harden redeem_oap_transfer_token RPC
    - Tighten oap_operator_credentials INSERT (with_check + enrollment match)
    - Add WITH CHECK to oap_recert_events INSERT (org admin/supervisor of organization_id)
    - Realtime.messages topic-pattern policies
    - Flyer invite_token isolation
```

Auth setting (separate tool call, no migration): `password_hibp_enabled = true`.

## Client-side changes

- `src/hooks/useGcaTest.ts` — read questions from `gca_questions_public`; on submit call `supabase.rpc('grade_gca_attempt', { _attempt_id })` instead of grading client-side.
- `src/hooks/useOapQuiz.ts` (or wherever quiz grading lives) — same pattern.
- `src/hooks/useOapRecert.ts` `useCreateTransferToken` / `useRedeemTransferToken` — no API change; behavior unchanged.
- `src/hooks/useGcaAdmin.ts` / `useOapAdmin.ts` — admins still read full rows via the base table (RLS allows admin SELECT). No change.
- Anywhere `organizations.billing_email` / `stripe_customer_id` are read for non-admins — move to `organization_billing` (already admin-gated). Quick grep, expect 1–3 sites.

## Verification

After migration:
1. Re-run `supabase--linter` and `security--run_security_scan` — confirm the 4 error-level findings are cleared.
2. Add Deno test for `grade_gca_attempt` (correct + incorrect path) under `supabase/functions/__tests__/` if helpful, or rely on a manual SQL spot-check.
3. Manual smoke: take a GCA test as a non-admin user, confirm `correct_answers` is `undefined` in the network response, confirm score still appears after submit.

## Out of scope (call-outs)

- Webhook secret hashing, ERP OAuth secret masking, encrypted-credentials handling — flagged as `warn`, not `error`; per project policy we address `error` only this pass and queue these for a follow-up.
- Cert PDF bucket staying public is intentional (`/verify/:certId` is a public verification page); cert IDs are unguessable UUIDs. Documented, not changed.
- No changes to the certificate template UI or issuance edge function.

