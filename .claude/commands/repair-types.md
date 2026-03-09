Fix TypeScript type errors in `$ARGUMENTS` using Ollama, then apply and validate.

Targets PRD Phase 2: `no-empty-object-type` and `no-require-imports` errors.

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
   PROMPT="Fix TypeScript/ESLint errors in this file. Apply these rules strictly:

   RULE 1 — no-empty-object-type:
   Replace empty interface extension with type alias:
     BEFORE: interface FooProps extends React.HTMLAttributes<HTMLDivElement> {}
     AFTER:  type FooProps = React.HTMLAttributes<HTMLDivElement>
   If the interface has members, keep it as an interface (not empty = no change needed).

   RULE 2 — no-require-imports:
   Convert require() to ESM import:
     BEFORE: const animate = require('tailwindcss-animate')
     AFTER:  import animate from 'tailwindcss-animate'
   For dynamic requires where ESM import doesn't work, use:
     // eslint-disable-next-line @typescript-eslint/no-require-imports

   Output: for each fix, show the exact old text and the exact replacement text.
   Format: ---FIX--- OLD: <old text> NEW: <new text> ---END---

   File: $ARGUMENTS
   $FILE_CONTENT"

   curl -s http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d "{\"model\":\"$MODEL\",\"prompt\":$(echo "$PROMPT" | jq -Rs .),\"stream\":false,\"options\":{\"temperature\":0.1,\"num_predict\":2048}}" \
     | jq -r '.response'
   ```

4. Parse the suggested fixes and apply each one using the Edit tool.

5. Run `codacy_cli_analyze` on the edited file. Fix any new issues.

6. Optionally run TypeScript check:
   ```bash
   npx tsc --noEmit 2>&1 | grep "$ARGUMENTS"
   ```
