

# Final Sweep — Verify Handbook + Full OAP/GCA/Certificate E2E

Wrap up the project: confirm the Handbook reference layer is wired and searchable everywhere it should be, then close every remaining gap in the OAP, GCA, and Certificate flows with end-to-end Playwright coverage.

## Part 1 — Handbook: make it a real wrapper system

The schema and `/handbook` + `/handbook/:slug` pages exist. What's missing is the **wrapper integration** so it actually serves as reference material across the app.

### 1a. Seed canonical handbook content
Idempotent migration inserts ~30 canonical references covering the categories operators actually need:
- **Materials** — 6061-T6, 7075, 304/316 SS, 4140, Ti-6Al-4V, brass, Delrin (machinability, SFM ranges, coolant notes)
- **Feeds & Speeds** — SFM tables for HSS/carbide × material, chip-load formulas
- **Threads** — UN/UNF/UNC tap drill chart, Metric coarse/fine, NPT
- **GD&T** — 14 symbols with definitions + when-to-use
- **Fits & Tolerances** — ANSI H7/g6 etc., shrink/press fits
- **Inspection** — micrometer/caliper/CMM use, gage R&R basics
- **Safety** — lockout/tagout, chip handling, coolant MSDS pointers

All inserted with `is_canonical=true`, `organization_id=NULL`, source citations to Machinery's Handbook 31st ed. where applicable.

### 1b. Wrapper integration (the "wrapper system" piece)
Embed `<HandbookCite>` at the touch points operators already use:
- **Speed & Feed Calculator** (`/operator-tools/speed-feed`) — sidebar "Reference: Feeds & Speeds" pulling links keyed to `entity_key='speed_feed_calculator'`.
- **Thread Selection** (`/operator-tools/thread-selection`) — sidebar pulling `entity_key='thread_selection'`.
- **GCA test player** (`/gca/test/:bankSlug`) — per-question footer "Related reference" via `entity_key='gca_question:<slug>'` (only renders if links exist).
- **OAP lesson view** (`/oap/walkthrough`, `/oap/courses/:slug`) — "Reference material" accordion below lesson body via `entity_id=<lessonId>` polymorphic link.
- **Inspection tools page** (if present) — auto-link by tool name.

### 1c. Global search
- Add `/handbook` to the global search (header search bar) so a user typing "tap drill 1/4-20" lands directly on the Threads entry.
- `useHandbook` already supports search; add a small `HandbookQuickSearch` component used in the header dropdown.

### 1d. Admin link manager
Lightweight `HandbookLinkManager` panel (in TrainingLibraryPanel → new "Handbook" tab) so a platform admin can attach/detach references to OAP lessons and GCA questions without writing SQL.

## Part 2 — Final OAP / GCA / Certificate E2E sweep

Land everything we've deferred and verify the full loop.

### 2a. Playwright spec — `e2e/cert-lifecycle.spec.ts`
Four scenarios against the seeded e2e org:
1. **Anonymous verify + PDF** — visit `/verify/:certId` (from `cert_paid` seed), assert diploma + digital variants render, click Download PDF, assert `.pdf` file lands.
2. **GCA grading without leak** — operator logs in, opens `/gca/test/lathe-fundamentals`, submits answers, asserts (a) `correct_answers` not in any network response before grading, (b) score returned, (c) review unlocks on second attempt.
3. **Employer free issuance** — org admin opens `/oap/employer`, enrolls operator, marks complete, issues free OAP cert via `CertificateIssuancePanel`, asserts cert appears at `/verify/:newCertId` with `valid_until = today + 12 months`.
4. **Transfer token redemption** — operator generates token from `/oap/my-transcript`, second org admin redeems via `OapRedeemTransferDialog`, asserts credential row appears in target org.

### 2b. Seed helper finishes
Update `e2e/helpers/seed.ts` `SeedScenario` type + interface to include `cert_paid` and `recert_lifecycle` (functions already exist in `seed-e2e/index.ts` from the prior pass — types just don't reflect them).

### 2c. Recert widget verification
Add a 5th Playwright assertion: after `recert_lifecycle` seed, `/oap/employer` shows the seeded operator in `OapRecertDueWidget` with "due in 7 days" and "Mark recertified" works.

### 2d. Final manual smoke checklist (documented in spec comments)
- $12 paid checkout end-to-end (Stripe test card)
- Free issuance email arrives (Resend)
- `/verify/:certId` prints cleanly (browser print + PDF download)
- Handbook search returns hits, citation cards render in GCA test footer

## Files

**New**
```text
supabase/migrations/<ts>_seed_canonical_handbook_content.sql
src/components/handbook/HandbookQuickSearch.tsx
src/components/handbook/HandbookLinkManager.tsx
e2e/cert-lifecycle.spec.ts
e2e/flows/cert.ts
```

**Modified**
```text
src/pages/operator-tools/SpeedFeedCalculator.tsx       (HandbookCite sidebar)
src/pages/operator-tools/ThreadSelection.tsx           (HandbookCite sidebar)
src/pages/GcaTestPlayer.tsx                            (per-question footer references)
src/pages/OapWalkthrough.tsx                           (lesson reference accordion)
src/components/layout/Header.tsx                       (mount HandbookQuickSearch)
src/components/admin/training-library/TrainingLibraryPanel.tsx  (Handbook tab)
e2e/helpers/seed.ts                                    (cert_paid, recert_lifecycle types)
```

## Verification

1. `supabase--linter` after migration → zero new errors.
2. As operator: `/operator-tools/speed-feed` shows "Reference: Feeds & Speeds" sidebar with 2-3 cite cards linking to `/handbook/...`.
3. Header search "tap drill" → Handbook entry suggestion appears, click navigates to entry page.
4. Run `e2e/cert-lifecycle.spec.ts` headlessly → all 5 scenarios green.
5. Network sniff GCA test submit → `correct_answers` absent.
6. `/verify/:certId` PDF download produces valid file ≥30KB.

## Out of scope

- Importing the full Machinery's Handbook (copyright); we cite + summarize public-domain formulas and standards only.
- Replacing the existing operator tool calculation engines.
- Multi-language handbook content.

