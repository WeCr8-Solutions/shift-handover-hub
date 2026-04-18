# Talent Profile System

**Status**: ✅ Active
**Last Updated**: 2026-04-18

---

## Overview

Every operator on JobLine.ai gets an **Operator Profile** — a personal record of skills, certifications, machines, and accomplishments. Operators choose how visible that profile is, and a fully-public profile becomes a **Talent Profile** at `jobline.ai/talent/:username` — a SEO-indexed, QR-anchored career page that doubles as the public landing for every certificate they earn.

---

## Three-Tier Visibility Model

Set per-user on `operator_profiles.visibility`:

| Tier | Who can see it | Contact info exposed |
|------|----------------|----------------------|
| `private` (default) | Only the operator | No |
| `employers_only` | Authenticated org admins / supervisors browsing the talent directory | Yes, to verified employers only |
| `public` | Anyone, including signed-out visitors and search engines | **Never** — masked via the public view |

Contact fields (`email`, `phone`, `resume_url`) are masked for non-employer viewers regardless of tier via a dedicated public view (see *RLS & Contact Masking* below).

---

## Public Routes

| Route | Purpose | Auth |
|-------|---------|------|
| `/talent` | Public talent landing — directory of `public` profiles, search, filters | None |
| `/talent/:username` | Individual public talent profile | None |
| `/operator-profile` | Operator's own profile editor (visibility, headline, bio, public username, accomplishments) | Required |

`/talent/:username` is fetched anon-callable, supports SEO (`og:type="profile"`, `Person` JSON-LD), and uses `noindex` only when the profile is missing/private.

---

## Public Username

- Stored on `operator_profiles.public_username`.
- Lowercase letters, numbers, hyphens, underscores. 3–30 characters.
- Globally unique across the platform.
- Once chosen, it's the operator's permanent talent URL slug.
- **Snapshotted onto every certificate at issue time** (see Certificate System PRD #24) so QR codes remain valid even if the operator changes their handle later.

---

## What a Public Talent Profile Shows

Rendered by `src/pages/PublicOperatorProfile.tsx`:

- Avatar, full name, headline, location
- Bio / about
- **Verified credentials** — list of all `active` OAP + GCA certs issued to this user, each linking to `/verify/:certId`
- Machines, operations, software, languages, trade specializations
- Years of experience, current role, organization (only if user opted in)
- Social panel (`TalentSocialPanel`) — links to LinkedIn, GitHub, portfolio, etc.
- "Contact" CTA — opens auth-gated employer contact flow; never reveals raw email/phone publicly

Contact info is *only* revealed to authenticated employer users via the masking view.

---

## RLS & Contact Masking

- `operator_profiles` direct reads are restricted by visibility:
  - `private` → owner only
  - `employers_only` → owner + authenticated org admins/supervisors
  - `public` → anonymous + everyone
- A dedicated `operator_profiles_public` view (or RPC) strips contact fields for non-employer reads.
- Employers see contact info only when `visibility ∈ {employers_only, public}` AND the viewer has an active org admin/supervisor role.

See `mem://features/talent/profile-visibility` for the full visibility model and `mem://technical/security/rls-access-constraints` for cross-org isolation rules.

---

## Talent ↔ Certificate Integration

1. Operator earns an OAP/GCA cert → row inserted with `recipient_username` snapshot.
2. The cert's QR code (printed and digital) points to `/talent/:recipient_username`, **not** `/verify/:certId`.
3. The talent profile page surfaces the cert in its "Verified Credentials" section, each linking back to `/verify/:certId` for tamper-proof verification.
4. If `recipient_username` is null (operator never claimed a public handle), the QR falls back to `/verify/:certId` directly.

This makes the operator's profile the canonical career landing page — employers scan one QR and see *everything* the operator has earned, not just one credential.

---

## Operator-Side Editor

`src/pages/OperatorProfile.tsx`:

- Visibility radio (Private / Employers Only / Public) with plain-language descriptions.
- Public username input with live preview: `jobline.ai/talent/{username}`.
- Headline, bio, location, role, social links.
- Accomplishments are populated from earned certs + manually-added skills/machines/software.
- "View public profile" link appears once `public_username` is set and visibility ≠ private.

---

## SEO

- `<SEOHead>` sets canonical `/talent/:username`, `og:type=profile`, og image from avatar.
- JSON-LD `Person` schema:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "...",
    "url": "https://jobline.ai/talent/:username",
    "description": "...",
    "image": "..."
  }
  ```
- `/talent` directory is included in `sitemap.xml`; individual public profiles are crawlable.
- Missing/private profiles return `noindex`.

---

## Related Files

| File | Role |
|------|------|
| `src/pages/PublicOperatorProfile.tsx` | Public `/talent/:username` page |
| `src/pages/OperatorProfile.tsx` | Authenticated operator editor |
| `src/pages/Talent.tsx` (or equiv) | `/talent` directory landing |
| `src/components/talent/TalentSocialPanel.tsx` | Social links + contact CTA |
| `src/hooks/useOperatorProfile.ts` | Fetch / mutate operator profile |
| `operator_profiles` table | Source of truth |

---

## Related PRDs

- [24 — Certificate System](./24-certificate-system.md) — username snapshotting + QR target
- [01 — User Roles & Access Control](./01-user-roles-access-control.md) — operator/supervisor roles
- [13 — Help Center](./13-help-center.md) — public discoverability patterns

---

## Memory References

- `mem://features/talent/public-landing` — `/talent` landing implementation, SEO, JSON-LD
- `mem://features/talent/profile-visibility` — three-tier visibility + contact masking view
