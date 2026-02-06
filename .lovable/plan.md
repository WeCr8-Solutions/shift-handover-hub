
# Fix Onboarding Flow: Missing Initial Setup Steps

## Problem Summary
New users are being sent directly to the Dashboard and starting the tour at "Digital Expeditor Dashboard" step, completely missing the first three critical steps:
1. Welcome to JobLine.ai
2. Create Your Organization
3. Set Up Your Shop

## Root Cause Analysis

The issue stems from multiple interconnected problems:

1. **Direct Dashboard Redirect**: After signup/login, `Auth.tsx` navigates directly to `/dashboard` instead of checking onboarding state
2. **Non-Persisted New Signup Flag**: The `isNewSignup` state in `useOnboarding.ts` is only set client-side when creating a new record, but this flag is lost on page refresh or navigation
3. **Race Condition**: By the time the onboarding context initializes, the user is already on `/dashboard` where the GuidedTour starts at the wrong step
4. **Missing Welcome Step Completion**: The "welcome" step is never explicitly completed - it should be marked when the user clicks "Start Tour" in the WelcomeModal

## Solution Approach

### Phase 1: Enforce Proper Onboarding Flow

**1. Add a database column to track first visit (schema change)**
- Add `has_seen_welcome` column to `user_onboarding` table
- This persists the new signup state across page refreshes

**2. Fix Auth.tsx navigation logic**
- Check if onboarding is complete before navigating
- New users should go to `/setup` instead of `/dashboard`

**3. Update useOnboarding hook**
- Query `has_seen_welcome` to determine if user should see welcome flow
- Mark welcome as seen after first modal interaction

**4. Fix step completion flow**
- WelcomeModal should complete "welcome" step when user clicks Start Tour
- Setup page should enforce organization → shop → dashboard sequence

### Phase 2: Enforce Step Sequence

**5. Add step sequence validation**
- Prevent skipping steps by checking prerequisites
- Redirect users to the correct page based on their current onboarding step

**6. Fix GuidedTour step mapping**
- Ensure `/setup` can complete both `organization-setup` and `shop-setup` steps
- Don't auto-start dashboard tour if earlier steps are incomplete

## Technical Implementation

### Database Migration
```sql
ALTER TABLE user_onboarding 
ADD COLUMN has_seen_welcome boolean DEFAULT false;
```

### Code Changes

**File: `src/hooks/useOnboarding.ts`**
- Add `hasSeen Welcome` to state
- Fetch `has_seen_welcome` from database
- Add function to mark welcome as seen
- Derive `isNewSignup` from `!has_seen_welcome` instead of creation-time flag

**File: `src/pages/Auth.tsx`**
- After login/signup, redirect based on onboarding state:
  - If onboarding not complete → `/setup`
  - If onboarding complete → `/dashboard`

**File: `src/components/onboarding/WelcomeModal.tsx`**
- Show modal based on `!hasSeen Welcome` from database
- When user clicks "Start Tour" or "Skip":
  - Mark welcome as seen in database
  - Complete the "welcome" step
  - Navigate to `/setup` (not dashboard)

**File: `src/pages/Setup.tsx`**
- Explicitly complete "welcome" step on load if not completed
- Only show organization setup if organization step not complete
- Only complete "shop-setup" when all setup items are actually configured

**File: `src/components/onboarding/GuidedTour.tsx`**
- Check if prerequisite steps are complete before showing tour
- For `/dashboard` tour, require `shop-setup` to be complete first

**File: `src/pages/Index.tsx` (Dashboard)**
- Add check for incomplete onboarding
- Redirect to `/setup` if organization/shop steps incomplete

### Flow After Fix

```text
┌─────────────────────────────────────────────────────────────────┐
│                    NEW USER SIGNUP FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Signs Up                                                  │
│       ↓                                                         │
│  Auth.tsx checks onboarding state                               │
│       ↓                                                         │
│  Onboarding incomplete → Navigate to /setup                     │
│       ↓                                                         │
│  WelcomeModal shows (has_seen_welcome = false)                  │
│       ↓                                                         │
│  User clicks "Start Tour" or "Skip"                             │
│       ↓                                                         │
│  Mark welcome as seen, complete "welcome" step                  │
│       ↓                                                         │
│  Show OrganizationSetup (if no org exists)                      │
│       ↓                                                         │
│  User creates/joins org → complete "organization-setup"         │
│       ↓                                                         │
│  Show Setup page with teams/stations/members                    │
│       ↓                                                         │
│  User completes setup → complete "shop-setup"                   │
│       ↓                                                         │
│  Navigate to /dashboard                                         │
│       ↓                                                         │
│  Dashboard tour runs → complete "dashboard-overview"            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Files to Modify

1. **Database**: Add `has_seen_welcome` column to `user_onboarding`
2. `src/hooks/useOnboarding.ts` - Persist welcome state, fix step logic
3. `src/pages/Auth.tsx` - Route to `/setup` for incomplete onboarding
4. `src/components/onboarding/WelcomeModal.tsx` - Use persisted state, complete welcome step
5. `src/pages/Setup.tsx` - Enforce step sequence, complete welcome on load
6. `src/components/onboarding/GuidedTour.tsx` - Check prerequisites before tour
7. `src/pages/Index.tsx` - Redirect to setup if onboarding incomplete

## Testing Checklist
- New user signup → lands on Setup page with WelcomeModal
- Clicking "Start Tour" → stays on Setup, organization setup shows
- Creating org → organization-setup marked complete
- Completing team/station/member setup → shop-setup marked complete
- Navigating to dashboard → dashboard-overview tour starts
- Refreshing page at any point → user returns to correct step
- Existing users with complete onboarding → normal dashboard access
