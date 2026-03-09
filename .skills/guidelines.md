# Project Coding Guidelines

All skills enforce these rules. Every suggestion from Ollama is evaluated against them before application.

---

## Local LLM Task Routing

Use local Ollama models first when possible to conserve hosted tokens.

- Route to local model: bulk lint cleanup, repetitive type narrowing, test mock scaffolding, and file-level refactors.
- Keep hosted model for final arbitration when output is unclear, risky, or cross-cutting.
- Never auto-merge local model output without validation (typecheck, tests, and codacy checks).
- Prefer deterministic settings for code tasks (low temperature).

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

```
tool: codacy_cli_analyze
rootPath: d:\MajorProjects\shift-handover-hub
file: <edited file path>
```

Fix any issues before moving to the next file. This is a hard requirement from `.github/instructions/codacy.instructions.md`.

After any `npm install` or dependency change, additionally run with `tool: trivy` for security scanning.
