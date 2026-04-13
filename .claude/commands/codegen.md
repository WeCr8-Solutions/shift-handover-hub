Generate new TypeScript/React/Deno code from a description using local Ollama, then review and apply.

> **Scope: Developer tooling only.**
> This command uses local Ollama to assist writing NEW application code.
> It has no relation to the `ai-planning-assistant` Edge Function that serves end users.

**Usage:** `/codegen <type> <name> "<description>"`

**Types:**
- `component` — React + TypeScript component (`src/components/`)
- `hook` — Custom React hook (`src/hooks/`)
- `page` — Full page component (`src/pages/`)
- `edge-function` — Supabase Edge Function (Deno, `supabase/functions/`)
- `test` — Vitest test file for an existing component or hook
- `migration` — Supabase SQL migration file (`supabase/migrations/`)
- `util` — Pure TypeScript utility module (`src/lib/`)

**Examples:**
```bash
/codegen hook useShiftTimer "Track elapsed shift time with pause and resume, returns seconds elapsed and formatted HH:MM:SS string"
/codegen component EquipmentStatusBadge "Badge showing equipment calibration status (ok/overdue/unknown), accepts status string prop"
/codegen edge-function batch-notify "Edge function that sends a Resend email notification to all org members with a given role"
/codegen test src/hooks/useShiftTimer "Vitest tests for useShiftTimer hook"
/codegen migration add-equipment-notes-column "Add nullable text column notes to the equipment table"
```

---

## Steps

1. Parse `$ARGUMENTS`:
   - First word = `TYPE`
   - Second word = `NAME` (for component/hook/edge-function/util/test) OR file path (for test targeting existing file)
   - Remaining quoted string = `DESCRIPTION`

2. Check Ollama is running:
   ```bash
   curl -s http://localhost:11434/api/tags > /dev/null 2>&1 && echo "ok" || echo "Ollama not running — start with: ollama serve (or Docker: docker start local-ollama)"
   ```
   Stop and tell the user if Ollama is not running.

3. Determine best model for this type:
   ```bash
   # Default: qwen2.5-coder:7b
   # For edge-function or migration: qwen2.5-coder:7b handles Deno well
   # Override: OLLAMA_MODEL=qwen2.5-coder:14b /codegen ...
   MODEL="${OLLAMA_MODEL:-qwen2.5-coder:7b}"
   echo "Using model: $MODEL"
   ```

4. Read project context to ground the generation:
   ```bash
   # Read conventions the model must follow
   cat .skills/guidelines.md 2>/dev/null | head -80
   # Read DB types for component/hook/edge-function tasks
   head -120 src/integrations/supabase/types.ts 2>/dev/null
   # Read test utils for test tasks
   [ "$TYPE" = "test" ] && cat src/test/test-utils.tsx 2>/dev/null
   # Read target file for test tasks
   [ "$TYPE" = "test" ] && cat "$NAME" 2>/dev/null
   ```

