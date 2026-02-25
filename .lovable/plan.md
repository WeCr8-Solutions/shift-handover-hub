

# Engineering Review: Machine Time Tracking (Small Change Mode)

---

## Section 1: Architecture

### Issue 1A: `remaining_minutes` formula not implemented anywhere

Your message specified this formula:

```text
qty_remaining = max(qty_total - qty_completed, 0)
remaining_minutes =
  (setup_minutes_if_not_done ? setup_minutes : 0)
  + (fai_minutes_if_not_done ? fai_minutes : 0)
  + (cycle_minutes * qty_remaining)
```

**Current state:** The DB trigger and all UI code only compute `total_minutes` (setup + FAI + cycle * qty_total). There is no concept of `qty_completed`, `setup_done`, or `fai_done` tracked anywhere. The `OperatorWorkflowPanel` (`getEstimatedRemaining`, line 121-129) computes remaining time purely by subtracting wall-clock elapsed from `estimated_duration` -- it has no awareness of parts completed or phase completion.

**Options:**

- **1A (Recommended): Add `parts_completed` tracking + phase-aware remaining time computation.** Add a `parts_completed` integer column to `queue_items` (or use the existing `parts_complete` on `current_station_status`). Track whether setup and FAI phases are done via a `current_phase` enum column (`setup`, `first_article`, `production`, `complete`). Compute remaining time dynamically in a shared utility function. Effort: medium. Impact: high -- this is the core value of the split.

- **1B: Keep wall-clock-based remaining.** Do nothing. The split fields become cosmetic labels only. Effort: zero. Impact: defeats the purpose of the feature.

- **1C: Client-side only.** Compute remaining time in the UI using `parts_complete` from `current_station_status` and assume setup/FAI are done once the phase transitions. No new DB columns. Effort: low-medium. Risk: data only exists in station status, not on the queue item itself. Less reliable.

**Recommendation:** 1A. The entire reason for splitting times is to get accurate remaining-time estimates. Without phase tracking, you've added UI complexity with no scheduling benefit. This aligns with your preference for handling more edge cases over speed.

**Do you agree with 1A, or prefer a different direction?**

---

## Section 2: Code Quality

### Issue 2A: 69 occurrences of `(item as any).setup_time_minutes` across 4 files

The `QueueItem` interface in `useQueue.ts` (lines 33-35) already declares `setup_time_minutes`, `first_article_minutes`, and `cycle_time_minutes`. Yet `QueueItemDetailDialog.tsx`, `CreateQueueItemDialog.tsx`, `RoutingTemplateManagement.tsx`, and `useBulkUpload.ts` all cast to `as any` to access these fields -- 69 times total.

This is a DRY/type-safety violation. The types are correct; the components just aren't using them.

**Options:**

- **2A (Recommended): Remove all `as any` casts.** The fields exist on the `QueueItem` type. The casts are unnecessary and actively hide type errors. For `CreateQueueItemDialog`, `CreateQueueItemInput` already has these fields (lines 80-82). The `formData` state just needs to be typed correctly. Effort: low (find-replace + minor type fixes). Risk: zero.

- **2B: Do nothing.** Leave the casts. Risk: type errors silently pass, future refactors will break without warning. Maintenance burden grows.

**Recommendation:** 2A. This is exactly the kind of thing you flagged as non-negotiable -- explicit over clever, DRY violations flagged aggressively. It's a 15-minute fix with zero risk.

**Do you agree with 2A, or prefer to defer?**

---

## Section 3: Tests

### Issue 3A: No tests for the time computation logic

The test file `useQueue.test.ts` has zero tests for the new time fields. There are no tests for:
- The total estimate formula (setup + FAI + cycle * qty)
- Edge cases: zero quantity, null fields, partial fields
- The "remaining time" logic in `OperatorWorkflowPanel`
- The DB trigger behavior (estimated_duration auto-computation)

The existing tests only cover type shapes, grouping, sorting, and overdue detection.

**Options:**

- **3A (Recommended): Add a `describe("Machine Time Calculations")` block** with unit tests for a pure `computeEstimatedDuration(setup, fai, cycle, qty)` utility function. Test edge cases: all nulls, zero qty, partial input, large values. Also test the total preview formula used in both create dialogs (currently duplicated inline). Effort: low (extract function + ~8 test cases). Impact: high -- catches regressions on the core formula.

- **3B: Add integration tests.** Test via Supabase trigger by inserting rows and checking `estimated_duration`. Effort: higher, requires test DB connection. Benefit: tests the actual trigger. Risk: slower, flakier.

- **3C: Do nothing.** Risk: formula bugs go undetected. Violates your "well-tested code is non-negotiable" preference.

**Recommendation:** 3A. Extract the formula into a shared utility, test it thoroughly. The inline IIFE in both create dialogs (lines 339-357 of `CreateWorkOrderDialog.tsx` and lines 350-357 of `CreateQueueItemDialog.tsx`) is duplicated logic that should be a single tested function.

**Do you agree with 3A, or want broader coverage?**

---

## Section 4: Performance

### Issue 4A: `reorderItems` fires N sequential database updates (N+1 pattern)

`useQueue.ts` lines 386-424: When reordering, the code loops through all items and fires individual `UPDATE` queries sequentially for every item whose position changed. For a queue with 50 items, dragging one item from position 1 to 50 fires 49 individual updates + 1 for the moved item + 1 `fetchItems` refetch = 51 round trips.

**Options:**

- **4A (Recommended): Use a single RPC call.** Create a Postgres function `reorder_queue_item(item_id, new_position)` that does all position updates in a single transaction. Effort: medium (new DB function + migration + update hook). Impact: 51 round trips become 1. Also eliminates race conditions from concurrent reorders.

- **4B: Batch with `Promise.all`.** Run updates in parallel instead of sequentially. Effort: low. Impact: faster but still N round trips, still race-prone, still no transaction boundary.

- **4C: Do nothing.** Acceptable if queues stay small (<20 items). Risk: degrades with scale, race conditions on concurrent reorders can corrupt positions.

**Recommendation:** 4A. The sequential N+1 pattern is a textbook performance and correctness problem. A single RPC call is the clean solution. This aligns with "engineered enough" -- not over-engineered (it's one function), not under-engineered (eliminates a real race condition).

**Do you agree with 4A, or is queue size small enough to defer?**

