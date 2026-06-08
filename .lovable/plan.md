
# Concierge Phase 2 — Basic shop scaffold + employee onboarding

Goal: give every new concierge org (starting with Aymar Engineering) a minimal, sensible shop structure they can use on day one — without forcing CNC-only assumptions — plus a clean way to add employees via QR + email invite.

## 1. Canonical "Basic Shop" department template

Reusable across tenants (not Aymar-specific). Five departments, easy to extend later (water jet, punch press, etc.):

```text
Office              → 1 station   (Front Office)
CNC Operations      → 1 station per registered machine
                      (Milling, Turning, 5-Axis, Honing auto-grouped by equipment_type)
Welding & Assembly  → 2 stations  (Weld Bay, Assembly Bench)
Shipping & Receiving→ 2 stations  (Receiving, Shipping)
Quality / Inspection→ 1 station   (CMM / Inspection Bench)
```

Implementation:
- New SECURITY DEFINER RPC `seed_basic_shop_scaffold(p_org_id, p_engagement_id)`:
  - Creates the 5 departments (idempotent on `(organization_id, name)`).
  - Creates stations per the rules above. For CNC Ops it iterates `equipment` rows for the org and creates one station per machine, named `<manufacturer> <model> (<serial last 4>)`.
  - Inserts `station_machine_assignments` linking each station to its equipment row.
  - Marks the `stations` checklist item as `done`.
- Exposed as a one-click "Seed basic shop" button in the admin `ReadinessPanel` and in the customer Intake wizard's Stations step.
- Future expansion: a small "Add department" picker with presets (`water_jet`, `punch_press`, `laser`, `paint`, `heat_treat`) — adds department + 1 station, no code change needed.

Aymar specifically: after seeding, they'll have **Office, 11 CNC stations grouped by mill/lathe/5-axis/honing, 2 Weld/Assembly, 2 Ship/Receive, 1 Inspection** — 17 stations total, all wired to the imported machines.

## 2. Employee onboarding — QR + email invite

The org already has `organization_invites` (15-day QR tokens) and an invite-redemption RPC. Gaps to close so a non-technical admin can actually use it:

- **Intake wizard "Users & roles" step** (`users_roles` module):
  - Quick form: email + role (`org_admin` | `supervisor` | `operator`) + optional department.
  - On submit → creates invite via existing flow, fires the email (see §3), and shows the QR code + shareable URL inline.
  - Bulk paste: paste a CSV/newline list of emails → generates invites in one shot.
  - Live list of pending invites with "resend email" and "copy QR link" actions.
- **Printable QR sheet**: "Print station QR pack" generates an 8.5×11 PDF (one QR per pending operator) so the admin can hand them out on the shop floor — useful when operators don't check email.
- Checklist auto-advances `users_roles` to `done` once ≥1 org admin + ≥1 operator have redeemed.

## 3. Email wiring for invites + go-live

Today the release-to-customer function is a stub. We need real transactional email:

- Confirm/configure Lovable Emails domain (`notify.jobline.ai` or similar) via the email setup dialog if not yet active.
- Scaffold transactional email infra (queue + send function).
- Add three React Email templates:
  - `org-invite` — "You've been invited to join {orgName}" with QR + redeem link.
  - `concierge-welcome` — sent when engagement is created (to the org admin).
  - `concierge-go-live` — sent by `release-to-customer` when admin activates.
- Wire `organization_invites` insert trigger → `send-transactional-email` with `templateName='org-invite'` and idempotency key `invite-<id>`.

## 4. Code/data fixes surfaced during the Aymar import

- `useOrgsForOnboarding` lists *all* orgs regardless of engagement state — filter out orgs that already have an active engagement so `NewEngagementDialog` doesn't double-book.
- `seed_onboarding_checklist` requires `auth.uid()` admin role, but the engagement-creation path already inserts the engagement client-side and then calls the RPC — fine for admins, but breaks for Stripe-purchased engagements created by `stripe-webhook` (service role). Make the RPC accept service role too (`OR auth.role() = 'service_role'`).
- `verify_org_production_ready` should count departments + stations from the new scaffold so the Aymar engagement's readiness % updates correctly.
- `ReadinessPanel` shows a dead "Seed defaults" button when no engagement is active — gate it behind `engagement.status IN ('in_progress','review')`.

## 5. Multi-tenant guardrails

- All new RPCs `SECURITY DEFINER` with `SET search_path = public` and explicit `organization_id` checks (matches existing project memory rule).
- Idempotency: re-running `seed_basic_shop_scaffold` for the same org is a no-op (uses `ON CONFLICT DO NOTHING` on `(organization_id, name)` and `(station_id, equipment_id)`).
- Aymar (non-ITAR) and any future ITAR org both work — no ERP writes, no cross-org data.

## 6. E2E coverage (Playwright)

Append one new spec — `concierge-basic-scaffold.spec.ts`:
1. Platform admin creates engagement for a test org with seeded equipment.
2. Clicks "Seed basic shop" → asserts 5 departments + ≥6 stations exist.
3. Adds operator invite → asserts invite row + email queued.
4. Marks ready → activates → asserts go-live email enqueued.

## Files to add / edit

```text
NEW  supabase/migrations/<ts>_basic_shop_scaffold.sql      -- seed_basic_shop_scaffold RPC + checklist auto-tick
NEW  supabase/functions/_shared/transactional-email-templates/org-invite.tsx
NEW  supabase/functions/_shared/transactional-email-templates/concierge-welcome.tsx
NEW  supabase/functions/_shared/transactional-email-templates/concierge-go-live.tsx
NEW  src/components/onboarding/intake/steps/StationsStep.tsx      -- "Seed basic shop" + add-department picker
NEW  src/components/onboarding/intake/steps/UsersRolesStep.tsx    -- invite form, bulk paste, pending list, print QR sheet
NEW  src/components/admin/onboarding/SeedBasicShopButton.tsx
NEW  e2e/concierge-basic-scaffold.spec.ts
EDIT supabase/functions/release-to-customer/index.ts              -- send go-live template
EDIT src/components/admin/onboarding/ReadinessPanel.tsx           -- add seed + gate broken buttons
EDIT src/hooks/useOnboardingEngagements.ts                        -- filter active orgs in useOrgsForOnboarding
EDIT supabase/migrations/<ts>_readiness_v2.sql                    -- extend verify_org_production_ready w/ dept+station counts
```

## Out of scope (next phase)
- Water jet / punch press as first-class equipment types (today they go in as generic equipment + a manually-added department).
- Per-machine routing templates (CNC mill vs lathe).
- Operator skill-matrix prefill from machine assignments.

## Order of execution
1. Migration + RPC (`seed_basic_shop_scaffold`, readiness v2, `seed_onboarding_checklist` service-role allow).
2. Email domain check → scaffold templates → wire invite + go-live triggers.
3. UI: `StationsStep`, `UsersRolesStep`, admin "Seed basic shop" button, fix `useOrgsForOnboarding`.
4. Run scaffold against Aymar's engagement to validate end-to-end (17 stations + machine links).
5. E2E spec.
