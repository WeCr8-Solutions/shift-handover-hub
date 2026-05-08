# /talent System — Comprehensive Visibility & Security Audit

**Date:** 2026-05-07
**Scope:** Public talent profiles, operator dashboards, recruiter/employer browse, RLS, storage, edge functions, search/SEO, admin/SDK support, impersonation logging.
**Method:** `pg_policies`, `pg_proc`, `information_schema`, `storage.objects` policies, frontend reads under `src/pages/Talent*`, `src/pages/PublicOperatorProfile.tsx`, `src/pages/OperatorProfile.tsx`, `src/components/operator/*`, edge functions under `supabase/functions/`.
**Status:** Findings only. No code or schema changes applied.

---

## 0. Surface Inventory

### Routes
| Route | Auth | Indexable | Purpose |
|---|---|---|---|
| `/talent` | Public | ✅ Yes | Marketing landing + featured operators (`list_public_operator_profiles` RPC) |
| `/talent/:username` | Public | ✅ Yes | Individual public operator profile (`get_public_talent_profile_bundle`) |
| `/talent/browse` | Public | ✅ Yes | Browse/filter directory |
| `/talent/search` | Auth + verified employer | ❌ `noindex` | Recruiter search |
| `/talent/dashboard` | Auth (operator) | ❌ `noindex` | Operator's own dashboard |
| `/talent/inbox` | Auth (operator) | ❌ — verify | Talent contact-request inbox |
| `/employer/*` | Auth + employer | ❌ — verify | Employer/saved-list management |
| `/p/:cardSlug` (PublicBusinessCard) | Public | ✅ Yes | vCard / business-card mini-site |
| `/cert/success` | Auth | ❌ | Cert purchase success + "make profile public" nudge |

### Tables
`operator_profiles`, `operator_certifications`, `operator_education`, `operator_skills`, `operator_machine_proficiencies`, `operator_work_history`, `operator_references`, `operator_resume_versions`, `operator_recommendations`, `operator_connections`, `operator_follows`, `operator_station_sessions`, `oap_operator_credentials`, `talent_contact_requests`, `talent_message_replies`, `talent_saved_candidates`, `talent_saved_lists`, `org_messages`.

### Views
- `operator_profiles_public` (security_invoker, masks contact/salary unless self/verified employer)
- `operator_profiles_public_view` (security_invoker, only `profile_visibility='public'`, contact/salary always NULL)
- `operator_references_safe` (security_invoker, owner OR verified employer of discoverable profile)

### Storage Buckets
- `operator-profiles` (private). Owner read/write, plus public SELECT when owner's `profile_visibility='public'`.

### Public RPCs (SECURITY DEFINER, search_path=public, executable to anon)
`get_public_operator_profile`, `get_public_operator_cert_summary`, `get_public_operator_social_counts`, `get_public_talent_profile_bundle`, `list_public_operator_profiles` (3 overloads), `list_public_operator_recommendations`.

---

## 1. Public Profile Access Review

### ✅ What's correct
- `get_public_operator_profile` only returns rows where `profile_visibility='public' AND is_discoverable=true AND public_published_at IS NOT NULL`. Resume URL is gated by `resume_public`.
- `contact_email`, `contact_phone`, `desired_salary_*` are **never** returned by any public RPC. Confirmed against function definition.
- `operator_profiles_public_view` always projects salary + contact as NULL.
- `op_profile_owner_select` policy means base table is unreadable by anon, even if a route forgets to use the RPC.

### 🟠 MEDIUM — `PublicBusinessCard` reads base table directly
`src/pages/PublicBusinessCard.tsx:68-82` calls `supabase.from("operator_profiles").select(...).eq("card_slug", slug).eq("profile_visibility","public")`. The query never reaches anon results because `op_profile_owner_select` restricts SELECT to `auth.uid()=user_id`. Result: signed-out users see "not found" for every business card.

