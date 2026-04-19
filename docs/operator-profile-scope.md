# JobLine Operator Profile — Full Scope

Last updated: 2026-04-17

JobLine treats every individual operator as a first-class entity: their certifications,
machine proficiencies, work history, and references travel with them across every shop
they ever work for. This document describes the **complete operator profile surface** that
spans the JobLine shift-handoff system, the **GCA Academy**, and the **OAP (Operator
Acceptance Program)**.

---

## 1. Audiences

| Audience | Why they care |
|---|---|
| **Operators / Apprentices** | Own a portable, verified record of every machine, control, and skill they've signed off on. Carry credentials from job to job. |
| **Employers / Org Admins / Supervisors** | Find verified talent, validate incoming hires, run their own OAP issuing programs, and keep an audit-ready employee training file. |
| **GCA Academy learners** | Self-study results, controller test passes, and proctored cert IDs auto-import into the same profile. |
| **Compliance & ITAR auditors** | Cryptographically verifiable cert IDs, recert audit trail, and immutable issuance records. |

---

## 2. Profile components

Every operator profile is composed of the following sections, all stored under the
operator's `user_id` and synchronized across JobLine surfaces:

| Section | Source table | Notes |
|---|---|---|
| Top-level profile | `operator_profiles` | Headline, bio, location, contact, salary, employment preferences, availability |
| Visibility & discovery | `operator_profiles.profile_visibility` | `private` · `employers_only` · `public` (see §4) |
| Public username | `operator_profiles.public_username` | 3-30 char slug used for `/talent/:username` SEO URL |
| Avatar / resume PDF | `operator-profiles` storage bucket | User-folder scoped, public read for avatars only |
| Certifications | `operator_certifications` | Mix of self-reported + auto-imported from OAP/GCA |
| Skills | `operator_skills` | Skill + proficiency + years used |
| Machine proficiencies | `operator_machine_proficiencies` | Machine category, make/model, control type, proficiency level |
| Work history | `operator_work_history` | Optionally linked to a verified `organization_id` for employer-confirmed history |
| Education | `operator_education` | Schools, degrees, dates |
| References | `operator_references` | **Never publicly readable**, regardless of visibility tier |
| Portable credentials | `oap_operator_credentials` | OAP-issued credentials with portability flag and transfer tokens |
| Recert audit trail | `oap_recert_events` | Lifecycle events — scheduled, reminded, recertified, suspended, transferred |

---

## 3. Verified credential pipeline

When a certificate is issued through OAP or GCA Academy, the system:

1. Inserts a row into `oap_certificates` / `gca_certificates` with a unique `cert_id` and `qr_token`.
2. Mints an immutable `oap_operator_credentials` row tied to the operator's `user_id`.
3. Triggers `syncIssuedCertificatesToProfile(userId, email)` (or the operator clicks **Sync OAP/GCA** in their profile) which upserts a `verification_source: 'verified_oap' | 'verified_gca'` row in `operator_certifications`.
4. Renders a `Verified` badge with a public `/verify/:certId` link on the public profile and the talent directory.

Self-reported certs use `verification_source: 'self'` and are never marked verified.

---

## 4. Visibility tiers

Stored in `operator_profiles.profile_visibility` (enum `operator_profile_visibility`).

| Tier | Who can read the profile | Personal contact info (email / phone / address) |
|---|---|---|
| `private` | Owner only | **Never** exposed publicly. Owner-only. |
| `employers_only` | Owner + verified employers (paid OAP/Team subscriptions; via `is_verified_employer()`) | **Never** exposed publicly. Outreach goes through `talent_contact_requests` (in-app messaging). Verified employers can request contact, the candidate accepts/declines in-app. |
| `public` | **Anyone**, including anonymous visitors | **Never** exposed publicly — not on `/talent/:username`, not on `/card/:slug`, not in the `.vcf` download. Public visitors are routed to in-app messaging via the "Message via JobLine" CTA. |

Related sections (certs, skills, machines, work history, education) **inherit public visibility** through an `EXISTS` policy against the parent profile. References never inherit — they remain owner-private.

A trigger keeps the legacy `is_discoverable` boolean in sync (`true` when visibility is `employers_only` or `public`) so older employer-search code continues to work.

The transition from any non-public tier → `public` stamps `public_published_at` once, used to power "Recently published" feeds on `/talent`.

---

## 5. Public surface (`/talent` + `/talent/:username`)

| Route | Purpose | SEO |
|---|---|---|
| `/talent` | Public landing page describing JobLine for individuals + employers, plus a recently-published profile strip and search-CTA | Indexed; sitemap entry |
| `/talent/:username` | Public profile page for a user with `profile_visibility = 'public'` | Indexed; JSON-LD `Person` schema, OG profile tags |
| `/talent/search` | **Authenticated employer-only** searchable database with saved lists, contact requests, and onboard-into-OAP flow | `noindex` |

Public profile pages are rendered through two SECURITY DEFINER RPCs:

- `get_public_operator_profile(_username text)` — returns a single profile row only if `profile_visibility = 'public'`.
- `list_public_operator_profiles(_limit integer, _search text)` — returns a paginated list of public profiles for the directory.

Both RPCs are granted to `anon` and `authenticated` and never expose contact email, phone, or salary.

---

## 6. Cross-product integration

| JobLine surface | How the profile shows up |
|---|---|
| **Shift handoff system** | `Operator` selector in handoff forms enriches with verified machine credentials so supervisors can see qualifications at a glance |
| **OAP enrollment** | Bulk-enroll dialog validates that imported operators already have a JobLine profile; matches by email |
| **OAP transcript** | `/oap/my-transcript` reads from `oap_operator_credentials` and `oap_recert_events` and offers a one-click *publish to my profile* shortcut |
| **GCA Academy** | Passing a controller test issues a `gca_certificates` row, then `syncIssuedCertificatesToProfile` lifts it into the profile |
| **Talent search (employers)** | `/talent/search` queries `operator_profiles_public` filtered by `profile_visibility IN ('employers_only','public')` and `is_verified_employer()` |
| **Onboard from talent** | `OnboardCandidateDialog` creates an `oap_enrollments` row and reuses the candidate's existing profile, never duplicating cert data |

---

## 7. Operator self-management UI

The `/profile/operator` page (`src/pages/OperatorProfile.tsx`) allows the operator to:

- Set headline, bio, location, contact details, salary range, employment preferences
- Toggle **Open to work** and **Willing to relocate**
- Pick visibility tier (3-card selector)
- Claim a public username (validated in DB trigger: lowercase a–z, 0–9, `-`, `_`, 3-30 chars)
- Upload avatar + resume PDF
- Manually add/edit certifications, skills, machines, work history, education, references
- One-click **Sync OAP/GCA** to import verified credentials from issued certificates
- Review and toggle portability of OAP credentials and generate transfer tokens
