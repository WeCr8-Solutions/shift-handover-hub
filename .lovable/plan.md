## Goal

Make every real GCA/OAP certificate require a **mentor sign-off**, where the mentor must be either:
1. **JobLine.ai-approved** (vetted by a platform admin) — used when the recipient is a self-paying individual learner, or
2. An **org-designated mentor in a paid employer org** — vetted/approved by an Org Admin within an employer that holds an active paid JobLine.ai subscription.

Self-skilling (adding machines/proficiencies to a talent profile) stays free and unmentored — but those badges are clearly marked "self-attested" and cannot become real certificates without going through the gate above.

## What changes

### 1. Mentor approval data model (DB migration)

Extend the existing `oap_designated_mentors` table (currently org-only, no platform layer) into a unified mentor registry that covers both GCA and OAP and supports a JobLine-platform tier:

```sql
ALTER TABLE public.oap_designated_mentors
  RENAME TO certifying_mentors;

ALTER TABLE public.certifying_mentors
  ALTER COLUMN organization_id DROP NOT NULL,           -- NULL = JobLine platform mentor
  ADD COLUMN scope text NOT NULL DEFAULT 'org'          -- 'platform' | 'org'
    CHECK (scope IN ('platform','org')),
  ADD COLUMN programs text[] NOT NULL DEFAULT ARRAY['OAP'],  -- subset of {'OAP','GCA'}
  ADD COLUMN approval_status text NOT NULL DEFAULT 'pending' -- pending | approved | revoked
    CHECK (approval_status IN ('pending','approved','revoked')),
  ADD COLUMN approved_by uuid,                          -- platform admin user_id
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN credentials_url text,                      -- résumé/cert proof upload
  ADD COLUMN signature_url text;                        -- saved e-signature image

-- Platform mentors: org_id NULL, scope='platform'.
-- Trigger enforces: scope='platform' iff org_id IS NULL.
-- Trigger enforces: scope='platform' rows can only be inserted/approved by has_role(uid,'admin').
```

Replace the existing `can_act_as_oap_mentor()` helper with a new `can_certify(_user_id, _org_id, _program)` security-definer function:

```sql
-- Returns TRUE only if:
--  • user is platform admin, OR
--  • user is an APPROVED platform-scope mentor for _program, OR
--  • user is an APPROVED org-scope mentor in _org_id for _program
--    AND that org has an active paid subscription (subscription_tier != 'free').
-- Org admins/supervisors are NO LONGER auto-mentors — they must be explicitly
-- designated and approved (matches the user's intent).
```

Keep a thin compat shim `can_act_as_oap_mentor()` that calls the new function with `_program='OAP'` so existing callers still work.

### 2. Tighten `issue-certificate` edge function

Currently the function accepts a cert request from any platform admin or org admin/supervisor and silently uses the org's `designated_oap_mentor_user_id` as signer (only for OAP, only if set). Change it to:

- **Require an explicit `mentorUserId` in the request body** for both GCA and OAP.
- Call `can_certify(mentorUserId, body.organizationId, body.program)` via RPC. Reject with a clear error if it returns false.
- For GCA self-pay (no `organizationId`): require the mentor to be an **approved platform-scope mentor** for `'GCA'`.
- For org-issued (paid employer): require the mentor to be an **approved org-scope mentor** for that org/program. Reject if the org's subscription is `'free'` (covers the user's "only paid employers can mint real certs" rule).
- Stamp `signed_by_user_id`, `signed_by_name`, `signed_by_title`, `signed_by_signature_url` from the resolved mentor's `certifying_mentors` row.
- Keep the existing `has_passed_*` gates — nothing weakens.

The Stripe webhook path (paid self-issue at $12) needs a mentor selected at checkout — see step 4.

### 3. Admin dashboard UI — Platform Mentor Registry

New tab in `src/pages/Admin.tsx` (platform-admin-only, sits next to "Training → Library"):

```
Training
  ├─ Library          (existing)
  └─ Certifying Mentors  (new — platform admin only)
```