**Severity:** Medium (functional outage for the card feature on logged-out devices).
**Fix:** Add a `get_public_operator_business_card(_slug text)` SECURITY DEFINER RPC mirroring the pattern used elsewhere, OR add a public SELECT policy on `operator_profiles` filtered by `profile_visibility='public' AND card_slug = …` returning only the safe column subset (preferred: dedicated RPC).

### 🟡 LOW — `operator_profiles_public` view exposes `contact_email`/`contact_phone` to verified employers
View masks contact for everyone except `auth.uid()=user_id` OR `is_verified_employer(auth.uid())`. This contradicts the project memory rule **"Personal email/phone/address never public; outreach must route through in-app messaging."**

**Severity:** Low → Medium depending on policy intent.
**Recommendation:** Remove the `is_verified_employer` branch and force contact through `talent_contact_requests`. If recruiters need contact reveal, gate it behind `candidate_response='accepted'` on the contact request (i.e. the candidate opted in).

### ✅ Resume gating
`resume_pdf_url` exposed only when `resume_public=true`. `operator_resume_versions` has a public SELECT only when both `resume_public` AND `profile_visibility='public'`.

---

## 2. Private / Operator-Only Data Review

### ✅ Owner isolation
Every operator child table (`operator_skills`, `operator_education`, `operator_certifications`, `operator_machine_proficiencies`, `operator_work_history`, `operator_references`) carries `owner_all (auth.uid()=user_id)` ALL policy. Anonymous users cannot read.

### 🟠 MEDIUM — Public-facing children are gated on `profile_visibility='public'` ONLY (not `is_discoverable`)
`op_certs_public_select`, `op_skills_public_select`, `op_edu_public_select`, `op_work_public_select`, `op_machines_public_select` all check `profile_visibility='public'` but **omit `is_discoverable=true` and `public_published_at IS NOT NULL`**.

Effect: an operator who flips visibility to public but un-checks "discoverable" or hasn't published will still leak their child rows publicly. The profile RPC hides the parent, but the row-by-row tables stay readable.

**Severity:** Medium.
**Fix migration:** Add `AND is_discoverable=true AND public_published_at IS NOT NULL` to each `op_*_public_select` policy.

### 🟠 MEDIUM — `operator_references` has overlapping/conflicting policies
Three ALL policies coexist: `op_ref_authenticated_owner_only`, `op_ref_block_anon`, `op_ref_owner_all`. The `block_anon` (`USING false`) is redundant given owner_only — but having three overlapping policies makes audits noisy and increases the chance of a future regression. Plus there is **no policy granting read access to verified employers**, yet the `operator_references_safe` view tries to expose rows to them — view will always return zero rows for non-owners because base RLS denies the read (security_invoker).

**Severity:** Medium (broken view → recruiters cannot see references they think they can).
**Fix:** Consolidate to one owner ALL policy + one verified-employer SELECT policy aligned to `operator_references_safe`'s WHERE clause.

### 🔴 HIGH — `operator_recommendations` has no public/employer SELECT policy
Only `auth.uid()=author_id OR auth.uid()=recipient_id` can read. But `list_public_operator_recommendations` RPC exists and is documented as a public surface. The RPC is SECURITY DEFINER so it works, **but** any frontend calling `from("operator_recommendations")` (e.g. recruiter UI listing endorsements for a saved candidate) will silently get zero rows.

**Severity:** High if recruiter UI ever reads the table directly; verify call sites.
**Fix:** Add an `op_rec_employer_select` policy mirroring the public-children pattern, gated on the recipient's `profile_visibility` and `is_discoverable`. Also add an `op_rec_public_select` for visibility consistency, though the SECURITY DEFINER RPC currently covers anon reads.

---

## 3. Recruiter / Company Access Review

