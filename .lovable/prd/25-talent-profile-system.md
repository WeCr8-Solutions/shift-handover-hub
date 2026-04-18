# Talent Profile System

**Status**: ✅ Active
**Last Updated**: 2026-04-18

---

## Overview

Every operator on JobLine.ai gets an **Operator Profile** — a personal record of skills, certifications, machines, work history, and accomplishments. Operators choose how visible that profile is, and a fully-public profile becomes a **Talent Profile** at `jobline.ai/talent/:username` — a SEO-indexed, QR-anchored career page that doubles as the public landing for every certificate they earn.

---

## Three-Tier Visibility Model

Set per-user on `operator_profiles.profile_visibility` (Postgres enum):

| Tier | Who can see it | Contact info exposed |
|------|----------------|----------------------|
| `private` (default) | Only the operator | No |
| `employers_only` | Authenticated org admins / supervisors browsing the talent directory | Yes, to verified employers only |
| `public` | Anyone, including signed-out visitors and search engines | **Never** raw on the page — masked / mediated via Talent Search |

Discovery is additionally gated by `is_discoverable` (boolean) — set to `true` to opt into employer search results.

---

## Public Routes

| Route | File | Auth |
|-------|------|------|
| `/talent` | `src/pages/TalentLanding.tsx` — public talent landing, value props, recently published, dual operator/employer CTAs | None |
| `/talent/search` | `src/pages/TalentSearch.tsx` — employer search, saved lists with stages, in-app messaging | Org owner / admin / supervisor |
| `/talent/:username` | `src/pages/PublicOperatorProfile.tsx` — individual public profile with QR + print | None |
| `/profile/operator` | `src/pages/OperatorProfile.tsx` — operator's own editor | Required |

`/talent/:username` is fetched via the anon-callable RPC `get_public_operator_profile(_username)`, supports SEO (`og:type="profile"`, `Person` JSON-LD with `hasCredential`, `knowsAbout`, `seeks`), and uses `noindex` only when the profile is missing/private.

`/talent` lists recently published profiles via `list_public_operator_profiles(_limit, _search)`.

---

## Public Username

