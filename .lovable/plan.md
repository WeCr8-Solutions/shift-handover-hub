

# Marketing Conversion and Monetization Gap Analysis + Fix Plan

## Current Strengths (Already Working)
- Google AdSense script loaded in head with correct pub ID
- ads.txt properly configured
- AdPlacement component on all 11 feature pages (2 slots each)
- GA4 + GTM tracking with detailed event tracking
- Comprehensive SEO: sitemap, robots.txt, llms.txt, JSON-LD schemas
- Stripe-integrated pricing page
- Landing page with multiple CTAs and interactive demo
- MarketingFooter internal link mesh for SEO
- Promo code sharing and donation systems

## Critical Gaps Found

### 1. Ads Never Actually Load (Critical - Revenue Blocker)
The AdPlacement component renders `<ins class="adsbygoogle">` tags but **never calls `(adsbygoogle = window.adsbygoogle || []).push({})`**. Without this JavaScript call, Google AdSense will not fill any ad slot. Zero ad revenue is being generated despite the infrastructure being in place.

**Fix:** Add a `useEffect` in AdPlacement that calls `adsbygoogle.push({})` after the `<ins>` element mounts.

### 2. Landing Page Has Zero Ad Placements (Highest Traffic Page)
The landing page -- your most visited page -- has no AdPlacement components. Feature pages each have two slots, but the page driving the most traffic has none.

**Fix:** Add two non-intrusive AdPlacement slots to the landing page: one between the features section and "How It Works", and one before the final CTA.

### 3. No Email Capture or Lead Generation
There is no newsletter signup, no "download free template" offer, and no way to capture leads from visitors who aren't ready to sign up yet. You already have an Excel template (`public/templates/JobLine_Setup_Template.xlsx`) that could serve as a lead magnet.

**Fix:** Add a lightweight email capture banner on the landing page and feature pages -- something like "Download our free shop floor setup template" that collects an email before providing the download link.

### 4. "Schedule Demo" Button Does Nothing
In the bottom CTA section of the landing page, the "Schedule Demo" button only fires a tracking event but has no destination. This is a dead-end for high-intent visitors.

**Fix:** Either link to a Calendly/booking page, or replace with a "View Pricing" button that navigates to `/pricing`.

### 5. No Conversion Tracking for Signup Funnel
While you track CTA clicks, there's no GA4 conversion event fired when a user actually completes signup. This means you can't measure which marketing pages or CTAs actually drive signups.

**Fix:** Fire a `sign_up_completed` conversion event in the auth flow after successful registration, and configure it as a conversion in GA4.

### 6. Pricing Page Missing Ad Slot and MarketingNav
The Pricing page has its own custom nav instead of using MarketingNav, and has no ad placements. It also lacks the standardized layout other marketing pages follow.

**Fix:** Update Pricing page to use MarketingNav for consistency, and add one subtle ad slot in the FAQ section area.

### 7. Missing Open Graph Images
No page sets an `og:image`. When shared on LinkedIn, Twitter, Slack, or Discord, links show no preview image -- significantly reducing click-through rates from social shares.

**Fix:** Create or reference a default OG image and set it in the SEOHead defaults and in `index.html` meta tags.

---

## Implementation Plan

### Step 1: Fix AdSense Initialization (AdPlacement.tsx)
- Add `useEffect` with `adsbygoogle.push({})` call
- Add error handling for ad blockers
- Add analytics event for ad impression tracking

### Step 2: Add Ad Slots to Landing Page
- Insert AdPlacement (horizontal) between features and "How It Works" sections
- Insert AdPlacement (horizontal) between testimonials and final CTA
- Keep them subtle and non-intrusive

### Step 3: Build Email Capture Component
- Create a `LeadCaptureBar` component with email input
- Offer the existing Excel template as a free download incentive
- Store captured emails in a new `email_leads` database table
- Add the component to the landing page and feature pages

### Step 4: Fix Dead "Schedule Demo" Button
- Change to navigate to `/pricing` with appropriate tracking

### Step 5: Add Signup Conversion Tracking
- Fire `sign_up` GA4 event in AuthContext after successful registration
- This enables measuring actual conversion rates from each marketing page

### Step 6: Standardize Pricing Page
- Replace custom nav with MarketingNav
- Add one horizontal ad slot after the FAQ section

### Step 7: Add Default OG Image
- Set a default `og:image` in SEOHead component
- Add `og:image` meta tag to `index.html`

---

## Technical Details

### New Database Table: `email_leads`
```text
id (uuid, PK)
email (text, not null)
source_page (text) -- which page they signed up from
lead_type (text) -- e.g. 'template_download', 'newsletter'
created_at (timestamptz)
```
With RLS: insert allowed for anonymous/authenticated, select restricted to platform admins.

### New Component: `LeadCaptureBar`
- Minimal email input + CTA button
- Stores lead in database
- Shows success state after submission
- Appears on landing and feature pages

### AdPlacement Fix (Critical)
```text
useEffect that calls window.adsbygoogle.push({}) 
after component mounts, with try/catch for ad blockers
```

### Files Modified
- `src/components/marketing/AdPlacement.tsx` -- add push() call
- `src/components/marketing/LeadCaptureBar.tsx` -- new component
- `src/pages/Landing.tsx` -- add 2 ad slots + lead capture
- `src/pages/Pricing.tsx` -- use MarketingNav, add ad slot
- `src/components/SEOHead.tsx` -- add default OG image
- `src/contexts/AuthContext.tsx` -- add signup conversion event
- `index.html` -- add og:image meta tag
- Database migration for `email_leads` table