### ✅ What's correct
- `is_verified_employer(uuid)` requires active/trialing org subscription AND owner/admin/supervisor role. Free-tier recruiters cannot bulk-read operator child tables.
- `talent_contact_requests` INSERT requires sender = auth user AND admin/supervisor role AND `organization_id` ownership.
- `talent_message_replies` requires the candidate to have `candidate_response='accepted'` before either side may post (RLS WITH CHECK enforces this server-side — strong).
- `talent_saved_candidates` / `talent_saved_lists` are `is_org_admin OR is_supervisor_in_org` only.

### 🟡 LOW — Operator role is excluded from talent contact reads
Org `member` (operator) cannot see contact requests addressed to org. That's correct for inbound recruiter outreach but means a non-admin recruiter assistant cannot triage. Acceptable per current product model; flag only.

### 🟡 LOW — `is_verified_employer` returns true for any active subscription
A "Single" tier customer who is technically subscribing is granted full operator-data read on every discoverable operator. Memory rule says public talent landing is paid-tier gated, and `talent_contact_requests` enforces admin role, but the read-side still grants Single-tier admins access to skills/education/work-history/certs of every discoverable operator on the platform.

**Severity:** Low → Medium depending on intent.
**Recommendation:** Either restrict `is_verified_employer` to `Team`/`Enterprise` tiers, or accept the current model and document it.

### ✅ Cross-org leakage check
- `talent_saved_candidates` and `talent_saved_lists` both gate by `organization_id` and `is_org_admin/supervisor_in_org` — no cross-org leak.
- `talent_contact_requests` SELECT joins on `organization_id` — recruiter at Org A cannot see Org B's outreach to the same candidate.
- `org_messages` is intra-org with connection check — well isolated.

---

## 4. Admin / Developer Support Access Review

### ✅ What's correct (post Pass A)
- `operator_profiles` already had a platform-admin SELECT policy. Pass A also added `Platform admins can view all operator_profiles`.
- `operator_station_sessions` has explicit platform-admin SELECT policy. Good.

### 🔴 HIGH — Admin cannot read most operator child tables across orgs
None of the following have a `has_role(_, 'admin')` SELECT override:
- `operator_certifications`, `operator_skills`, `operator_education`, `operator_work_history`, `operator_machine_proficiencies`
- `operator_references`, `operator_recommendations`, `operator_resume_versions`
- `operator_connections`, `operator_follows`
- `talent_contact_requests`, `talent_message_replies`
- `talent_saved_candidates`, `talent_saved_lists`
- `oap_operator_credentials`
- `org_messages`

A platform admin troubleshooting "my profile says no certs but I have 3" will get zero rows. Today they must impersonate (Open as Customer) — works but slow.

**Severity:** High for support velocity.
**Fix:** Add `has_role(auth.uid(), 'admin')` SELECT policies to each table above (additive, mirrors Pass A pattern).

### 🟠 MEDIUM — No admin-redacted view for `talent_contact_requests`/replies bodies
Message bodies may contain PII or candidate-disclosed sensitive info. Even admins should read these only with logging (see §10). Recommend an `_safe` view that returns metadata only (sender/recipient/org/timestamp/state), and gate body access behind explicit "Open as Customer" impersonation.

**Severity:** Medium.

---

## 5. RLS Policy Audit Summary

