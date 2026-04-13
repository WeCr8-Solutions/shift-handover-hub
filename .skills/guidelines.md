# Project Coding Guidelines

All skills enforce these rules. Every suggestion from Ollama is evaluated against them before application.

---

## Local LLM Task Routing

> **Scope boundary:** Ollama is used exclusively as a **developer tool** for code generation, code repair,
> and compliance documentation drafting. It is NOT the application AI assistant. The application AI
> assistant (`supabase/functions/ai-planning-assistant/`) is a separate production Edge Function that
> serves end users through the UI. Never conflate or combine these two systems.

Use local Ollama models first when possible to conserve hosted tokens.

**Route to local Ollama model:**
- Bulk lint/type cleanup (`/repair-*` commands)
- Generating new components, hooks, Edge Functions, tests, migrations (`/codegen`)
- First-pass FedRAMP control implementation statements (`/fedramp-draft`)
- File-level code reviews (`/ollama-review`)

**Keep hosted model (cloud) for:**
- Final arbitration when local output is unclear or incomplete
- Security-critical logic (auth, RLS, key management)
- Cross-file architecture decisions
- Any change that touches production data pipelines

**Always validate local model output before applying:**
- Typecheck: `npx tsc --noEmit`
- Lint: `npx eslint <file>`
- Codacy: `codacy_cli_analyze`
- Tests: `npm test` (for code changes)

- Prefer deterministic settings for code tasks: `temperature: 0.1` for repairs, `0.2` for generation.

---

## TypeScript

### Replacing `any`

Priority order (highest to lowest):

1. **DB types** — `Database["public"]["Tables"]["table_name"]["Row"]`
   - Source: `src/integrations/supabase/types.ts`
   - Example: `type Profile = Database["public"]["Tables"]["profiles"]["Row"]`

2. **`unknown` + type guard** — when the type is truly unknowable at compile time

   ```ts
   function process(value: unknown) {
     if (typeof value === 'string') { /* safe */ }
   }
   ```

3. **Specific union** — `string | number | boolean` rather than `any`

4. **Last resort** — inline suppression for third-party callback signatures that cannot be typed:

   ```ts
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   onEvent: (payload: any) => void
   ```

   Never use file-level `/* eslint-disable */`.

### Empty Interfaces

Replace empty interface extension with type alias:

```ts
// Before
interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {}

// After
type CommandProps = React.HTMLAttributes<HTMLDivElement>
```

### Imports

ESM only — no `require()`:

```ts
// Before
const plugin = require('tailwindcss-animate')

// After
import plugin from 'tailwindcss-animate'
```

---

## Tests

- **Always** use `src/test/test-utils.tsx` exports, not bare `@testing-library/react`
- **Render wrapper:** `AllProviders` wraps `QueryClientProvider → BrowserRouter → OrgProvider → TooltipProvider`
- **Hook tests:** pass `{ wrapper: AllProviders }` to `renderHook`

  ```ts
  import { AllProviders } from '@/test/test-utils'
  const { result } = renderHook(() => useMyHook(), { wrapper: AllProviders })
  ```

- **Mock fixtures:** reuse `mockOrg`, `mockUser`, `mockStation`, `mockQueueItem` from `test-utils.tsx`
- **Supabase:** use `mockSupabaseClient` from `test-utils.tsx`; mock via `vi.mock('@/integrations/supabase/client')`

---

## ESLint Suppressions

- Inline suppression (`// eslint-disable-next-line`) — acceptable for third-party signature mismatches
- File-level suppression (`/* eslint-disable */`) — **never allowed**
- Block suppression (`/* eslint-disable ... */ ... /* eslint-enable */`) — only for generated/shadcn code

---

## `react-refresh` Warnings

- **shadcn UI files** (`src/components/ui/`) — suppress with `// eslint-disable-next-line react-refresh/only-export-components`
- **Project-owned files** — fix by moving exported constants/functions to a sibling `*.utils.ts` file

---

## Hook Dependencies

- **`useEffect`** — add all referenced variables to deps array unless explicitly memoized
- **`useCallback`** — add all referenced functions/values to deps array
- **Stale closure risk** — if adding a dep causes infinite re-renders, restructure:
  - Extract stable refs with `useRef`
  - Move static values outside the component
  - Wrap callbacks in their own `useCallback`

---

## Codacy (MANDATORY)

After **every** file edit, run `codacy_cli_analyze`:

```text
tool: codacy_cli_analyze
rootPath: d:\MajorProjects\shift-handover-hub
file: <edited file path>
```

Fix any issues before moving to the next file. This is a hard requirement from `.github/instructions/codacy.instructions.md`.

After any `npm install` or dependency change, additionally run with `tool: trivy` for security scanning.
