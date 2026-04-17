# GCA — G-Code Academy — Implementation Checklist

Last updated: 2026-04-17

Companion checklist to `docs/oap-implementation-checklist.md`. GCA is the
self-study CNC operator curriculum that **feeds into OAP** (pre-hire study
tool), and shares the same `training_media`, `inspection_tools`, and
`machining_operations` catalogs.

---

## 0. Status legend
- ✅ Done & shipped
- 🟡 Partially shipped / scaffold present
- 🔴 Not started
- ⏸ Blocked or deferred

---

## 1. Marketing & Public Surface

| Item | Status | Notes |
|---|---|---|
| `/g-code-academy` resource page | ✅ | `src/pages/resources/GCodeAcademy.tsx` — uses `useGcaAccess` |
| `/gca` landing page | ✅ | `src/pages/GCALanding.tsx` |
| Static study site (`public/gcode-academy/index.html`) | ✅ | Standalone HTML curriculum mirror — kept in sync via GCA_CONFIG |
| `/verify/:certId` public verification page | ✅ | Shared route — `src/pages/VerifyCertificate.tsx` |
| Comparison page vs. NIMS / Tooling U | 🔴 | |

---

## 2. Backend Schema — Already Live

| Table | Purpose | Status |
|---|---|---|
| `gca_subscriptions` | Per-user $19/mo or annual GCA Pro subscription | ✅ |
| `gca_progress` | Lesson/test progress sync from static site | ✅ (via `gca-progress-sync` edge fn) |
| `gca_professional_profiles` | Operator portfolio profile | ✅ |
| `gca_machine_experience` | Self-reported machine experience entries | ✅ |
| `gca_measurement_tools_tested` | Self-reported inspection tool experience | ✅ |
| `gca_accomplishments` | Awards / projects / certifications uploaded by operator | ✅ |

---

## 3. Backend Schema — Still Needed

| Table | Purpose |
|---|---|
| 🔴 `gca_question_banks` | Group questions by topic (Lathe G-codes, Mill controllers, GD&T, etc.) |
| 🔴 `gca_questions` | Individual MCQ / fill-in / drag-and-drop with media via `training_media` |
| 🔴 `gca_test_attempts` | Per-user attempt history with score & duration |
| 🔴 `gca_certificates` | GCA $12 certificates (mirrors `oap_certificates` schema) |

> Note: media is already polymorphic — `training_media_entity` enum already
> includes `gca_question` and `gca_question_bank`. Schema-time work is small.

---

## 4. Subscriptions & Pricing

| Item | Status | Notes |
|---|---|---|
| GCA monthly $19 + annual (Stripe) | ✅ | `GCA_PRICES` in `useGcaAccess.ts` |
| Standalone (no org) checkout flow | ✅ | `create-checkout` GCA branch |
| `useGcaAccess` hook (free vs Pro) | ✅ | Free users see locked content, Pro users full curriculum |
| GCA Pro included for org plans (single/team/enterprise) | ✅ | Verified in `useGcaAccess` |
| GCA $12 one-time certificate purchase | 🔴 | Brief calls for $12; price ID not wired |
| GCA add-on $49/mo per location for employers | 🔴 | |

---

## 5. Curriculum Coverage

10 test banks called for in the brief. Static site has the lesson content;
**none of the question banks are in the database yet** — they live as JSON in
the static site only.

| Bank | Static lessons | DB question bank | Media linked |
|---|:-:|:-:|:-:|
| Lathe Fundamentals | ✅ | 🔴 | 🔴 |
| Mill Fundamentals | ✅ | 🔴 | 🔴 |
| Fanuc controller | ✅ | 🔴 | 🔴 |
| Haas controller | ✅ | 🔴 | 🔴 |
| Mazak controller | ✅ | 🔴 | 🔴 |
| Okuma controller | ✅ | 🔴 | 🔴 |
| Siemens controller | ✅ | 🔴 | 🔴 |
| GD&T basics | ✅ | 🔴 | 🔴 |
| Speeds & Feeds | ✅ | 🔴 | 🔴 |
| Inspection & Metrology | ✅ | 🔴 | 🔴 |

---

## 6. Learner-Facing Rendering (in-app, beyond the static site)

| Item | Status | Notes |
|---|---|---|
| In-app lesson reader (markdown + media) | 🔴 | Currently the static site is the only player |
| In-app test player with immediate feedback | 🔴 | |
| Progress dashboard (lesson + test history) | 🟡 | `gca_progress` syncs; no UI surface |
| Embed `<MachiningOperationReference>` in lessons | 🔴 | Component exists; need lesson schema |
| Embed `<InspectionToolReference>` in lessons | ✅ | Component shipped — wire once lesson schema lands |

---

## 7. Certificate System (shared with OAP)

| Item | Status | Notes |
|---|---|---|
| `/verify/:certId` public page | ✅ | Shared with OAP — placeholder live, binds to cert tables next |
| GCA $12 cert PDF template | 🔴 | Same template engine as OAP |
| Cert ID + QR generation | 🔴 | Shared util |
| Stripe checkout — guest allowed | 🟡 | Infra ready; price ID needed |
| Email delivery via Resend | 🔴 | |

---

## 8. Profile / Portfolio (Operator-Facing)

| Item | Status | Notes |
|---|---|---|
| `gca_professional_profiles` CRUD | 🟡 | Table live; admin/profile UI TBD |
| Add machine experience row | 🟡 | Table live; UI TBD |
| Add inspection tool experience | 🟡 | Table live; UI TBD |
| Upload accomplishment with media | 🟡 | Table live; uploader TBD |
| Public shareable profile URL | 🔴 | "LinkedIn for machinists" angle |

---

## 9. Top 5 Next Actions

1. **Schema migration**: `gca_question_banks`, `gca_questions`, `gca_test_attempts` with RLS + canonical seed of 1 starter bank.
2. **Build `<InspectionToolReference>`** for lesson/question embeds (needed by both OAP & GCA).
3. **`/verify/:certId` page** — single public route shared by both programs.
4. **GCA in-app test player** — frees us from depending on the static site for assessments.
5. **Operator profile editor** — wire CRUD UI on top of existing `gca_*` profile tables.
