# Concierge Onboarding — Audit & Completion Plan

## Audit results (what already exists)

**Admin workspace (`/admin/onboarding`)** — mature
- `EngagementsList` + `EngagementDetail` with payment, contract, refund, accounting export, audit timeline
- `ChecklistModule` × 10 fixed modules (org_profile, equipment, stations, users_roles, routing, quality, erp, training, documents, review)
- `ReadinessPanel` powered by `verify_org_production_ready` RPC (counts depts, stations, equipment, admins, operators, routing, branding, subscription, ERP, ITAR persistence)
- Gating RPCs `mark_engagement_ready` and `activate_org_for_production` enforce payment + contract + checklist + readiness before flipping `organizations.onboarding_status = 'live'`
- `seed_org_production_defaults` runs on activation

**Customer surface** — thin
- `OnboardingService.tsx` (marketing/checkout) + `ConciergeInProgressSplash` (lockout)
- **Gap:** no structured customer intake form, no per-module visibility into what JobLine is configuring, no progress percentage, no "your blockers" surface, no release certificate
- Welcome modal + `OrganizationSetup` exist for self-serve but aren't wired to an active concierge engagement

**E2E** — partial
- `concierge-onboarding.spec.ts` (39 lines): only marketing page + banner + auth-gate smoke
- `concierge-gap-closure.spec.ts` (45 lines): sales, MSA print, invoice, billing-tab auth gates
- **Gap:** no E2E of the actual intake flow, no readiness-RPC assertion, no station/equipment smoke, no release/activation flow

**Operational gaps**
1. No customer-facing intake wizard — JobLine ops must gather equipment list, users, ITAR posture, ERP choice through email/calls
2. `ChecklistModule` is admin-only; customer can't see status or unblock items themselves
3. No automated "is the shop actually working?" smoke after activation — readiness RPC counts rows but doesn't exercise a real handoff/WO path
4. No release email + certificate when org goes live
5. `verify_org_production_ready` doesn't check: at least one operator has logged in once, at least one station has equipment mapped, at least one queue item exists

## Plan — 5 phases, each independently shippable

### Phase 1 — Customer Intake Wizard (`/onboarding/intake`)

Multi-step wizard mirroring the 10 checklist modules but **customer-facing**, persisting answers into a new `onboarding_intake_responses` table (one row per engagement).

Steps (matches existing `module_key`s 1:1):
1. **Company profile** — confirm name, address, AS9100/ISO/ITAR posture, subscription tier confirmation
2. **Equipment** — CSV upload (template auto-downloaded) or manual rows; rows go to `equipment` via `onboarding-bulk-import`
3. **Stations & departments** — same pattern
4. **Users & roles** — email + role + default station; triggers invite generation when customer clicks "Send invites"
5. **Routing templates** — pick from library or upload CSV
6. **Quality** — pick checkpoint templates
7. **ERP** — Native / JobBOSS / SAP, with persistence-mode locked to read-through for ITAR
8. **Training programs** — pick OAP role programs per operator
9. **Documents** — upload policies, manuals, setup sheets (storage bucket already exists)
10. **Review & submit** — final confirmation, marks `org_profile` checklist item done and sets engagement `status='in_progress'`

UX rules:
- Step navigation with save-on-change (no "Next" required to persist)
- Side rail shows engagement % complete, blockers (`customer_blocker_note` from admin checklist), and "JobLine is reviewing" banner per step
- Each step has a "Need help" button → opens email/Slack thread, captured in `admin_audit_events`
- Mobile-first single-column layout, sticky progress header
- Replaces `ConciergeInProgressSplash` for `org_admin/owner` (they now see the wizard); operators still see splash

New RPC: `submit_intake_step(p_engagement_id, p_module_key, p_payload jsonb)` — validates module key, writes to `onboarding_intake_responses`, advances the matching checklist item from `todo` → `in_progress`, records an audit event.

### Phase 2 — Admin workspace polish

Small but visible improvements to the existing `/admin/onboarding`:
- **Customer responses tab** in `EngagementDetail` — read-only view of what the customer submitted per module, with diff if they edit
- **Bulk-assign** dropdown to assign multiple engagements to a concierge operator
- **Filter bar** on `EngagementsList` (status, ITAR, payment_status, assigned_admin)
- **Stuck engagements widget** at top — engagements with no activity > 7 days
- **Quick-actions menu** on each row: "Open intake as customer" (impersonation via existing `act_as_sessions`), "Send reminder email", "Mark blocked"

### Phase 3 — Production readiness deepening

Extend `verify_org_production_ready` to actually exercise the system, not just count rows:

