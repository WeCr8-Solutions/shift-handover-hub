Fix failing test suite at `$ARGUMENTS` using Ollama to identify missing provider wrappers, then apply fixes and verify.

Targets PRD Phase 1: test suites broken due to missing `OrgProvider`, `QueryClientProvider`, or `BrowserRouter`.

## Steps

1. Read the test file at `$ARGUMENTS`.

2. Read `src/test/test-utils.tsx` to understand the available `AllProviders` wrapper, fixtures, and re-exports.

3. Check Ollama is running:
   ```bash
   curl -s http://localhost:11434/api/tags > /dev/null 2>&1 && echo "ok" || echo "Ollama not running"
   ```

4. Call Ollama:
   ```bash
   FILE_CONTENT=$(cat "$ARGUMENTS" 2>/dev/null)
   TEST_UTILS=$(cat "src/test/test-utils.tsx" 2>/dev/null)
   MODEL="${OLLAMA_MODEL:-qwen2.5-coder:7b}"
   PROMPT="You are fixing a failing React test suite. The test file uses hooks or components that require these providers: QueryClientProvider, BrowserRouter, OrgProvider, TooltipProvider.

   The project's test-utils.tsx exports:
   - AllProviders: a wrapper component that provides all four providers
   - customRender (re-exported as 'render'): uses AllProviders automatically
   - renderHook should use { wrapper: AllProviders }

   Identify every renderHook() or render() call that is missing the AllProviders wrapper.
   For each: show the current call, then the corrected call.
   Also check imports — if the file imports from @testing-library/react directly instead of @/test/test-utils, flag that too.

   Test file path: $ARGUMENTS
   Test file:
   $FILE_CONTENT

   test-utils.tsx:
   $TEST_UTILS"

   curl -s http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d "{\"model\":\"$MODEL\",\"prompt\":$(echo "$PROMPT" | jq -Rs .),\"stream\":false,\"options\":{\"temperature\":0.1,\"num_predict\":2048}}" \
     | jq -r '.response'
   ```

5. Review the Ollama output. Apply each fix using the Edit tool:
   - Update imports to use `@/test/test-utils` instead of `@testing-library/react`
   - Add `{ wrapper: AllProviders }` to `renderHook` calls
   - Replace bare `render` calls with the wrapped version

6. Run the tests for the fixed file:
   ```bash
   npm run test -- --reporter=verbose "$ARGUMENTS"
   ```
   If tests still fail, re-read the error, fix, and re-run.

7. Run `codacy_cli_analyze` on the edited file.
