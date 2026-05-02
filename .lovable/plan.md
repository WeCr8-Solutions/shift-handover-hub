
## Why AdSense rejected jobline.ai

The screenshot shows two AdSense gates: site ownership is verified, but the site is flagged for **"Low value content / thin content / minimum content requirements."** This is *not* a code bug — every required pipe (script, ads.txt, AdPlacement component, publisher ID `ca-pub-3639153716376265`) is wired correctly:

- `index.html` lazy-loads `adsbygoogle.js` after first interaction (correct)
- `public/ads.txt` is valid (`google.com, pub-3639153716376265, DIRECT, f08c47fec0942fa0`)
- `<meta name="google-adsense-account">` present
- `AdPlacement.tsx` pushes `adsbygoogle` correctly with publisher ID hardcoded
- AdPlacement is already imported in **60+ marketing pages** (Landing, Pricing, Blog, all `/features/*`, all `/compare/*`, all `/resources/*`, Help, HelpArticle)

The AdSense reviewer is rejecting because the **content** doesn't yet pass their bar, not because of integration. We need to (1) plug the remaining content/UX gaps that trigger "thin content," (2) extend ads to a few surfaces still missing them, and (3) lock in a guarantee that the authenticated app stays ad-free.

---

## Plan

### 1. Fix the AdSense policy gate (the actual blocker)

Audit each marketing surface against AdSense's published thin-content checklist and remediate:

- **Add ads to public surfaces still missing them** (currently no `AdPlacement`):
  - `src/pages/HandbookLibrary.tsx` (1 horizontal mid-content)
  - `src/pages/HandbookEntry.tsx` (1 horizontal between sections, 1 rectangle near end)
  - `src/pages/resources/GCodeAcademy.tsx` (public marketing variant only)
  - `src/pages/resources/OperatorAcceptanceProgram.tsx`
  - `src/pages/Demo.tsx`, `src/pages/Tools.tsx` (public calculator landing — 1 horizontal above-the-fold-safe)
  - `src/pages/CertificateLookup.tsx` and `src/pages/VerifyCertificate.tsx` (public verify page — 1 horizontal in footer area only, never near the certificate itself per AdSense placement policy)
  - All `/industries/*` pages
- **Required policy pages** (AdSense explicitly checks for these — confirm and link from footer if missing):
  - `/privacy`, `/terms`, `/cookies`, `/about`, `/contact`. We already have most; verify each is reachable from the public footer in **≤2 clicks** and contains real (not placeholder) content.
- **Fix `index.html` placeholder verification meta tags** that currently say `content="YOUR_CODE"` — these flag automated reviewers as "abandoned/template" content. Either delete or fill with the real Search Console / Bing / Pinterest / Facebook IDs (we'll delete the placeholders and leave only the real `google-adsense-account` tag).
- **Strengthen thin pages**: short feature pages get an "FAQ + related guides + author byline + last-updated date" block (reuse our existing handbook/help components). Target 800+ words of unique copy per indexed page.
- **Author + freshness signals**: add `author` + `datePublished`/`dateModified` JSON-LD to all blog posts and feature pages (Schema.org `Article`).
- **Navigation/UX**: ensure every public page has the marketing header + footer with working About/Contact/Privacy/Terms links (AdSense reviewers click these).

### 2. Extend coverage on already-equipped marketing pages

- Add a second `AdPlacement` (`format="rectangle"`) near the end of long-form blog posts (`src/pages/Blog.tsx` post template + MDX layout) so per-page revenue isn't capped at one impression.
- Add `slot` IDs per page-group (one per: landing, pricing, blog, features, resources, handbook, help) so RPM is reportable in AdSense.

### 3. Hard guarantee: app surfaces stay ad-free

The current "rule" lives only in a comment in `AdPlacement.tsx`. Make it enforceable:

- Add a build-time **ESLint rule** (custom `no-restricted-imports` pattern) that forbids importing `@/components/marketing/AdPlacement` from any path under:
  - `src/pages/Index.tsx`, `Dashboard*`, `Queue*`, `Teams*`, `Settings*`, `Admin*`, `Profile*`, `Setup*`, `Testing*`, `Updates*`, `FieldView*`, `OapHub`, `OapCoursePlayer`, `OapWalkthrough`, `OapMyTranscript`, `OapEmployer`, `GcaEmployer`, `GcaTestPage`, `CertSuccess`, `DonationSuccess`, `display/*`, `dev/*`, `handoff/*`
  - All files under `src/components/dashboard/`, `src/components/handoff/`, `src/components/queue/`, `src/components/admin/`, `src/components/oap/` (authenticated paths)
- Add a runtime guard in `AdPlacement` that returns `null` if `useAuth().user` is set **and** the route matches an authenticated prefix (defensive — covers cases where the same component renders in both contexts).
- Add a Vitest snapshot test asserting `AdPlacement` is never rendered when `user` is authenticated on `/dashboard`, `/queue`, `/handoff`, `/admin`, `/settings`, `/teams`, `/profile`, `/setup`.

### 4. After the fixes — request review

Document the resubmission steps in `.lovable/prd/12-ad-placement-strategy.md`:
1. Deploy.
2. Crawl-check via `https://search.google.com/search-console` URL inspection on 5 sample marketing pages.
3. In AdSense → Sites → jobline.ai → "I confirm I have fixed the issues" → Request review.
4. Expect 2–4 week review window.

---

## Technical details

**Files to edit**
- `index.html` — remove `YOUR_CODE` placeholder meta tags.
- `src/components/marketing/AdPlacement.tsx` — add `useAuth` + authenticated-route guard.
- `src/pages/HandbookLibrary.tsx`, `HandbookEntry.tsx`, `Demo.tsx`, `Tools.tsx`, `CertificateLookup.tsx`, `VerifyCertificate.tsx`, `resources/GCodeAcademy.tsx`, `resources/OperatorAcceptanceProgram.tsx` — add `AdPlacement`.
- `src/pages/Blog.tsx` + MDX post template — add second rectangle ad slot, add Article JSON-LD.
- `src/pages/Landing.tsx` footer — verify About/Contact/Privacy/Terms link visibility.
- `eslint.config.js` — add `no-restricted-imports` group banning `AdPlacement` from authenticated paths.
- `.lovable/prd/12-ad-placement-strategy.md` — document slot IDs, resubmission flow, and the new ESLint guard.
- New: `src/components/marketing/AdPlacement.test.tsx` — guard test.

**No DB / edge function / migration changes.** ITAR build (`VITE_DISABLE_ANALYTICS=true`) continues to suppress all ad code.

**Out of scope** (separate work if desired): ad-personalization consent banner extensions, GDPR ad consent strings beyond the existing Consent Mode v2 setup.
