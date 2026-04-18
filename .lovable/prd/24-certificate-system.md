# Certificate System (OAP & GCA)

**Status**: ✅ Active
**Last Updated**: 2026-04-18

---

## Overview

JobLine.ai issues two programs of verifiable, QR-anchored certificates:

| Program | Code | Purpose |
|---------|------|---------|
| **OAP** | Operator Acceptance Program | Per-operator skill / machine / operation acceptance, signed by an org-designated mentor |
| **GCA** | General Competency Award | Broader trade competency credential (parity schema, same verification flow) |

Both use a unified cert-ID format and resolve through the same public verification page (`/verify/:certId`), QR generator, and PDF template.

---

## Cert ID Format

```
PROGRAM[-VERTICAL]-XXXXXX-YYYY
```

- `PROGRAM` — `OAP` | `GCA`
- `VERTICAL` (OAP only, optional) — 2–4 char code (e.g. `CAB`, `AUTO`, `WELD`). Omitted for legacy machining IDs.
- `XXXXXX` — 6-char base32 random (alphabet skips `0`, `O`, `1`, `I`, `L`)
- `YYYY` — year of issue

Examples:
- `OAP-A7K3X9-2026` (legacy machining)
- `OAP-CAB-B2M8N4-2026` (cabinetry vertical)
- `GCA-Q9P3R7-2026`

Helpers in `src/lib/certificates.ts`:
- `generateCertId(program, vertical, year)`
- `isCertIdValid(id)`
- `programFromCertId(id)`
- `verticalFromCertId(id)`
- `verificationUrl(certId)` → `https://jobline.ai/verify/:certId`
- `qrPayload(certId, qrToken)` — adds anti-forgery token query param

---

## OAP Verticals

OAP is not machining-only. Each vertical has a short cert-ID code:

| Vertical | Code |
|----------|------|
| machining | (none — legacy) |
| cabinetry | `CAB` |
| automotive | `AUTO` |
| welding | `WELD` |
| construction | `CON` |
| electrical | `ELEC` |
| plumbing | `PLM` |
| hvac | `HVAC` |
| general | `GEN` |

---

## Database Schema

### `oap_certificates` / `gca_certificates`

Core columns (parity between both tables):

| Column | Notes |
|--------|-------|
| `cert_id` (text, unique) | Public ID, format above |
| `qr_token` (text) | Anti-forgery token included in QR URL |
| `recipient_name` | Snapshot at issue time |
| `recipient_username` | **Snapshot of `operator_profiles.public_username` at issue time** so the QR keeps resolving even if the user changes their handle later |
| `recipient_email` | Private — never exposed via public RPCs |
| `organization_id` / `organization_name` | Issuing org (snapshot) |
| `signed_by_user_id` | FK to `auth.users` of the signer |
| `signed_by_name` | Snapshot of mentor display name |
| `signed_by_title` | Snapshot of mentor title |
| `signed_by_signature_url` | Optional — reserved for future signature image upload |
| `status` | `active` \| `revoked` \| `expired` |
| `valid_from` / `valid_until` | `valid_until = null` means lifetime |
| `pdf_url` | Optional cached PDF |
| `stripe_session_id` | For $12 paid certs (private — never exposed publicly) |
| `vertical` (OAP) | One of the verticals above |
| `items` | JSON array of accomplishments (machines, ops, courses, tools, licenses, vertical roles) |

### `organizations`

New column:

| Column | Notes |
|--------|-------|
| `designated_oap_mentor_user_id` | FK to `auth.users`. The org member (owner / admin / supervisor) who signs every OAP cert this org issues. Required before issuance. |

---

## RLS & Public Verification

- Direct `SELECT` on `oap_certificates` / `gca_certificates` is restricted to the issuing org and the recipient.
- **Public verification** uses `SECURITY DEFINER` RPCs that strip PII:
  - `verify_oap_certificate(_cert_id)`
  - `verify_gca_certificate(_cert_id)`
  - `lookup_cert_by_stripe_session(_session_id)` — used by `/cert/success` polling; returns only `cert_id` and a masked email.
- These RPCs return: `cert_id`, `recipient_name`, `recipient_username`, `organization_name`, `status`, `valid_from`, `valid_until`, `signed_by_name`, `signed_by_title`, `signed_by_signature_url`, `items`, `vertical`. **Never** `recipient_email`, `qr_token`, or `stripe_session_id`.

