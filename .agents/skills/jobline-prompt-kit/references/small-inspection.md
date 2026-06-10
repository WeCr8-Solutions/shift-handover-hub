# Small inspection-loop prompts

One file or one diff at a time. Temperature 0.1. Always paste the SKILL.md guardrails block first.

---

## 1. Single-file review

```
You are reviewing ONE file in a React+Vite+TS+Supabase repo with strict org-scoped RLS and ITAR rules.
File: <path>
<contents>

Output (max 200 lines):
1. Bugs / correctness issues (with line refs)
2. RLS / multi-tenant risks (missing organization_id, cross-org leakage, SECURITY DEFINER without search_path)
3. Type issues (any, unchecked PromiseLike from supabase-js)
4. Hook deps + render hazards
5. Smallest possible patch as a unified diff. No refactors, no scope creep.
```

---

## 2. Bug repro + minimal fix

```
Reproduce, locate, and minimally fix this bug. One change only.
Repro: <what I did → what I saw → what I expected>
Suspect files: <paths>
Constraints: no new deps, no renames, keep public API, preserve RLS, no business-logic changes unless explicitly requested.
Return:
  (a) root cause in 3 lines
  (b) unified diff
  (c) one verification step (test command, console log to watch, or UI check).
```

---

## 3. RLS / migration sanity check

```
Audit this SQL migration for:
- organization_id NOT NULL + FK
- GRANT SELECT/INSERT/UPDATE/DELETE to authenticated and ALL to service_role on every new public table
- RLS enabled
- Policies using public.has_role(auth.uid(), 'role') — no role lookups against profiles
- SECURITY DEFINER functions with `set search_path = public`
- ITAR write_through trigger compatibility (enforce_itar_read_through)
- Org-scoped UNIQUE constraints where relevant

<sql>

Return a checklist with pass/fail + the exact SQL to fix any fail.
```

---

## 4. Semantic design-token lint

```
Flag any hardcoded Tailwind colors (text-white, bg-black, text-red-500, border-gray-200, etc.) in this file and replace with semantic tokens from src/lib/status-colors.ts or CSS variables in index.css. Preserve dark-mode parity. Diff only.

<file>
```

---

## 5. Edge function hardening

```
Review this Supabase Edge Function for:
- JWT verification (verify_jwt = true in config.toml unless explicitly public)
- Org authorization via has_role() before any mutation
- CORS allowlist (no '*' for credentialed)
- Rate limiting
- No service-role key leak in responses or logs
- No raw Stripe webhook payload persistence beyond idempotency key
- Compact, serializable responses
- Stale deno.lock removed if deployment was failing

<function source>

Return findings + a minimal diff.
```

---

## 6. Hook + Query review

```
Review this custom hook for:
- Correct useOrganization() usage; bails out cleanly when no active org
- TanStack Query keys include organization_id
- Supabase calls awaited as PromiseLike, errors surfaced via toast or thrown
- Realtime subscriptions cleaned up
- No infinite re-render via unstable deps
- Optimistic updates rolled back on error

<hook source>

Output: bullet findings + diff.
```

---

## 7. Component decomposition check

```
This component is >250 lines or has >3 useState hooks. Propose the smallest decomposition that:
- Extracts at most 2 child components
- Preserves all existing props and behavior
- Keeps state colocated with the owner that mutates it
- Uses semantic tokens only

Return: file tree of new files + unified diff of the parent.

<component>
```

---

## 8. Test gap finder

```
For this file, identify the 3 highest-value test cases that don't yet exist (check sibling .test.ts/.test.tsx). Use Vitest + the AllProviders wrapper from src/test/test-utils.tsx and mockSupabaseClient from src/test/mocks/supabase.ts. Output one ready-to-commit test file.

<source file>
<existing test file if any>
```
