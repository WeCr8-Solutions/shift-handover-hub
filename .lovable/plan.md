
# Allow Step Selection in "Continue Your Tour" Modal

## Overview
When users see the "Continue Your Tour" modal with their onboarding progress, they should be able to click on any step to jump directly to it, rather than only being able to continue from their current position.

## What Will Change

### User Experience
- Each step in the progress list becomes clickable
- Clicking a step will:
  1. Close the modal
  2. Navigate to the appropriate page for that step
  3. Start the tour at that step
- Visual cues (cursor, hover states) indicate steps are clickable
- Both completed and incomplete steps can be selected

### Step-to-Route Mapping
| Step | Route |
|------|-------|
| Welcome | /setup |
| Create Your Organization | /setup |
| Set Up Your Shop | /setup |
| Digital Expeditor Dashboard | /dashboard |
| Select & Deliver Work Orders | /dashboard |
| Shift Handoffs | /dashboard |
| Job Performance Updates | /dashboard |
| Team Management | /teams |
| Admin Features | /admin |

---

## Technical Details

### Files to Modify

**1. `src/hooks/useOnboarding.ts`**
- Add a `goToStep` function that directly sets the current step without marking previous steps as complete
- This allows jumping to any step for review/learning purposes

**2. `src/components/onboarding/OnboardingProvider.tsx`**
- Export the new `goToStep` function in the context

**3. `src/components/onboarding/WelcomeModal.tsx`**
- Make each step item clickable with proper onClick handlers
- Add a `handleStepClick` function that:
  - Marks welcome as seen (if not already)
  - Sets the selected step as current via `goToStep`
  - Navigates to the correct route
  - Starts the tour
- Add hover styles and cursor pointer to indicate interactivity

**4. `src/components/onboarding/OnboardingProgress.tsx`**
- Apply the same clickable step behavior for consistency
- Users can also jump to steps from the Profile page progress view

### Code Implementation

The new `goToStep` function will:
```typescript
const goToStep = useCallback(async (stepId: OnboardingStep) => {
  if (!user) return;
  
  setState(prev => ({ ...prev, currentStep: stepId }));
  
  await supabase
    .from('user_onboarding')
    .update({ current_step: stepId })
    .eq('user_id', user.id);
}, [user]);
```

Step click handler in WelcomeModal:
```typescript
const handleStepClick = async (stepId: OnboardingStep) => {
  setIsOpen(false);
  await markWelcomeSeen();
  
  // Navigate based on step
  const routeMap = {
    'welcome': '/setup',
    'organization-setup': '/setup',
    'shop-setup': '/setup',
    'dashboard-overview': '/dashboard',
    'station-cards': '/dashboard',
    'handoff-submission': '/dashboard',
    'performance-updates': '/dashboard',
    'team-management': '/teams',
    'admin-features': '/admin',
  };
  
  navigate(routeMap[stepId] || '/dashboard');
  setTimeout(() => startTour(stepId), 300);
};
```

### Visual Changes
- Steps will have `cursor-pointer` and hover background color
- A subtle right arrow or "Go" indicator on hover
- Maintain the existing completed/current/incomplete visual states
