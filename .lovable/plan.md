## Goal

1. One **Markdown file** is the single source of truth for subscription tiers (name, price, seats, benefits, add-ons). Pricing page, Concierge Sales Pack (screen + print), DOCX/PDF exports, and `/help` docs all render from it — edit once, reflects everywhere.
2. The Concierge Sales Pack gets a **Finalize & Save** step. The pack can be saved as a draft at any time and must be finalized before Print / Email / Export — finalizing locks editable fields and signatures so the saved master can't be tampered with.

## Where tiers live today

- Hardcoded in `src/hooks/useSubscription.ts` (`PRICING_TIERS`, `ERP_ADDON_TIERS`).
- Duplicated copy on `/pricing` (`"1 user"`, `"Up to 10 users"`, `"$12/seat/mo after"`).
- Copy-pasted again inside `src/lib/concierge/templates/contracts.ts` and the printable sheets.
- Sales Pack `Subscription & Seats` page only shows the *current* org's usage — it does NOT walk the rep through all tiers / benefits.

The plan removes those duplicates.

## 1 · Canonical Markdown source

New file `src/content/subscription-tiers.md` (authored once, edited by ops):

```text
---
currency: USD
billing: monthly
trial_days: 14
---

# single
name: Single User
price: 49
seats: 1
tagline: One operator, full dashboard.
benefits:
  - Full dashboard access
  - Unlimited handoff submissions
  - Performance update tracking
  - Real-time station monitoring
  - Email notifications
  - Mobile-friendly interface

# team
name: Team
price: 149
seats: 10
popular: true
…
```

Plus an `## Add-ons` section for `ERP Starter / Pro / Unlimited` and a `## FAQ` section reused by Pricing JSON-LD.

### Parser

`src/lib/subscriptionTiers.ts`:

- `import md from "@/content/subscription-tiers.md?raw"` (Vite SPA friendly — no runtime fs).
- Parse front-matter + each `# slug` block into:
  ```text
  TierDoc { slug, name, price, seats, tagline, benefits[], popular?, additionalSeatPrice? }
  ```
- Export `TIERS: TierDoc[]`, `ADDONS: AddonDoc[]`, `FAQ: { q, a }[]`, `META`.
- Provide `mergeWithStripe(TIERS)` that overlays Stripe `priceId / productId` from a small `tierIds.ts` constant so secrets / env-specific IDs stay in code, not in customer-editable Markdown.

### Refactor consumers

- `src/hooks/useSubscription.ts` — `PRICING_TIERS` is re-exported as the merged object (same shape; same `priceId` keys preserved).
- `src/pages/Pricing.tsx` — drop the hardcoded `"1 user"` / `"Up to 10 users"` strings; pull from `TIERS`. JSON-LD FAQ pulled from the `## FAQ` section.
- `src/components/EntitlementGate.tsx`, `src/components/machine/MachineMonitoringGate.tsx`, `src/components/settings/ERPConnectorSettings.tsx`, `src/components/admin/printables/printableSheets.ts` — all read from the merged object (no behaviour change, just less duplication).
- `src/lib/concierge/templates/contracts.ts` and `documentRegistry.ts` — tier comparison table inside the DOCX/PDF is generated from `TIERS` so saved exports always match the live Markdown.

## 2 · Tier walkthrough in the Sales Pack

In `src/pages/ConciergeSalesPack.tsx`:

- New print section **“Tier Comparison & Recommendation”** (added to the `SECTIONS` list, on by default):
  - Side-by-side card grid rendered from `TIERS` — name, price, seats, benefits, popular badge.
  - `Add-ons` row for ERP tiers.
  - A `<EditableField>` "Recommended tier & rationale" (auto-save per engagement) so the rep types why they're proposing Team vs Enterprise; prints inline.
- Existing **Subscription & Seats** page keeps the live seat ledger (data from `useConciergePrefill`) but now also shows the tier card pulled from Markdown above the ledger so screen + print + DOCX all read identically.

This page is rendered using the **same React components** that power `/pricing`, factored out as `<TierCard tier={…} />` in `src/components/marketing/TierCard.tsx`, so the marketing page and the sales pack can't drift.

## 3 · Finalize & Save (before Print / Email / Export)

### Data model

New table:

```text
public.concierge_pack_finalizations
  engagement_id uuid PK references onboarding_engagements(id)
  snapshot jsonb NOT NULL              -- full pack state (see below)
  status text NOT NULL                 -- 'draft' | 'finalized'
  finalized_by uuid, finalized_at timestamptz
  reopened_by uuid, reopened_at timestamptz, reopen_reason text
  pack_hash text                       -- sha256 of the snapshot for tamper detection
  created_at / updated_at
```

`snapshot` contains: selected sections, paper/orientation/copies, rep + JobLine signer info, billing email, rep talent URL, all `EditableField` values keyed by `fieldKey`, sealed-signature envelopes, recommended tier + rationale.

GRANTs + RLS:

- `GRANT SELECT, INSERT, UPDATE ON public.concierge_pack_finalizations TO authenticated;`
- RLS: platform admins + the assigned engagement admin can read/write.

### UI

`src/components/admin/concierge/ConciergeFinalizeBar.tsx` (new), mounted in the Sales Pack toolbar:

