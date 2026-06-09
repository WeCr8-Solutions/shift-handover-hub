
# Post-Claim Owner Onboarding — "Open for Operations" Flow

Goal: after an owner finishes `/activate` or `/claim/account-owner` and sets a password, they land on a guided setup that walks them through everything required to run a real shop. The dashboard and member-invite features stay gated behind it so the first experience is intentional, professional, and complete.

## The Journey

```text
QR / Email / Paste Claim
        │
        ▼
   /auth set-password ──▶ /welcome   (new gated wrapper)
                              │
       ┌──────────────────────┴────────────────────────┐
       │                                               │
       ▼                                               ▼
  Setup Checklist (6 required + 3 optional)     "Skip & explore" (read-only)
       │
       ▼
  All required done  ──▶  /dashboard  + invites unlocked
```

## The 6 required steps (in order)

1. **Verify owner identity & profile**
   Confirm name, phone, role title, headshot. Accept TOS + Privacy + ITAR/US-Person declaration if org flagged. Sets `profiles.completed_at` + `policy_acceptances` row.

2. **Confirm organization basics**
   Legal name, DBA, address, NAICS, ITAR flag, time zone, default shift schedule. Writes to `organizations` + `shift_schedules`.

3. **Pick your data source**
   Native (Lovable Cloud) / JobBOSS / SAP — same picker already in `WelcomeModal` data-source step. Sets `organizations.erp_persistence_mode`. ITAR orgs locked to read_through.

4. **Build the shop floor**
   Departments → Teams → Stations (with a "Quick-start: import from JobBOSS work centers" or "Seed a typical 3-station shop" shortcut using the existing `SeedBasicShopButton`). Routing templates step is offered but optional.

5. **Concierge document review**
   Surface unsealed concierge docs (MSA, ITAR, Go-Live). Owner reviews + e-signs. Pulls from `concierge_pack_finalizations` / `concierge_document_records`. Only required if the org has a concierge engagement; auto-skipped otherwise.

6. **Billing & seats**
   Confirm tier, seat count, billing email, payment method status. If trial, show days remaining + "Add card to keep service after trial." Hits existing `organization_billing` view.

After step 6 the owner sees a confirmation screen: **"You're open for operations"** with three CTAs — *Invite your team*, *Connect your first machine*, *Open dashboard*.

## Optional "Pro" steps (post-launch, surfaced as suggestions on the dashboard)

- Connect ERP credentials (deep link to `/settings/integrations/{native,jobboss,sap}`)
- Configure shift handoff template
- Add first work order / import existing
- Connect machine monitoring relay

These remain in the existing `PRO_STEPS` list — surfaced on the dashboard's `OnboardingProgress` widget, not blocking.

## Gating model

- New helper `useOwnerSetupGate()` reads `user_onboarding` + `organization_members.role` + `organizations.activation_state`.
  - If user is **owner/admin** and `core_steps_complete = false`, every protected route renders `<OwnerSetupRedirect />` that pushes to `/welcome`.
  - Non-owner members are not gated (they just see whatever their org admin has set up).
- "Invite team members" button on `/teams` is disabled with tooltip "Finish setup to unlock invites" until step 6 is done. Same for "Add work order" on `/queue`.
- Owner can always click **Skip & explore** which sets `user_onboarding.explore_only = true`. Dashboard renders in a read-only banner: "Setup paused — invites stay locked until you finish setup." One-click resume.

## Smooth-transition UX details

- One full-screen page `/welcome` with a left rail (the 6 steps with checkmarks + ETA per step) and a right pane (the active step's form). Same look as `WelcomeModal` extracted into a page so it can survive refreshes and deep links (`/welcome/step/shop-setup`).
- Progress is saved on every field change — owner can close the tab and resume.
- Each step shows a **"Why this matters"** sidebar tip (1 sentence) plus a *Skip for now* link on the 3 optional sub-tasks within a step.
- Concierge-served orgs get a **green "Your concierge prepared this for you"** badge on steps 2, 3, 4 with pre-filled answers ready to confirm.
- Completion fires the existing celebration animation, then `confetti` once and a transactional email "You're live on JobLine.ai — share with your team" with a deep link to `/teams?invite=open`.

## Files

**New**
- `src/pages/Welcome.tsx` — gated setup shell with stepper + outlet
- `src/pages/welcome/StepOwnerProfile.tsx`
- `src/pages/welcome/StepOrganization.tsx`
- `src/pages/welcome/StepDataSource.tsx` (extracted from existing modal logic)
- `src/pages/welcome/StepShopFloor.tsx` (wraps `SeedBasicShopButton` + existing team/station forms)
- `src/pages/welcome/StepConciergeReview.tsx`
- `src/pages/welcome/StepBilling.tsx`
- `src/pages/welcome/StepReady.tsx` (the "open for operations" confirmation)
- `src/components/onboarding/OwnerSetupRedirect.tsx`
- `src/hooks/useOwnerSetupGate.ts`
- `supabase/functions/_shared/transactional-email-templates/owner-setup-complete.tsx`
- One migration: add `user_onboarding.explore_only`, `organizations.activation_state ENUM('claimed','in_setup','open_for_operations')`, RPC `mark_org_open_for_operations()` (owner-only, requires all 6 core flags true), audit row in `organization_audit_events`.

**Edit**
- `src/App.tsx` — add `/welcome` + `/welcome/step/:stepId`, wrap protected routes with `<OwnerSetupRedirect />`.
- `src/hooks/useOnboarding.ts` — add `core_steps_complete` derived flag + `explore_only`.
- `src/components/onboarding/WelcomeModal.tsx` — keep for returning users; route owners with `activation_state='claimed'` to `/welcome` instead of opening the modal.
- `src/pages/Teams.tsx` — disable invite buttons when `!isOpenForOperations`.
- `src/pages/Queue.tsx` — same gate on "Add work order".
- `supabase/functions/_shared/transactional-email-templates/registry.ts` — register the new completion email.

## Acceptance

- A new owner who just claimed via QR, email, or `/claim/account-owner` lands on `/welcome` and cannot reach `/dashboard`, `/queue`, or send invites until the 6 required steps are green.
- Concierge-prepared answers pre-fill and only require confirmation.
- Owner can skip-and-explore but invites + work-order creation stay locked with a clear tooltip and a one-click resume.
- Refreshing the browser at any step returns the owner to the exact same step with form values intact.
- `organizations.activation_state` flips `claimed → in_setup → open_for_operations`; the transition is audited.
- Members who join after step 6 are completed see a clean, configured dashboard from minute one.
