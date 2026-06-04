
# Onboarding Services (Platform-Admin Concierge Setup)

A new platform-admin area where JobLine staff run a paid onboarding engagement for a customer org — collecting equipment, users, roles, stations, routing templates, ERP/ITAR posture, etc. — then flipping the org to "Production Ready" so the customer can log in and start using it.

## Scope

- **Who uses it:** Platform Admins + Developers only (gated by `useAdminAccess.isAdmin || isDeveloper`).
- **Who it's for:** New customer orgs that purchased the onboarding SKU.
- **Outcome:** Org marked `onboarding_status = 'ready_for_production'`, customer receives invite, all baseline data preloaded.

Customer-facing self-serve onboarding (`/setup`, `OnboardingProvider`) is untouched — this is the *concierge* track that runs in parallel.

## New Admin Surface

Mounted under `/admin/onboarding-services` (new tab in `src/pages/Admin.tsx`, component in `src/components/admin/onboarding/`).

### 1. Engagements list
- Table of `onboarding_engagements` rows: org, plan tier, assigned JobLine specialist, status (`intake → in_progress → review → ready_for_production → live`), % complete, last activity.
- Filters: status, assignee, ITAR flag.
- "New engagement" → pick existing org or create org shell + owner placeholder.

### 2. Engagement detail (tabbed checklist)
Each tab is a discrete setup module with its own upload utility + completion gate:

| Tab | What admin does | Writes to |
|---|---|---|
| **Org Profile** | Logo, address, ITAR flag, `requires_us_person_declaration`, subscription tier, seats | `organizations`, `organization_branding` |
| **Equipment** | Bulk CSV/XLSX upload of machines (make, model, controller, axes, work envelope) + assign to stations | `equipment`, `verified_machine_library` link |
| **Stations & Departments** | Upload or build dept → station tree | `departments`, `stations`, `station_machine_assignments` |
| **Users & Roles** | CSV upload (email, role, dept, station). Generates invites in bulk, optional QR sheet PDF | `organization_invites`, `user_roles` (post-accept) |
| **Routing Templates** | Upload starter routing templates (ops, std times) | `routing_templates`, `routing_template_steps` |
| **Quality / Inspection** | Pick inspection tool catalog overrides, upload checkpoints | `org_inspection_tool_overrides`, `quality_checkpoints` |
| **ERP / Integrations** | Configure JobBOSS / SAP / Native + persistence mode (ITAR forces read_through) | `erp_connections`, `organization_integrations` |
| **Training & OAP** | Seed role programs, assign mandatory courses | `oap_role_programs`, `oap_enrollments` |
| **Documents** | Drop AS9100 / ISO / ITAR policies, equipment manuals, setup sheets | `machine_manuals`, `setup_sheets`, new `onboarding_documents` bucket |
| **Review & Handoff** | Checklist must be 100% green → "Mark Ready for Production" → triggers customer welcome email + activates org login |

Each tab shows: required vs done count, last-uploaded-by, "needs customer info" notes field.

### 3. Upload utilities
Reuse existing `BulkUploadDialog` + `useBulkUploadCollisions`. Each module gets:
- Template download (CSV)
- Drag-drop with row-by-row validation preview
- Collision/duplicate handling
- Audit row written to `admin_audit_events`

### 4. Selling it (the "service" part)
- New Stripe product: **"Concierge Onboarding"** (one-time, e.g. $1,500 — tiered later).
- Public marketing slot on `/pricing` (small card: "Want us to set it up for you?").
- New page `/onboarding-service` describing scope + Stripe Checkout (`mode: payment`, reuse `create-payment` pattern).
- On successful payment webhook → auto-create an `onboarding_engagements` row in `intake` status + notify ops via existing `notification_queue`.
- Admin can also create an engagement manually for off-platform deals.

## Data Model (new)

```text
onboarding_engagements
  id, organization_id (FK), purchased_via ('stripe'|'manual'),
  stripe_payment_intent_id, plan_tier, assigned_admin_id,
  status, percent_complete, started_at, ready_at, went_live_at,
  notes, organization_id NOT NULL

onboarding_checklist_items
  id, engagement_id, module_key, label, required bool,
  status ('todo'|'in_progress'|'blocked'|'done'),
  completed_by, completed_at, customer_blocker_note

onboarding_documents (storage bucket, private, org-scoped path)
  {org_id}/{engagement_id}/{module}/{file}
```

Plus columns on `organizations`:
- `onboarding_status` enum: `self_serve | concierge_intake | concierge_in_progress | ready_for_production | live`
- `onboarding_engagement_id` (nullable FK)

Login gate: while `onboarding_status IN ('concierge_intake','concierge_in_progress')`, non-admin org members hitting `/dashboard` see a "Setup in progress with JobLine" splash (new component) instead of the dashboard. Platform admins always pass.

## RLS / Security (ITAR-safe)

- All new tables: `organization_id` NOT NULL, RLS on, **platform-admin-only write**, org owners read-only on their own engagement.
- `onboarding_documents` bucket: private, path-scoped `{org_id}/...`, policy uses `is_org_admin(org_id) OR is_platform_admin()`.
- ITAR orgs: ERP tab disables `write_through` toggle (existing `enforce_itar_read_through` trigger already enforces server-side — UI mirrors it).
- Every write logs to `admin_audit_events` with `action_type='onboarding.*'`.
- `SECURITY DEFINER` helpers (`mark_engagement_ready`, `activate_org_for_production`) set `search_path = public`.

## Edge Functions

- `onboarding-checkout` — creates Stripe session for the service SKU.
- `onboarding-webhook` *(or extend existing checkout webhook)* — on payment success, creates engagement + seeds default checklist from a template.
- `onboarding-activate` — admin-invoked; verifies 100% checklist, flips org status, sends welcome email via existing `send-email`, triggers invite blast.
- `onboarding-bulk-import` — server-side validator for large CSVs (>500 rows) to avoid client memory issues.

## UI Components (new)

```
src/components/admin/onboarding/
  EngagementsList.tsx
  EngagementDetail.tsx
  modules/
    OrgProfileModule.tsx
    EquipmentModule.tsx
    StationsModule.tsx
    UsersRolesModule.tsx
    RoutingModule.tsx
    QualityModule.tsx
    ERPModule.tsx
    TrainingModule.tsx
    DocumentsModule.tsx
    ReviewHandoffModule.tsx
  shared/
    ModuleChecklistHeader.tsx
    BulkTemplateDownloadButton.tsx
    BlockerNoteField.tsx
src/pages/OnboardingService.tsx     (public marketing + buy)
src/components/onboarding/ConciergeInProgressSplash.tsx  (customer-side gate)
```

Hooks: `useOnboardingEngagements`, `useEngagementChecklist`, `useEngagementUploads`.

## Out of Scope (this plan)

- Reworking the existing self-serve `/setup` flow.
- Custom DocuSign/contract signing (use plain PDF upload for now).
- Multi-specialist collaboration features beyond a single `assigned_admin_id`.
- White-glove training scheduling (link out to Calendly for now).

## Verification

- Unit: checklist completion math, ITAR ERP gate, RLS helper functions.
- E2E (`e2e/onboarding-service.spec.ts`): admin creates engagement → uploads equipment CSV → marks ready → customer login splash disappears → dashboard loads.
- Manual: Stripe test-mode purchase → engagement auto-created.

---

Ready to build this out? I'd suggest sequencing as: (1) schema + RLS, (2) admin shell + engagements list, (3) modules one-by-one starting with Org Profile / Users / Equipment, (4) Stripe SKU + public page, (5) activation flow + customer splash, (6) E2E.
