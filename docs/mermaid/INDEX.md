# JobLine.ai — Mermaid Diagram Index

Updated: 2026-03-08

| Repo Path | Diagram File | Type | Covers | Owner |
|-----------|-------------|------|--------|-------|
| (system) | `system__context__v01.mmd` | flowchart LR | Personas, external systems, internal domains | Platform |
| (system) | `system__domain_taxonomy__v01.mmd` | mindmap | Domain glossary & concept taxonomy | Platform |
| src/App.tsx, src/pages/ | `fe__sitemap__v01.mmd` | flowchart TD | All 41 routes, auth gates, role gates, nav edges | Frontend |
| supabase/functions/ | `be__api_map__v01.mmd` | flowchart LR | Edge functions, callers, DB tables touched | Backend |
| src/hooks/, src/contexts/ | `be__service_arch__v01.mmd` | classDiagram | Hooks, contexts, providers, React Query cache, data flow | Frontend |
| Database schema | `data__erd__v01.mmd` | erDiagram | All 80 tables, FK relationships, org tenancy | Data |
| RLS policies | `data__rls_matrix__v01.mmd` | flowchart TD | Role → table → allowed operations | Security |
| Work order flow | `seq__workorder_create__v01.mmd` | sequenceDiagram | Create WO end-to-end | Behavior |
| Dashboard load | `seq__dashboard_load__v01.mmd` | sequenceDiagram | Dashboard data fetching (OrgContext + React Query + Realtime) | Behavior |
| Handoff flow | `seq__handoff_note__v01.mmd` | sequenceDiagram | Shift handoff create/read/ack | Behavior |
| Work order states | `state__workorder__v01.mmd` | stateDiagram-v2 | WO status transitions + who can trigger | Behavior |
| NCR states | `state__ncr__v01.mmd` | stateDiagram-v2 | NCR lifecycle + disposition | Behavior |
| UX journeys | `ux__journeys__v01.mmd` | journey | Operator/Supervisor/Admin satisfaction | UX |
| (audit) | `audit/fe_orphans.md` | Report | Routes with no inbound navigation | Audit |
| (audit) | `audit/fe_dead_ends.md` | Report | Routes missing safe exits | Audit |
| (audit) | `audit/api_orphans.md` | Report | Endpoints with no FE caller | Audit |
| (audit) | `audit/rls_blockers.md` | Report | UI writes blocked by missing RLS | Audit |
| (audit) | `audit/state_gaps.md` | Report | Undefined state transitions | Audit |

## Node ID Convention

All node IDs follow: `{LAYER}_{TYPE}__{name}`

- `FE_ROUTE__dashboard` — frontend route
- `FE_PAGE__Admin` — page component
- `FE_CTX__Org` — context/provider
- `API__fn__send_email` — edge function
- `DB__queue_items` — database table
- `DB_RPC__compute_smart_alerts` — database RPC function
- `ROLE__admin` — platform role
- `EXT__stripe` — external system
