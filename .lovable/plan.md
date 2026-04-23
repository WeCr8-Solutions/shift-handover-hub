

# E2E Hardening — GCA + OAP + Certificates + Recert (paid → printed → portable)

Verify and close the loop on every flow that matters: paid + free certificate issuance, server-side test grading, employer recert lifecycle, and the operator-portable transfer-token transcript. Most pieces exist — this pass plugs the holes, makes prints reliable, and proves it with end-to-end tests.

## What we're confirming end-to-end

```text
Anonymous visitor                Authenticated operator              Employer admin/supervisor
─────────────────                ──────────────────────              ─────────────────────────
1. /gcode-academy or /oap         5. Take GCA bank → server-grade    8. /oap/employer
   ↓ "Get certificate $12"           via grade_gca_attempt              ↓ Designate mentor
2. create-cert-checkout RPC       6. Take OAP quiz → server-grade    9. Enroll operator → mentor signs
   → Stripe Checkout                  via grade_oap_quiz_attempt         → issue-certificate (free, mentor-signed)
3. Stripe success →               7. Issued cert appears on         10. Schedule next_recert_due
   /cert/success polls               /oap/my-transcript +           11. Lifecycle events:
   lookup_cert_by_stripe_session     /verify/:certId                    reminder_sent / suspended /
4. stripe-webhook handleCertCheckout                                    waived / recertified / revoked
   inserts row + sends email                                        12. Operator generates transfer token
                                                                         → new employer redeems via
                                                                            redeem_oap_transfer_token RPC
                                                                            → portable creds appear
                                  13. /verify/:certId works for anyone, prints in diploma + digital variants.
```

## Gaps to fix

### 1. Certificate verification page — printable PDF download
Today `/verify/:certId` only supports `window.print()`. Add a "Download PDF" button that uses `html2canvas` + `jsPDF` (already available via the existing print stack — confirm in package.json; if missing, add). Letter-size, both diploma and digital variants generated server-deterministically in client.

### 2. CertSuccess polling never exposes recipient_name
`lookup_cert_by_stripe_session` returns `recipient_email_masked` only. Extend the RPC to also return `recipient_name` (already public on the cert) and `program` so the success page can show "Hi {name}, your {program} cert is ready" without a second authenticated round-trip.

### 3. Free issuance in OapEmployer is not surfaced
`CertificateIssuancePanel` exists but is only mounted under Admin → Training Library. Mount it inside `OapEmployerPanel` (and `GcaEmployerPanel`) gated to admins/supervisors so they can issue certs **after** an enrollment is marked complete or a test passes — without going to platform admin.

### 4. Recert lifecycle UI does not surface "due soon" operators
`useRecordRecertEvent` works, but `OapEmployerPanel` has no "Operators with recert due in 30 days" widget. Add a summary table that pulls `oap_enrollments` where `next_recert_due BETWEEN now() AND now()+interval '30 days'` AND `lifecycle_status='active'`, with one-click `reminder_sent` / `recertified` / `suspended` actions backed by the existing mutation.

### 5. Transfer-token redemption path needs employer-side surface
`OapRedeemTransferDialog` exists but no entry button. Add a "Redeem operator transfer code" button at the top of `OapEmployerPanel` (admins/supervisors only) that opens it. After redemption show the imported credentials inline.

### 6. issue-certificate email + record link to talent profile
When the recipient has a `public_username`, include `https://jobline.ai/talent/{username}` in the email so employers viewing the cert can jump to the operator's public profile. Already snapshotting username — just unused in the email body.

### 7. RLS gap: org admins cannot SELECT issued OAP/GCA certs for their own org
Today only the recipient + platform admins can read `oap_certificates`. The issuing org admin/supervisor must be able to see what their shop has issued (for audit + revocation). Add policy:
```text
oap_certificates SELECT: organization_id IN (org admin/supervisor's orgs)
gca_certificates SELECT: bank_id IS NOT NULL AND issuing user belonged to org
                         (simpler: add issuing_organization_id column, default null,
                          set by issue-certificate when caller is org admin/supervisor)
```
Migration: add `issuing_organization_id uuid` to `gca_certificates` (nullable, no FK cascade), and add the SELECT policies on both tables.

### 8. Recertification-aware certificate `valid_until`
`issue-certificate` accepts `validUntil` but the OAP employer flow never populates it. Default OAP certs to `valid_from + 12 months` when issued by an org (mirrors the AS9100 review cadence). GCA stays "lifetime" (validUntil null). Add an org-level setting `oap_default_recert_months` (default 12) and read it in the issuer.

### 9. End-to-end Playwright spec
Add `e2e/cert-lifecycle.spec.ts` that runs against the seeded e2e org:
- Anonymous → /gca → buy cert (mock Stripe redirect → call seed-e2e helper that simulates webhook)
- Verify `/verify/{cert_id}` returns 200 and renders diploma + digital
- Authenticated operator → take a GCA bank → grade RPC returns a score → second attempt unlocks review
- Org admin → enroll operator → issue free cert → cert appears in `/verify/`
- Employer redeems transfer token → credential appears in target org's view
Extend `seed-e2e` with two scenarios:
- `cert_paid` — inserts a paid `oap_certificates` row directly (skips Stripe)
- `recert_lifecycle` — seeds an enrollment with `next_recert_due = now() + 7 days` so the "due soon" widget has a row

### 10. Documentation for operators
Add a `/help/certificates` article explaining: how to buy, where to find your cert, how to print, how to share with a new employer via transfer token, what happens at recert time. (Hybrid blog/MDX system — drop a single .mdx file.)

## Files

**New**
- `supabase/migrations/<ts>_cert_org_visibility_and_recert_defaults.sql` — Adds `oap_default_recert_months` to `organizations`, `issuing_organization_id` to `gca_certificates`, SELECT policies, extends `lookup_cert_by_stripe_session` return shape.
- `src/components/oap/OapRecertDueWidget.tsx`
- `src/components/certificates/CertificatePdfDownloadButton.tsx`
- `e2e/cert-lifecycle.spec.ts`
- `content/help/certificates.mdx`

**Modified**
- `src/components/oap/OapEmployerPanel.tsx` — mounts `OapRecertDueWidget`, transfer redeem button, free issuance card.
- `src/components/gca/GcaEmployerPanel.tsx` — free issuance card.
- `src/pages/VerifyCertificate.tsx` — adds PDF download button.
- `src/pages/CertSuccess.tsx` — uses extended RPC return.
- `supabase/functions/issue-certificate/index.ts` — default OAP `valid_until`, talent link in email, sets `issuing_organization_id` on GCA.
- `supabase/functions/seed-e2e/index.ts` — `cert_paid` + `recert_lifecycle` scenarios.

## Verification

1. Run `supabase--linter` after migration — expect zero new errors.
2. Run new Playwright spec headlessly via the existing e2e harness.
3. Manual: take a GCA test as `operator-e2e@jobline.test`, confirm `correct_answers` is **not** in the network response until grading completes.
4. Manual: as `admin-e2e`, redeem a transfer token from a freshly-seeded operator and confirm the credential row appears.
5. Hit `/verify/{seeded-cert-id}` while signed out — confirm diploma + digital render and PDF downloads.

## Out of scope

- Switching the certificate template engine (stays React→print, plus html2canvas/jsPDF for download).
- Bulk issuance UI (one-at-a-time stays).
- Stripe production cutover — test-mode price ID continues to drive the $12 SKU.