```text
new checks:
  - ≥ 1 station has equipment assigned (station_machine_assignments)
  - ≥ 1 operator has logged in at least once (auth.users.last_sign_in_at)
  - ≥ 1 queue_items row exists with a routing template applied
  - branding has logo URL set (not just a row)
  - if subscription tier is Team/Enterprise: ≥ 2 active stations
```

Add an admin-only "Smoke test" button on `ReadinessPanel` → calls new edge function `concierge-smoke-test` which:
1. Creates a draft `queue_items` row with `source='concierge_smoke'`
2. Walks it through pending → queued → in_progress → completed via the state-machine
3. Writes a synthetic `handoff_records` entry
4. Deletes the smoke artifacts and returns pass/fail per step
5. Result rendered as a checklist with green/red per step

### Phase 4 — Release-to-customer flow

When admin clicks **Activate customer login**:
1. Existing `activate_org_for_production` RPC runs (unchanged)
2. New trigger enqueues `release-to-customer` edge function
3. Edge function:
   - Sends "Your shop is live" email to org admins via existing email queue (template: `concierge-go-live`)
   - Generates a **Release Certificate PDF** (org name, go-live date, readiness snapshot, signed by JobLine ops) — stored in `concierge` storage bucket, linked on engagement detail
   - Posts to org's webhook URL if configured
4. Customer sees a one-time **"You're live!"** modal on next login with link to the certificate and the activation checklist

### Phase 5 — End-to-end testing

Replace the 39-line marketing smoke with real workflow coverage. New/updated specs under `e2e/`:

- `concierge-intake-wizard.spec.ts` — full 10-step wizard as a seeded org_admin, with API fixture seeding (Supabase service-role calls in `e2e/helpers/concierge.ts`)
- `concierge-admin-flow.spec.ts` — seeded platform admin: create engagement, record payment, mark each checklist item done, mark ready, activate, assert org `onboarding_status='live'`
- `concierge-readiness-smoke.spec.ts` — calls `concierge-smoke-test` edge function for a seeded org, asserts every step is green
- `concierge-release.spec.ts` — asserts release certificate is generated, accessible to org admin, NOT accessible to other orgs
- `concierge-itar.spec.ts` — ITAR org cannot toggle ERP write-through, intake step 7 hides the option

Each spec uses a `beforeAll` that seeds a throwaway org via `supabase.rpc('e2e_seed_concierge_org')` (new SECURITY DEFINER, gated to test env only) and `afterAll` that tears it down. Specs run against the Lovable preview URL via the existing `playwright.config.ts`.

Add to `playwright.config.ts`: `reporter: ['html', 'github']` and a `concierge` project group so CI can run only this suite.

## Technical notes

**New DB migration**
```text
CREATE TABLE public.onboarding_intake_responses (
  id, engagement_id (FK), organization_id, module_key,
  payload jsonb, submitted_by, submitted_at, version int
);
GRANT … TO authenticated, service_role;
RLS: org_admin/owner of engagement.organization_id OR platform admin
```

**New RPCs (all SECURITY DEFINER, `SET search_path = public`)**
- `submit_intake_step(p_engagement_id, p_module_key, p_payload)`
- `e2e_seed_concierge_org(p_seed_name)` — guarded by `current_setting('app.env') = 'test'`
- Extend `verify_org_production_ready` (5 new checks above)

**New edge functions**
- `concierge-smoke-test` — synthetic WO run, JWT-verified, requires platform admin
- `release-to-customer` — triggered from activation; sends email + generates certificate PDF (jsPDF, already in deps)

**New customer page**
- `src/pages/OnboardingIntake.tsx` + 10 step components under `src/components/onboarding/intake/`
- Route `/onboarding/intake` gated to org admin/owner with active engagement
- `ConciergeInProgressSplash` updated to redirect admins to the intake wizard instead of showing the splash

**Files touched**
- New: ~14 customer-side files, 2 edge functions, 1 migration, 5 E2E specs
- Edited: `EngagementDetail.tsx` (Customer responses tab), `EngagementsList.tsx` (filters + bulk actions), `ReadinessPanel.tsx` (smoke test button), `ConciergeInProgressSplash.tsx` (redirect logic), `playwright.config.ts`

**Out of scope (call out + defer)**
- Live machine-monitoring connectivity smoke (relay infra is optional per memory; would gate orgs that never connect machines)
- Stripe webhook replay UI
- Multi-language support for customer wizard

## Suggested rollout order

1. Phase 1 (intake wizard) — biggest customer impact, ship first
2. Phase 3 (readiness deepening + smoke test) — gives ops confidence in "ready" button
3. Phase 4 (release flow + certificate) — makes activation feel like a milestone
4. Phase 2 (admin polish) — quality-of-life for ops
5. Phase 5 (E2E) — locks everything in before next release

Each phase is independently shippable and reversible.
