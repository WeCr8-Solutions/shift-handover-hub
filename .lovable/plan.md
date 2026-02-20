

# AdSense Integration, ads.txt, Firecrawl Connection & Marketing Footer Standardization

## Overview
This plan covers four areas: (1) adding Google AdSense to the site, (2) creating the required `ads.txt` file, (3) connecting Firecrawl for web scraping capabilities, and (4) standardizing the footer across all 11 marketing/feature pages for better SEO internal linking and brand consistency.

---

## 1. Google AdSense Integration

### index.html (head section)
- Add the AdSense verification meta tag: `<meta name="google-adsense-account" content="ca-pub-3639153716376265">`
- Add the AdSense script: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3639153716376265" crossorigin="anonymous"></script>`

These go in the `<head>` alongside the existing GTM and gtag scripts.

### public/ads.txt (new file)
- Create `public/ads.txt` with content:
  `google.com, pub-3639153716376265, DIRECT, f08c47fec0942fa0`
- This is required by Google for AdSense domain verification.

---

## 2. Firecrawl Connection
- Connect the Firecrawl connector using the API key `fc-93c2a3c3e88b4ea29cd0b9f38d9e0f61` so it is available for scraping/search features in backend functions.

---

## 3. Standardized Marketing Footer Component

Currently the 11 feature pages have inconsistent footers -- some show only "Back to Home", others show a handful of cross-links. The Landing page has a full branded footer.

### New shared component: `src/components/marketing/MarketingFooter.tsx`
A reusable footer that will be used on all feature pages and the Pricing page. It includes:
- **Feature cross-links**: Links to all 11 feature pages (organized in columns)
- **Utility links**: Home, Pricing, Sign Up
- **Copyright line**: "2026 JobLine.ai. All rights reserved."
- **Attribution**: "A product of WeCr8 Solutions LLC" (matching Landing page)
- Responsive grid layout for the link columns

### Pages to update (replace their current footer)
1. ShiftHandoffSoftware
2. WorkOrderTracking
3. ProductionScheduling
4. MachineShopSoftware
5. ProductionControl
6. DigitalExpeditor
7. ManufacturingOversight
8. QualityManagement
9. CNCOperatorTools
10. TeamCollaboration
11. DowntimeTracking
12. Pricing

Each page's inline `<footer>` block will be replaced with `<MarketingFooter />`.

---

## 4. SEO Benefits
- The standardized footer creates a strong internal link mesh across all 11 feature pages, boosting crawlability and page authority distribution.
- AdSense integration enables monetization of organic traffic on marketing pages.
- The `ads.txt` file satisfies Google's authorized seller verification.

---

## Technical Details

### Files created
| File | Purpose |
|------|---------|
| `public/ads.txt` | Google AdSense authorized seller file |
| `src/components/marketing/MarketingFooter.tsx` | Shared footer for all marketing pages |

### Files modified
| File | Change |
|------|--------|
| `index.html` | Add AdSense meta tag + script in head |
| 11 feature page files | Replace inline footer with `<MarketingFooter />` |
| `src/pages/Pricing.tsx` | Replace inline footer with `<MarketingFooter />` |

### MarketingFooter link structure
- **Column 1 - Operations**: Shift Handoffs, Work Orders, Production Scheduling, Production Control
- **Column 2 - Shop Floor**: Machine Shop, CNC Operator Tools, Downtime Tracking, Digital Expeditor
- **Column 3 - Management**: Manufacturing Oversight, Quality Management, Team Collaboration
- **Column 4 - Company**: Home, Pricing, Sign Up Free

