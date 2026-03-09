Replace `no-explicit-any` violations in `$ARGUMENTS` with precise types using Ollama for analysis.

Targets PRD Phase 4: ~350 `any` instances across the codebase, highest-impact files first.

## Steps

1. Read the file at `$ARGUMENTS`.

2. Read the Supabase DB types for reference:
   ```bash
   head -100 src/integrations/supabase/types.ts 2>/dev/null || echo "types file not found"
   ```

3. Check Ollama is running:
   ```bash
   curl -s http://localhost:11434/api/tags > /dev/null 2>&1 && echo "ok" || echo "Ollama not running"
   ```

4. Call Ollama:
   ```bash
   FILE_CONTENT=$(cat "$ARGUMENTS" 2>/dev/null)
   MODEL="${OLLAMA_MODEL:-qwen2.5-coder:7b}"
   PROMPT="Replace all 'any' types in this TypeScript/React file. Use this priority order:

   PRIORITY 1 — Supabase DB types when the value comes from the database:
     Database[\"public\"][\"Tables\"][\"table_name\"][\"Row\"]
     Database[\"public\"][\"Tables\"][\"table_name\"][\"Insert\"]

   PRIORITY 2 — Specific type from context (string, number, boolean, specific interfaces)

   PRIORITY 3 — unknown + type narrowing:
     function handle(value: unknown) { if (typeof value === 'string') ... }

   PRIORITY 4 — Inline suppression ONLY for third-party callback signatures that truly cannot be typed:
     // eslint-disable-next-line @typescript-eslint/no-explicit-any

   NEVER use file-level eslint-disable. NEVER use any[] where a specific type is knowable.

   For each replacement, output:
   LINE: <line number>
   OLD: <exact old text>
   NEW: <exact replacement text>
   REASON: <why this type was chosen>

   File: $ARGUMENTS
   $FILE_CONTENT"

   curl -s http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d "{\"model\":\"$MODEL\",\"prompt\":$(echo "$PROMPT" | jq -Rs .),\"stream\":false,\"options\":{\"temperature\":0.1,\"num_predict\":2048}}" \
     | jq -r '.response'
   ```

5. Review each suggestion. For DB type replacements, verify the table name exists in `src/integrations/supabase/types.ts` before applying.

6. Apply fixes using the Edit tool, one at a time. Prefer specific types over suppression comments.

7. Run `codacy_cli_analyze` on the edited file. Fix any new issues.

8. Run a quick lint check on the file:
   ```bash
   npx eslint "$ARGUMENTS" --rule '{"@typescript-eslint/no-explicit-any": "error"}' 2>&1 | head -20
   ```
