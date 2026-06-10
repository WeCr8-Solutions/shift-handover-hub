---
name: jobline-prompt-kit
description: Reusable, LLM-agnostic prompt templates for inspecting, debugging, and auditing the JobLine.ai codebase (React+Vite+TS, Supabase RLS, ITAR-aware, OAP/GCA/Talent/WO/Handoff). Use when the user asks for prompts to feed an external coding model (Fable, Claude, GPT, Gemini, local Ollama, etc.), wants a review checklist, or wants to audit a module, file, migration, or edge function. Two tiers: small inspection-loop prompts (single file/diff) and large architecture/user-benefit prompts (repo-wide).
---

# JobLine Prompt Kit

A tested set of prompts tuned to this repo's invariants. Use them directly, or adapt the relevant template. All prompts assume the target LLM has no prior context about this project — they pull in the right guardrails inline.

## When to use which file

| User intent | Read |
| --- | --- |
| Review one file, one diff, or one PR | `references/small-inspection.md` |
| Reproduce + minimally fix a bug | `references/small-inspection.md` (§Bug repro) |
| Audit SQL migration, RLS, or edge function | `references/small-inspection.md` (§RLS, §Edge fn) |
| Onboard an LLM to the whole system | `references/large-architecture.md` (§Orientation) |
| Audit user benefit (manufacturing or talent) | `references/large-architecture.md` (§Benefit audits) |
| Trace cross-module data flow | `references/large-architecture.md` (§Coherence) |

## Non-negotiable guardrails (paste into every prompt)

Always include these when handing work to another LLM:

```
- Strict org-scoped RLS: every public-schema table needs organization_id NOT NULL + GRANTs + has_role()-based policies.
- ITAR orgs (requires_us_person_declaration=true) are forced to ERP read_through; never persist ERP data for them.
- Canonical/platform data (training_media, gca_question_banks, oap_courses) has organization_id=NULL and is_canonical=true — never org-writable.
- SECURITY DEFINER Postgres functions must set search_path = public.
- Supabase query builders return PromiseLike<any>; type accordingly.
- Use semantic tokens from src/lib/status-colors.ts and index.css — no hardcoded Tailwind colors.
- Use the useOrganization hook for active multi-tenant context.
- Transfer tokens are single-use, RLS-enforced.
- Talent contact info (email/phone/address) is never public — route outreach via in-app messaging.
- Never expose Supabase project IDs/URLs to end users; refer to "Lovable Cloud" / "backend".
- Vite SPA only — no Next.js SSR, no runtime fs; use Vite glob imports.
- React 18, shadcn/ui, framer-motion, TanStack Query.
```

## Defaults

- **Temperature:** 0.1 for inspection/repair; 0.3 for architecture audits.
- **Output format:** unified diffs over rewrites. Every response must include one verification step.
- **Scope discipline:** small prompts must produce one change only. No refactors, no scope creep.
- **Citations:** require `path:line` references when claiming a bug or risk.

## Recommended attachments

For large/architecture prompts, attach in this order:
1. This SKILL.md (the guardrails block)
2. `.lovable/prd/00-index.md`
3. `docs/mermaid/data__erd__v01.mmd`
4. `docs/mermaid/data__rls_matrix__v01.mmd`
5. `docs/mermaid/fe__sitemap__v01.mmd`
6. The specific file(s) under review

For small prompts, attach only the file or diff plus the guardrails block.
