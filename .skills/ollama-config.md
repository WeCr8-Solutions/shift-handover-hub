# Ollama Configuration

> **Quinn** — local Ollama developer agent (qwen2.5-coder). Builds code and docs. Does not suggest.
> Scope: developer tooling only — code generation, code repair, compliance documentation.
> Entirely separate from the `ai-planning-assistant` Edge Function (`supabase/functions/ai-planning-assistant/`) that serves end users.

## Runtime

Ollama runs inside Docker container **`local-ollama`** on port **11434**.

```text
Container: local-ollama (ollama/ollama:latest)
Endpoint:  http://localhost:11434
GPU:       NVIDIA GeForce RTX 4060 Ti — 8 GB VRAM (--gpus all)
CUDA:      13.1 / Driver 591.86
Status:    Up, healthy
```

No need to start Ollama separately — it starts with Docker Desktop.

## Installed Models (WeCr8 Machine)

| Model | Size | Age | Best For |
| --- | --- | --- | --- |
| **`qwen2.5-coder:7b`** ✅ | 4.7 GB | 4 weeks | **Default — TypeScript, React, all PRD phases** |
| `codellama:7b` | 3.8 GB | 6 months | General code, fallback |
| `llama2:7b` | 3.8 GB | 7 months | General language, not code-specific |

Default for all skills: **`qwen2.5-coder:7b`**

### Task Routing — Model Selection

| Task | Command | Model | Notes |
|------|---------|-------|-------|
| Code repair (lint/types/hooks/any) | `/repair-*` | `qwen2.5-coder:7b` | Fast, handles TypeScript well |
| General code review | `/ollama-review` | `qwen2.5-coder:7b` | Default |
| Generate new component/hook/util | `/codegen component\|hook\|util` | `qwen2.5-coder:7b` | Good at React/TS patterns |
| Generate Edge Function | `/codegen edge-function` | `qwen2.5-coder:7b` | Good Deno/TypeScript knowledge |
| Generate migration SQL | `/codegen migration` | `qwen2.5-coder:7b` | SQL is low complexity |
| Generate test file | `/codegen test` | `qwen2.5-coder:7b` | Vitest scaffold |
| FedRAMP single control | `/fedramp-draft` | `qwen2.5-coder:7b` | Policy + implementation statements |
| FedRAMP control family batch | `/fedramp-draft batch` | `qwen2.5-coder:14b` | Better multi-section coherence |
| Complex type inference | `/repair-any` (hard files) | `qwen2.5-coder:14b` | Escalate when 7b is incomplete |

**Escalation rule:** Start with `qwen2.5-coder:7b`. Escalate to `qwen2.5-coder:14b` only when the 7b output is incomplete or low-confidence. De-escalate back to 7b after complex work.

Override with env var:

```bash
OLLAMA_MODEL=codellama:7b /repair-any src/components/StationCard.tsx
```

## Models to Consider Pulling

| Model | Size | Why |
| --- | --- | --- |
| `qwen2.5-coder:14b` | ~9 GB | Batch FedRAMP drafts, complex multi-file codegen, hard type inference |
| `deepseek-coder-v2:16b` | ~10 GB | Strongest code reasoning if VRAM allows |
| `llama3:8b` | ~4.7 GB | General prose — better than llama2:7b for compliance doc narrative |

```bash
docker exec local-ollama ollama pull qwen2.5-coder:14b
```

## API Reference

**Endpoint:** `http://localhost:11434/api/generate`

**Minimal request:**

```json
{
  "model": "qwen2.5-coder:7b",
  "prompt": "...",
  "stream": false,
  "options": {
    "temperature": 0.1,
    "num_predict": 2048
  }
}
```

Low temperature (0.1) is intentional — code repairs must be deterministic and precise.

## Health Check

```bash
curl http://localhost:11434/api/tags
# or inspect via Docker:
docker exec local-ollama ollama list
```

If `curl` returns nothing, check: `docker ps | grep local-ollama`

## Timeouts (RTX 4060 Ti, GPU-accelerated)

| File Size | Expected Response Time |
| --- | --- |
| < 100 lines | 2–5 s |
| 100–500 lines | 5–15 s |
| 500+ lines | 15–30 s |

GPU-accelerated via `--gpus all`. `qwen2.5-coder:7b` (4.7 GB) fits entirely in VRAM with 3+ GB headroom.

## OpenClaw Gateway

OpenClaw is the local AI agent gateway that routes tasks to Ollama (and other providers).

```text
WebChat UI:  http://127.0.0.1:18790
Config:      C:\Users\zach\.openclaw\openclaw.json
Workspace:   C:\Users\zach\.openclaw\workspace
Skills:      C:\Users\zach\.openclaw\workspace\skills\
Port:        18790  (gateway.port in openclaw.json)
Auth mode:   token (local only, loopback bind)
```

### Ollama Provider (in OpenClaw)

OpenClaw connects to Ollama using the **native `/api/chat` endpoint** — NOT `/v1`. This is handled automatically via the bundled Ollama plugin.

```json
"models": {
  "providers": {
    "ollama": {
      "baseUrl": "http://127.0.0.1:11434",
      "api": "ollama"
    }
  }
}
```

Model reference format in OpenClaw: `ollama/qwen2.5-coder:7b`

### Agents

| Agent ID | Model | Skills | Purpose |
|----------|-------|--------|---------|
| `main` | `openai-codex/gpt-5.4` | all defaults | General assistant |
| `quinn` | `ollama/qwen2.5-coder:7b` | `quinn-fedramp` | FedRAMP compliance documentation (local, no API cost) |

### Quinn in OpenClaw

Message the `quinn` agent in the WebChat to generate FedRAMP documents using Ollama locally:

```
/quinn-fedramp generate G-30
/quinn-fedramp audit
/quinn-fedramp status
```

Or headless via CLI:

```powershell
openclaw agent --agent quinn --message "/quinn-fedramp generate G-30"
```

The Quinn skill (`~/.openclaw/workspace/skills/quinn-fedramp/SKILL.md`) carries the full JobLine project context, Supabase schema details, and correct NIST control family mappings.
