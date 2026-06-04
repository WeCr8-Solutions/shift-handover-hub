## Dashboard graph audit — findings + fixes

Audited every chart on Supervisor / Index dashboard against its data source. Below is what each graph shows, the data path, and the bug (if any). Fixes are scoped to data shaping only — no schema changes.

### Surfaces audited

| Graph / KPI | File | Source data |
|---|---|---|
| KPI cards (Running / Setup / Waiting / Idle / Down / Total) | `DashboardKPICards.tsx` via `SupervisorDashboard.kpis` | `stations` + `current_station_status` |
| Output bar chart | `charts/OutputChart.tsx` | `stations` + `handoff_records` |
| Status pie | `charts/StatusPieChart.tsx` | `stations` |
| Teams stacked bar | `charts/StackedStatusChart.tsx` | `stations` grouped by team |
| Work Centers stacked bar | `charts/StackedStatusChart.tsx` | `stations` grouped by work_center |
| Trend area chart | `charts/TrendAreaChart.tsx` | `handoff_records` (hourly today, else 7-day) |
| Utilization bar (Supervisor header) | `SupervisorDashboard.utilization` | `stations` + `kpis` |
| Shift stats (Active / Handoffs / Parts / Issues) | `useShiftStats` | aggregate queries on `stations` + `handoff_records` |

### Bugs found

**B1 — Output chart double-counts parts.** `useStationOutputData` first adds `current_status.parts_complete` per station (live cumulative counter), then on the same map key adds `handoff_records.parts_completed_this_shift` for that station's handoffs. Both numbers describe the same physical parts, so totals are inflated and "Yield" denominator is wrong. → Use **handoffs only** as the production-sum source; reserve `parts_complete` as a fallback only when a station has no handoffs.

**B2 — Status-filtered Output chart shows ghost rows.** When `statusFilter !== 'all'`, `SupervisorDashboard` filters stations but still passes the full `dbRecords`. The Output hook then creates orphan `handoff-${machine_id}` entries with `status='idle'` for handoffs whose station was filtered out. → Pre-filter handoffs to the same station set passed into analytics.

**B3 — Status pie collapses to a single slice while a status filter is active.** Today the pie consumes `filteredStationsForAnalytics`, so picking "Running" leaves the pie showing only Running. The pie IS the status legend; it should always reflect the full active-station distribution. → Pass `dbStations` to the pie regardless of `statusFilter`. Output / Teams / Work Centers continue to honor the filter.

**B4 — Handoff ↔ station match is fragile string-equality.** `useStationOutputData` matches via `s.station_id === h.machine_id || s.name === h.machine_id`. `handoff_records.station_id` is a real FK now. → Prefer `s.id === h.station_id`, fall back to the existing two checks.

**B5 — Team-scoped handoff query is broken.** `useHandoffRecords` builds `.or(`team_id.eq.X,and(team_id.is.null,station_id.in.(select id from stations where team_id='X'))`)`. PostgREST does not support raw SQL subqueries inside `.or()` — this throws and silently falls back to the org-only query, so the "team" filter on handoffs has been a no-op. → Replace with a real two-step approach: first fetch the team's station IDs, then `.or('team_id.eq.X,station_id.in.(id1,id2,…)')` using a real id list (escaped) or just `team_id.eq.X` if no legacy rows exist.

**B6 — KPI vs. Status-pie active-station denominator mismatch.** KPI counter iterates ALL `dbStations` (no `is_active` filter), while Status pie / Teams / Work Centers only count `is_active=true`. A retired station with `current_job_state=null` quietly inflates the Idle KPI but is excluded from every chart. → Filter `is_active=true` in the KPI memo too, and surface the inactive count separately if non-zero.

**B7 — Yield chip is meaningless when parts inflate.** Same fix as B1 — recompute `totalParts`/`totalScrap` from the corrected handoff-only sum.

**B8 — Utilization "Idle %" can show negative-clamped zeros that hide Waiting stations.** `idle = total - running - setup - down - waiting`, fine, but the bar groups Waiting under Idle visually because the Utilization bar only renders Running / Setup / Idle / Down. → Add a Waiting segment to the utilization bar so the math matches the KPI cards.

**B9 — Trend mode-switch is silent.** When today has zero handoffs, the chart silently switches to a 7-day view with no label. → Add a small "Last 7 days" / "Today (hourly)" badge above the chart so users know which window they're seeing.

**B10 — `useShiftStats.partsProduced` diverges from Output chart.** Different aggregation (today only, all handoffs) than the Output chart (recent 100 handoffs). Today this is acceptable but should be documented. → Add a code comment + tooltip on the shift stat clarifying "Parts produced today (all shifts)".

### Out of scope

- No schema or RLS changes.
- No new endpoints; everything is computed client-side from current `stations` + `handoff_records` queries.
- Admin Executive Overview, Visitor Survey Analytics, Email Operations Center charts — not part of the production dashboard the user asked about.

### Implementation order

1. Fix `useStationOutputData` (B1, B2, B4) and re-derive `totalParts/totalScrap/yieldRate` (B7).
2. Decouple Status pie from `statusFilter` in `SupervisorDashboard.tsx` (B3).
3. Fix `useHandoffRecords` team scoping (B5).
4. Tighten KPI denominator (B6) and add Waiting segment to utilization bar (B8).
5. Add Trend window badge (B9) and Shift stats tooltip (B10).
6. Update / add ProductionAnalytics tests to cover B1–B4 and B6.

Approve and I'll apply the fixes in one pass.