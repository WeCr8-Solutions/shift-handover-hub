# Manufacturing Visibility 100 — Campaign Docs

Annual recognition list of 100 people, companies, builders, educators, and shop-floor leaders pushing modern manufacturing forward.

## Status

| Field | Value |
|---|---|
| Publisher | WeCr8 Solutions (operator of JobLine.ai) |
| Owner | Marketing + Editorial |
| Phase | 1 — Strategy + Funnel + Launch Article |
| Public surfaces | `/manufacturing-100`, `/manufacturing-100/methodology`, `/manufacturing-100/nominate` |
| Backend | `public.mfg_100_nominations` (Supabase, RLS-locked; developers can review) |
| Status | In-build (Phase 1) |

## Documents in this folder

- [`01-strategy-brief.md`](./01-strategy-brief.md) — Why this list exists and what it must do for JobLine.ai, Talent, OAP, GCA, and the broader audience.
- [`02-execution-plan.md`](./02-execution-plan.md) — 8 phases, trimmed to what we'll actually ship in the first 90 days. Owner / status / exit-criteria per phase.
- [`03-ranking-methodology.md`](./03-ranking-methodology.md) — Categories, scoring model (0–100), and the editorial guardrails that protect the list's credibility.
- [`04-content-and-launch-templates.md`](./04-content-and-launch-templates.md) — Outreach emails, social copy, badge spec.
- [`05-agent-prompts.md`](./05-agent-prompts.md) — *Internal only.* LLM prompts for candidate research drafts.
- [`06-data-requirements.md`](./06-data-requirements.md) — Field-level schema for nominations and the candidate database, mapped to the live `mfg_100_nominations` table.
- [`07-90-day-roadmap.md`](./07-90-day-roadmap.md) — Week-by-week launch plan.
- [`08-sources.md`](./08-sources.md) — Reference sources and inspiration notes.

## Editorial principles

1. Reward practical shop-floor impact, not follower count.
2. Human editor review is required before any rank is published.
3. No defamation, no private-claim ranking, no rage-bait.
4. Public nomination is open; nomination ≠ admission.
5. Nominees can decline a listing at any time.

## Source material

This campaign was seeded by the uploaded `manufacturing_100_agent_plan.zip` (June 2026). The docs in this folder are the curated, JobLine-voiced version. Do **not** treat the original zip as the spec — these documents are the source of truth.
