# OAP — Operator Acceptance Program — Implementation Checklist

Last updated: 2026-04-17

Source of truth for the OAP build. Cross-references `docs/jobline-oap-lovable-brief.md`,
`docs/training-library.md`, and `docs/machining-operations.md`.

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
| `/oap` landing page | ✅ | `src/pages/OAPLanding.tsx` — hero, value props, FAQ, JSON-LD `Course` schema |
| OG image / SEO meta | ✅ | `oap-og.jpg`, canonical, keywords |
| Pricing card on `/pricing` | 🟡 | Tier copy present; verify $99 / $299 / $599 / Enterprise rows match brief |
| `/verify/:certId` public verification page | ✅ | `src/pages/VerifyCertificate.tsx` — placeholder UI live; wires to cert tables in next migration |
| "Why OAP" comparison vs. NIMS / paper binders | 🟡 | Copy on landing; could promote to `/compare/oap-vs-nims` |

---

## 2. Catalogs & Library (shared with GCA)

| Item | Status | Notes |
|---|---|---|
| Inspection tool catalog (60+ canonical) | ✅ | `inspection_tools` + `<InspectionToolsCatalog>` |
| Machining operations catalog (50+ canonical) | ✅ | `machining_operations` + `<MachiningOperationsCatalog>` |
| Polymorphic `training_media` (AVIF/GIF/JPG/PNG/MP3/M4A/MP4/WebM/MOV) | ✅ | Public + private buckets, signed URLs, MIME trigger |
| Org overrides (hide / required-for-roles) | ✅ | `<OrgOverridesPanel>` covers tools + ops |
| Bulk tag editor (platform admin) | ✅ | `<BulkTagPanel>` |
| `<MachiningOperationReference>` embed | ✅ | `src/components/training/MachiningOperationReference.tsx` |
| `<InspectionToolReference>` embed | ✅ | `src/components/training/InspectionToolReference.tsx` |

---

## 3. Backend Schema — Already Live

| Table | Purpose | Status |
|---|---|---|
| `oap_designated_mentors` | Per-org mentor authorization (who can sign off what) | ✅ |
| `oap_walkthrough_sections` | Section grouping (Safety / Measuring / Tooling / Machine Qual / Floor Cert) | ✅ |
| `oap_walkthrough_items` | Individual check-off items inside a section | ✅ |
| `oap_walkthrough_sessions` | A specific operator going through a walkthrough | ✅ |
| `oap_walkthrough_checkoffs` | Per-item Pass / Needs Practice / Fail + mentor sig + timestamp | ✅ |
| `inspection_tools`, `machining_operations`, `training_media` | Reusable training assets | ✅ |

---

## 4. Backend Schema — Still Needed

| Table | Purpose |
|---|---|
| 🔴 `oap_courses` | The 7 OAP sections as authored courses (Orientation / Safety / Material / Measure / Tool / Machine / Floor) |
| 🔴 `oap_lessons` | Lesson content within a course (markdown body + media via `training_media`) |
| 🔴 `oap_quizzes` + `oap_quiz_questions` + `oap_quiz_attempts` | Pass/fail comprehension testing |
| 🔴 `oap_role_programs` | Employer-defined OAP curriculum per role (e.g. "Lathe Op = these courses + these machines") |
| 🔴 `oap_enrollments` | Operator → role program assignment + start/expected/completed dates |
| 🔴 `oap_certificates` | Issued certs with cert_id, qr token, valid_from / valid_until, status |
| 🔴 `oap_certificate_items` | Machines / tools / safety creds listed on each cert |

---

## 5. Learner-Facing Rendering

| Item | Status | Notes |
|---|---|---|
| Course catalog page (free, no auth) | 🔴 | Must show all 7 sections + sample lessons |
| Lesson player (markdown + embedded `<TrainingMedia>` / `<MachiningOperationReference>`) | 🔴 | Wire via the existing media layer once `oap_lessons` exists |
| Quiz player with immediate feedback | 🔴 | |
| Walkthrough check-off screen (mentor view) | 🔴 | Backend tables exist; UI not built — top priority for employer demo |
| Operator self-progress dashboard | 🔴 | |
| Sticky "Get my certificate ($12)" CTA after threshold | 🔴 | |

