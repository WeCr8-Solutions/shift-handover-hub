Review the file at `$ARGUMENTS` using the local Ollama code model, then report and optionally apply fixes.

## Steps

1. Read the file at `$ARGUMENTS`.

2. Check Ollama is running:
   ```bash
   curl -s http://localhost:11434/api/tags > /dev/null 2>&1 && echo "ok" || echo "Ollama not running — start with: ollama serve"
   ```
   If Ollama is not running, tell the user and stop.

3. Determine the model to use:
   ```bash
   echo "${OLLAMA_MODEL:-qwen2.5-coder:7b}"
   ```

4. Call Ollama with the file content. Build a prompt that:
   - Includes the full file content
   - Asks for: TypeScript type issues, ESLint violations (no-explicit-any, empty interfaces, require()), missing test provider wrappers, hook dependency issues, react-refresh export warnings
   - Requests output as a numbered list of issues with: line number, rule violated, suggested fix
   - Instructs the model to follow project guidelines from `.skills/guidelines.md`

   ```bash
   FILE_CONTENT=$(cat "$ARGUMENTS" 2>/dev/null)
   MODEL="${OLLAMA_MODEL:-qwen2.5-coder:7b}"
   PROMPT="You are a TypeScript/React code reviewer for a manufacturing shift-handover app. Review the following file for these issues only:
   1. no-explicit-any violations (suggest Database types, unknown, or specific unions)
   2. Empty interface declarations (replace with type aliases)
   3. require() imports (convert to ESM import)
   4. Missing React hook dependencies (useEffect/useCallback)
   5. react-refresh: files exporting both components and non-component values
   6. Missing test provider wrappers (renderHook without AllProviders wrapper)

   Output format: line number | ESLint rule | description | suggested fix

   File path: $ARGUMENTS
   File content:
   $FILE_CONTENT"

   curl -s http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d "{\"model\":\"$MODEL\",\"prompt\":$(echo "$PROMPT" | jq -Rs .),\"stream\":false,\"options\":{\"temperature\":0.1,\"num_predict\":2048}}" \
     | jq -r '.response'
   ```

5. Present the issues found with their line numbers and suggested fixes.

6. For each fix, ask the user if they want it applied. Apply confirmed fixes using the Edit tool.

7. After any file edits, run `codacy_cli_analyze` per `.github/instructions/codacy.instructions.md`:
   - `rootPath`: workspace root (`d:\MajorProjects\shift-handover-hub`)
   - `file`: the edited file path
   - Fix any new issues found before finishing.
