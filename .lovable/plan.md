## Goal

Make handbook references a first-class part of the GCA/OAP authoring experience and bring operator-tools authoring up to the same bar. Admins should be able to **see, attach, detach, and jump to** Machinery's-Handbook references from inside every editor — and from a single hub when no per-entity surface exists.

## What's already in place

- **`handbook_references` / `handbook_categories` / `handbook_links` tables** with RLS, `is_canonical` flag, and the `entity_type` enum (`gca_question`, `gca_question_bank`, `oap_course`, `oap_lesson`, `oap_quiz_question`, `inspection_tool`, `machining_operation`, `operator_tool`).
- **`useHandbookReferences` / `useHandbookLinksFor` / `useHandbookReference`** hooks with bundled fallback (`getFallbackHandbook*`) so the UI works even when the DB query returns nothing.
- **`<HandbookCite />`** renderer (card + inline variants) that links to `/handbook/:slug`.
- **`/handbook` library** + **`/handbook/:slug` entry page**.
- **`HandbookLinkManager`** admin panel under Training Library → Handbook Links — fully working CRUD against `handbook_links` by entity_key/entity_id.
- **Tools page already wires** `<HandbookCite entityType="operator_tool" entityId={activeToolDef.id} />` in the side sheet.
- Live coverage today: **432 GCA questions linked, 448 OAP lessons linked, 30 operator tools linked, 0 OAP quiz questions linked** (the gap).

## What's missing

1. **Per-question handbook attachment in the GCA editor**, OAP quiz editor, and OAP lesson editor. Authors can write 491 questions but can't attach a reference without leaving the editor and using the global Link Manager.
2. **Per-question Handbook badges** in the question list (so admins can spot questions that lack any reference).
3. **No "References" section in the OAP CourseEditor / GCA BankEditor** to attach high-level course/bank-level citations.
4. **Operator-tool authoring**: the Tools page reads `operator_tool` links, but only platform admins (with knowledge of the right `entity_key` like `speed_feed_calculator`) can manage them via the global Link Manager. There is **no contextual editor on the Tools page** showing/managing the linked references.
5. **Discovery polish on the global Handbook Link Manager**: only one entity_key at a time, no bulk dropdown of known operator-tool keys, no "jump to handbook entry" link, no inline "Create new reference" affordance when a topic doesn't exist yet.

## Plan

### A. New shared component `HandbookLinkInlineEditor`

Reusable card-form component used inside every editor. Props: `entityType`, `entityIdOrKey`, `readOnly`. Behavior:

- Lists currently linked references as compact rows: title + category badge + "Open" link (`/handbook/:slug`) + remove button.
- Inline search + add (re-uses `useHandbookReferences({ search })`).
- "Suggest a topic" affordance when search returns 0 hits → opens a tiny dialog that creates a stub `handbook_references` row (canonical=false, organization_id=current org, body_md = "_TODO: write reference._") and links it. This is what the user asked for — *"if not, prepare it so we can add as we go"*.
- Reorder via up/down buttons updating `sort_order` (existing column).
- Falls back to the bundled fixtures' read-only display when DB is empty (existing behavior).

### B. Wire it into editors

```text
GcaProgramEditor.tsx
  └─ BankDetail Settings tab → <HandbookLinkInlineEditor entityType="gca_question_bank" entityId={bank.id} />
  └─ Inside QuestionEditor → footer block <HandbookLinkInlineEditor entityType="gca_question" entityId={q.id} />
  └─ Question list rows → small BookOpen icon badge with link count

OapProgramEditor.tsx
  └─ CourseEditor → <HandbookLinkInlineEditor entityType="oap_course" entityId={course.id} />
  └─ LessonEditor → <HandbookLinkInlineEditor entityType="oap_lesson" entityId={lesson.id} />
  └─ QuizEditor question list → <HandbookLinkInlineEditor entityType="oap_quiz_question" entityId={q.id} />
```

We'll thread `id` into `QuestionEditor` so the editor can render the inline links section once a question is saved (links require an `entity_id`).

### C. Operator-tools admin contextual editor

On `/tools`, when a tool is open in the side sheet, show below the existing `<HandbookCite />` a small **"Manage handbook links"** section visible **only to platform admins** (`useAdminAccess.hasPlatformAccess`). It uses `<HandbookLinkInlineEditor entityType="operator_tool" entityIdOrKey={activeToolDef.handbookKey ?? activeToolDef.id} />`. Keys come from `OPERATOR_TOOL_KEY_ALIASES` in `handbookFallback.ts` (already exists).

### D. Upgrade `HandbookLinkManager` (the catch-all hub)

For entities that don't have a contextual editor yet (or admins who want a global view):

- Replace the free-text "Entity key" input with a smart picker: dropdown of the 8 known operator-tool keys + free text fallback for new keys.
- For UUID-keyed entities (`gca_question`, `oap_lesson`, etc.), add a small picker that lists recent items by title so admins don't have to copy UUIDs.
- Each currently-linked row gets a "→ Open in handbook" button.
- Add a "Create new handbook reference" inline button that opens a minimal dialog (title, slug, category, summary) and immediately links it.

### E. Jump-to-handbook links everywhere a citation appears

- The existing `<HandbookCite />` already links the card to `/handbook/:slug`. Add an explicit ↗ icon in the inline-editor row so admins know it's clickable.
- Inside the GCA/OAP question lists, add a small "📖 N" pill with the link count; clicking opens a popover listing the linked references with jump links.

## Files to change / create

```text
src/components/handbook/HandbookLinkInlineEditor.tsx          (new — shared editor)
src/components/handbook/HandbookCreateReferenceDialog.tsx     (new — stub-create flow)
src/components/admin/training-library/shared/QuestionEditor.tsx
  └─ accept entityType + entityId props, render inline editor when id exists
src/components/admin/training-library/GcaProgramEditor.tsx
  └─ wire bank-level + per-question handbook editors, add link-count badge
src/components/admin/training-library/OapProgramEditor.tsx
  └─ wire course-level, lesson-level, quiz-question-level handbook editors
src/components/handbook/HandbookLinkManager.tsx               (upgrade with pickers + create flow + jump links)
src/pages/Tools.tsx                                           (add admin-only inline editor below citations)
src/lib/handbookFallback.ts                                   (export KNOWN_OPERATOR_TOOL_KEYS used by the picker — read-only addition)
```

No DB migration needed — `handbook_links` and `handbook_references` already accept everything we need. RLS policies for `handbook_references` already permit org admins to insert non-canonical org-scoped rows (verified: `is_canonical=false`, `organization_id=<active>`).

## Out of scope

- No changes to `handbook_categories` or the public `/handbook` library pages.
- No bulk import flow for references (deferred — admins can write the body_md from the entry page after the stub is created).
- No edits to canonical references; admins always create new org-scoped or new canonical (platform admin) rows.