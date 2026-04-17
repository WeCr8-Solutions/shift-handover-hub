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
| Sample certificate preview on landing | ✅ | `<CertificatePreview program="GCA">` in GCALanding |
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

## 3. Backend Schema — Migration #2 ✅ shipped 2026-04-17

| Table | Purpose | Status |
|---|---|---|
| `gca_question_banks` | Group questions by topic (Lathe G-codes, Mill controllers, GD&T, etc.) | ✅ + Lathe Fundamentals seeded |
| `gca_questions` | Individual MCQ / fill-in / drag-and-drop with media via `training_media` | ✅ + 3 starter questions |
| `gca_test_attempts` | Per-user attempt history with score & duration | ✅ |
| `gca_certificates` | GCA $12 certificates (mirrors `oap_certificates` schema) | ✅ |

> Media is polymorphic — `training_media_entity` already includes `gca_question` and `gca_question_bank`, plus the new `gca_certificate`.

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
| `/verify/:certId` public page | ✅ | Shared with OAP — bound to live `gca_certificates` table |
| Branded cert template | ✅ | `<CertificateTemplate>` (shared) — `program="GCA"` accent variant |
| Cert ID generator (`GCA-XXXXXX-YYYY`) | ✅ | `src/lib/certificates.ts` (shared) |
| Issuance edge function | ✅ | `issue-certificate` (shared) — pass `program: "GCA"` |
| Stripe `$12` checkout (guest allowed) | 🟡 | Infra ready; cert-specific price ID + webhook glue still TODO |
| Email delivery via Resend | ✅ | HTML receipt with cert ID + verify URL on issue |
| PDF attachment | 🟡 | Pending headless render pipeline — `<CertificateTemplate>` already prints clean |

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

## 9. Remaining Work — Snapshot 2026-04-17

**Roughly ~45% remaining** to fully replace the static site with an in-app GCA experience. Auth, subscriptions, schema, certs, and marketing are done. What remains is **content + in-app learner UI + portfolio surface**.

### High-priority
1. **Seed 10 question banks** (Lathe, Mill, Fanuc, Haas, Mazak, Okuma, Siemens, GD&T, Speeds & Feeds, Inspection) into `gca_question_banks` / `gca_questions` — currently only Lathe Fundamentals (3 Q) is seeded.
2. **In-app test player** with immediate feedback against `gca_test_attempts`.
3. **In-app lesson reader** (markdown + media) so we no longer depend on the static site.
4. **Stripe $12 cert checkout** (guest-allowed) → `issue-certificate` with `program: "GCA"`.

### Medium-priority
5. **Operator profile editor** — CRUD UI on `gca_professional_profiles`, `gca_machine_experience`, `gca_measurement_tools_tested`, `gca_accomplishments`.
6. **Public shareable profile URL** ("LinkedIn for machinists").
7. **Progress dashboard** surfacing `gca_progress` data.
8. **Embed `<MachiningOperationReference>`** in lesson schema once authored.

### Nice-to-have / polish
- GCA add-on ($49/mo per location) packaging on `/pricing`.
- Comparison page vs. NIMS / Tooling U.
- PDF attachment in cert email (shared headless-render pipeline with OAP).
