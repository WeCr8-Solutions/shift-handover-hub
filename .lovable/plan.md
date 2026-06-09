# Concierge Power-Up: Docs Categories, OAP Bypass, Intake CRUD Tiles

## 1. Concierge Documents — Categorized + Uploadable

**Customer-facing page** (`src/pages/settings/ConciergeDocuments.tsx`) + **admin engagement Documents tab** both get a new collapsible category layout:

- **Contracts & Compliance** — MSA, NDA, ITAR Declaration, Payment Instructions (existing, regrouped)
- **Intake Worksheets** — the 7 existing worksheets (Equipment, Stations, Users, Routing, Quality, ERP, Training)
- **Machine Manuals** *(new, uploadable)* — org-scoped PDFs (operator manuals, programming guides, maintenance), versioned, CRUD
- **SOPs & Reference** *(new, uploadable)* — free-form titled/categorized docs (safety SOPs, quality procedures, training packets, custom forms), CRUD

Each category is a `<Collapsible>` with chevron, count badge, and an "Upload" CTA on uploadable categories. Existing `DocumentLibrary` becomes a wrapper around new `<DocumentCategorySection>` components.

**New table**: `concierge_uploaded_documents` (org-scoped) — separate from `concierge_document_records` (which is engagement-version-snapshots of system-generated docs). Stores: `organization_id`, `engagement_id?`, `category` (`manual` | `sop` | `reference`), `title`, `description`, `tags[]`, `storage_path`, `file_size`, `mime_type`, `version`, `superseded_by`, `uploaded_by`, audit timestamps. RLS: org members read; admins/concierge write/delete.

**New storage bucket**: reuse existing `concierge-docs` bucket (private) with path `${orgId}/uploads/${category}/${id}-v${version}.${ext}`. RLS scoped to org membership.

**New hook**: `useConciergeUploads(orgId, category?)` — list/upload/delete/replace/signed-download, optimistic updates.

## 2. OAP Mentor Bypass — Configurable (3 modes, all on)

**Existing**: `certifying_mentors` table designates per-org mentors.

**Per-org settings** (new columns on `organizations` or new `oap_mentor_policy` table — going with the latter for cleanliness):

- `org_role_auto_mentors` (`boolean`, default `true`) — owners & supervisors can sign off OAP without explicit mentor designation
- `delay_day_fallback_enabled` (`boolean`, default `true`)
- `delay_days` (`int`, default **30** for Aymar)
- `allow_self_certify_on_delay` (`boolean`, default `false`) — when delay elapses, supervisor/owner can mark complete (never the operator themself)

**Logic changes**:
- `useCertifyingMentors` / `useOapMentors` — extend `isCertifyingMentor(userId, program)` helper to also return `true` when:
  - User has `admin` or `supervisor` org role AND `org_role_auto_mentors = true`, OR
  - The OAP enrollment is past `assigned_at + delay_days` AND requester is admin/supervisor AND `allow_self_certify_on_delay = true`
- Surfaced in OAP enrollment UI as a yellow "Delay-day override available" banner with audit-stamped action
- New Postgres function: `public.can_certify_oap(_user_id uuid, _enrollment_id uuid)` returns `boolean`, SECURITY DEFINER, `search_path = public`
- Audit: every override writes to `oap_recert_events` with `event_type = 'override_signoff'` and reason

**Admin UI**: new card in `OnboardingServicesPanel` → "OAP Mentor Policy" with the three toggles + delay-day slider (0–60). Defaults seeded for Aymar.

## 3. Intake CRUD Tiles per Module

**Replace/augment** the existing engagement intake panels with a unified `<IntakeTileGrid module={...} engagementId={...} orgId={...} />` component.

For each of the 7 modules (Equipment, Stations, Users, Routing, Quality, ERP, Training):