| Table | RLS On | Owner | Public | Employer | Admin |
|---|---|---|---|---|---|
| operator_profiles | ✅ | ✅ | RPC only | view | ✅ |
| operator_certifications | ✅ | ✅ | ✅* | ✅ | ❌ **HIGH** |
| operator_skills | ✅ | ✅ | ✅* | ✅ | ❌ **HIGH** |
| operator_education | ✅ | ✅ | ✅* | ✅ | ❌ **HIGH** |
| operator_work_history | ✅ | ✅ | ✅* | ✅ | ❌ **HIGH** |
| operator_machine_proficiencies | ✅ | ✅ | ✅* | ✅ | ❌ **HIGH** |
| operator_references | ✅ | ✅ (3 overlapping) | ❌ | view broken | ❌ |
| operator_recommendations | ✅ | author/recipient | ❌ (RPC only) | ❌ | ❌ |
| operator_resume_versions | ✅ | ✅ | gated | ❌ | ❌ |
| operator_connections | ✅ | parties | n/a | n/a | ❌ |
| operator_follows | ✅ | parties | n/a | n/a | ❌ |
| operator_station_sessions | ✅ | ✅ | n/a | org admin | ✅ |
| oap_operator_credentials | ✅ | ✅ | n/a | issuing org | ❌ |
| talent_contact_requests | ✅ | candidate | n/a | sender org | ❌ |
| talent_message_replies | ✅ | candidate | n/a | sender org | ❌ |
| talent_saved_candidates | ✅ | n/a | n/a | org admin/sup | ❌ |
| talent_saved_lists | ✅ | n/a | n/a | org admin/sup | ❌ |
| org_messages | ✅ | parties | n/a | n/a | ❌ |

\* Public predicate omits `is_discoverable` and `public_published_at` — see §2.

---

## 6. Storage Bucket Permission Audit

Bucket: `operator-profiles` (private)

### ✅ Policies present
- Owner read/write/delete via `(auth.uid())::text = (storage.foldername(name))[1]`
- Public SELECT when owner's `profile_visibility='public'`

### 🟠 MEDIUM — Duplicate policies
Two parallel sets exist:
- `op_files_owner_read/insert/update/delete` (newer)
- `operator_profiles_owner_select/insert/update/delete` (older)

Both effectively identical. No security risk, but creates audit noise and risk of divergence on future edits.

### 🔴 HIGH — Public profile read exposes ALL files in operator's folder
The `op_files_public_profile_read` policy is path-prefix-based: any object under `<user_id>/...` is publicly readable when the operator is public. This means **resume PDFs are public even when `resume_public=false`** if they live under that folder. Same for any future "private" attachment uploaded to the same prefix.

**Severity:** High (resume PDF can leak).
**Fix:** Either:
1. Move public assets to `<user_id>/public/...` and gate the policy to that subfolder, OR
2. Tighten the policy to specific filenames (`avatar.*`, `banner.*`, `gallery/*`) and exclude `resume.*` unless `resume_public=true`.

### ❌ Missing — Admin SELECT on operator-profiles bucket
SDK admins cannot fetch a customer's avatar/resume for support. Add an admin SELECT policy.

**Severity:** Medium.

---

## 7. Edge Function Authorization Audit

`grep` of `supabase/functions/**/index.ts` for talent-related identifiers found only `issue-certificate`. There is **no `talent-*` edge function**, no `send-talent-message` function, etc.

### Implications
- All talent CRUD goes through PostgREST + RLS. Good for auditability, but means message-send rate-limiting and abuse-detection live in DB triggers (verify).
- No server-side scrubbing of message bodies for PII.

### 🟡 LOW — `issue-certificate` does not appear to validate operator visibility/discoverability before associating cert. Verify operator_id is owned by the requester's org.

---

## 8. Search Indexing / Privacy Audit

### ✅ What's correct
- Auth-only pages have `<meta name="robots" content="noindex">`: `TalentDashboard`, `TalentSearch` (all loading/empty/loaded states).
- Public sitemap (`sitemap-talent.xml`) registered.
- `robots.txt` allows `/talent` and `/talent/`.

### 🟠 MEDIUM — `robots.txt` does not explicitly disallow auth-only sub-routes
`Allow: /talent` is broad. Should add explicit `Disallow: /talent/search`, `/talent/dashboard`, `/talent/inbox`, `/employer/*`. Currently relies on per-page meta tags only — fine for compliant crawlers but defense-in-depth is missing.

**Severity:** Medium.

### 🟡 LOW — `PublicBusinessCard` `/p/:slug` not in sitemap
If business cards are intended to be discoverable, add to sitemap. If not, ensure noindex meta is set (verify).

