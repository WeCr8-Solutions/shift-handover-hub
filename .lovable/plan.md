## Goal

When a user signs up, route them deterministically to **either** organization setup **or** talent profile creation — based on which CTA they came from, or by explicit choice on the auth page.

Today, every brand-new user who finishes signup is sent to `/setup` (org setup wizard) by `resolve_post_login_destination`, regardless of whether they wanted a shop account or a free talent profile. This buries the talent path.

## Changes

### 1. Intent-aware Auth page (`src/pages/Auth.tsx`)

- Read `?intent=org | talent` from the URL on mount; persist to `sessionStorage("signup_intent")` so it survives the email-verification round-trip.
- When `createMode === true` **and** no intent is set, render an intent picker (two cards) above the email/password form:
  - **"I run / work at a shop"** → sets `intent=org`. Copy: set up your organization, invite your team, track work orders.
  - **"I'm a CNC operator / machinist"** → sets `intent=talent`. Copy: free forever, build your public skills profile.
- Once an intent is chosen, show a small "Signing up as: Shop / Operator — change" toggle.
- Sign-in mode is unchanged (no intent shown).

### 2. Post-login routing honors intent

In the `checkOnboardingAndRedirect` effect:

- Before calling `resolve_post_login_destination`, check `sessionStorage("signup_intent")`.
- If `intent === "talent"` and user has no org membership → navigate to `/operator/profile?welcome=1` and clear the stored intent.
- If `intent === "org"` → navigate to `/setup` and clear the stored intent.
- Otherwise fall through to the existing RPC-driven destination (covers returning users and SSO).

Google OAuth flow is covered because the intent is stored in `sessionStorage` before the redirect and read on return.

### 3. CTA wiring — pass `?intent=` on every signup link

Update marketing entry points so the button itself carries intent:

- `src/components/marketing/FreeTalentProfileBanner.tsx` → `/auth?intent=talent&mode=signup`
- `src/components/marketing/TalentSideDoor.tsx`:
  - Left pillar ("Find skilled talent") → `/auth?intent=org&mode=signup`
  - Right pillar ("Showcase your skills") → `/auth?intent=talent&mode=signup`
- Primary landing-page CTAs ("Start free trial", "Get started", "Try free for 14 days") on `src/pages/Landing.tsx` and shared marketing headers → `/auth?intent=org&mode=signup`
- Talent-section CTAs on `/talent`, `/talent/browse`, public talent profile claim button → `/auth?intent=talent&mode=signup`

Also have Auth.tsx read `?mode=signup` to auto-open `createMode`.

### 4. Talent profile bootstrap

`/operator/profile?welcome=1` is the existing operator profile editor. Add a small welcome banner at the top when `welcome=1`: "Welcome! Fill in your machines, controls, and skills to publish your free profile." No new route needed.

### 5. Default still safe

If a user signs up without ever hitting an intent CTA and doesn't pick a card (edge case: deep-linked `/auth` with `mode=signup`), the picker is required before the form submits — no silent fallback into the org setup wizard.

## Out of scope

- No DB / RLS / RPC changes. `resolve_post_login_destination` still owns returning-user routing.
- No change to invite-code flow (`?invite=` already short-circuits).
- No change to org/talent permissions or role assignment.

## Technical details

**Files edited**
- `src/pages/Auth.tsx` — intent picker UI, `mode=signup` auto-open, sessionStorage write/read, post-login override.
- `src/components/marketing/FreeTalentProfileBanner.tsx` — link target.
- `src/components/marketing/TalentSideDoor.tsx` — link targets per pillar.
- `src/pages/Landing.tsx` — shop-oriented CTAs to `intent=org`.
- `src/pages/talent/TalentLanding.tsx`, `src/pages/talent/PublicTalentProfile.tsx` (claim CTA) — `intent=talent`.
- `src/pages/operator/OperatorProfile.tsx` (or equivalent) — welcome banner when `?welcome=1`.

**Files created**
- None.

**SessionStorage key**: `signup_intent` with values `"org" | "talent"`, cleared after first post-login redirect.

**Allowlist update**: `REDIRECT_ALLOWLIST` in Auth.tsx already permits `/operator` and `/setup`, so no regex change needed.
