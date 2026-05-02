## Goal

Audit confirmed the admin Training Library hub at **Admin → Training Library** already exposes full CRUD for both programs. This plan closes the gaps between the **post-normalization data model** (keyed choices, new `question_type` values, certificate-pass gating) and the **admin editors**, plus adds the missing surfaces admins asked about (profession presets, attempts review, validation).

## What's already in place (no change needed)

- **Admin → Training Library** tab with sub-tabs: Tools Catalog, Machining Ops, **GCA Editor**, **OAP Editor**, Cert Studio, Org Overrides, OAP Mentors, Certificates, Release Log, Handbook Links, Bulk Tags.
- GCA: bank list/search, settings, questions list, JSON bulk import, publish-release dialog, cover media editor, delete.
- OAP: course tree (course → lessons → quizzes), markdown lesson editor, quiz settings + questions, publish-release dialog.
- `useGcaAdmin` / `useOapAdmin` hooks with upsert/delete mutations and React Query invalidation.
- Mentor admin panel, certificate issuance panel, release log.

## Gaps to fix

### 1. QuestionEditor / JsonChoicesField — align with normalized schema (CRITICAL)

The recent normalization migration converted **all 491 questions** to:
- `choices`: `[{ key: "a", label: "..." }, ...]` (was `string[]`)
- `correct_answers`: `["a", "b"]` (keyed, was numeric indices)
- `question_type`: `single_choice | multi_choice | true_false` (was `multiple_choice | multi_select | true_false`)

But the admin editor still:
- Strips choices back to `string[]` and stores answers as numeric indices (`JsonChoicesField` lines 26–27, 40, 46, 49).
- Lists old type values in the `TYPES` dropdown (`multiple_choice`, `multi_select`).
- Initializes `true_false` correct as `[0]` instead of key `"true"`.

**Fix:** Update `JsonChoicesField` to round-trip `{key,label}` choices and key-based answers (auto-assign keys `a`, `b`, `c`, ... when adding; preserve keys on edit/remove; remap correct keys when a choice is deleted). Update `QuestionEditor.TYPES` to `single_choice | multi_choice | true_false | fill_in | drag_drop`. Add a backwards-compat shim so legacy rows still load if any slip through.

### 2. Player ↔ editor type parity

`QuizPlayer.tsx` and `GcaTestPlayer.tsx` already accept both `multi_choice` and `multi_select`. Editor must write the **canonical** value (`single_choice` / `multi_choice`) so future seeds stay consistent.

### 3. Profession Presets surface in the OAP Editor

`src/lib/professionPresets.ts` powers the public showcase but admins have no way to see/curate which presets map to which OAP courses or GCA banks. Add a small **Presets panel** inside the OAP Editor course view (read-only list with a link/CTA "Linked from preset: CNC Operator") so admins know which courses are surfaced on the landing pages.

### 4. Attempts Review tab (new)

Admins currently can't see how questions are performing. Add an **Attempts** sub-tab in the GCA bank detail and OAP quiz detail showing:
- Last 50 attempts (user, score, passed, started_at) — read-only.
- Per-question accuracy % (count of correct / count of answered) so admins can spot bad questions.

Backed by simple `useQuery` against `gca_test_attempts` / `oap_quiz_attempts` (RLS already restricts to platform admins via existing policies).

### 5. Question validation before save

Add client-side validation in `QuestionEditor.onSave`:
- `single_choice` → exactly one correct key
- `multi_choice` → ≥ 1 correct key
- `true_false` → exactly one of `true|false`
- All `correct_answers` must reference an existing choice key
- Prompt non-empty, ≥ 2 choices for choice-types

Mirrors the server-side `grade_*` RPC checks so admins see errors before round-tripping the DB.

### 6. Empty-state polish

When an admin opens GCA Editor with zero banks (fresh org clone), show a "Seed canonical banks" CTA gated to platform admins. Same for OAP courses. Uses the existing seeding pattern in `SeedTestDataButton`.

## Files to change

```text
src/components/admin/training-library/shared/JsonChoicesField.tsx   (rewrite for keyed choices)
src/components/admin/training-library/shared/QuestionEditor.tsx     (new TYPES, validation, true/false defaults)
src/components/admin/training-library/GcaProgramEditor.tsx          (Add "Attempts" sub-tab + presets hint)
src/components/admin/training-library/OapProgramEditor.tsx          (Add "Attempts" sub-tab inside QuizEditor + presets panel in CourseEditor)
src/components/admin/training-library/AttemptsReviewPanel.tsx       (new — shared attempts/per-question accuracy)
src/hooks/useGcaAdmin.ts                                            (add useGcaAttempts + useGcaQuestionStats)
src/hooks/useOapAdmin.ts                                            (add useOapQuizAttempts + useOapQuestionStats)
```

No DB migrations required — schema is already correct from the prior normalization migration. RLS on `gca_test_attempts` / `oap_quiz_attempts` already permits platform admins to read.

## Out of scope

- No changes to the player UI (already handled in last loop).
- No changes to certificate gating (already enforced server-side).
- No changes to canonical seed data.