# Delivery Acceptance & Kanban Check-In

Builds on the existing `delivery_requests` flow (pending → in_transit → delivered) so receiving stations explicitly **accept** work into their Kanban, and supervisors/owners never lose sight of items stuck in limbo.

## Behavior

1. **Auto-add to Kanban on routing advance** (current behavior, kept)
   - Work order already lands in the next station's Kanban column with an "Awaiting delivery" badge and `awaiting_delivery = true`.

2. **New "Awaiting acceptance" state**
   - When a delivery is marked **Delivered** by the carrier, status becomes `awaiting_acceptance` (instead of immediately clearing the flag).
   - The receiving operator sees the WO in their Kanban with a yellow **"Accept delivery"** badge/button.
   - Clicking **Accept** runs a new `accept_delivery` RPC that:
     - Sets delivery `status = 'accepted'`, captures `accepted_by` / `accepted_by_name` / `accepted_at`.
     - Clears `queue_items.awaiting_delivery`.
     - Writes a `queue_item_history` row ("Received and accepted at <station> by <user>").

3. **Auto check-in on station login**
   - When a user opens their operator station view, any deliveries to that station in `awaiting_acceptance` older than X minutes (configurable, default 0 — i.e. immediately) prompt a single "Confirm received" dialog listing all pending items. Accepting them in bulk runs the same RPC per item.
   - Prevents lost paperwork when no one was at the station during drop-off.

4. **Supervisor / Owner visibility**
   - `DeliveryHandoffPanel` extended with a new tab/filter: **Awaiting acceptance** alongside Pending / In transit.
   - New **Supervisor Delivery Watch** card on Supervisor & Admin dashboards listing every delivery in any non-final state, with age, from→to stations, carrier, and a "Force accept" action (org admin / supervisor only) for cases where the operator has left for the day.
   - Aging highlighting: warning at >30 min, destructive at >2 h since `delivered_at`.

5. **Kanban indicators**
   - Existing "Awaiting delivery" badge (Truck icon) stays for `pending`/`in_transit`.
   - New "Awaiting acceptance" badge (PackageCheck + amber) for `awaiting_acceptance` rows.

## Technical changes

### DB migration
- `ALTER TABLE delivery_requests` — extend allowed `status` values via CHECK or enum: add `awaiting_acceptance`, `accepted`.
- Add columns: `accepted_by uuid`, `accepted_by_name text`, `accepted_at timestamptz`.
- Update `mark_delivery_delivered` RPC to set `status = 'awaiting_acceptance'` and leave `queue_items.awaiting_delivery = true`.
- New RPC `accept_delivery(_delivery_id uuid)`:
  - Verifies caller is org member (or station member).
  - Sets `status = 'accepted'`, stamps acceptor.
  - Clears `queue_items.awaiting_delivery`.
  - Inserts `queue_item_history` audit row.
- New RPC `force_accept_delivery(_delivery_id uuid)` restricted to supervisor/org_admin via `has_org_role` check; same effect but records `accepted_by_role = 'override'`.
- `useDeliveryRequests` `ACTIVE_STATUSES` extended to include `awaiting_acceptance`.

### Frontend
- `useDeliveryRequests.ts` — add `markAccepted(id)` and `forceAccept(id)`; surface `accepted_*` fields.
- `DeliveryHandoffPanel.tsx` — render `awaiting_acceptance` rows with an **Accept delivery** primary button; carrier rows keep Delivered button.
- `QueueKanbanBoard.tsx` — second badge variant for `awaiting_acceptance`, with inline Accept button when current user is assigned to that station.
- New `StationCheckInDialog.tsx` — mounted in `OperatorDashboard` / station view; opens once per session when there are unaccepted deliveries for the active station.
- New `SupervisorDeliveryWatch.tsx` card — included in `SupervisorDashboard` and Admin dashboard; lists all active deliveries org-wide with age + override action.

### Files touched
- New migration (status/columns + RPCs).
- `src/hooks/useDeliveryRequests.ts`
- `src/components/dashboard/DeliveryHandoffPanel.tsx`
- `src/components/dashboard/OperatorDashboard.tsx` (mount check-in dialog)
- `src/components/dashboard/SupervisorDashboard.tsx` (add watch card)
- `src/components/queue/QueueKanbanBoard.tsx` (new badge + inline accept)
- New: `src/components/dashboard/StationCheckInDialog.tsx`
- New: `src/components/dashboard/SupervisorDeliveryWatch.tsx`

## Out of scope
- Email / push notifications for aged deliveries (can follow in a later pass).
- Changes to the routing engine itself.
