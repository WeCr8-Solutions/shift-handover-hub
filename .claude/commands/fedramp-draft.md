Draft a FedRAMP/NIST compliance document section using local Ollama, then refine and write.

> **Scope: Developer/compliance tooling only.**
> This command uses local Ollama to assist writing compliance documentation.
> It has no relation to the `ai-planning-assistant` Edge Function that serves end users.

**Usage:** `/fedramp-draft <control-id> "<title>" "<context>"`

**Examples:**
```bash
/fedramp-draft AC-2 "Account Management" "Supabase Auth, JWT sessions, org-based RBAC, MFA enforcement via mfa_required flag"
/fedramp-draft SC-8 "Transmission Confidentiality" "Vercel enforces HTTPS, Supabase TLS 1.2+, WSS for realtime"
/fedramp-draft AU-6 "Audit Record Review" "activity_logs table, 22 event types, admin-only access, weekly review process"
/fedramp-draft IA-5 "Authenticator Management" "Supabase Auth password policies, TOTP MFA, JWT expiry 1hr"
```

**Shorthand — draft multiple controls from a gap ID:**
```bash
/fedramp-draft gap G-15 "describe the gap"
```

---

## Steps

1. Parse `$ARGUMENTS`:
   - If first word is `gap`: second word = gap ID, remainder = description of the gap to address
   - Otherwise: first word = `CONTROL_ID`, second quoted string = `TITLE`, third quoted string = `CONTEXT`

2. Check Ollama is running:
   ```bash
   curl -s http://localhost:11434/api/tags > /dev/null 2>&1 && echo "ok" || echo "Ollama not running — start: docker start local-ollama"
   ```
   Stop if not running.

3. Determine model — use `qwen2.5-coder:7b` for most controls; escalate to `qwen2.5-coder:14b` for complex multi-control policies:
   ```bash
   MODEL="${OLLAMA_MODEL:-qwen2.5-coder:7b}"
   ```

4. Read existing FedRAMP docs for style consistency:
   ```bash
   # Sample an existing doc for tone and format reference
   head -60 docs/approval/fedramp/information-security-program.md 2>/dev/null
   head -40 docs/approval/fedramp/incident-response-plan.md 2>/dev/null
   ```

5. Read the POA&M and gap roadmap for context on what's already documented:
   ```bash
   grep -A4 "$CONTROL_ID\|$GAP_ID" docs/approval/fedramp/poam.md 2>/dev/null | head -30
   grep -A4 "$CONTROL_ID\|$GAP_ID" docs/approval/fedramp/gap-roadmap.md 2>/dev/null | head -20
   ```

6. Call Ollama with a compliance-focused prompt:
   ```bash
   PROMPT="You are a FedRAMP compliance expert writing a NIST SP 800-53 Rev. 5 control implementation statement for a SaaS application.

   CONTROL: ${CONTROL_ID} — ${TITLE}
   SYSTEM CONTEXT: ${CONTEXT}
   AUTHORIZATION LEVEL: FedRAMP Moderate
   COMPANY: WeCr8 Solutions (small startup, 2-5 engineers, CEO + Engineering Lead)

   Write a complete implementation statement for this control that:
   1. Opens with a policy statement (1-2 sentences)
   2. Describes HOW the control is implemented in this specific system (not generic — use the context provided)
   3. Lists specific configuration, tooling, or process steps in a table or numbered list
   4. Identifies the responsible role (CEO or Engineering Lead) for each sub-control
   5. Notes any FedRAMP Moderate parameter requirements that must be met
   6. Closes with a 'Test Method' row describing how an assessor would verify compliance
   7. Uses Markdown — headers, tables, bold for key terms
   8. Keeps tone formal but concise — FedRAMP SSP language

   Do NOT include generic boilerplate like 'The organization shall...' without tying it to the actual system.
   Do NOT add a preamble or explanation — output only the document section content.

   Format:
   ## ${CONTROL_ID} — ${TITLE}

   **Policy:** [1-2 sentence policy statement]

   **Implementation:**
   [specific implementation details tied to the system context]

   **Responsible Party:** [role]

   **Test Method:** [how an assessor verifies this control is in place]"

   curl -s http://localhost:11434/api/generate \
     -H "Content-Type: application/json" \
     -d "{\"model\":\"$MODEL\",\"prompt\":$(echo "$PROMPT" | jq -Rs .),\"stream\":false,\"options\":{\"temperature\":0.15,\"num_predict\":2048}}" \
     | jq -r '.response'
   ```

7. Review the Ollama output. The output is a **first draft** — check for:
   - Accuracy against the actual system (correct URLs, configs, tools)
   - Missing sub-control parameters (check NIST SP 800-53 Rev 5 for the specific control family)
   - FedRAMP-specific parameter values (e.g., AC-2: review accounts every 60 days for Moderate)
   - Any claims that overstate current implementation vs. planned

8. Ask: **"Write this to a file, append to an existing doc, or keep as draft? [file/append/draft]"**
   - `file` — Write to `docs/approval/fedramp/<control-id-lowercase>.md` as a standalone document
   - `append` — Append to an existing doc (prompt for which file)
   - `draft` — Output only; user decides where to place it

9. If writing to disk, run `codacy_cli_analyze` on the file.

---

## Batch Mode — Draft a full control family

To draft all controls in a NIST family at once:

```bash
/fedramp-draft batch AC "Access Control" "Supabase Auth JWT, org-scoped RBAC, MFA enforcement, RLS on all tables, service role key server-side only, admin dashboard with role management"
```

In batch mode, Ollama drafts AC-1 through AC-20 (the most relevant subset for Moderate). Each control gets its own `##` section in a single output. Review before writing.

---

## Model Selection

| Task | Model |
|------|-------|
| Single control statement | `qwen2.5-coder:7b` |
| Full control family (batch) | `qwen2.5-coder:14b` (better coherence across sections) |
| Complex multi-system controls (SC, SA) | `qwen2.5-coder:14b` |

Override: `OLLAMA_MODEL=qwen2.5-coder:14b /fedramp-draft batch SC "System and Communications Protection" "..."`
