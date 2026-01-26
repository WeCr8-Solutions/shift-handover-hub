
# Plan: Add Manufacturing Shop Setup Step to Onboarding Flow

## Problem Summary
After the welcome modal, new users are taken directly to the dashboard tour without any opportunity to set up their manufacturing shop (teams, stations, users). The `/setup` page with Excel bulk upload exists but is not integrated into the onboarding flow.

## Solution Overview
Insert a dedicated "Shop Setup" step into the onboarding flow that directs new users to the `/setup` page where they can:
1. Use Excel bulk upload for quick setup
2. Or manually configure teams, stations, and users

---

## Implementation Steps

### Step 1: Update Onboarding Steps Definition
**File:** `src/hooks/useOnboarding.ts`

Add a new `shop-setup` step after `welcome`:

```typescript
export type OnboardingStep = 
  | 'welcome'
  | 'shop-setup'        // NEW - added after welcome
  | 'dashboard-overview'
  | 'station-cards'
  // ... rest unchanged

export const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Welcome to JobLine.ai', description: "Let's take a quick tour" },
  { id: 'shop-setup', title: 'Set Up Your Shop', description: 'Configure teams, stations, and users' },  // NEW
  { id: 'dashboard-overview', title: 'Dashboard Overview', description: 'Your command center' },
  // ... rest unchanged
];
```

### Step 2: Update Welcome Modal Navigation
**File:** `src/components/onboarding/WelcomeModal.tsx`

Modify `handleStartTour` to navigate to `/setup` when on the welcome step:

```typescript
const handleStartTour = () => {
  setIsOpen(false);
  
  if (currentStep === 'welcome') {
    navigate('/setup');  // NEW: Go to setup page first
  } else if (currentStep === 'shop-setup') {
    navigate('/setup');  // NEW: Handle shop-setup step
  } else if (currentStep === 'dashboard-overview' || currentStep === 'station-cards') {
    navigate('/dashboard');
  }
  // ... rest unchanged
  
  setTimeout(() => startTour(), 300);
};
```

Also add the new step icon and update the steps display.

### Step 3: Update GuidedTour Route Mapping
**File:** `src/components/onboarding/GuidedTour.tsx`

Update the `ROUTE_TO_STEP` mapping:

```typescript
const ROUTE_TO_STEP: Record<string, OnboardingStep> = {
  '/setup': 'shop-setup',       // CHANGED from 'welcome'
  '/dashboard': 'dashboard-overview',
  '/teams': 'team-management',
  '/admin': 'admin-features',
};
```

### Step 4: Update OnboardingProgress Component
**File:** `src/components/onboarding/OnboardingProgress.tsx`

Update the `handleStartTour` function to handle the new step:

```typescript
const handleStartTour = () => {
  if (currentStep === 'welcome' || currentStep === 'shop-setup') {
    navigate('/setup');  // NEW: Navigate to setup for both welcome and shop-setup
  } else if (currentStep === 'dashboard-overview' || currentStep === 'station-cards') {
    navigate('/dashboard');
  }
  // ... rest unchanged
};
```

### Step 5: Enhance Setup Page Tour Experience
**File:** `src/pages/Setup.tsx`

Add a "Continue to Dashboard" button that:
1. Marks the `shop-setup` step as complete
2. Navigates to the dashboard to continue the tour

```typescript
// Add after the setup completion card
<Button onClick={() => {
  completeStep('shop-setup');
  navigate('/dashboard');
  setTimeout(() => startTour(), 300);
}}>
  Continue Tour to Dashboard
</Button>
```

---

## Technical Details

### Files to Modify
| File | Changes |
|------|---------|
| `src/hooks/useOnboarding.ts` | Add `shop-setup` to OnboardingStep type and ONBOARDING_STEPS array |
| `src/components/onboarding/WelcomeModal.tsx` | Update navigation logic and add Factory icon for shop-setup |
| `src/components/onboarding/GuidedTour.tsx` | Update ROUTE_TO_STEP mapping for /setup |
| `src/components/onboarding/OnboardingProgress.tsx` | Update handleStartTour navigation logic |
| `src/pages/Setup.tsx` | Add tour continuation button and integrate with onboarding context |

### User Flow After Implementation
```text
1. New User Signs Up
        ↓
2. Welcome Modal Appears
        ↓
3. Click "Start Tour"
        ↓
4. Navigate to /setup (Shop Setup page)
        ↓
5. Guided tour highlights:
   - Setup progress tracker
   - Excel bulk upload option
   - Manual setup steps
        ↓
6. User completes setup OR clicks "Continue to Dashboard"
        ↓
7. Navigate to /dashboard for dashboard tour
        ↓
8. Continue through remaining tour steps
```

### Edge Cases Handled
- Users who skip setup can return via Profile page
- Restart button will go to /setup first
- Existing users with partial onboarding will see appropriate current step
- The flow works whether user uses Excel upload or manual setup

---

## Summary
This plan integrates the existing `/setup` page with its Excel bulk upload feature into the main onboarding flow. New users will now be guided through shop setup before being shown the dashboard, ensuring they understand how to configure their manufacturing floor from the start.
