# 02 — Shop Floor Execution Audit

The "Digital Expeditor" question: can JobLine.ai be the single screen a supervisor walks the floor with, and the single screen an operator works from?

---

## 2.1 Machine Visibility

**Today.**
- `stations` (11 cols, 11 policies) is the canonical station registry.
- `current_station_status` (14 cols, 8 policies) holds live state per station with realtime updates (mem://features/dashboard/live-station-status-sync).
- `equipment` (20 cols, 4 policies) holds physical machine assets.
- `station_machine_assignments` (6 cols, 5 policies) ties stations to machines.
- Live status sync via Supabase Realtime + exponential-backoff polling fallback (mem://technical/sync/real-time-polling).
- Machine monitoring relay via Zustand store + WebSocket bridge (mem://features/machine-monitoring/relay-infrastructure).
- **Optional** by design — core production works without it (mem://technical/architecture/optional-machine-monitoring).

**Score: Excels** for status; **Adequate** for spindle/feedrate telemetry.

**Friction.**
- Machine monitoring is a 1st-class feature but the relay is optional and requires installing the VS Code extension or relay app. Less plug-and-play than Plex/MachineMetrics direct OPC-UA poll.
- No MTConnect or OPC-UA standards adapter — we're proprietary over WebSocket.

**Missing.**
- MTConnect agent listener (industry standard for CNC).
- OPC-UA client for newer Siemens/Fanuc + Allen-Bradley PLCs.
- Auto-correlation of machine-detected downtime to a downtime_events record.

**Strategic.**
- Ship an MTConnect adapter as an edge-runnable container. This is the single integration that opens doors at every shop with a 2015+ CNC. Plex, MachineMetrics, and Sandvik CoroPlus all use it.

---

## 2.2 Operator Visibility

**Today.**
- Operator station Kanban (`src/components/dashboard/OperatorStationPanel.tsx`, mem://features/operator-station-dashboard).
- Station check-in flow (`StationCheckIn.tsx`).
- Operator inbox (`src/pages/OperatorInbox.tsx`) for handoffs/messages.
- Org-wide directory in Team Management (mem://features/team-management-system).

**Score: Excels.**

**Friction.**
- No "who is currently logged into which station" floor map.
- No mobile-first floor walk view for supervisors.

**Quick wins.**
- Read-only Floor Map page: visual grid of stations color-coded by status, tap to drill into station detail. Reuse `StationDetailView.tsx`.

---

## 2.3 Shift Handoffs

**Today.** The flagship capability.
- `handoff_records` (52 cols, 5 policies).
- `useHandoffRecords.ts` + `NewHandoffForm.tsx` + `HandoffCard.tsx` + `HandoffDetailModal.tsx`.
- mem://features/handoff-system/architecture · mem://technical/database/handoff-record-constraints.
- Photo/attachment support via org-scoped buckets (mem://technical/storage/org-scoped-attachments).
- Quantity accounting integrity trigger (mem://features/quality-control/quantity-integrity-enforcement).

**Score: Category-leading.**

**Friction.**
- Handoff submission is per-shift-end; no mid-shift quick-update.
- "Did the next shift acknowledge?" is implicit; no explicit acknowledge action.

**Quick wins.**
- "Acknowledge handoff" button on the next-shift operator's first station check-in for that station.
- Mid-shift "Status update" lightweight form distinct from end-of-shift handoff.

---

## 2.4 Status Tracking

**Today.** `current_station_status` + `job_performance_updates` (35 cols, 8 policies) keep a live + historical view.

**Score: Adequate→Excels.**

**Friction.**
- 35 cols on `job_performance_updates` is unwieldy; consumers (charts, reports) duplicate computation logic.

**Quick wins.**
- Materialized view or RPC: `current_wo_performance` returning a 10-col denormalized roll-up; refactor 2-3 charts to use it.

---

## 2.5 Real-time Production Updates

**Today.** Supabase Realtime channels on key tables; fallback polling via `useOrgRefreshInterval`.

**Score: Excels** on architecture, **Adequate** on UX.

**Friction.**
- No "what changed in the last 60 seconds on my floor?" feed for supervisors.
- Notifications go to the panel (`NotificationPanel.tsx`) but cannot be subscribed to per-station.

**Quick wins.**
- Activity feed widget on supervisor dashboard reading from `activity_logs` (11 cols, 4 policies) filtered to last 60 min.
- Per-station notification subscription preference in `notification_preferences`.

---

## 2.6 Bottleneck Identification

**Today.** Production Analytics (mem://features/dashboard/production-analytics) shows output, status, teams, work centers, trend.

**Score: Incomplete.**

**Missing.**
- Constraint detection (which station has the deepest queue / highest WIP age / lowest throughput).
- Queue-age heat map.
- "Stations starved for material" indicator.

**Quick wins.**
- New "Bottlenecks" tab on Production Analytics: rank stations by (queue length × avg wait time), surface top 3.

**Strategic.**
- Theory-of-Constraints-style "drum-buffer-rope" planning view. This is where AI Planning Assistant should evolve.

---

## 2.7 Escalation Workflows

**Today.** Issue reporter (`src/components/IssueReportDialog.tsx`, `useIssueReporter.ts`, `issues` table 27 cols, 5 policies). NCRs flow via `ncr_reports`. Smart alerts (`useSmartAlerts.ts`).

**Score: Adequate.**

**Friction.**
- Escalation is reactive (operator reports an issue) not proactive (system detects threshold breach and notifies).
- Smart alerts are summarized but not interruption-grade.

**Missing.**
- Threshold-based escalation rules ("if station idle > 30 min during scheduled shift, page supervisor").
- Multi-tier escalation chain (supervisor → manager → owner).

**Quick wins.**
- Add `escalation_rules` table; cron edge function (already have `process-notifications`) evaluates rules and triggers `notification_queue`.

---

## 2.8 Supervisor Notifications

**Today.** `notification_queue` (18 cols, 2 policies), `process-notifications` edge function, `useNotificationPrefs` per-user prefs, `DeviceNotificationDispatcher.tsx` for device push.

**Score: Excels.**

**Friction.**
- Bulk-notification noise is a real risk in shops with 50+ stations.
- No "snooze" or "ack-all by area" actions.

**Quick wins.**
- Snooze (1h / 4h / end-of-shift) per alert.
- Bulk ack by team or work center.

---

## 2.9 Mobile Usability

**Today.** Responsive design via Tailwind. `use-mobile.tsx` hook. Shop Floor Display has casting / Bluetooth flows (mem://features/shop-floor-display/management-and-connectivity). Mobile detection initialized via `window.innerWidth` to prevent flash (mem://technical/ui/mobile-detection-initialization).

**Score: Adequate.**

**Friction.**
- Operator station Kanban is touch-friendly but quantity-accounting forms require a real keyboard for most operators.
- No barcode scanning from phone camera for WO/op lookup.
- No native iOS/Android app — Electron shell exists for Windows desktop (mem://features/desktop/electron-shell) but mobile is web-only.

**Quick wins.**
- BarcodeDetector API (modern browsers) for WO/op QR scan to jump straight into a station.
- "Big-button" mode toggle on operator station for glove-friendly UI.

**Strategic.**
- React-Native or Capacitor wrap for iOS/Android offering: barcode scan, push notifications, offline check-in queue.

---

## 2.10 The "Digital Expeditor" Verdict

The pitch: one screen the supervisor walks the floor with, one screen the operator works from, both updated in real time, both able to take action.

**Can JobLine be this today?** **Yes for the operator screen, mostly for the supervisor screen.**

Gaps to close before the pitch is fully defensible:
1. Floor Map (2.2 quick win).
2. Bottleneck panel (2.6 quick win).
3. Threshold-based proactive escalation (2.7 quick win).
4. Barcode scan from phone (2.9 quick win).
5. Mid-shift status update (2.3 quick win).

All five are <2-sprint items. Once shipped, the "Digital Expeditor" narrative is bulletproof and the marketing page (`/features/digital-expeditor`, already at `src/pages/features/`) becomes a fair representation.

---

## Summary Scorecard

| Capability | Score | Top gap |
|---|---|---|
| Machine visibility | Excels | MTConnect/OPC-UA adapters |
| Operator visibility | Excels | Floor map view |
| Shift handoffs | **Category-leading** | Explicit acknowledge action |
| Status tracking | Adequate→Excels | Denormalized perf view |
| Real-time updates | Excels | Per-station subscriptions |
| Bottleneck ID | Incomplete | Constraint detection |
| Escalation | Adequate | Threshold-based rules |
| Supervisor notifications | Excels | Snooze + bulk ack |
| Mobile usability | Adequate | Native app + barcode |

**Overall Shop Floor Execution grade: A−.** This is JobLine's strongest category and should lead every demo.
