

## Issues & Bugs System — Diagnosis & Fix Plan

### Critical Bug Found

The `report_issue` database function sets `status = 'new'`, but the `issue_status` enum only contains: `open`, `investigating`, `in_progress`, `resolved`, `closed`, `wont_fix`. This causes **every user-submitted issue to silently fail** with a PostgreSQL type cast error. The existing test issue predates this bug.

### Secondary Issues

1. **Notification queue never populated** — The `queue_issue_for_devs` trigger inserts into `notification_queue` for admin/developer users, but since the issue INSERT itself fails (due to the `'new'` status bug), the trigger never fires.
2. **IssuesManagement UI missing `'new'` handling** — Even if we added `'new'` to the enum, the UI has no color/icon/filter for it.

### Fix Plan

#### 1. Fix `report_issue` Function (Database Migration)
Update the `report_issue` function to use `'open'` instead of `'new'` for the initial status. This is the simplest and most correct fix — `'open'` already exists in the enum and matches the UI's expectations. No enum change needed.

```sql
-- In the INSERT: change 'new' → 'open'
```

#### 2. Verify End-to-End Pipeline
After the migration, test the full flow:
- `report_issue` RPC inserts into `issues` with `status = 'open'`
- `trigger_queue_issue_for_devs` fires → inserts into `dev_issue_queue` with calculated priority
- Same trigger inserts into `notification_queue` for all admin/developer users
- `IssuesManagement` and `DevIssueQueue` admin panels show the new issue correctly

#### 3. Navigate to Admin Panel and Verify
Use browser tools to confirm the Issues tab and Dev Queue tab display data correctly after submitting a test issue.

### Files Changed
- **1 database migration**: Fix `report_issue` function (`'new'` → `'open'`)
- No frontend code changes needed — the UI already handles `'open'` status correctly

