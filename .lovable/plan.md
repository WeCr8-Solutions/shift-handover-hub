## Goal

Make the Manufacturing Visibility 100 pipeline production-correct end-to-end (public nominate → admin review → score → rank → publish → public list/detail), and finish the admin ranking workspace so an editor can run a full audit and ship an edition without leaving the page.

## What I verified

- Public form `/manufacturing-100/nominate` inserts into `mfg_100_nominations` with Zod validation + consent. RLS allows anon INSERT (consent=true). OK.
- Admin page `/admin/manufacturing-100` (platform_admin + developer only) lists nominations, opens a review dialog with status, blurb, rank, previous_rank, 6 score fields, and notes. OK as a baseline.
- DB: `mfg_100_nominations` has status check, score-bounds check, generated `score_total` (0–100) and `rank_movement` ('new'|'up'|'down'|'same'), unique slug, slug-from-name trigger. View `mfg_100_honorees` filters `status='published' AND published_at IS NOT NULL`. Grants in migrations look correct.
- Live data gap: the 38 seeded honorees only exist in the dev DB. Live still has zero rows in `mfg_100_nominations`. The static fallback in `src/lib/manufacturing100Honorees.ts` is masking this on the public pages, but the admin pipeline on Live is empty and the "live" list never updates.
- Admin UX gaps: no category filter, no sort by score, no search, no quick-rerank, no "view on site" link, no slug editor, no edition selector, no bulk publish, no "X of 100 published" progress, no duplicate/spam guard signal, no audit/history, no email notification when a nomination comes in.

## Plan

### 1. Backfill Live so the live pipeline matches dev

Add an idempotent seed migration that upserts the 38 editorial honorees into `mfg_100_nominations` (keyed on `slug`) so Live, dev, and the static fallback all agree. Idempotent = safe to re-run.

After this, the static fallback in `src/lib/manufacturing100Honorees.ts` becomes a true editorial source-of-truth backstop, not a cover for missing data.

### 2. End-to-end submission hardening

- Add lightweight server-side dedupe: unique index on `(lower(nominator_email), lower(nominee_name), edition)` to prevent accidental double-submits.
- Add `submission_count` rate-limit guard via existing `email_rate_limits` table (10/hr per email).
- Notify editors: edge function `mfg-100-nomination-notify` triggered from the client immediately after a successful insert. Sends a Resend email to the editorial address with nominee + nominator + category + reason + evidence links. Idempotency keyed on nomination id.
- Improve the success state with a "We'll email you if shortlisted" line and copy the methodology link.

### 3. Public read path

- Confirm `mfg_100_honorees` view has `GRANT SELECT TO anon, authenticated` applied on Live (re-issue grant in the seed migration to be safe).
- `ManufacturingVisibility100Honorees.tsx` keeps using the view; merge logic stays as a backstop only.
- Add `noindex` removal check on `/manufacturing-100/honorees` and `/manufacturing-100/:slug` (currently public — OK).

### 4. Admin ranking workspace (the audit-ready UI)

Refactor `ManufacturingVisibility100Admin.tsx` into a real editorial workbench:

**Header / KPIs**
- "Edition {edition}" selector (defaults to current `2026`).
- Progress strip: `Published X/100 · Shortlisted Y · Under review Z · New W · Avg score · Last published`.
- Buttons: "Open public list" (target=_blank), "Open methodology", "Export edition CSV".

**Filters + list**
- Status tabs (existing) + category multi-select + free-text search (name/company/email) + sort dropdown (Newest, Score desc, Rank asc, Updated).
- Table: add columns Score breakdown (tooltip), Rank movement chip, Slug, "View public" inline link when published.
- Inline rank editor in the row (no need to open dialog for a small bump).

**Ranking page (new tab "Ranking")**
- Drag-and-drop ranked list (1..N) using `@dnd-kit/sortable` (already in repo if available, otherwise add). Persists `rank` and recomputes `previous_rank` from the snapshot at the start of the session.
- "Auto-rank by score_total" button (assigns 1..N by descending score, ties broken by visibility then created_at).
- "Publish edition" button: sets `status='published'` and `published_at=now()` for every shortlisted row in current edition that has a rank, in one transaction (via `mfg_100_publish_edition` RPC).

**Review dialog upgrades**
- Slug editor (validated `^[a-z0-9-]+$`, unique check) — currently only auto-generated.
- "Generate blurb from reason" helper (deterministic: first 2 sentences, trimmed to 280 chars; no AI needed).
- Show evidence links as clickable chips and live LinkedIn/website badges.
- Show duplicate hint if same nominee_name already exists in the edition.
- Show "Submitted by" history if the same nominator has prior submissions.

**Audit + safety**
- New `mfg_100_audit_log` table (id, nomination_id, actor_id, action, before jsonb, after jsonb, created_at). Trigger captures status, rank, score, blurb, slug changes. Admin-only SELECT. Surfaced as a collapsible "History" panel in the review dialog.
- Soft-delete: add `archived_at` column + `Archive` action (hides from all queries; recoverable from "Archived" tab).

### 5. Routes + nav

- `/admin/manufacturing-100` already wired; add link to it from the existing admin dashboard sidebar/menu (look up where other admin links live and match style).
- Keep noindex on admin page (already set).

### 6. QA / E2E checks I'll run before handoff

1. Anon submission via `/manufacturing-100/nominate` → row appears in admin "New" tab on Live.
2. Editor moves row New → Under review → Shortlisted, scores it, sets blurb + slug.
3. Editor drag-ranks in the Ranking tab, hits "Publish edition".
4. Row appears on `/manufacturing-100/honorees` and at `/manufacturing-100/{slug}` with correct rank, movement chip, blurb, JSON-LD.
5. Re-publish with a different rank → `rank_movement` flips correctly.
6. Decline → row leaves public list immediately.
7. Audit log shows every transition with actor + before/after.
8. Duplicate submission from same email+nominee is rejected with a friendly toast.
9. Resend email lands in editor inbox within ~10s of submission.
10. `mfg_100_honorees` view returns rows for an unauthenticated session (curl with anon key).

## Technical notes

- All schema work goes through one migration: dedupe index, `archived_at`, audit table + trigger, `mfg_100_publish_edition(_edition text, _ids uuid[])` RPC, and a re-affirming `GRANT SELECT ON public.mfg_100_honorees TO anon, authenticated`. Audit table includes GRANTs to `authenticated` (SELECT via `has_role admin/developer` policy) and `service_role` (ALL).
- Seed migration is separate and idempotent (`INSERT ... ON CONFLICT (slug) DO UPDATE`).
- Edge function `mfg-100-nomination-notify`: `verify_jwt=false`, accepts `{ nomination_id }`, re-reads the row server-side using service role, sends via Resend (`RESEND_API_KEY` already configured).
- Admin DnD: prefer existing `@dnd-kit` usage in the repo for consistency; fall back to a simple up/down button pair if not installed.
- No changes to the static fallback contract — `mergeManufacturing100Honorees` keeps deduping by slug so the live view always wins once populated.

## Out of scope

- Public voting / community ranking.
- Multi-edition archive pages (current edition only; `edition` selector lays groundwork).
- Auto-scoring from LinkedIn/YouTube — manual editorial scoring stays the source of truth.