New component `src/components/admin/mentors/PlatformMentorRegistry.tsx`:
- Table of all `certifying_mentors` rows (both platform and org), filterable by status / scope / program.
- Pending-approval queue at the top: review credentials_url, signature_url, then Approve / Reject.
- "Add platform mentor" form: pick a JobLine user (search by email), set programs, upload credentials + signature, approve in one shot.
- Revoke button on any row (sets `approval_status='revoked'`, preserves audit trail).
- Per-org breakdown: shows how many approved mentors each paid employer has.

### 4. Org admin UI — Designate Mentor (refactor existing panel)

Update `src/components/oap/OapMentorAdminPanel.tsx` and `src/hooks/useOapMentors.ts` (rename to `useCertifyingMentors`):
- Designation by org admin now creates an `approval_status='pending'` row.
- Show clear status badges: **Pending platform review**, **Approved**, **Revoked**.
- If the org is on a free tier, show a banner: *"Mentor designations require an active employer subscription before they can sign certificates."*
- Add program checkbox group: GCA / OAP / both.
- Surface the same panel from the OAP settings card and from the GCA admin tab.
- Org admins can revoke their own org mentors; only platform admins can approve.

### 5. Mentor selection in cert checkout / issuance UI

- `src/components/certificates/BuyCertificateDialog.tsx`: add a **mentor picker** step. For self-pay (no org), only approved platform mentors are listed. For org-issued, only that org's approved mentors are listed. Selected `mentorUserId` is sent into the create-cert-checkout edge function and threaded through Stripe `metadata` so `stripe-webhook` → `issue-certificate` carries it.
- `supabase/functions/create-cert-checkout/index.ts` and `supabase/functions/stripe-webhook/index.ts`: persist `mentor_user_id` in Stripe session metadata; `issue-certificate` reads it and validates with `can_certify` before issuing.

### 6. Talent profile self-attestation labeling

- On `/talent/:username` and operator-profile editor, machines/skills/inspection-tools added by the operator stay editable for free.
- Display a small *"Self-attested"* tag next to any item that has no linked `oap_certificates.cert_id` or `gca_certificates.cert_id`. Verified items show a *"Verified"* badge plus link to the public `/verify/:certId` page.
- No data migration required — display logic only, in `PublicTalentProfile.tsx` and the operator-profile editor.

### 7. Backfill & safety

- One-time SQL: existing rows in the renamed table get `scope='org'`, `programs=ARRAY['OAP']`, `approval_status='approved'`, `approved_by=<service-role placeholder>`, `approved_at=now()` so currently-working orgs aren't broken.
- Existing OAP certs already issued keep working — only new issuance is tightened.

## Files touched

**New:**
- `supabase/migrations/<ts>_certifying_mentors.sql`
- `src/components/admin/mentors/PlatformMentorRegistry.tsx`
- `src/components/admin/mentors/MentorApprovalRow.tsx`
- `src/hooks/useCertifyingMentors.ts` (replaces useOapMentors; old file becomes a re-export shim for compat)

**Edited:**
- `supabase/functions/issue-certificate/index.ts` — require + validate `mentorUserId`
- `supabase/functions/create-cert-checkout/index.ts` — accept + forward `mentorUserId`
- `supabase/functions/stripe-webhook/index.ts` — read `mentorUserId` from metadata
- `src/components/oap/OapMentorAdminPanel.tsx` — pending/approved badges, programs checkboxes, paid-tier banner
- `src/components/settings/DesignatedOapMentorCard.tsx` — point at new fields
- `src/components/certificates/BuyCertificateDialog.tsx` — mentor picker step
- `src/pages/Admin.tsx` — register new "Certifying Mentors" tab (platform-admin-only)
- `src/pages/PublicTalentProfile.tsx` + operator profile editor — Self-attested vs Verified labels
- `src/integrations/supabase/types.ts` — auto-regenerated post-migration

## Out of scope (clearly not changing)

- Self-skill profile editing stays free and unrestricted.
- GCA test player and OAP quiz player do not change.
- No changes to ITAR/`erp_persistence_mode` rules.
- No mentor proctoring/live-video — sign-off remains async via the existing walkthrough/checkoff system.
