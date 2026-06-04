# 06 — Data Requirements

## Live table — `public.mfg_100_nominations`

Created via migration `20260604_mfg_100_nominations`. RLS-enabled.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `created_at` / `updated_at` | `timestamptz` | Auto-managed |
| `nominee_name` | `text` | Required |
| `nominee_company` | `text` | Optional |
| `nominee_role` | `text` | Optional |
| `nominee_linkedin` | `text` | Optional, URL |
| `nominee_website` | `text` | Optional, URL |
| `category` | `text` | Required, from the 10 categories in `03-ranking-methodology.md` |
| `reason` | `text` | Required, free text (1–1000 chars enforced client-side) |
| `evidence_links` | `jsonb` | Array of URLs |
| `nominator_name` | `text` | Required |
| `nominator_email` | `text` | Required, validated |
| `consent` | `boolean` | Required `true` (enforced by RLS WITH CHECK) |
| `interest_flags` | `jsonb` | `{ talent, oap, gca, demo }` booleans |
| `source` | `text` | Default `public_form` |
| `status` | `text` | `new` / `under_review` / `shortlisted` / `declined` / `published` |
| `reviewed_at`, `reviewed_by`, `notes` | review fields |
| `ip_hash`, `user_agent` | rate-limit + abuse signals |

## Access rules

- **Insert:** `anon` and `authenticated`, but RLS WITH CHECK requires `consent = true`.
- **Read / Update:** developers only (`has_role(auth.uid(), 'developer')`).

## Candidate database (future)

When Phase 3 starts, we'll add `mfg_100_candidates` for editorial use only. Schema sketch:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `name`, `company`, `role`, `category` | core identity |
| `linkedin`, `website`, `youtube` | public links |
| `evidence_links` | `jsonb` | curated URLs |
| `score_impact`, `score_innovation`, `score_visibility`, `score_education`, `score_smb`, `score_momentum` | `int` | 0–25 / 0–20 / etc. per methodology |
| `score_total` | `int` generated | sum, capped 100 |
| `editor_notes` | `text` |
| `status` | `text` | `draft` / `reviewed` / `final` / `published` |
| `published_rank` | `int` |
| `created_by`, `reviewed_by` | `uuid` |

RLS: developer-only read/write. Service role for batch ops.

## Privacy & ITAR

- Nominator emails are personal data; treat under the existing privacy policy (`/privacy`).
- No ITAR-sensitive data should ever live in this table. The form does not collect it.
- Nominees who request removal must have their row deleted within 7 days.