5. Build a type-specific prompt and call Ollama:

   **For `component`:**
   ```bash
   TYPE=component
   DESCRIPTION="$DESCRIPTION"
   PROMPT="Generate a production-ready TypeScript React component named ${NAME}.

   Requirements:
   - Use functional component with TypeScript props interface (not empty interface — use type alias if no additional props)
   - Use Tailwind CSS for all styling (no inline styles, no CSS modules)
   - Use shadcn/ui primitives where appropriate (Button, Card, Badge, etc. from @/components/ui/)
   - Use lucide-react for icons
   - Follow React 18 patterns — no class components
   - Use cn() from @/lib/utils for conditional classNames
   - Export the component as named export AND default export
   - Do NOT export non-component values from the same file (react-refresh rule)
   - Add TypeScript types for all props; no 'any'
   - Do not import from @testing-library or vitest

   Project DB types are available as: Database[\"public\"][\"Tables\"][\"table_name\"][\"Row\"] from @/integrations/supabase/types

   Component description: ${DESCRIPTION}

   Output: complete TypeScript file content only, no explanation."

   curl -s http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d "{\"model\":\"$MODEL\",\"prompt\":$(echo "$PROMPT" | jq -Rs .),\"stream\":false,\"options\":{\"temperature\":0.2,\"num_predict\":4096}}" \
     | jq -r '.response'
   ```

   **For `hook`:**
   ```bash
   PROMPT="Generate a production-ready custom React hook named ${NAME}.

   Requirements:
   - TypeScript, strict types — no 'any'
   - Use @supabase/supabase-js via import { supabase } from '@/integrations/supabase/client' if DB access is needed
   - Use @tanstack/react-query (useQuery, useMutation, useQueryClient) for data fetching
   - Return a typed object (not array) with clear property names
   - Include proper useEffect cleanup where needed
   - Follow exhaustive-deps rules — all deps must be in arrays
   - Export as named export only (not default)
   - No UI imports — hooks are pure logic

   Hook description: ${DESCRIPTION}

   Output: complete TypeScript file content only, no explanation."

   curl -s http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d "{\"model\":\"$MODEL\",\"prompt\":$(echo "$PROMPT" | jq -Rs .),\"stream\":false,\"options\":{\"temperature\":0.2,\"num_predict\":4096}}" \
     | jq -r '.response'
   ```

   **For `edge-function`:**
   ```bash
   PROMPT="Generate a production-ready Supabase Edge Function (Deno/TypeScript) named ${NAME}.

   Requirements:
   - Import serve from 'https://deno.land/std@0.168.0/http/server.ts'
   - Import createClient from 'https://esm.sh/@supabase/supabase-js@2'
   - Include standard CORS headers object (Access-Control-Allow-Origin: *, typical headers)
   - Always handle OPTIONS preflight (return 200 with cors headers)
   - Always validate Auth header: require 'Bearer <token>', return 401 if missing
   - Use supabase.auth.getUser(token) to validate the JWT; return 401 if authError or !user
   - Use SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from Deno.env.get()
   - All database queries must be org-scoped (.eq('organization_id', org_id))
   - Return JSON responses with ...corsHeaders in response headers
   - No hardcoded secrets — all via Deno.env.get()
   - Proper error handling with try/catch, always return valid JSON

   Function description: ${DESCRIPTION}

   Output: complete TypeScript/Deno file content only, no explanation."

   curl -s http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d "{\"model\":\"$MODEL\",\"prompt\":$(echo "$PROMPT" | jq -Rs .),\"stream\":false,\"options\":{\"temperature\":0.2,\"num_predict\":4096}}" \
     | jq -r '.response'
   ```

   **For `test`:**
   ```bash
   PROMPT="Generate a complete Vitest test suite for the following file.

   Requirements:
   - Import render, renderHook, screen, fireEvent, waitFor from '@/test/test-utils' (NOT from @testing-library/react directly)
   - Always pass { wrapper: AllProviders } to renderHook
   - Always wrap render calls with AllProviders via the custom render from test-utils
   - Mock Supabase via vi.mock('@/integrations/supabase/client') using mockSupabaseClient
   - Use mockOrg, mockUser, mockStation, mockQueueItem fixtures from '@/test/test-utils'
   - Use describe/it blocks, expect assertions
   - Cover: happy path, error states, loading states, edge cases
   - No 'any' in tests

   File to test:
   $FILE_CONTENT

   Output: complete TypeScript test file content only, no explanation."

   curl -s http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d "{\"model\":\"$MODEL\",\"prompt\":$(echo "$PROMPT" | jq -Rs .),\"stream\":false,\"options\":{\"temperature\":0.2,\"num_predict\":4096}}" \
     | jq -r '.response'
   ```

   **For `migration`:**
   ```bash
   PROMPT="Generate a Supabase SQL migration file.

   Requirements:
   - Use standard PostgreSQL 15 syntax
   - Include IF NOT EXISTS / IF EXISTS guards where appropriate to make it re-runnable
   - Add RLS ENABLE and appropriate policies if creating a new table:
     - SELECT: org members can read their own org's rows
     - INSERT/UPDATE/DELETE: require authenticated user in org with appropriate role
   - Use uuid_generate_v4() for UUID primary keys
   - Add created_at timestamptz DEFAULT now() and updated_at timestamptz DEFAULT now() to new tables
   - Include a trigger for updated_at using moddatetime extension if available
   - Add meaningful column comments if non-obvious

   Migration description: ${DESCRIPTION}

   Output: pure SQL only, no explanation, no markdown fences."

   curl -s http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d "{\"model\":\"$MODEL\",\"prompt\":$(echo "$PROMPT" | jq -Rs .),\"stream\":false,\"options\":{\"temperature\":0.1,\"num_predict\":2048}}" \
     | jq -r '.response'
   ```

6. Display the generated output. Ask: **"Apply this to disk? [y/n/edit]"**
   - `y` — Write the file (determine correct path from type/name)
   - `n` — Discard; offer to refine the description and regenerate
   - `edit` — Show the content for manual inline editing before writing

   **Target paths by type:**
   | Type | Path |
   |------|------|
   | `component` | `src/components/${Name}.tsx` |
   | `hook` | `src/hooks/${name}.ts` |
   | `page` | `src/pages/${Name}.tsx` |
   | `edge-function` | `supabase/functions/${name}/index.ts` |
   | `test` (from existing path) | Same directory as target, with `.test.ts(x)` suffix |
   | `migration` | `supabase/migrations/$(date +%Y%m%d%H%M%S)_${name}.sql` |
   | `util` | `src/lib/${name}.ts` |

7. After writing, run TypeScript typecheck on the new file:
   ```bash
   npx tsc --noEmit 2>&1 | grep -A2 "src/..." || echo "No TS errors"
   ```

8. Run `codacy_cli_analyze` on the new file. Fix any issues before finishing.

9. If type is `test`, run the new test:
   ```bash
   npm test -- --reporter=verbose 2>&1 | tail -30
   ```

---

## Model Selection Guide

| TYPE | Recommended Model | Reason |
|------|------------------|--------|
| `component` | `qwen2.5-coder:7b` | Fast, good at React/TSX patterns |
| `hook` | `qwen2.5-coder:7b` | Handles async patterns and generics well |
| `edge-function` | `qwen2.5-coder:7b` | Good Deno/TypeScript knowledge |
| `test` | `qwen2.5-coder:7b` | Test scaffolding is well within 7b capability |
| `migration` | `qwen2.5-coder:7b` | SQL is low complexity; 7b is sufficient |
| Complex multi-file scaffold | `qwen2.5-coder:14b` | Better cross-file reasoning |

Override: `OLLAMA_MODEL=qwen2.5-coder:14b /codegen edge-function complex-scheduler "..."`
