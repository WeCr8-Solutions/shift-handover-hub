

# `/start` — QR Code Landing Page for Physical Distribution

## Overview

Create a lightweight, mobile-first landing page at `/start` designed for QR code business cards, stickers, and bulletin board flyers. The page should load fast, look sharp on phones, and funnel visitors toward signing up or learning more — with built-in UTM attribution so you can track which physical placements drive engagement.

## Page Design

A single-screen, scroll-minimal page optimized for the "just scanned a QR code" experience:

1. **Hero Section** — Logo, bold tagline ("Your Shop Floor, Simplified"), one-liner value prop
2. **3 Quick Benefits** — Icon + short text cards (Track Work Orders, Smart Shift Handoffs, Real-Time Visibility)
3. **Primary CTA** — "Get Started Free" button leading to `/auth`
4. **Secondary CTA** — "See How It Works" linking to `/` (full landing page)
5. **Optional Email Capture** — Lightweight inline input for visitors not ready to sign up (reuses existing `email_leads` table with `source_page: "qr_start"`)
6. **QR Code Display** — A visible QR code on the page itself pointing back to `/start` so people can share it from their phone screen (using the existing `qrcode.react` dependency)

## UTM Strategy

- Default attribution when no UTM params present: `utm_source=qr_card&utm_medium=offline&utm_campaign=local_outreach`
- The `/start` route acts as a redirect-capable entry point — if UTM params are in the URL, they pass through as-is via the existing `captureUtmParams()` system
- Future flexibility: you can print different QR codes with different `utm_content` values per location (e.g., `utm_content=coffee_shop_01`, `utm_content=makerspace_02`)

## SEO & Meta

- Custom `SEOHead` with title "Get Started with JobLine.ai" and a short description
- `noindex: true` since this is a physical-distribution funnel page, not an organic search target

## Files to Create

1. **`src/pages/Start.tsx`** — The QR landing page component with hero, benefits, CTAs, email capture, and self-referencing QR code

## Files to Modify

1. **`src/App.tsx`** — Add `/start` route
2. **`src/components/AnalyticsProvider.tsx`** — Add `/start` to the page titles map

## Technical Details

### Start.tsx Structure

- Uses existing `SEOHead`, `Button`, `Input`, `Card` components
- Email capture reuses the `email_leads` table insert pattern from `LeadCaptureBar` (no new tables needed)
- QR code rendered with existing `qrcode.react` package pointing to `https://joblineai.lovable.app/start`
- UTM defaults applied on mount via a small effect similar to `FounderRedirect` pattern — if no UTM params detected, sets defaults in sessionStorage without redirecting (keeps the clean `/start` URL)
- Analytics event: `trackEvent("qr_landing_view", { source_page: "start", ...getUtmParams() })`
- Mobile-first layout: single column, large tap targets, minimal scrolling

### No Database Changes Required

- Reuses existing `email_leads` table for optional email capture
- UTM attribution handled entirely client-side via existing `captureUtmParams()` system

