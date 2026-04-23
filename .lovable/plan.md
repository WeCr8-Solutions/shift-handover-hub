

# Unified Program Editor for GCA & OAP + Certificate Template Manager

Build platform-admin tooling inside the existing Admin → Training Library tab so GCA question banks, OAP courses/quizzes, and certificate templates can all be edited (and uploaded) from one place — no SQL migrations required to add or improve content.

## What you'll get

Three new admin sub-panels, all gated to **platform admins** (canonical content rule: `organization_id = NULL` + `is_canonical = true`):

1. **GCA Program Editor** — manage all 10 question banks and their questions
2. **OAP Program Editor** — manage the 7 OAP courses, lessons, quizzes, and quiz questions
3. **Certificate Template Studio** — review the live diploma + digital templates, upload alternate template assets (logo seal, signature, background watermark), and preview what an issued OAP/GCA cert will look like before publishing

```text
Admin → Training Library
├── Tools Catalog        (existing)
├── Machining Ops        (existing)
├── GCA Editor           ← REPLACES "GCA Mapping" placeholder
├── OAP Editor           ← UPGRADES "OAP Mapping" tab
├── Certificate Studio   ← NEW (replaces empty cert area)
├── Certificates Issued  (existing CertificateIssuancePanel)
├── Org Overrides        (existing)
└── OAP Mentors          (existing)
```

## GCA Editor (sub-panel)

- Two-pane layout: left = list of `gca_question_banks` (search + filter by topic/difficulty/published); right = bank detail
- Bank detail tabs:
  - **Settings** — title, slug, topic, difficulty, passing_score_pct, is_pro_only, is_published, sort_order
  - **Questions** — drag-to-reorder list of `gca_questions`; inline editor for prompt, type (multiple_choice / true_false / fill_in / multi_select / drag_drop), choices (JSON array editor with add/remove rows), correct_answers, explanation, points
  - **Media** — reuse existing polymorphic `training_media` uploader bound to `entity_type='gca_question_bank'` or `gca_question`
- "Create new bank" + "Duplicate bank" actions
- Bulk import: paste JSON / CSV of questions to bulk-insert into a bank (validates schema before commit)

## OAP Editor (sub-panel)

- Three-level tree on the left: Course → Lesson → Quiz
- Right pane forms for each level:
  - **Course** — slug, section_number (1–7), title, summary, description, estimated_minutes, sort_order, is_published
  - **Lesson** — title, slug, body_markdown (markdown editor with preview), estimated_minutes, sort_order
  - **Quiz** — title, description, passing_score_pct, max_attempts, time_limit_minutes
  - **Quiz Questions** — same inline question editor used by GCA (shared component)
- Markdown editor uses existing shadcn Textarea + a small live-preview pane (ReactMarkdown — already a dep via blog system)
- "Add Lesson" / "Add Quiz Question" inline actions; soft-delete with undo toast

## Certificate Template Studio (sub-panel)

The current `CertificateTemplate.tsx` is hard-coded. To let admins "review or upload new certificate templates" without redeploying, we add a `certificate_templates` table that stores **per-program style overrides** (the React layout itself stays code-owned for security/print fidelity, but every visual asset and label becomes editable).

- New table `public.certificate_templates`:
  - `id`, `program` (`'OAP'|'GCA'`), `variant` (`'diploma'|'digital'`), `name`, `is_active`, `is_canonical`
  - Visual overrides: `seal_logo_path`, `background_watermark_path`, `signature_default_path`, `accent_color_hex`, `border_style` (`'ornate'|'minimal'|'modern'`), `header_text`, `footer_text`, `font_family_serif`, `font_family_sans`
  - Storage bucket: new public `certificate-templates` bucket (PNG/SVG only, 2 MB cap), org-scoped path for non-canonical, root path for canonical
- Studio UI:
  - Grid of existing templates (canonical + your org's overrides) with thumbnails
  - "Upload new template assets" form: drag-drop seal/watermark/signature, color picker, dropdowns
  - Live side-by-side preview using `<CertificateTemplate variant="diploma">` and `variant="digital"` driven by a sample `CertificateRecord`
  - "Set Active" toggles which template the issuer pulls; canonical templates fall back when no org override exists
- `CertificateTemplate.tsx` reads the active template (cached via React Query) and applies overrides as CSS vars / props; default values match today's hard-coded look so nothing changes visually until an admin edits

## Backend / DB changes (one migration)

```text
1. CREATE TABLE certificate_templates (...)  + RLS:
     - SELECT: anyone (templates are referenced by public verify pages)
     - INSERT/UPDATE/DELETE: platform admin OR (org admin AND organization_id = own org AND is_canonical = false)
2. CREATE storage bucket 'certificate-templates' (public read)
     + storage policies mirroring the table rules (path prefix = org_id or 'canonical/')
3. RLS hardening for editors:
     - gca_question_banks / gca_questions / oap_courses / oap_lessons / oap_quizzes / oap_quiz_questions
       gain UPDATE/INSERT/DELETE policies restricted to platform admins
       (today they're SELECT-public, write-locked — we open writes only for platform_admin)
4. Trigger: enforce is_canonical ↔ organization_id IS NULL invariant (same pattern used by training_media)
```

No data migration — all existing seeded rows stay intact.

## Shared building blocks (DRY)

- `QuestionEditor` — one component used by both GCA and OAP question lists (type, prompt, choices JSON rows, correct answers, explanation, points)
- `usePlatformAdminCheck` — reuse `useAdminAccess`'s `isPlatformAdmin`; render Editor sub-panels in read-only mode for non-platform admins so org admins can preview
- React Query mutations with optimistic updates + toast feedback
- All forms validated with zod before insert/update

## Files to add

```text
src/components/admin/training-library/
  GcaProgramEditor.tsx
  OapProgramEditor.tsx
  CertificateTemplateStudio.tsx
  shared/
    QuestionEditor.tsx        (reused by GCA + OAP)
    JsonChoicesField.tsx
    MarkdownEditor.tsx
src/hooks/
  useGcaAdmin.ts              (CRUD for banks + questions)
  useOapAdmin.ts              (CRUD for courses/lessons/quizzes/questions)
  useCertificateTemplates.ts  (active template + asset uploads)
supabase/migrations/
  <timestamp>_admin_program_editors.sql  (table + RLS + storage bucket)
```

## Files to edit

- `src/components/admin/training-library/TrainingLibraryPanel.tsx` — wire new tabs, drop placeholders
- `src/components/certificates/CertificateTemplate.tsx` — accept optional `template` prop with overrides; falls back to today's hard-coded values
- `src/pages/VerifyCertificate.tsx` — fetch active template by program before rendering
- `src/types/admin.ts` — no change needed (already exposes `isPlatformAdmin`)

## Out of scope (call-outs)

- Template **layouts** (component JSX) stay in code — only assets/colors/labels are admin-editable. This preserves print fidelity and prevents broken layouts from a bad upload.
- Versioning/history of edited questions (mention as a future add if needed)
- Operator-facing UX is unchanged — they continue to take tests at `/gca/test/:bankSlug` and `/oap/walkthrough`

