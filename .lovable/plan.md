

## Plan: Visitor Survey Modal (10-Second Trigger)

### What We're Building
A timed survey popup that appears after 10 seconds on the landing page for anonymous visitors. It asks two questions: (1) how they heard about JobLine, and (2) what they're looking to monitor/solve. Responses are stored in a new database table. The modal respects a "Don't show again" preference via localStorage so it doesn't reappear across sessions.

### Database

**New table: `visitor_surveys`**
- `id` (uuid, PK)
- `heard_about_us` (text) — selected option for how they found us
- `looking_for` (text[]) — multi-select of needs/goals
- `other_heard_about` (text, nullable) — free-text if "Other" selected
- `other_looking_for` (text, nullable) — free-text if "Other" selected
- `source_page` (text) — page path where survey was shown
- `created_at` (timestamptz)
- RLS: allow anonymous inserts only (no select/update/delete for anon)

### New Component: `src/components/marketing/VisitorSurveyModal.tsx`

- Shows after 10 seconds on the landing page for unauthenticated visitors only
- Skips if `localStorage` has `visitor_survey_completed` or `visitor_survey_dismissed` set
- **Step 1 — "How did you hear about us?"**: Radio-style single select
  - Options: Google Search, Social Media, Referral/Word of Mouth, Trade Show / Conference, YouTube, LinkedIn, Other (with text input)
- **Step 2 — "What are you looking to track or monitor?"**: Checkbox multi-select
  - Options: Shift Handoffs, Work Order Tracking, Machine Downtime, Production Scheduling, Quality / NCRs, Team Communication, Other (with text input)
- Submit button inserts into `visitor_surveys` table
- "Skip" / dismiss link sets `visitor_survey_dismissed` in localStorage
- Track analytics events: `survey_shown`, `survey_completed`, `survey_dismissed`

### Landing Page Integration

- Import and render `<VisitorSurveyModal />` in `Landing.tsx` alongside the existing `<LeadCaptureModal />`
- No visual or layout changes to the landing page itself

### Conflict with LeadCaptureModal

- The existing `LeadCaptureModal` fires on exit-intent (desktop) or after 45s (mobile)
- The new survey fires at 10s — if survey is shown/completed, we'll set a sessionStorage flag so `LeadCaptureModal` delays or skips to avoid stacking popups
- Minimal change to `LeadCaptureModal`: add a check for `sessionStorage.getItem("survey_modal_active")` in its `shouldShow` logic

### Implementation Steps

1. Create `visitor_surveys` table with RLS via migration
2. Build `VisitorSurveyModal` component (two-step form, localStorage persistence, analytics tracking)
3. Add it to `Landing.tsx`
4. Add guard in `LeadCaptureModal` to avoid popup collision

