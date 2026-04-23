

# Final Phase — Close All Gaps: Media Overlays, Year/Release Log, E2E Tests, Help Docs

A complete sweep to finish every loose thread from the GCA/OAP/Certificate pass. Adds the missing media-overlay editor (image/video with adjustable opacity + overlay text), an admin "Save with year + release notes" workflow that writes to a per-program release log, and finally lands the E2E Playwright spec + `cert_paid` / `recert_lifecycle` seed scenarios + `/help/certificates` doc that were deferred last round.

## What lands this pass

### 1. Cover media + overlay editor for programs (the missing piece)

New columns on `gca_question_banks`, `oap_courses`, `oap_lessons` (idempotent migration, all nullable, all default-safe so existing rows don't change visually):

- `cover_media_id uuid` → FK to `training_media.id` (image **or** video), nullable
- `cover_overlay_text text` — short caption/title rendered over the media
- `cover_overlay_opacity numeric(3,2) default 0.45` (0.00–1.00) — darkening scrim for text legibility
- `cover_overlay_position text default 'center'` (`top-left|top|top-right|center|bottom-left|bottom|bottom-right`)
- `cover_overlay_text_color text default '#ffffff'`

New shared component `src/components/training/MediaOverlayEditor.tsx`:
- Picks/uploads a `TrainingMedia` (reuses existing `TrainingMediaUploader` — already supports AVIF/GIF/JPEG/PNG/WEBP/MP3/MP4/WEBM + YouTube external URLs).
- Live preview pane shows the media with the overlay scrim + text positioned correctly. Slider for opacity, color picker, position grid.
- "Clear overlay" + "Remove cover" actions.

New shared component `src/components/training/MediaOverlayDisplay.tsx`:
- Renders cover image (`<img>`) or video (`<video autoPlay muted loop playsInline>` for hosted, `<iframe>` for YouTube) with the scrim + overlay text using semantic CSS tokens.
- Used on the operator-facing GCA bank intro card (`/gcode-academy`) and OAP course/lesson headers (`/oap/walkthrough`, `/oap/courses/:slug`).

Wired into:
- `OapProgramEditor` Course tab + Lesson tab → "Cover media" section above the form.
- `GcaProgramEditor` Settings tab → same section.
- `CertificateTemplateStudio` already has watermark/seal — extends it with the same overlay-text controls for the `header_text` band so the cert variants benefit too.

### 2. Year-stamped publishing + per-program release log

Existing release tracker (`src/generated/release.ts`) is **app-build** only. We add **content release logs** so admins know when a course/bank/cert template last changed and can publish a notes string.

Migration:
```sql
ALTER TABLE gca_question_banks
  ADD COLUMN IF NOT EXISTS content_year integer,
  ADD COLUMN IF NOT EXISTS last_published_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_published_by uuid;
ALTER TABLE oap_courses    ADD COLUMN IF NOT EXISTS content_year integer, ...;
ALTER TABLE oap_lessons    ADD COLUMN IF NOT EXISTS content_year integer, ...;
ALTER TABLE certificate_templates ADD COLUMN IF NOT EXISTS content_year integer, ...;

CREATE TABLE IF NOT EXISTS public.program_release_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program text NOT NULL CHECK (program IN ('OAP','GCA','CERT')),
  entity_type text NOT NULL,        -- 'bank' | 'course' | 'lesson' | 'quiz' | 'template'
  entity_id uuid NOT NULL,
  content_year integer NOT NULL,
  release_notes text,
  released_by uuid REFERENCES auth.users(id),
  released_at timestamptz NOT NULL DEFAULT now(),
  organization_id uuid REFERENCES organizations(id)  -- NULL = canonical
);
ALTER TABLE program_release_log ENABLE ROW LEVEL SECURITY;
-- SELECT: anyone (public learners can see "updated 2026"); INSERT: platform_admin or org admin for their org's overrides.
```

New "Save & publish" button in every editor (GCA bank, OAP course/lesson/quiz, cert template):
- Opens a small dialog: **Year** (defaults to current year), **Release notes** (textarea, optional, max 500 chars).
- On confirm: upserts the row, sets `content_year` + `last_published_at` + `last_published_by`, **inserts** a `program_release_log` row.
- Toast confirms with link to "View release log".

New tab in TrainingLibraryPanel: **Release Log** — table grouped by program, filter by year/program, shows what changed when and by whom. Operator-facing: small "Updated · 2026" badge on each GCA bank card and OAP course card pulled from `last_published_at`.

### 3. Admin E2E gaps from last pass — finished

These were called out as "still on the plan but not done" — finishing now:

- `supabase/functions/seed-e2e/index.ts` → add `cert_paid` (inserts a paid `oap_certificates` row, sets `stripe_session_id`, simulates webhook outcome) and `recert_lifecycle` (creates an enrollment with `next_recert_due = now() + interval '7 days'` so the `OapRecertDueWidget` has a row).
- `e2e/flows/cert.ts` (helper) + `e2e/cert-lifecycle.spec.ts` (Playwright) covering:
  1. Anonymous → `/verify/:certId` renders diploma + digital + PDF download succeeds
  2. Authenticated operator → take a GCA bank → grade RPC scores correctly without exposing `correct_answers`
  3. Org admin → enroll operator → issue free OAP cert via employer panel → cert appears at `/verify/`
  4. Operator → generate transfer token → second org admin → redeem → credential appears
- `content/posts/help-certificates.mdx` (the project uses `content/posts/` not `content/help/`; fits the hybrid blog system per memory) — operator-facing how-to for buying, finding, printing, transferring, recert.

### 4. Operator-side surfacing of cover media

- `/gcode-academy` bank cards → render `MediaOverlayDisplay` if the bank has a `cover_media_id`, fallback to existing topic-icon card.
- `/oap` course list + `/oap/walkthrough` lesson headers → same.
- All overlays use `pointer-events-none` on the scrim so video controls remain accessible.

## Files

**New**
```text
supabase/migrations/<ts>_program_media_overlays_and_release_log.sql
src/components/training/MediaOverlayEditor.tsx
src/components/training/MediaOverlayDisplay.tsx
src/components/admin/training-library/ReleaseLogPanel.tsx
src/hooks/useProgramReleaseLog.ts
e2e/flows/cert.ts
e2e/cert-lifecycle.spec.ts
content/posts/help-certificates.mdx
```

**Modified**
```text
src/components/admin/training-library/TrainingLibraryPanel.tsx       (+ Release Log tab)
src/components/admin/training-library/GcaProgramEditor.tsx           (cover media + Save&Publish dialog)
src/components/admin/training-library/OapProgramEditor.tsx           (cover media on course+lesson + Save&Publish)
src/components/admin/training-library/CertificateTemplateStudio.tsx  (Save&Publish dialog, overlay text controls)
src/hooks/useGcaAdmin.ts                                              (new fields on type + publish mutation)
src/hooks/useOapAdmin.ts                                              (new fields on types + publish mutation)
src/hooks/useCertificateTemplates.ts                                  (publish mutation)
src/pages/GcodeAcademy.tsx                                            (render MediaOverlayDisplay on bank cards + year badge)
src/pages/OapWalkthrough.tsx (or course list)                         (render MediaOverlayDisplay + year badge)
supabase/functions/seed-e2e/index.ts                                  (cert_paid, recert_lifecycle scenarios)
```

## RLS recap

- `program_release_log`: SELECT public, INSERT platform_admin OR org admin for own-org rows (org admins can publish org-override release notes; canonical changes stay platform-only).
- `gca_question_banks`/`oap_courses`/`oap_lessons` already enforce platform-admin write on canonical rows; new columns inherit existing policies — no policy changes needed.
- `cover_media_id` FK has `ON DELETE SET NULL` so deleting a media row never breaks a course.

## Verification

1. `supabase--linter` after migration → expect no new errors.
2. As platform admin: upload a video to an OAP course, set overlay "OAP §1 — Safety", drop opacity to 0.6, save & publish with year 2026 + note "Refreshed safety video" → confirm release log row appears, operator-facing /oap shows the video with overlay.
3. As operator (no admin): visit /gcode-academy, see "Updated · 2026" badge under banks that have been published.
4. Run `e2e/cert-lifecycle.spec.ts` headlessly — all 4 scenarios green.
5. Network sniff GCA test submission → `correct_answers` not present in response, score appears.
6. `/help/certificates` accessible; PDF download from `/verify/:certId` still works.

## Out of scope

- Versioned **history** of question text (only release log of "what year, what notes" — not full diffs).
- Replacing the React-based certificate template engine.
- Bulk publishing (one entity at a time stays).

