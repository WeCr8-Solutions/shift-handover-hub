

# Overflow Audit and Fix Plan

## Identified Issues

After reviewing all major modals, dialogs, and panels, here are the specific overflow problems:

### Critical Overflow Issues

1. **`QueueItemDetailDialog.tsx`** — The quick action buttons row (line 430) uses `flex gap-2` with no wrapping, causing horizontal overflow on mobile when many buttons render (Start, Pause, Complete, Edit Routing, Report NCR, Create Handoff). The tab content areas (`details`, `ncr`) use `overflow-auto` but are not constrained by a fixed height, so the flex-col layout can push content below the viewport. The comments tab's `ScrollArea` has no explicit height, relying on `flex-1` inside a flex parent that itself has unconstrained height.

2. **`NewHandoffForm.tsx`** — The form body (line 591) has `overflow-y-auto` which is correct, but the grid layouts inside (e.g., `grid-cols-3` on line 660 for part/revision/operation, `grid-cols-2` on line 692) do not collapse on small screens, causing horizontal overflow within the scrollable area. The step progress bar (line 534) uses `flex` with no wrapping—on very narrow screens the step labels stack incorrectly.

3. **`CreateQueueItemDialog.tsx`** — Uses `overflow-y-auto` on `DialogContent` (line 114), but the `grid-cols-4` work order fields row (line 239) doesn't collapse on mobile, causing horizontal overflow. The machine time `grid-cols-3` inside a `grid-cols-2` parent (lines 288-362) compounds the issue on small screens.

4. **`CreateWorkOrderDialog.tsx`** — No `overflow-y-auto` on the dialog content (line 160). The form content can exceed `max-h-[90vh]` on mobile since there's no scroll container. The `grid-cols-3` machine time row (line 300) doesn't collapse.

5. **`OperatorStationPanel.tsx`** — The active order action buttons (line 368) use `flex-wrap` which is good, but on small screens the "Complete Op & Advance" text combined with icon doesn't truncate. The queued orders list has no max-height, so many orders push the panel beyond viewport.

6. **`HandoffCard.tsx`** — The part info row (line 58) uses `flex gap-4` with no wrapping; long part numbers can overflow horizontally. The quality stats row (line 96) has the same issue.

7. **`WorkOrderRoutingEditor.tsx`** — Opens inside a Dialog but likely has no scroll containment for long routing step lists.

### Minor Issues

8. **`BulkUploadDialog.tsx`** — Uses `ScrollArea` properly.
9. **`IssueReportDialog.tsx`** — Standard form, unlikely to overflow.
10. **`CreateNCRDialog.tsx`** — Standard form, unlikely to overflow.

## Fixes to Implement

### 1. `QueueItemDetailDialog.tsx`
- Wrap quick action buttons in `flex-wrap` (line 430)
- Add `min-h-0` to the flex-1 tabs container (line 526) so overflow works in flex
- Give comments tab `ScrollArea` an explicit `h-[300px]`

### 2. `NewHandoffForm.tsx`
- Change `grid-cols-3` → responsive `grid-cols-1 sm:grid-cols-3` for part/revision/operation (line 660)
- Change `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` for operator fields (line 692) and condition fields (line 768)
- Step progress bar: already has short labels for mobile, but add `flex-wrap` as safety

### 3. `CreateQueueItemDialog.tsx`
- Change work order fields from `grid-cols-4` → `grid-cols-2 sm:grid-cols-4` (line 239)
- Fix the machine time `grid-cols-3` inside the scheduling section to be responsive

### 4. `CreateWorkOrderDialog.tsx`
- Add `overflow-y-auto` and `max-h-[80vh]` to the form container
- Change machine time `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` (line 300)

### 5. `OperatorStationPanel.tsx`
- Add `max-h-[300px] overflow-y-auto` to the queued orders list container
- Ensure button text truncates with `truncate` or shorter labels on small screens

### 6. `HandoffCard.tsx`
- Add `flex-wrap` to the part info row (line 58) and quality stats row (line 96)
- Add `min-w-0` and `truncate` on long text values

### 7. Global `DialogContent`
- The base `DialogContent` in `dialog.tsx` has no `overflow-hidden` — add it so children can properly manage their own overflow

## Files to Modify

| File | Fix |
|------|-----|
| `src/components/ui/dialog.tsx` | Add `overflow-hidden` to DialogContent |
| `src/components/queue/QueueItemDetailDialog.tsx` | flex-wrap on buttons, min-h-0 on tabs, explicit ScrollArea heights |
| `src/components/NewHandoffForm.tsx` | Responsive grid breakpoints for all multi-column layouts |
| `src/components/queue/CreateQueueItemDialog.tsx` | Responsive grids, scroll containment |
| `src/components/queue/CreateWorkOrderDialog.tsx` | Add overflow-y-auto, responsive grids |
| `src/components/dashboard/OperatorStationPanel.tsx` | Max-height on queue list, truncation |
| `src/components/HandoffCard.tsx` | flex-wrap and truncation on data rows |

