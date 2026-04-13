# .skills — Ollama-Powered Developer Skills

Project-level skill definitions for AI-assisted **developer tasks** using a local Ollama model.
These back the Claude Code slash commands in `.claude/commands/`.

> **Important scope boundary:**
> These skills use local Ollama models to help **developers** write code and compliance documents.
> They are completely separate from the `ai-planning-assistant` Edge Function in `supabase/functions/`
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

## Workflow

### Repair workflow
```text
Ollama analyzes → Claude applies fix → Codacy validates → npm test confirms
```

### Generation workflow
```text
Ollama generates draft → Claude reviews for correctness → Typecheck/Codacy validates → Applied to disk
```

### Compliance workflow
```text
Ollama drafts policy → Claude fact-checks against actual system → Written to docs/approval/fedramp/
```

## Local LLM Delegation Policy

To reduce cloud token usage, skills delegate heavyweight first-pass work to local Ollama models.

- **Preferred for local model:** bulk lint cleanup, repetitive type narrowing, test scaffolding, new component generation, compliance document drafts
- **Keep cloud model for:** security-critical logic review, ambiguous cross-file architecture decisions, final validation
- **Never auto-apply:** always review local model output before writing to disk
- **Low temperature always:** code and compliance tasks use `temperature: 0.1–0.2` for determinism

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
