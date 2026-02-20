

# Email Capture Completion: Feature Pages + Exit-Intent Modal

## What's Already Done
- LeadCaptureBar component (inline email form with template download)
- email_leads database table with RLS policies
- Placed on Landing page only

## What's Missing

### 1. Add LeadCaptureBar to All 11 Feature Pages
The inline bar needs to be added between the benefits section and the final CTA on each feature page, matching the landing page pattern.

**Pages to update:**
- WorkOrderTracking.tsx
- MachineShopSoftware.tsx
- ProductionControl.tsx
- ProductionScheduling.tsx
- ShiftHandoffSoftware.tsx
- DigitalExpeditor.tsx
- CNCOperatorTools.tsx
- DowntimeTracking.tsx
- ManufacturingOversight.tsx
- QualityManagement.tsx
- TeamCollaboration.tsx

Each will pass its page name as `sourcePage` prop for tracking (e.g., `sourcePage="work-order-tracking"`).

### 2. Create Exit-Intent Lead Capture Modal
A new `LeadCaptureModal` component that appears as a dialog when a visitor shows exit intent (mouse moves toward the browser's close/back area on desktop, or after 45 seconds of inactivity on mobile).

**Behavior:**
- Only shows once per session (tracked via sessionStorage)
- Only shows to non-authenticated visitors
- Does not show if the user has already submitted via the inline bar
- Dismissable with a "No thanks" option
- Same email capture logic as the inline bar (saves to email_leads, triggers template download)
- Slightly different copy to create urgency: "Before you go -- grab your free setup template"

### Technical Details

**New file:** `src/components/marketing/LeadCaptureModal.tsx`
- Uses the existing Dialog component from the UI library
- Listens for `mouseleave` on the document (desktop exit intent)
- Falls back to a 45-second timer on touch devices
- Stores `lead_modal_dismissed` in sessionStorage to prevent repeat shows
- Checks auth state to skip for logged-in users
- Reuses the same Zod validation and database insert logic from LeadCaptureBar

**Modified files (11 feature pages):**
- Import and add `<LeadCaptureBar sourcePage="page-name" />` between the benefits list and the final CTA section
- Import and add `<LeadCaptureModal />` at the page level

**Landing.tsx update:**
- Add `<LeadCaptureModal />` (it already has the inline bar)

**No database changes needed** -- the existing email_leads table handles this.
