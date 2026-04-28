## Goals

User report on `/resources/oap` (and the parallel `/resources/gcode-academy`):
1. The OAP hero image still doesn't fit — it's a 1024×1024 square stretched into a wide slot, so "OAP" gets cropped.
2. Quick-start buttons (Get Certified, Employer Setup, Role Programs, Active Operators, etc.) don't visibly take the user anywhere — when the iframe is far below the fold, the view changes inside it but the page doesn't scroll there.
3. Some buttons map to the wrong OAP target.
4. Other learn-flow blockers in OAP/GCA pages.

---

## Fixes

### 1. Hero image fitting (OAP + GCA)

- Replace `object-cover` with `object-contain` on a fixed dark backdrop so the square OAP art and the 1920×1080 GCA art both sit fully visible at every viewport.
- Add explicit aspect ratios per breakpoint:
  - Mobile: `aspect-[16/9]` capped at `max-h-56`.
  - Desktop (`md+`): keep the side-by-side layout but use `aspect-[1.91/1]` so the image renders in social-card proportions and never overflows.
- Re-render `public/oap-og.jpg` and `public/gcode-academy-og.jpg` at the canonical **1200×630** OG ratio using the existing `api/og-image.ts` template (Variant B / light, brand wordmark + program badge, no mascot crop). Keep the originals as `*-square.jpg` for in-app cards that still want square art.

### 2. Quick-start buttons must actually take the user there

Currently `runQuickStart` calls `oapSetView`/`setView` on the iframe but never scrolls. On a 360 px viewport the iframe starts ~700 px down, so the change happens off-screen.

- After a successful `runQuickStart` (or after `pendingQuickStart` resolves on iframe load), call `iframeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })`.
- If the iframe `contentWindow` has not loaded yet, queue the target (already done) **and** scroll immediately so the loading iframe is visible while the requested view materializes.
- Add a brief focus ring + toast ("Opening Employer Setup…") so users get feedback even on slow networks.

### 3. Correct mismatched OAP targets

Audit current map vs. `oapSetView` signatures in `public/oap/src/oap-engine.js`:

| Button | Current call | Correct call |
|---|---|---|
| Get Certified | `oapSetView("standalone")` | ✅ keep |
| Employer Setup | `oapSetView("employer", "setup")` | ✅ keep |
| Role Programs | `oapSetView("program", "list")` | ✅ keep |
| Active Operators | `oapSetView("mentee", "list")` | ✅ keep |
| (new) Mentors | — | add `oapSetView("mentor", "list")` for parity with the in-iframe nav |

GCA targets are correct, but `metrology` currently sets test category `gdnt` even though the in-iframe "GD&T" button uses `setView('gdnt')` directly. Switch to `setView('gdnt')` so the user lands on the GD&T learning tab, not a filtered test list (which is what surprised users who clicked "GD&T and Metrology" expecting to learn).

### 4. Other learn-flow blockers

- **Iframe minimum height** on OAP currently forces 760 px even on a 600 px-tall phone, pushing the bottom of the embedded UI below the fold. Switch to `Math.max(window.innerHeight - (navH + barH), 480)` so on mobile the iframe matches the visible viewport (still scrollable inside) and on desktop it grows naturally.
- **Iframe focus loss**: when buttons run inside React, focus stays on the outer doc and Tab/Enter inside the iframe stops working. After scrolling, call `iframeRef.current?.focus()` so keyboard users can immediately operate the embedded UI.
- **`/resources/oap` "Verify Certificate" button** currently routes to `/oap/certificates/verify` — confirm that route exists; if not, point it at `/verify` (the unified page in `VerifyCertificate.tsx`). Same audit for the GCA page button (`/gcode-academy/certificates/verify`).
- **Mentors quick-start** is missing from the OAP bar even though it's a primary in-iframe nav item. Add it.
- **Pricing CTA on free tier** ("Unlock Pro") should preserve return path: change the `Link to="/pricing"` to `to={"/pricing?from=oap"}` (and `from=gca`) so post-checkout we can bring users back.

### 5. Print/PDF-gating sanity check

While in the verify page area, confirm the previously shipped paywall still renders correctly when a cert is unpaid (no regression from this PR's iframe layout changes).

---

## Files to change

- `src/pages/resources/OperatorAcceptanceProgram.tsx` — hero image classes, scroll-into-view + focus on quick-start, mentors button, height calc, return-path on Unlock Pro, verify route check.
- `src/pages/resources/GCodeAcademy.tsx` — same hero/scroll/focus fixes; `metrology` → `setView('gdnt')`; return-path on Unlock Pro.
- `public/oap-og.jpg`, `public/gcode-academy-og.jpg` — re-render at 1200×630 via `api/og-image.ts` (script run, not committed code).
- (If routes are wrong) `src/App.tsx` route alias for `/oap/certificates/verify` → `VerifyCertificate`.

No DB migrations, no edge-function changes.

---

## Verification

After implementation I'll:
1. View `/resources/oap` and `/resources/gcode-academy` at 360×640, 768×1024, and 1280×800 — confirm hero art is fully visible, no crop, buttons in tap range.
2. Click each quick-start and confirm the page smooth-scrolls to the iframe and the iframe shows the requested view.
3. Confirm OG meta tags render the new 1200×630 images on `/oap/app` and `/gcode-academy/app`.
4. Confirm `/verify/:certId` print/PDF gating is unchanged for unpaid certs.