# @wecr8mcp/server

WeCr8MCP — MCP (Model Context Protocol) server exposing the shift-handover-hub
Supabase backend to AI agents (Claude Code, VS Code Copilot, any MCP client).

## Setup

```sh
cd mcp
npm install
cp .env.example .env   # then fill in keys — see below
npm run build
```

### Keys (`mcp/.env`)

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | yes | Project URL |
| `SUPABASE_SERVICE_KEY` | **effectively yes** | All tables use RLS scoped to authenticated users, so the anon key returns 0 rows for every query. Without the service key the server runs but every tool returns empty results. Dashboard → Project Settings → API → `service_role`. |
| `SUPABASE_ANON_KEY` | fallback | Lets the server start; queries return empty under RLS. |

`mcp/.env` is gitignored. Never commit the service key or ship it to the frontend.

## Client wiring (already committed)

- **Claude Code**: [.mcp.json](../.mcp.json) — `node mcp/dist/index.js`
- **VS Code**: [.vscode/mcp.json](../.vscode/mcp.json) — same, via `${workspaceFolder}`

After changing `.env` or rebuilding, restart the MCP server in the client
(Claude Code: `/mcp` → reconnect; VS Code: restart the server from the MCP view).

## Tools (8)

| Tool | Kind | Backing tables |
|---|---|---|
| `wecr8mcp_observe` | read | `equipment`, `stations`, `queue_items`, `profiles` — entity state with freshness-based confidence |
| `wecr8mcp_enrich` | write | `queue_item_comments` — attach AI insight/prediction/anomaly to a work order |
| `hcl_get_machines` | read | `equipment` + station join |
| `hcl_get_work_orders` | read | `queue_items` |
| `hcl_get_shift_notes` | read | `handoff_records`, filter by station/shift |
| `hcl_get_handovers` | read | `handoff_records`, most recent N |
| `hcl_search_knowledge` | read | `handoff_records` + `activity_logs`, ilike search |
| `hcl_create_note` | write | `queue_item_comments` (work orders); other entity types acknowledged only |

Writes insert with `user_id = 00000000-0000-0000-0000-000000000000` and
`user_name = "WeCr8 MCP (AI)"` (the column has no FK, this is the AI identity).

## Dev

```sh
npm run dev       # tsx watch
npm run inspect   # MCP inspector UI
```

Table/column names are verified against `src/integrations/supabase/types.ts`
(see commit 6bf60514). If the schema changes, re-check that file first.
