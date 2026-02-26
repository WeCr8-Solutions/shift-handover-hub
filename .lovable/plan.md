

# Fix Operation-Level Completion and Post-Handoff Navigation

## Problem

The current "Complete & Deliver" button in the operator panel implies completing the entire work order, when in reality the operator is only completing their operation/step. The work order can only be fully completed at its final routing station. Additionally, after a handoff or receipt, there's no way to jump directly into the work order to address its needs.

## Changes

### 1. `src/components/dashboard/OperatorStationPanel.tsx` -- Rename and clarify completion action

- Fetch routing steps when an active order is displayed to determine if this is the final station
- Rename button:
  - If next routing step exists: **"Complete Op & Advance"** with `ArrowRight` icon
  - If this is the final step: **"Complete Work Order"** with `CheckCircle2` icon
- Update the confirmation dialog description to reflect what's actually happening:
  - Mid-route: "Complete your operation at this station and advance the work order to [Next Station Name]"
  - Final step: "Complete this work order. This is the final operation."
- After successful completion, show a toast with a **"View Work Order"** action button that navigates to `/queue?item={orderId}`
- Add a new **"View Details"** button on the active order card so operators can open the work order detail anytime

### 2. `src/components/queue/QueueItemDetailDialog.tsx` -- Make "Complete" button routing-aware

- The existing `handleCompleteWork` sets status to "completed" directly on the queue item, bypassing routing logic
- When routing steps exist and uncompleted steps remain after the current station, change the button label to **"Complete Operation"** and run the same advance-routing logic used in `OperatorStationPanel.confirmDelivery`
- Only show **"Complete Work Order"** when this is the final routing step or no routing exists
- This prevents operators from accidentally marking the whole WO complete from the detail dialog

### 3. `src/components/HandoffCard.tsx` -- Add "View Work Order" action

- Accept an optional `onViewWorkOrder` callback prop
- Add a small button/link at the bottom of the card: "View Work Order" that triggers the callback with the handoff's `workOrder` identifier
- This lets users jump from a received handoff directly into the work order detail

### 4. `src/components/dashboard/OperatorStationPanel.tsx` -- Post-handoff navigation

- After the `onCreateHandoff` callback completes, if the active order exists, show a prompt or auto-navigate to the work order queue with the item pre-selected
- Add `onViewWorkOrder?: (orderId: string) => void` prop so parent components can handle navigation to the queue detail

### 5. `src/components/dashboard/StationDetailView.tsx` -- Wire up work order navigation

- Pass `onViewWorkOrder` through to `OperatorStationPanel` that navigates to `/queue?item={id}`

## Files

| File | Change |
|------|--------|
| `src/components/dashboard/OperatorStationPanel.tsx` | Routing-aware button labels, post-completion navigation, View Details button |
| `src/components/queue/QueueItemDetailDialog.tsx` | Make Complete button routing-aware, prevent premature WO completion |
| `src/components/HandoffCard.tsx` | Add optional "View Work Order" click action |
| `src/components/dashboard/StationDetailView.tsx` | Wire onViewWorkOrder navigation |