---

## 9. UI / UX Permission-State Audit

### 🟠 MEDIUM — Empty-vs-forbidden states are indistinguishable
- `PublicBusinessCard` shows "not found" when actually RLS-blocked (see §1 finding).
- `TalentBrowse` / `TalentSearch` show empty grid when employer is not verified — no "you need a Team plan" hint surfaced.
- Recruiter clicks on a saved candidate's references → empty list (because of broken view §2) with no diagnostic.

**Fix:** Use `AdminEmptyState`-style component (created in admin-panel-audit) with a `permissionHint` mode for talent surfaces.

### 🟡 LOW — Operator dashboard does not warn when `is_discoverable=false` despite `profile_visibility='public'`
Operator may publish, then later untick "discoverable" while expecting to remain searchable. UI should reconcile these flags or merge them.

---

## 10. Impersonation / Audit Logging Review

### ✅ What's correct
- `act_as_sessions` table records actor, target, org, start/end timestamps (see existing `ActAsContext`).
- "Open as Customer" (Pass C) can be used to view talent context as the operator.
- Rate-limited 10/hour per actor.

### 🔴 HIGH — Talent message read does not generate a `data_access_log` entry
Reading another user's `talent_contact_requests` body via "Open as Customer" or via direct admin RLS (when added) is not logged. For ITAR/FedRAMP, **PII access must be auditable**.

**Severity:** High for FedRAMP audit posture.
**Fix:** Trigger on `talent_contact_requests`/`talent_message_replies` SELECT is impractical (Postgres has no SELECT triggers). Implement at the RPC layer: route admin reads through a `get_talent_message_body(_id)` SECURITY DEFINER function that inserts into `data_access_logs` before returning.

### 🟡 LOW — Act-as session does not distinguish "impersonating an operator for talent debug" from generic admin support
Add a `purpose` enum/free-text field to `act_as_sessions`.

---

## Severity-Ranked Issue List

| # | Severity | Area | Issue | Pass |
|---|---|---|---|---|
| 1 | 🔴 HIGH | RLS | 14 talent tables missing platform-admin SELECT policy | A |
| 2 | 🔴 HIGH | Storage | `operator-profiles` public-read policy covers entire folder, leaking resume PDFs even when `resume_public=false` | A |
| 3 | 🔴 HIGH | Audit | Admin reads of talent message bodies not logged to `data_access_logs` | C |
| 4 | 🟠 MEDIUM | RLS | Public child-table policies omit `is_discoverable=true AND public_published_at IS NOT NULL` | A |
| 5 | 🟠 MEDIUM | RLS | `operator_references` has 3 overlapping policies + missing employer SELECT (breaks `_safe` view) | A |
| 6 | 🟠 MEDIUM | RLS | `operator_profiles_public` view leaks contact_email/phone to any verified employer | B |
| 7 | 🟠 MEDIUM | UI/RLS | `PublicBusinessCard` reads base table directly → broken for anon users | B |
| 8 | 🟠 MEDIUM | Storage | Duplicate operator-profiles policies (audit hygiene) | C |
| 9 | 🟠 MEDIUM | Storage | No admin SELECT on operator-profiles bucket | A |
| 10 | 🟠 MEDIUM | Admin | No `_safe` view for talent_contact_requests body redaction | B |
| 11 | 🟠 MEDIUM | UI/UX | Empty vs forbidden states indistinguishable on talent surfaces | C |
| 12 | 🟠 MEDIUM | SEO | robots.txt lacks explicit Disallow for `/talent/search`, `/talent/dashboard`, `/talent/inbox`, `/employer/*` | C |
| 13 | 🟡 LOW | RLS | `is_verified_employer` includes Single tier — overly broad for cross-org operator data read | C |
| 14 | 🟡 LOW | RLS | Operators (org members) excluded from inbound talent_contact_requests | — accept |
| 15 | 🟡 LOW | UI | Operator dashboard doesn't reconcile `profile_visibility=public` + `is_discoverable=false` | C |
| 16 | 🟡 LOW | Audit | act_as_sessions lacks purpose field | C |
| 17 | 🟡 LOW | Edge Fn | `issue-certificate` operator_id ownership not verified (verify) | C |

