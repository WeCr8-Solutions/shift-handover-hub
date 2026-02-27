
# Fix `workCenterIcons` Undefined Crashes Across All Components

## Problem
`workCenterIcons[s.work_center_type]` returns `undefined` when a station has a `work_center_type` not in the icon map (e.g. custom types, nulls, or DB values that don't match the TypeScript union). React crashes when rendering `<Icon />` with `undefined`.

This was fixed in `NewHandoffForm` with `|| Circle` fallback but **8 other files** still have the unprotected pattern.

## Files to Fix (add `|| Circle` fallback)

| File | Line | Current |
|------|------|---------|
| `JobPerformanceUpdateForm.tsx` | 282 | `workCenterIcons[s.work_center_type]` |
| `HandoffCard.tsx` | 16 | `workCenterIcons[record.workCenterType]` |
| `StationCard.tsx` | 420 | `workCenterIcons[workCenterType]` |
| `StationCheckIn.tsx` | 104 | `workCenterIcons[station.work_center_type as WorkCenterType]` |
| `TeamStationManager.tsx` | 268 | `workCenterIcons[type as WorkCenterType]` |
| `WorkCenterFilter.tsx` | 85, 115 | `workCenterIcons[type]` |
| `CreateQueueItemDialog.tsx` | 199 | `workCenterIcons[type as WorkCenterType]` |

Each fix: `const Icon = workCenterIcons[...] || Circle;` — import `Circle` from `lucide-react` where not already imported.

## Post-Fix: Verify Upload Flows
After the crashes are resolved, manually verify:
1. Performance Update form opens → Step 3 → image upload works
2. NCR dialog image upload works (via Queue → item detail → Report NCR)
3. Handoff form opens without crash (upload UI is deferred per plan)

## Storage Infrastructure Status (Already Verified)
- All 3 buckets exist: `performance-updates`, `ncr-attachments`, `handoff-attachments`
- RLS policies are org-scoped using `{org_id}/{user_id}/filename` pattern
- `ncr_reports.image_urls` and `handoff_records.image_urls` columns exist
- Hooks (`uploadNCRImage`, `uploadHandoffImage`, `uploadImage`) are wired
- NCR CreateDialog has full upload UI with previews
- Performance Update form has full upload UI with drag-drop