---

## Issuance Flow (`issue-certificate` edge function)

1. Verify caller is org admin / supervisor / platform admin.
2. Resolve **signer**:
   - Read `organizations.designated_oap_mentor_user_id`.
   - Fail with a clear message if unset: *"Set a designated OAP mentor in org settings before issuing."*
   - Fetch the mentor's `display_name` + `title` from `profiles` → snapshot to cert.
3. Resolve **recipient username**:
   - Read `operator_profiles.public_username` for the recipient.
   - Snapshot to `recipient_username` (may be null if recipient hasn't claimed a public handle).
4. Generate `cert_id` via `generateCertId(program, vertical)` and a fresh `qr_token`.
5. Insert row, return `{ cert_id, qr_token }`.

The Stripe-paid public cert flow (`POST /cert/checkout`) writes the row from the webhook handler and uses `stripe_session_id` for the `/cert/success` poll.

---

## Frontend: Two Variants

`src/components/certificates/CertificateTemplate.tsx` exposes:

```tsx
<CertificateTemplate variant="diploma" | "digital" record={...} printMode? />
```

### `variant="digital"` (default — in-app)

- Used on `/verify/:certId` (default tab), `CertSuccess`, dashboard previews.
- Shop-floor card layout, semantic tokens, lists `items[]` accomplishments.
- Compact signature block (printed name + title, no script font).
- QR → `/talent/:recipient_username` (falls back to `/verify/:certId` if no username).

### `variant="diploma"` (formal print)

- Triggered automatically when `printMode` is set (the `/verify/:certId` print route).
- Serif typography: **Playfair Display** (headings/body), **Great Vibes** (signature script). Both loaded in `index.html`.
- Ornate double-border, JobLine.ai wordmark seal top-center.
- Large script recipient name, formal body copy:
  > *"This is to certify that {Name} has successfully completed the requirements of the {Program Name} on behalf of {Organization Name}."*
- Single signature line: cursive script of mentor name + printed name + `"Designated OAP Mentor, {Org Name}"`.
- QR → `/talent/:recipient_username` in footer-right.
- Cert ID + verification URL as small footer text.
- Sized for 8.5×11 portrait at print.

`CertificatePreview.tsx` (marketing page) accepts the same `variant` prop so both styles can be showcased side-by-side.

---

## Org Settings UI

`src/components/settings/DesignatedOapMentorCard.tsx`:

- Picker on the Organization Settings page.
- Lists org members with role `owner`, `admin`, or `supervisor`.
- Required before the org can issue OAP certs (issuance edge function enforces).
- Shows the currently selected mentor's name + title; "Change" button opens picker.

---

## Verification Page (`/verify/:certId`)

`src/pages/VerifyCertificate.tsx`:

- Calls the program-appropriate verification RPC (resolved from cert ID prefix).
- Shows `digital` view by default with a toggle to preview `diploma`.
- "Print certificate" button forces `diploma` + `printMode` and triggers `window.print()`.
- Status badge: `Active` (green), `Revoked` (red), `Expired` (amber).
- Anyone can verify without signing in. SEO: `noindex` on revoked/missing.

---

## Related Files

| File | Role |
|------|------|
| `src/lib/certificates.ts` | Types, ID generation, vertical map, QR helpers |
| `src/components/certificates/CertificateTemplate.tsx` | Dual-variant render |
| `src/components/certificates/CertificatePreview.tsx` | Marketing-page preview |
| `src/components/settings/DesignatedOapMentorCard.tsx` | Org mentor picker |
| `src/hooks/useCertificates.ts` | Fetch / list certs for current user / org |
| `src/pages/VerifyCertificate.tsx` | Public `/verify/:certId` |
| `src/pages/CertSuccess.tsx` | Post-Stripe-checkout polling page |
| `supabase/functions/issue-certificate/index.ts` | Server-side issuance + signer resolution |

---

## Out of Scope (Deferred)

- **JobLine.ai-official certifier path** — only employer-mentor signatures for now.
- **Signature image upload UI** — `signed_by_signature_url` column exists but no upload flow yet; mentor name renders in cursive font as the signature.
- **Multi-signer / countersignature** — single mentor signature per cert.