---

## Deliverables

### Blocked Workflows
- **Anonymous business-card view** (`/p/:slug`) — appears as "not found" for all logged-out visitors.
- **Recruiter viewing references** — `operator_references_safe` returns zero rows for verified employers due to missing base-table policy.
- **Recruiter viewing recommendations directly** — only RPC works; any direct table read returns zero.
- **Admin support replays** — admin sees empty profile/cert/skill/work-history without impersonation.

### Overexposed Data
- **Resume PDFs in operator-profiles bucket** when operator is public, even if `resume_public=false`.
- **contact_email/contact_phone via `operator_profiles_public` view** to any active-subscription org admin.
- **Child-table rows** (skills/certs/edu/etc.) when an operator sets `profile_visibility='public'` but later toggles off `is_discoverable` or `public_published_at`.

### Missing RLS Policies
- Platform-admin SELECT override on 14 talent tables (see §4).
- Verified-employer SELECT on `operator_references` to align with `_safe` view.
- Verified-employer/public SELECT on `operator_recommendations`.
- Tightened public-child SELECT predicates (add `is_discoverable` + `public_published_at` checks).

### Missing Admin Support Visibility
- Cross-org SELECT on talent child tables (Pass A).
- Admin SELECT on `operator-profiles` storage bucket.
- Audited admin RPC for talent message bodies (`get_talent_message_body` with `data_access_logs` insert).

### Recommended Safe-View Patterns
- `operator_references_safe` — already exists; needs base RLS to actually return rows.
- `talent_contact_requests_safe` — new view with metadata only (no body), admin-readable, paired with audited body RPC.
- `operator_profiles_public` — drop the `is_verified_employer` branch from contact/salary masking; keep contact in `talent_contact_requests` flow only.

### Required Schema Migrations (one suggested file)
1. Add platform-admin SELECT to the 14 talent tables.
2. Tighten `op_*_public_select` predicates with `is_discoverable AND public_published_at`.
3. Consolidate `operator_references` policies + add employer SELECT.
4. Add `op_rec_employer_select` and `op_rec_public_select` to `operator_recommendations`.
5. Restructure `operator-profiles` bucket public-read to scoped subfolder OR filename allowlist; add admin SELECT.
6. Drop verified-employer branch from `operator_profiles_public` view.
7. Create `get_public_operator_business_card(_slug)` RPC.
8. Create `talent_contact_requests_safe` view + `get_talent_message_body(_id)` audited RPC.

### Required Frontend Fixes
- `src/pages/PublicBusinessCard.tsx` — switch to new RPC.
- `src/pages/TalentBrowse.tsx`, `src/pages/TalentSearch.tsx` — surface tier-not-eligible vs empty-results distinction.
- `src/pages/OperatorProfile.tsx` (or equivalent dashboard) — reconcile public/discoverable flags or merge.
- Adopt shared `PermissionAwareEmpty` component (new) on talent surfaces.
- Add explicit `Disallow:` lines to `public/robots.txt` for auth-only talent routes.

---

## Sign-off Checklist

- [ ] Pass A migration: admin SELECT + tightened public predicates + reference policy cleanup
- [ ] Pass A migration: storage bucket scoped read + admin SELECT
- [ ] Pass B migration: safe view + audited message-body RPC + business-card RPC + drop contact branch from public view
- [ ] Pass C frontend: switch business card to RPC, permission-aware empty states, robots.txt hardening
- [ ] Re-run `supabase--linter` and rerun this checklist after each pass

---

**Status of this document:** Findings only. No code or schema changes have been applied. Awaiting approval to proceed with Pass A.