- Stored on `operator_profiles.public_username` (text, globally unique).
- Lowercase letters, numbers, hyphens, underscores. 3–30 characters.
- Once chosen, it's the operator's permanent talent URL slug.
- **Snapshotted onto every certificate at issue time** (see Certificate System PRD #24) so QR codes remain valid even if the operator changes their handle later.
- `public_published_at` records when the profile first went public.

---

## What a Public Talent Profile Shows

`PublicOperatorProfile.tsx` renders, in order:

1. **Header card** — avatar, name, `@username`, headline, status badges (Open to work, Will relocate, Verified-cert count), location, years experience, LinkedIn, portfolio, and CTAs (Talent Search for employers, Build-your-own for visitors).
2. **QR + Share + Print panel** (`PublicProfileQrCard`) — QR encodes the canonical `/talent/:username` URL, with **Copy link** + **Print profile** buttons and a "Verified on JobLine.ai — {certId}" trust strip pointing to `/verify/{certId}` for the most recent verified cert.
3. **Social panel** (`TalentSocialPanel`) — coworker connect/follow + recommendations.
4. **About** — bio.
5. **Certifications** — pulled from `operator_certifications`; each cert with verified badge if `verification_source` starts with `verified_`, plus credential URL link.
6. **Machine proficiencies** — `operator_machine_proficiencies`.
7. **Skills** — `operator_skills` with proficiency badges.
8. **Work history** — `operator_work_history`.
9. **Education** — `operator_education`.
10. **Footer CTA** — "Want a profile like this?" → `/auth?signup=1`.

---

## Print View (Resume Layout)

`src/styles/print-talent.css` defines a `@media print` ruleset:

- Hides nav, footer, and any `.no-print` elements (CTAs, list controls).
- Strips background colors, shadows, and rounded corners for clean ink rendering.
- Single-column full-bleed layout with 0.5in page padding.
- `page-break-inside: avoid` on cards to prevent awkward splits.
- Anchors append their `href` after the link text (so URLs are visible on paper).
- The QR card adds a printed footer line: *"Career profile of {Name} · jobline.ai/talent/{username}"*.

Triggered by the **Print profile** button in `PublicProfileQrCard` (`window.print()`).

---

## Database Schema

### `operator_profiles`

| Column | Notes |
|--------|-------|
| `user_id` (uuid, FK auth.users) | Owner |
| `headline`, `bio` | Free text |
| `years_experience` (int) | |
| `location_city`, `location_region`, `location_country` | |
| `linkedin_url`, `portfolio_url`, `resume_pdf_url` | Profile links — **note: `resume_pdf_url`, not `resume_url`** |
| `avatar_url` | |
| `willing_to_relocate`, `open_to_work` (bool) | |
| `is_discoverable` (bool) | Opt-in to employer search |
| `preferred_employment_types` (text[]) | |
| `desired_salary_min`, `desired_salary_max` (int) | |
| `contact_email`, `contact_phone` | Private — only surfaced to verified employers via Talent Search |
| `profile_visibility` (enum) | `private` \| `employers_only` \| `public` |
| `public_username` (text, unique) | URL slug |
| `public_published_at` (timestamptz) | First-public timestamp |

### Related operator tables

`operator_certifications`, `operator_skills`, `operator_machine_proficiencies`, `operator_work_history`, `operator_education` — each keyed by `user_id` and inherit visibility via parent `operator_profiles.profile_visibility`.

---

## RLS & Public Access

- `operator_profiles` direct reads are restricted by `profile_visibility`:
  - `private` → owner only
  - `employers_only` → owner + authenticated org admins / supervisors
  - `public` → anonymous + everyone
- Anonymous public reads go through `SECURITY DEFINER` RPCs:
  - `get_public_operator_profile(_username)` — single profile, only public-safe columns (no `contact_email`, `contact_phone`, `desired_salary_*`).
  - `list_public_operator_profiles(_limit, _search)` — directory listing with same filtering.
- Contact info (`contact_email`, `contact_phone`) is *only* revealed to authenticated employer users via the Talent Search flow, not via the public profile RPC.

See `mem://features/talent/profile-visibility` for the full visibility model and `mem://technical/security/rls-access-constraints` for cross-org isolation rules.

---

## Talent ↔ Certificate Integration

1. Operator earns an OAP/GCA cert → row inserted with `recipient_username` snapshot from `operator_profiles.public_username`.
2. The cert's QR code (printed diploma + digital card) points to `/talent/:recipient_username` — **not** `/verify/:certId`.
3. The talent profile surfaces the cert in the **Certifications** section, each linking to `/verify/:certId` for tamper-proof verification.
4. The QR card shows a "Verified on JobLine.ai — {certId}" trust strip with the most recent verified cert.
5. If `recipient_username` is null on the cert (operator never claimed a public handle), the cert QR falls back to `/verify/:certId` directly.

This makes the operator's profile the canonical career landing page — employers scan one QR and see *everything* the operator has earned, not just one credential.

---

## Talent Search (Employers)

`/talent/search` (`TalentSearch.tsx`) — gated to org `owner` / `admin` / `supervisor`:

- **Filters**: keyword (headline + bio), skill, machine category, min years experience, location (city/region), open-to-work toggle.
- **Results**: card per candidate with avatar, name (resolved from `profiles.display_name`), headline, location, years, verified-cert count, total cert count, LinkedIn, and **Message** / **Onboard** / **Add to list** actions.
- **Saved lists**: kanban with stages `new` → `contacted` → `interviewing` → `offer` → `hired` / `rejected`. List cards show resolved candidate names (falling back to `Candidate {first6}` if the candidate isn't in current search results).
- **Messages**: in-app contact requests; candidates accept/decline in their `OperatorInbox`.
- **Onboard**: `OnboardCandidateDialog` moves a candidate straight into the org's OAP enrollment.

Hooks: `useTalentSearch`, `useSavedLists`, `useContactRequests` (all in `src/hooks/useTalent.ts`).

---

## Operator-Side Editor

`src/pages/OperatorProfile.tsx`:

- Visibility radio (Private / Employers Only / Public) with plain-language descriptions.
- Public username input with live preview: `jobline.ai/talent/{username}`.
- Headline, bio, location, years, role, social links, resume PDF upload.
- Sections to manage skills, machines, work history, education, and certifications.
- "View public profile" link appears once `public_username` is set and `profile_visibility ≠ private`.

---

## SEO

- `<SEOHead>` sets canonical `/talent/:username`, `og:type=profile`, og image from avatar.
- JSON-LD `Person` schema includes `name`, `url`, `description`, `image`, `address`, `sameAs` (LinkedIn / portfolio), `hasCredential` (each cert as `EducationalOccupationalCredential` with `credentialCategory: Verified | Self-reported`), `knowsAbout` (skills), and `seeks` (when open to work).
- `/talent` directory is included in `sitemap.xml`; individual public profiles are crawlable.
- Missing/private profiles return `noindex`.

---

## Related Files

| File | Role |
|------|------|
| `src/pages/TalentLanding.tsx` | Public `/talent` landing |
| `src/pages/TalentSearch.tsx` | Employer-only `/talent/search` |
| `src/pages/PublicOperatorProfile.tsx` | Public `/talent/:username` |
| `src/pages/OperatorProfile.tsx` | Authenticated operator editor |
| `src/pages/OperatorInbox.tsx` | Operator's contact-request inbox |
| `src/components/talent/PublicProfileQrCard.tsx` | QR + Copy/Print + verified strip |
| `src/components/talent/TalentSocialPanel.tsx` | Coworker connect/follow + recommendations |
| `src/components/talent/OnboardCandidateDialog.tsx` | Move candidate into OAP enrollment |
| `src/styles/print-talent.css` | Print stylesheet for resume export |
| `src/hooks/useTalent.ts` | Search / saved lists / contact requests |
| `src/hooks/useOperatorProfile.ts` | Fetch / mutate operator profile |
| `src/hooks/useOperatorSocial.ts` | Coworker social graph |
| `operator_profiles` table | Source of truth |
| `get_public_operator_profile` RPC | Anon public-profile read |
| `list_public_operator_profiles` RPC | Anon directory listing |

---

## Related PRDs

- [24 — Certificate System](./24-certificate-system.md) — username snapshotting + QR target
- [01 — User Roles & Access Control](./01-user-roles-access-control.md) — operator/supervisor roles
- [13 — Help Center](./13-help-center.md) — public discoverability patterns

---

## Memory References

- `mem://features/talent/public-landing` — `/talent` landing implementation, SEO, JSON-LD
- `mem://features/talent/profile-visibility` — three-tier visibility + contact masking
