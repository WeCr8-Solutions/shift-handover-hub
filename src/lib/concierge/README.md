# Concierge Sales Pack

Source of truth for every printable, downloadable, and e-signable document
JobLine staff and customers use during a Concierge engagement.

Stack rules from `.workspace/AGENTS.md` apply: no speculative abstractions,
prefer editing existing files, lazy-loaded pages, React Query for any
Supabase reads. Renderers are pure (no network), so they stay testable.

---

## Two surfaces, one registry

The same `CONCIERGE_DOCUMENTS` registry powers both flows:

| Surface | Route | Audience | Data |
|---|---|---|---|
| Blank employee pack | `/admin/concierge/print` | JobLine staff intake, training, walk-in calls | `defaultContext()` — placeholder customer, blank worksheet rows |
| Org-filled pack | `/admin/concierge/print/:engagementId` | The specific customer org being onboarded | `engagementContext(engagement)` + `useConciergePrefill(orgId)` |

Both render through the same components in `ConciergeSalesPack.tsx` and the
same renderers in `./renderers/`. The only difference is the context
object and the prefill rows that hydrate `WorksheetTable`.

```
ConciergeQuickActions ─┐
DocumentLibrary ───────┼─▶ /admin/concierge/print[/:engagementId]
CustomerSuccessPanel ──┘            │
                                    ▼
                       ConciergeSalesPack.tsx
                                    │
            ┌───────────────────────┼────────────────────────┐
            ▼                       ▼                        ▼
   documentRegistry.ts     useConciergePrefill         renderers/*
   (titles + builders)     (org → rows + subs)         (pdf/docx/xlsx)
            │                       │
            ▼                       ▼
   templates/contracts.ts   Supabase: equipment, stations,
   intakeColumns.ts         departments, members, routing,
                            quality_checkpoints, erp_connections,
                            subscriptions, entitlements,
                            organization_invites, organizations
```

---

## Document kinds

Defined in `documentRegistry.ts`:

- **contract** — MSA, ITAR/US-Person declaration, mutual NDA, payment instructions.
  Built from `templates/contracts.ts`; rendered as **PDF + DOCX**.
- **worksheet** — Intake sheets (equipment, stations, users, routing, quality,
  subscription seats). Columns come from `intakeColumns.ts` to stay 1:1 with the
  in-app fields. Rendered as **XLSX + PDF**.
- **sop** — Internal staff playbooks (onboarding, post-go-live handoff).
  Staff-only, **PDF + DOCX**.
- **reference** — Payment instructions and other "leave-behind" docs.

Every entry declares `engagementAware`. If `true`, the doc inlines org data
when a context is supplied and falls back to blanks otherwise — so a single
template covers both surfaces.

---

## Org prefill (full e2e)

`src/hooks/useConciergePrefill.ts` aggregates the live org footprint:

| Worksheet | Source tables |
|---|---|
| Equipment | `equipment` |
| Stations | `stations`, `departments` |
| Users | `organization_members` → `profiles` |
| Routing | `routing_templates` + `routing_template_steps` |
| Quality | `quality_checkpoints` |
| ERP | `erp_connections` (persistence mode + base URL prechecked) |
| Subscription & Seats | `subscriptions`, `entitlements`, `organizations`, `organization_invites` |

`WorksheetTable` renders prefilled rows first, then pads with blank rows so
staff can still write in by hand. A summary banner per section confirms how
many records were pulled.

The cover page also renders `billing_email`, billing address, tax ID, plan
tier, invoice number, and subscription status pulled from the engagement
join in `useOnboardingEngagements.ts`.

---

## Rendering pipeline

`renderDocument(doc, format, ctx)` is the only entry point.

- `renderers/renderPdf.ts` — pdf-lib, embedded Helvetica, page footer from
  `buildFooter(ctx)`.
- `renderers/renderDocx.ts` — docx (browser build), same content shape.
- `renderers/renderXlsx.ts` — exceljs, frozen header row, column widths
  driven by `INTAKE_COLUMNS[key]`.

`downloadBlob` + `filenameFor` produce a deterministic filename:
`jobline_<docKey>_<customerSlug>.<format>`.

---

## Adding a new document

1. Add the template builder to `templates/contracts.ts` (or a new file) and
   export it as `(ctx: ContractContext) => DocContent`.
2. Register it in `CONCIERGE_DOCUMENTS` with the correct `audience`, `kind`,
   `formats`, and `engagementAware` flag.
3. If it's a worksheet, add its column list to `intakeColumns.ts` and map
   the org rows inside `useConciergePrefill.ts`.
4. If the doc is org-specific, surface it in `ConciergeSalesPack.tsx`'s
   `SECTIONS` array so it appears in the print view.

No new routes are needed — both surfaces pick it up automatically.

---

## ITAR / security

- The print routes are admin-gated (`useAdminAccess` upstream); they never
  appear to operators or unauthenticated users.
- The org-filled pack only reads tables already protected by org-scoped
  RLS. The hook never widens access; if an admin can't read a table, the
  worksheet falls back to blank rows.
- ITAR orgs (`requires_us_person_declaration=true`) automatically include
  the US-Person declaration on the cover and force read-through on the ERP
  worksheet, matching the DB trigger in `enforce_itar_read_through`.
- Generated files are produced in-browser. No PDFs, DOCX, or XLSX bytes
  are ever sent back to Supabase or logged.

---

## Files

```
src/lib/concierge/
├── README.md                    ← this file
├── documentRegistry.ts          ← registry + render() + filename helpers
├── intakeColumns.ts             ← worksheet column definitions
├── renderers/
│   ├── renderPdf.ts
│   ├── renderDocx.ts
│   └── renderXlsx.ts
└── templates/
    └── contracts.ts             ← MSA, ITAR, NDA, payment, SOPs

src/components/admin/concierge/
└── DocumentLibrary.tsx          ← grid UI used inside the panel

src/components/admin/customer-success/
└── ConciergeQuickActions.tsx    ← top-level reusable employee shortcuts

src/pages/
└── ConciergeSalesPack.tsx       ← print view (blank + :engagementId)

src/hooks/
├── useConciergePrefill.ts       ← org → worksheet rows + subscription
└── useOnboardingEngagements.ts  ← engagement + org join for the cover
```
