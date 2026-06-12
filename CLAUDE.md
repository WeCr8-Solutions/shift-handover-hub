# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

JobLine.ai — digital expeditor / shift-handoff platform for CNC machine shops (React 18 + TypeScript + Vite SPA on Supabase). Part of a three-repo platform: this repo (core app), `jobline-machine`/`jobline-machineconnect` (CNC relay bridge), and the jobline.ai-g-code VS Code add-in.

## Commands

```sh
npm run dev          # Vite dev server (predev writes release manifest)
npm run build        # prebuild: release manifest + talent sitemap → vite build → postbuild: prerender
npx vite build       # build only, skips pre/post scripts — fastest compile check
npx tsc --noEmit     # typecheck
npm run lint         # eslint .
npm test             # vitest run (full suite; can OOM locally — prefer targeted runs)
npx vitest run src/path/to/file.test.tsx   # single test file
npm run test:e2e     # playwright
npx fallow dead-code # codebase intelligence (config: .fallowrc.json)
```

The MCP server in `mcp/` is a separate npm project (`cd mcp && npm run build`). Supabase edge functions live in `supabase/functions/` (Deno).

## Local LLM routing — Quinn (MANDATORY, use it often)

`.skills/guidelines.md` and `.skills/ollama-config.md` are the authority. Quinn = local Ollama `qwen2.5-coder:7b` in Docker (`local-ollama`, port 11434, always running). **Bias strongly toward routing eligible work to Quinn** — the owner wants qwen2.5 utilized as the default workhorse, not an afterthought:

- Bulk lint/type/hook repairs → `/repair-*` skills
- New components, hooks, edge functions, tests, migrations → `/codegen`
- File-level reviews (including reviewing your own edits before commit) → `/ollama-review`
- Compliance doc drafts → `/fedramp-draft`
- Escalate to `qwen2.5-coder:14b` only when 7b output is incomplete; keep auth/RLS/security logic and cross-file architecture decisions on the hosted model.
- Quinn applies validated fixes directly (build-don't-suggest); validate with `npx tsc --noEmit` + tests before writing.
- Note: `jq` is not installed — call Ollama's HTTP API via python/PowerShell JSON, not the jq snippets in skill docs.

After file edits, `.github/instructions/codacy.instructions.md` requires `codacy_cli_analyze` via the Codacy MCP server — if those MCP tools aren't connected in the session, note it and continue.

## Architecture

- **Single route table**: `src/App.tsx` holds every route (~150 lazy-loaded pages) above a `*` catch-all → NotFound. There is no nested/secondary router. **History lesson: Lovable commits (often titled just "Changes") have repeatedly dropped live routes and app-level mounts** (employers section, legal pages, CookieConsent, measuring-tools). After pulling Lovable commits, run `npx fallow dead-code` — a page appearing in unused-files usually means its route was silently removed, not that it's dead.
- **Route ordering gotcha**: `/talent/:username` is a username catch-all — static `/talent/*` routes must be registered before it.
- **Supabase backend, RLS everywhere**: every table's SELECT policies require an authenticated user; the anon key returns zero rows on all core tables (this is why the `mcp/` server needs `SUPABASE_SERVICE_KEY`). Public pages (talent profiles) read through `SECURITY DEFINER` RPCs granted to `anon` (e.g. `get_public_talent_profile_bundle`). `src/integrations/supabase/types.ts` is the live-schema source of truth — verify table/column names there, not in migrations.
- **Auth funnel**: `src/pages/Auth.tsx`. Canonical signup URL params: `mode=signup` (also accepts legacy `signup=1`), `intent=talent|org` (persisted in sessionStorage across the email round-trip), `redirect=` (also `next=`) validated against the F-8 `REDIRECT_ALLOWLIST` regex — extend that regex when adding a new top-level authed section. Talent-intent signups get verification emails landing on `/operator/profile?welcome=1`; org-intent on `/setup?verified=1`. `/setup` shows a talent/shop intent chooser for any orgless user.
- **Onboarding/talent domain**: operator (talent) profiles live in `operator_profiles` + satellite tables (`operator_certifications`, `operator_skills`, …), keyed by `user_id` with owner-only RLS, edited at `/operator/profile` via `useOperatorProfile` (upsert on `user_id`). No org membership required.
- **Marketing nav**: `src/components/marketing/navData.ts` drives MarketingNav menus — a page isn't discoverable until it's linked there and routed in App.tsx.
- **Deploys**: Lovable publishes snapshots (GitHub pushes do NOT auto-update the live site — requires Publish → Update in Lovable); Vercel deploys are deterministic via `vercel.json` + `public/release.json`.
- **Relay**: `src/connectors/jobline/` is the live machine-data WebSocket subscriber, gated by `VITE_RELAY_ENABLED`. Tests must `vi.stubEnv` that flag, never assume it's off. `src/connectors/sap/` is intentionally dormant (future ERP roadmap — don't delete).

## Conventions (from .skills/guidelines.md)

- No `any`: prefer `Database["public"]["Tables"][...]["Row"]` types, then `unknown`+guard, then unions. Inline eslint suppressions only — never file-level.
- Tests: import from `src/test/test-utils.tsx` (`AllProviders` wrapper, `mockSupabaseClient`, `mockOrg`/`mockUser` fixtures), not bare testing-library.
- react-refresh warnings: suppress in `src/components/ui/` (shadcn, vendored — don't refactor it), fix elsewhere by moving constants to `*.utils.ts`.
- `.fallowrc.json` caveat: list dormant barrels individually in `ignorePatterns` — a wildcard like `src/components/*/index.ts` removes actively-imported barrels (help, onboarding, tools) from the graph and falsely orphans everything behind them.
