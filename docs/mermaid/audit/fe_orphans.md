# Frontend Orphan Routes — Audit Report

Routes with **no inbound navigation edge** from any other page.

| Route | Component | Orphan Type | Severity | Notes |
|-------|-----------|-------------|----------|-------|
| `/donation-success` | DonationSuccess | Deeplink-only | Low | Only reachable via Stripe redirect. OK by design. |
| `/zach` | FounderRedirect | Deeplink-only | Low | Vanity URL, external sharing only. OK by design. |
| `/start` | Start | Potential orphan | Medium | No visible nav link from Landing or Dashboard. Appears to be an alternate onboarding entry. Needs CTA or removal. |
| `/setup` | Setup | Partial orphan | Medium | Only reachable post-signup via redirect logic in AuthContext, not via explicit nav link. Consider adding to onboarding flow. |
| `/machine-time-tracking` | MachineTimeTracking | SEO orphan | Low | Feature page outside `/features/` prefix. No nav link but intended for SEO landing. |
| `/shift-handoff` | ShiftHandoff | SEO orphan | Low | Same as above — SEO landing page. |
| `/manufacturing-visibility` | ManufacturingVisibility | SEO orphan | Low | Same as above — SEO landing page. |

## Summary
- **3 potential orphans** needing navigation links or removal (`/start`, `/setup`, 3 SEO pages outside `/features/`)
- **2 deeplink-only** routes (acceptable by design)
- **0 critical orphans** — all authed pages have auth gate redirects

## Recommendations
1. Move `/machine-time-tracking`, `/shift-handoff`, `/manufacturing-visibility` under `/features/` for consistency
2. Add `/start` to Landing page CTA or remove if redundant with `/auth`
3. Ensure `/setup` is documented as post-signup redirect only
