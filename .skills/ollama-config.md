# Ollama Configuration

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

### Model Selection for Token Savings

- Start with `qwen2.5-coder:7b` for most tasks to maximize speed and minimize resource cost.
- Escalate to `qwen2.5-coder:14b` only when 7b produces incomplete or low-confidence fixes.
- De-escalate back to 7b after complex fixes to keep routine runs efficient.

Override with env var:

```bash
OLLAMA_MODEL=codellama:7b /repair-any src/components/StationCard.tsx
```

## Models to Consider Pulling

| Model | Size | Why |
| --- | --- | --- |
| `qwen2.5-coder:14b` | ~9 GB | Better for Phase 4 (complex type inference) |
| `deepseek-coder-v2:16b` | ~10 GB | Strongest code reasoning if RAM allows |

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
