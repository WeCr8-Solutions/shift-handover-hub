# Usage tips

## Picking the right LLM

| Task | Suggested model |
| --- | --- |
| Single-file review, design-token lint, test gap | Any fast model (Gemini 3 Flash, GPT-5-mini, qwen2.5-coder:7b) |
| Bug repro + minimal fix, edge function hardening | Mid-tier reasoning (Claude Fable, GPT-5, Gemini 2.5 Pro, qwen2.5-coder:14b) |
| Architecture audit, coherence trace, security posture | Top-tier reasoning (Claude Fable Pro, GPT-5.4-pro, Gemini 3.1 Pro) |

## Workflow

1. Pick a prompt from `small-inspection.md` or `large-architecture.md`.
2. Prepend the guardrails block from `SKILL.md`.
3. Attach the minimum files required (see SKILL.md §Recommended attachments).
4. For small prompts, demand a unified diff + verification step.
5. For large prompts, demand `path:line` citations and a ranked backlog.
6. Never let the model accept "I'll refactor X while I'm here" — reject and re-prompt with stricter scope.

## Anti-patterns to reject in model output

- Hardcoded Tailwind colors (`text-white`, `bg-red-500`).
- Role checks against the `profiles` table.
- `SECURITY DEFINER` functions without `set search_path`.
- New public-schema tables without GRANTs.
- Direct ERP writes from ITAR orgs.
- Talent contact info in any public RPC or SELECT policy.
- Edge functions without `verify_jwt` unless explicitly public.
- `useEffect` chains where TanStack Query would suffice.

## When the user just wants a "quick review"

Default to **small-inspection.md §1 (Single-file review)** with the guardrails block.
