# .skills — Quinn: Ollama-Powered Developer Agent

Project-level skill definitions for the **Quinn** developer agent — local Ollama/qwen2.5-coder used for code generation, code repair, and compliance documentation.
These back the Claude Code slash commands in `.claude/commands/`.

> **Quinn builds, not suggests.**
> Every command writes output directly to disk after validation. Quinn does not present code blocks
> for the developer to copy — it creates files, applies fixes, and reports what it did.

> **Important scope boundary:**
> Quinn uses local Ollama to help **developers** write code and compliance documents.
> Quinn is completely separate from the `ai-planning-assistant` Edge Function in `supabase/functions/`
> which powers the in-app AI assistant for **end users** managing work orders and shop floor flow.
> Do not conflate these two systems.

## Prerequisites

1. **Ollama installed** — [ollama.com](https://ollama.com)
2. **Model pulled:**

   ```bash
   ollama pull qwen2.5-coder:7b
   ```

3. **Ollama running** (starts automatically on most systems, or run `ollama serve`)

## Available Skills

### Code Repair (fix existing code)

| Command | Purpose | PRD Phase |
| --- | --- | --- |
| `/ollama-review <file>` | General code review — TS, ESLint, test coverage | Any |
| `/repair-test <file>` | Fix failing test suites (missing provider wrappers) | Phase 1 |
| `/repair-types <file>` | Fix TypeScript type errors (empty interfaces, require()) | Phase 2 |
| `/repair-hooks <file>` | Fix hook dependency warnings (useCallback/useEffect) | Phase 3 |
| `/repair-any <file>` | Replace `no-explicit-any` with precise types | Phase 4 |

### Code Generation (create new code)

| Command | Purpose | Notes |
| --- | --- | --- |
| `/codegen component <Name> "<desc>"` | Generate a new React/TypeScript component | Outputs TSX with Tailwind + shadcn |
| `/codegen hook <name> "<desc>"` | Generate a new custom React hook | Typed, follows exhaustive-deps rules |
| `/codegen edge-function <name> "<desc>"` | Generate a new Supabase Edge Function | Deno/TypeScript, auth + CORS included |
| `/codegen test <path> "<desc>"` | Generate a Vitest test file for an existing file | Uses AllProviders, mockSupabaseClient |
| `/codegen migration <name> "<desc>"` | Generate a Supabase SQL migration | RLS policies included for new tables |
| `/codegen util <name> "<desc>"` | Generate a TypeScript utility module | Pure functions, no UI deps |

### Compliance Documentation

| Command | Purpose | Notes |
| --- | --- | --- |
| `/fedramp-draft <control-id> "<title>" "<context>"` | Draft a NIST SP 800-53 control statement | First-pass draft; review before committing |
| `/fedramp-draft batch <family> "<title>" "<context>"` | Draft all controls in a NIST family | Uses `qwen2.5-coder:14b` for coherence |

## Usage

```bash
# General review
/ollama-review src/hooks/useERPConnector.test.ts

# Fix a broken test suite
/repair-test src/hooks/useOperatorSessions.test.ts

# Replace any types in a file
/repair-any src/components/StationCard.tsx
```

## Override Ollama Model

Set `OLLAMA_MODEL` in your shell before invoking:

```bash
OLLAMA_MODEL=qwen2.5-coder:14b /repair-any src/components/StationCard.tsx
```

## Quinn's Workflow — Build, Don't Suggest

Quinn **acts**. Every command ends with changes on disk, not a list of recommendations.

### Repair workflow
```text
Quinn analyzes → fixes applied to disk → Codacy validates → errors auto-fixed → npm test confirms
```

### Generation workflow
```text
Quinn generates → security/import review → written to disk → typecheck + Codacy → issues auto-fixed → done
```

### Compliance workflow
```text
Quinn drafts → fact-checked against actual system → corrections applied inline → written to docs/approval/fedramp/
```

## Quinn Agent Policy

- **Act, don't suggest:** Quinn writes files and applies fixes. It does not present output for the user to manually copy.
- **Validate before writing:** typecheck + Codacy run first; issues are fixed before finalizing.
- **Auto-fix Codacy findings:** after writing any file, Quinn runs `codacy_cli_analyze` and applies fixes itself.
- **Destructive operations only:** confirm before any DROP TABLE, file deletion, or overwrite of a file with significant content.
- **Low temperature:** `0.1` for repairs/SQL, `0.2` for generation. Determinism over creativity.
- **Escalate to 14b:** when 7b output is incomplete or clearly wrong, retry with `qwen2.5-coder:14b` automatically.

Recommended default:

```bash
OLLAMA_MODEL=qwen2.5-coder:7b /ollama-review src/components/dashboard/OperatorStationPanel.tsx
```

Higher-reasoning option for complex refactors:

```bash
OLLAMA_MODEL=qwen2.5-coder:14b /repair-types src/hooks/useERPConnector.ts
```

Every edit triggers `codacy_cli_analyze` automatically per `.github/instructions/codacy.instructions.md`.

## Configuration

See [ollama-config.md](./ollama-config.md) for model options.
See [guidelines.md](./guidelines.md) for project coding rules enforced by all skills.
