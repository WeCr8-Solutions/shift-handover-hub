# G-Code VS Code Extension Integration — Design Spec

## Overview
JobLine.ai G-Code integration enables live G-code streaming from VS Code (or compatible editors) into the production tracking system. This allows operators and supervisors to see real-time machining programs associated with work orders and stations.

## Architecture

### Connection Protocol
```
┌──────────────────┐     WebSocket      ┌──────────────────┐
│  VS Code Extension│ ◄─────────────────► │ Edge Function    │
│  (G-Code Plugin)  │   wss://...        │ gcode-relay      │
└──────────────────┘                     └────────┬─────────┘
                                                  │
                                         ┌────────▼─────────┐
                                         │ Supabase Realtime │
                                         │ gcode_sessions    │
                                         └────────┬─────────┘
                                                  │
                                         ┌────────▼─────────┐
                                         │ Dashboard UI      │
                                         │ Station Detail     │
                                         └──────────────────┘
```

### Database Tables (Future)
- `gcode_sessions` — tracks active G-code editing sessions
  - `id`, `station_id`, `operator_id`, `file_name`, `file_hash`, `status` (active/paused/completed)
  - `program_number`, `tool_list`, `estimated_runtime_minutes`
  - `organization_id`, `created_at`, `updated_at`
  
- `gcode_events` — real-time event log from extension
  - `id`, `session_id`, `event_type` (line_executed, tool_change, pause, error, alarm)
  - `line_number`, `gcode_line`, `metadata`, `timestamp`

### VS Code Extension Features
1. **Authentication**: OAuth via Lovable Cloud auth token
2. **Station Binding**: Extension binds to a specific station via station_id
3. **Live Streaming**: Sends G-code lines as they're executed (via DNC or simulation)
4. **Program Upload**: Push entire G-code programs to station context
5. **Tool List Sync**: Extract tool list from G-code and sync to station profile
6. **Alarm Forwarding**: Forward CNC alarms to dashboard attention items

### Edge Function: `gcode-relay`
- Accepts WebSocket upgrade for live streaming
- Validates JWT and station access via `can_operator_act_on_station`
- Writes events to `gcode_events` table
- Updates `current_station_status` with active program info

### Dashboard Integration
- Station Detail View shows active G-code program name and line
- Real-time line counter shows current execution position
- Tool list sidebar from parsed G-code
- Alarm notifications bubble up to Attention Required panel

### Security
- All connections require valid JWT
- Station access verified via RLS (operator must be checked in or supervisor)
- G-code content is org-scoped, never crosses tenant boundaries
- Rate limiting on event ingestion (max 100 events/sec per session)

## Implementation Phases

### Phase 1: Schema & API (Current Sprint)
- Create `gcode_sessions` and `gcode_events` tables
- RLS policies scoped to organization
- REST endpoint for program upload

### Phase 2: Edge Function Relay
- WebSocket relay edge function
- Event ingestion and validation
- Station status sync on program start/complete

### Phase 3: VS Code Extension
- Extension scaffold with authentication
- G-code syntax highlighting + JobLine sidebar
- Station selector and program push commands

### Phase 4: Dashboard UI
- G-code viewer in Station Detail View
- Live execution indicator
- Tool list and runtime estimation display

## File Format Support
- Standard ISO 6983 G-code (.nc, .gcode, .ngc, .tap)
- Fanuc, Haas, Mazak, Okuma dialects
- Future: Conversational/EIA formats
