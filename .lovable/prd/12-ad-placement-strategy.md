# PRD 12 — Ad Placement & Revenue Strategy

> **Last updated:** 2026-05-02
> **Status:** Active — AdSense review pending after thin-content remediation
> **Owner:** Platform Admin / Developer

---

## AdSense Review History

- **2026-05-02:** Site flagged "Low value content / thin content." Remediation:
  removed `YOUR_CODE` placeholder verification meta tags from `index.html`,
  extended `AdPlacement` to Handbook, Tools, Demo, Certificate Lookup,
  Verify Certificate, OAP Landing, GCA Landing, and Industry pages, added a
  build-time ESLint guard that blocks `AdPlacement` imports from authenticated
  app paths, and added a runtime route guard inside `AdPlacement` itself.
- **Resubmission steps:**
  1. Deploy.
  2. URL-inspect 5 sample marketing pages in Search Console.
  3. AdSense → Sites → jobline.ai → "I confirm I have fixed the issues" → Request review.
  4. Expect 2–4 week review window.

> **Status:** Active  
> **Owner:** Platform Admin / Developer

---

## 1. Purpose

Generate supplemental ad revenue from public-facing marketing pages while keeping the authenticated application completely ad-free to preserve user experience and professional credibility.

---

## 2. Scope — Where Ads Appear

### ✅ Ad-Enabled Pages (Public / Unauthenticated)

| Page Group | Routes | Placement Strategy |
|---|---|---|
| **Landing** | `/` | 2× horizontal — after features section, before final CTA |
| **Pricing** | `/pricing` | 1× horizontal — below pricing tiers |
| **Blog** | `/blog` | 1× horizontal — between posts grid and CTA |
| **Feature Pages** | `/features/*` (14 pages) | 2× horizontal per page — mid-content break + before footer |
| **Resources Index** | `/resources` | 1× horizontal + 1× rectangle |
| **Manufacturing Guides** | `/resources/manufacturing-guides` | 1× horizontal + 1× rectangle |
| **G-Code Reference** | `/resources/gcode-reference` | 1× horizontal + 1× rectangle |
| **Industry Glossary** | `/resources/industry-glossary` | 1× horizontal + 1× rectangle |

### 🚫 Ad-Free Pages (Authenticated Application)

All pages behind authentication are ad-free:

- `/dashboard` (Index)
- `/queue` — Work Order Queue
- `/teams` — Team Management
- `/settings` — Settings
- `/admin` — Admin Panel
- `/profile` — User Profile
- `/setup` — Onboarding Setup
- `/testing` — Testing Dashboard
- `/updates` — System Updates

**Rule:** The `AdPlacement` component must NEVER be imported into any page under authenticated routes.

---

## 3. Technical Implementation

### 3.1 AdSense Configuration

- **Publisher ID:** `ca-pub-3639153716376265`
- **ads.txt:** Served at `/ads.txt` (public directory)
- **Script Loading:** Deferred via `window.load` event in `index.html` alongside GA4/GTM
- **ITAR Compliance:** All ad scripts are suppressed when `VITE_DISABLE_ANALYTICS=true`

### 3.2 AdPlacement Component

**Location:** `src/components/marketing/AdPlacement.tsx`

**Props:**
| Prop | Type | Default | Description |
|---|---|---|---|
| `slot` | `string` | `"auto"` | AdSense ad unit slot ID |
| `format` | `"horizontal" \| "rectangle" \| "fluid"` | `"horizontal"` | Ad format / size hint |
| `className` | `string` | `""` | Additional Tailwind classes |
| `label` | `string` | `"Sponsored"` | Disclosure text above ad |

**Safety Features:**
- Returns `null` when `VITE_DISABLE_ANALYTICS=true`
- Fails silently if ad blocker is active
- Push-once guard prevents duplicate ad requests

### 3.3 Ad Formats

| Format | Min Height | Max Height | Use Case |
|---|---|---|---|
| `horizontal` | 90px | 120px | Between content sections |
| `rectangle` | 250px | 300px | Sidebar / end-of-page |
| `fluid` | 100px | Auto | Responsive fill |

---

## 4. Design Guidelines

1. **Non-intrusive:** Ads must not interrupt reading flow. Place between natural content breaks.
2. **Labeled:** Every ad container shows a subtle "Sponsored" label (10px, muted, uppercase).
3. **Themed:** Ad containers use `bg-muted/30` and `border-border/50` to blend with the design system.
4. **Max 2 per page:** No page should have more than 2 ad placements to avoid clutter.
5. **No interstitials:** No full-screen or popup ads — ever.

---

## 5. Revenue Tracking

Ad performance is trackable via:
- Google AdSense dashboard (impressions, clicks, RPM)
- GA4 events for page views on ad-enabled pages (already tracked by `AnalyticsProvider`)
- UTM parameters on inbound traffic (captured by `src/lib/utm.ts`)

---

## 6. Future Considerations

- **Slot-specific tracking:** Assign unique `data-ad-slot` values per page for granular RPM analysis
- **A/B testing:** Test `horizontal` vs `rectangle` formats on resource pages
- **Sponsored content:** Native ad placements within blog posts (requires editorial review)
- **Premium ad-free:** Ensure paid subscribers never see ads even on marketing pages (if applicable)

---

## 7. Compliance

- Google AdSense policies must be followed (no incentivized clicks, proper labeling)
- ITAR deployments: All ad code is completely excluded via build-time flag
- GDPR: Ad consent should be managed via cookie consent banner (future work)
