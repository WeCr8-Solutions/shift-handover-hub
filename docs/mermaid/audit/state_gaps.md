# State Gaps Report — Undefined Transitions

Cases where **UI allows a state** that is **not validated** by backend, or **backend allows transitions the UI doesn't expose**.

## Work Order (`queue_items.status`)

### Valid States (from codebase)
`pending` | `queued` | `in_progress` | `on_hold` | `completed` | `cancelled`

### Transition Analysis

| From | To | UI Allows | Backend Validates | Gap? | Notes |
|------|-----|-----------|-------------------|------|-------|
| pending | queued | Yes (assign station) | Yes (station_id set) | No | — |
| pending | cancelled | Yes (supervisor) | ✅ **Trigger enforced** | **Closed** | `trg_validate_queue_item_status` |
| queued | in_progress | Yes (operator check-in) | Implicit (session check) | No | — |
| queued | cancelled | Yes (supervisor) | ✅ **Trigger enforced** | **Closed** | `trg_validate_queue_item_status` |
| in_progress | on_hold | Yes (pause button) | ✅ **Trigger enforced** | **Closed** | `trg_validate_queue_item_status` |
| in_progress | completed | Yes (via routing) | Yes (`pass_work_order_to_next_step`) | No | — |
| in_progress | queued | System only | Yes (`pass_work_order_to_next_step`) | No | — |
| on_hold | in_progress | Yes (resume) | ✅ **Trigger enforced** | **Closed** | `trg_validate_queue_item_status` |
| on_hold | cancelled | Yes (supervisor) | ✅ **Trigger enforced** | **Closed** | `trg_validate_queue_item_status` |
| completed | pending | System only (rework) | Yes (`apply_ncr_disposition`) | No | — |
| completed | in_progress | **No** | ✅ **Trigger blocks** | No | Correctly blocked |
| cancelled | any | **No** | ✅ **Trigger blocks** | No | Terminal state enforced |

### Summary
- All 5 previously identified gaps are now **closed** by `trg_validate_queue_item_status` trigger
- The `pass_work_order_to_next_step` and `apply_ncr_disposition` functions remain properly guarded
- Direct status UPDATEs are now validated by the state machine trigger

---

## NCR Report (`ncr_reports.authorization_status`)

### Valid States
`draft` | `pending` | `approved` | `rejected`

### Transition Analysis

| From | To | Validated | Gap? | Notes |
|------|-----|-----------|------|-------|
| draft | pending | ✅ **Trigger enforced** | **Closed** | `trg_validate_ncr_status` |
| pending | approved | Yes (`apply_ncr_disposition`) | No | — |
| pending | rejected | Yes (`reject_ncr`) | No | — |
| rejected | draft | ✅ **Trigger enforced** | **Closed** | `trg_validate_ncr_status` |
| rejected | pending | ✅ **Trigger enforced** | **Closed** | Re-submission allowed |
| approved | any | ✅ **Trigger blocks** | No | Terminal — disposition applied |

---

## Overall Summary

| Entity | Total Transitions | Validated | Gaps | Critical |
|--------|------------------|-----------|------|----------|
| Work Order | 11 | 11 | **0** | 0 |
| NCR | 6 | 6 | **0** | 0 |

**Status**: ✅ All 7 previously identified gaps are now closed via database triggers.
