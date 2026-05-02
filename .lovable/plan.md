# GCA & OAP Audit — Findings and Fix Plan

## Critical Findings

A live audit of the production database and player UIs surfaced four blocking issues. Right now, virtually every GCA test and OAP quiz is **either ungradable or visually broken** — users almost certainly see blank radio buttons and cannot pass. The YouTube embed pieces are fine; the data layer is the problem.

### 1. `choices` are stored as bare strings, but the UI expects `{key, label}` objects

- All 392 GCA questions and all 99 OAP quiz questions store `choices` like `["G00","G01","G02","G03"]`.
- `GcaTestPlayer` and `QuizPlayer` render `choices.map(c => <RadioGroupItem value={c.key}><span>{c.label}`. With strings, both `c.key` and `c.label` are `undefined` → blank rows, no value submitted.

### 2. `correct_answers` use 3 different, inconsistent encodings


| Source | label-text | positional index (`"0"`,`"1"`) | matches a real key |
| ------ | ---------- | ------------------------------ | ------------------ |
| GCA    | 139 rows   | 253 rows                       | 0 rows             |
| OAP    | 23 rows    | 76 rows                        | 0 rows             |


The grader RPC compares `correct_answers` to whatever the user submits, so even after fixing #1 the test would mark everyone wrong.

### 3. `question_type` enum mismatch

- DB uses `multiple_choice` and `true_false`.
- Frontend checks for `single_choice`, `multi_choice`, and `multi_select` — none match.
- Result: every question always renders as a radio group (single-select), even multi-answer ones.
- **Note**: today no question has more than one correct answer, but the structure must still support it (user explicitly asked about multi-choice).

### 4. No choice randomization

- Choices render in stored order every time. User asked for "multi-choice random answers."
- We must shuffle per-attempt while still letting the grader compare answers reliably.

YouTube playback (`TrainingMedia.tsx`, `MediaOverlayDisplay.tsx`) correctly converts `youtube.com/watch?v=` and `youtu.be/` URLs into `youtube.com/embed/` iframes — **no change needed**.

---

## Fix Plan

### Phase 1 — Data normalization migration (one-shot)

Migration converts every GCA + OAP question to a single canonical shape:

```text
choices:          [{ "key": "a", "label": "G00" },
                   { "key": "b", "label": "G01" }, ...]
correct_answers:  ["a"]                       -- always references key
question_type:    'single_choice' | 'multi_choice' | 'true_false'
```

Conversion rules per row:

1. If `choices[0]` is a string → wrap each as `{ key: <a|b|c|d|e>, label: <string> }`.
2. Map existing `correct_answers` to keys:
  - If value is a positional index (`"0"`, `"1"`...) → key at that index.
  - Else if value matches a label → key for that label.
  - Else log to a `gca_question_repair_log` / `oap_question_repair_log` table for manual review (we do not silently drop).
3. Rename `multiple_choice` → `single_choice` (since today none are truly multi); keep `true_false`. Add a new `multi_choice` type for future authoring — UI will already support it.

Verification queries run inside the same migration, raising an exception if any row ends with `correct_answers ⊄ choice_keys`.

### Phase 2 — Player UI fixes

`**GcaTestPlayer.tsx` and `oap/QuizPlayer.tsx**`

- Update `question_type` checks to `single_choice | multi_choice | true_false` (drop legacy aliases).
- Add a small `useShuffledChoices(question.id, choices)` hook that produces a stable per-attempt random order using a seed derived from `question.id + attemptStartedAt`. Stable across re-renders within an attempt; new order on retry. Keys never change, only display order.
- Defensive guard: if `c.key` is missing, fall back to the index — prevents future regressions from blank rows.
- Show "Select all that apply" hint on `multi_choice`, "Select one" on `single_choice`.

### Phase 3 — Grader hardening

`grade_gca_attempt` and `grade_oap_quiz_attempt` already do set comparison correctly. We add two safety rails:

- Reject the attempt with a clear error if any submitted answer key is not a valid choice key (catches client bugs early).
- For `single_choice` / `true_false`, enforce exactly one answer key in `_given`.
- Return the per-question `points_earned` so future partial-credit work is unblocked (no behavior change today).

### Phase 4 — Spot-check & QA

- Re-run the integrity SQL from the audit; expect 0 orphan correct keys.
- Manual click-through of one GCA bank per topic and OAP sections 1, 4 (Measurement & Inspection — has the most questions), and 12.
- Confirm: choices render with text, order changes between attempts, correct selection passes, wrong selection shows the explanation + HandbookCite, YouTube tutorials still play inline in `InspectionToolVideoCard`.

---

## Files Touched

**New**

- `supabase/migrations/<ts>_normalize_question_choices_and_correct_answers.sql`

**Modified**

- `src/components/gca/GcaTestPlayer.tsx` — type checks, shuffle hook, defensive key fallback.
- `src/components/oap/QuizPlayer.tsx` — same changes for parity.
- `src/hooks/useOapProgram.ts` — extend `OapQuizQuestion.question_type` typing.
- (No change) `src/components/training/TrainingMedia.tsx`, `InspectionToolVideoCard.tsx` — YouTube embeds verified working.

## Risk Notes

- The migration rewrites the entire question corpus in place. We will snapshot the old `choices` / `correct_answers` into `*_repair_log` tables before the rewrite so nothing is lost and any ambiguous row can be reviewed.
- Existing `gca_test_attempts` / `oap_quiz_attempts` rows reference question IDs (not keys) — they remain intact. Old `answers` payloads will not regrade cleanly, but past pass/fail records stay accurate as historical attempts.
- Allow for users to select an answer and then use a submit button before they get the right or wrong answer notification. 