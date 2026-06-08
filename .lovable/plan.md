## Goal
Standardize Work Order action feedback. Today, WO files mix `useToast` (shadcn) and bare `sonner` calls, with inconsistent titles, missing success toasts on some actions, and no shared shape for "blocked" vs "failed". A single `woToast` helper fixes that and makes every completed action visible.

## What gets built

### 1. New helper — `src/lib/woToast.ts`
A thin wrapper over `sonner` (already the project default) with WO-aware presets:

- `woToast.success(action, woNumber?, opts?)` — "Work Order Completed · WO-123"
- `woToast.error(action, message, woNumber?)` — destructive variant
- `woToast.blocked(reason, hint?)` — for state-machine / QA / first-article blocks
- `woToast.info(message)` — neutral notices (clone, copy, etc.)
- `woToast.promise(promise, { loading, success, error })` — for async RPCs

Each preset:
- Auto-prefixes the WO number when provided
- Uses semantic durations (success 3s, error 6s, blocked 5s)
- Centralizes icons (CheckCircle / AlertTriangle / Ban / Info)
- Returns the toast id so callers can `.dismiss()` if needed

### 2. Adoption across WO files
Replace ad-hoc toast calls with `woToast.*`:

| File | Actions covered |
|---|---|
| `src/components/queue/QueueItemActions.tsx` | start work, complete/advance, clone, convert quote, blocked transitions |
| `src/components/queue/CreateWorkOrderDialog.tsx` | create WO / Quote, validation errors |
| `src/components/queue/CreateQueueItemDialog.tsx` | create item, validation |
| `src/components/queue/CancelHoldDialog.tsx` | cancel, hold, release |
| `src/components/queue/QueueItemDetailDialog.tsx` | save edits, attach files |
| `src/components/queue/QueueKanbanBoard.tsx` | drag-to-status reorder confirmation (currently silent) |
| `src/components/queue/QueueListView.tsx` | bulk actions, status change |
| `src/components/queue/QueueItemRoutingTab.tsx` | add/remove/reorder step |
| `src/components/admin/WorkOrderManagement.tsx` | admin save/delete/reassign |
| `src/components/admin/WorkOrderTable.tsx` | inline status edits |
| `src/components/admin/WorkOrderHistory.tsx` | restore from history |
| `src/components/routing/WorkOrderRoutingEditor.tsx` | template apply, step CRUD |

Where a success toast was missing entirely (Kanban drag, routing reorder, admin inline edits), one is added.

### 3. Tests
- `src/lib/woToast.test.ts` — verify each preset forwards correct title/description/duration to a mocked `sonner.toast`.
- Update existing tests that assert on shadcn `useToast` calls in `QueueItemActions` (none currently assert on toast content, so this should be a no-op for assertions).

## Out of scope
- Undo actions, keyboard shortcuts, clipboard copy buttons (separate follow-ups).
- Admin and routing editor refactors beyond swapping toast calls.
- Changing any RPC behavior or business logic.

## Acceptance
- Every WO action (success, error, blocked) routes through `woToast`.
- `npm test` and `npm run lint` stay clean.
- Visual smoke: complete a WO, cancel a WO, drag a card on Kanban — all produce a toast with the WO number in the title.