- Responsive card grid (1/2/3 cols) — one tile per record
- Tile shows primary identifier (asset_tag, station_name, email, template_name, checkpoint_name, system name, training program), 2-3 secondary fields, and an actions menu
- Inline edit dialog (uses `INTAKE_COLUMNS` schema as source of truth → auto-generated form fields per module)
- Add tile (+) at end of grid
- Delete with `SafeDeleteDialog`
- Sort/filter chips at top (per module relevant fields)
- Reads/writes the **live** production tables (not just `onboarding_intake_responses`):
  - Equipment → `public.equipment`
  - Stations → `public.stations` (+ `departments`)
  - Users → `public.organization_invites` (pre-activation) + `public.profiles` (post)
  - Routing → `public.routing_templates` + `public.routing_template_steps`
  - Quality → `public.quality_checkpoints`
  - ERP → `public.organization_integrations` / `erp_connections`
  - Training → `public.oap_enrollments` (or `oap_role_program_courses`)

**New hook**: `useIntakeModule(module, orgId)` — uniform CRUD across all 7, dispatches to the right table.

Existing bulk-upload (`onboarding-bulk-import` edge function) remains — CSV import populates these tables; tile grid is the post-import edit surface.

## 4. Technical Details (collapse-friendly)

```text
DB Migrations (one combined migration):
 ├ create table concierge_uploaded_documents (+ GRANT + RLS + trigger updated_at)
 ├ create table oap_mentor_policy (per-org, one row; + GRANT + RLS)
 ├ insert default policy row for Aymar (org_id 41f0e268…) with delay_days=30
 ├ create or replace function public.can_certify_oap(...) SECURITY DEFINER
 └ create or replace function public.list_org_uploaded_docs(orgId) SECURITY DEFINER

Storage:
 └ reuse `concierge-docs` bucket; add storage.objects policy for uploads/ prefix
   (org-member read, admin write/delete)

New files:
 ├ src/components/admin/concierge/DocumentCategorySection.tsx
 ├ src/components/admin/concierge/UploadDocumentDialog.tsx
 ├ src/components/admin/concierge/UploadedDocumentTile.tsx
 ├ src/components/admin/onboarding/OapMentorPolicyCard.tsx
 ├ src/components/admin/onboarding/IntakeTileGrid.tsx
 ├ src/components/admin/onboarding/IntakeRecordTile.tsx
 ├ src/components/admin/onboarding/IntakeRecordDialog.tsx
 ├ src/hooks/useConciergeUploads.ts
 ├ src/hooks/useOapMentorPolicy.ts
 └ src/hooks/useIntakeModule.ts

Modified:
 ├ src/components/admin/concierge/DocumentLibrary.tsx (wrap in categories)
 ├ src/pages/settings/ConciergeDocuments.tsx
 ├ src/pages/admin/ConciergeLibrary.tsx
 ├ src/hooks/useCertifyingMentors.ts (extend can-certify logic)
 ├ src/components/admin/onboarding/OnboardingServicesPanel.tsx (add policy card)
 └ src/components/admin/onboarding/EngagementDetail.tsx (swap intake panels for tile grid)

Edge functions: none new. (can_certify_oap is a DB function called from client.)

Docs:
 ├ docs/concierge/e2e-checklist.md — add "uploaded docs" + "OAP override" steps
 └ docs/concierge/handoff-e2e.md — mentor policy section
```

## 5. Aymar-Specific Seeding

- Insert `oap_mentor_policy` row for Aymar with `delay_days=30`, all toggles on
- No uploaded docs seeded (Brandon/Jaimes upload their own)
- Existing concierge library unchanged — no disruption to Brandon's claim flow

## 6. Out of Scope (this round)

- Per-document approval/signature workflow (use existing concierge_pack_finalizations)
- E-signature on uploaded SOPs
- OCR/parsing of uploaded manuals (manuals just store + serve)
- New Playwright E2E coverage (manual verification + SQL checks; can add later)

## 7. Verification

1. Migration apply (check linter)
2. Build passes; types regenerate
3. Manual: load `/settings/concierge-documents` → confirm 4 categories with chevrons
4. Manual: as platform admin, open Aymar engagement → Documents tab → upload a manual + SOP → CRUD
5. Manual: load OAP enrollment → confirm role-based and 30-day override paths
6. SQL: confirm Aymar policy row exists
7. SQL: confirm `can_certify_oap` returns true for Brandon (admin) on any Aymar OAP enrollment