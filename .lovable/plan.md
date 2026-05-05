## Goal

Capture the `src` URL parameter (e.g. `?src=wheatlands`) site-wide — alongside existing UTM params — persist it across the session, and emit `start_click` / `auth_visit` GA4 events so flyer/QR/outreach campaigns are attributable through signup.

## Changes

### 1. `src/lib/utm.ts` — extend with `src` capture

Add a small, dedicated helper so `src` survives navigation and is independent of the UTM session bucket (matches the user's snippet using `localStorage`):

```ts
const TRAFFIC_SRC_KEY = "traffic_source";

export function captureTrafficSource(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const src = params.get("src");
  if (src) {
    localStorage.setItem(TRAFFIC_SRC_KEY, src);
    return src;
  }
  return localStorage.getItem(TRAFFIC_SRC_KEY);
}

export function getTrafficSource(): string {
  if (typeof window === "undefined") return "unknown";
  return localStorage.getItem(TRAFFIC_SRC_KEY) || "unknown";
}
```

Also extend `captureUtmParams()` to NOT strip `src` from the URL (keep the existing UTM stripping behavior — `src` is already non-UTM so it's preserved naturally; just call `captureTrafficSource()` alongside).

### 2. `src/components/AnalyticsProvider.tsx` — site-wide capture

In the existing route-change `useEffect`, call `captureTrafficSource()` before `trackPageView`, and include `traffic_source` in the page-view params. This makes every page on the site capture/persist `src` automatically — no per-page wiring needed.

```ts
const utm = captureUtmParams();
const traffic_source = captureTrafficSource() || "unknown";
trackPageView(location.pathname + location.search, title, {
  ...(utm as Record<string,string>),
  traffic_source,
});
```

### 3. `src/pages/Start.tsx` — fire `start_click`

Replace the local `src` read with `getTrafficSource()` and emit the GA4 event the user specified on the primary CTA click(s):

```ts
import { getTrafficSource } from "@/lib/utm";
...
trackEvent("start_click", { source: getTrafficSource() });
```

(Wire into the existing CTA handler that currently navigates to `/auth`.)

### 4. `src/pages/Auth.tsx` — fire `auth_visit`

On mount, emit:

```ts
trackEvent("auth_visit", { source: getTrafficSource() });
```

### 5. `src/contexts/AuthContext.tsx` — enrich `sign_up`

Add `source: getTrafficSource()` to the existing `gtag('event','sign_up', …)` payload so conversions are attributable to the originating flyer/campaign.

## Result

- Visiting `jobline.ai/start?utm_source=flyer&utm_campaign=wheatlands&src=wheatlands` (or any page with `?src=…`) persists `src` to `localStorage` for the lifetime of the browser.
- Every GA4 page_view, plus `start_click`, `auth_visit`, and `sign_up` events, carry `source` / `traffic_source`, enabling end-to-end campaign attribution in GA4 alongside the existing UTM funnel.
- Honors existing Consent Mode v2 (events only fire after gtag is initialized; analytics_storage gate already in place).
