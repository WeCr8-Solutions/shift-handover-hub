# State Gaps Report — Undefined Transitions

Cases where **UI allows a state** that is **not validated** by backend, or **backend allows transitions the UI doesn't expose**.

## Work Order (`queue_items.status`)

### Valid States (from codebase)
`pending` | `queued` | `in_progress` | `on_hold` | `completed` | `cancelled`

### Transition Analysis

| From | To | UI Allows | Backend Validates | Gap? | Notes |
|------|-----|-----------|-------------------|------|-------|
| pending | queued | Yes (assign station) | Yes (station_id set) | No | — |
| pending | cancelled | Yes (supervisor) | **No explicit guard** | **Yes** | Medium: No DB function validates this transition. Direct UPDATE allowed by RLS. |
| queued | in_progress | Yes (operator check-in) | Implicit (session check) | No | — |
| queued | cancelled | Yes (supervisor) | **No explicit guard** | **Yes** | Same as above |
| in_progress | on_hold | Yes (pause button) | **No explicit guard** | **Yes** | Direct UPDATE, no transition validation |
| in_progress | completed | Yes (via routing) | Yes (`pass_work_order_to_next_step`) | No | — |
| in_progress | queued | System only | Yes (`pass_work_order_to_next_step`) | No | — |
| on_hold | in_progress | Yes (resume) | **No explicit guard** | **Yes** | Direct UPDATE |
| on_hold | cancelled | Yes (supervisor) | **No explicit guard** | **Yes** | Direct UPDATE |
| completed | pending | System only (rework) | Yes (`apply_ncr_disposition`) | No | — |
| completed | in_progress | **No** | **No** | No | Correctly blocked |
| cancelled | any | **No** | **No guard** | **Low risk** | UI doesn't show reopen, but DB doesn't prevent it |

### Summary
- **5 transitions lack explicit backend validation** — they rely on RLS (who can update) but not state machine enforcement (what transitions are valid)
- The `pass_work_order_to_next_step` and `apply_ncr_disposition` functions are properly guarded
- Direct status UPDATEs bypass state machine logic

### Recommendation
Create a `validate_queue_item_status_transition()` trigger:
```sql
CREATE OR REPLACE FUNCTION validate_queue_item_status_transition()
RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'completed' AND NEW.status NOT IN ('pending') THEN
    RAISE EXCEPTION 'Cannot transition from completed to %', NEW.status;
  END IF;
  IF OLD.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot transition from cancelled state';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## NCR Report (`ncr_reports.authorization_status`)

### Valid States
`draft` | `pending` | `approved` | `rejected`

### Transition Analysis

| From | To | Validated | Gap? | Notes |
|------|-----|-----------|------|-------|
| draft | pending | Implicit (UI submit) | **Yes** | No DB enforcement |
| pending | approved | Yes (`apply_ncr_disposition`) | No | — |
| pending | rejected | Yes (`reject_ncr`) | No | — |
| rejected | draft | Implicit (UI) | **Yes** | No DB enforcement |
| approved | any | **No guard** | **Low** | Once approved, disposition is applied. Reversal could cause data inconsistency |

### Recommendation
Add similar transition validation trigger for NCR status changes.

---

## Overall Summary

| Entity | Total Transitions | Validated | Gaps | Critical |
|--------|------------------|-----------|------|----------|
| Work Order | 11 | 4 | 5 | 0 (medium risk) |
| NCR | 5 | 2 | 2 | 0 (low risk) |

**Priority**: Create state transition validation triggers for `queue_items` and `ncr_reports` to close the 7 identified gaps.
