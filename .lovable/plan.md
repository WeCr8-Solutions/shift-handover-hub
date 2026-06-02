# Work Order Traveler — Printable ISO 9001 Sheet

Add a printable physical traveler for each work order so the shop floor gets a paper packet that satisfies ISO 9001 traceability (barcodes, signatures, revision, serial numbers).

## What gets built

**1. Org-level traveler branding (reusable)**
- New table `organization_traveler_settings` (org-scoped, RLS): logo path, company name line, footer text, default paper size (Letter/A4), show/hide sections toggles.
- New private storage bucket `traveler-branding` with org-scoped RLS (path `{org_id}/logo.*`). Upload once, reused on every print.
- Settings UI lives at **Settings → Work Orders → Traveler Template** (Org Admin / Supervisor): logo upload + preview, header/footer text, default paper color mapping per priority.

**2. Priority → paper color picker**
- At print time, supervisor picks priority color (Critical=Red, Urgent=Orange, High=Yellow, Normal=White, Low=Blue) — defaults pulled from the WO's priority but overridable.
- Renders as a colored top band + side stripe so it's visible even on white paper, and is labeled "Print on RED paper" so the operator knows which tray to pull from.

**3. The traveler layout** (single page, A4/Letter, print-optimized CSS)
- **Header band**: company logo (left), "WORK ORDER TRAVELER" title, priority color stripe, ISO 9001 doc-control footer (rev, printed-by, printed-at).
- **Barcodes (top right)**: Work Order # as Code128 + QR (QR encodes a deep link to the WO in-app for scan-to-open on a tablet). Part Number as Code128.
- **Work Order Info**: WO number, first operation number, release date, due date, group, counter, order qty, start date.
- **Part Info**: part number, part description/name, material group.
- **Product Grouping** section.
- **Routing / Operations table**: step #, op name, station, est. duration, operator sign-off box, qty good / qty scrap / date.
- **Serial Numbers**: pulled from `work_order_serials` if any are assigned; otherwise renders blank numbered rows = order qty (up to a cap).
- **Comments / Special Instructions** (free text from WO + a blank ruled area for floor notes).
- **Sign-off block**: Released by / Inspected by / Closed by with date lines (ISO 9001).

**4. Print entry point**
- "Print Traveler" button on the Work Order detail page and as a bulk action in the queue list.
- Opens `/work-orders/:id/traveler?color=red` in a new tab → auto-triggers `window.print()` after fonts/barcodes render. Dedicated route uses a `<PrintLayout>` shell (no app chrome, `@media print` rules).

## Technical notes

- Barcodes: `bwip-js` for Code128, `qrcode` (already common in this stack) for the QR — both render to `<canvas>` client-side, no server round-trip.
- Pure frontend feature; only backend additions are the settings table + storage bucket. No changes to existing WO data model.
- Reuses `useUnifiedQueue` / existing WO fetch hooks — read-only against `queue_items`, `work_order_routing`, `work_order_serials` (if missing, falls back to empty serial slots).
- Uses semantic tokens from `index.css` for screen preview; print CSS uses explicit CMYK-safe hex for the priority stripe so colors are predictable on a real printer.
- ITAR orgs: traveler footer auto-stamps "ITAR — US Persons Only" when `requires_us_person_declaration=true`.
- Route is auth + org-scoped; no public access.

## Files

New:
- `supabase/migrations/<ts>_traveler_settings.sql` — table + bucket policies
- `src/components/work-orders/traveler/TravelerSheet.tsx` — the printable layout
- `src/components/work-orders/traveler/TravelerBarcodes.tsx` — Code128 + QR
- `src/components/work-orders/traveler/TravelerBrandingSettings.tsx` — org admin upload UI
- `src/pages/WorkOrderTraveler.tsx` — `/work-orders/:id/traveler` print route
- `src/hooks/useTravelerSettings.ts`
- `src/hooks/useWorkOrderTraveler.ts` — fetches WO + routing + serials in one query

Edited:
- `src/App.tsx` — lazy route
- Work Order detail page — "Print Traveler" button + color picker dialog
- Queue list — bulk "Print Travelers" action
- Settings nav — add Traveler Template entry

## Open questions

1. Do you already track serial numbers per WO anywhere (a `work_order_serials` table, or in `queue_items.metadata`)? If not, I'll render blank numbered rows = order qty and add the table in a follow-up.
2. Paper size default — Letter (US) or A4? I'll default to Letter and make it org-configurable.
3. Should the QR code deep-link open the operator station view, or the supervisor WO detail view? I'll default to operator station for shop-floor scanning.
