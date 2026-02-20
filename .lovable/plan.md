

# AI Planning Assistant Marketing Page + Landing Integration

## What We're Building

A dedicated marketing page for the AI Planning Assistant feature at `/features/ai-planning-assistant`, plus integration into the landing page's feature grid and footer. The page will showcase the assistant's capabilities with realistic mock screenshots of use cases, and funnel visitors toward sign-up.

---

## New Feature Page: `/features/ai-planning-assistant`

### Page Structure (following existing marketing page pattern)

1. **MarketingNav** (sticky header with logo + CTA)
2. **Hero Section**
   - Badge: "AI-Powered Production Intelligence"
   - Headline: "Your AI Production Planner"
   - Subhead: Explains how the assistant uses live queue and station data to answer scheduling, rerouting, and priority questions in real time
   - CTA buttons: "Start Free Trial" + "See Pricing"

3. **Interactive Chat Preview (Screenshot 1)**
   - A realistic mock of the Planning Assistant chat panel, showing:
     - User asks: "A machine is down. What work orders are affected?"
     - AI responds with a formatted markdown answer listing affected WOs, suggested reroutes, and priority adjustments
     - Usage badge showing "3/5 left today"
   - Styled to look like the actual Sheet component with the Sparkles icon header

4. **Use Case Cards (3 scenarios with mock screenshots)**
   - **Machine Down Recovery**: Mock chat showing AI identifying affected work orders and suggesting reroutes to available stations
   - **Due Date Feasibility**: Mock showing AI analyzing overdue items and recommending schedule adjustments
   - **Queue Reprioritization**: Mock showing AI reordering the queue based on due dates and station availability
   - Each card has an icon, title, description, and a realistic chat bubble preview

5. **How It Works Steps**
   - Step 1: Ask a question in plain English
   - Step 2: AI analyzes your live production data (queue, stations, schedules)
   - Step 3: Get actionable recommendations with specific WO and station references
   - Step 4: Act on suggestions directly from your dashboard

6. **Plan Comparison Card**
   - Shows daily message limits by tier (Free: 5, Single: 25, Team: 100, Enterprise: Unlimited)
   - Highlights the upgrade value proposition
   - CTA: "Start Free Trial" button linking to /auth

7. **Benefits List** (8 items in 2-column grid with check icons)

8. **Lead Capture Bar** (existing component)

9. **Bottom CTA Section** -- "Ready to plan smarter?" with sign-up button

10. **AdPlacement** slots (mid-page + pre-footer)

11. **MarketingFooter**

12. **LeadCaptureModal** (exit-intent)

---

## Landing Page Integration

### Feature Grid Addition
Add a new entry to the `features` array in Landing.tsx:
- Icon: Sparkles
- Title: "AI Planning Assistant"  
- Description: "Ask questions about scheduling, rerouting, and priorities. AI analyzes your live production data and gives actionable answers."
- Color: yellow/amber theme
- Link: `/features/ai-planning-assistant`
- CTA: "Meet Your AI Planner"

### Additional Feature Links
Add "AI Planning Assistant" to the extra feature links row below the feature grid.

### Footer Integration
Add "AI Planning" link under the "Management" category in MarketingFooter.

---

## App Router Integration

Add the route `/features/ai-planning-assistant` to App.tsx, matching the existing feature page pattern.

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/features/AIPlanningAssistant.tsx` (new) | Full marketing page with mock chat screenshots, use cases, pricing comparison, and sign-up funnel |
| `src/pages/Landing.tsx` | Add AI Planning Assistant to features array + extra links |
| `src/components/marketing/MarketingFooter.tsx` | Add "AI Planning" link under Management |
| `src/App.tsx` | Add route for `/features/ai-planning-assistant` |

### No backend or database changes required.

