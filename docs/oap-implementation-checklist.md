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
| `/verify/:certId` public verification page | ✅ | `src/pages/VerifyCertificate.tsx` — bound to live `oap_certificates` |
| Sample certificate preview on landing | ✅ | `<CertificatePreview program="OAP">` in OAPLanding |
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

## 4. Backend Schema — Migration #2 ✅ shipped 2026-04-17

| Table | Purpose | Status |
|---|---|---|
| `oap_courses` | The 7 OAP sections as authored courses | ✅ + 7 seeded |
| `oap_lessons` | Lesson content within a course (markdown + media via `training_media`) | ✅ + 1 starter lesson per course |
| `oap_quizzes` + `oap_quiz_questions` + `oap_quiz_attempts` | Pass/fail comprehension testing | ✅ + sample Safety quiz (3 Q) |
| `oap_role_programs` + `oap_role_program_courses` | Employer-defined OAP curriculum per role | ✅ |
| `oap_enrollments` | Operator → role program assignment + start/expected/completed dates | ✅ |
| `oap_certificates` | Issued certs with cert_id, qr token, valid_from / valid_until, status | ✅ |
| `oap_certificate_items` | Machines / tools / safety creds listed on each cert | ✅ |

`training_media_entity` enum extended with `oap_course`, `oap_lesson`, `oap_quiz_question`, `oap_certificate`, `gca_certificate`.

---

## 5. Learner-Facing Rendering

| Item | Status | Notes |
|---|---|---|
| Course catalog page (free, no auth) | ✅ | `/oap/learn` — `<OapHub>` lists all 7 sections + progress + cert CTA |
| Lesson player (markdown + embedded `<TrainingMedia>` / `<MachiningOperationReference>`) | ✅ | `/oap/learn/:courseSlug/:lessonSlug` — `<OapCoursePlayer>` with `<OapMarkdown>` |
| Quiz player with immediate feedback | ✅ | `<QuizPlayer>` — single/multi/true-false, scored client-side, persisted to `oap_quiz_attempts` |
| Walkthrough check-off screen (mentor view) | ✅ | `/oap/walkthrough` — section-by-section pass/needs-practice/fail with typed mentor signature |
| Operator self-progress dashboard | ✅ | `<OapHub>` — quizzes passed, attempts, enrollments, est. time |
| Sticky "Get my certificate ($12)" CTA after threshold | ✅ | `<OapHub>` shows CTA at ≥50% completion |

---

## 6. Mentor & Employer Surface

| Item | Status | Notes |
|---|---|---|
| Designated mentor registry | ✅ | `<OapMentorAdminPanel>` in Training Library admin → OAP Mentors tab |
| Mentor sign-off auth (supervisor OR designated mentor) | ✅ | `can_act_as_oap_mentor()` enforced in RLS + UI gating live in `/oap/walkthrough` |
| Employer program builder (pick courses + machines + tools per role) | ✅ | `/oap/employer` — `<OapEmployerPanel>` writes to `oap_role_programs` + `oap_role_program_courses` |
| Employer dashboard (who's behind / completed / due for recert) | ✅ | `<OapEmployerPanel>` — enrollments list with overdue badge from `expected_completion_at` |
| Bulk operator import (CSV) — Pro tier | 🔴 | Single-row enroll live; CSV importer pending |
| Compliance export (audit-ready PDF per operator) | 🔴 | AS9100, ISO 9001, OSHA |

---

## 7. Certificate System

| Item | Status | Notes |
|---|---|---|
| Branded cert template (8.5x11 portrait, gradient accent, QR) | ✅ | `<CertificateTemplate>` — single source of truth for OAP & GCA, print-ready |
| Cert ID generator (`OAP-XXXXXX-YYYY` + QR token) | ✅ | `src/lib/certificates.ts` — Crockford-style alphabet, no ambiguous chars |
| `/verify/:certId` page (public, no auth) | ✅ | Live + bound to `oap_certificates` / `gca_certificates`, prints the full cert |
| Issuance edge function | ✅ | `supabase/functions/issue-certificate` — auth-gated, inserts row, emails recipient |
| Admin issuance UI | ✅ | `<CertificateIssuancePanel>` in Training Library admin → Certificates tab |
| Public storage bucket for cert PDFs | ✅ | `oap-gca-certificates` — PDF-only public read, admin write |
| Stripe `$12` one-time checkout (guest allowed) | ✅ | `create-cert-checkout` edge fn + `BuyCertificateDialog` UI; webhook handles `product_type: "cert"` and inserts the cert row idempotently |
| Email delivery with PDF attachment | 🟡 | HTML receipt sent on issue from webhook; PDF attachment pending headless-render pipeline |
| Shareable link + LinkedIn-ready URL | ✅ | `/verify/:certId` is the share URL |
| Revoke / expire flow | 🟡 | Schema supports it (`status`, `revoked_at`); UI control pending |

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

## 10. Remaining Work — Snapshot 2026-04-17 (post learner + employer surfaces)

**Roughly ~10% remaining.** OAP is now both **individual-ready** (operators can self-study via `/oap/learn`, take quizzes, and buy a $12 cert) and **employer-ready** (org admins can define role programs, enroll operators, track overdue, and have mentors sign off floor walkthroughs).

### Remaining (polish only)
1. Bulk operator import (CSV) — single-operator enroll is live.
2. Compliance export PDF (AS9100 / ISO 9001 / OSHA-ready) per operator.
3. Author actual lesson content + quiz Q's for the 7 sections (currently 1 starter lesson + 1 sample quiz seeded; player works for any future content).
4. Day-10 + day-13 trial reminder emails.
5. GCA add-on ($49/mo per location) packaging on `/pricing`.
6. Headless PDF render pipeline for cert email attachments.
7. Revoke / expire UI control (schema already supports it).
