
Goal: restore correct org-scoped dashboard/queue visibility and make routing handoff/pass-down reliable for operators and supervisors (with supervisor override), while keeping role enforcement server-side via existing role tables (`user_roles`, `organization_members`, `team_members`).

Implementation steps:

1) Add atomic backend routing-pass function (single source of truth)
- Create SQL function `public.pass_work_order_to_next_step(...)` (SECURITY DEFINER, `SET search_path = public`) to:
  - validate actor permission (operator at current station OR supervisor/org admin override),
  - complete current routing step,
  - move queue item to next station (`queued`) or finish work order (`completed`) if final step,
  - set next step status to `pending`,
  - update `current_station_status` for both current and next station in the same transaction,
  - write audit/history with override reason when used.

2) Harden RLS for operator pass-down + supervisor override
- Add helper SQL functions for policy checks (security definer):
  - `can_operator_act_on_station(_user_id, _station_id)` via active `operator_station_sessions`,
  - `can_supervisor_override_in_org(_user_id, _org_id)` via `organization_members` + platform role check.
- Update policies so:
  - operators can only update queue/routing rows for their active station scope,
  - supervisors/org admins can update within org scope,
  - no client-side role trust paths.

3) Fix handoff creation context binding (station/team/org alignment)
- Update `NewHandoffForm` to accept context props (`stationId`, `queueItemId`, prefilled WO/part/op, optional forced team).
- Auto-load station/team from selected station row; stop relying on `currentTeam` alone for `team_id`.
- Ensure handoff insert always uses station-consistent team/org data and keeps dashboard status sync update.

4) Wire prefill and station context everywhere handoff opens
- Pass real station context from:
  - `OperatorDashboard`,
  - `StationDetailView`,
  - `Index` (station cards and supervisor actions),
  - queue-detail “create handoff” path.
- Remove unused state paths (`handoffStationId`/`selectedStationForAction` gaps) so handoff always opens scoped to intended station.

5) Replace direct multi-step client updates with backend function calls
- In `OperatorStationPanel` and `QueueItemDetailDialog`, replace manual step-by-step `update/upsert` chain with one backend RPC call.
- Handle and surface permission-denied + validation errors cleanly.
- Add explicit supervisor override action + reason field (visible only for supervisor/org-admin/platform-admin access).

6) Correct queue category rendering consistency
- Ensure operator station panel shows distinct sections/counts for:
  - pending,
  - queued,
  - in_progress,
  - on_hold,
  - completed (recent at minimum).
- Align `QueueStatsCards` counts to avoid merging categories unexpectedly.
- Keep station-centric operator focus and org-wide supervisor visibility.

7) Enforce station-centric operator queue view in `/queue`
- For non-supervisor/admin users:
  - auto-apply station filter from active operator session(s),
  - prevent org-wide scope toggle,
  - only allow viewing stations they are checked into.
- Keep supervisor/admin org-wide view + optional station drill-down.

8) Realtime and validation polish
- Add org/station-scoped realtime filters where supported to reduce stale/noisy refresh behavior.
- Expand `rls-health` checks to include:
  - operator allowed pass-down at checked-in station,
  - operator denied cross-station pass-down,
  - supervisor override allowed in-org,
  - denied cross-org.

Technical details (security-critical):
- Roles remain only in role tables (`user_roles`, `organization_members`, `team_members`) — no role storage in profile/users rows.
- No localStorage/sessionStorage/admin hardcode authorization checks.
- All privileged routing/handoff transitions validated server-side (RLS + SQL functions).
- Keep all SECURITY DEFINER functions with `SET search_path = public`.
- Use migration-based schema/policy changes only; no direct edits to generated backend client/types files.

Validation checklist after implementation:
- Operator (checked into Station A) can pass WO from A → next station.
- Same operator cannot pass WO from Station B (not checked in).
- Supervisor can pass/override within org with audit reason.
- Dashboard KPI and active station cards update immediately after pass/handoff.
- Operator queue view stays station-scoped; supervisor remains org-scoped.
- Cross-org visibility blocked for stations, queue items, routing, and handoffs.
