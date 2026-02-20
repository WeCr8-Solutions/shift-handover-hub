

# UTM Tracking & Attribution Infrastructure

## Overview

Add centralized UTM parameter capture, session persistence, and campaign-attributed event tracking to the existing GA4 analytics system. Also add a `/demo` page with embedded scheduler, a `/zach` founder redirect route, and wire `demo_modal_open` + `demo_form_submit` conversion events into the landing page and feature pages.

No database changes required. No new dependencies needed.

---

## What Gets Built

### 1. UTM Capture & Persistence Utility -- `src/lib/utm.ts` (new)

A small utility module that:
- Parses `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` from `window.location.search`
- Stores them in `sessionStorage` under a single key (`jobline_utm`)
- On subsequent calls, returns stored values if no new UTM params are present in the URL
- Exposes a `getUtmParams()` function that any tracking call can use
- Strips UTM params from the visible URL using `history.replaceState` after capture (clean URLs)

### 2. AnalyticsProvider Enhancement -- `src/components/AnalyticsProvider.tsx`

- On every route change, call the UTM capture utility
- Attach UTM values to every `trackPageView` call automatically
- No changes needed to individual pages -- UTM attribution is inherited globally

### 3. Updated `trackPageView` and `trackEvent` -- `src/lib/analytics.ts`

- `trackPageView` gains an optional `utmParams` argument; the AnalyticsProvider passes it automatically
- Add two new pre-defined event helpers under a `DemoEvents` export:
  - `demoModalOpen(pagePath, utmParams)` -- fires `demo_modal_open`
  - `demoFormSubmit(pagePath, utmParams)` -- fires `demo_form_submit`

### 4. Demo Page -- `src/pages/Demo.tsx` (new)

- Route: `/demo`
- Uses existing `MarketingNav` + `MarketingFooter` pattern
- Hero section with headline "Book a Demo" and brief description
- Embedded demo request form (name, email, company, phone, message) -- submits to `email_leads` table with `lead_type: 'demo_request'`
- On successful submission fires `demo_form_submit` event with UTM params attached
- SEO metadata via `SEOHead`
- No modal -- form is directly on the page

### 5. Founder Redirect -- `/zach` route

- A lightweight component that on mount:
  - Reads current URL params
  - If no UTM params present, appends `utm_source=founder&utm_medium=organic&utm_campaign=zach_profile`
  - Does a 302-style client redirect to `/` preserving all UTM params
- Uses `Navigate` from react-router-dom with search params

### 6. Landing Page Demo Modal Event Wiring

- The existing `handleDemoModalOpen` function already fires `landing_demo_modal_opened`
- Rename/add a parallel `demo_modal_open` event fire using the new `DemoEvents.demoModalOpen()` for GA4 conversion tracking consistency
- The demo video modal currently exists; if a "Book Demo" CTA is added to nav or hero, it links to `/demo`

### 7. Lead Capture Components -- UTM Attribution

- Update `LeadCaptureBar` and `LeadCaptureModal` to attach UTM params from `getUtmParams()` to the `lead_captured` event so every lead is campaign-attributed

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/utm.ts` (new) | UTM parse, persist, retrieve, and URL-clean utility |
| `src/lib/analytics.ts` | Add `DemoEvents` export; update `trackPageView` to accept UTM; add UTM merge helper |
| `src/components/AnalyticsProvider.tsx` | Import UTM utility; attach UTM to every page view; capture on route change |
| `src/pages/Demo.tsx` (new) | Dedicated demo page with inline form, SEO head, conversion tracking |
| `src/pages/FounderRedirect.tsx` (new) | `/zach` redirect component with default UTM tagging |
| `src/App.tsx` | Add `/demo` and `/zach` routes |
| `src/components/marketing/LeadCaptureBar.tsx` | Attach UTM params to `lead_captured` event |
| `src/components/marketing/LeadCaptureModal.tsx` | Attach UTM params to `lead_captured` and `lead_modal_shown` events |
| `src/pages/Landing.tsx` | Add "Book Demo" nav link to `/demo`; fire `demo_modal_open` via `DemoEvents` |

---

## Technical Details

### UTM Utility API

```text
captureUtmParams()    -- parse URL, store in sessionStorage, clean URL
getUtmParams()        -- return { utm_source, utm_medium, utm_campaign, utm_content } or {}
```

### Event Flow

```text
User lands on /?utm_source=linkedin&utm_medium=paid&utm_campaign=q1_launch
  --> captureUtmParams() stores to sessionStorage, cleans URL to /
  --> trackPageView("/", "Home", { utm_source: "linkedin", ... })

User navigates to /demo
  --> trackPageView("/demo", "Book Demo", { utm_source: "linkedin", ... })
  --> User submits form
  --> DemoEvents.demoFormSubmit("/demo", { utm_source: "linkedin", ... })

User visits /zach (no UTM)
  --> Redirect to /?utm_source=founder&utm_medium=organic&utm_campaign=zach_profile
  --> Normal UTM capture flow from there
```

### Scalability

- Any new route automatically gets UTM-attributed page views (zero code needed per page)
- `getUtmParams()` is available to any component for ad-hoc event enrichment
- No tracking code duplication -- everything flows through AnalyticsProvider

