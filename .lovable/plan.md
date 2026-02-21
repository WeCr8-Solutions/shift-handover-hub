

# GA4 Analytics Overhaul + New Landing Pages

This plan addresses all 7 items from the analytics audit: removing fake/inflated events, implementing a clean event schema, standardizing UTMs, and adding 3 new funnel landing pages.

---

## 1. Remove Auto-Rotation Event Spam (Critical)

**File: `src/pages/Landing.tsx`**

- Remove the `trackEvent('testimonial_auto_rotated', ...)` call inside the `setInterval` that auto-rotates testimonials every 5 seconds. The carousel still rotates visually -- we just stop firing a GA4 event for it.
- Keep `testimonial_dot_clicked` (user-initiated click) as-is.
- Remove `landing_feature_hover` -- hover events are noisy and not actionable. Keep `landing_feature_clicked`.
- Remove `landing_demo_modal_closed` -- closing is not a meaningful conversion signal.

**File: `src/lib/analytics.ts`**

- Remove the duplicate `useEngagementTracking` scroll tracking in `src/hooks/useAnalytics.ts` (it overlaps with the Landing page's own scroll tracker). The Landing page's version is better since it's page-specific.

---

## 2. Implement Clean Event Schema

**File: `src/lib/analytics.ts`** -- Add standardized event helpers:

| Event Name | Params | Where Fired |
|---|---|---|
| `cta_click` | `cta_id`, `cta_text`, `page_path`, `section` | All CTA buttons across landing + feature pages |
| `demo_open` | `page_path`, `trigger` | Demo video modal open |
| `signup_start` | `page_path`, `method` | Auth page -- when user submits signup form |
| `signup_complete` | `page_path`, `method` | Auth page -- after successful signup |
| `login` | `page_path`, `method` | Auth page -- after successful login |
| `pricing_view` | `page_path` | Pricing page mount |
| `lead_captured` | `page_path`, `lead_type` | Already exists in LeadCaptureBar |
| `video_play` | `page_path`, `source` | Demo video onPlay |
| `video_complete` | `page_path`, `source` | Demo video onEnded |

**File: `src/pages/Landing.tsx`** -- Consolidate all the scattered `landing_cta_click`, `landing_nav_click`, etc. into the standardized `cta_click` event with proper `cta_id` and `section` params. This replaces ~8 different ad-hoc event names with one consistent schema.

**File: `src/pages/Auth.tsx`** -- Add:
- `signup_start` event when signup form is submitted (before API call)
- `signup_complete` event on successful signup
- `login` event on successful login (currently only logged to activity table, not GA4)

**File: `src/pages/Pricing.tsx`** -- Add `pricing_view` event on page mount.

---

## 3. UTM Infrastructure (Already Mostly Done)

The UTM capture system (`src/lib/utm.ts`) is already implemented and working. The `/zach` founder redirect is in place. No code changes needed -- this is an operational item:

- A UTM Link Builder reference will be added as a comment block in `src/lib/utm.ts` documenting the standard format and common templates for LinkedIn posts, DMs, and ads.
- All conversion events will include UTM params from `getUtmParams()`.

---

## 4. GA4 Conversion Definitions

This is a GA4 admin configuration task (not code). After deploying the clean event schema, the following events should be marked as Conversions in GA4 Admin > Events:
- `signup_complete`
- `lead_captured`
- `demo_open`
- `cta_click` (micro-conversion)

This will be documented in a code comment for reference.

---

## 5. Filter Bot/Spam Traffic

**File: `src/lib/analytics.ts`** -- Add a lightweight bot/preview filter:
- Check `navigator.webdriver` (headless browsers)
- Skip GA4 tracking when running inside Lovable preview iframe (check `window.location.hostname` for preview domains)
- This prevents build previews and automated testing from polluting GA4 data

---

## 6. Add 3 New Funnel Landing Pages

Create 3 new pages following the existing feature page template pattern (MarketingNav + SEOHead + Hero + Bullets + CTA + MarketingFooter):

| Route | File | Target Keyword |
|---|---|---|
| `/machine-time-tracking` | `src/pages/features/MachineTimeTracking.tsx` | Machine time tracking software |
| `/shift-handoff` | `src/pages/features/ShiftHandoff.tsx` | Shift handoff (short-tail) |
| `/manufacturing-visibility` | `src/pages/features/ManufacturingVisibility.tsx` | Manufacturing floor visibility |

Each page will have:
- SEOHead with JSON-LD schema
- Clear headline and 3 benefit bullets
- Demo button (fires `demo_open`)
- CTA button (fires `cta_click` with unique `cta_id`)
- FAQ section (3-4 questions)
- LeadCaptureBar + LeadCaptureModal
- AdPlacement slots

**File: `src/App.tsx`** -- Add routes for the 3 new pages.

---

## 7. Deployment Blocker Fix

The `work_order_routing` table on Live still needs the `organization_id` backfill before publishing. You must run this SQL in **Lovable Cloud > Run SQL** (Live environment) before publishing:

```sql
ALTER TABLE work_order_routing ADD COLUMN IF NOT EXISTS organization_id UUID;
UPDATE work_order_routing r SET organization_id = q.organization_id FROM queue_items q WHERE r.queue_item_id = q.id AND r.organization_id IS NULL;
ALTER TABLE work_order_routing ALTER COLUMN organization_id SET NOT NULL;
```

---

## Technical Summary of File Changes

| File | Action |
|---|---|
| `src/lib/analytics.ts` | Add `ConversionEvents` helpers, bot filter, UTM doc block |
| `src/pages/Landing.tsx` | Remove `testimonial_auto_rotated`, `feature_hover`, consolidate to `cta_click` schema |
| `src/pages/Auth.tsx` | Add `signup_start`, `signup_complete`, `login` GA4 events |
| `src/pages/Pricing.tsx` | Add `pricing_view` event |
| `src/pages/features/MachineTimeTracking.tsx` | New page |
| `src/pages/features/ShiftHandoff.tsx` | New page |
| `src/pages/features/ManufacturingVisibility.tsx` | New page |
| `src/App.tsx` | Add 3 new routes |
| `src/lib/utm.ts` | Add UTM template documentation block |