---

## 6. Mentor & Employer Surface

| Item | Status | Notes |
|---|---|---|
| Designated mentor registry | 🟡 | Table exists; admin UI to add/revoke not built |
| Mentor sign-off auth (supervisor OR designated mentor) | 🟡 | RLS in place; UI gating still TODO |
| Employer program builder (pick courses + machines + tools per role) | 🔴 | Depends on §4 tables |
| Employer dashboard (who's behind / completed / due for recert) | 🔴 | |
| Bulk operator import (CSV) — Pro tier | 🔴 | |
| Compliance export (audit-ready PDF per operator) | 🔴 | AS9100, ISO 9001, OSHA |

---

## 7. Certificate System

| Item | Status | Notes |
|---|---|---|
| Cert template (PDF, portrait 8.5x11, dark pro aesthetic) | 🔴 | |
| Cert ID generator (`CERT-XXXXXX-YYYY` + QR token) | 🔴 | |
| `/verify/:certId` page (public, no auth) | ✅ | Live placeholder; binds to cert tables next |
| Stripe `$12` one-time checkout (guest allowed) | 🟡 | Stripe infra in place; specific OAP cert price ID not wired |
| Email delivery with PDF attachment | 🔴 | Use existing `send-email` Resend infra |
| Shareable link + LinkedIn-ready URL | 🔴 | |
| Revoke / expire flow | 🔴 | |

---

## 8. Subscriptions & Billing

| Item | Status | Notes |
|---|---|---|
| Stripe products + prices for OAP tiers | 🟡 | Single/Team/Enterprise live; verify Starter ($99) and Shop ($299) are seeded |
| 14-day trial enforcement | ✅ | See `mem://features/subscription/governance-and-trial-enforcement` |
| Day-10 + day-13 trial reminder emails | 🔴 | |
| Self-serve cancel from account settings | ✅ | Already enforced in subscription mgmt |
| Annual discount (2 months free) display | 🟡 | Verify on `/pricing` |
| GCA add-on ($49/mo per location, free at Shop+) | 🔴 | |

---

## 9. The 7 OAP Sections — Content Coverage

| Section | Catalog wired | Lessons authored | Quiz authored | Walkthrough items |
|---|:-:|:-:|:-:|:-:|
| 1. Company Orientation | n/a | 🔴 | 🔴 | 🔴 |
| 2. Safety & EHS | 🔴 | 🔴 | 🔴 | 🔴 |
| 3. Material Handling | 🔴 | 🔴 | 🔴 | 🔴 |
| 4. Measurement & Inspection | ✅ (60+ tools) | 🔴 | 🔴 | 🔴 |
| 5. Tooling & Preset | 🟡 (via machining ops typical_tooling) | 🔴 | 🔴 | 🔴 |
| 6. Machine Qualification | ✅ (50+ ops, machine_tags) | 🔴 | 🔴 | 🔴 |
| 7. Floor Certification | n/a | 🔴 | 🔴 | 🔴 |

---

## 10. Top 5 Next Actions

1. **Build `<InspectionToolReference>`** (mirror of `<MachiningOperationReference>`) so OAP lessons can embed any tool by slug.
2. **Build the mentor walkthrough check-off UI** against the existing `oap_walkthrough_*` tables — fastest path to an employer demo.
3. **Schema migration #2**: `oap_courses`, `oap_lessons`, `oap_quizzes`, `oap_quiz_questions` with RLS + canonical seed.
4. **Cert system MVP**: `oap_certificates` table + `/verify/:certId` public page + Stripe $12 product wired.
5. **Designated mentor admin UI** in the org settings panel.
