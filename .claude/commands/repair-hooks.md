Fix React hook dependency warnings in `$ARGUMENTS` using Ollama to identify stale closure risks.

Targets PRD Phase 3: `react-hooks/exhaustive-deps` warnings in `useCallback` and `useEffect`.

## Steps

1. Read the file at `$ARGUMENTS`.

2. Check Ollama is running:
   ```bash
   curl -s http://localhost:11434/api/tags > /dev/null 2>&1 && echo "ok" || echo "Ollama not running"
   ```

3. Call Ollama:
   ```bash
   FILE_CONTENT=$(cat "$ARGUMENTS" 2>/dev/null)
   MODEL="${OLLAMA_MODEL:-qwen2.5-coder:7b}"
   PROMPT="Analyze this React component for hook dependency issues (react-hooks/exhaustive-deps rule).

   For each useEffect or useCallback with a missing dependency:
   1. Identify the missing dep
   2. Assess stale closure risk: SAFE (adding dep won't cause re-render loops) or RISKY (adding dep may cause infinite loops)
   3. Propose a fix:
      - SAFE: add the dep to the array
      - RISKY: explain the restructuring needed (useRef for stable refs, move value outside component, or restructure logic)

   Output format:
   HOOK: useEffect|useCallback at line <N>
   MISSING DEPS: <list>
   RISK: SAFE|RISKY
   FIX: <exact change to deps array, or restructuring description>

   File: $ARGUMENTS
   $FILE_CONTENT"

   curl -s http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d "{\"model\":\"$MODEL\",\"prompt\":$(echo "$PROMPT" | jq -Rs .),\"stream\":false,\"options\":{\"temperature\":0.1,\"num_predict\":2048}}" \
     | jq -r '.response'
   ```

4. For each hook issue:
   - **SAFE fixes** — apply automatically using the Edit tool (add missing dep to array)
   - **RISKY fixes** — present the analysis to the user and ask for confirmation before restructuring

5. After applying fixes, run `codacy_cli_analyze` on the edited file.

6. Run `npm run test` to confirm no regressions from dep additions:
   ```bash
   npm run test -- --reporter=verbose 2>&1 | tail -20
   ```