- **Save draft** — writes/upserts the snapshot with `status='draft'`. Toast: "Draft saved. Resume anytime from this engagement."
- **Finalize & Save Master** — confirmation modal listing what's locked (rep info, customer-needs fields, signatures, tier selection). On confirm: writes snapshot with `status='finalized'`, computes `pack_hash`, sets `finalized_by/_at`. Pushes the snapshot into the engagement's audit `notes` (`[finalize] ts — user — fields=N — hash=…`).
- After finalize the bar collapses to a **green "Finalized {date} by {name}"** card with **Print**, **Email to customer**, **Export PDF/DOCX** buttons enabled. **Re-open** button (admin-only, prompts for a reason → unsets `finalized_*`, records reopen audit).

### Locking

- `EditableField` already accepts `readOnly` — pass `readOnly={isFinalized}` from the page so every field collapses to its printed text after finalize.
- `SignaturePad` already supports a sealed lock; finalize sets `lockKey` for any pad whose canvas has ink that isn't already sealed, so accepting "Finalize" also seals every signature in one shot.
- `Print` / `Email` / `Export` buttons in the toolbar are disabled in `draft` mode and surface a tooltip: *"Save & Finalize first to lock the master copy."*

### Email & export wiring

- **Email**: reuse the existing `send-email` edge function with a new template (subject = `Concierge contract — {orgName}`, body links to the print URL + attaches the PDF the rep generated). The Email button is the *send* trigger, not the *generate* — generation still uses `window.print()` to PDF or the existing DOCX exporter in `documentRegistry.ts`. Email queue is logged to `email_send_log`.
- **Export PDF/DOCX**: existing `DocumentLibrary` flow stays; we just guard the buttons with `isFinalized`.

## Technical details

### Files added

```text
src/content/subscription-tiers.md                 # canonical tier source
src/lib/subscriptionTiers.ts                      # parser + types + mergeWithStripe
src/lib/tierIds.ts                                # stripe priceId/productId overlay
src/components/marketing/TierCard.tsx             # shared card used by /pricing + sales pack
src/components/admin/concierge/ConciergeFinalizeBar.tsx
src/hooks/useConciergeFinalization.ts             # load / save / finalize / reopen
supabase/migrations/<ts>_concierge_pack_finalizations.sql
```

### Files modified

```text
src/hooks/useSubscription.ts                      # PRICING_TIERS now mergeWithStripe(TIERS)
src/pages/Pricing.tsx                             # render TierCard list, FAQ from md
src/pages/ConciergeSalesPack.tsx                  # add Tier section, finalize bar, gate print/email/export
src/lib/concierge/templates/contracts.ts          # tier table from TIERS
src/lib/concierge/documentRegistry.ts             # uses same source
src/components/admin/concierge/EditableField.tsx  # already supports readOnly — wired from page
src/components/admin/concierge/SignaturePad.tsx   # already supports lock — finalize triggers it
src/components/EntitlementGate.tsx
src/components/machine/MachineMonitoringGate.tsx
src/components/settings/ERPConnectorSettings.tsx
src/components/admin/printables/printableSheets.ts
```

### Vite raw-md import

Tier markdown is loaded via `?raw` — no runtime `fs`, fully compatible with the SPA constraint.

### Migration sketch

```text
CREATE TABLE public.concierge_pack_finalizations (
  engagement_id uuid PRIMARY KEY REFERENCES public.onboarding_engagements(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','finalized')),
  finalized_by uuid, finalized_at timestamptz,
  reopened_by uuid, reopened_at timestamptz, reopen_reason text,
  pack_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.concierge_pack_finalizations TO authenticated;
GRANT ALL ON public.concierge_pack_finalizations TO service_role;
ALTER TABLE public.concierge_pack_finalizations ENABLE ROW LEVEL SECURITY;
-- policies: assigned admin OR has_role('admin'|'developer') can SELECT/UPSERT; only
-- has_role('admin'|'developer') can UPDATE rows already in 'finalized' state (reopen).
```

## Acceptance criteria

- Editing a value in `src/content/subscription-tiers.md` changes the displayed tier on `/pricing`, in the Sales Pack on-screen, in the printed Tier Comparison page, and in the DOCX export — without touching any TS file.
- The Sales Pack toolbar shows **Save draft** at all times and **Finalize & Save Master** when at least one signature is captured or the rep clicks anyway after a confirm.
- After finalize, all `EditableField`s, signatures, and signer-info inputs are read-only; Print / Email / Export buttons become enabled.
- Re-open requires an admin confirmation and a reason, and the reason lands in engagement `notes` + the finalization audit columns.
- Reloading the page after Save Draft restores every editable field, rep info, and unsigned-but-typed values.
- allow for full concierge CRUD until setup is accepted by owner in case other seat and users emails were incorrect or other issue

## Out of scope

- Storing the rendered PDF itself in Cloud storage — print/PDF still uses the browser's print dialog; emailing the PDF requires the rep to attach the generated file in the existing DocumentLibrary flow.
- Changing Stripe pricing — `priceId` / `productId` stay in `tierIds.ts`; the markdown only owns customer-facing copy.