# WeCr8 Machine — Docker Inventory

Snapshot taken: 2026-03-09. All containers confirmed running via `docker ps`.

---

## AI / LLM

| Container | Image | Port | Notes |
| --- | --- | --- | --- |
| `local-ollama` | `ollama/ollama:latest` | 11434 | Local LLM inference — **RTX 4060 Ti GPU (`--gpus all`)**, CUDA 13.1 |

**Installed models:**

| Model | Size | Use |
| --- | --- | --- |
| `qwen2.5-coder:7b` | 4.7 GB | Primary code model for `.skills` repair commands |
| `codellama:7b` | 3.8 GB | General code fallback |
| `llama2:7b` | 3.8 GB | General language tasks |

Pull additional models via: `docker exec local-ollama ollama pull <model>`

---

## Robotics Stack (toolinghero)

| Container | Image | Port | Notes |
| --- | --- | --- | --- |
| `robotics-embeddings` | `toolinghero/robotics-embeddings:latest` | — | Vector embeddings for robotics data |
| `robotics-retrieval` | `toolinghero/robotics-retrieval:latest` | 8100→8000 | RAG retrieval API (healthy) |
| `robotics-training` | `toolinghero/robotics-training:latest` | — | Model training workloads |
| `robotics-minio` | `minio/minio:latest` | 9100→9000, 9101→9001 | Object storage for training artifacts (healthy) |
| `ros-desktop` | `osrf/ros:humble-desktop-full` | — | ROS 2 Humble — full desktop environment |

---

## Supabase (cr8tive-tools project)

Local Supabase stack for the **cr8tive-tools** project. All containers share the `cr8tive-tools` namespace.

| Container | Image | Port | Notes |
| --- | --- | --- | --- |
| `supabase_db_cr8tive-tools` | `postgres:17.4.1.075` | 54332→5432 | Postgres database (healthy) |
| `supabase_studio_cr8tive-tools` | `supabase/studio` | 54333→3000 | Studio UI (healthy) |
| `supabase_kong_cr8tive-tools` | `supabase/kong:2.8.1` | 54331→8000 | API gateway (healthy) |
| `supabase_auth_cr8tive-tools` | `supabase/gotrue:v2.179.0` | 9999 | Auth service (healthy) |
| `supabase_rest_cr8tive-tools` | `supabase/postgrest:v13.0.4` | 3000 | REST API |
| `supabase_realtime_cr8tive-tools` | `supabase/realtime:v2.43.0` | 4000 | Realtime websockets (healthy) |
| `supabase_storage_cr8tive-tools` | `supabase/storage-api:v1.26.4` | 5000 | File storage (healthy) |
| `supabase_pg_meta_cr8tive-tools` | `supabase/postgres-meta:v0.91.5` | 8080 | DB metadata API (healthy) |
| `supabase_analytics_cr8tive-tools` | `supabase/logflare:1.18.4` | 54327→4000 | Analytics / logging (healthy) |
| `supabase_inbucket_cr8tive-tools` | `supabase/mailpit:v1.22.3` | 54334→8025 | Local email testing (healthy) |
| `supabase_vector_cr8tive-tools` | `supabase/vector:0.28.1-alpine` | — | ⚠️ Restarting — needs attention |

**Access points:**

- Studio: `http://localhost:54333`
- API: `http://localhost:54331`
- DB: `postgresql://localhost:54332`

---

## MCP Servers

| Container | Image | Port | Notes |
| --- | --- | --- | --- |
| `wecr8mcp` | `python:3.11-slim` | 8001 | Custom WeCr8 MCP server |
| `polishlymcp` | `polishlymcp-polishlymcp` | 8002 | Polishly MCP server (healthy) |

---

## Monitoring

| Container | Image | Port | Notes |
| --- | --- | --- | --- |
| `mcp_grafana` | `grafana/grafana:latest` | 3001→3000 | Grafana dashboards |
| `mcp_prometheus` | `prom/prometheus:latest` | 9090 | Prometheus metrics |

---

## Infrastructure / Data

| Container | Image | Port | Notes |
| --- | --- | --- | --- |
| `mcp_postgres` | `postgres:15-alpine` | 5433→5432 | Shared Postgres (MCP) |
| `mcp_redis` | `redis:7-alpine` | 6379 | Redis cache |

---

## Kubernetes (Docker Desktop)

Docker Desktop's Kubernetes node is active with standard system pods:
`coredns`, `etcd`, `kube-apiserver`, `kube-controller-manager`, `kube-scheduler`, `kube-proxy`, `storage-provisioner`, `vpnkit-controller`.

---

## Notes for Local Events / Workshops

### What's ready to demo offline

- **Local LLM inference** — `local-ollama` with 3 models; no internet required once models are pulled
- **Full Supabase stack** — auth, DB, storage, realtime all local; good for demos without cloud dependency
- **ROS 2 Humble** — full desktop environment for robotics demos
- **Robotics RAG pipeline** — embeddings + retrieval + MinIO already wired up
- **Grafana + Prometheus** — live monitoring dashboards

### Items that need attention before events

- `supabase_vector_cr8tive-tools` is in a restart loop — investigate before demoing analytics
- Ollama is GPU-accelerated (RTX 4060 Ti, `--gpus all`) — fast inference, ~2–15 s per response

### Quick health check command

```bash
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -v k8s
```
