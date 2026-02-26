

# Onboarding & Flexible Naming — Completed

## What was done

### Prescriptive Placeholder Cleanup (Complete)
All prescriptive placeholders across the codebase have been replaced with generic hints:
- CreateQueueItemDialog, CreateWorkOrderDialog, NewHandoffForm, JobPerformanceUpdateForm
- TeamStationManager, StationManagement, TeamManagement, OrganizationSetup
- RoutingTemplateManagement, Setup.tsx

### Onboarding Enhancements (Complete)
1. **WelcomeModal** — Added "Don't show again" button that permanently dismisses the modal
2. **Settings → Onboarding tab** — New tab showing tour progress, step checklist, continue/restart buttons
3. **Setup.tsx** — All prescriptive descriptions updated to generic text
4. **OrganizationSetup** — Default station uses `Station-1` with `General` work center type instead of `STN-001` / `Manual Mill`

### Onboarding Checklist Steps (9 steps)
1. Welcome to JobLine.ai
2. Create Your Organization
3. Set Up Your Shop (teams, stations, routing, users)
4. Digital Expeditor Dashboard
5. Select & Deliver Work Orders
6. Shift Handoffs
7. Job Performance Updates
8. Team Management
9. Admin Features

### Access Points
- WelcomeModal on first login (can be dismissed permanently)
- Setup page (/setup) with progress checklist
- Settings → Onboarding tab (always accessible, shows progress + restart)
- OnboardingProgress component (embedded in various pages)
- TourTriggerButton (help icon on pages)
